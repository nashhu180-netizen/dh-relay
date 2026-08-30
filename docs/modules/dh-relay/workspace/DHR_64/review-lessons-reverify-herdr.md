<!-- dh:v1 -->
# DHR_64 · 教训复核 P1 整改复验（Herdr）

## 身份、范围与方法

- 身份：DHR_64 教训复核 P1 整改复验 reviewer；非主控，只读。
- 范围：仅复验 `review-lessons-herdr.md` 的 P1-1（v2 close/error waiter）与 P1-2（Receipt/fence/observation 拒绝矩阵和护栏），审 `e0d92f4..5efd2af`。
- 方法：检查最新 progress/findings/review、相关代码及 mutation 记录；只运行两份独立定向测试并以完整 exit-code 终态取证。未运行 npm test、全量或服务型未收尾测试；未改代码、暂存、commit、merge、verify，也未操作真实 Agent、registry 或 DHR_35。

## 原 P1-1 · v2 close/error 结束所有 in-flight waiter

**已关闭。** `relay-core/cli/client.mjs:135-140` 遍历整个 waiter Map，对每项删除、清 timer，并以 `E_TRANSPORT_CLOSED` reject；v2 transport 的 `onClose` 与 `onSocketError` 都无分叉地调用该收尾（`:329-345`）。

独立测试 `test/dhr64-store-reject-matrix.test.mjs:54-62` 建立 in-flight waiter，执行同一生产收尾函数，断言 promise 以稳定 reason 结束且 waiter Map 归零。本轮命令 `cd relay-core; node --test --test-concurrency=1 test/dhr64-store-reject-matrix.test.mjs` 获得完整终态：2 pass / 0 fail / exit 0（0.708s）。该测试不持有 Runtime service；未把服务型无终态当作绿色证据。

## 原 P1-2 · 拒绝矩阵、零 Result observation 与护栏

**已关闭。**

- `dhr64-store-reject-matrix.test.mjs:31-52` 通过真实 Store 先登记旧 Receipt 再登记当前 Receipt，验证旧/非当前提交为 `E_IDENTITY_MISMATCH` 且零 Result；再以生产 `buildFallbackPause()` 与 `appendFallbackPause()` 形成 canonical fence，验证 submission 为 `E_ATTEMPT_FENCED` 且零 Result。上述独立 2/2 终态覆盖这两项。
- `dhr64-driver-observation.test.mjs:45-67` 在 fake Herdr 的真实 workflow driver 中分别覆盖 done、idle、host loss：三者均断言 Result 目录为空；done/idle 产生 `E_EXECUTOR_RESULT_MISSING` Attention 且不 capture pane，host loss 产生 `E_EXECUTOR_HOST_LOST` Attention。本轮命令 `cd relay-core; node --test --test-concurrency=1 test/dhr64-driver-observation.test.mjs` 获得完整终态：3 pass / 0 fail / exit 0（12.167s）。
- 有效 mutation 仍有效：`review.md` / `review-code2-herdr.md` 记录的 `relay-core/store/store.mjs:708` Herdr identity mutation 的施加与还原 SHA-256 均为 `653F5C81A53A705114E3A0592F899E3FE54FECE4C3A5BBFD2076D12B0B0A226E`；本轮实测当前 `store.mjs` SHA-256 相同，且 `e0d92f4..5efd2af` 未改该文件。因此“变异红、还原后 10/10 绿”的记录仍对应当前候选，未被整改作废。

## P0/P1

- **P0：无。**
- **P1：无。** 原 P1-1 与 P1-2 均已关闭。

## RULING

**RULING: PASS。** 本结论仅关闭 DHR_64 教训复核的原 P1 整改，不代替主控的验收、verify、合并、发布或环境操作裁决。
