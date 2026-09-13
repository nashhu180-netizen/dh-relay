<!-- dh:v1 -->
# check.C1 — RLT_08 Batch 1 checker

- 审核对象：exec commit `e4c8592`，信号 `READY_FOR_REVIEW`
- 审核边界：仅判断 B1 是否偏离 task_plan、是否越 allowed-paths、B1 验证是否真绿
- 结论：**FAIL**

## 1. 是否偏离 task_plan

**FAIL（证据登记偏离，AGENTS 施工内容未偏离）。**

- AGENTS 三处改动符合 B1：项目概况已改为两个现役模块；“dev-harness 落点 / slug”新增 relay-light 的 slug、文档根、代码根与英文 verify scope；`dh` 命令新增 `dh relay-light` 并把无参数行为改为须显式指定。
- dev-harness 的 HEAD / tracked diff / untracked 路径三份基线摘要已在动笔前生成并随 `e4c8592` 提交。
- 但 `task_plan.md` 要求“三个基线文件随 B1 提交，并在 progress 以 E-ID 登记”，批次信号模板也要求 `evidence=<E-ID,...>`。当前 B1 progress 行只有描述性摘要，READY 信号使用 `red:...` / `green:...` / `baseline:...` / `scope:...`，没有登记任何 E-ID。

### 可整改项

1. 在 `progress.md` 为 B1 的 RED、GREEN、dev-harness baseline、四集合 scope 检查分别登记稳定 E-ID，并把命令、关键输出/退出码及对应 commit 关联到这些 ID。
2. 追加一条更正后的 Batch 1 `READY_FOR_REVIEW` 信号，`evidence=` 只引用上述 E-ID 与 commit；不要改写历史信号。

## 2. 是否越允许路径

**PASS。**

- `e4c8592` 仅改 `AGENTS.md` 及 `docs/modules/relay-light/workspace/RLT_08/**`。
- `git diff master --name-only` 的分支累计变更也全部位于这两个 allowed-paths。
- 当前 working tree、index 与 untracked 集合均无范围外路径。

## 3. B1 验证命令是否真绿

**PASS。**

- 对 `e4c8592^:AGENTS.md` 重放 RED：旧单模块描述命中 2 行；五项 relay-light 新身份均未命中。
- 对当前 `AGENTS.md` 重放 GREEN：旧单模块正则退出 1（零命中）；`slug=relay-light`、文档根、代码根、英文 verify scope、`dh relay-light` 五项全部退出 0。
- `git diff --check e4c8592^ e4c8592` 退出 0。
- 三份 dev-harness baseline 文件存在且各恰为 1 行；其最终同态比较属于 B3，不在本批冒充完成。

## 裁决

**FAIL**。代码/文档改动、路径边界和 B1 红绿均通过；补齐 task_plan 要求的 E-ID 证据登记及更正信号后，可重审 Batch 1。
