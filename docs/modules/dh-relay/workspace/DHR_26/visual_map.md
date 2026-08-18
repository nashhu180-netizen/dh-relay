# visual_map · DHR_26

```text
DHR_25 frozen fixtures
  relay.pilot-run-list/v1
  relay.pilot-read-model/v1
           |
           | UTF-8 read + JSON.parse + schema guard
           v
@dh-relay/dsh-relay-pilot-host
  ctx.relayPilot.listRuns()
  ctx.relayPilot.inspectRun(runId?)
           |
           | ordinary JSON, no derivation
           v
DSH isolated profile: relay-pilot
  <experiment-root>\dsh-home\
           |
           +--> probe transcript --> ctx.appExit(0)
           +--> disabled check --> present=false
           +--> uninstall check --> present=false
           +--> client reconnaissance --> DHR_49 facts
```

## 证据流

```text
B-10 rc.6 pre-capture
       + fresh rc.6 snapshot when available
       + rc.7 after snapshot
       + package diff
       + profile install/config transcript
       + host probe transcript and IDENTICAL report
       + disable/uninstall absence transcripts
       + client-recon.json
       = DHR_26 runtime evidence packet
```
