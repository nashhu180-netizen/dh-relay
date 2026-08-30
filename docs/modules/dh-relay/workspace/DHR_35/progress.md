<!-- dh:v1 · workspace/DHR_35/progress.md -->
# progress — DHR_35

## 日志

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-08-30 | Codex | 建立 `wt/DHR_35` 并 rebase 到本地 `master`；创建标准档 8 件套与施工合同。Linux 维持 B-22 已确认延后。 | worktree HEAD=`b6a51e4`；`git status --short --branch` clean | 实现并受控验证 Windows 实录脚本。 |
| 2026-08-30 | Codex | Windows 只读预检：`HERDR_ENV=1`、DSH 未运行；Codex 与 Claude Code 均可执行。默认 Profile Registry fail-closed 为 `E_BAD_VALUE:PROFILE_REGISTRY / E_UNRESOLVED_CONFIG`，未启动 Agent、未读写凭据或账号配置。 | E-3503 | 停在真实 Attempt 签发前，等用户决定 Registry 处理边界。 |
| 2026-08-30 | Codex | 代码侦察：生产 `service.mjs` 调 `startWorkflowDriver` 未注入 `herdrJudge`；driver 在 `done` 或 `idle` 时只有 judge verdict 才写 Result，否则最终 Attention。 | E-3504 | 该 P1 修复超出本卡禁改 Runtime/Service 边界，须 B-adjust/新卡授权。 |
| 2026-08-30 | Codex | 定向组合测试未得终态（部分输出含一条并发运行时的失败，未见汇总/audit）；隔离复现 DHR61 Receipt 冻结用例 1/1 通过。 | E-3505 | 不把组合运行写为通过；保留既有 Node 进程，不作共享进程清理。 |
| 2026-08-30 | Codex | 按用户确认起草 A-full 候选：Result 必须 Receipt 绑定结构化提交，Herdr done 仅观测；草案尚未进入正式设计输入。 | E-3507 | 派 fresh 只读审核，闭合后再向用户做整版确认；不改生产代码或用户级配置。 |
| 2026-08-30 | Codex + fresh reviewer | A-full 候选经一轮 P1 整改与窄复核，P0/P1 均为 0；等待用户整版确认。 | E-3508 | 未确认前不晋升正式设计、不做 B-adjust 或施工。 |
| 2026-08-30 | Codex + fresh reviewer + 用户 | A-full 已确认并晋升 design/12；B-24 候选经 P1 整改与复审后，用户确认 B-adjust。正式 P6 计划新增 DHR_63/DHR_64，DHR_35 改为 `blocked-by:DHR_63,DHR_64`。 | E-3509 | 等待 DHR_63 或 DHR_64 的独立 D-start；本卡不再运行真实 Windows 实录。 |
| 2026-08-30 | 主控 | 用户重新授权 DHR35 至 E10；既有 `wt/DHR_35` 由 `33219fe` rebase 到 `master@1409a69`，DHR63/64/65 已验证产物可消费。Linux 保持延后。 | E-3510 | 编写隔离 Windows runner 并先跑静态红/绿防护。 |
| 2026-08-30 | 主控 | runner 红测依次捕获无 BOM JSON、临时仓 `.gitignore` 与 PowerShell stdout/stderr 收集三项；最小修复后静态防护通过。 | E-3511 | 对两个真实 Profile 做不输出配置正文的 Attempt 身份冻结预检。 |
| 2026-08-30 | 主控 | `herdr.codex.main` 的 registry 可解析，但 `freezeProfileIdentity` 在真正签发 Attempt 前拒绝 `E_NONSECRET_PROJECTION_MISSING:/profiles`；隔离 Run 仅有 `run_created/lease_acquired/operation_committed`，零 Attempt、Agent、pane 或 Result。`herdr.claude.main` 的同一冻结通过。 | E-3512、`evidence/herdr.codex.main/failed-run/` | 停在 P1：不得绕过 Codex projection；Claude 真实拉起另受 adapter 的 `agent start --kind claude` 已知 Windows shim 边界约束，二者均非本卡可改范围。 |
| 2026-08-30 | 主控 + 两轮 fresh reviewer + 用户 | B-29 已确认并正式新增 DHR66（Codex `/profiles` 非敏感投影，light）与 DHR67（Windows Claude 受支持 Herdr 启动，heavy）；DHR35 依赖改为 DHR34/63/64/65/66/67，原四卡范围不重开。 | design/evidence/27；P6 DevPlan B-29 | 等待 DHR66、DHR67 各自 D-start；本卡继续停止真实 Windows 实录。 |

