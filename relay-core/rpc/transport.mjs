// transport.mjs — DHR_52 施工步骤 3：可移植本地 NDJSON 传输帮助器
//
// 范围（仅此）：本地端点选择（Windows named pipe / 非 Windows Unix-domain socket）、
//               NDJSON 一帧一对象、确定性分帧/组帧（任意切分 chunk 结果一致）、
//               坏帧（坏 JSON / 非对象 / 超长）映射 E_TRANSPORT_FRAME_INVALID。
// 不做（留 server.mjs）：JSON-RPC 2.0 信封校验、服务端/客户端 adapter、Store/取消语义。
//   · 客户端关闭只触发 onClose 传输清理信号，不写 Store、不发 cancel —— 业务语义由上层裁决。
//
// 依赖面：node 标准库 net/os/path/crypto/fs。零契约、零 Runtime。

import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { promises as fsp } from 'node:fs';

/** RPC reason code（reason-codes.md §六）：NDJSON 帧不可解析或不符信封时拒绝。 */
export const E_TRANSPORT_FRAME_INVALID = 'E_TRANSPORT_FRAME_INVALID';

/** DHR_30：确定性 endpoint 已被别的活 service 持有（design/07 §3 的 bind fencing 输家侧）。 */
export const E_ENDPOINT_IN_USE = 'E_ENDPOINT_IN_USE';

const LF = 0x0a; // '\n'
/** 默认单帧上限（1 MiB）：有界，防无界累积。调用方可按需收紧。 */
export const DEFAULT_MAX_FRAME_BYTES = 1 << 20;

/**
 * 本地端点：Windows → 唯一 named pipe；非 Windows → 唯一临时 UDS 路径。
 * randomUUID 保证同机并发唯一；UDS 落在系统临时目录（run root 之外由上层决定是否清理）。
 */
export function localEndpoint() {
  if (process.platform === 'win32') {
    return { kind: 'pipe', address: `\\\\.\\pipe\\dh-relay-${randomUUID()}` };
  }
  return {
    kind: 'unix',
    address: path.join(os.tmpdir(), `dh-relay-${process.pid}-${randomUUID()}.sock`),
  };
}

/**
 * NDJSON 帧分割器。
 * 组帧确定性：任意 chunk 切分（含逐字节、打断多字节 UTF-8 边界）经 Buffer 累积后，
 *             以同一逻辑分帧，结果与整块喂入一致。
 * 坏帧（坏 JSON / 非对象 / 超长）→ onFrameError({ code: E_TRANSPORT_FRAME_INVALID, reason })，
 *             不抛错、不中断后续帧（由上层决定是否 fail-closed 断开）。
 */
export function createFramer({ onFrame, onFrameError, maxFrameBytes = DEFAULT_MAX_FRAME_BYTES }) {
  let buf = Buffer.alloc(0);
  let discardingOversizeFrame = false;
  const error = (reason) => onFrameError?.({ code: E_TRANSPORT_FRAME_INVALID, reason });

  return {
    push(chunk) {
      let bytes = Buffer.from(chunk);
      // 已发现未终止的超长帧时，必须丢到它自己的换行；不能把后半段解释成新帧。
      if (discardingOversizeFrame) {
        const lf = bytes.indexOf(LF);
        if (lf === -1) return;
        discardingOversizeFrame = false;
        bytes = bytes.subarray(lf + 1);
      }
      buf = buf.length === 0 ? bytes : Buffer.concat([buf, bytes]);
      let idx;
      while ((idx = buf.indexOf(LF)) !== -1) {
        const lineBytes = buf.subarray(0, idx);
        buf = buf.subarray(idx + 1);
        let line;
        try {
          line = new TextDecoder('utf-8', { fatal: true }).decode(lineBytes);
        } catch {
          error('frame 含非法 UTF-8');
          continue;
        }
        // 容忍 CRLF：仅剥结尾 '\r'，不影响帧内内容。
        if (line.endsWith('\r')) line = line.slice(0, -1);

        if (lineBytes.length > maxFrameBytes) {
          error(`frame 超长（> ${maxFrameBytes} 字节）`);
          continue;
        }

        let obj;
        try {
          obj = JSON.parse(line);
        } catch (e) {
          error(`JSON 不可解析：${e.message}`);
          continue;
        }
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
          error('frame 不是 JSON 对象');
          continue;
        }
        onFrame(obj);
      }
      // 无换行仍超长：无界累积防护，丢弃累积并报错。
      if (buf.length > maxFrameBytes) {
        error(`不完整 frame 超过 ${maxFrameBytes} 字节`);
        buf = Buffer.alloc(0);
        discardingOversizeFrame = true;
      }
    },
    get bufferedBytes() {
      return buf.length;
    },
  };
}

