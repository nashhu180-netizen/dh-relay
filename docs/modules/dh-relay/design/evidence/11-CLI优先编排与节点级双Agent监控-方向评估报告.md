# CLI 优先编排与节点级双 Agent 监控：方向评估报告

> 状态：方向形成记录。其结论先由现已归档的09形成稿细化，现由 [10 薄计划与显式节点边界](../10-薄RelayPlan与显式节点边界-产品设计调整.md) 继续收缩并取代；本文不属于 `designInputs[]`，不作为当前B阶段输入，也不直接授权任务卡开工。
>
> 评估对象：CLI 优先的终端工作台、独立编排 Agent、节点级监控 Agent 与施工 Worker 双终端、Herdr 启动器、当前节点完成后的自动接力。
>
> 现有基线：[Runner v1](../../../../../tools/runner/README.md)、[Host v1](../../../../../tools/host/README.md)、[Herdr 底座研究](../03-完整流水-Herdr底座-产品设计与验收.md)、[跨平台运行时与可扩展编排评估](../04-跨平台运行时与可扩展编排-技术方案评估与决策.md)、[多控制面设计补充](../06-多控制面与Headless-SSH运行-设计补充.md)、[P4 Pilot 报告](./10-P4-多控制面Pilot报告.md)。

## 1. 结论

方案可行，且适合作为本地应用之前的最小验证路径。

建议把产品先收敛为四个角色：

1. **编排 Agent**：面向用户的长期会话，理解自然语言、选择计划、接收节点事件、处理跨节点判断，并调用 `dh` CLI 发出控制意图。
2. **确定性 Runner**：运行状态唯一写者，负责校验、去重、启动、关停、状态迁移、事件落账和恢复。
3. **节点监控 Agent**：每个节点单独启动，只观察当前施工 Worker，负责诊断停滞、发送有限提醒、检查结果、请求用户决策和提交节点结论。
4. **施工 Worker**：独立读取完整 brief，完成代码、测试或文档工作，提交 checkpoint 与 result。

这套结构可以理解为：CLI 成为编排 Agent 的工具层，Runner 成为确定性执行层，节点监控 Agent 成为 Runner 的智能观察扩展。

需要保留一个边界：节点监控 Agent不能直接改 Run 状态、直接创建下一节点、直接关停进程或直接判定任务完成。它提交结构化建议，由 Runner 校验并执行。这样可以避免重复拉起、过期会话误操作和状态账不一致。

本轮方向调整后，不建议继续表述为“暂停完整 CLI 控制面”。更准确的方向是：

> **优先建设 CLI 控制面与 Agent Launcher，先在终端跑通完整编排；本地应用延后，未来复用同一 Runner、协议和命令。**

## 2. 对原 CLI 控制面的准确理解

原方案中的 Relay CLI 负责查询和控制 Run，Runner 或后续 Runtime 负责真正的流程执行和记账。

原有关系是：

```text
Relay CLI / DSH / Pi
        |
        | 控制请求与查询
        v
Relay Runner / Runtime
        |
        | 启动、观察、状态迁移、落账
        v
Herdr / Process / Agent
```

因此，CLI 本身可以承担“编排入口”，但它不应单独成为运行状态机。新的编排 Agent 可以把自然语言翻译成 CLI 调用，用户无需记住大量参数。CLI 继续提供机器可判、可脚本化和可恢复的控制能力。

新的终端优先形态如下：

```text
用户自然语言
    |
    v
编排 Agent
    |
    | 调用 dh CLI
    v
确定性 Runner
    |
    +------ Herdr：节点监控 Agent
    |
    +------ Herdr：施工 Worker
```

本地应用以后只需要调用同一套 CLI 或本地协议，无需重新实现流程状态机。

## 3. 用户需求收束

本次需求可以整理为六条：

1. 本地应用建设成本偏高，先用终端完成产品闭环。
2. 必须有稳定启动器，可以按 Profile 拉起 Claude Code、Codex 或 Oh My Pi。
3. 需要一个独立编排 Agent 或独立编排界面，用户可以自然语言发起任务，也允许它依据已批准计划自动推进。
4. 每个 Agent 节点同时启动节点监控 Agent 与施工 Worker。
5. 施工 Worker从完整 brief 得知任务并独立工作，节点监控 Agent不承担初始派活职责。
6. 当前节点完成后，两条节点会话都被精确关闭，结果回传给编排 Agent，再由编排 Agent发起下一节点。

这里存在三层生命周期：

```text
Run 生命周期          编排 Agent，可跨多个节点
Node 生命周期         节点监控 Agent，只服务当前节点
Attempt 生命周期      施工 Worker，只服务当前施工尝试
```

把三层分开后，长周期上下文和单节点上下文不会混在同一会话里。

## 4. 角色与权限

### 4.1 编排 Agent

