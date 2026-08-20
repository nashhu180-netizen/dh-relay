<!-- progress.md — 施工日志 + 证据账本。🟢 边做边记。这是"实际发生了啥"，容忍跑偏——路径偏了记这里，不回写任何计划文档。项目有 journal 时本文件代替 journal（不双写）。 -->
# progress — DHR_28

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-20 | 主会话(Opus) | 入口闸分流：档位=标准、目标/范围/验收/落点摆出；用户 AskUserQuestion 四轮点选——①worktree=「批次 1 主树，之后再开」②方向裁决=「ADR 草案摆给用户点选」③委托=「照节点表默认」④开工闸=「确认开工」 | 本次对话 AskUserQuestion 记录 | 建工作区八件套 |
| 2026-08-20 | 主会话(Opus) | S0 建工作区：拷 8 件套骨架到 `workspace/DHR_28/` | `ls docs/modules/dh-relay/workspace/DHR_28/` → 8 文件 | S1 brief |
| 2026-08-20 | 委托执行器(sonnet) | S1 brief 起草：完成条件表逐字复制自 DevPlan §3.2 DHR_28 验收口径 5 条 | `brief.md` | 主会话逐字审 |
| 2026-08-20 | 主会话(Opus) | S2 施工步骤：task_plan 写 3 批 16 步 + Context Packet C-001~C-010 + 关键决策；execution_strategy / visual_map 同批落定 | `task_plan.md` / `execution_strategy.md` / `visual_map.md` | 回填 DevPlan 状态，进批次 1 |
| 2026-08-20 | 主会话(Opus) | 回填 DevPlan §3.1 DHR_28 行（状态→进行中、工作区链接、分流要点）+ 刷 P5 `dh:status` 现状块 | `dev_plan/P5-…-开发方案.md` | 跑 `dh dh-relay` |
| 2026-08-20 | 主会话(Opus) | 跑 `dh dh-relay`：45 失败中**无一条属 DHR_28**；P5 计划的 5 条 R29（EVENT_STALE / EVIDENCE_STALE）经查是 HEAD `fd68621` 的存量（该提交只刷现状块 2 行、未动 planning-event 标记）→ 登记 F-001，不顺手改 | E-003 | 进批次 1 |
| 2026-08-20 | 主会话(Opus) | **批次 1 步1~2**：写 ADR-001（语言 Go/TS × 代码根 R-In/R-Out 四组合逐一评，P4 证据 E1~E11 每条带可复跑指针）+ ADR-002（Agent 宿主必答四问，第③问按契约层答并留 DHR_50 口） | E-001 / E-002 | 批次检查点 1 小审 |
| 2026-08-20 | 主会话(Opus) | **口径核实**：design/05 §17「design/04」把旧结论 `Go 已经锁定为最终语言` 明列为「以下结论由本文取代」，§6.3 定 P5 开工按证据选——确认 ADR-001 是真两选，不是追认既定结论 | E-004 | 同上 |

| 2026-08-20 | 主会话(Opus) | **批次 1 步4**：批次检查点 1 小审（fresh subagent `cp1-DHR28`，只读）→ changes-requested，P0/P1=0、P2×2、P3×5；抽验 6 条引用全部与原文相符 | e:E-006 | 逐条修 |
| 2026-08-20 | 主会话(Opus) | **返工收敛（批1-CP1）**：七条 P2/P3 **全接全改**（findings F-002~F-008 均 resolved）——修的核心是三处**会引导用户裁决的偏斜**（对照表换权威源致折扣只落 TS 侧、把两边都付的 SDK 成本只记在 Go 头上、代码根轴用「明显」下定性判断）；机器闸复跑全绿 | E-007 | 摆给用户裁决 |
| 2026-08-20 | 主会话(Opus) | **批次 1 步5 · 方向决策落定**：用户两轮对话点选——首轮「你建议用哪个？」+「我倾向于本仓，你觉得呢？」+ 次级「走冻结适配器」；主会话给明示建议与翻盘条件后，第二轮点选「**采纳，进批次 2**」。**决策 = TypeScript + 本仓 `relay-core/` + pi-agent 走冻结适配器** | ADR-001「决策」节（含四条建议依据 + 翻盘条件留痕）；E-008 | 批次 2 步6 建 `relay-core/` |

