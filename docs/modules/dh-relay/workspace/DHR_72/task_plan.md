<!-- dh:v1 -->
# task_plan — DHR_72 driver 持续观测

## 要读的上下文

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `dev_plan/P6-Herdr多账号执行底座-开发方案.md#dhr_72` | 唯一任务合同、A–H 机器证与允许路径。 |
| C-002 | `design/evidence/35-DHR71-73-driver持续观测与定向回归复绿-B调整交叉审核记录.md` | D-B35-1~7、五出口和 X-03 归属冻结。 |
| C-003 | `workspace/DHR_71/progress.md`、`findings.md` | 四个 skip、绿闸命令与 DHR_71 反向禁改边界。 |
| C-004 | `workspace/DHR_74/progress.md` 的 R31 移交段 | 机器证 H 与 DHR_74 回签的精确条件。 |
| C-005 | `relay-core/runtime/workflow-driver.mjs` 及冻结测试/fixture | 现有循环、出口和可写锚点。 |

## 施工步骤

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Test · `relay-core/test/dhr72-continuous-observation.test.mjs`；fixture · `test/helpers/fake-herdr.mjs` | 先为首次 idle 后 working/checkpoint、长期 idle、host_lost 和五出口补最小失败用例；只让 DHR_72 拥有共享 fixture。 | 定向 `node --test ...dhr72...` 先红，记录 E-ID。 |
| 2 | Modify · `relay-core/runtime/workflow-driver.mjs:330-422` | 仅重构 `driveHerdrNode` 的循环：尚无 Result 的 idle/done 都不 return；按真实 working 写 checkpoint；逐轮检查五出口；保持 actor 单写者和 Attention 不自动清除。 | 新测试转绿；旧 DHR_69 blocked 负例保持绿。 |
| 3 | Test · `herdr-adapter.test.mjs:242,:279,:305,:354`、`agent-node.test.mjs` S4 | 解除四条 skip；S3/S4 只重写 Receipt-bound 终态断言，保留 DHR_71 的等待和清理；`:305` 改为单次 Attention 后继续轮询。 | 五文件冻结套件 55/55、0 skip、0 fail。 |
| 4 | Test · `dhr64-driver-observation.test.mjs`、DHR_72 专属测试；可选 `package.json` | DHR64 的 done/idle 无 Result 用例改为 Attention→后续 poll→显式 stop；为 `herdrPollMs` 与语义配对超时写比例守卫；不得把墙钟上限纳入。 | 将 poll 改回 1–5ms 或漏缩配对超时，测试须断言失败；还原后绿。 |
| 5 | Evidence · `workspace/DHR_72/**` | DSH-off 跑一条冻结 Codex Profile 实录，脱敏记录 checkpoint；若启动停摆，最多三次并将现场登记为 DHR_73 输入。 | 真实实录有 `checkpoint_recorded` 且零 Receipt 原值/凭据。 |
| 6 | Record · workspace、as-built、DevPlan、DHR_74 review（仅 H 回签） | 跑重核收口：两轮 fresh 代码复核、需求/教训/一致性、第二轮变异点；E10 展示证据。 | `dh dh-relay`，允许路径审计与 R31 对 DHR_74 清零。 |

## 已冻结的范围排除

- `relay-core/test/identity-quota.test.mjs` 的旧 DHR_34 quota/fallback 用例不属于本卡：它们依赖已删除的 host `idle/done → herdrJudge → Result` 推导，不能通过把等待改成 `stop` 保留业务含义。用户 2026-09-04 确认另立配额迁移/修复卡后再决定正式 Receipt-bound Result 与自动 fallback 的关系；本卡不改该文件，也不改变任何 quota 生产语义。

## 关键决策

- Worktree：是；分支=`wt/DHR_72`。
- 施工：主会话；不派 worker。
- Review：heavy 配方，施工者不复核自己的卡；第二轮必须 fresh-context。
