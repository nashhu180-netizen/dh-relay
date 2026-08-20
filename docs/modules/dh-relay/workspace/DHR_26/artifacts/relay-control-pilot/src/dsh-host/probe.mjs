import { createHash } from 'node:crypto'
import { canonicalJson, isPlainJson } from './fixture-store.mjs'

// Cordis' loader runs `exports = exports.default ?? exports` before applying a
// plugin, so a `export default apply` here would replace the module namespace
// with a bare function and silently drop `inject`. This module therefore
// exports no default: the namespace itself is the plugin object.
export const name = 'relay-pilot-probe'
export const inject = ['relayPilot']

function sha256(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function writeStdout(text) {
  return new Promise((resolve, reject) => {
    process.stdout.write(text, error => {
      if (error) reject(error)
      else resolve()
    })
  })
}

function errorPayload(error) {
  return {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    code: error?.code ?? null,
  }
}

/**
 * One-shot activation transcript for DHR_26 machine evidence.
 *
 * Reads everything through `ctx.relayPilot`, records both the present-detail and
 * the missing-detail path, then hands the process back to the launcher through
 * `ctx.appExit` so a headless boot terminates instead of idling.
 */
export async function apply(ctx) {
  const appExit = typeof ctx.get === 'function' ? ctx.get('appExit') : undefined
  if (typeof appExit !== 'function') {
    throw new Error('relay-pilot-probe: DSH launcher did not provide ctx.appExit')
  }

  try {
    const snapshot = await ctx.relayPilot.snapshot()
    const list = await ctx.relayPilot.listRuns()
    const diagnostics = await ctx.relayPilot.diagnostics()

    const missingRunIds = diagnostics.filter(item => item.code === 'detail-missing').map(item => item.run_id)
    const withDetail = list.runs.map(run => run.run_id).find(runId => !missingRunIds.includes(runId))
    const withoutDetail = missingRunIds[0]

    const sampleDetail = withDetail === undefined ? null : await ctx.relayPilot.getRun(withDetail)
    const missingDetail = withoutDetail === undefined ? undefined : await ctx.relayPilot.getRun(withoutDetail)

    const payload = {
      event: 'relay-pilot-host-ready',
      service: 'ctx.relayPilot',
      plain_json: isPlainJson(snapshot) && isPlainJson(list),
      fixture_hash: snapshot.fixture_hash,
      list_fixture: snapshot.list_fixture,
      detail_fixtures: snapshot.detail_fixtures,
      list_schema: list.schema_version,
      list_run_ids: list.runs.map(run => run.run_id),
      list_sha256: sha256(list),
      diagnostics,
      detail_present_run_id: withDetail ?? null,
      detail_present_schema: sampleDetail?.schema_version ?? null,
      detail_present_sha256: sampleDetail === null ? null : sha256(sampleDetail),
      detail_missing_run_id: withoutDetail ?? null,
      // The degrade contract: a listed run with no detail fixture reads back as
      // null instead of taking the plugin tree down at load time.
      detail_missing_returns_null: withoutDetail === undefined ? null : missingDetail === null,
      snapshot,
    }
    await writeStdout(`[relay-pilot-probe] ${JSON.stringify(payload)}\n`)
    appExit(0)
  } catch (error) {
    await writeStdout(`[relay-pilot-probe-error] ${JSON.stringify({
      event: 'relay-pilot-host-error',
      service: 'ctx.relayPilot',
      error: errorPayload(error),
    })}\n`)
    appExit(1)
  }
}
