import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { loadExecutorProfiles } from '../runtime/executors/herdr/profile-registry.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore } from '../store/store.mjs';

const supportedCapabilities = {
  interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported',
  structured_result: 'supported', user_input_passthrough: 'supported',
};
const claudeCapabilities = { ...supportedCapabilities, readonly: 'unsupported' };
const unprovenCapabilities = {
  interactive: 'unproven', resume: 'unproven', readonly: 'unproven', headless: 'unproven',
  structured_result: 'unproven', user_input_passthrough: 'unproven',
};

function profile(executor_profile_id, account_alias, {
  product = 'codex-cli', capabilities = supportedCapabilities, headless_supported = true,
  withConfig = true, configFields = ['/model'], fallback_profile_ids, expected_identity,
} = {}) {
  return {
    executor_profile_id,
    backend: 'herdr',
    product,
    command_alias: 'node',
    account_alias,
    capabilities,
    supported_platforms: ['win32'],
    headless_supported,
    ...(fallback_profile_ids ? { fallback_profile_ids } : {}),
    ...(expected_identity ? { expected_identity } : {}),
    ...(withConfig ? {
      config_fingerprint_rule: {
        kind: 'file-exists', path_template: `\${DHR65_PROFILE_ROOT}/${executor_profile_id}.json`,
        fields: configFields.map(pointer => ({ pointer, classification: 'nonsecret' })),
      },
    } : {}),
  };
}

function completeRegistry() {
  return {
    profiles: [
      profile('herdr.codex.main', 'acct-codex-main', { configFields: ['/model', '/profiles'], fallback_profile_ids: [] }),
      profile('herdr.codex.ninth', 'acct-codex-ninth', { withConfig: false, fallback_profile_ids: ['herdr.codex.main'] }),
      profile('herdr.claude.main', 'acct-claude-main', {
        product: 'claude-code', capabilities: claudeCapabilities, configFields: ['/model', '/permissions'], expected_identity: 'acct***@example.invalid',
      }),
      profile('herdr.claude.grok', 'acct-grok-gw', { product: 'claude-code', capabilities: claudeCapabilities, configFields: ['/model', '/permissions'] }),
      profile('herdr.claude.account5', 'acct-claude5', { product: 'unverified', capabilities: unprovenCapabilities, headless_supported: false, configFields: ['/model', '/permissions'] }),
    ],
  };
}

async function fixture(t, mutate = registry => registry) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr65-registry-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  for (const entry of completeRegistry().profiles.filter(item => item.config_fingerprint_rule)) {
    await writeFile(join(repoRoot, `${entry.executor_profile_id}.json`), '{"model":"synthetic","profiles":[],"permissions":[]}', 'utf8');
  }
  const registry = mutate(completeRegistry());
  const registryPath = join(repoRoot, 'executor-profiles.json');
  await writeFile(registryPath, JSON.stringify(registry), 'utf8');
  return { repoRoot, registryPath, environment: { DHR65_PROFILE_ROOT: repoRoot } };
}

test('DHR_65 loader accepts the complete structural registry and resolves both target profiles', async (t) => {
  const testFixture = await fixture(t);
  const loaded = await loadExecutorProfiles({ registryPath: testFixture.registryPath, environment: testFixture.environment });
  assert.equal(loaded.ok, true, loaded.detail);
  assert.ok(loaded.registry.profiles.some(item => item.executor_profile_id === 'herdr.codex.main'));
  assert.ok(loaded.registry.profiles.some(item => item.executor_profile_id === 'herdr.claude.main'));
  assert.equal(loaded.registry.profiles.length, 5, 'must not replace the complete registry with a target-profile subset');
});

