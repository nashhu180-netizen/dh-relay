<!-- dh:v1 -->
# task — DHR_79 迁移过期 quota driver 测试

> 执行者：headless worker

## 完成条件 ★前置（继承任务卡验收口径）

1. `identity-quota.test.mjs` 不再依赖被 DHR_64 移除的 `herdrJudge` 或 driver 自动 fallback。
2. quota/fallback 的现行纯函数和手动 retry 语义仍有断言，定向测试自然结束且 exit 0。
3. 变更仅限任务卡列出的测试和工作区路径。

## 施工步骤 ★精简（🔵 开工那一刻写，3–5 步大方向）

1. 按 [task_plan.md](task_plan.md) B1 补 canonical pause 稳定字段与 retry Receipt mode 断言，定向验绿。
2. 按 [task_plan.md](task_plan.md) B2 补 non-frozen 精确拒绝与持久状态零推进断言，定向验绿。
3. 按 [task_plan.md](task_plan.md) B3 跑受影响组合并落施工证据，停止在 fresh 教训/一致性复核之前。

## 进度 + 证据（边做边记）

| 时间 | 做了什么 | 证据（命令/路径/结果） |
|------|---------|----------------------|
| 2026-09-07 | 用户明确要求继续解决；从 DHR_78 发现 DHR_34 旧测试与 DHR_64 Receipt-bound 语义漂移，建立独立轻量任务。 | D-7901；`git show 0dd371d` |
| 2026-09-07 | 将旧 driver host-side 判定与自动 fallback 场景替换为现行 quota 分类、Receipt snapshot 选择和 canonical pause 后人工重试。 | `node --test relay-core/test/identity-quota.test.mjs`：3 pass / 0 fail / exit 0，耗时 1.13s；`git diff --check`：exit 0；旧 driver 符号扫描：0 命中 |
| 2026-09-07 | 用户回复“DHR79 确认”；主控复跑定向测试为 3 pass / 0 fail / exit 0，并进入轻量卡教训与一致性复核。两路只读复核均发现 P1，原放行结论失效，本次确认未执行销户。 | E-7902；E-7903 |
| 2026-09-07 | 精确提交旧 WIP 后迁基到 `master@ecb594d`；手工保留 master 的 DHR_78/DHR_80 完成态与 DHR_79 卡面/测试，DHR_80 已解开 E-7903 的生产侧前置。主控依据 Luna medium Code Scout 写入分批 worker 施工说明书。 | WIP checkpoint `ee40086`；`task_plan.md`；施工尚未开始 |
| 2026-09-07 | B1 补齐 canonical pause 稳定字段、确定性 ID、frozen profile 快照一致性，以及 Receipt-bound retry Receipt 和关联字段断言。 | `node --test relay-core/test/identity-quota.test.mjs`：3 pass / 0 fail / exit 0，自然终态；`rg -n "herdrJudge|startWorkflowDriver" relay-core/test/identity-quota.test.mjs`：0 命中 / exit 1（无命中预期） |
| 2026-09-07 | B2 新增 non-frozen profile 的真实 retry 拒绝负例，精确匹配 `E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-not-frozen`，并比较拒绝前后的 events/state/results/receipts/pauses/pause-resolutions 快照证明零推进。 | `node --test relay-core/test/identity-quota.test.mjs`：4 pass / 0 fail / exit 0，自然终态 |
| 2026-09-07 | B3 完成受影响组合测试与施工证据汇总；E-7902/E-7903 的测试侧整改已完成，待 fresh 轻量复核。 | `node --test relay-core/test/identity-quota.test.mjs relay-core/test/dhr80-retry-result-bridge.test.mjs`：11 tests / 11 pass / 0 fail / exit 0，自然终态；`git diff --check`：exit 0（仅 LF→CRLF 提示）；`rg -n "herdrJudge|startWorkflowDriver" relay-core/test/identity-quota.test.mjs`：0 命中 / exit 1（无命中预期）；`git status --short`：仅 `docs/modules/dh-relay/workspace/DHR_79/task.md`、`relay-core/test/identity-quota.test.mjs` |
| 2026-09-07 | 第 1 轮复核整改：复用现有 fallback selection fixture，补合法 registry 下 platform 不匹配、冻结快照漂移、候选不可签名三类 frozen candidate 全部不可用时返回 `fallback_unavailable` 的断言；未改生产代码。 | `node --test relay-core/test/identity-quota.test.mjs`：4 tests / 4 pass / 0 fail / exit 0，自然终态；`node --test relay-core/test/identity-quota.test.mjs relay-core/test/dhr80-retry-result-bridge.test.mjs`：11 tests / 11 pass / 0 fail / exit 0，自然终态；`git diff --check`：exit 0（仅 LF→CRLF 提示） |
| 2026-09-07 | 主控完成整改后两路 fresh 复核、争议定向复议与 E0/E10 备料；最终无 open finding。 | E-7904～E-7907；主控组合复验 11/11、exit 0；`dh dh-relay` 0 failure / 91 warning、exit 0；`git diff --check` exit 0；旧 driver 符号 0 命中 |
| 2026-09-07 | E11：用户在对话中明文回复“认可”，确认 `releasePacket-DHR79-v2` 并授权轻档本地收口包。 | 确认时间 2026-09-07 23:28 +08:00；授权范围为精确 squash、合入态复验、DevPlan/workspace 回填与 DHR_79 worktree/branch 清理；不含 verify、push、deploy、真实 Agent、DHR_35、DHR_73、下一卡或其他清理。 |
| 2026-09-07 | E12/E13：任务分支精确 squash 合入本地 `master`，并在合入态完成受影响组合复验；随后机械销户。 | squash `2535989`；组合测试 11/11 pass、0 fail、exit 0，自然终态；`git diff --check HEAD^ HEAD` exit 0；旧 driver 符号扫描 0 命中、exit 1（无命中预期）；轻档按规则不打 `verify(dh-relay)`。 |

