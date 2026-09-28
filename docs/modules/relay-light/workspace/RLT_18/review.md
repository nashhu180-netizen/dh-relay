<!-- dh:v1 · review.md — RLT_18 验收靶与复核登记。 -->
<!-- dh:review-policy:v1 mode=single-full-targeted max_attempts=2 -->
# review — RLT_18

> 2026-09-28 主控收口回填：下列登记表按既有 durable signal（`DONE.*.md`）、复核工件与 `execution_strategy.md` 复核者清单回填，结论均引自原工件，不新增判定。

## 验收靶

| # | 验收 ID | 类型 | 承接批次 | 证据 | 结论 |
|---|---|---|---|---|---|
| 1 | `HC-RL-A82` | 机器证 | batch 1（编排级分支 batch 2 回归） | `check.batch-1.md`（r2 PASS `d0a8196`，R-A82 24/24 用例）；`review.e2-code-review.attempt-1.md` A82 逐条 oracle 符合 | 通过（机器证） |
| 2 | `HC-RL-A83` | 机器证 | batch 2 | `check.batch-2.md`（PASS `777d2e2`，R-A83 15 用例）；E2 整改 `test_a83_14/15` + attempt 2 PASS `5e3174e` | 通过（机器证） |
| 3 | `HC-RL-A101` | 机器证 | batch 1 | `check.batch-1.md` R-A101-1~3（静态闭包 + 运行期）；E2 attempt 2 注入式 oracle 复核 | 通过（机器证） |
| 4 | `HC-RL-H11` | 人判 | batch 3 取证 | `evidence/batch-3/H11-claude.md`、`H11-codex.md` | 用户 2026-09-24 判「接受」 |
| 5 | `HC-RL-H12`（契约 v2，RLT-A-14 / RLT-B-10） | 人判 | UD-3 U2 取证（v1 取证见 batch 3） | `evidence/ud3-h12/H12.md` | 用户 2026-09-28 判「接受」 |
| — | `HC-RL-A125` | 终局回归（不承接） | 挂起（F-002） | — | 挂起 |

## plan / batch review 登记

| 闸 | review_round | remediation_count | reviewer | 结论 | durable signal / 工件 |
|---|---:|---:|---|---|---|
| plan-review | 1 | 0 | plan-reviewer#1 | FAIL（P1×4） | `DONE.plan-review.md` / `review.plan.md` |
| builder 整改 1 | 2 | 1 | builder#1 | P1-1/2/4 与 P2 已改；P1-3 先 BLOCKED 待裁决（D12） | `BLOCKED.builder.plan-remediation-1.md` |
| builder 整改 1 续（UD-1/UD-2 后） | 2 | 1 | builder#1 | D12/D13 落裁决、batch 2 纳入 SKILL 三处与旧断言同步、H12 两段演示 | `DONE.builder.plan-remediation-1.md` |
| plan-review 复审 | 2 | 1 | plan-reviewer#1 | FAIL（新 P1×3：P1-A/B/C） | `DONE.plan-review.round-2.md` / `review.plan.md`「复审 round 2」 |
| builder 整改 2（plan 阶段最后一次） | 3 | 2 | builder#1 | P1-A 退出码与运行期容错、P1-B 存活检查按层级定位、P1-C H12-② 事件顺序；P2-A/B | `DONE.builder.plan-remediation-2.md` |
| plan-review 复审 | 3 | 2 | plan-reviewer#1 | PASS（`57656bc`） | `DONE.plan-review.round-3.md` |
| UD-3 plan-review | 1 | 0 | plan-reviewer#ud3 | FAIL | `DONE.plan-review.ud3.md` / `review.plan.ud3.md` |
| UD-3 plan-review 复审 | 2 | 1 | plan-reviewer#ud3 | PASS | `DONE.plan-review.ud3.round-2.md` |
| batch-1 review | 1 | 0 | batch-reviewer#b1（rlt18-b1-reviewer，fresh Devin SWE-2 Max） | FAIL（P1-1 边界/审计项×1；O-1 P2 转 batch 2） | `DONE.batch-1.review.md` / `check.batch-1.md` |
| batch-1 review 复审 | 2 | 1 | batch-reviewer#b1（同上） | PASS（`d0a8196`） | `DONE.batch-1.review.round-2.md` |
| batch-2 review | 1 | 0 | batch-reviewer#b2（rlt18-b2-reviewer，fresh Devin SWE-2 Max） | PASS（`777d2e2`） | `DONE.batch-2.review.md` / `check.batch-2.md` |
| batch-3 review | 1 | 0 | batch-reviewer#b3（rlt18-b3-reviewer，fresh Devin SWE-2 Max） | FAIL（证据文字与 raw 不一致 F-1~F-8） | `DONE.batch-3.review.md` / `check.batch-3.md` |
| batch-3 review 复审 | 2 | 1 | batch-reviewer#b3（同上） | PASS（`b6dd1bc`） | `DONE.batch-3.review.round-2.md` |

