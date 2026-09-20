# RLT_27 Linux Codex retry02 orchestrator result

## Final outcome

- Date: 2026-09-20 (Asia/Shanghai)
- Herdr session: `rlt27-linux-codex-01`
- Worktree: `/home/nash/work/dh-relay/.dh-worktrees/RLT_27`
- Branch / HEAD: `wt/RLT_27` / `d954428042d9163ca90a832f49a43761e5adc5f7`
- Inherited `HERDR_ENV=1` was verified at run start. `master` is an ancestor of HEAD; no rebase command was run.
- retry02 completed the authorized minimal W/C/R/F path. Final retry ledger seq 48 is orchestrator `stage_close` for `RLT_27:F#1`; all four stages and nodes are `closed`, every node is `closable=true` with `reasons=[]`, and `errors=[]`.
- Coordinator intervention count: **1**. The intervention corrected the coordinator-authored R FAIL sentence before retry02. It did not change the relay plan table, old ledger events, core code, or global Skill.
- This is a run result, not user acceptance. Restricted-sandbox operation is not proven, the human acceptance signature remains unsigned, and no verify was performed.

## Preserved attempt01

- attempt01 remains durably blocked at W1. Its latest ledger event is seq 12 `stage_result outcome=blocked`; status still reports `suggested_action="wait_user"`, C1/R1/F1 pending, and `errors=[]`.
- The original builder remains `blocked`; it was not resumed. The original independent reviewer rechecked the single coordinator correction and recorded PASS while preserving its initial FAIL, but the existing ledger had no legal recovery chain after the builder/stage had already blocked.
- The original ledger, outputs, monitor report, workspace `w2`, panes, and agents remain retained. No old event was edited or deleted.

## retry02 stage execution

| Stage | Monitor | Fresh workers and actual panes | Durable outcome |
|---|---|---|---|
| W1 | `r27b-w-monitor` / `w3:p1` | builder `r27b-w-builder` / `w3:p2`; plan-reviewer `r27b-w-plan-reviewer` / `w3:p3` | builder PASS, independent plan-reviewer PASS, stage closed |
| C1 | `r27b-c-monitor` / `w4:p1` | coder `r27b-c-coder` / `w4:p2`; checker `r27b-c-checker` / `w4:p3`; scribe `r27b-c-scribe` / `w4:p4` | coder/checker/scribe PASS, stage closed |
| R1 | `r27b-r-monitor` / `w5:p1` | lesson `r27b-r-lesson` / `w5:p2`; consistency `r27b-r-consistency` / `w5:p3`; scribe `r27b-r-scribe` / `w5:p4` | both independent review paths and scribe PASS, stage closed |
| F1 | `r27b-f-monitor` / `w6:p1` | scribe `r27b-f-scribe` / `w6:p2` | scribe PASS, node close seq 46, stage result seq 47, orchestrator stage close seq 48 |

All retry02 roles used fresh `r27b-` instances. Terminal state was only a wake-up signal; monitors inspected the unique completion signals and artifacts before recording terminal ledger events.

## Preserved routing corrections

- W1 / `HC-RL-A144`: retry ledger seq 6 used ineffective note token `review_ready`; the attempted reviewer launch was rejected and did not append. Seq 7 added the required `ready_for_review` token, after which the same actual independent reviewer was validly launched and paired. Seq 6 remains preserved.
- C1 / `HC-RL-A146`: the first checker `done` request omitted `ready_seq` and was rejected without a ledger row. Accepted seq 23 used `ready_seq=20`. No event was rewritten.
- Neither correction widened scope, added X, or returned R FAIL to the departed C coder.

## Final commands and results

Retry status:

```text
python3 tools/relay-light/relay_log.py status --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02 --json --config-dir /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config
```

- exit `0`
- `open_stages=[]`, `current_stage=null`, `current_node=null`, `suggested_action="none"`
- W1/C1/R1/F1 are all `closed`; all nodes show `closable=true`, `reasons=[]`; `errors=[]`

Retry lint:

```text
python3 tools/relay-light/relay_log.py lint --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02 --config-dir /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config
```

- exit `0`
- output: `lint: ok`

Attempt01 status was re-read with its original absolute plan dir and the same config dir: exit `0`; W1 remains open/not closable with latest stage result `blocked`, C/R/F remain pending, and `errors=[]`.

The previously recorded Linux baseline `PYTHONUTF8=1 python3 -m unittest discover -s tools/relay-light -p test_*.py -q` remains `Ran 224 tests in 408.904s / OK` with natural exit `0`; retry02 did not rerun the unchanged 408-second suite.

One initial final hash probe used three nonexistent guessed config filenames (`mapping.yaml`, `roles.yaml`, and root `adapter-codex.md`) and exited `1` after hashing the valid operands. This read-only probe changed nothing. The actual config filenames were then enumerated and the exact hash command exited `0` with the results below.

## Final source, config, and ledger hashes

- retry `relay_plan.md`: `1c1d7f12e082a0a24e5951375114e5b5a9491df1672026fb9403e443ef8ec6a1`
- corrected retry `task_plan.md`: `cd64a36488e968ca92125f5b61fee889a4a36fd157b990bf6dc1fb20457da6fd`
- `config/SKILL.md`: `6c0edf31d486cfcdfffce0dc4ff9d7f96a8cdb19e7198e8c3b05fd8da6ab2e6e`
- `config/dh-mapping.toml`: `47b207ac69d6d2a07ff9fc997f2aefa12fdaed3b480f144984872f907cc3b76a`
- `config/roles.toml`: `a4a651c4c7aeaa27095d4c61a8b4d5e7bff0fa07daebdfc7a4b65eaef82ad6bb`
- `config/references/adapter-claude-code.md`: `5e5025e74aa53d5a37531bf7d16dd0ad1defa6b9d60e22e82644209a6aa639fc`
- `config/references/adapter-codex.md`: `d846ab9ff08057839e631e17cc56b0afe829fc83f9c037a2b92591c210946313`
- preserved attempt01 `relay_log.jsonl`: `beb9cafa59e3165238725951f8d520f55d4e833bc811536a305ccadba2a87d77`
- completed retry02 `relay_log.jsonl`: `d72b3fe106cb1e33e10c238c5ada31ed03585092235ecc0f47cc71518d7e0931`

## Scope and retained resources

- No production/core code or global Skill/config was changed.
- No commit, push, PR, merge, verify, deletion, cleanup, permission/security-mode bypass, or model/account change was performed.
- attempt01 and retry02 workspaces `w2` through `w6`, their panes/agents, and the task worktree remain retained as required.
- The working tree remains intentionally uncommitted. Final `git status --short` reports the pre-existing/authorized dev-plan modification plus the RLT_27 relay/workspace paths; no Git write operation was performed by this run.
