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

- **需求 / 议题**：`tools/tests/relay-agent-tool.ps1` 的 `propose without receipt and run root fails closed` 用例，`finally` 把 `RELAY_RUN_ROOT` **恢复成调用方原值**，而紧接着的断言假定它为空。改成显式 `Remove-Item Env:RELAY_RUN_ROOT` 即可。
- **动机**：**P2 后续每张卡的证据命令恰恰要在 relay attempt 进程里跑全量回归**——只要 `RELAY_RUN_ROOT` 被继承，`run-relay-tests.ps1` 就必然 `SUITE FAIL (1)`。这是假红，会让每张卡的施工棒误以为自己踩了回归、浪费一轮排查，或更糟：让真回归被当成"又是那个已知假红"而放过。
- **现状证据**：`tools/tests/relay-agent-tool.ps1:72-75`。2026-08-16 DHR_04 首跑三方独立复现——施工棒记 `findings.md` F-002；review1 判 P2 并指出影响面比 F-002 自记的更大（R1-05）；review2 在 attempt 进程里直跑全量得到 `SUITE FAIL (1)`、清 env 后 `RELAY ALL PASS (SKIPPED: 1)`。
- **改动点（预估）**：单个用例的 env 清理方式；一行。**不在 DHR_04 内改**——该卡变更范围是 `tools/policy/` 与新套件，改既有套件属越界（两轮复核一致建议立 backlog）。
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
- **拆时还要动的三件事**：① `AGENTS.md` 分家（现在 dh-relay 宪章条款与 dh-crew 混在一份里）；② `D:\relay-stage0` 冻结驱动器要重新冻（现冻自 dh-crew `tools/relay/ @34df46a`）；③ 新建 GitHub 私有库（dh-crew 已于 2026-08-17 推到 `nashhu180-netizen/dh-crew`，含 master + 8 个 `wt/*` 分支）。
  - **2026-08-17 结账**：① ✅ 已重写为单模块宪章；③ ✅ `nashhu180-netizen/dh-relay`（private）已建并推送；② ⏸ **未做且刻意不做**——stage0 冻的是 dh-crew 时期的 `tools/relay/`（老目录层级、且不含 DHR_04 之后的改动），但 `DHR_04` 已收口、当前无自举卡在跑，现在冻等于冻一份马上又要过期的快照。刷新动作已由 `P3-DHR_24` 的变更范围承接（"实战前必须显式刷新一次 stage0 并留证"），**不在本条另记**。