## 独立复核区（执行者 ≠ 复核者；每路每轮 fresh reviewer）

> 复核者全部为 fresh Devin SWE-2 Max 实例（argv=`devin --model swe-2-max --permission-mode dangerous`），未参与施工；各实例 Herdr 名/tab 与清理情况见 `execution_strategy.md`。

**第一轮·整卡代码复核（code-round1）**

| 复核者 | 范围 | 发现（P0~P3） | 派出证据 | 证据 |
|---|---|---|---|---|
| rlt18-wf-code1-r1（reviewer#code-round1-r1） | `5ab3bba`→wt/RLT_18 三批全量 | FAIL：C1-1 P1（存活核 pgrep 自匹配）、C1-2 P2、C1-3~7 P3 | 三批 PASS 后派 | `review.workflow-final.code-round1.review-round-1.md`（`d0bbde7`） |
| rlt18-wf-code1-r2（reviewer#code-round1-r2） | 整改 `41c29ed` | PASS：C1-1/C1-2 闭合，新增 P3 C2-1 | 整改 1 后派 | `review.workflow-final.code-round1.review-round-2.md`（`9bb956e`） |
| rlt18-ud3-code1-r1（reviewer#code-round1-ud3） | UD-3 U1（`2c1dc47` RED / `638b9e6` GREEN） | PASS：无 open P0/P1，P3×3（U3-C1-1~3） | U1 GREEN 后派 | `review.workflow-final.code-round1.ud3.review-round-1.md`（`3219ab4`） |

**第二轮·换人复核（code-round2）**

| 复核者 | 范围 | 核第一轮结论 + 新发现 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|---|
| rlt18-wf-code2-r1（reviewer#code-round2-r1，未参与施工与 code-round1） | `origin/master...HEAD`（基线 `5ab3bba`，HEAD `691d7d1`） | 采信 code-round1 闭合；新增 P2×1（herdr stdout locale 解码）、P3×5 | PASS | code-round1 闭合后四路并发派 | `review.workflow-final.code-round2.review-round-1.md` |
| rlt18-ud3-code2-r1（reviewer#code-round2-ud3-r1） | UD-3 全差异 | 测试有效性第二视角 + 变异实证 Mut-A~E；新增 P3×3（U3-C2-1~3） | PASS | U2 整改 `401defb` 后派 | `review.workflow-final.code-round2.ud3.review-round-1.md`（`8e8de70`） |

**有效单测·变异点登记**

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|
| `relay_log.py:3709` 编排级 monitor 在位判定 | `launches > int(own)` → `>=` | 在场者推导 / 线程退出 | `test_a83_14`、`test_a83_15` | 工作区临时改动 + 单测，跑后 `git checkout` 还原 | e2-reviewer#2（rlt18-e2-review2，fresh） | 双双 FAIL（failures=2）；还原后全绿（`review.e2-code-review.attempt-2.md`） |
| `relay_log.py:3703` launch 计数 stage 匹配 | `stage_id ==` → `!=` | 在场者推导 | `test_a83_14` | 同上 | e2-reviewer#2 | a83_14 FAIL（monitor#1/#2 并存） |
| `adapter-codex.md` watcher 片段 | `timeout_ms=660000` → `600000` | adapter 合同 | `test_r_u3_2`、`test_watch_subcommand_documented` | 同上 | reviewer#code-round2-ud3-r1 | 两项 FAIL（Mut-B）；另 Mut-A/C/D/E 未捕已登记为 P3 U3-C2-1~3 |

**E2 `code_review` 层（dev-harness；与 workflow-final 分开取证）**

