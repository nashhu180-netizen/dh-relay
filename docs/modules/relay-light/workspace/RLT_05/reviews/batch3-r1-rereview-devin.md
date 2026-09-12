# RLT_05 Batch 3 rework R1 targeted re-review — Devin SWE-2 Max

## Verdict

**APPROVE**. Fresh, independent reviewer; constructor was not reviewer. Scope is limited to the four findings from E-062. Batch 4, verify, acceptance, commit, push, PR, and merge remain out of scope.

Dispatch: E-070. Snapshot: `/tmp/rlt05-b3-r1-review.cURGnS/repo` (hash-matched, read-only). Rework evidence labels in the snapshot were mapped as E-063..E-068 → canonical E-064..E-069.

## Findings disposition

| Finding | Level | Result |
|---|---:|---|
| F-B3-PRESTART-INTERVAL | P1 | RESOLVED |
| F-B3-CURRENT-STAGE-MIDPLAN | P2 | RESOLVED |
| F-B3-RELAUNCH-COUNT | P2 | RESOLVED, with the documented ledger-causality residual |
| F-B3-A89-BRANCH-EVIDENCE | P2 | RESOLVED |

No new P0/P1/P2 findings. Three non-blocking P3 notes were registered: foreign `stage_id` on `plan_loaded` is rejected; duplicate legacy stage rows are not warned; stage-level events do not validate first-node identity (A85 matrix gap). These do not reopen Batch 3 R1.

## Evidence

- Full test file: 100/100 OK (146.975s); focused `RelayLifecycleTests`: 16/16 OK (82.561s).
- Independent real-CLI probe in disposable writable copy: 29/29 PASS, covering all four findings, forged labels, rejection byte stability, mid-plan routing, causal relaunch counting, and legacy warnings.
- Mutation replication: removing the `monitor_launch` stage-start guard produced the intended assertion failure; restoring it returned green.
- Boundary: `git diff --check` passed; TOML hashes unchanged; snapshot and disposable copy had no `__pycache__`/`.pyc`; only allowed Python files plus documented WIP appeared in status.

## Residuals

Ledger ordering cannot distinguish a crash-recovery launch occurring inside an already-failed window; strict causal separation would require a future note/event convention. Pre-start `stage_result` reports A112 first (still exit 2). Batch 4 remains locked.

Reviewer: rlt05-b3-r1-rereview-devin, model `swe-2-max`, reasoning max, fresh `/tmp` snapshot.
