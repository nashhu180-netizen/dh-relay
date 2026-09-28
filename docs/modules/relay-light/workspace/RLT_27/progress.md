# progress — RLT_27

## 2026-09-28 用户终止：需求已取消

用户原话：“因为 delay-lite 修改了。这个任务不需要了，想办法收口”。本处 delay-lite 指本会话的 relay-light。

- 结论：**已终止（需求取消），归档保留**。退出执行/待验收队列，不复跑旧协议，不再补本卡 verify，也不修检查器 F-001；这不是验收通过或风险放行。
- 原试跑曾通过、verify 曾被阻断，两者均按历史事实保留。此次终止没有产生 verify SHA，不将 PR 合入、Issue 已关闭或删除工作树当作 verify。
- Issue #52 保持已关闭；此次只归档同一任务的终止决定，不创建新任务，不影响 RLT_17 或其它卡的验收。
- 55 个未跟踪文件已与 master 核对：48 个完全相同、7 个为旧版外层工件；全部都已在 master 有对应归档。原始首次阻塞与 retry02 账本不修改，旧版差异和唯一 tracked DevPlan 补丁另外完整备份。
- 本机专用 Herdr session `rlt27-linux-codex-01` 已停止（17 个 Codex 会话）；119 个遗留任务专用 MCP 进程收到 SIGTERM 后，旧工作树 CWD 引用已核为 0。
- 原 dirty 工作树已在备份验证后移除；同一路径临时用于终止记录 PR，合入并同步后删除临时树及本机 `wt/RLT_27`。此次不宣称已清理历史 Windows 镜像。
- 以下旧状态与授权保留为历史记录，以本节终止决定为准；将来如需验证新协议，另立新任务。

### 本机恢复备份

- 目录：`/home/nash/.local/share/dh-relay/branch-archives/rlt27-terminated-20260928-e5o3jr4u`（仓外私有目录）。
- `worktree.tar.gz` 包含 2,227 个普通文件，逐文件读取校验一致；`branch.bundle` 保存旧分支历史，`tracked.patch` 保存未提交 tracked 差异。
- 校验：

```text
8de7f027d4c1c5043f6f7710b062e110c1746a87050a506dca5d3e6d3760d2a6  worktree.tar.gz
e071120bf59942720082f0f7fd58a45cc6df51b867a9ffef73553aae5026d1e1  branch.bundle
bf9a2f1556119c53de43acdb6200691b21a3cfb6aec92bab4a34f4d74955c6ac  tracked.patch
```

## 2026-09-20 最新用户决定：记录问题，暂停优化

用户明确“问题记录下，但先不继续优化了”。检查器问题已记 findings.md 的 F-001，状态为用户确认暂缓；不启动 dev-harness 改造，也不继续 verify/销户/清理。Linux Codex 最小链路已验证，检查器优化不作为受控实战前置。下方收口尝试及诊断保留为历史事实，不构成继续优化授权。

## 版本收口授权与证据索引（2026-09-20）

- **当前停止点：verify 被强制钩子阻断，未执行，未删树。** 2026-09-20 在已合入 master 759efce 上尝试授权 verify 提交，PreToolUse dev-harness 复核闸在命令执行前拒绝：模块 dh-check 59 项失败，包含旧任务档案缺项及 RLT_27 light 记录被 R11 按两轮独立代码复核校验。没有改命令名、换 Linux 入口、禁用 hook 或伪造复核以绕过；本轮未产生 verify SHA。收口包中剩余 verify/销户/清理因此保留，旧卡不修不续派。继续需要先解决检查器与本卡冻结 light 配方/存量模块问题的适用边界，属于当前证据归档之外的问题。
- PR #53 已合入且两端 HEAD=759efce；以下集成复验与阻塞记录为未提交机械记录，需后续合法收口保存。两个 RLT_27 任务树/分支和备份均保留；Issue #52 保持用户指定的 CLOSED，不冒充完整生命周期完成。

- E12 集成复验：PR #53 在 CI run 35496787549 completed/success 后 squash 合入 759efce；Windows/ThinkPad master 均 ff 到该版本，两端 status/lint exit 0，4 阶段 closed、9 worker done、errors=[]；tools 与 d954428 无 diff。PR 三项必需 job 均 success，relay-core 观测项 failure。

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
