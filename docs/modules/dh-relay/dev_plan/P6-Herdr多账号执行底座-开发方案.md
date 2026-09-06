# P6-Herdr 多账号与 Headless 执行底座 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:status
汇报: DHR_32（normal）已于 2026-08-30 经用户对话确认收口，verify `2f80fa1`；主干复验定向 profiles 14/14、contracts 审计 0 违规、模块体检 0 failure。DHR_33（heavy）已于 2026-08-30 经用户接受 E-3303 现场、E-3304 受限、E-3307/3308 Oracle 差异与 P6-M6 延后后收口，verify `5d662b6`；候选-40 依用户裁决 B 冻结为“fresh 实例 + 独立会话”，模型身份仅作诊断记录。DHR_34（heavy）已于 2026-08-30 经用户接受 P6-M4 受限结论，verify `0b72cb6`；quota 定向 12/12、Store/Attempt 组合 30/30、contracts 审计 0 违规、模块体检 0 failure。DHR_64（heavy）已于 2026-08-30 经用户本地收口授权完成，verify `8376e02`；稳定定向 15/15、contracts audit 0 违规、validator 57/57、capability 20/20。
汇报补充: DHR_65（normal）已经用户 E11 明文认可；主干复验专项五项均 1/1、profiles 14/14、contracts audit 0、模块体检 0 failure。DHR_67（heavy）已于 2026-08-31 经用户明文授权本地收口；主干定向 6/6、contracts audit 0 failure、模块体检 0 failure。DHR_66（light）已于 2026-08-31 经用户 E11 认可收口；主干复验 registry validator PASS、strict config exit 0、定向 23/23、模块体检 0 failure。DHR_69（heavy）已于 2026-09-01 经用户点选认可本地收口；主干定向 10/10，假就绪会停下来等人，DHR_35 还差真实 Agent 授权才能跑闭环。**DHR_70（heavy）已于 2026-09-01 经用户点选认可本地收口；主干定向 6/6 exit=0，交不回去的结果现在能交回去了，锁没动，只差真实环境实录那一步。**
现状: DHR_32/33/34/61/63~72/74/76 已完成；DHR_75 待验收；DHR_73 未开始；**DHR_77（heavy）已完成 S0～S2 且用户于 2026-09-06 明文 D-start；首轮 construction 在 `wt/DHR_77@c4cee7f` 因 Store 未复制 `host_ref` durable blocked，用户随后确认 B-44 最小扩围并续做；DHR_35 进行中且 `blocked-by:DHR_77`**。P6-M1 仍未达成
历史进展（2026-09-02～09-03）: P6 ▸ `DHR-B-36` 已于 2026-09-02 经用户点选「确认落盘」生效（三名 fresh 只读实例三轮，5 议题采纳 5 驳回 0）：DHR_71 隔离清单 2→4、`dhr69:179` 等待归 DHR_71、DHR_72 机器证 E 扩到 4 条。DHR_71 同日已 D-start（开树 `wt/DHR_71`；施工派 Opus Herdr 交互式 pane；light 配方两路复核；授权至 E10），worker 首轮施工 `wt/DHR_71@b268456` 按 blocked 判据停手、待按 B-36 续做增量。`DHR-B-35` 同日已落盘（四个 fresh 只读实例三轮审核，10 个议题采纳 10 驳回 0）；DHR_35 三轮独立复核已闭合施工侧问题、转为等待 DHR_72。**2026-09-03**：DHR_71 施工与两届复核整改均已落盘（隔离恰 4 条 skip 的代码面完成），但门禁连续三轮被 BL-17 一族停顿打红——F-7108（停于 `attempt_started` 后、fake 全 0）与 F-7109（停于首次 `host_observation_changed(alive)` 后、fake 非零；清理 `%TEMP%`、隔离子进程 TEMP 均不能根除）；DHR_71 转 blocked-等专卡。用户当日对话确认按标准档立 **DHR_74** 承接诊断与修复（授权原文见该卡 brief）；本会话不在 Herdr pane 内、无法按派活手册拉交互 worker，施工由主会话按 brief 边界承担（偏差如实登记 progress），复核仍须 fresh 换人

**2026-09-03（Claude 主控接手当日）**：DHR_74 三路 fresh 只读复核（代码轮 1 / 需求方向 / 教训，均 `gpt-5.6-terra` high · `--sandbox read-only`，零写入可证）共出 17 条，主控裁决**采纳 15、驳回 0**（P0=0 / P1=9 / P2=6），裁决在 `workspace/DHR_74/review.md`：技术工作与升级条款守住（三路独立确认零 `store/**`、`runtime/**`、`contracts/**` 与零断言改动），但结论强度超出证据——机器证 A 交付的是机制推断而非「精确 op」、B 缺停顿侧红→绿对照、C 的六轮跑在合入 `wt/DHR_71` 的组合分支上不可单独归因。据此：① 用户点选确认按实际做法**修订时间参数授权文字**（本文件 §3.2，`2b5810a`）；② 用户点选确认合并序改为「DHR_71 先收口 → DHR_74 rebase 后重跑」；③ 主控实测 **DHR_71 独立基线（不含 DHR_74 改动）连续三轮 `51 pass / 4 skip / 0 fail`、285–289s、S1~S4 逐名核销一致、四类签名零命中**（`workspace/DHR_71/progress.md` E-7119），**DHR_71 门禁阻塞解除、机器证达标**，同时证明 DHR_74 的 ×10 时间参数改动**不是达标的必要条件**；④ DHR_74 整改轮 1 派单已就绪（`workspace/DHR_74/remediation-brief-r1.md`），其机器证 B/C 措辞须据 ③ 再降一级。**DHR_71 已收口**：用户点选「同意收口，合入 master」后 squash 合入（`84f2514`），主干复验 1 轮 51 pass / 4 skip / 0 fail、315s；E6 教训回流候选-69~74、E7 判定不改 as-built、E10 展示区与确认记录已落 `workspace/DHR_71/review.md`；保留项 F-7108/F-7109 → DHR-BL-17/DHR_74、F-71-CON-03 → backlog，均经用户知情确认。**DHR_74 仍进行中**：整改轮 1 已闭合（措辞降级 / 账目改正 / 探针盲区 / 教训重写），分支已重建（丢弃组合分支合并提交）并在自己基线上取得机器证 C 三轮（`51/4/0`、284–285s），待三路窄复核后申请收口。
下一步（2026-09-06）: 提交 DHR_77 v2 七件套与进行中状态，从最新 master 建 `wt/DHR_77`，在右侧 Herdr 可交互终端派 construction worker 按 task_plan TDD 施工；主会话挂 wait。worker durable 收口后停止于当前 Node，不自行进入复核。授权不含真实产品 Agent、DHR_35、verify、合并、push 或 deploy。
待用户: P6 阶段闸仍等待 DHR_35 的真实闭环机器证与 P6-H 人判；DHR_34 的 P6-M4 已按用户裁决记为 constrained。**2026-08-31 用户在 DHR_68 收口后提出「不是等人处理，直接信任」——即把新项目目录信任从「安全暂停+人工确认」改为受控自动信任，这与 B-32 冻结的产品语义相反，须先走 A-full（授权范围/路径白名单/审计/撤销四项安全语义），待用户确认后立项。**
看什么: workspace/DHR_33/review.md（验收表+签名区）→ review-consistency-opus.md §六/§八；workspace/DHR_32/review.md 签名区
阻塞: **DHR_77 当前无前置阻塞；DHR_35 仍 `blocked-by:DHR_77`（B-43）**。DHR_77 的任何测试/人验证据不得替代 DHR_35 P6-M1；F-3516/F-3519 仍由 DHR_73 调查，Linux SSH 真实 smoke 按 B-22 延后。
-->

<!-- dh:planning-event:v1 id=DHR-B-44 stage=B-adjust artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md review=../design/evidence/43-DHR77-Store-host-ref复制点-B调整交叉审核记录.md#review-b44 understanding=../design/evidence/43-DHR77-Store-host-ref复制点-B调整交叉审核记录.md#understanding-b44 -->

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
| DHR_71 | 先把那组 Herdr 相关的定向测试修到「每次跑都一个结果」：等具体事件而不是等固定秒数，挂死要变成失败而不是没完没了 | 没有一套可信的绿闸，后面改 driver 就没法判断有没有改坏 |
| DHR_72 | 修 driver「看一眼见 Agent 闲着就永远不再看」的毛病：Agent 启动后闲一下很正常，driver 要接着盯，等它真干活时记心跳、真丢了时报丢失；等超了只提醒人、不判结束 | 这是 DHR_35 真实实录里心跳缺失的根因，也是 Relay 对产品「启动后做了什么」全盲的根因 |
| DHR_73 | 调查四次真实启动里两次「启动到一半悄悄停住」的现象：定根因，或者给出复现率和现场、提一个启动看门狗方案；本卡不修代码 | 启动可靠性一半靠运气，必须先弄清楚是什么，再决定怎么修 |

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
- **B-34 Claude Receipt 提交撞已关闭执行器（2026-09-01，`DHR-B-34`，已确认并生效）**：DHR_35 在 DHR_68/DHR_69 闭合后重跑 Windows 真实产品节点，**Codex 路通、Claude 路断**：Codex `herdr.codex.main` 晚于一次 `E_EXECUTOR_RESULT_MISSING` Attention 仍交上 Result（`source=receipt-bound-submission/v1`，E-3525，终态 `succeeded`）；Claude `herdr.claude.main` 启动与 Receipt 均正常，`submit-executor-result` 却报 **`E_LEASE_HELD:actor-closed`**，节点停在 `running`、无 Result、600s 超时（E-3526 / F-3514）。用户对话明文「**另外开**」。
  - **触发事实**（第一轮复审独立打开 `c0aa1ef` 的 `host-lease.json` 核出）：Claude 租约 `02:43:35Z` 取得、`02:44:14Z` 过期（约 39s，未续），而最后一条 `host_observation_changed` 在 `02:44:23Z` —— **提交时 actor 早已失租**；Codex 租约续到 `02:40:17Z`，Result `02:40:00Z` 在过期前落地。`host.mjs:159` 在 actor `finished` **或失租**后拒绝一切 `submitControl`。这打穿 [design/12](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md) §3：非终态、`result_submission_mode:"receipt-bound/v1"` 的 Attempt，service 在正常完成前不得丢掉 receiver gate / 提交权。
  - **审核**：三名 fresh 只读实例、两轮（`b34rev1`/`b34rev2` 互不可见 + `b34ver1` 定向复审），**6 个独立议题：采纳 6 · 驳回 0**，第二轮 PASS 且无新增 P0/P1。全部为机器强制只读（codex `gpt-5.6-terra` · high · `sandbox=read-only` · `approval=never`），两轮各以 git 基线比对证零写入（`a940914` / `78830c5`）。记录见 [evidence/34](../design/evidence/34-DHR70-Claude提交租约actor-closed-B调整交叉审核记录.md)，草案见 [drafts/DHR-B-34](drafts/DHR-B-34-Claude提交租约actor-closed-候选.md)。**其中两条是主控自己的边界失守**：`W-01` 把「非终态必须补交成功」写成无条件，越过 design/12 §3 的「无 lease 不得接收」与 P6-RI-A3；`W-03`① 把「必须打到写 Receipt 的那一届进程」写成验收，与重启恢复直接冲突。另 `W-02` 指出 v1 的 H1 夹具可能在现状代码上直接绿——即「通过但没修好」。
  - **用户裁决（对话点选，均与主控推荐一致）**：①`D-B34-1` **DHR_35 等本卡**——Claude 半截实录不能当 P6-RI-A4；②`D-B34-2` **由当前持 lease 的 actor 补交成功**——旧 actor 已关或失租时先合法新取 lease 再建 gate，**不是**要求旧进程还活着，**也不是**绕过单写者。理解问题「按 A2，那条晚交会怎么收场」用户答**「service 重新取一次 lease、开新 actor 重建 gate，然后写入唯一 Result」**（正确，且排除了"保活旧 actor"与"放宽 host.mjs 拒绝条件"两条错解）。
  - **承诺边界（如实登记）**：DHR_70 **自己不跑真实 Agent**，只用夹具恢复提交链的机器证；`pane_get=error` 只作伴随信号，未经负例不当根因；A3 明确禁止为修 `actor-closed` 放宽单写者。DHR_35 依赖变更是**本次落盘的计划回填**，不是 DHR_70 的施工允许路径。
  - **不变项**：`design/12` 的 `P6-RI-A1~A5` 定义与稳定 ID、Receipt/Result/RPC/contracts 合同与 reason code 表、Store mutation 语义、Linux `B-22`① 延后语义、`P6-M1~M7` 均不变；本卡是"修实现以兑现既有语义"，**不触发 A-full**。本确认只授权本次 DevPlan、审核工件与草案状态同步落盘；**不授权** DHR_70 D-start、生产代码改动、真实 Agent、DHR_35 重跑实录、用户级 registry/凭据读写、verify、合并、推送、部署或环境操作。
