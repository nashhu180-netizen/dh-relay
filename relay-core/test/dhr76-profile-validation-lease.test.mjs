import assert from 'node:assert/strict';
import childProcess, { execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import {
  PROFILE_ALIAS_TIMEOUT_MS,
  PROFILE_CLEANUP_GRACE_MS,
  PROFILE_VALIDATION_TIMEOUT_MS,
  validateProfilesAsync,
} from '../profiles/validate-profiles.mjs';
import { loadExecutorProfiles, resolveProfile } from '../runtime/executors/herdr/profile-registry.mjs';
import { createHostSessionActor } from '../runtime/host.mjs';
import { acquireLease, readLease } from '../runtime/lease.mjs';
import { isProcessAlive } from '../runtime/pidalive.mjs';
import { createRunWithNumbering } from '../runtime/startrun.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore } from '../store/store.mjs';

const execFileAsync = promisify(execFile);
const originalSpawn = childProcess.spawn.bind(childProcess);
const fixtureEnvironment = {
  DHR76_PROFILE_HOME: fileURLToPath(new URL('../../docs/modules/dh-relay/workspace/DHR_76/fixtures', import.meta.url)),
};

const capabilities = {
  interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported',
  structured_result: 'supported', user_input_passthrough: 'supported',
};
const claudeCapabilities = { ...capabilities, readonly: 'unsupported' };
const unprovenCapabilities = {
  interactive: 'unproven', resume: 'unproven', readonly: 'unproven', headless: 'unproven',
  structured_result: 'unproven', user_input_passthrough: 'unproven',
};

function profile(id, alias = id.replaceAll('.', '-'), fallback_profile_ids = [], {
  product = 'codex-cli', profileCapabilities = capabilities, headless_supported = true,
} = {}) {
  return {
    executor_profile_id: id,
    backend: 'herdr',
    product,
    command_alias: alias,
    account_alias: `acct-${id.split('.').at(-1)}`,
    capabilities: profileCapabilities,
    supported_platforms: ['win32'],
    headless_supported,
    fallback_profile_ids,
    ...(id === 'herdr.codex.ninth' ? {} : {
      config_fingerprint_rule: {
        kind: 'file-exists',
        path_template: '${DHR76_PROFILE_HOME}/profile.json',
        fields: (id === 'herdr.codex.main' ? ['/model', '/profiles'] : ['/model', '/permissions'])
          .map(pointer => ({ pointer, classification: 'nonsecret' })),
      },
    }),
    ...(id === 'herdr.claude.main' ? { expected_identity: 'acct***@example.invalid' } : {}),
  };
}

function completeRegistry() {
  return {
    profiles: [
      profile('herdr.codex.main', 'dhr76-a', []),
      profile('herdr.codex.ninth', 'dhr76-b', ['herdr.codex.main']),
      profile('herdr.claude.main', 'dhr76-c', [], { product: 'claude-code', profileCapabilities: claudeCapabilities }),
      profile('herdr.claude.grok', 'dhr76-d', [], { product: 'claude-code', profileCapabilities: claudeCapabilities }),
      profile('herdr.claude.account5', 'dhr76-e', [], {
        product: 'unverified', profileCapabilities: unprovenCapabilities, headless_supported: false,
      }),
    ],
  };
}

function configuredRegistry(aliases = [
  'dhr76-valid-a.ps1', 'dhr76-valid-b.ps1', 'dhr76-valid-c.ps1', 'dhr76-valid-d.ps1', 'dhr76-valid-e.ps1',
]) {
  const registry = completeRegistry();
  for (const [index, item] of registry.profiles.entries()) {
    item.command_alias = aliases[index];
    if (item.config_fingerprint_rule) item.config_fingerprint_rule.path_template = '${DHR76_PROFILE_HOME}/profile.json';
  }
  return registry;
}

function childProbe({ delayMs = 0, stdout = 'ok\n', exitCode = 0, signal = null, descendantPidPath = null } = {}) {
  const descendant = descendantPidPath
    ? `const fs=require('node:fs');const {spawn}=require('node:child_process');const descendant=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(${JSON.stringify(descendantPidPath)},String(descendant.pid));`
    : '';
  const script = `${descendant}setTimeout(() => { ${signal ? `process.kill(process.pid, '${signal}')` : `process.stdout.write(${JSON.stringify(stdout)}); process.exit(${exitCode})`} }, ${delayMs});`;
  return originalSpawn(process.execPath, ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

function delayedRunner({ delayMs = 3_200, failures = new Map(), calls = [], childOptions = {} } = {}) {
  return (command, args, options = {}) => {
    const alias = command === 'pwsh' ? options.env?.DHR_PROFILE_ALIAS : args[0];
    calls.push({ command, alias });
    const failure = failures.get(alias);
    if (failure?.where === 'spawn' && command === 'where.exe') throw Object.assign(new Error('spawn failed'), { code: 'ENOENT' });
    if (failure?.pwsh === 'spawn' && command === 'pwsh') throw Object.assign(new Error('spawn failed'), { code: 'ENOENT' });
    if (command === 'where.exe' && failure?.where === 'empty') return childProbe({ delayMs, stdout: '', ...childOptions });
    if (command === 'where.exe' && failure?.where === 'nonzero') return childProbe({ delayMs, stdout: 'missing\n', exitCode: 1, ...childOptions });
    if (command === 'where.exe' && failure?.where === 'signal') return childProbe({ delayMs, signal: 'SIGTERM', ...childOptions });
    if (command === 'pwsh' && failure?.pwsh === 'empty') return childProbe({ delayMs, stdout: '', ...childOptions });
    if (command === 'pwsh' && failure?.pwsh === 'nonzero') return childProbe({ delayMs, stdout: 'missing\n', exitCode: 1, ...childOptions });
    return childProbe({ delayMs, ...childOptions });
  };
}

function runDocument() {
  return {
    protocol: 'relay.run/v2',
    run_id: 'placeholder',
    workflow_name: 'dhr76-profile-validation',
    summary: 'DHR76 profile validation test',
    trigger: 'system',
    trigger_by: null,
    created_at: '2026-09-05T00:00:00Z',
    labels: [],
    nodes: [{
      node_id: 'node-a', title: 'A', role: 'executor', required: false, depends_on: [],
      executor_profiles: [
        { kind: 'herdr-agent', ref: 'herdr.codex.main' },
        { kind: 'herdr-agent', ref: 'herdr.claude.main' },
      ],
    }],
  };
}

async function runtimeFixture(t, registry = completeRegistry()) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr76-runtime-repo-'));
  const scratch = await mkdtemp(join(tmpdir(), 'dhr76-runtime-index-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  const created = await createRunWithNumbering({
    repoRoot, slug: 'dhr76', run: runDocument(), indexPath: join(scratch, 'runs.json'),
  });
  await writeFile(join(scratch, 'profile.json'), JSON.stringify({ model: 'dhr76-test', profiles: [], permissions: [] }), 'utf8');
  const registryPath = join(scratch, 'executor-profiles.json');
  await writeFile(registryPath, JSON.stringify(registry), 'utf8');
  return { ...created, repoRoot, scratch, registryPath };
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function assertRejectedDriver(root, registryPath) {
  const runId = 'R001-dhr76-rejected';
  const runRoot = join(root, '.dh-relay', runId);
  await mkdir(runRoot, { recursive: true });
  const run = { ...runDocument(), run_id: runId };
  const store = await createStore({ root: runRoot, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  const calls = [];
  const driver = startWorkflowDriver({
    repoRoot: root, runId, actor: { submitControl: fn => fn(store) },
    herdrRegistryPath: registryPath, profileEnvironment: fixtureEnvironment,
    herdrCli: {
      paneSplit: () => { calls.push('pane'); throw new Error('unexpected pane'); },
      agentStart: () => { calls.push('agent'); throw new Error('unexpected agent'); },
    },
  });
  try {
    assert.deepEqual(await driver.done, { ok: true });
    assert.deepEqual(calls, []);
    assert.equal(store.events.filter(event => event.kind === 'attempt_started').length, 0);
    assert.equal(store.events.filter(event => event.kind === 'attempt_succeeded' || event.kind === 'attempt_failed').length, 0);
    assert.deepEqual(await readdir(join(runRoot, 'results')), []);
  } finally {
    await driver.stop();
  }
}

async function waitForFile(path, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await readFile(path, 'utf8');
      return true;
    } catch {
      await sleep(50);
    }
  }
  return false;
}

async function delayedValidEnvironment(fixture, delaySeconds = 2) {
  const registry = configuredRegistry();
  const aliases = registry.profiles.map(item => item.command_alias);
  for (const alias of aliases) await writeFile(join(fixture.scratch, alias), 'Write-Output ok\n', 'utf8');
  const marker = join(fixture.scratch, 'profile-validation-started.marker');
  return {
    registry,
    marker,
    delayMs: delaySeconds * 1_000,
    environment: {
      DHR76_PROFILE_HOME: fixture.scratch,
      DHR76_MARKER: marker,
      PATH: process.env.PATH,
    },
  };
}

function installDelayedProbeMock(t, { marker, delayMs, completed = [] }) {
  const mock = t.mock.method(childProcess, 'spawn', (command, args, options = {}) => {
    if (command === 'where.exe') {
      return originalSpawn(process.execPath, ['-e', 'process.exit(1)'], options);
    }
    if (command === 'pwsh') {
      const script = [
        `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'started\\n')`,
        `setTimeout(() => { process.stdout.write('ok\\n'); process.exit(0); }, ${delayMs})`,
      ].join(';');
      const child = originalSpawn(process.execPath, ['-e', script], options);
      child.once('close', () => completed.push(options.env.DHR_PROFILE_ALIAS));
      return child;
    }
    return originalSpawn(command, args, options);
  });
  syncBuiltinESMExports();
  t.after(() => {
    mock.mock.restore();
    syncBuiltinESMExports();
  });
}

test('DHR_76 constants freeze alias, registry, and cleanup budgets', () => {
  assert.equal(PROFILE_ALIAS_TIMEOUT_MS, 15_000);
  assert.equal(PROFILE_VALIDATION_TIMEOUT_MS, 60_000);
  assert.equal(PROFILE_CLEANUP_GRACE_MS, 10_000);
});

test('DHR_76/D: cleanup grace exhaustion fails explicitly without claiming close', async (t) => {
  let killCalls = 0;
  const spawnCommand = () => {
    const child = new EventEmitter();
    child.pid = null;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stderr.resume = () => {};
    child.kill = () => { killCalls += 1; return true; };
    return child;
  };

  await assert.rejects(
    validateProfilesAsync(completeRegistry(), {
      environment: fixtureEnvironment,
      spawnCommand,
      aliasTimeoutMs: 5,
      validationTimeoutMs: 100,
      cleanupGraceMs: 15,
    }),
    /E_UNRESOLVED_ALIAS:probe-close-timeout/,
  );
  assert.ok(killCalls >= 2, 'timeout and grace exhaustion must both request termination');
  t.diagnostic(`DHR76-D cleanup_unconfirmed=true close_observed=false kill_calls=${killCalls}`);
});

test('DHR_76/D: cleanup grace exhaustion leaves driver side effects at zero', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr76-cleanup-unconfirmed-driver-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const registryPath = join(root, 'profiles.json');
  await writeFile(registryPath, JSON.stringify(completeRegistry()), 'utf8');
  let killCalls = 0;
  const mock = t.mock.method(childProcess, 'spawn', () => {
    const child = new EventEmitter();
    child.pid = null;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stderr.resume = () => {};
    child.kill = () => { killCalls += 1; return true; };
    return child;
  });
  syncBuiltinESMExports();
  try {
    await assertRejectedDriver(root, registryPath);
    assert.ok(killCalls >= 2, 'driver validation must request termination through grace exhaustion');
    t.diagnostic(`DHR76-D cleanup_unconfirmed=true driver_side_effects=0 kill_calls=${killCalls}`);
  } finally {
    mock.mock.restore();
    syncBuiltinESMExports();
  }
});

test('DHR_76/A: five-profile fixture preserves the current DHR65 registry graph', () => {
  assert.deepEqual(completeRegistry().profiles.map(item => Boolean(item.config_fingerprint_rule)),
    [true, false, true, true, true]);
  assert.deepEqual(configuredRegistry().profiles.map(item => Boolean(item.config_fingerprint_rule)),
    [true, false, true, true, true]);
  assert.deepEqual(completeRegistry().profiles.map(item => [
    item.executor_profile_id, item.product, item.headless_supported, item.fallback_profile_ids,
  ]), [
    ['herdr.codex.main', 'codex-cli', true, []],
    ['herdr.codex.ninth', 'codex-cli', true, ['herdr.codex.main']],
    ['herdr.claude.main', 'claude-code', true, []],
    ['herdr.claude.grok', 'claude-code', true, []],
    ['herdr.claude.account5', 'unverified', false, []],
  ]);
});

test('DHR_76/B: all five aliases run as real async child probes and do not starve the event loop', async (t) => {
  const calls = [];
  const renewTicks = [];
  const timer = setInterval(() => renewTicks.push(Date.now()), 500);
  t.after(() => clearInterval(timer));
  const startedAt = Date.now();
  const result = await validateProfilesAsync(completeRegistry(), {
    environment: fixtureEnvironment,
    spawnCommand: delayedRunner({ calls }),
  });
  const elapsed = Date.now() - startedAt;
  const aliases = calls.filter(call => call.command === 'where.exe').map(call => call.alias).sort();
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.deepEqual(aliases, ['dhr76-a', 'dhr76-b', 'dhr76-c', 'dhr76-d', 'dhr76-e']);
  assert.equal(calls.filter(call => call.command === 'pwsh').length, 0, 'where success must avoid fallback');
  assert.ok(elapsed > PROFILE_ALIAS_TIMEOUT_MS, `the five-probe aggregate must exceed 15s: ${elapsed}ms`);
  assert.ok(renewTicks.length >= 2, `event loop did not get two renewal opportunities: ${renewTicks.length}`);
});

test('DHR_76/A: a non-target invalid alias remains fail-closed after complete-table validation', async () => {
  const registry = completeRegistry();
  registry.profiles[4].command_alias = 'dhr76-invalid-account5';
  const result = await validateProfilesAsync(registry, {
    environment: fixtureEnvironment,
    spawnCommand: delayedRunner({ failures: new Map([['dhr76-invalid-account5', { where: 'nonzero', pwsh: 'nonzero' }]]) }),
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors[0], { code: 'E_UNRESOLVED_ALIAS', detail: 'dhr76-invalid-account5' });
});

for (const [label, failure] of [
  ['spawn error', { where: 'spawn', pwsh: 'spawn' }],
  ['non-zero', { where: 'nonzero', pwsh: 'nonzero' }],
  ['signal', { where: 'signal', pwsh: 'nonzero' }],
  ['empty result', { where: 'empty', pwsh: 'empty' }],
]) {
  test(`DHR_76/C ${label} is reported as E_UNRESOLVED_ALIAS`, async (t) => {
    const registry = completeRegistry();
    registry.profiles[0].command_alias = `dhr76-${label.replaceAll(' ', '-')}`;
    const alias = registry.profiles[0].command_alias;
    const result = await validateProfilesAsync(registry, {
      environment: fixtureEnvironment,
      spawnCommand: delayedRunner({ delayMs: 0, failures: new Map([[alias, failure]]) }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.errors[0]?.code, 'E_UNRESOLVED_ALIAS');
    assert.equal(result.errors[0]?.detail, alias);
    const root = await mkdtemp(join(tmpdir(), 'dhr76-error-wrapper-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const registryPath = join(root, 'registry.json');
    await writeFile(registryPath, JSON.stringify(registry), 'utf8');
    const mock = t.mock.method(childProcess, 'spawn',
      delayedRunner({ delayMs: 0, failures: new Map([[alias, failure]]) }));
    syncBuiltinESMExports();
    try {
      const loaded = await loadExecutorProfiles({ registryPath, environment: fixtureEnvironment });
      assert.equal(loaded.ok, false);
      assert.equal(loaded.reason, 'E_BAD_VALUE:PROFILE_REGISTRY');
      assert.match(loaded.detail, /E_UNRESOLVED_ALIAS/);
      await assertRejectedDriver(root, registryPath);
    } finally {
      mock.mock.restore();
      syncBuiltinESMExports();
    }
  });
}

test('DHR_76/C: loader awaits async validation and keeps the existing outer error face', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr76-loader-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const registryPath = join(root, 'profiles.json');
  const registry = completeRegistry();
  registry.profiles[3].command_alias = 'dhr76-loader-invalid';
  await writeFile(registryPath, JSON.stringify(registry), 'utf8');
  const loaded = await loadExecutorProfiles({ registryPath, environment: fixtureEnvironment });
  assert.equal(loaded.ok, false);
  assert.equal(loaded.reason, 'E_BAD_VALUE:PROFILE_REGISTRY');
  assert.match(loaded.detail, /E_UNRESOLVED_ALIAS/);
});

test('DHR_76/A: a broken fallback edge is rejected before any alias probe', async () => {
  const calls = [];
  const registry = completeRegistry();
  registry.profiles[1].fallback_profile_ids = ['herdr.missing.profile'];
  const result = await validateProfilesAsync(registry, {
    environment: fixtureEnvironment,
    spawnCommand: delayedRunner({ calls }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.code, 'E_DANGLING_FALLBACK');
  assert.deepEqual(calls, []);
});

test('DHR_76/A: mixed config and alias faults keep the deterministic first error and stop probing', async () => {
  const calls = [];
  const registry = completeRegistry();
  registry.profiles[0].config_fingerprint_rule = {
    kind: 'file-exists', path_template: '${DHR76_PROFILE_HOME}/missing.json',
    fields: [{ pointer: '/model', classification: 'nonsecret' }],
  };
  registry.profiles[4].command_alias = 'dhr76-mixed-invalid-alias';
  const result = await validateProfilesAsync(registry, {
    environment: { DHR76_PROFILE_HOME: join(tmpdir(), 'dhr76-no-such-config') },
    spawnCommand: delayedRunner({ delayMs: 0, calls, failures: new Map([
      ['dhr76-mixed-invalid-alias', { where: 'nonzero', pwsh: 'nonzero' }],
    ]) }),
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors[0], {
    code: 'E_UNRESOLVED_CONFIG', detail: '${DHR76_PROFILE_HOME}/missing.json',
  });
  assert.deepEqual(calls, []);
});

test('DHR_76/D: Windows validation timeout waits for close and kills the child process tree', {
  skip: process.platform !== 'win32',
}, async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr76-timeout-tree-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const calls = [];
  const descendantPidPath = join(root, 'descendant.pid');
  const registry = completeRegistry();
  const startedAt = Date.now();
  const result = await validateProfilesAsync(registry, {
    environment: fixtureEnvironment,
    spawnCommand: delayedRunner({ delayMs: 30_000, calls, childOptions: { descendantPidPath } }),
    aliasTimeoutMs: PROFILE_ALIAS_TIMEOUT_MS,
    validationTimeoutMs: 3_000,
    cleanupGraceMs: PROFILE_CLEANUP_GRACE_MS,
  });
  const elapsed = Date.now() - startedAt;
  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.code, 'E_UNRESOLVED_ALIAS');
  assert.equal(result.errors[0]?.detail, 'dhr76-a');
  assert.ok(calls.length >= 1, 'at least the first profile probe must have started before the round deadline');
  assert.equal(await waitForFile(descendantPidPath, 5_000), true, 'child must create a descendant pid before timeout cleanup');
  const descendantPid = Number(await readFile(descendantPidPath, 'utf8'));
  const deadline = Date.now() + 5_000;
  while (isProcessAlive(descendantPid) && Date.now() < deadline) await sleep(50);
  assert.equal(isProcessAlive(descendantPid), false, `descendant process still alive: ${descendantPid}`);
  assert.ok(elapsed < 10_000, `timeout cleanup exceeded its bounded window: ${elapsed}ms`);
  t.diagnostic(`DHR76-D timeout elapsed_ms=${elapsed} child_calls=${calls.length} descendant_pid=${descendantPid} alive=${isProcessAlive(descendantPid)}`);
});

test('DHR_76/C: successful validation retains the complete registry and fallback relation', async () => {
  const result = await validateProfilesAsync(completeRegistry(), { resolveAlias: false, environment: fixtureEnvironment });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});

test('DHR_76/B: the real Host actor renews its default 15s lease during the five-probe async window', async (t) => {
  const fixture = await runtimeFixture(t);
  const actor = createHostSessionActor({ repoRoot: fixture.repoRoot, runId: fixture.run_id, tickMs: 1_000 });
  await actor.ready;
  const before = await readLease(fixture.root);
  const calls = [];
  const startedAt = Date.now();
  const probeRunner = delayedRunner({ delayMs: 3_200, calls });
  const mock = t.mock.method(childProcess, 'spawn', (command, args, options) =>
    command === 'where.exe' || command === 'pwsh'
      ? probeRunner(command, args, options) : originalSpawn(command, args, options));
  syncBuiltinESMExports();
  const samples = [{ sampled_at: Date.now(), expires_at_epoch_ms: before.expires_at_epoch_ms }];
  let sampling = false;
  const sampler = setInterval(async () => {
    if (sampling) return;
    sampling = true;
    try {
      const lease = await readLease(fixture.root);
      if (lease && lease.expires_at_epoch_ms !== samples.at(-1)?.expires_at_epoch_ms) {
        samples.push({ sampled_at: Date.now(), expires_at_epoch_ms: lease.expires_at_epoch_ms });
      }
    } finally {
      sampling = false;
    }
  }, 500);
  sampler.unref?.();
  const contenderResults = [];
  let contending = false;
  const contenderSampler = setInterval(async () => {
    if (contending) return;
    contending = true;
    try {
      await acquireLease({ runRoot: fixture.root, runId: fixture.run_id });
      contenderResults.push('ACQUIRED');
    } catch (error) {
      contenderResults.push(error?.message ?? String(error));
    } finally {
      contending = false;
    }
  }, 1_000);
  contenderSampler.unref?.();
  try {
    assert.equal(before.expires_at_epoch_ms - Date.parse(before.acquired_at), 15_000,
      'the real actor must retain the production default TTL');
    const validation = loadExecutorProfiles({ registryPath: fixture.registryPath, environment: fixtureEnvironment });
    await assert.rejects(
      () => acquireLease({ runRoot: fixture.root, runId: fixture.run_id }),
      error => error?.message === 'E_LEASE_HELD',
      'an independent contender must see the live actor lease while probes await child close',
    );
    const checked = await validation;
    clearInterval(sampler);
    clearInterval(contenderSampler);
    const after = await readLease(fixture.root);
    const elapsed = Date.now() - startedAt;
    assert.equal(checked.ok, true, JSON.stringify(checked.errors));
    assert.ok(elapsed > PROFILE_ALIAS_TIMEOUT_MS, `aggregate probe window must exceed 15s: ${elapsed}ms`);
    assert.ok(samples.length >= 4, `expected multiple expiry samples, got ${samples.length}`);
    assert.ok(samples.some(sample => sample.sampled_at >= before.expires_at_epoch_ms),
      'sampling must cross the original expiry time');
    assert.ok(samples.every((sample, index) => index === 0
      || sample.expires_at_epoch_ms > samples[index - 1].expires_at_epoch_ms),
    `expiry samples must move strictly forward: ${JSON.stringify(samples)}`);
    assert.ok(after.expires_at_epoch_ms > before.expires_at_epoch_ms,
      'the actor must advance expiry while the validator awaits real children');
    assert.ok(after.expires_at_epoch_ms > Date.now(), 'lease must remain fresh after validation');
    assert.ok(contenderResults.length >= 3, `expected repeated contender checks, got ${contenderResults.length}`);
    assert.ok(contenderResults.every(result => result === 'E_LEASE_HELD'),
      `contender must never acquire during validation: ${JSON.stringify(contenderResults)}`);
    const summary = await (async () => {
      actor.stop();
      return actor.done;
    })();
    assert.ok(summary.renewals >= 2, `expected at least two renewals, got ${summary.renewals}`);
    assert.deepEqual(calls.filter(call => call.command === 'where.exe').map(call => call.alias).sort(),
      ['dhr76-a', 'dhr76-b', 'dhr76-c', 'dhr76-d', 'dhr76-e']);
    t.diagnostic(`DHR76-B elapsed_ms=${elapsed} renewals=${summary.renewals} before_expiry=${before.expires_at_epoch_ms} after_expiry=${after.expires_at_epoch_ms} samples=${JSON.stringify(samples)} contenders=${JSON.stringify(contenderResults)} calls=${JSON.stringify(calls)}`);
  } finally {
    clearInterval(sampler);
    clearInterval(contenderSampler);
    mock.mock.restore();
    syncBuiltinESMExports();
    if (!actor.done || !actor.done.finished) {
      actor.stop();
      await actor.done;
    }
  }
});

test('DHR_76/D: epoch takeover during validation fences the late driver start and all late writes', async (t) => {
  const fixture = await runtimeFixture(t, configuredRegistry());
  const delayed = await delayedValidEnvironment(fixture, 2);
  installDelayedProbeMock(t, { marker: delayed.marker, delayMs: delayed.delayMs });
  const actor = createHostSessionActor({ repoRoot: fixture.repoRoot, runId: fixture.run_id, tickMs: 250 });
  await actor.ready;
  const oldLease = await readLease(fixture.root);
  const hostCalls = { agents: 0, panes: 0 };
  const herdrCli = {
    paneSplit: () => { hostCalls.panes += 1; return { ok: true, value: { pane: { pane_id: 'p1' } } }; },
    paneGet: () => ({ ok: true, value: { pane: { pane_id: 'p1' } } }),
    paneKill: () => ({ ok: true, value: { type: 'ok' } }),
    agentStart: () => { hostCalls.agents += 1; return { ok: true, value: { agent: { terminal_id: 't1' } } }; },
    agentGet: () => ({ ok: true, value: { agent: { agent_status: 'working', state_change_seq: 1 } } }),
    agentRead: () => ({ ok: true, value: '' }),
    agentSendKeys: () => ({ ok: true, value: { type: 'ok' } }),
    agentPrompt: () => ({ ok: true, value: { type: 'ok' } }),
  };
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.run_id, actor, herdrCli,
    herdrRegistryPath: fixture.registryPath, profileEnvironment: delayed.environment, herdrPollMs: 10,
  });
  try {
    assert.equal(await waitForFile(delayed.marker, 10_000), true,
      'the driver must reach a real delayed fallback child before takeover');
    assert.equal((await readLease(fixture.root)).epoch, oldLease.epoch);
    await writeFile(join(fixture.root, 'host-lease.json'), JSON.stringify({
      run_id: fixture.run_id, holder_pid: process.pid, epoch: oldLease.epoch + 1,
      acquired_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60_000).toISOString(),
      expires_at_epoch_ms: Date.now() + 60_000, hostname: 'dhr76-contender',
    }), 'utf8');
    const outcome = await driver.done;
    assert.equal(outcome.ok, false, 'the old driver must fail its late actor write after takeover');
    const summary = await actor.done;
    assert.equal(summary.outcome, 'lost_lease');
    const events = actor.store.events;
    assert.deepEqual(hostCalls, { agents: 0, panes: 0 });
    assert.equal(events.filter(event => event.kind === 'attempt_started').length, 0);
    assert.equal(events.filter(event => event.kind === 'attempt_succeeded' || event.kind === 'attempt_failed').length, 0);
    assert.deepEqual(await readdir(join(fixture.root, 'results')), []);
    assert.equal((await readLease(fixture.root)).epoch, oldLease.epoch + 1,
      'old actor must not release the replacement lease');
    const before = [...events];
    const jobs = [
      store => store.appendEvent({ kind: 'host_observation_changed', at: new Date().toISOString(),
        node_id: 'node-a', attempt_id: 'late-attempt', observation_status: 'alive', detail: 'late-observation' }),
      store => store.appendCheckpoint({ receipt_id: 'late-receipt', node_id: 'node-a', attempt_id: 'late-attempt',
        checkpoint_id: 'late-checkpoint', payload_digest: 'a'.repeat(64), at: new Date().toISOString() }),
      store => store.appendResult({ receipt_id: 'late-receipt', node_id: 'node-a', attempt_id: 'late-attempt',
        outcome: 'succeeded', reason: null, structured: {} }),
    ];
    for (const job of jobs) await assert.rejects(
      () => actor.submitControl(job), error => error?.reason === 'E_LEASE_HELD',
    );
    assert.deepEqual(actor.store.events, before);
    assert.equal(new Set(actor.store.events.map(event => event.seq)).size, actor.store.events.length);
    t.diagnostic(`DHR76-D takeover_during_validation old_epoch=${oldLease.epoch} replacement_epoch=${oldLease.epoch + 1} events=${events.length} driver=${JSON.stringify(outcome)}`);
  } finally {
    await driver.stop();
    actor.stop();
    await actor.done;
  }
});

test('DHR_76/D: driver stop after a confirmed loader wait leaves Attempt, Agent, pane, and Result at zero', async (t) => {
  const fixture = await runtimeFixture(t, configuredRegistry());
  const delayed = await delayedValidEnvironment(fixture, 5);
  installDelayedProbeMock(t, { marker: delayed.marker, delayMs: delayed.delayMs });
  const actor = createHostSessionActor({ repoRoot: fixture.repoRoot, runId: fixture.run_id, tickMs: 250 });
  await actor.ready;
  const hostCalls = { agents: 0, panes: 0 };
  const herdrCli = {
    paneSplit: () => { hostCalls.panes += 1; return { ok: true, value: { pane: { pane_id: 'p1' } } }; },
    paneGet: () => ({ ok: true, value: { pane: { pane_id: 'p1' } } }),
    paneKill: () => ({ ok: true, value: { type: 'ok' } }),
    agentStart: () => { hostCalls.agents += 1; return { ok: true, value: { agent: { terminal_id: 't1' } } }; },
    agentGet: () => ({ ok: true, value: { agent: { agent_status: 'working', state_change_seq: 1 } } }),
    agentRead: () => ({ ok: true, value: '' }),
    agentSendKeys: () => ({ ok: true, value: { type: 'ok' } }),
    agentPrompt: () => ({ ok: true, value: { type: 'ok' } }),
  };
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.run_id, actor, herdrCli,
    herdrRegistryPath: fixture.registryPath, profileEnvironment: delayed.environment, herdrPollMs: 10,
  });
  try {
    assert.equal(await waitForFile(delayed.marker, 10_000), true,
      'the loader must be observed inside a real delayed child before stop');
    assert.equal(driver.finished, false);
    const stopStartedAt = Date.now();
    const outcome = await driver.stop();
    assert.equal(outcome.ok, true);
    assert.ok(Date.now() - stopStartedAt >= 2_000, 'stop must wait for the in-flight loader rather than guessing at 5ms');
    const events = actor.store.events;
    assert.equal(hostCalls.agents, 0);
    assert.equal(hostCalls.panes, 0);
    assert.equal(events.filter(event => event.kind === 'attempt_started').length, 0);
    assert.equal(events.filter(event => event.kind === 'attempt_succeeded' || event.kind === 'attempt_failed').length, 0);
    assert.deepEqual(await readdir(join(fixture.root, 'results')), []);
    t.diagnostic(`DHR76-D stop outcome=${JSON.stringify(outcome)} events=${events.length} host_calls=${JSON.stringify(hostCalls)} loader_wait_ms=${Date.now() - stopStartedAt}`);
  } finally {
    await driver.stop();
    actor.stop();
    await actor.done;
  }
});

test('DHR_76/C: complete validation precedes the selected profile launch with four zero side effects while waiting', async (t) => {
  const fixture = await runtimeFixture(t, configuredRegistry());
  const delayed = await delayedValidEnvironment(fixture, 1);
  const completed = [];
  installDelayedProbeMock(t, { marker: delayed.marker, delayMs: delayed.delayMs, completed });
  const actor = createHostSessionActor({ repoRoot: fixture.repoRoot, runId: fixture.run_id, tickMs: 250 });
  await actor.ready;
  const calls = [];
  const herdrCli = {
    paneSplit: () => {
      assert.equal(completed.length, 5, 'all aliases must close successfully before any pane');
      calls.push('pane');
      return { ok: true, value: { pane_id: 'p1' } };
    },
    paneKill: () => ({ ok: true, value: {} }),
    agentStart: ({ kind }) => {
      calls.push(kind);
      return { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'fixture-stop-after-selected-launch' };
    },
    paneRun: () => { throw new Error('unselected Claude profile must not launch'); },
  };
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.run_id, actor, herdrCli,
    herdrRegistryPath: fixture.registryPath, profileEnvironment: delayed.environment,
  });
  try {
    assert.equal(await waitForFile(delayed.marker), true);
    assert.deepEqual(calls, []);
    assert.equal(actor.store.events.filter(event => event.kind === 'attempt_started').length, 0);
    assert.deepEqual(await readdir(join(fixture.root, 'results')), []);
    assert.equal((await driver.done).ok, true);
    assert.equal(completed.length, 5);
    assert.deepEqual(calls, ['pane', 'codex']);
    const attempts = actor.store.events.filter(event => event.kind === 'attempt_started');
    assert.equal(attempts.length, 1);
    assert.deepEqual(await readdir(join(fixture.root, 'results')), []);
    const registry = JSON.parse(await readFile(fixture.registryPath, 'utf8'));
    assert.equal(resolveProfile(registry, 'herdr.codex.main').product, 'codex-cli');
    assert.equal(resolveProfile(registry, 'herdr.claude.main').product, 'claude-code');
    t.diagnostic(`DHR76-C completed_aliases=${completed.length} selected_starts=1 unselected_starts=0`);
  } finally {
    await driver.stop();
    actor.stop();
    await actor.done;
  }
});

