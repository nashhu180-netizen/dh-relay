# RLT_18 workflow-final consistency（UD-3）· review-round-1

2026-09-25 · reviewer#consistency-ud3-r1（fresh，未参与本卡任何施工、批审与复核）· 审查对象：`git diff a6773e7..HEAD`（U1 RED `2c1dc47` + GREEN `638b9e6`、A-14 晋级 `94b763d`、B-10 `3dc5a87`、U2 证据 `f495cf5`/`f4c2661`/整改 `401defb`、orchestrator 登记若干）；路径审计基点钉 `5ab3bba` · 权威：晋级后 design/01（RLT-A-14、HC-RL-H12 v2）、`task_plan.md` §5（D14–D23、§5.4、§5.5、§5.6）、`decisions.md` UD-3~UD-8、AGENTS.md 宪章。

## 结论

**PASS** — 无 open P0/P1。四方合同（design/01 ↔ SKILL.md ↔ 两 adapter ↔ test_relay_log.py）一致，UD-3 口径忠实落地；旧口径在交付面（tools/、design/01）零残留。两个 P2 均为「已登记、未落地」的工作区口径同步项，须在 H12 人验签名提交前随 decision.b10 §7 的既有通道收口，不阻断本轮。

## 发现

| ID | 级别 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| CS-U3-1 | P2 | `workspace/RLT_18/review.md`:59、:64；`workspace/RLT_18/brief.md`:44 | review.md 需求境证据行「H12 杀 watch 后 20 分钟兜底」与人类签名区行「H12（杀 watch 后 20 分钟兜底是否接住、是否可接受）」、brief.md 验收表第 5 行均为 **v1 旧口径**，与晋级后 design/01:1426（watcher 10 分钟巡检契约 v2）、DevPlan:658（B-10 已同步）、decisions.md UD-3/UD-8 矛盾。该同步已被两处登记：task_plan §5.4(5)「review.md 签名区 H12 行措辞由 orchestrator 在 A-full 晋级后同步」、`decision.b10-devplan-h12.md` §7「可与第 6 步同提交或随人验提交」——B-10 提交（`3dc5a87`）未含，剩余载体为「随人验提交」。另注：decision §7 点名的 review.md:13 当前并无「20 分钟兜底」字面，实际残留为 :59/:64；同表验收靶 #5 行「承接批次 = batch 3 取证」在 v2 下对应证据实为 `evidence/ud3-h12/`。 | orchestrator 在人验签名/提交前把 brief.md:44、review.md:59/:64（连同 #5 行承接列）改 v2 口径并注「RLT-A-14 / RLT-B-10」（decision.b10 §7 原文）。必须在用户签 H12 行之前落地，否则签名对象是被 UD-3 否决的旧契约文本。 |
| CS-U3-2 | P2 | `dev_plan/P1-RelayLight-开发方案.md`:665（允许路径块 SKILL.md 注记） | 注记仍写「限 watcher 表述与『watch 未实现』过时措辞」（UD-2 口径），未按 task_plan §5.3「DevPlan RLT_18 允许路径需追加」与 `dispatch/README.md`:32 扩为「UD-2 两处 + UD-3 watch 兜底表述（第 40 行 watcher 行、放弃项第 5 条）」。UD-3 实际改了 SKILL.md:347（放弃项改写）——已超出 DevPlan 注记字面范围，但 dispatch/README 已登记扩界且路径审计以 README 为准，故不构成越界事实，仅 DevPlan 记录面滞后。decision.b10 §4 明写「第 660 行允许路径块不动」、§7 顺手清单未收此行 → 该注记扩写目前无已登记执行载体。 | orchestrator 顺手同步时把该注记扩为 §5.3 定稿口径（或在 B-adjust/收口提交中补一笔）。 |
| CS-U3-3 | P3 | `task_plan.md` §5.4(2) 验收断言 vs `test_relay_log.py` `_assert_adapter_watch_contract`（约 :6464-6470） | §5.4(2) 否定断言列三项（`stage-stalled`、`依赖人工`、`不设人肉 watcher agent`），测试只钉前两项；第三项当前文本 0 命中，断言覆盖缺口已由 code-round1 记 U3-C1-1（P3）。计划字面与测试实现不完全对齐但方向一致（否定项均被正向断言实质覆盖）。 | 同 U3-C1-1：可补一行 `assertNotIn("不设人肉 watcher agent")`，不补不阻断。 |
| CS-U3-4 | P3 | `SKILL.md`:40 vs design/01:139 | SKILL watcher 行「缺席即报信本空间派活方（stage-lead/编排）重拉」压缩了 design「缺席且本层未正常结束即报信」——判死口径（status 读法、`WATCHER_STOPPED`）由 adapter 承载，SKILL 层不矛盾；且该压缩是 §5.4(3) 定稿逐字原文，code-round1 范围外发现已登记备本路参考。 | 无需动作；留档备查。 |