- **B-40 Herdr 同步调用阻塞 Host lease 续租（2026-09-04，`DHR-B-40`，已确认并生效）**：DHR_72 三次 DSH-off Codex 实录均在首条 Host Observation 前失租；代码侦察显示默认 TTL=15 秒、续租 tick≈5 秒，而 `herdr-cli.mjs` 的 `spawnSync` 可在最长 60 秒启动期间阻塞同一 Node 事件循环。该机制按“最强候选”登记，不替代 DHR_73 对其它启动停摆机制的调查。新增 **DHR_75（heavy）**，只在 Herdr CLI/adapter 边界实现异步有界调用，默认 TTL、单写者与 epoch fencing 不变；顺序改为 `DHR_70 → DHR_75 → DHR_72 → DHR_35`。
  - **审核**：三名 fresh-context 只读实例三轮。首轮 P1×6/P2×1 全采纳；第二轮对状态来源报 P1，采纳“主树陈旧 / 在途事实 / 机械对齐”三层说明；第三轮对 ahead 数量报 P2，修为“相对 master 6 笔、相对 origin/master 9 笔含主树 3 笔”后复核 PASS。记录见 [evidence/37](../design/evidence/37-DHR75-Herdr异步调用与HostLease续租-B调整交叉审核记录.md)，草案见 [drafts/DHR-B-40](drafts/DHR-B-40-Herdr同步启动阻塞HostLease续租-候选.md)。
  - **用户裁决**：主控推荐“消除同步阻塞 + 新增独立 DHR_75”，用户明文委托“你你自己决定把”；主控据此采纳推荐。此前主控所问“DHR_75 checkpoint 能否复用给 DHR_72”并非真实决定点，用户指出“这种有啥好问我的”，故不伪装成理解答题证据。正式落盘只授权计划/审核证据与 DHR_72 状态机械同步，**不授权** DHR_75 D-start、代码、真实 Agent、verify、任务分支合并、推送或部署。
- **B-41 完整 Profile 同步校验阻塞 Host lease（2026-09-05，`DHR-B-41`，已确认并生效）**：DHR_75 的真实 F 证明 Herdr CLI 异步化后仍在 Attempt 前失租；完整 registry loader 两次约 19.7 秒，同步 `where.exe → pwsh` 发生在 DHR_75 修复边界之前。新增 **DHR_76（heavy）**，保持完整 registry 任一坏项整体 fail-closed、默认 TTL 与 fencing 不变，只把 runtime alias 校验改为非阻塞、自身有界，并补异步返回后的 stop 竞态护栏；顺序改为 `DHR_70 → DHR_76 → DHR_75 → DHR_72 → DHR_35`。
  - **审核**：一个 fresh-context Herdr reviewer 初审 P1×1/P2×2，主控全部采纳问题；两轮定向复审先发现 stop 竞态 P1，再在极窄开放 `workflow-driver.mjs` 后 PASS，最终 P0/P1/P2=0。候选目标/范围/验收已完整并入本卡面，审核形成史见 [evidence/38](../design/evidence/38-DHR76-Profile同步校验阻塞HostLease-B调整交叉审核记录.md)。
  - **用户裁决**：用户对“另立前置修复卡处理全表同步 alias 校验，避免扩大 DHR_75”明文回复“按建议”。其后指出“DHR_76 证据能否替代 DHR_75”这类复述既定边界的问题“没啥意义”；主控撤销该问题，不伪造理解答题证据。正式落盘只授权计划、审核证据和状态机械同步，**不授权** DHR_76 D-start、生产代码、真实 Agent、用户级配置、verify、合并、推送或部署。

- **B-42 DHR_76 异常清理失败返回（2026-09-05，`DHR-B-42`，已确认并生效）**：用户确认当 10 秒清理宽限耗尽仍无法确认 child close/Windows 杀树完成时，允许以现役 `E_UNRESOLVED_ALIAS:probe-close-timeout` 明确失败返回，并把该次清理标记为未确认；不得声称无残留，不得启动 Attempt/Agent/pane/Result。正常超时路径仍须等待 close 并证明子进程及后代无残留；该异常不计作清理验收通过。TTL、整轮预算、外层错误、stop/lease/fencing、生产范围均不改变。
- **B-43 terminal-instance `host_ref` 原子兼容闭环（2026-09-06，`DHR-B-43`，已确认并生效）**：正式 `design/14` 新增 `HC-HR-A1..A5/H1` 后，resolver 实测以 7 份 `designInputs[]` 为唯一规划输入。新增 **DHR_77（heavy）**，在单卡内原子承接 event/v2 与 v0 mirror、Herdr `terminal_id` 来源、writer/recovery、完整 capability baseline 与 v1/v2 hash、read-model/CLI 安全投影、新旧账本/客户端以及 DSH-off 人验展示；禁止拆成 schema/driver/CLI 各自可声称完成的卡。顺序为 `DHR_72 → DHR_77 → DHR_35`；DHR_77 的证据不得冒充 DHR_35 P6-M1。
  - **审核**：fresh-context 只读实例 `/root/b43_fresh_review` 独立核验 resolver、正式合同、P6 依赖和现役 schema/recovery/RPC/CLI，结论 `approved`，P0/P1/P2/P3=0；记录见 [evidence/42](../design/evidence/42-DHR77-terminal-instance-host-ref-B调整交叉审核记录.md)。
  - **理解与确认**：用户在主控解释“DHR_77 只解除计划阻塞，DHR_35 仍需独立 D-start”后回复“好的明白了”，随后明确要求“落盘，建workspace，建task-plan”。本轮授权包括正式 B-adjust 与 DHR_77 S0～S2；不授权生产代码、真实 Agent、DHR_35、verify、合并、推送或部署。
- **B-44 Store `host_ref` 复制点最小扩围（2026-09-06，`DHR-B-44`，已确认并生效）**：DHR_77 首轮施工证明 `workflow-driver.mjs` 已向 Store 传入 `host_ref`，但 `store.mjs:439-457` 的封闭事件构造未复制该字段，导致 driver 定向测试 exit 1、0/2；唯一扩围为把 `relay-core/store/store.mjs` 加入 DHR_77 allowed paths，并把实现限定为 `emitEvent` 复制 `input.host_ref`，不得改变 Store 其他语义。既有 `dhr77-host-ref.test.mjs` 已经由真实 `createStore` 路径承重，不新增 `store.test.mjs`。目标、验收、依赖、任务类型与 DHR_35 阻塞关系均不变；`task_plan.md` 作为已消费施工说明不回写，实际绕行记入 progress。
  - **审核**：fresh 独立 Codex 会话完成静态复核，结论 `approved`、P0/P1/P2/P3=0；请求的 `--sandbox read-only` 启动横幅实际显示 `danger-full-access`，故只登记“独立审核、非机器强制只读”，审核前后主树 `ce1f4b3`、任务树 `c4cee7f` 及洁净状态一致。记录见 [evidence/43](../design/evidence/43-DHR77-Store-host-ref复制点-B调整交叉审核记录.md)。
  - **理解与确认**：用户判断非宿主观测事件携带非空 `host_ref` 应拒绝写入，并明文“确认落盘”。该确认同时承接主控上一问中的最小 B-adjust 落盘与从 `c4cee7f` 续做 construction；仍不授权复核、verify、合并、DHR_35、push 或 deploy。
- **B-36 DHR_71 隔离清单 2→4 与绿闸范围校正（2026-09-02，`DHR-B-36`，已确认并生效）**：DHR_71 施工 worker 按 blocked 判据停手（`wt/DHR_71@b268456`）：三轮绿闸 51/2/2 → 50/2/3 → 51/2/2，机器证 B/C/D 达成，差 fail=0。取证推翻 B-35 对 F-3520 的归类——`agent-node:198`「DHR_33 窄路径」断言 `attempt_failed(E_EXECUTOR_KILLED)` 而现役写 `human_input_requested`（与已 skip 的 `:279` 同根）、`herdr-adapter:354`「#10 恢复届」等 `attempt_orphaned` 而 DHR_64 后恢复届写 `human_input_requested(E_EXECUTOR_HOST_LOST)`，两条都是**语义红**（F-7102/F-7104）；真时序红只有 `agent-node:231`（已修）。652s 挂死 = `t.after` 的 `rm` 撞 driver 正在写的 `state.json.<uuid>.tmp` 永不返回（`FSReqPromise`），测试侧 `try/finally stop` 修掉、生产零改动（F-7103）；`dhr69-false-ready:179` 三轮 绿/红/绿且不在允许路径（F-7105）。
  - **审核**：三名 fresh 只读实例、三轮（`b36rev1` 4×P1 → `b36ver1` 定向复审 1×P1 → `b36ver2` 定向复核 PASS），**5 个独立议题：采纳 5 · 驳回 0**，见 [evidence/36](../design/evidence/36-DHR71隔离清单与绿闸范围校正-B调整交叉审核记录.md)。关键议题：四条 skip 须按「文件 + 完整用例名 + 基线行号」冻结可核销；同一用例体内两卡反向禁改；`dhr69:179` 走 Claude `paneRun` 链、`:510` 走 Codex `agentStart` 链，上限须按各自真实调用链逐段相加 × 1.5（120s / 90s），45s 不是生产上限。
  - **用户裁决**：①`D-B36-1` 隔离清单 **2→4**（S1 `:242`、S2 `:279`、S3 `:354`、S4 `agent-node:198`，按用例名核销），DHR_71 验收 A 改「隔离 4 条 skip、其余全 pass」；②`D-B36-2` `dhr69-false-ready:179` 归 DHR_71（仅该用例体等待，上限按真实链推导）。理解问题「DHR_71 收口跑出 55 条 · 51 pass · 4 skip · 0 fail 意味着什么」用户答**「DHR_71 达标；4 条是转给 DHR_72 的债」**（正确，排除「skip = 永久豁免」「有 skip 就不算绿闸」两条错解）。
  - **不变项**：卡序 `DHR_71 → DHR_72 → DHR_73`、`DHR_72 → DHR_35`、DHR_35 重开合同、D-B35-1~7、DHR_72 运行契约与机器证 A~D/F/G、共享夹具 / `fake-herdr.mjs` / `workflow-driver.mjs` 唯一归属 DHR_72、design/12、P6-M1~M7 均不变；**不触发 A-full**。本确认只授权本次 DevPlan、backlog（BL-17 补形态）、审核工件与草案状态落盘，以及 DHR_71 worker 按新合同续做增量（仍在既有 D-start 授权至 E10 之内）；**不授权** DHR_72/73 D-start、生产代码改动、真实 Agent、DHR_35 重跑、verify、合并、推送、部署或环境操作。
