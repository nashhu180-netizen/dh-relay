# RLT_01 教训复核报告（lessons 路径 · fresh）

**结论：APPROVE — `lessons-absent` N/A 成立，且可核查。** `lesson_candidates.md` 空候选表如实：本卡施工中未出现任何「可复用规则候选」级别的现场。

## 复核范围与方法

- 复核对象：`docs/modules/relay-light/workspace/RLT_01/lesson_candidates.md`（空表）；本卡全部施工产物 `install_skill.py`、`test_install_skill.py`、`skill/SKILL.md` 与两件 adapter 骨架（逐行通读）；workspace 七件套（全读）。
- 对照合同：design/01 §8.1、§11 HC-RL-A124/A125/A32、DevPlan RLT_01 卡。
- 去重对照：`docs/modules/dh-relay/knowledge/教训库-候选.md` 全 87 条候选逐条扫过；RLT_05/RLT_03 的 lesson_candidates 作格式参照。
- 限制说明：本复核未执行 git 命令；diff 边界（仅 allowed-paths）与 `relay_log.py`/`test_relay_log.py` 未改动的字节级核实由代码轮 1 承担（已 PASS）。

## 逐面核对（N/A 可核查面）

| 核查面 | 事实 | 判定 |
|---|---|---|
| 安装器失败语义 | 「失败非零、两侧可暂不同步、整套重跑收敛」由 design §8.1/RLT-A-03 预先冻结，非现场发现 | 无候选——合同先行，无意外 |
| 中途失败注入 | `mock.patch.object(_copy_file)` 计数到第 8 次调用注入 OSError——A124 原文证法的标准实现 | 无候选——注入手法被 task_plan 直接冻结 |
| manifest 字段 | 五键由 design §8.1 冻结；`_git` 失败/超时→`None` 不阻断亦合同规定；测试做键集封闭断言 | 无候选——字段与降级语义均非现场产出 |
| 测试注入 home/source_dir | `main(argv, home=, source_dir=)` kwargs + tempdir 隔离 | 无候选——库候选-50（外部路径强制注入）的合同化应用 |
| 骨架与 RLT_07 分工 | 三件骨架仅 front-matter + 「内容由 RLT_07 交付」；findings F-001 登记同触 `skill/**` 的 rebase 约定 | 无候选——计划层分工，非现场教训 |
| 红锚点诚实度 | E-001 把 `ModuleNotFoundError` 如实标为 import 级红，未伪造行为红 | 无候选——与 RLT_05 L-013/候选-39 既有规范一致 |
| 失败零副作用 | 源缺件时两目标目录均不存在（fail closed 先于任何写入） | 无候选——task_plan 冻结条款 |
| 时钟/环境耦合 | `installed_at` 用实时钟但测试只断言 `fromisoformat` 可解析；git 字段只断类型不断值 | 无候选——既有教训候选-27/候选-50 被正确规避的实例 |

## 过程面核对

progress.md 日志两行（建档 + Batch 1 construction），单批一次通过：无 rework、无 BLOCKED、无 findings 缺陷项、无「跑偏」记录。施工全程无意外坑、无反直觉约束、无可迁移新手法被现场发现——所有关键决策均在 task_plan/design 层预先冻结。

## 去重核对

最接近的可提名项逐一比对库内 87 条：home 注入→候选-50；红诚实登记→L-013/候选-39；负例钉退出码类不钉文案→候选-61；oracle=源文件哈希→即 A124 合同本身。均已被覆盖或不构成候选。

## Findings

| ID | 级别 | 事实 |
|---|---|---|
| — | — | 无 |