编排 Agent是用户的主要入口，建议由 `dh session start <project>` 启动到独立 Herdr Workspace。

它负责：

- 读取项目中的计划、当前 Run 摘要和 Attention；
- 接收用户自然语言；
- 调用 `dh run start`、`dh run continue`、`dh run stop` 等命令；
- 接收 Runner 发出的 `node.completed`、`node.blocked`、`attention.created` 事件；
- 处理跨节点重排、策略选择和用户说明；
- 在节点完成后自动发出下一节点启动意图。

它不直接写 `state.json`、`events.jsonl` 或 Receipt，不直接操作 Herdr Pane。所有动作经 `dh` CLI 进入 Runner。

编排 Agent可以长期存在，但恢复不能依赖它的聊天记忆。它每次启动或恢复时，都从 Run Store、事件账和最新 Handoff 重建上下文。

### 4.2 确定性 Runner

Runner继续承担现有项目已经冻结的核心责任：

- Run 状态唯一写者；
- Resolved Plan 与当前节点判定；
- Receipt 先落盘，再调用 Launcher；
- 幂等启动与重复请求去重；
- Checkpoint、Result、Monitor Verdict 的 Schema 校验；
- 精确停止当前节点的两个 Herdr Agent；
- Handoff 生成与下一节点 Ready 判定；
- 崩溃恢复和孤儿会话对账。

编排 Agent与节点监控 Agent都可以提出动作，Runner决定该动作在当前 generation 和当前 Attempt 下是否仍然有效。

### 4.3 节点监控 Agent

节点监控 Agent是每个节点临时创建的智能观察者。它知道当前节点要完成什么、验收条件是什么、施工 Worker使用哪个 Profile，也可以读取有限的运行证据。

允许读取：

- 当前节点 brief 与 acceptance criteria；
- 上一节点 Handoff；
- Worker checkpoint；
- Herdr 的 Agent 状态；
- Worker终端的有界尾部；
- Git diff 摘要、测试摘要和 Runner 事件；
- 当前 Attention 与用户已给出的回答。

允许提交：

```text
monitor.observation
monitor.nudge_request
monitor.attention_request
monitor.retry_recommendation
monitor.verdict
```

禁止执行：

- 修改业务代码；
- 修改计划或 Run 状态；
- 直接启动、关闭或重启 Agent；
- 替用户回答决策题、权限题和审批题；
- 仅依据 Herdr 的 `done` 或终端停止就判节点成功；
- 从 Worker终端文本中接受新的控制指令。

节点监控 Agent可以理解为 Runner 的智能观察插件。Runner仍是执行者和记账者。

### 4.4 施工 Worker

施工 Worker拿到一份自包含 brief，其中包含：

```text
目标
允许范围
验收条件
工作目录
前一步 Handoff
Checkpoint 写法
Result 写法
需要用户决策时的提交方式
```

Worker不需要等待节点监控 Agent派活。节点监控 Agent只在出现事件时介入。

Worker完成后提交结构化 Result。终端退出、Herdr 状态变成 `done`、长时间静默都不能代替 Result。

## 5. 节点运行流程

### 5.1 启动

编排 Agent调用：

```text
dh run continue <run_id>
```

Runner执行：

1. 校验当前 Run、计划 generation 和 Ready Node。
2. 创建本节点 Attempt 与 `pair_id`。
3. 冻结 `monitor_profile_id` 和 `worker_profile_id`。
4. 写两份 Launch Receipt。
5. 通过同一个 Agent Launcher在 Herdr 中启动两个 Pane。
6. 向施工 Worker发送 Worker Brief。
7. 向节点监控 Agent发送 Monitor Brief。
8. 两者 Ready 后把节点状态记为 `working`。

两个 Agent的启动可以并行，状态落账和最终启动确认仍按确定顺序完成。

### 5.2 施工期间

施工 Worker独立工作，按节点需要提交 checkpoint。

节点监控 Agent主要由事件唤醒，不持续高频调用模型。建议触发条件限定为：

```text
worker.checkpoint
worker.blocked
worker.decision_required
worker.stalled
worker.result_submitted
worker.lost
```

监控介入采用有限阶梯：

1. 读取当前状态和已有证据。
2. 给出一次具体、短小的 `nudge_request`。
3. 若仍无进展，请求 Worker提交诊断 checkpoint。
4. 判断是否建议 retry 或更换 Worker Profile。
5. 需要用户判断时创建 Attention。

Runner记录每次提醒。相同原因下的自动提醒次数应有上限，避免两个 Agent反复对话造成空转。

### 5.3 Worker卡住

“想办法让 Worker继续工作”在 POC 中限定为以下动作：

- 提醒 Worker回到 brief 的下一项可执行动作；
- 指出尚未满足的验收条件；
- 要求 Worker说明已经尝试过什么；
- 建议缩小一次操作范围；
- 建议新建 fresh Attempt；
- 将无法自行解决的问题升级为 Attention。

