# review — DHR_35

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

### 第一轮·批次小审合集

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 | 证据 |
|---|---|---|---|---|
| 待施工批次完成后派发 | Windows 实录脚本与该批证据 | 待填 | 待派发 | 待填 |

### 第二轮·增量复核

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|---|
| 待收口派 fresh-context 实例 | 全程、两条实录与收口增量 | 待填 | 待填 | 待派发 | 待填 |

### 有效单测·变异点登记

本卡允许路径不含生产代码；有效单测变异点不适用。收口时须证明 diff 仍仅为工作区脚本/证据，若新增生产代码则立即补此表并按标准闸执行。

### 返工收敛

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|---|---:|---|---|
| 1 | 待填 | 待填 | 待填 |

**需求复核结论**：待施工完成后独立登记。  
**教训复核结论**：待施工完成后独立登记。

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_35 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Windows 真实闭环与受控状态 fixture | `e2e-basic-agent-task` / `herdr-adapter` 测试与 DHR35 证据 | 待填 | 待填 | 待派发 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：真实产品未启动。默认 Registry 已 fail-closed（E-3503），Receipt Result bridge 已由 B-24 移交 DHR_64；在 DHR_63/DHR_64 闭合且用户重新放行前，不可对 P6-M1/M3/M5 或身份链做任何通过断言。

**设计契约传导声明**：

- 本卡不改生产合同；Receipt submission 契约由 design/12 与 DHR_64 承接，DHR_35 仅消费已完成桥接。

**需求对齐证据**：

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| P6-H Windows 两条闭环及 pane 延迟 | DSH 关闭下展示 Codex 与 Claude Code 各自的 Receipt/CLI/Herdr 实录 | E-3501 | 待人验 |
| P6-H Linux SSH | B-22 已确认延后；不得展示 fixture 代替 | E-3502 | 待人验（延后/受限） |

**完成条件逐条挂证据**：

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 机器证：P6-M1：至少一个 Codex 与一个 Claude Profile 完成 Receipt→checkpoint→submission→Result 真实节点，Receipt 身份链可证、零凭据；Herdr/judge 不得直写 Result。 | AI | E-3509 | 被阻塞 |
| 2 | 机器证：P6-M6：Linux SSH 断开 / 重连不丢 Herdr 会话与 Relay Run 真相（真实 SSH，不接受 fixture 替代；`DHR-B-22` 调整①延后）。 | AI | E-3502 | 延后/受限 |
| 3 | 机器证：P6-M3/M5：working / blocked / done / unknown 均有真实或受控证据；DSH 关闭时 CLI 显示状态、Attention 与正确 host_ref。 | AI | E-3501 | 待执行 |
| 4 | 机器证（P6-X）：DSH / Pi 可用时连接同一 Run，无第二份状态判断；不可用登记不适用。 | AI | E-3501 | 待执行 |
| 5 | 人判：P6-H：展示 Windows 两条闭环实录 + Linux SSH 实录 + pane 交互延迟；用户判断施工主力与 fallback 是否清楚。 | 人 | E-3502 | 待人验 |

**风险放行账表**：无。

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]  
**as-built 更新了没**：本卡不改现役子系统，N/A [x]

→ 当前状态：**进行中**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

- 确认记录：待 E10 证据展示后回填。
- verify 提交 SHA：待用户 E11 本地收口授权后回填。
- 签名：待用户对话确认。

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---|---|---|---|---|---|---|
