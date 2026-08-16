# Relay host loop v1

`relay-host.ps1` is the deterministic host around the Runner. The Runner remains
the only writer of relay state, authority, receipts, final results, and events.

Each tick performs these steps in order:

1. ingest launched-attempt `checkpoint.json.tmp` and `result.json.tmp` files;
2. rename every attempted input to `.consumed-<ticks>`, including rejections;
3. ingest sorted `inbox/proposal-*.json` candidates through Runner CAS;
4. run one Runner tick, then launch every ready node through the adapter;
5. invoke the replanner once per authority generation when required;
6. invoke the orchestrator once when the run has no active plan;
7. evaluate the terminal condition and emit one `[relay-host] tick=...` line.

The worker entry injects receipt-derived paths and launches `claude` or `codex`.
Use `relay-agent-tool.ps1 checkpoint|result|propose` to write worker-owned inputs.
Structured inputs use a partial file followed by an atomic rename. Result writes
the validated handoff and sanitized, bounded session tail first.

`Export-RelayTimeline`, `Save-RelayScreenshot`, and `Copy-RelayEvidence` produce
the evidence package used by the real dogfood wrapper (`plans/` is copied,
`attempts/` is not). `Save-RelayScreenshot` captures only `RELAY:*` windows via
`PrintWindow` (never the whole desktop — other windows are private), stacking
several relay windows into one PNG; the `*.windows.txt` next to it lists only
`RELAY:*` titles plus a total count.
Tick cadence defaults to five seconds because a real psmux probe can take
several seconds; offline tests inject a clock and use no real terminal.

Exit codes come from `Get-RelayHostOutcome`: `0` = done and every node
succeeded, `3` = done but some node is paused/blocked (e.g. launch-failed —
"nothing left to do" is not success), `2` = MaxTicks reached. `run-dogfood.ps1`
uses the same function, retries the stop of a succeeded session up to three
times, and lists sessions it could not confirm stopped.

This layer does not interpret terminal conversation, provide an input channel,
change Runner state directly, or implement a general workflow engine.
