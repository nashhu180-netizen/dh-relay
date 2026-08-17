<!-- dh:v1 · backlog.md — 模块级临时需求池（pre-A 蓄水池）。🟢 开发中顺手记。
     装"已确认值得做、但还没排期/立项"的独立 增强/bug/议题；排期时拉出来走 A 立项（不直接开工）。
     ≠ lesson_candidates（教训）· ≠ findings（任务内问题）· ≠ DevPlan 任务（已立项排期）。 -->
# dh-relay 待办列表（backlog · 临时需求池）

> **阅读对象与目的**：面向本模块后续立项。记录已确认但未排期的独立需求/议题，供排期时拉取走 **A 立项**。
> **存量条目**：IHSR_05 试点暴露的 `RB-1`～`RB-5` 仍留在 [workspace/DHR_03/evidence/H2-真实业务试点-IHSR_05.md](workspace/DHR_03/evidence/H2-真实业务试点-IHSR_05.md)，尚未逐条迁入本文件；排期时两处都要看。

## 待办列表

### DHR-BL-1 「在等人」检测与提醒面（不打断终端也能知道该出手了）

- **需求 / 议题**：让用户**不用盯着弹出的终端窗口**，也能知道某一棒正卡在等人。分三层：
  1. **检测**：区分 worker「在思考」与「在等人」。二者屏幕都不动，现有 `IdleAfterSeconds` 指纹判据分不开。可行判据 = **指纹稳定超阈值 ∧ pane 末屏命中已知提示形态**（`Do you want to proceed?`、`❯ 1. Yes`、`Enter to confirm`、`Yes, I trust this folder` 等），命中后落一条可机读事件。
  2. **常驻状态面**：常驻宿主定时刷新各 run / 各棒状态，供外部只读消费。
  3. **主动提醒**：Windows toast 或企微/飞书推送。
- **动机**：**relay 今天对 CLI 自己弹的框是瞎的**——worker 按 brief 主动写的 `decision_required` checkpoint 宿主看得见，但 CLI 层的信任弹窗、`rm -f` 权限确认，relay 只看到"屏幕没变=idle"，与"正在思考"完全同形。要么靠人肉抓 `capture-pane`，要么等 30 分钟 `StallThresholdSeconds` 才暴露。**一卡一树意味着每张卡的第一棒都会撞一次**（见 DHR-BL-2）。
- **现状证据**：2026-08-16 DHR_04 stage0 自举首跑实测——`build` 棒（grok）被信任弹窗挡住，宿主状态行始终 `build=running/working`，无任何"在等人"信号，主控靠 `psmux capture-pane` 肉眼发现；同一 run 里 `rm -f` 权限确认框亦无信号，由用户自己截图问主控。留痕见 [workspace/DHR_04/controller-notes.md](workspace/DHR_04/controller-notes.md) C-01/C-02。
- **与既有计划的关系**（**不重复造**）：
  - 第 2 层「常驻宿主 + 控制台 + status + 跨仓 run 索引」**已经是 `DHR_09`** 的范围，本条不另起炉灶，只补它没有的检测与提醒。
  - 第 3 层「通知 adapter」design/02 现列为 **P3**；若要落地需先把它从 P3 提前，或改由外部 console 承担。
  - 第 1 层「等人检测」**当前 18 张卡无人覆盖**，是本条真正的新增点。
