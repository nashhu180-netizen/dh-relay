<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_03 接真实可见 psmux 并完成阻塞接力 dogfood

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh 小审只看本批 diff 与证据）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| （待派·headless 换人·非施工者） | | | | |

**第二轮·增量复核**（另派 fresh-context、未参与实施的独立 agent 实例；施工会话不得参与）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| （待派） | | | | | |

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| | | | |

**需求复核结论**：（待填）｜证据(E-xxx)｜由（谁）｜派出=

**教训复核结论**：（待填）｜由（谁）｜派出=

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_03 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| psmux adapter 六动词返回形状 / 9 键 | `adapters/fake-adapter.ps1` + `adapters/README.md` v1 契约 | （待填） | | |
| psmux 会话拉起（清 PSMUX_SESSION / 重名 fail-closed / 退出码） | dh-crew `dispatch-launch.ps1` `Invoke-PsmuxNewSession`（只读参考·不调用） | （待填） | | |
| 宿主循环对 Runner 的调用面 | `as-built/relay-runner.md` 入口清单（只调不复制判定） | （待填） | | |
| 新增 params 键 | `as-built/relay-contracts.md` 参数表 | （待填） | | |

> `定义是否一致` 二选一：`一致` / `不一致`。`裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。
- （收口时填）

**设计契约传导声明**（收口时只保留一条）：

- （收口时填：params 追加三键 → as-built；若提议改后端 → 设计决策 7 修订记录）

**需求对齐证据**：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| A7 后端 preflight（psmux adapter 级） | 主控跑 `Invoke-RelayBackendPreflight -Backend psmux -Level adapter` → 五判据 pass + 截图 | | |
| A3 blocked 接力（真实 psmux + 真实 agent） | 主控跑 `run-dogfood -Scenario blocked` → 事件签名精确子序列 + 迟到 A1 stale + 截图/时间线互证 | | |
| A4 decision 挂起（用户回答一次） | 主控跑 `run-dogfood -Scenario decision`，用户在窗口回答一次 → 冻结/继续/零 resume + 人工动作数=1 | | |
| H1/H2 | 对话展示截图 + 时间线 + H2 对照表 | | 待人验 |

**完成条件逐条挂证据**（创建期预填自 brief；收口时补 Evidence ID 和结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 【机器证·A3】事件序列严格为 v1/A attempt1 blocked→handoff ack→exact exit→v2+B→B done→A attempt2 fresh；旧 A result 通过 Runner 真实摄入入口提交，保持内容合法但携带旧身份链，只产生 stale event，不用测试桩直接改 active state。 | AI | | |
| 2 | 【机器证·A4】decision fixture 的原 session 保持可交互；用户在该 session 回答一次后 agent 自然继续，Runner 未读取/转发回答、未调用 resume；依赖节点在后续有效 checkpoint/result 前冻结，无依赖并行节点继续。要求用户再去 Runner 操作则 A4 失败。 | AI | | |
| 3 | 【机器证·A7】`tools/relay/adapters/psmux*` 自己实现 `launch/probe/suspend/resume/stop/emit_observation`，可组合现有 psmux/tmux 原语但不假定旧 `tools/psmux-launch.ps1` 已提供完整 handle；preflight 证明 receipt.launch_id 与新 adapter 返回的完整唯一 session handle 1:1、界面 `visible=true` 且 `interactive=true`、probe 全值匹配，按该 handle 回收后在 evidence 记录的有界期限内确认为 `exited`。仅后台 session、PID/标题/前缀猜测或平台无关 stop 命令均失败。 | AI | | |
| 4 | 【人判·H1/H2】向用户展示真实截图、checkpoint/状态/receipt 时间线和未覆盖范围；decision 正常路径必须记录人工动作数=1，且时间线证明 Runner 未介入回答。对照表按统一口径记录用户显式确认/回答/重启动作数、面向用户的状态通知数，以及 blocked→fresh A 的可见步骤与事件 hop 数，由用户判断是否符合直觉、是否值得进入完整流水阶段。 | 人 | | 待人验 |

**验收项元数据表**：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| A3 真实 blocked 接力事件序列 + 迟到 stale | dogfood blocked 事件签名断言 + `Submit-RelayResultFile` 真实入口 | machine | DHR03-A3 | | 签名精确子序列 + 三文件哈希不变 | | pwsh 7 / Win11 / psmux / wt/DHR_03 | 事件流 + 截图互证 | | relay/v1 | machine-suite | controller-run |
| A4 decision 原 session 可交互 + 冻结/继续 + 零 resume | dogfood decision 事件/快照 + adapter.calls + 静态扫描 | machine | DHR03-A4 | | 快照 frozen_by + calls 计数 + 扫描 0 命中 | | 同上 | 事件流 + 截图 + 用户动作计数 | 回答内容 Runner 不读（无法也不应取证） | relay/v1 | machine-suite | controller-run |
| A7 psmux handle 1:1 / visible / interactive / probe 全值 / 有界 exited | `Invoke-RelayBackendPreflight -Level adapter` + `relay-psmux-real.ps1` | machine | DHR03-A7 | | 五判据 JSON pass + EnumWindows 标题全等 + 期限毫秒 | | 同上 | user32 窗口枚举 + psmux list-* 全等 | orca 只做原语级对比 | relay/v1 | machine-suite | controller-run |
| H1 接力体验是否符合直觉 | 用户看截图/时间线/在窗口回答 | human | DHR03-H1 | | — | | 同上 | 用户 | — | relay/v1 | human | user-confirm |
| H2 与常驻主控对照是否更顺滑、值得进完整流水 | H2 对照表 | human | DHR03-H2 | | — | | 同上 | 用户 | 对照组引用既有记录不重跑 | relay/v1 | human | user-confirm |

**业务化五段展示区**：（收口时填：要证明啥 / 期望值 / 实际值 / 差没差 / 证据局限）

**风险放行账表**：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| | | | | | | |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]
**as-built 更新了没**：`as-built/relay-psmux-host.md` 首份 + `relay-runner.md`/`relay-contracts.md` 补行？ [ ]

→ 当前状态：**进行中**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

### 目的一：H1 接力体验人判（真实 psmux 演示）

本工作区交付：真实可见 psmux 终端 + 两场 dogfood（blocked 重编排 / decision 挂起）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| H1 自动弹出、原会话自然继续、Runner 不介入回答、依赖调度、退出与 fresh 恢复是否符合直觉；能否随时看清真正干活的 agent | 查看 AI 在对话里展示的截图（文件名含 event_id）、`timeline.md`、session 身份、decision checkpoint、依赖冻结/无依赖继续、后续 checkpoint/result、v1/v2 plan、ack/exit/fresh 事件摘要；decision 场景你在原窗口回答一次 | 你判"符合直觉"且人工动作数=1（decision）/0（blocked） | [ ] |

### 目的二：H2 与常驻主控巡检并排对照

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| H2 接力 PoC 是否更顺滑、是否值得进入完整流水阶段 | 查看 `evidence/H2-对照表.md`（人工动作数 / 通知数 / blocked→fresh A 可见步骤与事件 hop 数 / 未覆盖范围） | 你在对话里给判断（值得 / 不值得 / 有条件） | [ ] |

---

- 确认记录：（待用户对话确认）
- verify 提交 SHA：
- 签名：　　时间：

→ 解锁状态：**待人验**

### 确认记录（append-only，每次人验确认追加一行）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| | | | | | | |
