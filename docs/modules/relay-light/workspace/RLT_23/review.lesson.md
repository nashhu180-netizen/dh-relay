# RLT_23 · R1 教训路复核（reviewer-lesson，fresh 独立路）

复核对象：`wt/RLT_23` @ `cb5be21`（`git log master..HEAD` 四笔：W1 / C1 / C2 / C2-check 记录）。复核者未参与施工；全部结论经独立回读原始来源（RLT_11 findings、教训库-候选、RLT_12 dry-run 证据、设计 §11、三份 skill 文本现状）与实跑机械核对得出，不采信施工者自述。

## 结论

APPROVE（判据内 P1=0，P2=0；另登记范围外 P2 级建议 1 条、观察 2 条）

## 逐条判据

| # | 判据 | 结论 | 级别 | 依据（文件:行） | 整改动作 |
|---|---|---|---|---|---|
| 1 | 来源教训是否被真正回流：F-003/F-005/F-006/F-007 写成「现象+动作+判据」可执行纪律而非软提醒，限定条件不丢 | PASS | — | F-005→A151：`SKILL.md:34`、`adapter-claude-code.md:79`、`adapter-codex.md:78` 三处逐字（`queued` 排队提示→补 `send-keys enter` 并复核送达→未确认不得当作已通知）；F-007→A153：`SKILL.md:36`、`adapter-claude-code.md:101`、`adapter-codex.md:100` 三处逐字，「长 `sleep` 中也会被报 `done`」限定与「不得单凭 pane 状态判死重拉」俱在，且将 findings 的「计时器**或**账本行」加强为三要素同时确认（更严、方向正确）；F-006→A152：`SKILL.md:38`、`adapter-claude-code.md:51-52`、`adapter-codex.md:50-51` 保留「Claude 主控下」限定与「不得把 bypass 写成无条件全局口径」判据；F-003→A154：`SKILL.md:127-129` 独立 `- [ ]` 可勾选项，含 `git worktree list`/`git branch` 核对命令与「先关终端空间再删树」次序。命令面差异均属 oracle 逐字范围内的合理泛化：F-005 的 `herdr pane send-keys <pane> enter` 写作通用 `send-keys enter`，与 adapter 既有 `herdr agent send-keys <名> enter` 同族 | 无 |
| 2 | 与既有教训是否冲突或重犯（教训库-候选相关条目、RLT_12 DR-F-001~006、A140）；有无把 Linux/Codex 主控结论误改成全局 | PASS | — | 逐条对照：`教训库-候选.md` 候选-64/67/82（回显≠投递/提交——同向加强）、候选-88/89（等待须有接收者、Herdr `done` vs 账本 `done` 分层——A153 正是该分层的落实，非冲突）、候选-17/87（sandbox 语义——新文未声称「机器强制只读」）；RLT_12 DR-F-001 bypass 结论被**收窄**至 Codex 主控侧而非删除或全局化，DR-F-002/004/005 对应既有 stalled/等待/账本监听段未动；A140 原文 `SKILL.md:182-186`、`adapter-claude-code.md:103-109`、`adapter-codex.md:102-108` 未动，新文引述「三者均无变化才中断；任一仍在变化不得中断」同向。实跑 grep：三文件全部 6 处 `bypass` 命中均附着 Codex 主控+只读失败+连续 `NOT_RUN` 条件，无条件口径零命中 | 无 |
| 3 | 本卡 `lesson_candidates.md`：有无该登记未登记项（含 W2/checker P1 模式）；已登记项可复用性 | PASS | — | `lesson_candidates.md:1-6` 记「本节点无」+ C1/C2 各一行「无」；复核登记来源：`review.plan.md:7` W2 P1=0/P2=0、`check.C1.md:7` / `check.C2.md:7` 均 P1=0/P2=0——无可登记 P1 模式；两批施工均一次通过、无返工无异常事件，「无」属实且可核查；写入者边界（A67，lesson 归 coder）未被越权填写 | 无 |
| 4 | 不越界：未改历史 workspace 工件 / design / DevPlan / 测试代码；未跑 install_skill 改用户目录副本 | PASS | — | `git diff master --name-only` 22 个文件全在 `tools/relay-light/skill/**` 与 `docs/modules/relay-light/workspace/RLT_23/**` 闭集内；`git status --short`/`git ls-files --others --exclude-standard`/index 全空，`git diff master --check` 退出 0，无 `__pycache__`；`~/.claude` 与 `~/.codex` 安装副本三文件 sha256 两侧互相同且均不含新文本——`install_skill.py` 未被跑（副本同步归编排合并后处理） | 无 |

## 范围外发现

- **（P2 级建议）Claude 主控侧只读复核形态失败时无书面兜底**：`adapter-claude-code.md:44`「复核只读形态尾部加 `-- --sandbox read-only`」仍为无条件句（本卡按 `task_plan.md:55` 要求未动该节）。在 DR-F-001 环境（本机 bwrap 起不了 `--sandbox read-only` → 连续 `NOT_RUN`）下，新环境预检在 Claude 主控侧只写「默认 sandbox」原则，未写明只读约束此时是否改由派活 prompt 承担（Codex 主控侧有明文）。F-006 实证表明 plan-reviewer 以默认 sandbox 可正常完成，兜底路径存在但未落字。建议后续补一句：Claude 主控下只读形态不可用时改用默认 sandbox 启动、只读约束由派活 prompt 明文承担。
- **（观察）A152 落盘句省略 F-006 成因**：「该 flag 被本地 auto 分类器拦」未进文本（task_plan 冻结原文即如此，设计 A152 行内仅以括号保留）。方向正确且偏保守，但换一台不拦 bypass 的 Claude 主控机时，读者无从判断该规则是否本机限定。仅记一笔，不阻断。
- **（观察）F-003 现场含 origin 同名分支滞留**，A154 核对命令为 `git worktree list` / `git branch`（本地视角）；远端分支删除不在该 checklist 项字面内，现由编排/人工收口覆盖。仅记一笔，不阻断。