- **B-35 driver 持续观测 / 定向回归复绿 / 启动链静默停摆（2026-09-02，`DHR-B-35`，已确认并生效）**：DHR_35 在 DHR_70 闭合后于新基线 `43e4af9` 重跑，Codex（E-3532）/ Claude（E-3533）两条真实实录均 `succeeded`、身份链完整，**但 `checkpoints/` 全空**。三轮独立复核核出根因不是运气：`workflow-driver.mjs:404-417` 的 `done`/`idle` 分支带 `return`，轮询「先 observe 再 sleep」且第一次 observe 紧跟发提交指令之后——刚 `agent start` 的产品必然 `idle`，**这一次采样永久决定不再观测**（F-3517）。连带：`E_EXECUTOR_RESULT_MISSING` 写完即退出、迟到提交仍推进终态却留下一条误导 Attention；观测停止后 `host_lost` 对账永不再执行；基线定向回归 55 条 5 红（F-3520：2 条 DHR_64 前语义陈旧、3 条时序脆弱，另一次 652s 挂死）【**B-36 校正（2026-09-02）**：DHR_71 有界化取证后，`agent-node:198` 与 `herdr-adapter:354` 亦为 DHR_64 后语义陈旧（F-7102/F-7104），实为 **4 条语义陈旧、1 条时序脆弱**（`agent-node:231`，DHR_71 已修）；原归类已被推翻，DHR_71 隔离清单据此冻结为 4 条】；四次真实启动两次静默停摆未定位（F-3516/F-3519）。用户 2026-09-01 两次裁决「**先修 driver 再收 DHR_35**」「**另开卡修回归**」，2026-09-02 对主控五条建议明文「**那就按你的建议走**」。
- **B-37 DHR_72 DHR64 持续观察回归补口（2026-09-04，已确认）**：DHR_72 施工前的定向基线 `dhr64-driver-observation` 3/3 绿，但 fresh 审核指出其 `done`/`idle` 用例仍 `await driver.done`；而 DHR_72 合同要求这两种“尚无 Receipt Result”的宿主状态发 Attention 后继续观察，`t.after(stop)` 又只能在用例返回后执行，实施后会死等。审查固定三段与零写入证据见 [workspace/DHR_72/b-adjust-review.md](../workspace/DHR_72/b-adjust-review.md)。用户在对话先理解 driver 是 Runner 内部接线程序而非第四角色，随后认可「终端 idle/done 不等于正式 Result、driver 要继续观察」与「两种状态都持续观察」。最小调整：允许 DHR_72 修改 `relay-core/test/dhr64-driver-observation.test.mjs` 的该两条用例，要求断言 Attention 后至少发生一次后续观察，再显式 `stop` 并等待 `driver.done`；不扩其他允许路径、不改 DHR_35/Store/contracts/启动或 recovery 语义、不改变验收终点或卡序。
- **B-38 DHR_34 quota 历史回归边界（2026-09-04，已确认）**：默认测试入口扫描发现 `identity-quota.test.mjs:131-336` 的九条历史用例把宿主 `idle/done` 与已删除的 `herdrJudge` 直接当作终态 Result 来源，进而断言 quota fallback、失败及 pause。fresh 只读审核确认：现役 `startWorkflowDriver` 已不接收 `quotaDetectors`、`platform`、`herdrJudge`，而 `idle/done` 只写「缺 Result」Attention 后持续观察；仅把 `await driver.done` 改为 `stop` 会消除等待，却不能生成原断言需要的 `attempt_failed` / `attempt_succeeded` / `fallback_pause_created`。用户确认拆开：**DHR_72 不修改该文件，仍只交付持续观测；另立 DHR_34 配额迁移/修复卡，先明确正式 Receipt-bound Result 是否继续触发自动 fallback，再重建该组业务回归。**审核记录见 [workspace/DHR_72/b-adjust-quota-review.md](../workspace/DHR_72/b-adjust-quota-review.md)，零写入结论见 progress E-7205；不改变 DHR_72 允许路径、验收终点、DHR_35 依赖或任何现役配额语义。
- **B-39 DHR_72 生命周期回归补口（2026-09-04，已确认）**：第一轮 fresh 代码/需求/一致性/教训复核共同发现三条**直接受本卡合同改变影响**的测试仍以 `await driver.done` 代表 `idle/done` 业务结束：`dhr64-result-bridge` 的缺 Result 用例、`dhr70-submission-gate` 的 `idle ∧ pane_get=error` 迟交 Result 用例、`herdr-adapter` 的 `blocked→done` 补发用例。它们不依赖 quota/fallback 业务推导，故与 B-38 不同：允许 DHR72 仅改这三条用例为 Attention/正式 Receipt-bound Result/显式 stop 的持续观测收口，并在提交后断言零后续观测事件；不改其原业务断言。同步补齐 `workflow-driver` 轮询等待 waiter 配套清理的允许文字，以及新增 `dhr72-poll-guard.test.mjs`、DHR72 专属 B-33 负例/五出口证据。用户对话明文「确认」。`identity-quota.test.mjs`、任何 quota 生产语义、DHR35、Store/contracts/启动与 recovery 生产语义仍禁改。
  - **审核**：四名 fresh 只读实例、三轮（`b35rev1`/`b35rev2` 互不可见 + `b35ver1` 定向复审 + `b35ver2` 对 X-03 定向复核），**10 个独立议题：采纳 10 · 驳回 0**，第三轮 PASS 且无新增 P0/P1。全部为机器强制只读（codex `gpt-5.6-terra` · high · `sandbox=read-only` · `approval=never`），三轮各以 git 基线比对证零写入（`HEAD=43e4af9`）。记录见 [evidence/35](../design/evidence/35-DHR71-73-driver持续观测与定向回归复绿-B调整交叉审核记录.md)，草案见 [drafts/DHR-B-35](drafts/DHR-B-35-driver持续观测与定向回归复绿-候选.md)。**其中两条是主控自己说过头**：`W-01` 把「无墙钟上限」写成「有界出口」（宿主长期 idle 时 driver 与租约随 service 一直活着，那不叫有界）；`W-02` 把「折叠状态回 running」说成「看板 Attention 被覆盖」（历史事件不会消失）。另 `X-03` 两轮才闭合：v2 按用例行切分仍共享 `runtimeFixture` 与 `fake-herdr.mjs`，v3 把共享夹具唯一归属 DHR_72。
  - **用户裁决**：①`D-B35-1` 卡序 **DHR_71 → DHR_72 → DHR_73**，DHR_35 重开在 DHR_72 后、不等 DHR_73；②`D-B35-2` DHR_72 的真实实录**不可**被 DHR_35 消费，DHR_35 自跑两条（与 F-3502/F-3503/F-3505「不能将前置完成冒充实录」及 DHR_70 后归档重跑的先例一致）；③`D-B35-3` F-3516/F-3519 **拆为 DHR_73 纯调查卡**（定时间盒、双出口、修复另开卡）；④`D-B35-4` DHR_30/31 历史证据里的原 Receipt UUID **只登记（`DHR-BL-18`）不重写 master**；⑤`D-B35-5` P6-X 补录挂 DHR_35 重开；⑥`D-B35-6` **不设墙钟上限、不自动放弃**——宿主长期 idle 是允许人工持有的运行态，节点停在 `waiting_human` 带可见 Attention，人工 `stop` 是唯一业务出口，driver 机器出口冻结为五个（含 actor 失租/结束 fail-closed）；⑦`D-B35-7` 宿主**真实** `working` + 实际 `checkpoint_recorded` 使折叠状态回 `running`，**不与 B-33「不自动收敛」冲突**（不清除历史 Attention、不把 idle∧blocked 推断为 working，机器证 G 负例守住）。理解问题「Agent 一直闲着不提交、没人 stop，节点会怎样」用户答**「停在『等人』上，直到我 stop」**（正确，排除了「自动判失败」与「Attention 自动清掉」两条错解）。
  - **一条被现有事实收窄的假设**：`store/state.mjs` 折叠规则已写 `checkpoint_recorded → running`，且读模型没有为 `human_input_requested` 建独立 open Attention 对象（`openAttentions` 只装 fallback pause）、CLI 分堆由 `group` 派生——所以「继续观测」就够，**不加事件类型、不改合同**。
  - **不变项**：`design/12` P6-RI-A1~A5 定义与稳定 ID、Receipt/Result/事件合同与 reason code 表、Store 折叠规则、lease 单写者与 DHR_70 gate 重建条款、Linux `B-22`① 延后语义、B-33 观测层派生规则、`P6-M1~M7` 均不变；**不触发 A-full**。本确认只授权本次 DevPlan、backlog、审核工件与草案状态落盘；**不授权** DHR_71/72/73 任一 D-start、生产代码改动、真实 Agent、DHR_35 重跑实录、用户级 registry/凭据读写、verify、合并、推送、部署或环境操作。
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
| DHR_69 | 修 Claude 假就绪导致的 blocked 盲区（启动/轮询/recovery 三时点） | 标准 | 已完成 | DHR_67、DHR_68（均已完成） | [workspace/DHR_69/](../workspace/DHR_69/) | squash `28b9a7d`（2026-09-01）；verify 本提交 | 任务类型=heavy；E11 用户点选认可本地收口；release_mode=full；主干定向 10/10；五路复核 + 轮 1 两轮复验 + 轮 2 整改复验闭合；变异点由轮 2 实例选点并验红绿。尾巴 F-69-E7 as-built 与 miner 草稿用户裁决留给后续卡。不承诺自动收敛、不跑真实 Agent。 |
| DHR_70 | 修 Receipt-bound 提交权在 Attempt 非终态时被丢失（`E_LEASE_HELD:actor-closed`） | 标准 | 已完成 | DHR_64、DHR_68、DHR_69（均已完成） | [workspace/DHR_70/](../workspace/DHR_70/) | squash `64a7950`（2026-09-01）；verify 本提交 | 任务类型=heavy；B-34 新增，承接 DHR_35 实测的 E-3526/F-3514（Claude 启动与 Receipt 均通、提交撞 actor-closed）；口径 = 由**当前持 lease 的 actor** 补交，旧 actor 已关/失租时先合法新取 lease 再建 gate，**不放宽单写者**、不要求旧进程存活；自己不跑真实 Agent；须另行 D-start |
| DHR_75 | 让 Herdr CLI 保持有界失败但不阻塞 Host lease 续租 | 标准 | 待验收 | DHR_70、DHR_76（均已完成） | [workspace/DHR_75/](../workspace/DHR_75/) | squash `24ba064`；用户 E11 已确认；verify 被 DHR_74 R31 阻断（2026-09-05） | 任务类型=heavy；新基线专项 7/7、adapter 24 pass/3 frozen skip/0 fail、真实 F 的首条 alive observation 早于 lease expiry，fresh 需求复核 PASS；主干本轮整套无终态不记绿，D 定向两项 1/1；不代签 verify、不清理任务树、不含 push/deploy/下一卡 |
| DHR_76 | 让完整 Profile registry 校验 fail-closed 且不阻塞 Host lease | 标准 | 已完成 | DHR_65、DHR_70（均已完成） | [workspace/DHR_76/](../workspace/DHR_76/) | `master@6adb54e` | 任务类型=heavy；2026-09-05 用户认可releasePacket-DHR76-v1；squash=`23de8cf`，verify=`6adb54e`，release_mode=full；A~F、heavy五路、B-42增量终审与合入后复验均闭合；全仓dh仍有范围外既有失败，DHR76无failure、仅R14 warning；不含push/deploy/下一卡 |
| DHR_35 | 用 Codex、Claude Code 跑 Windows 真实执行闭环 | 标准 | 进行中 | DHR_34、DHR_63、DHR_64、DHR_65、DHR_66、DHR_67、DHR_68、DHR_69、DHR_70、DHR_72（均已完成）、**DHR_77（未开始）** | [workspace/DHR_35/](../workspace/DHR_35/) | | **`blocked-by:DHR_77`**（B-43，2026-09-06 用户确认）：DHR_77 改变 DHR_35 必须展示的“正确 host_ref”版本，须先完成协议/展示原子闭环，再由 DHR_35 独立 D-start 自跑两条新基线实录；DHR_77 证据不可消费为 P6-M1。B-35 的两条实录自取证、启动成功率、P6-X/P6-H、DHR_73 不阻塞、DSH-off、Linux 延后及零生产代码边界均不变 |
| DHR_71 | 修 Herdr 定向回归的时序脆弱与挂死，交付可重复绿闸 | 标准 | 已完成 | 无（基线 master） | [workspace/DHR_71/](../workspace/DHR_71/) | | 任务类型=light；B-35 新增，承接 F-3520 的时序部分与 652s 挂死；只改 `relay-core/test/**`（用例行级冻结，见 §3.2）；隔离 4 条语义红（skip，**B-36 冻结恰 4 条**：`herdr-adapter.test.mjs:242/:279/:354` + `agent-node.test.mjs:198`，按用例名核销）；验收只能写「隔离 4 条 skip、其余全 pass」不得写「全绿」；首轮施工 `wt/DHR_71@b268456` blocked 后按 B-36 续做增量；EPERM 成因归 BL-17；须另行 D-start |
| DHR_72 | 修 driver 单次 idle 采样即永久退出观测 | 标准 | 已完成 | DHR_71（已完成）、DHR_75（待验收） | [workspace/DHR_72/](../workspace/DHR_72/) | squash `13c072d`；verify `64fa91f`（2026-09-06） | 任务类型=heavy；用户 2026-09-05 E11 明文认可；主干专属 8/8、poll 1/1、冻结 55/55 全绿，真实 F 保持有效；DHR_72-H 与 DHR_74 双向单跳 transfer 已由 E-7241 清零 R31；release_mode=full；不含 push/deploy/下一卡 |
| DHR_77 | 原子实现 Herdr terminal-instance `host_ref`、RPC hash 与 DSH-off 安全展示 | 标准 | 进行中 | DHR_72（已完成） | [workspace/DHR_77/](../workspace/DHR_77/) | | 任务类型=heavy；B-43 新增；2026-09-06 用户明文 D-start，S0～S2 已落户，准备在 `wt/DHR_77` 进入 construction Node；单卡承接 `design/14` `HC-HR-A1..A5/H1`，证据不得替代 DHR_35 P6-M1；不含真实产品 Agent、DHR_35、verify/合并/push/deploy |
| DHR_73 | 调查启动链静默停摆（F-3516 / F-3519） | 标准 | 未开始 | DHR_72 | [workspace/DHR_73/](../workspace/DHR_73/) | | 任务类型=normal；B-35 新增；**纯调查卡，不改 `relay-core/**`**；时间盒 ≤12 次真实启动或两个工作时段；出口 (a) 根因钉死 + 修复卡 B-adjust 候选 / (b) 复现率 + 现场 + 看门狗候选；两种出口下 F-3516/F-3519 保持 open；DHR_35 重开不等本卡；须另行 D-start |
| DHR_74 | 钉死 BL-17 一族停顿（F-7108/F-7109）的精确落点并按证据修复，解阻塞 DHR_71 绿闸 | 标准 | 已完成 | 无前置（DHR_71 门禁依赖本卡） | [workspace/DHR_74/](../workspace/DHR_74/) | verify `a20cfc7`（2026-09-06） | 任务类型=常规；用户接受四条诚实结论与未闭合项移交；own-baseline 51/4/0 三轮通过；DHR_72-H transfer 已由 E-7241 清零 R31；release_mode=risk-accepted，Risk-Count=1，RISK-DHR74-F7402 移交 DHR_73/环境侧 A-B；不含 push/deploy/下一卡 |

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

  **收口期路径变更登记（2026-09-01）**：上面后三条是本卡收口期加入的，各有出处，**不得据此扩到别处**——
  ① `design/12`：用户在对话里点选「扩路径，本卡同步掉」，授权范围**仅限「Gate 生命周期」一节的措辞同步**；起因是需求复核 F-70-REQ-01 与一致性复核裁决 1/2 两路独立指到同一处字面冲突。**不得**借此改动 §4 验收清单、reason code 表或其它任何小节（轮 2b 已用 `git diff` 核过实际改动范围，确认未越）。
  ② `as-built/relay-core.md`：**补登**，非扩范围——本卡 brief 的「触及子系统（收口时更新其 as-built）」早已声明它，且 E7 as-built 收敛是收口必做步骤，原清单漏列。
  ③ 本文件：仅限 §3.2 DHR_70 的**允许路径登记与状态回填**（本段即属之；状态列回填属 E13 机械动作），不得借此改本卡以外任何卡的口径。

  **限定**：`workflow-driver.mjs` 只可改**观测→事件路径**与 **recovery 分支的发送时机**；「不动 Result 判定」的精确含义是**不得修改** Receipt-bound Result、等待超时与 `E_EXECUTOR_RESULT_MISSING` 的**语义**，但**允许**因受机器证支撑的派生 `blocked` 使该分支**不可达**（那正是机器证 B 要的结果）。`package.json` 只可向既有 test script 追加本卡新测试文件这一个 token。不得改 `herdr-cli.mjs`（现役 `paneGet()` 已够用）、`profile-registry.mjs`、`service.mjs`、Store、RPC、contracts、用户级 registry，或 DHR_35 / DHR_68 的工作区。
