# @personal/dsh-relay-client

Tree-external DSH Web Client package for DHR_49. Its Node half exposes the DHR_26 `ctx.relayPilot` snapshot through a read-only same-origin endpoint; its browser half occupies `sidebar.footer.action` and renders the frozen list and detail Read Models.

The build is intentionally dependency-free: `node scripts/build.mjs` wraps the browser factory in the rc.7 `window.__ModuleLoader__.load({ id, factory })` contract. React is resolved from DSH's platform module table at runtime. No DSH monorepo checkout or private runtime import is required.

## Required order

```powershell
$env:DSH_HOME = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\dsh-home'
$env:RELAY_PILOT_FIXTURE_ROOT = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\testdata\fake'
Set-Location 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot'

node .\src\dsh-client\scripts\verify-build.mjs
node --test .\src\dsh-client\test\*.test.mjs
dsh plugin --profile web add .\src\dsh-host
dsh plugin --profile web add .\src\dsh-client
dsh --profile web
```

Open the Web URL printed by DSH, then select **Relay Pilot** at the sidebar foot. The list screen groups only by source `group`; selecting a run opens its detail screen. Refresh and a full DSH restart fetch the same frozen snapshot again.
