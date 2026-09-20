# progress — RLT_27

- 2026-09-20：用户批准 Issue 与最小 Linux Codex 开工，Issue #52 已创建；ThinkPad 和 Windows 独立 wt/RLT_27 均基于 d954428（Windows 仅准备/证据镜像，ThinkPad 是运行权威）。
- Linux 前置实测：Python 3.12.3、codex-cli 0.155.1、Claude Code 2.1.278、Herdr 0.9.0；Codex 已登录。五个用户级 Codex Skill 文件与仓内源逐项 cmp MATCH。
- 前置测试：在 ThinkPad 原 master 9ca3eda（与 d954428 tools 无差异）执行 `PYTHONUTF8=1 python3 -m unittest discover -s tools/relay-light -p test_*.py -q`，自然退出0，`Ran 224 tests in 408.904s / OK`；期间安装器故障注入 stderr 为预期负例，最终退出决定结论。未修改全局 Skill，测试生成 __pycache__。
- 独立方案审核：review_linux_transition / fresh 会话完成，采纳当前基线、独立实例、专用config、不删树四项修正；用户随后批准执行。审核只读，未改文件。

后续由各阶段 scribe 追加真实证据。

- C1（retry02）：monitor `r27b-c-monitor` 位于 `w4:p1`；fresh coder `r27b-c-coder`（`w4:p2`）与 fresh checker `r27b-c-checker`（`w4:p3`）已并发真实运行。coder 产出 `linux-codex-usage.md` 与唯一信号并报 `PASS`；checker 等待真实 guide 与 coder signal 后独立核对，产出 `check.C1.md` 与唯一信号并报 `PASS`，结论为 `P1=none`、`P2=none`。monitor 按 coder checkpoint → checker judgement → coder done → checker done 的顺序记入终态，并在两者 PASS 后启动 fresh scribe `r27b-c-scribe`（`w4:p4`）。本次 `coordinator_intervention=1`，`attempt01=preserved`。C1 未重跑 408 秒的 224 测试，不构成 R/F、restricted sandbox、verify 或全闭环完成；截至 scribe 启动事件，账本尚未记录 C1 `node_close`。

- R1（retry02）：fresh lesson reviewer `r27b-r-lesson`（`w5:p2`）与 fresh consistency reviewer `r27b-r-consistency`（`w5:p3`）分别产出自身 review 与唯一信号，真实结论为 `lesson=PASS`、`consistency=PASS`，两路均 `P1=none`、`P2=none`；retry02 账本 seq 34/35 已记录两路 `done outcome=PASS`，seq 36 随后启动 fresh scribe `r27b-r-scribe`（`w5:p4`）。scribe 对精确 retry02 plan-dir 只读执行 status/lint，二者均退出 0，lint 为 `ok`；status 仍显示 R1=`open`、F1=`pending`，原因为 `scribe#1` 尚无账本终态。因此终端状态并非 durable completion，R1 仍须 monitor 消费 scribe 产物/信号并记终态后才可闭合。本次保持 `intervention=1`、`attempt01=preserved`，未重跑 408 秒基线，也不宣称 F、verify、验收或全闭环完成。

- F1（retry02）：fresh scribe `r27b-f-scribe` 位于实际 pane `w6:p2`，monitor `r27b-f-monitor` 位于 `w6:p1`。本棒原样运行精确 retry02 `status --json` 与 `lint` 命令，均退出 `0`，lint 输出 `lint: ok`；status 当时显示 W/C/R closed/PASS、F1=`open` 且 `closable=false`，原因为 `scribe#1 无终态事件`。已写 `evidence/handoff.md` 与唯一完成信号，记录 attempt01 W1 blocked 完整保留、`intervention=1`、W 的 HC-RL-A144（seq 6 token 无效、拒绝 launch 未入账、seq 7 有效）及 C 的 HC-RL-A146（首次 done 缺 ready_seq 被拒且未入账、seq 23 使用 `ready_seq=20`）。既有 `Ran 224 tests in 408.904s / OK` 自然退出 0 仅引用、未重跑；restricted sandbox 未证明、用户 acceptance 未签署、不做 verify。全部 workspace/pane/agent/worktree 保留，无 cleanup 或其它禁止变更；当前完成仅为 scribe durable 备料，不宣称 F1 node/stage 已闭合。
- F1 写后辅助核对偏离：一次双引号 regex 中的 Markdown 反引号触发 shell command substitution，得到 `PASS: command not found` 与无参数 `xdg-open` 帮助；未写文件，后续以安全单引号检索复核。该辅助命令不是指定 status/lint，不改变二者 exit `0`、F1 open 或 `lint: ok` 的记录。
