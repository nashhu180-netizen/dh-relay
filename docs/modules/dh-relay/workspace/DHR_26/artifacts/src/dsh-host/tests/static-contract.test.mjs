import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/index.ts', import.meta.url), 'utf8')

test('registers ctx.relayPilot through the Cordis service seam', () => {
  assert.match(source, /declare module '@deepseek-ai\/cordis'/)
  assert.match(source, /interface Context \{\s*relayPilot: RelayPilot\s*\}/s)
  assert.match(source, /super\(ctx, 'relayPilot'\)/)
})

test('does not import DSH private runtime types', () => {
  assert.doesNotMatch(source, /from ['"]@deepseek-ai\/dsh-/)
  assert.match(source, /from ['"]@deepseek-ai\/cordis['"]/) 
  assert.match(source, /from ['"]@deepseek-ai\/schemastery['"]/) 
})

test('exposes only ordinary JSON-facing methods for the pilot seam', () => {
  assert.match(source, /async detail\(\): Promise<JsonValue>/)
  assert.match(source, /async list\(\): Promise<JsonValue>/)
  assert.match(source, /async snapshot\(\): Promise<RelayPilotSnapshot>/)
  assert.match(source, /JSON\.parse\(text\)/)
  assert.match(source, /clonePlainJson\(parsed, '\$'\)/)
})

test('keeps fixture evidence hashable without inferring status', () => {
  assert.match(source, /createHash\('sha256'\)\.update\(text\)\.digest\('hex'\)/)
  assert.doesNotMatch(source, /run_status.*group/s)
  assert.doesNotMatch(source, /status.*derive|derive.*status/i)
})

test('redacts common user-local path prefixes in snapshot metadata', () => {
  assert.match(source, /<experiment-root>/)
  assert.match(source, /<user-home>/)
})
