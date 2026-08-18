import { Service } from '@deepseek-ai/cordis'
import { RelayPilotRepository } from './fixture-store.mjs'

export { RelayPilotFixtureError, RelayPilotRepository } from './fixture-store.mjs'

function nonEmpty(value) {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * Read-only DSH Host service for the P4 Pilot.
 *
 * The boundary deliberately exposes only detached JSON values. It registers no
 * routes, events, timers, process handlers, or Relay write commands; Cordis owns
 * its lifecycle through the service row.
 */
export class RelayPilotService extends Service {
  constructor(ctx, config = {}) {
    super(ctx, 'relayPilot')
    const fixtureRoot = nonEmpty(config.fixtureRoot) ?? nonEmpty(process.env.RELAY_PILOT_FIXTURE_ROOT)
    if (fixtureRoot === undefined) {
      throw new Error('relay-pilot-config: fixtureRoot or RELAY_PILOT_FIXTURE_ROOT is required')
    }
    this.repository = new RelayPilotRepository({
      fixtureRoot,
      listFixture: nonEmpty(config.listFixture) ?? nonEmpty(process.env.RELAY_PILOT_LIST_FIXTURE),
    })
  }

  fixtureHash() { return this.repository.fixtureHash() }
  listRuns() { return this.repository.listRuns() }
  getRun(runId) { return this.repository.getRun(runId) }
  snapshot() { return this.repository.snapshot() }
}

export default RelayPilotService
