# P6-Herdr 多账号与 Headless 执行底座 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:status
汇报: DHR_32（normal）已于 2026-08-30 经用户对话确认收口，verify `2f80fa1`；主干复验定向 profiles 14/14、contracts 审计 0 违规、模块体检 0 failure。DHR_33（heavy）已于 2026-08-30 经用户接受 E-3303 现场、E-3304 受限、E-3307/3308 Oracle 差异与 P6-M6 延后后收口，verify `5d662b6`；候选-40 依用户裁决 B 冻结为“fresh 实例 + 独立会话”，模型身份仅作诊断记录。DHR_34（heavy）已于 2026-08-30 经用户接受 P6-M4 受限结论，verify `0b72cb6`；quota 定向 12/12、Store/Attempt 组合 30/30、contracts 审计 0 违规、模块体检 0 failure。DHR_64（heavy）已于 2026-08-30 经用户本地收口授权完成，verify `8376e02`；稳定定向 15/15、contracts audit 0 违规、validator 57/57、capability 20/20。
汇报补充: DHR_65（normal）已经用户 E11 明文认可；主干复验专项五项均 1/1、profiles 14/14、contracts audit 0、模块体检 0 failure。DHR_67（heavy）已于 2026-08-31 经用户明文授权本地收口；主干定向 6/6、contracts audit 0 failure、模块体检 0 failure。DHR_66（light）已于 2026-08-31 经用户 E11 认可收口；主干复验 registry validator PASS、strict config exit 0、定向 23/23、模块体检 0 failure。
现状: DHR_32、DHR_33、DHR_61、DHR_34、DHR_63、DHR_64、DHR_65、DHR_66、DHR_67、DHR_68 已完成；DHR_69 进行中（B-33 新增，D-start 已授权）；DHR_35 进行中，blocked-by:DHR_69
进行到: P6 ▸ DHR_69 已于 2026-08-31 经用户点选授权开工（开树 + 本会话自干）；detail 键与覆盖规则已冻结
下一步: DHR_69 施工（E-1 shape probe → 红测 → 观测层交叉核对）→ 收口后 DHR_35 才重跑 Windows 真实闭环实录（另需用户重新授权真实 Agent）；范围外跟踪只剩 F-6808（as-built/relay-core.md 未含 DHR_68 三条新行为），F-6807 已由 B-33 并入 DHR_69
待用户: P6 阶段闸仍等待 DHR_35 的真实闭环机器证与 P6-H 人判；DHR_34 的 P6-M4 已按用户裁决记为 constrained。**2026-08-31 用户在 DHR_68 收口后提出「不是等人处理，直接信任」——即把新项目目录信任从「安全暂停+人工确认」改为受控自动信任，这与 B-32 冻结的产品语义相反，须先走 A-full（授权范围/路径白名单/审计/撤销四项安全语义），待用户确认后立项。**
看什么: workspace/DHR_33/review.md（验收表+签名区）→ review-consistency-opus.md §六/§八；workspace/DHR_32/review.md 签名区
阻塞: DHR_35 的三条宿主缺陷已由 DHR_68 闭合（启动专用 60s + 超时只读对账、`pane run` 不解 JSON、启动期 blocked 保留 handle 并转一次人工暂停 + 延后补发提交指令）。**但 B-33 新增了一条阻塞**：Claude 会把真实 blocked 误报为 idle（`F-6809`），使启动 / 轮询 / recovery 三处检测同时失效，真实实录一旦撞上会把宿主阻塞**错误归因**为 `E_EXECUTOR_RESULT_MISSING`；用户 2026-08-31 裁决 DHR_35 等 DHR_69 收口后再跑。DHR34、63、64、65 已完成范围保留且不重开。Linux SSH 真实 smoke 按 B-22 延后，P6-M6 只能在阶段闸记延后/受限；DHR_34 的真实 quota 样本、detector/judge 与 retry 后执行闭环不得被 Result bridge 自动重启或误表述为完整自动切号可用。
-->

<!-- dh:planning-event:v1 id=DHR-B-33 stage=B-adjust artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md review=../design/evidence/33-DHR69-Claude假就绪blocked盲区-B调整交叉审核记录.md#review-b33 understanding=../design/evidence/33-DHR69-Claude假就绪blocked盲区-B调整交叉审核记录.md#understanding-b33 -->

## 0. B 方案审核与理解确认

### 0.1 白话说明：这个阶段做啥、解决啥、做完得到啥

- **要解决的问题**：真正干活的是 Codex、Claude Code 这些外部 AI 产品，你本机有多个账号入口。P6 要让接力内核能可靠地「派活给它们、盯着它们干、把结果收回来」，账号用哪个、额度用光了怎么换，都要有据可查；而且 Linux 笔记本上只靠 SSH 也要能干活。

| 任务 | 用大白话说在做啥 | 解决什么问题 |
|---|---|---|
| DHR_32 | 先把你本机 5 类 AI 入口（codex / claude 系列的各个账号）挨个查清楚：命令是什么、身份怎么认、能干什么、额度用完长什么样，整理成一份不含任何密钥的「执行者名册」 | 后面派活时不靠猜，名册里的每一项都是查证过的事实 |
| DHR_33 | 接入 Herdr（一个能托管多个 AI 终端会话的工具）：内核能通过它启动 / 观察 / 附着 / 停止 AI 会话，把 Herdr 的状态翻译成内核的状态；Linux 上 SSH 断开重连后还能接着看 | 内核有了「盯着外部 AI 干活」的眼睛和手，且远程也能用 |
| DHR_61 | 先冻结 Attempt 身份、暂停/重试、Store 恢复与 RPC 兼容契约 | 让 fallback 的状态、身份和恢复有唯一可重放真相，不能靠页面文案或自由文本猜 |
| DHR_34 | 再做账号与额度治理：只有确认额度真用光才选择已冻结的合格 fallback，普通报错不乱切 | 避免账号乱切和额度误判；协议债不再由本卡越界承担 |
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
  - **用户确认**：已于 2026-08-30 用户对话追认「B-22：确认延后」；追认范围为①Linux 延后、②审计范围与白名单、③本事件代决策本身。

- **B-23 前置契约卡调整（2026-08-29，`DHR-B-23`，已确认）**：
  - **触发**：DHR_34 S1 fresh 预审的 F-003/F-004 证明原卡无权扩 `contracts/**`、Store 或 RPC，且“已暂停等待处理”的正确状态语义是既有 `waiting_human/needs_you`，不是新 `paused` 枚举。
  - **审核与裁决**：fresh 只读审核结论为无新增 P0；P1 是必须同拍调整索引、卡面范围、批次和依赖，不能只加一条依赖。采纳后发放唯一新 ID `DHR_61`（`DHR_36~40` 为已取消历史 ID，不复用）。
  - **理解与确认**：用户理解回答“不能施工”，随后明文“确认”本调整。该确认只授权本次 DevPlan/evidence 落盘；不授权 DHR_61 或 DHR_34 开工、工作区、代码、账号配置、凭据读取、verify、合并、推送、部署或环境操作。

- **B-24 Receipt 绑定 Result 提交与真实闭环调整（2026-08-30，已确认）**：
  - **触发**：DHR_35 Windows 预检证明 Herdr `done` 仅是宿主观测，而现役 Result 成功路径仍依赖 host judge verdict；用户明确确认无 Receipt 绑定结构化提交时应等待人工，不自动失败或 fallback。
  - **审核与裁决**：独立 fresh 审核先发现三项 P1（DHR_64 runtime/completion-instruction ownership、重复提交幂等、坏 registry 全量 fail-closed），全部修订后复核 P0/P1=0；详见 [evidence/23](../design/evidence/23-P6-Receipt结果提交与真实闭环-B调整交叉审核记录.md)。新增 DHR_63（registry 维护，normal）与 DHR_64（Result bridge，heavy）；DHR_35 保持进行中但 `blocked-by:DHR_63,DHR_64`。
  - **理解与确认**：用户先确认理解“DHR_35 被前置卡阻塞，只有 DHR_63/DHR_64 分别完成后才恢复 Windows 实录”，再明文“确认”。本确认只授权本次 DevPlan/evidence/DHR_35 合同同步；不授权 DHR_63 的 registry 写入、DHR_64 的生产代码/工作区、DHR_35 的真实 Agent、Linux、凭据、verify、合并、推送、部署或环境操作。

