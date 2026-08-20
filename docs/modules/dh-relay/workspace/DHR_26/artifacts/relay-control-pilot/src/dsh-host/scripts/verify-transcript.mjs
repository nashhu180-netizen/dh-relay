import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { basename, join, resolve } from 'node:path'
import { canonicalJson, isPlainJson } from '../fixture-store.mjs'

/**
 * Check a captured probe transcript against the frozen DHR_25 fixtures on disk.
 *
 * The expected snapshot is rebuilt here, from the caller's fixture list, and the
 * whole thing is compared — every key, no exceptions. Two earlier versions were
 * weaker in ways that let a transcript vouch for itself:
 *
 *   1. The fixture list came out of the transcript, so emptying `details` and
 *      `diagnostics` made the per-detail checks vacuously true (round-2 P1).
 *   2. Only some fields took part in the verdict, so `schema_version`, the
 *      `detail-unlisted` diagnostics, the probe envelope and the probe's own
 *      derived hashes could all be tampered with and still read IDENTICAL
 *      (round-2 recheck P1).
 *
 * The rebuild deliberately does not call the Host's own loader: an oracle that
 * shares the code under test agrees with its bugs. It reads the same files and
 * applies the documented rules independently.
 *
 * usage:
 *   --transcript <file> --fixture-root <dir> --out <file>
 *   --expect-list <name> --expect-details <name[,name...]>
 */
const DETAIL_SCHEMA_VERSION = 'relay.pilot-read-model/v1'
const LIST_SCHEMA_VERSION = 'relay.pilot-run-list/v1'
const SNAPSHOT_SCHEMA_VERSION = 'relay.pilot-snapshot/v1'

function parseArgs(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (!key?.startsWith('--') || value === undefined) throw new Error('invalid arguments')
    result[key.slice(2)] = value
  }
  return result
}

const args = parseArgs(process.argv.slice(2))
for (const required of ['transcript', 'fixture-root', 'out', 'expect-list', 'expect-details']) {
  if (!args[required]) throw new Error(`missing --${required}`)
}

const fixtureRoot = resolve(args['fixture-root'])
// The Host records basenames in the snapshot even when configured with a path,
// so normalize the caller's names the same way before comparing.
const expectedListFixture = basename(args['expect-list'])
const expectedDetailFixtures = args['expect-details'].split(',').map(item => basename(item.trim())).filter(Boolean)
if (expectedDetailFixtures.length === 0) throw new Error('--expect-details must name at least one fixture')

const transcript = await readFile(resolve(args.transcript), 'utf8')
const lines = transcript.split(/\r?\n/)

const errorLine = lines.find(item => item.startsWith('[relay-pilot-probe-error] '))
if (errorLine) {
  process.stderr.write(`${errorLine}\n`)
  throw new Error('probe reported an error transcript')
}

const prefix = '[relay-pilot-probe] '
const matched = lines.filter(item => item.startsWith(prefix))
if (matched.length !== 1) throw new Error(`expected exactly one probe transcript line, found ${matched.length}`)
const payload = JSON.parse(matched[0].slice(prefix.length))
const snapshot = payload.snapshot ?? {}

const sha256 = value => createHash('sha256').update(canonicalJson(value)).digest('hex')
const same = (left, right) => canonicalJson(left) === canonicalJson(right)
const readFixture = async name => JSON.parse(await readFile(join(fixtureRoot, name), 'utf8'))

// ---- rebuild what the snapshot must be, from disk ----------------------------
const expectedList = await readFixture(expectedListFixture)
// null-prototype, because a run_id may legitimately be `__proto__` — the Host
// supports that and a plain object here would reject it.
const expectedDetails = Object.create(null)
for (const name of expectedDetailFixtures) {
  const model = await readFixture(name)
  if (Object.hasOwn(expectedDetails, model.run_id)) {
    throw new Error(`two expected detail fixtures share run_id ${model.run_id}`)
  }
  expectedDetails[model.run_id] = model
}

const listedRunIds = expectedList.runs.map(run => run.run_id)
const expectedMissing = listedRunIds.filter(runId => !Object.hasOwn(expectedDetails, runId))
const expectedUnlisted = Object.keys(expectedDetails).filter(runId => !listedRunIds.includes(runId))
const expectedDiagnostics = [
  ...expectedMissing.map(runId => ({ code: 'detail-missing', run_id: runId })),
  ...expectedUnlisted.map(runId => ({ code: 'detail-unlisted', run_id: runId })),
]
const expectedSnapshot = {
  schema_version: SNAPSHOT_SCHEMA_VERSION,
  fixture_hash: sha256({ list: expectedList, details: expectedDetails }),
  list_fixture: expectedListFixture,
  detail_fixtures: expectedDetailFixtures,
  diagnostics: expectedDiagnostics,
  list: expectedList,
  details: expectedDetails,
}

