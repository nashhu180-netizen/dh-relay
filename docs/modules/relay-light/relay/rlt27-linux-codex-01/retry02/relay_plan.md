<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-20 session=rlt27-linux-codex-01 decision_mode=consult recipe=light cards=RLT_27 -->

# RLT_27 Linux Codex minimal run / Issue #52

Worktree `/home/nash/work/dh-relay/.dh-worktrees/RLT_27`, baseline d954428. All relay_log calls explicitly use absolute config-dir `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config` and plan-dir `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02`. Run workspace: `docs/modules/relay-light/workspace/RLT_27/retry02`. First attempt ledger and outputs remain unchanged; this attempt follows corrected task_plan. See dispatch.md.

All roles are independent fresh Codex instances; use config roles.toml. No production changes, global Skill changes, commit/push/PR/merge/verify or cleanup. F produces handoff only. Wait remains foreground; no watch. Worker writes its result then stops, without waiting for node_closed. Failed permission/security must be recorded and escalated, not silently bypassed.

| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| W1 | RLT_27 | RLT_27:W#1 | build | agent:plan-reviewer | | Validate prebuilt workspace and task plan |
| C1 | RLT_27 | RLT_27:C#1 | construction | agent:checker | W1 | Write Linux usage guide and check evidence |
| R1 | RLT_27 | RLT_27:R#1 | review | agent:scribe | C1 | Independent light lesson and consistency |
| F1 | RLT_27 | RLT_27:F#1 | handoff | agent:scribe | R1 | Evidence handoff only; retain all resources |

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| builder | W1 | builder | | workspace/RLT_27/retry02/evidence/builder.md | | Inspect prebuilt seven files; write observation only |
| plan-reviewer | W1 | plan-reviewer | | workspace/RLT_27/retry02/review.plan.md | on:review_ready:builder | PASS before done; fail checkpoint to same builder |
| coder | C1 | coder | | workspace/RLT_27/retry02/linux-codex-usage.md | | Write real usage guide and findings/lesson if needed |
| checker | C1 | checker | | workspace/RLT_27/retry02/check.C1.md | | Concurrent role; await coder ready signal before judgement |
| scribe | C1 | scribe | | workspace/RLT_27/retry02/progress.md | on:done:coder | Wait checker PASS also; append facts only |
| lesson | R1 | reviewer | | workspace/RLT_27/retry02/review.lesson.md | | Independent fresh instance; only own review |
| consistency | R1 | reviewer | | workspace/RLT_27/retry02/review.consistency.md | | Independent fresh instance; only own review |
| scribe | R1 | scribe | | workspace/RLT_27/retry02/review.md | | Launch only after both reviewers done; append summary/progress |
| scribe | F1 | scribe | | workspace/RLT_27/retry02/evidence/handoff.md | | Write status/lint evidence and user-facing handoff/progress |

All output table paths are shorthand under docs/modules/relay-light/. Each worker additionally may write only its unique evidence/done.<stage>.<agent>.md completion signal. No worker writes the ledger. Only monitor writes node/agent/stage_result events; orchestrator writes plan_loaded/stage_start/monitor_launch/stage_close. Coordinator owns initial plan and config; no runtime plan amendments in this run.
