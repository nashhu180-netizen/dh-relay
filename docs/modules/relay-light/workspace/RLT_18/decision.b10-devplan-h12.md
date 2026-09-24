<!-- dh:v1 -->
# decision · b10-devplan-h12 — DevPlan RLT_18 H12 口径行如何合规同步（decider#2 · 2026-09-24）

- 派单：`[relay-light:single-task] worker · phase=decision · agent=decider#2 · batch=na · round=1`
- 问题：RLT-A-14 已晋级（design/01 第 1426 行 `HC-RL-H12` 契约 v2、第 20 行活动说明、第 1256/1497 行总账登记）。DevPlan「#### RLT_18」验收口径第 653 行仍写「用户判断杀 watch 后 20 分钟兜底是否可接受」。选 (A) 开正式 B-adjust 事件 RLT-B-10、(B) 只改该行并在 evidence/14 登记不开 B 事件、还是 (C) 其它。
- 本文件只读得出结论，未改任何其它文件；模拟在 scratchpad 副本中进行，工作树 `git status` 前后一致。

## 1. 结论（verdict=AUTO）

**选 (A)：开最小 B-adjust 事件 `RLT-B-10`。** 形态按 RLT-B-05 / B-06 / B-09 的「A 晋级后 B 同步」既有形态：切换 DevPlan 活动声明为 `RLT-B-10`、`RLT-B-09` 转历史索引、evidence/14 增 `#review-rlt-b10` / `#understanding-rlt-b10` 两节（各带 `dh:planning-evidence` marker）、一名 fresh reviewer 窄审、主会话一句话理解确认后一次提交。

判定为 AUTO 的理由：方向与验收语义（H12 v2）已由用户裁决完毕（UD-3、UD-6 U-2、UD-7），本题只剩「用哪种流程形态同步一行」，而流程形态被 dh 检查器与 Issue #65 流程闸两条硬约束唯一确定，无需用户在 A/B 之间选。B-10 自身按 dev-harness 惯例带一次理解确认（§4 第 5 步给出问句与选项），那是事件内的固定步骤，不是本决策待用户裁的项。

## 2. 依据

### 2.1 dh check（R29）会把选项 (B) 判红——已实测

检查器 `dev-harness/tools/dh-console/scan.mjs`（`~/.claude/skills/dev-harness/tools/` 同源）R29 规则：规划正文实质变化（`planningFingerprint`，只剔 `dh:status`、状态/下一步等回填行、任务表状态列）时，`planning-event` 声明必须在当前变化集中新增或修改，且绑定的 review/understanding 证据也必须在变化集中（`EVENT_STALE` / `EVIDENCE_STALE`）。第 653 行是卡片正文项目符号，不在剔除范围。基线固定为「调用时 HEAD，只看 staged + unstaged」（scan.mjs 第 1176 行注释）。

在 scratchpad 副本上实跑 `node dh-check.mjs relay-light`：

| 场景 | R29 结果 | 合计 |
|---|---|---|
| 当前工作树（基线） | 无 R29 行 | 77 失败 / 37 警告（均为存量） |
| (B) 只改第 653 行 | `EVENT_STALE` ×1 + `EVIDENCE_STALE` ×4（指向 evidence/13） | 82 失败 |
| (A) 只改声明为 B-10、未加证据 | `EVIDENCE_BINDING` ×3 + `EVIDENCE_STALE` ×2 | 82 失败 |
| (A) 完整：声明 B-10 + evidence/14 两条 marker | 无 R29 行 | 77 失败（回到基线） |

`planning-no-event` 不可作为 (B) 的出路：同一工件不能同时有 `planning-event` 与 `planning-no-event`（`EVENT_CONFLICT`），DevPlan 已有活动声明。

推论：(B) 只能在 check 红的状态下提交，属「禁止先改后补工件」的失序；且提交后 R29 以 HEAD 为基线即静默，红线不会再被机器抓到，只会被 consistency 路复核或 verify 前的人工 check 抓到（本分支既有一处此类漂移，见 §5）。

