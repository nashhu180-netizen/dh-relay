// dsh-bridge — DSH Host 插件内嵌的 Runtime RPC 库接缝。
//
// Read Model 只经 RPC 取得，故这里绝不 import store/**。这也不是 CLI：Bridge 不写
// pending-operations 账；design/08 §2 的持久 request record 归宿主客户端所有，库接缝无权
// 替宿主决定持久化位置。宿主若需重试，必须自存 requestId 并复用它。adapter 自身只读
// 本机凭据、从不铸造；但本机尚无 service 时，首次成功 bind 的 service 依既定引导路径创建凭据。

import { randomUUID } from 'node:crypto';

import { localCapabilityHash } from '../../rpc/capabilities.mjs';
import { createTransportClient } from '../../rpc/transport.mjs';
import { readLocalUserCapability } from '../../runtime/credentials.mjs';
import { repoHash } from '../../runtime/endpoint.mjs';
import { ensureRuntimeService } from '../../runtime/launcher.mjs';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function bridgeError(reason, detail) {
  const error = new Error(detail ? `${reason}:${detail}` : reason);
  error.reason = reason;
  return error;
}

function identityMatches(descriptor, identity) {
  return identity
    && identity.descriptor_version === descriptor.descriptor_version
    && identity.repo_id === descriptor.repo_id
    && identity.generation === descriptor.generation
    && JSON.stringify(identity.endpoint) === JSON.stringify(descriptor.endpoint)
    && identity.runtime_version === descriptor.runtime_version
    && identity.capability_hash === descriptor.capability_hash
    && identity.state === 'ready';
}

async function openSession(repoRoot, { credentialRoot, onNotification = null } = {}) {
  const options = credentialRoot ? { repoRoot, credentialRoot } : { repoRoot };
  const { endpoint, descriptor } = await ensureRuntimeService(options);
  const capability = await readLocalUserCapability(repoRoot, credentialRoot ? { credentialRoot } : {});
  if (!capability) {
    throw bridgeError('E_LOCAL_USER_UNAUTHORIZED', 'service 已就绪但本机私有凭据仍缺失（adapter 只读，不铸造）');
  }

  let resolveClosed = () => {};
  const closed = new Promise(resolve => { resolveClosed = resolve; });
  const pending = new Map();
  let nextId = 0;
  let isClosed = false;
  const closePending = () => {
    if (isClosed) return;
    isClosed = true;
    resolveClosed();
    for (const { reject, timer } of pending.values()) {
      clearTimeout(timer);
      reject(bridgeError('E_CONNECTION_CLOSED'));
    }
    pending.clear();
  };
  let client;
  client = await createTransportClient(endpoint, {
    onFrame(frame) {
      if (frame && typeof frame === 'object' && Object.hasOwn(frame, 'id')) {
        const done = pending.get(frame.id);
        if (done) {
          pending.delete(frame.id);
          clearTimeout(done.timer);
          done.resolve(frame);
        }
        return;
      }
      onNotification?.(frame);
    },
    onClose: closePending,
    onSocketError: closePending,
  });

  const clientId = `dsh-bridge-${repoHash(repoRoot)}`;
  const request = (method, params, requestId = `dsh-${randomUUID()}`) => new Promise((resolve, reject) => {
    if (isClosed) {
      reject(bridgeError('E_CONNECTION_CLOSED'));
      return;
    }
    const id = nextId += 1;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(bridgeError('E_REQUEST_TIMEOUT', `${method}:no-response`));
    }, 120_000);
    pending.set(id, { resolve, reject, timer });
    client.send({
      jsonrpc: '2.0', id, method,
      handshake: {
        protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0',
        capability_hash: localCapabilityHash(), client_id: clientId, request_id: requestId,
      },
      params,
    });
  });

  // 每个 adapter 会话的唯一首请求；成功前绝不放行业务调用。
  const identity = await request('contracts', {
    descriptor_version: descriptor.descriptor_version,
    repo_id: descriptor.repo_id,
    generation: descriptor.generation,
    local_user_capability: capability,
  }, 'dsh-bridge-contracts');
  if (!identity.result || !identityMatches(descriptor, identity.result)) {
    client.destroy();
    throw bridgeError('E_SERVICE_IDENTITY_MISMATCH', 'contracts-回证与 descriptor 不符');
  }

  return {
    closed,
    request,
    close() {
      client.destroy();
      closePending();
    },
  };
}

function resultOrThrow(frame) {
  // 保留 JSON-RPC error 的原始形状（含 data.receipt: Receipt|null）；不要把确定失败误改成重试。
  if (frame.error) throw frame.error;
  return frame.result;
}

/**
 * 建立 DSH Host 可内嵌使用的 Bridge。它不是单独进程，也不引入 DSH 私有类型穿过契约边界。
 */
