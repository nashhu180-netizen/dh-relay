import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { apply, name as pluginName } from '../index.mjs'

/**
 * Prove the service row is really torn down when the plugin unloads.
 *
 * Round-2 review, P1: the disable/enable evidence only ever showed the service
 * *never registered* (the Host boots with `disabled: true`, so `apply` does not
 * run at all). It could not show that an already-registered `ctx.relayPilot` is
 * cleaned up on unload — which is exactly what DM4a asks for.
 *
 * This probe runs the real Cordis from the installed DSH tree, applies the Host
 * plugin, reads the live service, disposes the fiber, and reads again. It is an
 * operator-side collector, not part of the shipped package: the runtime files
 * still import nothing outside this directory.
 *
 * usage:
 *   --cordis <path to @deepseek-ai/cordis lib/index.js>
 *   --fixture-root <dir> --list-fixture <name> --detail-fixtures <name[,name...]>
 *   --out <file>
 */
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
for (const required of ['cordis', 'fixture-root', 'list-fixture', 'detail-fixtures', 'out']) {
  if (!args[required]) throw new Error(`missing --${required}`)
}

const cordisPath = resolve(args.cordis)
const { Context } = await import(pathToFileURL(cordisPath).href)
if (typeof Context !== 'function') throw new Error(`no Context export in ${cordisPath}`)

const config = {
  fixtureRoot: resolve(args['fixture-root']),
  listFixture: args['list-fixture'],
  detailFixtures: args['detail-fixtures'].split(',').map(item => item.trim()).filter(Boolean),
}

const ctx = new Context()
const readService = () => ctx.get('relayPilot')

const beforeApply = readService() === undefined
const fiber = ctx.plugin({ apply, name: pluginName }, config)
await fiber

const live = readService()
const afterApply = live !== undefined
// The live service must answer, and answer with the frozen fixture data.
const sampleHash = afterApply ? live.fixtureHash() : null
const sampleRunCount = afterApply ? live.listRuns().runs.length : null

await fiber.dispose()
// Cordis releases effects asynchronously; settle one macrotask before reading.
await new Promise(done => setTimeout(done, 250))
const afterDispose = readService() === undefined

const report = {
  probe: 'relay-pilot-service-lifecycle',
  cordis: cordisPath,
  plugin: pluginName,
  absent_before_apply: beforeApply,
  present_after_apply: afterApply,
  fixture_hash_while_live: sampleHash,
  run_count_while_live: sampleRunCount,
  absent_after_dispose: afterDispose,
}
report.result = beforeApply && afterApply && afterDispose ? 'CLEANED' : 'LEAKED'

await writeFile(resolve(args.out), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
process.stdout.write(`[relay-pilot-lifecycle-probe] ${JSON.stringify(report)}\n`)
if (report.result !== 'CLEANED') process.exitCode = 1
