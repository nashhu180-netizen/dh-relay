import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProfiles } from '../profiles/validate-profiles.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FIXTURES = join(ROOT, 'profiles', 'fixtures');
const CREDENTIAL_KEY = /token|api[_-]?key|cookie|secret|password|authorization|bearer/i;
const CREDENTIAL_VALUE = [
  /sk-[A-Za-z0-9_-]{16,}/,
  /eyJ[A-Za-z0-9_-]{10,}/,
  /Bearer\s+\S+/,
  /[A-Fa-f0-9]{40,}/,
  /[A-Za-z0-9+/_-]{40,}={0,2}/,
];

function read(name) {
  return JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'));
}

test('DHR_32 golden registry resolves every audited Windows profile', () => {
  const result = validateProfiles(read('golden-registry.json'), { resolveAlias: true });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});

for (const name of readdirSync(FIXTURES).filter(file => file.startsWith('negative-') && file.endsWith('.expect.json')).sort()) {
  test(`DHR_32 ${name.replace('.expect.json', '')} is rejected with its frozen code`, () => {
    const fixture = name.replace('.expect.json', '.json');
    const expected = read(name);
    const result = validateProfiles(read(fixture), { resolveAlias: fixture === 'negative-unresolved-alias.json' });
    assert.equal(result.ok, false, `${fixture} was accepted`);
    assert.equal(result.errors[0]?.code, expected.code, JSON.stringify(result.errors));
  });
}

test('DHR_32 golden registry contains neither credential-shaped keys nor values', () => {
  const text = readFileSync(join(FIXTURES, 'golden-registry.json'), 'utf8');
  const doc = JSON.parse(text);
  const keys = [];
  const walk = value => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        keys.push(key);
        walk(child);
      }
    }
  };
  walk(doc);
  assert.equal(keys.some(key => CREDENTIAL_KEY.test(key)), false, `credential key present: ${keys.join(',')}`);
  assert.equal(CREDENTIAL_VALUE.some(pattern => pattern.test(text)), false, 'credential-shaped value present');
});

test('DHR_32 capability states are anchored in their own audit-evidence lines', () => {
  const evidenceRoot = join(ROOT, '..', 'docs', 'modules', 'dh-relay', 'workspace', 'DHR_32', 'evidence');
  const expectedSwitch = {
    interactive: /interactive CLI|interactive session/, resume: /\bresume\b|--continue/,
    readonly: /--sandbox read-only/, headless: /\bexec\b|-p\/--print/,
    structured_result: /--json|--output-format json/, user_input_passthrough: /agent prompt|send-keys/,
  };
  const negative = /不支持|不可证|未发现|无/;
  for (const profile of read('golden-registry.json').profiles) {
    const evidence = readFileSync(join(evidenceRoot, `audit-${profile.command_alias}.md`), 'utf8');
    const section = evidence.match(/## 能力位\r?\n([\s\S]*?)(?=\r?\n## |$)/)?.[1];
    assert.ok(section, `${profile.command_alias} lacks capabilities section`);
    for (const [capability, state] of Object.entries(profile.capabilities)) {
      const line = section.split(/\r?\n/).find(item => item.includes(`\`${capability}\``));
      assert.ok(line, `${profile.command_alias}.${capability} lacks its own evidence line`);
      if (state === 'supported') {
        assert.match(line, expectedSwitch[capability], `${profile.command_alias}.${capability} lacks command evidence`);
        assert.doesNotMatch(line, negative, `${profile.command_alias}.${capability} is negatively qualified`);
      } else {
        assert.match(line, negative, `${profile.command_alias}.${capability} lacks negative evidence`);
      }
    }
  }
});

test('DHR_32 profiles without expected identity are explicitly marked unproven in evidence', () => {
  const evidenceRoot = join(ROOT, '..', 'docs', 'modules', 'dh-relay', 'workspace', 'DHR_32', 'evidence');
  for (const profile of read('golden-registry.json').profiles.filter(item => !item.expected_identity)) {
    const evidence = readFileSync(join(evidenceRoot, `audit-${profile.command_alias}.md`), 'utf8');
    assert.match(evidence, /不可证/, `${profile.command_alias} omits expected_identity without evidence`);
  }
});

test('DHR_32 headless_supported agrees with the headless capability', () => {
  const invalid = read('golden-registry.json');
  invalid.profiles[0].headless_supported = false;
  const result = validateProfiles(invalid, { resolveAlias: false });
  assert.equal(result.ok, false, 'inconsistent headless state was accepted');
  assert.equal(result.errors[0]?.code, 'E_SCHEMA', JSON.stringify(result.errors));
});

test('DHR_61 D2: registry rejects fallback sets whose maximum legal pause detail exceeds 4096 bytes', () => {
  const template = read('golden-registry.json').profiles[0];
  const profileId = index => `herdr.${'p'.repeat(80)}.${String(index).padStart(2, '0')}`;
  const fallbacks = Array.from({ length: 6 }, (unused, index) => ({
    ...template,
    executor_profile_id: profileId(index),
    account_alias: `a${String(index).padStart(2, '0')}${'x'.repeat(45)}`,
    command_alias: `fallback-${index}`,
    fallback_profile_ids: undefined,
    config_fingerprint_rule: undefined,
  }));
  for (const fallback of fallbacks) {
    delete fallback.fallback_profile_ids;
    delete fallback.config_fingerprint_rule;
  }
  const source = {
    ...template,
    executor_profile_id: 'herdr.source.capacity',
    command_alias: 'source',
    fallback_profile_ids: fallbacks.map(profile => profile.executor_profile_id),
    config_fingerprint_rule: undefined,
  };
  delete source.config_fingerprint_rule;
  const result = validateProfiles({ profiles: [source, ...fallbacks] }, { resolveAlias: false });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.code, 'E_SCHEMA');
  assert.match(result.errors[0]?.detail ?? '', /fallback_pause_detail>4096/);
});

test('DHR_61 D2: registry freezes profile and account identity bounds before Attempt signing', () => {
  const template = read('golden-registry.json').profiles[0];
  const invalidAlias = validateProfiles({ profiles: [{ ...template, account_alias: '账号' }] }, { resolveAlias: false });
  assert.equal(invalidAlias.ok, false);
  assert.equal(invalidAlias.errors[0]?.code, 'E_SCHEMA');
  const invalidId = validateProfiles({ profiles: [{ ...template,
    executor_profile_id: `herdr.${'x'.repeat(90)}.main`, fallback_profile_ids: [],
  }] }, { resolveAlias: false });
  assert.equal(invalidId.ok, false);
});