for (const badKind of ['alias', 'config']) {
  test(`DHR_65 loader rejects a bad ${badKind} in every registered profile`, async (t) => {
    for (const target of completeRegistry().profiles) {
      const testFixture = await fixture(t, (registry) => {
        const selected = registry.profiles.find(item => item.executor_profile_id === target.executor_profile_id);
        if (badKind === 'alias') selected.command_alias = 'dhr65-command-does-not-exist';
        else selected.config_fingerprint_rule = {
          kind: 'file-exists', path_template: '${DHR65_PROFILE_ROOT}/missing.json',
          fields: [{ pointer: '/model', classification: 'nonsecret' }],
        };
        return registry;
      });
      const loaded = await loadExecutorProfiles({ registryPath: testFixture.registryPath, environment: testFixture.environment });
      assert.equal(loaded.ok, false, `${badKind}:${target.executor_profile_id} was accepted`);
      assert.match(loaded.detail, /E_UNRESOLVED_(ALIAS|CONFIG)/);
    }
  });
}

async function assertDriverRejectsBeforeSideEffects(t, badKind) {
  const testFixture = await fixture(t, (registry) => {
    const selected = registry.profiles.find(item => item.executor_profile_id === (badKind === 'alias' ? 'herdr.claude.grok' : 'herdr.claude.account5'));
    if (badKind === 'alias') selected.command_alias = 'dhr65-command-does-not-exist';
    else selected.config_fingerprint_rule = {
      kind: 'file-exists', path_template: '${DHR65_PROFILE_ROOT}/missing.json',
      fields: [{ pointer: '/model', classification: 'nonsecret' }],
    };
    return registry;
  });
  const runId = 'R001-dhr65-registry';
  const root = join(testFixture.repoRoot, '.dh-relay', runId);
  await mkdir(root, { recursive: true });
  const run = {
    protocol: 'relay.run/v2', run_id: runId, workflow_name: 'dhr65', summary: 'registry loader',
    trigger: 'system', trigger_by: null, created_at: '2026-08-30T00:00:00Z', labels: [],
    nodes: [{
      node_id: 'agent', title: 'agent', role: '执行', required: false, depends_on: [],
      executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.codex.main' }],
    }],
  };
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  const hostCalls = { agents: 0, panes: 0 };
  const herdrCli = {
    paneSplit: () => { hostCalls.panes += 1; return { ok: true, value: { pane_id: 'pane-1' } }; },
    paneGet: () => ({ ok: true, value: { pane_id: 'pane-1' } }),
    paneKill: () => ({ ok: true, value: {} }),
    agentStart: () => { hostCalls.agents += 1; return { ok: true, value: { terminal_id: 'term-1' } }; },
    agentGet: () => ({ ok: true, value: { agent_status: 'working', state_change_seq: 1 } }),
    agentRead: () => ({ ok: true, value: 'synthetic' }),
    agentSendKeys: () => ({ ok: true, value: {} }),
    agentPrompt: () => ({ ok: true, value: {} }),
  };
  const driver = startWorkflowDriver({
    repoRoot: testFixture.repoRoot, runId, actor: { submitControl: fn => fn(store) }, herdrCli,
    herdrRegistryPath: testFixture.registryPath, profileEnvironment: testFixture.environment, herdrPollMs: 1,
  });
  t.after(() => driver.stop());
  const outcome = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`timeout:${badKind}:driver-preflight`)), 60_000);
    driver.done.then(
      value => { clearTimeout(timeout); resolve(value); },
      error => { clearTimeout(timeout); reject(error); },
    );
  });
  assert.deepEqual(outcome, { ok: true });
  assert.equal(hostCalls.panes, 0);
  assert.equal(hostCalls.agents, 0);
  assert.equal(store.events.filter(event => event.kind === 'attempt_started').length, 0);
  assert.equal(store.events.filter(event => event.kind === 'attempt_succeeded' || event.kind === 'attempt_failed').length, 0);
  assert.deepEqual(await readdir(join(root, 'receipts')), []);
  assert.deepEqual(await readdir(join(root, 'results')), []);
}

for (const badKind of ['alias', 'config']) {
  test(`DHR_65 driver rejects a bad ${badKind} complete registry before Attempt, Agent, pane, or Result`, async (t) => {
    await assertDriverRejectsBeforeSideEffects(t, badKind);
  });
}
