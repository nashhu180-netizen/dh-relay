// Same export shape as probe.mjs: no default, so the Cordis loader's
// `exports = exports.default ?? exports` keeps the namespace — and `name` with it.
export const name = 'relay-pilot-absence-probe'

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
  }
}

/**
 * Evidence overlay for the disable / remove path.
 *
 * It deliberately does not inject `relayPilot` — injecting would make Cordis
 * wait for the service instead of reporting its absence. It settles one tick
 * after activation, records whether the service row is present, and exits 0
 * only when it is gone.
 */
export function apply(ctx) {
  const appExit = typeof ctx.get === 'function' ? ctx.get('appExit') : undefined
  if (typeof appExit !== 'function') {
    throw new Error('relay-pilot-absence-probe: DSH launcher did not provide ctx.appExit')
  }

  const timer = setTimeout(() => {
    void (async () => {
      try {
        const present = ctx.get('relayPilot') !== undefined
        await writeStdout(`[relay-pilot-absence-probe] ${JSON.stringify({
          event: 'relay-pilot-absence-checked',
          present,
        })}\n`)
        appExit(present ? 1 : 0)
      } catch (error) {
        await writeStdout(`[relay-pilot-absence-probe-error] ${JSON.stringify({
          error: errorPayload(error),
        })}\n`)
        appExit(1)
      }
    })()
  }, 250)
  return () => clearTimeout(timer)
}
