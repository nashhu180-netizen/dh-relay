<!-- dh:v1 -->
# progress — RLT_08

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-13 | W builder (`rlt08-build`) | 读取 AGENTS、DevPlan RLT_08/交付物矩阵、design/01 指定段落与四条 oracle、skill/双 adapter 及 RLT_07 格式；建立 RLT_08 七件套，冻结 B1–B3 红→绿与 audit 输入 | Issue #14；worktree `wt/RLT_08`；master `851433c`；`git rebase --autostash master` = up to date；A34 design/adapter 标头同构；本工作区七文件 | 发 `W_READY`；等 orchestrator 派 W audit，不进入施工 |
| 2026-09-13 | W2 builder (`rlt08-build`) | 按 `review.plan.md` 闭合 P1-1/P1-2/P1-3 与 P2-1/P2-2：改为 B3 audit PASS 后再派 CONSTRUCTION_DONE；限定阅读矩阵且唯一命中；增 dev-harness 三摘要基线/复比；adapter 整行双文件断言；四集合 allowed-paths 总检 | commit `1d77159`；Bash 代码块 `bash -n` 通过；`git diff --check` 通过；提交仅 brief/task_plan/execution_strategy | 发 `W_READY`；等 orchestrator 重派 W plan-review |
| 2026-09-13 | C batch-1 (`rlt08-exec`) | B1 双模块身份：项目概况改两个现役模块、落点/slug 新增 relay-light 行（slug/文档根/代码根/英文 verify scope）、`dh` 命令新增 `dh relay-light` 并改须显式指定；动笔前冻结 dev-harness 基线三摘要（HEAD `00c035c`，tracked/untracked 均为空哈希）；登记 F-1（L86「只有 relay 一份代码」陈旧，未顺手改）、F-2/LC-1（本环境 rg 缺失，已装 `~/.local/bin/rg`） | rebase=up to date；E-001（RED）· E-002（baseline）· E-003（GREEN）· E-004（scope）；commit `e4c8592` | 发 `READY_FOR_REVIEW`；交 audit 小审 B1 |
| 2026-09-13 | C batch-1 补记账 (`rlt08-exec`) | 按 `check.C1.md` 可整改项补登 B1 证据：新增「证据账本」节，E-001～E-004 分别登记 RED / dev-harness baseline / GREEN / 四集合 scope，含命令、关键输出与退出码并关联 `e4c8592`；不改 `AGENTS.md`、不改写历史信号 | E-001～E-004；`check.C1.md` | 发更正 `READY_FOR_REVIEW`（evidence 只引 E-ID + commit）；交 audit 重审 B1 |

## 施工批次状态（预填，不代表已执行）

| Batch | 功能单元 | 红 | 绿 | 小审 | 状态 |
|---|---|---|---|---|---|
| 1 | 双模块身份 + `dh` 入口 | E-001（旧句命中 L12/L95，新身份 0/5） | E-003（旧句零命中，新身份 5/5，diff --check=0） | R1 FAIL=`check.C1.md`（仅 E-ID 登记缺失，施工/边界/红绿均 PASS）；已补记待重审 | READY_FOR_REVIEW |
| 2 | relay-light 编排协议 + Runner 冻结分流 + B-adjust 窄例外 | 待执行 | 待执行 | 待执行 | 未开始 |
| 3 | skill 阅读索引 + 整卡机检 + `dh relay-light` 解析证据 | 待执行 | 待执行 | 待执行 | 未开始 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令/路径 | 结果 | 支撑结论 |
|---|---|---|---|---|
| E-001 | B1 RED（改前行为，`e4c8592^` 时态） | `rg -n` 旧单模块三变体正则（`本仓只有一个模块`、`只有这一个模块`、`本仓只有一个模块，自动选中`）作用于改前 `AGENTS.md`；另五条 `rg -n -F` 逐模式：`` `slug=`relay-light` `` ``、`docs/modules/relay-light/`、`tools/relay-light/`、`` `verify scope = `relay-light` `` ``、`` `` `dh relay-light` `` `` | 旧单模块句命中 2 行（L12、L95，rc=0）；五项新身份全部零命中（各 rc=1） | 有效红：旧描述在场、新身份缺席；红锚点是文本断言非环境错误（`rg` 缺失首轮已排除，见 F-2） |
| E-002 | dev-harness baseline（动笔前冻结，HC-RL-A33 前置） | `git -C /home/nash/work/dev-harness rev-parse HEAD` → `evidence/dev-harness-baseline/head.txt`；`git -C … diff --binary HEAD` 经 `sha256sum` → `tracked.sha256`；`git -C … ls-files --others --exclude-standard -z` 经 `sha256sum` → `untracked-paths.sha256` | head=`00c035c6ba5115e9924ec9c7c3e5aed706cf1e3d`；tracked 与 untracked 均=`e3b0c442…b855`（空输入 sha256，即 tracked diff 与 untracked 集合当时皆为空）；三文件各恰 1 行 | A33 前半成立：基线三摘要动笔前生成、随 `e4c8592` 提交；终态 `cmp` 属 B3，不在本批冒充 |
| E-003 | B1 GREEN（改后行为，commit `e4c8592`） | 同 E-001 六条 `rg` 作用于改后 `AGENTS.md`；`git diff --check` | 旧单模块正则 rc=1 零命中；五项新身份各 rc=0：`` `slug=`relay-light` `` `` 与 `docs/modules/relay-light/` 命中 L12/L88、`tools/relay-light/` 与 `` `verify scope = `relay-light` `` `` 命中 L88、`` `` `dh relay-light` `` `` 命中 L96；`git diff --check` rc=0 | A29 文档面绿：旧句零命中、五项身份全命中、无空白错 |
| E-004 | 四集合 allowed-paths 闭集（关联 commit `e4c8592`） | `git diff --name-only master...HEAD`（committed）· `git diff --name-only`（working tree）· `git diff --cached --name-only`（index）· `git ls-files --others --exclude-standard`（untracked）；逐集合按 `AGENTS.md` 或 `docs/modules/relay-light/workspace/RLT_08/` 前缀反选 | 施工时点：committed=15 文件全在 RLT_08 workspace、working tree=`AGENTS.md`、index=空、untracked=3 份 baseline；`e4c8592` 落账后复跑：committed=20 仍全在界内、其余三集合空；四集合零越界 | 允许路径闭集成立：B1 已提交历史、工作树、暂存、未跟踪四集合均只含 `AGENTS.md` 与 RLT_08 workspace |

## 信号
DONE task=RLT_08 role=builder batch=W status=W_READY evidence=brief.md,task_plan.md,execution_strategy.md,progress.md,findings.md,lesson_candidates.md,review.md,commit=f790a1d next=orchestrator
DONE task=RLT_08 role=audit batch=W status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_08 role=builder batch=W2 status=W_READY evidence=commit=1d77159 next=orchestrator
DONE task=RLT_08 role=audit batch=W2 status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_08 role=audit batch=W3 status=PASS evidence=review.plan.md next=orchestrator
DONE task=RLT_08 role=exec batch=1 status=READY_FOR_REVIEW evidence=red:old2hit+new0of5,green:old0hit+new5of5,baseline:dev-harness-baseline,scope:4set-ok,commit=e4c8592 next=orchestrator
DONE task=RLT_08 role=audit batch=1 status=FAIL evidence=check.C1.md next=orchestrator
DONE task=RLT_08 role=exec batch=1 status=READY_FOR_REVIEW evidence=E-001,E-002,E-003,E-004,commit=e4c8592 next=orchestrator
