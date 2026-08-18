# DHR_26 DSH Relay Pilot Host

This tree-external Pilot package registers `ctx.relayPilot` through the public
Cordis `Service` seam. It reads the two frozen DHR_25 fixtures and returns the
parsed ordinary JSON without adding, removing, sorting, renaming, or deriving
fields.

Public service methods:

- `ctx.relayPilot.listRuns()` returns `relay.pilot-run-list/v1`.
- `ctx.relayPilot.inspectRun(runId?)` returns `relay.pilot-read-model/v1`.

Runtime inputs:

- `RELAY_PILOT_LIST_FIXTURE`: absolute path to the list fixture.
- `RELAY_PILOT_DETAIL_FIXTURE`: absolute path to the detail fixture.
- `RELAY_PILOT_PROBE=1`: enables the one-shot evidence probe. After the transcript has flushed, it requests bounded shutdown through `ctx.appExit`.
- `RELAY_PILOT_HOST_DISABLED=1`: disables the Host row through Cordis loader
  `disabled`, leaving the installed bundle intact.

Install into the isolated DHR_26 profile:

```powershell
$env:DSH_HOME = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\dsh-home'
dsh plugin --profile relay-pilot add .\src\dsh-host
dsh --profile relay-pilot --dump-config
$env:RELAY_PILOT_PROBE = '1'
dsh --profile relay-pilot
```

Uninstall and remove the bundle layer:

```powershell
dsh plugin --profile relay-pilot remove @dh-relay/dsh-relay-pilot-host
```

The package deliberately contains no Client bundle, no Relay write operation,
no DSH private Read Model type, and no status/group derivation.
