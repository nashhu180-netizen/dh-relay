# RLT_23 · 进度

## 日志

| 日期 | 节点 | 事实与结论 |
|---|---|---|
| 2026-09-17 | W1 | `wt/RLT_23` 在 `7cee7ed` 上 `git rebase master`，结果 up to date；核对 DevPlan、设计 A140/A151～A154、RLT_11 来源与现役 skill/adapter；建七件套和两批计划。此记录只代表 W1 规划。 |
| 2026-09-17 | C1 | `git rebase --autostash master` up to date、分支 `wt/RLT_23` 确认。`SKILL.md` 在「批内不换人」后、「五阶段模板」前新增 `## 派活纪律与监工判活`，放 A151 投递确认与 A153 三要素判活两句原文；两 adapter `## 派活提交纪律` 首段后各补 A151，`## stalled 处置` 与 `## ledger_silent 处置` 之间各新增 `## agent_lost 判活（监工模板）` 放 A153。A140 `ledger_silent` 三段原文未动；A153 三要素以同句逐字满足（非散词命中）。机械核验 3/3/3/3、软表述反查零行 rg exit 1、各文件恰一次；python 210 tests OK；pwsh `RELAY ALL PASS (SKIPPED: 1)`；`git diff --check` 零错误、四集合仅含允许路径、无新增 `__pycache__`。 |
| 2026-09-17 | C2 | `git rebase --autostash master` up to date、分支 `wt/RLT_23` 确认；先读 check.C1.md（PASS）。`SKILL.md`「派活纪律与监工判活」段续加 A152 主控侧分叉原文；`### F 阶段模板` scribe 表闭合后、`## 账本用法` 前加 `**F 阶段收口 checklist**` 与逐字 `- [ ]` 删树确认行（未勾选）。两 adapter `## 环境预检（拉起前）` 原无条件 bypass 段改写为主控侧分叉：两句 oracle 原文逐字落，Codex 主控侧既有机制（只读启动失败/`NOT_RUN`/`launch_fix=`/prompt 只读约束/不改 `launch` 列不走 `plan_amend`）以同主控条件保留。R 模板、F 表 node/agent 行、A140 段、`## agent 拉起` 命令形态均未动。机械核验 2/2/1/1/1、无条件 bypass 反查零行 rg exit 1；python 210 tests OK；pwsh `RELAY ALL PASS (SKIPPED: 1)`；`git diff --check` 零错误、四集合仅含允许路径。 |
| 2026-09-17 | F1 | F 收口备料：两路复核均 APPROVE（review.lesson.md / review.consistency.md，判据内 P1=0 P2=0）。按两路复核、check.C1.md / check.C2.md 与证据账本填 review.md「AI 提交区」三行（四条验收 / 两路复核 / 范围与回归），结论只引已有文件事实，人类签名区保持空白；两路复核范围外发现原样汇总进 findings.md 作转派候选（不施工）。提交只含本卡 workspace 五件。 |

## 证据账本