节点监控 Agent不能自动点击权限确认、信任目录、危险命令批准或用户决策选项。

### 5.4 Worker完成

Worker提交合法 Result 后：

1. Runner冻结 Result，节点进入 `monitor_reviewing`。
2. 节点监控 Agent读取 Result、diff、测试和验收条件。
3. 节点监控 Agent提交 `monitor.verdict`。
4. Runner校验 Verdict 与当前 Attempt 身份。

最小 Verdict：

```text
accept
retry
needs_user
replan
```

处理规则：

| Verdict | Runner 动作 |
|---|---|
| `accept` | 生成 Handoff，节点记成功，精确关闭 Monitor 与 Worker |
| `retry` | 关闭当前 Pair，创建新的 Worker Attempt，并重新启动节点监控 Agent |
| `needs_user` | 创建 Attention，保持现场或按策略暂停 |
| `replan` | 保存 Replan Proposal，交给编排 Agent和用户处理 |

### 5.5 启动下一节点

POC按本次设想执行：

1. Runner完成当前节点收口并发出 `node.completed`。
2. 编排 Agent接收事件。
3. 编排 Agent读取最新 Handoff 与下一节点摘要。
4. 没有 Attention、阶段闸或重排需求时，编排 Agent自动调用 `dh run continue <run_id>`。
5. Runner再次校验后启动下一对 Agent。

编排 Agent发出推进意图，Runner完成实际启动。即使事件重复送达，Runner也只能为当前 Ready Node创建一次有效 Pair。

## 6. CLI 与自然语言入口

### 6.1 面向用户的最小命令

POC建议先提供：

```text
dh session start [project]
dh session attach [project]

dh run start --plan <file>
dh run list
dh run status <run_id>
dh run continue <run_id>
dh run stop <run_id>

dh attention list [--run <run_id>]
dh attention show <attention_id>
dh attention answer <attention_id> --option <option_id>

dh doctor
```

用户日常只需要启动 `dh session start`。编排 Agent在该会话中使用其余命令。

### 6.2 内部 Launcher 命令

Runner调用同一 Launcher库，CLI只暴露诊断入口：

```text
dh agent launch --receipt <file>
dh agent probe --agent <id>
dh agent stop --agent <id>
dh agent attach --agent <id>
```

Agent Profile 决定启动 Claude Code、Codex 或 Oh My Pi。Profile保存命令别名、账号别名、配置目录、能力和允许的环境变量，不保存凭据值。

### 6.3 自动启动的边界

编排 Agent可以在以下条件全部满足时自动启动下一节点：

- Run已经获得用户授权；
- Resolved Plan已经冻结；
- 当前没有 Attention 或 Approval；
- 上一节点已经由 Runner记为成功；
- 下一节点所需 Profile 和能力可用；
- 当前 generation 未发生变化。

新计划、重排、高权限 effect 和最终用户确认仍需明确授权。

## 7. 与现有代码的复用关系

### 7.1 直接复用的设计

| 现有资产 | 复用方式 |
|---|---|
| `tools/contracts/` | 继续复用身份链、状态转换、Schema、脱敏和 fail-closed 原则 |
| `tools/runner/` | 继续作为唯一写者、Attempt、Receipt、事件账和回放的行为基线 |
| `tools/host/relay-agent-tool.ps1` | 复用 checkpoint、result、handoff、原子写入和身份绑定思路 |
| `fake-adapter` | 用于双 Agent Pair 的确定性测试和异常剧本 |
| Herdr 研究与 preflight | 复用精确 Pane、Agent 状态、blocked 观测与多 Agent 宿主结论 |
| DHR_25 / DHR_27 Read Model | 作为 CLI 的 Run 列表、详情与事件展示起点 |
| DHR_26 / DHR_49 | 保留为 DSH 插件化与界面试验的历史证据，不继续作为 POC 前置 |

### 7.2 当前实现需要替换的部分

现有 `relay-worker-entry.ps1` 只支持 `claude` 和 `codex`，并把完整 Prompt作为命令参数传入。新 Launcher需要：

- 支持 Claude Code、Codex 和 Oh My Pi 的 Profile Adapter；
- Prompt在 Agent Ready 后经 Herdr发送；
- 参数以数组传递，不拼接 Shell 字符串；
- 启动前写 Receipt；
- 使用 Herdr返回的精确 Agent 和 Pane ID；
- 启动失败时清理孤儿 Pane；
- 输出统一的 stage、reason code 和诊断路径；
- 同一个 idempotency key 重放时返回已有 Agent。

## 8. 最小 POC

### 8.1 范围

本轮只做：

