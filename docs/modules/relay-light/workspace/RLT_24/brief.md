<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_24 关闭动作的独立事件位与 outcome

## 身份与入口

- GitHub Issue：#39；PR 关联用 `Relates to #39`。
- DevPlan：`docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的 `#### RLT_24`；设计 oracle：`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §3.2、§3.4、§11.1、§12。
- 来源：`workspace/RLT_11/findings.md` F-004；RLT-A-11 已冻结设计，用户 2026-09-17 对话授权 D-start。
- 工作树：`/home/nash/work/dh-relay/.dh-worktrees/RLT_24`，分支 `wt/RLT_24`，起点 `master` / `origin/master` `b41cd2d`。档位标准，`task_type=normal`。
- 每名施工 worker 第一项 Git 动作：`git rebase --autostash master`；读仓根 `AGENTS.md`、本 brief、task_plan、progress、findings，再读派单批次的权威来源。只做派单节点，写信号即停。

## 目标与完成条件

实现第 20 个事件词 `resource_close`：关闭 pane、终端空间或 worktree 的每次尝试都能用固定七字段 JSONL 行及 §3.4 严格 `note` 记录 `ok|failed`；`add` 落盘前和 `lint` 接受行前执行同一校验；该控制事件不走 agent 状态机，也不改变节点、阶段状态。执行 §12 两类终端空间关闭失败的取证路径。历史 71 行账本原样兼容。

以下为 design/01 §11.1 的 **逐字 oracle**；扩展执行步骤只写在 task_plan，不改这些句子：

| ID | 完成条件 | 怎么证明 |
|---|---|---|
| HC-RL-A155 | 独立关闭控制事件 resource_close 的基础合同（RLT_24）：第 20 事件词；note 按 §3.4 协议解析，必填 object_type/object_id/outcome，闭集、编码、重复键、未知键及写入者/节点合法性均校验；该事件不进入 agent 状态机，不改变节点或阶段派生状态。reason 条件仅由 A156 承接 | 单测分别覆盖 add 与直接植入行后的 lint：三类对象合法 ok 正例；缺基础键、空标识、非法类型/outcome、非法编码、重复键、未知键、错误 writer/node 各自退出 2，add 拒绝前后账本字节一致；合法关闭事件在终态节点后及重复尝试仍可接受，插入前后状态派生一致；本条不重复验证 reason 与 outcome 的条件关系 |
| HC-RL-A156 | 关闭事件失败原因条件（RLT_24）：在其余字段合法时，outcome=failed 必须有非空且非纯空白的 reason，outcome=ok 必须无 reason；add 落盘前与 lint 接受行前执行同一条件校验，合法 failed 可检索且 lint 通过，不新增 status --json 字段 | 对 add 与直接植入行后的 lint 各测：failed 无 reason、reason 为空、reason 解码后纯空白，以及 ok 带非空或空 reason 均退出 2；failed 带有效原因通过并按 seq/object_id 检索到原行；add 拒绝均不改账本。所有反例保持 A155 基础字段合法 |
| HC-RL-A157 | §12 两类终端空间「删失败怎么办」取证路径可执行（RLT-A-11 新增，RLT_24 承接 F-004）：RLT_24 **不修改设计正文**，只执行并验证 RLT-A-11 已冻结的 §12 取证路径——两类终端空间各制造至少一例可控关闭失败（实跑或打桩并明确标注），账本含合法 `resource_close outcome=failed` 行，以 `seq` / `object_id` 实际检索到该行，处置记录落 workspace 的 evidence / progress | 证据含命令与观察结果、合法失败行、按 `seq` / `object_id` 实际检索的输出、人工处置记录或明确的待人工处理状态（不冒称已处置）；结构存在与可执行取证均由本条核验 |
| HC-RL-A158 | 历史账本向后兼容（RLT-A-11 新增，RLT_24）：引入 `resource_close` 后，原 71 行 `rlt12-win-01` 账本字节不变、全部旧行在新实现下被接受、`lint` 退出 0、与旧实现基线的稳定 `status` 字段一致（固定输入、排除动态时间字段）；含合法 `resource_close` 行的 fixture `lint` 退出 0，插入前后 agent / node / stage 派生结果一致 | 单测：71 行原样重放断言逐条接受、`lint` 退出 0、与基线 `status` 输出一致（排除动态时间字段）；含合法关闭行的 fixture 断言派生不变；不把历史兼容写成历史补记 |

既有 `HC-RL-A2`：事件层词表 19→20，未知词仍退出 2 且不落盘。`HC-RL-A85` 的旧写入者二分枚举未列新事件；新事件按 §3.4 的对象类别判定写入者，不篡改 A85 原有四个反例。

## 范围与停止边界

允许路径闭集：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`docs/modules/relay-light/workspace/RLT_24/**`。不改 herdr、不追溯补记旧账本、不扩资源类型、不改设计正文、DevPlan、skill、as-built、其它卡和历史 `docs/modules/relay-light/relay/**`。skill/as-built 同步需求只写 findings 转派。取证不关闭真实在用的终端空间或 pane，不保存凭据。

施工按 task_plan C1→C4 逐批做，批间由编排安排 checker；coder 不自行进下一批或复核。normal Recipe 后续三路为代码轮 1、需求方向、教训，施工者不复核自己的卡。R/F、verify、人验、push、PR、CI、merge、清理均由编排按独立闸门处理；本卡测试通过不代替这些结论。
