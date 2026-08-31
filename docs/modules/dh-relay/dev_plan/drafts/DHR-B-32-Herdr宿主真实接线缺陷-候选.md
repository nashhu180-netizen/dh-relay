<!-- dh:v1 · dev_plan/drafts/DHR-B-32-Herdr宿主真实接线缺陷-候选.md -->
# DHR-B-32 候选 · Herdr 宿主真实接线缺陷（v3 · 待落盘）

> 状态：**草案 v3**，用户已明文同意，正在落进 P6 正式 DevPlan。落盘后本草案只作历史留痕，不再是权威。
> v2 = 按 [evidence/30](../../design/evidence/30-DHR68-Herdr宿主真实接线缺陷-B调整交叉审核记录.md) 第一轮 fresh 审核裁决（R-01~R-05 全部采纳）修订。
> v3 = 按同一记录的**定向复审**结论，把用户三项裁决由"待决问题"冻结为既定前提（复审除此之外未发现新增问题）。

## 1. 触发

DHR_35 于 2026-08-31 首次在 DSH 关闭的 Windows 上，用**真实** Codex 与 Claude Code 各跑一次完整闭环。目录信任问题已在本卡允许路径内解决（固定 fixture 根 + 幂等 `bootstrap-fixture-trust.ps1`），两条路径都推进到 `attempt_started`、Receipt 身份链落账。此后的失败**全部落在 DHR_35 的禁改路径** `relay-core/runtime/executors/herdr/**`，且都是真实宿主才暴露、fake CLI 无法暴露的缺陷。

| # | 缺陷 | 位置 | 实测 | 影响 |
|---|---|---|---|---|
| A | `agent start` 的 CLI 调用上限对真实 Codex TUI 启动不够，且超时被当成"没发生" | `herdr-cli.mjs` `makeHerdrCli({ timeoutMs = 10_000 })`（**该默认值被所有 CLI 命令共用**） | 已信任 fixture 根内 6 次采样：min 6850 / 中位 10934 / max 29482 ms，主机侧 `ok` 6/6，超上限 3/6 | 超时时 agent 其实已建成，adapter 仍按失败关掉同一 pane 并报 `E_EXECUTOR_HOST_LOST`；Codex 真实闭环约半数失败，且**泄漏一个活着的 agent 进程** |
| B | `paneRun` 以 `json: true` 调用，但真实 `herdr pane run` 成功时不返 JSON | `herdr-cli.mjs` `paneRun`；`herdr-executor.mjs` Claude 分支 | 真实 `herdr pane run` exit 0、stdout 长度 0 → `json-parse` | Claude 真实闭环 **100% 失败**（非偶发）。DHR_67 的 fake 给 `paneRun` 返回 `{ ok: true, value: {} }`，故其 Claude 路径**从未在真实宿主上跑通** |
| C | 启动期 `blocked` 被报成启动失败；且**即使返回 handle，现役 driver 也不会产生 blocked Attention** | `herdr-executor.mjs` `launchHerdrAgent`；`workflow-driver.mjs` | 信任框下 `agent_status=blocked`、`launch_pending=true`、`agent start` exit 1 `agent_not_ready`。审核复核：driver 未消费 `HERDR_STATUS_MAPPING`，启动即 blocked 时 `lastStatus` 被初始化为 `blocked`，轮询分支仅在 `lastStatus !== 'blocked'` 时才写 `human_input_requested` | 任意**新项目首次派活**必然撞产品信任闸并失败，而不是按 design/06 形成持久 Attention |

- 机器证：`workspace/DHR_35/evidence/f3508-root-cause/production-defects.json`、`.../windows-codex/**`、`.../windows-claude/**`；账本 `workspace/DHR_35/progress.md` E-3517、E-3520~E-3522（当前在分支 `wt/DHR_35`）。
- 审核补充事实：`workflow-driver.mjs` 的启动期 blocked 事件路径（evidence/30 R-02）。

## 2. 用户诉求的承接边界（v2 修订 · R-01）

用户原话：「这要做成固定的程序，以后不要用户自己按」「就是以后开新的项目，也能支持」。

**必须讲清的差别**：修好缺陷 C 只是把"启动直接失败"变成"可见的人工暂停（持久 Attention）"，**用户仍然要按那一下**。它不等于"以后不用按"。要做到"新项目也不用按"，需要的是**受控自动确认产品信任**——那会引入信任授权范围、路径白名单、审计与撤销等新的产品安全语义，属设计变更，**必须先走 A-full，不能塞进本 B-调整**。

**用户裁决（2026-08-31 对话明文，已冻结）**：新项目语义 = **安全暂停 + 人工确认信任**。缺陷 C 只修"把需要人处理报成启动失败"这个 bug，让它按 design/06 形成持久 Attention；**不做受控自动信任**。因此本调整不触发 A-full。

> 被否掉的另一支（受控自动信任）会引入信任授权范围 / 路径白名单 / 审计 / 撤销四项新的产品安全语义，属设计变更，须先走 A-full 再重新拆卡。用户已明确不走这条；若日后要走，必须重开 A 事件，不得在本卡内顺手扩。

## 3. 拟议变更

### 3.1 新增 DHR_68

见 §4 任务卡草案。**标准档 · 任务类型=重核**（外部宿主组件接线 + 启动语义 + driver 事件序列）。

### 3.2 依赖与状态（v2 收窄 · R-04）

