#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { loadAjv } from '../tools/validate.mjs';
import { jcs } from '../tools/canonical.mjs';

const CREDENTIAL_KEY = /token|api[_-]?key|cookie|secret|password|authorization|bearer/i;
export const PROFILE_ALIAS_TIMEOUT_MS = 15_000;
export const PROFILE_VALIDATION_TIMEOUT_MS = 60_000;
export const PROFILE_CLEANUP_GRACE_MS = 10_000;
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

function validateStructure(json) {
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
  return { ok: true, errors: [] };
}

function validateProfileConfig(profile, environment) {
  if (profile.headless_supported !== (profile.capabilities.headless === 'supported')) {
    return { ok: false, errors: [error('E_SCHEMA', `${profile.executor_profile_id}.headless_supported`)] };
  }
  if (profile.config_fingerprint_rule) {
    const path = expandPath(profile.config_fingerprint_rule.path_template, environment);
    if (!path || !existsSync(path)) return { ok: false, errors: [error('E_UNRESOLVED_CONFIG', profile.config_fingerprint_rule.path_template)] };
  }
  return { ok: true, errors: [] };
}

export function validateProfiles(json, { resolveAlias = true, environment = process.env } = {}) {
  const checked = validateStructure(json);
  if (!checked.ok) return checked;
  for (const profile of json.profiles) {
    const configured = validateProfileConfig(profile, environment);
    if (!configured.ok) return configured;
    if (resolveAlias && !resolvesAlias(profile.command_alias)) {
      return { ok: false, errors: [error('E_UNRESOLVED_ALIAS', profile.command_alias)] };
    }
  }
  return { ok: true, errors: [] };
}

// Runtime probes keep renewal timers runnable. CLI/static callers retain the synchronous API.
function probeAlias(command, args, { environment, timeoutMs, cleanupGraceMs, spawnCommand }) {
  return new Promise((resolve, reject) => {
    let child;
    let output = false;
    let failed = false;
    let timer;
    let cleanupTimer;
    let killerTimer;
    let killer;
    let cleanup = Promise.resolve();
    let cleanupOk = true;
    let settled = false;
    const finish = async (status, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      await cleanup;
      clearTimeout(cleanupTimer);
      clearTimeout(killerTimer);
      if (killer && killer.exitCode === null) killer.kill();
      if (!cleanupOk) {
        reject(new Error('E_UNRESOLVED_ALIAS:probe-cleanup-incomplete'));
        return;
      }
      resolve({ ok: !failed && status === 0 && !signal && output,
        // Only an ordinary lookup miss may use the PowerShell fallback.
        missing: !failed && status === 1 && !signal });
    };
    const terminate = () => {
      if (failed) return;
      failed = true;
      cleanupTimer = setTimeout(() => {
        child.kill();
        // A missing close is a cleanup failure, never a completed probe.
        cleanupOk = false;
        reject(new Error('E_UNRESOLVED_ALIAS:probe-close-timeout'));
      }, cleanupGraceMs);
      if (process.platform === 'win32' && child.pid) {
        cleanup = new Promise(done => {
          killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
            windowsHide: true, stdio: 'ignore',
          });
          killer.once('error', () => { cleanupOk = false; child.kill(); done(); });
          killer.once('close', status => { if (status !== 0) { cleanupOk = false; child.kill(); } done(); });
          killerTimer = setTimeout(() => { cleanupOk = false; killer.kill(); child.kill(); done(); }, Math.max(1, cleanupGraceMs / 2));
        });
      } else child.kill('SIGKILL');
    };
    try {
      child = spawnCommand(command, args, {
        env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch {
      finish(null, null);
      return;
    }
    child.stdout?.on('data', chunk => { output ||= /\S/.test(String(chunk)); });
    child.stderr?.resume(); // Never retain command output or configuration in diagnostics.
    child.stdout?.once('error', terminate);
    child.stderr?.once('error', terminate);
    child.once('error', () => { failed = true; });
    child.once('close', finish);
    timer = setTimeout(terminate, timeoutMs);
  });
}

export async function validateProfilesAsync(json, {
  resolveAlias = true, environment = process.env, spawnCommand = spawn,
  aliasTimeoutMs = PROFILE_ALIAS_TIMEOUT_MS,
  validationTimeoutMs = PROFILE_VALIDATION_TIMEOUT_MS,
  cleanupGraceMs = PROFILE_CLEANUP_GRACE_MS,
} = {}) {
  const deadline = Date.now() + validationTimeoutMs;
  if (!resolveAlias) return validateProfiles(json, { resolveAlias: false, environment });
  const checked = validateStructure(json);
  if (!checked.ok) return checked;
  for (const profile of json.profiles) {
    const configured = validateProfileConfig(profile, environment);
    if (!configured.ok) return configured;
    const rejected = () => ({ ok: false, errors: [error('E_UNRESOLVED_ALIAS', profile.command_alias)] });
    const probe = async (command, args) => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) return { ok: false, missing: false };
      return probeAlias(command, args, {
        environment: { ...process.env, ...environment, DHR_PROFILE_ALIAS: profile.command_alias },
        timeoutMs: Math.min(aliasTimeoutMs, remaining), cleanupGraceMs, spawnCommand,
      });
    };
    const where = await probe('where.exe', [profile.command_alias]);
    if (Date.now() >= deadline) return rejected();
    if (where.ok) continue;
    if (!where.missing) return rejected();
    const fallback = await probe('pwsh', ['-NoLogo', '-Command',
      "try { Get-Command -Name $env:DHR_PROFILE_ALIAS -CommandType Application,Function,Alias,ExternalScript -ErrorAction Stop | Out-Null; Write-Output ok } catch { exit 1 }",
    ]);
    if (!fallback.ok || Date.now() >= deadline) return rejected();
  }
  return checked;
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