- **B-25 DHR_63 runtime fail-closed 补卡调整（2026-08-30，已确认）**：
  - **触发**：DHR_63 fresh 返工复核证明既有 formal validator 会拒绝完整 registry 的坏 alias/config，但 runtime loader 固定以 `resolveAlias:false` 加载，不能证明在真实启动前同样 fail-closed；同时 DHR_63 的 registry-only 范围无法承接 normal 所要求的实现级 mutation。
  - **审核与裁决**：三轮独立 B 审核先后记录于 [evidence/24](../design/evidence/24-DHR63-runtime-fail-closed-B调整审核记录.md)、[evidence/25](../design/evidence/25-DHR63-runtime-fail-closed-B调整定向复审.md)、[evidence/26](../design/evidence/26-DHR63-runtime-fail-closed-B调整二次定向复审交叉审核记录.md)；最终 P0/P1=0。采用方案 A：DHR_63 保持受限 registry-only 维护但任务类型改为 light；新增 DHR_65（normal）独立承接 runtime loader fail-closed 与实现级 mutation；DHR_64 的 Herdr/CLI/测试范围同步收窄为本计划 §3.2 明列路径；DHR_35 改为同时依赖三卡。设计/12 的目标、定义与验收 ID 不变，故不触发 A-full。
  - **讲解与理解**：已向用户说明输入来自用户级 registry 与 runtime loader，结果仍由现有 Store/Result bridge 保存；坏完整 registry 必须在创建 Attempt/Agent/pane/Result 前被拒绝，DHR_63 的 registry 证据与 DHR_65 的 runtime/mutation 证据共同验证该承诺。理解问题：“即使 DHR_63 的 registry 校验通过，只要 DHR_65 未证明 runtime 会在创建 Attempt/Agent/pane/Result 前拒绝坏 alias/config，DHR_35 是否仍必须保持 blocked？”用户回答：“是的”。
  - **用户确认**：用户明文“确认”本调整：DHR_63→light、新增 DHR_65→normal、DHR_64 收窄为精确路径、DHR_35 同时依赖 DHR_63/DHR_64/DHR_65。本确认仅授权本次 DevPlan/在建卡合同与审核工件落盘；不授权 DHR_65 开工、任何新生产代码、真实 Agent、registry 读取/写入、Linux、verify、合并、推送、部署或环境动作。

- **B-26 DHR_65 默认测试接入（2026-08-30，已确认）**：DHR_65 的三条 fresh review 均指出专属 loader 测试未被显式 `npm test` 清单拾取；用户在对话中明文「授权」将本卡允许路径最小扩至 `relay-core/package.json`，仅添加 `test/dhr65-registry-loader.test.mjs` 到既有 test script。目标、非目标、验收口径、task_type、依赖和 DHR_35 联合闸均不变；不读取用户 registry/config、不中改 driver 或既有测试。
- **B-27 DHR_65 miner 候选追加（2026-08-30，已确认）**：标准档收口 `dh mine` 的 fresh miner 已按去重规则产出候选-56～58；用户明文「确认」将允许路径最小扩至 `docs/modules/dh-relay/knowledge/教训库-候选.md`，仅可 append 候选，不得改 `教训库.md` 正册或任何其他 knowledge 文件。目标、非目标、验收口径、task_type、依赖和 DHR_35 联合闸均不变。
- **B-28 DHR_65 alias fallback 收口（2026-08-30，已确认但未采纳）**：用户明文「允许」曾授权试验为既有 `Get-Command` fallback 增加 `-NoProfile`。试验立刻使已审计的 `claude-grok` profile alias 失效，违背“不改变 alias 解析语义”，故未提交并已回退；清理仅属 DHR_65 的旧无终态 Node 测试残留后，原 fallback 的坏 alias 定向测试重新取得 exit 0。**无 `relay-core/profiles/validate-profiles.mjs` 的保留变更，也无新增允许生产路径**；目标、task_type、依赖和 DHR_35 联合闸不变。

- **B-29 P6 Windows 真实闭环修复（2026-08-30，已确认）**：DHR35 E-3512 证明 Codex 在 Attempt 前因 `E_NONSECRET_PROJECTION_MISSING:/profiles` fail-closed；Windows Claude 的 `agent start --kind claude` 不满足 PATH shim 约束。两轮 fresh 定向复审最终 P1/P2=0，详见 [evidence/27](../design/evidence/27-DHR66DHR67-P6真实闭环修复-B调整交叉审核记录.md)。新增 DHR_66（standard/light）：仅维护 registry 已声明 nonsecret 的 `/profiles`，程序只留 hash/错误码/脱敏摘要，Receipt 保持四字段；新增 DHR_67（standard/heavy）：固定 `pane run → 唯一识别 → rename → Attempt`，失败关闭同一新 pane。DHR_35 保留 DHR34/63/64/65 并新增依赖 DHR66/67；P6-RI-A4/A5、Receipt-bound Result 和 Linux 延后语义不变。用户先明确“是的，可以”接受 `/profiles` 最小读取边界，再明文“确认”。本确认只授权本次 DevPlan、在建 DHR35 合同和审核工件落盘；不授权 DHR66/DHR67 D-start、registry 写入、生产代码、真实 Agent、verify、合并、推送、部署或环境动作。
- **B-33 Claude 假就绪 blocked 盲区补卡（2026-08-31，`DHR-B-33`，已确认）**：`design/13`（A-27 正式输入）§0 把 `F-6809` 定为 A-27 的**硬前置**，须先单独立卡收口；用户 2026-08-31 对话明文「现在拆」。
  - **触发事实**（evidence/32 §2 实测）：Claude 在未信任目录启动时 `agent start` 返回 exit 0、`agent get` 报 `idle`，而同一时刻 `pane get` 报 `blocked`、屏幕上就是目录信任框。主控为拆卡回读 `workflow-driver.mjs` 全段后确认**同一个假 `idle` 在三个时点各坑一次**：①**启动期**两条检测同时失效（`herdr-executor.mjs:73` 的 `agent_not_ready` 不触发、`:98` 的就绪轮询立即退出），提交指令直接打进框；②**轮询期**假 `idle` 落进 `:351` 的 `done||idle` 分支，写 `E_EXECUTOR_RESULT_MISSING` 并结束 Attempt——**不止挂死，还是归因错误，本次首次登记**；③**recovery 期**（`:274`）无条件先发提交指令、一次观测都不做，即既有 `F-6807`。
  - **审核**：三名 fresh 只读实例、两轮（`b33rev1`/`b33rev2` 互不可见 + `b33ver1` 验证性定向复审），**14 个独立议题：采纳 14 · 驳回 0**。每轮以 git 基线比对证零写入（`a619d6b` / `484bf82` 前后一致）。记录见 [evidence/33](../design/evidence/33-DHR69-Claude假就绪blocked盲区-B调整交叉审核记录.md)，草案见 [drafts/DHR-B-33](drafts/DHR-B-33-Claude假就绪blocked盲区-候选.md)。**其中两条是主控自己的过头表述**（`W-01`「误判会自愈」——补发条件依赖被改写的派生状态，构成自指；`X-03`「收敛」——实际只是可见的人工暂停），另三条是主控开出的要求与既有契约冲突或无落点（`X-01` 新协议码撞 `reason-codes.md` 全集权威、`X-02` probe 无落点、`X-04` `relay.event/v2` 是 `additionalProperties:false`），已全部改掉。
  - **用户裁决（对话点选，均与主控推荐一致）**：①`D-B33-1` 修在**观测层**（仅当 `agent get`=`idle` 时多读一次 `pane get`），覆盖启动 / 轮询 / recovery 三时点；②`D-B33-2` **并入 `F-6807`**，并接受「恰补发一次」仅保证**单个 driver 届内**、跨进程重启的重复发送是明示接受的已知限制；③`D-B33-3` **DHR_35 等 DHR_69**。理解问题「做完后在新目录派 Claude 会发生什么」用户答**「停下来等你按，按完接着干」**（正确，且准确区分了本卡与 A-27 主卡的边界）。
  - **承诺边界（如实登记）**：本卡**不承诺自动收敛**——两信号持续打架时节点停在一条**可见**的 Attention 上由人裁，relay 不改信 `agent get` 自动放行、不自动判节点失败。**不新增任何协议 reason code**（用冻结的 `detail` 键格式区分）。本卡**一个字节都不碰产品配置、零按键**。
  - **不变项**：`design/13` 的目标 / 边界 / `A27-*` 稳定验收 ID 与 D-1/D-2/§1.3.5 三项用户裁决、`design/12` 的 `P6-RI-A1~A5`、Receipt/Result/Store/RPC/contracts 合同、Linux `B-22`① 延后语义、`P6-M1~M7` 均不变；本卡是"修实现以兑现既有语义"，**不触发 A-full**。本确认只授权本次 DevPlan、审核工件与 DHR_35/DHR_68 合同同步落盘；**不授权** DHR_69 D-start、生产代码改动、真实 Agent、产品配置读写、A-27 主卡发 ID、`P-A1`/`P-A2` 实测、verify、合并、推送、部署或环境操作。