### 2.2 dev-harness 与本卡合同都把这一步命名为 B-adjust

- dev-harness SKILL 术语表「增补型立项」：影响任务拆分时升级 A-full，**先更新正式输入再做 B-adjust**；`动作-B-拆计划.md`：A-full 结论写入 `designInputs[]` 后，「B-adjust 仍只读同一 `designInputs[]`」。design/01 已是 A-14 后的正式输入，DevPlan 同步它就是 B-adjust 的定义。
- Issue #65 正文「扩界记录」流程闸（UD-5 Q1 用户点选授权）：「… 用户整版确认 → 原子晋级 design/01 → **B-adjust DevPlan RLT_18 H12 口径行**」；允许路径追加也写「DevPlan（仅 RLT_18 段 H12 口径行，B-adjust，晋级之后）」。
- UD-7、`task_plan.md` 第 261/317 行、`drafts/A14/brief.md` 第 48 行、`A14-候选.md` 第 170 行、evidence/14 §三末句均写「B-adjust」。选 (B) 等于把已授权流程闸最后一步降级，需另一次用户裁决才合规；选 (A) 不需要。

### 2.3 先例

- 正例（A 晋级后开 B 同步 DevPlan）：RLT-B-06（基于已晋级 RLT-A-06，fresh 复核 + 用户「后者，继续」）、RLT-B-09（基于已整版确认 RLT-A-13，证据与 A-13 同放 evidence/13，review/understanding 各一锚点）、RLT-B-05（收口阶段补齐事件证据、未改任务合同——最小形态先例）。B-10 与 B-09 同构：证据挂在 A 事件同一份 evidence 文件，只多两节。
- 反例（未单发 B 号）：RLT-A-09「该 DevPlan 侧调整随 RLT-A-09 证据链落盘、未单发 B 号」、RLT-A-11 `bd118f6`（新增两卡与第 6 批，声明未动）、RLT-A-10 `2a9c4f4`（只改任务表行与 dh:status，属 fingerprint 剔除区，本就不触发 R29）。前两者是 DevPlan 自述的偏差且与 R29 冲突，不能作为 B-10 省略的依据；A-10 与本题不同类（本题改的是卡片正文行）。

### 2.4 审核会不会判 P1

- 选 (B)：workflow-final consistency 路会看到「design/01 H12 = v2、DevPlan RLT_18 H12 = v1 措辞已改但活动声明仍指 B-09/evidence/13」以及 verify 前 dh check 的 R29 红——两条都够 P1（权威文档不一致 / 流程完整性红线）。
- 选 (A)：证据链闭合，consistency 路只需核对一行与声明；B-10 自带的 fresh 窄审在 final 之前就把它清掉。

### 2.5 能否援引 UD-7 作 B-10 的用户确认

可以作为**授权链**登记（UD-5 Q1 选项文本 → Issue 流程闸列明 B-adjust → UD-7 确认对象含「再重演 H12 v2」），但 UD-7 的确认对象是 `A14-候选.md@e7c127d`，不是 DevPlan 行文本。按 B-06/B-09 形态，understanding 节都有一句用户当次答复。成本是一问，收益是避免「未逐条人判」的登记争议，推荐保留（§4 第 5 步）。

## 3. 否决项

- (B) 只改第 653 行并在 evidence/14 登记：R29 红 + 与 Issue 流程闸不符，见 §2.1/§2.2。
- (C1) 改行但用 `planning-no-event` 豁免：`EVENT_CONFLICT`，不可行。
- (C2) 不改第 653 行、只在 dh:status 或任务表备注写「H12 按 design/01 v2」：DevPlan 分账与总账文字相悖，consistency 路 P1；且 Issue 流程闸未闭合。
- (C3) 等 PR 合并后另开 B：与 UD-5 Q1「与代码同一 PR 收口」相悖，且 U2 重演 H12 v2 前 DevPlan 分账仍是 v1。

