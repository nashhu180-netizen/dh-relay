# RLT_27 W1 monitor evidence

## Scope and entrance checks

- role: `monitor#1`
- node/stage: `W1` / `RLT_27:W#1`
- Herdr session/workspace/root pane: `rlt27-linux-codex-01` / `w2` / `w2:p1`
- worktree/branch/HEAD: `/home/nash/work/dh-relay/.dh-worktrees/RLT_27` / `wt/RLT_27` / `d954428042d9163ca90a832f49a43761e5adc5f7`
- inherited `HERDR_ENV=1` was verified; `master` is an ancestor of HEAD, so the required baseline check was a no-op and no rebase mutation was needed.
- All `relay_log.py` calls used the dispatch's exact absolute plan and config paths.
- No production code, global config, Git state, later stage, security bypass, or cleanup action was performed.

## Fresh worker launches

| ledger agent | Herdr name | returned pane | result |
|---|---|---|---|
| `builder#1` | `r27w-builder` | `w2:p2` | initial PASS, then BLOCKED after reviewer checkpoint |
| `plan-reviewer#1` | `r27w-plan-reviewer` | `w2:p3` | FAIL with one P1 and zero P2 findings |

Both agents were started as independent fresh Codex instances with the repository default configuration. Prompts were observed as submitted in the pane; natural completion states, four-line summaries, unique completion signals, and output artifacts were read directly. Foreground waits were bounded to at most 60 seconds; timeout returns were immediately received and followed by agent state, pane output, artifact, and ledger inspection.

## Artifact checks and routing

- Builder artifacts: `evidence/builder.md` and `evidence/done.W1.builder.md`.
- Reviewer artifacts: `review.plan.md` and `evidence/done.W1.plan-reviewer.md`.
- Initial plan lint was `lint: ok`, but the reviewer correctly treated that as structural evidence only.
- P1: `task_plan.md` sends an R-stage review FAIL back through a same-live sender/judge checkpoint, while R1 has no live C1 coder; the frozen skill defines review repair as an X-stage new coder plus the failed reviewer, but this plan has no X node and explicitly forbids runtime plan amendments.
- The reviewer FAIL was routed by ledger checkpoint to the same live `builder#1`. Builder confirmed that closing the P1 would require unauthorized changes to `task_plan.md` and `relay_plan.md`; it updated only its two allowed evidence files and returned BLOCKED.

## Ledger evidence

- seq 4: `node_start` for W1.
- seq 5: genuine `builder#1` launch with `pane=w2:p2`.
- seq 6: builder `ready_for_review=plan-reviewer` checkpoint.
- seq 7: genuine fresh `plan-reviewer#1` launch with `pane=w2:p3`.
- seq 8: reviewer FAIL checkpoint routed to `builder#1`.
- seq 9: `builder#1 blocked`, citing its durable completion evidence.
- seq 10: `stage_result` with `stage_id=RLT_27:W#1 outcome=blocked ref=builder#1:blocked`.
- W1 is intentionally not force-closed: neither agent received a false `done`, and no `node_close` was written.

## Outcome

`RLT_27:W#1` is blocked by the plan-review P1. The durable stage result cites the live blocker as `ref=builder#1:blocked`. C1 and later stages were not started. Workspace `w2` and panes `w2:p1`, `w2:p2`, and `w2:p3` are retained.

Post-result verification used the same exact absolute plan/config paths: `status --json` reported `last_stage_result.outcome="blocked"`, `suggested_action="wait_user"`, C1/R1/F1 pending, and `errors=[]`; `lint` returned `lint: ok`. Herdr reported workspace `w2` retained with three panes, while both worker instances were naturally done.

## Coordinator correction and same-reviewer recheck

- After seq 10 had already been written, the coordinator supplied `evidence/coordinator-W1-correction.md` and corrected only `task_plan.md`: R-stage FAIL now records a real blocker and stops for the coordinator, without routing to the departed C coder, creating X, or amending the plan.
- The same live independent reviewer, `r27w-plan-reviewer` / `plan-reviewer#1` in `w2:p3`, rechecked only that correction. It preserved the original FAIL/P1 text in `review.plan.md` and appended a current PASS: the original P1 is closed, with no new P1/P2.
- seq 11 records that recheck as a reviewer checkpoint. No second reviewer was launched.
- The correction arrived after `builder#1` had already reached the ledger event `blocked` at seq 9 and after the first blocked stage result at seq 10. Current status still reports builder's newest event as `blocked`, W1 open/not closable, and `suggested_action="wait_user"`.
- A legal `resume` from `blocked` requires the configured consult decision chain (`escalate → decision → user_decision → resume`). W1 has no decider agent row, no such decision chain exists, and the coordinator correction did not amend the relay plan or ledger. Therefore no `resume`, agent `done`, `node_close`, or C1 start was manufactured.

The current blocker is ledger recovery, not the corrected document content. Seq 12 is the newer blocked stage result; it retains `ref=builder#1:blocked` and records this exact post-correction state. Final `status --json` reports that seq 12 result, `suggested_action="wait_user"`, C1/R1/F1 pending, and `errors=[]`; final lint remains `lint: ok`.
