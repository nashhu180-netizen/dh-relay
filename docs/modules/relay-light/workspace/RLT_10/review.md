<!-- dh:v1 -->
# review — RLT_10

> RLT_10 task_type=`normal`。施工者不得复核自己的卡；CONSTRUCTION_DONE 且批次小审闭合后，代码轮 1、需求方向、教训三路按冻结 Recipe 独立执行。

## 预测变更面

<!-- dh:change-surface:v1 task=RLT_10 phase=predict -->

| 变更面 | 预测改动 | 下游消费者 / 风险 | 预定复核证据 |
|---|---|---|---|
| lint CLI 合同 | `test_relay_log.py` 新增 0/2/3、stderr 行格式、`lint --json` 精确 schema 断言 | `relay_log.py lint` 调用者；当前 `--json` 缺失可能阻断 | 行为 RED/GREEN；字段 key-set/type/value；F-001 裁决链 |
| lint 规则映射 | §3.5 20 行逐规则触发矩阵，只补现有测试未覆盖的规则 | 计划作者与监工；只按 unique ID 会漏掉同 ID 多规则 | 规则→ID→fixture 矩阵、差集、实际 CLI 编号集合 |
| 标准库边界 | AST 静态检查 `relay_log.py` 顶层 import | 跨平台无依赖运行；路径错或空扫描会假绿 | 非空 import 集合、`sys.stdlib_module_names` 差集为空 |
| PowerShell 薄壳 | 新建 `relay-light-log.ps1` 顺序运行两份 Python unittest | Windows/Linux pwsh runner；输出吞没、exit 丢失、无 Python 误报失败 | 假解释器非零透传、无解释器 SKIP、真实两文件输出 |
| 仓库全量入口 | `$suites` 数组末尾登记一项，不改循环 | CI `relay-tests-pwsh`；错误改循环会影响全部 suite | runner diff 仅一项、suite 标头、最终 exit/summary |

## Normal Recipe 路径登记

| 路径 | 时序 / 独立性 | 必审靶子 | reviewer | 证据 | 状态 |
|---|---|---|---|---|---|
| code-round1 | construction 与批次小审闭合后；fresh，非施工者 | 整卡 diff；测试是否行为有效；JSON/schema 是否精确；薄壳输出/exit/SKIP；allowed-paths | `rlt10-review`（独立复核 worker · Devin CLI / SWE-2 Max） | `reviews/code-round1-rlt10-review.md` | 已执行：APPROVE_WITH_NITS（P2-1 `.pyc` 入树已于 `bdde365` 移除；P3-1/2/3 经 X1 冻结） |
| requirement | normal Review Batch 独立路径 | 逐字对齐 A80/A94/A11/A16；A15 只作旁证；不冒充 Windows；F-001 裁决可追溯 | `rlt10-review`（独立复核 worker · Devin CLI / SWE-2 Max） | `reviews/requirement-rlt10-review.md` | 已执行：APPROVE_WITH_NITS（四条 HC 全命中；#8/9/10 P3 经 X1 冻结） |
| lesson | normal Review Batch 独立路径 | 核 lesson 候选的现场证据、去重和可复用性；若 absent，形成可核查 N/A | `rlt10-review`（独立复核 worker · Devin CLI / SWE-2 Max） | `reviews/lesson-rlt10-review.md` | 已执行：APPROVE_WITH_NITS（L-1/2/3 登记建议经 X1 落 `lesson_candidates.md` LC-1~LC-3） |

## 批次小审登记

| Batch | audit reviewer | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| W | `rlt10-audit` | PASS | `review.plan.md` | 已闭合 |
| 1 | `rlt10-audit` | PASS | `check.C1.md` | 已闭合 |
| 2 | `rlt10-audit` | PASS | `check.C2.md` | 已闭合 |
| 3 | `rlt10-audit` | FAIL→PASS（E-B3-004 分项误记，E-B3-008 更正后定向复审 PASS） | `check.C3.md` | 已闭合 |