- **B-30 DHR_67 Attempt 边界澄清（2026-08-30，已确认）**：DHR67 需求复核发现既有 driver 先开 Attempt/Receipt、再调 adapter；因此将 DHR67 的失败验收收窄为“adapter 不额外创建 Attempt/Result，已创建 pane 时只关闭同一 pane；既有 Attempt 仍由 driver 进入既有人工处理”。[fresh 审核记录](../design/evidence/28-DHR67-Attempt边界-B调整审核记录.md) P0=0；不改 driver、Store、Receipt/Result 合同、任务类型、允许路径、依赖或 DHR35 真实闭环责任。用户在解释后明文“按你推荐的来”。
- **B-31 DHR_66 Codex projection 漂移修复（2026-08-31，已确认并生效）**：DHR66 E-6602 证明现役 Codex 配置已无旧 `/profiles` 顶层键；本机 Codex CLI 0.151.0 的 `--profile` 使用 `$CODEX_HOME/<name>.config.toml` overlay，当前 main 入口又未选择 overlay。向基础 `config.toml` 伪造 `profiles` 标量既不代表现役入口身份，也可能破坏 strict config。最终方案为删除 registry 中已漂移的 `/profiles` projection 声明、保留现役且已声明 nonsecret 的 `/model`，由既有 reader 生成 Receipt 四字段；不得修改 Codex 产品配置、读取/落盘 projection 值或扩大生产代码。正式设计的 P6-RI-A5 仍是“坏 registry 拒绝 + 两个指定 Profile 修复后通过 + 零配置正文/凭据”，不变。fresh 审核初轮 P0=0/P1=3，整改后定向复审 P0/P1=0；用户 2026-08-31 明文授权主控完成 P6 剩余任务并按需求自行裁决，审核与理解记录见 [evidence/29](../design/evidence/29-DHR66-Codex-projection漂移-B调整审核记录.md)。
- **B-32 Herdr 宿主真实接线缺陷（2026-08-31，已确认并生效）**：DHR_35 首次真实实录（DSH-off Windows，真实 Codex + 真实 Claude Code）证明 fixture 侧可用后，剩余失败全部落在其禁改的生产路径，且都是 fake CLI 无法暴露的：**A** `makeHerdrCli` 写死的 10 秒超时被所有 CLI 命令共用，而真实 Codex `agent start` 实测 min 6850 / 中位 10934 / max 29482 ms、主机侧 6/6 成功但 3/6 超限——超限时 agent 已建成却被 adapter 当失败关掉同一 pane 并报 `E_EXECUTOR_HOST_LOST`，且泄漏活 agent；**B** 真实 `herdr pane run` 成功时 exit 0、stdout 为空，adapter 却以 `json:true` 调用，Claude 路径 100% `json-parse` 失败（DHR_67 的 fake 返回 `{ok:true,value:{}}`，故其 Claude 路径从未在真实宿主跑通）；**C** 启动期 `blocked`（产品目录信任框）被 `agent start` 报成 `agent_not_ready` 失败，且**即使 adapter 返回 handle，现役 driver 也写不出 blocked Attention**——启动即 blocked 时 `lastStatus` 已被初始化为 `blocked`，轮询分支仅在 `lastStatus !== 'blocked'` 时才写 `human_input_requested`（此条由第一轮 fresh 审核实读 `workflow-driver.mjs` 核出）。新增 **DHR_68（standard/heavy）**承接三条，允许路径含 `herdr-cli.mjs`、`herdr-executor.mjs`、`workflow-driver.mjs`（仅启动期 blocked 事件路径，不动 Result 判定）、`herdr-adapter.test.mjs`、`fake-herdr.mjs` 与其工作区；并把「fake 夹具返回形态必须对齐真实 CLI」升级为验收项 D。DHR_35 新增依赖 DHR_68；DHR_67 保持“已完成”但任务表备注补记 fake 覆盖局限。第一轮 fresh 只读审核（codex `--sandbox read-only`）出 2×P1、3×P2，主控**全部采纳、无驳回**；定向复审确认 R-01~R-05 均已落实、无新增问题，记录见 [evidence/30](../design/evidence/30-DHR68-Herdr宿主真实接线缺陷-B调整交叉审核记录.md)、草案见 [drafts/DHR-B-32](drafts/DHR-B-32-Herdr宿主真实接线缺陷-候选.md)。**用户裁决（对话明文）**：①新项目信任语义 = 安全暂停 + 人工确认，**不做受控自动信任**（后者须先走 A-full），故本调整不触发 A-full；②启动专用超时 = **60 秒且不暴露配置面**；③DHR_67 保持已完成 + 表内备注限定。用户最终明文「直接同意」。design/12 的 P6-RI-A1~A5 定义与稳定 ID、Receipt/Result/Store/RPC/contracts 合同、Linux B-22 延后语义、P6-M1~M7 与 DHR_35 的真实闭环责任均不变；DHR_68 只是 P6-RI-A4 的启动前置，不承接 A4 本身。本确认只授权本次 DevPlan、审核工件与 DHR_35 合同同步落盘；**不授权** DHR_68 D-start、生产代码改动、真实 Agent、verify、合并、推送、部署或环境操作。

- **DHR_61 D 开工（2026-08-29，已确认）**：用户在 B-23 落盘、`DHR_34 blocked-by:DHR_61` 与“下一关为 DHR_61 独立工作区”说明后明文“确认”。本次只开启 DHR_61 的标准档 S0/S1/S2：主树建八件套、冻结施工合同并切独立 `wt/DHR_61`；不授权 DHR_34 施工、凭据读取、账号配置、真实产品操作、verify、推送、部署或环境操作。

## 1. 概述

- **交付什么 / 不含什么**：
  - 交付：①Executor Profile Registry；②本机五类入口（`codex / codex-ninth / claude / claude-grok / claude5`，仅为用户已知别名，真实映射由审计取得）的可证配置映射；③Herdr Runtime Adapter 与状态对账；④Relay CLI 中的 Herdr 状态、host_ref 与附着入口；⑤身份指纹、能力位、quota 样本与 fallback 关系；⑥Windows 上至少一条 Codex 与一条 Claude Code 真实节点；⑦Linux Headless/SSH 上至少一条 Herdr 持久会话 smoke（`DHR-B-22` 调整① 延后，汇合点 = P6 阶段闸裁决）；⑧DSH 关闭下完整完成一次 Herdr 节点观察与 Result 回收；⑨DSH / Pi 可用时作增强客户端显示同一状态（不阻断核心）。
  - 不含：DevHarness 完整单卡、多卡调度、自由账号切换、计划内任意 CLI 参数、凭据管理器、自动登录、跨机器 Relay 调度、Linux 完整 DevHarness 收口、让 Pi 模型 API Agent 冒充 Codex/Claude Code 产品 Agent。
- **最早可用结果**：Relay CLI → Relay Runtime → Herdr → Codex CLI / Claude Code；基线控制路径 = Relay CLI + Herdr CLI，DSH 页面 / Pi TUI / pane 聚焦按钮属增强。
- **承接设计**（拆计划输入 = `design/README.md` 白名单）：
  - [design/06](../design/06-多控制面与Headless-SSH运行-设计补充.md) · 「验收命题」节 **H4 / H5 / H7 / H9 / H12** + §4 控制客户端与执行器必须分开、§5 Linux Headless 与 SSH 拓扑、§9 Fallback 规则（Herdr 不可用）、§10「P6」。
  - [design/05](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md) · §7 两种 Profile（7.1 Executor Profile 示例）、§8 Agent 执行策略（8.2 实际 Codex 和 Claude Code 产品）。
  - [design/02](../design/02-完整流水-产品设计与验收.md) · **B4**（用户级注册表执行侧生效、真实拉起 codex-ninth、receipt 记 profile/account_alias/config_fingerprint、零凭据）、**B5**（quota 高置信识别与预登记 fallback）、**B15 ⑤**（可信只读承载 = 注册表能力位而非 prompt）——作为契约 Oracle。
  - [design/11](../design/11-P6身份与额度治理契约调整.md) · **P6-IQ-A1~A5**、D1~D3：Attempt Receipt 身份快照、原子 fallback pause/retry、fence/Attention、可恢复 Store mutation、v1/v2 RPC 兼容与 DHR_34 的 D3 边界。
  - [design/12](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md) · **P6-RI-A1~A5**：Receipt 绑定 Result 提交、单写者/恢复、Herdr 仅观测、全 registry fail-closed 与 Windows 实录边界。
  - 研究来源（非拆计划输入）：[design/03 Herdr 底座研究](../design/03-完整流水-Herdr底座-产品设计与验收.md) 与 [evidence/03 preflight 实测](../design/evidence/03-Herdr底座-preflight实测与审核记录.md) 的结论继续复用：Herdr 状态属宿主观测、不代表 Relay 节点成功；信任弹窗 / 漏事件 / 进程退出 / 版本漂移需对账补偿；psmux 只作 legacy 回退。
