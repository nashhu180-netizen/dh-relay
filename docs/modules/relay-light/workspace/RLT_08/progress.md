<!-- dh:v1 -->
# progress — RLT_08

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-13 | W builder (`rlt08-build`) | 读取 AGENTS、DevPlan RLT_08/交付物矩阵、design/01 指定段落与四条 oracle、skill/双 adapter 及 RLT_07 格式；建立 RLT_08 七件套，冻结 B1–B3 红→绿与 audit 输入 | Issue #14；worktree `wt/RLT_08`；master `851433c`；`git rebase --autostash master` = up to date；A34 design/adapter 标头同构；本工作区七文件 | 发 `W_READY`；等 orchestrator 派 W audit，不进入施工 |
| 2026-09-13 | W2 builder (`rlt08-build`) | 按 `review.plan.md` 闭合 P1-1/P1-2/P1-3 与 P2-1/P2-2：改为 B3 audit PASS 后再派 CONSTRUCTION_DONE；限定阅读矩阵且唯一命中；增 dev-harness 三摘要基线/复比；adapter 整行双文件断言；四集合 allowed-paths 总检 | commit `1d77159`；Bash 代码块 `bash -n` 通过；`git diff --check` 通过；提交仅 brief/task_plan/execution_strategy | 发 `W_READY`；等 orchestrator 重派 W plan-review |
| 2026-09-13 | C batch-1 (`rlt08-exec`) | B1 双模块身份：项目概况改两个现役模块、落点/slug 新增 relay-light 行（slug/文档根/代码根/英文 verify scope）、`dh` 命令新增 `dh relay-light` 并改须显式指定；动笔前冻结 dev-harness 基线三摘要（HEAD `00c035c`，tracked/untracked 均为空哈希）；登记 F-1（L86「只有 relay 一份代码」陈旧，未顺手改）、F-2/LC-1（本环境 rg 缺失，已装 `~/.local/bin/rg`） | rebase=up to date；E-001（RED）· E-002（baseline）· E-003（GREEN）· E-004（scope）；commit `e4c8592` | 发 `READY_FOR_REVIEW`；交 audit 小审 B1 |
| 2026-09-13 | C batch-1 补记账 (`rlt08-exec`) | 按 `check.C1.md` 可整改项补登 B1 证据：新增「证据账本」节，E-001～E-004 分别登记 RED / dev-harness baseline / GREEN / 四集合 scope，含命令、关键输出与退出码并关联 `e4c8592`；不改 `AGENTS.md`、不改写历史信号 | E-001～E-004；`check.C1.md` | 发更正 `READY_FOR_REVIEW`（evidence 只引 E-ID + commit）；交 audit 重审 B1 |
| 2026-09-13 | C batch-2 (`rlt08-exec`) | B2 relay-light 编排协议段与冻结分流：在 Runner「编排协议段」前插入并列 `## relay-light 编排协议段`（判定=adapter 标头四字段 + oracle 逐字判定句；分工=编排管阶段/监工管节点/worker 只完成当前节点、写完信号即停无 node_closed；计划例外=白名单追加有意绕过 B-adjust、只覆盖任务卡/开发方案任务行/接力计划追加、设计与验收仍走 dev-harness）；Runner 通用铁律第 2 条追加窄句「有 RELAY_RECEIPT 即冻结 Runner 流水，不交叉执行 relay-light」，原条款未删；登记 F-3（冻结句两读，取 P6 冻结标记义）、LC-2（-F 锁定句禁加反引号） | rebase=up to date；E-005（RED 四条零命中）· E-006（adapter 两首行逐字节一致）· E-007（GREEN 四条全中+diff 纯增量）· E-008（四集合闭集）；commit `59d7d22` | 发 `READY_FOR_REVIEW`；交 audit 小审 B2 |
| 2026-09-13 | C batch-3 (`rlt08-exec`) | B3 阅读矩阵索引 + 整卡机检：矩阵表尾新增一行 relay-light 索引指向仓内 `tools/relay-light/skill/SKILL.md` 与双 adapter；跑通整卡机检脚本（exit=0）；`dh relay-light` 首行命中 `=== dh-check: relay-light ===`（25 条存量失败单独登记 F-4，不冒充解析失败、不越界修）；dev-harness 三摘要与 B1 baseline 逐项 cmp 全同；登记 LC-3（`rg -c` 空命中输出为空串） | rebase=up to date；E-009（RED 矩阵 0 命中）· E-010（矩阵恰 1 行）· E-011（dh 解析证据）· E-012（baseline cmp 3/3）· E-013（整卡机检 exit=0）· E-014（四集合终态闭集）；commit `f3af14e` | 发 `READY_FOR_REVIEW`（不打 CONSTRUCTION_DONE）；交 audit 小审 B3 |

## 施工批次状态（预填，不代表已执行）

