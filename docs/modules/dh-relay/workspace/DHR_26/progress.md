<!-- dh:v1 · progress.md — 事实时间线。🟢 只追加已发生事实。 -->
# progress — DHR_26

> **流程标记：失序补录。** 用户已明确授权开工，但 GitHub connector 的实际落盘顺序先创建 transport mirror 代码、后补八件套，违反 AGENTS「先落户再改代码」的文件顺序要求；本记录保留违规事实，不伪装正常流程。

## 当前状态

- DevHarness 状态：**进行中**。
- 代码开发：完成。
- 目标机接线、复核、收口：未执行，由用户本地承接。

## 时间线（2026-08-18）

1. 读取 P4 DevPlan、dh-relay `AGENTS.md` 与 dev-harness Skill；确认用户口中的 P4 `DHR40` 实际应为 `DHR_49`，DHR_40 属 P7 且受 P6 阶段闸约束。
2. 锁定 DSH 研究基线 `dsh-v0.1.0-rc.7` / commit `99f6f02`；查明 public Cordis Service、profile bundle、`--patch`、显式 `disabled` 与 client scan 机制。
3. 按 TDD 完成只读 fixture repository：列表选择、详情关联、相关字段对证、Attention/节点计数、canonical hash、冻结内部快照与 detached JSON 返回。
4. 红测发现并修复特殊 `run_id` 对象原型污染：`details` 与 canonical 中间对象改为 null-prototype，自有键查询改为 `Object.hasOwn`。
5. 完成 `RelayPilotService`、一次性 probe、安装/disable/enable overlays、package contract 与 runbook。
6. 代码证据：Host 11/11 PASS；`npm pack --dry-run` 包含 9 个运行文件且无 bundled dependency。
7. 未在当前执行环境进行：Windows rc.6/rc.7 版本核对、真实 DSH 启动、probe 转录、安装/卸载/禁用/启用、两轮复核、verify。

## 偏离与处置

- DevPlan 的生产代码位于仓外，GitHub connector 无法直接写用户 `D:\...`。为保持权威落点不变，本分支保存 transport mirror，并提供 fail-closed `materialize.ps1`；不把仓内镜像包装成生产落点。
- 没有冒险整文件覆盖 P4 DevPlan；应同步的状态行放在 `devplan-handoff.md`，防止连接器在大文件上造成非任务性损坏。