> **阶段汇报@批次1**：2026-08-20 已在对话给七段 Style A 阶段汇报（③段双口吻：✅ E-001/E-002/E-004/E-005 已展示；⏳ 语言+代码根待用户裁决、批次检查点1小审进行中）。
> **跑偏/偏离记录**：无。批次 1 按 task_plan 步1~3 原样执行。
> **ADR 落点说明**：批次 1 的两份 ADR 暂落 `workspace/DHR_28/adr/`（主树，纯文档）；批次 2 步 6 随代码根落定迁往 `<CODE_ROOT>/adr/`，workspace 只留指针、不留双份正文。

## 证据账本 (Evidence Ledger)

<每条"完成"结论挂一条可复跑的命令 / grep / runtime 输出。不能空口说"做完了"。>
<类型枚举含 `review-dispatch`（派 agent 复核）/ `session-run`（主控本会话直跑复核）——大小写精确，只认这两个小写值。review 派出证据用 `dh dispatch` 一键落账；命令只向本标题下唯一、表头规范的账本写入，缺失/重复/畸形时 fail-closed，不追加孤儿行。>

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-000 | command | `ls docs/modules/dh-relay/workspace/DHR_28/` | observed | S0 八件套骨架齐（8 文件） |
| E-001 | command | `cd workspace/DHR_28/adr && grep -c "^## " ADR-001-runtime-language-and-code-root.md` → `6`；`grep -n "待用户裁决（2026-08-20" ADR-001-*.md` → `111:> 待用户裁决（2026-08-20 分流：草案摆给用户点选）` | pass | 批1步1：ADR-001 六节结构齐；「决策」节未预填结论，明标待用户裁决 |
| E-002 | command | `cd workspace/DHR_28/adr && grep -c "^answer: " ADR-002-agent-host-ownership.md` → `4`；`grep -o "^answer: [a-z-]*" ADR-002-*.md` → `process-executor / pi-agent / dsh-native / herdr-agent` | pass | 批1步2：ADR-002 必答四问逐问有 `answer:` 锚点，无一问缺答 |
| E-003 | command | `git show --stat fd68621` → 1 file / 2 insertions·2 deletions；`git show fd68621 -- <P5计划> \| grep -c "dh:planning-event"` → `0` | observed | F-001 依据：P5 计划的 5 条 R29 失败是 HEAD 存量，非 DHR_28 引入 |
| E-004 | command | `sed -n '653,658p' design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md` → 「以下结论由本文取代」代码块含 `Go 已经锁定为最终语言`；`sed -n '207,219p'` → §6.3「P4 Pilot 完成前不锁定…P5 开工时根据证据选择」 | observed | ADR-001 前提成立：语言是真两选，design/04 旧结论已被 design/05 取代 |
| E-005 | command | ADR-001 证据指针抽验：`grep -n "零 bare import" workspace/DHR_26/findings.md` → 命中行 9 / 17 / 33 / 91（§9 取代注、§7 取代注、§12e、§17）；`grep -n "exists and is not a symlink" workspace/DHR_26/findings.md` → 行29 §12 | pass | ADR-001 的 E6/E7/E8 三条 Go 侧证据指针真实可复跑（非编造引用） |
| E-008 | command | 裁决回填后复跑：`grep -n "^> \*\*决策：" adr/ADR-001-*.md` → `122:> **决策：TypeScript + 本仓新顶层目录 relay-core/**（用户 2026-08-20 对话点选）`；`grep -c "^> 待用户裁决" adr/ADR-001-*.md` → `0`；`grep -c "^## " adr/ADR-001-*.md` → `6` | pass | 批1步5：方向决策已落定并留痕，占位行已清空，六节结构未破 |
| E-007 | command | 小审七条修完后复跑机器闸：`grep -c "^## " ADR-001-*.md`→`6`；`grep -c "^> 待用户裁决（2026-08-20" ADR-001-*.md`→`1`（修 F-002 时曾重复，已去重）；`grep -c "^answer: " ADR-002-*.md`→`4`；`grep -cE "待定\|后续再说\|TBD\|另行讨论" ADR-001-*.md ADR-002-*.md`→`0/0`；`grep -c "G 编号锁" ADR-002-*.md`→`1`；`grep -c "禁词表豁免注" ADR-002-*.md`→`1` | pass | 批1-CP1 返工收敛：七条 P2/P3 全改完且未改坏既有结构闸 |
| E-006 | review-dispatch | dh dispatch | observed | 复核派出：cp1-DHR28 · Opus subagent · fresh-context 只读实例（未参与批1施工，施工方=主会话 Opus）｜批次检查点1小审：只看批1 diff（ADR-001/ADR-002），四条必查=四问答满/P4证据指针抽验/是否预填结论/私有类型泄漏 |
