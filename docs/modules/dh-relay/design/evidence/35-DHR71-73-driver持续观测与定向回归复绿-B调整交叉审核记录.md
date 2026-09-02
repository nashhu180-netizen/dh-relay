# DHR-B-35 · driver 持续观测 / 定向回归复绿 / 启动链静默停摆 · B-调整交叉审核记录

> 本记录承载 `DHR-B-35` 的审核过程、主控裁决与用户理解对齐。**它不是设计输入，不参与拆计划。**
> 待审对象：[`drafts/DHR-B-35-driver持续观测与定向回归复绿-候选.md`](../../dev_plan/drafts/DHR-B-35-driver持续观测与定向回归复绿-候选.md)。

<a id="review-b35"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-35 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->

> **本事件的复审总账**：四名 fresh 只读实例、三轮，**10 个独立议题：采纳 10 · 驳回 0**。§1 = 第一轮（`W-01`~`W-04`、`X-01`~`X-05`），§2 = 第二轮定向复审（`Y-01`，X-03 未到位），§3 = 第三轮对 X-03 的定向复核（PASS，无新增 P0/P1）。三轮均为机器强制只读（codex `gpt-5.6-terra` · `model_reasoning_effort=high` · `sandbox=read-only` · `approval=never`，经 `/codex` 插件 companion 从仓根派出），派出前后 git 基线一致证零写入。

## 0. 触发与授权

- **触发**：DHR_35 三轮独立复核（`wt/DHR_35@3836fd3`）后仍有两条收口阻塞：F-3517（真实 checkpoint 在现役 driver 下不可得）、F-3520（基线定向回归 5 红 + 一次 652s 挂死）；另 F-3516/F-3519（启动链静默停摆）未定位。用户 2026-09-01 两次裁决「先修 driver 再收 DHR_35」「另开卡修回归」。
- **主控对用户五问的建议**（2026-09-02 对话）：①卡序 Y 先 X 后；②X 的实录不给 DHR_35 消费；③F-3516/F-3519 拆出单独立卡；④DHR_30/31 历史证据只登记；⑤P6-X 补录挂 DHR_35 重开；另指出 P6-H 现有数字（Codex 150s / Claude 393s）分别含 60s 空等与 3m14s 停摆，不可用作判断。用户明文「**那就按你的建议走**」，授权起草与派审。
- **主控独立核出的事实**（起草时）：`store/state.mjs:8-14` 折叠规则已含 `checkpoint_recorded → running`，`store.mjs` 的 `openAttentions` 只装 fallback pause，`discovery.mjs` 按源头 `group` 分堆——因此「等超 Attention 可被后续事实覆盖」不需要新事件类型；master 上含原 Receipt UUID 的不止 DHR_31 两个文件，还有 `DHR_30/evidence/cli-smoke-20260828.txt`（合计 3 文件 23 处）。

## 1. 第一轮 fresh 只读审核（v1 → v2）

### 1.1 派出登记

| 复审者 | 形态 | 独立性 | 结论 |
|---|---|---|---|
| `b35rev1` | codex `gpt-5.6-terra` · high · `sandbox=read-only` · `approval=never` · cwd=仓根 | fresh，未参与起草 | **不通过**（4×P1） |
| `b35rev2` | 同上，同批拉起、互不可见 | fresh，未参与起草 | **不通过**（4×P1 + 1×P2） |

- 派出基线 `43e4af9`；回收后 `git status --porcelain` 仅为草案与 brief 两个未跟踪文件 —— **零写入取证通过**。
- brief：[`drafts/DHR-B-35-review-brief.md`](../../dev_plan/drafts/DHR-B-35-review-brief.md)。
- 两名各自打开了 `workflow-driver.mjs`、`state.mjs`、`relay.event.v2.schema.json`、`host.mjs`、`herdr-adapter.test.mjs`、`agent-node.test.mjs`、P6 DevPlan、backlog，并以 `git show wt/DHR_35:…` 只读核了 F-3516/F-3517/F-3519/F-3520 与候选原文。
- 两名的第三段均**未新增决定点**，只对草案自带的 D-B35-6 / D-B35-7 给判断。

### 1.2 裁决总表