- **档位**：标准（外部宿主组件接线 · 高危五类之一）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_69 type=heavy -->
- **实施提示**：必须另行 D-start。`pane get` 的真实返回形态**先取证再写 fake**（E-1 在前、E-2 在后）——这正是 DHR_68 存在的原因，不得重犯。交叉核对**只在 `agent get`=`idle` 时发起**，不得改成每轮双读，也不得反向"用 `agent get` 覆盖 `pane get`"。

#### DHR_70

- **目标**：让 Receipt-bound 的 `submit-executor-result` 在 Attempt 仍**非终态**时，一定打到**当前持 lease 的 actor / gate** 并写入**唯一** Result；覆盖 DHR_35 已暴露的 Claude 形态（启动与 Receipt 均成功、提交报 `E_LEASE_HELD:actor-closed`）。承接 [design/12 P6-RI-A1/A3](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收清单) 与其「Gate 生命周期」条款，是 P6-RI-A4 的**提交前置**，不承接 A4 本身。
- **非目标**：
  - 不改 Receipt / Result / RPC **合同**与 **reason code 表**；不改 Store 的 mutation 语义；
  - **不放宽单写者 lease 闸门**——修 `actor-closed` 不得以"失租后也允许写"实现；
  - **不跑真实 Agent**（复验归 DHR_35），不改 DHR_35 工作区与实录脚本语义，不改 Herdr 产品；
  - 不改用户级 registry / 凭据 / 账号或额度配置；不碰 Linux / SSH；不代产品做目录信任；
  - 不把 Codex 已通的路径（E-3525）重写成新语义。
- **归因假说**（施工用夹具钉死，不是三选一的产品取舍）：
  - **H1**：旧 actor 已 `finished`/失租后，`ensureActor` 把死 actor 交回，或不重建 gate。夹具须**先让旧 actor 因结束或失租拒绝**，再断言 service 为同一非终态 Run 新取 lease、新 actor，提交恰好一个 Result，旧 actor 零 mutation。
  - **H2**：`pane_get=error` 使 herdr 等待提前退出且不保留/不重建 gate。fake：agent idle + paneGet 失败；lease 仍在则直接补交，已失租则走 H1 重建。
  - **H3**：提交打到陈旧 endpoint / 代次，而不是当前持 lease 的 actor。对账 endpoint + descriptor generation，**同时覆盖**「原 service 仍活」与「service/actor 已换届」。**禁止**把「必须打到写 Receipt 的那一届进程」写成验收（与重启恢复冲突）；`DH_RELAY_*` 不改变 Windows pipe 身份，**不能单独当 H3 绿证**。
  - 允许路径以 H1 为主；H3 仅当证明发现层有洞才动 `launcher.mjs`。
