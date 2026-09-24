# review.plan.ud3 — RLT_18 task_plan §5（UD-3 整改）fresh plan-review

- 角色：plan-reviewer#ud3（fresh）· phase=plan-review · review_round=1 · remediation_count=0
- 审查对象：`task_plan.md` §5（5.1–5.7）；§0–§4 已 PASS 不重审（仅在 §5 引用时核对）
- 基线事实核对点：HEAD `d0428ae`；`a6773e7`（§5.4 起点）；`5ab3bba`（测试钉死基线）；本地 `origin/master` = `13d477b`（#67，2026-09-24 07:56 +0800）
- RELAY_RECEIPT preflight：`env | grep -c '^RELAY_RECEIPT='` = 0，继续

## 结论 FAIL

两条 P1，都是可执行性问题（机械完成判据按原文跑不出 GREEN），整改量小；UD-3 落地方向、D14–D23 实质、A-full 流程判定、H12 重演设计均成立。P2 建议一并处理。

## 逐项判据

| # | 判据 | 结论 | 级别 | 依据 文件:行 | 整改动作 |
|---|---|---|---|---|---|
| 1 | UD-3 忠实落地：watcher 复用 / 10 分钟 / 只读报信 / 编排不做存活对账 / 通知派活方重拉 | 成立。D14/D15/D16/D19/D20 逐条对应 `decisions.md` UD-3 1–3 点；D12②③取代、D12①/D13 保留，与 UD-3「取代关系」一致；UD-3 原话「编排不做这个事情」按窄义（只去掉存活对账、保留 §7.2 通用 tick 对账）处理，并以 Q3 把反向解读交用户；D22「编排顺带重拉 watcher」与用户原话边界相邻，已列 Q4，没有偷偷扩大。没有发现范围缩小 | — | decisions.md UD-3；task_plan §5.2 D14–D22、§5.7 Q3/Q4 | 无 |
| 2 | D18 判死口径引用的 `status --json` 键是否真实存在 | 成立。`open_stages`、`pending_nodes`、`stages[].stage_id/state/nodes`、`nodes[].node/state` 均是 `status_document` 的真实输出键；`status` 子命令有 `--json`。编排级口径与 `_watch_should_exit` 逐项一致 | P2 | relay_log.py:3397–3450、3836–3857、3978–3980 | 阶段级口径多了「或该 stage `state=closed`」这一分支，是 `_watch_should_exit` 的**超集**而非「同源」：stage 以非全关节点收口时 watch 自己不会退出，但 watcher 会静默。结果可接受（阶段已收口），但措辞改为「与 `_watch_should_exit` 一致，另加 stage 已 closed 即静默」，不要写「同源」 |
| 3 | D16 两侧 sleep 写法可行性 | 基本成立，但有一处风险。Claude 侧 `run_in_background` 跑 `sleep 600` 可行（退出唤醒 session，与 adapter 方式 3 同源）；**「或前台 `sleep 590`」不稳**：新版 Claude Code 会拦截长时间前台 `sleep`（本棒自身运行环境即明示 foreground sleep is blocked），且 590 s 贴着 600000 ms 工具上限。Codex 侧前台 `sleep 600` 没有实测先例——现有 Codex 前台先例只有 120 s 的 `herdr agent wait --timeout 120000` | P2 | adapter-claude-code.md:104、168；adapter-codex.md:106、170；task_plan §5.2 D16 | Claude 侧只保留 `run_in_background` 一种写法，删掉「或前台 `sleep 590`」；Codex 侧 `sleep 600` 需先实测：把 §5.6「`sleep 120` 节拍冒烟」改为按 Codex watcher 的真实工具超时跑一次 600 s 前台调用（或写明 Codex 侧超时参数），否则 U2 才发现断拍 |
| 4 | D17「程序零改动」是否成立 | 成立。`stage-stalled` 与「依赖人工」只存在于两份 adapter 和 `test_relay_log.py`，`tools/` 下没有任何代码路径引用；B′ 规则只在 adapter 文本里。watcher 不进账本，watch 的在场集取自账本，所以不会盯 watcher | — | grep `stage-stalled` 全 tools/ 仅命中 adapter×2 + test:6425；relay_log.py:3527 | 无 |
| 5 | D18 命令与现行 watch 调用行对齐 | 成立。循环调用行为 `watch --plan <plan_dir> --notify <名> --level <stage\|plan> --config-dir …`，`--level` 紧跟 `--notify`，pgrep 子串 `… --notify <派活方> --level stage` 可命中；`_PATTERN_LINE_MARKERS` 会把新增的 pgrep/Win32_Process 行排除在 `--config-dir` 检查之外；D18 的 `status … --config-dir <plan_dir>/config/` 满足 `test_a136` 的「每处调用带本侧 config-dir」 | — | adapter-claude-code.md:92、113；test_relay_log.py:6300–6311、6286–6289 | 无 |
| 6 | D18/D19 覆盖「有意没有 watch」的状态 | 缺口。stage-lead 按现行规则「不在则…或改前台 `herdr agent wait`」退回无 watch 模式后（或 watch 以 2/3/4 确定性错误退出、循环停止后），watcher 每轮都判「缺席且未结束」，每 10 分钟无限期 `watch-down`，并往正在前台 wait 的派活方输入框里排队 | P2 | adapter-claude-code.md:113 末句；task_plan D18/D19 | 补一条小决策：派活方决定走无 watch 回退时，同时关闭本空间 watcher（或 watcher 首行带 `mode=`），或写明 watcher 连续报 N 轮后停止并打印 `WATCHER_GAVE_UP`；二选一写进 D18/D19 与 adapter 片段 |
| 7 | §5.3 A-full 流程判定 | 成立。命中 H12 验收契约与角色层变更，A′ 不能改验收；design §4.5 第 642 行明写「设计方案或新增验收条目 → 接力外走 A-full／A′」；`RLT-A-14` 是下一个空号（design 现活动声明为 RLT-A-13，evidence 编号到 13）；U1 GREEN 以用户整版确认为前置，避免返工 | P2 | design/01:5–6、642；design/evidence/ 列表；task_plan §5.3 | ①§2 角色表改动还要同步表头「十一个角色」→「十二个」（design/01:121），§5.3 表里没写；②「Issue #65 直接改正文」属于 GitHub 远端动作，按 AGENTS.md 协作流程第 5 条需用户点名授权，应在 Q1(a) 里写成授权项，别默认可做 |
| 8 | §5.3 允许路径追加 | 成立。追加清单完整（design/01、drafts/A14/**、evidence/14-…、DevPlan H12 行、SKILL 注记扩展、README 闭集同步），「relay_log.py 已在、roles.toml 不动」判断正确 | P2 | task_plan §5.3；dispatch/README.md 允许路径 | SKILL 第 40 行改写后职责列开头仍是「只盯 agent 状态变化」，而完整 relay 下 watcher 只核 watch 存活、不盯 agent——建议把该列前半句改成分模式描述（仍只在第 40 行内，不增 hunk） |
| 9 | §5.4 验收断言：a6773e7 上 RED、U1 后 GREEN | **R-U3-1 与本计划自己规定的编排位文案冲突**。§5.4(2)c 规定编排位改写为「收到 tick 跑 … 做 §7.2 通用对账，**不做 watch 存活判定**、不发任何 stall 提示；…」，§5.4(2) 验收还要求含「编排不承担 watch 存活对账」；而 R-U3-1 断言「收到 `[relay-light] tick` 所在句不含 `存活`」。按规定文案，这句必然含「存活」，R-U3-1 永远 GREEN 不了（已用规定文本做子串验证：`"存活" in 句子` = True） | **P1** | task_plan §5.4(2)c 第 5 小条、§5.4(4) R-U3-1 | 改 R-U3-1 的否定项：只断言该句不含 `stage-stalled`、`pgrep`、`Win32_Process`，并**正向**断言含「不做 watch 存活判定」；或把「存活」否定项收窄为「判 watch 存活」之外的具体动词。改后在 a6773e7 上仍为 RED（旧句含 `stage-stalled`） |
| 10 | §5.4 其余断言 RED/GREEN 与误伤 | 其余成立：a6773e7 的 adapter 含 `stage-stalled`/`依赖人工`，新 `assertNotIn` 与 `watch-down`/`sleep 600`/`WATCHER_STOPPED` 等正向项在它上面都会 FAIL；SKILL `watcher_row` 新片段「完整 relay 模式：」在 a6773e7 上为假；`test_a83_13` 的「5ab3bba 至少两条为假」在新口径下仍成立（watcher_row 与 abandon5 均为假）；`test_a83_adapter_contract_red_baseline` 依赖首条 `assertIn("watch --plan")` 在 5ab3bba 上失败，不受改 `assertNotIn` 影响；测试内不钉 a6773e7，CI 浅克隆安全 | P2 | test_relay_log.py:5594–5622、6418–6490；test_install_skill.py:180–184、273–281 | ①R-U3-5（status 键集）在 a6773e7 上本就为真，不是 RED 用例——标注为「非 RED 守卫」，或改成断言 adapter 文本含这些键名（这样才 RED）；②`test_install_skill` 的 `line_with(…, "完全只读")` 与 `line_with(…, "RELAY_RECEIPT\` fail closed 分流")` 取**首个**命中行：新增的 watcher 片段位于 single-task 段之前，如果措辞用到「完全只读」，会把 single-task monitor 断言劫持成失败。在 §5.4(2)a 注明新片段避开这两个短语 |
| 11 | §5.5 U1 完成判据中「§1.1 路径审计」 | **跑不过**。§1.1 以 `git diff origin/master` 为基：本地 origin/master 已前进到 `13d477b`（#67 改了 SKILL.md 第 3、8–20 行），当前 HEAD 对 origin/master 的 SKILL hunk 数已经是 **5**（对 5ab3bba 为 3），「hunk ≤3」在 U1 动手前就失败；与 UD-3 无关的漂移会让机械判据误报越界 | **P1** | task_plan §1.1 命令块；§5.5 第 3 步「外加 §1.1 路径审计」；实测 `git diff origin/master -U0 -- …SKILL.md \| grep -c '^@@'` = 5、对 `5ab3bba` = 3 | U1/U2 的路径审计把基点钉在 `5ab3bba`（本卡 merge-base），不用浮动的 `origin/master`；同时登记 findings：master 已有 #67，收口 PR 前需 rebase 或确认 SKILL 无文本冲突（#67 与第 40/287/347 行不重叠）——rebase 属 orchestrator/用户决定，worker 不做 |
| 12 | §5.5 批次口径与复核路径 | 成立。不开 batch 4（single-task `batch=1\|2\|3` 闭集）的理由正确；「人验退回的用户定向整改」按 rq1-redemo / e2 coder-remediation 先例走 workflow-final 形态合理；code-round1 先于 U2 → 其余四路同一 Review Batch 并发，符合宪章#5 heavy；E2 fresh；施工者（coder#ud3）不复核自己的施工 | P2 | AGENTS.md 宪章#5；dispatch/README.md signal 表；task_plan §5.5 | 新 signal 名（`DONE.workflow-final.ud3.coder-u1.md`、`DONE.workflow-final.<path>.ud3.review-round-1.md`、`DONE.e2-code-review.ud3.attempt-1.md`、本棒 `DONE.plan-review.ud3.md`）不在 README 文件名表里，需 orchestrator 先登记到 README，并写明 ud3 复核 signal 的 `review_round` 取值（ud3 自己从 1 起，还是接着原额度计） |
| 13 | §5.6 H12 重演能否让用户判断「10 分钟是否兜得住」 | 基本成立：展示 T0/T1/T3/T4/T5、`watch-down` 原文、派活方重拉、编排侧无 stall 提示，阶段级与编排级都覆盖，探针不加提示，只记不判；节拍不缩短的理由正确 | P2 | task_plan §5.6 | ①T1 相对 T0 随机，结果只是 0–10 分钟里的一个样本；为让用户判断「10 分钟是否可接受」，建议 T1 紧跟 watcher 某次检查之后（接近最坏情况），或 A/B 两段错开一段关在检查后、一段关在检查前，并在 H12.md 标注 T1−T0；②写明两个 watcher 探针的 agent kind（Claude/Codex）。D16 两侧写法不同，如果只演一侧，H12.md 要写清另一侧未实测 |
| 14 | §5.7 待用户问题 | 成立：Q1/Q3/Q4 是方向或职责边界，Q5 涉及成本，Q2 的粒度影响职责边界（UD-3 原文把它列为「小决策交 decider」，列给用户属于从严，可接受），Q6 影响人判证据范围 | P2 | decisions.md UD-3「待 builder 定稿的细节」；task_plan §5.7 | 遗漏：①Issue #65 正文扩界的远端授权（见 #7）；②H12 是否两侧都演（见 #13）；③「有意无 watch 时 watcher 如何收声」本该是小决策（见 #6），不需上交用户 |
| 15 | 术语与边界 | 成立。§5 没有把 W/C/R/X/F 当本卡阶段词；adapter 目标术语用 stage-lead/watcher，与现行 SKILL 一致；relay_log.py 不改、design/AGENTS.md 未被 worker 触碰的约束清楚 | — | task_plan §5.1、§5.4 | 无 |

## 复核所用命令与观察（节选）

```text
env | grep -c '^RELAY_RECEIPT='                                              → 0
git diff origin/master -U0 -- tools/relay-light/skill/SKILL.md | grep -c '^@@' → 5
git diff 5ab3bba      -U0 -- tools/relay-light/skill/SKILL.md | grep -c '^@@' → 3
git rev-parse --short origin/master                                          → 13d477b（#67）
grep -rn stage-stalled tools/（除 adapter 与 test_relay_log.py）                 → 无
"存活" in "<§5.4(2)c 规定的编排位 tick 句>"                                    → True
```

## 范围外发现

- master 已合入 #67（`13d477b`，只改 SKILL.md 第 3、8–20 行）。本卡分支基线仍是 `5ab3bba`；收口 PR 前需决定 rebase 与否，同时 §1.1 系列以 `origin/master` 为基的审计命令都受这次漂移影响。只登记，不处理。
- F-010（watcher 派单首行不在 AGENTS.md 宪章层）与 F-011（design 角色表缺 watcher / roles.toml 无 `[watcher]`）登记准确；F-011 的 design 侧应随 RLT-A-14 一并闭合，包括表头「十一个角色」。
