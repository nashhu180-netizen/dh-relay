<!-- execution_strategy.md — DHR_74 执行策略（怎么把停顿钉住）。 -->
# execution_strategy — DHR_74

## 诊断策略：三层探针，逐层收窄

1. **L1 fs 探针**（`helpers/fs-probe.mjs`，`NODE_OPTIONS=--import` 注入全部测试子进程）：
   - 包装 `fs/promises` 的 `rename/writeFile/appendFile/open/mkdir/unlink/rm`：记录进行中 op（路径 + 起始时刻）；
   - 单 op > 1s → `[fs-probe] SLOW`；> 5s → 追加 `process._getActiveHandles()` 类型计数（沿 DHR_71 E 组探针口径）；
   - 进程退出前若仍有未完成 op → `[fs-probe] HUNG-AT-EXIT` 打清单。
   - 自证负例：把探针指向一个人为 sleep 的假 rename，确认 SLOW 能被抓（探针自身可信度）。
2. **L2 队列探针**（仅当 L1 显示 fs 无慢 op 而停顿仍在）：在夹具接线处（测试侧拥有 wiring）给 store 句柄方法包计时 wrapper，区分「停在 actor 队列 / Store 写队列 / fs」。
3. **现场快照**：每次停顿同时抓 `dumpDriverScene` 同款数据（事件账 kind 序列、node_states、fake 计数）+ 负载快照——直接对上 F-7108/F-7109 签名。

## 复现协议

- 主复现文件：`dhr69-false-ready.test.mjs` 单跑（约 25~60s/轮，F-7109 两次、F-7108 关联形态多次都在它身上）。
- 系列 ≥10 轮 × 负载条件 A（当前负载）/ B（尽量空载）；每轮记录 pass/fail/时长/签名。
- 判停顿：用例等满上限且 dump 显示事件账冻结（对 F-7109 = 止于 `host_observation_changed(alive)`、fake 非零）。

## 决策树（同 task_plan #4）

- fs op 停在 `writeAtomic` → Store 语义 → **升级条款**（停手）。
- 清理竞态（stop 未等队列排空 → rm 撞 rename）→ 测试侧收尾修复（红→绿对照）。
- 队列环（L2 定位）→ 按落点再分类；生产侧只登记。
- 负载强相关、代码无责 → 环境/协议结论 + 用户操作指引（如 Defender 排除），不代码化。

## 门禁重跑口径（机器证 C）

- 冻结命令：`node --test --test-concurrency=1 --test-timeout=300000 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=<evidence>/gate-round<N>-<ts>.junit.xml test/herdr-adapter.test.mjs test/agent-node.test.mjs test/dhr64-driver-observation.test.mjs test/dhr69-false-ready.test.mjs test/dhr70-submission-gate.test.mjs`（cwd=`relay-core/`）。
- 合格 = 连续 3 轮 `skip=4（S1~S4 同名核销）∧ fail=0 ∧ 每轮 ≤370s`；结论措辞带「在该五文件命令、`--test-concurrency=1`、本机负载条件下」（F-71-LES-02）+ 探针是否在场的说明。
- BL-17 签名（EPERM rename / 停顿形态红）出现 → 该轮作废改名 `.VOID-bl17-*` 留证，修复未达标，回决策树。
