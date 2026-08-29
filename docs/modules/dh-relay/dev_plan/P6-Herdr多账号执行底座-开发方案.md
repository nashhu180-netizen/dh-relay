# P6-Herdr 多账号与 Headless 执行底座 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=DHR-B-06 stage=B-adjust artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md review=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b06 understanding=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b06 -->
<!-- dh:status
汇报: DHR_32 复核收敛并按委托 squash 合入 master（`2667f4a`），卡转待人验；复核=代码轮13条+需求轮14条+教训复核（返工1闭环，E-3201~05 全通过）；教训回流候选-36~45
现状: DHR_32 待人验（worktree 保留待 E10）；DHR_33~35 未开始
进行到: P6 ▸ DHR_32 待人验
下一步: 用户回归批量处理——①B-22 追认 ②DHR_32 E10 确认与 verify ③F-3（codex-ninth 未登录，威胁 DHR_35 的 B4/P6-M1）裁决 ④复核实例模型矛盾证据裁定（review.md 登记）；随后 DHR_33 开工
看什么: workspace/DHR_32/review.md（验收靶子+签名区）、findings.md F-3~F-10、DevPlan §0.2 B-22
阻塞: 待人验/待追认项挂起（用户外出），无技术阻塞
-->

## 0. B 方案审核与理解确认

### 0.1 白话说明：这个阶段做啥、解决啥、做完得到啥

- **要解决的问题**：真正干活的是 Codex、Claude Code 这些外部 AI 产品，你本机有多个账号入口。P6 要让接力内核能可靠地「派活给它们、盯着它们干、把结果收回来」，账号用哪个、额度用光了怎么换，都要有据可查；而且 Linux 笔记本上只靠 SSH 也要能干活。

| 任务 | 用大白话说在做啥 | 解决什么问题 |
|---|---|---|
| DHR_32 | 先把你本机 5 类 AI 入口（codex / claude 系列的各个账号）挨个查清楚：命令是什么、身份怎么认、能干什么、额度用完长什么样，整理成一份不含任何密钥的「执行者名册」 | 后面派活时不靠猜，名册里的每一项都是查证过的事实 |
| DHR_33 | 接入 Herdr（一个能托管多个 AI 终端会话的工具）：内核能通过它启动 / 观察 / 附着 / 停止 AI 会话，把 Herdr 的状态翻译成内核的状态；Linux 上 SSH 断开重连后还能接着看 | 内核有了「盯着外部 AI 干活」的眼睛和手，且远程也能用 |
| DHR_34 | 做账号与额度治理：每次派活都记录用了哪个账号 / 配置；只有确认额度真用光才切换到预登记的备用账号，普通报错不乱切；没有备用就暂停并留下待处理提醒 | 避免账号乱切、额度误判、以及切换后说不清是谁干的 |
| DHR_35 | Windows 上用真实 Codex 和 Claude Code 各跑一遍完整闭环，Linux 笔记本用 SSH 跑一遍；全程 DSH 关闭 | 端到端证明多账号、多平台派活真的能闭环 |

- **完成后你手里有什么**：
  1. 一份查证过、脱敏的执行者名册（哪些 AI 入口可用、各自能干啥）。
  2. 接力内核可以派活给 Codex / Claude Code、盯进度、收结果，Windows 和 Linux SSH 都行。
  3. 账号切换与额度耗尽有正反样本和明确的通过 / 受限结论；完整的自动切号以 P6-M4 实际结论为准（允许受限、延后 P8 补齐），不是「从此不用盯」。
  4. 为 P7 跑真实任务卡准备好了执行底座。

### 0.2 审核与确认记录

