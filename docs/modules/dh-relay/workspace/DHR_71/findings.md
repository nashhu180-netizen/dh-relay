<!-- findings.md — 问题清单。边做边记。 -->
# findings — DHR_71

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-7101 | P1 | 承接 DHR_35 `F-3520` 时序部分：`master@43e4af9` 定向五文件 55 条 5 红——`herdr-adapter.test.mjs:354`（10s `runtimeUntil` 超时）、`agent-node.test.mjs:198`/`:231`（1s `untilAsync` 超时）在不同轮次出没不定；`:510` 只在隔离跑里 45s 超时；另一次 `agent-node.test.mjs` 整跑 652s 不收口（隔离单跑约 40s）。两条语义红 `:242`/`:279` 归 DHR_72，本卡只 skip | DHR_35 `evidence/targeted-tests-20260901T1335Z.txt` 等三份（在 `wt/DHR_35`） | 施工中：按 task_plan 第 1 步先在本机重取基线，逐条归类后再改 | open |

## E 阶段复核发现（两路：教训 / 一致性）

| ID | 级别 | 提出者 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|---|

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞。
