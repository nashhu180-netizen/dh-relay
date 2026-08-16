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
- **提出人 / 日期**：用户，2026-08-16（DHR_04 首跑撞到弹窗后当场提出"runner 能不能常驻 + 定时刷新终端状态提醒用户"）
- **进展**：未立项。主控当时提的"包装脚本里加末屏形态匹配"的短期止血**未采纳**（用户选择记 backlog）。

### DHR-BL-2 worker 工作树信任预置（每张卡第一棒必撞的启动弹窗）

- **需求 / 议题**：relay 拉起 worker 前，把目标 `WorkDir` 在该 profile 的 CLI 配置里预置为已信任，或做 preflight 检查并明确报错；不要让 worker 静默停在 CLI 启动弹窗上。
- **动机**：`--dangerously-skip-permissions` **不覆盖**"是否信任此文件夹"弹窗。dev-harness 是一卡一树（`.dh-worktrees/<卡>` 或 `D:\wt\<卡>`），每张新卡的路径都是新路径 → **每卡第一棒必撞一次**；无人值守下白等到 stall 阈值。
- **现状证据**：2026-08-16 DHR_04 首跑，grok 棒被挡；主控手工往 `.claude`、`.claude-grok`、`.claude-account9` 三份 `.claude.json` 的 `projects["D:/…/.dh-worktrees/DHR_04"]` 写 `hasTrustDialogAccepted=true` 后 `send-keys Enter` 解开，后两棒未再撞。留痕见 `workspace/DHR_04/controller-notes.md` C-01。
- **改动点（预估）**：worker 入口 / profile 层在 launch 前做一次幂等预置或 preflight；**注意并发写**——CLI 退出时会回写同一份 `.claude.json`，预置必须容忍被覆盖并可重入。
- **建议去处**：`DHR_08`（用户级 profile 执行边界，天然管 config_dir）优先；或 `DHR_09`（宿主生命周期与启动前置闸）。
- **优先级**：中 · 与 DHR-BL-1 同源，但**可独立先做**（这条是消除弹窗，那条是发现弹窗）
- **提出人 / 日期**：主控，2026-08-16（DHR_04 stage0 自举首跑实测）
- **进展**：未立项。当前靠主控手工预置绕过。

### DHR-BL-4 `relay-agent-tool` 套件夹具污染：在 attempt 进程里跑全量回归必然假红

- **需求 / 议题**：`tools/relay/tests/relay-agent-tool.ps1` 的 `propose without receipt and run root fails closed` 用例，`finally` 把 `RELAY_RUN_ROOT` **恢复成调用方原值**，而紧接着的断言假定它为空。改成显式 `Remove-Item Env:RELAY_RUN_ROOT` 即可。
- **动机**：**P2 后续每张卡的证据命令恰恰要在 relay attempt 进程里跑全量回归**——只要 `RELAY_RUN_ROOT` 被继承，`run-relay-tests.ps1` 就必然 `SUITE FAIL (1)`。这是假红，会让每张卡的施工棒误以为自己踩了回归、浪费一轮排查，或更糟：让真回归被当成"又是那个已知假红"而放过。
- **现状证据**：`tools/relay/tests/relay-agent-tool.ps1:72-75`。2026-08-16 DHR_04 首跑三方独立复现——施工棒记 `findings.md` F-002；review1 判 P2 并指出影响面比 F-002 自记的更大（R1-05）；review2 在 attempt 进程里直跑全量得到 `SUITE FAIL (1)`、清 env 后 `RELAY ALL PASS (SKIPPED: 1)`。
- **改动点（预估）**：单个用例的 env 清理方式；一行。**不在 DHR_04 内改**——该卡变更范围是 `tools/relay/policy/` 与新套件，改既有套件属越界（两轮复核一致建议立 backlog）。
- **优先级**：中高 · **建议在 relay 自举流水铺开前修掉**（每多一张卡就多踩一次）
- **提出人 / 日期**：DHR_04 施工棒 + 两轮复核，2026-08-16
- **进展**：未立项。当前绕过办法 = 跑全量回归前先清 `RELAY_RECEIPT` / `RELAY_RUN_ROOT` / `RELAY_ATTEMPT_DIR` / `RELAY_TOOL`。

### DHR-BL-3 stage0 自举包装通用化（plan 描述文件 + brief 目录）

- **需求 / 议题**：把"用冻结的 relay 驱动 relay 自身开发"的包装脚本与逐棒 brief 抽成通用输入（一份 plan 描述 + 一个 brief 目录 + 逐节点 profile 映射表），换卡只改数据不改代码。
- **动机**：DHR_04 已把逐节点账号映射抽成 `$profiles` 哈希表，但包装脚本与 3 份 brief 仍是本卡手写，每张卡固定成本不小。与 IHSR_05 `RB-4` 同源。
- **现状证据**：`D:\relay-run-DHR_04\run-card-relay.ps1` + `briefs\{build,review1,review2}.md`；`workspace/DHR_04/controller-notes.md` C-03。
- **与既有计划的关系**：`DHR_10`（标准流水节点与模板）本就要做"接力计划生成 agent 按标准流水模板实例化"，本条大概率被它吸收；排期时先核 DHR_10 覆盖面，不要重复立卡。
- **优先级**：低 · 大概率并入 DHR_10
- **提出人 / 日期**：主控，2026-08-16
- **进展**：未立项。
