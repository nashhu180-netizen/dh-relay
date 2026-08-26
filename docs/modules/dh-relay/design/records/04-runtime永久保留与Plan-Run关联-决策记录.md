# runtime 永久保留与 Plan-Run 关联 · 正式设计决策记录

<!-- dh:planning-event:v1 id=DHR-A-22 stage=A-prime artifact=design/records/04-runtime永久保留与Plan-Run关联-决策记录.md review=../evidence/15-runtime永久保留-交叉审核记录.md#review-a22 understanding=../evidence/15-runtime永久保留-交叉审核记录.md#understanding-a22 -->

> DR-ID：`DHR-DR-04`；来源事件：`DHR-A-21`；本记录事件：`DHR-A-22`。决策事实以 [正式设计输入](../10-薄RelayPlan与显式节点边界-产品设计调整.md) 为准；审核过程见 [交叉审核记录](../evidence/15-runtime永久保留-交叉审核记录.md)。

## 决策

第一版不为新旧 runtime 设置到期时间，也不因 Run 成功、失败、取消、归档或容量预检自动删除历史目录。节点或 Run 收口仍须撤销 Ticket、关闭 Agent/Pair/终端并释放并发容量；真实终端尚未释放时使用 `pair_release_pending` / `pair_release_failed`，永久保留的历史目录不占 Agent 容量。

Plan 与运行历史采用一对多、runtime 侧单向关联：Run 根不可变保存 `plan_id + task_id`，每个 generation 保存 `resolved_plan_digest`。同 Run 新 generation 不得更换计划或任务身份；需要改变时创建新 Run。Plan 不反写 `run_id`，Ticket 的 `run_id + generation + digest` 只绑定精确计划快照，不替代完整节点身份链。

## 原因与边界

用户优先保护审计、恢复和排障现场，并接受本机磁盘随 Run 数量线性增长。永久保留只代表业务仓本机留存，不等于 Git 或跨机器备份；runtime 仍禁止凭据值、普通聊天和原始终端正文。未来若要删除、压缩、迁移或配额治理，必须重新走 A-full/B-adjust，不能由 Runner 或实现自行猜期限。

本决策不扩大当前 DHR_30，不创建开发卡，不启用 `dh_relay/runtime/` 新根；后续承重 Plan/Resolver 与 Workflow/Actor 接线卡负责实现关联和验收。

## 反向指针

- 正式输入：`design/10-薄RelayPlan与显式节点边界-产品设计调整.md` §2、§3、§7、§8.3–§8.4、§9
- 审核、理解与整版确认：`design/evidence/15-runtime永久保留-交叉审核记录.md`
