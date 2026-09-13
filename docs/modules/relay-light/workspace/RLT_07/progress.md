<!-- dh:v1 -->
# progress — RLT_07

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-12 | W builder | 读取 AGENTS、DevPlan RLT_07 卡与依赖表、design/01 §2/§5/§6/§7/§9/§11 与 RLT_03/RLT_05 七件套格式；创建 RLT_07 标准档七件套，冻结三批施工顺序与 heavy 复核骨架；findings 登记 RLT_01 未完成依赖 | master 基线 `77bde7006b3ef56b9e2b04a8717e462e221241fe`；Issue #10；worktree `.dh-worktrees/RLT_07`（`wt/RLT_07`）；本工作区七文件 | `W_READY`；等主控裁决 RLT_01 依赖并另行 D-start/派 construction，不改 DevPlan「未开始」 |
| 2026-09-12 | 主控 | RLT_01 经 PR #13 合入 master（`25bdbcb`）；`wt/RLT_07` rebase 到该基点；task_plan 改写为「向 RLT_01 骨架填业务内容」，依赖表三项全部完成 | merge commit `25bdbcb`；rebase 后 `81c1d76` + `a401734`；F-001 resolved | 用户授权开工，进入 Batch 1 |
| 2026-09-12 | C batch-1 | 填 `skill/SKILL.md` 核心内容（角色表/五阶段模板容器/账本用法/拓扑布局/硬规则/放弃项）；`test_relay_log.py` 新增 `SkillCoreDocTests` 11 例覆盖 A12/A19/A27/A66/A67/A98/A100/A117/A132 | 红：focused 11 例 14 failures（骨架缺全部核心小节）；绿：focused 11/11 OK；全量 119 tests OK（174.4s）；`git diff --check` exit 0；commit `63c9e56` 已推 #11（rebase 后 force-with-lease） | 批次交主控小审 |
| 2026-09-12 | 主控小审 B1 | 按 task_plan B1 小审输入过一遍：diff 仅 SKILL.md/test_relay_log.py/workspace 三处 allowed-paths；六小节清点齐、模型名/术语/凭据/落点扫描全过；红绿 E-ID 已入账 | focused 红→绿、全量 119 OK、diff 边界干净 | PASS，派 Batch 2 |
| 2026-09-12 | C batch-2 | SKILL.md「五阶段模板」节落地 W/C/R/X/F 五块可抽取模板（占位符 `<card>/<prev>/<n>/<k>/<打回路>/<reviewer>`）；新增 `SkillTemplateTests` 11 例：五块抽取清点、三档 recipe 全链 lint 干净、A127 节点类型闭集、A95/A133 C 模板形状、A102/A113/A103/A114/A96 模板驱动行为断言；实测发现 decision_mode 模式门未在 relay_log.py 实现 → 记 F-002，两条负例腿以 skip 钉住 | 红：模板未落地时抽取断言红；运行时断言 = late-added discriminator；实测探针：consult 下 decision 后直接 resume rc=0（oracle 要求 2）→ F-002；绿：focused 9 ok + 2 skipped；全量 130 tests OK（200.1s）；commit `a575562` 已推 #11 | 批次交主控小审 |
| 2026-09-12 | 主控小审 B2 | diff 仅 SKILL.md/test_relay_log.py/workspace；五模板可抽取且三档 lint 干净；C 模板四 agent trigger/close 与 A95 逐格一致；A127 节点类型闭集过；行为断言全部对已实现的账本语义成立；F-002 两条腿如实阻塞登记 | focused 9 ok + 2 skipped、全量 130 OK、diff 边界干净 | PASS（带 F-002 open），派 Batch 3 |
| 2026-09-12 | C batch-3 | 填 `references/adapter-claude-code.md` 与 `adapter-codex.md`：本侧 `--config-dir` 固定、add/status/lint 三子命令 × Windows `python`/Linux `python3`/远程 `bash -lc` 模板、claude kind `pane run`+`rename` 起法、`agent_prompt_stalled`→`send-keys enter`+seq 复验+`agent read` 终判、wait 接收者三方式与无 watch 前台回退、派活 prompt 模板含凭据禁写原文；新增 `SkillAdapterTests` 6 例覆盖 A21/A26/A27/A136/A12 五件非骨架/不调用 watch 子命令 | 红：骨架无业务内容时结构断言红；绿：focused 6/6 OK；全量 136 tests OK（274.9s）；commit `e80a520` 已推 #11 | 批次交主控小审 |
| 2026-09-12 | 主控小审 B3 | diff 仅两 adapter + test + workspace；A136 枚举机检全部调用带本侧 --config-dir 且三子命令齐；A21 三方式+前台回退原文在；A26 双平台/claude kind/stalled 条目齐；A27 凭据禁令在派活模板；五件非骨架；`relay_log.py watch` 零调用 | focused 6/6、全量 136 OK、diff 边界干净 | PASS——整卡施工完成（CONSTRUCTION_DONE），待 heavy 五路复核 |
| 2026-09-12 | R code-round1 | devin-sub（explore，fresh）复核整卡：APPROVE_WITH_NITS，tests_effective=yes；P2×1（`decision.<k>.md` 撞名覆盖）+ P3×9 | `reviews/code-round1-devin-sub.md` | 施工者按发现逐条整改 |
| 2026-09-12 | X rework-1 | P2：`decision.<k>.md`→`decision.<d>.md`（`<d>`=卡内决策序号）+ 占位符清单补 `<d>`/`<reviewer>`/`<路>`；P3：A132 边界类去 `_`、adapter `<workspace>`→`<任务工作区>`、A136 枚举认 `<RELAY_LOG>` 与字面双形态+watch 断言双形态、A12 补「由 RLT_07 交付」断言、helper 强度对齐、新增 strategist cancelled 终例+决策事件归属断言、A19 原文「直跑 python 测试」；A21 分句转需求方向路终裁 | 整改后 focused 复核相关 29 tests 27 ok + 2 skipped；全量 137 tests OK（175.0s）；`git diff --check` 0；`git diff origin/master --name-only` 仅 11 个 allowed-paths 文件；commit `51e3bc2` 已推 #11 | 轮 1 闭合；放行 Review Batch 四路并发 |
| 2026-09-12 | R lesson | devin-sub（explore，fresh）：APPROVE_WITH_NITS，P3×3——①`decision.<k>.md` 撞名缺陷达教训候选门槛未登记；②F-002 欠候选-54 近失+候选-74 被遵守点名，skip 钉住处置模式可独立成候选；③brief 残留 F-001 裁决前措辞（转一致性路核对） | `reviews/lesson-devin-sub.md`；主控 clerical 闭合：lesson_candidates 补 L-001（占位符序号作用域≥目录唯一性作用域）/L-002（skip 钉住+findings 去向+不伪造绿处置模式）；brief.md 两处加裁决后批注不改合同原文；commit `2283e0e` 已推 #11 | 教训路闭合；等代码轮2/需求/一致性三路 |
| 2026-09-12 | R code-round2 / requirement / consistency | 三路复核同批返回：code-round2 APPROVE_WITH_NITS（变异实证 `close=agent:checker→coder` 精确一红、还原字节一致；P3×5）；requirement APPROVE_WITH_NITS（20 条=17 命中+3 部分，A21 分句2 终裁按 (b) 补监工/编排向 prompt 片段；P3×7）；consistency **REQUEST_CHANGES**（P1×1：`add` 强制 note 合同与控制事件在 skill 三件零命中；P2×2：R scribe 空 trigger 语义冲突、adapter 等待分路丢 `blocked` 支路；P3×5） | `reviews/code-round2-devin-sub.md` / `requirement-devin-sub.md` / `consistency-devin-sub.md` | 进入 rework-2 整改 |
| 2026-09-12 | 主控 | 一致性 P3 程序性说明：task_plan 交接清单「construction Node 不 commit」约束的是 Ticket 制施工节点；本卡为手动派活，全部 commit/push 由主控会话（Devin）在用户明示授权包内执行（Issue #10→wt/RLT_07→PR #11、复核通过即合并的授权），worker 不自行提交 | 用户对话授权链；RLT_01 同模式先例 | 消解表面张力 |
| 2026-09-12 | X rework-2 | P1：SKILL.md 账本用法节补控制事件表（写入者/时序/note 强制：plan_loaded 的 `skill=`+`config_dir=`+`plan=`、stage 事件 `stage_id=`、stage_result `stage_id=`+`outcome=`、plan_amend 文件名+`nodes=`）+ agent 事件归属（决策类记触发者名下、helper token 恰一个、decision 复述同一 helper）+ 两条决策链全展开；attempt 补「恰为最大值+1」闸。P2：R scribe 空 trigger 标「约定例外」+体检/四道闸/miner 落点（scribe 同节点先体检后收敛，§6.1 可分节点）；双 adapter 等待节补回 `blocked` 分路（记 blocked 走升级）。P3：lint 签名去 `--json` 并注 RLT_10；硬规则5 `review.<路径>`→`review.<路>`；A117 补「DevPlan 任务卡」+双字段名；decider/strategist 补「需要改计划」前向引用（RLT_09）；adapter 派活模板首行改 A34 冻结标头 `[relay-light] worker · node · agent# · workspace`、完成行改「完成即停不等 node_closed」；新增监工/编排向 prompt 片段含 A21 硬规则原文；F-002 补逐字探针命令；测试加固——a19 钉「直跑 python 测试」字面、a100 扫描面扩三文档+CJK 紧邻裸词、a136 枚举不认 --plan、assert_rejected 加 `code=` kwarg 并钉 A49×2/A97×2、新增 note 合同文档化测试与派活模板标头测试 | focused 31 tests 29 ok + 2 skipped；全量 139 tests OK（149.8s）；`git diff --check` 0；name-only diff 仅 allowed-paths；commit `f3f2460` 已推 #11 | rework-2 完成，待一致性路复核确认 |
| 2026-09-12 | R consistency-rereview | devin-sub（explore，fresh）整改确认：P1/P2/P3 前轮全闭合，但 rework-2 **引入一处新错（P2）**——strategist 链行把 `decision` 错划进 strategist 名下组（应为 coder 名下，否则账本 A69 拒）；另 P3：控制事件表仍漏 `stage_close` 的 `stage_id=`+全节点 closed 前置、`stage_result` 的 cancelled→user_decision 引用与 `amend=` token、`plan_loaded` 的首非 superseded 节点、`planner-amend#<n>` 豁免名落点 | 复核报告见会话回传（未落盘文件）；逐条已对照 relay_log.py:1090-1130/§3.4:238/§3.5:295 实证属实 | 施工者 rework-3 整改 |
| 2026-09-12 | X rework-3 | strategist 链 `decision` 归位 coder 名下（design §3.4:268-276 逐字对齐）；控制事件表四漏项补齐；`test_ledger_note_contract_documented` 加归属断言（decision→coder 名下、禁 decision→strategist 名下、planner-amend 在场）钉住反例 | focused SkillCoreDocTests 12/12 OK；全量 139 tests OK（158.0s，2 skipped=F-002）；`git diff --check` 0；触碰面仅 SKILL.md+test+workspace | rework-3 完成，二次确认复核在途 |
| 2026-09-12 | R consistency-rereview-2 | devin-sub（explore，fresh）二次确认：**APPROVE_WITH_NITS**——P2-新/P3-新均 closed，归属断言推演有效（回退形态真红）；余 P3×2 nit：正向断言缺左边界可被 `user_decision` 虚满足（已修：加前导反引号）、stage_close 行缺 stage_start/monitor_launch 前置（已补）；观察项 `cancelled` 不在 DECISION_EVENTS（归属闸空隙）登记为 F-003 | 复核回传；nit 即修即验 | **一致性路闭合**——五路复核全部收敛 |
| 2026-09-13 | 主控收口 | PR #11 squash 合入 master（`6f26c4a`）；F-002/F-003 主控裁决排后续卡（`2838a8b` 起随 PR 入仓）；worktree/分支 `wt/RLT_07` 已删 | merge=`6f26c4a`；CI run 34701980270 三硬门绿（relay-light 1m38s / pwsh ubuntu 1m17s / windows 1m30s；relay-core 暂停期 continue-on-error 观测项） | 卡闭合，Issue #10 随簿记提交关闭 |

