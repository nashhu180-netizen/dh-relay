# RLT_12 Linux 预演（非正式 dry run，2026-09-14）

> 用户 2026-09-14 对话选择「先做 1：非正式 dry run」。本目录只是 RLT_12 的预演证据，**不冒充 Windows 验收**；RLT_12 状态不变。

## 演习卡 DRILL_01（不在 DevPlan 任务表内，仅本预演使用）

- 目标：仓根新增 `.gitignore` 忽略 `__pycache__/`（承接 RLT_10 findings F-002）。
- 允许路径：`.gitignore`、`docs/modules/relay-light/workspace/DRILL_01/**`。
- 档位：轻。**任务类型**：轻量 <!-- dh:task-type:v1 task=DRILL_01 type=light -->（Recipe 档位来源；DevPlan 无此卡，以本 stub 代替）
- 验收：`git check-ignore -v tools/relay-light/__pycache__/x.pyc` 命中 `.gitignore`；`git status --short` 在跑完 unittest 后不出现 `__pycache__`。

## 现场

- 分支 `dryrun/rlt12-linux`，worktree `.dh-worktrees/dryrun-rlt12`，基线 master `f3fc788`。
- 计划与账本：`docs/modules/relay-light/relay/dryrun-linux-01/`。
- 主控侧：Claude Code（本会话 = 编排 orchestrator#1），adapter = `references/adapter-claude-code.md`，`--config-dir ~/.claude/skills/relay-light/`。
- 监工：codex（roles.toml 默认）。builder/coder/scribe 的 zcode 未装，按用户裁决改 devin，逐节点写在 `launch` 列，roles.toml 不改。

## 首步：install_skill.py --all（A32）

用户 2026-09-14 授权两个目标目录：`/home/nash/.claude/skills/relay-light/`、`/home/nash/.codex/skills/relay-light/`。

```
$ python3 tools/relay-light/install_skill.py --all
installed: /home/nash/.claude/skills/relay-light
installed: /home/nash/.codex/skills/relay-light
exit=0
```

五文件 sha256 前 12 位（源 / .claude 副本 / .codex 副本三处相同）：

| 文件 | sha256[:12] |
|---|---|
| SKILL.md | f91856c62870 |
| references/adapter-claude-code.md | b67c1aa9e922 |
| references/adapter-codex.md | 3be42baef64d |
| roles.toml | 466c88d9ee55 |
| dh-mapping.toml | cbbfe236bc2c |

manifest.json 两侧各一份（.claude `4b598d4b718d`，.codex `534a5d593593`，内容含各自路径故不同，属安装器约定）。

## 预演运行记录（2026-09-14，Linux，非正式，不计 RLT_12 状态）

计划 `docs/modules/relay-light/relay/dryrun-linux-01/`，分支 `dryrun/rlt12-linux`（基于 master f3fc788），账本 55 行、lint `{"ok": true}`，四阶段全部 `closed result=done`。编排为 Claude 会话（`rlt09-orch`，只分发不施工）；每阶段一个 codex 监工在独立终端空间，worker 各自一 pane。

| 阶段 | 监工空间 | 关键事件 | 用时 | 结果 |
|---|---|---|---|---|
| W#1 | w1X | builder#1 devin 静默 34 分钟（Connection lost）→ `agent_lost` → builder#2 8 分钟交付七件套；plan-reviewer#1–#3 `NOT_RUN`（codex read-only 沙箱起不来）→ #4 换启动方式 → 两轮 FAIL 打回整改 → PASS | 15:36–16:54 | done（commits 4515135…19b19bc） |
| C#1 | w1Y | coder#1 两次自纠 checkpoint → done；checker#1 PASS（E-C1-001..005）；scribe#1 记 progress | 16:55–17:19 | done（dd6024f、5517c62） |
| R#1 | w1Z | lesson#1 PASS P2=1、consistency#1 PASS P2=1 并行；scribe 汇总 | 17:21–17:30 | done（80e805f） |
| F#1 | w10 | 派单被 codex 启动提示吞掉回车，空转 1 小时后补回车；scribe 2 分钟落 as-built + HANDOFF_READY | 17:32–18:35 | done（d3a22e1），未 push/PR |

交付物验证（编排亲核）：`.gitignore` 第 29–31 行追加段；`git check-ignore -v tools/relay-light/__pycache__/x.pyc` → `.gitignore:30:__pycache__/`；跑 unittest 后 status 无 `__pycache__`。

### 发现（供 RLT_12 正式跑与协议修订参考）

| # | 发现 | 影响 | 建议 |
|---|---|---|---|
| DR-F-001 | codex `--sandbox read-only` 在本机（Linux 7.0，bwrap）起不来：`bwrap: loopback: Failed RTM_NEWADDR`；三次重试均 NOT_RUN | relay_plan 的 launch 列与 roles 约定的"只读沙箱"在此环境不可用；Windows 侧 codex 沙箱机制不同，需在 RLT_12 正式跑单独验 | 只读约束改由派活 prompt 承担并用 `--dangerously-bypass-approvals-and-sandbox`；协议应允许 launch 列在 `agent_launch` note 记 `launch_fix=` 而不必 `plan_amend` |
| DR-F-002 | devin swe-2-max 单轮 "Connection lost, retrying..." 挂 34 分钟无产出，进程存活、CPU 正常，无法从状态机区分"长思考"与"挂死" | 监工 `wait --until done` 无限等；本次靠编排巡检发现 | 监工派单固化"静默 >N 分钟 → `agent_lost` → 同 pane 重拉 #n+1"；由编排对卡住实例发两次 Escape 让 wait 返回 |
| DR-F-003 | 监工按 attempt_max=3 停止后想写 `stage_result outcome=blocked` 被 A112 拒绝（无 blocked 终态 agent），监工正确停下不写伪终态 | 协议无"环境性 NOT_RUN 交编排"的合法出口 | SKILL.md 补：worker 从未起来（NOT_RUN）时允许 `escalate --agent monitor#1` 直接交编排 |
| DR-F-004 | `herdr agent prompt` 发给刚启动的 codex 时，启动期"usage limit resets"提示吞掉了提交回车，派单停在输入框 1 小时 | 编排 wait 无返回、纯空转 | 拉起后 `wait --until idle` 再 prompt，prompt 后核 pane 末行确认已提交；编排监听加"监工空转 2 分钟报警" |
| DR-F-005 | 后台 `herdr agent wait` / 轮询进程会被系统低内存杀掉 | 编排失去唤醒 | 编排改用账本文件事件监听（本次 C/R/F 三阶段验证有效） |
| DR-F-006 | plan-reviewer 两轮 FAIL 的 P1 全是计划措辞/写入者边界（coder 不写 progress、builder 不登 lesson），非功能问题 | light 档位仍走了两轮整改，W 阶段 78 分钟 | light 卡的 plan-review 可收窄为 allowed-paths/验收/信号三项 |

结论：relay-light 0.1.0 的账本、状态机、五阶段控制事件与三档复核配方在 Linux 上可整段跑通；异常路径（agent_lost 重拉、NOT_RUN 换启动、A112 拒伪终态）均按预期工作。剩余风险集中在 Windows 环境差异（沙箱、编码、路径），留待 RLT_12 在 ThinkBook 桌面正式跑。
