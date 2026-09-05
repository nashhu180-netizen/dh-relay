<!-- dh:v1 -->
<!-- dh:workspace-contract:v2 -->
# brief — DHR_72 driver 持续观测

## 任务

修复 `driveHerdrNode` 在首次 `idle` 即停止观测的问题。首次 idle 后必须继续观察；真实 working 才记 checkpoint；长期 idle 保持 `waiting_human`，仅人工 stop 是业务出口。DHR_72 自己的真实 Codex checkpoint 实录只证明本卡生效，绝不充作 DHR_35 P6-M1。

## 授权与现场

- 用户于 2026-09-04 对话授权：开 `wt/DHR_72`，施工与自动收口推进至 E10。
- 不含：E11 人验裁决、verify、squash/合入、worktree 清理、push、部署；不重开 DHR_35。
- worktree：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_72`；基线：`master@bbeffc4`。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_72 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_72；DHR-B-39；P6-RI-A4 前置与机器证 A~H |

## 完成条件

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | 首次 `idle` 后 driver 继续轮询；真实 `working` 后写 checkpoint 并折叠回 `running`。 | AI | DevPlan DHR_72 机器证 A、B、G |
| 2 | 长期 idle 写 `waiting_human`/Attention，不自动结束；首次 idle 后 host 消失仍能走 `host_lost` 对账。 | AI | DevPlan DHR_72 机器证 B、C |
| 3 | committed、stop、host_lost、Attempt 已终态、actor-closed/lease-lost 五出口各有独立用例，退出后无追加事件。 | AI | DevPlan DHR_72 机器证 D |
| 4 | 冻结四条语义 skip 全部解除并按现役 Receipt-bound 语义改写；定向套件 55/55、0 skip。 | AI | DevPlan DHR_72 机器证 E |
| 5 | DSH-off、冻结 Codex Profile 的真实实录含脱敏 `checkpoint_recorded`；撞启动停摆最多重试三次并留给 DHR_73。 | AI | DevPlan DHR_72 机器证 F |
| 6 | poll 与配对超时的比例守卫能拦截参数违规；变异该守卫得到断言失败；master R31 对 DHR_74 清零。 | AI | DevPlan DHR_72 机器证 H |
| 7 | 第二轮 fresh 复核者登记生产代码变异点，施加后指定测试断言失败。 | AI | DevPlan DHR_72 有效单测 |

## 变更范围（允许路径）

<!-- dh:allowed-paths:v1 task=DHR_72 -->
- `relay-core/runtime/workflow-driver.mjs`
- `relay-core/test/herdr-adapter.test.mjs`
- `relay-core/test/agent-node.test.mjs`
- `relay-core/test/dhr64-driver-observation.test.mjs`
- `relay-core/test/dhr64-result-bridge.test.mjs`
- `relay-core/test/dhr70-submission-gate.test.mjs`
- `relay-core/test/dhr72-continuous-observation.test.mjs`
- `relay-core/test/dhr72-poll-guard.test.mjs`
- `relay-core/test/helpers/fake-herdr.mjs`
- `relay-core/package.json`
- `docs/modules/dh-relay/workspace/DHR_72/**`
- `docs/modules/dh-relay/workspace/DHR_74/review.md`
- `docs/modules/dh-relay/as-built/relay-core.md`
- `docs/modules/dh-relay/knowledge/教训库-候选.md`
- `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`

## 边界

- In scope：以上允许路径所列文件；仅 driver 轮询段与冻结用例/fixture，含 DHR64 的 done/idle 无 Result 回归用例；三条直接回归（`dhr64-result-bridge` missing、`dhr70` C、`herdr-adapter` blocked→done）按 B-39 仅改指定用例体/必要同步点，`dhr72-poll-guard` 仅承接 H 的 fixture 参数守卫。
- B-38 冻结排除：`identity-quota.test.mjs` 的 DHR34 quota/fallback 历史合同另立迁移/修复卡；本卡不以改 stop 或调整默认脚本弱化其业务断言。
- 教训路径只允许 E6 append 待裁决候选，不动正册。
- Out of scope：启动/recovery 语义、contracts/store/host/service/launcher、用户级配置、DHR_35 实录与任何推送/部署。
- 必须停下：需要改禁改路径；P0/P1 三轮不收敛；真实运行出现超出既有合同的安全/权限问题；E10 后等待用户人验。

## 触及子系统

- `as-built/relay-core.md`：收口时按真实生产 A→B 判断是否更新。
