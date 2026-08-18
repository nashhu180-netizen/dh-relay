import { createHash } from 'node:crypto'
import { isPlainJson } from './plain-json.js'

export const name = 'relay-pilot-probe'
export const inject = ['relayPilot']

function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function writeStdout(text) {
  return new Promise((resolve, reject) => {
    process.stdout.write(text, error => {
      if (error) reject(error)
      else resolve()
    })
  })
}

/** Read both models through ctx.relayPilot, emit one transcript, then exit cleanly under DSH. */
export async function apply(ctx) {
  const appExit = typeof ctx.get === 'function' ? ctx.get('appExit') : undefined
  if (typeof appExit !== 'function') {
    throw new Error('relay-pilot-probe: DSH launcher did not provide ctx.appExit')
  }

  const list = await ctx.relayPilot.listRuns()
  const detail = await ctx.relayPilot.inspectRun()
  const payload = {
    event: 'relay-pilot-host-ready',
    service: 'ctx.relayPilot',
    plain_json: isPlainJson(list) && isPlainJson(detail),
    list_schema: list.schema_version,
    detail_schema: detail.schema_version,
    list_sha256: hashJson(list),
    detail_sha256: hashJson(detail),
    list,
    detail,
  }
  await writeStdout(`[relay-pilot-probe] ${JSON.stringify(payload)}\n`)
  appExit(0)
}