## 施工批次状态（预填，不代表已执行）

| Batch | 功能单元 | 红 | 绿 | 小审 | 状态 |
|---|---|---|---|---|---|
| 1 | SKILL.md 核心小节与横向硬规则 + 结构测试 | focused 11 例 14 failures（2026-09-12） | focused 11/11 OK（2026-09-12） | PASS（主控 2026-09-12） | 完成 |
| 2 | 五阶段模板 + 运行时合同测试 | 模板抽取断言对未落地模板先红（已随实现转绿）；运行时断言属 late-added discriminator（语义已在 RLT_03/05 实现，本批在模板形状上钉住）；A96/A114 两条 mode-gate 负例腿因 F-002 以 skip 钉住 | focused 11 例 9 ok + 2 skipped（2026-09-12） | PASS（主控 2026-09-12，带 F-002 open） | 完成（F-002 待裁决） |
| 3 | 双 adapter + 五件齐收尾 | adapter 骨架无业务小节/枚举断言先红（随实现转绿） | focused 6/6 OK（2026-09-12） | PASS（主控 2026-09-12） | 完成 |

## 信号

```text
DONE task=RLT_07 batch=3 status=CONSTRUCTION_DONE evidence=focused-adapter-6ok,full-136ok,diff-clean next=main-controller
```
