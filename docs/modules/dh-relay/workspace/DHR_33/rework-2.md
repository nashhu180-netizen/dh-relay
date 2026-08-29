<!-- dh:v1 · workspace/DHR_33/rework-2.md · 复核轮2返工清单（主控裁决后，worker 照做） -->
# DHR_33 · 返工清单 2（源：review-code2-opus.md ×20 全采纳，2026-08-29 裁决）

> 边界不变：brief allowed-paths 闭集照旧；contracts/fixtures/profiles/store/rpc/adapters 六目录一个字不动。
> 完成门槛（与返工 1 同口径）：新测单跑全绿 + 全量 `npm test` 自行终止（结果如实记录）+ audit-contracts 0 违规 + 六目录 diff 为空 + **本清单 A/B 逐项在 progress 落地状态表（按事实打钩，禁止全✓声明）**。最后 `git add`（只加 allowed-paths）+ `git commit -m "fix(dh-relay): DHR_33 复核轮2返工（wt/DHR_33）"`。禁止 push。
> 行尾纪律：编辑现有文件时保持仓库规范行尾（CRLF checkout 形态），不得再引入混合行尾。

## A. 运行时必修（P1×2 + 直接关联项）

1. **[P1-1] 恢复届孤儿判据收紧**：`workflow-driver.mjs:301-305` 只有 `probe.missing === true` 才 `appendResult({outcome:'orphaned', reason:'E_EXECUTOR_ORPHANED'})`；其它失败（spawn 失败/超时/解析失败）视为「这一届探不动」——保持 running 不落 Result，落一条 `host_observation_changed`（observation_lost）后跳过本节点，等下一届再探。与 A10 的 reconcile 同口径。
2. **[P1-2] stop 撞 launch 窗口**：`launchHerdrAgent` 成功返回后立即 `current = stopHandle; if (stopping) { await stopHandle.kill(); }`（与 process 路径 `:264` 对称）；`:207-209` else 分支改掉——stop 语义下不发 Attention：kill 失败落 Result（reason `E_EXECUTOR_KILLED`，kill 失败详情进 `structured.reason_detail`），绝不能既无终态又发 `human_input_requested`。
3. **[P1-2 连带/P2-6 前提] launch 成功即落 executor_ref**：launch 成功后立刻落一条带 `executor_ref`（agent_name）的 `host_observation_changed`，保证恢复路径在 launch 窗口崩溃后也有账可查。
4. **[P2-6] 恢复届 ref 按 attempt 过滤**：`:299` 的反查加 `event.attempt_id === 当前 attempt_id`；当届无任何 `executor_ref` 时不得静默 `continue`——按 P1-1 同口径处置（探不到宿主证据 → 落 observation_lost 观测，不判死）。
5. **[P2-5] idle 恒态生命周期出口**：有界上限从「仅 done」改挂「非 working / 非 blocked 的静默期」（done/idle 同参 `doneTimeoutMs`，或另设同层参数），超时 → 单次 Attention 后停止轮询该节点。消除 idle 恒态下每秒 spawn `agent read` 的无限轮询。
6. **[P3-16] blocked 期间瞬时观测断不重发 Attention**：lost 分支不清 `lastStatus`（或另存 `lastAliveStatus`），恢复后仍 blocked 不再发第二条。
7. **[P3-17] catch-all 加固**：`:210-212` catch 内 `recordResult` 再包 try/catch，失败只留日志不外抛；reason 不用裸 `E_BAD_VALUE`（包装层错误不当协议码，与轮 1 P2-4 同口径——用能表达 driver 内部异常的既有码，无合适码则落 Attention 而非 Result）。
8. **[P3-15] seq 传最后已知值补全**：`launchHerdrAgent` 回吐 ready 轮询最后观测的 `state_change_seq`，driver 用它初始化 `lastSeq`；`:147/:161/:167` 不再硬编码 0。
9. **[P3-19] launch 失败子码保真**：`structured.reason_detail` 带上 `launched.reason`（不只 `launched.detail`）；`pane-id-missing`（返回体形状不符）不再归 `E_EXECUTOR_HOST_LOST`，单列到 `reason_detail` 说明。
10. **[P2-9 裁决=回退]** `main.mjs:322` focus 事件源恢复 brief 裁决 4 冻结口径：只过滤 `host_observation_changed`。「扩到 human_input_requested」记 findings（F-9，处置=交主控/后续卡裁决），不留在代码里。
11. **[P3-11/12/13] A12 欠账补齐**：openAttempt 迁回裁决注释（`596a49b^:101-104` 原文）；删 `main.mjs:328` 死参数；`stopHerdrAgent → paneKill` 走独立短超时 invoke。