test('DHR_76/C: production timeout budget retains loader error and driver four-zero boundary', {
  skip: process.platform !== 'win32',
}, async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr76-production-timeout-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const registryPath = join(root, 'registry.json');
  await writeFile(registryPath, JSON.stringify(completeRegistry()), 'utf8');
  const descendantPidPath = join(root, 'descendant.pid');
  const children = [];
  const mock = t.mock.method(childProcess, 'spawn', (command, args, options) => {
    if (command !== 'where.exe' && command !== 'pwsh') return originalSpawn(command, args, options);
    const child = childProbe({ delayMs: 30_000, descendantPidPath });
    const observed = { closed: false };
    child.once('close', () => { observed.closed = true; });
    children.push(observed);
    return child;
  });
  syncBuiltinESMExports();
  try {
    const began = Date.now();
    const loaded = await loadExecutorProfiles({ registryPath, environment: fixtureEnvironment });
    assert.equal(loaded.ok, false);
    assert.equal(loaded.reason, 'E_BAD_VALUE:PROFILE_REGISTRY');
    assert.match(loaded.detail, /E_UNRESOLVED_ALIAS/);
    assert.ok(Date.now() - began >= 15_000, 'must exercise the frozen production timeout');
    assert.equal(children.length, 1);
    assert.equal(children[0].closed, true, 'loader failure must follow real child close');
    assert.equal(await isProcessAlive(Number(await readFile(descendantPidPath, 'utf8'))), false);
    await assertRejectedDriver(root, registryPath);
    assert.equal(children.length, 2);
    assert.ok(children.every(child => child.closed));
    assert.equal(await isProcessAlive(Number(await readFile(descendantPidPath, 'utf8'))), false);
    t.diagnostic('DHR76-C timeout alias_budget_ms=15000 closed_children=2 descendants_alive=0 driver_side_effects=0');
  } finally {
    mock.mock.restore();
    syncBuiltinESMExports();
  }
});

