<!-- dh:v1 -->
# DHR_69 · Findings

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-6901 | P3 | DevPlan 机器证 E 写「现役只是个 `paneAlive` 布尔桩，没有状态字段」。DHR_68 合入后 `fake-herdr.mjs` 的 `paneGet` 已返回 `{ok,value:{pane: paneRecord(),type:'ok'}}`，`paneRecord.agent_status` 默认 `unknown`。缺口不是「没有字段」，而是**不能与 agent 状态分开编程**、且默认永远 `unknown`。 | `relay-core/test/helpers/fake-herdr.mjs`；DHR_68 `evidence/real-herdr-command-shapes.json` 的 `pane-get` | 不改 DevPlan 验收口径（E-1/E-2 命题仍成立）。已用独立 `paneStatuses` 实现。 | resolved |
| F-6902 | P2 | C 的 recovery 夹具 `t.after(rm)` 与仍在轮询的 driver 抢 `state.json`，报 `ENOTEMPTY`/`EPERM`，把已经绿了的断言误判成失败。 | 本卡 C 单测 after 钩子 | 先 `await driver.stop()` 再 rm，rm 失败忽略。属测试夹具，不改生产代码。 | resolved |
| F-69-R1-01 | P1 | 进入观测失败 / `herdr_status=unknown` 分支时未清 `mismatchAt`/`mismatchEscalated`。blocked→unknown→blocked 会把旧计时当成「持续超过 T」，可能立即升级 Attention。 | 轮 1 `dhr69rev1`；`workflow-driver.mjs` 观测丢失分支 | 采纳。该分支入口清零两计时器。 | resolved |
| F-69-R1-02 | P1 | 负例只等启动期 Attention 就切 unknown，不保证 `mismatchAt` 已启动，旧实现也可能绿。 | 复验 `dhr69rev1b` | 采纳。切 unknown 前先等 poll 期 `paneGets` 增加，并等到 `observation_lost`。定向 9/9。 | resolved |
| F-69-R2-01 | P1 | recovery 在 `observeHerdrAgent` 失败时落入 else，把提交指令发出去。 | 轮 2 `dhr69rev2` | 采纳。观测失败改为扣住 `instructionPending`、不发。补负例。 | resolved |
| F-69-REQ-01 | P1 | 需求路认为 E-1 未采集成功 `agent get` 形态。 | `dhr69req` | **驳回**。E-1 取样对象冻结为普通 shell pane、不启动产品 Agent；空壳上没有成功 agent get。成功形态以 DHR_68 同版本对照表为准。 | 驳回 |
| F-69-CON-01 | P1 | 一致性路认为 unknown 时 driver 经 reconcile 仍 paneGet，与 D 字面冲突。 | `dhr69con` | **有意差异**。D 约束的是交叉核对 `observeHerdrAgent`；reconcile 的 paneGet 是 DHR_33 存活探测，本卡不改。 | 有意差异 |
| F-69-E7 | P2 | E7 as-built 无法在本卡更新。允许路径不含 `docs/modules/dh-relay/as-built/**`；现役 `as-built/relay-core.md` §6.4a 只写 launch/observe/capture/reconcile/stop，未写 idle∧blocked overlay、`agent_get`/`pane_get` 三键、recovery 先观测。 | brief 触及子系统；as-built §6.4a | 不静默跳过。E11 用户裁决「整批留给后续卡」→ **挂起**。miner 两则草稿同样留工作区、不进正式候选区。 | 挂起 |