- **与流水引擎化的顺序**：二者都是结构性变更，**不同时做**。若引擎化定案要改 12 张卡，建议**先拆仓再引擎化**——拆仓是纯机械搬运（改位置不改内容）风险低，先做完可避免"改完再搬一次"。
- **优先级**：中 · 阻塞于 `DHR_04` 收口
- **提出人 / 日期**：用户，2026-08-17
- **进展**：**第 1 步「提取」已于 2026-08-17 执行完毕**（本仓即产物）。第 2 步「摘除」按用户拍板**暂不做**——dh-crew 侧原件原样保留，两仓短期并存。
- **2026-08-17 提取执行记录**：
  - 源 = dh-crew `master @bc0be11`（`verify(dh-relay): DHR_04 前置隔离与落点守卫 user-signed`）。
  - 手法 = `git clone --no-local` 出副本 → `git filter-repo --path docs/modules/dh-relay/ --path tools/relay/`（历史 31 笔全部保留，非 relay 文件在各笔提交里自动剔除）。
  - **最终布局（点选两次才定，中间走过一次回头路）**：`docs/modules/dh-relay/` **保持原路径** + `tools/relay/` **提级为 `tools/`**。
    - 首轮按「两个都提到仓根」执行（理由：独立仓里再套一层「模块」是冗余），落地后用户改口径「docs 下应该还是 docs/dh-relay」；主控指出 `dh` 工具链认死 `docs/modules/<slug>/` 这一层、写成 `docs/dh-relay/` 同样解析不到 → 用户点选 `docs/modules/dh-relay/`、`tools/` 留在根。
    - **doc 路径与拆分前完全一致**，这是回头路换来的意外收益：`workspace/` 与 `design/evidence/` 里成百上千处 doc 路径引用**自动重新对上号**，历史留痕里只剩 `tools/relay/` 一类地址是旧的（原方案下 doc 与 tools 两类地址都旧）。
    - `tools/` 不跟着还原的理由：这仓只有 relay 一份代码；`tools/relay/` 那层命名空间在 dh-crew 里是为了跟 `tools/protocol/`、`tools/dispatch.ps1` 区分，独立仓里没有要区分的对象。
    - **教训**：布局决策要先查工具链的路径假定再拍。`dh` 的 `docs/modules/<slug>/` 与 `path.resolve(moduleRoot,"..","..","..")` 都是硬编码，选布局时它是约束条件、不是可后补的适配项。
  - 落点 = `D:\MyFiles\ai-workflow\dh-relay`；远端 = `https://github.com/nashhu180-netizen/dh-relay`（**private**，2026-08-17 建，`master` 已推、与本地同 SHA）。三件事之③已完成。
  - 机器证：搬完**未改任何代码**先跑基线 `tools/tests/run-relay-tests.ps1` → `RELAY ALL PASS (SKIPPED: 1)`，证明 `tools/` 与仓库位置解耦；路径适配后复跑仍 ALL PASS。
  - 路径适配口径：**活代码 + 现役文档改，历史留痕不改**。`docs/modules/dh-relay/workspace/DHR_*/` 与 `docs/modules/dh-relay/design/evidence/` 保持原样（那是当时的事实记录，改了等于篡改证据）。定了最终布局后，它们里面的 doc 路径**本就是对的**，只有 `tools/relay/` 一类按「dh-crew 时期的旧地址」读（本仓对应 `tools/`）。
  - 搬迁真踩到的坑（不是纯机械搬运）：两处**仓根解析**写死了退几级目录——`tools/host/run-dogfood.ps1` 的 `$repoRoot` 与 `tools/adapters/preflight/Invoke-RelayBackendPreflight.ps1` 的 orca 工作树默认值，原来都从 `tools/relay/<x>/` 退到仓根，提级后会退到**仓库外面**；已各减一级。教训：「改位置不改内容」低估了相对路径的位置耦合。
  - `AGENTS.md` 分家（三件事之①）已在本仓重写为单模块宪章；dh-crew 侧的双模块登记**未动**。
  - 未跟踪文件：`design/drafts/01`、`design/drafts/02`、`design/evidence/04` 三份在 dh-crew 里也是未跟踪状态，已原样复制过来，并按用户指示**入仓**（提交 `7adf9d3`）。三份都自带「未生效·不在 designInputs[] 白名单·不作 B 拆计划输入」声明，入仓不改变其未生效状态。
  - **SHA 引用两套并存（查证时当心）**：`filter-repo` 会把**提交信息里**的 SHA 引用自动改写成新仓 SHA（例：DHR_04 verify 提交里的 squash 指针，dh-crew 记 `4ac3c1d`，本仓记 `ce586c2`，指的是同一笔），但**文档正文**（DevPlan 状态栏、backlog、workspace 留痕）里的 SHA 它一律不动，仍是 dh-crew 的旧号。**同一笔提交在本仓的两处记录会对不上号**——按 commit message 里的号在本仓 `git show` 得到；按文档里的号只能回 dh-crew 查。未做统一改写：文档里的旧号本身是当时的事实记录，改了就是篡改留痕。
  - **`dh` 命令正常可用**：`dh dh-relay` 按 slug 解析，或不给参数（本仓单模块自动选中）。首轮扁平布局下它只能传绝对路径——这正是回头改布局的直接动因。
  - **新蓄水** `DHR-BL-9`：隔离守卫对仓根文件无处安放（拆仓执行中暴露）。注意最终布局把 `doc_roots` 改回了 `docs/modules/dh-relay/`，但 `production_root` 仍是 `tools/`，**根级文件的缺口依旧存在**，本条不因布局回调而消失。
