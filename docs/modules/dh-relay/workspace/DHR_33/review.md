<!-- dh:v1 -->
# DHR_33 · Review

> 任务类型 heavy：代码两轮换人 + 五路复核（代码1/代码2/需求/教训/一致性）+ 有效单测（变异点由轮 2 实例选定）。
> 复核形态：claude 经 Herdr `pane run` 拉起、侦测型只读（提示词硬约束 + 回收后 git status 核对）；模型身份按候选-40 双证登记。

## 独立复核区

**第一轮（代码）**

| 复核者 | 结论 | 派出证据 |
|---|---|---|
| rev-dhr33-code1 | changes-requested，返工 1 闭合 | log:review-code1-opus.md |

**第二轮（代码）**

| 复核者 | 结论 | 派出证据 |
|---|---|---|
| rev-dhr33-code2 | changes-requested，返工 2/3 后收敛 | log:review-code2-opus.md |

**需求复核结论**：原始 changes-requested；后续无逐条复裁表，待人验项不改机器通过｜由 rev-dhr33-req｜派出=log:review-req-opus.md

**教训复核结论**：既有候选复核并新增候选-46~55，已回流教训库｜由 rev-dhr33-final｜派出=log:review-lessons-opus.md

| 路径 | 复核者 | 结论 | 原始记录 |
|---|---|---|---|
| 代码轮 1 | rev-dhr33-code1 · `--model opus`；SessionStart=fable-5（候选-40待裁） | changes-requested，返工后闭合 | review-code1-opus.md |
| 代码轮 2 | rev-dhr33-code2 · `--model opus`；SessionStart=fable-5（候选-40待裁） | changes-requested，返工后闭合 | review-code2-opus.md |
| 需求方向 | rev-dhr33-req · `--model opus`；SessionStart=fable-5（候选-40待裁） | 原始 changes-requested；三轮返工后未留逐条闭合表 | review-req-opus.md |
| 一致性/教训 | rev-dhr33-final · 同一实例两条适用路径 | findings 落档后收敛 | review-consistency-opus.md / review-lessons-opus.md |

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| Herdr 状态映射、DSH-off CLI 与快慢路边界 | fake-herdr 反例、真 Run 四命令 smoke、三轮返工与变异复算 | E-3302~E-3306 | 满足 |
| Linux SSH 与 Oracle 差异受理 | fixture 仅作冻结，明确保留真实 smoke 与人验 | E-3301/E-3307/E-3308 | 待人验 |

## 开工预审（brief/task_plan fresh 审核）

- 实例身份：claude fresh 实例，Herdr `pane run` 拉起（pane w1:pB，agent `rev-b33pre`，2026-08-29，`--model opus` 拉起；模型双证按候选-40 待补实例自报）。回收后 `git status` 仅新增 review-pre-opus.md，零越权。
- 结论：19 条（P1×6 / P2×8 / P3×5），原文 [review-pre-opus.md](review-pre-opus.md)。P1 全部命中主控裁决里的事实错误：event.v2 无 payload 且多余键被 emitEvent 静默丢弃、host-observation v0 装不下版本/能力 hash、inspectRun detail 不含事件、reason code 错用 ADAPTER_LOST（专属 pi）、profile 两套结构无桥、attach/send 漏排。另附 9 项「已核实无误」留档。
- 主会话裁决（2026-08-29）：**19 条全采纳**——P1-1/P1-2 取复核建议 (a)+(c)（executor_ref+detail 固定编码；版本/能力 hash 降级 progress 证据并记 Oracle 差异）；P1-3 focus 改走 subscribe；P1-4 码分界改 HOST_LOST/ORPHANED/KILLED + 包装层用进程内前缀；P1-5 立裁决 7（ref 逐字承载 profile_id + profile-registry.mjs 只读桥 + 查无即 pending）；P1-6 取「补」（裁决 8：sendToHerdrAgent/attachHerdrAgent）；P2/P3 逐条落实（含 P2-8 CANONICALIZATION 过时留档、P2-10 心跳幂等陷阱、P2-12 超阈值升级与 launch 盲区、P2-14 DSH 未运行取证）。brief/task_plan 已按裁决重写后再派工。

## 完成条件逐条挂证据（验收靶子）

