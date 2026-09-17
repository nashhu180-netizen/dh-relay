# RLT_24 派活总览（编排维护 · worker 只读）

## 身份与合同

- 任务卡：`RLT_24 — 关闭动作的独立事件位与 outcome（resource_close）`（DevPlan `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的「#### RLT_24」段，约第 448–462 行）
- 设计与验收（设计文件 `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`，逐字为准）：
  - 目标合同：§3.2 `note` 例外（第 221 行）、§3.4 控制事件表 `resource_close` 行（第 257 行）与**关闭事件 wire format + add/lint 拒绝时点**（第 301–328 行）
  - 验收：§11.1 **`HC-RL-A155` / `A156` / `A157` / `A158`**（第 1335–1338 行）；既有行 **`HC-RL-A2`**（第 1210 行，19→20 词，本卡实现）
  - §12 两类终端空间「删失败怎么办」取证路径（第 1367–1368 行，**只执行与取证，不改设计正文**）
- 来源：`docs/modules/relay-light/workspace/RLT_11/findings.md` F-004
- GitHub Issue：**#39**（`Relates to #39`）
- 分支 / worktree：`wt/RLT_24` @ `/home/nash/work/dh-relay/.dh-worktrees/RLT_24`（基线 master = origin/master `b41cd2d`）
- 档位：**标准**；任务类型 `normal` → plan-review 按常规严格口径（无 light 两级豁免）；有效单测硬要求；必做复核**三路**（AGENTS.md 宪章#5）：代码轮 1 → 闭合后需求方向、教训两路并发
- D-start：用户 2026-09-17 对话「继续 24 任务，分工沿用之前的」

## 允许路径（闭集，越界即 FAIL）

```
tools/relay-light/relay_log.py
tools/relay-light/test_relay_log.py
docs/modules/relay-light/workspace/RLT_24/**
```

**不动**：design/、DevPlan、AGENTS.md、`tools/relay-light/skill/**`（含 SKILL.md、adapter、dh-mapping/roles）、`install_skill.py` 与其测试、`docs/modules/relay-light/relay/**` 下的历史账本（**rlt12-win-01 账本字节不得变**，要回放就复制到临时目录或 workspace evidence 下）、as-built、其它卡工作区、`~/.claude` / `~/.codex` 副本。发现 skill 文本/as-built 需同步 `resource_close` → 只记 `findings.md` 转派，不顺手改。

## 环境事实（Linux ThinkPad，照抄勿改）

- 单测入口**不能写 dotted 路径**（目录名含连字符）。正确写法：
  ```
  cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log
  PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
  ```
- 每条测试/脚本命令都要带 `PYTHONDONTWRITEBYTECODE=1`，否则 `__pycache__` 落进树撞允许路径核对。发现已有 `__pycache__` **不要删**，只登记 pre-existing。
- A158 的「旧实现基线」：用 `git show master:tools/relay-light/relay_log.py > <临时目录>/relay_log_base.py` 取旧实现跑 `status --json`，与新实现对比稳定字段；临时文件不入仓（放 `/tmp/rlt24-*` 或 workspace evidence 下明确登记）。
- A157 取证：两类终端空间（阶段空间、编排空间）各一例可控关闭失败，可实跑（例如 `herdr workspace close` 一个不存在的 id 观察报错）或打桩，**必须明确标注是实跑还是打桩**；账本用 workspace 下自建的 fixture 计划目录，不写 `docs/modules/relay-light/relay/**`，**不关闭任何真实在用的 herdr workspace/pane**。
- 本机 herdr 0.9.0；`gh` 不支持 `--json` 的子命令较多，worker 本卡无需碰 gh。

## worker 铁律（摘自仓根 AGENTS.md「编排协议段」）

1. 你是 worker 不是主控：**不得**再拉终端 / 派活 / 起 watcher，**不得**回头问用户。
2. 只做本 brief 指向的这一件事；别自行加载 dev-harness skill，别满仓库找「流程框架」。
3. 范围外新想法记 `findings.md`（仅 coder 写；其它角色写在自己的产出文件「范围外发现」节），**不顺手做**。
4. 卡住必须落信号、不许憋死：把 `BLOCKED` 结构化写进 `progress.md` 并结束回合。
5. 完成即停，不越位派下一棒。
6. 凭据红线：任何密钥/凭据值不入任何文件。

## Git 纪律

- 只有 builder（W 节点）与 coder（C/X 节点）提交；审核/复核/决策只读不提交（它们的产出文件由编排代为 add 提交）。
- 提交只 add 点名文件，**禁止 `git add -A` / `git add .`**；scope 用英文 `relay-light`；不 push、不改 master、不动其它 worktree。

## 完成信号（统一格式，追加到 `docs/modules/relay-light/workspace/RLT_24/progress.md` 末尾「信号」节）

```
DONE task=RLT_24 role=<builder|plan-reviewer|coder|checker|decider|reviewer-code1|reviewer-requirement|reviewer-lesson> node=<W1|W2|C1..|X1..|R1|R2|R3> status=<OK|PASS|FAIL|BLOCKED|AUTO|CONSULT|APPROVE|REVISE> ts=<ISO8601>
  summary: <一行，审核类含 P1/P2 计数>
  artifacts: <逗号分隔的相对路径>
```

progress.md 由 builder 在 W1 建出；之后 coder 维护正文日志，其它角色**只追加自己的信号块**。

## 角色与派活文件

| herdr 名 | 角色 | 模型 | brief |
|---|---|---|---|
| rlt24-orch | 编排（Claude 主会话，只分发） | — | 本文件 |
| rlt24-builder | W1 builder（建七件套 + 分批 task_plan；plan-review REVISE 时修订） | codex gpt-5.6-sol medium | `W1-builder.md` |
| rlt24-audit | W2 plan-reviewer / 每批 checker | codex gpt-5.6-sol medium | `W2-plan-review.md` / `C-check.md` |
| rlt24-decide | decider（仅 BLOCKED；小决策 AUTO 代执行方案，方向类 CONSULT 交用户） | codex gpt-6-astra medium | `D-decider.md` |
| rlt24-coder | coder | devin swe-2-max | `C-coder.md` |
| rlt24-rv | 定向复核（REVISE 修订后回核） | devin swe-2-max | 临时下发 |
| rlt24-review / rlt24-review2 | 开发后复核：代码轮 1 → 需求方向 + 教训 | devin swe-2-max | `R-review-code1.md` / `R-review-requirement.md` / `R-review-lesson.md` |
| rlt24-monitor | 监督（每 2 分钟巡检，常驻） | devin swe-2-medium | `M-monitor.md` |
