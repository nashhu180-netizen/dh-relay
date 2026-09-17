# RLT_24 decision.1 — C1 整改 r1 合同缺口

- 分类：**CONSULT**（方向决策，待编排转交用户裁决；本文不批准合同变更）。
- Issue：#39；节点：C1；角色：decider#1；日期：2026-09-17。
- 核对现场：分支 `wt/RLT_24`，HEAD `7b10a1fe1d40a8b1e0a9e8d8fbb0a085c80d65ff`，本地 master `b41cd2d9e48814c93352f969a085971a60546565`；入场工作树干净。checker 报告绑定施工提交 `2dd5d77`，本次按当前文件重新核对，未复用其结论作为当前测试结果。
- 本棒只写本方案，不 rebase、不提交、不改代码、测试、计划或设计。依据 `dispatch/D-decider.md` 的仅允许自己的方案文件规则，完成信号置于本文末尾；不写 `progress.md`。

## 1. 事实与判定

阻塞来源为 `findings.md` F-C1-04、`progress.md` C1 整改 r1 / E-C1-07 与 `check.C1.md` P1 #1。`task_plan.md:34,76` 要求编排空间非 F 首有效节点在 add/lint 均退出 2。

当前 oracle 同时规定：

1. design/01 §3.4 控制事件表（L257）：阶段空间取相应阶段首有效节点，编排空间/worktree 取收口 F 阶段首有效节点。
2. §3.4 wire format（L301–328）：两类空间共用 `object_type=workspace` 和 `orchestrator#n/by=orchestrator`；四键闭集，不设扩展键；`object_id` 是实际资源标识，没有按空间用途区分的保留命名协议，且关闭后不要求资源仍存在。
3. A155（L1335）要求 writer/node 合法性校验和双入口拒绝；A157 / §12 要求两类空间失败事实取证；DevPlan `#### RLT_24` 明确本卡不修改设计正文、只实现冻结协议。

最小不可区分例：同一计划、同一既有账本前缀下，下一行均为 `node=C1, agent=orchestrator#1, by=orchestrator, event=resource_close, note="object_type=workspace object_id=ws-7 outcome=ok"`。若 ws-7 是 C 阶段空间，此行合法；若它是编排空间，此行应非法。其余顶层字段也可以完全相同，现有输入不携带使两种解释分叉的事实。node 本身是待校验声明，不能反过来证明资源用途；历史关闭行也不保证存在，不能作为首条记录的分类依据。

当前 `relay_log.py::_validate_close_node`（L2290–2328）对 workspace/pane 校验所指阶段首有效节点，对 worktree 校验收口 F 首有效节点；`_validate_close_row` 共用于关闭行校验。`test_relay_log.py:7210–7245` 的负例覆盖阶段空间 C2 与 worktree C1/W1，没有独立空间用途输入。故代码确实不能机械执行该编排空间判据，但把 `orchestrator-ws` 字面名称当作用途证据也不成立：checker 的例子证明合同覆盖缺口，不证明现有协议已提供可计算的分类信息。

这不是函数落点或 fixture 组织问题。补命名约定、增协议字段，或把机械拒绝改成人工纪律，都会改变冻结协议或验收边界，均属 CONSULT。C1 的既有 FAIL/BLOCKED 保持；不能删掉判据后自行宣称 PASS。

## 2. 可选方向（均待裁决）

