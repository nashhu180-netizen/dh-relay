// profile-registry.mjs — DHR_32 registry 的只读桥；绝不写用户配置。

import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { createExecutorIdentity, readNonsecretProfileProjection } from '../../../profiles/identity.mjs';
import { validateProfiles } from '../../../profiles/validate-profiles.mjs';

export const defaultRegistryPath = () => join(homedir(), '.dh-relay', 'executor-profiles.json');

export async function loadExecutorProfiles({ registryPath = defaultRegistryPath(), environment = process.env } = {}) {
  try {
    const registry = JSON.parse(await readFile(registryPath, 'utf8'));
    const checked = validateProfiles(registry, { resolveAlias: true, environment });
    if (!checked.ok) return { ok: false, reason: 'E_BAD_VALUE:PROFILE_REGISTRY', detail: checked.errors.map(item => item.code).join(',') };
    return { ok: true, registry };
  } catch (error) {
    if (error?.code === 'ENOENT') return { ok: true, registry: { profiles: [] } };
    return { ok: false, reason: 'E_BAD_VALUE:PROFILE_REGISTRY', detail: error?.message ?? String(error) };
  }
}

export function resolveProfile(registry, ref) {
  return registry?.profiles?.find(profile => profile.executor_profile_id === ref) ?? null;
}

/** Build the sole Receipt-safe identity form; raw configuration never leaves the provider. */
export async function freezeProfileIdentity(profile, { environment = process.env } = {}) {
  const projections = await readNonsecretProfileProjection(profile, { environment });
  return createExecutorIdentity(profile, projections);
}
