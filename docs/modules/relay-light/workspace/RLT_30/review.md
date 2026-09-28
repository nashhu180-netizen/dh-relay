<!-- dh:v1 · review.md — RLT_30 验收靶与复核登记。 -->
<!-- dh:review-policy:v1 mode=single-full-targeted max_attempts=2 -->
# review — RLT_30

## 验收靶

| # | 验收 ID | 类型 | 证据 | 结论 |
|---|---|---|---|---|
| 1 | `HC-RL-A131`（RLT-A-15 修订：12 角色） | 机器证 | `test_shipped_roles_toml_has_the_twelve_design_roles`；E-004 | 通过（机器证） |
| 2 | `HC-RL-A163`～`A165`、`A167`（措辞回归，owner 仍 RLT_29，不重判） | 机器证 | `test_install_skill` 九值集 / RELAY_RECEIPT watcher / 零写入；E-004 | 通过（机器证） |
| 3 | `HC-RL-A43`、`A44`（§10.3 样张逐字；`last_writer` 仍 `monitor`） | 机器证 | `test_design_10_3_text_snapshot_is_reproduced_line_by_line`、`test_status_reports_the_last_writer_…`；需求复核实跑 | 通过（机器证） |
| 4 | `HC-RL-A69`、`A85`、`A93`、`A119` + `A62` | 机器证 | task_plan §4；新增/改动字面断言；需求复核 `--json` 新旧 cmp 相同；A93 报错不含角色名，无需改 | 通过（机器证） |
| 5 | grep 三项 | 机器证 | E-003 `evidence/grep-after.txt` | 通过（机器证） |
| 6 | 全量回归 + CI | 机器证 | E-004、E-005；PR #71 CI run 36378500616（`878502c`） | 通过（机器证） |
| 7 | 两机四份副本同步 | 机器证 | E-010 | 通过（机器证） |

## 独立复核区（执行者 ≠ 复核者；normal 三路）

> 复核者均为 Claude Code Agent 工具派出的 fresh subagent（general-purpose，Opus 5.5），未参与施工、不继承主会话上下文；仓内无只读复核后端，按「侦测型降级、非机器只读」执行，复核后主会话核 `git status` 仓内零写入（期间唯一未提交改动为主会话自改的 brief/findings/task_plan）。

**code_review 初审结论**：approved（P0/P1=0；P3×4）｜派出=log:docs/modules/relay-light/workspace/RLT_30/review.code_review.attempt-1.md

<!-- dh:review-attempt:v1 task=RLT_30 attempt=1 kind=full reviewer_session_id=rlt30-e2-review-1 status=punched -->

**定向复查登记（attempt 2）**：N/A——attempt 1 无 open P0/P1，不触发复查。

**有效单测·变异点登记**

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `tools/relay-light/relay_log.py:1725`（`_writer_display_name`） | `"stage-lead" if writer == "monitor" else writer` → `writer` | 改返回值 | `test_design_10_3_text_snapshot_is_reproduced_line_by_line`、`test_status_reports_the_last_writer_and_silence_without_driving_actions` | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest <两测试>`（`tools/relay-light/`） | 76636bc9ffb81c06f0ea8498ec4e767e55af5c0f | 716329a66000449511e122b84aaaf86b155f8b0a | 主会话（施工方；normal 卡不强制轮 2 选点，code_review 复核者核对可信并另加 M3） | 断言失败 |
| `tools/relay-light/relay_log.py:1721`（`_writer_label`） | `"stage-lead (by=monitor)" if writer == "monitor" else writer` → `writer` | 改返回值 | `test_writer_consistency_exits_two_for_every_frozen_owner`、`test_a155_status_warnings_preserve_old_a85_a93`、`test_rlt30_close_writer_messages_name_stage_lead_with_ledger_value` | 同上（三测试） | 4ea55d174c24474fef19fe1be46943ace389b34c | 716329a66000449511e122b84aaaf86b155f8b0a | 主会话（同上） | 断言失败 |

- 复核者补充变异 M3：`STAGE_LEAD_INSTANCE_LABEL` → `"monitor#<n>"`，3 条断言失败（A119/A69 字面被真实守护），见 `review.code_review.attempt-1.md`。

**需求复核结论**：派出=log:docs/modules/relay-light/workspace/RLT_30/review.requirement.md｜rlt30-requirement-1 → **PASS**（P3×2 转后续项 F-008/F-009）

**教训复核结论**：派出=log:docs/modules/relay-light/workspace/RLT_30/review.lesson.md｜rlt30-lesson-1 → FAIL（LES-1 P2 基线误记）→ 主会话纠正（F-002）后闭合；候选 L-01～L-03 落 `lesson_candidates.md`

**返工收敛**

| 路 | open P0/P1 | 处理 | 是否收敛 |
|---|---|---|---|
| code_review | 0 | CR-1 文档笔误已改；CR-2～4 登记 | 是 |
| requirement | 0 | RQ-1/2 登记 | 是 |
| lesson | 0（P2×1） | LES-1 改 brief 基线 | 是 |

---

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：最弱处——① adapter 回退链与 AGENTS watcher 措辞只有 grep 防残留、无结构测试证句子存在（F-005）；② grep 白名单整行放行（F-007）；③ 冻结面仍会让用户在 watch 通知里看到 `monitor#1`（F-008，按用户「只改显示层」裁决属冻结范围）；④ 两机同步尚未执行。

