# RLT_27 Linux Codex orchestrator blocked report

## Actual run identity

- Date: 2026-09-20 (Asia/Shanghai)
- Herdr session: `rlt27-linux-codex-01`
- Worktree: `/home/nash/work/dh-relay/.dh-worktrees/RLT_27`
- Branch / HEAD: `wt/RLT_27` / `d954428042d9163ca90a832f49a43761e5adc5f7`
- Inherited `HERDR_ENV=1` was verified. `master` is an ancestor of HEAD, so baseline rebase was a no-op and no rebase command was run.
- Plan/config: skill `0.1.0`, absolute plan and config paths from `dispatch-orchestrator.md` were used for every ledger command.

## Work actually executed

- Initial plan lint: `lint: ok`, exit 0. Initial status had no ledger and W1/C1/R1/F1 pending.
- Orchestrator ledger events: seq 1 `plan_loaded`, seq 2 W stage start, seq 3 monitor launch.
- W workspace retained as `w2`; monitor `r27w-monitor` ran in `w2:p1` as `monitor#1`.
- Fresh builder `r27w-builder` ran in `w2:p2` as `builder#1`.
- Fresh independent plan reviewer `r27w-plan-reviewer` ran in `w2:p3` as `plan-reviewer#1`.
- Actual output and unique completion artifacts were read before results were accepted. No Herdr idle/done state was used as a substitute for artifact inspection.

## Initial failure and coordinator intervention

- The initial reviewer result was FAIL with one P1: the original `task_plan.md` sent an R-stage FAIL back to a departed C-stage coder, conflicting with the authorized R blocked/stop behavior.
- The FAIL remains recorded in `review.plan.md` and ledger seq 8. The same live builder accepted the checkpoint and ledger seq 9 recorded `builder#1 blocked`.
- Coordinator intervention count: **1**. The coordinator corrected only the affected sentence in `task_plan.md` and recorded the intervention in `evidence/coordinator-W1-correction.md`; the relay plan table, prior ledger, production code, and global Skill were not changed.
- The same live independent `plan-reviewer#1` rechecked the corrected sentence. Its appended current conclusion is PASS with no open P1/P2; the original FAIL evidence remains intact. Ledger seq 11 records this recheck.

## Durable blocker and exact stop point

- The correction arrived after seq 9 `builder#1 blocked` and seq 10 `stage_result outcome=blocked` already existed.
- The W1 plan has no decider row and no valid consult decision chain (`escalate -> decision -> user_decision -> resume`) with which to recover the blocked builder. No `resume`, false agent `done`, `node_close`, `stage_close`, or later-stage start was manufactured.
- Ledger seq 12 is the latest durable result: `stage_id=RLT_27:W#1 outcome=blocked ref=builder#1:blocked reason=coordinator-correction-recheck-PASS-but-existing-blocked-ledger-has-no-legal-W1-recovery-chain`.
- Final status: W1 remains `open` and not closable; `suggested_action="wait_user"`; C1/R1/F1 remain pending; `errors=[]`; `monitor_relaunch_count=0`.
- Final lint: `lint: ok`, exit 0.
- C, R, and F were not started. The prior 224-test Linux baseline was not rerun or used to advance a gate.

## Source/config hashes at stop

- `relay_plan.md`: `d1f1d1fe0e5efa5c95601cdcfbf8d32cf294ff0ea8a19c2321d93da16648ac00`
- corrected `task_plan.md`: `cd64a36488e968ca92125f5b61fee889a4a36fd157b990bf6dc1fb20457da6fd`
- `config/SKILL.md`: `6c0edf31d486cfcdfffce0dc4ff9d7f96a8cdb19e7198e8c3b05fd8da6ab2e6e`
- `config/dh-mapping.toml`: `47b207ac69d6d2a07ff9fc997f2aefa12fdaed3b480f144984872f907cc3b76a`
- `config/roles.toml`: `a4a651c4c7aeaa27095d4c61a8b4d5e7bff0fa07daebdfc7a4b65eaef82ad6bb`
- `config/references/adapter-codex.md`: `d846ab9ff08057839e631e17cc56b0afe829fc83f9c037a2b92591c210946313`

## Preserved state and prohibited actions

- Herdr workspace `w2` and panes `w2:p1`, `w2:p2`, `w2:p3` are retained, all naturally done.
- No commit, push, PR, merge, verify, deletion, cleanup, global Skill/config change, model/account change, or permission/security bypass was performed.
- Stop here. Continuing this ledger requires a separate authorized recovery decision; the current run cannot truthfully advance from W1.
