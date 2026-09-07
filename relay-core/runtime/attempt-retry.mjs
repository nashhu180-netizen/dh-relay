import { randomUUID } from 'node:crypto';

import { freezeProfileIdentity, loadExecutorProfiles, resolveProfile } from './executors/herdr/profile-registry.mjs';

const sameIdentity = (left, right) => left?.executor_profile_id === right?.executor_profile_id
  && left?.account_alias === right?.account_alias
  && left?.config_fingerprint === right?.config_fingerprint
  && left?.executor_capability_hash === right?.executor_capability_hash;

/**
 * DHR_61: the RPC adapter calls this inside its sole Store writer.  It rechecks
 * the current non-secret projection before the Store's all-or-nothing mutation;
 * raw profile configuration never escapes the profile provider.
 */
export async function retryWithFrozenProfile({ store, params, registryPath, environment = process.env, now = () => new Date().toISOString() }) {
  const pause = await store.readFallbackPause(params.pause_id);
  if (!pause) throw new Error('E_FALLBACK_PAUSE_RESOLUTION_INVALID:pause-not-found');
  if (pause.run_id !== params.run_id || pause.node_id !== params.node_id) {
    throw new Error('E_FALLBACK_PAUSE_RESOLUTION_INVALID:pause-scope-mismatch');
  }
  const prior = await store.readFallbackPauseResolution(params.pause_id, params.retry_request_id);
  if (prior) {
    if (prior.resolution.executor_profile_id !== params.executor_profile_id) {
      throw new Error('E_FALLBACK_PAUSE_CONFLICT:retry-key-profile-mismatch');
    }
    return { ok: true, idempotent: true, ...prior };
  }
  const frozen = pause.manual_retry_profiles.find(item => item.executor_profile_id === params.executor_profile_id);
  if (!frozen) throw new Error('E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-not-frozen');
  const loaded = await loadExecutorProfiles({ registryPath, environment });
  if (!loaded.ok) throw new Error('E_FALLBACK_PAUSE_RESOLUTION_INVALID:registry-invalid');
  const profile = resolveProfile(loaded.registry, params.executor_profile_id);
  if (!profile) throw new Error('E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-not-current');
  const current = await freezeProfileIdentity(profile, { environment });
  if (!sameIdentity(frozen, current)) throw new Error('E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-snapshot-mismatch');
  const attempt_id = `retry-${randomUUID()}`;
  const receipt_id = `receipt-${randomUUID()}`;
  const resolved_at = now();
  const resolution = {
    protocol: 'relay.fallback-pause-resolution/v1', pause_id: pause.pause_id, attention_id: pause.attention.attention_id,
    executor_profile_id: params.executor_profile_id, retry_request_id: params.retry_request_id,
    resolved_at, attempt_id, receipt_id,
  };
  const attempt_receipt = {
    protocol: 'relay.attempt-receipt/v1', receipt_id, run_id: pause.run_id, node_id: pause.node_id, attempt_id,
    issued_at: resolved_at, executor_identity: current, fallback_profile_snapshots: [],
    result_submission_mode: 'receipt-bound/v1',
  };
  for (const profileId of profile.fallback_profile_ids ?? []) {
    const fallback = resolveProfile(loaded.registry, profileId);
    if (!fallback?.config_fingerprint_rule) throw new Error(`E_NONSECRET_PROJECTION_MISSING:fallback-${profileId}`);
    attempt_receipt.fallback_profile_snapshots.push(await freezeProfileIdentity(fallback, { environment }));
  }
  const result = await store.appendFallbackPauseResolution({ resolution, attempt_receipt });
  if (result?.ok === false) throw new Error(result.reason ?? 'E_FALLBACK_PAUSE_CONFLICT');
  return result;
}