## B. 测试补齐（护栏 + 抖动治理）

12. **[P2-1] reconcile 分歧区间用例**：`agentGet`/`paneGet` 均 `{ok:false, missing:false}` → 必须 `observation_lost` 不得 `host_lost`（同时是 A-1 的护栏）。
13. **[P2-2] 分叉顺序钉死**：`agent-node.test.mjs` 加双候选节点 `[{process},{herdr-agent}]` → 必须走 process。
14. **[P2-3] B13#3 补逐字断言**：成功终态 `executor_kind === 'herdr-agent'` 逐字；同组补 B13#2「send 后离开 blocked、心跳恢复」driver 层用例、#4「不落 Result」负断言、#1 心跳 N 次 N 条（替换 `>=2`）。
15. **[P2-4] #3/#5 抖动治理**：`noJudge` fixture 弃用 `herdrPollMs:0 + doneTimeoutMs:-1 + 合成时钟`，改显式小正阈值 + 放宽 `runtimeUntil` 预算；该 fixture 补 `t.after(() => driver.stop())`。修后取证：`node --test test/herdr-adapter.test.mjs test/agent-node.test.mjs` 并跑连续 4 次全绿，结果贴 progress。
16. **[P3-14] attach 模板交叉断言**：`renderFocus(evt)` attach 行 === `attachHerdrAgent({handle}).instruction`；补 `renderFocus({…, executor_ref: null})` 不含 `attach:`。
17. **[P3-18] B14 补钉**：`calls[2]/[3]/[6]/[7]` 的 deepEqual（含 `agentRead` 的 `--source recent-unwrapped --lines 120` 参数序列）。
18. **A-1/A-2/A-5 新行为各补一例**：①恢复届遇「探不动但非 missing」保持 running + observation_lost（A-1）；②stop 撞 launch 窗口 → pane 被杀 + 落 `E_EXECUTOR_KILLED` Result、无假 Attention（A-2）；③idle 恒态超阈值 → 单次 Attention 后停轮询（A-5）。

## C. 文档修正

19. **[P2-8] 候选-39 数字更正**：progress 改为「200 → 207（+7）」，删自相矛盾表述。
20. **[P2-7] progress DONE 段收敛**：11 组核对表按事实重打（#1/#2/#3/#4 按本清单 B-14 修后状态如实标注）；旧 DONE 段 `:18` 的过期自评（「②~④ 已有机器证」）按 D-20 原要求重写，两段自评合并为一份，不得并存。
21. **findings.md 追加**：F-9（P2-9 回退项：focus 事件源扩展想法，open，交后续裁决）；F-1 若受 B-15 抖动治理影响一并按事实更新。

## D. 裁决说明（不执行，仅背景）

- 轮 2 变异实证 E-3306 已判达成（review.md 已回填），返工 2 不需要重做变异。
- workflow-driver.mjs 行尾已被规范化为仓库规范形态（内容零变化），返工 2 在此基线上编辑即可，见上方行尾纪律。
- 复核实例模型三证矛盾（--model opus / TUI Opus 5 / SessionStart fable-5）已按候选-40 并存登记 review.md，待用户裁定，worker 不处理。
