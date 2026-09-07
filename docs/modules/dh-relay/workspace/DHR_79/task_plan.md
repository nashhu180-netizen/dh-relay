<!-- dh:v1 · 轻档 headless worker 施工说明书；开工后跑偏只记 task.md，不回写本文件。 -->
# task_plan — DHR_79 过期 quota driver 测试迁移整改

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是施工 worker，不是主控。先读仓根 `AGENTS.md` 与同目录 `task.md`；只执行本文件的 construction Node。不要加载 dev-harness skill，不问用户，不启动其他 Agent，不提交，不做复核/验收/销户。偏离只记 `task.md`，不回写本文件。

| ID | 来源 (path) | 为什么 |
|----|------------|--------|
| C-001 | `docs/modules/dh-relay/workspace/DHR_79/task.md` | 三条完成条件、E-7902/E-7903 两条 P1、旧确认失效与精确停止线 |
| C-002 | `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` 的 DHR_79 卡面 | 唯一允许路径、轻档 `task_type=light`、非目标 |
| C-003 | `relay-core/test/identity-quota.test.mjs` | 唯一测试改动目标；保留现有 3 个现役语义用例 |
| C-004 | `relay-core/runtime/executors/identity/fallback.mjs:34` 的 `buildFallbackPause` | pause/fence/attention 稳定字段与关联关系的生产合同，只读 |
| C-005 | `relay-core/runtime/attempt-retry.mjs:15` 的 `retryWithFrozenProfile` | `profile-not-frozen` 拒绝点与 DHR_80 已补的 `result_submission_mode`，只读 |
| C-006 | `relay-core/test/dhr80-retry-result-bridge.test.mjs:97` 的 `mutationSnapshot` 及 `:236` 起用例 | 零推进快照、retry Receipt mode 与正式桥接的可复用测试样板，只读；不要复制整套 service fixture |
| C-007 | `docs/modules/dh-relay/knowledge/教训库-候选.md` 的候选 1、6、12、61 | E-7902 命中的断言完整性与证据边界，只读 |

## 权威源铁律（必守）

1. 只改 `relay-core/test/identity-quota.test.mjs` 与 `docs/modules/dh-relay/workspace/DHR_79/task.md`；`task_plan.md` 由主控冻结，worker 不改。范围外停下并在 `task.md` 记阻塞。
2. 不修改 `workflow-driver`、Store、RPC、Result schema、`attempt-retry.mjs`、`fallback.mjs` 或其他生产代码；不恢复 driver 自动 fallback，不运行真实 Agent。
3. 保留现有三个测试的现役语义，不重新引入 `herdrJudge`、`startWorkflowDriver` 或 host `done`/`idle` 推导 Result。
4. 每批先跑该文件定向测试，必须取得自然终态与 exit code；红/绿关键结果逐批追加到 `task.md`。
5. 不执行 `git commit`、merge、verify、push、deploy、DHR_35/DHR_73 或任何其他卡。

---

## 施工步骤 (Steps) — worker 粒度

| # | 改动文件（Create/Modify/Test + 路径:锚点） | 怎么改（函数 / 样板 / 断言） | 怎么验（命令 → 预期输出） |
|---|---|---|---|
| B1 | Modify `relay-core/test/identity-quota.test.mjs`，测试 `canonical pause permits an explicit frozen-profile retry only` | 在 `appendFallbackPause` 前完整断言 `pause` 的稳定合同：顶层 `protocol/run_id/node_id/attempt_id/receipt_id/reason_code/raised_at`；`fence.protocol/attempt_id/receipt_id/reason_code/fenced_at`；`attention.protocol/run_id/node_id/attempt_id/receipt_id/reason_code/state/raised_at`；`manual_retry_profiles` 与 frozen snapshot 一致。`pause_id/fence_id/attention_id` 只断言 64 位十六进制格式与同输入确定性，不绑定随机 retry ID。成功 retry 后补断言新 Receipt 的 `result_submission_mode === 'receipt-bound/v1'`、run/node 关联、profile 身份与 attention 已关闭；随机 `attempt_id/receipt_id` 只断言前缀/非旧值，不写死。 | `node --test relay-core/test/identity-quota.test.mjs` → 自然终态、全部 pass、exit 0；`rg -n "herdrJudge|startWorkflowDriver" relay-core/test/identity-quota.test.mjs` → 0 命中（`rg` exit 1 是预期的无命中） |
| B2 | Modify `relay-core/test/identity-quota.test.mjs`，同一 fixture 新增独立 non-frozen 拒绝测试或清晰子段 | 参照 C-006 只抽取本文件所需的最小持久快照 helper：拒绝前后比较 `events.jsonl`、`state.json`、`results/`、`receipts/`、`pauses/`、`pause-resolutions/` 的文本或排序文件名。用 registry 中存在但不在 `pause.manual_retry_profiles` 的 profile 调 `retryWithFrozenProfile`，以 `assert.rejects` 精确匹配 `E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-not-frozen`；再 `deepEqual(after, before)` 证明零事件、零状态、零 Receipt、零 resolution 推进。不要用 mock/直接 Store mutation 绕过生产入口。 | `node --test relay-core/test/identity-quota.test.mjs` → 自然终态、预计 4 tests 全 pass、exit 0；若选择同测试内子段则记录实际测试数，不伪报 4 |
| B3 | Test `relay-core/test/identity-quota.test.mjs`; Test `relay-core/test/dhr80-retry-result-bridge.test.mjs`; Modify `docs/modules/dh-relay/workspace/DHR_79/task.md` | 只做施工态证据落账：记录两条命令的 tests/pass/fail/exit code、`git diff --check`、旧符号 0 命中，以及只改允许路径的 `git status --short`。将 E-7902/E-7903 标为“施工整改已完成、待 fresh 轻量复核”，不得写 PASS、待验收或完成；不得改旧确认失效事实。 | `node --test relay-core/test/identity-quota.test.mjs relay-core/test/dhr80-retry-result-bridge.test.mjs` → 自然终态、全部 pass、exit 0；`git diff --check` → exit 0；`git status --short` → 仅目标测试与 `workspace/DHR_79/**`（DevPlan 为已保全在基线提交的卡面，不由 worker 再改） |

## 批次检查点

- B1、B2 是两条独立 P1 的可验证整改批；每批定向测试后再进入下一批。
- B3 只汇总施工证据并 durable 落账，随后停止。轻量卡的 E5 教训复核与 E14 一致性复核由主控另起 fresh 只读实例，不由本施工会话兼任。

## 关键决策（一句话各一行）

- Worktree：是，`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\DHR_79`，分支 `wt/DHR_79`，基线 `master@ecb594d`，WIP 保全提交 `ee40086`
- 派子 agent：否（本文件即 Herdr 交互式 worker 的零上下文施工说明书）
- marker：`task.md` 已写 `> 执行者：headless worker`
- Review：`task_type=light`，施工后必须 fresh 教训复核 + fresh 一致性复核；无代码轮次
- 收口：新 E10 证据包后等待用户重新确认；旧“DHR79 确认”不得复用；不含 push、deploy、真实 Agent、DHR_35 或其他卡
