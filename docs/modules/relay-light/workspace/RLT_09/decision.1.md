<!-- dh:v1 -->
# decision.1 — RLT_09 W 阶段 oracle 冲突

- 决策者：`rlt09-decide`；日期：2026-09-13；Issue：#18；分支：`wt/RLT_09`；审核候选：`aaa2700`。
- 总分类：`kind=consult`，等待用户逐项裁决；本文是选项建议，不是生效合同、W PASS 或施工授权。
- 依据：`dispatch/README.md`、`dispatch/decide.md`、`review.plan.md`、`findings.md`、`progress.md`，design/01 §3.5、§4.5、§9.4、§11、§14 第 6 项，DevPlan §RLT_09；实现仅做静态核对，未运行行为测试。
- 共通边界：本棒只写决策文件与 progress 完成信号，不改代码、task_plan、design/dev_plan。正式验收 ID 不新增、不删除、不重编号、不改标识；对既有 ID 的描述/测试措辞作澄清同样属于 oracle 调整，不能以“ID 没变”推定已有授权。设计与验收不属于运行中绕过 B-adjust 的例外。下文 design A-adjust 指由编排在接力外按 design §4.5.3 的 A-full／A′ 路径取得确认并同步权威工件，必要时同步 DevPlan；本棒不自行加载或执行该流程。

## ① F-001 / P1-01：失败记录与 A122 三类路径闭集

**分类：`kind=consult`（方向决策）。** design §4.5.2 要求 planner-amend 在输入方案文件写「超出范围」，而该文件不在 relay_plan、DevPlan、改前 cards 已登记卡 task_plan 三类路径中；A122 对实际变更集仍要求三类白名单子集。把方案文件从 diff 偷滤掉、让它“只写注释”、称其非业务文件，都不能消除实际第四类路径。§9.4 的“不改任何文件”与“在方案文件里写”也必须同步消歧。

| 选项 | 具体语义 | 授权与代价 |
|---|---|---|
| A：受限增加失败记录例外 | 成功分支仍只允许原三类；禁区拒绝分支计划目标文件零变化，仅允许向本次输入的、预先存在的一个方案文件末尾追加一段「超出范围」及原因。不得改写原内容、另建方案文件、开放 workspace 通配；输入落在 design 禁区时仍不得写入。 | 必须 design A-adjust，同步 §4.5.2/§4.5.3、§9.4、A122、§14 及 DevPlan 的“三类”描述。A122 ID 保留，但验收须分别验证成功闭集与拒绝例外，增加内容级追加校验和路径约束证据；维护成本较高。不能声称仍满足原版三类闭集。 |
| B：保留三类闭集，失败原因走完成记录（推荐） | 删除 planner-amend 写方案文件的要求。命中禁区时全部计划目标文件及输入方案文件均零变化；由 planner-amend 的普通 `done.note` 承载「超出范围」及原因，终端可同步显示；monitor 按既有职责记录 `stage_result outcome=blocked`，编排转交用户。planner-amend 不写 blocked/escalate，也不伪造成功 plan_amend。 | 必须 design A-adjust，同步上述各处失败记录措辞，并在 A122 明确改前/改后取集覆盖 planner-amend 的计划文件改动，正常账本事件由既有账本合同单独取证，不能悄悄从全仓 diff 排除。保留 A122 ID、三类路径与整份拒绝；代价是失败原因不再内嵌原方案，须以方案文件名关联 durable done/stage_result 证据。 |
| C：暂不改正式 oracle，取得精确单次豁免 | 用户明确选择 A 或 B 的替代行为，逐条指定本卡暂不满足的原文、适用分支、证据与后续补齐责任；或不豁免而保持 BLOCKED。 | 必须用户对话明确豁免，不能推定为仓库 GitHub-flow 豁免。若暂不走 design A-adjust，原合同冲突仍在，证据只能标“按豁免执行”，不能报原版 A122 逐字 PASS；后续 RLT_16/RLT_19 不自动继承。正式合同闭合仍需 A-adjust。 |

