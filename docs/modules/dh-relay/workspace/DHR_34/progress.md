<!-- dh:v1 -->
# DHR_34 · Progress

## 日志

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-08-29 | 主控 | 建立 DHR_34 标准档工作区并准备独立 worktree | E-001 | Opus fresh 开工预审 |
| 2026-08-29 | 主控 | B-23 已确认；DHR_61 已发放为前置契约卡，DHR_34 范围收紧为 D3 并保持阻塞 | E-004 | DHR_61 按 D 动作开工并验收前，DHR_34 不施工 |
| 2026-08-30 | 主控/Codex | DHR_61 已验收合入；DHR_34 rebase `master` 后解除阻塞，按 D3 边界完成 TDD 施工 | E-005~E-010 | 派发 Opus heavy Review Batch |

## 证据账本

| ID | 类型 | 命令 / 路径 | 结果 | 支撑什么结论 |
|---|---|---|---|---|
| E-001 | inspect | `git diff --check`；`docs/modules/dh-relay/workspace/DHR_34/` | pass | S0 工作区骨架已建立；不构成任一实现验收的通过证据。 |
| E-002 | inspect | `task_plan.md` 的 quota 正反样本场景预填 | observed | 需求对齐表的创建期占位；尚未执行测试或作出人验结论。 |
| E-003 | design | `design/11-P6身份与额度治理契约调整.md` + `design/evidence/20-P6身份与额度治理契约调整-交叉审核记录.md` | pass | 用户整版确认后，DHR-A-25 正式输入已原子晋级；不构成 B-adjust、任务发放或代码施工授权。 |
| E-004 | plan | `dev_plan/P6-Herdr多账号执行底座-开发方案.md` + `design/evidence/21-P6前置契约卡-B调整交叉审核记录.md` | pass | 用户确认 DHR-B-23：DHR_61 承接 D1/D2，DHR_34 仅承接 D3 且 `blocked-by:DHR_61`；不构成任一卡开工授权。 |
| E-005 | dependency | master `84eb2bf` + `45233b9`；用户明文「就当61完成好了」 | pass | DHR_61 D1/D2 前置合同已完成并解除 DHR_34 阻塞。 |
| E-006 | TDD-red | `node --test test/identity-quota.test.mjs` | 3/5，exit 1；fresh Attempt 数量 `1 != 2`，pause 前错误落 terminal Result | D3 尚未接线的预期红证据；此前夹具重复建账红已先修正，不计业务红。 |
| E-007 | targeted | `node --test test/identity-quota.test.mjs test/herdr-adapter.test.mjs test/agent-node.test.mjs` | 31/31，exit 0 | quota 双证据、Receipt 顺序选择、fresh Attempt、无 fallback pause、权限错误不切换、一跳上限及 DHR_33/61 回归通过。 |
| E-008 | full-test | `npm test` | 244/244，exit 0，duration 105386.6402 ms | 当前候选全量回归终态通过。 |
| E-009 | contracts | `npm run audit`; `node tools/validate.mjs --selftest`; `node tools/fixture-manifest.mjs`; `node tools/capability-baseline.mjs` | audit 0 违规；selftest 57/57；fixture 90；capability 19，均 exit 0 | 禁改契约与冻结基线保持一致。 |
| E-010 | hygiene | `git diff --check`; 变更路径定向凭据形态扫描 | diff 无错误；凭据形态零命中 | 未写入凭据；改动限允许实现、测试、package test 入口与 DHR_34 workspace。 |
| E-011 | review-code1 | `review-code1-opus.md` | CHANGES_REQUIRED；P0=0、P1=1、P2=4、P3=6 | 独立代码轮 1 发现二次 quota 误落 terminal、选中身份 TOCTOU、恢复/registry 负例缺口及 package 路径失序。 |
| E-012 | rectify-1 | `node --test test/identity-quota.test.mjs test/herdr-adapter.test.mjs test/agent-node.test.mjs` | 34/34，exit 0 | P1 改为二次 quota canonical pause；选中身份/registry 快照单次消费；补旧 Attempt 迟到写、registry invalid、fallback recovery、一跳 pause 与 pause 写失败反例。 |
| E-013 | review-code1-recheck | `review-code1-opus.md` §6 | APPROVED；open P0=0、P1=0；单文件 10/10 | 原 P1、4 项 P2 与 P3-5 均有代码/driver 级反例闭合；其余 P3 登记或接受。 |
| E-014 | review-batch | `review-code2-opus.md`、`review-req-opus.md`、`review-consistency-opus.md`、`review-lessons-opus.md` | code2 APPROVED；requirements/lessons 要求整改；consistency 附条件通过 | 四路独立 fresh 复核完整落盘；模型身份来源冲突，统一记“形态待证”。 |
| E-015 | mutation | `review-code2-opus.md` R2-M1 | 临时副本 baseline 10/10、mutant 8/10、restore 10/10；共享工作树 hash 不变 | 一跳与恢复权限护栏具备有效判别力。 |
| E-016 | rectify-2 | `node --test relay-core/test/identity-quota.test.mjs`; `node --test relay-core/test/attempt-identity.test.mjs relay-core/test/store.test.mjs relay-core/test/identity-quota.test.mjs` | 12/12；30/30，均 exit 0 | 删除无来源的内置产品 detector，改为显式注入；补交叉负例、未登记 detector、嵌套 fallback 不可签 pause、恢复来源差异与 stop 钩子；30/30 为 Store/Attempt 组合。 |
| E-017 | test | `npm test`（Review Batch pane 静止后） | 249/249，exit 0，duration 118996.4266 ms | 第二批整改后的无并发全量终态通过；取代并发未终态尝试。 |
| E-018 | contracts/hygiene | `npm run audit`; `validate --selftest`; fixture/capability；`git diff --check` | audit 0；57/57；90；19；diff 无错误，均 exit 0 | 合同基线、能力指纹与补丁卫生通过。 |
| E-019 | review-recheck | code2 / requirements / consistency 原 review 文件复验章节 | 三路 APPROVED，open P0/P1/P2=0；code2 定向 36/36 | 第二批实现与登记条件经原复核路径闭合；教训路径由 fresh replacement Opus 复验中。 |
| E-020 | lessons-recheck | `review-lessons-opus.md` §7（fresh replacement Opus） | APPROVED；open P0/P1=0 | 有效 mutation 与恢复判别力两项 P1 闭合；stop/platform/detector/lesson/quiet 证据同步复算。 |