## 第 1 轮复核整改停止线（历史）

- 整改轮次：第 1 轮 fresh 教训复核 P1 整改；改动仅限 `relay-core/test/identity-quota.test.mjs` 与本 `task.md`。
- 待 fresh 复核：E-7902 教训复核与 E-7903 一致性复核两路，均须由主控另起 fresh 只读实例；本 worker 不执行、不代替复核结论。
- 当前停止线：整改证据已落账，停止在 fresh 两路复核前；不标 PASS、待验收或完成。

## 轻量复核

- **E-7902 · 教训复核（fresh 只读实例 `/root/dhr79_lessons`）· P1 / BLOCK**：`identity-quota.test.mjs` 的 canonical pause/manual retry 用例只覆盖 frozen profile 成功半支；未断言 pause 稳定字段，也未证明 non-frozen profile 以 `E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-not-frozen` 拒绝且零推进。命中候选-1、6、12、61。最小整改仍限测试，但在下一条生产缺口定责前不单独收口。
- **E-7903 · 一致性复核（fresh 只读实例 `/root/dhr79_consistency`）· P1 / BLOCK**：现役 `workflow-driver.mjs` 创建的 Receipt 带 `result_submission_mode: 'receipt-bound/v1'`，`service.mjs` 的 Result bridge 也只接受该模式；但 `attempt-retry.mjs` 创建的 retry Receipt 未带此字段，本用例的原 Receipt 亦未带。因此当前绿测只证明 legacy-like retry，不能证明重试 Attempt 可经 DHR_64 Receipt-bound bridge 结算。生产修复超出 DHR_79 允许路径，须先由主控/用户定责并另行落户，不能在本卡静默扩围。
- **并行 WIP 边界**：`wt/DHR_78` 同时修改 `identity-quota.test.mjs` 的 instruction fixture；后续任何合入/rebase 必须显式裁决重叠，不得覆盖 DHR_78 在途改动。
- **2026-09-07 恢复裁决**：DHR_78 与 DHR_80 均已收口进入 `master@ecb594d`；迁基冲突已由主控逐块裁决，不再把两卡写作“在途”。E-7903 的生产缺口由 DHR_80 修复，DHR_79 仍须补 mode 断言并经 fresh 一致性复核后才可改结论。

### 整改后 Review Batch 与收敛

- **E-7904 · 教训复核（fresh 只读 Herdr 实例 `dhr79_lessons2`）· P1 / BLOCK**：在候选 `7a286f5` 发现 `selectQualifiedFallback` 漏测合法 registry 下全部 frozen candidates 不可用的 `fallback_unavailable` 分支；主控采纳，Luna max/Fast 施工实例 `dhr79_fix1` 仅在目标测试和本账本完成第 1 轮整改，提交 `9a82711`。
- **E-7905 · 一致性复核（fresh 只读 Herdr 实例 `dhr79_consistency2`）· PASS**：DHR_80 的正式 Result bridge 与本卡 retry Receipt mode、canonical pause、non-frozen 零推进一致；无 P0–P3。该实例因只读沙箱 `%TEMP%` `mkdtemp` EPERM 未得到独立绿终态，未把失败当产品缺陷，运行证据只采用主控复验。
- **E-7906 · 整改后教训复核（fresh 只读 Herdr 实例 `dhr79_lessons3`）· AMEND PASS**：selected / registry_unavailable / fallback_unavailable 三态、pause 稳定字段、frozen 成功、non-frozen 精确机器分支码与零推进均闭合。初报的“工件内容哈希”P1 与“不得匹配 profile-not-frozen”P2 经定向复议撤销：冻结 B2 与 DHR_80 同族样板均以 events/state 内容 + 工件文件名集合判零推进；该拒绝发生在任何 Store mutation 前；`profile-not-frozen` 是区分同前缀机器分支的稳定码。最终无 P0–P3。
- **E-7907 · 整改后一致性复核（fresh 只读 Herdr 实例 `dhr79_consistency3`）· PASS**：无 P0–P3；E-7903 由 DHR_80 生产修复与本卡测试断言闭合。