| attempt | kind | review_round | remediation_count | reviewer_session_id | baseline/target/diff | findings | 结论 / signal |
|---:|---|---:|---:|---|---|---|---|
| 1 | full | 1 | 0 | rlt18-e2-review（e2-reviewer#1，fresh） | `5ab3bba` → wt/RLT_18（五路全 PASS 时点） | P0/P1=0；P2×2（测试有效性）、P3×3 | PASS（`75ace71`）/ `DONE.e2-code-review.attempt-1.md` |
| — | 整改 | — | 1 | coder#e2fix | `ae4f93c`（只改 test_relay_log.py） | P2-1/P2-2 | READY / `DONE.e2-code-review.coder-remediation-1.md` |
| 2 | targeted（P2 整改复核） | 2 | 1 | rlt18-e2-review2（fresh；attempt 1 会话已按 PASS 清理，改派新会话，见 execution_strategy） | `ae4f93c` | P2-1/P2-2 闭合 | PASS（`5e3174e`）/ `DONE.e2-code-review.attempt-2.md` |
| 1（UD-3） | full | 1 | 0 | rlt18-ud3-e2（e2-reviewer#ud3-1，fresh） | UD-3 全差异 | P0/P1=0；P3×3（Windows 存活核写法、pgrep 模式未转义、手敲循环 sleep 窗漏检一轮） | PASS（`abea4bb`）/ `DONE.e2-code-review.ud3.attempt-1.md` |

**返工收敛**

| 路 | 轮次 | open P0/P1 数 | 处理 / 重跑证据 | 是否收敛 |
|---|---|---|---|---|
| code-round1 | 1→2 | 1（C1-1） | 整改 `41c29ed`（pgrep -af + 排己）→ r2 PASS `9bb956e` | 是 |
| consistency | 1→2 | 1（CS-1） | 整改 `4c3eef5`（SKILL.md:347）→ r2 PASS `6d9f98f` | 是 |
| requirement | 1→2 | 0（RQ-1 P2 恢复半段缺口） | RQ-1 复演 `8942b27` → r2 PASS `022152e` | 是 |
| requirement · ud3 | 1→2 | 1（RQ-U3-1） | U2 整改 1 `401defb`（只改 H12.md 文字）→ r2 PASS `8e8de70` | 是 |
| E2 | 1→2 | 0（P2×2） | `ae4f93c` → attempt 2 PASS `5e3174e` | 是 |

**需求复核结论**：派出=code-round1 闭合后四路并发派（r1）、RQ-1 复演后派（r2）、U2 DONE 后派（ud3 r1）、U2 整改 `401defb` 后派（ud3 r2），见 execution_strategy.md｜rlt18-wf-requirement-r1 → PASS（无 open P0/P1；RQ-1 P2 恢复半段缺口）；rlt18-wf-requirement-r2 → PASS（RQ-1 由复演闭合，`022152e`）；rlt18-ud3-req-r1 → FAIL（RQ-U3-1 P1、P2×2、P3×4，`fd95815`）；rlt18-ud3-req-r2 → **PASS**（RQ-U3-1~7 闭合，证据可支撑 H12 v2 人判，`8e8de70`）｜`review.workflow-final.requirement.*.md`

**教训复核结论**：派出=code-round1 闭合后四路并发派（r1）、U2 整改 `401defb` 后四路并发派（ud3 r1），见 execution_strategy.md｜rlt18-wf-lesson-r1 → PASS；rlt18-ud3-lesson-r1 → PASS（「后台进程回收」复发一次已登记）｜`review.workflow-final.lesson.review-round-1.md`、`review.workflow-final.lesson.ud3.review-round-1.md`；候选落 `lesson_candidates.md`

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=RLT_18 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| watch 合同与 watcher 表述 | design/01 ↔ SKILL.md ↔ adapter-claude-code.md ↔ adapter-codex.md ↔ test_relay_log.py | r1 不一致（CS-1 P1：SKILL.md:347「120 秒空闲上报」无依据）；整改后一致；UD-3 四方一致 | r1 FAIL → 整改 `4c3eef5` → r2 **PASS**（`6d9f98f`）；UD-3 r1 **PASS**（P2×2 为已登记工作区口径，F-013 tab/pane 漂移另登 backlog） | rlt18-wf-consistency-r1 / -r2、rlt18-ud3-cons-r1；`review.workflow-final.consistency.*.md` |

