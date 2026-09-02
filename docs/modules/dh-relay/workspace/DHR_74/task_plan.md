<!-- task_plan.md — DHR_74 施工步骤。冻结锚：master@9f6ab9c（落户提交）。跑偏记 progress，不回改本文件。 -->
# task_plan — DHR_74

| # | 步骤 | 允许落点 | 产出 |
|---|---|---|---|
| 0 | 进场自检：`wt/DHR_74` 分支、HEAD 与 master 一致、`git status` clean；读本 brief + DevPlan §3.2 DHR_74 | — | progress 首行 |
| 1 | **基线（改代码前）**：负载快照（node/codex/chrome 进程数 + CPU LoadPercentage）；`dhr69-false-ready.test.mjs` 单跑 5 轮记录复现率与失败签名；五文件合跑 1 轮对照 | evidence/ | E-7401 负载+复现率 |
| 2 | **探针**：`relay-core/test/helpers/fs-probe.mjs`——L1 包装 `node:fs/promises` 的 `rename/writeFile/appendFile/open/mkdir/unlink/rm`（计数；单 op >1s 打 `[fs-probe] SLOW op/path/elapsed`，>5s 追加活跃句柄类型计数；进行中 op 清单可查）；经 `NODE_OPTIONS=--import` 注入子进程，**零测试文件改动**；`node --test` 常规运行不受污染 | helpers/** | E-7402 探针自证（负例：人为慢 op 能被抓） |
| 3 | **带探针复现**：dhr69 单跑循环 ≥10 轮 × 2 负载条件（A=当前本机负载、B=尽量空载，条件如实记录）；捕获停顿的 SLOW 现场 + 事件账 + fake 计数 | evidence/ | E-7403 机器证 A |
| 4 | **定因分类 + 决策树**（按 E-7403 证据走，逐条落 progress）：<br>① fs op 卡住/报错且落点在 `writeAtomic`（`store.mjs:225-231`）→ **停手升级条款**（Store 语义），证据+B-adjust 候选；<br>② 停点在夹具清理竞态（stop 返回时写队列未排空 → rm 撞 rename）→ **测试侧修**（收尾等待队列排空的工具函数，F-7103 同族）；<br>③ fs 无慢 op 但队列停 → L2 探针（夹具接线处包 store 句柄方法计时，测试侧合法）定位队列环，按落点再分类；<br>④ 复现率与负载强相关且代码无责 → 环境/协议结论（Defender 排除指引、门禁负载条件），产证据交用户 | — | E-7404 分类结论 |
| 5 | **修复落地（②/④ 可达项）**：红→绿对照 + 负例；每处改动过允许路径自查（`git diff -U0` 逐 hunk） | 允许路径 | E-7405 |
| 6 | **DHR_71 门禁重跑**：冻结命令（`node --test --test-concurrency=1 --test-timeout=300000` + spec/junit 双 reporter，五文件，cwd=`relay-core/`）连续 3 轮 skip=4 ∧ fail=0 ∧ ≤370s；撞 BL-17 签名轮作废 `.VOID-*` 留证重跑 | evidence/ | E-7406 机器证 C |
| 7 | 收口：progress/findings/越界自查/`git diff --check`/提交（不改 DevPlan 状态列、不进复核、不 push）；写 `construction.DONE`（status: done / blocked） | workspace | DONE |

## 冻结与边界

- S1~S4 四条 skip 用例与其断言一字不动（DHR_72 债）。
- 共享夹具 `runtimeFixture` / `recoveryFixture` 至多 `mkdtemp` 根一行；其余行禁改。
- 探针不上生产代码；`store/**` 只读。
- 触发升级条款 = 当轮停下，不做「顺手的小修」。
