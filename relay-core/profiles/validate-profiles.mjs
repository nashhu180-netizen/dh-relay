#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadAjv } from '../tools/validate.mjs';
import { jcs } from '../tools/canonical.mjs';

const CREDENTIAL_KEY = /token|api[_-]?key|cookie|secret|password|authorization|bearer/i;
const CREDENTIAL_VALUE = [
  /sk-[A-Za-z0-9_-]{16,}/,
  /eyJ[A-Za-z0-9_-]{10,}/,
  /Bearer\s+\S+/,
  /[A-Fa-f0-9]{40,}/,
  /[A-Za-z0-9+/_-]{40,}={0,2}/,
];

function error(code, detail) {
  return { code, detail };
}

function findCredential(value, path = '') {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = findCredential(value[i], `${path}/${i}`);
      if (found) return found;
    }
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}/${key}`;
      if (CREDENTIAL_KEY.test(key)) return error('E_CREDENTIAL_FIELD', childPath);
      const found = findCredential(child, childPath);
      if (found) return found;
    }
  } else if (typeof value === 'string' && CREDENTIAL_VALUE.some(pattern => pattern.test(value))) {
    return error('E_CREDENTIAL_VALUE', path);
  }
  return null;
}

function expandPath(template, environment) {
  let unresolved = false;
  const expanded = template.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, key) => {
    if (typeof environment[key] !== 'string' || environment[key].length === 0) {
      unresolved = true;
      return '';
    }
    return environment[key].replaceAll('\\', '/');
  });
  return unresolved ? null : expanded;
}

function resolvesAlias(alias) {
  const where = spawnSync('where.exe', [alias], { encoding: 'utf8', windowsHide: true });
  if (where.status === 0) return true;
  // BLOCKED-1 裁决：where.exe 不识别 session Function/alias 时，只执行 Get-Command。
  const fallback = spawnSync('pwsh', [
    '-NoLogo', '-Command',
    'Get-Command -Name $env:DHR_PROFILE_ALIAS -CommandType Application,Function,Alias,ExternalScript -ErrorAction Stop | Out-Null',
  ], {
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, DHR_PROFILE_ALIAS: alias },
  });
  return fallback.status === 0;
}

function fallbackPauseBytes(profile, byId) {
  const identifier = 'R'.repeat(128);
  const hash = 'a'.repeat(64);
  const timestamp = '9999-12-31T23:59:59.999+23:59';
  const identities = (profile.fallback_profile_ids ?? []).map((profileId) => {
    const fallback = byId.get(profileId);
    return {
      executor_profile_id: fallback.executor_profile_id,
      account_alias: fallback.account_alias,
      config_fingerprint: hash,
      executor_capability_hash: hash,
    };
  });
  return Buffer.byteLength(jcs({
    protocol: 'relay.fallback-pause/v1', pause_id: hash, run_id: identifier, node_id: identifier,
    attempt_id: identifier, receipt_id: identifier, reason_code: 'E_FALLBACK_UNAVAILABLE', raised_at: timestamp,
    fence: {
      protocol: 'relay.attempt-fence/v1', fence_id: hash, attempt_id: identifier, receipt_id: identifier,
      reason_code: 'E_FALLBACK_UNAVAILABLE', fenced_at: timestamp,
    },
    attention: {
      protocol: 'relay.attention/v1', attention_id: hash, run_id: identifier, node_id: identifier,
      attempt_id: identifier, receipt_id: identifier, reason_code: 'E_FALLBACK_UNAVAILABLE',
      state: 'open', raised_at: timestamp,
    },
    manual_retry_profiles: identities,
  }), 'utf8');
}

export function validateProfiles(json, { resolveAlias = true, environment = process.env } = {}) {
  const credential = findCredential(json);
  if (credential?.code === 'E_CREDENTIAL_FIELD') return { ok: false, errors: [credential] };

  const { ajv } = loadAjv();
  const schema = JSON.parse(readFileSync(new URL('./executor-profile.schema.json', import.meta.url), 'utf8'));
  ajv.addSchema(schema);
  const validate = ajv.getSchema('relay/executor-profile.v1');
  if (!validate(json)) {
    return { ok: false, errors: (validate.errors ?? []).map(item => error('E_SCHEMA', `${item.instancePath || '/'} ${item.message}`)) };
  }

  const profilesById = new Map(json.profiles.map(profile => [profile.executor_profile_id, profile]));
  const ids = new Set(profilesById.keys());
  for (const profile of json.profiles) {
    for (const fallback of profile.fallback_profile_ids ?? []) {
      if (!ids.has(fallback)) return { ok: false, errors: [error('E_DANGLING_FALLBACK', fallback)] };
    }
    if (fallbackPauseBytes(profile, profilesById) > 4096) {
      return { ok: false, errors: [error('E_SCHEMA', `${profile.executor_profile_id}.fallback_pause_detail>4096`)] };
    }
  }

  if (credential) return { ok: false, errors: [credential] };

  for (const profile of json.profiles) {
    if (profile.headless_supported !== (profile.capabilities.headless === 'supported')) {
      return { ok: false, errors: [error('E_SCHEMA', `${profile.executor_profile_id}.headless_supported`)] };
    }
    if (profile.config_fingerprint_rule) {
      const path = expandPath(profile.config_fingerprint_rule.path_template, environment);
      if (!path || !existsSync(path)) return { ok: false, errors: [error('E_UNRESOLVED_CONFIG', profile.config_fingerprint_rule.path_template)] };
    }
    if (resolveAlias && !resolvesAlias(profile.command_alias)) {
      return { ok: false, errors: [error('E_UNRESOLVED_ALIAS', profile.command_alias)] };
    }
  }
  return { ok: true, errors: [] };
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: node profiles/validate-profiles.mjs <file>');
    process.exit(2);
  }
  try {
    const result = validateProfiles(JSON.parse(readFileSync(path, 'utf8')));
    if (result.ok) console.log('PASS');
    else console.log(`REJECT ${result.errors.map(item => item.code).join(',')}`);
    process.exit(result.ok ? 0 : 1);
  } catch (cause) {
    console.error(`ERROR ${cause.message}`);
    process.exit(2);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