## 核查范围与方法

- **RELAY_RECEIPT preflight**：`env | grep '^RELAY_'` 零命中 → 正常复核面，未进 fail-closed 分支。
- **四方一致性（design/01 RLT-A-14 ↔ SKILL ↔ 两 adapter ↔ 测试）逐点比对**：
  - design/01：§2 表头「十二个角色（含旁路 watcher）」+ watcher 行（:139）、§2.1 唯一例外（:162）、§3.6 存活兜底段（:497）、§7.1 拉取图（:894-899）、§7.2 tick 通用对账段（:907）、§7.3 watch 挂掉三层（:930-936）、H12 v2（:1426）、§13 实时盯屏行（:1456）、活动声明 RLT-A-14 与历史索引 A-13 转置——全部与 task_plan §5.3 改前→改后要点一致；`A82/A83/A101` 未动；design:303「roles.toml 十一个角色」按 §5.3 注意条保留（roles.toml 无 `[watcher]` 段属实，UD-5 Q5 不改）。
  - SKILL.md：:40 watcher 行、:347 放弃项与 §5.4(3) 定稿逐字一致；:287 硬规则 8、:331 single-task monitor 节、:25 角色数未动。`git diff 5ab3bba -U0` 恰 3 hunk；`git diff a6773e7` 恰 2 hunk（本整改只动 :40/:347）。
  - 两 adapter 互比：「拉起 watcher 的 prompt 片段」「watch 死亡处置」「节拍归属」三段差异**仅为允许项**——D16 本侧节拍（claude `run_in_background` 跑 `sleep 600` vs codex 前台 `sleep 600` + `timeout_ms=660000`）、载体词（tab vs pane）、既有方式 3 不对称（`（Claude 侧可 3）`）。
  - test_relay_log.py：`_skill_ud2_checks` 改版（`完整 relay 模式：`+`10 分钟`+`single-task`+`120 秒` + 否定 `只盯 agent 状态变化、只报信`、`停滞对账由其本层 watch tick 驱动`、`人肉实例退役`）、`_assert_adapter_watch_contract`（否定 `stage-stalled`/`依赖人工` + `watch-down` 两式 + `WATCHER_STOPPED`/`GAVE_UP` + `--level plan` pgrep/Win32_Process 式）、R-U3-1/2/3/4/5 新用例——与 §5.4(4) 断言清单逐条对应；`SkillAdapterTests` 改 `RelayCliTestCase` 基类支撑 R-U3-5②最小 fixture 真跑 `status --json`。
