<!-- dh:v1 -->
# task_plan — DHR_81

## 要读的上下文 (Context Packet)

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `AGENTS.md` | worktree、范围、证据与密钥边界。 |
| C-002 | `dev_plan/P6-Herdr多账号执行底座-开发方案.md#dhr_81` | 唯一任务卡、验收和允许路径。 |
| C-003 | `design/15-Herdr-Agent单一启动内容与有限重发.md#3-当前验收清单` | A13~A15 的正式语义。 |
| C-004 | `relay-core/runtime/startup-dispatch.mjs`、`relay-core/test/dhr78-startup-dispatch.test.mjs` | 当前包络构造与专项断言入口。 |

## 施工步骤

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Test · `relay-core/test/dhr78-startup-dispatch.test.mjs` | 先增加包络顺序、Receipt 非业务任务、正文不复制和失败语义的断言。 | `cd relay-core; node --test --test-concurrency=1 test/dhr78-startup-dispatch.test.mjs` 修前断言失败。 |
| 2 | Modify · `relay-core/runtime/startup-dispatch.mjs` | 仅修改 `loadStartupInstruction()` 的固定文本：明确打开指针、执行文件正文、再按真实结果提交；保留指针与现有拒绝逻辑。 | 同一专项自然终态 exit 0。 |
| 3 | Test/Record · 上述专项与 `progress.md` | 运行专项并记录终态、diff 范围；不改任何额外路径。 | `git diff --check`、专项 exit 0。 |

## 关键决策

- Worktree：是，分支 `wt/DHR_81`。
- 派子 agent：否；主会话施工，收口时另派 fresh reviewer。
- Review：heavy 五路 + 第二轮有效单测，按任务卡自动收口。
