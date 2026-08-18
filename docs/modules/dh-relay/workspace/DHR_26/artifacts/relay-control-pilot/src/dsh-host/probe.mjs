export const inject = ['relayPilot']

/** One-shot activation transcript for DHR_26 machine evidence. */
export function apply(ctx) {
  const snapshot = ctx.relayPilot.snapshot()
  process.stdout.write(`[relay-pilot-probe] ${JSON.stringify(snapshot)}\n`)
}

export default apply