test('DHR_76/C: the frozen 60s registry budget bounds five real probes', async (t) => {
  const calls = [];
  const began = Date.now();
  const checked = await validateProfilesAsync(completeRegistry(), {
    environment: fixtureEnvironment, spawnCommand: delayedRunner({ delayMs: 11_000, calls }),
  });
  const elapsed = Date.now() - began;
  assert.equal(checked.ok, false);
  assert.equal(checked.errors[0]?.code, 'E_UNRESOLVED_ALIAS');
  assert.ok(calls.length >= 4, 'must reach the aggregate deadline rather than an early alias timeout');
  assert.ok(elapsed >= PROFILE_VALIDATION_TIMEOUT_MS, `round ended early: ${elapsed}`);
  assert.ok(elapsed <= PROFILE_VALIDATION_TIMEOUT_MS + PROFILE_CLEANUP_GRACE_MS,
    `round and cleanup exceeded their frozen budgets: ${elapsed}`);
  t.diagnostic(`DHR76-C round_budget_ms=60000 cleanup_grace_ms=10000 elapsed_ms=${elapsed} calls=${calls.length}`);
});

test('DHR_76/C: a real asynchronous spawn error closes before the loader rejects', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr76-async-spawn-error-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const registryPath = join(root, 'registry.json');
  await writeFile(registryPath, JSON.stringify(completeRegistry()), 'utf8');
  const observed = [];
  const mock = t.mock.method(childProcess, 'spawn', (_command, _args, options) => {
    const child = originalSpawn(join(root, 'dhr76-no-such-command.exe'), [], options);
    child.once('error', () => observed.push('error'));
    child.once('close', () => observed.push('close'));
    return child;
  });
  syncBuiltinESMExports();
  try {
    const loaded = await loadExecutorProfiles({ registryPath, environment: fixtureEnvironment });
    assert.equal(loaded.ok, false);
    assert.equal(loaded.reason, 'E_BAD_VALUE:PROFILE_REGISTRY');
    assert.match(loaded.detail, /E_UNRESOLVED_ALIAS/);
    assert.deepEqual(observed, ['error', 'close']);
    await assertRejectedDriver(root, registryPath);
    assert.deepEqual(observed, ['error', 'close', 'error', 'close']);
  } finally {
    mock.mock.restore();
    syncBuiltinESMExports();
  }
});
