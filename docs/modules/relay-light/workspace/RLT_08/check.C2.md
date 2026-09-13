<!-- dh:v1 -->
# check.C2 — RLT_08 Batch 2 checker

- 审核对象：exec commit `59d7d22`，信号 `READY_FOR_REVIEW`，证据 `E-005`～`E-008`
- 审核边界：仅判断 B2 是否偏离 task_plan、是否越 allowed-paths、B2 验证是否真绿
- 结论：**PASS**

## 1. 是否偏离 task_plan

**PASS。**

- 在现役 Runner 协议段之前新增了并列的 `## relay-light 编排协议段`，没有混写或替换 Runner 段。
- relay-light 段包含四字段标头样板、完成信号即停、无 `node_closed`、三层分工和禁止越位/续节点，符合 B2 位置与样板合同。
- 计划例外逐字包含“有意绕过 B-adjust”与“设计与验收仍走 dev-harness”，并把白名单锁在任务卡、开发方案任务行、接力计划追加，没有扩张到 design/验收。
- Runner 通用铁律第 2 条只追加“有 RELAY_RECEIPT 即冻结 Runner 流水，不交叉执行 relay-light”的归属边界；原条款全文作为新行前缀逐字保留，未删除或弱化。
- `progress.md` 已用 `E-005`～`E-008` 登记 RED、adapter、GREEN、scope，并由 READY 信号引用。

## 2. 是否越允许路径

**PASS。**

- `59d7d22` 只改 `AGENTS.md`、`findings.md`、`lesson_candidates.md`，均属于 `AGENTS.md` 或 RLT_08 workspace 闭集。
- `git diff master --name-only` 的分支累计变更无范围外路径；当前 working tree、index、untracked 也无范围外路径。

## 3. B2 验证命令是否真绿

**PASS。**

- RED：对 `59d7d22^:AGENTS.md` 重放四条固定字符串检查，协议段、判定句及两句例外均零命中，符合 `E-005`。
- A34 adapter：两份 `adapter-*.md` 的派活 prompt 首行均逐字节等于 `[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>`，且文件数恰为 2；AGENTS 的反引号内样板与其逐字一致，符合 `E-006`。
- GREEN：协议段、完整判定句、“有意绕过 B-adjust”、“设计与验收仍走 dev-harness”四项全部命中；冻结句在 relay-light 判定与 Runner 边界中均存在，符合 `E-007`。
- Runner 保护：脚本比对确认修改后的 Runner 第 2 条以修改前整行作为前缀，仅在行尾追加分流句；commit diff 中其余 Runner 铁律无改动。
- `git diff --check 59d7d22^ 59d7d22` 退出 0；允许路径检查符合 `E-008`。

## 裁决

**PASS**。B2 未偏离 task_plan、未越允许路径，A28/A34 与指定原文均真实 GREEN。F-3 记录的是冻结句的潜在两读，不改变本批按冻结 oracle 原文和“不交叉执行 relay-light”边界落地的事实。