| Batch | 功能单元 | 红 | 绿 | 小审 | 状态 |
|---|---|---|---|---|---|
| 1 | 双模块身份 + `dh` 入口 | E-001（旧句命中 L12/L95，新身份 0/5） | E-003（旧句零命中，新身份 5/5，diff --check=0） | R1 FAIL=`check.C1.md`（仅 E-ID 登记缺失，施工/边界/红绿均 PASS）；已补记待重审 | READY_FOR_REVIEW |
| 2 | relay-light 编排协议 + Runner 冻结分流 + B-adjust 窄例外 | E-005（协议段/判定句/两句例外 0/4） | E-007（4/4 全中，冻结句两处命中，diff 纯增量，diff --check=0） | 待执行 | READY_FOR_REVIEW |
| 3 | skill 阅读索引 + 整卡机检 + `dh relay-light` 解析证据 | E-009（矩阵内 0 命中） | E-010（矩阵恰 1 行）+ E-013（整卡机检 exit=0）+ E-011/E-012 | 待执行 | READY_FOR_REVIEW |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令/路径 | 结果 | 支撑结论 |
|---|---|---|---|---|
| E-001 | B1 RED（改前行为，`e4c8592^` 时态） | `rg -n` 旧单模块三变体正则（`本仓只有一个模块`、`只有这一个模块`、`本仓只有一个模块，自动选中`）作用于改前 `AGENTS.md`；另五条 `rg -n -F` 逐模式：`` `slug=`relay-light` `` ``、`docs/modules/relay-light/`、`tools/relay-light/`、`` `verify scope = `relay-light` `` ``、`` `` `dh relay-light` `` `` | 旧单模块句命中 2 行（L12、L95，rc=0）；五项新身份全部零命中（各 rc=1） | 有效红：旧描述在场、新身份缺席；红锚点是文本断言非环境错误（`rg` 缺失首轮已排除，见 F-2） |
| E-002 | dev-harness baseline（动笔前冻结，HC-RL-A33 前置） | `git -C /home/nash/work/dev-harness rev-parse HEAD` → `evidence/dev-harness-baseline/head.txt`；`git -C … diff --binary HEAD` 经 `sha256sum` → `tracked.sha256`；`git -C … ls-files --others --exclude-standard -z` 经 `sha256sum` → `untracked-paths.sha256` | head=`00c035c6ba5115e9924ec9c7c3e5aed706cf1e3d`；tracked 与 untracked 均=`e3b0c442…b855`（空输入 sha256，即 tracked diff 与 untracked 集合当时皆为空）；三文件各恰 1 行 | A33 前半成立：基线三摘要动笔前生成、随 `e4c8592` 提交；终态 `cmp` 属 B3，不在本批冒充 |
| E-003 | B1 GREEN（改后行为，commit `e4c8592`） | 同 E-001 六条 `rg` 作用于改后 `AGENTS.md`；`git diff --check` | 旧单模块正则 rc=1 零命中；五项新身份各 rc=0：`` `slug=`relay-light` `` `` 与 `docs/modules/relay-light/` 命中 L12/L88、`tools/relay-light/` 与 `` `verify scope = `relay-light` `` `` 命中 L88、`` `` `dh relay-light` `` `` 命中 L96；`git diff --check` rc=0 | A29 文档面绿：旧句零命中、五项身份全命中、无空白错 |
| E-004 | 四集合 allowed-paths 闭集（关联 commit `e4c8592`） | `git diff --name-only master...HEAD`（committed）· `git diff --name-only`（working tree）· `git diff --cached --name-only`（index）· `git ls-files --others --exclude-standard`（untracked）；逐集合按 `AGENTS.md` 或 `docs/modules/relay-light/workspace/RLT_08/` 前缀反选 | 施工时点：committed=15 文件全在 RLT_08 workspace、working tree=`AGENTS.md`、index=空、untracked=3 份 baseline；`e4c8592` 落账后复跑：committed=20 仍全在界内、其余三集合空；四集合零越界 | 允许路径闭集成立：B1 已提交历史、工作树、暂存、未跟踪四集合均只含 `AGENTS.md` 与 RLT_08 workspace |
| E-005 | B2 RED（改前行为，`59d7d22^` 时态） | `rg -n -F` 逐模式四条：`` `## relay-light 编排协议段` ``、`` `见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水` ``、`` `有意绕过 B-adjust` ``、`` `设计与验收仍走 dev-harness` ``，作用于改前 `AGENTS.md` | 四条全部零命中（各 rc=1） | 有效红：协议段、判定句、两句例外文字在改前均缺席 |
| E-006 | A34 adapter 标头同构（本卡只读，不修改） | `sed -n` 取 `tools/relay-light/skill/references/adapter-*.md` 内 ```text 块第 2 行，与期望串 `` `[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>` `` 逐字节比较 | `adapter-claude-code.md` 与 `adapter-codex.md` 两文件首行均逐字节等于期望串；`adapter_count=2` | A34 的 adapter 半侧成立：恰两份 adapter、标头首行与 AGENTS 段所写样式同构 |
| E-007 | B2 GREEN（改后行为，commit `59d7d22`） | 同 E-005 四条 `rg -n -F` 作用于改后 `AGENTS.md`；`git diff --check`；`git diff --unified=20 -- AGENTS.md` | 四条各 rc=0：协议段命中 L40、判定句命中 L44、`有意绕过 B-adjust` 与 `设计与验收仍走 dev-harness` 命中 L46；`有 RELAY_RECEIPT 即冻结 Runner 流水` 命中 L44（relay-light 段）与 L57（Runner 铁律第 2 条）；`git diff --check` rc=0；unified=20 diff 显示新段为纯插入、Runner 原条款逐字保留仅第 2 条行尾追加窄句 | A28/A34 文档面绿：协议段在、判定句在、B-adjust 窄例外在、Runner 冻结边界为增量未重写 |
| E-008 | 四集合 allowed-paths 闭集（关联 commit `59d7d22`） | 同 E-004 四集合命令 | committed=20 全在界内（B1 工件+信号）、working tree=`AGENTS.md`、index=空、untracked=空；四集合零越界 | B2 边界成立 |
| E-009 | B3 RED（矩阵索引缺席，`f3af14e^` 时态） | `awk` 截取 `## 任务类型阅读矩阵` 至下一 `## ` 边界，内跑 `rg -F -c 'tools/relay-light/skill/SKILL.md'` | 命中数为空串（`rg -c` 零命中不打印，rc=1），`test -eq 1` 失败 → RED | 有效红：矩阵内索引缺失；LC-3 记 `rg -c` 空输出行为 |
| E-010 | B3 GREEN（矩阵索引，commit `f3af14e`） | 同 E-009 的 awk+`rg -F -c`；`rg -n -F` 定位 | `index_count=1`；命中矩阵内第 16 行（文件 L90）`relay-light 规划 / 编排 / 账本 / 三层执行` 行 | A33 前半成立：矩阵边界内恰 1 行、链接指向仓内唯一源 |
| E-011 | `dh relay-light` 模块解析证据 | `dh relay-light` → `/tmp/rlt08-dh-relay-light.txt` | 首行 `=== dh-check: relay-light ===`（`rg -n -F` 命中第 1 行）；进程 exit=1：dh-check 存量失败 25 条（详见 F-4，含本卡 review.md 三区/需求表与 `visual_map.md` 缺口） | A29 后半成立：slug `relay-light` 可解析出模块标头；存量失败单列不混入解析结论、本卡不修 |
| E-012 | dev-harness baseline 终态复比（HC-RL-A33 后半） | 重算 `git -C /home/nash/work/dev-harness` 的 `rev-parse HEAD` / `diff --binary HEAD` sha256 / `ls-files --others --exclude-standard -z` sha256，与 `evidence/dev-harness-baseline/` 逐项 `cmp` | head.txt / tracked.sha256 / untracked-paths.sha256 三项 `cmp` 全部一致 | 本卡全程未给 dev-harness 引入任何改动（A33 闭合） |
| E-013 | 整卡机检脚本（task_plan B3 原文） | `/tmp/rlt08-b3-fullcheck.sh` 逐字执行 task_plan「整卡机检脚本」 | 全脚本 exit=0：矩阵=1、协议段/判定句/两句例外/四项身份/旧句零命中、adapter 两首行同构、`dh` 标头命中、baseline cmp 全同、`git diff --check` rc=0、四集合零越界 | A28/A29/A33/A34 四条 oracle 的机器证一次收束 |
| E-014 | 四集合 allowed-paths 终态（`f3af14e` 落账后） | 同 E-004 四集合命令 | committed=21 全在界内（B1–B3 全部工件+信号提交）、working tree=空、index=空、untracked=空 | 整卡边界成立：分支累计变更只含 `AGENTS.md` 与 RLT_08 workspace |

## 信号
DONE task=RLT_08 role=builder batch=W status=W_READY evidence=brief.md,task_plan.md,execution_strategy.md,progress.md,findings.md,lesson_candidates.md,review.md,commit=f790a1d next=orchestrator
DONE task=RLT_08 role=audit batch=W status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_08 role=builder batch=W2 status=W_READY evidence=commit=1d77159 next=orchestrator
DONE task=RLT_08 role=audit batch=W2 status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_08 role=audit batch=W3 status=PASS evidence=review.plan.md next=orchestrator
DONE task=RLT_08 role=exec batch=1 status=READY_FOR_REVIEW evidence=red:old2hit+new0of5,green:old0hit+new5of5,baseline:dev-harness-baseline,scope:4set-ok,commit=e4c8592 next=orchestrator
DONE task=RLT_08 role=audit batch=1 status=FAIL evidence=check.C1.md next=orchestrator
DONE task=RLT_08 role=exec batch=1 status=READY_FOR_REVIEW evidence=E-001,E-002,E-003,E-004,commit=e4c8592 next=orchestrator
DONE task=RLT_08 role=audit batch=1 status=PASS evidence=check.C1.md next=orchestrator
DONE task=RLT_08 role=exec batch=2 status=READY_FOR_REVIEW evidence=E-005,E-006,E-007,E-008,commit=59d7d22 next=orchestrator
DONE task=RLT_08 role=audit batch=2 status=PASS evidence=check.C2.md next=orchestrator
DONE task=RLT_08 role=exec batch=3 status=READY_FOR_REVIEW evidence=E-009,E-010,E-011,E-012,E-013,E-014,commit=f3af14e next=orchestrator
