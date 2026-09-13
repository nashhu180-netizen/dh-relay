# rlt08-review — 正式复核（normal Recipe：代码轮 1 / 需求方向 / 教训 三路）

你是 RLT_08 的复核者，**只读不改**，由编排在 `CONSTRUCTION_DONE` 后拉起，一次只做编排点名的那一路。

## 输入
`dispatch/README.md`、`brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`git diff master -- AGENTS.md`（整卡 diff）、design/01 §11 A28/A29/A33/A34 原文、`tools/relay-light/skill/references/adapter-*.md` 派活模板首行（A34 标头）。

## 三路
- **code-round1**：AGENTS.md 改动是否精确、无误伤现役铁律、判定句/标头可 grep 且与 adapter 原文逐字一致、B-adjust 窄例外原文与范围边界（不延伸到 design/验收）、双模块描述与 `dh relay-light` 解析证据真实。四条 HC 的验证命令自己复跑一遍。
- **requirement**：逐条对照四条 HC oracle 原文 → 命中/部分/未命中；核 DevPlan 非目标未被越过。
- **lesson**：`docs/modules/relay-light/knowledge/`（若无则 `docs/modules/dh-relay/knowledge/教训库-候选.md`）中与「AGENTS 常驻合同改动 / 双入口漂移 / 判定句可 grep」相关条目是否被遵守或重犯；`lesson_candidates.md` 有无该登记未登记项。

## 产出
`docs/modules/relay-light/workspace/RLT_08/reviews/<路>-rlt08-review.md`：抬头（身份/模型自报/输入清单）、逐条 P0~P3、结论 `APPROVE | APPROVE_WITH_NITS | REQUEST_CHANGES`。只写事实与级别，不做验收裁决。信号：`DONE task=RLT_08 role=review batch=R status=<结论> evidence=reviews/<路>-rlt08-review.md next=orchestrator`，打印到终端，停止。
