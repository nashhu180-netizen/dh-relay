import { createHash } from 'node:crypto';

import { freezeProfileIdentity, resolveProfile } from '../herdr/profile-registry.mjs';

const sameIdentity = (left, right) => left?.executor_profile_id === right?.executor_profile_id
  && left?.account_alias === right?.account_alias
  && left?.config_fingerprint === right?.config_fingerprint
  && left?.executor_capability_hash === right?.executor_capability_hash;

const identifier = (protocol, ...parts) => createHash('sha256')
  .update(`${protocol}\n${parts.join('\n')}`, 'utf8').digest('hex');

export async function selectQualifiedFallback({ attemptReceipt, registry, environment = process.env, platform = process.platform } = {}) {
  if (!registry?.profiles) return { status: 'registry_unavailable' };
  for (const frozen of attemptReceipt?.fallback_profile_snapshots ?? []) {
    const profile = resolveProfile(registry, frozen.executor_profile_id);
    if (!profile || !(profile.supported_platforms ?? []).includes(platform) || !profile.config_fingerprint_rule) continue;
    try {
      const identity = await freezeProfileIdentity(profile, { environment });
      if (!sameIdentity(frozen, identity)) continue;
      const fallback_profile_snapshots = [];
      let signable = true;
      for (const profileId of profile.fallback_profile_ids ?? []) {
        const nested = resolveProfile(registry, profileId);
        if (!nested?.config_fingerprint_rule) { signable = false; break; }
        fallback_profile_snapshots.push(await freezeProfileIdentity(nested, { environment }));
      }
      if (signable) return { status: 'selected', profile, identity, fallback_profile_snapshots };
    } catch { /* one unusable candidate must not hide a later qualified snapshot */ }
  }
  return { status: 'fallback_unavailable' };
}

export function buildFallbackPause({ runId, nodeId, attemptReceipt, raisedAt }) {
  const reason_code = 'E_FALLBACK_UNAVAILABLE';
  const attempt_id = attemptReceipt.attempt_id;
  const receipt_id = attemptReceipt.receipt_id;
  return {
    protocol: 'relay.fallback-pause/v1',
    pause_id: identifier('fallback-pause/v1', runId, nodeId, attempt_id, receipt_id, reason_code),
    run_id: runId, node_id: nodeId, attempt_id, receipt_id, reason_code, raised_at: raisedAt,
    fence: {
      protocol: 'relay.attempt-fence/v1',
      fence_id: identifier('attempt-fence/v1', runId, nodeId, attempt_id, receipt_id, reason_code),
      attempt_id, receipt_id, reason_code, fenced_at: raisedAt,
    },
    attention: {
      protocol: 'relay.attention/v1',
      attention_id: identifier('attention/v1', runId, nodeId, attempt_id, receipt_id, reason_code),
      run_id: runId, node_id: nodeId, attempt_id, receipt_id, reason_code, state: 'open', raised_at: raisedAt,
    },
    manual_retry_profiles: [...(attemptReceipt.fallback_profile_snapshots ?? [])],
  };
}
