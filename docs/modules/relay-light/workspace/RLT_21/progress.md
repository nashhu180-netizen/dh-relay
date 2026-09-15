<!-- dh:v1 -->
# progress — RLT_21

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-15 | coder#1 | C1 施工：A137 stage_result ref= 分 outcome 校验；A138 NOT_RUN 止损 + launch_fix 授权组；A139 launch_fix= 记账入 status --json；A140 silence_timeout_min 配置 + status ledger_silent 提示 + 三处监工模板原文 | E1, E2 | scribe 落账 |
| 2026-09-15 | scribe#1 | C1 证据账登记：全量回归、diff --check、commit a80fcde、四集合边界；逐条登记 A137~A140 | E1~E6 | 等 checker 小审 check.C1.md |
| 2026-09-15 | coder#1 | C2 施工：A141 两 adapter 三段原文；A142 decision_mode 模式门 + cancelled 归属闸（两条 skip 负例去钉）；A143 plan-reviewer light 分级模板 | E7, E8 | checker 小审 |
| 2026-09-15 | coder#1 | C2 整改：三条 P1 闭合——`.devin/` 越界清除、F-008a 补录 A141/A142 原始 RED、F-009 重写 A143 逐条复算并登记口径卡点 | E9, E10 | checker 复审 |
| 2026-09-15 | scribe#1 | C2 证据账登记：A141~A143 RED/GREEN、181 tests skipped=0、commits 0e0f24a/4105da8、checker 复审 PASS（P1=0 P2=1） | E7~E13 | 等编排派 R1 |
| 2026-09-15 | monitor | R1 拉起：requirement#1 / lesson#1 两路 fresh codex 并行（`gpt-5.6-sol` reasoning=medium），scribe#1 复用实例待两路 done 后派 | monitor-R1.md 派单 | 两路复核 |
| 2026-09-15 | requirement#1 | requirement 路复核收口：**FAIL P1=2 P2=3**——P1-1 C1 checker FAIL 无 durable 复审闭环、P1-2 code-round1 未执行；P2-1 A143 口径分歧、P2-2 A140 终态范围、P2-3 两路/三路术语 | `review.requirement.md`、`done.requirement.R1.md` | 路由：P1-1→checker 复审 C1；P1-2→编排补派 code-round1；P2-1→编排/用户裁决 |
| 2026-09-15 | lesson#1 | lesson 路复核收口：**FAIL P1=3 P2=0**——三条教训缺口（done 时机切断返工边、审批菜单编号漂移、PermissionDenied 轮询退避）未进 `lesson_candidates.md`；L-001~L-004 全保留、F-009/L-004 到点 | `review.lesson.md`、`done.lesson.R1.md` | 路由：coder 补三条独立候选后重派 lesson 复审 |
| 2026-09-15 | scribe#1 | R1 体检四道闸（本仓无 dev-harness dh CLI，按具名命令等价执行）：闸1 `python -m unittest -v tools/relay-light/test_relay_log.py` exit=0（181/OK/skipped=0）；闸2 grep 结构命中（A140 三处、A141 两 adapter 各三段、A143 SKILL.md:57）；闸3 三 `diff --check` exit=0 + 四集合无越界；闸4 监工报告 lint=ok / R1 open / requirement+lesson done / scribe live | E14~E18 | review.md 汇总 |
| 2026-09-15 | scribe#1 | review.md 收口登记：Recipe 三行（code-round1 按 requirement 路裁决登记未执行待补派，不自称覆盖）、批次小审 W PASS / C1 FAIL(P1=3)转C2 / C2 PASS(P1=0 P2=1)、独立复核两路、有效单测候选按报告、AI 提交区七条挂证据、体检段、miner 段（4 在册 + 3 待登 = 7 条） | E14~E18、review.md | commit |
| 2026-09-15 | monitor | X1 拉起：coder#1 返工（R1 五条 P1）+ requirement/lesson 两路 fresh 复审 | monitor-X1.md 派单 | coder 返工 |
| 2026-09-15 | coder#1 | X1 返工（零代码改动）：补 F-010/F-011/F-012 三条证据条目钉 check.C1 旧 P1（只登记证据不自判 CLOSED）；`lesson_candidates.md` 新增 L-005/L-006/L-007 | E19 | requirement/lesson 复审 |
| 2026-09-15 | requirement#2 | X1 requirement 路复审：**PASS P1=0 P2=4**——独立裁决 check.C1 三条旧 P1 全 CLOSED（证据 F-010~F-012）；按编排裁决合并承担 code-round1 职责，变异实验 RED→GREEN 已验 | `review.requirement.X1.md`、E20~E22 | F1 收口 |
| 2026-09-15 | lesson#2 | X1 lesson 路复审：**PASS P1=0 P2=0**——L-005~L-007 全 CLOSED、L-001~L-004 未改、新候选 N/A | `review.lesson.X1.md` | F1 收口 |
| 2026-09-15 | scribe#1 | F1 拉起：收口备料——补 progress 日志与证据账（E19~E25 连续续号）、review.md AI 提交区挂 commit/用例/命令并新增交付汇报与证据展示区、findings 仅 F-009 状态登记；`git rebase master` 按 DR-W-008 判 no-op（merge-base HEAD master = master 顶点 6094887）；复跑 181 全量与三集合 diff --check | E19~E25 | commit + done.scribe.F1.md |

