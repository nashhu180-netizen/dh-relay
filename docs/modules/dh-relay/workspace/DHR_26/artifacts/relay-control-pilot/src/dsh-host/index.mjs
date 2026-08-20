import { RelayPilotRepository } from './fixture-store.mjs'

export { RelayPilotFixtureError, RelayPilotRepository } from './fixture-store.mjs'

// This module imports nothing outside its own directory — deliberately.
//
// An earlier version did `import { Service } from '@deepseek-ai/cordis'` and let
// DSH's profile module fallback resolve it. That only works when the package is
// physically copied into the profile tree: Node resolves a module's bare imports
// by walking up from its **real** path, so a `dsh plugin add <source-dir>` install
// — which records a `link:` dependency and symlinks the profile entry at the
// source tree — never reaches `profiles/node_modules/@deepseek-ai/cordis`, and
// boot fails with `Cannot find package '@deepseek-ai/cordis'`.
//
// Cordis' own `Service` base class does nothing here that `ctx.provide` does not:
// its constructor is `ctx.reflect.provide(name, self, check)`, and `provide` is
// mixed onto the context as public API (`mixin('reflect', [... 'provide' ...])`)
// — DSH registers its own `appExit` the same way. `provide` wraps registration in
// `ctx.fiber.effect(...)`, so the service row is torn down when the plugin
// unloads, exactly as a Service subclass would be.
//
// With no bare import left, the plugin resolves from any location and both
// install shapes work.
export const name = 'relay-pilot-host'

function nonEmpty(value) {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function fixtureListConfig(value, envValue) {
  if (Array.isArray(value)) return value
  return nonEmpty(value) ?? nonEmpty(envValue) ?? []
}

/**
 * Build the read-only query surface published as `ctx.relayPilot`.
 *
 * Exported separately so the boundary can be tested without a Cordis context.
 * Every method returns detached plain JSON; the repository owns the frozen
 * snapshot and hands out clones.
 */
export function createRelayPilotApi(config = {}) {
  const listFixture = nonEmpty(config.listFixture) ?? nonEmpty(process.env.RELAY_PILOT_LIST_FIXTURE)
  if (listFixture === undefined) {
    throw new Error('relay-pilot-config: listFixture or RELAY_PILOT_LIST_FIXTURE is required')
  }
  const repository = new RelayPilotRepository({
    fixtureRoot: nonEmpty(config.fixtureRoot) ?? nonEmpty(process.env.RELAY_PILOT_FIXTURE_ROOT),
    listFixture,
    detailFixtures: fixtureListConfig(config.detailFixtures, process.env.RELAY_PILOT_DETAIL_FIXTURES),
  })

  return {
    fixtureHash: () => repository.fixtureHash(),
    /** Non-fatal load notes: listed runs without a detail, details outside the list. */
    diagnostics: () => repository.diagnostics(),
    listRuns: () => repository.listRuns(),
    /** The detail model, or `null` when this run has no detail fixture. */
    getRun: runId => repository.getRun(runId),
    snapshot: () => repository.snapshot(),
  }
}

/**
 * Read-only DSH Host plugin for the P4 Pilot.
 *
 * Which fixtures it reads is named entirely by config: `listFixture` plus an
 * explicit `detailFixtures` list, both resolved against the optional
 * `fixtureRoot`. Nothing is discovered by scanning a directory.
 *
 * The boundary deliberately exposes only detached JSON values. It registers no
 * routes, events, timers, process handlers, or Relay write commands; the service
 * row is owned by the fiber and released when the plugin unloads.
 */
export function apply(ctx, config = {}) {
  ctx.provide('relayPilot', createRelayPilotApi(config))
}