## 证据账本

| ID | 类型 | 命令 / 路径 | 结果 | 支撑什么结论 |
|---|---|---|---|---|
| E-3501 | observed | `git -C .dh-worktrees/DHR_35 status --short --branch` | pass | DHR35 worktree 位于 `wt/DHR_35`，已 rebase 至当前 master。 |
| E-3502 | observed | `P6-Herdr多账号执行底座-开发方案.md:46-55,184-194,223` | observed | Linux 由 B-22 已确认延后，P6-M6 只能在阶段闸记延后/受限。 |
| E-3503 | inspect | `loadExecutorProfiles()` 仅输出 `{ok,reason,detail}`；`codex --version`、`claude --version` | fail | Herdr 当前会话与 DSH-off 预检通过，但默认 registry 返回 `E_BAD_VALUE:PROFILE_REGISTRY / E_UNRESOLVED_CONFIG`；未输出配置或凭据。 |
| E-3504 | inspect | `relay-core/runtime/service.mjs:284-287`；`relay-core/runtime/workflow-driver.mjs:33-36,253-255` | observed | service 未传 `herdrJudge`，driver 无 verdict 时不写 Result；真实产品闭环缺少受控结果桥。 |
| E-3505 | test | `node --test --test-concurrency=1 --test-name-pattern "DHR_61 D1: Herdr Attempt freezes source and ordered fallback identities before launch" test/agent-node.test.mjs` | pass (1/1) | Receipt 身份冻结定向用例可终态通过；此前组合运行未得终态，未作为绿证。 |
| E-3506 | audit | `node tools/audit-contracts.mjs` | pass | 未登记开口、厂商 token、$ref、命名与 meta-schema 违规均为 0。 |
| E-3507 | design-draft | `design/drafts/DHR-A-26-Receipt绑定结果提交与P6真实闭环-候选.md` | pending review | A-full 共创候选；非正式输入、无 planning-event、无施工授权。 |
| E-3508 | review | `design/evidence/22-Receipt绑定结果提交与P6真实闭环-交叉审核记录.md` | pass (P0/P1=0) | fresh 审核与窄复核均闭合；候选可进入用户整版确认。 |
| E-3509 | planning | `design/evidence/23-P6-Receipt结果提交与真实闭环-B调整交叉审核记录.md`；P6 DevPlan `DHR-B-24` marker | pass (P0/P1=0) | 用户 B-adjust 确认已落盘；DHR_63/DHR_64 未开工，DHR_35 被阻塞。 |
| E-3510 | setup | `git -C .dh-worktrees/DHR_35 rebase master` | pass：HEAD `1409a69`、工作区八件套仍未提交 | DHR35 从包含 DHR63/64/65 verify 的精确主干开始施工。 |
| E-3511 | test-red/test | `powershell -NoProfile -File workspace/DHR_35/scripts/test-run-windows-closure.ps1` | red：缺 runner、无 BOM、`.gitignore`、显式 stdout/stderr 收集；green：`DHR35 runner static guards: PASS` | 临时 Windows runner 的 DSH-off、Profile 白名单、无 BOM、临时根清理与敏感源禁读防护已被静态验证。 |
| E-3512 | preflight/fail-closed | `node --input-type=module` 调用 `loadExecutorProfiles` 与 `freezeProfileIdentity`；隔离 `run-windows-closure.ps1 -ProfileId herdr.codex.main` | Codex：`E_NONSECRET_PROJECTION_MISSING:/profiles`；Claude identity 仅输出 profile id 与两枚 64 长 hash 的长度即成功；Codex failed-run 事件仅 seq0~2，零 Attempt/Agent/pane/Result | DHR35 不得因 registry 可解析而猜测身份可冻结；当前 Codex 路径安全停止，未读写配置正文、凭据或账号状态。 |
| E-3513 | planning | `design/evidence/27-DHR66DHR67-P6真实闭环修复-B调整审核及确认.md`；P6 DevPlan B-29 | 用户确认后两次 fresh 定向复审 P1/P2=0；本次只落计划与 DHR35 合同 | DHR66/67 未获 D-start，尚未创建 worktree、未读写 registry、未改生产代码。 |
