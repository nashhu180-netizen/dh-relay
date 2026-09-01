<!-- dh:v1 · dev_plan/drafts/DHR-B-34-Claude提交租约actor-closed-候选.md -->
# DHR-B-34 候选 · Claude Receipt 提交撞上已关闭的执行器（草案）

> 状态：**已落盘**。第一轮 fresh 审核（`b34rev1`/`b34rev2`）不通过、P1 全部采纳后修订为 v2，第二轮定向复审（`b34ver1`）PASS；用户 2026-09-01 点选「确认落盘（含 DHR_35 改为 blocked-by:DHR_70）」，本草案 v2 已写进 [P6 正式 DevPlan](../P6-Herdr多账号执行底座-开发方案.md)（§0.2 `B-34` 事件段、§3.1 任务表 `DHR_70` 行、§3.2 `DHR_70` 任务卡、§6 查漏、§7 完工清单），审核账见 [evidence/34](../../design/evidence/34-DHR70-Claude提交租约actor-closed-B调整交叉审核记录.md)。**落盘后本草案只作历史留痕，不再是权威。**
> 触发：DHR_35 2026-09-01 真实 Claude 闭环 E-3526 / F-3514；用户对话明文「另外开」。
> 上游设计：[design/12](../../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md)（`DHR-A-26`）P6-RI-A1/A3/A4。**不触发 A-full**。

## 1. 触发

DHR_35 在 DHR_68/DHR_69 闭合后重跑 Windows 真实产品节点：

| 路径 | 启动 | 提交 | 终态 |
|---|---|---|---|
| Codex `herdr.codex.main` | 通 | 通（晚于一次 `E_EXECUTOR_RESULT_MISSING` Attention） | `succeeded`；Result `source=receipt-bound-submission/v1`（E-3525） |
| Claude `herdr.claude.main` | 通（`attempt_started` + Receipt） | `submit-executor-result` → **`E_LEASE_HELD:actor-closed`** | 节点停在 `running`，无 Result，600s 超时（E-3526） |

Claude 账上最后一条业务事件是 `host_observation_changed`（`02:44:23Z`）：`herdr_status=idle;agent_get=idle;pane_get=error`。**没有** `E_EXECUTOR_RESULT_MISSING`、**没有** `E_EXECUTOR_HOST_LOST`、**没有** `run_finished`。同一隔离 env 从主控进程再交一次，仍是 `actor-closed`。

**租约时间（worktree `c0aa1ef` 的 `host-lease.json`，第一轮审核独立打开）：**

| | 取得 | 过期 | 最后业务事件 | 提交 |
|---|---|---|---|---|
| Claude | `02:43:35Z` | **`02:44:14Z`（约 39s）** | `02:44:23Z`（已过期） | 过期之后 → actor-closed |
| Codex | `02:31:51Z` | `02:40:17Z`（约 8.5min，期间在续） | Result `02:40:00Z` | 过期前成功 |

`E_LEASE_HELD:actor-closed`：`host.mjs` 在 actor `finished` **或失租** 后拒绝一切 `submitControl`。design/12 §3：**无 lease 不得接收**；但 **Run 非终态且 Receipt 仍 current 时，必须能重新取得 lease、重建 gate 再接收**。不得把「旧 actor 必须还活着」写成修复目标。

这直接打穿 design/12 §3：**非终态、带 `result_submission_mode:"receipt-bound/v1"` 的 Attempt，service 在正常完成前不得丢掉 receiver gate / 提交权**。P6-RI-A4 要求 Codex **和** Claude 都能交到 Result；Claude 现在交不进去。

## 2. 已核事实 vs 本卡要证的根因

**已核（独立可打开的工件，不靠口述）：**

1. DHR_68 的 Claude `pane run` json-parse 已不复现：本次进到了 Attempt/Receipt。
2. `workflow-driver.mjs` 对 `idle`/`done`：先 `waitForExecutorResult`（默认 60s），到期写 `E_EXECUTOR_RESULT_MISSING` 然后 **return 结束本届 herdr 等待**。Codex 走了这条仍能晚交成功，说明「driver 届结束 ≠ 提交权必须死」。
3. Claude **没写出** 那条 Attention，说明它不是「等满 60s 的正常等待_human 路径」，而是 **actor 在仍非终态时先死了**，后续提交找不到活的 `submitControl` 队列。
4. 观测带 `pane_get=error`（仅 Claude）。DHR_69 覆盖规则是 idle∧blocked 才派生 blocked；`error` 不覆盖。它是伴随信号，**不能未经负例就当成根因**。

**本卡要用夹具钉死的根因：**

| 编号 | 假说 | 夹具要红的行为 |
|---|---|---|
| H1 | 旧 actor 已 `finished`/失租后，`ensureActor` 把死 actor 交回，或不重建 gate | **先让旧 actor 因结束或失租拒绝**，再断言 service 为同一非终态 Run **新取 lease、新 actor**，提交恰好一个 Result；旧 actor 零 mutation |
| H2 | `pane_get=error` 使 herdr 等待提前退出且不保留/不重建 gate | fake：agent idle + paneGet 失败；若 lease 仍在则直接补交；若已失租则走 H1 重建 |
| H3 | 提交打到陈旧 endpoint/代次，而不是**当前持 lease 的 actor** | 对账 endpoint + descriptor generation；覆盖「原 service 仍活」与「service/actor 已换届」。**禁止**把「必须打到写 Receipt 的那一届进程」写成验收——那与重启恢复冲突。`DH_RELAY_*` 不改变 Windows pipe 身份，不能单独当 H3 绿证 |