| ID | 命令或来源 | 结果 | 支撑结论 |
|---|---|---|---|
| E-W1-01 | `git rebase master` | up to date | W1 基线 |
| E-W1-02 | DevPlan §RLT_23；设计 §11 A140/A151～A154；RLT_11 F-003/F-005/F-006/F-007 | 已逐项核对 | 计划的目标、边界、验收来源 |
| E-C1-01 | `git rebase --autostash master && git status && git branch --show-current` | up to date；分支 `wt/RLT_23`；exit 0 | C1 基线与分支 |
| E-C1-02 | `rg -l -F '向 agent 发通知后必须读 pane 末行确认实际投递；pane 出现 \`queued\` 排队提示时补 \`send-keys enter\` 并复核送达；未确认投递不得当作已通知。' <三文件> \| wc -l` | `3`；exit 0；`rg -c` 各文件恰 1 次 | A151 三处逐字命中 |
| E-C1-03 | `rg -l -F 'pane 的 \`working → done\` 不等于 agent 收工…不得单凭 pane 状态判死重拉。' <三文件> \| wc -l` | `3`；exit 0；`rg -c` 各文件恰 1 次 | A153 三要素句三处逐字命中 |
| E-C1-04 | `rg -l -F '三者均无变化才中断' / '任一仍在变化不得中断' <三文件> \| wc -l` | 各 `3`；exit 0 | A140 口径在三文件保持 |
| E-C1-05 | `rg -n -e '发出即视为送达\|发出即送达\|通知发出即完成\|只凭 pane.*(done\|agent_lost)\|仅凭 pane.*判死' <三文件>` | 零行输出；rg exit 1 | 无「发出即送达」/pane 单源判死软表述 |
| E-C1-06 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill` | `Ran 210 tests`；`OK`；exit 0 | 既有结构检查无回归 |
| E-C1-07 | `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`（仓根） | `RELAY ALL PASS (SKIPPED: 1)`；exit 0 | 仓级回归通过 |
| E-C1-08 | `git diff --check`；`git diff master --name-only`；`git diff --name-only`；`git diff --cached --name-only`；`git ls-files --others --exclude-standard` | `diff --check` 零错误；四集合仅含 `tools/relay-light/skill/**` 与 `docs/modules/relay-light/workspace/RLT_23/**`；无 `__pycache__` | 路径闭集与提交洁净 |
| E-C1-09 | `git commit` | 见信号节 artifacts sha | C1 提交 |
| E-C2-01 | `git rebase --autostash master && git status && git branch --show-current` | up to date；分支 `wt/RLT_23`；exit 0 | C2 基线与分支 |
| E-C2-02 | `rg -l -F 'Claude 主控下 codex worker 以默认 sandbox 启动，不加 \`--dangerously-bypass-approvals-and-sandbox\`' <两 adapter> \| wc -l` | `2`；exit 0 | A152 分叉句一两 adapter 命中 |
| E-C2-03 | `rg -l -F 'Codex 主控下沿用既有 bypass 结论' <两 adapter> \| wc -l` | `2`；exit 0 | A152 分叉句二两 adapter 命中 |
| E-C2-04 | `rg -c -F 'Claude 主控下 codex worker 以默认 sandbox 启动' / 'Codex 主控下沿用既有 bypass 结论' SKILL.md` | 各 `1`；exit 0 | A152 两分叉句 SKILL.md 各一处 |
| E-C2-05 | `sed -n '/^### F 阶段模板/,/^## 账本用法/p' SKILL.md \| rg -c -F -- '- [ ] 确认对应 worktree 已删（\`git worktree list\` / \`git branch\` 核对），先关终端空间再删树。'` | `1`；exit 0；行保留 `- [ ]` 未勾选 | A154 F 模板独立可勾选删树行 |
| E-C2-06 | `rg -n -e 'codex.{0,16}一律.{0,16}bypass\|codex.{0,16}总是.{0,16}bypass\|所有 codex.{0,16}bypass\|无条件.{0,12}bypass\|^(拉起每个 agent 前.*改用 bypass 沙箱启动)' <三文件>` | 零行输出；rg exit 1 | 无无条件 bypass 口径 |
| E-C2-07 | 人工逐段反查两 adapter `## 环境预检（拉起前）` | 凡建议 bypass 的句子均附着 Codex 主控条件；只读启动失败/`NOT_RUN`/`launch_fix=`/prompt 只读约束/不改 `launch` 列不走 `plan_amend` 均保留 | A152 条件化收窄落实 |
| E-C2-08 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill` | `Ran 210 tests`；`OK`；exit 0 | 既有结构检查无回归 |
| E-C2-09 | `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`（仓根） | `RELAY ALL PASS (SKIPPED: 1)`；exit 0 | 仓级回归通过 |
| E-C2-10 | `git diff --check`；`git diff master --name-only`；`git diff --name-only`；`git diff --cached --name-only`；`git ls-files --others --exclude-standard` | `diff --check` 零错误；四集合仅含 `tools/relay-light/skill/**` 与 `docs/modules/relay-light/workspace/RLT_23/**`；无 `__pycache__` | 路径闭集与提交洁净 |
| E-C2-11 | `git commit` | 见信号节 artifacts sha | C2 提交 |

## 信号

DONE task=RLT_23 role=builder node=W1 status=OK ts=2026-09-17T10:20:28+08:00
  summary: 七件套与分批 task_plan 已落盘，共 2 批
  artifacts: brief.md, task_plan.md, progress.md, findings.md, lesson_candidates.md, review.md, execution_strategy.md

DONE task=RLT_23 role=plan-reviewer node=W2 status=PASS ts=2026-09-17T10:22:13+08:00
  summary: W2 light 档计划审核通过，P1=0，P2=0
  artifacts: review.plan.md

DONE task=RLT_23 role=coder node=C1 status=OK ts=2026-09-17T10:48:08+08:00
  summary: A151 投递确认与 A153 三要素判活原文落 SKILL.md 及两 adapter；机械核验 3/3/3/3、反查零命中；python 210 tests OK、pwsh RELAY ALL PASS
  artifacts: tools/relay-light/skill/SKILL.md, tools/relay-light/skill/references/adapter-claude-code.md, tools/relay-light/skill/references/adapter-codex.md, progress.md, review.plan.md, findings.md, lesson_candidates.md, commit f7c62c4

DONE task=RLT_23 role=checker node=C1 status=PASS ts=2026-09-17T11:00:46+08:00
  summary: C1 A151/A153 独立核验通过，P1=0，P2=0；grep 3/3/3/3、反查零行，两条回归退出 0
  artifacts: check.C1.md

DONE task=RLT_23 role=coder node=C2 status=OK ts=2026-09-17T11:28:23+08:00
  summary: A152 主控侧分叉落 SKILL.md 与两 adapter 环境预检（无条件 bypass 段已收窄），A154 F 收口 checklist 独立行进 F 模板；机械核验 2/2/1/1/1、反查零行；python 210 tests OK、pwsh RELAY ALL PASS
  artifacts: tools/relay-light/skill/SKILL.md, tools/relay-light/skill/references/adapter-claude-code.md, tools/relay-light/skill/references/adapter-codex.md, progress.md, check.C1.md, findings.md, lesson_candidates.md, commit 4bd6f30

DONE task=RLT_23 role=checker node=C2 status=PASS ts=2026-09-17T11:41:14+08:00
  summary: C2 A152/A154 与 C1 保持检查通过，P1=0，P2=0；grep 2/2/1/1/1、反查零行，两条回归退出 0
  artifacts: check.C2.md

DONE task=RLT_23 role=reviewer-lesson node=R1 status=APPROVE ts=2026-09-17T11:52:10+08:00
  summary: 教训路复核 APPROVE，判据内 P1=0/P2=0；四条来源教训均按 oracle 逐字回流且限定条件不丢、与既有教训及 A140 无冲突、lesson_candidates 无漏登、路径闭集未越界；范围外 P2 建议 1 条（Claude 主控侧只读复核形态失败时无书面兜底）+观察 2 条
  artifacts: review.lesson.md, review.md

DONE task=RLT_23 role=reviewer-consistency node=R2 status=APPROVE ts=2026-09-17T12:05:00+08:00
  summary: 一致性路复核 APPROVE，P1=0/P2=0；A151/A153 原文三处逐字命中、A152 主控侧分叉落实且无条件 bypass 反查零行、A154 F checklist 独立行在、两条回归复跑 exit 0、允许路径与非目标全符；范围外观察 1 条（A152 括号理由「被本地 auto 分类器拦」未入文本）
  artifacts: review.consistency.md, review.md

DONE task=RLT_23 role=coder node=F1 status=OK ts=2026-09-17T12:09:53+08:00
  summary: F 收口备料：review.md AI 提交区三行已按既有证据填写（人类签名区留空），两路复核范围外发现原样转入 findings.md 转派候选；提交仅含本卡 workspace 五件
  artifacts: review.md, review.lesson.md, review.consistency.md, progress.md, findings.md, commit daa29ab

## 人类验收落记（AI 代记）

- **2026-09-17**：PR #43 合入（`f62c472`）后，用户在对话中明确答复「**你帮我代签**」，授权 AI 代记 RLT_23 整卡验收。据此 `review.md` 人类签名区落记「验收通过（整卡整体授权代签，未逐条人判）」，DevPlan 任务表 RLT_23 行由「已完成」转「已验收」。
- 代记依据：AGENTS.md 宪章#4——确认来自用户对话明文；本卡 `light` 档无 H 类人判验收项（A151～A154 均为 AI 结构检查），该授权不构成对任一复核报告条目的逐条人判。
- 边界：本卡不属高危五类，无 `verify(relay-light):` 提交要求；findings.md「转派候选」三条仍为待裁决，不因本次验收关闭。
- 收口动作：PR #43 本体合入 `f62c472`（远端分支已删）；skill 两侧重同步自 master 主检出执行、五文件三处 sha256 一致；worktree `.dh-worktrees/RLT_23` 与分支 `wt/RLT_23` 已删；DevPlan 回填与本落记同走 PR #44。
