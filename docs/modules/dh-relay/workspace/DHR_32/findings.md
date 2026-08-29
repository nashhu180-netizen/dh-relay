<!-- dh:v1 -->
# DHR_32 · Findings

| ID | 级别 | 状态 | 描述 | 处置 |
|---|---|---|---|---|
| F-1 | P3 | open | 复核形态迁移路径：本阶段复核仍是 prompt 型「侦测型只读」；本卡冻结 `readonly` 能力位后，DHR_33 起复核应改走注册表中标 `readonly=supported` 的 Profile（如 codex `--sandbox read-only`）执行机器只读 | 记录在案，DHR_33 开工时落实（源：B-22 预审 P3-1②）。注：当前注册表机器只读可用 Profile 实际仅 `herdr.codex.main` 单点（claude 系全 unsupported、ninth 未登录），两轮换人与机器只读不可兼得的约束带入 DHR_33。 |
| BLOCKED-1 | P1 | resolved | 步骤 3/5 的冻结要求相互不可同时满足：`claude-grok` 在本机是 PowerShell `Function`，`Get-Command claude-grok -All` 可解析，但 `where.exe claude-grok` 返回 exit 1。施工说明书要求 `E_UNRESOLVED_ALIAS` 严格以 `where.exe <alias>` exit 0 判定，同时要求 golden-registry 的五个入口在 `resolveAlias:true` 下全部通过。按该规则，含真实 `command_alias: "claude-grok"` 的 golden 必被拒；改 alias、放宽校验或新增 PATH shim 均超出本卡允许路径与「不猜/不改本机 AI 配置」边界。 | 2026-08-29 主控裁决：取①——`E_UNRESOLVED_ALIAS` 改两级解析（`where.exe` 不中退 `pwsh Get-Command` 受控只读兜底），task_plan 步骤 3 规则 6 已修订；②属造假式降级、③越界，均驳回。worker 从步骤 1 断点继续。 |
| BLOCKED-2 | P1 | resolved | 步骤 8 全量 `cd relay-core && npm test` 连续两次均为 191 tests / 190 pass / 1 fail，且失败点不稳定：首次 `test/runtime.test.mjs` detached-host 用例 `process.kill` 报 `ESRCH`；第二次 `test/agent-node.test.mjs` 批4③在 30000ms 内 state 未追上事件账。新增 DHR_32 八项均通过，`node --test test/runtime.test.mjs` 单跑为 26/26 pass；但单跑不能替代任务规定的全量绿。失败均位于本卡禁改的 runtime/agent-node 范围。 | 2026-08-29 主控裁决：取①。独立复算证据——主仓 master（不含本卡任何改动）全量 `npm test` 同样红在 `runtime.test.mjs:420` detached-host 用例、同样 `kill ESRCH`（errno -4040），坐实为既有环境性抖动、与本卡无关。本卡机器门槛改判为：新测 8/8 绿 + 契约审计 0 违规 + 失败文件单跑绿 + 全量抖动如实留档（不伪称全绿）。抖动本体另记 F-2 待后续维护卡。 |
| F-2 | P2 | open | 本机全量 `npm test`（--test-concurrency=4）存在既有非确定性失败：`runtime.test.mjs:420` detached-host 用例 `process.kill` ESRCH 竞态（master 与 wt/DHR_32 均复现）、`agent-node.test.mjs` 批4③ settledState 30s 超时（负载敏感）；单文件跑均绿。 | 与本卡无关、不在本卡修；待用户回归后立维护卡诊断（候选方向：detached-host 用例 kill 前查活、并发度/超时对机器负载自适应） |
| F-3 | P1 | 遗留→DHR_35（已确认） | `codex-ninth` 未登录，design/02 B4 点名的 ninth 交棒与 P6-M1 在 DHR_35 存在阻断风险。 | 2026-08-30 用户授权主控代决策并持续施工；DHR_35 真实闭环前选择登录、换目标 Profile 或按受限能力收口，本卡不冒充 ninth 可用。 |
| F-4 | P2 | open | 注册表字段闭集无法表达 Profile 当前可派/停用；`unverified` 加全 `unproven` 为跳过只是约定。 | 交 DHR_33 前的 B-事件裁决。 |
| F-5 | P2 | open | quota 正反样本 0 条入册。 | DHR_34 开工前先定取样方式：真实触发、历史日志捞取，或记受限。 |
| F-6 | P2 | open | codex 侧 fallback 互指成环且 ninth 不可用，fallback 链当前不成立。 | 环检测列为 DHR_34 校验器需求。 |
| F-7 | P2 | open | design/05 §7.1 与 DevPlan §2.3 对 `dsh.*` 是否属 executor profile 口径冲突。 | 待 B-事件澄清。 |
| F-8 | P2 | open | `claude-grok` 为网关壳、后端非 Anthropic，注册表机读层不可观察。 | 是否新增 `backend_vendor` 类字段交 B-事件裁决。 |
| F-9 | P3 | open | alias 解析经加载用户 profile 的 pwsh，非 hermetic 且慢（约 1.7s/次）。 | DHR_33 Adapter 应探测一次后缓存。 |
| F-10 | P3 | open | 校验器 errors 首错即返（除 schema）；`profiles` 无 `minItems`、ID 无唯一性校验、fallback 可自引用。 | schema 演进时补统一收集式错误、非空/唯一/无自引用约束。 |
| F-11 | P2 | open（已移交 DHR_35） | `profiles.test.mjs` 的 headless 正则实际为 `/-p\/--print/`，比 rework-1 冻结的 `/-p\b|--print/` 窄；当前因 evidence 恰写 `-p/--print` 而绿。 | 2026-08-30 用户授权主控代决策并持续施工；DHR_35 真实执行闭环前修正正则并重跑能力位反例，本治理卡不改生产测试。 |
| F-12 | P2 | open（已移交 DHR_35） | profiles 测试开启真实 alias/config 解析并直接读取 `workspace/DHR_32/evidence/*.md`，换机/CI或工作区归档会红，环境前提与文档耦合未单独登记。 | 2026-08-30 用户授权主控代决策并持续施工；DHR_35 前拆出入仓机读摘要或明确 hermetic fixture/环境测试分层。 |
