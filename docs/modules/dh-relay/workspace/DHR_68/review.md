<!-- dh:v1 -->
# DHR_68 · Review

## 独立复核区

本卡任务类型为 **heavy**。施工者不得复核自己的卡；代码轮 1、代码轮 2、需求、教训、一致性五路均由未参与施工的独立实例完成，第二轮复核实例负责选择并登记有效变异点。

**第一轮（fresh 独立复核）**

| 复核者 | 范围 | 发现 | 结论 | 派出证据 |
|---|---|---|---|---|
| `dhr68rev1`（Herdr pane `w1:p2V` · codex `--sandbox read-only` · gpt-5.6-terra high · fresh，未参与施工） | 全 diff `d6358dc..051b4f8`、A/B/C/D 逐条、越界检查、`instructionPending` 时序 | **F-68-R1-01 (P1)** fake `agentPrompt` 形态与真实不符；**F-68-R1-02 (P2)** 已提交范围的 `diff --check` 报尾随空白，与 E-6810 矛盾 | **FAIL**（两条全采纳、无驳回；整改见 `8030709`，结论证据 `E-6813`，复验见下） | e:E-6812 |

**整改复验（fresh，未参与施工、未继承任何前轮会话）**

| 复核者 | 范围 | 发现 | 结论 | 派出证据 |
|---|---|---|---|---|
| `dhr68rev3`（Herdr pane `w1:p31` · codex `--sandbox read-only` · gpt-5.6-terra high） | F-68-R2-01 闭合性、轮 1 两条持续闭合、教训两条 P1 落实、整改是否引入新问题/越界 | **F-68-RV-01 (P2)** 重跑绿测覆盖证据文件导致尾随空白回归，轮 1 卫生整改未持续闭合 | **无 P0/P1**；F-68-R2-01 与教训两条均判**闭合**；P2 已修并重跑 `git diff --check d6358dc..HEAD` 取得 exit 0 | e:E-6826 |

**第二轮（fresh-context 独立复核，未继承第一轮会话）**

| 复核者 | 范围 | 发现 | 结论 | 派出证据 |
|---|---|---|---|---|
| `dhr68rev2a`（Herdr pane `w1:p2W` · codex `--sandbox read-only` · gpt-5.6-terra high · fresh-context，未继承轮 1 会话，未参与施工） | 全程 + 轮 1 整改增量、A/B/C/D 逐条、越界、`instructionPending` 时序、三个 open 项、变异点选点 | **F-68-R2-01 (P1)** `instructionPending` 白名单 `['working','idle']` 漏 `done`：blocked→done 时不补发指令，随后进 `waitForExecutorResult` 可能误落 `E_EXECUTOR_RESULT_MISSING` | **FAIL**（已采纳整改；轮 1 两条整改复验**闭合**） | e:E-6816 |

