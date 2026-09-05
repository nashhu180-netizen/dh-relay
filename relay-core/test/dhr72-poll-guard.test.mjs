import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testFile = name => fileURLToPath(new URL(`./${name}`, import.meta.url));

async function source(name) {
  return readFile(testFile(name), 'utf8');
}

function assertPollPair(text, name, { poll, done, observation }) {
  const escaped = value => String(value).replaceAll('_', '[_]');
  assert.match(text, new RegExp(`herdrPollMs:\\s*${escaped(poll)}`), `${name}: poll interval`);
  if (done !== undefined) assert.match(text, new RegExp(`doneTimeoutMs:\\s*${escaped(done)}`), `${name}: done timeout`);
  if (observation !== undefined) assert.match(text, new RegExp(`observationLostMs:\\s*${escaped(observation)}`), `${name}: observation timeout`);
  assert.ok(poll >= 20, `${name}: poll must not regress to 1–5ms`);
  if (done > 0) assert.ok(done >= poll * 2, `${name}: done timeout must cover at least two polls`);
  if (observation !== undefined) assert.ok(observation >= poll * 2, `${name}: observation timeout must cover at least two polls`);
}

test('DHR72 poll guard: semantic polling options retain their paired timeout ratios', async () => {
  assertPollPair(await source('herdr-adapter.test.mjs'), 'herdr adapter fixture', { poll: 20, done: 50, observation: 50 });
  assertPollPair(await source('dhr64-driver-observation.test.mjs'), 'DHR64 observation fixture', { poll: 20, done: 80, observation: 40 });
  assertPollPair(await source('dhr70-submission-gate.test.mjs'), 'DHR70 submission fixture', { poll: 20, done: 200 });
  assertPollPair(await source('dhr72-continuous-observation.test.mjs'), 'DHR72 continuous fixture', { poll: 20, done: 0, observation: 40 });
});
