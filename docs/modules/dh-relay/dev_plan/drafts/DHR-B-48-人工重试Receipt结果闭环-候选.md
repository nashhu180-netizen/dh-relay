# DHR-B-48 · 人工重试 Receipt 结果闭环

状态：形成史；2026-09-07 完成独立审核后，按用户“那你立卡”的授权正式登记 DHR_80（未开始）于 P6 DevPlan。本文件不构成施工授权。

## 依据与问题

正式输入由统一 resolveDesignContract 从 design/README.md 白名单解析。本次修复承接 design/11《P6身份与额度治理契约调整》P6-IQ-A5 与 design/12《Receipt绑定结果提交与P6真实闭环》P6-RI-A1/A2/A3；不改变既有验收命题。

当前 attempt-retry.mjs 创建的 fresh Receipt 缺少 result_submission_mode，service.mjs 的结果路由要求 receipt-bound/v1。静态已确认字段不一致，运行失败尚待最小复现；不能预设只补字段即可修好。retry-with-profile 当前在 actor 队列中创建持久重试事实；须验证提交路由能按新 Receipt 建立合法 gate。

## DHR_80 · 人工重试的 Receipt-bound 结果提交闭环

- 目标：人工选择冻结且仍匹配的 profile 后，fresh Attempt 能接收符合合同的外部结果提交，通过现役 v2 入口与合法 actor/gate 提交唯一 committed Result；重启后仍能按同一 Receipt 恢复接收。本卡不承诺新 Attempt 会启动/驱动 Agent 或自动产生结果。
- 非目标：不恢复自动 fallback，不增加自动启动 Agent 的行为，不改变 quota 来源、公开协议、Store 事务算法或用户配置；不迁移/覆写历史 immutable Receipt；不运行真实 Agent。
- 档位：标准（结果入口组件接线）。任务类型：heavy。
- Design：共享正式 design/11、design/12，不新增专题设计。
- 依赖：DHR_64、DHR_70 已完成的提交桥；施工基线须包含已收口 DHR_78，以消除 service/driver 与启动发送在途接线重叠。DHR_79 的缺失负例仍由 DHR_79 补齐；其最终收口等待本卡闭合后复核。不把本卡新增为 DHR_35 的主链前置。
- 状态：未开始；工作区 workspace/DHR_80/ 在独立 D-start 时创建。

### 验收口径

1. 机器证（design/11 P6-IQ-A5；design/12 P6-RI-A1）：最小失败复现使用当前 v2 retry-with-profile 与 submit-executor-result 入口；修复后 fresh Receipt 持久带正确模式，成功与失败提交均由新 Receipt 派生身份，经 actor/gate 返回 committed Ack，Result/event/state 一致。不得用直接 appendResult 或 helper-only 测试代替入口集成。
2. 机器证（design/12 P6-RI-A1/A3）：服务重启后从同一新 Receipt 恢复 gate，不开第二个 Attempt、不启动 Agent；重复同结果仅在 committed 后幂等，冲突终态拒绝。既有缺 mode 的历史 Receipt 保持不可提交，不因修复原地升级。
3. 机器证（design/11 P6-IQ-A5；design/12 P6-RI-A3）：非冻结 profile、快照漂移、pause 已关闭/同键冲突拒绝且无新增重试事实；同键合法重放保持同一新 Receipt。旧 Attempt 始终 fenced，旧 Receipt 提交不污染新结果；失租/未认证/未知或非当前 Receipt 继续拒绝。
4. 机器证（design/12 P6-RI-A2）：done/idle 无正式提交仍不产生 Result 或自动 fallback；使用 fake adapter 验证本次重试结果修复不会新增 Agent 启动/指令发送。
5. 证据门槛：专项与受影响回归自然终态、退出码及版本落账；heavy 五路独立复核，轮2选点的变异红/恢复绿。未终态不记通过，既有全量回归债不靠定向绿抵扣。
6. 人判：无新增业务选择；收口仍展示上述机器证据并取得本地收口确认，不代替 DHR_35 真实产品验收。

### 精确允许路径（候选）

<!-- dh:allowed-paths:v1 task=DHR_80 -->
- `relay-core/runtime/attempt-retry.mjs`
- `relay-core/runtime/service.mjs`
- `relay-core/runtime/workflow-driver.mjs`
- `relay-core/test/dhr80-retry-result-bridge.test.mjs`
- `relay-core/test/attempt-contract.test.mjs`
- `relay-core/test/dhr64-result-bridge.test.mjs`
- `relay-core/test/dhr70-submission-gate.test.mjs`
- `relay-core/package.json`
- `docs/modules/dh-relay/workspace/DHR_80/**`
- `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`
- `docs/modules/dh-relay/as-built/relay-core.md`
- `docs/modules/dh-relay/knowledge/教训库-候选.md`

实施约束：优先复用 gate 恢复与现有单写队列，只改复现所需路径；需要改变历史 Receipt、公开 schema、Store 原子性或启动产品语义时停止相关改动，先回设计裁决。无新增持久化产物，沿用现役 Receipt/Result/Run 保留与恢复规则。

## 查漏与计划调整

- 覆盖：补齐既有 IQ-A5 与 RI-A1/A3 在人工重试入口的交叉缺口；不把字段存在当闭环，不消弱 RI-A2。
- 颗粒度：一张卡交付人工重试到持久结果的可模拟完整闭环，不按字段与接线拆卡。
- 依赖：DHR_78 → DHR_80 → DHR_79 最终收口；DHR_79 测试补负例可先做，不形成反向依赖。DHR_78 自身验证债仍须独立处理，不能把本卡设为它的隐式前置。
- 当前 DHR_79 仅存在于 `.dh-worktrees/DHR_79/docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` 第221行与711起卡面，以及同树 `workspace/DHR_79/task.md`，主干尚未登记；默认 rg 会忽略该任务树。正式落盘时仅承接其已存在卡号/范围及本次获确认的依赖，保留施工事实；不把未提交实现带入规划提交。
- 教训：canonical pause 不只证成功半支；负例需原因码与零状态推进；字段修复必须证明入口至 committed Ack；并行同路径变更需要明确集成先后。
