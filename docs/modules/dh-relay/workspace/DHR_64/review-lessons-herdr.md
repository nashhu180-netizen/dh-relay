<!-- dh:v1 -->
# DHR_64 · 教训复核（Herdr / Receipt bridge）

## 身份与范围

- 身份：DHR_64 教训复核 reviewer；非主控，只读。
- 范围：读取本卡 brief/task_plan/progress/findings/review、已有代码/需求复核，并只比对候选教训库中 Receipt-bound Result、recovery、Herdr wait/observation、lease/identity 相关条目。未寻找新需求、未运行 npm test/长服务，未操作真实 Agent、registry 或 DHR_35；未改生产代码、暂存、commit、merge 或 verify。

## 适用教训与核对

### 候选-21 · 断连必须给全部在途请求可观察终态

**适用，未遵守，见 P1-1。** 新增的 `connectCliV2()` 把请求放入 `waiters` 并设置 120 秒 timer（`relay-core/cli/client.mjs:337-355`），但 `onClose` / `onSocketError` 只调用 `resolveClosed()`（`:321-335`），没有 reject waiter、清 timer 或删除 waiter。因此服务端在 Receipt submission RPC 返回前断连时，`relay submit-result` 的在途调用会静默等到 `E_REQUEST_TIMEOUT`，而非即时得到断连终态。DHR_64 定向测试没有此断连负例。

### 候选-1、候选-11、候选-12 · reason/同类分支必须逐项钉住，不能由局部证据扩大结论

**适用，未完全遵守，见 P1-2。** `submitExecutorResult()` 有 identity、fenced、非当前、非 Herdr kind、已有 Result/terminal conflict 等不同拒绝支路（`relay-core/store/store.mjs:694-723`），而唯一 DHR_64 定向文件只直接钉住 unknown、terminal conflict、lease-lost 与伪 Receipt（`relay-core/test/dhr64-result-bridge.test.mjs:83-143`）。旧/非当前、真实 fallback pause 所致 fence、未认证 RPC、恢复未完成及截断 event ledger 没有对应的机器断言。这与需求方向复核已记录的“冻结机器证矩阵未闭合”一致；不将局部绿扩大为整个 A1/A3 已证。

### 候选-6、候选-45、候选-46 · 边界护栏要有变异且能区分正确/错误实现

**适用，尚无可核验闭合。** `review.md` 的有效单测·变异点表仍是“待独立代码轮 2 选定”；本轮源码也未见以最终候选为基线的 mutation 证据。尤其 P1-1 的 socket-close 处理和 P1-2 的拒绝矩阵，都不能只凭现有绿色断言声称护栏有效。该项不另增编号，随 P1-1/P1-2 收口。

### 候选-15 · 校验与发送使用同一稳定快照

**适用，已遵守。** Store 以持久 receipts map 中的当前 Attempt Receipt 校验身份，并从同一 Receipt 派生 server Result/digest（`store.mjs:694-712`）；Result、event、state 通过同一 mutation 后才发布（`:725-762`）。重启 terminal route 亦先读并校验持久 Receipt/ledger（`runtime/service.mjs:334-402`），未以 pane 文本或可变 registry 重新推导身份。

### 候选-23、候选-35、候选-51 · 异步/常驻测试应有不变量、边界和清理

**适用，已遵守（源码层）。** DHR_64 的 `until()` 有 5 秒边界（`dhr64-result-bridge.test.mjs:53-60`），早到 submission 用例等待“gate 已开且 instruction 已发送”这一不变量（`:195-202`），driver 与临时目录均注册 `t.after` 清理（例如 `:177-193`）。这避免将一次随意 sleep 当成完成判据，也避免轮询 fixture 留住测试进程。

### 候选-39、候选-50 · 新测试必须被默认命令拾取，且不得隐式依赖真实 registry

**适用，已遵守（静态证据）。** `relay-core/package.json:12` 显式列出 `test/dhr64-result-bridge.test.mjs`；Herdr driver tests 显式传入临时 `herdrRegistryPath` 和 `profileEnvironment`（`dhr64-result-bridge.test.mjs:184-192,220-228`），没有读取用户级 registry。

### 不适用

- 候选-24（协议义务恢复与瞬态失败共用重试预算）、候选-27（多事实源时钟）、候选-29（嵌入库的持久化归属）、候选-30（路径 realpath 防逃逸）、候选-38/43/44（真实入口/注册表审计语义）不属于本卡冻结的 Result bridge 实现；分别由既有 runtime、DHR_63 或 DHR_35 范围承接。
- 候选-41（上游审计阻断下游）不触发：本卡 findings 已如实记录旧 DHR_33/DHR_34 测试语义差异及代码轮整改，未发现新的上游事实需要转为 DHR_35/registry 阻断。

## P0/P1

- **P0：无。**
- **P1-1：v2 CLI 的断连路径没有结束在途 Receipt submission 请求。** 位置 `relay-core/cli/client.mjs:321-355`。socket close/error 后未 reject pending waiter，调用方会等 120 秒而非得到即时终态，违反候选-21；补统一幂等收尾（reject waiters、清 timer）及 close-during-submission 定向用例。
- **P1-2：Receipt/lease/recovery 拒绝分支与护栏有效性的证据未按候选-1/6/11/12/45/46 闭合。** 见上方适用项；应补完整拒绝矩阵及可判别的 mutation/反例证据。此项与 `review-req-herdr.md` 的 P1 是同一证据缺口，不重复扩大为新需求。

## RULING

**RULING: changes requested。** P0=0，P1=2。P1-1 是现有教训已明确禁止的断连实现缺口；P1-2 是既有边界测试教训未落实。关闭后再由相应独立路径复核；本结论不代替主控的 Review Batch、验收、verify、合并或发布裁决。
