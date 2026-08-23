// server.mjs — DHR_52 施工步骤 4/4.2：本地 RPC 服务端（最小握手路径 + 连接本地订阅 seam）
//
// 范围（仅此）：绑定本地端点（Windows named pipe / 非 Windows UDS，走 transport.mjs），
//               NDJSON JSON-RPC 2.0 request 的完整握手路径：
//                 1. 冻结信封校验（tools/validate.mjs 的 loadAjv/validateOne，短 id `relay.rpc/v1`）；
//                 2. capability_hash 严格比对（capabilities.mjs 的指纹，不等即拒绝，不按交集降级）；
//                 3. 只分派注入 seam `handlers[method]`，返回其 result；
//                 4. 注入 seam `handlers.subscribe(params, sink)` 注册**连接本地**订阅
//                    （内部注入契约，非正式客户端 Read Model）：
//                      · `sink.event(fullRelayEvent)` / `sink.runStateChanged(fullRelayRunState)`：
//                        先对冻结 `relay.rpc/v1` 校验完整通知帧，无效载荷 fail-closed 不发、
//                        返回 false；有效载荷逐字原样发送并返回 true；
//                      · subscribe 可返回 `{ result, unsubscribe }`：result 回客户端；
//                        `unsubscribe` 在该客户端连接关闭时被调用**恰好一次**；
//                 5. 客户端断开只清连接本地状态（含取消该连接的订阅），不写 Store、不发 cancel。
// 不做（留后续棒）：start/control 等业务方法、幂等 request_id 去重、per-method 参数 schema
//                   （O-2/O-3 开放点保持原状）。
//
// 错误语义：所有拒绝都落「既有 reason code」（reason-codes.md 是全集权威，本文件不发明码）。
//   · 传输坏帧（坏 JSON / 非对象 / 超长，framer 已报）→ E_TRANSPORT_FRAME_INVALID
//   · 信封不合冻结 schema → validateOne 产出的既有码（E_MISSING_FIELD / E_UNKNOWN_FIELD /
//     E_BAD_VALUE / E_UNSUPPORTED_VERSION / E_UNKNOWN_ENUM …）
//   · 形态合法但指纹不同 → E_CAPABILITY_MISMATCH（无降级通道）
//   · 方法不在 handlers（含未注入的 subscribe）→ E_UNKNOWN_METHOD
//   · handler 抛错/拒绝：协议层没有「内部错误」码（reason-codes.md 边界声明：内部前缀不上线），
//     不伪造 reason，fail-closed 断开该连接。
//
// 连接识别：transport.mjs 的 createTransportServer 支持连接级 handler seam
//   （createConnectionHandlers 按连接生成 handlers），帧/错误/关闭回调直接收到所属连接对象
//   （见 createTransportConnection 签名）。服务端按连接回包不再需要接管 socket 数据流、
//   不 removeAllListeners——本文件只用 seam，传输层预装的分帧监听保持原位。
//
// 依赖面：node 标准库 + 本仓 transport/capabilities/tools（零 Runtime、零 Store 依赖；
//   runId/store 为签名预留，握手路径与断连语义均不触碰它们）。

import { createTransportServer, E_TRANSPORT_FRAME_INVALID } from './transport.mjs';
import { localCapabilityHash, E_CAPABILITY_MISMATCH } from './capabilities.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';

/** RPC reason code（reason-codes.md §六）：方法不在 relay.rpc/v1 枚举或服务端未实现。 */
export const E_UNKNOWN_METHOD = 'E_UNKNOWN_METHOD';

/** JSON-RPC 2.0 保留数值码：语义以 error.data.reason 为准（schema 原文「排障看 reason，不看数字」）。 */
const C_PARSE_ERROR = -32700;
const C_INVALID_REQUEST = -32600;
const C_METHOD_NOT_FOUND = -32601;

/** 错误响应里的 id 必须符合 error_response 分支（string | integer | null）。 */
function frameId(frame) {
  const id = frame && typeof frame === 'object' && 'id' in frame ? frame.id : undefined;
  return typeof id === 'string' || (typeof id === 'number' && Number.isInteger(id)) ? id : null;
}

