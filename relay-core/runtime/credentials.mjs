import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { repoHash } from './endpoint.mjs';

export function credentialPath(repoRoot, { credentialRoot = join(homedir(), '.dh-relay', 'credentials') } = {}) {
  return join(credentialRoot, `${repoHash(repoRoot)}.json`);
}

/**
 * **只读**取本机 capability，缺失时返回 null。
 * 客户端（launcher / CLI / Bridge）只能走这条路径：design/07 §3.4 明写「只有已经成功 bind
 * 确定性 endpoint 的 service 才能在私有 credential 缺失时原子创建它」——客户端顺手创建一个，
 * 等于给一个根本不存在的 service 发凭据。
 */
export async function readLocalUserCapability(repoRoot, options = {}) {
  const path = credentialPath(repoRoot, options);
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8'));
    return typeof parsed?.local_user_capability === 'string' && parsed.local_user_capability.length > 0
      ? parsed.local_user_capability
      : null;
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw new Error(`E_STORE_CORRUPT:runtime-credential:${error?.code ?? 'unreadable'}`);
  }
}

export async function readOrCreateLocalUserCapability(repoRoot, options = {}) {
  const path = credentialPath(repoRoot, options);
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8'));
    if (typeof parsed?.local_user_capability === 'string' && parsed.local_user_capability.length > 0) return parsed.local_user_capability;
    throw new Error('shape');
  } catch (error) {
    if (error?.code && error.code !== 'ENOENT') throw new Error(`E_STORE_CORRUPT:runtime-credential:${error.code}`);
    await mkdir(join(path, '..'), { recursive: true });
    const capability = randomUUID();
    const temporary = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify({ version: 1, local_user_capability: capability })}\n`, { encoding: 'utf8', mode: 0o600 });
    await rename(temporary, path);
    return capability;
  }
}

export async function readClientIdentity(repoRoot, options = {}) {
  const path = credentialPath(repoRoot, options);
  const capability = await readOrCreateLocalUserCapability(repoRoot, options);
  const parsed = JSON.parse(await readFile(path, 'utf8'));
  if (typeof parsed.client_id === 'string' && parsed.client_id.length > 0) return { clientId: parsed.client_id, capability };
  const next = { ...parsed, client_id: `cli-${randomUUID()}` };
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(next)}\n`, { encoding: 'utf8', mode: 0o600 });
  await rename(temporary, path);
  return { clientId: next.client_id, capability };
}