- **改动点（预估）**：psmux adapter 的 probe 增加"末屏形态匹配"旁路输出（**不改** `running/idle` 既有转换边，只额外产出一个 `awaiting_input` 提示事件）；宿主把该事件写进事件账；提醒通道另接。提示形态清单需可配置、且**只做提示不做判定**（不能让 relay 据此自动作答——IHSR_05 RB-3 有代答落错选项的先例）。
- **消费面分工（用户 2026-08-16 提出）**：常驻看板做进 [`agent-console`](../../../../02-agent-workspace/agent-console)（`D:\MyFiles\ai-workflow\02-agent-workspace\agent-console`）。**边界**：Runner / 宿主留在 relay——"Runner 是运行状态唯一写者"是 relay 地基，不能搬走；agent-console 只做**只读看板 + 提醒**，消费 `~/.dh-relay/runs.json` 与各 run 现场。该分工与 agent-console `AGENTS.md` 硬规则 6（"控制台只做发现、配置、启动、结果接收和调度，不复制业务逻辑"）一致。
- **先后依赖**：agent-console 要读的跨仓索引 `~/.dh-relay/runs.json` 与 `<repo>/.dh-relay/<run_id>/` **由 `DHR_09` 产出**；P1 现役现场仍在 `.dh-runtime/relay/` 且无跨仓索引。故看板侧要等 DHR_09 落地后再在 agent-console 走 A 立项（挂它的 design/03 项目监控）。agent-console 现行硬规则 3 也只允许设计、不允许实现。
- **优先级**：中 · 依赖 DHR_09
- **2026-08-17 补充实证（第二次踩，且这次有代价）**：DHR_04 返工趟 `review4` 棒同时踩到两个"看不见"——① 它因 `DHR-BL-4` 的绕过误删自身 env 而全程无法 checkpoint，② 中途还卡在一个 `rm -rf` 权限确认框上等人半小时。relay 侧只看到 `idle`，30 分钟后判 `stall-threshold-exceeded` 并标 `interrupted_unknown`。**两个问题都指向同一个缺失：宿主分不清"在思考 / 在等人 / 已失联"，只好用一个 30 分钟的静默阈值一刀切，且切错了还把好结果丢掉。**另暴露一条相邻议题：**stall 阈值判据对"复核棒"这类长跑本就不合适**（穷举式扫描天然长时间无交棒动作），心跳纪律靠 brief 里叮嘱太脆——检测层做出来后，应让"活着且在等人/在跑"与"真失联"走不同分支，而不是共用一个阈值。
- **提出人 / 日期**：用户，2026-08-16（DHR_04 首跑撞到弹窗后当场提出"runner 能不能常驻 + 定时刷新终端状态提醒用户"）
- **进展**：未立项。主控当时提的"包装脚本里加末屏形态匹配"的短期止血**未采纳**（用户选择记 backlog）。
- **2026-08-17 第三次实证（同一趟内又踩一次，且这次撞的是"额度耗尽"新形态）**：DHR_04 第 3 趟（`RELAY-DHR04-REWORK2-20260817095138`）两处再踩——① `fix2` 棒（grok）中途卡在 `rm -rf "$TEMP/dhr04-mh-mut"` 权限确认框，宿主显示 `fix2=idle/working`；② `review6` 棒（account9/deepseek）拉起 30 秒后 `API Error: 402 Insufficient Balance`，进程仍活、屏幕不再变，宿主同样显示 `review6=idle/working`。**两次都靠主控 `capture-pane` 肉眼发现。**这条把"在等人"扩成了**三态需要区分**：在思考 / 在等人 / **活着但已废（额度耗尽、API 硬错）**——第三态用 `idle` 指纹和末屏形态匹配都识别不出，得看 CLI 的错误输出。留痕见 [workspace/DHR_04/controller-notes.md](workspace/DHR_04/controller-notes.md) C-05/C-06。
- **2026-08-16 更新（Herdr 底座候选出现后）**：若 [design/03](./design/03-完整流水-Herdr底座-产品设计与验收.md)（平行候选，草案未确认）被采纳，本条三层的处置全部改变——① **检测层的主体由宿主免费提供**（herdr 原生 `blocked`，实测覆盖会话内确认框、**不覆盖启动信任弹窗**，见 [evidence/03 E-A8-03](./design/evidence/03-Herdr底座-preflight实测与审核记录.md)），"末屏形态匹配"不必自建；② 常驻状态面仍归 `DHR_09`；③ 消费面与提醒仍落 agent-console，且其**边界被 design/03 `H11` 冻结为「托管守护 relay 宿主进程 + 三条只读契约 + 只允许调 `relay start/resume/stop`」**（用户 2026-08-16 拍板），Runner 写权仍全留 relay。**本条在 design/03 未确认前不动，仍按原样待立项。**

### DHR-BL-2 worker 工作树信任预置（每张卡第一棒必撞的启动弹窗）

