<!-- dh:v1 -->
# progress — RLT_12 Windows Claude 首个真计划端到端 demo

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-14 | 用户（对话裁决/授权） | D-start 授权包四项：①真计划唯一业务卡 = RLT_21；②创建 Issue（RLT_12=#23，RLT_21=#21）；③接受 A112/NOT_RUN 已知缺口（监工无合法 blocked 终态 agent、NOT_RUN 只能 `blocked → agent_lost` 重拉、`launch_fix=` 仅作 note 文本），证据按两次预演口径记；④委托节点按节点表默认（S1 brief、E4、E5、E6、E7 派出，判断节点留主会话） | D-001；`brief.md`「用户授权与已知缺口接受记录」；`findings.md` F-001～F-003 | 执行 A32 首步，建工作区七件套 |
| 2026-09-14 23:30 | 编排 `orchestrator#1`（Claude Code，Herdr pane `wA:p1`） | 执行 RLT_12 开工首步 `python tools/relay-light/install_skill.py --all`，取 A32 准入证据：exit 0，源与 `.claude`/`.codex` 两副本五文件 sha256 三处一致，两份 manifest 哈希已记 | E-001 | planner 生成 `relay_plan.md` 并 lint |
| 2026-09-14 | 施工 worker（建工作区） | 拷 dev-harness 标准档七件套模板到 `docs/modules/relay-light/workspace/RLT_12/`，按 DevPlan §RLT_12 逐字填 brief（8 条验收口径）、写 task_plan（8 步施工说明书）、预填 review 验收靶子、登记 E-001/D-001 与已知缺口 F-001～F-005；回填 DevPlan §3.1 RLT_12 行与头部 `dh:status` 两处户口 | 本工作区七件套；DevPlan 两处 diff | 等 planner 产出 `relay_plan.md`；编排按 task_plan 步骤 3 开跑 |
| 2026-09-15（落章后补做） | 编排派出的三个 fresh 复核实例（均非本卡施工者、非编排、互不相同） | **补做本卡自身 normal Recipe 的三路独立复核**：code-round1、requirement、lesson。三路结论**均为 REVISE**，合计 **P1=8 / P2=16**。**时序如实记：三路是在本卡落章「已验收（带风险放行）」并 squash 合入 master（`7981556`）之后才执行的，不曾作为验收的前置闸** | `review.code-round1.md`（REVISE P1=3 P2=5）、`review.requirement.md`（REVISE P1=3 P2=4）、`review.lesson.md`（REVISE P1=2 P2=7）；三路结论已回填 `review.md` 独立复核区 | 按三路 P1 逐条整改，见下一行 |
| 2026-09-15（复核后整改） | 编排派出的整改 worker（分支 `wt/RLT_12-review`，基线 master `2a9c4f4`） | 按三路复核结论整改本卡台账：①回填 `review.md` 完成条件挂证据表八行与本表 E-007/E-008；②人类签名区五块「结果」列由「通过」改为「**未判定 · 整体授权放行**」（不代用户填任何主观判断）；③新增 `findings.md` F-016～F-022；④按教训路逐条判词处置 `lesson_candidates.md`（L-001 退场、L-003 判合并、L-004/L-006 收窄、L-008 扩写、新增 L-009/L-010）；⑤DevPlan §3.1 RLT_12 行备注与第 3 批开工条件按当前事实同步 | 本工作区四件（`review.md` / `progress.md` / `findings.md` / `lesson_candidates.md`）与 DevPlan 两处 diff | 8 条 P1 的逐条处置见 `review.md`「三路复核 P1 处置登记」；转派项归 RLT_22 与下一张实跑卡 |
| 2026-09-15（更正记录） | 编排（据 requirement 路 P1-3） | **更正 verify 提交 `dd3ac3c` 正文的一处不成立陈述**：该提交正文写「人判材料（H1/H13/H5/H14/H10）已备齐，见 workspace/RLT_12/progress.md 证据账与本次取证」——**该句不成立**。在该提交时点与其后，本表 E-002～E-006 一直是空槽，`evidence/win-real-run/` 从未落盘，H10 的材料从未制作。同一提交末尾又写「人类验收未签，五条人判待用户判断」，**前后自相矛盾**。提交已合入 master、**不可改**，据 AGENTS「失序不伪装」以本行如实更正 | `git log -1 dd3ac3c` 正文；本表 E-002～E-006「未取得」；`findings.md` F-020 | 已登记为 F-020，不再另行处置 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|---|---|---|---|---|
| D-001 | 事实行（用户授权） | 2026-09-14 对话 · D-start 授权包 | observed | 宪章#1 入口闸与#4 确认闸：标准档·高危经用户对话明确确认后开工；授权包四项逐项列明，见下「D-001 详录」 |
| E-001 | 机器证（A32 首步安装与哈希比对） | `python tools/relay-light/install_skill.py --all`（cwd=`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12`，HEAD=`51d8062`，2026-09-14 23:30:30） | pass（exit 0；五文件 sha256 三处逐字节一致） | 完成条件 #1（`HC-RL-A32`）：两个用户级目录的五文件分别与 `tools/relay-light/skill/` 同名文件逐字节一致 = 启动真计划的准入证据。原文见下「E-001 原文」 |
| E-002 | 人判材料（H1） | `relay/rlt12-win-01/relay_plan.md` 全文 + 按阶段全程用时表 + 编排操作次数 + RLT_21 产出清单 | **未取得**（2026-09-15 用户整体授权放行，未逐条判定；材料未装配成展示件、未落 `evidence/win-real-run/`） | 完成条件 #4（`HC-RL-H1`）：用户判断 Claude 主控真计划是否省事和值得继续 |
| E-003 | 人判材料（H13） | 编排 pane 操作序列（逐条命令 + 时间戳）+ 每阶段终端空间建立/关闭记录 + 各阶段监工实例与存活区间 | **未取得**（2026-09-15 用户整体授权放行，未逐条判定；pane 操作序列与终端空间记录未落盘） | 完成条件 #5（`HC-RL-H13`）：用户判断三层结构、阶段换监工与编排瓶颈 |
| E-004 | 机器输出 + 人判材料（H5） | `relay_log.py status --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/`，运行中一次 + 收口后一次，两次全文 | **未取得**（2026-09-15 用户整体授权放行，未逐条判定；收口后一次可随时复跑见 E-007，**运行中那次已永久不可取证**——账本不保存 status 快照） | 完成条件 #6（`HC-RL-H5`）：用户仅看 status 判断阶段、轮到谁、阻塞与静默时长 |
| E-005 | 人判材料（H14） | 该批 `checkpoint` 账本行序列 + 对应 check 文件；核对打回前后 `agent` 字段 attempt 未 +1 | **未取得**（2026-09-15 用户整体授权放行，未逐条判定。客观事实侧可从账本独立复原：seq 20 FAIL → seq 25/26/27 三条 `checkpoint` → seq 28/29 PASS，C2 节点 `coder` 仅 seq 23 一次 launch、attempt 未 +1；缺的是用户的判断这一步） | 完成条件 #7（`HC-RL-H14`）：用户判断 checker 纠偏效果、批内不换人和成本 |
| E-006 | 人判材料（H10） | 「只给账本」独立展示：仅提供 `relay/rlt12-win-01/` 的账本文件，不给 pane 记录与计划外说明 | **未取得——该独立展示从未进行**（2026-09-15 用户整体授权放行；展示这个动作本身没发生，因此不存在可记的判断） | 完成条件 #8（`HC-RL-H10`）：用户判断能否仅凭账本复原现场 |
| E-007 | 机器证（A30 + A31） | `relay_log.py lint --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/` 与同参数 `status`；账本 71 行 launch↔终态机械核对 | **pass**（`lint: ok` exit=0；五个阶段实例全部 `closed result=done`；15 条 `agent_launch` 对 15 条终态、悬空 0）。原文见下「E-007 原文」 | 完成条件 #2（`HC-RL-A30`）与 #3（`HC-RL-A31`） |
| E-008 | 机器证（非 fixture 佐证） | 六份 `dispatch/monitor-*.md` 的 adapter 命令原文均带 `--config-dir ~/.claude/skills/relay-light/`（`grep -c` 分别为 5/5/6/7/7/10 处）；账本 seq 1 `plan_loaded` 的 `config_dir=C:/Users/nash/.claude/skills/relay-light`（A135：该值由程序写入，调用方自带的 `config_dir=`/`plan=` token 被丢弃不采信，见 `tools/relay-light/relay_log.py` §6.2.1 docstring） | **pass**（观测证据充分）。原文见下「E-008 原文」 | 证明使用默认安装副本而非 fixture（DevPlan 实施提示） |

