<!-- lesson_candidates.md — DHR_74 教训候选（供 E6 miner / 教训复核路取用）。 -->
# lesson_candidates — DHR_74

| # | 候选 | 依据 | 去向建议 |
|---|---|---|---|
| 1 | **机器空闲 ≠ 进程在前进**：LOOP-LAG 只能证明 timer 未按期获调度；fs、CPU、队列必须按各自覆盖面出结论。记录阈值 1s/5s/15s、`drift>400ms`；探针只覆盖 ESM `node:fs/promises` 具名 op，FileHandle/CJS/同步 API/队列均是反例边界 | E-7405/06/07；关联候选-31/-48/-62 | 教训路 |
| 2 | **时间参数先按语义拆分**：逐 options 列出 poll 频率、超时窗口、状态列表长度、期望 poll 次数；只有“等满 N 次 poll”的超时同比例放大，墙钟上限保持不变。 | R1-A；DHR_71 独立基线证明本卡时间改动必要性未证 | 教训路 |
| 3 | **测试夹具是机器级负载放大器**：1–5ms 轮询 × 每 poll 心跳落盘 × 每 event 全量 replay，可形成单文件 2.8 万事件；放大链的治本候选需各自立卡验证，不预断 DHR_72/Store 是唯一位置 | F-7401；E-7403b | 教训路 + backlog BL-17 |
| 4 | **复现粒度必须匹配目标负载**：单文件 10/10 绿、回到五文件全量第 1 轮即现形；粒度选错等于没复现。可操作判据：目标协议参数（单文件/全量、并发、轮次、预期签名）先写明；简化跑法只可作对照，不能替代目标协议 | E-7403a/b | 教训路 |
| 5 | **判定脚本自身的单位解析错误会把绿误标成红**：本卡系列脚本曾把 ms/s 解析错误；判定脚本必须先用已知样本自证，再采信 verdict | E-7408 日志留痕 | 教训路 |
| 6 | **F-7402 最小复现包（LES-06）**：代码锚点 `workflow-driver.mjs:319-326`；冻结命令为 dhr69 单跑 `node --test --test-concurrency=1 --test-timeout=300000 test/dhr69-false-ready.test.mjs` 并以 `NODE_OPTIONS=--import ./test/helpers/fs-probe-register.mjs` 注入；负载为 fake `working`、poll 1–5ms、五文件全量门禁；命中签名是 `LOOP-LAG drift>400ms` 连续 6+ 次或 EPERM/EXIT-PENDING；阈值 1s/5s/15s；盲区为 FileHandle/CJS/同步 API/actor 与 Store 队列/短时 CPU；撞签名轮次改名 `.VOID-*` 后留证重跑，禁止把作废轮计入结论 | F-7402；fs-probe README | 教训路 |
| 7 | **两卡证据被合并分支搅在一起时，须各自在自己的基线上取证**：组合版本上的绿只能证明组合，无法把绿归因给任一张卡 | F-74-R1-02 / F-74-REQ-03 / E-7409；关联候选-49/-62/-68 | 教训路 |