## 施工批次状态（预填，不代表已执行）

| Batch | 验收编号 | 小审 | 状态 |
|---|---|---|---|
| C1 | A137 / A138 / A139 / A140 | check.C1.md | 已施工；小审 FAIL（P1=3 P2=0，见 check.C1.md），复审结论未在本工作区落盘 |
| C2 | A141 / A142 / A143 | check.C2.md | 已施工，小审 PASS（P1=0 P2=1，commits 0e0f24a/4105da8） |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 | 支撑结论 |
|---|---|---|---|---|
| E1 | 测试 | `python -m unittest -v tools/relay-light/test_relay_log.py` | exit=0；`Ran 178 tests in 407.346s, OK (skipped=2)` | A137/A138/A139/A140 四组用例随全量回归全绿；RLT_07 两条 skip 负例仍按钉住状态跳过（A142 属 C2 批） |
| E2 | 提交 | commit `a80fcde`（`feat(relay-light): RLT_21 C1 — stage_result ref=、NOT_RUN 止损与 launch_fix 组、status 记账字段与静默提示`） | 8 files, +846/-31：`relay_log.py` +281、`test_relay_log.py` +569、`SKILL.md` +6、`dh-mapping.toml` +1、两份 adapter 各 +8、`findings.md` +3、`lesson_candidates.md` +1 | C1 改动全部落账；findings/lesson 增量为 coder 按 A66/A67 分工写入，属计划内 |
| E3 | 静态检查 | `git diff --check` | exit=0，clean | C1 diff 无空白/冲突标记问题 |
| E4 | 边界检查 | `git diff --name-only master...HEAD` + working tree / index / untracked 四集合 | 命中路径全部在 allowed-paths 闭集（`tools/relay-light/{relay_log.py,test_relay_log.py,skill/**}` 与 `docs/modules/relay-light/workspace/RLT_21/**`），除本节点与 W1 完成信号外无越界 | 四集合无越界修改 |
| E5 | 实现核对（A137） | `git show a80fcde -- tools/relay-light/relay_log.py`（C1 diff） | `stage_result` 校验段按 outcome 分路：`done`/`cancelled` 保 A112 全节点 closed；`blocked`/`failed` 免节点关闭但强制 `ref=<agent>#<n>:(blocked|agent_lost)`，引用须本实例存在且为该 agent 最新事件；缺 ref/引用不存在/被 resume 或终态覆盖退 2 报 A137 | A137 实现与 oracle 一致，E1 覆盖其测试组 |
| E6 | 实现核对（A138/A139/A140） | 同 E5 C1 diff + `skill/dh-mapping.toml`、`SKILL.md`、两份 adapter 增量 | A138：连续 attempt_max 条 NOT_RUN `agent_lost` 后第 attempt_max+1 条 `agent_launch` 退 2（A107）；`user_decision`（note 含 `launch_fix=<token>`）授权唯一 fix 组、token 匹配才放行、组内重计；`status` 不可关原因列 NOT_RUN 计数与 fix 组。A139：`agent_launch.note` 的 `launch_fix=` 走 `_note_tokens` 记账，`status --json` agent 条目暴露（无则 null）。A140：`limits.silence_timeout_min`（默认 30）可加载；`status` 按账本最近事件对超阈在场 agent 标 `ledger_silent` 提示；SKILL.md 与两份 adapter 监工模板各写入处置原文（三者均无变化才中断记 `agent_lost silent_timeout`、同 pane 重拉 `#n+1`、任一仍在变化不得中断） | A138/A139/A140 实现与 oracle 一致，E1 覆盖其测试组；三处模板原文在 diff 中命中 |