## 4. 执行步骤（orchestrator 主会话执行；B-10 事件节点身份，不属 U1/U2 coder）

顺序：草案落工作树（未提交）→ dh check 无 R29 行 → fresh 窄审 → 主会话一句话理解确认 → 写 understanding 节 → 再跑一次 dh check → 一次提交。

1. **DevPlan `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`**（共 6 处，均为 B-10 事件簿记；第 660 行允许路径块、第 827 行映射表、第 137 行任务行不动）：
   - 第 1 行：「更新至 2026-09-22」→「更新至 2026-09-24」。
   - 第 2 行后插入头部说明（仿第 3 行 B-09 格式）：`> **2026-09-24 RLT-B-10 / Issue #65**：基于已整版确认并晋级的 RLT-A-14（`HC-RL-H12` 契约 v2），同步 RLT_18 验收口径 H12 行；不新增任务、不改批次、不改机器证、不解冻任何旧卡。`
   - 第 8 行声明改为：`<!-- dh:planning-event:v1 id=RLT-B-10 stage=B-adjust artifact=dev_plan/P1-RelayLight-开发方案.md review=../design/evidence/14-交叉审核记录-RLT-A14-watch兜底watcher巡检.md#review-rlt-b10 understanding=../design/evidence/14-交叉审核记录-RLT-A14-watch兜底watcher巡检.md#understanding-rlt-b10 -->`
   - 第 10 行说明句改为「本计划当前活动声明为上面的 `RLT-B-10`；RLT-B-09 保留为上一事件。RLT-B-10 只同步 RLT_18 的 H12 口径行，不新增任务、不改批次、不解冻任何旧卡。」；历史索引表末追加一行：`> | `RLT-B-09` | B-adjust | `../design/evidence/13-交叉审核记录-single-task模式.md#review-rlt-b09` / `#understanding-rlt-b09` | 转历史索引 |`
   - 第 653 行改为（镜像 design/01 第 1426 行，不另造口径）：`  - **人判**｜来源：design/01 + `HC-RL-H12`｜用户判断 watch 死亡后本终端空间 watcher 的 10 分钟巡检是否接住、10 分钟是否可接受（RLT-A-14 契约 v2：杀 watch 进程→展示 shell 重启循环自拉；关阶段级 / 编排级 watch 载体→展示 watcher 巡检时刻、`[relay-light] watch-down …` 通知与派活方重拉时刻；原 v1「杀 watch 后 20 分钟兜底」口径经 Git 历史可还原）。`
   - §3.1 调整清单第 62 行（RLT-B-09 调整）后追加：`- **RLT-B-10 调整**：2026-09-24 基于已晋级的 RLT-A-14（用户整版确认见 evidence/14 §三），同步 RLT_18 验收口径 `HC-RL-H12` 行为契约 v2（watcher 10 分钟巡检）；不新增任务、不改批次、不改 A82/A83/A101、不解冻旧卡；活动总账仍 159。fresh 窄审与用户确认见 [evidence/14 §四](../design/evidence/14-交叉审核记录-RLT-A14-watch兜底watcher巡检.md#understanding-rlt-b10)。`
