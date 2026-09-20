# RLT_27 coordinator final audit — 2026-09-20

- Issue: #52, kept OPEN. Machine run passed; human acceptance unsigned.
- Authoritative runtime: ThinkPad `/home/nash/work/dh-relay/.dh-worktrees/RLT_27`, baseline `d954428042d9163ca90a832f49a43761e5adc5f7`.
- retry02 ledger seq 48 is orchestrator F stage_close at 14:48:09 +08. All W/C/R/F stages and nodes closed; nine worker instances have durable done. Four fresh stage monitors and one Linux Codex orchestrator complete the topology.
- Independent post-close status command returned exit 0, open_stages=[], pending_nodes=[], errors=[]; lint returned exit 0, `lint: ok`.
- Post-run `git diff --check` and `git diff --exit-code d954428 -- tools` returned exit 0. Git status scope: this task DevPlan, task workspace, and task relay directory only.
- Five global Skill files (SKILL.md, roles.toml, dh-mapping.toml, references/adapter-codex.md, references/adapter-claude-code.md) still match source by cmp. Dedicated roles.toml only changes launch commands to codex; global Skill was not installed or overwritten.
- Existing Linux prerequisite suite: 224 tests, 408.904 seconds, OK, natural exit 0. Tools baseline identical to d954428; suite not rerun after documentation-only work.
- First attempt blocked on coordinator-authored task_plan wording that incorrectly routed R FAIL to an already-finished C worker. Corrected to durable blocked and stop; original ledger and outputs preserved; new isolated retry02, not a resume or rewritten history. Coordinator correction/retry episodes: 1; root TUI also needed Esc/Enter to deliver the queued correction. This is not a zero-intervention first-pass success.
- retry02 ran from 14:08:43 to 14:48:09, about 39 minutes 27 seconds. Monitors self-corrected rejected W checkpoint-token and C ready_seq requests without rewriting accepted events.
- Existing Codex default launcher was YOLO mode; no permission/security/model changes made. Restricted sandbox, normal/heavy, watch, dynamic plan amendments, and Claude-main execution were not proven by this trial.
- No commit, push, PR, merge, verify, global Skill update, or cleanup. All worktrees, panes and evidence retained. Old #48/#49/#50 and their local tasks remain on-hold, not completed or cancelled.

## Reproduce read-only closure check on ThinkPad

From the RLT_27 worktree:

```sh
python3 tools/relay-light/relay_log.py status --plan docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02 --json --config-dir docs/modules/relay-light/workspace/RLT_27/config
python3 tools/relay-light/relay_log.py lint --plan docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02 --config-dir docs/modules/relay-light/workspace/RLT_27/config
```
