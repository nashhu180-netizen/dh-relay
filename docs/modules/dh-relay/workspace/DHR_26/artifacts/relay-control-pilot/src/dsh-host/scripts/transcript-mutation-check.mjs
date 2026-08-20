import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

/**
 * Prove `verify-transcript.mjs` actually catches a doctored transcript.
 *
 * A verifier is only worth its verdict if a tampered input turns it red. Two
 * successive review rounds found places where it did not: first an empty detail
 * set passed vacuously, then whole classes of field (schema versions, unlisted
 * diagnostics, the probe envelope, the probe's own derived hashes) took no part
 * in the verdict at all. Each mutant below is one of those classes.
 *
 * The real transcript must read IDENTICAL; every mutant must read DIFF.
 *
 * usage:
 *   node scripts/transcript-mutation-check.mjs --transcript <file>
 *     --fixture-root <dir> --expect-list <name> --expect-details <a,b,c>
 *     [--out <file>]
 */
const scriptDir = dirname(fileURLToPath(import.meta.url))
const verifier = join(scriptDir, 'verify-transcript.mjs')

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
for (const required of ['transcript', 'fixture-root', 'expect-list', 'expect-details']) {
  if (!args[required]) throw new Error(`missing --${required}`)
}

const PREFIX = '[relay-pilot-probe] '
const original = readFileSync(resolve(args.transcript), 'utf8')
const line = original.split(/\r?\n/).find(item => item.startsWith(PREFIX))
if (!line) throw new Error('no probe transcript line found')
const basePayload = JSON.parse(line.slice(PREFIX.length))
const clone = () => JSON.parse(JSON.stringify(basePayload))

const MUTANTS = [
  {
    name: 'details, detail_fixtures and diagnostics all emptied',
    mutate: p => { p.snapshot.details = {}; p.snapshot.detail_fixtures = []; p.snapshot.diagnostics = [] },
  },
  { name: 'fixture_hash replaced', mutate: p => { p.snapshot.fixture_hash = '0'.repeat(64) } },
  {
    name: 'one detail field tampered',
    mutate: p => {
      const runId = Object.keys(p.snapshot.details)[0]
      p.snapshot.details[runId].run_status = 'tampered'
    },
  },
  {
    name: 'detail-unlisted diagnostics dropped',
    mutate: p => { p.snapshot.diagnostics = p.snapshot.diagnostics.filter(item => item.code !== 'detail-unlisted') },
  },
  {
    name: 'detail_missing_run_id points at a run that does have a detail',
    mutate: p => { p.detail_missing_run_id = p.detail_present_run_id },
  },
  { name: 'snapshot.schema_version changed', mutate: p => { p.snapshot.schema_version = 'relay.pilot-snapshot/v2' } },
  { name: 'probe envelope service renamed', mutate: p => { p.service = 'ctx.somethingElse' } },
  { name: 'list_sha256 tampered', mutate: p => { p.list_sha256 = '0'.repeat(64) } },
  {
    name: 'an extra run smuggled into details',
    mutate: p => {
      p.snapshot.details['fake-run-9999'] = { schema_version: 'relay.pilot-read-model/v1', run_id: 'fake-run-9999' }
    },
  },
  { name: 'detail_missing_returns_null flipped to false', mutate: p => { p.detail_missing_returns_null = false } },
  { name: 'an unplanned key added to the probe envelope', mutate: p => { p.extra_field = 'smuggled' } },
  {
    name: 'detail_fixtures reordered',
    mutate: p => { p.snapshot.detail_fixtures = [...p.snapshot.detail_fixtures].reverse() },
  },
]

const dir = mkdtempSync(join(tmpdir(), 'relay-transcript-'))
const runVerifier = (transcriptPath, outPath) => spawnSync(process.execPath, [
  verifier,
  '--transcript', transcriptPath,
  '--fixture-root', resolve(args['fixture-root']),
  '--expect-list', args['expect-list'],
  '--expect-details', args['expect-details'],
  '--out', outPath,
], { encoding: 'utf8' })

const lines = [`# transcript mutation check — 1 control + ${MUTANTS.length} mutants`, '']
let holes = 0

try {
  const control = runVerifier(resolve(args.transcript), join(dir, 'control.json'))
  const controlOk = control.status === 0 && control.stdout.includes('IDENTICAL')
  if (!controlOk) holes += 1
  lines.push(`${controlOk ? 'CONTROL ok  ' : 'CONTROL FAIL'} real transcript -> ${control.stdout.trim() || control.stderr.trim()}`)
  lines.push('')

  for (const [index, mutant] of MUTANTS.entries()) {
    const payload = clone()
    mutant.mutate(payload)
    const path = join(dir, `mutant-${index}.txt`)
    writeFileSync(path, `${PREFIX}${JSON.stringify(payload)}\n`, 'utf8')
    const run = runVerifier(path, join(dir, `mutant-${index}.json`))
    const red = run.status !== 0 && run.stdout.includes('DIFF')
    if (!red) holes += 1
    const failed = (run.stdout.match(/\(failed: (.+)\)/) ?? [])[1] ?? '—'
    lines.push(`${red ? 'BITES  ' : 'HOLE   '} ${mutant.name}`)
    lines.push(`         failed checks: ${failed}`)
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}

lines.push('', holes === 0
  ? `RESULT: CONTROL PASSED AND ALL ${MUTANTS.length} MUTANTS CAUGHT`
  : `RESULT: ${holes} PROBLEM(S) — see HOLE / CONTROL FAIL rows above`)

const text = `${lines.join('\n')}\n`
process.stdout.write(text)
if (args.out) writeFileSync(resolve(args.out), text, 'utf8')
if (holes > 0) process.exitCode = 1