| ID | 来源 | 级别 | 议题 | 事实核对 | 裁决 | 回写 |
|---|---|---|---|---|---|---|
| W-01 | rev1 | P1 | DHR_72「无墙钟上限」未证有界：`host.mjs` 持续续租、driver 持续运行，宿主长期 idle 无提交无 stop 时不是有界 | 属实。**主控自己说过头** | **采纳** | 改为如实登记的运行契约：长期 idle = 允许人工持有的运行态，人工 `stop` 是唯一业务出口；机器出口冻结五个（含出口⑤） |
| W-02 | rev1 | P1 | §2 把「折叠回 running」扩大成「看板 Attention 被覆盖」；`human_input_requested` 是不可撤销历史，未定位消费端 | 属实。**主控自己说过头** | **采纳** | §2 收窄为「折叠状态回 running + CLI 投影实证」；机器证 B 加 (iii) |
| W-03 | rev1 | P1 | DHR_71 绿闸未冻结每个等待的终止条件/进程级上限，三轮全绿可能靠偶然 | 属实 | **采纳** | 机器证 A 记 pass/skip/fail + 每文件时长；机器证 B 等待有界负例；文件级超时 |
| W-04 | rev1 | P1 | DHR_73 双出口与「定根因」目标不一致，(b) 会被误读为已修 | 属实 | **采纳** | 改「可复核的调查收口」；两种出口 F-3516/F-3519 保持 open |
| X-01 | rev2 | P1 | 缺 actor 失租/结束出口；`service.mjs` 区分 `actor-closed` 与不可放宽的 `lease-lost` | 属实 | **采纳**（并入 W-01） | 出口⑤：fail-closed 退出、零追加、晚交走 DHR_70 gate |
| X-02 | rev2 | P1 | skip 后的绿 ≠ 全绿 | 属实 | **采纳** | DHR_71 验收固定 skip=2、只能写「隔离 2 条 skip、其余全 pass」；DHR_72 收口 0 skip、55/55 |
| X-03 | rev2 | P1 | 允许路径不互斥：`herdr-adapter.test.mjs` 71/72 都可改；`workflow-driver.mjs` 72/73 都可改 | 属实 | **采纳** | v2：用例行冻结、`workflow-driver.mjs` 只归 DHR_72、DHR_73 不碰 `relay-core/**`（第二轮判仍不到位，见 §2） |
| X-04 | rev2 | P1 | DHR_73 中途升 heavy 违反「任务类型启动时冻结」 | 属实 | **采纳** | DHR_73 = normal 纯调查卡，修复另开卡 |
| X-05 | rev2 | P2 | 读模型显示未验证 | 属实 | **采纳** | 机器证 B (iii) |
| （理解风险） | rev2 | — | idle∧blocked 反例应有专门断言，不能只靠 DHR_69 套件总体绿 | 合理 | **采纳** | 机器证 G |

- 对 D-B35-7 两名均判「限定后不冲突」；对 D-B35-6 两名均要求先改写再交用户。

## 2. 第二轮定向复审（v2 → v3）

| 复审者 | 形态 | 结论 |
|---|---|---|
| `b35ver1` | 同形态，第三个 fresh 实例 · 基线 `43e4af9` | **不通过**（1×P1） |

- 9 条逐核：8 条到位；**Y-01（X-03 未到位）**：DHR_71 的 `test/helpers/**` 与 DHR_72 的 `fake-herdr.mjs` 重叠；`:510` 与 `:242/:279/:305` 共用 `runtimeFixture`（`:203-230`）；`:354` 用独立 `recoveryFixture`（`:335-352`）。→ **采纳**：helpers 排除 `fake-herdr.mjs`、共享夹具唯一归属 DHR_72、DHR_71 只改用例体，必须改夹具时登记移交。
- 三处独立核对均成立：①出口⑤与 `host.mjs:62-64`（`lease-lost` fence）/ `service.mjs:448-476`（只认 `actor-closed` 重建）兼容，不破坏 DHR_70 晚交路径，但测试须分别覆盖两种情形（已写进出口⑤）；②§2 读模型陈述属实（`store.mjs:648-651,1035-1074`、`state.mjs:8-14,55-62`、`discovery.mjs:175-180,193-216`）；③用例夹具切分不独立（即 Y-01）。
- D-B35-6 / D-B35-7 的 v2 措辞判**可交用户确认**。
- brief：[`drafts/DHR-B-35-verify-brief.md`](../../dev_plan/drafts/DHR-B-35-verify-brief.md)。零写入取证同上。

## 3. 第三轮定向复核（仅 X-03）

| 复审者 | 形态 | 结论 |
|---|---|---|
| `b35ver2` | 同形态，第四个 fresh 实例 · 基线 `43e4af9` | **PASS**，无新增 P0/P1 |

- 核实 v3 两卡路径互斥：`:510` 的等待在用例体 `:521/:533`，DHR_71 不动夹具即可改；`agent-node.test.mjs` 的 `:198/:231/:265` 用本文件 `untilAsync`，只依赖 `fake-herdr` 既有接口。DHR_71 在限制内仍能完成验收。
- brief：[`drafts/DHR-B-35-verify2-brief.md`](../../dev_plan/drafts/DHR-B-35-verify2-brief.md)。零写入取证同上。

<a id="understanding-b35"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-35 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->

## 4. 讲解、理解问答与用户确认（2026-09-02）

- **讲解要点**（对话中已讲）：v1 的「有界出口」说过头——宿主一直闲着、没人提交、没人 stop，driver 和租约会随 service 一直活，v2 改成如实登记「允许人工长期持有的运行态，人工 stop 是唯一业务出口」，并补 actor 失租/结束的 fail-closed 出口；「Attention 被覆盖」收窄为「节点折叠状态回 running」，历史事件不会消失，读模型没有独立 open Attention 对象、CLI 分堆由 group 派生；加负例守住 B-33。
- **理解问题**：「DHR_72 做完之后，如果一个真实 Agent 启动了、一直闲着不提交结果、也没人去 stop 它，这个节点会怎样？」
- **用户回答**：「**停在『等人』上，直到我 stop**」——正确；同时排除了「等一段时间后自动判失败」与「Attention 会被自动清掉」两条错解。
- **用户确认**：点选「**确认落盘**」，含 D-B35-6（不设墙钟上限、人工 stop 是唯一出口）与 D-B35-7（真实 working + checkpoint 才折叠回 running，不与 B-33 冲突）。
- **授权边界**：本确认只授权本次 DevPlan、backlog（`DHR-BL-18`）、审核工件与草案状态落盘，提交一笔 docs commit。**不授权** DHR_71/72/73 任一 D-start、生产代码改动、真实 Agent、DHR_35 重跑实录、用户级 registry/凭据读写、verify、合并、推送、部署或环境操作。
