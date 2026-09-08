<!-- dh:planning-event:v1 id=DHR-A-34 stage=A-full artifact=design/15-Herdr-Agent单一启动内容与有限重发.md review=evidence/52-A34-instruction-ref执行语义-交叉审核记录.md#review-a34--fresh-只读审核 understanding=evidence/52-A34-instruction-ref执行语义-交叉审核记录.md#需求理解 -->
# Herdr Agent 单一启动内容与有限重发

> DHR-A-34 正式设计：用户在 2026-09-08 确认保留 A33 最小闭环，并补齐 `instruction_ref` 的明确执行语义。已完成 fresh 审核、裁决、理解问答与整版确认。本文件继续属于 README 的正式 designInputs；设计生效不代表代码已实现或真实运行已通过。

## 1. 目标和取舍

当前 P6 只做一件事：任务指针与 Receipt 提交说明合成一份启动指令，经同一个发送者交给 Herdr；首次明确 accepted 后等 60 秒，仍无当前 Attempt 进展时向同一 Agent 原样补发一次。

自动补发只服务于同一存活 driver/Actor 中的正常启动。Runtime/driver 恢复或 Actor 被接管后，已有 Attempt 不自动重新发送启动指令；继续现有观测和 Receipt-bound 提交，未完成时提示人工处理。新 Attempt 仍只能由已有显式控制面创建。本设计不实现跨恢复续算补发资格。

具体代价：若首发已占用次数、尚未实际调用 Herdr 就崩溃，旧 Agent 可能完全没有收到任务。恢复 Attention 必须明示“启动内容可能未送达，本 Attempt 不再自动发送”。已收到指令的 Agent 可以继续提交；未收到的不能假定会自然完成。操作员需检查现场，必要时通过既有 stop 控制面停止旧执行，再显式发起新的执行；确认旧执行停止前不并发新建同任务 Agent，不自动代提交或绕过次数限制。

这保留“最多两次物理调用”，不承诺任务副作用恰好执行一次。已获发送授权后才出现 checkpoint 的窄竞态仍按用户已选方案 A 完成该次调用；不得称为零竞态。

## 2. 最小实现合同

### 内容来源

- 当前 P6 Herdr node 增加 `instruction_ref={path,sha256}`；path 解析到当前 Runtime canonical repoRoot 内的文件，摘要匹配才可启动。校验在创建 Attempt/调用 Herdr 前完成。
- 启动指令仅包含当前仓根、instruction_ref、当前 Attempt 的 Receipt 提交命令和固定提示；业务内容留在被引用文件。固定提示必须明确顺序：先打开指针文件、把其正文作为本 Attempt 的唯一业务任务并执行，随后按真实结果提交；Receipt 命令只规定结果提交方式，不是业务任务。任务实际完成才提交 `succeeded`；业务任务执行失败或指针无法读取/使用均按既有 `failed/E_EXECUTOR_REPORTED_FAILURE` 报告交付失败，并由诊断证据区分成因。无须增加独立 workspace 字段，不从 `docs/modules/...` 路径猜任务身份，也不要求 Agent 重算 SHA-256。
- P6 保留现有节点完成与停止行为；本设计不引入 Ticket、`node_closed` 协议或新 stop_after 枚举。design/10 的未来 Ticket 合同仍留在其原阶段，本卡不做映射接口或 fixture。
- driver 生成一次启动内容，Host Adapter 是唯一物理 sender；启动、恢复、解除 blocked 三处旧 completion-only 发送改为统一入口。blocked 时不发送，解除后只有尚未发送的新 Attempt 可首发；恢复的旧 Attempt 不因此重发。

### 发送与进展

