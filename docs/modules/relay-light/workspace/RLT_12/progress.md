<!-- dh:v1 -->
# progress — RLT_12 Windows Claude 首个真计划端到端 demo

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-14 | 用户（对话裁决/授权） | D-start 授权包四项：①真计划唯一业务卡 = RLT_21；②创建 Issue（RLT_12=#23，RLT_21=#21）；③接受 A112/NOT_RUN 已知缺口（监工无合法 blocked 终态 agent、NOT_RUN 只能 `blocked → agent_lost` 重拉、`launch_fix=` 仅作 note 文本），证据按两次预演口径记；④委托节点按节点表默认（S1 brief、E4、E5、E6、E7 派出，判断节点留主会话） | D-001；`brief.md`「用户授权与已知缺口接受记录」；`findings.md` F-001～F-003 | 执行 A32 首步，建工作区七件套 |
| 2026-09-14 23:30 | 编排 `orchestrator#1`（Claude Code，Herdr pane `wA:p1`） | 执行 RLT_12 开工首步 `python tools/relay-light/install_skill.py --all`，取 A32 准入证据：exit 0，源与 `.claude`/`.codex` 两副本五文件 sha256 三处一致，两份 manifest 哈希已记 | E-001 | planner 生成 `relay_plan.md` 并 lint |
| 2026-09-14 | 施工 worker（建工作区） | 拷 dev-harness 标准档七件套模板到 `docs/modules/relay-light/workspace/RLT_12/`，按 DevPlan §RLT_12 逐字填 brief（8 条验收口径）、写 task_plan（8 步施工说明书）、预填 review 验收靶子、登记 E-001/D-001 与已知缺口 F-001～F-005；回填 DevPlan §3.1 RLT_12 行与头部 `dh:status` 两处户口 | 本工作区七件套；DevPlan 两处 diff | 等 planner 产出 `relay_plan.md`；编排按 task_plan 步骤 3 开跑 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|---|---|---|---|---|
| D-001 | 事实行（用户授权） | 2026-09-14 对话 · D-start 授权包 | observed | 宪章#1 入口闸与#4 确认闸：标准档·高危经用户对话明确确认后开工；授权包四项逐项列明，见下「D-001 详录」 |
| E-001 | 机器证（A32 首步安装与哈希比对） | `python tools/relay-light/install_skill.py --all`（cwd=`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12`，HEAD=`51d8062`，2026-09-14 23:30:30） | pass（exit 0；五文件 sha256 三处逐字节一致） | 完成条件 #1（`HC-RL-A32`）：两个用户级目录的五文件分别与 `tools/relay-light/skill/` 同名文件逐字节一致 = 启动真计划的准入证据。原文见下「E-001 原文」 |
| E-002 | 人判材料（H1） | `relay/rlt12-win-01/relay_plan.md` 全文 + 按阶段全程用时表 + 编排操作次数 + RLT_21 产出清单 | 待实跑（预留槽位） | 完成条件 #4（`HC-RL-H1`）：用户判断 Claude 主控真计划是否省事和值得继续 |
| E-003 | 人判材料（H13） | 编排 pane 操作序列（逐条命令 + 时间戳）+ 每阶段终端空间建立/关闭记录 + 各阶段监工实例与存活区间 | 待实跑（预留槽位） | 完成条件 #5（`HC-RL-H13`）：用户判断三层结构、阶段换监工与编排瓶颈 |
| E-004 | 机器输出 + 人判材料（H5） | `relay_log.py status --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/`，运行中一次 + 收口后一次，两次全文 | 待实跑（预留槽位） | 完成条件 #6（`HC-RL-H5`）：用户仅看 status 判断阶段、轮到谁、阻塞与静默时长 |
| E-005 | 人判材料（H14） | 该批 `checkpoint` 账本行序列 + 对应 check 文件；核对打回前后 `agent` 字段 attempt 未 +1 | 待实跑（预留槽位） | 完成条件 #7（`HC-RL-H14`）：用户判断 checker 纠偏效果、批内不换人和成本 |
| E-006 | 人判材料（H10） | 「只给账本」独立展示：仅提供 `relay/rlt12-win-01/` 的账本文件，不给 pane 记录与计划外说明 | 待实跑（预留槽位） | 完成条件 #8（`HC-RL-H10`）：用户判断能否仅凭账本复原现场 |
| E-007 | 机器证（A30 + A31） | `relay_log.py status ... --json` 全文 + `relay_log.py lint ...` exit 0 + 账本全文 | 待实跑（预留槽位） | 完成条件 #2（`HC-RL-A30`）与 #3（`HC-RL-A31`） |
| E-008 | 机器证（非 fixture 佐证） | 每条 adapter 命令原文均带 `--config-dir ~/.claude/skills/relay-light/`；`plan_loaded` 的 `config_dir=` 解码路径（A135 展开并编码记录） | 待实跑（预留槽位） | 证明使用默认安装副本而非 fixture（DevPlan 实施提示） |

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

> **E-002～E-008 是预留槽位，不是结论**：`结果` 列在实跑前一律 `待实跑（预留槽位）`，任何人不得据此宣称已达成。收口时把真实命令、输出与判读补进对应行，并回填 `review.md` 的「达成?」列。
