# W1 · builder — 建 workspace 七件套 + 分批可执行 task_plan

先读同目录 `README.md`，再读本文件。**只做 W1，做完即停。**

## 必读来源（逐字核，不凭印象转述）

- DevPlan「#### RLT_23」整段（目标 / 非目标 / 验收口径 / 变更范围 / 允许路径 / 档位 / 实施提示）
- design/01 §11 `HC-RL-A151`～`A154`（第 1331–1334 行）与 `HC-RL-A140`（第 1320 行）
- `workspace/RLT_11/findings.md` F-003/F-005/F-006/F-007
- 现状 skill：`tools/relay-light/skill/SKILL.md`、`references/adapter-claude-code.md`、`references/adapter-codex.md`
- 现有结构检查：`tools/relay-light/test_relay_log.py` 与 `test_install_skill.py` 里对 SKILL/adapter 文本做断言的用例（grep `SKILL.md` / `adapter-`），确认改文本不会打破它们
- 先例：`workspace/RLT_11/`、`workspace/RLT_22/` 的 brief / task_plan 格式

## 产出（全部落 `docs/modules/relay-light/workspace/RLT_23/`）

七件套：`brief.md` / `task_plan.md` / `progress.md` / `findings.md` / `lesson_candidates.md` / `review.md`（含复核路径登记表：lesson、consistency 两行 + 人类签名区占位）/ `execution_strategy.md`。

**`task_plan.md` 是核心**，要求：

1. **分批次、每批一个 coder 回合可做完并自证**；批间不得有隐式依赖（除非显式写明前置）。建议 2~3 批，例如：C1 = A151 通知投递确认 + A153 agent_lost 三要素（都落监工/编排模板与两份 adapter）；C2 = A152 codex 主控侧分叉 + A154 F 阶段删树 checklist。你可提出更优切法并写理由。
2. 每批写清：`批号 / 承接 HC / 目标 / 要改的文件与节（精确到文件 + 小节标题 + 插入位置锚点）/ 拟写入的纪律原文（逐字给出，coder 照抄）/ 完成判据（可机械核验：给出 grep 命令与期望命中数；以及反向 grep 证明无软表述/无无条件 bypass 措辞）/ 回归命令 / 预期证据落点`。
3. A151 的「三处命中」、A152 的「两份 adapter 各命中 + skill 无无条件 bypass 措辞」、A153 的「三要素 + 不得单凭 pane 状态 + 与 A140 一致」、A154 的「独立 checklist 行」各自给出**机械核验命令**。A152 须处理 adapter 现有 bypass 相关句（第 47/49 行附近），使之成为按主控侧分叉的表述，Codex 主控下沿用既有 bypass 结论，不得全局无条件。
4. 写明「每批共通约束」：只改允许路径；每批跑 README 的两条回归命令并登记退出码；`git diff master --name-only` 只含允许路径；只 add 点名文件提交；coder 四行小结；**不跑 install_skill.py**。
5. 写明停止边界（DevPlan 非目标四条），以及 F 阶段收口由编排负责（skill 两侧重同步在合并后自 master 主检出执行并比 sha256，不在任何 C 批内）。

`progress.md` 建「日志」「证据账本」「信号」三节；`findings.md` / `lesson_candidates.md` 建文件（本节点无则写「本节点无」）。

## 硬约束

- 本节点**不改** `tools/relay-light/skill/**`，不提前施工。
- 不跑 install_skill.py，不 push。

## 完成

只 add 本卡工作区七件套（dispatch/ 已由编排建，你一并 add 进本次提交），`git commit -m "docs(relay-light): RLT_23 W1 workspace and batched task_plan"`，然后 `progress.md` 追加：
```
DONE task=RLT_23 role=builder node=W1 status=OK ts=<ISO8601>
  summary: 七件套与分批 task_plan 已落盘，共 N 批
  artifacts: brief.md, task_plan.md, progress.md, findings.md, lesson_candidates.md, review.md, execution_strategy.md
```
并把该信号行也 amend 进同一提交（或另起 `docs(relay-light): RLT_23 W1 signal` 提交）。写完即停。

## 修订模式（编排说「按 review.plan.md 修订」时）
逐条处理 `review.plan.md` 的 P1（P2 酌情），在 task_plan 顶部加修订日志行（日期 / 依据 P 项 / 改动摘要），提交 `docs(relay-light): RLT_23 task_plan revised per review.plan r<k>`，追加信号 `node=W1 status=OK summary: 修订 r<k>`，停止。
