<!-- dh:v1 · workspace/DHR_33/rework-3.md · 一致性复核后返工清单（收尾轮，主控裁决后 worker 照做） -->
# DHR_33 · 返工清单 3（源：review-consistency-opus.md ❌3 + N-1~N-4，2026-08-29 裁决）

> 边界不变：brief allowed-paths 闭集照旧；contracts/fixtures/profiles/store/rpc/adapters 六目录一个字不动；保持仓库规范 CRLF 行尾。
> **完成门槛（候选-47：全部分组逐项落表；候选-48：硬门槛多样本）**：本清单 1~10 全部条目（含文档组）在 progress 逐项落地状态表，编号与本清单一致；定向单跑全绿；**`node --test test/herdr-adapter.test.mjs test/agent-node.test.mjs` 并跑连续 6 次全部终态通过**（每次记 exit code + wall-clock，写入 progress）；**全量 `npm test` 连续 3 次 exit 0**（同样记 exit + wall-clock；若你环境仍受残留进程干扰无法取得，如实登记停下交主控取证，不许只跑一次就宣称）；audit-contracts 0 违规；六目录 diff 为空。最后 `git add`（只加 allowed-paths）+ `git commit -m "fix(dh-relay): DHR_33 复核轮3返工（wt/DHR_33）"`。禁止 push。

## A. 代码（4 条）

1. **[N-1] idle 恢复 capture，按 task_plan 冻结映射**：`workflow-driver.mjs:206-211` 的 `captureHerdrResult` 触发面从「仅 done」改为「done，或 idle 且注入了 herdrJudge」——与 task_plan 步骤 3 逐字对齐（`idle→有判定结论则 capture 落 Result，无则 observation 登记`）。无判定器时 idle 不 capture（避免每轮 spawn agent read），静默有界出口（返工 2 的 quietAt）保留不动。
2. **[N-2] launch 失败回收已开 pane**：`herdr-executor.mjs:25-32` 两条失败出口（pane-id-missing、agentStart 失败）在 paneSplit 已成功时先 `cli.paneKill(paneId)` 再返回，kill 结果并进 `detail`。
3. **[N-4/P3-15 收尾] seq 空值占位符**：`observationDetail` 的 seq 为 null/undefined 时渲染 `seq=-`（与 `agent=-`/`pane=-` 占位一致），不再出现字面 `seq=null`。
4. **[P2-2 真修法，复核已给] 分叉顺序护栏必须有判别力（候选-46）**：`agent-node.test.mjs` 双候选用例的 process 候选换成**可解析**的 step ref（走 process 时真实产出 `attempt_started` 等事件），断言改为双向：process 独有事实存在 + herdr 特征事实（paneSplit）不存在。**完成判据 = 当场反向变异（herdr 抢先）必红，红证贴 progress。**

## B. 测试（3 条）

5. **[P2-4 真修法] #3/#5 抖动治理二版**：`noJudge` 场景等待改用 task_plan `:17` 冻结点名的 `test/helpers/settled-state.mjs` 的 `settledState`（等不变量，候选-35/候选-55——返工 1 自建的 `runtimeUntil` 等期望值正是被绕开的反模式；若 settledState 形态不适配，最低限度也要给 `runtimeUntil` 注入可控时钟并放宽预算，禁止测试与被测各读实时钟——候选-27 修正）。**取证 = 完成门槛里的并跑 6 次全绿**（证伪原红率 2/6 的样本量，候选-48）。
6. **[N-3] herdr 相关测试禁止隐式读家目录**：`agent-node.test.mjs` 触碰 herdr 分支的用例显式注入 `herdrRegistryPath` 指向临时文件（对齐 herdr-adapter.test 的 `runtimeFixture` 做法）。
7. **A-1/A-2 新行为补断言**：①idle+judge → succeeded 且 `executor_kind='herdr-agent'`；②launch 失败（agentStart `{ok:false}`）→ `paneKills === 1`。

## C. 文档与 findings（3 条）

8. **[P2-8/候选-39] progress 数字修正**：`:29` 改「基线 200 → 返工 1 后 207（+7）」，删除「205（+5）」及矛盾表述；补返工 2 增量「207 → 212（+5）」与返工 3 增量（如实取数）。
9. **[P2-7/候选-10] progress 自评收敛**：三段 DONE 并存改为——旧两段（施工 `:14-19`、返工 1 `:26-31`）顶部各加一行 `> superseded：见返工 3 DONE 段`；最新 DONE 段为唯一有效自评，11 组核对表按 rework-3 后实况重打（含 #2/#3 现状）。
10. **findings.md 三处**：①F-1 收敛更新——把主控 212/212 实证与"连续 3 次 exit 0"新口径写进去，与 progress 结论对齐，不再两说；②新增 F-10（P3，open）：driver 内部异常届（catch-all）无终态且不在 retryFailed 捞取集合，永久悬挂需新 reason code，交后续契约卡（含 P3-19 的 pane-id-missing 归码失真，同根同交）；③新增 F-11（P2，open）：herdr 能力 hash 本卡未产出，阻断 E-3304 分句 4，交 DHR_35；④既有 F-3/F-6/F-7 的处置列各补「阻断/限制的验收 ID」（F-3→E-3302 成功终态、F-6→E-3304 事件快路、F-7→E-3305 来源规则）——候选-41 修正格式。

## D. 裁决说明（不执行，仅背景）

- P3-19 前半句（pane-id-missing 不归 HOST_LOST）主控裁决**不改代码**：contracts 冻结、无合适既有码，现状（HOST_LOST + reason_detail 标记）为最小失真，走 C-10② 的 F-10 登记。
- 教训回流（候选-46~55 + 修正 8 条入 knowledge/教训库-候选.md）与 lesson_candidates.md 回填由主控收口时执行，worker 不动 knowledge/。
- E-3306 终基线抽样复算由主控在本轮提交后执行。
