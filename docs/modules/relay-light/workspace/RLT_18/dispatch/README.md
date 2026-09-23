# RLT_18 派活总览（编排维护 · worker 只读）

## 身份与合同

- 任务卡：`RLT_18 — watch（第 5 批）`（DevPlan `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`「#### RLT_18」段，约第 644 行起；任务表第 137 行）
- 设计与验收（`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`，逐字为准）：
  - 目标合同：§3.6 `watch` 组件（约第 480–491 行）；§7.2 等待与节奏（约第 894–908 行）；§1 第 115、140、189 行；§13 第 1436–1439 行
  - 机器验收：§11.1 **`HC-RL-A82` / `A83` / `A101`**（约第 1351–1353 行）
  - 人判：**`HC-RL-H11` / `H12`**（约第 1408–1409 行）
  - A125 终局回归（约第 1280 行）：本卡只做「最终 adapter 改完后四目标重同步」回归，不重复承接该 ID
- GitHub Issue：**#65**（高危，收口写 `Relates to #65`）
- 分支 / worktree：`wt/RLT_18` @ `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`（基线 origin/master `5ab3bba`）
- 档位：**标准 · 高危**；任务类型 **`heavy`** → plan-review 严格口径；有效单测硬要求；必做复核**五路**（AGENTS.md 宪章#5）：代码轮 1 → 闭合后代码轮 2、需求方向、一致性、教训四路并发；收口前须 `verify(relay-light):`
- D-start：用户 2026-09-23 对话点选「豁免前置，现在开工」
- **前置豁免**：DevPlan 依赖 RLT_13、RLT_17 未开始，用户 2026-09-23 明确豁免。已知影响（写进 brief 与 findings，不回避）：①RLT_17 将在带 watch 的 adapter 上跑；②本机只有 Linux，Windows 两个用户级副本同步与 A125 终局回归挂起；③verify 可能被 dev-harness 模块级钩子拦（同 RLT_27 F-001）→ 卡最多停在「待验收」。

## 允许路径（闭集，越界即 FAIL）

worker 可写：
```
tools/relay-light/relay_log.py
tools/relay-light/test_relay_log.py
tools/relay-light/skill/references/adapter-claude-code.md
tools/relay-light/skill/references/adapter-codex.md
docs/modules/relay-light/workspace/RLT_18/**
```
仅编排可写：DevPlan 第 137 行 RLT_18 任务行（状态/依赖豁免备注）。
DevPlan 允许路径中的四个用户级 skill 副本（`~/.claude/skills/relay-light/**`、`~/.codex/skills/relay-light/**` 及 Windows 两处）**worker 一律不碰**——同步由编排在 F 阶段展示绝对目标、取得用户当次授权后执行。

**不动**：design/、AGENTS.md、`SKILL.md` 与 skill 其它文件、`install_skill.py`、`docs/modules/relay-light/relay/**` 历史账本（字节不得变）、as-built、其它卡工作区。发现需同步的别处文本 → 只记 `findings.md` 转派。

## 环境事实（Linux ThinkPad，照抄勿改）

- 单测入口**不能写 dotted 路径**（目录名含连字符）：
  ```
  cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log
  PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
  ```
- 每条测试/脚本命令都带 `PYTHONDONTWRITEBYTECODE=1`；已有 `__pycache__` 不删，只登记 pre-existing。
- 单测一律**打桩** herdr 与时钟（A82/A83 的 oracle 写的就是打桩），单测不得调用真实 `herdr`，不得真 sleep 30 秒/20 分钟。
- 测试若需取旧实现当基线：钉死 SHA `5ab3bba` + `git cat-file -e` 探测 + 缺失时 `git fetch --depth=1 origin <sha>`，失败 `self.fail` 不 skip（CI 浅克隆下 `git show master:` 会崩，RLT_24 教训）。
- 本机 herdr 已装（`herdr agent wait/get/prompt/list` 可用）；`gh` 许多子命令不支持 `--json`，worker 不碰 gh。
- 本机 codex 需 `--dangerously-bypass-approvals-and-sandbox` 才起得来（bwrap 问题）。

