// launcher.mjs — `relay start` 侧的「连接或拉起本仓唯一 service」（design/07 §3）。
//
// 与 service 共用**同一个** endpoint 函数与 bounded ready 协议：
//   校验 .dh-relay/ 已被 Git 忽略 → 自行推导确定性 endpoint → 连得上就回证身份
//   → 连不上才拉起 service → 在有界时限内等 `state=ready` 的 descriptor 与身份回证。
//
// 三条纪律：
//   · **不信 descriptor 里的 endpoint**：地址由 cwd/repo root 自行推导，descriptor 只用来比对。
//     被篡改的项目 descriptor 因此无法把连接（以及随后的本机 capability）导向别的端点。
//   · **不按 PID 判活、更不按 PID 杀进程**：活不活只看确定性 endpoint 连不连得上。
//   · **fail-closed**：descriptor 损坏、身份或代次不符一律拒绝，绝不降级连接。

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { localCapabilityHash } from '../rpc/capabilities.mjs';
import { createTransportClient } from '../rpc/transport.mjs';
import { readLocalUserCapability } from './credentials.mjs';
import { endpointForRepo, readDescriptor, repoHash } from './endpoint.mjs';
import { assertStoreRootIgnored } from './gitignore.mjs';

const sleep = (ms) => new Promise(done => setTimeout(done, ms));

function launcherError(reason, detail) {
  const error = new Error(detail ? `${reason}:${detail}` : reason);
  error.reason = reason;
  return error;
}

/**
 * descriptor 是否**逐字**等于我们自行推导出的服务身份。
 * 比的是全部公开字段，不是「地址对上就行」——代次、能力指纹、版本任何一项不符都说明
 * 对面不是我们以为的那个 service。
 */
export function descriptorMatches(descriptor, { repoRoot, endpoint, capabilityHash = localCapabilityHash() }) {
  if (!descriptor || typeof descriptor !== 'object') return false;
  if (descriptor.descriptor_version !== 1) return false;
  if (descriptor.state !== 'ready') return false;
  if (descriptor.repo_id !== `sha256:${repoHash(repoRoot)}`) return false;
  if (descriptor.capability_hash !== capabilityHash) return false;
  if (typeof descriptor.generation !== 'string' || descriptor.generation.length === 0) return false;
  const declared = descriptor.endpoint;
  if (!declared || declared.kind !== endpoint.kind || declared.address !== endpoint.address) return false;
  return true;
}

/**
 * 向端点上真正在跑的 service 做一次 `contracts` 身份回证。
 *
 * **为什么光比对 descriptor 文件不够**：一份上一届留下的陈旧 descriptor，字段上与本届
 * 完全同形（同一 endpoint、同一 capability_hash、state=ready、generation 是个合法 UUID），
 * 静态比对根本分不出它是不是当前那一届。于是 service 崩掉重启的窗口里，launcher 会拿着
 * 旧 generation 认为「已经连上了」。只有让**服务端自己**回一句它的身份，才能证明当前性——
 * 而服务端会拿 generation 与本机 capability 逐字核对，代次不符即 E_SERVICE_IDENTITY_MISMATCH。
 *
 * @returns {Promise<{state:'ready',descriptor:object}|{state:'absent'|'not-ready'|'stale'}>}
 */
async function handshakeIdentity(endpoint, { descriptor, capability }) {
  // 先声明再建连接：onFrame 可能在 await 落地之前就被调用，晚声明会撞 TDZ。
  let resolveFrame = () => {};
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (frame) => resolveFrame(frame) });
  } catch {
    return { state: 'absent' };
  }
  try {
    const response = await new Promise((done, fail) => {
      const timer = setTimeout(() => fail(new Error('handshake-timeout')), 5_000);
      resolveFrame = (frame) => {
        if (!frame || frame.id !== 1) return;
        clearTimeout(timer);
        done(frame);
      };
      client.send({
        jsonrpc: '2.0', id: 1, method: 'contracts',
        handshake: {
          protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0',
          capability_hash: localCapabilityHash(), client_id: 'relay-launcher', request_id: 'launcher-contracts',
        },
        params: {
          descriptor_version: descriptor.descriptor_version, repo_id: descriptor.repo_id,
          generation: descriptor.generation, local_user_capability: capability,
        },
      });
    });
    if (response.result) return { state: 'ready', descriptor: response.result };
    const reason = response.error?.data?.reason;
    // 服务端还没发布 ready descriptor：继续等，不当成「没有 service」再拉一个。
    if (reason === 'E_SERVICE_NOT_READY') return { state: 'not-ready' };
    // 代次/凭据不符：盘上那份 descriptor 是陈旧的（或被篡改）。等它被新 service 覆盖。
    if (reason === 'E_SERVICE_IDENTITY_MISMATCH') return { state: 'stale' };
    throw launcherError(reason ?? 'E_SERVICE_NOT_READY', 'unexpected-contracts-rejection');
  } catch (error) {
    if (error?.reason) throw error;
    return { state: 'absent' };
  } finally {
    client?.destroy();
  }
}