- 首次发送前，通过现有 Actor/Store 写队列记录该 Attempt 的发送次数为 1；持久写成功才调用 Herdr。第二次发送前同理记录为 2。次数只增不减，并发请求不能占用同一次数；保留现有 lease/fencing 检查。
- 只新增一个私有发送记录，复用 Store 既有原子写入能力；最小内容为版本、Attempt/Receipt 关联、已占用次数、绑定 host_ref、prompt_digest 和有限 outcome。不建新的事务框架，不扩展公开 event/RPC/read-model，不保存 prompt、业务正文或凭据。私有记录跟随现有 Run 保留策略，无额外快照或版本目录。
- 首次明确 accepted 后，在当前 driver 内用单调时钟等待 60 秒；固定值，测试可注入时钟。deadline 与观测/续租并行，不得用阻塞等待卡住轮询或 Actor。补发用同一内存中的 prompt，并校验摘要、源文件摘要与 Agent 身份。无内存原件或身份/源文件不匹配时停止自动发送。
- 补发资格检查与次数从 1 增至 2 在同一个 Store 串行写任务中完成：检查当前 Attempt/Receipt 的 checkpoint 集合、Result 和终态，任一进展或结束均拒绝补发。只认 Artifact/Store 身份关系，不用 `node_started` 或 event seq 游标判断 Agent 进展。
- 当前 checkpoint 在同一 Store 队列中先登记集合，再写工件和事件；即使工件/事件写失败，观察到的 checkpoint 仍足以保守禁止补发。异常/损坏/关系不可证同样不发送。此处不改 checkpoint/Result 提交算法，不承诺修复其通用原子性。
- 次数写入成功是发送授权点；外部 Herdr 调用在 Actor 队列之外执行，不阻塞续租。每次调用前后复用 host_ref/身份检查；失租、停止或身份不符时不得调用。授权后的新进展不撤销次数，也不允许第三次调用。
- 显式发送错误、超时、写失败、重启/接管或结果不明均停止自动补发。两次后仍无进展由现有 Attention/人工等待路径处理；重启不能把次数清零或恢复补发资格。已有 Result 按现有完成路径处理，不额外制造等待。

### 证据与测试

- 测试用同一 fake Herdr 调用记录检查次数、内容相等与顺序；报告只提取次数、摘要匹配布尔值、身份匹配布尔值、是否有进展、outcome 等安全值。无法重建精确顺序就明确不可证。
- 不定义 timeline/v2，不让 checkpoint/Result 为展示增加写入；人验用安全测试摘要展示行为即可。
- 反例覆盖双 sender、并发占次、进展已存在、迟到进展、blocked、身份变化、源文件变化、失租/stop、发送前后崩溃、恢复不重发、两发上限。使用有界故障注入/恢复测试，不要求每一场景都修改生产代码做变异。
- 保留既有 heavy 复核配方与代码轮 2 独立选取一个关键生产变异点；不再额外要求全场景变异矩阵。变异须断言失败，还原后绿。

## 3. 当前验收清单

本版当前验收项为 HC-SD-A9..A16/H3/H4。A13..A16/H4 是 A34 对已确认 A33 合同的增量；旧 A31/A32 命题已由本版取代，不能计入当前 pass；design/10 的验收项保持其原阶段范围。

| ID | 类型 | 命题与验证 |
|---|---|---|
| HC-SD-A9 | 机器证 | P6 唯一指令来源、一个 sender、完整提交说明；无第二 prompt、无固定 workspace 目录依赖；缺失/越界/摘要变化拒绝。静态调用检查及正反例验证。 |
| HC-SD-A10 | 机器证 | 同一存活 driver 内首次 accepted 后等 60 秒，无当前 Attempt checkpoint/Result 才原样补发一次；同队列占次，授权前进展拒绝，授权后进展竞态如实说明。fake 调用与并发测试验证。 |
| HC-SD-A11 | 机器证 | 次数发送前持久占用且不可回收；首发占用后、调用前崩溃恢复须显示可能未送达，恢复/接管、异常或身份不可证不自动补发；永无第三发，计时不阻塞观测/续租，现有 Receipt-bound 完成/lease/fencing 不退化。故障注入与恢复测试验证。 |
| HC-SD-A12 | 机器证 | 私有记录字段封闭且不含正文/凭据，沿用 Run 保留策略；不新增公开协议、timeline 写入或 checkpoint/Result 事务重构。字段负例与代码范围检查验证。 |
| HC-SD-H3 | 人判 | AI 展示正常首发、60 秒无进展补发、已有进展不补发、首发占用后调用前崩溃四例安全摘要；最后一例须展示可能未送达、旧 Attempt 不再自动发、检查现场并经现有 stop/显式新执行处理。用户在 5 分钟内判断简化后的行为和人工代价是否可接受。 |
| HC-SD-A13 | 机器证 | 启动包络明确规定“打开指针 → 执行文件任务 → 按实际结果提交”的顺序，并明确 Receipt 命令不是业务任务；快照断言验证完整文本与顺序。 |
| HC-SD-A14 | 机器证 | 任务正文仍不进入启动 prompt、发送记录、公开协议或证据；指针缺失/越界/摘要变化继续在 Attempt/Agent 前拒绝，敏感形态扫描为 0。 |
| HC-SD-A15 | 机器证 | fake 正反例证明唯一 sender 发送同一包络、外围调用为 0、正文不复制；既有 A10/A11/A12 回归保持自然终态绿色。本项不声称 sender 能观察或强制业务副作用。 |
| HC-SD-A16 | 机器证 | DHR_35 在修复后的同一 committed SHA 上分别用真实 Codex 与 Claude Profile 完成 task-file 读取/执行、checkpoint、Receipt submission、committed succeeded Ack、Result 与 `attempt_succeeded`；每条实录以 wrapper 的现有安全 stage 字段作为具体 task side effect，证明 `wrapper_invoked=true` 早于 succeeded Ack，不接受 Agent 自述或通用账本成功替代；只保留脱敏证据。 |
| HC-SD-H4 | 人判 | AI 展示 DHR_35 修改前 Codex committed failure 与修改后 Codex/Claude committed success 的安全对照，列出实际发送次数、外围 prompt 数、task side effect、Ack/Result 和失败处置；用户判断“指针不复制正文”的日常行为是否清楚、够简单。 |