| # | 命题（brief 完成条件） | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 证据 | 结论 |
|---|---|---|---|---|---|---|---|
| 1 | H4/H9 · P6-M6 Linux SSH（**B-22① 延后**） | 延后登记：fixture 冻结 + 「待真实 smoke」备注，无冒充 | 机器+复核 | E-3301 | 延后 | | |
| 2 | H5 · P6-M3：blocked→持久 Attention；done 只进 awaiting_result；漏事件/重启/pane 消失/进程退出均有明确结果 | 机器证：herdr-adapter.test 断言 2/3/4/5 + 重放持久性 | 机器+复核 | E-3302 | 达成 | [review-consistency-opus.md §六](review-consistency-opus.md) 五分句逐条核（含 P1-1 修复后重启格）+ rework-3 终 HEAD `ea88c1d` 主控抽样 SM1/SM3 变异红→还原→15/15 绿 | 达成（2026-08-29 主控裁决；P3-17 内部异常格走 F-10 交后续） |
| 3 | H1 · P6-M5：DSH 不启动时 CLI 完成查询与附着 | 机器证：focus/status/inspect/events 测试 + 真实 smoke（DSH 关闭） | 机器+复核 | E-3303 | 机器面达成 | progress C 段真实 smoke 逐字记录（`NO_DSH_PROCESS`/`NO_DSH_SERVICE` 取证 + 真 Run `relay status/inspect/events/focus` 四命令 + attach 指令输出）；复核核内部一致性通过（consistency §六附） | 机器面达成，一次性现场**待人验** |
| 4 | 快路+慢路对账；HostObservation 记版本/能力/pane 句柄；focus 不存任意拼接命令 | 机器证：observe/reconcile 测试 + renderFocus 逐字断言 + 代码复核 | 机器+复核 | E-3304 | 受限达成 | consistency §六：慢路对账 ✅、pane 句柄六键 ✅（V6′ 咬合）、focus 零拼接 ✅（M4/V7′ 双向）；事件快路上游能力缺失（F-6→DHR_35）、能力 hash 未产出（F-11→DHR_35）、herdr 版本 0.8.2 已记 | **受限达成**（两处降级待人验受理，2026-08-29 主控裁决） |
| 5 | work_dir_root 由 launch 决定并登记（DevPlan 承接备注） | 机器证：launch 必填断言 + 句柄字段逐字 | 机器 | E-3305 | 达成 | launch 缺参 `E_BAD_VALUE:WORK_DIR_ROOT` + handle/detail 六键逐字断言（consistency §六附） | 达成（来源规则恒取 repoRoot 的限制见 F-7，交 DHR_35） |
| 6 | 有效单测：轮 2 选点变异改坏必红 | 机器证：红→还原(sha256)→绿三段 | 机器 | E-3306 | 达成 | [review-code2-opus.md §三](review-code2-opus.md)（基线 5ecd4b0：8 有效全红→还原→绿）+ [review-consistency-opus.md §三.2](review-consistency-opus.md)（4d68163 抽 5 复算全红 + 新护栏 7 点 6 红）+ **终基线 `ea88c1d` 主控抽样 SM1（恢复届判据）/SM2（分叉顺序）/SM3（idle+judge capture）3/3 红→git 还原→15/15 绿**（2026-08-29） | 达成（2026-08-29 主控裁决，候选-49 基线条款履行） |
| 7 | brief 完成条件 5②：`awaiting_result` 语义替换为 `running`+`host_observation_changed`（Oracle 差异，候选-42） | 人验：验收人受理该替换 | 人 | E-3307 | 待人验 | brief 裁决 3 + design/03 §123 冻结口径；代码事实见 review-consistency §六 E-3302 分句 2 | 待人验 |
| 8 | brief 完成条件 5③：HostObservation 版本/能力 hash 降级为 smoke progress 证据（Oracle 差异，候选-42）；herdr 版本已记（0.8.2），能力 hash 未产出（findings 登记交 DHR_35） | 人验：验收人受理降级与未承接项 | 人 | E-3308 | 待人验 | progress C 段 herdr 版本取证；能力 hash 缺口见 review-consistency §六 E-3304 分句 4 | 待人验 |

## 代码轮 1（fresh）

- 实例身份双证：Herdr `pane run` 拉起（pane w1:pE，agent `rev-dhr33-code1`，2026-08-29），拉起参数 `--model opus`；**实例自报实际模型 `claude-fable-5[1m]`**（候选-40 双证并存，待用户裁定）。回收后 git status 仅两份复核输出文件，零越权。
- 结论：19 条（P1×6 / P2×7 / P3×6），原文 [review-code1-opus.md](review-code1-opus.md)。「不建议放行本轮」——P1-1 done/idle 主路径运行时崩（schema required 缺 observation_status，行为探针实证）；P1-2 判定器无注入口（succeeded 无路可达）；P1-3 blocked 第二沿静默；P1-4 readyTimeoutMs 死参数；P1-5 ORPHANED 整条缺失；P1-6 十一组断言仅 2 组真验事实。契约面 9 项核验通过留档（§六）。
- 主会话裁决：19 条全采纳，并入 [rework-1.md](rework-1.md)（返工第 1 轮，派原施工 worker）。

