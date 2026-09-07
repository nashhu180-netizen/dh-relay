<!-- dh:v1 -->
<!-- dh:workspace-contract:v2 -->
# brief — DHR_78 当前 P6 单一启动指令与一次补发

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|----------|-------------|
| DHR_78 | P6 | [DevPlan DHR_78](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md#dhr_78) |

## 目标 (Outcome)

通过唯一 Host Adapter sender 发出含任务指针和 Receipt 提交说明的启动指令；同一存活 driver 首次 accepted 后 60 秒无进展时，至多原样补发一次，并持久记录发送次数。

## Zero-context 自查

执行者仅凭本文件、`task_plan.md` 和 DevPlan DHR_78 可获知固定范围、五项验收和停止边界；合同冲突或需要新路径时停止并记录 `findings.md`，不自行扩围。

## 完成条件

| # | 条件 | 谁验（AI / 人） | 出处 |
|---|------|----------------|------|
| 1 | P6 node 使用仓根内且 SHA-256 匹配的 `instruction_ref`；缺失、越界或摘要变化均拒绝，三处旧 completion-only sender 归零，核心仅有一个 sender，内容含任务指针与 Receipt 提交说明。此项只覆盖 A9 核心分账。 | AI | DHR_78 / design/15 HC-SD-A9 |
| 2 | 同一存活 driver 首发 accepted 后 60 秒无当前 Attempt checkpoint/Result 时，在同一 Store 队列占用第 2 次并原样补发；已有进展不补发，授权后的迟到进展按合同保留窄竞态。 | AI | DHR_78 / design/15 HC-SD-A10 |
| 3 | 两次发送均先持久占次；错误、超时、失租、stop、身份或源摘要变化均停止；恢复/接管不发旧 Attempt，首发占次后调用前崩溃显示可能未送达，永无第三发且不阻塞观测/续租。 | AI | DHR_78 / design/15 HC-SD-A11 |
| 4 | 私有发送记录只含版本、关联、次数、host_ref、摘要与 outcome；复用原子写和 Run 保留策略，不存正文/凭据，不改公开协议或 checkpoint/Result 算法。 | AI | DHR_78 / design/15 HC-SD-A12 |
| 5 | 展示正常首发、无进展补发、已有进展不补发、首发占次后调用前崩溃四例安全摘要；最后一例清楚说明需检查现场，必要时 stop 旧执行后显式新执行，用户判断人工代价可接受。 | 人 | DHR_78 / design/15 HC-SD-H3 |

## 边界 (Boundaries)

- In scope：DevPlan DHR_78 `dh:allowed-paths:v1` 列出的生产、测试、工作区和收口文档路径。
- Out of scope：DHR_35 外围 prompt/真实链、Ticket/PlanHome/P7、timeline/event seq/UTC 持久计时、公开 event/RPC/read-model、checkpoint/Result 事务改造、用户配置/凭据、真实 Codex/Claude Agent。
- 何时必须停下问人：需要新增允许路径、改变正式合同、复核降级、P0/P1 三轮不收敛，或 E11 本地收口确认。

## 2026-09-07 用户确认的施工调整

- 本工作区承接用户批准的 allowed paths 增量，仅限以下两条用于 `instruction_ref` fixture，不削弱原断言或改写 Result 结算驱动；本轮不修改工作区外的 DevPlan：
  - `relay-core/test/identity-quota.test.mjs`
  - `relay-core/test/dhr76-profile-validation-lease.test.mjs`
- 已批准施工内容：修复 `workflow-driver` 的 blocked 重发与 stop-发送竞态；补恢复路径对已占次未发送的不确定投递处理及定时测试。已占次不能证明已发送或未发送，恢复须提示可能未送达，不自动重发旧 Attempt。
- 按 `task_plan.md` 的调整顺序优先修复既有发送安全合同缺口，再完成定向与完整回归；本调整不是机器项通过或复核结论。
- dsh-bridge Windows EBUSY 仅单独复现/定位；只有确证同一根因且进一步变更确有必要时才提出精确变更建议，不混入本卡整改，不授权修改 dsh-bridge。
- 施工授权只到 construction Node；本次顾问操作仅限本工作区计划工件。不得改生产代码、测试、Git 状态列，不做复核、验收或提交。
- 用户随后明文批准 `relay-core/tools/audit-contracts.mjs`、`relay-core/tools/structural-tokens.txt`、`relay-core/capability-baseline.json` 三条精确扩围；仅同步本卡 schema 变更必需的审计登记、结构 token 与 capability 摘要，不扩大其它治理范围。

## 触及子系统

- `relay-core`
