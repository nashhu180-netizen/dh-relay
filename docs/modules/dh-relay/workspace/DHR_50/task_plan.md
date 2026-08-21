<!-- dh:v1 -->
# task_plan — DHR_50（轻档·对证施工说明书）

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 (path) | 为什么 |
|----|------------|--------|
| C-001 | `docs/modules/dh-relay/dev_plan/P4-DSH工作台最小Pilot-开发方案.md` §3.2 DHR_50、§4.1~§4.5 | 任务目标、CM4 / CM6b / 三态的权威口径 |
| C-002 | `docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md` | 主报告正文与附录唯一写入节位 |
| C-003 | `docs/modules/dh-relay/workspace/DHR_26/`、`DHR_49/`、`DHR_27/` | 桌面轨事实、CLI 事实、已签人判和证据指针 |
| C-004 | `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\` | 只读取得 fixture、CLI 与 DSH 的原始证据；不得修改其内容 |

## 固定边界

1. 只改本卡工作区、`design/evidence/10-P4-多控制面Pilot报告.md` 的附录，以及开工/收口所需的 DevPlan 状态。
2. 不重跑 DHR_27 的 CLI 主线验收，不 resume v1，不接 Relay 写权，不 fork 或修改 DSH，也不回改报告正文。
3. 人判三态只允许用户对话表态；P4-X 未做必须写“未验证”，不可补造。

## 施工步骤 (Steps)

| # | 改动文件（Create/Modify/Test + 路径） | 怎么改 | 怎么验 |
|---|------------------------------------------|--------|--------|
| 1 | Create `workspace/DHR_50/evidence-index.md` | 将两份 fixture 的来源、hash、CLI 转录、DSH 截图/DOM 转录和版本逐项挂到稳定证据 ID；标明截图或终端转录的真实性与局限。 | 每条 CM4 字段均能追到 CLI 与 DSH 两侧材料；缺侧显式列未覆盖。 |
| 2 | Create `workspace/DHR_50/cm4-field-comparison.md` | 依 Read Model 的列表、详情字段逐项记录预期值、CLI 实际、DSH 实际、结论和证据 ID；不得以“看着一样”替代字段表。 | 同一 fixture hash；字段值逐字一致或明确差异。 |
| 3 | Create `workspace/DHR_50/cm6b-audit.md` | 审计桌面轨指定范围的 Git / 文件事实，分开登记“运行写权”和“fork DSH”两项。 | 每个审计范围有命令、输出摘要、未覆盖边界。 |
| 4 | Create `workspace/DHR_50/review-round1.md`、`review-round2.md`（仅 CM4 拟 pass 时） | 两份互不继承上下文的只读复核记录，复核者仅依据证据索引与字段表判断；第二轮显式确认 fresh-context。 | 两轮均无 P0/P1，且独立结论支持 CM4 `pass`；否则降为事实/部分覆盖而非 pass。 |
| 5 | Modify `design/evidence/10-P4-多控制面Pilot报告.md` 附录 | 追加 CM4/CM6b/诚实差额/P4-X 机器事实与三态/H2/H3 用户待判区；仅在收到对话表态后回填人判。 | 主报告 §1~§5 无改动；附录可独立读出事实、边界和待判问题。 |
