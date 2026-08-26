# DHR-A-21：runtime 永久保留候选

> 状态：已由 `DHR-A-21` 审核闭合并获用户整版确认，内容已晋升到正式输入 `design/10-薄RelayPlan与显式节点边界-产品设计调整.md`；保留本候选作形成留痕，不授权开发、新根启用或推送。

## 1. 用户决定与人话目标

用户明确决定：“暂时按照不删除的来吧。就当是永久保存好了。”

当前产品合同据此按“永久保留”理解：第一版不为 `dh_relay/runtime/<run_id>/` 设置到期时间，不因 Run 成功、失败、取消或归档而自动删除目录。以后若要增加删除、压缩、迁移或配额策略，必须另行修改正式设计，不能由实现自行猜期限。

## 2. 必须分开的两种清理

1. **运行资源收口仍是必做动作**：节点或 Run 收口后撤销 Ticket，关闭对应 Agent/Pair/终端并释放并发容量；未确认关闭的真实终端继续占容量并产生 Attention。
2. **历史文件不做自动清理**：运行资源已经释放后，runtime 目录继续作为本机历史现场保存；目录存在不代表 Run 仍活跃、可恢复或可继续。

永久保留的 terminal runtime 不计入 Agent/Pair 并发容量。只有仍存活、处于退出宽限期或关闭失败的 Agent/Pair 才属于容量占用；不得把“文件仍保留”和“终端尚未释放”合并成同一个 `cleanup-pending` 状态。正式稿统一把后者命名为 `pair_release_pending` / `pair_release_failed`，只描述真实 Agent/Pair/终端的释放过程；永久保留的目录不产生 release failure。

## 3. 状态、恢复与查看边界

- `plans/<plan_id>` 是可重复使用的接力路线；`runtime/<run_id>` 是这条路线某一次实际执行的现场，一份 Plan 可以对应多个 Run 目录。Run 根的不可变元数据必须保存 `plan_id + task_id`，每个被激活的 generation 必须保存当次 `resolved_plan_digest`（运行计划快照指纹）。关联权威在 runtime 一侧，Plan 文件不因每次运行而反向追加 `run_id`。之后修改 tracked Plan 不会改写已经存在的运行或历史目录；只有经授权激活同一 `plan_id + task_id` 的新 generation，或启动新 Run，才产生新的快照指纹。若新计划要改变 `plan_id` 或 `task_id`，必须创建新 Run，不得在原 Run 内换身份。
- active 与 history 必须按 Runtime Store 的业务终态区分，不能按目录是否存在推断。查看沿用 DHR_30 已冻结的 `listRuns/inspectRun`、`RunSummary/RunDetail` 与 CLI `list/status/inspect`，本事件不新增 Read Model API 或字段；后续卡只接入新根并验证既有投影。
- terminal Run 的 Ticket、Lease、Pair 与 Attempt 能力保持撤销；对其执行 `continue`、resume 或结果补写必须稳定拒绝。
- 成功、失败和取消的 runtime 使用同一永久保留规则；失败现场不因异常结束而更早删除。
- `dh_relay/runtime/` 仍按 Git 语义忽略，因此“永久保留”指留在当前业务仓本机，不等于 Git 备份。tracked `plans/`、`archive/` 仍不由 Runner 自动删除；既有归档职责不因 runtime 留存而取消。
- 第一版不新增到期删除、按容量淘汰或 Runner 自动清理入口。操作系统外部手工破坏目录不属于 Runner 可以承诺阻止的行为；一旦发现历史目录缺失或半写，沿用 DHR_30 既有只读错误/reason surface 明确报错，并从 active/可恢复集合排除，不能伪造完整历史或新增一套状态字段。
- 永久保留同时适用于 Relay 发现的 legacy `.dh-relay/`、`.dh-runtime/relay/` 现场：继续只读发现，不原地改名、迁移或删除；新正式根仍为 `dh_relay/runtime/`。

## 4. 安全与空间边界

永久保留不放宽安全合同：runtime 仍禁止凭据值、普通聊天正文、原始 Pane 文本和临时文件；诊断快照仍须先白名单、再脱敏、再 UTF-8 限长。

本次决定不顺带建设复杂的配额、压缩或磁盘管理子系统。存储写入失败仍按既有 fail-closed 规则处理，不得以自动删除旧 runtime 作为恢复手段。以后确有容量压力时，另做 A-full/B-adjust 决定可删除范围、备份条件与人类授权。

## 5. 正式设计拟修改点