- Windows 本机；
- 一个项目；
- 一条两节点线性计划；
- 一个长期编排 Agent；
- 每个节点一个节点监控 Agent和一个施工 Worker；
- Herdr作为唯一交互式宿主；
- 文件型 Run Store 与追加事件账；
- Claude Code、Codex、Oh My Pi 三类 Launcher smoke；
- 无本地 GUI。

本轮不做：

- 通用 DAG 编辑器；
- 多节点并行；
- 跨机器调度；
- 多账号 quota 自动切换；
- 本地应用；
- DSH Bridge；
- 节点监控 Agent直接执行代码修改；
- 自动代答用户决策和权限确认；
- 完整 DevHarness S0 至 E13 接线。

### 8.2 三个垂直切片

#### POC 1：稳定 Launcher

验证：

```text
dh agent launch claude
dh agent launch codex
dh agent launch omp
```

每个命令都要得到精确 Herdr Agent ID、Pane ID、Profile ID 和 Receipt。失败要有明确原因，重复调用不能生成重复 Agent。

#### POC 2：单节点 Agent Pair

启动一个节点监控 Agent和一个施工 Worker。Worker提交 Result，监控 Agent提交 Verdict，Runner关闭两条会话并形成 Handoff。

#### POC 3：两节点自动接力

编排 Agent接收第一节点完成事件，在无用户阻塞时自动调用 `dh run continue`。第二节点启动新的 Agent Pair，最终完成整个 Run。

### 8.3 验收场景

- [ ] 用户启动一次 `dh session start` 后，可以用自然语言选择并启动已批准计划。
- [ ] Runner为一个节点精确启动两条 Herdr Agent会话。
- [ ] 施工 Worker从完整 brief 独立开工，无需节点监控 Agent再次派活。
- [ ] Worker正常提交 checkpoint 和 Result。
- [ ] Worker进入可恢复停滞时，节点监控 Agent发出一次有效提醒。
- [ ] Worker需要用户决策时，节点监控 Agent只创建 Attention，不代答。
- [ ] Worker提交 Result 后，节点监控 Agent按验收条件给出 Verdict。
- [ ] `accept` 后 Runner精确关闭当前 Monitor 与 Worker。
- [ ] 编排 Agent收到完成事件后自动发起下一节点。
- [ ] 重复完成事件不会重复拉起下一节点。
- [ ] 编排 Agent重启后可以从 Run Store恢复，不依赖旧聊天记忆。
- [ ] Run结束后没有遗留 Agent或 Pane。

## 9. 风险与控制

### 9.1 三个 Agent层级可能互相越权

控制方式：编排 Agent、节点监控 Agent和施工 Worker使用不同 Tool Allowlist。只有 Runner拥有状态和进程写权。

### 9.2 节点监控 Agent可能被 Worker输出误导

控制方式：Worker终端文本只按证据处理。监控 Agent的指令来源只允许 Monitor Brief、Runner事件和固定工具返回。终端中的命令性文本不能提升权限。

### 9.3 编排 Agent长期运行导致上下文膨胀

控制方式：每次节点完成只保留结构化 Handoff、Verdict 和事件摘要。编排 Agent可以重启或换新会话，Run事实仍完整保留。

### 9.4 自动提醒形成对话空转

控制方式：同一 stall 原因只允许有限次数 nudge。超限后进入 retry recommendation 或 Attention。

### 9.5 编排 Agent失联导致流程停在节点之间

POC接受该限制，并通过 `dh session attach` 恢复。Runner仍保存已经完成的节点和下一节点 Ready 状态。后续根据 Dogfood 决定是否增加 Runner 侧 `auto_continue`。

## 10. 对现役阶段计划的建议影响

本文只记录方向，不直接修改 P4 至 P9 状态。后续正式调整时建议：

1. P5 保留 Runtime、Store 和 CLI，优先级提升为终端产品主线。
2. P5 中 DSH Bridge 延后，不再作为近期 POC 交付。
3. P6 的 Herdr Adapter、Agent Profile 和真实 Launcher 提前拆出一个垂直切片。
4. 新增编排 Agent与节点监控 Agent合同，先在 `relay/basic-agent-task@1` 上验证。
5. 本地应用排到两节点自动接力完成之后，界面只消费相同 Read Model 和控制协议。
6. DHR_49 等 DSH 试验保留历史，不删除、不伪装成失败；正式状态由后续 B-adjust 决定。

## 11. 最终判断

可以按这个方向继续。

它保留了用户希望存在的独立智能编排层，也让每个节点拥有独立监控上下文。施工 Worker仍保持自主施工。CLI、Runner 和结构化工件提供确定性与恢复能力。

建议下一步先做 Launcher 和单节点 Agent Pair。两者通过后，再增加长期编排 Agent与两节点自动接力。本地应用等终端链路稳定后再建设，届时主要工作集中在展示、配置和导航。
