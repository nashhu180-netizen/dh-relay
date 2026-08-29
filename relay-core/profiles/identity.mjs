import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

import { digest } from '../tools/canonical.mjs';

const SECRET_SHAPED = /(?:\b(?:api[_-]?key|apikey|token|cookie|secret|password|authorization|bearer)\b|\bsk-[A-Za-z0-9_-]{10,}|\beyJ[A-Za-z0-9_-]{10,})/i;

function fail(code) {
  throw new Error(code);
}

function asNonsecretFields(profile) {
  const fields = profile?.config_fingerprint_rule?.fields;
  if (!Array.isArray(fields) || fields.length === 0) fail('E_NONSECRET_PROJECTION_MISSING:config-fingerprint-rule');
  let prior = null;
  for (const field of fields) {
    if (!field || typeof field !== 'object' || Array.isArray(field)
      || typeof field.pointer !== 'string' || field.pointer.length === 0
      || field.classification !== 'nonsecret') fail('E_NONSECRET_PROJECTION_INVALID:field');
    if (prior !== null && prior >= field.pointer) fail('E_NONSECRET_PROJECTION_INVALID:fields-not-unique-sorted');
    prior = field.pointer;
  }
  return fields;
}

function assertSafeProjection(value) {
  if (typeof value === 'string' && SECRET_SHAPED.test(value)) fail('E_NONSECRET_PROJECTION_UNSAFE');
  if (Array.isArray(value)) value.forEach(assertSafeProjection);
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, nested]) => {
    if (SECRET_SHAPED.test(key)) fail('E_NONSECRET_PROJECTION_UNSAFE');
    assertSafeProjection(nested);
  });
}

function expandPathTemplate(template, environment) {
  let unresolved = false;
  const path = template.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, key) => {
    const value = environment[key];
    if (typeof value !== 'string' || value.length === 0) {
      unresolved = true;
      return '';
    }
    return value;
  });
  if (unresolved) fail('E_NONSECRET_PROJECTION_MISSING:config-path');
  return path;
}

function pointerParts(pointer) {
  if (!pointer.startsWith('/')) fail(`E_NONSECRET_PROJECTION_INVALID:${pointer}`);
  return pointer.slice(1).split('/').map(part => part.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function selectJsonPointer(document, pointer) {
  let current = document;
  for (const part of pointerParts(pointer)) {
    if (!current || typeof current !== 'object' || !Object.hasOwn(current, part)) {
      fail(`E_NONSECRET_PROJECTION_MISSING:${pointer}`);
    }
    current = current[part];
  }
  return current;
}

function parseTomlScalar(raw, pointer) {
  const value = raw.trim();
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  try { return JSON.parse(value); } catch {
    fail(`E_NONSECRET_PROJECTION_INVALID:${pointer}`);
  }
}

function readTomlProjection(text, fields) {
  const wanted = new Map(fields.map(({ pointer }) => {
    const parts = pointerParts(pointer);
    if (parts.length !== 1) fail(`E_NONSECRET_PROJECTION_UNSUPPORTED:${pointer}`);
    return [parts[0], pointer];
  }));
  const values = {};
  let section = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*\[/.test(line)) { section = true; continue; }
    if (section) continue;
    const match = line.match(/^\s*([A-Za-z0-9_-]+)\s*=\s*(.*?)\s*(?:#.*)?$/);
    if (!match || !wanted.has(match[1])) continue;
    const pointer = wanted.get(match[1]);
    if (Object.hasOwn(values, pointer)) fail(`E_NONSECRET_PROJECTION_INVALID:duplicate-${pointer}`);
    values[pointer] = parseTomlScalar(match[2], pointer);
  }
  for (const { pointer } of fields) {
    if (!Object.hasOwn(values, pointer)) fail(`E_NONSECRET_PROJECTION_MISSING:${pointer}`);
  }
  return values;
}

/**
 * Read a profile config solely to obtain its declared non-secret projection.
 * The raw configuration and non-whitelisted keys never leave this function.
 */
export async function readNonsecretProfileProjection(profile, { environment = process.env } = {}) {
  const fields = asNonsecretFields(profile);
  const path = expandPathTemplate(profile.config_fingerprint_rule.path_template, environment);
  let text;
  try { text = await readFile(path, 'utf8'); } catch { fail('E_NONSECRET_PROJECTION_MISSING:config-file'); }
  let values;
  if (extname(path).toLowerCase() === '.json') {
    let document;
    try { document = JSON.parse(text); } catch { fail('E_NONSECRET_PROJECTION_INVALID:config-json'); }
    values = Object.fromEntries(fields.map(({ pointer }) => [pointer, selectJsonPointer(document, pointer)]));
  } else if (extname(path).toLowerCase() === '.toml') {
    values = readTomlProjection(text, fields);
  } else {
    fail('E_NONSECRET_PROJECTION_UNSUPPORTED:config-format');
  }
  for (const { pointer } of fields) assertSafeProjection(values[pointer]);
  return values;
}

export function createExecutorIdentity(profile, projections) {
  const fields = asNonsecretFields(profile);
  if (!projections || typeof projections !== 'object' || Array.isArray(projections)) {
    fail('E_NONSECRET_PROJECTION_MISSING:projection-map');
  }
  const values = Object.create(null);
  for (const { pointer } of fields) {
    if (!Object.hasOwn(projections, pointer)) fail(`E_NONSECRET_PROJECTION_MISSING:${pointer}`);
    assertSafeProjection(projections[pointer]);
    values[pointer] = projections[pointer];
  }
  const config_fingerprint = digest({
    algorithm: 'config-fingerprint/v1', executor_profile_id: profile.executor_profile_id,
    path_template: profile.config_fingerprint_rule.path_template, fields: values,
  });
  const executor_capability_hash = digest({
    algorithm: 'executor-capability/v1', executor_profile_id: profile.executor_profile_id,
    capabilities: profile.capabilities,
    supported_platforms: [...new Set(profile.supported_platforms ?? [])].sort(),
    headless_supported: profile.headless_supported,
  });
  return {
    executor_profile_id: profile.executor_profile_id,
    account_alias: profile.account_alias,
    config_fingerprint,
    executor_capability_hash,
  };
}

export function migrateConfigFingerprintRule(rule) {
  if (!rule || !Array.isArray(rule.fields)) return rule;
  const fields = rule.fields.map((field) => typeof field === 'string'
    ? { pointer: field.startsWith('/') ? field : `/${field}`, classification: 'nonsecret' }
    : field);
  return { ...rule, fields: fields.sort((left, right) => (left.pointer < right.pointer ? -1 : left.pointer > right.pointer ? 1 : 0)) };
}

export function migrateProfileRegistry(registry) {
  if (!registry || !Array.isArray(registry.profiles)) fail('E_BAD_VALUE:profile-registry');
  return { ...registry, profiles: registry.profiles.map(profile => ({
    ...profile, config_fingerprint_rule: migrateConfigFingerprintRule(profile.config_fingerprint_rule),
  })) };
}