- `DHR_35` 依赖增加 `DHR_68`，保持 `进行中`。
- `DHR_68` **只列实际所需的契约依赖**：`DHR_64`（Receipt-bound Result bridge，driver 事件序列的上游契约）、`DHR_67`（本卡直接改写其 Claude 启动接线）。不机械继承 DHR_35 的全部前置，避免虚增等待链。
- `DHR_67` 状态保持 `已完成`（其 verify 提交与冻结范围不推翻），但**必须在 P6 §3.1 任务表 DHR_67 行的备注列**补一句：「已完成仅指当时 fake 覆盖；fake `paneRun` 返回形态与真实 herdr 不符，真实 Claude 启动未被覆盖，反例与修复由 DHR_68 承接」。**不接受只写在本草案里**——草案落盘后会留在 drafts，阶段闸读的是任务表。
- 依赖图：`DHR_64,DHR_67 → DHR_68 → DHR_35`；无环。

### 3.3 不变项

目标、Linux B-22 延后语义、P6-M1~M7、design/12 的 P6-RI-A1~A5 **定义与稳定 ID**、Receipt/Result/Store/RPC/contracts 合同、DHR_35 的真实闭环责任与允许路径均不变。三条修法都是"修实现以兑现既有语义"，不改稳定验收 ID、Result 或 Attempt 语义，故不触发 A-full。

## 4. DHR_68 任务卡草案

- **目标**：让 Herdr adapter 与 driver 在**真实宿主**上正确接线三件事——启动调用给足时限且超时后先对账再决定回滚、`pane run` 不期待 JSON、启动期 `blocked` 保留 handle 并按 design/06 形成一次持久 Attention。
- **非目标**：不改 Receipt/Result/Store/RPC/contracts 语义；不改 driver 的 **Result 判定**逻辑（只动启动期 blocked 的事件路径）；不改用户级 registry、产品配置或凭据；不把 Herdr `done`、pane 文本或 exit code 当 Result；**不代产品做信任决定、不自动确认任何目录信任**；不跑 DHR_35 的真实闭环实录；不碰 Linux/SSH。
- **验收口径**（v2 · R-03/R-05 修订，均为机器证）：
  - **A**：启动调用使用**启动专用**超时默认值 **60 秒**（用户已冻结；**不暴露配置面**，不新增环境变量或 registry 字段），其余 CLI 命令继续用现有 10 秒默认、超时语义**不变**；以 DHR_35 已有的 29482 ms 真实样本形态证明该启动能完成；fake 覆盖「超时后 agent 存在」与「超时后 agent 不存在」两支，前者继续走既有 handle 路径、后者才关闭本卡创建的同一 pane。**不得**声称"默认足以覆盖任意未来启动"（不可证）。
  - **B**：`paneRun` 不再期待 JSON；以**对齐真实 herdr 输出形态**（exit 0 + 空 stdout）的 fixture 证明 Claude 启动继续走 `pane run → 唯一识别 → rename → 交既有 Attempt`，且 Codex `agent start` 的 argv 与返回处理不变。
  - **C**：`agent start` 返回启动期 `blocked`（含 `agent_not_ready`）时——adapter 返回 handle、不关 pane、不额外创建 Attempt/Result；driver **不发 completion instruction**，并**恰好写一次**带 blocked 观测的 `waiting_human` + `human_input_requested`，不写 `E_EXECUTOR_HOST_LOST`。以 fake 正负例 + driver 事件序列断言证明。承接 [design/06 H1/H5](../../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)；本卡**只是** [design/12 P6-RI-A4](../../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收) 的**启动前置**，不声称承接 A4 本身（A4 是完整闭环命题，仍归 DHR_35）。
  - **D（取证纪律）**：`relay-core/test/helpers/fake-herdr.mjs` 中被本卡触及的每个命令，其**返回形态**须与真实 herdr 一致，并留下逐命令的真实输出对照证据（exit code + stdout 是否为 JSON）。这是本卡存在的直接原因，必须是验收项而非提示。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_68 -->
  - `relay-core/runtime/executors/herdr/herdr-cli.mjs`
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/runtime/workflow-driver.mjs`
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/helpers/fake-herdr.mjs`
  - `docs/modules/dh-relay/workspace/DHR_68/**`

  不得改 `profile-registry.mjs`、`service.mjs`、Store、RPC、contracts、用户级 registry 或 DHR_35 工作区。driver 只可改启动期 blocked 的事件路径，不得动 Result 判定。
- **档位**：标准（组件接线 · 高危五类之一）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_68 type=heavy -->
- **实施提示**：必须另行 D-start。超时对账**不得**退化成"重试一次启动"（会拉起第二个真实 agent）。若真实 herdr 的慢启动观测拿不到，fail-closed 停止并回报，不得以 fake 覆盖冒充。

## 5. 已冻结的用户裁决（2026-08-31 对话明文）

| # | 事项 | 裁决 |
|---|---|---|
| 1 | 新项目信任语义 | **安全暂停 + 人工确认**；不做受控自动信任，故不触发 A-full |
| 2 | 启动专用超时 | **60 秒，不暴露配置面**（实测 max 29.482s，留两倍余量；其余命令仍 10 秒，故"宿主真死"的发现只在启动这一步变慢） |
| 3 | DHR_67 历史表述 | **保持"已完成"**，限定说明落进 P6 §3.1 任务表 DHR_67 行的备注列，真实反例与修复由 DHR_68 承接 |

用户于同一轮对话明文「直接同意」本调整整体。