## 需求方向复核（fresh）

- 实例身份双证：pane w1:pF，agent `rev-dhr33-req`，`--model opus` 拉起、自报 `claude-fable-5[1m]`（同上并存登记）。
- 结论：16 条（P1×6 / P2×5 / P3×5），原文 [review-req-opus.md](review-req-opus.md)。核心判断：形状对了、证明链是空的；四大下游阻断（R-2 无成功终态 / R-4 注册表字段零消费 / R-5 Attention 无出口 / R-3 快路缺席+seq 不去重）未升 findings。
- 主会话裁决：16 条全采纳——R-4 取其最小方案（detail 增补第 6 键 profile，brief 裁决 3 已由主控修订）；R-2 补 herdrJudge 注入口 + done 有界；R-5/完整字段消费走 findings 交 DHR_34/35；其余并入 rework-1.md。**主控补充实证**：全量 npm test 在本工作树挂死不退出（两次实测强杀，含孤儿 service 进程），与 R-2/P2-3 同根，升为 rework A-0 硬门槛。

## 代码轮 2（换人 fresh，变异点选定者）

- 实例身份三证（候选-40 并存登记，待用户裁定）：Herdr `pane run` 拉起（pane w1:pK，agent `rev-dhr33-code2`，2026-08-29），拉起参数 `--model opus`；TUI 状态栏显示 `Opus 5`；SessionStart hook 告知 `claude-fable-5[1m]`；实例系统提示自述 `Opus 5 / claude-opus-5`。回收后核验：git status 仅新增 review-code2-opus.md，代码零 diff，五个目标文件 sha256 全部复位（其中 workflow-driver.mjs 混合行尾被规范化为仓库规范形态，`git hash-object` 与 HEAD 一致、内容零变化，留痕见其报告 §三）。
- 结论：20 条（P1×2 / P2×9 / P3×9）+ 变异表 8 有效 / 4 无效，原文 [review-code2-opus.md](review-code2-opus.md)。核心判断：「返工 1 的 A 组主体是真修不是声明修，但不建议放行」——P1-1 恢复届把 herdr CLI 暂时性故障判死成 ORPHANED（双跑风险）；P1-2 stop 撞 launch 窗口致 pane/agent 泄漏、无终态、假 Attention。另实证 A7/A10/B13#3 三处「改对了但零测试保护」（N1~N3 回退全绿）与新测 #3/#5 并发抖动（4 跑 2 红，与主控独立验证时的观察互证）。E-3306 判定达成。
- 主会话裁决（2026-08-29）：**20 条全采纳**，并入 [rework-2.md](rework-2.md)（返工第 2 轮）。其中 P2-9 裁决为**回退**——focus 事件源恢复 brief 裁决 4 冻结口径（仅 `host_observation_changed`），「扩到 human_input_requested」的想法记 findings 交后续裁决，不追认擅自改道；P3-11/12/13/14 系 rework-1 A12 声明已做实未做的复发，随返工 2 补齐。

## 需求方向复核（fresh）

原始结论见 [review-req-opus.md](review-req-opus.md)：16 条 changes-requested。三轮返工覆盖了其中多项，但未留下逐条闭合对账表；因此这里只登记原结论与后续工件，不宣称该路径已逐条复裁通过，待人验项仍保持待人验。

## 教训复核

- 实例身份双证（候选-40 并存登记）：与一致性复核同实例（pane w1:pN，agent `rev-dhr33-final`，2026-08-29，`--model opus` 拉起；SessionStart 自报 `claude-fable-5[1m]`、系统提示自述 `claude-opus-5`）。回收后 git status 仅两份 review 输出，零越权。
- 结论：既有候选 45 条逐条意见（修正 8 / 强佐证 8 / 正面佐证 4 / 反例佐证 2 / 无新证据 23）+ 新增候选-46~55 共 10 条，原文 [review-lessons-opus.md](review-lessons-opus.md)。三条贯穿主线：①"声明已做 vs 实际做了"的缝隙三轮复发（候选-12/13）；②护栏与被护对象错位（候选-46 零判别力护栏）；③测试环境不确定性反复被单样本误判（候选-48）。
- 主会话裁决（2026-08-29）：**全部采纳**——修正 8 条与新增 10 条随收口回流 `knowledge/教训库-候选.md`（主控执行）；lesson_candidates.md 回填指针；其点名的候选-25 分界判据经核对本卡不触发换方案止损（两轮返工缺陷属"新引入/同类未同步/文档欠账"，非根因翻新）。候选-40 模型身份裁决权留用户（入库建议 #3）。