1. §7“清理”改为“运行资源收口与历史保留”，删除“归档/导出与保留期满足后清理 runtime”的现役语义。
2. `HC-3AT-A22` 属语义变换，不复用原 ID：在正式验收矩阵中标记为 `superseded`，新增 `HC-3AT-A30` 承接永久保留合同。现有 legacy acceptance mapping 不含 A22/A30，因此不伪造 mapping 变更，只更新正式设计、反例和本事件决策记录。
3. `HC-3AT-A12/A26/A27/A29` 与反例矩阵中的 cleanup/capacity 统一改为 `pair_release_pending` / `pair_release_failed`，只指 Agent/Pair/终端资源释放，不再指 runtime 目录删除。
4. 新增 `HC-3AT-H10`：通过 DHR_30 既有 Read Model/CLI 结束并查看成功、失败、取消三类 Run；它们不出现在 active、不能继续、也不占 Agent 容量。该验收不要求 DHR_30 新增接口或字段。
5. §9 记录本次用户决定；§10 的 Resolver 启用闸从“保留与清理验收”改为“永久保留、历史识别与运行资源释放验收”。
6. 新增 `HC-3AT-A31` 冻结 Plan→Run→generation 的一对多关联：Run 根保存不可变 `plan_id + task_id`，generation 保存 `resolved_plan_digest`；同 Run 新 generation 不得改变计划/任务身份，改变时必须创建新 Run。Ticket 通过 `run_id + generation + resolved_plan_digest` 绑定精确计划快照，但这三个字段只负责快照关联，不替代 Ticket 的 node/pair/attempt/agent 等完整身份链。Plan 不反向变成运行索引。该合同由后续承重 Plan/Resolver 与 Workflow/Actor 接线卡实现，不扩大当前 DHR_30 卡。

## 6. 拟新增验收

### 机器验收 `HC-3AT-A30`

- Run 成功、失败或取消进入 terminal 后，其精确 `runtime/<run_id>/` 目录及持久工件均不因生命周期事件、归档完成、时间经过或容量预检被 Runner 删除。
- terminal runtime 可由 history Read Model 定位，但从 active 集合排除；目录存在不能使 Run、Ticket、Lease、Pair 或 Attempt 复活。
- permanent-retained terminal runtime 不计入 Agent/Pair 容量；仅真实未退出或关闭失败的 Agent/Pair 进入资源释放等待并阻断替代实例。
- runtime 缺失、半写或存储失败时通过既有只读错误/reason surface fail-closed，并从 active/可恢复集合排除；不得自动删除其他历史 Run 来腾挪空间，也不新增另一套 canonical 状态字段。
- 新旧根迁移只读发现旧现场，不原地删除或改名；新旧现场均不由 Runner 自动删除，Resolver 迁移验收前仍禁止新根 start。

### 人类验收 `HC-3AT-H10`

分别结束一个成功、失败和取消的 Run，通过既有 `list/status/inspect` 查看状态，并让其中一个终端短暂处于退出宽限期。用户应看到：宽限期内仅该真实终端以 `pair_release_pending` 占容量；释放后，三类 Run 都从 active 消失、仍可检查；继续旧 Run 被拒；永久保留目录不占 Agent 容量，文件没有被 Runner 自动删除。

### 机器验收 `HC-3AT-A31`

- 同一 `plan_id` 连续启动两次时产生两个不同 `run_id`；两个 Run 根都保存同一个 `plan_id` 与对应 `task_id`，但各自保存自己的 generation 与 `resolved_plan_digest`。
- tracked Plan 改变后，既有 Run/generation 的元数据与指纹保持不可变；新 Run 或经授权的新 generation 才记录新指纹。
- 同一 Run 只允许为相同 `plan_id + task_id` 激活新 generation；请求改变任一值时稳定拒绝，并要求创建新 Run，原 Run 根和已有 generation 均不改写。
- 新 Run 缺 `plan_id` 或 `task_id`、激活 generation 缺 `resolved_plan_digest`、Ticket 的 `run_id/generation/digest` 与 Store 不一致时 fail-closed，不能启动或推进节点。
- Plan 文件不因 Run 创建、结束或永久留存而写入 `run_id`；跨 Run 查询可由现有 Read Model/索引投影，但关联权威仍是 Run Store。
- 当前 DHR_30 不新增 Plan/Resolver 业务判断；后续 Workflow Engine 生成带关联字段与 guard 的业务命令，HostSessionActor 仍只按 Schema/身份/guard/CAS 物理落账。

## 7. 不变边界

- 不扩大 DHR_30：它仍只负责 Runtime service、RPC、Read Model 和持久操作 Receipt；本事件只复用其既有 `listRuns/inspectRun`、`RunSummary/RunDetail` 与 CLI `list/status/inspect`。
- 不在本事件中创建 DHR_53 及后续开发卡，不启动 `dh_relay/runtime/` 新根。
- 不改变薄 RelayPlan、Ticket、Review Batch、停滞恢复、Role Relay 与用户 Approval 的其他合同。
- 不把“当前永久保留”写成永远不可变；未来如改变，必须重新走 A-full，并由后续 B-adjust 调整实施卡。