## 有效单测候选（normal 复核核对）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应检查 | 行为红预期 | 状态 |
|---|---|---|---|---|---|
| lint JSON `violations[].rule` | `rule`→`code` | serializer/schema | A80 JSON 精确 key-set | key-set 断言失败 | 已核：精确 key-set 断言在位（E-B1-007），code-round1 复核确认强断言 |
| lint stderr 前缀 | `lint:`→`error:` | CLI 用户可见合同 | A80 stderr regex | 行格式断言失败 | 已核：逐行 fullmatch + `assertNotIn("lint:")` 反向锁在位（E-B1-007，X1 增补 `--json`+exit-3 组合） |
| PowerShell `$LASTEXITCODE` | 透传非零→固定 0 | failure propagation | 假解释器 exit 7 | 壳退出码断言失败 | 已核：E-B3-003 假解释器 exit 7 实透传、check.C3 `/bin/false` exit 1 复现 |
| import 顶层模块 | 标准库名→伪第三方名 | dependency boundary | AST stdlib 差集 | 越界模块断言失败 | 已核：E-B2-002 变异 RED 实跑（注入 `rlt10_fake_third_party` 断言如实列出） |

## 独立复核区（执行者 ≠ 复核者；normal Recipe 三路）

三路均由未参与施工的独立复核实例执行，只读复核；oracle 与测试由复核者本机重跑，不仅引用 exec 证据。

| 路径 | 复核者（自报身份 / 模型） | 结论 | 发现级别 | 报告 |
|---|---|---|---|---|
| code-round1 | `rlt10-review` / Devin · SWE-2 Max | APPROVE_WITH_NITS | P2×1（P2-1 `.pyc` 入树，`bdde365` 已移除）+ P3×3（P3-1/2/3，X1 已冻结） | `reviews/code-round1-rlt10-review.md` |
| requirement | `rlt10-review2` / Devin · SWE-2 Max | APPROVE_WITH_NITS | P3×3（#8/9/10，X1 已冻结） | `reviews/requirement-rlt10-review.md` |
| lesson | `rlt10-review2` / Devin · SWE-2 Max | APPROVE_WITH_NITS | P3×3 登记建议（L-1/2/3 → LC-1~LC-3，X1 已登记） | `reviews/lesson-rlt10-review.md` |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：三路独立复核与批次小审已闭合，X1 整改已落盘待复审。任何测试绿、audit PASS 或 review APPROVE 都不等于用户验收、verify、push、PR、CI、merge 或发布。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| HC-RL-A80：lint 0/2/3、stderr 与 JSON 合同 | 冻结入口 `test_lint_cli_exit_stderr_and_json_contract` 单方法 8 分支：exit 0/2/3、`lint:` 行 fullmatch+白名单、`--json` 逐字段、`--json`+exit-3 `error:` 合同、`--json` stderr 空、无行号规则 `line:null` | E-B1-002/003（RED）、E-B1-007/008（GREEN）、E-X1-002/003（P3 锁红→绿）；code-round1 复跑 exit 0 | 达成 |
| HC-RL-A94：§3.5 每条规则可触发且编号属于验收表 | §3.5 20 行映射矩阵按规则行盘点差集为空 + 四类别实跑 | E-B1-001/004/009（97 项 OK；B2 后该类 98 项）；code-round1 复核 20 行重抄零差集、触发方法逐一体内含 ID 断言 | 达成 |
| HC-RL-A11：薄壳登记 `$suites` 并全绿 | 独立跑薄壳 + 全量 runner 展示套件名与 exit | E-B3-002（缺席 RED）/003（隔离）/004+008（独立 GREEN 141+7）/005（全量 `RELAY ALL PASS`，行 740/1000） | 达成 |
| HC-RL-A16：账本程序只用标准库 | AST 收集 `relay_log.py` 顶层 import 与 `sys.stdlib_module_names` 差集 | E-B2-002（变异 RED）/003（GREEN，collected 11 名全 stdlib）；code-round1 复跑 exit 0 | 达成 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | HC-RL-A80 | AI | E-B1-002/003/007/008、E-X1-002/003；check.C1 PASS | 是 |
| 2 | HC-RL-A94 | AI | E-B1-001/004/009 + §3.5 盘点矩阵；check.C1 PASS | 是 |
| 3 | HC-RL-A11 | AI | E-B3-002~005、E-B3-008；check.C3 定向复审 PASS | 是 |
| 4 | HC-RL-A16 | AI | E-B2-002/003/004；check.C2 PASS | 是 |

**材料齐没齐**：[x]（施工三批 + 批次小审 + 三路复核 + X1 整改均已落盘；剩余闸=用户验收/verify/PR/CI/合并，均不在本表自证范围）

---

## 人类签名区　✅ 仅凭用户对话确认解锁

本卡无业务人判结果项；收口时向用户展示四条机器证、三路复核与 F-001 裁决链，由用户决定后续授权。AI 不得预勾。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 整卡收口 | 查看需求对齐证据、测试输出、批次小审与三路复核后对话确认 | 用户明文确认 | |