/**
 * 建本地 RPC 服务端。
 * @param {object} opts
 * @param {string} opts.runId         Run 标识（本握手路径不使用，为后续业务方法预留）。
 * @param {object} opts.store         Store 句柄（本握手路径不使用；断连语义保证不触碰）。
 * @param {string|object} [opts.capability] 本地能力指纹：字符串 hash，或 capabilities.mjs 的
 *                                   `{ capability_manifest, capability_hash }`；缺省读权威基线。
 * @param {object} opts.endpoint      transport.mjs 的 localEndpoint() 结果（pipe / unix）。
 * @param {object} opts.handlers      方法分派 seam：`{ [method]: (params) => result|Promise }`。
 *                                    不在其中的方法（含未注入的 subscribe）→ E_UNKNOWN_METHOD。
 *                                    特殊契约 `subscribe(params, sink)`（内部注入 seam，非正式
 *                                    客户端 Read Model，无轮询/Store/客户端类型逻辑）：
 *                                      · `sink.event(fullRelayEvent)` / `sink.runStateChanged(fullRelayRunState)`
 *                                        构造 `{jsonrpc:'2.0', method, params}` 并对冻结 `relay.rpc/v1`
 *                                        校验后发送；有效返回 `true` 且逐字原样发送，无效载荷
 *                                        （交叉协议 / 缺 protocol / 未知字段）fail-closed 不发、返回 `false`。
 *                                      · 返回值可含 `{ result, unsubscribe }`：`result` 回给客户端；
 *                                        `unsubscribe` 在**该客户端连接关闭时**被调用恰好一次，
 *                                        只清连接本地订阅状态，不写 Store、不发 cancel。
 * @returns {Promise<object>} transport 服务端句柄（`{ server, endpoint, close }`）。
 */
