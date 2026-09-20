# RLT_27 retry02 F1 handoff evidence

## 当前结论

- F1 scribe outcome: `PASS`。本结论只表示本棒已完成允许范围内的证据备料；运行 `status` 时 F1 仍为 `open`，`scribe#1` 尚无账本终态，未宣称 `node_close`、`stage_result` 或 `stage_close`。
- retry02 的 W1、C1、R1 均有真实 PASS 工件、唯一完成信号与账本闭合：W1 builder/plan-reviewer PASS，C1 coder/checker/scribe PASS，R1 lesson/consistency/scribe PASS。
- coordinator intervention count=`1`。attempt01 的 W1 已在外层账本 seq 9 形成 `builder#1 blocked`，seq 10 与 seq 12 均为 `stage_result outcome=blocked`；该账本、输出、monitor 报告和全部现场完整保留，没有 resume、改写或伪造恢复。

## Fresh 实例与实际 pane

| stage | role | Herdr name | pane | durable result |
|---|---|---|---|---|
| W1 | monitor | `r27b-w-monitor` | `w3:p1` | stage evidence recorded |
| W1 | builder | `r27b-w-builder` | `w3:p2` | PASS |
| W1 | plan-reviewer | `r27b-w-plan-reviewer` | `w3:p3` | PASS |
| C1 | monitor | `r27b-c-monitor` | `w4:p1` | stage evidence recorded |
| C1 | coder | `r27b-c-coder` | `w4:p2` | PASS |
| C1 | checker | `r27b-c-checker` | `w4:p3` | PASS |
| C1 | scribe | `r27b-c-scribe` | `w4:p4` | PASS |
| R1 | monitor | `r27b-r-monitor` | `w5:p1` | stage evidence recorded |
| R1 | lesson reviewer | `r27b-r-lesson` | `w5:p2` | PASS |
| R1 | consistency reviewer | `r27b-r-consistency` | `w5:p3` | PASS |
| R1 | scribe | `r27b-r-scribe` | `w5:p4` | PASS |
| F1 | monitor | `r27b-f-monitor` | `w6:p1` | F1 remains open at this check |
| F1 | scribe | `r27b-f-scribe` | `w6:p2` | this handoff and completion signal |

以上均为 retry02 的 `r27b-` fresh 独立实例及账本/阶段证据记录的实际 pane。终端或 agent 的 `idle`/`done` 状态不作为 durable 完成；本表的结果以对应工件、唯一完成信号和账本事实为依据。

## 路由与顺序修正证据

- W1 / HC-RL-A144：seq 6 的 `review_ready=plan-reviewer` 不满足实现要求；首次 reviewer launch 被拒绝且未写入账本。seq 7 的 `ready_for_review=plan-reviewer` 才是有效 token，fresh reviewer 随后在 seq 8 入账，最终按 `ready_seq=7` 完成 PASS 配对。既有 seq 6 保留为审计事实。
- C1 / HC-RL-A146：首次 checker `done` 因 note 缺少 `ready_seq` 被拒绝且未写入账本；接受事件为 seq 23，明确使用 coder 的有效 ready checkpoint `ready_seq=20`。没有编辑已有事件或把被拒请求计作终态。

## 本棒只读命令证据

命令 1（原样）：

```text
python3 tools/relay-light/relay_log.py status --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02 --json --config-dir /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config
```

- exit code: `0`
- key result: `current_stage="RLT_27:F#1"`，`current_node="F1"`；W1/C1/R1 均为 `closed` 且各自最新 result 为 `outcome=done`；F1 为 `open`、`closable=false`，原因原样为 `scribe#1 无终态事件`；F1 scribe 的 `last_event="agent_launch"`；`errors=[]`。因此本次检查没有把当前终端状态解释为 durable F1 完成。

命令 2（原样，未加 `--json`）：

```text
python3 tools/relay-light/relay_log.py lint --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02 --config-dir /home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config
```

- exit code: `0`
- key result/output: `lint: ok`

## 测试、验收与停止边界

- 引用既有前置证据，未在本棒重跑：`PYTHONUTF8=1 python3 -m unittest discover -s tools/relay-light -p test_*.py -q` 已记录为自然退出 `0`，结果 `Ran 224 tests in 408.904s / OK`。该证据不等于 restricted-sandbox、F1 闭合或用户验收。
- restricted sandbox 未证明；本轮没有改变 permission/security mode。用户 acceptance 尚未签署；`review.md` 的人类签名区保持未签，本棒不做 verify。
- 无 commit、push、PR、merge、verify、cleanup、core/global Skill、Git、permission、security 或 model 变更。
- 写后辅助只读检索有一次 shell quoting 偏离：双引号 regex 中的 Markdown 反引号触发命令替换，输出 `PASS: command not found` 与无参数 `xdg-open` 帮助并非指定 status/lint 的输出。该辅助命令未写文件，随后改用单引号固定字符串核对；不改变上述两个指定命令的真实 exit `0` 与结果。
- attempt01 与 retry02 的全部 workspaces、panes、agents 和当前 worktree 均保留；禁止 cleanup。下一步只能由 F monitor 读取本 handoff 与 `done.F1.scribe.md`，再按账本 close predicate 决定是否记录 scribe 终态、节点和阶段结果；本 worker 到此停止。
