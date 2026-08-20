# @personal/dsh-relay-host

Tree-external, read-only Host plugin for the DHR_26 Pilot. It consumes the DHR_25 frozen fixtures and exposes `ctx.relayPilot` with five query methods: `fixtureHash()`, `diagnostics()`, `listRuns()`, `getRun(runId)`, and `snapshot()`.

**No runtime file imports anything outside this package** — not even Cordis. The plugin is applied as `apply(ctx, config)` and publishes its service with `ctx.provide('relayPilot', api)`, the same public context API DSH uses for its own `appExit`. Cordis' `Service` base class does nothing more here: its constructor is `ctx.reflect.provide(name, self, check)`, and `provide` wraps registration in `ctx.fiber.effect(...)`, so the service row is released when the plugin unloads either way.

This is what keeps the "no second framework identity" property honest under every install shape. An earlier version imported `Service` from `@deepseek-ai/cordis` and let DSH's profile module fallback resolve it — which silently required the package to be physically copied into the profile tree, and broke on a source-directory install (see below).

The service returns detached plain JSON and deliberately registers no route, event, timer, process handler, or Relay write command. `group`, progress, status, nodes, and Attention values are carried from the frozen fixtures; the Host does not infer them.

## Fixtures are named, never discovered

`cordis.patch.yml` names one `listFixture` and an explicit `detailFixtures` array, both resolved against `fixtureRoot`. The plugin does not scan the fixture directory and does not pick a list for you, so what it reads is a property of the config — dropping a file into the fixture root changes nothing.

Config keys, each with an environment fallback used when the key is absent:

| config | env fallback | required |
|---|---|---|
| `fixtureRoot` | `RELAY_PILOT_FIXTURE_ROOT` | no (relative paths otherwise resolve against cwd) |
| `listFixture` | `RELAY_PILOT_LIST_FIXTURE` | **yes** |
| `detailFixtures` | `RELAY_PILOT_DETAIL_FIXTURES` | no (defaults to none) |

`detailFixtures` accepts a YAML array, a JSON array string, or a string separated by newlines or the platform path delimiter.

## Missing details degrade, they do not fail the boot

Upstream, the DHR_25 list and detail fixtures are independent sample sets: `runs-active.json` lists `fake-run-0006` and `fake-run-0007`, which have no detail file, while `run-empty.json` and `run-status-matrix.json` describe runs the list does not carry. That is normal, not corruption.

So the Host loads either way and records what it found in `snapshot.diagnostics`:

- `detail-missing` — a listed run with no detail fixture. It stays in `listRuns()`; `getRun()` returns `null` and the Client shows "no detail" for that one run.
- `detail-unlisted` — a detail fixture for a run outside the list. It stays reachable through `getRun()`.

Nothing is cross-checked between the two models and no field is derived from the other side. An earlier version required every listed run to have a detail and threw at load time; against the real fixtures that took the entire DSH plugin tree down.

## Local target-machine flow

```powershell
$env:DSH_HOME = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\dsh-home'
$env:RELAY_PILOT_FIXTURE_ROOT = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\testdata\fake'
Set-Location 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot'

node --test .\src\dsh-host\test\*.test.mjs

# Either install shape works. The source directory keeps the edit-and-restart loop.
dsh plugin --profile web add .\src\dsh-host
dsh --profile web --patch .\src\dsh-host\probe.patch.yml
```

> `cordis.patch.yml` resolves `fixtureRoot` from `RELAY_PILOT_FIXTURE_ROOT` **at boot**, not at install time. Launch without it and the Host fails fast with `fixture-read-failed: cannot read <cwd>\runs-active.json` and takes the plugin tree down — by design (fail-closed, no directory guessing), but it means every probe run must export the variable, not just the install step.

To install a packed copy instead — for a machine that should not depend on the source tree staying put:

```powershell
npm pack .\src\dsh-host --pack-destination .\.pack
dsh plugin --profile web add .\.pack\personal-dsh-relay-host-0.0.0-pilot.2.tgz
$plugin = "$env:DSH_HOME\profiles\web\node_modules\@personal\dsh-relay-host"
dsh --profile web --patch "$plugin\probe.patch.yml"
```

