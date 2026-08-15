<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_01 冻结接力权威、双维状态与异常契约

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh 小审只看本批 diff 与证据）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| | | | | |

**第二轮·增量复核**（另派 fresh-context、未参与实施的独立 agent 实例；codex 为施工者不得参与）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| | | | | | |

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| | | | |

**需求复核结论**：<待收口>｜证据(E-xxx)｜由 <复核者>｜派出=<e:E-xxx / log:路径>

**教训复核结论**：<待收口>｜命中条目｜由 <复核者>｜派出=<e:E-xxx / log:路径>

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_01 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| | | | | |

> `定义是否一致` 二选一：`一致` / `不一致`。`裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。
-

**设计契约传导声明**（收口时只保留一条）：

- 契约同步：<仓库相对路径#稳定锚点>
- 契约无变化：<非占位理由>

**需求对齐证据**：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| A1~A8 契约面（本卡 H=0） | 一键复跑 `pwsh tools/relay/tests/run-relay-tests.ps1` 全绿 | | |

**完成条件逐条挂证据**（创建期预填自 brief；收口时补 Evidence ID 和结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 【机器证·A1】schema、固定枚举和机器可读穷举转换矩阵通过；每个合法边有正例、每个未列举边均失败，终端/业务两维任一非法时整体不推进。 | AI | | |
| 2 | 【机器证·A2】plan/generation/attempt/launch/session 完整绑定，旧/重复/错版本结果夹具被拒。 | AI | | |
| 3 | 【机器证·A4/A6】冻结 `decision_required` 非终态 checkpoint 与 final result 的边界；checkpoint 后只冻结依赖节点、无依赖并行节点继续，同一 authority/launch/session/attempt 的后续 checkpoint/final result 可更新投影，错 session/generation 与旧 attempt 均拒绝；Runner 不读取、转发人工回答，也不调用 resume；quota P1 降级为 `interrupted_unknown` 兜底，不实现独立可信恢复事件通道（目标形态再补）。 | AI | | |
| 4 | 【机器证·A5/A6】`succeeded` 不等于完成；final result 不可改写；半写、坏 JSON、probe error、无进展和无结果退出均有反例夹具。 | AI | | |
| 5 | 【机器证·A8】交接自足；credential-shaped detector 至少覆盖 `api_key/private_key/password` 三类代表性凭据，命中值完整替换、不保留前缀，handoff/result/event/session-tail 任一 final 工件残留即失败；PII/内部主机名不纳入本卡 detector。 | AI | | |

**验收项元数据表**：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| A1 契约与矩阵穷举 | relay-contract-schema/transitions 套件 | machine | DHR01-A1 | | | | | | | | | |
| A2 身份链拒旧 | relay-contract-identity 套件 | machine | DHR01-A2 | | | | | | | | | |
| A4/A6 checkpoint 边界+降级 | relay-contract-identity/transitions/failures 套件 | machine | DHR01-A4 | | | | | | | | | |
| A5/A6 final 不可改写+失败夹具 | relay-contract-identity/failures 套件 | machine | DHR01-A5 | | | | | | | | | |
| A8 脱敏 | relay-contract-redaction 套件 | machine | DHR01-A8 | | | | | | | | | |

**业务化五段展示区**：

- 要证明啥：{收口填}
- 期望值：{…}
- 实际值：{…}
- 差没差：{…}
- 证据局限：{…}

**风险放行账表**：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]
**as-built 更新了没**：`as-built/relay-contracts.md` 首份快照已建？ [ ]

→ 当前状态：**施工中**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

### 目的一：确认接力契约层 v1 可作为 DHR_02 Runner 的地基（本卡 H=0，仅 E11 本地收口授权）

本工作区交付：dh-relay v1 契约（schema/身份链/穷举转换矩阵/脱敏）+ 失败路径 fixtures + 一键复跑 runner。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 机器证全绿 + 两轮复核收敛 | 查看 AI 在对话展示的 `run-relay-tests.ps1` 输出与复核结论 | RELAY ALL PASS + 0 open P0/P1 | [ ] |

---

- 确认记录：<AI 回填：确认方式 + 用户选择/答复摘要>
- verify 提交 SHA：<AI 代打后回填>
- 签名：hyf（<chat-confirm 代签 / 本人敲 git>）　　时间：

→ 解锁状态：**未验收**

### 确认记录（append-only，每次人验确认追加一行）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| | | | | | | |
