# check.batch-3 — RLT_29 batch-3 独立复核

- 复核者：batch-reviewer#b3（Devin SWE-2 Max，tab w41:tB/pB）；phase=batch-review；batch=3；review_round=1；remediation_count=0。
- 日期：2026-09-23。本文件为 batch-3 reviewer 唯一业务输出之一（另一为 DONE/BLOCKED 单行 signal）。

## 0. RELAY_RECEIPT preflight

- `env | grep -E '^RELAY_'` → 无输出，未命中；走正常复核路径。未清除任何 `RELAY_*`，未修改被审文件。

## 1. scope 与输入

- 基线：`master@93d65cb`；输入 diff = `git -c core.quotepath=false diff 93d65cb`（tracked 7 件）+ untracked 清单（workspace/RLT_29/**、as-built/single-task-实现快照.md、design/evidence/13）。
- 输入工件 SHA-256（本 reviewer 实测）：
  - `tools/relay-light/test_install_skill.py` = `b49c77d3…81dcea`（+201/-1）
  - `docs/modules/relay-light/as-built/single-task-实现快照.md` = `381fae92…ff9a056`
  - `task_plan.md` = `195a3dfa…fc3ac`；`review.md` = `54dde442…490c1e`；`progress.md` = `e57135c9…2ede06`
  - `DONE.batch-3.coder.b04-rerun-1.md` = `a2bb025b…c3f7151`；`post-b04-rerun-1/comparison.json` = `41285f82…7c9119`；`review.plan.batch-3-b04.md` = `a1cd6997…49ea9ea`
- 历史输入：`check.batch-1.md`/`check.batch-2.md`（PASS）、`BLOCKED.batch-3.coder.md`、`BLOCKED.builder.batch-3-b04-contract.md`、`decision.batch-3-b04.md`、`decision.batch-3-b04-evidence-id.md`、ledger/builder/targeted plan-review/rerun 四条新 signal、baseline+post 原件、`evidence/batch-3/**` 全链。

## 2. diff 归属与 sole-writer 核查（审核项 1）

- batch-3 代码改动仅 `test_install_skill.py`；文档改动仅 `evidence/batch-3/**`、as-built 快照、coder signals（`BLOCKED.batch-3.coder.md`、`DONE.batch-3.coder.evidence-ledger.attempt-1.md`、`DONE.batch-3.coder.b04-rerun-1.md`）、progress 单条里程碑+限定 ledger 附录。
- builder#2 仅写 `review.md` 与 `task_plan.md`（mtime 01:21，两份 decision 授权段内）；decider#1 仅写两份 decision + DONE signal；plan-reviewer#2 仅写 `review.plan.batch-3-b04.md` + signal；本 reviewer 仅写本文件 + signal。
- 禁止路径 `tools/relay-light/relay_log.py`、`docs/modules/relay-light/relay/**`、roles.toml、full relay 目录全部零 diff（复核自跑 exit 0）。无 monitor 写入工件（无轮询/通知日志、无 signal 代写）。
- **结论：满足，无越界。**

## 3. 逐项证据

### 项 1 — 结构测试 RED/GREEN 有效且覆盖达标

- RED：`RELAY_LIGHT_SKILL_DIR=evidence/batch-3/red/baseline-skill-93d65cb`（快照五件与 `git show 93d65cb` 逐件 byte-identical，已实测）下 19 tests、11 failures——全部为 `SingleTaskStructureTests` 的 AssertionError 合同断言失败（缺 single-task 文本），8 条安装测试全 ok；exit=1，非导入/路径错误。证据 `red/B-structure-RED.{txt,exit}`。
- GREEN：默认源 19 tests OK，exit=0（`green/B-structure-GREEN.{txt,exit}`）。
- 覆盖核查（对 `test_install_skill.py` diff 逐条）：model-allocation 正例（提案表/明确询问/未确认零启动/逐角色修改/快照复用/变更重问/默认仅提案/最大权限不扩张）+ 反例（缺询问/先启动后补/未确认默认拉起/变更免确认违规清单）+ gate 先于拉起段；RELAY_RECEIPT 分角色（产出型精确 BLOCKED vs monitor 零写/prompt-only/不写 BLOCKED/不清 RELAY_*）；monitor 零写枚举（signal/progress/execution_strategy/轮询日志/通知日志/不路由/不分派/不启动）；拓扑（tab vs pane 双侧）；signal schema 单行九字段+reason；恢复权威四类；roles.toml 无 single-task + 双副本字节一致。**满足。**

### 项 2 — 安装五文件双副本一致 + roles.toml 字节守卫

- `install-consistency/install-run.txt`：临时 home `install_skill.main(["--all"])` rc=0；`sha256-five-files.txt` 10/10 MATCH（SKILL/双 adapter/roles/dh-mapping 双副本 sha256 均等于源）。
- `roles-toml-source-bytes.txt`：`git diff 93d65cb -- roles.toml` 为空、`git status` 干净、源 sha256=`8b86fbac…`；本 reviewer 复核自跑 `git diff --exit-code 93d65cb -- tools/relay-light/skill/roles.toml` exit=0。**满足。**

### 项 3 — 真实 Herdr/model-allocation 证据链

- `model-allocation.md` 引用真实观察手段（`herdr workspace/tab/agent list` + `pane process-info`），原始捕获 `herdr/*.json`、`pane-process-argv.txt` 齐备。
- 逐项比对：w41 单 workspace 11 tab/11 pane 各具名；builder/plan-reviewer=`codex -m gpt-5.6-sol medium`、decider=`codex -m gpt-6-astra medium`、monitor=`devin --model swe-2-medium`、b1/b2/b3 coder+reviewer=`devin --model swe-2-max`——与 `execution_strategy.md` 中用户 2026-09-22 确认快照逐项一致；未启动的 workflow-final/E2 如实标 pending、无伪造 tab/pane。
- as-built 只写已实现/实跑：§1–3 合同与实测事实、§4 如实记 B-04 原 post 未过、§5 明列未发生项；无 future PASS。**满足。**

### 项 4 — Evidence Ledger 唯一、ID/hash/有限结论真实、未伪造未来

- `progress.md` 恰一个 `## 证据账本（Evidence Ledger）` 标题、一张表；ID 闭集恰 E-301..E-304（严格 `E-\d{2,}`），无重复无空占位；三条既有里程碑原字节保留（batch-3 行仍 BLOCKED，未被改成已验证）。
- 登记 SHA-256 全部实测一致：E-301（B-01.txt `e5fb50b1…`、B-01.exit `9a271f2a…`）、E-302（post/B-04.txt `50d91639…`、post/comparison.json `0167aadc…`）、E-303（model-allocation.md `b10e4b80…`）、E-304（check.batch-2.md `9cdee4d4…`、DONE.batch-2.review.md `ae89bd3a…`）。有限结论与原件相符（E-301 仅测试结果、E-302 如实失败、E-303 仅已启动实例、E-304 仅 batch-2 核验）。
- review.md：条件 2/5/7/9/11 文本与 brief 逐字相等（本 reviewer 脚本比对）；证据引用闭集 E-303/E-304 无未登记 ID；workflow-final 五路 pending、E2 pending/not-dispatched、Recipe 未勾选、人验 `[ ]`、verify SHA 待回填、状态仍施工中——R8/R12/R17 已闭合且 H19/final/E2/E10/用户确认/verify 均未伪造。**满足。**

### 项 5 — B-04 blocker 裁决链顺序真实 + 独立复算 rerun oracle

- mtime 顺序实测：post BLOCKED 00:58 → decision.b04 01:03 → builder BLOCKED 01:08 → decision.evidence-id 01:12 → progress ledger + READY 01:16 → review/task_plan 修订 01:21 + builder attempt-2 READY 01:23 → targeted PASS 01:35 → post-b04-rerun-1 + READY 01:41。历史原件未覆盖：原 `BLOCKED.batch-3.coder.md`、原 `post/**`（comparison verdict=BLOCKED）、`BLOCKED.builder.batch-3-b04-contract.md` 均原样保留。
- **本 reviewer 独立复算 `rlt29-b04-r30-paths-v1`**（自写解析器，非引用 comparison.json）：baseline `❌ 失败 66:` 区解析 66/66、owned=7、inherited=59 且与 summary.json 一致；post-rerun 解析 59/59、owned=0、inherited=59；两侧各恰 1 条 RLT_27 R30 且 P/S 逐字匹配；baseline L 恰为设计文档单路径；post L 六路径 ⊆ D、全在 tracked-before==after（各 7 件、逐字相同）稳定名单内、全过 §6 allowlist；canonical inherited Counter 完全相等（59）；无 RLT_29 未登记 ID R8 warning；警告 36→35（R16 因 E-301 type=test 消除，如实记账未算入失败）。
- fail-closed 反例（本 reviewer 内存注入实测，全部阻断）：新 rule/task、P 字节变化、S 字节变化、L 含未知路径、L 含 allowlist 内但非 D 路径（roles.toml）、重复一条 inherited、新增 RLT_29-owned、声明数与解析数不符、空 L、双 R30 行——10/10 BLOCK。**满足。**

### 项 6 — B-01/02/03/05 引用有效 + 复核自跑全绿

- comparison `referenced_prior_gates` 登记 sha256 与原件实测全部一致；被测面（tools/relay-light、plan/log 扫描、禁改路径）自原 post 运行后零变更（tracked diff 前后一致），引用不重跑合理。
- 本 reviewer 独立自跑（cwd=仓根，非引用 coder 证据）：

| 命令 | exit |
|---|---:|
| `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest tools/relay-light/test_install_skill.py` | 0（Ran 19 tests / OK） |
| `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest discover -s tools/relay-light -p 'test*.py'` | 0（Ran 240 tests / OK） |
| `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | 0（RELAY ALL PASS, SKIPPED: 1） |
| plan/log 审计（workspace 内 relay_plan.md/relay_log.jsonl 扫描） | 0（PASS，无命中） |
| `git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay` | 0 |
| `git diff --exit-code 93d65cb -- tools/relay-light/skill/roles.toml` | 0 |
| `git diff --check` | 0（无输出） |
| §6 allowed-path audit（verbatim，`-c core.quotepath=false`） | 0（PASS，changed=123 全在闭集） |
| `dh relay-light`（fresh） | 1（59 失败/35 警告——与 captured post-b04-rerun-1 多重集逐字相等，0 条 RLT_29-owned，无未登记 ID warning；exit=1 仅由 59 条 classified inherited 解释，未当作 PASS） |

- coder rerun READY signal 单行新 schema 字段齐、值无空白、evidence 指向新 comparison 与 targeted PASS。**满足。**

### 项 7 — full relay 零回归、task-owned 清零、无 open P0/P1、design §7.5.5 P2 评估

- 零回归：AGENTS（+6）/SKILL（+45）/双 adapter（各 +40）均为纯插入段，完整 relay 标头段、五阶段模板、账本合同、roles.toml、relay_log.py、full relay 目录零改动；240 tests 全绿含全部存量 relay-light 测试。
- task-owned failures：fresh `dh relay-light` 实跑 0 条 RLT_29-owned；findings.md 无 open P0/P1；review.md 无冒充收敛。
- design §7.5.5 旧 5 值 `phase=<plan|batch|final|decision|monitor>` 评估：属陈旧示例而非现役 oracle——task_plan §1 明列 9 值闭集为运行期权威，SKILL/双 adapter/结构测试一致使用 9 值且 `test_phase_closed_set_is_nine_phases_not_legacy_five` 显式断言 5 值串不在三份合同文档中；A165 验收口径是「标头字段合法 + 与完整标头互斥」，不以该枚举为验收定义；design §7.5.2 生命周期自身已隐含 plan-review/batch-review 独立相位。故为非阻断陈旧示例（P2，建议收口由 decider/orchestrator 同步 design 该处），不构成验收/实现矛盾。**满足。**

## 4. findings

- P0：无。
- P1：无。
- P2-1（沿用 batch-1 P2-1/batch-2 P2-1，归 plan/decider 层）：design/01 §7.5.5 标头示例枚举旧 5 值 phase，与运行期 9 值闭集字面不齐；现役合同与结构测试均以 9 值为权威，仅陈旧示例，建议收口阶段统一。
- P2-2（新登记，非阻断）：as-built §4 「post vs baseline」表记 B-04=66 未过——该表如实对应 `post/` 原始运行；rerun PASS 证据在 `post-b04-rerun-1/` 与 comparison，因 rerun 裁决限定写范围为 evidence+signal，as-built 未回刷。建议收口/E10 备料时呈现 rerun comparison，避免快照被误读为 B-04 仍失败。
- P2-3（沿用 batch-1 P2-3，已裁决历史）：user-adjust 轮次 signal `review_round=user-adjust[-N]` 非纯数字；非本批引入，仅登记备查。

## 5. 结论

P0=0、P1=0 → **PASS**。batch-3 差异（test_install_skill.py 结构断言 + evidence/batch-3 全链 + as-built 快照 + progress ledger + coder signals + builder/decider/reviewer 各自授权工件）满足 task_plan §9/§5.3/§6 与两份 B-04 裁决的全部要求：RED/GREEN 有效、安装双副本一致、真实 Herdr/model-allocation 链与确认快照逐项一致、ledger 唯一且原件/hash/有限结论真实、B-04 rerun oracle 独立复算通过且反例全阻断、B-01/02/03/05 引用有效、复核自跑全绿、full relay 零回归、task-owned 清零、无 open P0/P1、未伪造任何 final/E2/H19/E10/verify/用户确认。本 PASS 仅代表 batch-3 批闸通过；workflow-final 五路、E2、人验与 §1.1 双方 clear 均未发生。