**需求复核结论**：**PASS**（`dhr68revb`，fresh 只读；P0/P1=0；逐条命题-证据对齐；"有没有说过头"逐项核过、未发现超出证据的断言；确认未见自动信任/自动按键/自动重试；F-6807 维持范围外 P2）｜派出=e:E-6816｜证据=`E-6817`
**教训复核结论**：**FAIL→已整改**（`dhr68revc`，fresh 只读；**C-68-01 (P1)** DHR_67 的 fake 形态漂移是 [候选-6]/[候选-36] 的重蹈，须显式标注边界后独立入候选；**C-68-02 (P1)** C-driver 采样竞态是 [候选-35] 同构，须回链。两条已在 `lesson_candidates.md` 落实；另采纳其建议新增 L-6802/L-6803 两条候选，并确认异步测试竞态一条**不新增**）｜派出=e:E-6816｜证据=`E-6818`

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_68 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| 超时语义（`timeoutMs`/`startTimeoutMs`/`HERDR_START_TIMEOUT_MS` 与 herdr 自身 30s 窗口） | `herdr-cli.mjs`、`task_plan.md`、`progress.md`、DevPlan §3.2 | 一致：通用 10s、仅 `agent start` 用 60s、argv 不变、不新增配置面、四处均声明只覆盖已观测样本 | **PASS** | e:E-6816 |
| 失败语义位 `missing`/`timedOut`/`notReady` 及事件 `E_EXECUTOR_HOST_LOST`/`E_EXECUTOR_RESULT_MISSING`/`human_input_requested` | `herdr-cli.mjs`、`herdr-executor.mjs`、`workflow-driver.mjs` | 一致：`ETIMEDOUT`∨signal→`timedOut`；not-found 才 `missing`；`agent_not_ready` 单列 `notReady` 不与 `missing` 混用；启动期 blocked 走无 reason 的 `human_input_requested`→`waiting_human` | **PASS** | e:E-6816 |
| 「启动期 blocked」定义（`launch_blocked`/`launchBlocked`/`blind`/`HERDR_STATUS_MAPPING.blocked`） | `herdr-executor.mjs`、`workflow-driver.mjs` | 一致：Codex 的 `agent_not_ready` 与 Claude 的 `pane run` 后观测 blocked 同归 `launch_blocked`，均保留 handle、只写一次 Attention、扣住指令 | **PASS** | e:E-6816 |
| fake 与真实形态（注释 / 对照表 / `DHR_68/D` 断言三者） | `fake-herdr.mjs`、`evidence/real-herdr-command-shapes.json`、`herdr-adapter.test.mjs` | 一致（轮 1 抓到的 `agent prompt` 一处已修） | **PASS** | e:E-6816 |
| 允许路径 vs 实际 diff | DevPlan `dh:allowed-paths:v1 task=DHR_68` vs `git diff --name-only` | 逐条吻合，无越界 | **PASS** | e:E-6816 |

**一致性复核结论**：**PASS**（`dhr68revd2`，fresh 只读；本路无新增不一致或越界）｜证据=`E-6819`

## 有效单测·变异点登记

| 变异点 | 语义破坏 | 指定者 | 红测证据 | 还原绿测 | 结论 |
|---|---|---|---|---|---|
| `herdr-executor.mjs` · `launchHerdrAgent` 超时对账后的 `if (!reconciled) return closeFailedPane(start);` | 取反为 `if (reconciled)`——已建成的 agent 被错误回滚、未建成的被错误保留 | **第二轮复核实例 `dhr68rev2a`**（施工方未参与选点） | `DHR_68/A adapter：启动超时先对账…` 断言失败（E-6820） | 还原后 DHR_68 定向 8/8、`herdr-adapter` 27 例 24 通过（3 例为 master 同名同因基线） | **PASS** |

> 附加红绿对照（轮 2 的 P1 整改自证，不占变异点名额）：把 `instructionPending` 的判据改回白名单 `['working','idle']`，`DHR_68/C driver：blocked 直接跳到 done…` 立即红（`timeout:deferred instruction on blocked->done`）；改回 `!== 'blocked'` 后绿。E-6821。

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| design/06 H1/H5 的启动期人工暂停 | 用 fake 正负例驱动真实 driver 跑完启动段：`agent_not_ready` → 核对事件序列 `attempt_started → host_observation_changed(blocked) → human_input_requested(blocked)`、节点停在 `waiting_human`、Attention 恰 1 条、blocked 期间 `sent=0`、零 Result；再放行到 working/idle/done 三种离开路径，核对指令补发恰好一次。 | E-6806、E-6821 | 满足 |
| P6-RI-A4 的**启动前置**（不含 A4 本身） | 先用真实 herdr 0.8.2 逐命令 probe 出返回形态，再以该对照表为 oracle 驱动 fake，跑 Codex `agent start` 与 Claude `pane run → 唯一识别 → rename` 两条真实形态下的启动序列，并核对 Codex argv 逐字不变。 | E-6801、E-6806、E-6820 | 满足（**仅启动前置**；真实 Receipt→Result 闭环实录仍归 DHR_35） |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| A | 启动调用使用**启动专用**超时默认值 **60 秒**（B-32 用户裁决冻结；**不暴露配置面**，不新增环境变量或 registry 字段），其余 CLI 命令继续用现有 10 秒默认、超时语义不变；以 DHR_35 已有的 29482 ms 真实样本形态证明该启动能完成；fake 覆盖「超时后 agent 存在」与「超时后 agent 不存在」两支，前者继续走既有 handle 路径、后者才关闭本卡创建的同一 pane。不得声称"默认足以覆盖任意未来启动"（不可证）。 | machine | E-6802、E-6805、E-6806、E-6820 | 是 |
| B | `paneRun` 不再期待 JSON；以**对齐真实 herdr 输出形态**（exit 0 + 空 stdout）的 fixture 证明 Claude 启动继续走 `pane run → 唯一识别 → rename → 交既有 Attempt`，且 Codex `agent start` 的 argv 与返回处理不变。 | machine | E-6801、E-6806 | 是 |
| C | `agent start` 返回启动期 `blocked`（含 `agent_not_ready`）时——adapter 返回 handle、不关 pane、不额外创建 Attempt/Result；driver **不发 completion instruction**，并**恰好写一次**带 blocked 观测的 `waiting_human` + `human_input_requested`，不写 `E_EXECUTOR_HOST_LOST`。以 fake 正负例 + driver 事件序列断言证明。 | machine | E-6806、E-6821 | 是 |
| D | `relay-core/test/helpers/fake-herdr.mjs` 中被本卡触及的每个命令，其**返回形态**须与真实 herdr 一致，并留下逐命令的真实输出对照证据（exit code + stdout 是否为 JSON）。这是本卡存在的直接原因，是验收项而非提示。 | machine | E-6801、E-6814 | 是 |

