<!-- dh:v1 -->
# DHR-B-37 — DHR64 持续观察回归补口

## 草案

仅将 `relay-core/test/dhr64-driver-observation.test.mjs` 加入 DHR_72 允许路径；该文件的 done/idle 无 Receipt Result 两例改为：Attention 后断言至少一次后续观察，随后显式 `driver.stop()` 并等待 `driver.done`。其余路径、验收终点、依赖与 DHR_35 边界不变。

## fresh-context 审核

审查实例：`/root/dhr72_badjust_review2`，只读、未运行测试、零写入；已读 AGENTS、DevPlan DHR_72 段、`workflow-driver.mjs:400-422`、DHR64 测试。

### 方案问题

- `done || idle` 在同一分支 Attention 后 return；持续观察合同要求不能再依赖 `await driver.done`。
- `t.after(stop)` 在测试函数返回后才执行，故需显式 stop。
- done/idle 共用循环，不能只改 idle；还须证明 Attention 后确有后续 poll。

### 用户理解风险

- `E_EXECUTOR_RESULT_MISSING` 是 Attention，不是 driver/Attempt 终点。
- 依赖 teardown 或 runner timeout 会掩盖合同违约。

### 需要用户决定的问题

- 建议 done 与 idle 都持续观察；用户 2026-09-04 对话认可。
- 最小证明定为 Attention 后至少一次后续 poll；用户 2026-09-04 对话认可。

## 主会话裁决与用户确认

- 裁决：采纳全部建议；无更小且能满足合同的替代方案。
- 用户确认：2026-09-04，先确认 driver 是 Runner 内部接线程序，再认可 idle/done 均不等于正式 Result、两种状态均持续观察（对话答复：“可以的”）。
- 生效边界：仅本文件草案列出的一个测试文件；不改变 DHR_35、Store/contracts、启动/recovery 语义或卡序。
