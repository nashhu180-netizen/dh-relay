# @personal/dsh-relay-host

Tree-external, read-only Host plugin for the DHR_26 Pilot. It consumes the DHR_25 fixture directory and exposes `ctx.relayPilot` with four query methods: `fixtureHash()`, `listRuns()`, `getRun(runId)`, and `snapshot()`.

The package intentionally declares no npm dependency or peer copy of Cordis. DSH profile boot resolves the installation-owned `@deepseek-ai/cordis` through its maintained profile module fallback, avoiding a second framework identity inside the plugin tree.

The service returns detached plain JSON and deliberately registers no route, event, timer, process handler, or Relay write command. `group`, progress, status, nodes, and Attention values are carried from the frozen fixtures; the Host does not infer them.

## Local target-machine flow

```powershell
$env:DSH_HOME = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\dsh-home'
$env:RELAY_PILOT_FIXTURE_ROOT = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\testdata\fake'
Set-Location 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot'

node --test .\src\dsh-host\test\*.test.mjs
dsh plugin --profile web add .\src\dsh-host
dsh --profile web --patch .\src\dsh-host\probe.patch.yml
```

`dsh plugin` installs this package as a profile bundle, so do not also pass `cordis.patch.yml` during ordinary launch. Use `probe.patch.yml`, `disable.patch.yml`, and `enable.patch.yml` only as temporary overlays.
