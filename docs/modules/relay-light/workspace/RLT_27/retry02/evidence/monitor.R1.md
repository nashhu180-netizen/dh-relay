# R1 monitor evidence — RLT_27 retry02

## Outcome

- stage: `RLT_27:R#1`
- node: `R1`
- outcome: `done`
- recipe: `light`
- retry: `retry02`
- coordinator intervention: `1`
- attempt01: `preserved`
- aggregate verdict: `lesson=PASS`, `consistency=PASS`, `scribe=PASS`
- findings: `P1=none`, `P2=none`
- boundary: `no X`; `F1` was not started by this monitor; no core/global/Git/permission change and no cleanup

## Live topology and fresh identities

- monitor: `r27b-r-monitor`, Herdr workspace `w5`, pane `w5:p1`
- lesson reviewer: `r27b-r-lesson`, pane `w5:p2`, fresh `lesson#1`
- consistency reviewer: `r27b-r-consistency`, pane `w5:p3`, fresh `consistency#1`
- scribe: `r27b-r-scribe`, pane `w5:p4`, fresh `scribe#1`, launched only after both reviewer PASS artifacts and signals were read
- all worker panes used cwd `/home/nash/work/dh-relay/.dh-worktrees/RLT_27`; final Herdr state for all three workers was `done`

## Durable artifacts and signals

- lesson: `review.lesson.md` plus `evidence/done.R1.lesson.md`; verdict PASS, P1/P2 none
- consistency: `review.consistency.md` plus `evidence/done.R1.consistency.md`; verdict PASS, P1/P2 none
- scribe: `review.md`, appended `progress.md`, plus `evidence/done.R1.scribe.md`; outcome PASS
- all artifacts are under `docs/modules/relay-light/workspace/RLT_27/retry02/`
- terminal `idle`/`done` was treated only as a wake-up signal; ledger terminal events were written only after the corresponding artifact, unique signal, verdict, and terminal four-line summary were inspected

## Ledger closure

The exact plan directory was `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02`, with config directory `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config`.

- seq 31: R1 `node_start`
- seq 32/33: parallel fresh lesson and consistency launches
- seq 34/35: lesson and consistency `done`, each after real PASS artifact and unique signal
- seq 36: fresh scribe launch after both reviewer terminal events
- seq 37: scribe `done` after its three allowed outputs were inspected
- seq 38: R1 `node_close`, satisfying the `agent:scribe` close predicate and all-agent terminal condition
- seq 39: `stage_result stage_id=RLT_27:R#1 outcome=done`, with `intervention=1`, `attempt01=preserved`, `no_X=true`, and `F=not-started`

Post-result read-only checks: retry02 `status --json` exited 0 and showed R1 closed/closable with latest R stage result done; F1 was only ready and remained unstarted. Retry02 `lint` exited 0 with `lint: ok`.

## Deviations and intervention record

The coordinator-authored retry remains recorded as `intervention=1`; the original attempt01 ledger and outputs were not resumed or rewritten. During worker notification, the first local Herdr prompt command was rejected before submission with `empty_agent_prompt` because the shell variable was not passed into the subprocess. Both already-created fresh reviewer instances remained idle, received the complete explicit prompts through corrected argument passing, and then ran once; no worker attempt was replaced, no permission mode changed, and no success was inferred from the rejected command.

R1 stops here after its stage result. This evidence does not claim `stage_close`, F, verify, acceptance, or full-loop completion.