允许路径以 H1 为主。H3 仅当证明发现层有洞才动 `launcher.mjs`。不得改 RPC schema、不得改 DHR_35 实录脚本语义、不得改 Herdr 产品。

## 3. 拟议任务卡 DHR_70

- **目标**：让 Receipt-bound 的 `submit-executor-result` 在 Attempt 仍非终态时，一定打到活的 actor/gate 并写入唯一 Result。覆盖 DHR_35 已暴露的 Claude 形态（启动已成功、提交报 actor-closed）。
- **非目标**：不改 Receipt/Result/RPC 合同与 reason code 表；不跑真实 Agent（DHR_35 复验）；不改用户级 registry/凭据；不碰 Linux/SSH；不代产品做目录信任；不把 Codex 已通的路径重写成新语义。
- **档位**：标准（外部宿主组件接线 · 高危）。**任务类型=heavy**。
- **依赖**：DHR_64、DHR_68、DHR_69（均已完成）。
- **DHR_35**：B-adjust **落盘时**在 P6 DevPlan 任务表把依赖改为含 DHR_70，备注 `blocked-by:DHR_70`。这是计划回填，**不是** DHR_70 施工允许路径。Claude 真实闭环在本卡闭合且用户**重新放行 DHR_35** 前不再跑。Codex E-3525 不得写成 P6-RI-A4 已满足。DHR_70 自己不跑真实 Agent。
- **验收口径**：
  - **机器证 A1**（P6-RI-A1）：lease **仍然有效**、Receipt current、节点非终态 → 晚交（含 driver 本届 herdr 等待已结束）必须 committed Ack + `relay.result/v2`（`source=receipt-bound-submission/v1`）。
  - **机器证 A2**（P6-RI-A1 + §3 重建）：旧 actor 已结束或失租、Run 非终态、Receipt 仍 current → 旧 actor 对提交拒绝且零 mutation；service **新取 lease、新 actor、重建 gate** 后提交恰好一个 Result；同 digest 重投幂等。
  - **机器证 A3**（P6-RI-A3）：无法合法取得当前 lease（真 lease-lost / 非 current Receipt / 已终态）→ 保持拒绝、零 mutation。禁止为修 actor-closed 放宽单写者。
  - **机器证 B**：未知 Receipt / 终态冲突 仍按现役拒绝或幂等。
  - **机器证 C**：`agent_get=idle` ∧ `pane_get=error` 不得单独把 Attempt 写成 `E_EXECUTOR_HOST_LOST` 终态；提交走 A1 或 A2。
  - **机器证 D**：定向套件可复跑；`git diff --name-only` 不越允许路径。
- **允许路径**（精确）：
  - `relay-core/runtime/service.mjs`
  - `relay-core/runtime/workflow-driver.mjs`（仅提交权/gate/actor 复用与 idle 等待收口，不得改 Result mutation 语义）
  - `relay-core/runtime/host.mjs`（仅当 H1 证明 actor.done 过早；不得改 lease 单写者合同）
  - `relay-core/runtime/launcher.mjs`（仅当 H3 成立）
  - `relay-core/test/dhr70-submission-gate.test.mjs`（新建）
  - `relay-core/test/dhr64-result-bridge.test.mjs`（仅当既有断言因合法 gate 复用必须最小更新）
  - `relay-core/package.json`（只可向 test script 追加本卡测试文件名）
  - `docs/modules/dh-relay/workspace/DHR_70/**`
- **不得改**：`contracts/**`、`store/**`（mutation 语义）、`herdr-cli.mjs`、`herdr-executor.mjs`（除非 C 的负例证明必须动观测且另走用户确认扩路径）、DHR_35 工作区、用户级配置。

## 4. 决定点

| ID | 问题 | 主控推荐 |
|---|---|---|
| D-B34-1 | DHR_35 是否等本卡？ | **等**。Claude 半截实录不能当 P6-RI-A4。 |
| D-B34-2 | 晚交时系统应怎样？ | **由当前持 lease 的 actor 补交成功**。旧 actor 已关/失租时，先合法新取 lease 再建 gate，不是要求旧进程还活着，也不是绕过单写者。 |

无第三决定点：H1/H2/H3 是施工夹具归因，不把产品语义交给用户猜。

## 5. 查漏（覆盖 / 颗粒度 / 依赖）

- **覆盖**：P6-RI-A4 的 Claude 半边现无人修；本卡认领提交权，不认领 DHR_35 的真实 Agent 实录本身。P6-RI-A1/A3 的「非终态必须还能交」由本卡机器证 A/B 认领。
- **颗粒度**：一个验收单元（提交权在非终态保持）。不把 pane_get=error 拆成第二张卡，除非本卡收口证明它是独立生产缺陷。
- **依赖**：DHR_70 ← DHR_64/68/69；DHR_35 ← DHR_70。无环。
- **不触发 A-full**：不改 design/12 字段、reason code、Result 直写禁令。