- **2026-08-17 晚更新（与 `DHR-BL-7` 换语言合并考虑）**：用户当日提出 dh-relay 需在 **WSL / 家用 Linux 笔记本**上跑，并明确「**在 Linux 肯定不会用 PowerShell**」。若换语言成立，**本条与 `DHR-BL-7` 应合成一次 A 立项，不分两次做**——分开做等于「先把 PowerShell 代码搬进新仓，再在新仓把它全删了重写」，白搬一趟。合并后的形态：新建独立仓 → **代码从零用新语言写**，`design/` `dev_plan/` `workspace/` 等**文档与设计演进史仍用 `git filter-repo` 完整迁移**（这部分历史才是真资产；代码历史在全量重写下价值有限，"保留历史"的口径需相应重述，但**不等于放弃历史**）。两条谁先谁后不再是问题——它们是同一件事的两半。

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

### DHR-BL-7 换实现语言 / 运行时（PowerShell 出局，具体语言待定）

- **需求 / 议题**：把 dh-relay 的实现语言从 PowerShell 换掉。**「换」已定，「换成什么」未定**——本条记的是决策输入与待评估项，不是已选型。
- **动机（用户 2026-08-17 提出，两条）**：
  1. **跨平台是硬需求**：dh-relay 要在 **WSL 与家用 Linux 笔记本**上跑。用户原话：「**如果是在 Linux，肯定不会用 powershell 了**」。
  2. **AI 语料与出错率**：本项目**用户不读代码，全部交由 AI 施工与复核**。此前提下「编译器能否替人挡一道」的权重显著上升——现行流程有八轮 AI 复核，**唯独缺最便宜的第零轮（编译期检查）**。
- **现状证据（本条不是猜测，有当日实测）**：
  - PowerShell 静默出错三例（DHR_04 第 4 趟一天内）：`[bool][char]0` 为 `$false` 导致**NUL 检测恰好失效而 CR 正常**（若无先写红测会一路绿灯进主干）；`@(@(...))` 单元素数组被自动拆平需一元逗号；数组切片越界。教训库另有同族数条（`return @()` 解包成 null、`$pid` 只读、`&` 子作用域闭包按值捕获）。
  - **并发/进程监管不匹配**：同日「宿主静默挂死」——同步 spawner 阻塞 tick 循环，`launch_deadline` 到点也无人检查（检查它的循环自己卡住），无子进程、无错误输出。该债已列 `DHR_06`「spawner 不阻塞 tick」。此类模式在有原生并发原语的语言里基本不会写错。
  - 语言税与范围问题的**成本比约 1:5**（当日语言坑合计约 0.5～1 小时；范围面归属问题吃掉两趟施工 + 四轮复核）——**故换语言解决的是小头，不可当银弹**。
