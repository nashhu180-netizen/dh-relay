import { RelayPilotRepository } from './fixture-store.mjs'
import { LiveRelayPilotRepository } from './live-store.mjs'

export { RelayPilotFixtureError, RelayPilotRepository } from './fixture-store.mjs'
export { LiveRelayPilotRepository, LIVE_SOURCE_KIND } from './live-store.mjs'

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
 * 选数据源：给了 `repoRoot`（或 `RELAY_PILOT_REPO_ROOT`）就走活数据，否则走 fixture。
 *
 * fixture 那条路**一个字没改**——DHR_26/DHR_49 的四轮转录、`fixture_hash` 基线、以及
 * `test/` 下的既有用例全靠它，换掉就等于把那些证据一并作废。活数据是**新增的一条路**，
 * 不是替换。
 *
 * 活模式下仓库的连接是异步的，而 `apply()` 与五个方法都必须同步：所以这里只**起**它，
 * 不等它——`LiveRelayPilotRepository` 起手就持有一份合法的空快照 + `live-connecting`
 * 诊断，面板在连上之前拿到的也是合规模型，不会看到 undefined。
 */
function createRepository(config) {
  const repoRoot = nonEmpty(config.repoRoot) ?? nonEmpty(process.env.RELAY_PILOT_REPO_ROOT)
  if (repoRoot !== undefined) {
    const live = new LiveRelayPilotRepository({
      repoRoot,
      // DSH 里走 spawn sidecar：插件不许 import relay-core（本包安装拓扑契约，见
      // live-store.mjs 的说明），所以按绝对路径起 adapters/dsh-bridge/snapshot-main.mjs。
      relayCoreRoot: nonEmpty(config.relayCoreRoot) ?? nonEmpty(process.env.RELAY_PILOT_RELAY_CORE),
      // 注入式 connect 只给测试/探针用——profile 传不了函数。
      connect: typeof config.connect === 'function' ? config.connect : undefined,
      credentialRoot: nonEmpty(config.credentialRoot) ?? nonEmpty(process.env.RELAY_PILOT_CREDENTIAL_ROOT),
    })
    void live.start()
    return live
  }

  const listFixture = nonEmpty(config.listFixture) ?? nonEmpty(process.env.RELAY_PILOT_LIST_FIXTURE)
  if (listFixture === undefined) {
    throw new Error('relay-pilot-config: listFixture or RELAY_PILOT_LIST_FIXTURE is required'
      + ' (or set repoRoot / RELAY_PILOT_REPO_ROOT for live mode)')
  }
  return new RelayPilotRepository({
    fixtureRoot: nonEmpty(config.fixtureRoot) ?? nonEmpty(process.env.RELAY_PILOT_FIXTURE_ROOT),
    listFixture,
    detailFixtures: fixtureListConfig(config.detailFixtures, process.env.RELAY_PILOT_DETAIL_FIXTURES),
  })
}

/**
 * Build the read-only query surface published as `ctx.relayPilot`.
 *
 * Exported separately so the boundary can be tested without a Cordis context.
 * Every method returns detached plain JSON; the repository owns the frozen
 * snapshot and hands out clones.
 */
export function createRelayPilotApi(config = {}) {
  const repository = createRepository(config)

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
