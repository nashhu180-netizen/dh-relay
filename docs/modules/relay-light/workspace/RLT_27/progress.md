# progress — RLT_27

## 版本收口授权与证据索引（2026-09-20）

- 归档复核：fresh rlt27_closeout_miner 确认原始实证齐全、无凭据值发现；指出旧索引 RLT_26“进行中”容易与冻结覆盖冲突，已在索引前明确历史快照和当前调度，不修改旧卡成果。
- 清理前备份：ThinkPad `/home/nash/work/rlt27-closeout-backup.UTULrx/RLT_27-before-version-closeout.tar.gz`，SHA-256 `9f9f46f1b114e21a5c45817cc991bf5fde20fd43b9d477f0e3df416c2b7aa233`。原始现场 55 文件逐个与归档 Git blob 对比，仅外层 brief/execution_strategy/lesson_candidates/progress/review/task_plan 六个本轮归档索引文件不同；所有 retry02 运行证据与两个原始账本一致。

- miner 回流：已运行 dh mine relay-light RLT_27；fresh 实例 rlt27_closeout_miner 只读核对并抽取 1 条候选，见 lesson_candidates.md。模块正册/候选区均为空；为保持本卡允许路径，候选仅留任务内，不擅自入册。
- 交付汇报：已发送并获确认，内容包括目标、真实结果、首次阻塞与重试、边界、独立复核、224 测试和收口范围。
- 人验证据展示区：已发送，期望 Linux Codex 三层 W/C/R/F 闭合；实际全部 closed、errors=[]、lint ok；有一次说明修正后重试，未验证能力明确排除。用户已回复授权收口。

用户对精确收口包回复“授权收口”：仅 RLT_27 commit/push/PR/CI 后 GitHub 合并/两端 master 同步/verify/任务树及分支清理。替代先前不做版本动作的限制，旧 #48/#49/#50 不动。阶段汇报@收口：已展示 224 测试、W/C/R/F 真闭环、一次说明修正后重试成功与 YOLO/范围局限；用户据此确认。

## 证据账本

| ID | 类型 | 命令/操作 | 结果 | 工件 |
|---|---|---|---|---|
| E-001 | test | retry02 真实三层执行及 status/lint | exit 0，4 阶段 closed，errors=[]，lint ok | retry02/evidence/orchestrator-result.md |
| E-002 | review | 独立 W/C/R 复核及 durable 信号 | PASS，R lesson/consistency P1/P2 none | retry02/review.lesson.md；retry02/review.consistency.md；retry02/check.C1.md |
| E-003 | test | Linux unittest、git diff、五文件 cmp | 224 tests / 408.904s / OK；核心/全局 Skill 不变 | evidence/coordinator-final-audit.md |

## 2026-09-20 用户确认试跑与 Issue 收口

- 用户原话：“本地任务可以收口了是吗？那可以把 issue 收口了”。承接上轮明确展示的 RLT_27 最小试跑结果，登记结果确认并执行 #52 关闭；不扩展到旧 #48/#49/#50。
- retry02 账本 SHA-256 再核仍为 d72b3fe106cb1e33e10c238c5ada31ed03585092235ecc0f47cc71518d7e0931，与最终核查记录一致。
- 试跑事项结束，不继续派活；版本层仍待收口。未授权/未执行 commit、push、PR、merge、verify、删树，保留 ThinkPad 现场与 Windows 镜像，不将此登记冒充已合入或完整生命周期销户。
- 原核查/交接文档里的“待确认 / Issue OPEN”是当时快照，本段是后续用户确认；原失败和重试证据不改写。

- 2026-09-20：用户批准 Issue 与最小 Linux Codex 开工，Issue #52 已创建；ThinkPad 和 Windows 独立 wt/RLT_27 均基于 d954428（Windows 仅准备/证据镜像，ThinkPad 是运行权威）。
- Linux 前置实测：Python 3.12.3、codex-cli 0.155.1、Claude Code 2.1.278、Herdr 0.9.0；Codex 已登录。五个用户级 Codex Skill 文件与仓内源逐项 cmp MATCH。
- 前置测试：在 ThinkPad 原 master 9ca3eda（与 d954428 tools 无差异）执行 `PYTHONUTF8=1 python3 -m unittest discover -s tools/relay-light -p test_*.py -q`，自然退出0，`Ran 224 tests in 408.904s / OK`；期间安装器故障注入 stderr 为预期负例，最终退出决定结论。未修改全局 Skill，测试生成 __pycache__。
- 独立方案审核：review_linux_transition / fresh 会话完成，采纳当前基线、独立实例、专用config、不删树四项修正；用户随后批准执行。审核只读，未改文件。

后续由各阶段 scribe 追加真实证据。
