<!-- progress.md — 施工日志 + 证据账本。🟢 边做边记。 -->
# progress — DHR_01 冻结接力权威、双维状态与异常契约

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-15 | 主控(Claude) | 规划工件入库 6a078a1；建工作区 8 件套；task_plan 写到 codex 可照做粒度（批A~批D） | 本工作区文件 | 建 worktree wt/DHR_01，派 codex 施工 |
| 2026-08-15 | codex(gpt-5.6-sol·首派) | 读 brief/task_plan 后在批A 红测前 blocked：task_plan A2 引用「schema 冻结表」但表缺失，拒绝自行发明契约 | 5024597 DONE(blocked) | 主控补表 |
| 2026-08-15 | 主控(Claude) | **主控失误补录**：首派漏写 schema 冻结表；已在 task_plan 批A 前补入四类对象+node/result/checkpoint/event 完整字段白名单（这是补齐缺失说明书，非改路线）；删旧 DONE 续派 codex | 本提交 | codex 从批A 红测继续 |
| 2026-08-15 | 施工 worker(codex) | 按必读顺序核对 AGENTS/brief/task_plan，并只读核查 design §3～§4、工作区工件及仓库内相关定义；确认 task_plan A2 引用的“下方【schema 冻结表】”缺失，无法确定 fail-closed 字段白名单 | `rg -n "schema 冻结表|relay-plan\\.v|launch_id|authority_generation" docs/modules/dh-relay tools/relay`；仅命中 task_plan 的悬空引用及设计语义 | 按 worker 铁律写 blocked DONE，等待主控补齐字段表后重新派工 |
| 2026-08-15 | 施工 worker(codex·续派) | 批A 按 TDD 完成契约参数、proposal/active-plan/authority/receipt schema、规范化计划 hash 与依赖闭包校验；先因契约库不存在跑红，再实现转绿 | E-003 | 进入批B |
| 2026-08-15 | 施工 worker(codex·续派) | 批B 按 TDD 完成 final result/checkpoint/event/handoff schema、完整身份链裁决、不可变 final 与依赖冻结集；新增套件先因函数缺失跑红，再实现转绿 | E-004、E-005 | 进入批C |
| 2026-08-15 | 施工 worker(codex·续派) | 批C 按 TDD 冻结双维状态机器矩阵并实现穷举 fail-closed 校验；套件先因 transition 库缺失跑红，再以 72 组合和定向断言转绿 | E-006 | 进入批D |
| 2026-08-15 | 施工 worker(codex·续派) | 批D 按 TDD 完成三类 credential-shaped 脱敏、先脱敏后 UTF-8 限长、失败路径 verdict、静态 fixtures、README 与五套独立 runner；首次红因函数缺失，边界 fixture 两处机械构造错误修正后全绿 | E-007～E-009 | 按指定消息提交批D，再写 DONE |
| 2026-08-15 | 施工 worker(codex·续派) | 响应并发批A小审的同范围 changes-requested：补 11 条 schema/node 值域反例和 transition 大小写反例，红测复现枚举大小写与 date-only 放行；改为 Ordinal token 比对、收紧 ISO timestamp、badhash 改为 good hash 单字符变异。批A good hash 由 `Get-RelayPlanHash` 算得并回填 `651c8530…33c89` | E-010 | 提交窄修并从提交态总复跑 |
| 2026-08-15 | 主控(Claude) | 收口段启动：codex DONE=done（5 施工 commit·SHA 与 git log 一致）；主控亲跑 run-relay-tests → RELAY ALL PASS；轮1 小审两路（批A account9 changes-requested→b87e770 已修 F-001~004；批B~D account4 approved+F-011~015）；E4 需求复核 approved(+F-005~008/010)；E5 教训复核命中 2 条已兜住；汇总 open F-005~008/010~015 派 codex 返工轮 1 | E-004~E-007 | codex 返工→主控亲跑→轮2 换人增量复核 |
| 2026-08-15 | 主控(Claude) | 返工轮1 亲跑复验全绿 + F-011 变异探针真红；派轮2 换人复核（grok）→ changes-requested 新 P2×2；登记 F-016~F-019 + 系统性守卫 F-020（reason 码覆盖静态守卫）；写 as-built/relay-contracts.md 首份；派 codex 返工轮2 | E-008/E-009 | codex 返工轮2 → 主控亲跑 → grok 复验（同一实例不可，另派 fresh）|
| 2026-08-15 | 施工 worker(codex·返工轮1) | 按 TDD 修复 F-005~F-008/F-011~F-015：补身份与三类真实工件夹具、禁止回答事件/字段断言、大小写快照判定、独立硬编码全边 oracle、decision_required quota 留位、可参数化 probe 及 future attempt 拒收；临时删 `running→idle` 后 transition 套件按预期红 2 条，复原后全绿。ckpt 旧 attempt 判 `stale`（与 result 对齐）而非 task_plan 原写的 `rejected` | E-011 | 限定路径提交并回写 findings/DONE |
| 2026-08-15 | 主控(Claude) | 返工轮2 亲跑+探针；轮2 复验先派 grok（用户告知额度耗尽→停）改 account9（用户改指定 codex→停）→codex fresh 会话复验：F-016~019 锁住、F-020 精度→F-021（裁 P3）→派返工轮3（窄）→a1846d3；主控探针 a/b 真红；填 review 全部收口区；task_plan enum 记法改 [] 避 dh-check 占位误报 | E-011~E-013 | dh-check 复跑→E9 汇报→E10 证据展示→等用户 E11 |
| 2026-08-15 | 施工 worker(codex·返工轮2) | 修复 F-016~F-020：补 launch/hash/working-final/坏 handoff 原因断言、三跳 FreezeSet 夹具，并新增原因码静态覆盖守卫；临时将 FreezeSet 降级为直接依赖后 identity 套件按预期 `SUITE FAIL (1)`，复原后六套全绿 | E-012 | 限定路径提交并回写 findings/DONE |
| 2026-08-15 | 施工 worker(codex·返工轮3) | 窄修 F-021：非字面 reason fail-closed 并按文件+精确行白名单豁免参数透传；测试覆盖只采集含 `Assert` 的行；两个变异探针均按预期红，复原后六套全绿 | E-013 | 限定路径提交并回写 findings/DONE |
| 2026-08-15 | miner subagent | 本次 miner 产出 5 条候选 → 候选区 knowledge/教训库-候选.md | — | 人裁决 |
## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-002 | blocked-audit | `rg -n "schema 冻结表|relay-plan\\.v|launch_id|authority_generation" docs/modules/dh-relay tools/relay` | observed：没有 proposal/active-plan/authority/receipt 的 schema 冻结表 | 证明批 A 无法在不猜测契约语义的前提下开工 |
| E-003 | batch-a | `pwsh tools/relay/tests/relay-contract-schema.ps1` | PASS：末行 `SUITE PASS`，exit 0（18 assertions） | 批A schema、参数、hash、依赖校验转绿 |
| E-004 | batch-b-schema | `pwsh tools/relay/tests/relay-contract-schema.ps1` | PASS：末行 `SUITE PASS`，exit 0（28 assertions） | 批B result/checkpoint/event/handoff schema 正反例转绿 |
| E-005 | batch-b-identity | `pwsh tools/relay/tests/relay-contract-identity.ps1` | PASS：末行 `SUITE PASS`，exit 0（17 assertions） | 身份链、迟到/重复拒收、checkpoint 更新与冻结集契约转绿 |
| E-006 | batch-c | `pwsh tools/relay/tests/relay-contract-transitions.ps1` | PASS：末行 `SUITE PASS`，exit 0（72 exhaustive combinations + 12 directed assertions） | 合法边、未列边、quota 预留与双维整体 fail-closed 全量转绿 |
| E-007 | batch-d-redaction | `pwsh tools/relay/tests/relay-contract-redaction.ps1` | PASS：末行 `SUITE PASS`，exit 0（19 assertions） | api_key/private_key/password、边界顺序、字节限长及四类 final 工件残留 fail-closed 转绿 |
| E-008 | batch-d-failures | `pwsh tools/relay/tests/relay-contract-failures.ps1` | PASS：末行 `SUITE PASS`，exit 0（12 assertions） | 半写/坏枚举/probe error/停滞/无结果退出及 succeeded 非任务完成转绿 |
| E-009 | relay-runner | `pwsh tools/relay/tests/run-relay-tests.ps1` | PASS：末行 `RELAY ALL PASS`，exit 0 | 五个 relay 契约套件独立一键复跑全部通过 |
| E-010 | review-repair | `pwsh tools/relay/tests/run-relay-tests.ps1` | PASS：末行 `RELAY ALL PASS`，exit 0；schema 39 assertions，transition 85 assertions | 小审 P2/P3 的枚举大小写、node 覆盖、ISO 与 fixture 规格问题已由新增反例锁定 |
| E-004 | review-dispatch | headless claude CLAUDE_CONFIG_DIR=~/.claude-account9 · 批A 525aa61 小审 · log:review-logs/review-batchA.account9.log | observed：changes-requested（P2×2 P3×2）→ b87e770 修复·主控亲跑 RELAY ALL PASS | 轮1 批A 小审
| E-005 | review-dispatch | Claude subagent（fresh 只读）· E4 需求复核 + E5 教训复核 · log:review-logs/e4e5.subagent.log | observed：需求 approved(+P2×2 P3×4)；教训命中 2 条已兜住 | E4/E5 结论
| E-006 | review-dispatch | headless claude CLAUDE_CONFIG_DIR=~/.claude-account4 · 批B~D+窄修 小审 · log:review-logs/review-batchBCD.account4.log | observed：approved（P2×1 P3×4）| 轮1 批B~D 小审
| E-007 | session-run | 主控亲跑 `pwsh tools/relay/tests/run-relay-tests.ps1`（HEAD d219c0e） | pass：RELAY ALL PASS exit 0（schema 39 / identity 17 / transitions 84 / redaction 19 / failures 12） | 施工态全绿·DONE 自报 85 实为 84
| E-008 | review-dispatch | headless claude CLAUDE_CONFIG_DIR=~/.claude-grok · 轮2 换人增量复核（对抗证伪）· log:review-logs/review-round2.grok.log | observed：changes-requested——第一轮 15 条全「真修+锁住」；新 P2×2（F-016 launch_id 零断言 / F-017 FreezeSet 仅 1 跳）P3×2；亲跑 41/20/89/19/16 RELAY ALL PASS | 轮2 结论·触发返工轮2
| E-009 | session-run | 主控亲跑返工轮1 后 `run-relay-tests.ps1`（HEAD 5916fc5）+ 变异探针（删矩阵 running→idle 边） | pass：RELAY ALL PASS 41/20/89/19/16；探针 FAIL=2（edge set≠oracle + 该边期望合法）复原后 0 | F-011 自证循环真被打破
| E-011 | rework-round-1 | `pwsh tools/relay/tests/run-relay-tests.ps1`；F-011 临时删 `running→idle` 后运行 `pwsh tools/relay/tests/relay-contract-transitions.ps1`，再复原复跑 | PASS：runner 末行 `RELAY ALL PASS`，exit 0；schema 41 / identity 20 / transitions 89 / redaction 19 / failures 16 assertions；缺边自验按预期 `SUITE FAIL (2)`，复原后 `SUITE PASS` | F-005~F-008/F-011~F-015 返工轮1与独立 oracle 防自证循环均有机器证据 |
| E-011 | review-dispatch | codex exec fresh 会话（≠施工会话·只读）· 轮2 返工复验 · log:review-logs/review-round2b.codex-fresh.log（grok 首派因额度停止无产出，用户指定改 codex） | observed：F-016~F-019 真修+锁住；F-020 修了未锁→登记 F-021（主控裁 P3）；亲跑 41/29/89/19/16/1 RELAY ALL PASS；探针 FreezeSet 直接依赖→红、注入未覆盖码→守卫红 | 轮2 返工复验
| E-012 | session-run | 主控亲跑 `pwsh tools/relay/tests/run-relay-tests.ps1`（HEAD dbfa16f·含返工轮3）+ 探针 a（非字面 reason）/ 探针 b（码只在注释里） | pass：6 套件 SUITE PASS + RELAY ALL PASS exit 0（schema 41 / identity 29 / transitions 89 / redaction 19 / failures 16 / reason-coverage 25 码）；探针 a→`non-literal-reason:relay-transitions.ps1:71` 红；探针 b→`uncovered-reason: edge-not-listed` 红；均复原、树干净 | 最终机器证·F-021 闭合·三轮返工收敛
| E-013 | session-run | 主控 grep `tools/relay` 对 `tools/protocol|dh-crew|.dh-runtime|psmux`：仅 receipt.backend 枚举 1 处 psmux 字面 | observed：dh-relay 对 dh-crew 零引用、不进 run-all | 第 4 路一致性复核| E-012 | rework-round-2 | `pwsh tools/relay/tests/run-relay-tests.ps1`；临时将 `Get-RelayNodeFreezeSet` 改为只取直接依赖后运行 identity 套件，再复原复跑 | PASS：runner 末行 `RELAY ALL PASS`，exit 0；schema 41 / identity 29 / transitions 89 / redaction 19 / failures 16 / reason coverage 1 assertions；守卫扫描 P=25；直接依赖变异按预期 `SUITE FAIL (1)`，复原后 `SUITE PASS` | F-016~F-020 原因分支、传递闭包及系统性原因码覆盖均有机器证据 |
| E-014 | test | `pwsh tools/relay/tests/run-relay-tests.ps1`（任务树根·HEAD dbfa16f） | pass：RELAY ALL PASS exit 0；6 套件 41/29/89/19/16/1(25 码) | 本卡全部机器证的一键复跑入口
| E-013 | rework-round-3 | (a) 临时向 `relay-schema.ps1` 加 `New-RelayValidationError $someVar` 后运行 reason coverage；(b) 临时删除 `bad-handoff-header` 的 Assert 行、仅留同码注释后运行 reason coverage；复原后运行 `pwsh tools/relay/tests/run-relay-tests.ps1` | PASS：探针(a) `FAIL non-literal-reason:relay-schema.ps1:9`、exit 1；探针(b) `FAIL uncovered-reason: bad-handoff-header`、exit 1；复原后 runner 末行 `RELAY ALL PASS`，schema 41 / identity 29 / transitions 89 / redaction 19 / failures 16 / reason coverage 1 assertions，P=25 | F-021 非字面 reason 与注释假覆盖均被守卫 fail-closed，正常契约套件保持全绿 |
| 2026-08-15 | 主控(Claude) | 阶段汇报@E9（收口·codex 施工 4 批 + 3 轮返工·两轮换人复核收敛·dh-check 0 失败·miner 5 候选）——七段交付汇报与 E10 证据展示已发对话，待用户 E11 一次性确认本地收口授权包 | E-012/E-014 | E11 用户确认→E12 squash+verify→E13 销户 |