- **旧口径残留全仓扫描**：`grep -rn 'stage-stalled|依赖人工|watch 未实现|尚未实现|人肉实例退役|不设人肉 watcher|不做 watch 推送的实现|停滞对账由其本层'` tools/ + design/01 → 交付面**零命中**；design:20（事件注记引 v1 原文）、:492/:1369（tick 的「20 分钟兜底计时」为 A83 既有口径，tick 本身按 UD-5 Q3 保留）均合法。workspace 命中均为历史事实记录（progress.md 里程碑/E-3xx/E-5xx 证据行、batch-3 与 rq1-redemo 的 probe-briefs/H12 证据档——它们记录的恰是 UD-3 之前的 B′ 机制，属冻结证据不回改）或 dispatch README/plan-builder 的授权注记语境，非残留缺陷。
- **证据 ↔ raw ↔ briefs ↔ adapter**：`evidence/ud3-h12/H12.md`（整改 `401defb` 后版）与 `probe-briefs/` 五份、fixture `h12v2`（ledger `monitor_launch herdr=rlt18-probe-u3-lead`/`agent_launch herdr=rlt18-probe-u3-worker`、stage `RLT18U:C#1`）互洽；watcher-s/watcher-o brief 的派单块与 adapter-claude-code.md:82-92 / adapter-codex.md:84-94 **逐字一致**（仅 `<…>` 占位代入本空间值），lead/orch 规则节与 adapter stage-lead 位/编排位原文一致——「按 adapter 现行原文派单」成立。承重断言（T1/T3 时刻、watch-down 原文、存活核命令与判死、重拉 PID、编排侧零 stall）requirement-ud3-r1 已逐字核 raw、本棒抽查 `transcript-*`/`pane-*`/`agent-status-poll.log` 相符；r1 的 RQ-U3-1~7 在 `401defb` 已逐条落字（覆盖组合声明 :38、T1′−T0′ 与 ~14 分钟间隔成因 :31、介入清单补登与归因中性化 :52-53、raw 落物缺口披露 :64）。
- **裁决忠实性**：UD-3（复用 watcher 角色、每 10 分钟、编排不做）→ D14/D15/D18-D22 逐条落进 adapter 与设计；UD-5 Q2/Q3/Q4/Q5/Q6 与 UD-6 U-1/U-2 落地核到（每终端空间一个、tick 保留、顺带重拉、低档沿用 `[monitor]`、H12-A/B 并行不缩节拍 H12-C 不做、§2.1 唯一例外、H12 保号 v2）；relay_log.py vs `a6773e7` **零 diff**（D17 程序零改动）；`WatchTests` 45 用例不减。
- **术语**：`watcher`/`watch-down`/`single-task` 四方统一；`stage-lead` 在 SKILL/adapter/dispatch 统一（design 用「监工」，见范围外）；`monitor#<n>` 账本标识在 fixture 与 adapter 沿用。
- **断言有效性旁证**：复核 `evidence/ud3-u1/red.txt`（12 个 subTest FAIL 全落在 UD-3 断言面）与 `green.txt`（76 OK）；code-round1 两条变异记录（删 codex「不做 watch 存活判定」→ R-U3-1 仅 codex subTest FAIL；删 `WATCHER_GAVE_UP` → R-U3-2 双 FAIL）证明断言非恒真。

## 范围外发现

- **design「监工」vs SKILL/adapter「stage-lead」跨档命名分裂**：design/01 全文 0 处 `stage-lead`、117 处「监工」；A-14 新增 watcher 行写「编排或监工」沿用 design 本档口径。该分裂系 #62 改名后 design 未回写的存量口径（AGENTS.md 已登记 stage-lead=原监工、`monitor#<n>` 账本标识保留），非 UD-3 引入；建议随 F-013 家族归 backlog 裁定是否统一，本卡不动。
- **`SkillAdapterTests` 基类由 `unittest.TestCase` 改 `RelayCliTestCase`**：为 R-U3-5② fixture 服务；改动面属测试基建，code-round1 已核无副作用，本路仅记一致性无新问题。
- **DevPlan:651 RLT_18 目标行「watch 死亡兜底」未带机制限定**：泛化表述与 v2 不冲突（兜底仍在、机制换成 watcher），口径行 :658 已精确同步；不算矛盾，记此备查。
- F-008（batch-3 第二条 `coder#1 -> done` 来源未定）、F-013（adapter tab vs design pane 载体词漂移）维持既有登记，非本路新增。