<!-- dh:consistency-review:v1 task=DHR_79 -->

| 比对对象 | 兄弟路径 | 本次行为 | 裁决 | 理由 |
|---|---|---|---|---|
| fallback selection 三态 | `relay-core/runtime/executors/identity/fallback.mjs:13` | selected、registry_unavailable、fallback_unavailable；不可用集覆盖平台不匹配、快照漂移、候选不可签名 | 一致 | 与现役三态返回合同一致 |
| canonical pause | `relay-core/runtime/executors/identity/fallback.mjs:34`、`relay-core/store/store.mjs:509` | 顶层/fence/attention 稳定字段、确定性 ID、frozen snapshot | 一致 | 字段、关联与 ID 推导一致 |
| Receipt-bound mode | `relay-core/runtime/attempt-retry.mjs:44`、`relay-core/test/dhr80-retry-result-bridge.test.mjs:313` | retry Receipt 断言 `receipt-bound/v1`，兄弟测试证明正式 v2 Result 提交 | 一致 | 不再是 legacy-like retry |
| non-frozen 零推进 | `relay-core/runtime/attempt-retry.mjs:28`、`relay-core/store/store.mjs:611` | 精确拒绝 profile-not-frozen；比较 events/state 内容与 results/receipts/pauses/resolutions 文件集合 | 一致 | 拒绝点早于 Store mutation，稳定状态与工件均未推进 |

- **主控收敛裁决**：E-7902、E-7903、E-7904 已闭合；整改 1 轮，最终两路 fresh 复核均 PASS，无 open P0/P1/P2/P3。

## 验收

- 历史 AI 自评（E-7902/E-7903 后）：**未达成 / P1 阻塞**。条件 1 与条件 3 已满足；条件 2 当时仅有成功半支，且暴露 retry Receipt 与现役 Receipt-bound Result bridge 不一致，不能以 3/3 绿替代语义闭环。
- 当前 AI 自评（E-7906/E-7907 与合入态复验后）：**三条完成条件均达成，机器证据等价覆盖，无未关闭 finding；用户已认可并完成本地销户**。
- 用户确认记录：2026-09-07 早先回复“DHR79 确认”，但随后自动复核改变了放行证据包，该旧确认不用于销户。用户于 2026-09-07 23:28 +08:00 对重新展示的 `releasePacket-DHR79-v2` 明文回复“认可”；本次确认有效并授权轻档本地收口。

## releasePacket-DHR79-v2（E10）

- 展示版本：`master@ecb594d` + `wt/DHR_79` 代码候选 `9a82711`；旧 `releasePacket` 与旧“DHR79 确认”均失效。
- 人判结果行：0；方向决策行：0；风险决定行：0。H=0 谓词 A 成立。
- 机器证据摘要：
  1. `node --test relay-core/test/identity-quota.test.mjs`：4/4 pass、0 fail、exit 0，自然终态。
  2. `node --test relay-core/test/identity-quota.test.mjs relay-core/test/dhr80-retry-result-bridge.test.mjs`：11/11 pass、0 fail、exit 0，自然终态；同版本证明 DHR_80 retry Receipt mode 与正式 bridge 未回归。
  3. `rg -n "herdrJudge|startWorkflowDriver" relay-core/test/identity-quota.test.mjs`：0 命中、exit 1（无命中预期）；旧 host-side judge/driver 自动 fallback 未恢复。
  4. `git diff --check`：exit 0；任务分支对 master 的改动只含 DHR_79 卡面、`workspace/DHR_79/**` 与目标测试，均在允许路径。
  5. E-7906 教训复核与 E-7907 一致性复核最终均 PASS，无 P0–P3；一致性表逐项覆盖 selection 三态、pause、Receipt-bound mode 与 non-frozen 零推进。
  6. `dh dh-relay`：0 failure、91 warning、exit 0；警告为存量治理项，本次未新增 DHR_79 failure。
- 放行资格：三条机器验收项均为等价覆盖，无不可豁免缺口、无待认险风险；H=0 谓词 B 成立。`release_mode=full`。
- E11：用户已于 2026-09-07 23:28 +08:00 明文“认可”本包。轻档本地收口只含精确 squash 合入本地主干、合入态复验、DevPlan/workspace 状态回填、确认记录与 DHR_79 worktree/branch 清理；按轻档规则不打 `verify(dh-relay)` 提交。
- 包外：push、deploy/发布/重启、环境或生产数据操作、真实 Agent、DHR_35、DHR_73、下一卡与任何其他 worktree 清理。
