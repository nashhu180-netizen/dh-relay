<!-- dh:v1 · task_plan.md — 施工图。开工那一刻写，一次性消耗品：跑偏了去 progress.md 记实际，不回头改这里。 -->
# task_plan — DHR_70

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 (path / url) | 为什么 |
|---|---|---|
| C-001 | `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §3.2 DHR_70 | 唯一权威验收口径与逐条允许路径 |
| C-002 | `docs/modules/dh-relay/design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md`「唯一 writer 与 Result mutation」「Gate 生命周期」§4 P6-RI-A1/A3 | 冻结语义：无 lease 不得接收；非终态须能重建 gate 再接收 |
| C-003 | `relay-core/runtime/service.mjs`（`ensureActor` / `driveRun` / `submitExecutorResult` / `attach` / `detach`） | 主战场：提交路由与 actor 生命周期 |
| C-004 | `relay-core/runtime/host.mjs`（`runHostSession` 的 lease 续约与 `lostLease`；`createHostSessionActor` 的 `refuseIfClosed`） | `actor-closed` 的产生点与 lease TTL（默认 15s） |
| C-005 | `relay-core/runtime/workflow-driver.mjs`（submission gate 注册、`waitForExecutorResult`、idle/done 分支） | 本届等待结束后 gate 的归属 |
| C-006 | `relay-core/test/dhr64-result-bridge.test.mjs` | 现役 Receipt-bound 提交夹具基座，A1/B 的起点 |
| C-007 | `docs/modules/dh-relay/design/evidence/34-DHR70-Claude提交租约actor-closed-B调整交叉审核记录.md` | 根因时间线、两条主控失守、起点线索（非结论） |

## 施工步骤 (Steps)　★详细级

> **归因纪律**：H1/H2/H3 未钉死前不许下手改实现。第 1~2 步先用夹具复现，复现不出来就停下记 findings，不许"按线索直接改"。
> **红线自查（每步做完复读一遍）**：不放宽单写者；不把"打到写 Receipt 的那一届进程"写进断言；不改 reason code 与 Result mutation 语义。

| # | 改动文件（Create/Modify/Test + 路径） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|---|---|---|
| 1 | Read · `service.mjs` / `host.mjs` / `workflow-driver.mjs` / `dhr64-result-bridge.test.mjs` | 只读侦察：确认 ①`ensureActor` 在 actor 已 `finished` 但尚未从 `actors` map 摘除时会不会把死 actor 交回；②`submitExecutorResult` 首轮 `for (const [runId, driver] of drivers)` 抛 `actor-closed` 后是否**跳过**了后面的 durable 重建循环；③driver 本届等待结束后 gate 是否随 driver 一起消失。结论写 `progress.md`，**不改任何代码**。 | `git diff --name-only` → 空。三条结论各挂一条 `grep -n` 或行号引用。 |
| 2 | Test · Create `relay-core/test/dhr70-submission-gate.test.mjs` | **A2 红测先行**：构造非终态 Run + current Receipt，令旧 actor 因失租或结束进入 `refuseIfClosed`，再调 `submitExecutorResult`。断言：旧 actor 零 mutation；service 新取 lease/新 actor/重建 gate；`relay.result/v2` **恰一条**、`structured.source=receipt-bound-submission/v1`；同 digest 重投幂等（第二次不新增 Result）。 | `node --test relay-core/test/dhr70-submission-gate.test.mjs` → **红**，失败原因须是 `E_LEASE_HELD:actor-closed`（不是夹具自己搭错）。红的原因贴进 `progress.md`。 |
| 3 | Test · Modify 同上 | 补 **A1**：lease 仍有效、driver 本届 herdr 等待已结束（对齐 Codex E-3525 的晚交形态）→ committed Ack + 唯一 Result。若此条**当场就绿**，说明现役已满足 A1，照实记 `progress.md`，**不许**为了"看起来有红测"去改坏它。 | 同上命令 → A1 绿或红各自留证。 |
| 4 | Test · Modify 同上 | 补 **A3 负例 + B**：①真 lease-lost（另一进程已接管 lease，非"无主过期"）→ 拒绝且零 mutation；②非 current Receipt → 拒绝；③已终态 Run → 按现役幂等或冲突拒绝；④未知 Receipt → `E_IDENTITY_MISMATCH`。**这四条是防止第 6 步修过头的闸**，必须在实现前先绿。 | 同上 → 四条全绿（现役行为基线）。任何一条此刻就红 = 现役已有缺陷，记 `findings.md` 后再决定是否属本卡。 |
| 5 | Test · Modify 同上 | 补 **C**：夹具令 `agent_get=idle` ∧ `pane_get=error`（对齐 E-3526）→ 断言 Attempt **不**被单独写成 `E_EXECUTOR_HOST_LOST` 终态，提交仍走 A1 或 A2。 | 同上 → C 红或绿留证。 |
| 6 | Modify · `relay-core/runtime/service.mjs`（必要时 `workflow-driver.mjs`） | **最小实现**：让提交在 Run 非终态 ∧ Receipt current 时找到活的持 lease actor——老 driver/actor 已关时把它从 `drivers`/`actors` 摘掉并走 durable 重建路径（`ensureActor` 新取 lease → `driveRun` → `registerSubmissionGate`），而不是把 `actor-closed` 直接抛给调用方。**不改** `host.mjs` 的拒绝条件，**不改** lease 单写者合同。若夹具证明主因在 H2/H3，按实际改动落点并在 `progress.md` 写明与 H1 的偏离。 | `node --test relay-core/test/dhr70-submission-gate.test.mjs` → **全绿**；A3/B 四条负例**仍绿**（这是"没修过头"的判据）。 |
| 7 | Test · Modify `relay-core/package.json`（+ 必要时 `dhr64-result-bridge.test.mjs`） | `package.json` 只向既有 test script 追加 `dhr70-submission-gate.test.mjs` 一个 token。`dhr64-result-bridge.test.mjs` 仅当既有断言因合法 gate 复用必须最小更新才动，且每处改动在 `progress.md` 写明"为什么这是合法复用、不是放宽合同"。 | `npm test --prefix relay-core`（或仓内既有测试入口）→ 无新增失败；与 master 基线逐条对齐。 |
| 8 | Record · `progress.md` / `findings.md` / `lesson_candidates.md` | 证据账本逐条落 `E-70xx`；越界自查 `git diff --name-only` 对 DevPlan `dh:allowed-paths:v1 task=DHR_70` 逐条比对；跑 `dh dh-relay`。 | `git diff --name-only` ⊆ 允许路径；`dh dh-relay` 失败数 ≤ 落盘前基线（0 失败 / 76 警告）。 |

## 关键决策（一句话各一行）

- Worktree：**是**，分支 `wt/DHR_70`，目录 `.dh-worktrees/DHR_70`（从最新 master 切出）
- 派子 agent：**否**——S3 施工本会话自干（用户 2026-09-01 点选）
- Review：五路复核按 heavy Recipe，收口时另派 fresh 只读实例（codex `--sandbox read-only`）；轮 2 实例负责变异点选点
- 分批：**不分批**——一个验收单元（提交权在非终态保持），主会话自干过程可见
