<!-- dh:v1 -->
# DHR_76 Profile 同步校验阻塞 Host Lease — B 调整交叉审核记录

## 1. 事件与正式输入

- **事件**：`DHR-B-41`，2026-09-05。
- **触发事实**：`wt/DHR_75@44e8efc` 的 DSH-off Windows 真实 F 在首条 Host Observation 前失租；两次完整 Profile loader 均约 19.7 秒，超过默认 15 秒 lease。
- **统一 resolver 输入**：`design/10`、`design/07`、`design/08`、`design/11`、`design/12`、`design/13`。本次实际承接 `design/12` 冻结决定 4、`P6-RI-A3/A5` 与 `design/10` 的 `HC-3AT-A29`、`HC-P1-A6`、`HC-CTRL-H1/H10`；不修改稳定合同。
- **代码侦察**：runtime 在 Attempt 前对完整 registry 调用同步 `validateProfiles(resolveAlias:true)`；validator 逐 Profile 同步执行 `where.exe`，失败再执行 `pwsh Get-Command`。该段早于 DHR_75 的异步 Herdr CLI，因此 DHR_75 续租尚无机会运行。
- **候选收敛**：候选目标、非目标、验收、允许路径和依赖已完整并入 P6 DevPlan 的 DHR_76 卡面；临时 review brief 与候选不另立 planning event。

<a id="review-b41"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-41 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->
## 2. 交叉审核与主控裁决

### 2.1 fresh-context 只读审核

- reviewer：Herdr `dhr-b41-review`；`wt/DHR_B_41@4559161`；静态只读，审核前后仅候选与 review brief 两个未跟踪文件，tracked diff 为空；未运行测试。
- 初审 `CHANGES_REQUESTED`：P0=0、P1=1、P2=2。P1 指出候选要求生产取消链但 driver 路径只读；两个 P2 指出预算/错误面未冻结和全表变异措辞歧义。
- 主控裁决：采纳三个问题。删除“stop 取消启动前探针”的新增承诺，冻结单探针 15s、整轮 60s、清理 10s、测试 120s 与既有错误面；全表变异改为保留非目标坏项并变异生产代码跳过它。

### 2.2 两轮定向复审

- 第一轮确认预算/错误面与全表变异到位，但报 P1：同步改异步后，`driver.stop()` 可在 loader await 期间置 `stopping=true`，校验返回后若不复查会继续开 Attempt。
- 主控采纳并极窄开放 `workflow-driver.mjs`：只在 `await loadExecutorProfiles()` 返回后、`openAttempt()` 前复查既有停止态；不传取消信号，不改轮询、Result、lease、recovery 或其它启动语义。
- 第二轮窄复审 `PASS`：上述位置、反向禁改与 Attempt/Agent/pane/Result 全 0 的负例均可验收。至此 P0/P1/P2 全部闭合。

### 2.3 最终裁决

- `D-B41-1`：新增独立 heavy 卡 `DHR_76`，不扩大 `wt/DHR_75` 的既有范围。
- `D-B41-2`：保留完整 registry 任一坏项整体 fail-closed，以非阻塞、自身有界探针消除 lease 调度饥饿；不采用只校验目标 Profile或拉长 TTL。
- 顺序冻结为 `DHR_70 → DHR_76 → DHR_75 → DHR_72 → DHR_35`；DHR_74、DHR_73 的既有义务不前移。
- 本调整只落正式计划、审核证据与机械状态同步；不授权 DHR_76 D-start、生产代码、真实 Agent、用户级配置、verify、合并、推送或部署。

<a id="understanding-b41"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-41 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->
## 3. 理解反馈与用户确认

- 主控曾问“DHR_76 合入后，DHR_75 能否直接引用其实录”，用户指出“这种问题没啥意义”。该反馈成立：答案已由单卡 baseline 与证据不可串用规则冻结，不是用户需要决定的业务取舍；本记录不把它伪装成理解答题通过。
- 用户此前已对“另立前置修复卡处理全表同步 alias 校验，避免扩大 DHR_75”的推荐明文回复“按建议”。主控据此裁决新增 DHR_76、保持完整 registry 严格校验，并完成本次计划落盘。
- 授权止于 B-adjust 正式计划；DHR_76 仍须单独 D-start，DHR_75 仍须在吸收 DHR_76 后自跑真实 F。

## 4. 结论

`DHR-B-41` 审核闭合并生效。它补的是“启动前完整 Profile 校验不能饿死 Host lease，且异步返回后不能越过既有 stop 状态开 Attempt”；不宣称 DHR_75、DHR_72、DHR_35 或 DHR_74 已完成。
