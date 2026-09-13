# rlt08-build — W 阶段 builder

你是 RLT_08 的 builder。**只做本文件这一件事**，不施工 AGENTS.md、不复核、不派活、不问用户。

## 先读
1. 仓根 `AGENTS.md`（全文，尤其「编排协议段」——你要为 RLT_08 设计如何在它上面增段，但**本卡 W 阶段不改它**）。
2. `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_08 卡（目标/非目标/四条验收/允许路径/实施提示）与 §3.1 交付物矩阵。
3. `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §0.3、§1.3（第 2/3/7 条）、§7.1、§11 中 HC-RL-A28 / A29 / A33 / A34 四行原文。
4. `tools/relay-light/skill/SKILL.md` 与 `references/adapter-*.md`（A34 标头原文在 adapter 派活模板首行；AGENTS 判定句必须与之一致）。
5. 模板：`docs/modules/relay-light/workspace/RLT_07/`（brief / task_plan / execution_strategy / progress / findings / lesson_candidates / review 七件的格式），照格式写 RLT_08 的。

## 产出（全部落 `docs/modules/relay-light/workspace/RLT_08/`）
- `brief.md`：覆盖任务表、Issue #14、施工现场、目标、Zero-context 自查、**完成条件**（四条 HC 逐字承接 + 每条给出可执行的 grep/结构检查命令）、边界、触及子系统。
- `task_plan.md`：**分批、worker 可照做粒度**（每批：改哪个小节 / 插入位置 / 样板文本 / 验证命令 / 红→绿判据）。建议批次：B1 双模块身份（A29：项目概况「本仓只有一个模块」与 `dh` 段、落点/slug 段加 relay-light 行、verify scope 英文 `relay-light`）；B2 relay-light 编排协议段（A28/A34：标头判定句「见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水」、现役 Runner 铁律加「冻结流水」边界、原文写出「有意绕过 B-adjust」+「设计与验收仍走 dev-harness」）；B3 阅读矩阵 skill 索引行（A33）+ 全卡机检脚本 + `dh relay-light` 解析证据。批次可合并但必须说明理由。每批末尾写明 audit 小审输入清单。
- `execution_strategy.md`：角色/写权限/禁止事项表（用 dispatch/README.md 的六角色），批次同步点，信号格式。
- `progress.md`：日志表首行记你本次 W 动作；「信号」节预留。
- `findings.md`、`lesson_candidates.md`：空表头 + 说明。
- `review.md`：normal 三路（代码轮 1 / 需求方向 / 教训）骨架，含 `<!-- dh:change-surface:v1 task=RLT_08 phase=predict -->` 块（照 RLT_07 review.md 的写法）。
- 不新增 `<!-- dh:review-policy -->` 之外的 marker 花样；task_type 已冻结 normal。

## 硬边界
- 只写上述工作区文件；**不改 AGENTS.md、不改 dev_plan、不改 design**。
- 发现合同冲突（如 A34 标头原文在 adapter 与 design 不一致）→ 写进 findings.md，不自行选边。
- 完成后 `git add docs/modules/relay-light/workspace/RLT_08 && git commit -m "docs(relay-light): RLT_08 W workspace seven-piece and task_plan"`，然后在 progress.md 追加信号 `DONE task=RLT_08 role=builder batch=W status=W_READY evidence=<文件列表,commit> next=orchestrator`，再把同一行信号打印到终端，**停止**。