### D-001 详录（2026-09-14 用户对话裁决/授权）

1. **真计划唯一业务卡 = RLT_21**——`rlt12-win-01` 只承载 RLT_21（Issue #21）这一张业务卡。
2. **创建 Issue**——RLT_12 = [Issue #23](https://github.com/nashhu180-netizen/dh-relay/issues/23)；计划内卡 RLT_21 = [Issue #21](https://github.com/nashhu180-netizen/dh-relay/issues/21)。
3. **接受 A112/NOT_RUN 已知缺口**（DevPlan §3.1 RLT_12 备注要求「同次确认须写明接受 A112/NOT_RUN 已知缺口并冻结证据口径」）：RLT_21 未完成先跑 RLT_12，接受——监工无合法 `blocked` 终态 agent（A112 拒伪终态）；`NOT_RUN` 只能 `blocked → agent_lost` 重拉；`launch_fix=` 仅作 note 文本。**证据口径按两次预演口径记**：Linux 预演 `evidence/linux-dry-run/README.md`（本树，DR-F-001～006）、Windows 预演 `evidence/win-dry-run/README.md`（PR #22 已于 2026-09-15 合入 master `6094887`，本树已有，DR-W-001～011）。
4. **确认 D-start**；**委托节点按 `references/节点表.md` 默认**——S1 brief、E4 需求复核、E5 教训复核、E6 miner、E7 as-built 派出；判断节点（施工步骤、代码复核收敛、人闸）留主会话。

### E-001 原文（A32 首步，逐字抄录）

```text
# A32 RLT_12 首步 · 2026-09-14 23:30:30 · cwd=/d/MyFiles/ai-workflow/dh-relay/.dh-worktrees/RLT_12 · HEAD=51d8062
$ python tools/relay-light/install_skill.py --all
installed: C:\Users\nash\.claude\skills\relay-light
installed: C:\Users\nash\.codex\skills\relay-light
exit=0
## tools/relay-light/skill
bcf7aa4721e47aeea81055e06528f8747b552212eb11dc23122c8b03b2774f7c SKILL.md
55e88780a5c6c3bf915692a4f95d9a76a3eb7faee030b4917abc474dd0e41967 references/adapter-claude-code.md
7c95a337c8e713c67ec188b6560d178dc681259579e763e81b05fbb59aacd34a references/adapter-codex.md
61e55dc27660cb2dd90106aca3f6e07aac2010721263d1573ca0067a52284861 roles.toml
dcad3731699d6bb358070d70693086103c38127be6d32813ad6a9c453ebf698b dh-mapping.toml
## /c/Users/nash/.claude/skills/relay-light
bcf7aa4721e47aeea81055e06528f8747b552212eb11dc23122c8b03b2774f7c SKILL.md
55e88780a5c6c3bf915692a4f95d9a76a3eb7faee030b4917abc474dd0e41967 references/adapter-claude-code.md
7c95a337c8e713c67ec188b6560d178dc681259579e763e81b05fbb59aacd34a references/adapter-codex.md
61e55dc27660cb2dd90106aca3f6e07aac2010721263d1573ca0067a52284861 roles.toml
dcad3731699d6bb358070d70693086103c38127be6d32813ad6a9c453ebf698b dh-mapping.toml
## /c/Users/nash/.codex/skills/relay-light
bcf7aa4721e47aeea81055e06528f8747b552212eb11dc23122c8b03b2774f7c SKILL.md
55e88780a5c6c3bf915692a4f95d9a76a3eb7faee030b4917abc474dd0e41967 references/adapter-claude-code.md
7c95a337c8e713c67ec188b6560d178dc681259579e763e81b05fbb59aacd34a references/adapter-codex.md
61e55dc27660cb2dd90106aca3f6e07aac2010721263d1573ca0067a52284861 roles.toml
dcad3731699d6bb358070d70693086103c38127be6d32813ad6a9c453ebf698b dh-mapping.toml
manifest 75cd2dfc67ac9e27ebfd19ca20e2fe33ce0d420355f357da3b5f8085491c4bdf /c/Users/nash/.claude/skills/relay-light/manifest.json
manifest bbcd42d0d6ab8935cc607b03218cd75d3448cfcebdaa03ed2f3fbb2ec4a2f58d /c/Users/nash/.codex/skills/relay-light/manifest.json
```

**判读**：三个 `##` 分组的五行哈希两两相同 → 源 `tools/relay-light/skill/` 与 `%USERPROFILE%\.claude\skills\relay-light\`、`%USERPROFILE%\.codex\skills\relay-light\` 三处逐字节一致，A32 成立。两份 `manifest.json` 哈希不同属安装器约定（内容含各自绝对路径），不影响五文件一致性判据。DevPlan 实施提示要求的「展示 `%USERPROFILE%` 解析后的两个绝对目标」= 上面两行 `installed:`（`C:\Users\nash\.claude\skills\relay-light`、`C:\Users\nash\.codex\skills\relay-light`），用户 2026-09-14 已在 D-001 授权包中授权。

### E-007 原文（A30 + A31 机器闸；2026-09-15 三路复核期回填，复核者本机复跑）

```text
$ PYTHONUTF8=1 python tools/relay-light/relay_log.py lint --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
lint: ok
exit=0

$ PYTHONUTF8=1 python tools/relay-light/relay_log.py status --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
计划：docs/modules/relay-light/relay/rlt12-win-01   skill=0.1.0   session=rlt12-win-01
卡：RLT_21      decision_mode=auto
当班写入者：orchestrator（RLT_21:F#1）

阶段 RLT_21:W#1  closed   result=done
阶段 RLT_21:C#1  closed   result=done
阶段 RLT_21:R#1  closed   result=done
阶段 RLT_21:X#1  closed   result=done
阶段 RLT_21:F#1  closed   result=done
exit=0

# 账本 71 行 launch↔终态机械核对（不依赖 lint 结论）
lines 71
launch 15 with_terminal 15
missing []
```

**判读**：`lint: ok` exit=0 → 完成条件 #3（`HC-RL-A31`）账本每行 schema 与全时序合法成立；五个阶段实例全 `closed result=done`、15 条 `agent_launch` 全部配到终态事件、无悬空 agent → 完成条件 #2（`HC-RL-A30`）成立。

**证据出处与时序说明（重要）**：这两条机器证**在收口当时就已取到**，落在 verify 提交 `dd3ac3c`（`verify(relay-light): RLT_12 机器闸取证——A32/A30/A31 三条`）的正文里，但当时**没有回流进本表与 `review.md` 的「达成?」列**。上面的输出是 2026-09-15 三路复核期在基线 master `2a9c4f4`、分支 `wt/RLT_12-review` 上**重新复跑**所得，与 `dd3ac3c` 正文逐项一致；`review.code-round1.md` §4.1 与 `review.requirement.md` 亦各自独立复跑得同一结果。一处数字更正：`review.code-round1.md` 靶子 2 写「16/16 全有 `done`」，其逐对清单实为 15 对，本次机械核对结果为 **15 条 launch / 15 条终态**，以 15 为准（该笔误不影响「无悬空」的结论）。

### E-008 原文（非 fixture 佐证；2026-09-15 三路复核期回填）

```text
$ head -1 docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl
{"seq":1,"ts":"2026-09-15T10:10:21.353561+08:00","node":"W1","event":"plan_loaded","agent":"orchestrator#1","by":"orchestrator","note":"skill=0.1.0 commit=ddfc21d 编排=Claude Code 主会话 wA:p1 config_dir=C:/Users/nash/.claude/skills/relay-light plan=D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/RLT_12/docs/modules/relay-light/relay/rlt12-win-01"}

$ grep -c -- "--config-dir" docs/modules/relay-light/relay/rlt12-win-01/dispatch/*.md
monitor-C1.md:5   monitor-C2.md:6   monitor-F1.md:10
monitor-R1.md:7   monitor-W1.md:5   monitor-X1.md:7
```

**判读**：`config_dir=` 这个值**不是 note 文本能捏造的**——按 `HC-RL-A135`，账本总是记录程序实际使用的 config 目录与 plan 目录，调用方自带的 `config_dir=`/`plan=` token 被丢弃而非采信（`tools/relay-light/relay_log.py` 的 §6.2.1/A135 docstring 原文：caller-supplied tokens are dropped rather than trusted）。故 seq 1 记录的 `C:/Users/nash/.claude/skills/relay-light` 是**程序实测到的真实安装副本路径**，加上六份派单的 adapter 命令原文一律显式带 `--config-dir ~/.claude/skills/relay-light/`，共同证明本轮用的是默认安装副本而非 fixture。

> **E-002～E-008 是预留槽位，不是结论**：`结果` 列在实跑前一律 `待实跑（预留槽位）`，任何人不得据此宣称已达成。收口时把真实命令、输出与判读补进对应行，并回填 `review.md` 的「达成?」列。

> **上面这条禁令原文保留不动，它仍然有效。** 2026-09-15 三路复核后的回填现状（对照该禁令逐条交代）：
> - **E-007 / E-008 已按禁令要求回填**——真实命令、输出与判读见上两节，`结果` 列改 `pass`，`review.md` 的「达成?」列同步回填。这两条属于「证据取到了没入账」，不是「取不到」。
> - **E-002～E-006 没有按 pass 回填，也不得按 pass 回填**——五条人判的判断内容**未取得**。用户 2026-09-15 的整体授权是对**放行动作**的授权，不构成对任一条人判的判断内容；其中 E-006（H10）所要求的「只给账本」独立展示**从未进行**，因此连可被代记的结论都不存在。`结果` 列据此改为「未取得」，**任何人不得据此宣称已达成**。