### C1 偏离项（真实登记）

- commit `a80fcde` 未含 `progress.md` 施工账更新——本文件由 scribe 节点（本节点）按 A66/A67 分工补记，非 coder 遗漏。
- commit 内 `findings.md` +3、`lesson_candidates.md` +1 为 coder 按分工写入，属计划内，不算越界。
- 无 allowed-paths 外改动、无凭据类内容入账；`dryrun/rlt12-linux` 分支与仓根 `.gitignore` 未动（按 task_plan 不动、交裁决）。
| E7 | 测试（A141 RED/GREEN） | `python -m unittest` 结构检查组 | RED：原始 1 test、10 failures、exit=1（登记于 findings F-008a）；GREEN：两 adapter 各三段原文结构断言通过，随 E11 全量回归绿 | A141：adapter-claude-code.md / adapter-codex.md 各 +10，写入提交/等待纪律、账本事件监听 + 空闲 ≥2min 告警、沙箱替代预检三段原文 |
| E8 | 测试（A142 RED/GREEN） | `python -m unittest` 模式门/归属组 | RED：原始 5 tests、3 failures、exit=1，列明三条实际漏闸（F-008a）；GREEN：RLT_07 两条 skip 负例去钉即绿 + cancelled 归属正反例绿；skipped=0 实证两钉已解 | A142：consult 下无 user_decision 即 resume 退 2、auto 下 decider 链 user_decision 退 2、cancelled 入决策类归属（A69） |
| E9 | 测试（A143 RED/GREEN） | `python -m unittest` 分级模板组 | 原始 RED 不可证（如实登记 F-008a）；重建 RED：parent 基线 + C2 测试 `Ran 5 tests ... FAILED (failures=14)`、exit=1；GREEN：模板命中「P2 不阻断」+四类 P1 原文，随 E11 回归绿 | A143：SKILL.md plan-reviewer 模板 light 分级落地；复算口径分歧见 F-009 → checker P2 |
| E10 | 提交 | commit `0e0f24a`（`feat(relay-light): RLT_21 C2 — A141 adapter 纪律、A142 模式门与 cancelled 归属、A143 light 分级`） | 7 files, +199/-63：`relay_log.py` +45、`test_relay_log.py` ±184、`SKILL.md` +2、两 adapter 各 +10、`findings.md` ±9、`lesson_candidates.md` +2 | C2 首提交；首轮 checker 提出三 P1 |
| E11 | 测试（C2 全量回归） | `python -m unittest -v tools/relay-light/test_relay_log.py` | exit=0；`Ran 181 tests`（checker 实测 519.074s）、`OK`、`skipped=0` | A141/A142/A143 全绿；RLT_07 两钉解除实证（skipped 由 2 → 0） |
| E12 | 提交（整改） | commit `4105da8`（`docs(relay-light): RLT_21 C2 整改 — RED 证据补录与 A143 逐条复算卡点登记`） | 2 files, +3/-1：仅本工作区 `findings.md`、`lesson_candidates.md`；`.devin/` 已清除、未动 `.gitignore` | 三 P1 整改落账：F-008a 补 RED、F-009 按冻结四类逐条复算 = 3 P1 + 2 P2、L-004 教训候选 |
| E13 | 小审 | `check.C2.md`（checker 复审） | PASS：P1=0、P2=1；`git diff --check 0e0f24a 4105da8` exit=0；四集合无越界 | C2 放行；残留 P2-1 = A143 期望计数 `1 P1 + 4 P2` 与冻结逐条计级 `3 P1 + 2 P2` 的口径分歧，待编排/用户裁决，非施工缺陷 |

