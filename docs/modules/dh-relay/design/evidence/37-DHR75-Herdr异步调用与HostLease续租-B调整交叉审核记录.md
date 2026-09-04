<!-- dh:v1 -->
# DHR_75 Herdr 异步调用与 Host Lease 续租 — B 调整交叉审核记录

## 1. 事件与正式输入

- **事件**：`DHR-B-40`，2026-09-04。
- **触发事实**：DHR_72 三次 DSH-off Codex 实录都在首条 `host_observation_changed` 前停止推进，脱敏事件账显示 15 秒 Host lease 先于 `attempt_started` 到期。
- **统一 resolver 输入**：`design/10`、`design/07`、`design/08`、`design/11`、`design/12`、`design/13`。本次实际承接 `design/12` 的 `P6-RI-A3/A4` 与 `design/10` 的 `HC-3AT-A29`、`HC-P1-A6`、`HC-CTRL-H1`；不修改稳定合同。
- **代码侦察**：`host.mjs` 默认 lease TTL 为 15,000ms、续租 tick 约为 TTL/3；`herdr-cli.mjs` 使用 `spawnSync`，`agent start` 上限 60,000ms。同步调用阻塞同一 Node 事件循环是当前最强候选机制，不登记为已排他的根因；其它机制继续归 DHR_73。
- **候选**：[DHR-B-40 草案](../../dev_plan/drafts/DHR-B-40-Herdr同步启动阻塞HostLease续租-候选.md)。

<a id="review-b40"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-40 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->
## 2. 交叉审核与主控裁决

### 2.1 第一轮 fresh 只读审核

- reviewer：`/root/dhr_b40_review`；静态只读审核，未运行测试、未修改文件。
- 结论：`CHANGES_REQUESTED`，P1×6、P2×1。
- **全部采纳**：把根因降级为“最强候选”；机器证补默认 TTL、逐次 expiry、同事件循环、至少两次 renew、独立 contender 与 TTL-only 反变异；补 fencing、child close 和 Windows 后代清理；移除 `workflow-driver.mjs`；冻结与 DHR_72 在 `herdr-adapter.test.mjs` / `package.json` 的不重叠边界；补 DHR_74 回签、DHR_73 调查和有效单测九字段。

### 2.2 第二轮定向复审

- reviewer：`/root/dhr_b40_recheck`；静态只读审核，未运行测试、未修改文件。
- 1~5、7 项到位；第 6 项报 P1：主树计划仍写 DHR_72“未开始”，候选写“保持进行中”，状态来源不清。
- **裁决**：不采纳把 DHR_72 退回“未开始”；采纳消除歧义。候选改为分别登记主树陈旧状态、此前用户已完成 D-start 的在途事实、以及本次落盘只作机械对齐，不形成新施工授权。

### 2.3 状态措辞窄复审

- reviewer：`/root/dhr_b40_state_recheck`；静态只读审核，未运行测试、未修改文件。
- 初审报 P2：`origin/master..wt/DHR_72` 的 ahead 9 包含 master 自身 3 笔历史，不能称为 9 笔 DHR_72 提交。
- 修订为“相对 `master@bbeffc4` 新增 6 笔；相对 `origin/master` ahead 9 含 master 3 笔历史”后，同一 reviewer 定向复核 `PASS`，无新增问题。

### 2.4 最终裁决

- `D-B40-1`：采纳“消除 Herdr CLI 同步阻塞”，拒绝以延长 TTL 作为修复。
- `D-B40-2`：新增独立 heavy 卡 `DHR_75`，不扩大在途 DHR_72 的启动/adapter 禁改范围。
- 顺序冻结为 `DHR_70 → DHR_75 → DHR_72 → DHR_35`；DHR_73 保持纯调查，DHR_74 仍须等 DHR_72 机器证 H 入 master 后回签。
- 本调整只落正式计划、审核证据和机械状态同步；不授权 DHR_75 D-start、代码、真实 Agent、verify、任务分支合并、推送或部署。

<a id="understanding-b40"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-40 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->
## 3. 理解反馈与用户确认

- 主控曾问“若 DHR_75 取得 checkpoint，DHR_72 能否直接复用”，用户指出“这种有啥好问我的”。该反馈成立：答案已由既有证据边界冻结为“不能复用”，不是需要用户取舍的产品问题；本记录不把它伪装成理解答题通过。
- 真正决定点只剩两项技术路线。主控给出明确推荐后，用户于 2026-09-04 明文“你你自己决定把”，即委托主控在本次 B-adjust 内裁决。
- 主控据此选择异步有界 CLI + 独立 DHR_75。委托范围止于本次计划落盘；DHR_75 仍须单独 D-start。

## 4. 结论

`DHR-B-40` 审核闭合并生效。它补的是“合法慢 Herdr 调用期间不能饿死 Host lease 续租”的实现前置，不宣称 DHR_72 checkpoint、DHR_35 P6-M1、DHR_73 启动可靠性或 DHR_74 verify 已完成。
