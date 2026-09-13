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
| code-round1 | construction 与批次小审闭合后；fresh，非施工者 | 整卡 diff；测试是否行为有效；JSON/schema 是否精确；薄壳输出/exit/SKIP；allowed-paths | `rlt10-review`（独立复核 worker · Devin CLI / SWE-2 Max） | `reviews/code-round1-rlt10-review.md` | 待执行 |
| requirement | normal Review Batch 独立路径 | 逐字对齐 A80/A94/A11/A16；A15 只作旁证；不冒充 Windows；F-001 裁决可追溯 | `rlt10-review`（独立复核 worker · Devin CLI / SWE-2 Max） | `reviews/requirement-rlt10-review.md` | 待执行 |
| lesson | normal Review Batch 独立路径 | 核 lesson 候选的现场证据、去重和可复用性；若 absent，形成可核查 N/A | `rlt10-review`（独立复核 worker · Devin CLI / SWE-2 Max） | `reviews/lesson-rlt10-review.md` | 待执行 |

## 批次小审登记

| Batch | audit reviewer | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| W | `rlt10-audit` | 待执行 | `review.plan.md` | 待执行 |
| 1 | `rlt10-audit` | 待执行 | `check.C1.md` | 待执行 |
| 2 | `rlt10-audit` | 待执行 | `check.C2.md` | 待执行 |
| 3 | `rlt10-audit` | 待执行 | `check.C3.md` | 待执行 |

## 有效单测候选（normal 复核核对）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应检查 | 行为红预期 | 状态 |
|---|---|---|---|---|---|
| lint JSON `violations[].rule` | `rule`→`code` | serializer/schema | A80 JSON 精确 key-set | key-set 断言失败 | 待复核实施 |
| lint stderr 前缀 | `lint:`→`error:` | CLI 用户可见合同 | A80 stderr regex | 行格式断言失败 | 待复核实施 |
| PowerShell `$LASTEXITCODE` | 透传非零→固定 0 | failure propagation | 假解释器 exit 7 | 壳退出码断言失败 | 待复核实施 |
| import 顶层模块 | 标准库名→伪第三方名 | dependency boundary | AST stdlib 差集 | 越界模块断言失败 | 待复核实施 |

## 独立复核区（执行者 ≠ 复核者；normal Recipe 三路）

三路均由未参与施工的独立复核实例执行，只读复核；oracle 与测试由复核者本机重跑，不仅引用 exec 证据。

| 路径 | 复核者（自报身份 / 模型） | 结论 | 发现级别 | 报告 |
|---|---|---|---|---|
| code-round1 | | | | `reviews/code-round1-rlt10-review.md` |
| requirement | | | | `reviews/requirement-rlt10-review.md` |
| lesson | | | | `reviews/lesson-rlt10-review.md` |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：待三路独立复核、批次小审与整改闭合后填写。任何测试绿、audit PASS 或 review APPROVE 都不等于用户验收、verify、push、PR、CI、merge 或发布。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| HC-RL-A80：lint 0/2/3、stderr 与 JSON 合同 | 运行专用 CLI 合同用例，逐字段/逐行核验 | 待施工 | 待定 |
| HC-RL-A94：§3.5 每条规则可触发且编号属于验收表 | 20 行映射矩阵 + 逐规则反例实跑 | 待施工 | 待定 |
| HC-RL-A11：薄壳登记 `$suites` 并全绿 | 独立跑薄壳，再跑全量 runner，展示 suite 名与 exit | 待施工 | 待定 |
| HC-RL-A16：账本程序只用标准库 | AST 收集 import，与 `sys.stdlib_module_names` 比较 | 待施工 | 待定 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | HC-RL-A80 | AI | 待施工 | 否 |
| 2 | HC-RL-A94 | AI | 待施工 | 否 |
| 3 | HC-RL-A11 | AI | 待施工 | 否 |
| 4 | HC-RL-A16 | AI | 待施工 | 否 |

**材料齐没齐**：[ ]（施工、批次小审与三路复核均未开始）

---

## 人类签名区　✅ 仅凭用户对话确认解锁

本卡无业务人判结果项；收口时向用户展示四条机器证、三路复核与 F-001 裁决链，由用户决定后续授权。AI 不得预勾。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 整卡收口 | 查看需求对齐证据、测试输出、批次小审与三路复核后对话确认 | 用户明文确认 | |