| 选项 | 具体方案 | 代价与边界 |
|---|---|---|
| A：明确机械校验与写入纪律的边界（推荐） | 保持四键及三个 object_type 不变。设计明确：校验器只检查 node 存在且有效、workspace/pane 指向所声明阶段首有效节点、worktree 指向收口 F 首有效节点；实际资源与阶段的对应关系及编排空间必须取 F，由写入者按现场证据保证。A155 明确机械可核边界，A157/C4 明确两类空间的用途、关闭观察、实际 node/seq/object_id 对应证据。 | 保留当前协议与真实资源标识，改动较小；**明确降低原计划中编排空间误指 C1 的机器拒绝保证**，人工证据不能冒称 add/lint 能识别。须先经设计/验收调整批准，不能只改 task_plan。 |
| B：新增可校验的空间用途声明 | 经设计修订，示例增加仅 workspace 必填的 `workspace_scope=stage|orchestrator`，其他对象禁止该键；保留实际 object_id。共用解析器检验条件键，`_validate_close_node` 据 scope 选择阶段首节点或收口 F 首节点。 | 改四键闭集与 wire format；需重新冻结键条件、add/lint 同集、写入模板与兼容策略。已有不带 scope 的新事件如何处理必须明确，不能静默默认；旧 19 词/71 行兼容仍是硬要求。只可检验声明一致性，不能证明调用者没有虚报用途。 |
| C：规定 object_id 内的用途编码或维护可持久读取的资源映射 | 设计冻结无歧义的用途标签与实际 ID 编码，或提供供 add/lint 共同读取的持久映射；不能直接猜测现有名字。 | 表面保留四键，实质改变 object_id 语义或引入新权威输入。须处理冲突、旧标识、关闭后离线 lint 和映射生命周期；影响大于 A，且命名未承诺时不可启用。 |

推荐 A，理由是 RLT_24 的已登记目标为按观察记录关闭事实、定位失败并保持历史兼容；协议没有提供资源用途的机械证明。若用户要求继续保留“声明为编排空间但指向 C1 必须 add/lint 退 2”的机器保证，则推荐改选 B，不能让 A 暗中替代该保证。无论选哪项，均不扩张为资源关闭授权或自动删除能力。

## 3. 裁决后才可执行的交接方案

1. 编排转交上述取舍，请用户明确选择 A/B/C 或给出其它合同。当前没有 AUTO 代执行项。
2. 有权规划角色先完成设计/验收调整与必要范围授权，冻结 §3.4、A155、A157 及兼容策略的一致文本；RLT_24 当前禁改设计/DevPlan/skill，不能由本棒或 coder 顺手修改。是否需要独立规划工作项由编排按已有治理规则处理。
3. 以批准后的 oracle 同步本卡 brief/task_plan 与派单。若 A 获批：拆明机器拒绝用例与 C4 场景证据，保留原 P1 与其裁决留痕；C4 两个 fixture 各有明确用途来源，分别核阶段首节点与 F 首节点、失败行检索及待人工处置状态，不把 fixture 名称当解析规则。若 B 获批：在 `_close_note_fields`、`_validate_close_node` 与 `RelayResourceCloseTests` 增条件字段、缺值/非法值、scope=orchestrator 配 C1 的双入口退出 2 与字节不变反例，以及阶段/F 正例和批准的兼容用例。
4. coder 只按新派单完成整改；checker 对新候选与新 oracle fresh 核验，保留历史 FAIL，不覆盖为旧 SHA 已通过。需要运行的定向入口为 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests`，并按任务合同重跑完整 Python 与 PowerShell 回归。本文没有运行这些测试，不新增测试通过证据。

## 4. 范围外发现与证据勘误

F-C1-04 与 E-C1-07 引用了 `decision.1.md §2/§2.2`，但本次入场读取该路径返回不存在；本文是本棒首次创建的 CONSULT 建议，不能倒填成此前已有授权。应由原记录维护者后续勘误，保留时间线，不将本建议当作已批准 oracle。此问题不影响上面由 design/代码独立支持的不可区分性结论。

## 信号

DONE task=RLT_24 role=decider node=C1 status=CONSULT ts=2026-09-17T14:46:51+08:00
  summary: 冻结协议缺少空间用途判据；给出三项合同调整选项，推荐明确机器校验与写入纪律边界，待用户裁决；C1 保持 BLOCKED
  artifacts: decision.1.md
