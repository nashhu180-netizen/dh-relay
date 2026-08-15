<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_02 实现最小 Runner 与确定性 fake replay

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh 小审只看本批 diff 与证据）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| （收口时填） | | | | |

**第二轮·增量复核**（另派 fresh-context、未参与实施的独立 agent 实例；codex 施工会话不得参与）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| （收口时填） | | | | | |

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| （收口时填） | | | |

**需求复核结论**：（收口时填）｜证据(E-xxx)｜由 ___

**教训复核结论**：（收口时填）｜由 ___

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_02 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| Runner 事件落账/状态快照字段（relay-store.ps1 / relay-state.json） | DHR_01 冻结契约（relay-schema.ps1 event/receipt/authority/active-plan schema） | （收口时填） | | |
| fake adapter 六动词 | design/01 §3.4 控制事件边界 + DevPlan DHR_02「fake adapter 行为契约」 | （收口时填） | | |
| `tools/relay/runner` 对 dh-crew 引用 | `tools/protocol/**`、`.dh-runtime`、`tools/tests/run-all.ps1` | （收口时填） | | |

> `定义是否一致` 二选一：`一致` / `不一致`。`裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。
- （收口时填）

**设计契约传导声明**（收口时只保留一条）：

- （收口时填：契约无变化 / 契约有变化→已传导到 ___）

**需求对齐证据**：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| A1/A2/A3/A4/A5/A6 + fake adapter 行为契约（本卡 H=0·全机器证） | 在任务树根一键复跑 `pwsh tools/relay/tests/run-relay-tests.ps1` → 11 套件 SUITE PASS + `RELAY ALL PASS` exit 0；两条回放事件签名存 review-logs；主控变异探针证明断言真有牙 | E-001（基线·收口时替换为最终亲跑证据） | 待人验（施工中） |

**完成条件逐条挂证据**（创建期预填自 brief；收口时补 Evidence ID 和结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 【机器证·A1/A2】Runner 只接受合法 active generation 和绑定结果，CAS 冲突/迟到/重复事件不推进。 | AI | | |
| 2 | 【机器证·A3/A4】fake replay 跑通 blocked→replan proposal→B→fresh A，以及 decision checkpoint→依赖冻结/无依赖继续→同 session 后续 checkpoint/final result；断言 Runner 未调用输入或 resume 动作。 | AI | | |
| 3 | 【机器证·A5】`succeeded + next_action=review` 后任务仍 active。 | AI | | |
| 4 | 【机器证·A6】错版本、半写、坏结果、进程活但无进展、无可信 stop/quota 原因均 fail-closed。 | AI | | |
| 5 | 【机器证·fake adapter 行为契约】实现 `launch/probe/suspend/resume/stop/emit_observation` 六个终端动词；消费 DHR_01 的 fixture/观测流，不修改 fixture、不持有业务状态、不判断代码质量。decision fixture 由同一 session 依次发出 `decision_required` 与后续 checkpoint/final result，adapter 不提供人工输入 API；测试断言 Runner 在两者之间没有调用 `resume`，并覆盖依赖节点冻结、无依赖并行节点继续、错身份后续结果拒绝。launch receipt 写入后进入 `launching`；在有界启动期限内未获得绑定 `running` 观测则转 `unknown`、追加 `launch_failed` 事件并停住。 | AI | | |

**验收项元数据表**：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| A1/A2 CAS + 身份绑定不推进 | relay-runner-authority + relay-runner-ingest 套件 | machine | DHR02-A1A2 | （收口时填） | 文件字节比对 + 事件 kind/reason 断言 | | pwsh 7 / Windows 11 / wt/DHR_02 | 契约函数（DHR_01 已独立 oracle）+ 文件哈希 | 真实终端接线归 DHR_03 | relay/v1 | machine-suite | controller-run |
| A3 blocked→replan→B→fresh A | relay-runner-replay-blocked 套件 | machine | DHR02-A3 | （收口时填） | 事件签名精确子序列 + receipt/session 唯一性 + 迟到结果 stale | | 同上 | 剧本夹具（静态）+ 事件签名 | 真实 psmux 归 DHR_03 | relay/v1 | machine-suite | controller-run |
| A4 decision 冻结依赖/无依赖继续/不 resume | relay-runner-replay-decision 套件 | machine | DHR02-A4 | （收口时填） | 逐 tick 快照 + adapter 调用日志零 resume + 源码静态扫描 | | 同上 | 调用日志 + 静态扫描双 oracle | 真人回答归 DHR_03 H1 | relay/v1 | machine-suite | controller-run |
| A5 succeeded 仍 active | relay-runner-ingest 套件 | machine | DHR02-A5 | （收口时填） | 节点键集合恰好白名单 + task_state='active' | | 同上 | 键集合白名单 | — | relay/v1 | machine-suite | controller-run |
| A6 fail-closed 矩阵 | relay-runner-failures 套件 | machine | DHR02-A6 | （收口时填） | 每用例 paused 不变量 + 不再 probe + authority/active-plan 字节不变 | | 同上 | 文件哈希 + 调用计数 | quota 识别通道留目标形态 | relay/v1 | machine-suite | controller-run |
| fake adapter 六动词契约 | relay-runner-authority + 回放套件 | machine | DHR02-FAKE | （收口时填） | 键集合恰好 9 个 + receipt_present + 期限 launch_failed | | 同上 | 键集合白名单 | psmux adapter 归 DHR_03 | relay/v1 | machine-suite | controller-run |

**业务化五段展示区**：

- 要证明啥：（收口时填）
- 期望值：（收口时填）
- 实际值：（收口时填）
- 差没差：（收口时填）
- 证据局限：（收口时填）

**风险放行账表**：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]
**as-built 更新了没**：`as-built/relay-runner.md` 首份快照 + `relay-contracts.md` 补参数？ [ ]

→ 当前状态：**进行中**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

### 目的一：确认最小 Runner + fake replay 已把接力状态机走通（本卡 H=0，仅 E11 本地收口授权）

本工作区交付：Runner core + fake adapter + 两条端到端确定性回放 + 异常 fail-closed 矩阵 + 一键复跑 runner。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 机器证全绿 + 两轮复核收敛（E10 证据展示） | 查看 AI 在对话展示的 `run-relay-tests.ps1` 输出、两条回放事件签名、探针记录与两轮复核结论 | RELAY ALL PASS（11 套件）+ 0 open P0/P1 + 轮1/轮2 均已落账 | [ ] |

---

- 确认记录：
- verify 提交 SHA：
- 签名：　　时间：

→ 解锁状态：**待人验**

### 确认记录（append-only，每次人验确认追加一行）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
