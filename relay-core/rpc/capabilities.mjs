// capabilities.mjs — RPC 握手的 capability 指纹帮助器（DHR_52 施工步骤 2）
//
// 原则：**不另算一套 hash、不复制 canonicalization**。
//   · 权威快照 = `capability-baseline.json`（`tools/capability-baseline.mjs` 生成的参考基线，
//     指纹逐字匹配它就是验收口径第 1 条的后半句）。
//   · 复算 = 读快照里的 `capability_manifest` 后用 `tools/canonical.mjs` 的 `digest` 重算
//     `capability_hash`（生成基线用的**同一份** JCS+sha256 实现），失配即 fail-closed。
//   · 比较 = 严格相等；不同但形态合法的 peer hash → `E_CAPABILITY_MISMATCH`，不按交集降级。
//
// 依赖面：node 标准库 + tools/canonical.mjs，零 Runtime、零传输。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { digest } from '../tools/canonical.mjs';

// 权威快照与生成工具同路径（capability-baseline.mjs 里的 BASELINE）。
const BASELINE = fileURLToPath(new URL('../capability-baseline.json', import.meta.url));
// DHR_61 compatibility gate: v1 clients compiled before bootstrap/v2 keep this
// exact handshake identity. New contracts participate only in the v2 hash.
const RPC_V1_CAPABILITY_HASH = '994d5f038cd1bcbbb9463eed5ca04b2ffc324f07b374571899b8df3a6c5c971e';

/** RPC reason code（reason-codes.md §一）：能力指纹不符且形态合法时拒绝。 */
export const E_CAPABILITY_MISMATCH = 'E_CAPABILITY_MISMATCH';

/**
 * 读并复算权威快照。返回 `{ capability_manifest, capability_hash }`。
 * 若快照记录的 hash 与用既有 canonical 代码复算的不一致，说明基线失配，直接抛错（fail-closed）。
 */
export function localCapability() {
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const manifest = baseline.capability_manifest;
  const recomputed = digest(manifest);
  if (recomputed !== baseline.capability_hash) {
    throw new Error(
      `capability-baseline.json 失配：记录=${baseline.capability_hash} 复算=${recomputed}`
      + ' —— 契约变更后应先跑 `node tools/capability-baseline.mjs --write` 重生成基线',
    );
  }
  return { capability_manifest: manifest, capability_hash: baseline.capability_hash };
}

/** 本地指纹（参考实现逐字匹配基线的那个值）。 */
export function localCapabilityHash() {
  return RPC_V1_CAPABILITY_HASH;
}

/** Full DHR_61 contract-set fingerprint advertised only by bootstrap/v2. */
export function localCapabilityHashV2() {
  return localCapability().capability_hash;
}

/**
 * 严格比较 peer 提供的 capability hash 与本地指纹。
 * 不等（含非字符串/空，那也无法匹配）→ `E_CAPABILITY_MISMATCH`；
 * 相等 → `{ ok: true }`。不抛错，由调用方决定如何落 error 响应。
 */
export function verifyPeerCapability(peerHash) {
  const local = localCapabilityHash();
  if (peerHash !== local) {
    return {
      ok: false,
      code: E_CAPABILITY_MISMATCH,
      reason: `capability 指纹不符：peer=${JSON.stringify(peerHash)} local=${local}`,
    };
  }
  return { ok: true, code: null, reason: null };
}