- **前置条件**：P5 核心 Gate 通过；Runtime、RPC、Store、参考 CLI、basic-agent-task 稳定；用户明确放行 P6；本机审计任务已按安全边界确认；凭据值不入任何工件；Linux 笔记本能 SSH 登录——若当时不可达，DHR_33 先冻结 Headless fixture，DHR_35 收口前必须补真实 SSH smoke（`DHR-B-22` 调整① 延后：该「必须」的执行时点推迟至 P6 阶段闸裁决，标准不松动）。
- **实施策略一句话**：先审计后冻结（Profile 名称与能力由本机事实决定，计划只引用稳定 ID），Herdr Adapter 以事件快路 + snapshot 慢路双通道对账，全部在「DSH 关闭」路径上验收，DSH/Pi 只作附加客户端对证。
- **任务前缀 / 模块 slug**：`DHR_` / `dh-relay`。
- **批次**：批次 1=`DHR_32`（审计 + 注册表）；批次 2=`DHR_33`（Adapter + CLI/SSH）；批次 3=`DHR_61`（前置协议契约）；批次 4=`DHR_34`（quota/fallback 编排）；批次 5=`DHR_63`（受限 registry 维护）、`DHR_64`（Receipt Result bridge）与 `DHR_65`（runtime registry loader fail-closed）；批次 6=`DHR_35`（Windows 真实闭环，第一个端到端 demo）。

## 2. 工程切分

### 2.1 实现单元

| 单元 | 职责 | 入口 / 主要文件 | 关联任务 |
|---|---|---|---|
| profile-registry | Executor Profile Registry schema 与脱敏注册表；`herdr.codex.<alias>` / `herdr.claude.<alias>` 占位结构 | `relay-core/profiles/`（与 contracts 平级；Runtime 侧接线在 DHR_33/34）、用户级注册表文件（路径由 DHR_32 冻结） | DHR_32 / DHR_34 |
| audit-evidence | 本机五类入口审计工件（脱敏）：命令、配置来源、身份信号、产品/模型、平台、能力、quota 样本、fallback、Herdr 启动方式 | `workspace/DHR_32/evidence/` | DHR_32 |
| herdr-adapter | `launch / observe / capture / focus / attach / send / stop / reconcile`；Herdr 状态 → Relay 状态映射；HostObservation | Runtime `executors/herdr/` | DHR_33 |
| cli-herdr | `relay status / inspect / events --follow` 接通 host_ref 与最后观测；新增 `relay focus <run_id> <node_id>` | `cli/` | DHR_33 |
| identity-quota-contract | Attempt Receipt、fallback pause/retry、Store mutation、fence/Attention、RPC v1/v2 兼容与 registry 容量校验 | `relay-core/contracts/`、`store/`、`rpc/`、`profiles/`、Runtime 签发接点 | DHR_61 |
| identity-quota | quota 检测器、合格 fallback 选择与 fresh Attempt 编排 | Runtime `executors/identity/`、`quota/`、`workflow-driver.mjs` | DHR_34 |
| registry-repair | 已冻结 executor registry 的非敏感元数据维护与整体 fail-closed 复验 | 用户级 registry、`workspace/DHR_63/evidence/` | DHR_63 |
| codex-projection-repair | Codex nonsecret projection 漂移修复与 Receipt 身份复验 | 用户级 registry、`workspace/DHR_66/` | DHR_66 |
| receipt-result-bridge | Receipt 绑定 submission、v2 RPC、service/driver gate、恢复与 Herdr completion instruction | `contracts/`、`store/`、`rpc/`、`runtime/` | DHR_64 |
| claude-windows-launch | Windows Claude 的受支持 Herdr 启动、识别、rename 与新 pane 失败收口 | `runtime/executors/herdr/`、定向测试、`workspace/DHR_67/` | DHR_67 |
| e2e-evidence | Windows Codex + Claude Code Receipt submission 真实节点、DSH 关闭闭环实录 | `workspace/DHR_35/evidence/` | DHR_35 |

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
| DHR_32 | 审计本机 Codex/Claude 多账号并冻结 Executor Profile 注册表 | 标准 | 已完成 | P5 阶段闸（已过，2026-08-29） | [workspace/DHR_32/](../workspace/DHR_32/) | squash `2667f4a`（2026-08-29）；verify `2f80fa1`（2026-08-30） | 任务类型=normal；复核收敛（代码13+需求14+教训，返工1闭环，E-3201~05 通过）；用户 E10 收口确认、B-22 追认与 verify 已闭合 |
| DHR_33 | 实现 Herdr Adapter、CLI/SSH 能力探测与状态对账 | 标准 | 已完成 | DHR_32（产物已合入） | [workspace/DHR_33/](../workspace/DHR_33/) | squash `66dd16a`（2026-08-29）；verify `5d662b6`（2026-08-30） | 任务类型=heavy；复核与返工已收敛；Linux 项延后获用户受理（B-22①）；E10、E-3303/3304/3307/3308 与候选-40 裁决 B 已闭合 |
| DHR_61 | 冻结 Attempt 身份、暂停/重试、Store 恢复与 RPC 兼容契约 | 标准 | 已完成 | DHR_33（产物已合入，待人验不阻塞） | [workspace/DHR_61/](../workspace/DHR_61/) | squash `84eb2bf`；verify `45233b9`（2026-08-30） | 任务类型=heavy；用户人验放行；Opus 五路 P0/P1=0；237/237；模块 dh-check 0 failure |
| DHR_34 | 接通 quota 分类、合格 fallback 选择与 fresh Attempt 编排 | 标准 | 已完成 | DHR_33、DHR_61（均已有可消费的 master 产物） | [workspace/DHR_34/](../workspace/DHR_34/) | squash `8cae0f6`；verify `0b72cb6`（2026-08-30） | 任务类型=heavy；仅 D3，禁止 `contracts/**`、签发服务、Store 与 RPC；P6-M4 由用户接受为 constrained，真实样本/detector/judge/retry 执行闭环→DHR_35 |
| DHR_63 | 恢复并验证受限 Executor Profile registry 解析 | 标准 | 已完成 | DHR_32、DHR_61 | [workspace/DHR_63/](../workspace/DHR_63/) | squash `eebaf24`；verify `3a9a7e7` | 任务类型=light；仅已冻结 registry 的非敏感维护已收口；仅与 DHR_65 共同闭合 P6-RI-A5，未解除 DHR_35 的 DHR_64/DHR_65 阻塞 |
| DHR_64 | 实现 Receipt 绑定 Result 提交桥接 | 标准 | 已完成 | DHR_61、DHR_34 | [workspace/DHR_64/](../workspace/DHR_64/) | squash `0dd371d`；verify `8376e02`（2026-08-30） | 任务类型=heavy；五路复核 PASS，稳定定向 15/15；默认全量 Windows 未得终态不作绿色，旧 DHR_33/DHR_34 语义断言迁移另行决策；承接 P6-RI-A1~A3 |
| DHR_65 | 让 runtime registry loader 对完整 registry fail-closed | 标准 | 已完成 | DHR_32、DHR_61 | [workspace/DHR_65/](../workspace/DHR_65/) | squash + verify 本提交（2026-08-30） | 任务类型=normal；用户 E11 已认可；主干专项 5/5、profiles 14/14、contracts audit 0、模块体检 0 failure；承接 P6-RI-A5 runtime/mutation 部分 |
| DHR_66 | 修复 Codex nonsecret identity projection 漂移 | 标准 | 已完成 | DHR_63、DHR_65（均已完成） | [workspace/DHR_66/](../workspace/DHR_66/) | squash `459b8ac`（2026-08-31）；verify 本提交 | 任务类型=light；E11 用户明文认可；release_mode=full；主干复验 validator PASS、strict config exit 0、定向 23/23、模块体检 0 failure；仅删 registry 漂移 `/profiles`、保留 `/model` |
| DHR_67 | 接通 Windows Claude 受支持 Herdr 启动路径 | 标准 | 已完成 | DHR_33、DHR_64、DHR_65（均已完成） | [workspace/DHR_67/](../workspace/DHR_67/) | squash `eb3c618`；verify `aecb159`（2026-08-31）；release_mode=full | 任务类型=heavy；用户已授权本地收口；主干定向 6/6、contracts audit 0 failure、模块体检 0 failure；仅限精确 Herdr adapter/test 路径。**B-32 限定**：已完成仅指当时 fake 覆盖；其 fake `paneRun` 返回 `{ok:true,value:{}}`，与真实 herdr 的 exit 0 + 空 stdout 不符，**真实 Claude 启动未被覆盖**，反例与修复由 DHR_68 承接 |
| DHR_68 | 修 Herdr adapter/driver 的真实宿主接线缺陷 | 标准 | 已完成 | DHR_64、DHR_67 | [workspace/DHR_68/](../workspace/DHR_68/) | squash 本提交；verify 见下一提交（2026-08-31）；release_mode=full | 任务类型=heavy；用户明文「可以收口」；五路复核+一次整改复验全闭合、发现全采纳无驳回；变异点由第二轮复核实例选点并验红绿；定向 27 例 24 通过（3 例与未改代码的 master 同名同因）、`dh dh-relay` 0 失败；范围外跟踪 F-6807（recovery 届同类缺陷）与 F-6808（as-built delta）；B-32 新增，承接 DHR_35 实测的三缺陷（启动超时上限 / `pane run` 期待 JSON / 启动期 blocked 报成失败）；启动专用超时冻结为 60s 且不暴露配置面；不代产品做信任决定。**B-33 限定**：其启动期 blocked 检测对 Claude 的**假就绪**形态（`agent get`=idle ∧ `pane get`=blocked）失效（`F-6809`），反例与修复由 DHR_69 承接 |
| DHR_69 | 修 Claude 假就绪导致的 blocked 盲区（启动/轮询/recovery 三时点） | 标准 | 进行中 | DHR_67、DHR_68（均已完成） | [workspace/DHR_69/](../workspace/DHR_69/) | | 任务类型=heavy；B-33 新增，承接 `F-6809` 并按用户裁决并入 `F-6807`；A-27 的**硬前置**（`A27-M7` 依赖它）。仅当 `agent get`=idle 时多读一次 `pane get`；**不承诺自动收敛**、**不新增协议 reason code**、**不碰产品配置、零按键、不跑真实 Agent**；「恰补发一次」仅保证单个 driver 届内。D-start：2026-08-31 用户点选授权开工 / 开树 / 本会话自干 |
| DHR_35 | 用 Codex、Claude Code 跑 Windows 真实执行闭环 | 标准 | 进行中 | DHR_34、DHR_63、DHR_64、DHR_65、DHR_66、DHR_67、DHR_68（已完成）、**DHR_69（进行中）** | [workspace/DHR_35/](../workspace/DHR_35/) | | **B-33 新增阻塞 `DHR_69`**：Claude 假就绪会把宿主阻塞**错误归因**为 `E_EXECUTOR_RESULT_MISSING`，污染实录；用户 2026-08-31 裁决「等」。DHR_69 收口后方可重跑，且仍需用户重新授权真实 Agent；Linux SSH 按 B-22 ① 延后，P6 阶段闸再裁决 |

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
- **变更范围**：`relay-core/profiles/` schema/校验器/fixtures、`relay-core/test/profiles.test.mjs`、`relay-core/package.json` 的 test script 单 token、用户级注册表候选、`workspace/DHR_32/`；不改其余 Runtime/Store/RPC 业务代码。
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