---

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：heavy 五路（code-round1 / code-round2 / requirement / consistency / lesson）在原批与 UD-3 两轮均收敛为 PASS；E2 两次 full 审均无 open P0/P1，P2 已整改复核闭合；有效变异点由 fresh 复核实例施加并转红。最弱处：① H11/H12 为探针实测，覆盖组合有限（H12 两组合未测，已由用户知悉）；② F-008 第二条通知来源仍「待复核」（P2，进程内重发路径已闭合，其余候选悬置）；③ Windows 两副本与 A125 未做（F-002）。

**回归**：`PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`（`tools/relay-light/` 下）→ `Ran 274 tests … OK`；`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` → `RELAY ALL PASS (SKIPPED: 1)`（`evidence/ud3-h12/raw/cleanup-verify.txt`；E2 UD-3 复核者独立复跑一致）。

**TDD 结论**：各批 RED→GREEN 证据齐（`evidence/batch-1|2/red.txt`/`green.txt`、`evidence/ud3-u1/red.txt`/`green.txt`、`evidence/e2-remediation-1/red.txt`）；E2 整改为先红后绿。

**设计契约传导声明**：实现对齐晋级后 design/01（RLT-A-14）与 DevPlan RLT-B-10 口径；`relay_log.py` UD-3 零改动；SKILL.md 只改 UD-2/UD-3 允许两处。未做：Windows 两副本同步、A125 终局回归（F-002 挂起）。

**需求对齐证据**

| 需求 / 人验项 | 场景操作路径 | 证据 ID | 结论 |
|---|---|---|---|
| A82 watch 通知/重挂/去重 | 打桩 herdr 驱动 `run_watch`，逐条 R-A82 用例 | E-101~（progress 证据账本）；`check.batch-1.md` | 满足（机器证） |
| A83 两层退出 + 编排级 monitor 在场 | 打桩 fixture 账本触发 node_close/stage_close、monitor_launch/restart | `check.batch-2.md`；`test_a83_*` | 满足（机器证） |
| A101 只通知不写账 | 静态闭包 + 注入式 oracle + 运行期账本字节不变 | `check.batch-1.md`；`review.e2-code-review.attempt-2.md` | 满足（机器证） |
| H11 Claude 监工忙时 prompt | 真实 herdr 探针：lead 忙碌时 worker done → watch 推送 → 观察转写 | `evidence/batch-3/H11-claude.md` | 用户 2026-09-24 接受 |
| H11 Codex 监工忙时 prompt | 同上（Codex lead sleep 240 等待中） | `evidence/batch-3/H11-codex.md` | 用户 2026-09-24 接受 |
| H12 watch 死亡兜底（契约 v2） | 关阶段级 / 编排级 watch pane → watcher 巡检发现 → `watch-down` 报派活方 → 重拉；进程级见 batch 3 | `evidence/ud3-h12/H12.md`；`evidence/batch-3/H12.md` | 用户 2026-09-28 接受（附三条知悉项） |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 30 秒轮询、无立即重挂、终态退出、working 重挂、`(agent,状态)` 去重（A82） | AI | `check.batch-1.md` r2 PASS；E2 attempt 1 oracle | 是 |
| 2 | 20 分钟 tick、无 watch 前台节拍、两层退出（A83） | AI | `check.batch-2.md` PASS；`test_a83_14/15` + E2 attempt 2 | 是 |
| 3 | watch 路径无写账调用（A101） | AI | `check.batch-1.md` R-A101-1~3；E2 attempt 2 注入式 oracle | 是 |
| 4 | Claude / Codex 监工忙时 prompt 排队而非丢弃（H11） | 人 | `evidence/batch-3/H11-*.md` | 是（用户 2026-09-24 接受） |
| 5 | watch 死亡后本空间 watcher 10 分钟巡检接住（H12 v2） | 人 | `evidence/ud3-h12/H12.md` | 是（用户 2026-09-28 接受） |
| 6 | heavy 五路 + E2 无 open P0/P1；`verify(relay-light):` | AI + 人 | 本文件独立复核区；verify 待合入后打 | 部分：五路与 E2 已收敛；verify 尚未完成 |

**风险 / 未验证项**