- **验收口径**（均为机器证，无人判项）：
  - **机器证 A1**（P6-RI-A1）：lease **仍然有效**、Receipt 仍 current、节点非终态 → 晚交（含 driver 本届 herdr 等待已结束）必须得到 committed Ack + `relay.result/v2`（`structured.source=receipt-bound-submission/v1`）。
  - **机器证 A2**（P6-RI-A1 + design/12「Gate 生命周期」的重建条款）：旧 actor **已结束或已失租**、Run 非终态、Receipt 仍 current → 旧 actor 对提交**拒绝且零 mutation**；service **新取 lease、新 actor、重建 gate** 后提交**恰好一个** Result；同 digest 重投幂等。
  - **机器证 A3**（P6-RI-A3）：无法合法取得当前 lease（真 lease-lost / 非 current Receipt / 已终态）→ **保持拒绝、零 mutation**。禁止为修 `actor-closed` 放宽单写者。
  - **机器证 B**：未知 Receipt / 终态冲突仍按现役拒绝或幂等，不因改 gate 而变。
  - **机器证 C**：`agent_get=idle` ∧ `pane_get=error`（对齐 E-3526 观测）**不得单独**把 Attempt 写成 `E_EXECUTOR_HOST_LOST` 终态；提交走 A1 或 A2。
  - **机器证 D**：定向套件可复跑；`git diff --name-only` 不越下列允许路径。
  - **有效单测（重核卡必做）**：变异点由第二轮复核实例选点；把 gate/actor 复用判据改坏后，指定测试必须变红。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_70 -->
  - `relay-core/runtime/service.mjs`
  - `relay-core/runtime/workflow-driver.mjs`
  - `relay-core/runtime/host.mjs`
  - `relay-core/runtime/launcher.mjs`
  - `relay-core/test/dhr70-submission-gate.test.mjs`
  - `relay-core/test/dhr64-result-bridge.test.mjs`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_70/**`
  - `docs/modules/dh-relay/design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md`
  - `docs/modules/dh-relay/as-built/relay-core.md`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`


  **限定**：`workflow-driver.mjs` 只可改**提交权 / gate / actor 复用与 idle 等待收口**，不得改 Result mutation 语义；`host.mjs` 仅当 H1 证明 actor 过早 `done` 才动，且**不得改 lease 单写者合同**；`launcher.mjs` 仅当 H3 成立才动，且不得改 RPC schema；`dhr64-result-bridge.test.mjs` 仅当既有断言因合法 gate 复用必须最小更新时才改；`package.json` 只可向既有 test script 追加本卡新测试文件这一个 token。**不得改** `contracts/**`、`store/**`（mutation 语义）、`herdr-cli.mjs`、`herdr-executor.mjs`（除非机器证 C 的负例证明必须动观测，且须另走用户确认扩路径）、DHR_35 工作区、用户级配置。
- **档位**：标准（外部宿主组件接线 · 高危五类之一）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_70 type=heavy -->
- **实施提示**：必须另行 D-start。起点线索（**不是结论，须自行用夹具钉死**）：`service.mjs` 的 `submitExecutorResult` 先遍历 `drivers` map 试老 driver，老 driver 抛的 `actor-closed` 被直接 `throw` 出调用栈，走不到下面"从 durable 事实重建 actor/driver"的兜底循环。修复方向是**让提交找到活的持 lease actor**，不是让旧 actor 活得更久，也不是让 `host.mjs` 少拒绝。

#### DHR_75

- **目标**：Herdr CLI 的启动、观察、提示与停止调用保持现有有界失败语义，但不得阻塞 Host lease 续租；合法慢启动期间唯一写者持续持有新鲜 lease，随后能落首条 Host Observation 与 checkpoint。
- **非目标**：不延长默认 lease TTL，不放宽 `writeGuard` / epoch fencing，不允许过期 lease 复活；不改 Receipt、Result、Event、RPC Schema 或 reason code；不改 DHR_72 的长期 idle/持续观察语义或 quota/fallback；不把本卡真实实录冒充 DHR_72 机器证 F 或 DHR_35 P6-M1；不处理 DHR_73 的其它启动停摆机制；不跑 Linux/SSH，不改用户级配置。
- **验收口径**：
  - **机器证 A（续租不饿死）**：静态与运行时断言生产默认 TTL 仍为 **15,000ms**；在持有 Host actor 的同一 Node 事件循环中注入短 TTL 与真实慢子进程，单次 Herdr CLI 调用跨过至少两个 renew tick。逐次记录调用区间、renew 前后 expiry、竞争取 lease 与首条 observation 的时间线；期间 lease 至少成功续租 2 次，独立 contender 取得同一 Run lease稳定返回 `E_LEASE_HELD`。仅把 TTL 拉长、保留同步阻塞的对照变异不能通过。
  - **机器证 B（链路继续）**：同一夹具在慢调用返回后依次落 `host_observation_changed(alive)` 与至少一条 `checkpoint_recorded`；修前对照稳定表现为 lease 过期/无 Host Observation，修后转绿。
  - **机器证 C（fencing 不退化）**：由独立 contender 接管并写入新 epoch，或等价地使旧 lease真正失效；旧 actor 的 Host Observation、checkpoint、Result 全部被拒，事件账零双写、零重复 seq，actor 终态为 `lost_lease` 或等价现役拒绝语义。
  - **机器证 D（CLI 兼容）**：Herdr 成功、非零退出、超时、signal/启动失败、空 stdout、JSON stderr 错误映射保持现役返回形状与 reason/detail；async spawn 超时后等待 child `close`，并在 Windows 验证该子进程及其后代无残留。
  - **机器证 E（直接回归）**：现役 lease/host、Herdr adapter、DHR_70 submission gate 与 DHR_72 冻结五文件定向回归均有终态；不把 `identity-quota.test.mjs` 的 B-38 旧合同阻塞算成本卡失败或顺手改写。
  - **机器证 F（真实产品边界）**：DSH-off Windows、一个冻结 Codex Profile，至少一次运行在 `attempt_started` 后产生首条 `host_observation_changed`，且该时点 lease 未过期；若进一步取得 checkpoint 只记为本卡佐证，DHR_72 仍须在吸收本卡后独立重跑机器证 F。
  - **有效单测**：由第二轮 fresh reviewer 从生产改动选择变异点；登记 reviewer 独立身份、生产代码锚点、指定测试命令、施加前/后/还原后 hash、红/绿退出码与失败摘要。恢复同步阻塞、漏 `await`、或破坏超时清理之一必须使指定测试以断言失败变红。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_75 -->
  - `relay-core/runtime/executors/herdr/herdr-cli.mjs`
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/test/dhr75-host-lease-during-herdr.test.mjs`
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/helpers/fake-herdr-bin.mjs`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_75/**`
  - `docs/modules/dh-relay/as-built/relay-core.md`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`
  - `docs/modules/dh-relay/dev_plan/README.md`

  **限定**：生产修复收敛在 Herdr CLI/adapter 的异步调用边界；`herdr-executor.mjs` 只为 CLI Promise 补齐 `await`、失败 pane 清理与现役错误传播，不改变状态映射或业务判断。`herdr-adapter.test.mjs` 仅迁移直接调用 `makeHerdrCli()` 的 CLI 包装测试并补异步超时清理断言，不动 DHR_72 所有的 S1~S4、`:305`、`blocked→done` 等语义用例；`package.json` 只追加 DHR_75 新测试文件名，DHR_72 rebase 时与其追加 token 并存。`dev_plan/README.md` 只机械同步新增卡和依赖。`workflow-driver.mjs`、`host.mjs`、`lease.mjs`、`service.mjs`、`launcher.mjs`、`store/**`、`contracts/**` 均只读；若实现必须修改这些文件，停止施工并重新做 B-adjust。
- **档位**：标准（Runtime/Herdr 组件接线，高危）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_75 type=heavy -->
- **依赖**：DHR_70（已完成）；不依赖未合入的 DHR_72 生产改动。须另行 D-start；B-adjust 确认不授权施工。

#### DHR_76

- **目标**：完整 Executor Profile registry 的 alias/config 严格校验仍在真实启动前 fail-closed，但 alias 探针不得以同步子进程阻塞 Host lease 调度；合法慢探针期间唯一写者持续持有新鲜 lease，校验成功后才可进入 Attempt/Agent/pane 链。
- **非目标**：不延长默认 15,000ms lease TTL，不放宽 `writeGuard`、epoch fencing 或接管条件；不改 registry schema、Profile 字段、fallback 图、Receipt/Result/Event/RPC/reason code；不只校验目标 Profile、不复用未经本次完整验证的陈旧成功、不把坏项降级成 warning；不改用户级 registry、产品配置或凭据；不改 DHR_75 Herdr CLI、DHR_72 持续观察、DHR_73 调查或 DHR_35 闭环；不跑 Linux/SSH。
- **验收口径**：
  - **机器证 A（全表严格性）**：保留 5 个正式 Profile 与 fallback 关系的结构等价副本；任一 Profile 的 alias/config 失效都在 Attempt、Agent、pane、Result 前以现役错误面 fail-closed。保留非目标坏项，再变异生产代码使其跳过该项、只传目标 Profile 或跳过 fallback 关系时，原测试必须因错误接受而断言失败。
  - **机器证 B（调度不饿死）**：默认 TTL 仍为 15,000ms；同一 Host actor 事件循环中，覆盖全部 5 个 Profile 的真实异步子进程探针总时长超过 15 秒，期间 lease 至少续租 2 次、expiry 单调前移、独立 contender 始终得到 `E_LEASE_HELD`。恢复同步等待或只拉长 TTL 的对照变异必须变红。
  - **机器证 C（先校验后启动）**：全表校验完成前 Attempt/Agent/pane/Result 全 0；成功后仍解析两个指定 Profile 并只启动所选 Profile。单 alias 子进程/整轮/清理宽限/测试外层上限分别冻结为 15s/60s/10s/120s；spawn error、非零、signal、超时或空结果保持 `E_BAD_VALUE:PROFILE_REGISTRY`，detail 含 `E_UNRESOLVED_ALIAS`，无部分启动。
  - **机器证 D（fencing、停止竞态与清理）**：校验期间发生 epoch 接管时旧 actor 后续结果与启动动作均拒绝、零双写；`driver.stop()` 在 await 期间发生时，校验返回后、`openAttempt()` 前复查 stopping，Attempt/Agent/pane/Result 全 0。正常探针超时在 10 秒清理宽限内等待 child close 与 Windows 杀树完成，并证明子进程及后代无残留；若宽限耗尽仍无法确认，允许以现役 `E_UNRESOLVED_ALIAS:probe-close-timeout` 明确失败返回，必须标记清理未确认、不得声称无残留且 Attempt/Agent/pane/Result 全 0，该异常不计作清理验收通过；不新增 stop 取消启动前探针语义。
  - **机器证 E（直接回归与有效单测）**：profiles validator、DHR_65 loader、identity/profile、Host lease、DHR_75 专项和 Herdr adapter 定向回归均有终态，禁止改断言迁就实现；第二轮 fresh reviewer 选生产变异点，登记锚点、命令、前后/还原 hash、红绿退出码和失败摘要。
  - **机器证 F（真实产品边界）**：本卡自己的 DSH-off Windows 基线上，用完整真实 registry 和冻结 Codex Profile 跑一次；`attempt_started` 时 lease 未过期且随后出现首条 `host_observation_changed`，证据脱敏、零凭据。不得替代 DHR_75 吸收后的重跑或 DHR_72/DHR_35 专属实录。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_76 -->
  - `relay-core/profiles/validate-profiles.mjs`
  - `relay-core/runtime/executors/herdr/profile-registry.mjs`
  - `relay-core/runtime/workflow-driver.mjs`
  - `relay-core/test/dhr76-profile-validation-lease.test.mjs`
  - `relay-core/test/dhr65-registry-loader.test.mjs`
  - `relay-core/test/profiles.test.mjs`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_76/**`
  - `docs/modules/dh-relay/as-built/relay-core.md`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`
  - `docs/modules/dh-relay/dev_plan/README.md`

  **限定**：runtime 只改为非阻塞、自身有界的完整 registry 校验，保留 CLI/静态入口兼容，校验不得挪到 Attempt 之后。`workflow-driver.mjs` 只允许在 loader await 后、`openAttempt()` 前复查既有 `stopping`；禁止向探针传取消信号，禁止改轮询、Result、lease、recovery 或其它启动语义。`host.mjs`、`lease.mjs`、`herdr-cli.mjs`、`herdr-executor.mjs`、`service.mjs`、`launcher.mjs`、`store/**`、`contracts/**`、用户级 registry 均只读；若必须扩大，停止并重新 B-adjust。
- **档位**：标准（Runtime/Profile 安全前置与 Host lease 组件接线，高危）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_76 type=heavy -->
- **依赖**：DHR_65、DHR_70（均已完成）。须另行 D-start；本次 B-adjust 不授权施工、真实 Agent、E11/verify 或合入。

#### DHR_71

- **目标**：让 `herdr-adapter` + `agent-node` + `dhr64-driver-observation` + `dhr69-false-ready` + `dhr70-submission-gate` 这组定向回归在本机成为**可重复、可解释**的绿闸：除冻结隔离清单内的 4 条 skip（B-36，原 2 条）外全部 pass、零 fail、零挂死，为 DHR_72 开工提供可依赖的前置。承接 DHR_35 F-3520 的时序部分与 652s 挂死。
- **非目标**：不改生产代码（`relay-core/runtime/**`、`store/**`、`contracts/**`）；不重写两条语义陈旧用例（归 DHR_72）；不处理 `%TEMP%` EPERM（归 [DHR-BL-17](../backlog.md)）；不动共享夹具。
- **做什么**：把 1s–10s 固定小预算的等待改为**事件驱动等待**，每个等待冻结「目标事件/状态 + 有界失败条件」，超上限即 fail 并打印当时状态；每条用例/每个文件加进程级上限，挂死表现为 fail 而不是不收口；定位 652s 挂死；`skip` 隔离**恰 4 条**语义红（用例内标注 `F-3520 → DHR_72`；B-36 冻结，定位锚 = 文件 + 完整用例名 + `master@81f5a53` 行号，合入后按用例名定位）：S1 `herdr-adapter.test.mjs:242`「DHR_33 driver #3/#5：done 有界、判定成功与双亡 HOST_LOST」、S2 `:279`「DHR_33 driver：stop 撞 launch 窗口仍杀 pane，失败写 killed Result 且不造 Attention」、S3 `:354`「DHR_33 driver #10：恢复届按账上 ref 判 orphaned 或接管同一 attempt」、S4 `agent-node.test.mjs:198`「DHR_33 窄路径：driver 托管 herdr-agent，开 Attempt、记心跳并按 stop 落 killed」——S3/S4 只加 skip 不重写，其用例体内 DHR_71 已落的有界等待与 `try/finally stop` 保留。
- **验收口径**：
  - **机器证 A（绿闸）**：五文件 `node --test --test-concurrency=1` 连续 3 轮，每轮记录 pass / skip / fail、每文件时长、总时长：**skip 恰为 4（B-36 冻结表 S1~S4）、fail 为 0**，无一轮不收口；每轮总时长 ≤ 隔离单跑之和的 2 倍；三轮原始输出入 `workspace/DHR_71/evidence/`。只能写「隔离 4 条 skip、其余全 pass」，**不得写「全绿」**。
  - **机器证 B（等待有界）**：每个被改的等待能列出「目标事件 + 上限 + 超限失败输出」；人为让目标事件不发生，用例在上限内 fail 而不是挂住（至少对 652s 那条做此负例）。
  - **机器证 C（652s）**：已定位（附复现步骤）并修；若指向生产，登记 finding 并注明去向。
  - **机器证 D（路径）**：`git diff --name-only master...HEAD` 仅含 `relay-core/test/**` 与 `workspace/DHR_71/**`。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_71 -->
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/agent-node.test.mjs`
  - `relay-core/test/helpers/**`
  - `relay-core/test/dhr69-false-ready.test.mjs`
  - `docs/modules/dh-relay/workspace/DHR_71/**`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`

  **限定（用例行级，B-35 审核 X-03 冻结，B-36 同步）**：`herdr-adapter.test.mjs` 仅 `:354`、`:510` **用例体内**的等待逻辑及对 S1/S2/S3 加 skip 标记，**不得动共享夹具 `runtimeFixture`（`:203-230`）与 `recoveryFixture`（`:335-352`）**——若 `:510` 的修复必须改夹具，只登记并移交 DHR_72；`agent-node.test.mjs` 仅 `:198`、`:231`/`:265` 的等待逻辑、文件级超时配置及对 S4 加 skip 标记；`dhr69-false-ready.test.mjs` **仅 `:179`「DHR_69/A driver：假就绪恰写一次 blocked Attention，扣住指令，不写 HOST_LOST」用例体内的等待逻辑**（文件级 `until` 助手 `:15` 与其余用例不动）；`helpers/**` **不含 `fake-herdr.mjs`**（归 DHR_72），只可新增/修改等待工具。**反向禁改（B-36）**：S3/S4 用例体内 DHR_71 只拥有等待逻辑、`try/finally stop` 清理顺序、skip 标记三样，**不得**碰这两条用例的任何断言。**等待上限规则（B-36 冻结）**：「启动 → `waiting_human`」类等待的上限 = 按该用例实际走的 `launchHerdrAgent` 调用链把每次 Herdr CLI 调用的生产上限（`herdr-cli.mjs:41-42` 通用 10_000；仅 `agent start` 为 `HERDR_START_TIMEOUT_MS=60_000`）逐段相加 × 1.5——`:510`（Codex `agentStart` notReady → `startBlocked`：`paneSplit`+`agentStart`+首次 `agentGet` = 80s）为 **120_000ms**，`dhr69:179`（Claude `paneRun` 链：`paneSplit`+`paneRun`+`agentList`+`agentRename`+`agentGet`+`paneGet` = 60s）为 **90_000ms**；代入过程写进 progress；这些是保守上限，只负责把挂住变成上限内 fail + dump，不解释成因。若某条红的成因落到生产代码或 EPERM，只登记不修。
- **档位**：标准。
- **任务类型**：轻量<!-- dh:task-type:v1 task=DHR_71 type=light -->
- **依赖**：无（基线 master）。须另行 D-start。
- **实施提示（B-36）**：F-3520 的归类已校正为 **4 条语义红 + 1 条时序红**（`agent-node:231`，已修）——DHR_72 机器证 E 据此解除 4 条。首轮施工现场 `wt/DHR_71@b268456`（`construction.DONE status: blocked`），续做增量 = S3/S4 加 skip、`:510` 两处与 `dhr69:179` 上限按规则改正 + 负例、重跑三轮绿闸、更新 progress/findings/DONE。

#### DHR_72

- **目标**：`receiptBound` 时 driver **不因一次 `idle`/`done` 采样退出观测**；等 Result 与继续观测并行；`E_EXECUTOR_RESULT_MISSING` 成为「等超了」的可见提示而非 Attempt 终点；让真实产品路径上的 `checkpoint_recorded`、`observation_lost`、`host_lost` 重新可得。承接 DHR_35 F-3517（P6-M1 缺 checkpoint 的根因）与 F-3520 的语义部分；是 P6-RI-A4 checkpoint 一环的**实现前置**，不承接 A4 本身。
- **运行契约（D-B35-6）**：宿主长期 `idle`、无提交、无人 `stop`，是**允许人工长期持有的运行态**——节点停在 `waiting_human`/`needs_you`，一条可见的 `E_EXECUTOR_RESULT_MISSING` 是给人的信号，**人工 `stop` 是唯一业务出口**；driver 与 actor 续租随 service 存活。不是「有界超时」，本卡不引入任何自动放弃/自动失败。
- **非目标**：不改 Receipt/Result/事件合同与 reason code 表；不改 Store 折叠规则；不改 lease 单写者与 gate（DHR_70 范围）；不改启动段与 adapter（`runtime/executors/herdr/**`）；不动 DHR_69 的 idle∧blocked 派生规则；不跑 Linux；**不替 DHR_35 出 P6-M1 证据**。
- **验收口径**：
  - **机器证 A（不退出）**：fake 宿主序列 `idle → idle → working → working → done`：首次 `idle` 后继续轮询，`working` 期间记 ≥2 条 `checkpoint_recorded`，节点折叠状态 `running`；对照现役基线该序列零 checkpoint。
  - **机器证 B（等超提示可被事实覆盖）**：宿主 `idle` 超过 `doneTimeoutMs` 且无提交 → 恰写一次 `E_EXECUTOR_RESULT_MISSING`、节点 `waiting_human`；之后 (i) 宿主转 `working` → 记 checkpoint、折叠回 `running`，不重复写该 Attention（同一 Attempt 内该 reason 至多一次，除非中间经历过 `working`）；(ii) 迟到 Receipt-bound 提交 → `attempt_succeeded`，此后零观测事件；(iii) **CLI 投影实证**：`relay status --json` / `inspect --json` 在 (i) 之后 `run_status=running`、`group=running`，历史事件账仍含那条 `human_input_requested`（不主张清除）。
  - **机器证 C（对账重新可达）**：首次 `idle` 之后宿主消失 → 走 `reconcileHerdrAgent` 到 `host_lost`，写 `E_EXECUTOR_HOST_LOST` 并退出。
  - **机器证 D（五出口，各一条用例，退出后零事件追加）**：① committed 提交；② `stop`（`E_EXECUTOR_KILLED` 语义按现役）；③ 对账 `host_lost`；④ Attempt 已终态；⑤ **actor 结束或失租** → driver fail-closed 退出、不再以旧 actor 写事件；用例须**分别**覆盖并断言差异：`actor-closed`（DHR_70 gate 重建路径接住迟到提交）与真实 `E_LEASE_HELD:lease-lost`（`host.mjs` 写闸原样拒绝、无重建）。循环内每轮检查出口，不得在 `waitForExecutorResult` 里阻塞整轮。
  - **机器证 E（语义用例归位，B-36 扩到 4 条）**：解除 DHR_71 隔离的 **4 条**（DHR_71 卡 B-36 冻结表 S1 `herdr-adapter:242`、S2 `:279`、S3 `:354`、S4 `agent-node:198`，按完整用例名逐条核销，多解少解都不算过）并按 Receipt-bound 语义重写；`:305` 重写为「单次 Attention 后**继续**轮询」。收口时定向套件 **0 skip、55/55**（含 DHR_69、DHR_70 用例）。S3/S4 的现役语义（`stop` → `human_input_requested(E_EXECUTOR_KILLED)`；恢复届探活 missing → `human_input_requested(E_EXECUTOR_HOST_LOST)`）是 DHR_64 有意改成的，本卡只**重写测试对齐现役**，不得为让旧断言变绿去动 recovery 段。
  - **机器证 F（真实产品实录 · 本卡自己的 verify 证据）**：DSH-off Windows、一个已冻结 Profile（Codex 优先），跑出至少一条带真实 `checkpoint_recorded` 的实录；按 design/12 §2 脱敏（`rcpt~<摘要>`，零原 Receipt ID、零凭据）。**只证明本卡改动在真实产品上生效，不计入 DHR_35 P6-M1。** 撞 F-3516 形态停摆时重试（≤3 次）并把现场留给 DHR_73。
  - **机器证 G（守住 B-33）**：负例 `agent_get=idle ∧ pane_get=blocked` 持续期间零 `checkpoint_recorded`、节点不回 `running`、提交指令不补发；只有宿主真实 `working` 才产生 checkpoint。
  - **有效单测（重核卡必做）**：变异点由第二轮复核实例选点（候选：首次 idle 改回 return / Attention 去重判据改坏 / 去掉出口⑤），指定用例必须变红。
  - **机器证 H（承接 DHR_74 · 2026-09-04 用户裁决「出口 1」）**：补 normal 配方要求的**有效单测机械守卫**——对同一 driver options 里 `herdrPollMs` 与其配对超时（`doneTimeoutMs` / `observationLostMs`）的**比例一致性**加断言，使「poll 被改回 1~5ms」或「配对超时漏缩」这类参数违规能被测试拦住（DHR_74 轮 1 F-74-R1-01 实证：当前参数违规也全绿，没有任何断言可拦）。守卫入库后须对该守卫**做一次变异得到「断言失败」**并登记进本卡变异点表，然后**回签 DHR_74 的 `verify(dh-relay)`**——DHR_74 因无生产代码可变异而卡在 R31，工件已合入 master、状态停在「待验收」，其 worktree `wt/DHR_74` 与分支保留至补签完成。回签判据＝master 体检 R31 清零。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_72 -->
  - `relay-core/runtime/workflow-driver.mjs`
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/agent-node.test.mjs`
  - `relay-core/test/dhr64-driver-observation.test.mjs`
  - `relay-core/test/dhr64-result-bridge.test.mjs`
  - `relay-core/test/dhr70-submission-gate.test.mjs`
  - `relay-core/test/dhr72-continuous-observation.test.mjs`
  - `relay-core/test/dhr72-poll-guard.test.mjs`
  - `relay-core/test/helpers/fake-herdr.mjs`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_72/**`
  - `docs/modules/dh-relay/workspace/DHR_74/review.md`
  - `docs/modules/dh-relay/as-built/relay-core.md`
  - `docs/modules/dh-relay/knowledge/教训库-候选.md`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`

  **限定**：`workflow-driver.mjs` 仅 `driveHerdrNode` 轮询循环（`:330-422`）的 `done`/`idle` 处理、等待与出口结构、Attention 去重，及为不阻塞该循环删除 `submissionWaiters`/submit hook 唤醒的配套代码；**不得**动 `:205-275` 启动段与 recovery 段语义；`herdr-adapter.test.mjs` 仅 `:242`、`:279`、`:305`、`:354`（B-36）和 `DHR_68/C blocked→done` 既有用例体（B-39）及共享夹具 `runtimeFixture`（**唯一归属本卡**，改后 `:510` 等既有用例须保持绿）；`agent-node.test.mjs` 仅 S4「DHR_33 窄路径」一条用例（B-36，按用例名定位）；`dhr64-driver-observation.test.mjs` 仅既有 `done`/`idle` 无 Receipt Result 两例；`dhr64-result-bridge.test.mjs` 仅「missing done submission」用例；`dhr70-submission-gate.test.mjs` 仅 `DHR70 C` 用例：三者须断言 Attention/后续事实，再以正式 Result 或显式 stop 收口，提交后零观测追加；新增 `dhr72-continuous-observation.test.mjs` 与 `dhr72-poll-guard.test.mjs` 仅承接 B-33 负例、五出口快照与指定 fixture 参数守卫。**反向禁改（B-36）**：S3/S4 用例体内本卡只拥有移除 skip 与按 Receipt-bound 语义改写终态断言两样，**不得回改** DHR_71 落下的等待逻辑与 `try/finally stop`；`fake-herdr.mjs` 唯一归属本卡；`package.json` 只可向 test script 追加本卡测试文件名；DHR_35 实录脚本只可复制到 `workspace/DHR_72/` 并登记来源 commit，不得反向修改 DHR_35 工作区；教训路径只允许 E6 append 待裁决候选，不动正册。**不得改** `contracts/**`、`store/**`、`host.mjs`、`service.mjs`、`launcher.mjs`、`runtime/executors/herdr/**`、用户级配置。`workspace/DHR_74/review.md` **只为机器证 H 的回签而开**（填 verify SHA、把状态由「待验收」改「已收口」），不得改写 DHR_74 的四条诚实结论、机器证 A/B 达成度或任何复核结论；DevPlan 侧同理，只可动 DHR_74 的状态格与 verify SHA 列。
- **档位**：标准（组件接线 · 高危五类之一）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_72 type=heavy -->
- **依赖**：DHR_71（绿闸）。须另行 D-start。
- **续做证据（2026-09-05）**：在已含 DHR_75/76 的 `master@084a00d` 上重放后，专属 8/8、poll 守卫 1/1、冻结五文件 55/55（0 skip/0 fail）；DSH-off Codex run6 保存 4 条 `checkpoint_recorded`、2 条 alive observation、0 Result。heavy 四路 fresh 复核已完成，生产提前 return 变异按预期红、还原后绿；Receipt 角色脱敏 P1 经原复核者 RECHECK PASS。这里只登记 E10 机器证，不代表 E11、verify 或 merge。

#### DHR_77

- **目标**：在一张卡内原子实现 Herdr `terminal_id` → 脱敏 `host_ref` 的完整兼容闭环：event/v2 与 v0 mirror、capability baseline/hash、launch/observe/reconcile/recovery writer、事件回放/read-model、CLI 安全投影、v1 与 bootstrap/v2 客户端兼容，以及 DSH-off 受控对照展示。
- **非目标**：不改 Result、Receipt、run_status、Attention、lease、fencing、Profile、fallback 或 Linux 合同；不以 `host_ref` 查询 Herdr；不持久化原始 `terminal_id` 映射；不把本卡人验或实录冒充 DHR_35 的 P6-RI-A4/P6-M1；不读写凭据或用户级 registry；不自动启动真实 Codex/Claude Agent；不做 DHR_35 重跑。
- **验收口径**：
  - **机器证 · 来源 [design/14 `HC-HR-A1`](../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单)**：只接受非空 string `terminal_id`，逐字 UTF-8 按冻结公式生成完整 SHA-256 ref；空白/Unicode golden vectors、缺失/错类型/空串与全部 fallback 负例见红。
  - **机器证 · 来源 [design/14 `HC-HR-A2`](../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单)**：轮询/recovery 相同 ID 保持 ref，不同 ID 换 ref；pane/agent 改名不影响；`working→working` replacement 仍写事件。
  - **机器证 · 来源 [design/14 `HC-HR-A3`](../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单)**：alive 必有 ref；lost 保留最后成功 ref 或如实缺省；recover/replace/初始失败回放正确，旧事件不回写。
  - **机器证 · 来源 [design/14 `HC-HR-A4`](../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单)**：event/v0、descriptor/hash、writer/recovery/read-model/CLI 原子闭合；旧 v1 hash 在分派/订阅前 `E_CAPABILITY_MISMATCH` 且零推送，新 hash 的 v1 与 bootstrap/v2 均工作；旧账本仅显示 legacy 缺省。
  - **机器证 · 来源 [design/14 `HC-HR-A5`](../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单)**：CLI 区分当前/历史/尚无标签；默认安全投影省略 `detail`；非观测事件拒绝非空 ref；既有 Result/Receipt/lease/fencing/状态全回归。
  - **人判 · 来源 [design/14 `HC-HR-H1`](../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单)**：独立展示 DSH-off 安全投影与受控 Herdr 对照面中的同一脱敏 ref，用户判断状态措辞可区分且证据未出现原始 `terminal_id`、`detail`、路径或敏感信息；不得消费为 DHR_35 真实闭环证据。
  - **有效单测**：代码轮 2 从来源谓词、ref 变化触发、lost 历史绑定、旧 v1 hash 零推送或非观测字段禁入中选择一个生产变异点；指定测试须因断言失败见红，还原后绿。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_77 -->
  - `relay-core/contracts/relay.event.v2.schema.json`
  - `relay-core/contracts/v0-shapes/relay.host-observation.v1.shape.json`
  - `relay-core/contracts/compat-matrix.md`
  - `relay-core/capability-baseline.json`
  - `relay-core/tools/capability-baseline.mjs`
  - `relay-core/rpc/capabilities.mjs`
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/runtime/workflow-driver.mjs`
  - `relay-core/store/store.mjs`
  - `relay-core/runtime/service.mjs`
  - `relay-core/cli/main.mjs`
  - `relay-core/cli/render.mjs`
  - `relay-core/test/contracts.test.mjs`
  - `relay-core/test/rpc.test.mjs`
  - `relay-core/test/rpc-service.test.mjs`
  - `relay-core/test/read-model-mirror.test.mjs`
  - `relay-core/test/client-fixtures.test.mjs`
  - `relay-core/test/cli.test.mjs`
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/dhr72-continuous-observation.test.mjs`
  - `relay-core/test/helpers/fake-herdr.mjs`
  - `relay-core/test/dhr77-host-ref.test.mjs`
  - `relay-core/fixtures/golden/**`
  - `relay-core/fixtures/negative/**`
  - `relay-core/fixtures/clients/**`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_77/**`
  - `docs/modules/dh-relay/as-built/relay-core.md`
  - `docs/modules/dh-relay/knowledge/教训库-候选.md`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`

  **限定**：`herdr-executor.mjs` 只保留合格 `terminal_id`，不得使用 `pane_id`/agent/`agent_session` fallback；`workflow-driver.mjs` 只改 host-observation 写入、最后成功 ref 对账与 recovery，停止从旧 `detail` 重建 terminal identity，既有 `executor_ref` locator 与 Result/Attention/lease 行为不变；`store.mjs` 只允许 `emitEvent` 把 `input.host_ref` 复制到封闭 event 对象，不得改变 Store 的校验、写入、回放、通知、lease、fencing 或其他事件语义；`service.mjs`、CLI 与 fixtures 只承接事件回放、read-model/安全展示和新旧账本兼容，默认人验投影不得输出 `detail`；`rpc/capabilities.mjs` 删除 v1 固定 hash 分叉，使 v1/v2 共用完整 baseline，`server.mjs` 现有“hash 校验早于分派/subscribe”顺序只读守住；fixtures 只更新受协议/hash/展示变化直接影响的样本，`package.json` 只追加本卡测试。workspace 只存脱敏向量、测试日志、受控对照与截图；原始 `terminal_id`、路径、账号、Receipt、Result 或凭据不得进入证据。
- **档位**：标准（协议、RPC 兼容与 Herdr 组件接线，高危）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_77 type=heavy -->
- **依赖**：DHR_72（已完成）。DHR_77 收口只解除 DHR_35 的计划阻塞，不构成 DHR_35 D-start；须独立 D-start。

#### DHR_73

- **目标**：对 F-3516（`attempt_started` 后 service 活着却零子进程、pane 未建成）与 F-3519（Claude 全程零 `host_observation_changed`、租约未续期即过期）做**可复核的调查收口**：钉死根因，或交付可复核的未决登记。**本卡不修生产代码**；修复另开卡。
- **出口（二选一）**：**(a)** 根因钉死——触发条件 + fake/探针负例可稳定复现 + 落点文件/函数，产出立**修复卡**的 B-adjust 候选（预计 heavy）；**(b)** 时间盒内未钉死——复现率（≥8 次真实启动统计）+ 停摆时进程/pane/租约现场取证 + 「启动链有界看门狗」B-adjust 候选。**两种出口下 F-3516 / F-3519 都保持 open**，DHR_35 / P6-H 不得据本卡宣称启动可靠性已恢复。
- **时间盒**：真实启动 ≤12 次或两个工作时段，先到为准；超盒即走 (b)。
- **非目标**：不改任何 `relay-core/**`；不改 lease 合同；不改 Herdr 产品；不跑 Linux。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_73 -->
  - `docs/modules/dh-relay/workspace/DHR_73/**`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`

  **限定**：探针脚本须带 `HERDR_ENV=1` fail-closed 闸与 DSH-off 预检（DHR_35 F-3523 教训）；证据按 design/12 §2 脱敏。
- **档位**：标准。
- **任务类型**：常规<!-- dh:task-type:v1 task=DHR_73 type=normal -->（启动时冻结，不中途升档）
- **依赖**：DHR_72。DHR_35 重开不等本卡。须另行 D-start。

#### DHR_74

- **目标**：DHR_71 绿闸（冻结五文件命令）反复被 BL-17 一族停顿打红：F-7108（driver 停于 `attempt_started` 之后、fake 全 0）与 F-7109（停于首次 `host_observation_changed(alive)` 之后、启动期 Attention 落账之前，fake 非零；清理 `%TEMP%` 与隔离子进程 TEMP 均不能根除）。本卡用**测试侧探针**把停顿钉到精确 op（fs 调用 / Store 写队列 / actor 队列），并按证据落地**标准档内**的修复，使 DHR_71 门禁可重跑。承接 backlog `DHR-BL-17` 的 F-7108/F-7109 两种形态；诊断结论喂 DHR_73，但**不替代**其真实启动停摆调查。
- **用户授权（2026-09-03 对话原文）**：「要继续解除阻塞，需要按标准档为 DHR-BL-17 立/调专卡，允许诊断并修复 Store 持久化/测试临时目录争用，再重跑 DHR_71 门禁。……继续解决」——即本卡的立项 + D-start 授权。
- **升级条款（硬）**：`relay-core/store/**` 只读诊断；诊断若证明必须改 Store 写路径**语义**（rename 有界重试 / 持久化超时 / 批量持久化——均属契约面），**立即停手**，把证据与 B-adjust 候选写入 progress/findings，转主控升高危并重新请用户确认（backlog 档位建议原文「触及 Store 落盘路径则升高危」）。
- **验收口径**：
  - **机器证 A（停点钉死）**：测试侧探针在复现轮打出停住的精确 op / 路径 / 耗时 / 现场（活跃句柄类型计数 + 事件账 + fake 计数）；F-7108 或 F-7109 至少一种形态被探针捕获并定位到函数级落点；若时间盒内未复现，交付 ≥10 轮 × 2 种负载条件的复现率与负载对照数据，如实登记未钉死。
  - **机器证 B（修复落地，按证据走决策树）**：测试侧修复须有红→绿对照（修复前复现 / 修复后同条件消失）；环境侧修复（如 Defender 排除目录）只产出证据 + 操作指引交用户执行，不代码化；Store 语义修复 = 停手走升级条款。
  - **机器证 C（DHR_71 门禁重跑）**：冻结五文件命令（`node --test --test-concurrency=1 --test-timeout=300000` + 双 reporter，cwd=`relay-core/`）**连续 3 轮** skip=4（S1~S4 按完整用例名核销）∧ fail=0 ∧ 每轮 ≤370s；结论带负载条件措辞（F-71-LES-02）；三轮期间零 BL-17 签名（无 EPERM rename、无停顿形态红）；撞签名轮次作废留证并如实登记。机器证 C 同时记入 DHR_71 的证据账（E-编号续编）。
    **基线口径（2026-09-03 用户对话确认补充）**：合格三轮必须跑在**本卡自己的基线**上 = `master`（已含 DHR_71 收口后的隔离改动）+ 本卡改动，**不接受**「在 wt/DHR_74 里合并 wt/DHR_71 得到的组合分支」上的轮次（那种轮次只能证明组合版本，无法把绿单独归因给任一张卡——见 `workspace/DHR_74/review.md` F-74-REQ-03 / F-74-R1-02）。既有 6 轮（`22dc16c` 上取得）降级为**过程证据**保留，不计入机器证 C。「零 BL-17 签名」必须给出可复核的扫描命令与签名定义，不接受只有转述。
- **非目标**：不改 Store 落盘语义（见升级条款）；不动 DHR_72 专属物（`workflow-driver.mjs` 轮询段、`fake-herdr.mjs`、S1~S4 断言重写、共享夹具的结构与断言）；不重写任何语义陈旧用例；不跑真实 Agent；不重跑 DHR_35；不 push、不部署。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_74 -->
  - `relay-core/test/helpers/**`
  - `relay-core/test/*.test.mjs`
  - `docs/modules/dh-relay/workspace/DHR_74/**`
  - `docs/modules/dh-relay/backlog.md`
  - `docs/modules/dh-relay/knowledge/教训库-候选.md`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`

  **逐条限定（只收窄上面的清单，不放宽）**：

  - `docs/modules/dh-relay/knowledge/教训库-候选.md` —— **2026-09-04 补登记（原为登记遗漏，非范围扩张）**：E6 教训回流是标准档收口的固定动作，落点只能是本文件；DHR_71 同款遗漏已由 dh R30 报出。本卡实际写入＝候选-75~81 追加，无既有条目改写。
  - `relay-core/test/helpers/**` —— 新增探针 / 等待工具；**不含** `fake-herdr.mjs`。
  - `relay-core/test/*.test.mjs` —— 仅限「夹具临时目录根、收尾清理顺序、import 探针、**夹具时间参数降放大**」类**非断言行**。时间参数口径（**2026-09-03 用户对话确认修订**；原文写「`herdrPollMs` 与同一 options 配对的 `doneTimeoutMs` / `observationLostMs` 按同一倍率 ×10」，与实际实施不符，按实际做法校正；依据见 `workspace/DHR_74/review.md` 整改 A 与三路复核 F-74-R1-01 / F-74-REQ-04 / F-74-LES-02）：
    1. `herdrPollMs` **统一抬到 20ms**（原值 1~5ms 不等，故各文件倍率不同：2→20 为 ×10、5→20 为 ×4——**倍率一致不是要求，绝对值一致才是**）；
    2. 同一 driver options 里的 `doneTimeoutMs` / `observationLostMs` **只在其语义是「等满 N 次 poll」时**随 poll 同比例放大（如 `8/4 → 80/40`、`20 → 200`）；语义是**墙钟上限**时（如 dhr69 两个夹具的 `60_000`）**保持不变**——把失败等待预算再拉大只会让红轮更慢、无语义收益；
    3. 依赖 poll 间隔推导的**注释与预算常量**（如 `herdr-adapter.test.mjs` 的 `BLOCKED_FIVE_POLLS_BUDGET_MS`）必须随之更新，属本条授权的同族非断言行；
    4. 依据 E-7403 放大取证（单文件 2.8 万事件 / 5.7 万次 fs 写 = `%TEMP%` 污染与体外耗时的来源；列表型 fake 逐 poll 推进，事件计数与 poll 间隔无关，断言零改动）；共享夹具 `runtimeFixture` / `recoveryFixture` 的 `mkdtemp` 根一行与上述时间参数行可动（B-35 X-03 归属冻结的**用户授权例外**，复核必须逐字核对仅限这些行、断言零改动）。
  - `docs/modules/dh-relay/backlog.md` —— 仅 `DHR-BL-17` 条目进度补录。
  - `docs/modules/dh-relay/dev_plan/P6-...md` —— 仅状态列与状态行（本卡口径修订由主控按用户确认执行，不由 worker 动）。

  **禁改**：`relay-core/store/**`、`relay-core/runtime/**`、`relay-core/contracts/**`、`package.json`；不得改任何断言与用例语义；探针必须可一键卸载（不污染 `node --test` 常规运行，优先 `NODE_OPTIONS=--import` 预加载注入，零测试文件改动）；证据按 design/12 §2 脱敏（零原 Receipt ID、零凭据）。

- **档位**：标准（触及 Store 落盘语义则升高危，见升级条款）。
- **任务类型**：常规<!-- dh:task-type:v1 task=DHR_74 type=normal -->
  - 启动时冻结，不中途升档；若触发升级条款则整卡重新分流
- **依赖**：无前置；DHR_71 门禁依赖本卡；D-B35-1 卡序 71→72→73 不变。须另行 D-start（已于 2026-09-03 经用户对话确认完成）。

#### DHR_35

- **目标**：在 DHR_34/DHR_63/DHR_64/DHR_65/DHR_66/DHR_67/DHR_68/DHR_69/DHR_70/DHR_72/**DHR_77** 闭合后，Windows 分别跑 Herdr + 一个 Codex Profile、Herdr + 一个 Claude Code Profile 的完整闭环（Receipt → Herdr 观测 → checkpoint → `submit-executor-result` → committed Ack → Result → CLI）；DSH 关闭是必测路径。Linux SSH 保持延后。
- **非目标**：不改 Relay 生产代码或用户级 registry；不进 DevHarness 全收口；不做多卡；不跑 Linux/SSH；DSH 可用时只作附加客户端对证，不另跑第二份流程。
- **验收口径**：
  - **机器证**：[design/12 P6-RI-A4](../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收清单) · P6-M1：至少一个 Codex 与一个 Claude Profile 完成 Receipt→checkpoint→submission→Result 真实节点，Receipt 身份链可证、零凭据；Herdr/judge 不得直写 Result。
  - **机器证**：[design/06 H9](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M6：Linux SSH 断开 / 重连不丢 Herdr 会话与 Relay Run 真相（真实 SSH，不接受 fixture 替代；`DHR-B-22` 调整① 延后，汇合点 = P6 阶段闸裁决）。
  - **机器证**：[design/06 H1 / H5](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M3/M5：working / blocked / done / unknown 均有真实或受控证据；DSH 关闭时 CLI 显示状态、Attention 与正确 host_ref。
  - **机器证**（P6-X）：[design/06 H3](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：DSH / Pi 可用时连接同一 Run，无第二份状态判断；不可用登记不适用。
  - **人判**：[design/05 §8.2](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#82-实际-codex-和-claude-code-产品) · P6-H：向用户展示 Windows 两条闭环实录 + Linux SSH 实录 + pane 交互延迟；用户判断 Herdr + Codex/Claude Code 是否适合作施工主力、多账号选择与 fallback 是否清楚、Windows pane 交互延迟是否可接受、Linux SSH detach/重连/附着是否适合日常、DSH→Herdr 跳转（若可用）是否自然。
- **变更范围**：e2e 脚本、临时仓 fixture、`workspace/DHR_35/evidence/`；不改 Relay 生产代码、用户级 registry 或 DevHarness 以外工件。
- **档位**：标准（真实产品 Agent + 真实 SSH + 人判）。
- **实施提示**：**B-35/B-43 重开合同**：DHR_77 收口后由用户重新放行；P6-M1 证据由本卡自己在新基线重跑两条完整实录取得（DHR_72/DHR_77 的实录均不可消费）；重开实录若撞 F-3516 形态的启动停摆，重试（≤3 次）并把现场留给 DHR_73，review 须如实登记本轮启动成功率、不得把 F-3516/F-3519 写成已消除；P6-X 补录挂本卡重开——两条 DSH-off 实录跑完后另起一步开 DSH 附着其中一条 Run（runner 加「保留 Run」开关，DSH 放最后一步开），Pi 记「环境不具备」；P6-H 用新基线数据判（旧数字 Codex 150s 含 60s 空等、Claude 393s 含 3m14s 停摆，不可用）。全部前置完成且用户重新放行后才运行；DHR_77 只提供正确 `host_ref` 协议/展示基线，不构成 DHR_35 D-start。P6-RI-A5 必须同时具备 DHR_63 的实际 registry 证据、DHR_65 的 runtime/mutation 证据与 DHR_66 的 Codex projection 复验；DHR_67 必须先证明 Claude 受支持启动路径。使用临时仓或用户批准的低风险真实卡；DSH 关闭路径先测、附加客户端后测；Linux 真实 smoke 不在本卡收口范围，仍由 P6 阶段闸裁决。

### 3.3 标准档共同收口条件

同 P5：两轮独立换人复核；需求境证据（DHR_33/35 须有真实终端 / SSH 实录，pane 相关须截图）；`dh dh-relay` 与证据命令可复跑；P0/P1 清零；用户对话确认后才 `verify(dh-relay):`。凭据值任何工件零出现是本阶段每张卡的附加硬条件。

## 4. P6 阶段闸

### 4.1 核心机器闸 P6-M

| ID | 命题 | 承接卡 |
|---|---|---|
| P6-M1 | 至少一个 Codex 和一个 Claude Profile 完成 Receipt submission 真实节点 | DHR_35 |
| P6-M2 | 身份、配置和 Receipt 可证且零凭据泄露 | DHR_32 / DHR_61 / DHR_63 / DHR_64 |
| P6-M3 | working、blocked、done、unknown 均有真实或受控证据，done 不直写 Result | DHR_33 / DHR_64 / DHR_77 / DHR_35 |
| P6-M4 | quota 正反样本和 fallback 有明确通过或受限结论 | DHR_34 |
| P6-M5 | DSH 关闭时，CLI 能显示状态、Attention 和正确 Herdr host_ref | DHR_33（历史基线）/ DHR_77（`HC-HR-A1..A5/H1`）/ DHR_35（真实闭环展示） |
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
| 覆盖 | design/06 H4/H5/H9/H12 由 DHR_33/34/64/35 承接；design/05 §7/§8 由 DHR_32/35 承接；design/02 B4/B5/B15⑤ 作 Oracle 由 DHR_32/34/35 承接；design/11 P6-IQ-A1/A3/A5 由 DHR_61 承接，A2/A4 由 DHR_34 承接；design/12 P6-RI-A1~A3 由 DHR_64，A5 由 DHR_63+DHR_65+DHR_66 共同复验，A4 由 DHR_67/68/69/70/75/72 的实现前置与 DHR_35 真实闭环承接；design/14 `HC-HR-A1..A5/H1` 恰由 DHR_77 单卡承接，并为 DHR_35 的 P6-M3/M5 展示提供新基线。DHR_77 的 H1 与机器证不承接 P6-RI-A4/P6-M1；F-3516/F-3519 仍由 DHR_73 调查；design/13 `A27-*` 不由 P6 承接；P6-M1~M7 每条至少一张卡 |
| 颗粒度 | DHR_32=审计+注册表；DHR_33=Adapter+SSH；DHR_61=协议/Store/RPC；DHR_34=quota/fallback；DHR_63~70=各自冻结的 registry/Result/真实宿主缺陷修复；DHR_71=回归绿闸；DHR_72=持续观测；DHR_73=启动停摆调查；DHR_75/76=同步阻塞修复；DHR_77=按 design/14 明令不可拆的 event/v0+writer/recovery+hash+read-model/CLI 原子兼容单元；DHR_35=Windows 真实闭环+人判备料 |
| 依赖 | 既有主链至 `DHR_71,DHR_75 → DHR_72` 不变；新增 `DHR_72 → DHR_77 → DHR_35`，DHR_73 仍仅依赖 DHR_72 且不阻塞 DHR_35；无环。DHR_77 完成只解除计划阻塞，不替代 DHR_35 实录或授权。DHR_73、DHR_77、DHR_35 均须各自独立 D-start。 |

## 7. 计划完工

- [ ] DHR_32~35、DHR_61、DHR_63~77（DHR_62 非任务卡）全部销户。
- [ ] P6-M1~M7 全部有等价 pass 证据（M4 允许用户接受的受限；M6 因 B-22 ① 延后，允许记延后/受限并由用户裁决）；P6-X 三态已登记。
- [ ] 端到端证据：Windows Codex + Claude Code 闭环实录、Linux 真实 SSH smoke 可复查；全部工件零凭据扫描通过。
- [ ] P6-H 已向用户展示并由用户判断；P7 是否解锁由用户明确表态。
- [ ] `dev_plan/README.md` 活跃计划表状态已更新。

