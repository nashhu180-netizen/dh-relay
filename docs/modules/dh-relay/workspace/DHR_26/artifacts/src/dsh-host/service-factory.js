import { FixtureStore } from './fixture-store.js'

/**
 * Build the Cordis service class around an injected Service base.
 * The factory keeps the adapter unit-testable without bundling Cordis.
 */
export function createRelayPilotService(ServiceBase) {
  return class RelayPilotService extends ServiceBase {
    constructor(ctx, config = {}) {
      super(ctx, 'relayPilot')
      this.store = new FixtureStore(config)
    }

    /** Return the frozen Pilot list Read Model with no secondary derivation. */
    listRuns() {
      return this.store.readList()
    }

    /** Return the frozen Pilot detail Read Model with no secondary derivation. */
    async inspectRun(runId) {
      const detail = await this.store.readDetail()
      if (runId !== undefined && runId !== detail.run_id) {
        throw new RangeError(`relay-pilot-host: fixture does not contain run ${String(runId)}`)
      }
      return detail
    }
  }
}