**推荐 B，待用户决定。** 它保留最关键的路径闭集与拒绝时零计划改动，失败信息进入既有 durable 账本。但 `done.note` 是待批准的新记录约定，不是当前 oracle 已有答案；需明确账本写入与计划差分的取证边界，不能把问题转移成隐藏账本 diff。若用户优先要求在方案旁查看失败原因，可选 A，但必须批准那一个输入文件的精确例外。

**交回编排的闭合条件：** 先取得 A/B/C 的明确选择和相应授权，同步权威 oracle，再由 builder 改 B4 程序、模板和反例判据并重新 plan-review。禁区与白名单混合请求必须证明所有计划目标文件零变化；A 另证只有允许的单一追加，B 另证输入方案零变化且失败账本记录可追溯。`review.plan.md` P1-02 的改前快照、既有 dirty 同路径二次修改、tracked/untracked 与 actual/proposed 精确集合问题仍由 builder/audit 独立闭合，本决定不代替它，也不解除 W FAIL。

## ② P1-03：A121「仅追加节点行」与 A75 合法计划约束

**分类：`kind=consult`（oracle 措辞决策）。** A121 两列均要求第一次 status 后仅追加新阶段节点行；B3 却同时追加 agent 行。现状 `_runtime_plan()` 调用 `lint_plan()`，后者对无 active agent 的节点报 A75，runtime 将该输入错误映射为退出 3，因此不能得到第二次 status 成功输出。预挂未来节点 agent 也会被 A24（agent node 不存在）拒绝；借 superseded 节点复用节点号又触犯 A46。当前未找到既保持两次计划合法、又仅追加全新节点行的 fixture，不能用失败输入冒充目标行为 RED。

| 选项 | 具体语义 | 授权与代价 |
|---|---|---|
| A：澄清为追加合法计划行（推荐） | 将 A121 两列的“仅追加新阶段节点行”明确为“仅修改同一计划文件，追加新阶段节点行及保持计划合法所必需的对应 agent 行”；两次调用之间不修改 relay_log.py、不改账本、不增加其它无关输入。第一次和第二次 status 均成功，新阶段实例出现且按计划排序，另证非固定 WCRF 顺序。 | 必须 design A-adjust 或用户明确授权的 oracle 澄清并同步 design A121 与 DevPlan/brief/B3 引用；ID 保持 HC-RL-A121，A75 及其它 lint 硬约束不变。代价仅为合同与 fixture 同步，无需为本冲突改变 status/lint 产品语义；两次调用之间的“不改代码”仍须保留取证。 |
| B：保留字面 oracle，改变运行时容忍度 | 让 status 在新节点没有 active agent 时也输出新阶段，例如绕过 A75 或自动补 agent。 | 属于产品行为变化，必须 design A-adjust，重新协调 §3.5、A75、A121 与 DevPlan A120 的 A75 回归承诺，另取得实现范围授权；不新增或重编号 ID 也不能免除语义变更确认。代价是扩大 status/lint 差异或引入隐式配置，可能掩盖坏计划，不推荐，现授权下不可执行。 |
| C：仅豁免本次测试措辞或继续找合法反例 | 用户明确允许本卡用“节点 + 必要 agent 行”替代原字面步骤；否则保留 BLOCKED，仅在有人提供两次 status 均成功、无预挂非法 agent/节点号复用/旁路 lint 的逐字 fixture 后重审。 | 单次替代须用户明确豁免；没有正式 A-adjust 时只能记录 A121 原文未逐字满足，不能报无条件 PASS，后续仍须同步 oracle。继续找 fixture 不需改 oracle，但目前没有可执行证据，不能据此解锁 W。 |

**推荐 A，待用户决定。** A121 的目标是证明 status 重读并按计划派生阶段，合法性所需 agent 行应明确写入操作步骤；这样同时保留 A75 和 A120 的交接约束。不要为了得到第二次 status 退出 0 而放宽 A75，也不要把现有 B3 写法视为已获批准。

**交回编排的闭合条件：** 用户选定后先同步 oracle，再由 builder 修改 B3 与 brief 引用，audit 重新核对同目录两次真实 status、新实例与顺序断言、非 WCRF 顺序及 A75 拒绝回归。两项推荐均未生效；本棒只交付 CONSULT，不解除任何施工、W 审核、verify 或人验闸。
