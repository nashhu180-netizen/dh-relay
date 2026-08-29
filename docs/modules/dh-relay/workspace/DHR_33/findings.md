<!-- dh:v1 -->
# DHR_33 · Findings

| ID | 级别 | 状态 | 描述 | 处置 |
|---|---|---|---|---|
| F-0 | P3 | open | 侦察发现：`test/control-plane-imports.test.mjs:21` 的 CONTROL_PLANE_DIRS 写死 `adapters/dsh-bridge` 而非整个 `adapters/`——将来在 `adapters/` 下新增目录会静默逃过控制面 import 纪律闸 | 本卡不动该测试（adapter 落 runtime/ 侧）；留给后续维护卡把 `:21` 收紧为 `'adapters'` |
| F-1 | P2 | open | 挂死已消灭：返工 3 全量 5 次均自行终止，Herdr 新测 5/5 零失败。残余为 allowed-paths 外既有 `cli.test.mjs` 双 CLI 并发 mutating timeout 31.7 s（F-019/F-023；主控干净环境 RUN3 exit 1/139 s）；worker RUN2 exit 1/133149 ms 未保留失败名，已由主控同口径裁定为既有非 Herdr 抖动。 | 登记不修；按返工 1 冻结口径「既有抖动照旧留档」豁免连续 exit 0 门槛，不挡本卡收口；交后续并发稳定性卡处理。 |
| F-2 | P3 | open | capability 基线现含 `herdr-agent`，而 `contracts/CANONICALIZATION.md` §三示例仍写“1 个 executor kind”；本卡 contracts 冻结，不能同步修正。 | 留后续契约变更卡处理，不得在本卡改 `contracts/`。 |
| F-3 | P1 | 遗留→DHR_35（已确认） | herdr 节点成功终态依赖 `herdrJudge` 注入；判定器的“已完成且正确”语义尚未冻结。 | 2026-08-30 用户授权主控代决策并持续施工；交 DHR_35 冻结并接入判定器语义。本卡仅保证无判定器有界 Attention、无 Result，不冒充成功终态已闭合。 |
| F-4 | P2 | open | 注册表目前只消费 product/profile_id；command_alias、account_alias、expected_identity、capabilities 尚未接入身份链。 | 交 DHR_34 消费并冻结身份链接线。 |
| F-5 | P2 | open | Attention 的 `send`/`attach` 出口已具备，但尚无 RPC/CLI 控制通道调用方。 | 交 DHR_34/35 定义并接入控制通道。 |
| F-6 | P2 | open | `herdr --help` 未暴露事件订阅面；本卡交付慢轮询与状态沿变化记账，未冒充事件快路。 | 交 DHR_35 结合 Herdr 后续能力决定快路接入与阶段闸；限制 E-3304 事件快路验收。 |
| F-7 | P3 | open | 当前 `work_dir_root` 恒取 repoRoot，未表达 Run/Node 级工作目录来源。 | 交 DHR_35 冻结来源与传递规则；限制 E-3305 来源规则验收。 |
| F-8 | P3 | open | 单测 fake-herdr 的状态仍在内存闭包；跨进程 smoke 改由文件状态可执行桩覆盖。 | 交后续跨进程测试统一文件桩；本卡的 B-14 已局部解决。 |
| F-9 | P2 | open | focus 事件源曾扩到 `human_input_requested`；返工 2 已按 brief 裁决 4 回退为仅 `host_observation_changed`。是否扩展该事件源属于后续体验设计，不能由本卡自行冻结。 | 交主控/后续卡裁决。 |
| F-10 | P3 | open | driver catch-all 只落 Attention、无 Result，`retryFailed` 不会捞取该届，可能永久悬挂；pane-id-missing 在 contracts 冻结且无合适既有码时仍以 `E_EXECUTOR_HOST_LOST` 加 reason_detail 表达，归码失真同根。 | 交后续契约卡新增或冻结合适 reason code 后处理。 |
| F-11 | P2 | open | Herdr 能力 hash 本卡未产出，E-3304 分句 4 仍无证据。 | 交 DHR_35 产出并验收能力 hash。 |