| ID | 内容 | 性质 | 状态 |
|---|---|---|---|
| F-002（RISK-RLT18-F002） | Windows 两副本同步 + `HC-RL-A125` 终局回归无法在本机完成 | 用户 2026-09-23 前置豁免 | 挂起；用户 2026-09-28 认可带风险放行，列入 Risk-Refs |
| F-003 | `verify(relay-light):` 可能被模块级钩子拦 | 前置豁免 | 收口时如实记录，不绕过 |
| F-008 | 第二条 `coder#1 -> done` 来源未定 | P2 待复核 | 不阻塞；留 backlog |
| F-016 | watcher 启动需轻推一次 | P3 backlog | 不阻塞 |

**miner**：收口 miner（fresh subagent）产出 6 条候选（M1~M6），落 `lesson_candidates.md`「收口 miner 候选」节（模块 knowledge/ 不在允许路径），指针见 progress.md。

**材料齐没齐**：[x] 复核登记与需求对齐证据已回填；E10 放行包待用户查看确认。

**as-built**：[x] `as-built/RLT_18-实现快照.md`（用户 2026-09-28 点选补快照，允许路径已追加该一条）。

→ 当前状态：**已完成；PR #68 squash verify=`335b86640766bd133a59e4bf27a22f59404fad46`，release_mode=risk-accepted（RISK-RLT18-F002）**。

---

## 人类签名区（仅用户在对话中明确确认后由主会话填写；AI 不代签，文档勾选不算）

- [x] **H11**（Claude / Codex 监工忙时 prompt 是否被排队而非丢弃）：结论 接受——沿用 2026-09-24 人判「H11 接受，后台 watch 可以」（忙时推送未丢弃，不退回前台循环；知悉 F-008 多发方向、codex 首通 pane 不可见 RQ-2/RQ-3；原文见 `evidence/batch-3/H11-claude.md` / `H11-codex.md`）｜ 用户 2026-09-24 人判，2026-09-28 对话中回复「同意」确认沿用 ｜ 日期 2026-09-28
- [x] **H12**（契约 v2，RLT-A-14 / RLT-B-10：watch 死亡后本终端空间 watcher 的 10 分钟巡检是否兜得住，10 分钟是否可接受）：结论 接受——兜得住，10 分钟可接受（阶段级/编排级两链均单发 watch-down→核死→重拉闭环，缺席期事件经新 watch 补推只延迟不丢；阶段级实测 ≈8.8 min 未超上界；进程级死亡由重启循环 ≤7 s 接住，10 分钟巡检只兜整 pane 被关的低频场景）。知悉项：① 两 watcher 启动均需一次轻推，编排侧首个检查间隔 ≈14 min 越过 10 min，登记后续项——brief 应让 watcher 无需确认即自启节拍；② 阶段级×Codex、编排级×Claude 两组合未实测，按机制同构接受；③ E2 三条 P3（存活核仅 Linux python3 写法、pgrep 模式未转义、手敲循环 sleep 窗可漏检一轮）最坏为多报，不阻塞。证据 `evidence/ud3-h12/H12.md` ｜ 用户 2026-09-28 对话中回复「同意」主会话提出的上述结论 ｜ 日期 2026-09-28
- [x] **需求境证据**确认：确认——A82/A83/A101 机器证通过，H11/H12 人判接受（见 AI 提交区「需求对齐证据」）｜ 用户 2026-09-28 AskUserQuestion 点选「已查看证据，认可带风险放行」 ｜ 日期 2026-09-28
- [x] **verify**（`verify(relay-light):` 提交 SHA）：`335b86640766bd133a59e4bf27a22f59404fad46`（PR #68 squash 合入 master，服务端合并未触发本地钩子，F-003 未发生拦截）｜ 日期 2026-09-28
- [x] **最终验收**：**带风险放行**（release_mode=risk-accepted，Risk-Count=1，Risk-Refs=RISK-RLT18-F002：Windows 两副本同步 + A125 终局回归挂起）；授权本地收口包：push + PR（Relates to #65）+ 服务端 squash 合入 + verify + DevPlan/workspace 回填 + worktree/分支清理；另点选 as-built 补快照、合入后同步本机两份 Linux 用户级 skill 副本；排除 Windows 同步、部署 ｜ 用户 2026-09-28 AskUserQuestion 点选 ｜ 日期 2026-09-28
