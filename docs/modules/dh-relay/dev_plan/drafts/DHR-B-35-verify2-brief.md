<!-- dh:v1 -->
# DHR-B-35 · 第三轮定向复核 brief（仅 X-03）

你是 `b35ver2`，fresh、只读，不改文件、不拉终端、不派活、不问用户。

待审：`docs/modules/dh-relay/dev_plan/drafts/DHR-B-35-driver持续观测与定向回归复绿-候选.md`（v3）。

第二轮复审只剩一条 P1（X-03）：DHR_71 与 DHR_72 允许路径不互斥——`test/helpers/**` 与 `fake-herdr.mjs` 重叠；`herdr-adapter.test.mjs:510` 与 `:242/:279/:305` 共用 `runtimeFixture`（`:203-230`）。v3 声称已修：helpers 排除 `fake-herdr.mjs`、共享夹具唯一归属 DHR_72、DHR_71 只改用例体。

只做两件事：
1. 打开 `relay-core/test/herdr-adapter.test.mjs`、`relay-core/test/agent-node.test.mjs`、`relay-core/test/helpers/`，核 v3 §3.1 / §3.2 / §7 的允许路径是否**真的**互斥，且 DHR_71 在这些限制下是否仍能完成它的验收（特别是 `:510` 和 `agent-node.test.mjs` 的等待改动是否依赖共享夹具）。
2. 报新增 P0/P1（若无写「无」）。

产出：
```
## 结论：PASS / 不通过
## X-03 核对
## 新增 P0/P1
## 我实际打开了什么
```