- 2026-08-30 设计裁决：缺少获批真实 quota 样本时不伪造证据。D3 detector 只消费上游已脱敏结构化信号；测试中的 `HTTP 429 + usage_limit_reached` 仅为受控 synthetic detector，不是已入册产品规则。unknown detector、raw message、permission/network/普通失败不触发自动切换。
- 2026-08-30 实现裁决：自动 fallback 最多一跳；首个当前 registry、平台、projection 与 Receipt 冻结身份均匹配的候选产生 fresh Attempt。fallback 启动或执行失败直接终态，不继续链式换号。无合格候选或 registry 复核不可用则写 DHR_61 canonical pause，旧 Attempt 不先落 terminal Result。
- 2026-08-30 复查修正：恢复中的 fallback Attempt 以已签 Receipt 身份为准且不恢复自动 fallback 权限；DHR_33 旧式 Receipt 保留账上 profile 回退。首次回归因此短暂为 30/31，修正后同组 31/31，全量 244/244。
- 2026-08-30 代码轮 1 整改：采纳 P1-1，fallback 再次高置信 quota 不链第三身份，但转入 DHR_61 canonical pause/Attention 而非 terminal failed；采纳 P2-1，选中后以同一次已校验 registry snapshot 与 identity 签 fresh Attempt，消除二次加载/冻结 TOCTOU。P2-2/P2-3 已补 driver 级恢复与 invalid-registry 反例；P2-4 以 F-007 明文失序补录。P3-5 同步闭合为 pause 写失败整届 fail-closed。
- 2026-08-30 Review Batch 整改：P6-M4 裁为 `constrained`；生产 judge/detector/真实样本可达性与 retry fresh Attempt 无驱动者移交 DHR_35。实现不再内置无样本来源的产品 detector；候选的嵌套 fallback 也须预先可冻结，否则 canonical pause。恢复反例将 event detail 故意设为 source、Receipt 设为 backup，确保 Receipt 权威断言有判别力。
- 2026-08-30 全量并发尝试：四路 Review Batch 活跃时出现 Herdr timing/锁争用并有一次长时间未得终态后中止；该次不计绿色证据。quiet 终态另行登记。
- 当前节点：第二批整改、Store/Attempt 定向 30/30、Herdr/agent 定向 36/36、quiet 全量 249/249 与合同闸均完成；heavy 五路复核及全部复验 open P0/P1=0。技术候选待人验；尚未 verify、合并。

