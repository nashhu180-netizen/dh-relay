import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createExecutorIdentity, migrateProfileRegistry, readNonsecretProfileProjection } from '../profiles/identity.mjs';

const profile = {
  executor_profile_id: 'herdr.codex.main',
  account_alias: 'acct-codex-main',
  capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
  supported_platforms: ['win32'],
  headless_supported: true,
  config_fingerprint_rule: {
    kind: 'file-exists', path_template: '${USERPROFILE}/.codex/config.toml',
    fields: [{ pointer: '/model', classification: 'nonsecret' }, { pointer: '/profiles', classification: 'nonsecret' }],
  },
};

test('DHR_61 D1: an identity snapshot hashes only declared nonsecret projections', () => {
  const first = createExecutorIdentity(profile, { '/model': 'gpt-5.6', '/profiles': 'default' });
  const repeat = createExecutorIdentity(profile, { '/profiles': 'default', '/model': 'gpt-5.6' });
  assert.deepEqual(first, repeat, 'field object order must not change a frozen snapshot');
  assert.equal(first.executor_profile_id, profile.executor_profile_id);
  assert.match(first.config_fingerprint, /^[0-9a-f]{64}$/);
  assert.match(first.executor_capability_hash, /^[0-9a-f]{64}$/);
  assert.throws(
    () => createExecutorIdentity(profile, { '/model': 'gpt-5.6' }),
    /E_NONSECRET_PROJECTION_MISSING/,
    'a missing approved projection must refuse signing rather than silently weaken the fingerprint',
  );
});

test('DHR_61 D1: registry migration only annotates legacy fingerprint field names as nonsecret', () => {
  const legacy = { profiles: [{ ...profile, config_fingerprint_rule: {
    ...profile.config_fingerprint_rule, fields: ['model', 'profiles'],
  } }] };
  const migrated = migrateProfileRegistry(legacy);
  assert.deepEqual(migrated.profiles[0].config_fingerprint_rule.fields, [
    { pointer: '/model', classification: 'nonsecret' },
    { pointer: '/profiles', classification: 'nonsecret' },
  ]);
  assert.deepEqual(legacy.profiles[0].config_fingerprint_rule.fields, ['model', 'profiles'], 'migration must not mutate the source object');
});

test('DHR_61 D1: registry migration sorts legacy projection pointers by UTF-16 code units', () => {
  const legacy = { profiles: [{ ...profile, config_fingerprint_rule: {
    ...profile.config_fingerprint_rule, fields: ['/model', '/Approval', '/sandbox', '/reasoning'],
  } }] };
  const migrated = migrateProfileRegistry(legacy);
  assert.deepEqual(migrated.profiles[0].config_fingerprint_rule.fields.map(field => field.pointer),
    ['/Approval', '/model', '/reasoning', '/sandbox']);
  assert.doesNotThrow(() => createExecutorIdentity(migrated.profiles[0], {
    '/Approval': 'never', '/model': 'gpt-5.6', '/reasoning': 'high', '/sandbox': 'workspace-write',
  }));
});

test('DHR_61 D1: projection provider reads only approved TOML fields and refuses a missing pointer', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-projection-'));
  t.after(async () => { await (await import('node:fs/promises')).rm(root, { recursive: true, force: true }); });
  await writeFile(join(root, 'config.toml'), 'model = "gpt-5.6"\nmodel_provider = "proxy"\napi_key = "not-to-be-read"\n', 'utf8');
  const selected = {
    ...profile,
    config_fingerprint_rule: {
      ...profile.config_fingerprint_rule,
      path_template: '${DHR61_PROFILE_HOME}/config.toml',
      fields: [
        { pointer: '/model', classification: 'nonsecret' },
        { pointer: '/model_provider', classification: 'nonsecret' },
      ],
    },
  };
  const projection = await readNonsecretProfileProjection(selected, { environment: { DHR61_PROFILE_HOME: root } });
  assert.deepEqual(projection, { '/model': 'gpt-5.6', '/model_provider': 'proxy' });
  await assert.rejects(
    () => readNonsecretProfileProjection({ ...selected, config_fingerprint_rule: {
      ...selected.config_fingerprint_rule,
      fields: [{ pointer: '/profiles', classification: 'nonsecret' }],
    } }, { environment: { DHR61_PROFILE_HOME: root } }),
    /E_NONSECRET_PROJECTION_MISSING:\/profiles/,
  );
});
