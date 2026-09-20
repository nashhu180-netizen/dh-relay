# RLT_27 retry02 C1 monitor evidence

## Scope and identity

- role: `monitor#1`
- stage/node: `RLT_27:C#1` / `C1`
- Herdr session/workspace/root pane: `rlt27-linux-codex-01` / `w4` / `w4:p1`
- retry plan-dir: `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02`
- worker workspace: `docs/modules/relay-light/workspace/RLT_27/retry02`
- config-dir: `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config`
- coordinator intervention: `1`
- attempt01: `preserved`; no original ledger, worker, output, or monitor report was resumed or rewritten

## Fresh agents and durable outputs

| role | fresh Herdr name | pane | durable output | unique signal | result |
|---|---|---|---|---|---|
| coder#1 | `r27b-c-coder` | `w4:p2` | `retry02/linux-codex-usage.md` | `retry02/evidence/done.C1.coder.md` | PASS |
| checker#1 | `r27b-c-checker` | `w4:p3` | `retry02/check.C1.md` | `retry02/evidence/done.C1.checker.md` | PASS, P1 none, P2 none |
| scribe#1 | `r27b-c-scribe` | `w4:p4` | appended `retry02/progress.md` | `retry02/evidence/done.C1.scribe.md` | PASS |

Coder and checker were launched concurrently at ledger seq 18 and 19. The checker waited until both the real guide and coder signal existed, then independently checked the current executable paths and versions, Herdr session/socket and live topology, dedicated roles configuration, current command help, durable-completion rules, limitations, and unverified boundaries. Natural terminal completion and each unique signal were observed; Herdr status alone was not treated as completion.

After checker PASS, terminal events were recorded in sender/judge order: coder checkpoint seq 20, checker judgement seq 21, coder done seq 22, checker done seq 23. Fresh scribe was launched only afterward at seq 24 and reached durable done at seq 25.

## Closure

- `node_close`: seq 26, only after coder/checker/scribe had real PASS artifacts and terminal ledger events.
- `stage_result`: seq 27, `stage_id=RLT_27:C#1 outcome=done`.
- final retry02 status: C1 `closed`; latest stage result `done`; R1 is merely ready/pending and was not started by this monitor.
- final retry02 lint: `lint: ok`.
- resources retained; no pane/workspace cleanup.

## Deviations and boundaries

- One initial checker `done` add was rejected by `HC-RL-A146` because its note omitted `ready_seq`; no invalid ledger row was written. The accepted event used the real coder ready checkpoint `ready_seq=20`.
- No production/core/global Skill, Git, permission, model, or security-mode change was made. No commit, push, PR, merge, verify, cleanup, R stage, or F stage was performed.
- The prior 224-test / 408.904-second Linux baseline was not rerun. C1 does not prove restricted-sandbox operation, later-stage completion, or the full relay-light loop.