### 验收项元数据表

| 命题 | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Herdr adapter/driver 在真实宿主形态下正确接线启动：给足时限、超时先对账、`pane run` 不解 JSON、启动期 blocked 转一次人工暂停 | 真实 herdr 逐命令形态对照 + fake 正负例的调用账本 + driver 事件序列断言 + 第二轮指定 mutation | machine | DHR_68-A/B/C/D | 等价覆盖 | 启动上限=60000 且其余动词=10000；超时对账命中不关 pane 且 `agentStart` 调用恰好 1 次、未命中关闭 ID = 创建 ID；Claude 在 `paneRun` 返回空串时仍完成 rename 并返回 handle；blocked 时 `human_input_requested` 恰 1 条且 detail 含 `herdr_status=blocked`、无 `E_EXECUTOR_HOST_LOST`、指令时序正确；fake 每个动词形态与真实对照表一致 | E-6801、E-6806、E-6814、E-6820、E-6821 | 本地 Node · Windows · herdr 0.8.2 | fake CLI 调用账本 + Store 事件清单 + 真实 herdr 逐命令 probe | **不跑真实闭环实录**（归 DHR_35）；不声称 60s 覆盖任意未来启动；不碰 Linux/SSH；不代产品做信任决定 | design/06、design/12 | adapter + driver tests | 自动化 |

→ 当前状态：**已完成（H=0 双谓词成立；E11 已获用户对话明文「可以收口」，verify 本提交）**

## 人类签名区

本卡四条完成条件**均为机器证**，无人判结果项（H=0）。收口按 G14 走双谓词：谓词 A（人验栏为空：无人判结果项、无 open 方向项、无待认险风险项）∧ 谓词 B（放行资格：全部验收项已分类、机器项均有等价 pass 证据、不可豁免项均满足、无未验证项）。

E11 仍需用户在对话里明确确认后 AI 才可代签 verify；文档勾选不算。

- 确认记录：2026-08-31，用户对话明文「可以收口」。对象 = DHR_68 releasePacket：四条机器证 A/B/C/D 均已挂证据；五路复核（轮1/轮2/需求/教训/一致性）+ 一次整改复验全部闭合、发现全部采纳无驳回；有效单测变异点由第二轮复核实例选点、指定测试红、还原绿；定向 `herdr-adapter` 27 例 24 通过（失败 3 例与未改代码的 master 同名同因）；`dh dh-relay` 本树 0 失败；`git diff --check <基线>..HEAD` exit 0；凭据形态扫描零命中。
- **release_mode = full**（无未验证项、无风险接受项、无不可豁免项未满足）。范围外登记项 F-6807（recovery 届同类缺陷，四路一致裁定不在本卡修）与 F-6808（as-built 不在允许路径无法更新）**不属于本卡验收项**，作为跟踪项移交后续卡，不构成带风险放行。
- verify 提交 SHA：本提交。
- 签名：用户对话确认，AI 代签。
