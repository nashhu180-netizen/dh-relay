# RLT_27 retry02 W1 monitor evidence

- node/stage: `W1` / `RLT_27:W#1`
- monitor: `monitor#1`, Herdr name `r27b-w-monitor`
- runtime: `HERDR_ENV=1`; session `rlt27-linux-codex-01`; workspace `w3` (`RLT27-retry02-W`); root pane `w3:p1`
- source: branch `wt/RLT_27`, HEAD `d954428042d9163ca90a832f49a43761e5adc5f7`
- outcome: `done`

## Scope and retry boundary

- This monitor used only the retry ledger at `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02` and worker workspace `docs/modules/relay-light/workspace/RLT_27/retry02`.
- The outer config remained `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config` on every `relay_log.py` call.
- The first-attempt ledger and artifacts were read only and preserved. Its original W1 block is seq10; the already-present coordinator correction/recheck rows are seq11-12, and its latest result remains `outcome=blocked`.
- Retry02 exists because of one coordinator authoring correction: the corrected `task_plan.md` makes any R-stage FAIL a durable blocked/stop result, with no automatic X and no runtime plan amendment. Coordinator intervention count for this retry is `1`; this run does not claim zero intervention.
- No core/global Skill/Git/permission state, attempt01 artifact, later stage, workspace, pane, or agent was changed or removed.

## Actual independent instances and outputs

- `builder#1`: Herdr `r27b-w-builder`, pane `w3:p2`, ledger launch seq5. Natural completion and four-line summary were observed. Outputs: `evidence/builder.md` and `evidence/done.W1.builder.md`; result PASS.
- `plan-reviewer#1`: Herdr `r27b-w-plan-reviewer`, pane `w3:p3`, ledger launch seq8. It was a fresh independent Codex instance. Natural completion and four-line summary were observed. Outputs: `review.plan.md` and `evidence/done.W1.plan-reviewer.md`; result PASS.
- Reviewer findings: P1 none. P2 one non-blocking item: the generic config/SKILL F cleanup checklist conflicts with this run's more specific no-cleanup/resource-retention contract, so no cleanup is authorized.

## Ledger route and checks

- Seq4 started W1; seq5 launched builder; seq7 is the effective `ready_for_review=plan-reviewer` signal; seq8 launched the reviewer.
- Seq9 recorded the independent PASS judgement. Terminal order followed the pairing contract: builder done at seq10, then reviewer done at seq11 with `reviewed=builder#1 ready_seq=7`.
- The status projection then reported W1 `closable=true` with no reasons. Seq12 closed W1 and seq13 recorded `stage_result stage_id=RLT_27:W#1 outcome=done`.
- Final `relay_log.py lint` output: `lint: ok`.
- Final `relay_log.py status --json`: W1 is `closed`; last stage result is W#1 `outcome=done`; suggested action is `open_next_stage`. This monitor did not perform that action, did not write `stage_close`, and did not start C1.
- Resource retention check: w3 still contains `w3:p1` monitor, `w3:p2` completed builder, and `w3:p3` completed plan-reviewer. No pane/workspace was closed.

## Deviation and correction

- The monitor initially wrote seq6 with note token `review_ready=plan-reviewer`, following the plan trigger spelling. The subsequent reviewer launch was rejected before append with exact error `HC-RL-A144 agent plan-reviewer requires a ready_for_review signal from builder`.
- No existing event was edited and the rejected launch produced no ledger row. The monitor appended the implemented exact token as seq7, then recorded the same genuine fresh reviewer instance at seq8. Seq6 remains visible as audit evidence; seq7 is the pairing signal consumed by `ready_seq=7`.
- This is a monitor routing correction, separate from the already-counted coordinator intervention. It did not alter task scope, attempt01, agent identity, permissions, or the corrected plan/workspace contracts.

W1 stops here after `stage_result`. Stage close and every later stage remain orchestrator-owned.
