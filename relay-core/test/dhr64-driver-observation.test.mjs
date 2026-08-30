import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore } from '../store/store.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';

const HASH = 'a'.repeat(64);
const run = {
  protocol: 'relay.run/v2', run_id: 'RUN-DHR64-OBS', workflow_name: 'dhr64', summary: 'DHR64 observation',
  trigger: 'system', created_at: '2026-08-30T00:00:00.000Z', labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: true,
    executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.codex.main' }] }],
};
const profile = {
  executor_profile_id: 'herdr.codex.main', backend: 'herdr', product: 'codex-cli', command_alias: 'codex',
  account_alias: 'acct-main', capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported',
    headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
  supported_platforms: [process.platform], headless_supported: true,
  config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR64_PROFILE_HOME}/profile.json',
    fields: [{ pointer: '/model', classification: 'nonsecret' }] },
};

async function fixture(t, fake) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr64-observation-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const root = join(repoRoot, '.dh-relay', run.run_id);
  const store = await createStore({ root, run });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [profile] }), 'utf8');
  const driver = startWorkflowDriver({
    repoRoot, runId: run.run_id, actor: { submitControl: job => job(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR64_PROFILE_HOME: repoRoot },
    herdrPollMs: 2, doneTimeoutMs: 8, observationLostMs: 4,
    herdrJudge: () => { throw new Error('judge must not infer a Result'); },
  });
  t.after(() => driver.stop());
  return { root, store, driver, fake };
}

for (const status of ['done', 'idle']) {
  test(`DHR64 driver: ${status} without Receipt submission raises attention and creates no Result`, async (t) => {
    const item = await fixture(t, makeFakeHerdr({ statuses: [status], read: 'must-not-be-captured' }));
    await item.driver.done;
    assert.equal((await readdir(join(item.root, 'results'))).length, 0);
    assert.equal(item.fake.agentReads, 0, 'pane/capture text must not infer Result');
    assert.ok(item.store.events.some(event => event.kind === 'human_input_requested'
      && event.reason === 'E_EXECUTOR_RESULT_MISSING'));
  });
}

test('DHR64 driver: host loss creates attention and never a Result', async (t) => {
  const item = await fixture(t, makeFakeHerdr({ statuses: ['unknown'], paneAlive: false, agentAlive: false, missing: true }));
  await item.driver.done;
  assert.equal((await readdir(join(item.root, 'results'))).length, 0);
  assert.ok(item.store.events.some(event => event.kind === 'human_input_requested'
    && event.reason === 'E_EXECUTOR_HOST_LOST'));
});