**设计契约传导声明**：
- 契约同步：docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md#rlt-a-15（RLT-A-15 声明、§6.3、§7.5.4、§10.3 均已在本 PR 晋级，实现按其落地）

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| 新终端启用 relay-lite 角色层只见 stage-lead / watcher | 临时 HOME 安装副本后 grep 五件 | E-007（`review.requirement.md`） | 满足 |
| 完整模式 status 显示 stage-lead、JSON 不变 | fixture 实跑 status 文本/`--json` 新旧 cmp | E-007（`review.requirement.md`） | 满足 |
| 写者错误报 stage-lead + 账本原值 | 4 条故意写错的 add | E-007（`review.requirement.md`） | 满足 |
| 旧计划 `[monitor]` 兼容 | 旧式 config 跑 status/lint | E-007（`review.requirement.md`） | 满足 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | `roles.toml` 可由 `tomllib` 加载，角色键与 §6.3 的 12 个角色（含 `stage-lead`、`watcher`）精确相等，每个角色有 `model` 与 `launch`。 | AI | E-004（A131 测试） | 是 |
| 2 | SKILL/双 adapter/AGENTS relay-light 段中 single-task 观察者称 watcher、标头 phase 九值闭集含 `watcher` 不含 `monitor`；结构测试（`test_install_skill.py` 九值集合、零写入正则等）同步通过。 | AI | E-004、E-003 | 是 |
| 3 | `status` 文本与 §10.3 样张**逐字一致**：「当班写入者：stage-lead（DHR_90:C#1）」——括号内为 stage_id，status 文本不另带出 `monitor#<n>`（用户 2026-09-28）；`derive_last_writer` 仍返回账本原值 `monitor`。 | AI | E-004、E-006 M1、E-007 | 是 |
| 4 | 错误/告警（含汇入 `status --json` `errors` 的字符串）遵守三条规矩（用户 2026-09-28「卡里写规矩，字面施工定」）：①主语写 stage-lead；②括号带出账本原值（`by=monitor` 或 `monitor#<n>`）；③错误码 HC-RL-Axx 与退出码不变。具体字面由 `task_plan` 定，复核按三条规矩逐条核；含事件名 `monitor_launch` 的报错不改。 | AI | E-004、E-006 M2、E-007、E-008 | 是 |
| 5 | 对 skill 五件（SKILL.md、两 adapter、`roles.toml`、`dh-mapping.toml`）与 AGENTS.md relay-light 两段跑 grep：①「监工」= 0；②`monitor` 按 promotion-check 同一正则删去冻结词后，剩余命中只允许落在 `task_plan` 预先登记的**内容锚定白名单行**（stage-lead 账本标识说明句、「监督 / 监控 / monitor」别名句、反引号内 `[monitor]` 旧名兼容句、AGENTS 中「原『监工 monitor』」更名说明句），其余 = 0；③`roles.toml` 无以 `[monitor]` 开头的段头。 | AI | E-003 | 是 |
| 6 | 全量回归：`PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill`（`tools/relay-light/`）与 `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 全绿；PR CI 三硬门 success。 | AI | E-004、E-005；CI run 36378500616 三硬门 success | 是 |
| 7 | 两机同步：合入后 ThinkPad `/home/nash/.claude/skills/relay-light`、`/home/nash/.codex/skills/relay-light` 与 thinkbook `C:\Users\nash\.claude\skills\relay-light`、`C:\Users\nash\.codex\skills\relay-light` 四份副本经 `install_skill.py --all` 同步（用户 2026-09-28 已授权），五文件与 master 源 LF 归一化哈希一致；thinkbook 不可达时如实挂起并报告。 | AI | E-010 | 是 |

**风险放行账表**：无（范围/影响/期限/恢复/去处 —）。

**材料齐没齐**：[x] brief / task_plan / progress / 三路复核 / review
**as-built 更新了没**：[x] `as-built/single-task-实现快照.md`（现役行改 watcher，历史行加注）

→ 当前状态：**已完成；PR #71 squash verify=`3872367`，全验收通过**

---

## 自动收口记录

- 任务 ID：RLT_30
- 开工授权依据：brief「本卡开工授权」——用户 2026-09-28「确认开工」；GitHub 动作与两机同步同日授权
- 验收执行者：主会话 Claude Code（Opus 5.5）；三路复核 fresh subagent
- 验收证据：E-001～E-009；PR #71 CI run 36378500616
- 展示版本：`878502c`
- 放行结论：全验收通过（H=0；第 7 条两机同步为合入后机械动作）
- verify 提交 SHA：`3872367`（PR #71 squash；完整 SHA 见 `git log`）

## 人类签名区

H=0，无人判项。

### 确认记录（append-only）

- 2026-09-28 E10：用户 AskUserQuestion 点选「已查看证据，认可收口」——授权 PR #71 squash 合入、verify、回填、两机四份副本同步、删 worktree。
- 2026-09-28 R30 定类：用户点选「认定为规划事件，不算越界」——6 个 RLT-A-15/RLT-B-11 规划文件随同 PR 合入，不计 RLT_30 越界（F-011）。
