import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Locate the frozen DHR_25 fixture directory.
 *
 * These tests read the real upstream fixtures on purpose. The first version of
 * this plugin passed its whole suite against fixtures the suite itself wrote,
 * then failed to load against the real ones — so a missing fixture root is a
 * hard failure here, never a skip.
 */
const fromEnv = process.env.RELAY_PILOT_FIXTURE_ROOT
const materialized = fileURLToPath(new URL('../../../testdata/fake/', import.meta.url))
const candidate = typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : materialized

if (!existsSync(candidate)) {
  throw new Error([
    `DHR_25 fixture root not found: ${candidate}`,
    'Run these tests from the materialized pilot tree (materialize.ps1 copies this',
    'plugin into <pilot>/src/dsh-host, next to <pilot>/testdata/fake), or point',
    'RELAY_PILOT_FIXTURE_ROOT at the frozen fixture directory.',
  ].join('\n'))
}

export const FIXTURE_ROOT = candidate

/** The DHR_25 list fixture and the detail fixtures that ship beside it. */
export const LIST_FIXTURE = 'runs-active.json'
export const DETAIL_FIXTURES = [
  'run-basic.json',
  'run-blocked.json',
  'run-chinese.json',
  'run-empty.json',
  'run-status-matrix.json',
]

export const realConfig = (overrides = {}) => ({
  fixtureRoot: FIXTURE_ROOT,
  listFixture: LIST_FIXTURE,
  detailFixtures: DETAIL_FIXTURES,
  ...overrides,
})