## 4. 旧版追踪与计划承接

A31/A32 的原文与审核结论保留在 [A31 形成史](drafts/DHR-A-31-单一启动内容与有限重发-候选.md)、[A32 形成史](drafts/DHR-A-32-startup-progress游标与补发线性化-候选.md) 和对应 evidence；本版不抹去历史，也不要求旧版能力先实施。

- HC-SD-A1、HC-SD-A2 → HC-SD-A9：superseded-before-implementation；删除未来 Ticket 配套与固定 workspace 来源。
- HC-SD-A3 → HC-SD-A10、HC-SD-A12：superseded-before-implementation；删除跨恢复 prompt 重建要求。
- HC-SD-A4、HC-SD-A5、HC-SD-A8 → HC-SD-A10、HC-SD-A11、HC-SD-A12：superseded-before-implementation；删除进展游标、跨恢复计时、checkpoint/Result 重构与全场景变异矩阵。
- HC-SD-A6、HC-SD-A7 → HC-SD-A9、HC-SD-A10、HC-SD-A11：superseded-before-implementation；同身份、唯一 sender、Receipt-bound 完成和重复续做边界由精简合同承接。
- HC-SD-H1、HC-SD-H2 → HC-SD-H3：superseded-before-implementation；不再要求 timeline 协议。

未实施的 startup-dispatch v1/v2 与 timeline/v2 不再是本卡实施目标；不建设它们的兼容/迁移层。新的私有发送记录只按本设计的最小用途定义内部版本，未知记录不得触发发送。

B47 必须重新消费本正式输入后缩减并进行 B 复审：删除未来 Ticket 配套、独立 timeline 协议、cursor/UTC 持久计时、checkpoint/Result 原子重构及全场景变异矩阵。精确代码路径按实际需要登记。

DHR_35 仍自行验证 Codex/Claude 真实链，其 runner 删除第二 prompt 并提供 instruction_ref；本卡 fake 证据不替代真实链。设计确认只完成本次正式替换，施工与运行仍遵循各自任务授权。

## 5. A34 增量的计划与故障边界

A34 只补任务指针的明确执行语义，不重开 A33 已确认的持久发送与恢复设计。后续 B-adjust 应新增一张标准/heavy 维护卡，最小生产落点为固定包络生成器及其专项/受影响测试；DHR_35 增加该卡依赖，并在同一新基线重跑真实 Codex/Claude。

静态/fixture 绿但真实 Agent 仍未执行任务时：若存在 committed Result，保存脱敏 Result；若没有 Result，保存脱敏 Attempt/账本状态与 Result 缺失事实。两种情况均保存 task side effect 缺失证据并保持 P6-M1 不通过；不得以 prompt accepted、checkpoint、pane 状态、退出码或 Agent 自述替代。若两个产品对同一固定包络表现分歧，先登记 Profile 差异，不增加产品专属 prompt 分支，除非另走设计确认。
