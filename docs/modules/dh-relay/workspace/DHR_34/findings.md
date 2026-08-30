<!-- dh:v1 -->
# DHR_34 · Findings

| ID | 级别 | 状态 | 描述 | 处置 |
|---|---|---|---|---|
| F-001 | P2 | closed | Receipt 的身份字段是否能在既有 contracts 零 diff 约束下承载，尚未完成 fresh 预审。 | DHR_61 已冻结 `attempt-receipt/v1` 并合入；DHR_34 仅消费 `executor_identity` 与有序 fallback snapshots，contracts 零 diff。 |
| F-002 | P2 | constrained | quota 高置信样本的稳定、脱敏形态尚未冻结。 | 本机无获批真实 quota 样本，状态码+错误码规则未经入册样本证实；实现不内置任何产品 detector，只消费调用方注入的已登记规则。真实样本、detector 注册与生产 judge 接线留 DHR_35。P6-M4 明确为 `constrained`。 |
| F-003 | P0 | closed | `launch-receipt.v2` 未含身份四件套，实际签发点 `service.mjs` 又不在允许路径；DevPlan 的 Receipt schema 扩展与 brief 的 `contracts/**` 禁改边界冲突。 | DHR_61 另立 `attempt-receipt/v1` 完成 D1；DHR_34 未修改 `launch-receipt.v2`、contracts 或签发服务。 |
| F-004 | P0 | closed | 验收要求「无 fallback → paused + Attention」，但 run-state 枚举无 `paused` 且全仓零实现，字面口径不可实现。 | DHR_61 已冻结 canonical fallback pause，并由既有状态投影为 `waiting_human`、Attention open；DHR_34 直接调用 Store 合同。 |
| F-005 | P2 | open | 启动屏显示 `Opus 5 with high effort`，实例自报 SessionStart 为 `claude-fable-5`；实际模型身份不可证。 | 保留两条形态证据；不得将本次预审标成「已核验 Opus」。 |
| F-006 | P2 | closed | fallback Attempt 在宿主重启后若恢复为 source 身份，可能重新获得自动 fallback 权限并串到第三身份。 | 恢复时优先读取已签 Attempt Receipt 的 `executor_profile_id`；只有原 source 恢复可自动 fallback，fallback 恢复仍为一跳终点；旧式 Receipt 仅回退既有账上 profile 以保持 DHR_33 兼容。 |
| F-007 | P2 | closed | 新测试必须进入 `npm test`，但 `relay-core/package.json` 未列入施工前冻结的允许路径。 | **失序补录**：代码轮 1 指出后已把该路径补入 brief，权限仅限 `scripts.test` 登记；不伪装成正常先修 brief。 |
| F-008 | P3 | open | quota 分类结果与 detector ID 未形成独立耐久账；自动切换可由相邻 Result/Attempt 推断，但不能直接审计分类理由。 | 与 F-011 的生产可达性缺口一并移交 DHR_35 真实闭环与后续可观测性设计；仍只允许脱敏分类与 detector ID，禁止 raw terminal 文本。 |
| F-009 | P3 | closed | canonical pause 写入失败会被通用 catch 降级成自由文本 `human_input_requested`，缺 fence/Attention。 | pause mutation 任意 reject/negative ack 现在直接让 driver `done.ok=false`，不落 terminal Result、不造 text-only Attention；定向反例已钉。 |
| F-010 | P3 | accepted | 恢复路径对 Receipt 缺失/损坏直接让整届 driver fail-closed，而非跳过单节点。 | 保持现状：Receipt 是 Attempt 身份权威，不可读时按 DHR_61 坏账纪律拒绝继续，不能回退 event.detail 猜新式身份。旧式且可读 Receipt 才使用既有账上 profile 兼容。 |
| F-011 | P1 | transferred | D3 在生产链路当前不可达：service 未注入 judge，零生产 `structured.quota_signal` 产出方，golden registry 零 detector 登记。 | 本卡只交付并验证安全编排 seam，不宣称真实自动换号可用；真实样本、judge producer、detector registry 与 service 接线由 DHR_35 闭合。 |
| F-012 | P1 | closed | 候选自身可签但其下一层 fallback 不可冻结时，旧实现可能先终结 source 后静默不开 fresh Attempt。 | 选号阶段预冻结候选自己的有序 fallback snapshots；任一不可签即跳过该候选，最终落 canonical pause。driver 级反例断言零 terminal Result、零 text-only Attention。 |
| F-013 | P2 | transferred | 自动 fallback 限一跳；二次 quota 即使有候选也停等人工，当前 reason 与“无候选”不可区分；空 `manual_retry_profiles` 也无协议内出口。 | 采用保守的一跳策略并列入人验；reason 扩展、取消/终结出口与产品语义移交 DHR_35。 |
| F-014 | P2 | transferred | DHR_61 `retry-with-profile` 只开 fresh Attempt，现有 driver 不会启动该已处于 running 的新 Attempt。 | 跨卡执行闭环缺口明确移交 DHR_35，不把“开出 Attempt”误报成“已执行”。 |
| F-015 | P3 | accepted | registry 文件缺失被 loader 归一为空 registry，内部路径因此归为 fallback unavailable；invalid registry 才是 registry unavailable。 | 两者安全结果均为 canonical pause；本卡不改既有 loader/合同，测试名只主张 fail-closed，不把内部状态当可观察差异。 |
| F-016 | P2 | closed | Review Batch 并发期间全量测试出现 Herdr timing/锁争用并有一次长时间无终态；已见签名含 `E_SERVICE_NOT_READY:ready-timeout-30000ms`。 | 并发尝试不计绿色证据；本卡不追并发红率，复核 pane 静止后另取 quiet 全量 249/249 终态。 |
| F-017 | P3 | closed | 第二批复核后才发现 as-built 未进入最初冻结允许路径。 | **失序补录**：先在 brief 增列且仅允许同步 DHR_34 现役边界，再修改 as-built；不把后补伪装为施工前已冻结。 |
