# dh-relay v1 contracts

This directory freezes the P1 `relay/v1` contract defined by
`docs/modules/dh-relay/design/01-产品设计与验收.md` §3.

- `relay-params.psd1` is the unique frozen point for the schema version,
  session-tail byte limit, probe threshold, and stall threshold.
- `transition-matrix.json` is the unique frozen point for terminal/result states
  and their exhaustive transition edges.
- `relay-schema.ps1` validates plans, authority, receipts, results, checkpoints,
  events, and handoff headers against fail-closed field whitelists.
- `relay-identity.ps1` binds results/checkpoints to the active identity chain,
  rejects stale or immutable attempts, and computes dependency freeze sets.
- `relay-transitions.ps1` validates each state dimension and their atomic pair,
  with P1-reserved target-form edges rejected.
- `relay-redaction.ps1` removes credential-shaped values before retaining the
  UTF-8 byte-limited session tail and detects residue in final artifacts.

All files are PowerShell 7 libraries or static machine-readable data. The test
entrypoint is `tools/tests/run-relay-tests.ps1`.
