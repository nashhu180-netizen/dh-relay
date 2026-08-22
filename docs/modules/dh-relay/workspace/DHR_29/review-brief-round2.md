# DHR_29 第二轮增量复核 brief（代码轮 2）

## 身份与边界

你是第二轮**增量复核**实例，fresh-context、未参与实施、未继承第一轮任何会话上下文。允许只读仓内已落账的第一轮记录（`review.md` / `findings.md` / `progress.md`），但结论必须自己验证，不得照抄。**只读，不得修改任何文件**；卡住或证据不足如实写出。

## 复核范围

核全程 + 核各批小审记录 + 查收口前增量 diff：

- `relay-core/store/{store,state}.mjs`、`relay-core/test/store.test.mjs`（批次 1+2 全量现状）
- 收敛批增量：checkpoint 判定次序（身份链→幂等→终态守卫）、工件损坏 `E_STORE_CORRUPT` 包装、`test/store.test.mjs` 新增反例（冒用重投 / 账内 schema 违规行 / sk- 双路钉）
- 契约 md 增量：`contracts/compat-matrix.md` §4b 四值裁决、`contracts/reason-codes.md` §四 B11 行措辞
- `docs/modules/dh-relay/as-built/relay-core.md` §3.5 与实现是否仍相符
- 第一轮记录核对：CP1 findings（F-002~F-004）与 CP2 结论（approved + P2/P3）的处置是否真实闭环（对照 `findings.md` F-001~F-006 与 `progress.md` E-007~E-013）

## 必查问题

1. 收敛批的判定次序重排有没有引入新洞（如合法重投被误拒、终态守卫被绕过）。
2. F-002/F-003/F-004 的修复是否真覆盖原 finding 的每个分句；有无「修了 A 丢了 B」。
3. 两轮小审记录与实际 diff 是否对得上；有无漏登记的变更或越界文件。
4. 全卡视角：Store 层是否有任何一处认识「客户端 / 宿主」概念（DHR_51/52 边界）；契约指纹是否零触碰（capability_hash 应为 `4adfe6dc…`）。
5. 测试套件作为整体还有没有空绿带（两个小审已各查一遍，找他们都没看的角度：并发下 openStore 与 append 竞争？readState 在队列外读 state.json 的撕裂窗口后果？）。

## 输出格式

结论 `approved` / `changes-requested` / `需人裁决`；逐条 finding（P级 | 路径:行 | 事实 | 影响 | 证据）；末尾列实际执行的检查与未覆盖边界。报告全文作为最终答复返回，不写任何文件。