- 2026-08-30 E6：`dh mine dh-relay DHR_34` 已跑出只读备料；复核现有 `lesson_candidates.md` 的五条候选，未发现需新增且未与候选区重复的候选。
- 2026-08-30 E7：as-built 已更新为 `docs/modules/dh-relay/as-built/relay-core.md`，覆盖 DHR_34 的 quota 分类、受控 fallback 与 DHR_35 生产闭环边界。
- 2026-08-30 E9：七段交付汇报已生成并发出至用户对话；内容包括目标、交付、机器证据、复核、受限边界、风险账和 DHR_35 后续。
- 2026-08-30 E10：人验证据展示区已发出；用户对话明文「接受」，接受 P6-M4 constrained、本卡一跳上限与 detector 不内置未证产品规则三项。

- 2026-08-29 主控：用户明确授权「继续 DHR_34，开 worktree，复核用 opus」。主树已建立标准档 8 件套并开独立 worktree；DHR_33 squash `66dd16a` 已在 master，故技术依赖可读。DHR_32/33 的人验、verify 和 B-22 追认均未被本卡代签或关闭。
- 2026-08-29 worktree 已复核为 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\DHR_34`，branch=`wt/DHR_34`，base=`886c63a`（local `master`）；client=codex-cli。首次 `dh wt new` 误从 `origin/master` 建树且缺本卡工件，已在确认空树后移除并按 local `master` 重建。
- 2026-08-29 主控尝试进入 S1 Opus fresh 开工预审前检查：当前终端没有 Herdr 管理身份（`HERDR_ENV`、workspace/tab/pane 均未设置）。`herdr.exe` 与 `claude.ps1` 可解析，但按 `knowledge/herdr-派活操作.md` 不得从外部终端控制 pane，故未启动 Claude、未派发、未改代码或账号配置。恢复条件：在 Herdr 管理的主控 pane 中进入本 worktree，再按手册以 `pane run` 拉起 `claude --model opus` 并取实际模型身份双证。
- 2026-08-29 主控：已在 Herdr `w1:p1` 主控工作区新建 cwd 固定为本 worktree 的侧 pane，并以 `claude --model opus` 启动 fresh 只读预审实例 `opus_kickoff_dhr34_r2`（pane `w1:pQ`）。实例仅运行读取命令，worktree 的 `git status --short` 与 `git diff --check` 均无输出。启动屏显示 `Opus 5 with high effort`，但实例自报 SessionStart 为 `claude-fable-5`；两条身份来源矛盾，实际模型结论只能记为「形态待证」，本预审不得登记成「已核验 Opus」。
- 2026-08-29 主控：fresh 只读预审结论为 **BLOCKED，不派施工**。P0-1：`launch-receipt.v2` 字段闭集无 profile/account_alias/config_fingerprint/capability hash，签发点 `service.mjs` 也不在允许路径；DevPlan 要求 Receipt schema 扩展而 brief 禁改 `contracts/**`。P0-2：run-state 枚举没有 `paused`，全仓零命中，故「无 fallback → paused + Attention」按字面不可实现。待用户决定是否另开契约卡或按正式计划调整流程扩范围与状态语义；主控不得静默改 brief/task_plan 或运行时代码。
- 当前节点：S0 已完成；S1 已完成只读预审并因 P0-1/P0-2 停在 blocked。未改运行时代码、用户配置、注册表或凭据。
- 2026-08-29 用户对经 fresh 复审收敛的 DHR-A-25 整版设计明文“同意”。主控已将候选原子晋级为正式 `design/11` 并登记 A-25 审核/理解证据；尚未调整 P6 DevPlan、未发前置契约卡、未解除 DHR_34 blocked，也未改代码、用户配置、注册表或凭据。
- 2026-08-29 用户完成 B-23 理解校验（回答“不能施工”）并明文“确认”。DevPlan 发放 DHR_61 承接 design/11 D1/D2，DHR_34 改为仅承接 D3 并保持 `blocked-by:DHR_61`；本记录不授权 DHR_61/DHR_34 开工、worktree、代码、用户配置、注册表或凭据操作。