Both shapes were verified to produce a byte-identical probe transcript. They differ only in where the plugin lives: a source-directory install records a `link:` dependency and symlinks the profile entry at the source tree, so edits take effect on the next boot without repacking — but the directory must not move. A tarball install copies a real package into the profile.

> **Why zero bare imports matters here.** Node resolves a module's bare specifiers by walking up from its **real** path. Under a `link:` install that path is the source tree, which never reaches the profile's `node_modules/@deepseek-ai/cordis` fallback farm — so a single `import ... from '@deepseek-ai/cordis'` made boot fail with `Cannot find package '@deepseek-ai/cordis'`, while the same code installed as a tarball worked. Keeping every runtime import relative or `node:`-prefixed removes the dependency on install topology entirely. `test/package-contract.test.mjs` enforces it.
>
> **Do not interrupt the first boot into a fresh `DSH_HOME`.** It builds the profile's symlink farm; an interrupted build leaves a plain empty directory under `profiles/node_modules/`, and every later boot hard-fails with `exists and is not a symlink` without self-healing. Recovery is to delete `profiles/node_modules/` entirely and boot again; `profiles/<name>/` and the installed plugin survive. Budget generously: the `web` profile took about 5.5 minutes here, several times longer than a `dsh-base`-only profile.

The tests read the real DHR_25 fixtures. They resolve them from `RELAY_PILOT_FIXTURE_ROOT`, or from `../../../testdata/fake` relative to this directory once `materialize.ps1` has copied the plugin into `<pilot>/src/dsh-host`. A missing fixture root is a hard failure, not a skip.

`dsh plugin` installs this package as a profile bundle, so do not also pass `cordis.patch.yml` during ordinary launch. Use `probe.patch.yml`, `absence.patch.yml`, `disable.patch.yml`, and `enable.patch.yml` only as temporary overlays.

## Probes

Both probes export `apply`/`inject`/`name` as named exports and **no default**. Cordis' loader runs `exports = exports.default ?? exports` before applying a plugin, so `export default apply` would replace the module namespace with a bare function and silently drop `inject` — the probe then fails with `cannot get property "relayPilot" without inject`. `test/probe.test.mjs` pins this by running the loader's own unwrap logic against the module.

Both probes also request process exit through the launcher-provided `ctx.appExit`, so a headless boot terminates instead of idling.

- `probe.patch.yml` — reads list and details through the service, prints one `[relay-pilot-probe] <json>` transcript, exits 0.
- `absence.patch.yml` — pairs with `disable.patch.yml` to prove the service row is absent when the Host is disabled; run it against `enable.patch.yml` too, as a positive control that it is not simply always reporting absence.

`absence-probe.mjs` ships **inside** this package, so it cannot outlive a `dsh plugin remove` — after removal the boot fails with `Cannot find package '@personal/dsh-relay-host'`. It therefore answers for the *disabled* state only.

**For the removed state, install the sibling package `../dsh-absence-probe`** (`@personal/dsh-relay-absence-probe`). It carries the same probe outside this package, so it survives the Host being removed and reports absence directly instead of leaving `--dump-config` line counts as the only evidence.

## Evidence collectors

`scripts/` holds the operator-side collectors. None is imported by the runtime and none ships in the package.

| collector | what it collects |
|---|---|
| `scripts/snapshot-dsh.mjs` | the installed DSH package closure, versions, and install layout |
| `scripts/compare-snapshots.mjs` | the diff between two such snapshots (e.g. rc.6 → rc.7) |
| `scripts/verify-transcript.mjs` | a captured probe transcript checked field-by-field against the fixtures on disk, including the degrade contract. The expected fixture set is passed in (`--expect-list`, `--expect-details`) and never read out of the transcript, so a transcript cannot vouch for its own completeness; the hash is recomputed from disk |
| `scripts/service-lifecycle-probe.mjs` | applies this plugin under the real Cordis from the installed DSH tree, reads the live service, disposes the fiber, and asserts `ctx.relayPilot` is gone — the register-then-unload evidence the disable overlay cannot give |
| `absence-probe.mjs` | a plugin rather than a script: the disable/remove evidence overlay described above |