## 一致性复核

<!-- dh:consistency-review:v1 task=DHR_33 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Herdr 状态映射、恢复届、launch 清理与测试基线 | brief/task_plan、生产实现、测试、review findings | 返工前不一致，返工 3 后机器项收敛；受限项留 DHR_35 | 采纳未闭环项并完成 rework-3；F-3/F-6/F-11 保持遗留 | log:review-consistency-opus.md |

- 实例身份：同上（rev-dhr33-final，与教训复核同批）。
- 结论：轮 2 二十条闭环核对 **✅14 / ⚠️3 / ❌3**（P2-2 护栏零判别力、P2-4 并发抖动 6 跑 2 红未消灭、P2-7/P2-8 C 段文档整段未做）+ 三方对账矛盾 7 条 + 新报 5 条（N-1 idle 不 capture 与 task_plan 映射冲突【P2】、N-2 launch 失败泄漏 pane【P2】、N-3 测试隐式读家目录注册表、N-4 seq=null 进 detail、N-5 driver 内部异常届不可 retry）+ 变异探针 12 个（返工 2 新护栏 7 个中 6 红 1 绿、轮 2 旧点抽 5 复算全红）。原文 [review-consistency-opus.md](review-consistency-opus.md)。
- 主会话裁决（2026-08-29）：未闭环 3 条 + N-1~N-4 采纳并入 [rework-3.md](rework-3.md)（返工第 3 轮，收尾轮）；P3-19 裁决=维持现状（contracts 冻结无合适既有码，HOST_LOST+reason_detail 标记为最小失真，findings 登记交契约卡）；N-5、能力 hash 未产出、候选-41 修正（findings 点名被阻断验收 ID）均走 findings。**A-0 硬门槛按候选-48 升级为「全量 npm test 连续 3 次 exit 0」**。E-3302 采纳复核侧意见判达成（终验以 rework-3 后 HEAD 复核为准）；E-3304 判**受限达成**（事件快路上游能力缺失 F-6 交 DHR_35、能力 hash 未产出补 findings，两处降级留人验受理）；E-3306 基线随 rework-3 后抽样复算更正。

## 人类签名区（待用户回归，AI 不得代勾）

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| DSH-off 与 Herdr 状态映射 | 读 E-3302~E-3306 账本及真实 smoke 记录 | 机器项可回链，受限项未冒充全达成 | [ ] |
| Linux/Oracle 差异与下游遗留 | 查看 E-3301/E-3307/E-3308 及 findings F-3/F-6/F-11 | 接受延后与 DHR_35 承接范围 | [ ] |

- [ ] **E10 收口确认与 verify**：已查看证据，认可收口（注：squash `66dd16a` 已按 2026-08-29 委托先行合入 master，不认可可指令回滚）。做什么：读本表验收行 + review-consistency-opus.md §六/§八。
- [ ] **E-3303 现场人验**：真实 smoke 为一次性现场（DSH 未运行 + 真 Run 四命令 + 附着指令），复核只能核文本一致性。做什么：读 progress C 段，认可即勾。
- [ ] **E-3304 受限受理**：事件快路上游能力缺失（F-6）、能力 hash 未产出（F-11），均交 DHR_35。接受受限达成即勾。
- [ ] **E-3307/E-3308 Oracle 差异受理**：`awaiting_result` 语义替换、版本/能力 hash 降级（brief 完成条件 5②③，候选-42 机制）。
- [ ] **P6-M6 延后受理**：接受 Linux 项延后至阶段闸裁决（B-22① 汇合点）。
- [ ] **候选-40 模型身份裁决**：两卡五复核实例矛盾无一例外（`--model opus` 拉起 / TUI 显示 Opus 5 / SessionStart 自报 fable-5）。裁决方式二选一：认 SessionStart hook 为权威源，或把"换人复核"定义改为上下文独立（见 review-lessons-opus.md §四-3）。
