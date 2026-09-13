<!-- dh:v1 -->
# check.C3 — RLT_08 Batch 3 checker

- 审核对象：exec commit `f3af14e`，信号 `READY_FOR_REVIEW`，证据 `E-009`～`E-014`
- 审核边界：仅判断 B3 是否偏离 task_plan、是否越 allowed-paths、B3 与整卡验证是否真绿
- 结论：**PASS**

## 1. 是否偏离 task_plan

**PASS。**

- `AGENTS.md` 只在“任务类型阅读矩阵”表尾新增 relay-light 索引行，内容指向仓内 `tools/relay-light/skill/SKILL.md` 及两份 adapter，符合 B3 位置与样板。
- exec 先写 `READY_FOR_REVIEW` 并停止，没有提前写 `CONSTRUCTION_DONE`，符合 B3 收束顺序。
- `progress.md` 已以 `E-009`～`E-014` 登记索引 RED/GREEN、dh 解析、dev-harness 同态、整卡机检与四态路径证据，并由 READY 信号引用。
- `dh-check` 的 25 条存量失败已单列为 F-4，没有冒充模块解析失败，也未越界整改。

## 2. 是否越允许路径

**PASS。**

- `f3af14e` 只改 `AGENTS.md`、RLT_08 `findings.md` 与 `lesson_candidates.md`。
- 独立重放四态检查：committed 共 21 个路径，全部属于 `AGENTS.md` 或 RLT_08 workspace；working tree、index、untracked 均为 0。四态无范围外路径，符合 `E-014`。
- `git diff --check master...HEAD` 退出 0。

## 3. B3 与整卡验证是否真绿

**PASS。**

### A33：矩阵索引与 dev-harness

- 对 `f3af14e^:AGENTS.md` 截取阅读矩阵，索引为零命中，形成有效 RED，符合 `E-009`。
- 对当前 AGENTS 截取同一小节，`index_count=1`，唯一命中为矩阵内 relay-light 行；小节外命中不能使该断言通过，符合 `E-010`。
- dev-harness 当前三摘要与 B1 baseline 逐项相等：HEAD=`00c035c6ba5115e9924ec9c7c3e5aed706cf1e3d`，tracked/untracked 均为空输入 SHA-256；3/3 比较通过，符合 `E-012`。

### A29：`dh relay-light` 解析

- 独立执行 `dh relay-light` 后，输出第 1 行真实为 `=== dh-check: relay-light ===`。
- 进程退出码为 1，后续输出为存量健康检查失败；按 task_plan 的判据，模块标头证明 slug 已解析，非零体检结果不与解析结论混淆，符合 `E-011` 与 F-4。

### A28 / A34 / A29 / A33 整卡收束

- 协议段、完整流水判定句、“有意绕过 B-adjust”、“设计与验收仍走 dev-harness”、四项模块身份全部命中；旧单模块描述零命中。
- 两份 adapter 的派活 prompt 首行均与冻结样板整行字节一致，`adapter_count=2`。
- dev-harness 3/3 同态、`dh` 模块标头、diff check 与四态 allowed-paths 均通过。
- 上述独立重放结果与 `E-013` 记录的整卡原脚本 exit=0 一致，四条 HC 全部真实 GREEN。

## 裁决

**PASS**。B3 未偏离 task_plan、未越允许路径；A33、四条 HC 整卡机检、dev-harness 同态、`dh relay-light` 解析及 allowed-paths 四态证据均真实成立。