// ---- compare, key by key -----------------------------------------------------
const snapshotKeys = Object.keys(snapshot).sort()
const expectedKeys = Object.keys(expectedSnapshot).sort()
const keyChecks = {
  no_unexpected_keys: same(snapshotKeys, expectedKeys),
}
const fieldChecks = {}
for (const key of expectedKeys) {
  // diagnostics is an unordered set of facts; detail_fixtures preserves the
  // configured order and is compared verbatim (round-2 recheck-2, P1).
  const orderInsensitive = key === 'diagnostics'
  const left = orderInsensitive ? [...(snapshot[key] ?? [])].map(canonicalJson).sort() : snapshot[key]
  const right = orderInsensitive ? [...expectedSnapshot[key]].map(canonicalJson).sort() : expectedSnapshot[key]
  fieldChecks[key] = same(left, right)
}

// ---- the probe envelope has to hold up too -----------------------------------
const presentRunId = payload.detail_present_run_id
const missingRunId = payload.detail_missing_run_id
const envelopeChecks = {
  event: payload.event === 'relay-pilot-host-ready',
  service: payload.service === 'ctx.relayPilot',
  plain_json_claimed: payload.plain_json === true,
  plain_json_verified: isPlainJson(snapshot),
  fixture_hash_echo: payload.fixture_hash === expectedSnapshot.fixture_hash,
  list_fixture_echo: payload.list_fixture === expectedListFixture,
  detail_fixtures_echo: same([...(payload.detail_fixtures ?? [])].sort(), [...expectedDetailFixtures].sort()),
  diagnostics_echo: same(
    [...(payload.diagnostics ?? [])].map(canonicalJson).sort(),
    expectedDiagnostics.map(canonicalJson).sort(),
  ),
  list_schema: payload.list_schema === LIST_SCHEMA_VERSION,
  list_run_ids: same(payload.list_run_ids, listedRunIds),
  list_sha256: payload.list_sha256 === sha256(expectedList),
  // The probe must have exercised a run that really has a detail...
  present_run_is_really_present: Object.hasOwn(expectedDetails, presentRunId),
  present_schema: payload.detail_present_schema === DETAIL_SCHEMA_VERSION,
  present_sha256: Object.hasOwn(expectedDetails, presentRunId)
    && payload.detail_present_sha256 === sha256(expectedDetails[presentRunId]),
  // ...and one that really has none, and got null back for it.
  missing_run_is_really_missing: expectedMissing.includes(missingRunId),
  missing_returns_null: payload.detail_missing_returns_null === true,
}

// The envelope is closed too: an extra top-level key means the probe emitted
// something this verifier never looked at (round-2 recheck-2, P1).
const EXPECTED_PAYLOAD_KEYS = [
  'event', 'service', 'plain_json', 'fixture_hash', 'list_fixture', 'detail_fixtures',
  'list_schema', 'list_run_ids', 'list_sha256', 'diagnostics',
  'detail_present_run_id', 'detail_present_schema', 'detail_present_sha256',
  'detail_missing_run_id', 'detail_missing_returns_null', 'snapshot',
]
envelopeChecks.no_unexpected_payload_keys = same(
  Object.keys(payload).sort(),
  [...EXPECTED_PAYLOAD_KEYS].sort(),
)

const failed = [
  ...Object.entries(keyChecks),
  ...Object.entries(fieldChecks).map(([key, ok]) => [`snapshot.${key}`, ok]),
  ...Object.entries(envelopeChecks),
].filter(([, ok]) => ok !== true).map(([key]) => key)

const report = {
  result: failed.length === 0 ? 'IDENTICAL' : 'DIFF',
  failed_checks: failed,
  fixture_root: fixtureRoot,
  expected_list_fixture: expectedListFixture,
  expected_detail_fixtures: expectedDetailFixtures,
  expected_fixture_hash: expectedSnapshot.fixture_hash,
  transcript_fixture_hash: snapshot.fixture_hash ?? null,
  expected_missing_run_ids: expectedMissing,
  expected_unlisted_run_ids: expectedUnlisted,
  snapshot_key_check: keyChecks,
  snapshot_field_checks: fieldChecks,
  envelope_checks: envelopeChecks,
}

await writeFile(resolve(args.out), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
process.stdout.write(`RESULT: ${report.result}${failed.length ? ` (failed: ${failed.join(', ')})` : ''}\n`)
if (report.result !== 'IDENTICAL') process.exitCode = 1
