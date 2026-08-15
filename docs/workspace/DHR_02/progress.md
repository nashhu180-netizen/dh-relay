<!-- progress.md — 施工日志 + 证据账本。🟢 边做边记。 -->
# progress — DHR_02 实现最小 Runner 与确定性 fake replay

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-15 | 主控(Claude) | 用户"开"授权 DHR_02 开工；主控 Code Scout（读 design/01 §3～§4、as-built、contracts 源码与 DHR_01 夹具）后建工作区 8 件套，task_plan 写到 codex 可照做粒度（批A~批D + K-1～K-10 决策 + 数据形状）；DevPlan 回填进行中 | 本工作区文件 + 落户 commit | 建 worktree wt/DHR_02，派 codex 施工 |
| 2026-08-15 | worker(Codex) | 批A 按 TDD 完成 store、CAS 晋级、authority/receipt、fake adapter 骨架；静态计划夹具以 `Get-RelayPlanHash`（移除 plan_hash 后规范化 JSON + SHA256）回填 6 个 hash | E-002；authority 31 断言 + DHR_01 六套件全绿 | 提交批A，进入批B红灯 |
| 2026-08-15 | worker(Codex) | 批B 按 TDD 完成 tick/host observation、result/checkpoint 摄入、decision 依赖冻结与 9 类异常 fail-closed；blocked final 在 stop 后仅保留精确 session 回收探测至 exited | E-003；ingest 36 + failures 50 断言，批A与 DHR_01 回归全绿 | 提交批B，进入批C红灯 |
| 2026-08-15 | worker(Codex) | 批C 按 TDD 完成逐 tick 确定性 replay driver；blocked→replan→B→fresh A 与 decision→冻结/并行继续→同 session 后续两条回放转绿，事件签名已落 review-logs | E-004；blocked 18 + decision 23 断言，DHR_01 六套件全绿 | 提交批C，进入批D守卫与清单收尾 |
| 2026-08-15 | worker(Codex) | 批D 扩围 reason 守卫到 3 个生产目录、补齐实际拒收断言、将五个 Runner 套件加入总清单并完成 README；全量串跑曾复现 Windows 原子 Move 瞬时锁竞争，保持 `.tmp`+Move 语义并加 10×10ms 有界重试后稳定全绿 | E-005；47 原因码覆盖，11 套件 `RELAY ALL PASS` | 提交批D，执行提交后最终复跑并写 DONE |
| 2026-08-15 | 主控(Claude) | codex DONE=done（4 commit 9babae0/7789e9d/6a3d368/55819a0·SHA 与 git log 一致）；主控亲跑 run-relay-tests 11 套件 RELAY ALL PASS；通读 relay-runner.ps1 + failures 套件；5 处变异探针全部真红后复原；派轮1 全面复核 account4/glm-5.2 headless + E4/E5 subagent | E-002/E-003 | 轮1 结论→返工（如有）→轮2 换人（account9）|
| 2026-08-15 | 主控(Claude) | 轮1 两路回收：account4 headless approved（P2×1 F-011 + P3×2 F-012/F-009 重合）；E4/E5 subagent approved（P2×3 F-003~F-005 + P3×5）；登记 F-003~F-012；写 rework-round1.md 派 codex 返工轮1（P2 必修 + P3 顺带） | E-004/E-005 | codex 返工→主控亲跑+探针→轮2 换人 account9 |
| 2026-08-15 | worker(Codex) | 返工轮1按 F-003～F-012 补齐已交棒观测只记账、replan 谓词、拒收子码、确定时钟、回放全等、顺序与 stop 失败留痕，并加入对应回归夹具 | E-006 | 写 DONE 后结束 |
| 2026-08-15 | 主控(Claude) | 返工轮1 回收：39425b2·亲跑 11 套件 RELAY ALL PASS（authority 53/ingest 42/failures 62·48 码）；探针 A（删 final_committed 只记账守卫）→failures FAIL 5、B（删 replan role 谓词）→authority FAIL 5、C（删 proposal schema 检查）→authority FAIL 1、D（改名 wrong-run 子码）→守卫仍 PASS→登记 F-013 P3；派轮2 换人 account9/deepseek | E-006 | 轮2 结论→（返工轮2）→E9/E10 |
| 2026-08-15 | 主控(Claude) | 轮2 换人回收：account9 changes-requested——F-003 残余（旧 depends_on 被删分支未锁）+ 新 P1 F-014 空文件抛异常 + P2 F-015 部分写 + F-016（主控裁 P3）+ P3 F-017/F-018；写 rework-round2.md 派 codex 返工轮2 | E-007 | codex 返工轮2→主控亲跑+探针→fresh 会话复验→E9/E10 |
| 2026-08-15 | worker(Codex) | 返工轮2按 F-003 残余与 F-013～F-018 完成非对象 JSON fail-closed、state 校验前置、proposal 候选副本校验、reason 守卫触发、state→event 顺序统一、依赖 waiting 与 fake stop 回归锁定 | E-008 | 写 DONE 后结束 |
| 2026-08-15 | 主控(Claude) | 返工轮2 回收：ffbaf92（DONE 自报 5b6ceb9 笔误→F-019）；亲跑 11 套件 RELAY ALL PASS（authority 59/ingest 45/failures 65·55 码）；探针 P1（删 json-not-object 守卫）→ingest 崩溃 exit 1（原 null 异常复现）、P2（删旧依赖被删检查）→authority FAIL 1、P3（删 state 前置校验）→authority 崩溃 exit 1（原部分写复现）、P4（改名子码）→守卫 `uncovered-reason: proposal-rejected:wrong-run-zzz` 红；均复原；派 fresh 会话（account9 新实例）复验 | E-008 | 复验 approved→E9/E10 |
| 2026-08-15 | 主控(Claude) | 轮2b fresh 复验 approved（F-014~F-018 全真修+锁住·5 探针红·N-01 偶发归因编排并发→F-020）；填 review 全部收口区、findings SHA 纠正、as-built relay-runner.md 首份 + relay-contracts 补参数；主控终跑 E-010；dh-check → E9 七段汇报 + E10 证据展示 → 等用户 E11 | E-009/E-010 | E11 用户确认→E12 squash+verify→E13 销户 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | test | `pwsh tools/relay/tests/run-relay-tests.ps1`（master b991b72·开工前主控亲跑） | pass：6 套件 SUITE PASS + `RELAY ALL PASS` exit 0 | DHR_01 基线全绿，本卡不得回归 |
| E-002 | test | `pwsh tools/relay/tests/relay-runner-authority.ps1`; `pwsh tools/relay/tests/run-relay-tests.ps1` | pass：authority `ASSERTIONS 31` / `SUITE PASS`；既有 6 套件 `RELAY ALL PASS`，均 exit 0 | 批A A1/A2 地基、receipt 先于 spawn、CAS 拒收与 DHR_01 无回归 |
| E-003 | test | `pwsh tools/relay/tests/relay-runner-ingest.ps1`; `pwsh tools/relay/tests/relay-runner-failures.ps1`; `pwsh tools/relay/tests/run-relay-tests.ps1` | pass：ingest `ASSERTIONS 36`、failures `ASSERTIONS 50`、既有 6 套件 `RELAY ALL PASS`；均 exit 0 | 批B A2/A5/A6、K-4/K-5/K-6/K-7/K-9/K-10 与 DHR_01 无回归 |
| E-004 | test | `pwsh tools/relay/tests/relay-runner-replay-blocked.ps1`; `pwsh tools/relay/tests/relay-runner-replay-decision.ps1`; `review-logs/replay-signatures.txt`; `pwsh tools/relay/tests/run-relay-tests.ps1` | pass：blocked `ASSERTIONS 18`、decision `ASSERTIONS 23`、两条精确签名落盘、既有 6 套件 `RELAY ALL PASS`；均 exit 0 | 批C A3/A4、迟到结果字节不变、decision 无输入/resume 路径与 DHR_01 无回归 |
| E-005 | test | `pwsh tools/relay/tests/relay-contract-reason-coverage.ps1`; `pwsh tools/relay/tests/run-relay-tests.ps1` | pass：生产原因码覆盖 `47`；11 套件全部 `SUITE PASS`，末行 `RELAY ALL PASS`，exit 0 | 批D 守卫扩围、清单完整、四批总回归全绿 |
| E-002 | session-run | 主控亲跑 `pwsh tools/relay/tests/run-relay-tests.ps1`（wt/DHR_02 HEAD 55819a0） | pass：11 套件 SUITE PASS + `RELAY ALL PASS` exit 0（368 PASS 行；contract 41/29/89/19/16 · runner authority 42/ingest 40/failures 50/replay-blocked 18/replay-decision 23 · reason 守卫 47 码） | 施工态全绿·DONE 自报与亲跑一致 |
| E-003 | session-run | 主控 5 处变异探针（均复原·`git status --short tools/` 干净）：P1 删 frozen_by 写入→decision 套件 FAIL 2；P2 删 CAS 比对→authority 套件 FAIL 2；P3 不写 receipt 文件→authority 套件读 receipt 抛错（红）；P4 删 blocked 后 adapter.stop→ingest 套件 FAIL 2；P5 心跳刷新 last_progress_at→failures 套件 FAIL 4（停滞永不触发） | observed：5/5 探针对应断言真红 | 断言真有牙（K-3/K-4/K-10/CAS/回收顺序） |
| E-004 | review-dispatch | headless claude CLAUDE_CONFIG_DIR=~/.claude-account4 · 轮1 全面复核（11 角度+5 探针）· log:review-logs/review-round1.account4.md | observed：approved（P2×1 P3×2·探针 4/5 真红·1 不红升 P2 F-011） | 轮1 结论 |
| E-005 | review-dispatch | Claude subagent（fresh 只读）· E4 需求复核 + E5 教训复核 · log:review-logs/e4e5.subagent.log | observed：需求 approved(+P2×3 P3×5)；教训部分命中 L-002 类；亲跑 11 套件全绿与 DONE 一致 | E4/E5 结论 |
| E-006 | test | `pwsh tools/relay/tests/run-relay-tests.ps1`（返工轮1） | pass：11 套件 `SUITE PASS` + `RELAY ALL PASS` exit 0；Runner authority 53 / ingest 42 / failures 62 / replay-blocked 18 / replay-decision 23；reason 守卫 48 码 | F-003～F-012 均有实现与回归证据 |
| E-006 | session-run | 主控亲跑返工轮1 后 `pwsh tools/relay/tests/run-relay-tests.ps1`（HEAD 39425b2）+ 探针 A/B/C/D（均复原·树干净） | pass：11 套件 SUITE PASS + RELAY ALL PASS；探针 A/B/C 真红（5/5/1）、D 不红（守卫盲区→F-013） | F-003~F-012 返工有机器证据；守卫残余登记 |
| E-007 | review-dispatch | headless claude CLAUDE_CONFIG_DIR=~/.claude-account9 · 轮2 换人增量复核（核轮1 12 条 + 9 新角度对抗）· log:review-logs/review-round2.account9.md | observed：changes-requested（F-003 修了未锁 / 新 P1 F-014 / P2 F-015、F-016 / P3 F-017、F-018；确定性、重开等价、越界均过；亲跑 393 PASS） | 轮2 结论·触发返工轮2 |
| E-008 | test | `pwsh tools/relay/tests/run-relay-tests.ps1`（返工轮2）；reason 守卫 `wrong-run→wrong-run-zzz` 临时变异后复原 | pass：11 套件 `SUITE PASS` + `RELAY ALL PASS` exit 0；Runner authority 59 / ingest 45 / failures 65 / replay-blocked 18 / replay-decision 23；reason 守卫 55 码；变异守卫按预期红 `uncovered-reason` | F-003 残余与 F-013～F-018 均有实现、回归及守卫证据 |
| E-008 | session-run | 主控亲跑返工轮2 后 `pwsh tools/relay/tests/run-relay-tests.ps1`（HEAD ffbaf92）+ 探针 P1~P4（均复原·树干净） | pass：11 套件 SUITE PASS + RELAY ALL PASS（59/45/65/18/23·55 码）；探针 4/4 真红 | F-014/F-015/F-003 残余/F-013 返工有机器证据 |
| E-009 | review-dispatch | headless claude CLAUDE_CONFIG_DIR=~/.claude-account9（**新实例·会话≠轮2**）· 轮2 返工复验 · log:review-logs/review-round2b.fresh.md | observed：approved——F-014~F-018 七项真修+锁住（P2B-01~04 探针红后复原）；N-01 偶发首跑崩溃 1/40+ 未复现（主控归因并发探针·F-020）；亲跑 6 次（第 2~6 次 RELAY ALL PASS 59/45/65/18/23·55 码）+ ingest 15 连跑全绿 | 轮2 返工复验·0 open P0/P1 |
| E-010 | test | 主控终跑 `pwsh tools/relay/tests/run-relay-tests.ps1`（任务树根·HEAD ffbaf92·tools/ 干净） | pass：11 套件 SUITE PASS + `RELAY ALL PASS` exit 0；405 PASS 行 / 0 FAIL；contract 41/29/89/19/16 · runner authority 59 / ingest 45 / failures 65 / replay-blocked 18 / replay-decision 23 · reason 守卫 55 码；replay-signatures.txt 24 行（两回放各 11 行签名） | 本卡全部机器证的一键复跑入口 |
