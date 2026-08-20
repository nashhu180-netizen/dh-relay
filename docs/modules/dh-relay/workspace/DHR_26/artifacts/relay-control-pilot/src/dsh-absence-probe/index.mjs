// Same export shape as the Host's probes: no default, so the Cordis loader's
// `exports = exports.default ?? exports` keeps the namespace — and `name` with it.
// Imports nothing outside this file, so it resolves under either install shape.
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
 * Absence probe that lives in its own package.
 *
 * The Host ships an identical probe inside itself, which can only ever prove the
 * *disabled* state: after `dsh plugin remove @personal/dsh-relay-host` that copy
 * is gone too, and the boot fails with `Cannot find package` instead of
 * reporting absence (round-2 review, P1 — the removed state had no probe, only a
 * `--dump-config` line count).
 *
 * This copy is installed separately, so it survives the Host being removed and
 * can report on the removed profile directly. Exits 0 only when the service row
 * is gone; run it against an installed Host as a positive control.
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
          probe: 'out-of-package',
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
