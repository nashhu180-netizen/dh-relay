<!-- dh:v1 -->
# task_plan — DHR_82

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 | 为什么 |
|----|------|--------|
| C-001 | `AGENTS.md`、P6 的 DHR_82 卡、B-53 evidence | 任务合同、授权和禁止范围。 |
| C-002 | `relay-core/runtime/workflow-driver.mjs:187-228,306-313,428-448,590-595` | 定位 startup reserve、accepted、timer 与 Attention 调用点。 |
| C-003 | `relay-core/runtime/executors/herdr/herdr-executor.mjs:164-199`、`relay-core/test/helpers/fake-herdr.mjs:14-19,81-96` | 保持 sender 公开形态，理解 fake seq 默认行为。 |
| C-004 | `relay-core/test/dhr78-startup-dispatch.test.mjs`、DHR_75/76/72/70 回归组 | 保留既有 sender、lease、profile 与观测边界。 |

## 施工步骤 (Steps)

| # | 改动文件 | 怎么改 | 怎么验 |
|---|----------|--------|--------|
| 1 | Test · `relay-core/test/dhr82-startup-submission-barrier.test.mjs`; Test · `helpers/fake-herdr.mjs` | 只加可选、默认不改变的 seq 冻结/前进钩子。先写 seq 冻结、缺失、unknown、重启和 seq 前进正反例；Attention 仅按新的 detail 前缀计数。 | `node --test relay-core/test/dhr82-startup-submission-barrier.test.mjs` 先自然终态红。 |
| 2 | Modify · `relay-core/runtime/workflow-driver.mjs`; 必要时 Modify · `herdr-executor.mjs` | 在 startup 专用调用点采集最终 host_ref+seq 基线；保留既有 sender 返回形态。仅同 host 且 seq 严格前进返回内部 submitted，driver 才 accepted/timer；其余 ambiguous 保持 authorized，写一次无新 reason Attention。 | 专项转绿；静态 grep 确认无 composer/Enter/`--wait`/第三发/runner 变更。 |
| 3 | Modify · `relay-core/package.json` | 仅把新专项追加到现有 test script，不重构脚本。 | `npm test` 的新增专项被实际调用；专项自然终态。 |
| 4 | Test · DHR_78、herdr-adapter、DHR_68/C、DHR_70、DHR_72、DHR_75、DHR_76 定向组 | 逐组运行并等待终态；不可用/既有失败如实记录，不叫绿。 | 各命令 exit/status 与关键计数进 `progress.md`。 |
| 5 | Record · `progress.md`,`findings.md` | 写 fake 证据边界和 construction commit；停止于 construction node。 | `git diff --check`；精确路径 stage 后 construction commit。 |

## 关键决策

- Worktree：是，`wt/DHR_82`。
- 派子 agent：是，Herdr `gpt-5.6-luna` reasoning=max；只写允许路径和 construction node。
- Review：heavy Recipe 的两轮代码、需求、教训、一致性在 construction 后自动收口，不由 worker 执行。
