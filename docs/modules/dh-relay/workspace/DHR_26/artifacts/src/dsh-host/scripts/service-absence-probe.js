export const name = 'relay-pilot-service-absence-probe'

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

export function apply(ctx) {
  const appExit = ctx.get('appExit')
  if (typeof appExit !== 'function') {
    throw new Error('relay-pilot-absence-probe: DSH launcher did not provide ctx.appExit')
  }

  const timer = setTimeout(() => {
    void (async () => {
      try {
        const present = ctx.get('relayPilot') !== undefined
        await writeStdout(`[relay-pilot-absence-probe] ${JSON.stringify({ present })}\n`)
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
