<!-- dh:v1 -->
# task_plan — DHR_65

## 要读的上下文（Context Packet）

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | DevPlan §3.2 DHR_65；design/12 P6-RI-A5 | 冻结 runtime fail-closed 命题、边界和联合解锁条件。 |
| C-002 | `relay-core/runtime/executors/herdr/profile-registry.mjs` | 定位 loader 的 validator 调用和 alias-resolve 分支，限制最小实现。 |
| C-003 | `relay-core/profiles/validate-profiles.mjs`、`profiles.test.mjs` | 对齐 formal validator 行为，不修改既有 validator 或测试；B-28 的 `-NoProfile` 试验已回退，不形成生产范围。 |
| C-004 | DHR_63 的 E-6321/E-6322/E-6323 与 F-6302/F-6305 | 复现已证实的 loader alias fail-open，使用脱敏结构等价完整 registry，不读取用户级 registry 正文。 |

## 施工步骤

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Create · `relay-core/test/dhr65-registry-loader.test.mjs` | 以脱敏、完整结构等价 registry fixture 构造好 alias/config 与坏 alias/config；fake driver/Herdr 只计数 Attempt、Agent、pane、Result，写出预期失败断言。 | `node --test relay-core/test/dhr65-registry-loader.test.mjs` 先红，显示 alias fail-open。 |
| 2 | Modify · `relay-core/runtime/executors/herdr/profile-registry.mjs` | 在 loader 入口以与 formal validator 等价的 alias-resolve 规则拒绝无效完整 registry；保留现有错误语义，禁止改 driver 或其他 runtime 文件。 | 同一命令转绿；好 registry 的两个目标 profile 仍可解析，坏 alias/config 无任何创建计数。 |
| 3 | Test · `relay-core/test/dhr65-registry-loader.test.mjs` | 对 loader alias-resolve 分支施加语义 mutation，确认指定断言失败，再还原。 | mutation 时断言失败；还原后定向测试绿。 |
| 4 | Modify · `relay-core/package.json`（B-26） | 仅将 `test/dhr65-registry-loader.test.mjs` 添加至既有显式 `npm test` 清单；不改测试并发或其它脚本。 | `npm test` 输出必须列出 DHR_65 专属测试并有终态。 |
| 5 | Record · `workspace/DHR_65/**` / `knowledge/教训库-候选.md`（B-27） | 记录红绿、mutation、卫生和需求对齐证据；miner 仅追加候选，不写 registry 正文、配置值或凭据，也不改教训正册。 | `git diff --check`、secret-shaped 扫描、`dh dh-relay` 均有终态。 |
| 6 | Diagnose · B-28 | 试验 `-NoProfile` 并以既有 profile 回归复核兼容性；若改变 `claude-grok` alias 解析则回退，不形成生产范围。 | 已回退；清理本卡残留测试进程后，原 fallback 的坏 alias 专项终态恢复。 |

## 关键决策

- Worktree：是；分支 `wt/DHR_65`，目录 `.dh-worktrees/DHR_65`，从当前 `master` 建立。
- 派子 agent：代码施工由主会话执行；收口按 normal recipe 另派独立代码、需求、教训复核者，施工者不自审。
- Review：normal 配方 = 代码轮1 + 需求 + 教训 + 有效 mutation；DHR_63 的 registry 机器证与本卡机器证共同闭合 P6-RI-A5，DHR_35 在此之前保持阻塞。
