# Linux Codex orchestrator — RLT_27 / Issue #52

You are the actual Linux Codex orchestrator for this run, not a worker. User authorized this real run. Read AGENTS.md, workspace/RLT_27/brief.md, task_plan.md, execution_strategy.md, this relay_plan.md and config/SKILL.md + references/adapter-codex.md. All paths are under docs/modules/relay-light unless absolute. Do not load dev-harness or invent more tasks. Do not ask the user; if blocked write evidence/orchestrator-blocked.md with exact non-secret facts and stop.

FIRST: verify actual inherited HERDR_ENV=1 (do not set/fake it), pwd and HEAD/branch. Read `herdr --help` and relevant CLI group docs. You must be in session rlt27-linux-codex-01 only. You may create stage workspaces and launch monitor agents, not workers. Use actual returned IDs, never focused default targets. Initial orchestrator pane is retained.

Allowed paths: this plan dir for dispatch/ledger, workspace/RLT_27/evidence for your identity/launch/output evidence. Production code, existing other tasks, real ~/.codex Skill and credentials are out of scope. Never dump env/config secrets or unrelated terminal contents. No git commit/push/PR/merge/verify or deletion. No permission bypass; approvals/security failures are blocked outcomes.

Task plan has been independently reviewed and approved by user. No need to create Issue, plan more cards or repeat prior 224-test Linux baseline. You must execute this exact minimal plan with REAL Codex instances, not fabricate role outputs or ledger facts.

Program: `python3 tools/relay-light/relay_log.py`.
Always explicit absolute --plan `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01` and --config-dir `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config`.

Start: lint, status; if ledger absent write plan_loaded as orchestrator#1, first node W1; note skill=0.1.0 config_dir=<absolute> plan=<absolute>. Then W/C/R/F sequentially: reread plan; stage_start; create stage workspace cwd=this worktree; launch fresh Codex monitor in returned root pane using roles config and actual CLI docs; monitor_launch with stage_id and pane identity. Prompt monitor to read dispatch-monitor.md plus this plan and specify its node/stage and monitor#attempt. All prompts real submissions with verified delivery.

Wait synchronously in repeated <=60s waits; no watch and never end your turn while waiting. Read ledger and monitor output after waits. A Herdr idle/done status alone is not completion; check durable completion signal, outcome and artifacts. If stage_result done and nodes truly closed, write stage_close then proceed. If blocked/failed, preserve and report without fake closes. Do not restart live agents merely because waits expire. Do not use orchestrator as transport proxy; if monitors cannot control Herdr, record this as blocked and stop.

Monitors run all their own agents and write ledger; you do not write agent events. Stage workspaces/panes retained for this authorized test (explicit override of F deletion checklist). At successful final stage, run final status/lint and save evidence/orchestrator-result.md with actual commands/IDs/results and intervention count; include real source/config hash evidence. Do not mark user acceptance. Stop only after that result or durable blocked signal.

Use `apply_patch` for document edits. No secrets in evidence. This run uses Codex default model from user environment; do not change account/model settings or update CLI.
