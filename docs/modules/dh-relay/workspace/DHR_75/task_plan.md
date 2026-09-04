<!-- dh:v1 -->
# task_plan — DHR_75 Herdr 异步调用与 Host Lease 续租

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `dev_plan/P6-Herdr多账号执行底座-开发方案.md#dhr_75` | 唯一任务合同、机器证 A~F、有效单测和允许路径。 |
| C-002 | `design/evidence/37-DHR75-Herdr异步调用与HostLease续租-B调整交叉审核记录.md` | B-40 因果强度、三轮审核裁决与 DHR_72/DHR_74 顺序。 |
| C-003 | `design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md` | P6-RI-A3 fencing 与 P6-RI-A4 真实链边界。 |
| C-004 | `relay-core/runtime/host.mjs`、`lease.mjs` | 只读核对默认 TTL、续租 tick 与写闸；不得修改。 |
| C-005 | `relay-core/runtime/executors/herdr/herdr-cli.mjs`、`herdr-executor.mjs` | 现役同步调用、超时映射、调用者 Promise 传播与清理路径。 |
| C-006 | `wt/DHR_72` 的 `workspace/DHR_72/progress.md` E-7212/E-7215~E-7218、`findings.md` F-7206/F-7208 | 三次真实失租现场与不得替代 DHR_72 证据的边界，只读。 |

## 施工步骤 (Steps)

| # | 改动文件（Create/Modify/Test + 路径:行） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|---|---|---|
| 1 | Test · `relay-core/test/dhr75-host-lease-during-herdr.test.mjs`；Create/Modify · `relay-core/test/helpers/fake-herdr-bin.mjs` | 先建立真实慢子进程夹具与短 TTL host actor：跨 ≥2 renew tick、contender 得 `E_LEASE_HELD`、慢调用后落 observation/checkpoint；另建 TTL-only/同步阻塞对照。 | `node --test test/dhr75-host-lease-during-herdr.test.mjs` → 修前以断言失败变红且有终态。 |
| 2 | Test · `relay-core/test/herdr-adapter.test.mjs` | 把直接 `makeHerdrCli()` 包装测试迁为 async，覆盖成功、非零、超时、signal/spawn error、空 stdout、JSON stderr、等待 close 与 Windows 后代清理；不碰 DHR_72 语义用例。 | `node --test test/herdr-adapter.test.mjs` → 新增断言修前红、旧断言保持可解释。 |
| 3 | Modify · `relay-core/runtime/executors/herdr/herdr-cli.mjs` | 用 `spawn` + Promise 实现同一返回形状；保留 10s 通用/60s start 边界；超时终止进程树并等 `close` 后返回。不得修改 TTL。 | 步骤 1/2 测试转绿；静态检查无 `spawnSync`。 |
| 4 | Modify · `relay-core/runtime/executors/herdr/herdr-executor.mjs` | 仅对所有 CLI Promise 调用补齐 `await`，保持状态映射与错误传播；失败时只清理已创建的同一 pane，并等待清理完成。 | adapter 定向测试转绿；漏 await 负例会失败。 |
| 5 | Test/Record · DHR_70 与 DHR_72 冻结回归、`package.json`、workspace | 追加本卡测试 token；跑 lease/host、adapter、DHR70 与冻结五文件，记录 B-38 排除；完成批次轮1小审。 | 定向命令全部终态；`git diff --name-only master...HEAD` 仅允许路径。 |
| 6 | Evidence · `workspace/DHR_75/evidence/**` | DSH-off 用冻结 Codex Profile 跑至少一次真实边界实录，脱敏记录 attempt、首条 observation、lease expiry；不消费为 DHR_72/DHR_35。 | 首 observation 时 lease 未过期；凭据/原 Receipt ID 扫描零命中。 |
| 7 | Record · workspace、as-built、DevPlan/README | 自动推进 heavy 五路复核、第二轮选变异点、有效单测、E0~E10 与交付展示；不触发 E11/E12。 | `dh dh-relay`、diff/check、复核 P0/P1=0；停在 E10。 |

## 关键决策（一句话各一行）

- Worktree：是，分支=`wt/DHR_75`，目录=`.dh-worktrees/DHR_75`。
- 派子 agent：施工由主会话负责；S1 校核与收口复核/矿工/as-built 按节点表委托，只读 reviewer 不改代码。
- Review：heavy 五路；代码轮 1 与轮 2 必须不同 fresh-context 实例，轮 2 选择生产变异点。
- 批次：一个独立功能点，不拆多批；实现完成后做一次完整批次轮 1，再进入收口轮 2。