- **需求 / 议题**：relay 拉起 worker 前，把目标 `WorkDir` 在该 profile 的 CLI 配置里预置为已信任，或做 preflight 检查并明确报错；不要让 worker 静默停在 CLI 启动弹窗上。
- **动机**：`--dangerously-skip-permissions` **不覆盖**"是否信任此文件夹"弹窗。dev-harness 是一卡一树（`.dh-worktrees/<卡>` 或 `D:\wt\<卡>`），每张新卡的路径都是新路径 → **每卡第一棒必撞一次**；无人值守下白等到 stall 阈值。
- **现状证据**：2026-08-16 DHR_04 首跑，grok 棒被挡；主控手工往 `.claude`、`.claude-grok`、`.claude-account9` 三份 `.claude.json` 的 `projects["D:/…/.dh-worktrees/DHR_04"]` 写 `hasTrustDialogAccepted=true` 后 `send-keys Enter` 解开，后两棒未再撞。留痕见 `workspace/DHR_04/controller-notes.md` C-01。
- **改动点（预估）**：worker 入口 / profile 层在 launch 前做一次幂等预置或 preflight；**注意并发写**——CLI 退出时会回写同一份 `.claude.json`，预置必须容忍被覆盖并可重入。
- **建议去处**：`DHR_08`（用户级 profile 执行边界，天然管 config_dir）优先；或 `DHR_09`（宿主生命周期与启动前置闸）。
- **优先级**：中 · 与 DHR-BL-1 同源，但**可独立先做**（这条是消除弹窗，那条是发现弹窗）
- **提出人 / 日期**：主控，2026-08-16（DHR_04 stage0 自举首跑实测）
- **进展**：未立项。当前靠主控手工预置绕过。
- **2026-08-17 正面实证（修法有效性已验）**：DHR_04 第 3 趟换 account4/glm-5.2 接 `review6` 前，主控**先**往 `~/.claude-account4/.claude.json` 写 `projects["D:/…/.dh-worktrees/DHR_04"].hasTrustDialogAccepted=true`，该棒**全程未撞启动弹窗**。反证本条建议的修法（launch 前幂等预置）确实有效、成本极低（一次 JSON 读改写），可直接照此实现。留痕见 `workspace/DHR_04/controller-notes.md` C-07。

### DHR-BL-4 `relay-agent-tool` 套件夹具污染：在 attempt 进程里跑全量回归必然假红

- **需求 / 议题**：`tools/relay/tests/relay-agent-tool.ps1` 的 `propose without receipt and run root fails closed` 用例，`finally` 把 `RELAY_RUN_ROOT` **恢复成调用方原值**，而紧接着的断言假定它为空。改成显式 `Remove-Item Env:RELAY_RUN_ROOT` 即可。
- **动机**：**P2 后续每张卡的证据命令恰恰要在 relay attempt 进程里跑全量回归**——只要 `RELAY_RUN_ROOT` 被继承，`run-relay-tests.ps1` 就必然 `SUITE FAIL (1)`。这是假红，会让每张卡的施工棒误以为自己踩了回归、浪费一轮排查，或更糟：让真回归被当成"又是那个已知假红"而放过。
- **现状证据**：`tools/relay/tests/relay-agent-tool.ps1:72-75`。2026-08-16 DHR_04 首跑三方独立复现——施工棒记 `findings.md` F-002；review1 判 P2 并指出影响面比 F-002 自记的更大（R1-05）；review2 在 attempt 进程里直跑全量得到 `SUITE FAIL (1)`、清 env 后 `RELAY ALL PASS (SKIPPED: 1)`。
- **改动点（预估）**：单个用例的 env 清理方式；一行。**不在 DHR_04 内改**——该卡变更范围是 `tools/relay/policy/` 与新套件，改既有套件属越界（两轮复核一致建议立 backlog）。
- **优先级**：**高**（2026-08-17 上调）· **必须在 relay 自举流水铺开前修掉**
- **提出人 / 日期**：DHR_04 施工棒 + 两轮复核，2026-08-16
- **进展**：未立项。当前绕过办法 = 跑全量回归前先清 `RELAY_RECEIPT` / `RELAY_RUN_ROOT` / `RELAY_ATTEMPT_DIR` / `RELAY_TOOL`。
- **2026-08-17 升级理由——绕过方案本身是陷阱，已造成一次真实事故**：
  该绕过必须写进**每一份** worker brief，而它一旦被 worker 用在**自己的 shell**（而非新开子进程）里，就会**摧毁该 worker 的 relay 身份**（`RELAY_RECEIPT` 没了 → `relay-agent-tool.ps1` 按设计 exit 3 → checkpoint 与 result 全部写不出去）。完整事故链：
  1. DHR_04 返工趟 `review4` 棒（deepseek）把清 env 的命令执行在自己的 shell 里；
  2. 该棒**一条 checkpoint 都没写成**（attempt 目录 0 文件；同一 run 的 `fix`=9 条、`review3`=6 条 checkpoint 痕迹正常，证明 launch 与 env 注入本身无缺陷）；
  3. Runner 只认 checkpoint 当进展 → 30 分钟后 `stall-threshold-exceeded` → 节点标 `interrupted_unknown` 挂起；
  4. **标签是错的**：该 worker 全程活着且在正常工作，最后还产出了一份 39 条路径变体穷举的高质量复核；
  5. 宿主判"无事可做"退出（`exit=3`），**relay 再也收不回这一棒的结果**（paused 节点要靠重编排新 attempt，等于扔掉重做）；成果只因为 worker 自己 `git commit` 了才留住。
  **结论**：这不是"讨厌但能忍"的夹具瑕疵——它逼出的绕过会周期性地让 worker 静默失联并丢结果。修 BL-4 本体（一行）比在每份 brief 里反复叮嘱可靠得多。
  **在修好之前**，brief 里的写法必须明确成「在**新开子进程**里清 env 并跑」，且**禁止** worker 在自己 shell 里执行 `Remove-Item Env:RELAY_*`。

