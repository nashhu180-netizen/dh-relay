# 主控手记 — DHR_04 stage0 自举首跑

> 本文件只由**主控**写，施工/复核棒不碰（避免与任务树里的 `progress.md` 抢同一个文件）。
> 记的是「用 relay 开发 relay」这个形态本身暴露的事，不是卡内实现问题。

## 现场坐标

| 项 | 值 |
|---|---|
| stage0 驱动器 | `D:\relay-stage0`（冻结自 `tools/relay/` @ `34df46a`，`STAGE0.md` 声明永不手改） |
| 接力包装 | `D:\relay-run-DHR_04\run-card-relay.ps1` + `briefs\{build,review1,review2}.md` |
| run 现场 | `D:\relay-run-DHR_04\runs\<run_id>\`，证据 `D:\relay-run-DHR_04\evidence\<run_id>\` |
| 任务树 | `D:\MyFiles\ai-workflow\dh-crew\.dh-worktrees\DHR_04`（branch `wt/DHR_04`） |
| 首个 run_id | `RELAY-DHR04-20260816215716`（2026-08-16 21:57 起） |
| 棒与账号 | `build`=grok(`~/.claude-grok`) → `review1`=默认账号(Opus) → `review2`=account9(deepseek) |

## 观察账（形态问题，非卡内问题）

| ID | 级别 | 事实 | 影响 | 建议去处 |
|---|---|---|---|---|
| C-01 | P2 | **worker 在新工作树里被 Claude Code 的「是否信任此文件夹」启动弹窗挡住**，`--dangerously-skip-permissions` 不覆盖该弹窗。relay 侧看到的只是 `terminal_state=running`（屏幕有输出），**没有任何"我在等人"的信号**——worker 还没跑起来就静默挂着，要等 30 分钟 stall 阈值才会暴露。主控靠 `capture-pane` 肉眼发现，手工在三个账号的 `<CONFIG_DIR>/.claude.json` 预置 `projects["<worktree 路径>"].hasTrustDialogAccepted=true` 后 `send-keys Enter` 解开。 | 一卡一树 = 每张卡的第一棒都必然撞一次；无人值守下会白等半小时 | relay 的 worker 入口应在 launch 前把目标 `WorkDir` 预置为已信任（或 preflight 检查），落 `DHR_08`（profile 执行边界）或 `DHR_09`（宿主生命周期）；先记本条备查 |
| C-02 | P3 | 心跳纪律必须写进 brief：Runner 只认 `checkpoint` 当进展，屏幕输出不算（`StallThresholdSeconds=1800`）。三份 brief 都加了"每做完一个编号步骤就报一次"。 | 长批次会被误判卡死 | 若进通用 brief 模板，归 `DHR_10`/`DHR_11` |
| C-03 | P3 | 包装脚本 + 3 份 brief 仍是本卡手写（同 IHSR_05 RB-4）。本次已把"逐节点 profile 映射"抽成 `$profiles` 哈希表，换卡只需改 briefs 与 worktree 路径。 | 每卡固定成本 | `DHR_10`（标准流水节点模板）承接 |

## 与验收的关系

本 run 的过程证据**不作为 H3/H4 的验收证据**——design/02 审核 S5 已定死自举验收卡必须「与 relay 实现无关」，用 relay 开发 relay 属循环论证。这里的记录只当**开发过程留痕与 backlog 来源**。
