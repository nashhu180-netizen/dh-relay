export const name = 'relay-pilot-service-absence-probe'

function writeStdout(text) {
  return new Promise((resolve, reject) => {
    process.stdout.write(text, error => {
      if (error) reject(error)
      else resolve()
    })
  })
}

export function apply(ctx) {
  const timer = setTimeout(() => {
    void (async () => {
      const appExit = ctx.get('appExit')
      if (typeof appExit !== 'function') {
        throw new Error('relay-pilot-absence-probe: DSH launcher did not provide ctx.appExit')
      }
      const present = ctx.get('relayPilot') !== undefined
      await writeStdout(`[relay-pilot-absence-probe] ${JSON.stringify({ present })}\n`)
      appExit(present ? 1 : 0)
    })()
  }, 250)
  return () => clearTimeout(timer)
}