### DHR-BL-5 dh-relay 拆成独立仓库（保留历史 · 等 DHR_04 收口后执行）

- **需求 / 议题**：把 dh-relay 从 dh-crew 仓里拆出来，单独成一个 GitHub 私有仓，**保留提交历史**。
- **动机**：relay 本来就是给**任意仓**用的通用工具（IHSR_05 已在 infohub 仓真跑过），挂在 dh-crew 底下语义上像其附属品；拆开后 verify scope、卡号空间、run-all、AGENTS 宪章各自干净，不再互相牵扯。
- **可行性已实测（2026-08-17，主会话只读核查）——耦合面比预期干净**：
  | 耦合面 | 实测结果 |
  |---|---|
  | `tools/relay/` 引用仓内其他代码 | **零**（DHR_04 隔离守卫的纪律见效） |
  | 测试 | 自带 `tools/relay/tests/run-relay-tests.ps1`，**未**挂进 dh-crew 的 `tools/tests/run-all.ps1` |
  | 文档交叉引用 | dh-relay 文档只有 **7 处**指向 dh-crew，且均为散文性质（禁改边界、design/10 派活范式、protocol/00 协作协议） |
  | `dh` 命令 | 全局安装于 `AppData\Roaming\npm\dh.cmd`，**两个仓都不在**；`dh-console`/`tools/dh-*.mjs` 亦不在本仓 |
  | dev-harness skill | 在 `~/.claude/skills`，不在仓里 |
  | `~/.dh-relay/` 注册表、业务仓 `docs/relay/` 留档 | 本来就跨仓，拆不拆一样 |
  - 补充佐证：relay 运行时机器闸的 cwd 是**业务仓的任务树**——它操作的一直是别人的仓，**代码住在哪与能否干活本就解耦**。
- **两步法（关键：第一步对在飞任务零影响）**：
  1. **提取**（只读，随时可做）：`git clone` 一份 → 在**副本**上跑 `git filter-repo` 只保留 `tools/relay/` + `docs/modules/dh-relay/` 的历史 → 建新私有库推送。**dh-crew 原仓一字节不动**，在飞的工作树/stage0/psmux 会话全无感。
  2. **摘除**（有影响，必须等）：从 dh-crew 删掉那两个目录。会让在飞卡的基线失效、stage0 驱动器的源消失、机器闸找不到自己。
- **执行时点（用户 2026-08-17 拍板）**：**等 `DHR_04` 收口销户后再提取**。理由：`wt/DHR_04` 当时领先 master 22 个提交且未收口，提前提取会拿到不含该卡成果的快照，收口后还要跨仓手工同步一次，不划算。
- **历史处理（用户拍板）**：**保留历史**，走 `git filter-repo`（需另装工具）。
- **拆时还要动的三件事**：① `AGENTS.md` 分家（现在 dh-relay 宪章条款与 dh-crew 混在一份里）；② `D:\relay-stage0` 冻结驱动器要重新冻（现冻自 `tools/relay/ @34df46a`）；③ 新建 GitHub 私有库（dh-crew 已于 2026-08-17 推到 `nashhu180-netizen/dh-crew`，含 master + 8 个 `wt/*` 分支）。
- **与流水引擎化的顺序**：二者都是结构性变更，**不同时做**。若引擎化定案要改 12 张卡，建议**先拆仓再引擎化**——拆仓是纯机械搬运（改位置不改内容）风险低，先做完可避免"改完再搬一次"。
- **优先级**：中 · 阻塞于 `DHR_04` 收口
- **提出人 / 日期**：用户，2026-08-17
- **进展**：未立项。可行性已核（见上表），执行时点与历史处理已拍板，等 `DHR_04` 收口后走 A 立项或直接按两步法执行。

### DHR-BL-3 stage0 自举包装通用化（plan 描述文件 + brief 目录）

