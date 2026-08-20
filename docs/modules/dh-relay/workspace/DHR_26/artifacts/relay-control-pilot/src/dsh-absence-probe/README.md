# @personal/dsh-relay-absence-probe

A one-file Cordis plugin that reports whether `ctx.relayPilot` is present, then
exits: 0 when the service row is gone, 1 when it is still there.

It exists as a separate package for one reason: the Host ships the same probe
inside itself, and after `dsh plugin remove @personal/dsh-relay-host` that copy
is removed along with the Host, so the boot fails with `Cannot find package`
rather than reporting absence. Installed on its own, this copy survives and can
answer for the removed profile.

```powershell
$env:DSH_HOME = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\dsh-home'
dsh plugin --profile web add .\src\dsh-absence-probe

# positive control: Host installed -> present:true, exit 1
dsh --profile web --patch .\src\dsh-absence-probe\absence.patch.yml

dsh plugin --profile web remove @personal/dsh-relay-host
# removed state: probe survives -> present:false, exit 0
dsh --profile web --patch .\src\dsh-absence-probe\absence.patch.yml
```

It declares no `dsh.bundle.patch`, so installing it does not add it to the
profile's bundle list; it only loads when named by a `--patch` overlay.
