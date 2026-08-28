// client.mjs — CLI 的唯一 RPC 客户端（design/07 §5 + design/08 §2）。
//
// 三条纪律：
//   · 服务发现/拉起只走 runtime/launcher 的 ensureRuntimeService（descriptor 回证在里面），
//     CLI 绝不自己探端口、绝不自己 spawn 裸 service。
//   · 凭据只读 credentials.mjs 的 readLocalUserCapability——客户端无权创建凭据
//     （design/07 §3.4），缺失就是 E_LOCAL_USER_UNAUTHORIZED 稳定拒绝。
//   · 连接后首帧必发 contracts 回证；descriptor 与服务端自报身份逐字段比对后才放行业务方法。
//
// client_id 另存用户私有目录（`<repoHash>.client.json`，design/08 §2 的客户端身份）。
// 它**不是**凭据，可以由客户端创建；但它必须跨进程稳定——pending record 的幂等键是
// (client_id, request_id, method)，request_digest 又覆盖 handshake.client_id，
// 崩溃重试要想收敛到同一 Receipt，两届 CLI 必须自报同一个 client_id。因此首建走 `wx`
// 独占创建：并发的输家绝不覆盖赢家，而是重读盘上赢家并采用之（F-018）。

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import { localCapabilityHash } from '../rpc/capabilities.mjs';
import { createTransportClient, probeEndpoint } from '../rpc/transport.mjs';
import { readLocalUserCapability } from '../runtime/credentials.mjs';
import { endpointForRepo, repoHash } from '../runtime/endpoint.mjs';
import { ensureRuntimeService } from '../runtime/launcher.mjs';

const DEFAULT_CREDENTIAL_ROOT = () => join(homedir(), '.dh-relay', 'credentials');
/** EEXIST 后重读赢家的短退避：25ms × 20 次（≈500ms），足够赢家写完建档内容。 */
const IDENTITY_RACE_READ_MAX = 20;

export function clientError(reason, detail) {
  const error = new Error(detail ? `${reason}:${detail}` : reason);
  error.reason = reason;
  return error;
}

const resolveCredentialRoot = (credentialRoot) => credentialRoot ?? process.env.DH_RELAY_CREDENTIAL_ROOT ?? undefined;

/**
 * 只读取本机 capability；缺失 → E_LOCAL_USER_UNAUTHORIZED。
 * 「缺失」不是客户端能修的事：只有成功 bind 端点的 service 才允许创建它。
 */
export async function requireLocalUserCapability(repoRoot, { credentialRoot } = {}) {
  const root = resolveCredentialRoot(credentialRoot);
  const capability = await readLocalUserCapability(repoRoot, root ? { credentialRoot: root } : {});
  if (!capability) {
    throw clientError('E_LOCAL_USER_UNAUTHORIZED', '本机私有凭据缺失（只有已 bind 的 service 允许创建它）');
  }
  return capability;
}

/**
 * 客户端身份：读既有 `<repoHash>.client.json`，缺失才以 `wx` 独占创建（这不属于凭据）。
 * `wx` 抛 EEXIST = 并发另一位先到：重读盘上赢家并采用之，**绝不覆盖**——temp+rename 在
 * 这里不成立，它会静默覆盖先到者的身份，让先落 pending 的残条被换 client_id 重放
 * （复合幂等键改变 → 服务端把它当新请求二次执行，F-018 的 P0 根因）。
 */