/** 拉起一个脱离本进程的 service（stdio 丢弃、unref）。返回子进程 pid，仅用于诊断。 */
export function spawnRuntimeService({ repoRoot, nodeBin = process.execPath, env = process.env }) {
  const main = fileURLToPath(new URL('./service-main.mjs', import.meta.url));
  const child = spawn(nodeBin, [main, '--root', resolve(repoRoot)], {
    detached: true, stdio: 'ignore', windowsHide: true, env,
  });
  child.unref();
  return child.pid;
}

/**
 * 连接或拉起本仓唯一 Runtime service，返回 `{ endpoint, descriptor, launched }`。
 *
 * @param {object} options
 * @param {string} options.repoRoot     业务仓根。
 * @param {number} [options.timeoutMs]  bounded ready 的上限；超时抛 E_SERVICE_NOT_READY。
 * @param {boolean} [options.spawn]     false 时只连不拉（诊断用）。
 */
export async function ensureRuntimeService({
  repoRoot,
  endpoint = endpointForRepo(repoRoot),
  credentialRoot,
  timeoutMs = 15_000,
  pollMs = 50,
  spawn: maySpawn = true,
  nodeBin = process.execPath,
  env = process.env,
  gitBin = 'git',
  clock = () => Date.now(),
} = {}) {
  if (!repoRoot) throw launcherError('E_BAD_VALUE', 'repo-root-required');
  // 前置闸先于一切：`.dh-relay/` 没被 Git 语义忽略时连 service 都不许拉起来。
  await assertStoreRootIgnored({ repoRoot, gitBin });

  const verify = async () => {
    const descriptor = await readDescriptor(repoRoot); // 损坏时自身抛 E_STORE_CORRUPT
    if (!descriptor) return { state: 'absent' };
    if (!descriptorMatches(descriptor, { repoRoot, endpoint })) {
      // descriptor 与我们自行推导的身份不符。绝不降级连接、绝不把 capability 发过去，
      // 也绝不杀任何进程——被篡改的项目文件不该有这个权力。
      throw launcherError('E_SERVICE_IDENTITY_MISMATCH', 'descriptor-does-not-match-derived-endpoint');
    }
    const capability = await readLocalUserCapability(repoRoot, credentialRoot ? { credentialRoot } : {});
    // 没有私有 credential = 本机还没有哪一届 service 成功 bind 过。客户端不许代建。
    if (!capability) return { state: 'absent' };
    return handshakeIdentity(endpoint, { descriptor, capability });
  };

  const existing = await verify();
  if (existing.state === 'ready') return { endpoint, descriptor: existing.descriptor, launched: false, pid: null };
  if (!maySpawn) throw launcherError('E_SERVICE_NOT_READY', 'no-live-service');

  // 端点上已经有人、只是还没就绪或 descriptor 还没换新：等它，不再拉一个。
  const pid = existing.state === 'absent' ? spawnRuntimeService({ repoRoot, nodeBin, env }) : null;
  const deadline = clock() + timeoutMs;
  for (;;) {
    await sleep(pollMs);
    // 竞争的另一位 launcher 也可能刚好赢下 bind——谁拉起来的不重要，
    // 重要的是**只有一个** service 持有端点，两边回证到的是同一个 generation。
    const outcome = await verify().catch((error) => {
      // descriptor 正被新 service 以原子 rename 覆盖：再等一轮，别把瞬时状态当结论。
      if (error?.reason === 'E_STORE_CORRUPT') return { state: 'not-ready' };
      throw error;
    });
    if (outcome.state === 'ready') return { endpoint, descriptor: outcome.descriptor, launched: true, pid };
    if (clock() > deadline) throw launcherError('E_SERVICE_NOT_READY', `ready-timeout-${timeoutMs}ms:${outcome.state}`);
  }
}