/**
 * 把单个 net.Socket 包成 NDJSON 连接：send 组帧（JSON + '\n'）、data 分帧、close 清理信号。
 * handlers：{ onFrame, onFrameError, onClose, onSocketError }。
 * 回调签名：onFrame(frame, conn) / onFrameError(err, conn) / onClose(conn) /
 * onSocketError(err, conn)——第二参（close 为唯一参）是所属连接对象，调用方可据此做连接级
 * 回落；只用一个参的既有调用方行为不变。
 * 客户端关闭 → 仅触发 onClose（传输清理），不做任何 Store/取消动作。
 */
export function createTransportConnection(socket, handlers = {}) {
  let conn;
  const framer = createFramer({
    onFrame: (o) => handlers.onFrame?.(o, conn),
    onFrameError: (e) => handlers.onFrameError?.(e, conn),
  });
  socket.on('data', (chunk) => framer.push(chunk));
  socket.on('close', () => handlers.onClose?.(conn));
  socket.on('error', (err) => handlers.onSocketError?.(err, conn));

  conn = {
    socket,
    send(obj) {
      return socket.write(JSON.stringify(obj) + '\n');
    },
    close() {
      socket.end();
    },
    destroy() {
      socket.destroy();
    },
    get bufferedBytes() {
      return framer.bufferedBytes;
    },
  };
  return conn;
}

/**
 * 绑定本地端点，返回 Promise<句柄>。句柄.close() 关闭服务端并（仅对 UDS）移除该 socket 文件。
 * onConnection 收到已包好的 NDJSON 连接。
 * 连接级 handler seam：可选 `handlers.createConnectionHandlers(socket)` 按连接返回一份 handlers
 * （{ onFrame, onFrameError, onClose, onSocketError }），该连接的帧/错误/关闭都回落这连接
 * 本地 handlers，回调直接收到所属连接对象（见 createTransportConnection 签名）；未提供工厂
 * 时回退共享 handlers —— 既有调用方行为不变。每连接只挂工厂产物或共享 handlers 之一。
 * 关闭语义：先销毁本 server 自己接受的仍在线的服务端 socket（node 的 server.close()
 * 必须等所有连接关闭才会回调；客户端仍连着时若只 await server.close() 会永久挂起），
 * 再等待 server.close() 完成。清理仅限本 server 接受的连接，不触碰任何外部连接。
 */
function attachServer(endpoint, handlers) {
  /** 本 server 接受的、尚未关闭的服务端 socket。close() 时确定性清掉，避免挂起。 */
  const acceptedSockets = new Set();
  const server = net.createServer((socket) => {
    acceptedSockets.add(socket);
    socket.on('close', () => acceptedSockets.delete(socket));
    const connHandlers = typeof handlers.createConnectionHandlers === 'function'
      ? handlers.createConnectionHandlers(socket)
      : handlers;
    const conn = createTransportConnection(socket, connHandlers);
    handlers.onConnection?.(conn);
  });
  server.on('error', (err) => handlers.onError?.(err));
  return { server, acceptedSockets };
}

async function destroyAccepted(server, acceptedSockets) {
  for (const socket of [...acceptedSockets]) socket.destroy();
  await new Promise((res) => server.close(() => res()));
}

export function createTransportServer(endpoint, handlers = {}) {
  const { server, acceptedSockets } = attachServer(endpoint, handlers);
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(endpoint.address, () => {
      server.removeListener('error', reject);
      resolve({
        server,
        endpoint,
        close: async () => {
          await destroyAccepted(server, acceptedSockets);
          // ⚠️ 无条件 unlink 只对 `localEndpoint()` 那种一次性随机路径成立（测试 seam）。
          // 正式 service 的确定性 endpoint 必须走 bindOwnedEndpoint 的 owner-aware close，
          // 否则旧 service 的 close continuation 会删掉新 service 刚 bind 的 socket
          // （design/08 §2 明令不得沿用本分支的语义）。
          if (endpoint.kind === 'unix') {
            await fsp.unlink(endpoint.address).catch((e) => {
              if (e.code !== 'ENOENT') throw e;
            });
          }
        },
      });
    });
  });
}

/**
 * 探测确定性 endpoint 上是否还有活 listener。
 * 三值而非布尔：design/08 §2 只允许在**明确无 listener** 时回收残留——
 * 超时、EACCES 之类的「说不清」必须与「确定没人」分开，否则不确定就变成了删别人的授权。
 * @returns {Promise<'alive'|'absent'|'unknown'>}
 */