- **需求 / 议题**：把"用冻结的 relay 驱动 relay 自身开发"的包装脚本与逐棒 brief 抽成通用输入（一份 plan 描述 + 一个 brief 目录 + 逐节点 profile 映射表），换卡只改数据不改代码。
- **动机**：DHR_04 已把逐节点账号映射抽成 `$profiles` 哈希表，但包装脚本与 3 份 brief 仍是本卡手写，每张卡固定成本不小。与 IHSR_05 `RB-4` 同源。
- **现状证据**：`D:\relay-run-DHR_04\run-card-relay.ps1` + `briefs\{build,review1,review2}.md`；`workspace/DHR_04/controller-notes.md` C-03。
- **与既有计划的关系**：`DHR_10`（标准流水节点与模板）本就要做"接力计划生成 agent 按标准流水模板实例化"，本条大概率被它吸收；排期时先核 DHR_10 覆盖面，不要重复立卡。
- **优先级**：低 · 大概率并入 DHR_10
- **提出人 / 日期**：主控，2026-08-16
- **进展**：未立项。
- **2026-08-17 补一条坑**：给包装加"单节点 phase"（只跑一棒续跑）时踩 PowerShell 数组拆平——`$nodeSets.x = @(@('review6','reviewer','review6.md','none'))` 单元素会被解包，`foreach` 拿到的是字符串 `'review6'` 而非数组，报 `Cannot find path '…\briefs\v'`。须写 `@(,@(…))`（一元逗号）。与教训库既有条目「`return @()` 解包成 null 须 unary comma」同族。通用化时若用数据文件（JSON/psd1）描述节点表，本坑自然消失——**这也是支持"抽成 plan 描述文件"而非"继续用哈希表硬编码"的一条理由**。

### DHR-BL-6 额度耗尽 / API 硬错在现役 relay 下完全无信号（过渡期缺口）

- **需求 / 议题**：worker 因额度耗尽或 API 硬错而"活着但已废"时，relay 要能识别并给出信号，而不是等满 30 分钟静默阈值。**注意这不是要现在造 `DHR_08` 的完整能力**——本条记的是「`DHR_08` 落地之前，stage0 与 P1 现役宿主上这个洞一直敞着」这一过渡期风险，以及它的最小止血面。
- **动机**：现役宿主判活只看终端指纹变化。CLI 报完 `API Error: 402` 后进程仍在、屏幕不再变 → 状态与"在思考"完全同形（`idle/working`）。无人值守下每次撞额度白烧 30 分钟，且判完 `interrupted_unknown` 后该棒现场即废、要靠重编排新 attempt 从头再来。
- **现状证据**：2026-08-17 DHR_04 第 3 趟，`review6` 棒（account9/deepseek）拉起 30 秒后 `API Error: 402 Insufficient Balance`，宿主全程只显示 `review6=idle/working`。主控靠 `capture-pane` 肉眼发现，手工杀宿主 → 换 account4/glm-5.2 → 单棒重派跑通（`RELAY-DHR04-REVIEW6-20260817104420`，`exit=0`）。留痕见 [workspace/DHR_04/controller-notes.md](workspace/DHR_04/controller-notes.md) C-05 与四趟 run 一览。
- **与既有计划的关系**（**不重复造**）：
  - 「高置信 quota 识别 + 预登记 fallback + 无 fallback 转 paused→诊断」**已经是 `DHR_08` 的范围**（design/02 决策与 B5 验收），本条**不另立能力卡**，只作为它的首个真实现场证据 + 优先级依据。
  - 检测与提醒面归 `DHR-BL-1`；本条给它补了**第三态**：在思考 / 在等人 / **活着但已废**——第三态靠 `idle` 指纹和末屏形态匹配都识别不出，须读 CLI 的错误输出。
  - 手工换账号重派的做法（杀宿主 → 换 profile → 单棒 phase 重跑）本身可复用，但每次要手改包装；通用化归 `DHR-BL-3`/`DHR_10`。
- **过渡期最小止血（可选，未采纳）**：宿主 tick 时对 pane 末屏做一次已知硬错形态匹配（`API Error: \d{3}`、`Insufficient Balance` 等），命中即写一条事件并提前判定，不必等满阈值。**注意与 IHSR_05 RB-3 同款红线**：只做提示不做自动处置，绝不让 relay 据此自动换账号。
- **另暴露一条相邻事实**：主控强杀宿主会跳过 `Copy-RelayEvidence`，run 现场不会被复制进 `evidence/`，须手工补拷。若将来做"宿主可被外部安全终止"，应保证证据复制在终止路径上也执行。
- **优先级**：中 · 依赖 `DHR_08`（能力本体）；本条只作证据与过渡期风险登记
- **提出人 / 日期**：主控，2026-08-17（DHR_04 第 3 趟实测）
- **进展**：未立项。当前靠主控盯屏 + 手工换账号重派绕过。**account9 当前余额耗尽，派活账号池实际可用的是：默认账号(Opus) / grok / account4(glm-5.2) / account7(mimo)。**