async function readOrCreateClientId(repoRoot, { credentialRoot } = {}) {
  const root = resolveCredentialRoot(credentialRoot) ?? DEFAULT_CREDENTIAL_ROOT();
  const path = join(root, `${repoHash(repoRoot)}.client.json`);

  const readWinner = async () => {
    let parsed = null;
    try {
      parsed = JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
      if (error?.code !== 'ENOENT') throw clientError('E_STORE_CORRUPT', `client-identity-unreadable:${error?.code ?? 'unknown'}`);
    }
    if (parsed) {
      if (typeof parsed?.client_id === 'string' && parsed.client_id.length > 0) return parsed.client_id;
      throw clientError('E_STORE_CORRUPT', 'client-identity-shape');
    }
    return null;
  };

  const existing = await readWinner();
  if (existing) return existing;

  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const clientId = `cli-${randomUUID()}`;
  try {
    await writeFile(path, `${JSON.stringify({ version: 1, client_id: clientId })}\n`,
      { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
    // 并发另一位先到。它的 wx 建档与内容落盘之间有个亚毫秒窗：此刻重读可能拿到空/
    // 半截 JSON（RW2-3 双 CLI 回归实抓）。短退避重读等赢家写完——拿得到就用赢家，
    // 绝不覆盖；重试耗尽仍读不出合法身份才 fail-closed，宁停不覆盖。
    for (let attempt = 0; ; attempt += 1) {
      let winner = null;
      try {
        winner = await readWinner();
      } catch (readError) {
        if (attempt >= IDENTITY_RACE_READ_MAX - 1) throw readError;
      }
      if (winner) return winner;
      if (attempt >= IDENTITY_RACE_READ_MAX - 1) {
        throw clientError('E_STORE_CORRUPT', 'client-identity-race-winner-unreadable');
      }
      await new Promise(done => setTimeout(done, 25));
    }
  }
  return clientId;
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

/**
 * 组一帧 relay.rpc/v1 业务请求信封。这是 CLI 请求形状的唯一权威：发送（下方 request）
 * 与 pending record 的 request_digest（cli/main.mjs 经 runtime/ledger 的 requestDigest）
 * 都用同一份产物，保证「落账的摘要」与「服务端收到的摘要」逐字一致（design/08 §3）。
 */
export function buildRequestEnvelope({ method, params, requestId, clientId }) {
  return {
    jsonrpc: '2.0', method,
    handshake: {
      protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0',
      capability_hash: localCapabilityHash(), client_id: clientId,
      request_id: requestId,
    },
    params,
  };
}

/**
 * 连接本仓唯一 Runtime service：发现/拉起 → 只读凭据 → contracts 首请求回证。
 * 返回的连接上 `call()` 只会以确定结果收场（`{ok,…}`），传输层失败一律抛错——
 * 「拿到响应」与「没拿到响应」的界线就是 pending record 收不收回的界线。
 */
export async function connectCli({ repoRoot, credentialRoot, timeoutMs = 15_000 } = {}) {
  const root = resolveCredentialRoot(credentialRoot);
  const endpoint = endpointForRepo(repoRoot);
  // 快速失败（F-023 的 E2E 语义）：端点上有**活 service**、而本机私有凭据缺失，说明
  // 本机从未被任何一届 service 授权——这不是「service 没起来」（那种情况交给 launcher
  // 拉起，service 才有权建凭据），而是客户端无权接入，按稳定拒绝报出。
  const capabilityNow = await readLocalUserCapability(repoRoot, root ? { credentialRoot: root } : {})
    .then(value => value !== null)
    .catch(() => false);
  if (!capabilityNow && (await probeEndpoint(endpoint)) === 'alive') {
    throw clientError('E_LOCAL_USER_UNAUTHORIZED', '本机私有凭据缺失（只有已 bind 的 service 允许创建它）');
  }
  const launcherOptions = { repoRoot, endpoint, timeoutMs, ...(root ? { credentialRoot: root } : {}) };
  const { descriptor } = await ensureRuntimeService(launcherOptions);
  const capability = await requireLocalUserCapability(repoRoot, root ? { credentialRoot: root } : {});
  const clientId = await readOrCreateClientId(repoRoot, root ? { credentialRoot: root } : {});

  let resolveClosed = () => {};
  const closed = new Promise(done => { resolveClosed = done; });
  let notificationHandler = null;
  const waiters = new Map();
  let idCounter = 0;

  const client = await createTransportClient(endpoint, {
    onFrame: (frame) => {
      if (frame && typeof frame === 'object' && 'id' in frame) {
        const waiter = waiters.get(frame.id);
        if (waiter) {
          waiters.delete(frame.id);
          waiter(frame);
        }
        return;
      }
      notificationHandler?.(frame);
    },
    onClose: () => resolveClosed(),
    onSocketError: () => resolveClosed(),
  });

  const request = (method, params, requestId, overrideClientId) => new Promise((resolve, reject) => {
    const id = idCounter += 1;
    const timer = setTimeout(() => {
      waiters.delete(id);
      reject(clientError('E_REQUEST_TIMEOUT', `${method}:no-response`));
    }, 120_000);
    waiters.set(id, (frame) => {
      clearTimeout(timer);
      resolve(frame);
    });
    client.send({
      ...buildRequestEnvelope({
        method, params,
        requestId: requestId ?? `cli-${process.pid}-${id}-${randomUUID()}`,
        clientId: overrideClientId ?? clientId,
      }),
      id,
    });
  });

  // contracts 是连接唯一首请求：携带 descriptor 身份 + 本机 capability，
  // 响应必须与 descriptor 逐字段一致（design/08 §2）。
  const identityFrame = await request('contracts', {
    descriptor_version: descriptor.descriptor_version,
    repo_id: descriptor.repo_id,
    generation: descriptor.generation,
    local_user_capability: capability,
  });
  if (!identityFrame.result || !identityMatches(descriptor, identityFrame.result)) {
    client.destroy();
    throw clientError('E_SERVICE_IDENTITY_MISMATCH', 'contracts-回证与 descriptor 不符');
  }

  return {
    endpoint,
    descriptor,
    clientId,
    closed,

    /**
     * 业务方法。稳定拒绝 → `{ ok:false, error:{reason, receipt, detail} }`（不断连，
     * receipt 即 design/08 §1 的必填 `Receipt|null`）；传输层失败/超时 → 抛错。
     * `clientId` 供残条收敛重放：用 record 里存的原 client_id 发 handshake，
     * 复合幂等键才与原请求逐字一致（F-018）。
     */
    async call(method, params, { requestId, clientId: replayClientId } = {}) {
      const frame = await request(method, params, requestId, replayClientId);
      if (frame.error) {
        const data = frame.error.data;
        // RW-5 fail-closed：合同规定 error data **必带** receipt（Receipt|null）。
        // 字段整个缺失是协议违约，不得静默归一为 null——那会把违约误报成
        // 「结果未知，可安全重试」。抛错走传输层失败路径：pending 保留、按协议错误上报。
        // `receipt: null` 是合法值，不受影响。
        if (!data || typeof data !== 'object' || Array.isArray(data) || !('receipt' in data)) {
          const reason = data && typeof data.reason === 'string' ? data.reason : 'unknown';
          throw clientError('E_PROTOCOL_VIOLATION', `${reason}:协议违约：error data 缺 receipt`);
        }
        return {
          ok: false,
          error: {
            reason: typeof data.reason === 'string' ? data.reason : 'E_SERVICE_NOT_READY',
            receipt: data.receipt,
            detail: typeof data.detail === 'string' ? data.detail : null,
          },
        };
      }
      return { ok: true, result: frame.result };
    },

    /** events --follow 的通知路由：event / runStateChanged 两种通知帧。 */
    setNotificationHandler(handler) { notificationHandler = handler; },

    close() {
      client.destroy();
      resolveClosed();
    },
  };
}
