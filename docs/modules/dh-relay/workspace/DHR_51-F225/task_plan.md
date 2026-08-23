<!-- dh:v1 -->
# task_plan — DHR_51-F225

## 要读的上下文

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `workspace/DHR_51/{brief,task_plan,findings}.md` | 既有 fencing 和 lost-lease 承诺。 |
| C-002 | `relay-core/runtime/host.mjs` | 识别初始化写入与 tick 续租的错误边界。 |
| C-003 | `relay-core/test/runtime.test.mjs` lost-lease 用例 | 红例与不可退化的断言。 |
| C-004 | `workspace/DHR_52/findings.md` F225 | 该维护的触发证据与回填位置。 |

## 施工步骤

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Test · `relay-core/test/runtime.test.mjs` | 以现有 lost-lease 用例重现：探测到 live lease 后覆写 epoch=99。 | 定向 `node --test --test-name-pattern=lost_lease` 现状红。 |
| 2 | Modify · `relay-core/runtime/host.mjs` | 仅将初始化期同一 `E_LEASE_HELD:lease-lost` 收敛为 `lostLease=true`；其它异常原样抛出。 | 定向用例转绿，接管者 lease 断言保留。 |
| 3 | Record/Test · 工作区与 DHR_52 F225 | 跑 `npm test`；回填确切结果、复核与 F225 状态。 | 90/90 通过、diff 检查通过。 |

## 关键决策

- Worktree：是，`wt/DHR_51-F225`，从 master `a514ef0` 建。
- TDD：现有失租回归用例先红，作为初始化竞态的可复现钉子；不为测试添加产品钩子。
- Review：两轮独立只读复核，分别覆盖实现安全性与回归边界。