### C2 偏离项（真实登记）

- 首轮 C2 提交曾产生 `.devin/config.local.json` 越界（P1），整改已在 `4105da8` 前清除，四集合复净。
- A143 原始 RED 不可复现，已用「重建 RED」如实标注，未冒充原始证据。
- A143 oracle 期望计数与冻结计级规则冲突：按本轮派单裁决「口径分歧非施工缺陷按 P2 放行」，登记为 P2-1 待裁决，未改 oracle/验收。

| E14 | 测试（闸1 · scribe R1 复跑） | `python -m unittest -v tools/relay-light/test_relay_log.py`（`PYTHONDONTWRITEBYTECODE=1`） | exit=0；`Ran 181 tests in 500.043s`、`OK`，无 `skipped=` 行即 skipped=0 | 闸1 全量绿；与 requirement 路独立复跑（502.087s/OK）一致 |
| E15 | 结构检查（闸2 · A140） | `grep -n "三者均无变化\|不得中断"` SKILL.md + 两 adapter | `SKILL.md:173`、`adapter-claude-code.md:95`、`adapter-codex.md:94` 三处命中 | A140 三处模板原文在位 |
| E16 | 结构检查（闸2 · A141/A143） | grep 两 adapter 三段锚点 + `SKILL.md:57` | claude adapter `:49/:72/:84`、codex adapter `:48/:71/:83` 各三段；`SKILL.md:57` 命中「P2 不阻断」+四类 P1 | A141 两 adapter 三段、A143 分级模板在位 |
| E17 | 边界检查（闸3） | `git diff --check` ×3（working / `master...HEAD` / cached）+ 四集合 name-only | 三条 `diff --check` 均 exit=0；base 仅 `tools/relay-light/**` 与本工作区；working=`progress.md`；index 空；untracked 全在本工作区 | 四集合无越界 |
| E18 | 账本侧（闸4 · 监工报告口径） | 监工在 RLT_12 树跑 `lint` / `status` | lint=ok；R1 open；requirement/lesson done；scribe live | scribe 不跨树跑账本，按监工派单口径登记 |
| E19 | 提交 | commit `435fad6`（`docs(relay-light): RLT_21 X1 — check.C1 旧 P1 逐项证据补录与 L-005~L-007 教训候选`） | `git show --stat 435fad6`：2 files, +6/-0——仅 `findings.md` +3（F-010~F-012）、`lesson_candidates.md` +3（L-005~L-007）；零代码改动 | X1 返工范围为证据与教训候选，与 R1 路由一致 |
| E20 | 测试（X1 requirement 复跑） | `python -m unittest -v tools/relay-light/test_relay_log.py` | 变异前 `Ran 181 tests in 523.509s` `OK` exit=0；恢复后 `Ran 181 tests in 478.237s` `OK` exit=0；skipped=0（`review.requirement.X1.md` §1） | 全量基线绿，requirement 路独立实测 |
| E21 | 变异实验（X1 · 有效单测） | `python -m unittest -v tools/relay-light/test_relay_log.py -k test_a114_cancelled_uses_triggering_agent` | 选点 `relay_log.py:63` `DECISION_EVENTS` 剔除 `cancelled` → RED：`Ran 1 test in 4.711s` `FAILED (failures=1)` exit=1（`test_relay_log.py:4949` 期望非触发 `checker#1` 被 A69 拒 rc=2、实被放行 rc=0）；恢复后同命令 `Ran 1 test in 5.960s` `OK` exit=0；`git hash-object` 与 `HEAD:tools/relay-light/relay_log.py` 同 `1dd7c719…` | 有效单测 RED→GREEN 已验（`review.requirement.X1.md` §2） |
| E22 | 边界检查（X1） | `git diff --check` ×3（working / `master...HEAD` / cached）+ 四集合 name-only | 三条 `diff --check` 均 exit=0 无输出；`master...HEAD` 仅 `tools/relay-light/**` 与本工作区；untracked 全在本工作区 | 四集合无越界（`review.requirement.X1.md` §2、X1 commit message） |
| E23 | 测试（F1 scribe 复跑） | `python -m unittest -v tools/relay-light/test_relay_log.py`（`PYTHONUTF8=1 PYTHONDONTWRITEBYTECODE=1`） | 自然终态 `Ran 181 tests in 445.998s` `OK`，无 `skipped=` 行即 skipped=0，exit=0 | 收口前全量基线绿 |
| E24 | 边界检查（F1） | `git diff --check` ×3（working / `master...HEAD` / cached）+ 四集合 name-only | 三条 `diff --check` 均 exit=0 无输出；`master...HEAD` 仅 `tools/relay-light/{relay_log.py,test_relay_log.py,skill/**}` 与本工作区；working 仅 `progress.md`/`review.md`/`findings.md`（本节点允许写的三个文件）；index 空；untracked 恰为开工时六个文件（done.coder.X1 / done.lesson.X1 / done.requirement.X1 / done.scribe.R1 / review.lesson.X1 / review.requirement.X1） | commit 前四集合无越界 |
| E25 | 提交 | F1 收口 commit `bbedb73`（`docs(relay-light): RLT_21 F1 — 收口备料…`）；done 信号与 SHA 回填在紧随的下一笔小提交 | 清单：`progress.md` / `review.md` / `findings.md` + 六个开工未跟踪文件（`done.coder.X1.md`、`done.lesson.X1.md`、`done.requirement.X1.md`、`done.scribe.R1.md`、`review.lesson.X1.md`、`review.requirement.X1.md`），逐个 `git add`、不用 `-A`/`.`；9 files, +219/-17 | 收口备料全部入树 |

### X1 偏离项（真实登记）

- 零代码改动是正确结果：R1 路由给 coder 的返工范围是证据补录（F-010~F-012）与教训候选（L-005~L-007），均落在本工作区文档，`relay_log.py`/`test_relay_log.py`/skill 无变更（E19）。
- P1-1（C1 durable 复审闭环缺失）由 X1 requirement 路独立裁决三条旧 P1 全 CLOSED（证据 F-010/F-011/F-012）；`check.C1.md` 按「不改既有复核结论」保持 FAIL 原判，未回写。
- P1-2（normal Recipe 缺 code-round1）按编排裁决由 requirement 路合并承担代码轮职责（RLT_12 `dispatch/monitor-X1.md` 口径），未新建 `review.code-round1.md`；变异实验登记在 `review.requirement.X1.md` §2。
- X1 节点无 scribe 名额，过程账由监工 `stage_result` 与终端交接承载（`review.lesson.X1.md` §漏网事实反查引 `monitor-X1.md:171-172,:537`）；本节为 F1 补录。

## 信号

各角色完成信号以 `done.<role>.md`（跨节点同名角色用 `done.<role>.<node>.md`）独立文件落本目录；本节不重复登记，仅作索引。