2. **evidence/14 `docs/modules/relay-light/design/evidence/14-交叉审核记录-RLT-A14-watch兜底watcher巡检.md`** 末尾追加「## 四、RLT-B-10 · DevPlan RLT_18 H12 口径行同步（B-adjust）」，含：
   - `<a id="review-rlt-b10"></a>` + `<!-- dh:planning-evidence:v1 event=RLT-B-10 artifact=dev_plan/P1-RelayLight-开发方案.md kind=review -->` + fresh reviewer 结论（第 3 步产出）。
   - `<a id="understanding-rlt-b10"></a>` + `<!-- dh:planning-evidence:v1 event=RLT-B-10 artifact=dev_plan/P1-RelayLight-开发方案.md kind=understanding -->` + 授权链（UD-5 Q1 → Issue #65 流程闸 → UD-7）+ 第 5 步用户当次答复原文。
   - 事件身份节（§一）补一句：「RLT-B-10（B-adjust，目标 `dev_plan/P1-RelayLight-开发方案.md`）与本事件共用本记录，见 §四。」
   - `artifact` 属性必须精确等于 `dev_plan/P1-RelayLight-开发方案.md`（R29 `EVIDENCE_BINDING` 精确匹配，已实测）。
3. **fresh 窄审**（一名未参与 A-14 与本决策的 reviewer，只读，signal `DONE.b10-review.md`，写入 evidence/14 §四 review 节）。清单 5 条：①第 653 行与 design/01 第 1426 行 H12 v2 三列语义逐字一致；②DevPlan 除 §4 第 1 步所列 6 处外零改动（`git diff -- dev_plan/`）；③声明 / 证据 marker 的 event、artifact、锚点三者互指正确；④历史索引表含 B-09 且 B-09 原证据路径未改；⑤`node dh-check.mjs relay-light` 输出无 `R29` 行且失败计数不高于基线 77。任一不满足 FAIL 回 orchestrator 整改，最多 2 轮。
4. **dh check**：第 1、2 步落工作树后、提交前跑 `node <dev-harness>/tools/dh-check.mjs relay-light`，确认无 `EVENT_*` / `EVIDENCE_*` 行。提交后 R29 以 HEAD 为基线不再触发，所以必须在提交前跑。
5. **主会话理解确认**（AskUserQuestion 一问，答复原文抄进 understanding 节）：
   - 问句：「RLT-A-14 已晋级。现在按 Issue #65 流程闸最后一步开 RLT-B-10，只把 DevPlan RLT_18 的 H12 验收口径行从『杀 watch 后 20 分钟兜底』改成与 design/01 一致的『watcher 10 分钟巡检』契约 v2，不动任务、批次和机器证。是否确认落盘？」
   - 选项：(1) **确认落盘（推荐）**——按 fresh 窄审通过的草案提交；(2) 先看 diff 再定——展示 6 处改动后再问；(3) 不同意——说明理由，回 decider。
6. **一次提交**（仅 DevPlan + evidence/14 + `DONE.b10-review.md`）：`docs(relay-light): RLT-B-10 — DevPlan RLT_18 H12 口径行同步 A-14 契约 v2`。不 push、不 PR、不 verify（沿用 Issue 扩界停止边界）。
7. **B-10 之外、同期由 orchestrator 顺手同步的工作区行**（RLT_18 允许路径内，不进 B 事件，可与第 6 步同提交或随人验提交）：`workspace/RLT_18/brief.md` 第 44 行、`review.md` 第 13 / 59 / 64 行仍写「20 分钟兜底」，改为 v2 口径并注「RLT-A-14 / RLT-B-10」；`decisions.md` 追记 UD-8（本决策与用户第 5 步答复）；`findings.md` 登记 §5 观察。

## 5. 范围外观察（登记 findings，不阻塞）

- 本分支 `5ab3bba..HEAD` 对 DevPlan 已有一处卡片正文改动（第 660 行 SKILL.md 允许路径追加，UD-2）在无 fresh 声明下提交；按 R29 口径当时若跑 check 应为 `EVENT_STALE`。已提交后不再触发。B-10 提交时该行随声明刷新一并被覆盖，无需单独补事件，但应在 B-10 调整条目里带一句「含 UD-2 允许路径追加行的事件补登」。
- 基线 77 项失败中 `workspace/RLT_27` R30 把本分支 A-14 全部文件判为 RLT_27 越界，属存量误判（RLT_27 卡与本分支无关），与本题无关。
