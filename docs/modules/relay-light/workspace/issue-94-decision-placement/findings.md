# 问题、决定建议与影响清单

- 任务 ID：`issue-94-decision-placement`
- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/94
- 状态：本地实施与验证、独立复核已完成；未 PR/合入/安装。

## 当前事实与待确认边界

1. 派单报告的 WFP_03 两次误写为需求来源，未读取业务仓私有对话，不把事故叙述标成独立取证结论。
2. 当前 single-task 基线条款限定 findings 由 coder 写；后续只能扩大“已确认决定的记录”写权，不能顺带授予编排测试、业务复算或基线归因权。
3. 完整模式的 progress 由 scribe 写，允许摘录裁决结论。建议的“progress 不放决定”须明确模式适用范围；本次仅记录冲突，不替用户裁决完整模式改动。
4. findings 是决定摘要与引用落点；独立 decision、用户真实来源与 durable signal 仍保留各自权威，摘要不代替人验。
5. document 仍为可选分工，不因“经文档写手”建议而默认创建或强制启用。
6. 影响清单与建议验收见 brief.md，均为后续待实施；历史 workspace 与派单证据不批量改写。

## 原始派单（完整留存）

# 派单：dh-relay 新建任务 + GitHub Issue（relay-light 明确「决定落 findings」）

你在 dh-relay 仓（cwd `/home/nash/work/dh-relay`，远端 GitHub `nashhu180-netizen/dh-relay`）。发起人：wf-analytics-platform 的 WFP_03 主编排（Claude 会话 wfp03-orch2），受用户 hyf 明确要求。先读本仓 `AGENTS.md`，按其规定的新任务立户与 Issue 流程执行。

## 本次授权范围
- **只做**：按本仓规则新建任务户口（任务工作区/任务卡等本仓要求的立户工件）+ 创建对应 GitHub Issue，并在任务工件里回填 Issue 链接；立户所需的精确路径 commit 与推送按本仓 AGENTS.md 的既有规则判断，规则要求额外确认时停下问用户。
- **不做**：不改 `tools/relay-light/skill/SKILL.md` 本身、不改其它技能/代码、不建 PR、不合入。实施由后续另行授权。

## 要立户的问题
relay-light `single-task` 模式对工作区文档的写者/内容边界没写清「业务决定写在哪」，导致编排把用户裁决写进 `execution_strategy.md`。

- 现行规定（`tools/relay-light/skill/SKILL.md` 的「durable signal 与写者边界」「model-allocation gate」等节）只说：`execution_strategy.md` 仅 orchestrator 写，记角色/模型/实例确认；`progress.md` 仅 batch coder 追加施工里程碑+证据引用。没有说明**用户裁决、decider 结论摘要、D 项（待用户决定项）状态、P3/遗留问题去处、给用户的知会**应落哪个文件。
- 事故（2026-09-29，wf-analytics-platform WFP_03，分支 wt/WFP_03-B1）：编排两次把这类内容写进 `execution_strategy.md`——①B2 批次审核 P3-3「开跑/准入能力未区分，留 D1」及 decider decision-1 的结论与「给用户的知会」；②人验阶段用户 AskUserQuestion 点选的三项决定（P3 处置与去处、D1 接受后定及合入后 test 影响、教训采纳）。用户指出「这是第二次遇到这个问题，应放 findings 或 progress」。
- 期望规则（Issue 中作为建议验收口径）：
  1. `findings.md` 承载所有决定与遗留：用户裁决（含点选时间/来源）、decider 结论摘要与引用、D 项状态、范围外发现与 P3 去处（宪章式「遗留要用户点头并标去处」）、给用户的知会。写者：编排（经文档写手）与 coder 按派单追加；同时写入时需错开。
  2. `execution_strategy.md` 只记编排事实：授权与停止线、角色/模型/实例、派单与路由、批次流转与 clear 闸、提交/checkpoint SHA；涉及决定处只放指向 findings 的指针。
  3. `progress.md` 仍只放 coder 施工里程碑与证据账本，不放决定。
  4. 在 SKILL 的写者边界节补一句「决定落点」规则，并在编排恢复权威/人验收口相关处保持一致；如有配套 reference/模板（例如 dispatch 模板、workspace 模板）同步。
- 影响面提示：检查 relay-light 完整模式与 single-task 两处表述、adapter 文档、任何 workspace 模板里对 execution_strategy/findings 的描述，列出需要改的位置，但本次不改。

## 交付
完成后用中文回报：任务 ID 与工作区路径、Issue 编号与链接、提交/推送 SHA（如有）、未做项与停点。回报方式：`herdr agent prompt wfp03-orch2 "<一句话摘要 + Issue 链接>"`，然后停止。


## D-94-01 · 实施授权与适用边界

- 日期/来源：2026-09-29，本会话用户原文“授权继续”；承接已立户 Issue #94 的实施停点。用户未给精确时分，不补造点选时间。
- 状态：实施获授权；此前不建 PR、不合入仍保留。此条不是人验结果。
- 实现选择：决定落 findings 的新增写权限于 single-task 的决定记录；基线归因仍由 coder 登记并经 reviewer 审核。完整模式维持 coder/scribe 写者分工，明确其 progress 裁决摘要为旧合同特例。
- 决定记录需要引用原件，不新增第五类运行恢复权威；授权/模型确认属于编排事实，继续记录 execution_strategy。
- 下一步：按 brief 当前合同实现、验证、独立复核；无 PR/合入/安装，保留工作树和 Issue。


## 当前交付与接续

- 核心与双 adapter 已按 D-94-01 完成本地实施；一致性/教训独立 PASS，无待整改发现。原始派单及原先待确认边界是历史记录，当前合同以 brief 开头为准。
- 只读 CLI 的 bwrap 不可用，改用独立子代理并核对前后状态及文件哈希；复核边界如实记入 review.md。
- 下一步仅在用户授权远端交付后，核 source/target 与副作用、push/PR/CI，再按授权合入；当前 Issue OPEN、工作树保留，未安装全局技能。


## D-94-02 · 远端交付与安装授权

- 日期/来源：2026-09-29，本会话用户“合并master，同步安装，继续完成 pr”。
- 状态：本卡远端交付和技能安装已授权，取代 D-94-01 的旧停止线；不代表CI/合入/安装已通过。
- 下一步：PR → 必需CI/评审 → 服务端合入 → 合入态复验 → 已有双设备副本同步 → 证据归档及本卡清理。