export function createRpcServer({ runId, store, capability, endpoint, handlers = {} }) {
  const { ajv, byId } = loadAjv();
  const localHash = typeof capability === 'string'
    ? capability
    : (capability && typeof capability === 'object' && 'capability_hash' in capability
        ? capability.capability_hash
        : localCapabilityHash());

  /** 连接本地状态：只记账不落盘。断连时仅从本集合移除，不写 Store、不发 cancel。 */
  const connections = new Set();
  /** 连接 → 该连接已注册订阅的 unsubscribe 列表（连接本地）。断连时逐个恰调用一次后清空。 */
  const connectionSubscriptions = new Map();

  /** 服务端只对 request 回包；notification 按 JSON-RPC 2.0「MUST NOT reply」不回，response/error
   *  帧是服务端产物、客户端误发时丢弃——本服务端不消费也无需回复。 */
  function isRequest(frame) {
    return typeof frame.method === 'string' && typeof frame.id !== 'undefined' && frame.handshake != null;
  }

  function sendError(conn, id, code, reason, detail) {
    const error = { code, message: 'RPC rejected', data: { reason } };
    if (typeof detail === 'string' && detail.length > 0) error.data.detail = detail.slice(0, 4096);
    conn.send({ jsonrpc: '2.0', id, error });
  }

  // 只从 data descriptor 构造 JSON snapshot；之后绝不再序列化生产者原对象。
  function jsonSnapshot(value, seen = new Set()) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (Number.isFinite(value)) return value;
      throw new Error('non-finite number');
    }
    if (typeof value !== 'object') throw new Error('non-JSON value');
    if (seen.has(value)) throw new Error('cyclic value');
    seen.add(value);
    if (Array.isArray(value)) {
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      const length = lengthDescriptor?.value;
      if (!Number.isSafeInteger(length) || length < 0) throw new Error('invalid array length');
      const snapshot = new Array(length);
      for (let i = 0; i < length; i++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
        if (!descriptor) throw new Error('sparse array');
        if (!Object.hasOwn(descriptor, 'value')) throw new Error('array accessor');
        snapshot[i] = jsonSnapshot(descriptor.value, seen);
      }
      for (const key of Reflect.ownKeys(value)) {
        if (key === 'length') continue;
        if (typeof key !== 'string' || !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= length) {
          throw new Error('array extra property');
        }
      }
      Object.setPrototypeOf(snapshot, null);
      seen.delete(value);
      return snapshot;
    } else {
      const proto = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) throw new Error('non-plain object');
      const snapshot = Object.create(null);
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== 'string') throw new Error('symbol key');
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw new Error('accessor property');
        Object.defineProperty(snapshot, key, {
          value: jsonSnapshot(descriptor.value, seen), enumerable: true, configurable: true, writable: true,
        });
      }
      seen.delete(value);
      return snapshot;
    }
  }

  function encodeValidatedFrame(frame) {
    const snapshot = jsonSnapshot(frame);
    if (!validateOne(ajv, byId, 'relay.rpc/v1', snapshot).ok) throw new Error('invalid frame');
    return snapshot;
  }

  // handler 产物跨越 JSON-RPC 边界前，先对原对象验证并确认能无损表达为 JSON。
  function sendResponse(conn, id, result) {
    try {
      const frame = encodeValidatedFrame({ jsonrpc: '2.0', id, result });
      conn.send(frame);
      return true;
    } catch {
      dropConnection(conn);
      return false;
    }
  }

  /** handler 抛错/拒绝：协议层无内部错误码，不伪造 reason，fail-closed 断开连接。 */
  function dropConnection(conn) {
    conn.destroy();
  }

  /** 注入的 unsubscribe 是生产者清理回调：异常只吞掉，不扩散到断连/关闭流程。 */
  function callUnsubscribe(unsub) {
    try { Promise.resolve(unsub()).catch(() => {}); } catch { /* 生产者清理回调异常不影响连接关闭 */ }
  }

  /**
   * 订阅 sink（连接本地）：每个方法先对冻结 `relay.rpc/v1` 校验完整通知帧，
   * 无效载荷（交叉协议 / 缺 protocol / 未知字段）fail-closed 不发、返回 false；
   * 有效载荷逐字原样发送并返回 true。不轮询、不碰 Store、无客户端类型逻辑。
   */
  function makeSink(conn) {
    return {
      event(params) {
        return emitNotification(conn, 'event', params);
      },
      runStateChanged(params) {
        return emitNotification(conn, 'runStateChanged', params);
      },
    };
  }

  function emitNotification(conn, method, params) {
    if (!connections.has(conn) || conn.socket.destroyed || conn.socket.writableEnded) return false;
    try {
      const frame = encodeValidatedFrame({ jsonrpc: '2.0', method, params });
      if (conn.send(frame) === false) {
        dropConnection(conn);
        return false;
      }
      return true;
    } catch { return false; }
  }

  function handleFrame(conn, frame) {
    // ① 冻结信封校验：不合 schema → 用校验器产出的既有 reason 回错误。
    const v = validateOne(ajv, byId, 'relay.rpc/v1', frame);
    if (!v.ok) {
      sendError(conn, frameId(frame), C_INVALID_REQUEST, v.reason, v.detail);
      return;
    }
    if (!isRequest(frame)) return; // 合法帧但不是 request：不回包（见 isRequest 注释）

    // ② capability 严格比对：schema 已兜住形态（^[0-9a-f]{64}$），这里只比值；不等即拒，不降级。
    if (frame.handshake.capability_hash !== localHash) {
      sendError(conn, frame.id, C_INVALID_REQUEST, E_CAPABILITY_MISMATCH,
        `capability 指纹不符：peer=${JSON.stringify(frame.handshake.capability_hash)} local=${localHash}`);
      return;
    }

    // ③ 只分派注入 seam；未实现的方法（含未注入的 subscribe）→ E_UNKNOWN_METHOD，不发明方法。
    try {
      const handler = handlers[frame.method];
      if (typeof handler !== 'function') {
        sendError(conn, frame.id, C_METHOD_NOT_FOUND, E_UNKNOWN_METHOD, `方法未实现：${frame.method}`);
        return;
      }
      // subscribe 是唯一带连接本地 sink 的 seam：订阅者经 sink 推完整冻结对象；
      // 返回 `{ result, unsubscribe }`——result 回客户端，unsubscribe 挂到本连接记账。
      if (frame.method === 'subscribe') {
        Promise.resolve(handler(frame.params, makeSink(conn))).then(
          (out) => {
            const result = out && typeof out === 'object' && 'result' in out ? out.result : out;
            const unsub = out && typeof out === 'object' && typeof out.unsubscribe === 'function'
              ? out.unsubscribe
              : null;
            if (unsub) {
              const subs = connectionSubscriptions.get(conn);
              if (subs) subs.push(unsub);
              else callUnsubscribe(unsub); // 连接已关闭（onClose 已删账）：立即清理一次，不挂账
            }
            sendResponse(conn, frame.id, result);
          },
          () => dropConnection(conn),
        ).catch(() => dropConnection(conn));
        return;
      }
      Promise.resolve(handler(frame.params)).then(
        (result) => sendResponse(conn, frame.id, result),
        () => dropConnection(conn),
      );
    } catch {
      dropConnection(conn);
    }
  }

  return createTransportServer(endpoint, {
    // 连接级 handler seam：transport 按连接调用工厂，帧/错误/关闭直接回落具体连接对象，
    // 服务端不接管 socket 数据流、不 removeAllListeners（传输层 framer 保持原位）。
    createConnectionHandlers() {
      return {
        onFrame: (frame, conn) => handleFrame(conn, frame),
        onFrameError: (e, conn) => sendError(conn, null, C_PARSE_ERROR, E_TRANSPORT_FRAME_INVALID, e.reason),
        onClose: (conn) => {
          // 客户端断开：只清连接本地记账——移除连接、对每个订阅的 unsubscribe 恰调用一次；
          // 不写 Store、不发 cancel（design/06 H4）。删账后迟到 resolve 的 subscribe 会立即
          // 自行清理（见 dispatch），与这里的调用互斥，保证 unsubscribe 总被调用恰好一次。
          connections.delete(conn);
          const subs = connectionSubscriptions.get(conn);
          if (subs) {
            connectionSubscriptions.delete(conn);
            for (const unsub of subs) callUnsubscribe(unsub);
          }
        },
      };
    },
    onConnection(conn) {
      connections.add(conn);
      // 账目条目随连接生命周期：建立即登记空表，断开即删除——subscribe 解析时以条目
      // 是否存在判定连接是否存活：在 → 挂账留待断连清理；不在 → 连接已关，立即清理一次。
      // 与 onClose 的删账互斥，保证 unsubscribe 总被调用恰好一次（修复：此前从未登记，
      // 存活连接的 subscribe 解析即走「已关」分支被立即误调）。
      connectionSubscriptions.set(conn, []);
    },
  });
}
