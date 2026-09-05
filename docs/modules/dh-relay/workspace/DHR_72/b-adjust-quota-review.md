<!-- dh:v1 -->
# DHR-B-38 · quota 历史回归边界复核

## 拟议调整

默认测试入口中的 `relay-core/test/identity-quota.test.mjs` 也在 `idle/done` 后等待 `driver.done`。用户先选择将它纳入 DHR72；本复核只判断这是否能在不改变配额业务语义的前提下成为最小测试调整。

## fresh 只读复核

- 实例：`/root/dhr72_quota_review_retry`；零写入、未运行测试。
- 阅读范围：根 `AGENTS.md`、DHR72 workspace、`identity-quota.test.mjs:97-340`、`workflow-driver.mjs` 的启动签名与 `done/idle` 分支。
- 结论：九条用例（`:131-340`）均以宿主 `idle/done` 加已删除的 `herdrJudge` 伪造 Result，借此断言 `attempt_failed`、`attempt_succeeded` 或 `fallback_pause_created`。现役 driver 不再接收 `quotaDetectors` / `platform` / `herdrJudge`，且 `idle/done` 只写缺 Result Attention 后继续观察。仅替换 `await driver.done` 为 `stop` 不能保留原业务断言；自行提交 Receipt-bound Result 又需要先决定正式 Result 是否继续触发自动 fallback。

## 主控裁决与用户确认

- 裁决：DHR72 不改 `identity-quota.test.mjs`，不从默认脚本移除它，也不把卡住误记为绿；另立 DHR34 quota 迁移/修复卡，先定正式 Result 与自动 fallback 的业务关系。
- 用户确认：2026-09-04 对话「可以」。
- 不变项：DHR72 的 driver 持续观测合同、允许生产路径、DHR35 依赖与现役配额行为均不变。
