<!-- dh:v1 -->
# task_plan — DHR_53 A23 重建施工说明书

> **新施工尚未授权。** 旧实施退场已于 2026-08-27 完成；本文件只把下一次施工写到可重建粒度。执行者收到新的 Work Item Ticket 后，先读仓根 `AGENTS.md`、本文件、`brief.md`、P7 DHR_53 卡和正式 design/10；不得沿用旧 `task_plan`、旧 review 结论或旧通过数。

## 0. 权威输入与现场锚点

| ID | 内容 |
|---|---|
| C-001 | `docs/modules/dh-relay/design/10-薄RelayPlan与显式节点边界-产品设计调整.md`：唯一产品输入 |
| C-002 | `docs/modules/dh-relay/dev_plan/P7-DevHarness单卡完整流水-开发方案.md` §3.2 DHR_53 |
| C-003 | 本目录 `brief.md`、`progress.md`、`findings.md` |
| C-004 | 旧现场已退役：HEAD `fec9ec1bbbab90813d7d3f3aad1dc847c317ca81`；tree `6452aebbab080ea6002ddd749b6cbc8061352744`；archive tag `archive/DHR_53/pre-A23-fec9ec1`；manifest `archive/legacy-fec9ec1-path-blob-manifest.md`；旧 worktree/branch 已删除 |
| C-005 | 当前 master 只在真正重建当刻重新读取并登记完整 SHA；禁止写“latest master” |

## 1. 旧实施退场与新施工前置

1. **已完成**：只读重验旧 worktree 的 canonical path、branch、HEAD、tree 与 clean/untracked 状态。
2. **已完成**：生成 61 路径的确定性 path/blob manifest，登记旧 commits、fixtures、tests、review、evidence 与 workspace 指针。
3. **已完成**：建立并核对 annotated archive tag、tag object、peeled commit 和 tree；按用户授权删除旧 worktree 与 `wt/DHR_53` 分支。
4. **待前置 Gate 与开工授权**：在真正重建当刻记录精确 master SHA，从它创建新的 `wt/DHR_53` worktree。不得 destructive reset，也不得恢复 archive tag 上的旧实现继续施工。
5. 新 worktree 第一动作 rebase/确认精确 master；只将新卡允许路径写入新的 execution strategy。

archive tag/manifest 对账失败，或新施工时 P5/P6 Gate、DHR_30 稳定接口、master SHA/工作区身份不满足，即停下更新 `findings.md`，不得猜测继续。

## 2. 实现批次

### 批次 A — PlanHome、registry/binding 与 TaskRef 合同

- 先写失败测试，冻结 versioned PlanHome descriptor、trusted project registry、ignored local binding 和全限定 TaskRef。
- Plan 可含多个 TaskRef；Run 根不含单一 `task_id`，只绑定 `plan_home_id + plan_id`。
- 覆盖 task ID 重号、未知 project_ref、canonical repo identity 错配、binding digest 漂移、workspace 缺失、locator 越界、伪造权限、repo-local 新根 start。
- 验证：新 schema golden/negative、canonical digest 与基线工具全绿；正式 PlanHome 目录仍未创建。

### 批次 B — 通用 Plan/Resolved Plan 与节点

- Plan 节点只含 TaskRef/subject set、instruction、depends_on、精确 executor binding、允许 result route、deadline 等通用字段。
- Resolver 读取 Plan、registry/binding 和外部项目业务权威以验证 TaskRef/workspace/HEAD；不读取 `task_type`、Recipe，也不推导施工/复核路径。
- 覆盖业务 `node_type`、Result Plan patch、未知 route、错 TaskRef/subject set、旧 generation/Attempt、absolute locator、输入摘要漂移。
- 验证：给一个未知业务 instruction，不修改 Core 枚举也能解析；同一输入重复解析产生逐字节相同 Resolved Plan/digest。

### 批次 C — Run/generation/history

- generation 保存完整 TaskRef set/digest、Resolved Plan digest、registry/binding digest 与永久不可变快照。
- tracked Plan 改变不修改 active generation；同一 Plan 可产生多个 Run。
- terminal runtime 永久保留但不可 continue、不可复活 Ticket/Lease/Pair/Attempt、不占容量；目录缺失/半写按既有错误面 fail-closed。
- 验证：success/failed/cancelled/history 多 Run、旧 generation 重放、runtime 目录存在但无 live Agent、任何自动删除路径负例。

### 批次 D — 零 DevHarness workflow/adapter 与独立验收

- 静态扫描生产 Schema/Resolver/Workflow/Ticket/状态/测试中的 `task_type`、Recipe、`construction/review/rework` 业务枚举、`workflows/dev-harness` 及换名等价层；允许 DevPlan 文档 marker 和合法 Herdr/Host/client adapter。
- 用通用 Plan fixture 跑离线单任务正例、多 TaskRef/跨项目解析正反例；真实跨项目并行不在本卡。
- 独立 Oracle 从 Plan source、registry/binding、generation snapshot 与 runtime facts 重算 TaskRef set/digest、Run 身份、history/live/capacity。
- 更新 `as-built/relay-contracts.md` 与 `as-built/relay-core.md`，并按 `relay-core/README.md` 重生成受影响基线。

## 3. 每批固定验证与收口

1. 失败测试先红、最小实现后绿；运行与改动对应的 contract/runtime/resolver tests。
2. 运行 `npm test`、contract selftest/audit、fixture manifest、capability baseline 等现有仓内入口；命令、退出码和计数写 `progress.md` Evidence Ledger。
3. 每批只提交本卡精确路径，禁 `git add -A`；Worker 写 Result/Handoff 后等 `node_closed`，不自行进入下一 Node。
4. 旧实现、旧 review 和旧测试通过数只能作为历史对照；新卡按 heavy 的 dev-harness 配方重新完成五路复核和有效单测。
5. 三轮仍有 open P0/P1 时停止，启动 fresh Decision Executor 的动作由未来 RelayPlan/编排 Agent决定，不由当前 Worker自行执行。

## 4. 明确禁止

- 未获新开工授权就创建新 worktree或执行代码动作。
- 修改 P5/P6/DHR_30/DHR_31，或读取 `.dh-worktrees/DHR_30` 未合入代码作为实现依赖。
- 创建正式 PlanHome、启动真实 Run、删除 archive tag/manifest 或 runtime 历史。
- 把 dev-harness 的 `task_type` 字段从 DevPlan 删除；禁用范围仅是 dh-relay Core 消费它。
- push、deploy、环境操作、凭据值落盘。