#### DHR_61

- **目标**：冻结并实现 design/11 D1/D2 的 Attempt Receipt 身份快照、pause/retry 事件、fence/Attention、可恢复 Store mutation 与 RPC v1/v2 兼容，让无 fallback 的人工等待、旧 Attempt 拒写和人工 retry 有唯一可重放的持久真相。
- **非目标**：不做 quota 分类器、自动选择 fallback 的业务编排或真实产品闭环；不读写凭据、用户级账号配置或自动登录；不解除 DHR_34 阻塞。
- **验收口径**：
  - **机器证**：[design/11 P6-IQ-A1](../design/11-P6身份与额度治理契约调整.md#3-验收清单)：Attempt Receipt 在开立、持久化、重放中同一身份，`launch-receipt/v2` 历史形态保持可读，工件零凭据。
  - **机器证**：[design/11 P6-IQ-A3](../design/11-P6身份与额度治理契约调整.md#3-验收清单)：canonical `fallback_pause_created` 原子导出 fence、`waiting_human` 和 Attention；重复/冲突/损坏/截断及各 journal 强杀阶段均 fail-closed，迟到写入返回 `E_ATTEMPT_FENCED`，v1 不静默丢失 Attention。
  - **机器证**：[design/11 P6-IQ-A5](../design/11-P6身份与额度治理契约调整.md#3-验收清单)：v2 `retry-with-profile` 仅接受冻结且仍匹配的 profile；幂等、关闭 pause、快照不匹配和部分失败均有定向反例。
- **变更范围**：`relay-core/contracts/**`、`relay-core/store/**`、`relay-core/rpc/**`、`relay-core/profiles/**`、必要的 Runtime Receipt 签发接点及定向测试；本卡 `workspace/DHR_61/`。
- **档位**：标准；任务类型=heavy（协议、持久 Store、RPC 组件接线与身份/权限相邻）。
- **实施提示**：注册表、Receipt、事件 detail、journal 与测试样本只能包含已批准的脱敏字段；单卡完成 D1/D2 后由 DHR_34 消费，不得把 D3 quota 判定也纳入本卡。

#### DHR_34

- **目标**：仅消费 DHR_61 冻结的 Receipt、pause/retry 与 Store/RPC 契约：只在高置信 quota 样本命中时选择合格的已冻结 fallback 并编排 fresh Attempt；普通 / 权限 / 网络错误不误判为额度耗尽；无合法 fallback 时调用既有 `waiting_human/needs_you` 的 pause/Attention 合同。
- **非目标**：不扩 Receipt schema、Store、RPC、事件或 registry 合同；不做自由账号切换、凭据管理与自动登录；不在客户端离线时自动选未授权账号。
- **验收口径**：
  - **机器证**：[design/11 P6-IQ-A2](../design/11-P6身份与额度治理契约调整.md#3-验收清单) + [design/02 B5](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P6-M4：高置信 quota + 合格 fallback → fresh Attempt；非额度错误 → 不判 quota；无合法 fallback 不自动切换。
  - **机器证**：[design/11 P6-IQ-A4](../design/11-P6身份与额度治理契约调整.md#3-验收清单) + [design/02 B4](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P6-M2/M7：客户端变化不改变已冻结的 Executor Profile / Attempt / Result 身份链。
  - **机器证**：[design/06 H12](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：fallback 产生 fresh Attempt，不续用旧身份链。
- **变更范围**：Runtime `executors/identity/`、`quota/`、`workflow-driver.mjs` 的 D3 编排接线与定向回归；本卡 `workspace/DHR_34/`；禁止 `contracts/**`、Receipt 签发服务、Store 与 RPC。
- **档位**：标准（身份与权限红线相邻）。
- **实施提示**：P6-M4 允许 `passed / constrained`——固定 Profile 的身份与 Herdr 闭环成立时，用户可决定先进 P7、完整自动 fallback 延后到 P8；权限与身份红线不因此降级。

#### DHR_63

- **目标**：只维护用户级 `~/.dh-relay/executor-profiles.json` 中两个已冻结 Windows Executor Profile 的非敏感元数据，恢复 Codex 与 Claude CLI/config 指纹规则的可解析性；全程只记录错误码、字段名和脱敏摘要。它只提供 P6-RI-A5 的 registry 证据，不单独声明 runtime 启动安全通过。
- **非目标**：不改 DHR_32 已完成的 schema/validator 或任何 relay 生产代码；不改 Agent 产品配置、凭据、Runtime、Store、RPC、Herdr 或编排；不读取配置正文、凭据或账号状态。
- **验收口径**：
  - **机器证**：目标 Profile 不再返回 `E_UNRESOLVED_CONFIG` / `E_UNRESOLVED_ALIAS`，字段闭集、路径模板和命令解析均可复跑。
  - **机器证**：[design/12 P6-RI-A5](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收清单) 的 registry 部分：完整 registry 的坏 alias/config 必须被 formal validator 拒绝；不得以局部测试 registry 绕过。真实启动前的 runtime/driver 拒绝与实现级 mutation 由 DHR_65 承接。
  - **机器证**：工件零配置正文、零凭据；身份不可证时明确写「不可证」。
- **变更范围**：用户级 registry 的已冻结 Profile 条目、`workspace/DHR_63/` 脱敏证据、只读调用既有 registry 校验器的定向测试；不得改其 schema/validator。
- **档位**：标准；任务类型=light（唯一施工面为受限非敏感 registry 数据维护；生产 runtime mutation 已拆给 DHR_65）。
- **实施提示**：D-start 前再次说明允许字段与拒绝路径；如果需改动 schema/validator 或读配置正文，停止并另走 A/B 调整。

#### DHR_64

- **目标**：实现唯一 Result 成功路径：Receipt 绑定的 `relay.executor-result-submission/v1` 经 v2 `submit-executor-result`、受控 service actor 与可恢复 Store mutation 提交；driver 只等待该提交，缺失时进入 `human_input_requested:E_EXECUTOR_RESULT_MISSING` 与 `waiting_human/needs_you`。
- **非目标**：不修改用户级 Agent/registry 配置、不启动真实 Agent、不做 Linux 特性/环境动作；不把 `quota_signal`、自动 fallback 或自由 structured 重新放进 Result 提交。
- **验收口径**：
  - **机器证**：[design/12 P6-RI-A1/A3](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收清单)：仅当前 Attempt Receipt 接受 submission；仅 committed 同 digest 重复可幂等；其余重复、冲突、旧/fenced/pause/终态/未认证/lease-lost/损坏/截断均不改账。
  - **机器证**：Result file、事件与 Attempt 状态由同一 recovery journal 原子提交；每个 prepared 强杀点恢复无孤儿或矛盾状态，Ack 在 committed 后返回。
  - **机器证**：service ready 前恢复 receiver/actor/lease/driver gate；失败不得改账或新开 Receipt/Agent/fallback，service 不得绕过 driver gate 直写 Result。
  - **机器证**：[design/12 P6-RI-A2](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收清单)：`done`、judge、capture、pane、host status、exit code 均不直写结果或触发 quota/fallback；Herdr completion instruction 仅承载 Receipt submission，缺失提交进入人工等待。
  - **机器证**：v1 保持 Attention 语义，v2 不静默降级；失败 reason 固定 `E_EXECUTOR_REPORTED_FAILURE`。
- **变更范围**：既有 `relay-core/contracts/**`、`relay-core/store/**`、`relay-core/rpc/**`、`relay-core/runtime/service.mjs`、`relay-core/runtime/workflow-driver.mjs` 保持本卡归属；Herdr/CLI/测试只允许下列精确路径：
  <!-- dh:allowed-paths:v1 -->
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/cli/client.mjs`
  - `relay-core/cli/main.mjs`
  - `relay-core/test/dhr64-result-bridge.test.mjs`
  - `relay-core/test/contracts.test.mjs`
  - `relay-core/package.json`
  - `relay-core/capability-baseline.json`
  - `relay-core/tools/capability-baseline.mjs`
  - `relay-core/tools/structural-tokens.txt`
  - `docs/modules/dh-relay/workspace/DHR_64/**`
  DHR_64 不得改 `relay-core/runtime/executors/herdr/profile-registry.mjs` 或 DHR_65 新测试；未列的 Herdr/CLI/测试路径不因本卡获得写入权限。
- **档位**：标准；任务类型=heavy（协议、持久 Store、RPC 与 Runtime 组件接线）。
- **实施提示**：删除/封堵任何 `herdrJudge/captureHerdrResult → recordResult` 支路；遇 schema、恢复或原因码不可证时停止并新开设计调整，不得转嫁给 DHR_35。

#### DHR_65

- **目标**：让 runtime registry loader 对 alias 与 config 指纹规则执行与 formal validator 等价的 fail-closed 解析；完整正式 registry 的任一坏 alias/config 必须在 Workflow Driver 创建 Attempt、Agent、pane 或 Result 前被拒绝。
- **非目标**：不改用户级 registry、Agent 产品配置、凭据、身份/额度选择、Receipt/Store/RPC/Result bridge、DHR_35 或 Linux；不改 `herdr-executor.mjs`、现有测试、contracts/store/rpc/service/workflow-driver 或 CLI。
- **验收口径**：
  - **机器证**：[design/12 P6-RI-A5](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收清单) 的 runtime 部分：使用完整正式 registry 的结构等价测试副本，任一已登记 Profile 的坏 alias/config 都使 runtime loader 与 driver 在真实启动前 fail-closed；不得用仅含目标 Profile 的局部 registry 替代，工件不得落配置正文或凭据。
  - **机器证**：好 registry 仍可解析 `herdr.codex.main`、`herdr.claude.main`；坏 registry 不创建 Attempt、Agent、pane 或 Result。
  - **机器证**：对 loader 的 alias-resolve 分支做实现级 mutation，指定测试必须断言失败后还原转绿。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_65 -->
  - `relay-core/runtime/executors/herdr/profile-registry.mjs`
  - `relay-core/test/dhr65-registry-loader.test.mjs`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_65/**`
  - `docs/modules/dh-relay/knowledge/教训库-候选.md`
  B-26 对 `relay-core/package.json` 的唯一授权是将本卡专属测试加入既有 `npm test` 显式清单。
  B-27 对 `knowledge/教训库-候选.md` 的唯一授权是追加 DHR_65 miner 候选；不得改正册。
  DHR_65 不得改 DHR_64 的任何允许路径或用户级 registry。
- **档位**：标准（runtime loader 行为与实现级 mutation）。
- **任务类型**：常规<!-- dh:task-type:v1 task=DHR_65 type=normal -->
- **实施提示**：必须另行 D-start；若需扩大到 driver/其他运行时文件或改变 design/12 契约，停止并另走 A/B 调整。

#### DHR_66

- **目标**：修复 `herdr.codex.main` 用户级 registry 的 nonsecret identity projection 与现役 Codex 配置漂移：移除当前入口已不存在且不代表 overlay 选择的 `/profiles` 声明，保留可由既有 reader 证明的 `/model`，让 `freezeProfileIdentity` 在真实 Attempt 前冻结既有 Receipt 身份，不扩大身份合同。
- **非目标**：不向 Codex 产品配置伪造 `profiles` 键，不读写凭据、Token、Cookie、产品配置正文或投影值；不登录；不改 registry schema/validator、fallback、Runtime、Store、RPC、Result、Herdr 或 DHR35；不启动真实 Agent。
- **验收口径**：
  - **机器证**：[design/12 P6-RI-A5](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收清单) 的指定 Codex Profile 复验：旧 `/profiles` 声明缺键的红证在 Attempt、Agent、pane、Result 前拒绝；修复 registry 声明后 `freezeProfileIdentity` 仍产生 `executor_profile_id`、脱敏 `account_alias`、`config_fingerprint`、`executor_capability_hash` 四字段，工件仅含 hash/错误码/脱敏摘要。
  - **机器证**：现役入口没有 overlay selector，Codex 基础配置不因本卡写入；`/model` 未声明 nonsecret、pointer 坏/不安全或值不可证时仍 fail-closed；projection 值、配置正文与凭据零进入工件。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_66 -->
  - `docs/modules/dh-relay/design/README.md`
  - `docs/modules/dh-relay/design/evidence/29-DHR66-Codex-projection漂移-B调整交叉审核记录.md`
  - `docs/modules/dh-relay/workspace/DHR_66/**`
  Git 范围对账只覆盖仓内 workspace；用户级 registry 仅可删除 `herdr.codex.main.config_fingerprint_rule.fields` 中已漂移的 `/profiles` 一项并保留 `/model`，绝不扩大。不得修改 Codex 产品配置、仓内生产代码、DHR63/65 已完成工件或其他用户配置。
- **档位**：标准（用户级身份元数据与零敏感证据）。
- **任务类型**：轻量<!-- dh:task-type:v1 task=DHR_66 type=light -->
- **实施提示**：B-31 后只可修改上述 registry field 声明；不得把 projection 值或配置正文写入命令输出、证据或 commit。变更前后以 registry/config hash、字段名、错误码、四字段键名和长度证明，不记录值。

#### DHR_67

- **目标**：让 Windows Claude Code 经 Herdr 使用受支持的 `pane run → 有界唯一自动识别 → agent rename → 交给既有 Attempt` 路径；Codex 继续使用既有 `agent start` 路径。
- **非目标**：不改用户级 registry、产品配置或凭据；不改 profile registry、workflow driver、Store、RPC、contracts、Receipt/Result 语义；不把 Herdr done、pane 文本或 exit code 当 Result；不跑 DHR35 真实 Agent。
- **验收口径**：
  - **机器证**：[design/12 P6-RI-A4](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收清单) 的 Windows Claude 启动前置：fake Herdr 证明 Claude 调用顺序、唯一命名与返回 handle 是 `pane run → 唯一识别 → rename`，Codex `agent start` 调用不变。
  - **机器证**：零/多个识别对象、识别超时或 rename 失败时，adapter 不额外创建 Attempt/Result；已创建 pane 时仅关闭本卡创建的同一新 pane，无 pane 时不执行关闭；既有 Attempt 仍由 driver 进入既有人工作处理。工件不泄露配置正文或凭据。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_67 -->
  - `relay-core/runtime/executors/herdr/herdr-cli.mjs`
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/helpers/fake-herdr.mjs`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_67/**`
  不得改 `relay-core/runtime/executors/herdr/profile-registry.mjs`、driver、Store、RPC、contracts 或 DHR66 的用户级 registry。
- **档位**：标准（Windows 外部宿主组件接线）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_67 type=heavy -->
- **实施提示**：必须另行 D-start；若受支持 CLI 无法唯一识别或关闭同一新 pane，fail-closed 并停止，不得引入 status→Result 推导或扩大到 DHR35 实录。

#### DHR_68

- **目标**：让 Herdr adapter 与 driver 在**真实宿主**上正确接线三件事——启动调用给足时限且超时后先对账再决定回滚、`pane run` 不期待 JSON、启动期 `blocked` 保留 handle 并按 design/06 形成一次持久 Attention。
- **非目标**：不改 Receipt/Result/Store/RPC/contracts 语义；不改 driver 的 **Result 判定**逻辑（只动启动期 blocked 的事件路径）；不改用户级 registry、产品配置或凭据；不把 Herdr `done`、pane 文本或 exit code 当 Result；**不代产品做信任决定、不自动确认任何目录信任**；不跑 DHR_35 的真实闭环实录；不碰 Linux/SSH。
- **验收口径**（均为机器证）：
  - **机器证 A**：启动调用使用**启动专用**超时默认值 **60 秒**（B-32 用户裁决冻结；**不暴露配置面**，不新增环境变量或 registry 字段），其余 CLI 命令继续用现有 10 秒默认、超时语义不变；以 DHR_35 已有的 29482 ms 真实样本形态证明该启动能完成；fake 覆盖「超时后 agent 存在」与「超时后 agent 不存在」两支，前者继续走既有 handle 路径、后者才关闭本卡创建的同一 pane。不得声称“默认足以覆盖任意未来启动”（不可证）。
  - **机器证 B**：`paneRun` 不再期待 JSON；以**对齐真实 herdr 输出形态**（exit 0 + 空 stdout）的 fixture 证明 Claude 启动继续走 `pane run → 唯一识别 → rename → 交既有 Attempt`，且 Codex `agent start` 的 argv 与返回处理不变。
  - **机器证 C**：`agent start` 返回启动期 `blocked`（含 `agent_not_ready`）时——adapter 返回 handle、不关 pane、不额外创建 Attempt/Result；driver **不发 completion instruction**，并**恰好写一次**带 blocked 观测的 `waiting_human` + `human_input_requested`，不写 `E_EXECUTOR_HOST_LOST`。以 fake 正负例 + driver 事件序列断言证明。承接 [design/06 H1/H5](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)；本卡**只是** [design/12 P6-RI-A4](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收) 的**启动前置**，不承接 A4 本身（A4 是完整闭环命题，仍归 DHR_35）。
  - **机器证 D（取证纪律）**：`relay-core/test/helpers/fake-herdr.mjs` 中被本卡触及的每个命令，其**返回形态**须与真实 herdr 一致，并留下逐命令的真实输出对照证据（exit code + stdout 是否为 JSON）。这是本卡存在的直接原因，是验收项而非提示。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_68 -->
  - `relay-core/runtime/executors/herdr/herdr-cli.mjs`
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/runtime/workflow-driver.mjs`
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/helpers/fake-herdr.mjs`
  - `docs/modules/dh-relay/workspace/DHR_68/**`

  不得改 `profile-registry.mjs`、`service.mjs`、Store、RPC、contracts、用户级 registry 或 DHR_35 工作区。`workflow-driver.mjs` 只可改启动期 blocked 的事件路径，不得动 Result 判定。
- **档位**：标准（组件接线 · 高危五类之一）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_68 type=heavy -->
- **实施提示**：必须另行 D-start。超时对账**不得**退化成“重试一次启动”（会拉起第二个真实 agent）。若真实 herdr 的慢启动观测拿不到，fail-closed 停止并回报，不得以 fake 覆盖冒充。

#### DHR_69

- **目标**：让 relay 在 **Claude 报"假就绪"**（`agent get` = `idle` 而实际卡在产品对话框、`pane get` = `blocked`）时仍能判定为 blocked，并落到 DHR_68 已冻结的人工暂停行为上——**保留 handle、不关 pane、扣住 Receipt 提交指令、恰写一条带真实 blocked 观测的 `human_input_requested`、两信号一致后恰补发一次**；且**两信号持续打架时不静默永等，而是升级为一条可区分的 Attention**。覆盖**启动期 / 轮询期 / recovery 期**三个时点（recovery 部分即并入的 `F-6807`）。
- **非目标**：
  - **不预置、不写、不读任何产品配置**（那是 A-27 主卡的事，本卡一个字节都不碰）；**不代答任何对话框、零按键**（全路径无 `send-keys` / `send-text` 新增调用面）；
  - 不改 Receipt / Result / Store / RPC / **contracts** 语义，**不新增任何协议 reason code**；不改用户级 registry、凭据、账号或额度配置；
  - **不跑真实 Agent**——关闭判据是受控回归夹具，不是再观测一次真实产品；
  - **不承诺自动收敛**：两信号持续打架时只保证"可见的人工暂停"，不改信 `agent get` 自动放行、不自动判节点失败；
  - 不碰 Linux / SSH；不承接 `A27-M7` / `A27-M10` / `A27-M11` **本身**（那是 A-27 主卡验收项，本卡只是使其成立的前置）；不修 `F-6808`。
- **验收口径**（均为机器证，无人判项）：
  - **机器证 A（启动期）**：夹具令 `agent start` 返回 exit 0、`agent get`=`idle`、`pane get`=`blocked` → adapter 返回 `launch_blocked=true` 且保留 handle、不关 pane、不额外创建 Attempt/Result；driver **不发**提交指令、**恰写一次**带 blocked 观测的 `human_input_requested`、不写 `E_EXECUTOR_HOST_LOST`。Codex 既有 `agent_not_ready` 路径的 argv 与行为**逐字不变**（负例断言）。承接 [design/06 H1/H5](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)。
  - **机器证 B（轮询期）**：启动正常、中途转为假 `idle`（`pane get`=`blocked`）→ **不得**落进 `done||idle` 分支、**不得**写 `E_EXECUTOR_RESULT_MISSING`、**不得**结束 Attempt；须走 blocked 分支并恰写一条 `human_input_requested`。（本形态由 B-33 首次登记。）
  - **机器证 C（recovery 期 · 并入的 `F-6807`）**：恢复到假 `idle` / 真 `blocked` 的 agent → 发提交指令**之前**先做一次观测；观测为 blocked 时扣住指令走人工暂停，离开 blocked 后**在同一 driver 届内恰补发一次**。**口径显式收窄到"届内"**：`instructionPending` 只是内存变量，跨 driver 重启的重复发送**是本卡明确接受的已知限制**（该限制的文字登记由收口一致性复核检查，不算机器证）。
  - **机器证 D（不静默改写观测）**：`host_observation_changed` 同时留下 `agent get` 原始值、`pane get` 原始值与派生结论三者；仅在 `agent get`=`idle` 时才发起 `pane get`（`working`/`done`/`unknown` 三态下 `pane get` 调用次数断言为 0）。**承载结构冻结**：`relay.event/v2` 是 `additionalProperties:false`、`detail` 是唯一可扩充字段，故三者一律编码进 `detail` 的**受控键值格式**（沿用现役 `herdrDetail()` 的 `k=v;k=v` 形态，键名在 D-start 前冻结），以**解析断言**验证，**不新增顶层字段、不改 schema**。
  - **机器证 E（fake 形态取证纪律，承接 DHR_68/D）**：**E-1** 可复跑只读 shape probe——脚本 `docs/modules/dh-relay/workspace/DHR_69/evidence/scripts/herdr-shape-probe.mjs`，`node` 直跑，取样对象是 `pane split` 出来的**普通 shell pane**（**不启动任何产品 Agent**），采 `herdr pane get` / `agent get` 的 exit code、stdout 是否 JSON、`agent_status` 的**字段路径**与**取值域**，probe 自带解析与断言，产物落 `.../evidence/herdr-command-shapes.json`（脱敏，只留形态）；**E-2** fake 的 `paneGet` 必须按 E-1 实测形态返回（现役只是个 `paneAlive` 布尔桩，**没有状态字段，不得照它想当然**）。**取值边界**：`blocked` 这个取值本身不由 probe 取（那需要真实卡住的 Agent，属非目标），事实基准取自 [evidence/32 §2](../design/evidence/32-A27-目录信任能力矩阵-实测.md)。
  - **机器证 F（持续不一致必须"可见"）**：夹具令 `agent get`=`idle` ∧ `pane get`=`blocked` **持续超过 `T`=60_000 ms**（与现役 `observationLostMs`/`doneTimeoutMs` 同形态、同为 driver 默认参数，**不新增环境变量或 registry 字段**）→ 断言：①提交指令始终未发；②初始 Attention **恰一条**；③超过 `T` 后**恰一条**可区分的升级 Attention——**靠冻结的 `detail` 键区分，`reason` 留空、不新增协议码**，事件里同时留两个原始信号；④两信号恢复一致后**恰补发一次**提交指令；⑤**负向断言**：超过 `T` 后**不得**改信 `agent get` 自动放行、**不得**自动判节点失败。
  - **有效单测（重核卡必做）**：变异点由第二轮复核实例选点；把交叉核对判据改坏（如 `pane get` 结论被忽略）后，指定测试必须变红。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_69 -->
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/runtime/workflow-driver.mjs`
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/helpers/fake-herdr.mjs`
  - `relay-core/test/dhr69-false-ready.test.mjs`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_69/**`

  **限定**：`workflow-driver.mjs` 只可改**观测→事件路径**与 **recovery 分支的发送时机**；「不动 Result 判定」的精确含义是**不得修改** Receipt-bound Result、等待超时与 `E_EXECUTOR_RESULT_MISSING` 的**语义**，但**允许**因受机器证支撑的派生 `blocked` 使该分支**不可达**（那正是机器证 B 要的结果）。`package.json` 只可向既有 test script 追加本卡新测试文件这一个 token。不得改 `herdr-cli.mjs`（现役 `paneGet()` 已够用）、`profile-registry.mjs`、`service.mjs`、Store、RPC、contracts、用户级 registry，或 DHR_35 / DHR_68 的工作区。
- **档位**：标准（外部宿主组件接线 · 高危五类之一）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_69 type=heavy -->
- **实施提示**：必须另行 D-start。`pane get` 的真实返回形态**先取证再写 fake**（E-1 在前、E-2 在后）——这正是 DHR_68 存在的原因，不得重犯。交叉核对**只在 `agent get`=`idle` 时发起**，不得改成每轮双读，也不得反向"用 `agent get` 覆盖 `pane get`"。

#### DHR_35

- **目标**：在 DHR_34/DHR_63/DHR_64/DHR_65/DHR_66/DHR_67/DHR_68/**DHR_69** 闭合后，Windows 分别跑 Herdr + 一个 Codex Profile、Herdr + 一个 Claude Code Profile 的完整闭环（Receipt → Herdr 观测 → checkpoint → `submit-executor-result` → committed Ack → Result → CLI）；DSH 关闭是必测路径。Linux SSH 保持延后。
- **非目标**：不改 Relay 生产代码或用户级 registry；不进 DevHarness 全收口；不做多卡；不跑 Linux/SSH；DSH 可用时只作附加客户端对证，不另跑第二份流程。
- **验收口径**：
  - **机器证**：[design/12 P6-RI-A4](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收清单) · P6-M1：至少一个 Codex 与一个 Claude Profile 完成 Receipt→checkpoint→submission→Result 真实节点，Receipt 身份链可证、零凭据；Herdr/judge 不得直写 Result。
  - **机器证**：[design/06 H9](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M6：Linux SSH 断开 / 重连不丢 Herdr 会话与 Relay Run 真相（真实 SSH，不接受 fixture 替代；`DHR-B-22` 调整① 延后，汇合点 = P6 阶段闸裁决）。
  - **机器证**：[design/06 H1 / H5](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M3/M5：working / blocked / done / unknown 均有真实或受控证据；DSH 关闭时 CLI 显示状态、Attention 与正确 host_ref。
  - **机器证**（P6-X）：[design/06 H3](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：DSH / Pi 可用时连接同一 Run，无第二份状态判断；不可用登记不适用。
  - **人判**：[design/05 §8.2](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#82-实际-codex-和-claude-code-产品) · P6-H：向用户展示 Windows 两条闭环实录 + Linux SSH 实录 + pane 交互延迟；用户判断 Herdr + Codex/Claude Code 是否适合作施工主力、多账号选择与 fallback 是否清楚、Windows pane 交互延迟是否可接受、Linux SSH detach/重连/附着是否适合日常、DSH→Herdr 跳转（若可用）是否自然。
- **变更范围**：e2e 脚本、临时仓 fixture、`workspace/DHR_35/evidence/`；不改 Relay 生产代码、用户级 registry 或 DevHarness 以外工件。
- **档位**：标准（真实产品 Agent + 真实 SSH + 人判）。
- **实施提示**：在 DHR_34/DHR_63/DHR_64/DHR_65/DHR_66/DHR_67/**DHR_69** 完成且用户重新放行后才运行；P6-RI-A5 必须同时具备 DHR_63 的实际 registry 证据、DHR_65 的 runtime/mutation 证据与 DHR_66 的 Codex projection 复验；DHR_67 必须先证明 Claude 受支持启动路径。使用临时仓或用户批准的低风险真实卡；DSH 关闭路径先测、附加客户端后测；Linux 真实 smoke 不在本卡收口范围，仍由 P6 阶段闸裁决。

### 3.3 标准档共同收口条件

同 P5：两轮独立换人复核；需求境证据（DHR_33/35 须有真实终端 / SSH 实录，pane 相关须截图）；`dh dh-relay` 与证据命令可复跑；P0/P1 清零；用户对话确认后才 `verify(dh-relay):`。凭据值任何工件零出现是本阶段每张卡的附加硬条件。

## 4. P6 阶段闸

### 4.1 核心机器闸 P6-M

| ID | 命题 | 承接卡 |
|---|---|---|
| P6-M1 | 至少一个 Codex 和一个 Claude Profile 完成 Receipt submission 真实节点 | DHR_35 |
| P6-M2 | 身份、配置和 Receipt 可证且零凭据泄露 | DHR_32 / DHR_61 / DHR_63 / DHR_64 |
| P6-M3 | working、blocked、done、unknown 均有真实或受控证据，done 不直写 Result | DHR_33 / DHR_64 / DHR_35 |
| P6-M4 | quota 正反样本和 fallback 有明确通过或受限结论 | DHR_34 |
| P6-M5 | DSH 关闭时，CLI 能显示状态、Attention 和正确 Herdr host_ref | DHR_33 / DHR_35 |
| P6-M6 | Linux SSH 断开/重连不丢 Herdr 会话和 Relay Run 真相 | DHR_33 / DHR_35（B-22 ① 延后） |
| P6-M7 | 客户端变化不改变 Executor Profile、Attempt 和 Result 身份链 | DHR_61 / DHR_64 |

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
| 覆盖 | design/06 H4/H5/H9/H12 由 DHR_33/34/64/35 承接（H7「DSH-only Executor 丢失只影响 Attempt」不在 P6 关闭，归 P5-X / P7）；design/05 §7/§8 由 DHR_32/35 承接；design/02 B4/B5/B15⑤ 作 Oracle 由 DHR_32/34/35 承接；design/11 P6-IQ-A1/A3/A5 由 DHR_61 承接，A2/A4 由 DHR_34 承接；design/12 P6-RI-A1~A3 由 DHR_64，A5 由 DHR_63（registry）+DHR_65（runtime/mutation）+DHR_66（Codex projection）共同复验，A4 由 DHR_67+DHR_68+DHR_69（Claude/Codex 启动前置，三者都只是前置、不承接 A4 本身）+DHR_35（真实闭环）承接；`design/13` 的 `A27-*` **不由 P6 承接**（A-27 主卡未拆，DHR_69 只是其硬前置）；P6-M1~M7 每条至少一张卡 |
| 颗粒度 | DHR_32=审计 + 注册表验收单元；DHR_33=Adapter + SSH 路径验收单元；DHR_61=协议/Store/RPC 契约基线；DHR_34=quota/fallback 编排；DHR_63=受限 registry 维护；DHR_64=Receipt Result bridge；DHR_65=runtime registry loader fail-closed；DHR_66=Codex 非敏感 projection 复验；DHR_67=Windows Claude 启动接线（fake 覆盖）；DHR_68=真实宿主 adapter/driver 接线缺陷；DHR_69=Claude 假就绪 blocked 盲区（三时点观测判定）；DHR_35=Windows 真实闭环 + 人判备料 |
| 依赖 | `DHR_32 → DHR_33 → DHR_61 → DHR_34` 后分叉：`DHR_32,DHR_61 → DHR_63`，`DHR_61,DHR_34 → DHR_64`，`DHR_32,DHR_61 → DHR_65`，`DHR_63,DHR_65 → DHR_66`，`DHR_33,DHR_64,DHR_65 → DHR_67`，`DHR_64,DHR_67 → DHR_68`，`DHR_67,DHR_68 → DHR_69`，`DHR_34,DHR_63,DHR_64,DHR_65,DHR_66,DHR_67,DHR_68,DHR_69 → DHR_35`；无环。P6-RI-A5 仅在 DHR63/65 的既有机器证与 DHR66 projection 复验均通过后保持闭合；DHR67 只满足 Claude 启动前置，不替代 DHR35 的 Receipt-bound Result 实录。DHR66、DHR67、DHR68、DHR69 均须独立 D-start。 |

## 7. 计划完工

- [ ] DHR_32~35、DHR_61、DHR_63、DHR_64、DHR_65、DHR_66、DHR_67、DHR_68、DHR_69 全部销户。
- [ ] P6-M1~M7 全部有等价 pass 证据（M4 允许用户接受的受限；M6 因 B-22 ① 延后，允许记延后/受限并由用户裁决）；P6-X 三态已登记。
- [ ] 端到端证据：Windows Codex + Claude Code 闭环实录、Linux 真实 SSH smoke 可复查；全部工件零凭据扫描通过。
- [ ] P6-H 已向用户展示并由用户判断；P7 是否解锁由用户明确表态。
- [ ] `dev_plan/README.md` 活跃计划表状态已更新。