export function probeEndpoint(endpoint, { timeoutMs = 500 } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const socket = net.connect(endpoint.address);
    const finish = (verdict) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(verdict);
    };
    const timer = setTimeout(() => finish('unknown'), timeoutMs);
    socket.once('connect', () => finish('alive'));
    socket.once('error', (error) => finish(
      error?.code === 'ECONNREFUSED' || error?.code === 'ENOENT' ? 'absent' : 'unknown',
    ));
  });
}

/**
 * 是否允许把 EADDRINUSE 的残留端点回收掉再重试一次（design/08 §2 的唯一判据）。
 * 抽成纯函数是为了让这条决策在**每个平台**都能被逐档钉住——真 UDS 残留只在非 Windows
 * 可复现，但「什么时候允许删」不能只在一半平台上有回归。
 */
export function shouldReclaimEndpoint({ kind, probe, attempt }) {
  if (kind !== 'unix') return false;   // Windows 不删 pipe
  if (attempt !== 0) return false;     // 只 unlink 重试一次；第二次竞争失败须重新探测
  return probe === 'absent';           // 只有「明确无 listener」才回收，unknown 一律不动
}

/** close 时是否允许清理 UDS 残留：只有端点仍是自己 bind 的那一个才行。 */
export function shouldUnlinkOnClose({ kind, owner, current }) {
  if (kind !== 'unix') return false;
  if (!owner || !current) return false;
  return owner === current;
}

/** endpoint 的 owner 凭证：UDS 的 dev:ino。新 owner 重建 socket 后 ino 必变，故可判归属。 */
async function ownerToken(endpoint) {
  if (endpoint.kind !== 'unix') return null;
  try {
    const stats = await fsp.stat(endpoint.address);
    return `${stats.dev}:${stats.ino}`;
  } catch {
    return null;
  }
}

function listenOnce(server, address) {
  return new Promise((resolve, reject) => {
    const onError = (error) => { server.removeListener('listening', onListening); reject(error); };
    const onListening = () => { server.removeListener('error', onError); resolve(); };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(address);
  });
}

function inUse(endpoint, cause) {
  const error = new Error(`E_ENDPOINT_IN_USE:${endpoint.kind}:${cause?.code ?? 'unknown'}`);
  error.reason = E_ENDPOINT_IN_USE;
  error.cause = cause;
  return error;
}

/**
 * 正式 service 的 endpoint 绑定：**成功 bind 就是唯一服务的 fencing**（design/07 §3），
 * 不按 PID 判活、不盲删。
 *
 *   EADDRINUSE → 无凭据探测 → 活 owner 存在则直接拒绝（输家复用赢家，不上位）；
 *                            明确无 listener 才 unlink 一次并重试；
 *                            重试仍失败则再探测一次后拒绝，绝不进入删-试循环。
 *   close      → 只有端点仍是自己 bind 的那一个（owner token 相同）才清理残留；
 *                新 service 已接手时旧 close 只关自己的句柄。
 */
export async function bindOwnedEndpoint(endpoint, handlers = {}) {
  const { server, acceptedSockets } = attachServer(endpoint, handlers);
  for (let attempt = 0; ; attempt += 1) {
    try {
      await listenOnce(server, endpoint.address);
      break;
    } catch (error) {
      if (error?.code !== 'EADDRINUSE') {
        await new Promise((res) => server.close(() => res()));
        throw error;
      }
      const probe = await probeEndpoint(endpoint);
      if (!shouldReclaimEndpoint({ kind: endpoint.kind, probe, attempt })) {
        await new Promise((res) => server.close(() => res()));
        throw inUse(endpoint, error);
      }
      await fsp.unlink(endpoint.address).catch((e) => {
        if (e.code !== 'ENOENT') throw e;
      });
    }
  }
  const owner = await ownerToken(endpoint);
  return {
    server,
    endpoint,
    owner,
    close: async () => {
      await destroyAccepted(server, acceptedSockets);
      const current = await ownerToken(endpoint);
      if (!shouldUnlinkOnClose({ kind: endpoint.kind, owner, current })) return;
      await fsp.unlink(endpoint.address).catch((e) => {
        if (e.code !== 'ENOENT') throw e;
      });
    },
  };
}

/** 连接本地端点，返回 Promise<NDJSON 连接>（connect 事件后 resolve）。 */
export function createTransportClient(endpoint, handlers = {}) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(endpoint.address);
    socket.once('connect', () => resolve(createTransportConnection(socket, handlers)));
    socket.once('error', reject);
  });
}