export async function connectDshBridge({ repoRoot, credentialRoot, reconnectDelayMs = 500, reconnectAttempts = 20 } = {}) {
  if (!repoRoot) throw bridgeError('E_BAD_VALUE', 'repo-root-required');
  const session = await openSession(repoRoot, { credentialRoot });
  const subscriptions = new Set();
  let closed = false;

  const call = async (method, params, requestId) => resultOrThrow(await session.request(method, params, requestId));

  return {
    async listRuns({ includeLegacy = false } = {}) {
      return call('listRuns', { include_legacy: includeLegacy });
    },
    async status(runId) {
      return call('inspectRun', { run_id: runId, view: 'status' });
    },
    async inspect(runId) {
      return call('inspectRun', { run_id: runId, view: 'detail' });
    },
    async control(runId, action, { requestId } = {}) {
      if (!['stop', 'resume'].includes(action)) throw bridgeError('E_BAD_VALUE', 'control-action-required');
      if (!requestId) throw bridgeError('E_BAD_VALUE', 'request-id-required');
      // 不捕获/重试业务 error：Receipt 和 E_LEGACY_READ_ONLY / E_ORPHAN_STORE_READ_ONLY 原样交给宿主。
      return call('control', { run_id: runId, action }, requestId);
    },
    async subscribe(runId, { afterSeq = null, onSnapshot, onEvent, onState, onGap, onClosed } = {}) {
      let active = true;
      let current = null;
      let reconnecting = false;
      let deliveredSeq = afterSeq;

      const stop = () => {
        if (!active) return;
        active = false;
        current?.close();
        subscriptions.delete(stop);
      };
      const closeSubscription = (reason) => {
        if (!active) return;
        active = false;
        current?.close();
        subscriptions.delete(stop);
        onClosed?.(reason);
      };

      const connectAndSubscribe = async () => {
        const requestedAfterSeq = deliveredSeq;
        const next = await openSession(repoRoot, { credentialRoot, onNotification: (frame) => {
          if (!active || next !== current || !frame || typeof frame !== 'object') return;
          if (frame.method === 'event') {
            const seq = frame.params?.seq;
            if (Number.isInteger(seq) && (deliveredSeq == null || seq > deliveredSeq)) {
              onEvent?.(frame.params);
              deliveredSeq = seq;
            }
          } else if (frame.method === 'runStateChanged') {
            // 状态真相只来自 subscribe 快照和本通知，绝不从 event 反推。
            onState?.(frame.params?.state);
          }
        }});
        current = next;
        const snapshot = await next.request('subscribe', { run_id: runId, after_seq: deliveredSeq });
        if (snapshot.error) {
          next.close();
          throw snapshot.error;
        }
        const model = snapshot.result;
        onSnapshot?.(model);
        onState?.(model.snapshot);
        // 首订阅的快照就是事件基线；重连的快照之后还有服务端按旧 cursor 补发的事件，
        // 此处抢先推进高水位会把那批补发误判为重复而丢掉。
        if (requestedAfterSeq == null) deliveredSeq = model.snapshot_seq;
        next.closed.then(() => {
          if (active && current === next) void reconnect();
        });
      };

      const reconnect = async () => {
        if (reconnecting || !active) return;
        reconnecting = true;
        try {
          for (let attempt = 0; active && attempt < reconnectAttempts; attempt += 1) {
            try {
              await connectAndSubscribe();
              return;
            } catch (error) {
              if (error?.data?.reason === 'E_CURSOR_GAP') {
                // 缺口不能拼接：丢弃 cursor，整体回到新的快照。gap 恢复是合同义务，不消耗
                // 重试预算（R-H-02）；且 cursor 清空后 after_seq=null 的下一次 subscribe 不可能
                // 再 gap，这里不会形成无预算死循环。
                onGap?.(error.data);
                deliveredSeq = null;
                attempt -= 1;
                continue;
              }
              if (attempt + 1 >= reconnectAttempts) {
                closeSubscription('retries-exhausted');
                return;
              }
              await sleep(reconnectDelayMs);
            }
          }
          // reconnectAttempts 为 0（循环体从未进入）等零预算走法也绝不静默死：
          // 只要订阅仍 active，就以同一终态通知宿主（R-H-01）。
          if (active) closeSubscription('retries-exhausted');
        } finally {
          reconnecting = false;
        }
      };

      subscriptions.add(stop);
      try {
        await connectAndSubscribe();
      } catch (error) {
        if (error?.data?.reason !== 'E_CURSOR_GAP') {
          closeSubscription(error);
          throw error;
        }
        onGap?.(error.data);
        deliveredSeq = null;
        await reconnect();
      }
      return { stop };
    },
    close() {
      if (closed) return;
      closed = true;
      for (const stop of [...subscriptions]) stop();
      session.close();
    },
  };
}
