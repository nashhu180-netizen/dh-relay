# RLT_23 派活总览（编排维护 · worker 只读）

## 身份与合同

- 任务卡：`RLT_23 — 派活纪律与收口 checklist 回流`（DevPlan `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的「#### RLT_23」段）
- 设计与验收：`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §11 的 **`HC-RL-A151` / `A152` / `A153` / `A154`**（第 1331–1334 行，逐字为准）；口径须与既有 **`HC-RL-A140`**（第 1320 行，「三者均无变化才中断」）一致
- 来源：`docs/modules/relay-light/workspace/RLT_11/findings.md` 的 F-003 / F-005 / F-006 / F-007（第 11、18–20 行）
- GitHub Issue：**#38**（`Relates to #38`）
- 分支 / worktree：`wt/RLT_23` @ `/home/nash/work/dh-relay/.dh-worktrees/RLT_23`（基线 master = origin/master `7cee7ed`）
- 档位：**轻**；任务类型 `light` → plan-review 按 light 两级分级；必做复核**两路**：教训、一致性（无有效单测硬要求，但改 skill 文本后必须跑既有单测防结构检查回归）
- D-start：用户 2026-09-17 对话「继续开工 RLT23」

## 允许路径（闭集，越界即 FAIL）

```
tools/relay-light/skill/**
docs/modules/relay-light/workspace/RLT_23/**
```

**不动**：`tools/relay-light/*.py`（含 `install_skill.py`、测试）、design、DevPlan、AGENTS.md、其它卡工作区、历史 workspace 工件、`~/.claude` / `~/.codex` 下的 skill 副本（两侧重同步由编排在合并后处理，worker **不要跑 `install_skill.py`**）。

## 环境事实（Linux ThinkPad，照抄勿改）

- 单测入口**不能写 dotted 路径**（目录名含连字符）。正确写法：
  ```
  cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill
  PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
  ```
- 每条测试命令都要带 `PYTHONDONTWRITEBYTECODE=1`，否则 `__pycache__` 落进树撞允许路径核对。发现已有 `__pycache__` **不要删**，只登记 pre-existing。
- 现状锚点：`SKILL.md` 暂无独立「派活纪律」段与 F 阶段收口 checklist；两份 adapter 各有「环境预检（拉起前）」「派活提交纪律」「stalled 处置」「ledger_silent 处置」等节（adapter 第 47/49 行附近已有 bypass 启动相关句，A152 要求其不得成为无条件口径）。

## worker 铁律（摘自仓根 AGENTS.md「编排协议段」）

1. 你是 worker 不是主控：**不得**再拉终端 / 派活 / 起 watcher，**不得**回头问用户。
2. 只做本 brief 指向的这一件事；别自行加载 dev-harness skill，别满仓库找「流程框架」。
3. 范围外新想法记 `findings.md`（仅 coder 写；其它角色写在自己的产出文件「范围外发现」节），**不顺手做**。
4. 卡住必须落信号、不许憋死：把 `BLOCKED` 结构化写进 `progress.md` 并结束回合。
5. 完成即停，不越位派下一棒。
6. 凭据红线：任何密钥/凭据值不入任何文件。

## Git 纪律

- 只有 builder（W 节点）与 coder（C/X 节点）提交；审核/复核/决策只读不提交。
- 提交只 add 点名文件，**禁止 `git add -A` / `git add .`**；scope 用英文 `relay-light`；不 push、不改 master、不动其它 worktree。

## 完成信号（统一格式，追加到 `docs/modules/relay-light/workspace/RLT_23/progress.md` 末尾「信号」节）

```
DONE task=RLT_23 role=<builder|plan-reviewer|coder|checker|decider|reviewer-lesson|reviewer-consistency> node=<W1|W2|C1..|X1..|R1|R2> status=<OK|PASS|FAIL|BLOCKED|AUTO|CONSULT|APPROVE|REVISE> ts=<ISO8601>
  summary: <一行，审核类含 P1/P2 计数>
  artifacts: <逗号分隔的相对路径>
```

progress.md 由 builder 在 W1 建出；之后 coder 维护正文日志，其它角色**只追加自己的信号块**。

## 角色与派活文件

| herdr 名 | 角色 | 模型 | brief |
|---|---|---|---|
| rlt23-orch | 编排（Claude 主会话，只分发） | — | 本文件 |
| rlt23-builder | W1 builder（建七件套 + 分批 task_plan；plan-review REVISE 时修订） | codex gpt-5.6-sol medium | `W1-builder.md` |
| rlt23-audit | W2 plan-reviewer / 每批 checker | codex gpt-5.6-sol medium | `W2-plan-review.md` / `C-check.md` |
| rlt23-decide | decider（仅 BLOCKED；小决策 AUTO，方向类 CONSULT） | codex gpt-6-astra medium | `D-decider.md` |
| rlt23-coder | coder | devin swe-2-max | `C-coder.md` |
| rlt23-rv | 定向复核（REVISE 修订后回核） | devin swe-2-max | 临时下发 |
| rlt23-review-lesson / rlt23-review-consistency | 开发后复核两路 | devin swe-2-max | `R-review-lesson.md` / `R-review-consistency.md` |
| rlt23-monitor | 监督（每 2 分钟巡检，常驻） | devin swe-2-medium | `M-monitor.md` |
