# RLT_27 retry02 F1 monitor evidence

## Scope and identity

- role: `monitor#1`
- stage/node: `RLT_27:F#1` / `F1`
- Herdr session/workspace/root pane: `rlt27-linux-codex-01` / `w6` / `w6:p1`
- branch / HEAD: `wt/RLT_27` / `d954428042d9163ca90a832f49a43761e5adc5f7`
- inherited runtime: `HERDR_ENV=1`
- retry plan-dir: `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02`
- worker workspace: `docs/modules/relay-light/workspace/RLT_27/retry02`
- config-dir: `/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config`
- coordinator intervention count: `1`
- attempt01: W1 remains blocked and its ledger, outputs, monitor report, panes, and agents are preserved

## Fresh scribe and durable evidence

- Fresh `scribe#1` ran as Herdr agent `r27b-f-scribe` in actual pane `w6:p2`; the monitor remained `r27b-f-monitor` in `w6:p1`.
- The scribe naturally reached Herdr `done` and printed the required four-line summary. Terminal state was used only as a wake-up signal.
- The monitor read and accepted all four allowed durable outputs: `evidence/handoff.md`, the factual F append to `review.md`, the factual F append to `progress.md`, and the unique `evidence/done.F1.scribe.md` signal.
- The signal outcome is PASS and truthfully limits itself to scribe completion; it does not pre-claim `node_close`, `stage_result`, `stage_close`, verify, or user acceptance.

## Evidence content checked

- Both attempts are included: attempt01 remains blocked at W1 and fully preserved; retry02 has durable W1/C1/R1 PASS evidence before F1.
- `coordinator_intervention=1` is retained. The W correction is recorded as HC-RL-A144: seq 6 used ineffective `review_ready`, the rejected reviewer launch did not append, and seq 7 supplied valid `ready_for_review`. The C correction is recorded as HC-RL-A146: the first checker `done` lacked `ready_seq` and was rejected without a ledger row; accepted seq 23 used `ready_seq=20`.
- The prior command `PYTHONUTF8=1 python3 -m unittest discover -s tools/relay-light -p test_*.py -q` is cited only as already recorded natural exit 0 with `Ran 224 tests in 408.904s / OK`; F1 did not rerun it.
- Restricted-sandbox operation is explicitly not proven. User acceptance remains unsigned, the human signature section remains unchecked, and no verify was performed.
- All attempt01/retry02 workspaces, panes, agents, and the worktree remain retained. No commit, push, PR, merge, verify, cleanup, core/global Skill, Git, permission, security-mode, or model change was performed.
- The scribe disclosed one non-writing auxiliary grep quoting deviation (`PASS: command not found` plus no-argument `xdg-open` help). It did not affect either required status/lint command or any allowed file beyond the factual disclosure.

## Exact checks and close eligibility

The scribe ran and recorded these exact commands before its ledger terminal event:

```text
python3 tools/relay-light/relay_log.py status --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02 --json --config-dir /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config
python3 tools/relay-light/relay_log.py lint --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02 --config-dir /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config
```

Both exited `0`; lint output was `lint: ok`. At that truthful pre-terminal point, status showed F1 open and not closable solely because `scribe#1` had no terminal ledger event.

After reading the PASS artifacts and natural completion, the monitor recorded the scribe `done` event. It then ran the same exact status and lint commands again: both exited `0`, lint output remained `lint: ok`, status reported F1 `state=open`, `closable=true`, `reasons=[]`, `scribe#1 last_event=done`, and `errors=[]`.

The F1 close predicate is therefore genuinely satisfied. This monitor evidence is written before the authorized `node_close` and `stage_result`; the monitor will stop immediately after those two accepted events and will not write `stage_close` or advance any later work.