- **事件类型**：B-新建（2026-08-18 从 design/05 阶段主线拆出，接管冻结 P3 的 Herdr 责任）+ 同日 B-调整（按 design/06 增加 Linux Headless/SSH smoke、CLI 附着路径与「DSH 关闭是必测路径」）。同一未确认事件内修订。
- **审核记录**：已做闸前路线图级 fresh 审核——2026-08-18 claude-grok（fresh、只读、`--model grok-4.5`）R-P56 一致性与承接审，结论「有条件通过」；原文与只读形态见 [evidence/09](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b06)。P5 阶段闸通过、用户放行后，依据前序证据再做定向 B-调整 + 复审（不是「闸前不能审」）。
- **主会话裁决**：已做——逐条采纳 / 待用户决定见 [evidence/09 §2 裁决总表](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#2-主会话裁决总表2026-08-18)；已采纳项已回写本计划正文，「待用户决定」项在正文显式标注。
- **讲解记录**：待补——重点讲清 Executor Profile 从哪来（本机审计）、存在哪（注册表，零凭据）、Herdr 状态映射承诺什么（`done` ≠ succeeded）、如何验证身份不串用、SSH 断开 / Herdr 重启时怎么发现与恢复。
- **理解问题**：待补（候选：「quota 命中时自动切到预登记 fallback 账号，你能接受『不再问你』吗？还是每次切换都要 Attention 确认？」）。
- **用户回答 / 解释**：待补。
- **调整与复审**：待补。
- **用户确认**：待补。**DHR_32~35 为预留编号，落盘不等于 B 确认，也不构成开工授权；DHR_32 的本机审计另需用户单独确认读取范围与脱敏要求。**

- **B-22 开工期 B-调整（2026-08-29，`DHR-B-22`，主控代决策·待用户回归追认）**：
  - **授权依据**：用户 2026-08-29 对话明文——「继续P6，你做主控，让 codex 的 terra high 执行，复核opus 来。拉取方式走 herdr，要用wait监控。决策你来进行，我要出门了。linux 部分的任务可以跳过。人验我来进行。」主控据此代行本事件的裁决；**人验项、verify 签字、以及本事件的正式用户确认全部留待用户回归**，在此之前各卡最远只到「待人验」，不打 verify、不勾人类签名区。
  - **调整①·Linux/SSH 项延后**：DHR_33 的 Linux SSH 真实路径验收（H4/H9 · P6-M6）与 DHR_35 的 Linux SSH smoke 按用户指示**延后**，本阶段按计划既有预案走「冻结 Headless fixture + 备注登记『待真实 smoke』」，不得以 fixture 冒充真实 SSH 证据；**汇合点 = P6 阶段闸裁决**：解锁 P7 时 P6-M6 只能记「延后/受限」，由用户裁决受限接受或指定补录卡（B-11 延后语义：只推迟收敛裁决，不推迟事实登记）。
  - **调整②·DHR_32 审计读取范围与脱敏白名单（主控代决策冻结）**：
    - 允许读取：`Get-Command`/`where.exe` 解析的 CLI 入口与 shim 链、`--version`/`--help` 输出、配置目录**文件名清单与非敏感结构**（如 `~/.codex/config.toml` 的节名与模型/参数字段、`~/.claude/settings.json` 的非密钥字段）、账号主体标识（邮箱/组织名，入册前掩码为别名）、模型清单与能力位、quota 报错**样文**（剔除任何 token/请求头）。
    - 禁止：读取、复制或引用 `auth.json`/token/cookie/API key 的**值**（只允许登记「该文件存在、含哪些字段名」）；环境变量只登记**变量名**不登记值；任何证据入仓前先跑凭据模式扫描（`sk-`、`eyJ`、`Bearer`、40+ 位十六进制/base64 连续串）并把扫描命令与结果记入 progress。
    - 白名单可存字段 = 本计划 §2.3 注册表字段闭集，不得超集。
  - **调整③·派发形态冻结**：施工 = codex `gpt-5.6-terra` + reasoning high，经 Herdr 交互终端（`agent start --kind codex`，规程 = knowledge/herdr-派活操作.md，`agent wait` 后台监控）；复核 = claude opus 经 Herdr（`pane run` 绕 shim 坑），复核形态为侦测型只读（提示词硬约束 + 主控回收后 diff 核对，非机器只读，如实登记）。
  - **审核记录**：本事件 fresh 只读审核由 claude opus 承担（与 DHR_32 brief/task_plan 预审同批派出）。**实际形态登记**：opus fresh 实例经 Herdr `pane run` 拉起（pane w1:p7，agent `rev-b22`），与调整③冻结形态一致；主控回收后 `git status` 核对确认零越权改动。审核原文 = [workspace/DHR_32/review-b22-opus.md](../workspace/DHR_32/review-b22-opus.md)（P1×8 / P2×11 / P3×4 共 23 条），主会话裁决 = workspace/DHR_32/review.md「B-22 预审」节（P1/P2 全采纳，P3-1① 驳回，已回写本计划与 brief/task_plan）。
  - **用户确认**：待用户回归追认（追认点：①Linux 延后、②审计范围与白名单、③本事件代决策本身）。

## 1. 概述

- **交付什么 / 不含什么**：
  - 交付：①Executor Profile Registry；②本机五类入口（`codex / codex-ninth / claude / claude-grok / claude5`，仅为用户已知别名，真实映射由审计取得）的可证配置映射；③Herdr Runtime Adapter 与状态对账；④Relay CLI 中的 Herdr 状态、host_ref 与附着入口；⑤身份指纹、能力位、quota 样本与 fallback 关系；⑥Windows 上至少一条 Codex 与一条 Claude Code 真实节点；⑦Linux Headless/SSH 上至少一条 Herdr 持久会话 smoke（`DHR-B-22` 调整① 延后，汇合点 = P6 阶段闸裁决）；⑧DSH 关闭下完整完成一次 Herdr 节点观察与 Result 回收；⑨DSH / Pi 可用时作增强客户端显示同一状态（不阻断核心）。
  - 不含：DevHarness 完整单卡、多卡调度、自由账号切换、计划内任意 CLI 参数、凭据管理器、自动登录、跨机器 Relay 调度、Linux 完整 DevHarness 收口、让 Pi 模型 API Agent 冒充 Codex/Claude Code 产品 Agent。
- **最早可用结果**：Relay CLI → Relay Runtime → Herdr → Codex CLI / Claude Code；基线控制路径 = Relay CLI + Herdr CLI，DSH 页面 / Pi TUI / pane 聚焦按钮属增强。
- **承接设计**（拆计划输入 = `design/README.md` 白名单）：
  - [design/06](../design/06-多控制面与Headless-SSH运行-设计补充.md) · 「验收命题」节 **H4 / H5 / H7 / H9 / H12** + §4 控制客户端与执行器必须分开、§5 Linux Headless 与 SSH 拓扑、§9 Fallback 规则（Herdr 不可用）、§10「P6」。
  - [design/05](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md) · §7 两种 Profile（7.1 Executor Profile 示例）、§8 Agent 执行策略（8.2 实际 Codex 和 Claude Code 产品）。
  - [design/02](../design/02-完整流水-产品设计与验收.md) · **B4**（用户级注册表执行侧生效、真实拉起 codex-ninth、receipt 记 profile/account_alias/config_fingerprint、零凭据）、**B5**（quota 高置信识别与预登记 fallback）、**B15 ⑤**（可信只读承载 = 注册表能力位而非 prompt）——作为契约 Oracle。
  - 研究来源（非拆计划输入）：[design/03 Herdr 底座研究](../design/03-完整流水-Herdr底座-产品设计与验收.md) 与 [evidence/03 preflight 实测](../design/evidence/03-Herdr底座-preflight实测与审核记录.md) 的结论继续复用：Herdr 状态属宿主观测、不代表 Relay 节点成功；信任弹窗 / 漏事件 / 进程退出 / 版本漂移需对账补偿；psmux 只作 legacy 回退。
- **前置条件**：P5 核心 Gate 通过；Runtime、RPC、Store、参考 CLI、basic-agent-task 稳定；用户明确放行 P6；本机审计任务已按安全边界确认；凭据值不入任何工件；Linux 笔记本能 SSH 登录——若当时不可达，DHR_33 先冻结 Headless fixture，DHR_35 收口前必须补真实 SSH smoke（`DHR-B-22` 调整① 延后：该「必须」的执行时点推迟至 P6 阶段闸裁决，标准不松动）。
- **实施策略一句话**：先审计后冻结（Profile 名称与能力由本机事实决定，计划只引用稳定 ID），Herdr Adapter 以事件快路 + snapshot 慢路双通道对账，全部在「DSH 关闭」路径上验收，DSH/Pi 只作附加客户端对证。
- **任务前缀 / 模块 slug**：`DHR_` / `dh-relay`。
- **批次**：批次 1=`DHR_32`（审计 + 注册表）；批次 2=`DHR_33`（Adapter + CLI/SSH）；批次 3=`DHR_34 ∥ DHR_35`（身份/quota 与真实闭环可并行收口，第一个端到端 demo 在 DHR_35）。

## 2. 工程切分

### 2.1 实现单元

| 单元 | 职责 | 入口 / 主要文件 | 关联任务 |
|---|---|---|---|
| profile-registry | Executor Profile Registry schema 与脱敏注册表；`herdr.codex.<alias>` / `herdr.claude.<alias>` 占位结构 | `relay-core/profiles/`（与 contracts 平级；Runtime 侧接线在 DHR_33/34）、用户级注册表文件（路径由 DHR_32 冻结） | DHR_32 / DHR_34 |
| audit-evidence | 本机五类入口审计工件（脱敏）：命令、配置来源、身份信号、产品/模型、平台、能力、quota 样本、fallback、Herdr 启动方式 | `workspace/DHR_32/evidence/` | DHR_32 |
| herdr-adapter | `launch / observe / capture / focus / attach / send / stop / reconcile`；Herdr 状态 → Relay 状态映射；HostObservation | Runtime `executors/herdr/` | DHR_33 |
| cli-herdr | `relay status / inspect / events --follow` 接通 host_ref 与最后观测；新增 `relay focus <run_id> <node_id>` | `cli/` | DHR_33 |
| identity-quota | Receipt 冻结 profile / account_alias / config_fingerprint / capability hash；quota 检测器与 fallback 决策 | Runtime `executors/identity/`、`quota/` | DHR_34 |
| e2e-evidence | Windows Codex + Claude Code 真实节点、Linux SSH Herdr smoke、DSH 关闭闭环实录 | `workspace/DHR_35/evidence/` | DHR_35 |

### 2.2 复用与禁改边界

| 路径 | 禁改 / 扩展 / 新建 | 说明 |
|---|---|---|
| Runtime `executors/`、`cli/`；`relay-core/profiles/`（新建，与 contracts 平级） | 扩展 / 新建 | 在 P5 Runtime 上增加 Herdr Executor；Profile schema/校验器落 `relay-core/profiles/`，Runtime 接线在 DHR_33/34 |
| 用户级注册表 | 新建（仓外） | 只存路径 / 别名 / 能力位 / 指纹规则；**不得存 Token / API Key / Cookie / 完整敏感环境 / 可复用认证材料** |
| 本机 Codex / Claude Code 配置目录与凭据 | 只读、审计脱敏 | 路径与环境输出经白名单脱敏；审计范围须用户单独确认 |
| Herdr 上游 | 禁改 | 只经 CLI / 事件 / snapshot 对接；版本与能力 hash 记 HostObservation |
| psmux（P1 legacy） | 只读回退 | 不为新 Runtime 实现 psmux 默认后端 |
| DevHarness 工件（DevPlan / workspace） | 禁改 | 任务用临时仓或用户批准的低风险真实卡，不进 DevHarness 全收口 |

### 2.3 阶段专属约束

- **注册表可存字段**：`executor_profile_id / backend / product / command_alias / account_alias / capabilities / expected_identity / config_fingerprint_rule / quota_detector_id / fallback_profile_ids / supported_platforms / headless_supported`。
- **「解析到真实 cli/config_dir」的承载方式（`DHR-B-22` 预审 P1-8 裁决，方案 a）**：不扩字段闭集，解析做成**校验器行为**——`config_fingerprint_rule` 形态定义为 `{"kind":"file-exists","path_template":"${USERPROFILE}/.codex/config.toml","fields":[...]}`（路径模板只允许环境变量占位，不落真实用户名）；校验器规则「模板展开后路径必须存在，否则 `E_UNRESOLVED_CONFIG`」+「`command_alias` 经 `Get-Command` 可解析，否则 `E_UNRESOLVED_ALIAS`（可标 skip-on-CI）」，各配 negative fixture 与测试断言。「可重复身份探测」由 evidence 登记探测命令 + 掩码输出承载，注册表侧只存 `expected_identity` 掩码值。
- **角色两分**：`control_client_profile`（dsh / pi / relay-cli）与 `executor_profile`（herdr.codex.* / herdr.claude.* / pi-agent.* / process.*）严格分开；控制客户端切换不能改变已冻结的 Executor Profile。
- **Herdr 状态映射**：`working → running`；`blocked → 持久 Attention`；`done → awaiting_result`（不能直接 succeeded）；`idle → 结合阶段与 result 对账`；`unknown → snapshot + process reconcile`。
- **Linux Headless 拓扑**：SSH Client → relay CLI → herdr / herdr agent attach；Linux Host → Relay Runtime → Unix Domain Socket → Herdr Server → Codex / Claude Code / Pi。必须验证：SSH 断开后 Herdr Server 与 pane 继续存在；重新 SSH 后可接回；Runtime 不把 SSH 离线解释成 Agent / Run 退出；DSH 关闭时 CLI 仍显示 host_ref 与最后观测。
- **`relay focus`**：DSH 存在时可请求图形聚焦；普通终端输出安全的 Herdr attach 指令或调用已注册附着动作；计划内不得保存任意拼接命令。

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位（轻/标准） | 状态 | 依赖 | 工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|
| DHR_32 | 审计本机 Codex/Claude 多账号并冻结 Executor Profile 注册表 | 标准 | 待人验 | P5 阶段闸（已过，2026-08-29） | [workspace/DHR_32/](../workspace/DHR_32/) | squash `2667f4a`（2026-08-29 委托代合入；verify 待用户） | 任务类型=normal；复核收敛（代码13+需求14+教训，返工1闭环，E-3201~05 通过）；待用户：B-22 追认 + E10 确认 + F-3（ninth 未登录）裁决；worktree 保留待 E10 |
| DHR_33 | 实现 Herdr Adapter、CLI/SSH 能力探测与状态对账 | 标准 | 未开始 | DHR_32 | <开工时回填 workspace/…> | | 阶段闸阻塞；Linux 不可达时先冻结 Headless fixture |
| DHR_34 | 接通身份、quota 与预登记 fallback | 标准 | 未开始 | DHR_33 | <开工时回填 workspace/…> | | 阶段闸阻塞；P6-M4 可 passed / constrained |
| DHR_35 | 用 Codex、Claude Code 和 Linux SSH 跑真实执行闭环 | 标准 | 未开始 | DHR_33、DHR_34（Receipt 身份链字段由 DHR_34 冻结，DHR_35 验收依赖它） | <开工时回填 workspace/…> | | 阶段闸阻塞；第一个端到端 demo；须补真实 SSH smoke（B-22 ① 延后，汇合点 = P6 阶段闸） |

> 状态列只填五枚举，阶段闸阻塞写「备注」列。P5 未通过时 DHR_32~35 均不得开工。

### 3.2 任务卡

#### DHR_32

- **目标**：由能读取本机环境的 Codex 会话完成事实审计，对五类入口逐一核对实际命令、配置来源与工作目录规则、账号身份可观测信号、产品 / 模型、平台、交互 / 续接 / 只读 / 用户输入 / 结构化结果能力、quota 正反样本、允许的 fallback、Herdr 创建 / 附着 / 聚焦方式、Linux 是否有对应入口，输出脱敏注册表候选并冻结 Profile 稳定 ID。
- **非目标**：不猜测任何配置；不写凭据；不做 Adapter；不决定 `claude5` 等别名的产品归属（由证据决定）。
- **验收口径**：
  - **机器证**：[design/02 B4](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（注册表条目解析到真实 cli/config_dir、脱敏账号主体与 expected_identity 匹配）· 本计划 P6-M2：每个启用 Profile 有可重复身份探测或明确标记不可证；不可证身份的 Profile 不用于要求账号身份的验收。
  - **机器证**：[design/05 §7.1 Executor Profile 示例](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#71-executor-profile-示例)：注册表只含 §2.3 允许字段；Token / API Key / Cookie / 认证材料零出现（扫描 + 白名单脱敏双证）。
  - **机器证**：审计工件零凭据；路径与环境输出经白名单脱敏（承接 AGENTS 宪章#6）。
  - **机器证**：[design/02 B15 ⑤](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)：每个 Profile 的 `readonly` 等能力位对应到真实 CLI 实现（如 codex `--sandbox read-only`），不支持者明确标不支持。
- **变更范围**：`relay-core/profiles/` schema（与 contracts 平级，Runtime 接线在后续卡）、用户级注册表候选、`workspace/DHR_32/evidence/`；不动业务代码。
- **档位**：标准（触及本机凭据环境的读取，属权限安全红线相邻区）。
- **实施提示**：审计前用户单独确认读取范围与脱敏白名单；只引用稳定 ID，名称由证据定；不可证的写「不可证」而非猜。

#### DHR_33

- **目标**：实现 Herdr Adapter（`launch / observe / capture / focus / attach / send / stop / reconcile`）与 Herdr 状态 → Relay 状态映射，事件快路 + snapshot 慢路对账，HostObservation 记 Herdr 版本 / 能力 hash / pane 句柄；接通 CLI 的 host_ref 显示与 `relay focus`；验证 Linux 经 SSH 启动 Herdr、detach、断开、重连后 pane 与状态可恢复观察。
- **非目标**：不做身份 / quota / fallback（DHR_34）；不跑真实产品 Agent 完整闭环（DHR_35）；不做 DSH pane 聚焦 UI（增强项）。
- **验收口径**：
  - **机器证**：[design/06 H4 / H9](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M6：Linux SSH 启动 Herdr → detach → 断开 → 重连后 pane 与状态可恢复观察；Runtime 不把 SSH 离线当 Agent / Run 退出。
  - **机器证**：[design/06 H5](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M3：`blocked` 进入持久 Attention；`done` 只进 `awaiting_result`；漏事件、Herdr 重启、pane 消失、进程退出均有明确结果；启动信任弹窗等盲区进入 Attention 或启动失败。
  - **机器证**：[design/06 H1](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M5：DSH 不启动时 CLI 可完成查询与附着（`relay status/inspect/events/focus`）。
  - **机器证**：事件快路与 snapshot 慢路均可工作；HostObservation 记录版本、能力 hash、pane 句柄；`relay focus` 不保存任意拼接命令。
- **变更范围**：Runtime `executors/herdr/`、`cli/`（focus + host_ref）、Headless fixture；本卡 `workspace/DHR_33/`。
- **承接备注（2026-08-29 DHR_32 需求复核 P2-1 裁决）**：design/02 B4 的 `work_dir_root`（run 起在哪个仓/目录）由本卡 Adapter `launch` 决定并登记，DHR_32 注册表不承接该字段。
- **档位**：标准（外部宿主组件接线 + SSH 真实路径）。
- **实施提示**：复用 evidence/03 的 preflight 判据（handle 1:1、visible/interactive、有界退出）；Linux 不可达时冻结 fixture 并在备注登记「待真实 smoke」，不得以 fixture 冒充真实 SSH 证据（`DHR-B-22` 调整① 延后，汇合点 = P6 阶段闸裁决）。

#### DHR_34

- **目标**：Receipt 冻结 profile / account_alias / config_fingerprint / capability hash；只在高置信 quota 样本命中时切到预登记 fallback 并产生 fresh Attempt；普通 / 权限 / 网络错误不误判为额度耗尽；无合法 fallback 时 paused + 持久 Attention。
- **非目标**：不做自由账号切换；不做凭据管理与自动登录；不在客户端离线时自动选未授权账号。
- **验收口径**：
  - **机器证**：[design/02 B5](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P6-M4：冻结正反样本——高置信 quota → fallback fresh Attempt；非额度错误 → 不判 quota；无 fallback → paused + Attention。
  - **机器证**：[design/02 B4](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P6-M2/M7：Codex 多账号身份不串用；Claude 多入口配置边界可观察；Receipt 身份链可证；客户端变化不改变 Executor Profile / Attempt / Result 身份链。
  - **机器证**：[design/06 H12](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：fallback 产生 fresh Attempt，不续用旧身份链。
- **变更范围**：Runtime `executors/identity/`、`quota/`、Receipt schema 扩展；本卡 `workspace/DHR_34/`。
- **档位**：标准（身份与权限红线相邻）。
- **实施提示**：P6-M4 允许 `passed / constrained`——固定 Profile 的身份与 Herdr 闭环成立时，用户可决定先进 P7、完整自动 fallback 延后到 P8；权限与身份红线不因此降级。

#### DHR_35

- **目标**：Windows 至少跑 Herdr + 一个 Codex Profile、Herdr + 一个 Claude Code Profile 的完整闭环（Relay 签发 Receipt → Herdr 启动产品 Agent → working/blocked/done 观测 → checkpoint → result → Relay 终结节点 → CLI 展示并可附着 pane）；Linux 笔记本至少跑一次 SSH 登录 → 启动/连接 Herdr → 低风险 Agent 或受控 shell fixture → detach 断开 → 重新 SSH → CLI 与 Herdr 恢复观察 → 提交 checkpoint/result；DSH 关闭是必测路径。
- **非目标**：不进 DevHarness 全收口；不做多卡；DSH 可用时只作附加客户端对证，不另跑第二份流程。
- **验收口径**：
  - **机器证**：[design/02 B4](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P6-M1：至少一个 Codex 与一个 Claude Profile 完成真实节点，Receipt 身份链可证、零凭据。
  - **机器证**：[design/06 H9](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M6：Linux SSH 断开 / 重连不丢 Herdr 会话与 Relay Run 真相（真实 SSH，不接受 fixture 替代；`DHR-B-22` 调整① 延后，汇合点 = P6 阶段闸裁决）。
  - **机器证**：[design/06 H1 / H5](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M3/M5：working / blocked / done / unknown 均有真实或受控证据；DSH 关闭时 CLI 显示状态、Attention 与正确 host_ref。
  - **机器证**（P6-X）：[design/06 H3](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：DSH / Pi 可用时连接同一 Run，无第二份状态判断；不可用登记不适用。
  - **人判**：[design/05 §8.2](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#82-实际-codex-和-claude-code-产品) · P6-H：向用户展示 Windows 两条闭环实录 + Linux SSH 实录 + pane 交互延迟；用户判断 Herdr + Codex/Claude Code 是否适合作施工主力、多账号选择与 fallback 是否清楚、Windows pane 交互延迟是否可接受、Linux SSH detach/重连/附着是否适合日常、DSH→Herdr 跳转（若可用）是否自然。
- **变更范围**：e2e 脚本、临时仓 fixture、`workspace/DHR_35/evidence/`；不改 DevHarness 工件。
- **档位**：标准（真实产品 Agent + 真实 SSH + 人判）。
- **实施提示**：使用临时仓或用户批准的低风险真实卡；DSH 关闭路径先测、附加客户端后测；SSH 若前置阶段用 fixture，本卡收口前必须补真实 smoke。

### 3.3 标准档共同收口条件

同 P5：两轮独立换人复核；需求境证据（DHR_33/35 须有真实终端 / SSH 实录，pane 相关须截图）；`dh dh-relay` 与证据命令可复跑；P0/P1 清零；用户对话确认后才 `verify(dh-relay):`。凭据值任何工件零出现是本阶段每张卡的附加硬条件。

## 4. P6 阶段闸

### 4.1 核心机器闸 P6-M

| ID | 命题 | 承接卡 |
|---|---|---|
| P6-M1 | 至少一个 Codex 和一个 Claude Profile 完成真实节点 | DHR_35 |
| P6-M2 | 身份、配置和 Receipt 可证且零凭据泄露 | DHR_32 / DHR_34 |
| P6-M3 | working、blocked、done、unknown 均有真实或受控证据 | DHR_33 / DHR_35 |
| P6-M4 | quota 正反样本和 fallback 有明确通过或受限结论 | DHR_34 |
| P6-M5 | DSH 关闭时，CLI 能显示状态、Attention 和正确 Herdr host_ref | DHR_33 / DHR_35 |
| P6-M6 | Linux SSH 断开/重连不丢 Herdr 会话和 Relay Run 真相 | DHR_33 / DHR_35（B-22 ① 延后） |
| P6-M7 | 客户端变化不改变 Executor Profile、Attempt 和 Result 身份链 | DHR_34 |

### 4.2 增强验收 P6-X 与人类闸 P6-H

- **P6-X**（影响默认工作台体验，不影响 Headless 基线）：DSH 页面显示状态并聚焦 Herdr pane；Pi TUI 显示同一 HostObservation；本机自动 fallback 完整体验。
- **P6-H**（用户判断，见 DHR_35 人判项）。

### 4.3 解锁 P7 的规则

P6-M1、M2、M3、M5、M6、M7 必须通过；P6-M4 可以是通过或用户明确接受的受限；**P6-M6 例外**：因 `DHR-B-22` 调整①（用户 2026-08-29 指示延后 Linux），允许记「延后/受限」并由用户在阶段闸裁决受理或指定补录卡；受理前 P7 不解锁。P6-H 有结论 ∧ 用户对话同意进入 P7。

## 5. 与旧 P3 的关系

旧 P3 的 Herdr 研究证据继续复用；以下前提废弃：先在 PowerShell 抽象 psmux 六动词、psmux 继续作默认生产宿主、Herdr 只作平行候选。新主线 Herdr 是首选交互宿主，psmux 只保留 legacy 回退；Herdr 官方支持 Linux 终端与普通 SSH，P6 将其提升为正式验收场景。原 `DHR_22~24` 保留历史身份不复用。

## 6. 覆盖、颗粒度与依赖查漏

| 检查 | 结论 |
|---|---|
| 覆盖 | design/06 H4/H5/H9/H12 由 DHR_33/34/35 承接（H7「DSH-only Executor 丢失只影响 Attempt」不在 P6 关闭，归 P5-X / P7）；design/05 §7/§8 由 DHR_32/35 承接；design/02 B4/B5/B15⑤ 作 Oracle 由 DHR_32/34/35 承接；P6-M1~M7 每条至少一张卡 |
| 颗粒度 | DHR_32=审计 + 注册表验收单元；DHR_33=Adapter + SSH 路径验收单元；DHR_34=身份/quota 验收单元；DHR_35=真实闭环 + 人判单元 |
| 依赖 | `DHR_32 → DHR_33 → DHR_34 → DHR_35` 单链无环（DHR_35 的 Receipt 身份链验收依赖 DHR_34 冻结的字段，故不再并行）；DHR_32 额外依赖 P5 阶段闸与用户对审计范围的单独确认 |

## 7. 计划完工

- [ ] DHR_32~35 全部销户。
- [ ] P6-M1~M7 全部有等价 pass 证据（M4 允许用户接受的受限；M6 因 B-22 ① 延后，允许记延后/受限并由用户裁决）；P6-X 三态已登记。
- [ ] 端到端证据：Windows Codex + Claude Code 闭环实录、Linux 真实 SSH smoke 可复查；全部工件零凭据扫描通过。
- [ ] P6-H 已向用户展示并由用户判断；P7 是否解锁由用户明确表态。
- [ ] `dev_plan/README.md` 活跃计划表状态已更新。