## 实测（H11/H12）的特别授权

H11/H12 需要真实拉起「被通知的监工」与 watch 进程。这是 worker 铁律「不拉终端」的**唯一例外**，只在 task_plan 指定的实测批、编排明确说「做实测批」时生效：
- 只能在 herdr workspace `w4B` 内新开 pane，agent 名必须以 `rlt18-probe-` 开头；用完即关（`herdr pane close`），不碰其它任何 pane/workspace。
- 探针计划/账本放 `docs/modules/relay-light/workspace/RLT_18/evidence/` 下自建 fixture，不写 `docs/modules/relay-light/relay/**`。
- 结论只写「展示了什么、时刻、内容」，**人判结论留给用户**，不冒写「用户已判」。

## worker 铁律（摘自仓根 AGENTS.md「编排协议段」）

1. 你是 worker 不是主控：除上节实测例外，**不得**拉终端 / 派活 / 起 watcher，**不得**回头问用户（含 AskUserQuestion）。
2. 只做本 brief 指向的这一件事；别自行加载 dev-harness skill，别满仓库找「流程框架」。
3. 范围外新想法记 `findings.md`（仅 coder 写；其它角色写在自己产出文件的「范围外发现」节），**不顺手做**。
4. 卡住必须落信号：把 `BLOCKED` 结构化写进 `progress.md` 并结束回合。
5. 完成即停，不越位派下一棒。
6. 凭据红线：任何密钥/凭据值不入任何文件。

## Git 纪律

- 只有 builder（W）与 coder（C/X）提交；审核/复核/决策只读不提交（产出由编排代 add 提交）。
- 只 add 点名文件，**禁止 `git add -A` / `git add .`**；scope 英文 `relay-light`；不 push、不改 master、不动其它 worktree；不 rebase 除非 brief 要求。

## 完成信号（追加到 `docs/modules/relay-light/workspace/RLT_18/progress.md` 末尾「信号」节）

```
DONE task=RLT_18 role=<builder|plan-reviewer|coder|checker|decider|reviewer-code1|reviewer-code2|reviewer-requirement|reviewer-consistency|reviewer-lesson> node=<W1|W2|C1..|X1..|R1..R5> status=<OK|PASS|FAIL|BLOCKED|AUTO|CONSULT|APPROVE|REVISE> ts=<ISO8601>
  summary: <一行，审核类含 P1/P2 计数>
  artifacts: <逗号分隔的相对路径>
```
progress.md 由 builder 在 W1 建出；之后 coder 维护正文日志，其它角色**只追加自己的信号块**。

## 角色与派活文件

| herdr 名 | 角色 | 模型 | brief |
|---|---|---|---|
| rlt18-orch | 编排（Claude 主会话，只分发） | — | 本文件 |
| rlt18-builder | W1 builder（建七件套 + 分批 task_plan；REVISE 时修订） | claude opus 5.5 medium | `W1-builder.md` |
| rlt18-audit | W2 plan-reviewer / 每批 checker | claude opus 5.5 medium | `W2-plan-review.md` / `C-check.md` |
| rlt18-decide | decider（仅 BLOCKED；小决策 AUTO，方向类 CONSULT 交用户） | claude fable medium | `D-decider.md` |
| rlt18-coder | coder | devin swe-2-max | `C-coder.md` |
| rlt18-rv | 复核（REVISE 修订后定向回核） | devin swe-2-max | 临时下发 |
| rlt18-review* | 开发后复核五路 | devin swe-2-max（fresh） | `R-*.md`（C 阶段结束后编排再写） |
| rlt18-monitor | 监督（每 2 分钟巡检，常驻） | devin swe-2-medium | `M-monitor.md` |