- **主控当前倾向（供评估，非结论）**：**Go**。单二进制丢到任意机器即跑（对多机器场景每次都省一遍装运行时）、并发原生、写法收敛（多个 AI 轮流施工风格一致、复核 agent 读起来负担小）、编译器中等强度兜底。备选：Rust（正确率上限最高但 AI 迭代慢、复核更费劲；`herdr` 底座为 Rust 写，若深度集成有加分）、Python（语料最大但部署与并发两个硬伤、无编译期检查）、TypeScript（语料大、异步好，但类型是后贴的、仍需 runtime）。
- **不换的选项也要一并评**：**PowerShell 7 本身可在 Linux 运行**（需自行安装）。真正的跨平台成本不在语言，而在被操作对象：`icacls`（受限写取证）、`Get-CimInstance Win32_Process`、`PrintWindow` 截图（GDI+）、`psmux`、散落各处写死的 `D:\` 盘符与 `projects["D:/…"]` 配置键——**这些换成任何语言都要逐项映射**。保 pwsh + 把平台差异全部逼进 adapter 层，是一条必须被公平对照的路线。
- **时间窗口（本条最要紧的一句）**：P2 共 19 张卡，**现在才做完 1 张**（`DHR_04` 待收口）。现在换 = 重写 `tools/` 现有六块 + `DHR_04` 按同一验收口径重证；P2 做完再换 = 18 张卡的实现加其全部机器证。**约差一个数量级。**
- **卡片受影响面（初判，待评估核实）**：DevPlan 卡片**大部分可原样复用**——变更范围写的是**目录**（`tools/policy/`），验收口径写的是**行为**（`exit 0→pass`、schema 拒未知字段、两条不得误杀反例），均与语言无关。要改的主要是实施提示里点到具体 PowerShell 函数名处，与测试命令（`run-relay-tests.ps1` → 新语言测试入口）。**不是重新拆 19 张卡。**
- **与其它条目的关系**：与 `DHR-BL-5`（独立仓库）**应合成一次 A 立项**，理由见该条 2026-08-17 晚更新；与 `DHR-BL-8`（流水引擎化）是**两个独立维度**，但都属结构性变更，排期上不宜同时开工。
- **待评估清单（起 A 立项时按此写评估材料）**：现有 PowerShell 代码规模盘点；Windows 专属依赖逐项清单与新平台对应方案（**截图与 ACL 取证最难，须单列**）；stage0 自举驱动器在重写期间的过渡方案（它冻结的是 PowerShell 版本）；三条路线代价对比（立刻换 / P2 后换 / 保 pwsh 只做 adapter 隔离）；`DHR_04` 是先收口再重写还是作废重来（**主控建议先收口**——该卡真正的资产是被证过的验收意图：85 条断言、四类拒绝码、优先级分层、两条不得误杀反例、受限写取证做法，这些在新语言里是可照搬的测试清单）。
- **优先级**：高 · 但**不阻塞 `DHR_04` 收口**；须走 A 立项，不得由 AI 自行拍板选型
- **提出人 / 日期**：用户，2026-08-17
- **进展**：未立项。方向（弃 PowerShell）已由用户明确，**具体语言与迁移时序均待定**。

### DHR-BL-8 流水步骤可扩展性：11 棒写死，如何增删与拼接

- **需求 / 议题**：今天每张卡固定跑 **11 棒**（外加 run 级棒 0 与 run 尾归档），棒表由 `standard-pipeline.json` 冻结、planner 只填槽位。诉求有两类：**加步骤**（例：某卡完成后往周报追一条记录，怎么记的逻辑由对应项目承担）与**减/改步骤**（dev-harness 方法论本身会演进，节点表要能跟着改版本）。
- **状态：已有成文草案与两轮交叉审核，不要重新讨论起点。**
  - 四方案对照（自包含、可交第三方评估）：[`design/drafts/02-流水引擎化-四方案对照-待第三方评估.md`](./design/drafts/02-流水引擎化-四方案对照-待第三方评估.md)
  - 两层模型共创草案：[`design/drafts/01-流水引擎化-两层模型-共创草案.md`](./design/drafts/01-流水引擎化-两层模型-共创草案.md)
  - 两轮交叉审核记录（codex R1 + claude-grok R2 + 主会话裁决 + 用户回答）：[`design/evidence/04-流水引擎化-两轮交叉审核记录.md`](./design/evidence/04-流水引擎化-两轮交叉审核记录.md)
  - ⚠️ 三份均为**共创草案 / 未生效**，不在 `design/README.md` 的 `designInputs[]` 白名单内，**不得作 B 拆计划输入**。
- **四个候选方案（速览，详情见草案）**：

  | | A 自由 DAG（两层模型） | B 终态 hook | C 已发布 playbook | D 先做完 P2 |
  |---|---|---|---|---|
  | 和别的流程拼接 | ✓ 最灵活 | ✓ 够用 | ✓ 有限几种 | ✗ 推后 |
  | DH 方法论以后会改 | ✓ 发版本 | ✓ 发版本 | ✓ 发版本 | ✗ 推后 |
  | **授权模型是否闭合** | **✗ P0 未闭合** | ✓ 无组图权 | ✓ 用户点选即授权 | ✓ 现状不变 |
  | 编排权归谁 | planner | 无编排权 | **用户** | 无 |
  | 受影响的 P2 卡 | 12 张 | 少（待估） | 中（待估） | 0 |
  | 相对用户诉求 | 过冲 | 贴合 | 略富余 | 不足 |

  用户口中的「方案 A = GPT 的双层架构」即上表 **A（自由外层 DAG + 内层冻结宏）**；「方案 B = grok 的方案」即 grok 首选的 **B（终态 hook + 单流水版本化）**，其次选为 **C（playbook 点选式）**。
- **核心争点（待第三方评估回答）**：grok 判方案 A 有 **P0：授权模型不闭合**——snapshot 今天冻结的是卡集合与各卡目标/验收/变更范围，**不冻结图拓扑、宏列表、边、触发条件、开关**；若把组图权交给 planner，等于出现一个无人授权的编排面。争点是「子集公式对省略无解」这个论证成不成立、以及方案 A 补洞的代价是否被高估。
- **已由用户拍板的相邻项**：周报消费链**不进本次**（删 H1，采纳 grok 推荐）——即「怎么写周报」归对应项目，relay 只负责在对的时机调它。
- **尚未闭合（阻塞草案定稿）**：外层自由度未定 → 草案不能整版确认；`v1` 边界未定；`DHR_04` 处置未定，**在此期间不得更改该卡任何验收口径**（注：2026-08-17 的 `DHR_04` 收窄只动交付面与新增 `DHR_22`，B9 文字与三条机器证均未改动，经 review9 独立复核确认不受损，与本约束一致）。
- **与其它条目的关系**：与 `DHR-BL-5` + `DHR-BL-7`（拆仓 + 换语言）**都是结构性变更，不宜同时开工**；若引擎化定案为方案 A（影响 12 张卡），建议**先拆仓/换语言再引擎化**——前者是机械搬运与重写，风险低且能一次到位，避免"改完再搬一次"。
- **优先级**：高 · 待第三方评估回填后走 A 立项
- **提出人 / 日期**：用户，2026-08-17（另一 session）
- **进展**：四方案已成文并经两轮交叉审核，**待第三方独立评估**；主会话裁决与用户回答已落 `evidence/04`。

### DHR-BL-9 隔离守卫在独立仓里对仓根文件无处安放

- **需求 / 议题**：`Get-RelayCliDevIsolationPolicy` 是**白名单**式判定——路径既不在 `production_root` 也不在 `doc_roots` 之下，一律判 `dev-isolation-violation:unclassified-path`。2026-08-17 拆独立仓后，**仓根文件**（`AGENTS.md`、`README.md`、`.gitignore`、将来的 CI 配置）全部落进"无处安放"，改一次就被守卫判违规。
- **动机**：守卫是 `DHR_04` 刚 verify 签收的成果，其"改动只许落在自己地盘"的意图在独立仓里依然成立；但它设计时的隐含前提是 **relay 住在别人仓的子树里，仓根不归自己管**。独立仓之后仓根归自己了，规则需要重述而不是绕过。
- **注意：布局回调没有消掉本条**。最终布局把 `doc_roots` 改回 `docs/modules/dh-relay/`，`production_root` 仍是 `tools/`——仓根文件依旧两头不沾。缺口来自「relay 拥有整个仓」这件事本身，与 docs 放哪层无关。
- **现状证据**：`tools/policy/Invoke-RelayPolicyCheck.ps1` `Get-RelayCliDevIsolationPolicy`；判定逻辑见 `tools/policy/relay-policy.ps1` `Get-RelayDevIsolationVerdict` 第 93~103 行（`$inProd -or $inDoc` 之外只剩两种违规出口）。
- **拆仓时的处置（已做）**：只把 `production_root` 改 `tools/`（`doc_roots` 最终维持 `docs/modules/dh-relay/` 原值），**`forbidden_roots` 一字未动**。原因有二：① 那四个根里的 `docs/modules/dh-crew/` 被 `mode all multi-verdict reason is policy-violation:multi` 用例锁着，删了会真红；② 重新设计守卫语义超出"搬仓"范围，不该顺手做。搬完全套测试 ALL PASS。
- **改动点（预估）**：给策略加一层**根级文件白名单**（或允许 `doc_roots` 收单文件条目），并同步 `tools/tests/relay-policy.ps1`；顺带清掉 `forbidden_roots` 里三条独立仓已不存在的 dh-crew 专属根——但必须连同锁着它的用例一起改，别只删数据。
- **优先级**：中 · 下次真要动仓根文件、或给本仓接 CI 时必须先修
- **提出人 / 日期**：主控，2026-08-17（拆仓执行中暴露）
- **进展**：未立项。

### DHR-BL-10 zcode（GLM-5.3 独立 CLI）接进 v1 现役 headless 派活位

- **需求 / 议题**：现役 `-Cli` 只认 `claude` / `codex` 两个值（`tools/host/relay-worker-entry.ps1:4` 的 `ValidateSet`）。新增第三个正式值 `zcode`，指向 Z.ai 桌面端内置的无头 CLI（`D:\Program Files\zcode\resources\glm\zcode.cjs`，zcode 0.16.5 / GLM-5.3 / 1M 上下文），**只接 headless 一次性位**（复核 worker + `Invoke-DogfoodSpawn` 类一次性 agent），不接常驻交互施工位。
- **动机**：DHR_01~04 的 glm 复核全部靠 `claude` CLI 换 `CLAUDE_CONFIG_DIR=~/.claude-account4` 实现（见本文件 `DHR-BL-6` 账号池与 `workspace/DHR_04/review.md`）。那条路把「换模型」和「换 claude 账号」耦在一起：占账号槽、共享 `~/.claude*` 配置面、两轮换人复核的「不复用同一会话」只能靠换 config dir 保证。换成独立 CLI 后进程、配置、凭据、会话四层都天然隔离，第二轮换人复核的独立性更硬。顺带把派活账号池从 4 个扩到 5 个。
- **不接常驻交互位的原因**：`zcode --prompt` 明确是 "Run a single prompt without opening the TUI"，跑完即退；铁律#4 要求施工 worker 能在窗口里问用户并等待，语义对不上。`zcode tui` 能否带初始 prompt 启动未验证，验证成本与收益不匹配，故本条只接 headless 位。
- **现状证据（2026-08-27 主控实测）**：`--prompt` / `--cwd` / `--mode {build,edit,plan,yolo}` / `--json`（回 `sessionId` + token 用量 + 上下文占用）/ `-c` 续上次 session / `--resume sess_xxx` / `--allowed-tools` / `--disallowed-tools` 全部可用；实测能写文件、跑 python、回报结论。`--help` 列出的 `--max-turns` 实际报 `Unknown option`，不可用。
- **已知坑**：CLI 用**自己的** `~/.zcode/cli/config.json`，与桌面端 `~/.zcode/v2/config.json` 不共享，缺失即报 `Model config is missing`；`model.main` 必须是 `"provider/model"` 字符串而非对象。apiKey 可走 `ZCODE_API_KEY` 环境变量，**不必落进配置文件**（`zIi/apiKeyEnvCandidates` 的候选顺序：`ANTHROPIC_API_KEY` → `<PROVIDER>_API_KEY` → `ZCODE_API_KEY`）。桌面端 `v2/config.json` 明文存 apiKey，属既有现状，本条不扩范围去治理它。
- **改动点（预估）**：`tools/host/relay-worker-entry.ps1`（ValidateSet + dry-run 分支 + 实拉分支 + 凭据注入）、`tools/host/run-dogfood.ps1`（`-WorkerCli` ValidateSet）、`tools/tests/` 对应断言。**不动** `relay-core/` 契约——zcode 在 v2 里归既有 `executor_kind: process`，不新增枚举，`capability_hash` 不变。
- **待核风险**：as-built/relay-core §开篇称「v1 现役且被 v2 只读作 Oracle」，须确认 Oracle 面只覆盖契约/转换矩阵（`tools/contracts/`）、不含宿主拉起层（`tools/host/`）；若覆盖则本条改动需另行评估。
- **优先级**：中 · 用户 2026-08-27 已授权按计划外维护任务开工（标准档 · `task_type=normal`）
- **提出人 / 日期**：用户，2026-08-27
- **范围追加（2026-08-27 用户对话裁决 · RQ-1）**：接线时必须把 `if/else` 二分支改成三分支，这一步**强制触发**了派发语义的决定，无法回避。原实现 `$Cli -ceq 'claude'` 大小写敏感、而 `ValidateSet` 校验不敏感且不规范化取值，导致 `-Cli CLAUDE` **静默掉进 else 去拉 codex**（fail-open 错派）。本卡范围因此正式追加一条：**`-Cli` 派发改为大小写敏感 + 非法值 fail-closed 退出**（`switch -CaseSensitive` + `default` 写 stderr 并 `[Environment]::Exit(4)`）。退出码 4 对齐同目录 `relay-agent-tool.ps1:128` 的「输入校验失败」惯例；用 `[Environment]::Exit` 而非 `throw`/`exit` 是因为两个真实调用方（`run-dogfood.ps1:57`、`psmux-adapter.ps1:96`）以 `pwsh -NoExit -File` 形态拉起，该形态下 `throw` 与 `exit` 均不终结进程（返工轮 3 实测）。
  - **这是行为兼容性变更**：`-Cli CLAUDE` / `CODEX` 等非规范大小写入参，此前会被接受并（错误地）派发，现在会明确报错退出。
  - **授权链**：AI 在返工轮 2 自行实施 → 需求复核（codex）判 `RQ-1 P1「扩大交付行为面、未获用户授权」` → 主控摆给用户 → **用户 2026-08-27 在对话里点选「接受，补进需求」** → 回填本条。
  - 静默错派 bug 本身是**本卡之前就存在的**，非本卡引入。
- **进展**：**已完成**（2026-08-27 用户 chat-confirm 人验通过并授权本地收口）。工作区 [workspace/DHR-BL-10/](workspace/DHR-BL-10/)。施工由 zcode 自任 headless worker（GLM-5.3 起手，用户中途指定改 GLM-5.3-Flash 并设 reasoning=max；共 1 轮施工 + 4 轮返工，其中 1 次因 `ECONNRESET` 网络中断续棒）；复核 4 路全部由 codex 独立只读完成（代码轮1 / 技术裁定 / 需求 E4 / 教训 E5），高于 `normal` 配方要求的 3 路。最终 agent-tool 断言 32→42，全量 `RELAY ALL PASS (SKIPPED: 1)`（主控 4 次独立复跑）。

### DHR-BL-11 `-NoExit -File` 形态下 worker 成功路径不自行终结进程

- **需求 / 议题**：`tools/host/relay-worker-entry.ps1:35` 的 `exit $code`（成功路径收尾）在 `pwsh -NoProfile -NoExit -File` 形态下**不终结进程**——脚本结束后 PowerShell 停在提示符。两个真实调用方（`run-dogfood.ps1:57`、`psmux-adapter.ps1:96`）用的正是该形态。
- **来源**：`DHR-BL-10` findings **F-013**（P3，范围外只登记）。返工轮 3/4 实测确认：该形态下 `throw` 与 `exit` 均无效，只有 `[Environment]::Exit()` 会真正终结进程（同卡 `default` 分支已改用 `[Environment]::Exit(4)`，教训见 `lesson_candidates` L-006）。
- **影响面**：三条 CLI 分支（claude / codex / zcode）**一视同仁**，非 zcode 引入、非本次回归。现状靠 psmux adapter 回收 pane 兜住，所以未在现役流水暴露成故障。
- **为什么值得单列**：它与 `DHR-BL-1`（「在等人」检测）/ `DHR-BL-6`（额度耗尽无信号）同属「宿主分不清 pane 是在等人、卡死、还是已经干完了」这一族；成功后不退出的 pane 会被观察成 `idle`，与「卡住」同形。
- **改动点（预估）**：把 `exit $code` 换成 `[Environment]::Exit($code)`，并补一条按**真实 launcher 形态**（`-NoExit -File`）验证成功路径也真退出的断言。注意评估 pane 立即消失是否影响人工查看 worker 输出——`-NoExit` 当初可能正是为此保留。
- **优先级**：中 · 下次动 worker 拉起层或做宿主观测治理时一并处理
- **提出人 / 日期**：`DHR-BL-10` 施工方（zcode），2026-08-27
- **进展**：未立项。

### DHR-BL-12 `as-built/relay-psmux-host.md`「测试与守卫」计数表快照过时

- **需求 / 议题**：该表写「固定 15 套件」、agent-tool=32 断言；现势为 **16 套件**（漏列后加的 `relay-policy.ps1`）、agent-tool **42** 断言。
- **来源**：`DHR-BL-10` findings **F-005**（P3，open）。该卡步骤 7 只授权改两行 `claude|codex` → `claude|codex|zcode`，刷新整张计数表超出范围，故只登记未顺手改。
- **改动点（预估）**：按当前 `tools/tests/run-relay-tests.ps1` 的套件清单与各套件实跑断言数刷新该表；顺带确认 as-built 其余计数类描述有没有同类漂移。
- **优先级**：低 · 下次更新该份 as-built 时一并刷新
- **提出人 / 日期**：`DHR-BL-10` 施工方（zcode），2026-08-27
- **进展**：未立项。
