# DH Relay P2 · 完整流水 —— Herdr 底座（平行候选 A 方案）

<!-- dh:topic tier=标准 review=完整流水-Herdr底座 -->
<!-- dh:planning-event:v1 id=DHR-A-08 stage=A-full artifact=design/03-完整流水-Herdr底座-产品设计与验收.md review=evidence/03-Herdr底座-preflight实测与审核记录.md#review-a8 understanding=evidence/03-Herdr底座-preflight实测与审核记录.md#understanding-a8 -->

## 文档信息

| 项目 | 内容 |
|---|---|
| 所属模块 | `dh-relay` |
| 文档类型 | **平行候选** A 方案（差异式）。与 [`design/02`](./02-完整流水-产品设计与验收.md) 同为 P2 完整流水的设计输入候选，**二选一**；本文只写「因终端底座由 psmux 换成 Herdr 而改变的面」，02 的业务决策未在本文点名的一律**原样继承**、不重述、不隐式修改 |
| 当前状态 | **草案，未确认，未进白名单，不授权任何卡开工**；`design/README.md` 的 `designInputs[]` 在用户拍板前不改 |
| 前置闸 | **`H-A8-1` 未通过则本文整份不生效**（见 §8） |
| 编辑模型 | Claude（Opus 5 · 1M context） |
| 最后更新 | 2026-08-16 |

> 承接：[design/02](./02-完整流水-产品设计与验收.md)（业务本体，本文的基线）、[evidence/03 preflight 实测](./evidence/03-Herdr底座-preflight实测与审核记录.md)（本文全部机器事实的来源）、[backlog DHR-BL-1 / DHR-BL-2](../backlog.md)、DHR_03 findings F-009 / F-016 / F-022 / F-024、agent-console 仓 `design/evidence/04`（2026-08-13 Herdr 官方资料核对，其「Herdr 够当运行时总线与交互通道、不能单独当工作流真相源」的结论本文直接沿用）。

---

## 1. 人话版目标

### 1.1 这份方案在解决什么

design/02 已经把「一批已授权任务卡从落户到销户的无常驻 AI 主控接力」设计完了，那套业务本体是**底座无关**的：授权工件、三路复核、机器闸、finalizer 一次快进、落点纪律——换终端宿主，这些一个字都不用改。

但 02 有一处**结构性欠账**，是 DHR_04 stage0 自举首跑当场撞出来的：

> **relay 今天对 CLI 自己弹的框是瞎的。** worker 按 brief 主动写的 `decision_required` checkpoint 宿主看得见；但 CLI 层的信任弹窗、权限确认框，relay 只看到「屏幕指纹没变 = idle」，与「正在思考」完全同形。要么靠人肉 `capture-pane`，要么白等 30 分钟 stall 阈值才暴露。

02 对此的处置是把它整条推给 `DHR-BL-1`（未立项，18 张卡无人覆盖），因为 **psmux 根本给不出这个信号**——psmux 的活性判据只有屏幕文本指纹（DHR_03 F-009 实测它自带的 `#{window_activity}` 只在建会话时写一次、不随输出更新），而「在思考」和「在等人」的屏幕都不动。

**Herdr 直接给这个信号**：它把 pane 里的 coding agent 识别为一等公民，报 `idle / working / blocked / done / unknown`，其中 **`blocked` 就是"识别到审批或问答界面"**。实测（`E-A8-03`）：relay 真正在意的那种确认框（落户确认、收口确认的形态）在 10 秒内被判为 `blocked` 并稳定保持。

一句话：**本方案不改 relay 做什么，只改 relay 用什么眼睛看终端**——把「猜屏幕指纹」换成「读宿主给的状态枚举」，并把这双眼睛带来的新能力（在等人检测、事件推送、精确 pane 句柄）与新风险（检测规则联网自动更新、无退出事件）一并设计到位。

### 1.2 三个候选底座的实测对照

全部数据来自 [evidence/03](./evidence/03-Herdr底座-preflight实测与审核记录.md)，2026-08-16 本机实测：

| 维度 | psmux（02 现役） | orca | **Herdr（本方案）** |
|---|---|---|---|
| agent 状态枚举 | ❌ 无 | ❌ 无（终端层零状态字段） | ✅ `idle/working/blocked/done/unknown` + 单调 `state_change_seq` |
| 「在等人」检测 | ❌ 无 | ❌ 无（`wait --for` 只有 `exit`/`tui-idle`） | ⚠️ **部分**：会话内确认框 ✅ / 启动信任弹窗 ❌ |
| 活性信号 | `capture-pane` 文本 + 光标 + history_size 自算 SHA-256 | `lastOutputAt` + 文本 `preview`，仍须自算 | 状态变更序号，宿主已算好 |
| 状态推送 | ❌ 只能轮询 | ❌ 只能轮询 | ✅ `events.subscribe`（`pane.agent_status_changed`） |
| 退出事件 | ❌（靠进程探测） | ✅ `terminal wait --for exit` | ❌ **无**（须轮询兜底） |
| 增量读屏 | ❌ 全屏重取 | ✅ `terminal read --cursor` | ⚠️ 有 4 种 source，无游标 |
| 精确定向 | ❌ **F-016**：`attach -t <name>` 无视目标，被迫整套绕法 | ✅ runtime handle | ✅ `--session <name> <subcmd>` + opaque `w1:p2` |
| CLI 往返 p50 / p95（空载） | 138 / 977 ms | **3889 / 9724 ms** | 210 / 1495 ms |
| 每加一棒的资源成本 | 一个可见窗口进程 | 一个 Electron 终端 | **+0 进程 / +1.5 MB**（拓扑 A） |
| 逐棒环境注入 | 靠 worker-entry 包装 | 有 | ✅ `pane split --env KEY=VALUE` 原生 |
| 覆盖 relay 四条 CLI | n/a | claude/codex | ✅ `claude/codex/grok/kimi` 都在 kind 列表 |

**orca 被本方案排除的硬理由**（不是偏好，是数据）：终端层 p50 近 4 秒、p95 近 10 秒，而 relay 的 Runner 每 tick 要对每个在册会话 probe 一次——这个量级不能做轮询宿主。orca 确有状态传导，但在它自己的 `orchestration worker-*` / `gate-*` 编排层里，采用它等于让 orca 的 coordinator 与 relay Runner 争夺「运行状态唯一写者」，同时撞 02 决策 3 与用户 2026-07-13「后面不用 orca」的定论。

（**公道话**：orca 有两项 psmux 与 herdr 都没有的东西——`terminal wait --for exit` 与 `terminal read --cursor`。它们分别对应本方案的 `H8` 与 `H4` 两处妥协；若将来 orca 的 CLI 延迟改善一个数量级，值得重新评估。）

### 1.3 换底座能拿到什么、拿不到什么

**拿到（新增能力）**
1. **「在等人」检测**——`DHR-BL-1` 第 1 层的主体部分变成宿主免费提供，relay 不必自建「末屏形态匹配」这种脆弱的启发式（那份提示形态清单要随每个 CLI 版本追着改）。
2. **事件推送**——Runner 从纯轮询变成「推送 + 低频对账」，状态延迟从一个 tick 降到亚秒级。
3. **精确句柄**——`F-016` 逼出来的整套绕法（可见窗口进程 `new-session` 非 `-d` 拥有会话、轮询会话出现、设标题、等 attached、EnumWindows 标题全等）**整体删除**，`psmux-adapter.ps1` 中约一半的复杂度随之消失。
4. **内容级确认护栏**——宿主可经 socket 直读该 pane 的文本快照，从而**断言"确认问题的正文确实出现在了屏幕上"**。psmux 的位图截图做不到这一点（见 §4.3）。
5. **逐棒环境注入原生化**——`--env` 直接注入 `CLAUDE_CONFIG_DIR`，多账号 profile 的落地路径更短。

**拿不到（诚实清单）**
1. **启动信任弹窗仍是盲区**，而且盲区形态更坏：herdr 在信任弹窗挡着的时候报 `agent_status=idle` 且 `interactive_ready=true`，比 psmux 的「屏幕没变」更容易骗过 Runner。→ `DHR-BL-2`（工作树信任预置）由 backlog **升为本方案的前置卡**，不是可选项。
2. **没有退出事件**，失联判定仍须轮询 + 进程探测兜底。
3. **检测规则会自己变**——herdr 每 30 分钟联网拉一次 agent 检测清单，且自身在 preview 通道自动检查更新。这对 relay「机器事实靠冻结哈希」的地基是新增的不确定源（见 `H6`）。
4. **不解决任何业务问题**：授权、复核、收口、落点纪律全部照 02 执行。

---

## 2. 与 design/02 的关系（继承与差异的边界）

**继承（本文不重述、不修改）**：02 的决策 1～5、7～14 全部原样有效——relay 边界=已授权任务卡、流水即 dev-harness 节点表的接力版、Runner 不判质量、脚本节点是机器事实唯一来源、返工默认 fresh fix worker、收口 agent 前台 + finalizer 后台、计划只引用注册表条目、落点纪律 D21、一 run 一批卡、诊断 agent 自动拉起、test 受控 push、不改 dh-crew。§2 全局地图、§4 固定流转、§5 操作剧本、§6 的 B1～B18 / H3～H5 除本文 §6 点名的以外均不变。

**差异（本文的全部内容）**：只有 02 决策 6 的护栏③（截图）与 §7 的「不做：非 psmux 后端」两条是**被推翻**的；其余差异都是**新增或细化**，不推翻 02 的既有条款。

**ID 纪律**：本文新增的验收 ID 从 `B19` / `H6` 起续号，与 02 的 `B1～B18` / `H3～H5` 同一命名空间、**永不重号**。若本方案最终不被采纳，`B19～B26` 与 `H6～H8` 一并作废且**永不复用**（沿用 agent-console 仓 A16/A18/H12/H13 的 retired 处置先例）。

---

## 3. 关键决策（动这些要重新讨论）

编号 `H1～H12`，`H` = Herdr 底座专属决策，与 02 的 `D1～D24` 不同命名空间。

### H1 · 拓扑 = 一个 run 一个 herdr 命名会话，一卡一 tab，一棒一 pane

`herdr --session relay-<run_id>`；卡 → tab（tab 名 = `card_id`）；棒 → pane。

**为什么不是"每棒一个独立 herdr 会话"**（用户 2026-08-16 提的另一选项）：实测（`E-A8-09`）每个独立会话 **+3 进程 / +50 MB**，而同会话每加一个 pane **+0 进程 / +1.5 MB**；且拓扑 B 的 `api snapshot` p50 是拓扑 A 的 2.1 倍。资源与延迟**两个维度同时更差**，没有权衡余地。

**代价与处置**：一个 run 的所有棒共用一个 herdr server 进程，server 崩溃即整 run 的终端全失。处置 = 该场景等同 02 §2.4 的「续跑判定」：宿主启动/tick 时发现 session 不可达 → 全部在跑 attempt 走 `interrupted_unknown` → 诊断 agent。**不新增业务出口**（沿用 02 决策 4 与 §3 转换矩阵不变的承诺）。

**不采用 herdr 的 workspace 与 worktree 原语**：relay 的任务树由 dev-harness `dh wt new` 建、由 finalizer 删，多一套树管理必然漂移。herdr 侧只用 `pane split --cwd <树路径>`。`herdr worktree *` 一律不调用。

### H2 · 句柄 = 「agent 名」为主键、`pane_id` 为回读校验，不用窗口标题

- **agent 名** = `<run_id>-<node_id>-<attempt>`（herdr 要求 `[a-z][a-z0-9_-]{0,31}`，故 `node_id` 需规范化并入 receipt 冻结；超长时用稳定截断 + 序号，规则写死在契约里、不得静默截断）。
- 每次 launch 后回读 `agent get`，把 `pane_id / tab_id / workspace_id / terminal_id / state_change_seq` 一并写进 launch receipt。
- **此后每次操作都用 agent 名定向，并核对回读的 `pane_id` 与 receipt 一致**；不一致即 `probe_error`，绝不"就近取焦点 pane"。
- **禁用**：以窗口标题、pane 序号、UI 焦点、sidebar 顺序推导目标（herdr 官方 skill 的安全约束；也是 02 里 psmux「不能用前缀、猜 PID 或标题代替句柄」同一条纪律）。
- `pane move` 会换 `pane_id`——relay **不移动 pane**，且回读校验会把外部移动暴露成失配。

**这条替代掉 psmux 适配器的整块存在性判定**（`list-sessions` 输出中 `session_name` 大小写全等 + 同名多行 fail closed + EnumWindows 标题全等 + attached 计数 ≥1）。

### H3 · probe 语义重定义：读状态，不猜指纹

适配器六动词外形不变（`launch / probe / suspend / resume / stop / emit_observation`，九键回参不变），`probe` 的**实现**改为直读 `agent get`，映射：

| herdr `agent_status` | relay `terminal_state` | 说明 |
|---|---|---|
| `working` | `running` | |
| `idle` / `done` | `idle` | `done` = 未被人看过的 idle，对 Runner 无差别；「是否被看过」不是 relay 的业务真相 |
| `blocked` | `idle` **+ 旁路 `awaiting_input` 提示事件** | **不新增业务状态、不改 P1 合法转换边**，见 `H7` |
| `unknown` | `probe_error`（有界） | herdr 官方语义：「有 agent 但无法自信分类，不证明已完成」 |

**弃用屏幕指纹**：`capture-pane` SHA-256 与 `IdleAfterSeconds` 判据不再作为主判据。**保留一条低频兜底**：`pane.process_info` 进程存活探测（因为 `H8`）。

**`state_change_seq` 用于去重与顺序**：同一 seq 的重复观测不产生新事件；seq 倒退即判失配。

### H4 · 事件推送只做加速，权威仍是文件事件账

`emit_observation` 由 `events.subscribe`（`pane.agent_status_changed`）实现。

**硬约束（不可让步）**：
- herdr 的订阅是**实时事件流，不是持久事件账**（agent-console `evidence/04` 2026-08-13 官方资料核对结论，与 `E-A8-04` 实测一致）。断线期间的事件**不补发**。
- 因此 **Runner 的真相仍然只有 `<run>/events.jsonl` 与 worker 落盘的 result/checkpoint 文件**；订阅事件只用来**提前触发一次 tick**，它自己**不直接改任何 active state**。
- 每个 tick 仍执行一次全量对账 probe（可降频，但不可取消）。订阅断线 → 记事件 → 自动重订阅 → 对账频率临时提高，**不报错、不阻断**。

这条是把 evidence/04 的既有结论（「所有 Herdr metadata 都不能作为流程真相」）落成机器约束，不是新发明。

### H5 · 确认闸护栏③：位图截图 → **宿主直读的 pane 文本快照**（推翻 02 决策 6 护栏③）

**02 原方案为什么在 herdr 下必然破**：02 要求「宿主对该 launch 绑定的**唯一 RELAY 窗口**精确截图（按 handle/window_title 单窗口，零窗口或占位图=失败）」。herdr 的多个 pane **共享同一个操作系统窗口**，「该 launch 绑定的唯一窗口」这个概念在 herdr 下不存在。

**替代方案**：`decision_ack` 与 result 摄入两个时刻，宿主各经 socket API 取一次 **`pane.read`**（`source=detection` 与 `source=visible` 各一份），原文与哈希由**宿主**写进事件账，`evidence_refs` 指向它；**agent 自填一律忽略**（这条与 02 完全一致，不变）。

**为什么这不是弱化，而是加强**：

| 对比项 | 02 的位图截图（psmux） | 本方案的 pane 文本快照（herdr） |
|---|---|---|
| 绑定精度 | 绑到**窗口**；02 自己就承认"多窗口时截错 handle"是必须防的反例 | 绑到 **`pane_id`**，多棒并行天然不会串 |
| 能否机器断言内容 | ❌ 只能证明"拍到了一张非占位图" | ✅ **可断言确认问题正文出现在快照里**、可断言用户回答原文与快照一致 |
| 能否被 agent 伪造 | 否（宿主拍） | 否（宿主经 socket 直取） |
| 隐私面 | 整窗截图（DHR_04 **F-024** 已踩过整屏截图隐私坑，靠 `PrintWindow` 只拍单窗口才修好） | 只有该 pane 的文本，无关内容天然不进证据 |
| 体积与可 diff | 位图，大、不可 diff | 文本，小、可 diff、可进 git 留档 |
| 弱点 | — | ❌ 不是位图，不能证明"人眼看到的渲染结果" |

**因此新增一条 02 没有的内容级护栏（`B20`）**：`decision_ack` 时刻的 detection 快照里**必须包含该 checkpoint 声明的确认问题正文的规范化子串**；不包含 → 不签发 ACK。这是 psmux 底座上做不到的护栏。

**补充证据（可选、失败不阻断）**：宿主可在 ACK 时刻额外拍一张窗口位图作旁证；因窗口共享，它**不作为**「精确绑定」证据，只作为人看的旁证。缺失不影响放行——**它是补充，不是护栏**，这一点必须在契约里写死，避免日后被误当强证据。

### H6 · 宿主自身的漂移面必须冻结与登记（本方案新增的风险）

实测（`E-A8-07`）：herdr **每 30 分钟联网拉一次 agent 检测清单**（`herdr::detect::manifest_update`），且在 preview 通道自动检查自身更新。也就是说**决定 `blocked`/`working` 判定的规则会在 relay 不知情的情况下变化**。

处置四条：
1. **注册表冻结** `herdr_version + protocol + schema_version + agent_manifest_fingerprint`（后者取 `server.agent_manifests` 的规范化哈希）；宿主 preflight 比对。
2. **不符时的分级**：`protocol` 或 `schema_version` 变 → `start_rejected`（硬拒，因为 API 形状可能变）；仅 `agent_manifest_fingerprint` 变 → **记事件 + 降级为"观测置信度下降"**，不阻断（因为清单变通常是识别变好），但该 run 内 `awaiting_input` 提示降级为"仅提示、不进对照表"。
3. **每张 launch receipt 记 herdr 版本/protocol/manifest 指纹**，使任何一次观测都可回溯到当时的判定规则。
4. **`agent_status` 永不作为业务状态真相**——业务终态只由 worker 落盘的 result/checkpoint 决定（`H4` 的必然推论）。因此就算清单变坏，**最坏后果是 relay 变回 psmux 时代的"瞎"，不会误判业务**。

（如果 herdr 提供关闭自动更新与清单拉取的配置，优先关掉并在注册表登记；本轮未验证是否可配，列入 `U-A8-8`。）

### H7 · `blocked` 只做提示与提醒，**永不参与判定、永不代答**

- **不新增业务状态、不改 P1 合法转换边**：`blocked` 映射为 `idle` + 一条旁路 `awaiting_input` 提示事件（沿用 `DHR-BL-1` 里已经定好的口径：「不改 `running/idle` 既有转换边，只额外产出提示事件」）。
- **禁止 relay 据此自动作答**——IHSR_05 **RB-3** 有代答落错选项的先例；本方案沿用并把它升为契约级禁令：任何代码路径不得因 `awaiting_input` 而向 pane 发送按键或文本。
- **允许的三个用途**：① 写进事件账供事后对账；② 供 agent-console 看板与提醒消费（`H11`）；③ **把 stall 阈值一分为二**——「在等人」用短提醒阈值（默认 3 分钟提醒一次，不升级），「无信号」仍用 02 的长 stall 阈值升级为异常。这一条直接消灭 DHR_04「白等 30 分钟」的现场。

### H8 · 失联判定：无退出事件，保留轮询 + 进程探测兜底

herdr 订阅面无 pane/会话退出事件（`E-A8-04`）。故：
- 每 tick 对在册 pane 调 `pane.get` / `pane.process_info`；pane 不存在 或 前台进程消失 → 走 02 §2.4 既有的「二次 claim/双空扫描」流程，**不新增判定分支**。
- `stop` 动词 = `pane.close` + 轮询确认不存在；沿用 psmux 适配器的「列表缺席 ≠ 退出，须列表消失 ∧ 进程消失才算 `exited`」（DHR_03 **F-022** 的教训，与底座无关）。

### H9 · 启动信任弹窗盲区：`DHR-BL-2` 由 backlog 升为本方案前置卡

实测（`E-A8-03`）herdr 在信任弹窗挡着时报 `idle` + `interactive_ready=true`，且 `agent start` 会**返回 exit=0 报成功**。这比 psmux 更危险——Runner 会拿到一个"启动成功且就绪"的假信号。

处置：launch 前由宿主对该 profile 的 config_dir 做**幂等信任预置或 preflight 硬检**；不满足 → `launch_failed`（而不是启动后干等）。注意并发写（CLI 退出时会回写同一份 `.claude.json`，预置必须可重入并容忍被覆盖）。验收挂 `B22`。

### H10 · 双后端并存，不做一次性替换

注册表新增 `backend ∈ {psmux, herdr, fake}`（run 级选择，默认由注册表定）。`psmux-adapter.ps1` **保留**，新增 `herdr-adapter.ps1` 实现同一组六动词、同样的九键外形。

**为什么并存而不是替换**：
- 适配器抽象本就是为此存在的（`tools/relay/adapters/README.md` 的六动词契约），不新增架构负担。
- **同一批卡可以在两个后端各跑一遍**，"psmux vs herdr" 的对比决策才有真实数据，而不是靠本文的空载实测拍板。
- Herdr 是 preview 版、且检测清单会漂（`H6`）；留 psmux 作退路，任一时刻可 `-Backend psmux` 回退，不需要返工。
- 代价 = 多一份适配器要维护、`B19` 要证两个后端在同一回放下行为等价。这个代价可接受。

### H11 · Runner 常驻：agent-console 只托管进程与只读看板，写权不出 relay（用户 2026-08-16 拍板）

用户提出「Runner 可以集成在 agent-console 中进行常驻」。**采纳为「托管 + 守护 + 只读看板」，不采纳"代码搬家"**：

| 归谁 | 内容 |
|---|---|
| **relay** | Runner 代码、状态机、**全部写权**。「Runner 是运行状态唯一写者」是 relay 地基（02 决策 3），不搬走 |
| **agent-console** | ① 开机/登录时拉起 relay 宿主进程；② 守护（宿主死亡或 lease 过期 → 按策略重拉或报警）；③ **只读**看板与提醒 |

**接口面冻结为三条只读契约 + 三条命令**（这是本方案对 agent-console 的**全部**要求，多一条都不给）：

- 只读消费：`~/.dh-relay/runs.json`（跨仓索引）、`<repo>/.dh-relay/<run_id>/events.jsonl`（事件账）、`relay status --json`（三态：宿主活着 / 已死 / lease 过期）。
- 允许调用：`relay start` / `relay resume` / `relay stop`——**只有这三个**。agent-console **不得直接写** `.dh-relay/` 下任何文件、不得发控制事件、不得改 DevPlan、不得补写 DONE/checkpoint/verify。

**为什么这样切**：既满足 agent-console 硬规则 6（「控制台只做发现、配置、启动、结果接收和调度，不复制业务逻辑」），也不碰 relay 的唯一写者地基；且与 `DHR-BL-1` 里已经定过的分工（「Runner/宿主留在 relay，agent-console 只做只读看板 + 提醒」）一致——本决策只是**多给了一条"托管进程生命周期"**的职责。

**跨仓边界（重要，防误解）**：
- agent-console `AGENTS.md` 硬规则 9 说的是**它自己的交互运行宿主**未选定、Herdr 已 no-go。本方案里 agent-console 托管的是 **relay 宿主进程**（一个 PowerShell 进程），**不是终端宿主**。**relay 选 herdr 与 agent-console 自己选别的终端宿主，二者互不冲突、可以不同。**
- agent-console 现阶段只允许设计、不允许实现（其硬规则 3），且 dh-crew 不得改邻仓（其硬规则 8）。**本方案只在 dh-crew 侧冻结上述接口契约**；agent-console 侧的看板与守护须**在该仓另走 A 立项**，本文不代它做设计、不修改它任何文件。
- `~/.dh-relay/runs.json` 与 `<repo>/.dh-relay/<run_id>/` 由 `DHR_09` 产出，故 agent-console 侧立项**排在 DHR_09 之后**（与 backlog `DHR-BL-1` 的依赖记载一致）。

### H12 · 契约版本不因换底座变动

`relay/v2` 的 schema、角色、状态机、转换矩阵**全部不变**——终端底座属实现层，不进契约。新增的只有：注册表的 `backend` / `herdr_*` 冻结字段，launch receipt 的宿主指纹字段，以及事件账里的 `awaiting_input` **提示类**事件（不进业务转换矩阵）。**不新增业务出口**，沿用 02 §3 的承诺。

---

## 4. 差异面逐条修改单（对 design/02 的精确 diff）

实现者按此表读 02，不必比对全文。

| 02 的位置 | 原文 | 本方案改成 | 依据 |
|---|---|---|---|
| §1.5 决策表「返工会话」 | 「psmux 无可靠 suspend/resume」 | 「herdr 亦无 suspend/resume 语义，结论不变：fresh fix worker」 | 结论未变，只更正理由 |
| §2.1 棒表「全程」行 | `psmux-handles/` | `terminal-handles/`（内容为 herdr session 名 + workspace/tab/pane opaque id + agent 名 + 宿主指纹） | H2 |
| §3 契约增量 · 确认记录 | 「宿主立即对该 launch 绑定的唯一 RELAY 窗口精确截图（按 handle/window_title 单窗口，零窗口或占位图=失败）」 | 「宿主经 socket 直读该 `pane_id` 的 `detection` + `visible` 文本快照并哈希；**并断言确认问题正文在快照内**。位图截图降为可选旁证、缺失不阻断」 | **H5（推翻）** |
| §3 副作用面表「宿主外副作用」 | 「psmux 进程与窗口」 | 「herdr server/client 进程、命名会话目录 `%APPDATA%\herdr\sessions\<name>\`、pane 进程」 | 事实更正 |
| §3 profile 引用 | `cli/config_dir/work_dir_root/model/fallback/account_alias/expected_identity/capabilities` | 增 `herdr_kind`（映射到 `agent start --kind`）；`capabilities.readonly` 语义不变 | H2 |
| §1.3 决策 10 / D23 run_id | 「slug 进 psmux 窗口标题」 | 「slug 进 herdr **session 名与 tab 名**」；ASCII 小写字母数字短横线的字符集冻结**理由更强**——herdr agent 名硬性要求 `[a-z][a-z0-9_-]{0,31}` | 事实更正 |
| §7 边界「不做」 | 「非 psmux 后端」 | **删除该项**，改为「后端限 `psmux / herdr / fake` 三者，注册表 `backend` 选择；不做其它后端、不做跨机器」 | **H10（推翻）** |
| §6.1 **B8** | 「fake 回放 + 真实 psmux 临时仓」 | 「fake 回放 + **真实 herdr 临时仓**」；护栏③的反例集按 H5 改写：由"多窗口时截错 handle"改为"**pane_id 失配**"与"**快照不含确认问题正文**"两条 | H5 |
| §6.1 **B7** 宿主存活语义 | psmux 前提 | 语义不变；新增「herdr server 崩溃 → 该 run 全部在跑 attempt `interrupted_unknown` → 诊断」一条反例 | H1 |
| §6.1 **B1** | — | **不变**（契约不因底座改动） | H12 |
| `IdleAfterSeconds` / `activity_fingerprint` / `AttachDeadlineSeconds 90` / `StopDeadlineSeconds 30` | psmux 实测定值 | herdr 侧另定：`agent start` 用其原生 `--timeout`（默认 30s，实测 4.4s 完成）；stop 轮询阈值另测。**这些值必须在 herdr 上重测，不得沿用 psmux 的值** | E-A8-08 只测了空载 |

**02 中**不需要任何改动**的部分**（明确列出，防实现者过度改）：§1.1～1.4（除上表点名处）、§2.2、§2.3、§2.4 的续跑判定与恢复锁流程、§3 的授权两件套/verdict/返工回路/复核工件/release manifest/quota/控制事件子类型/run 生命周期/tracked 写入与所有权/版本与兼容、§4 全部、§5 全部、§6 的 B2～B6、B9～B18、H3～H5。

---

## 5. 新增能力对应的新流转

### 5.1 「在等人」提示回路（`H7` 的落地）

```
herdr pane.agent_status_changed(blocked)
  → 宿主写事件 awaiting_input{ run_id, card_id, node_id, attempt, launch_id,
                               pane_id, agent_name, state_change_seq,
                               herdr_version, manifest_fingerprint, first_seen_at }
  → 该 attempt 的 stall 计时切到「等人分支」：短提醒阈值（默认 180s）周期性刷新提示，
    不升级为异常、不触发诊断 agent
  → 状态离开 blocked → 写 awaiting_input_cleared 事件，计时切回常规分支
  → agent-console 看板订阅事件账，把这些 attempt 排到「该你出手」区
```

**三条禁令**（进契约、各有反例）：不得据此发送任何按键或文本；不得据此改任何业务状态；不得据此判定 verdict 或放行。

### 5.2 确认闸时序（`H5` 的落地，替换 02 §3「确认记录」段）

```
agent 写 decision_required checkpoint（含确认问题正文的规范化形式与其哈希）
  → Runner 接受 → 宿主 pane.read(detection) + pane.read(visible)
  → 断言：① pane_id 与 launch receipt 一致
          ② detection 快照包含 checkpoint 声明的问题正文规范化子串
          ③ 两份快照与哈希由宿主写入事件账（agent 自填忽略）
  → 全部通过 → 写 decision_ack（含 event_id、两份快照哈希、herdr 宿主指纹）
  → agent 读到 ACK 后才可向用户展示确认问题
  → 用户作答 → agent 提交 result（user_reply_verbatim + decision_checkpoint_event_id）
  → Runner 摄入时再取一次同 pane 快照并核对：ACK 存在、事件顺序、
     launch/session/attempt/pane_id 一致、收口时回答原文 ==「认可执行本地收口」
  → 缺任一项 → 不签发 finalizer receipt
```

02 的三护栏结构（先挂起且事件可核 / 固定短语 / 宿主持有的证据）**完全保留**，只把第三条的证据介质换掉并加严。

---

## 6. 验收清单增量

### 6.1 AI 自动验收栏（新增 `B19～B26`）

| ID | 验收项 | 怎么证明 |
|---|---|---|
| **B19** | **herdr 适配器与 psmux 适配器在同一回放下行为等价**（`H10`） | 同一份 fake 回放剧本分别跑 `-Backend psmux` 与 `-Backend herdr`：六动词的九键回参外形全等、事件账的业务事件序列全等（允许差异的字段只有宿主指纹与句柄，须列白名单并逐字段断言）；`backend` 取非枚举值被 schema 拒；三后端各一条正向路径 |
| **B20** | **确认闸护栏③新形态**（`H5`，替换 02 B8 中的截图子项；谓词按 `E-A8-11` 收紧） | 真实 herdr 临时仓：① `pane_id` 与 receipt 失配 → 不签发 ACK；② 快照**不含**确认问题正文 → 不签发 ACK；③ **`E-A8-11` 条件乙的关键反例**——agent 只把问题正文**回显进自己的输入框**、并未展示选择界面 → 联合谓词（正文 ∧ 选择界面标记 ∧ 落在屏幕底部有界窗口内）**必须判否**（朴素子串断言在此会误放行，故本反例是本项的核心）；④ **`E-A8-11` 条件甲**：TUI 重绘瞬态期读到退化快照 → 稳定性检查（连续两次一致 ∧ 非退化）未满足即 **fail-closed**，不得落残缺证据（注入"首读退化、次读完整"与"持续退化至超时"两条反例）；⑤ 快照与哈希由 agent 自填 → 被忽略且留事件；⑥ 用户在 ACK 前抢答 → 不接受；⑦ 位图旁证缺失 → **不阻断**（正向用例，防它被误当护栏）；⑧ 有效确认 → 签发 finalizer receipt。逐 CLI 的选择界面标记清单须冻结进契约 |
| **B21** | **「在等人」检测与三条禁令**（`H7`） | 真实 herdr：真起一个 agent 并使其进入问答界面 → 事件账出现 `awaiting_input` 且带完整身份链与宿主指纹；离开后出现 `awaiting_input_cleared`；**反例**：注入 `blocked` 观测后断言 relay 未向该 pane 发送任何输入（send-keys/send-text 调用计数 == 0）、未改任何业务状态、未影响 verdict；stall 分支切换正确（等人走短提醒不升级、无信号走长阈值升级） |
| **B22** | **启动信任弹窗盲区的 fail-closed**（`H9`） | 真实 herdr + 全新未信任路径：未做信任预置时 launch **必须** `launch_failed`，**不得**因 herdr 报 `interactive_ready=true` 而记为启动成功（这是本项的核心反例）；预置后正常启动；预置可重入、被 CLI 回写覆盖后再次预置仍成功；预置动作零凭据 |
| **B23** | **宿主指纹冻结与漂移分级**（`H6`） | `protocol` / `schema_version` 与注册表冻结值不符 → `start_rejected`（各一反例）；仅 `agent_manifest_fingerprint` 变 → 记事件 + 观测降级，**不阻断**（正向用例）；每张 launch receipt 含 `herdr_version/protocol/schema_version/manifest_fingerprint`；**关键反例**：伪造 `agent_status` 不能改变任何业务终态（证明 `H4`/`H6` 第 4 条） |
| **B24** | **事件推送只加速、不担真相**（`H4`） | 订阅断线期间发生的状态变化，在重连后**由对账 tick 补齐**且业务结论不变（回放证明"全程不订阅"与"订阅+中途断线"两条路径的事件账业务序列全等）；订阅事件本身不直接写 active state（代码路径断言 + 注入反例）；订阅崩溃不致宿主崩、有重订阅与事件留痕 |
| **B25** | **句柄纪律**（`H2`） | agent 名规范化规则冻结（超长/非法字符各一反例，**不得静默截断**）；每次操作回读 `pane_id` 与 receipt 比对，外部移动/替换 pane → `probe_error` 而非误操作（反例：手工 `pane move` 后 relay 拒绝继续）；**禁止路径反例**：以窗口标题/焦点/序号定向的代码路径不存在（静态检查器） |
| **B26** | **拓扑与失联**（`H1`/`H8`） | 一 run 一 session、一卡一 tab、一棒一 pane 的实际拓扑可从 `session.snapshot` 独立重算并与计划比对；herdr server 被杀 → 全部在跑 attempt 转 `interrupted_unknown` → 诊断被拉起（不新增业务出口）；pane 被外部关闭 → 须「pane 不在 ∧ 进程不在」才判 `exited`，只缺其一报 `probe_error`（F-022 同款反例，在 herdr 上重证） |

### 6.2 人类验收栏（新增 `H6～H8`）

| ID | AI/你做什么验证动作 | 对话里展示什么证据 | 你判断什么 |
|---|---|---|---|
| **H6** | **（前置闸，见 §8）** 在一个真实接力 run 的拓扑下（一 session / 多 tab / 多 pane，含至少一次落户确认与一次收口确认），由你亲自使用一段时间 | 你自己的使用体感 + 宿主侧延迟采样对照表（herdr / psmux 同负载）+ 本次 run 的窗口作答次数 | **Herdr 的交互体验在 relay 这种"低频作答"场景下是否可接受**——这是对 agent-console 仓 2026-08-14「太卡 no-go」的定向复验。你判否则本方案整份不生效 |
| **H7** | 同一批 2～3 张真实卡分别在 `-Backend psmux` 与 `-Backend herdr` 各跑一遍完整流水 | 双后端对照表：总耗时、你被打断的次数与时机、`awaiting_input` 提示的**真阳/假阳/漏报**逐条清单、异常与恢复次数、每卡人工动作数 | **换底座是否真的减少了你的等待与巡检**，以及 `blocked` 提示是否够准到值得依赖（假阳会训练你忽略提醒，比漏报更坏） |
| **H8** | 展示 herdr 检测清单与版本的漂移记录（跑 run 期间 `manifest_fingerprint` 是否变过、变了以后 `blocked` 判定是否退化） | 漂移事件时间线 + 漂移前后的 `awaiting_input` 准确率对照 | **把"在等人检测"建立在一个会自动联网更新的第三方规则上，这个依赖你是否接受**；不接受则 `H7` 的能力降级为"仅参考"，或要求关闭自动更新后重测 |

---

## 7. 怎么在 02 与 03 之间做决定（判据）

沿用 DHR_03 对 psmux/orca 做过的 A7 判据打法：**先跑、后判、逐条记分**，不靠本文说服。

| 判据 | 通过线 | 数据来源 |
|---|---|---|
| J1 交互体验 | 用户判"可接受" | `H6`（**否决性**，不通过则直接选 02） |
| J2 在等人检测真有用 | 真阳率高到用户愿意依赖，且假阳不至于让人忽略提醒 | `H7` |
| J3 宿主侧延迟在**真实负载**下不劣于 psmux 一个量级以上 | herdr p95 ≤ psmux p95 × 3 | `H7` 采样（本文的空载数据**不算数**，见 `U-A8-1`） |
| J4 适配器复杂度真的降了 | `herdr-adapter.ps1` 行数与分支数显著低于 `psmux-adapter.ps1`，且 F-016/F-022 类绕法消失 | `B19` 实现后静态比对 |
| J5 漂移风险可接受 | `B23` 全绿 且 用户在 `H8` 判"接受" | `B23` + `H8` |

**判定**：J1 否 → 选 02。J1 通过且 J2、J3 都通过 → 建议选 03。J1 通过但 J2 或 J3 未过 → **并存但默认 psmux**（`H10` 的双后端设计正是为这个中间结果准备的，届时不需要返工）。

**成本诚实登记**：本方案若被采纳，B 拆的卡数会**增加 3～5 张**（herdr 适配器、宿主指纹与漂移、信任预置、在等人回路、双后端等价性），并会改写 02 已定稿的 B8。02 刚经七轮审核定稿、B 已拆成 18 张卡，重开的代价是真实的——这是选择时必须一并看的成本，不能只看能力差。

---

## 8. 前置闸、风险与未验证项

### 8.1 P0 前置闸

**`H-A8-1`（= 验收项 `H6`）**：agent-console 仓 `AGENTS.md` 硬规则 9 与 `design/01` 明确记载「**2026-08-14 用户在本机实测后因交互体验『实在太卡』放弃 Herdr 路线**」，并把 A16/A18/H12/H13 四条 Herdr 专属验收项 retired。

本轮 preflight 只复验了**宿主侧程序调用不卡**（与 psmux 同量级，远好于 orca），**用户侧 TUI 体验属主观判断，AI 不得代判、不得替用户翻案**。

用户 2026-08-16 给出的新论据已登记：relay 底座下人机交互频率本就极低（每卡必答 2 次），TUI 流畅度权重应下调；且 psmux 现状也不流畅。但这只是**重新评估的理由**，不是结论。

**`H6` 判否 → 本文整份不生效，`B19～B26` 与 `H6～H8` 一并 retired 且永不复用。** 本文不修改 agent-console 仓的任何文件与结论（跨仓，且属该仓已确认设计）。

### 8.2 风险登记

| 风险 | 影响 | 处置 |
|---|---|---|
| Herdr 是 **preview** 版、自动检查更新 | API 形状可能变，适配器随时失效 | `H6`：注册表冻结 protocol/schema_version，不符硬拒；建议把 channel 固定并在注册表登记 |
| 检测清单联网自动更新 | `blocked` 判定会无声变化 | `H6` 分级 + `agent_status` 永不作为业务真相；最坏退化为"变回 psmux 时代的瞎" |
| 一 run 一 server = 单点 | server 崩溃即整 run 终端全失 | `H1`：等同续跑判定，不新增业务出口；`B26` 反例 |
| 无退出事件 | 失联判定不能纯事件驱动 | `H8`：轮询 + 进程探测兜底 |
| 启动信任弹窗报 `interactive_ready=true` | **比 psmux 更容易骗过 Runner** | `H9`：升为前置卡，`B22` fail-closed |
| 位图证据弱化 | 无法证明"人眼看到的渲染" | `H5`：换成更强的内容级断言 + 位图降为可选旁证；此弱化点**显式登记**，不掩盖 |
| Windows 平台能力 | 官方文档标 Windows 为 experimental beta，`--remote`/live handoff 明确 unsupported（2026-08-13 资料核对） | 本方案不使用 `--remote`、不使用 live handoff；跨机器仍在"不做"列 |

### 8.3 未验证项

`U-A8-1`～`U-A8-7` 见 [evidence/03 §4](./evidence/03-Herdr底座-preflight实测与审核记录.md)；本文另增：

- **`U-A8-8`**：herdr 是否可配置关闭自动更新与检测清单联网拉取（决定 `H6` 能否收紧到硬冻结）。
- **`U-A8-9`**：~~`pane.read` 的 `detection` source 在 agent 使用替代屏时的可得性~~ → **已于 2026-08-17 由 `E-A8-11` 定向实测结清：通过，但带两条附加条件**（见下）。

> **`U-A8-9` 结清（`E-A8-11`）**：确认框展示期间 `visible` 与 `detection` **均能完整读到问题正文 + 选项列表 + 操作页脚**，中文正常渲染，45 秒以上稳定不变；首轮观察到的"只剩提示符行"是 **TUI 重绘瞬态**（约 10 秒），非永久限制。`H5` 因此**成立**，但必须带上两条附加条件，已并入 `B20`：
> - **甲 · 读取带稳定性检查**：不得任意时刻取一次就落证；须「连续两次读取一致 ∧ 非退化 ∧ 命中期望子串」才写入事件账，超时未满足 → **fail-closed 不签发 ACK**。
> - **乙 · 子串断言不得被"输入回显"满足**：实测暴露的伪造路径——发给 agent 的 prompt 正文也回显在同一块屏幕上，所以"问题正文出现在快照里"**可以被 agent 仅仅把问题打进自己输入框而满足**，并不证明它真向用户展示了选择界面。故谓词收紧为**联合匹配**：问题正文 ∧ 该 CLI 的选择界面标记（如 `❯ 1.` 选项行 + `Enter to select` 页脚）∧ 二者落在屏幕底部的有界窗口内；逐 CLI 标记清单冻结进契约，各配一条「只有回显、没有真界面」的反例。

- **`U-A8-10`**：中文**路径**下的 pane cwd 与句柄（`E-A8-11` 只证了中文**内容**渲染正常，路径未单独验；本仓有中文路径踩坑先例）。

---

## 9. 边界

- **不做**：herdr 的 workspace/worktree 树管理（`H1`）、`--remote` 与 live handoff、跨机器、herdr 插件面板、orca 任何形态的承载（`§1.2`）、以及 02 §7 已列的全部"不做"项（除"非 psmux 后端"一条被本文推翻）。
- **不改**：dh-crew 的 controller/loop/dispatch/notify 与 active state；`relay/v2` 契约本体（`H12`）；02 未被 §4 修改单点名的任何条款；**agent-console 仓的任何文件**（跨仓；其看板与守护须在该仓另走 A 立项，`H11`）。
- **凭据**：注册表只存路径/别名与冻结指纹；herdr 句柄、pane 快照、事件、receipt 零凭据；pane 文本快照入证据前须过现有脱敏管道（`relay-redaction.ps1`）——**这是新增的脱敏面**，因为快照可能含屏幕上的任何内容，验收挂 `B20`。
- **表述**：本方案通过只能称「Herdr 底座在本机、本批卡上跑通并优于 psmux」，不得宣称 Herdr 通用可靠；Windows 平台能力属官方 beta。

---

## 10. 待决策（B 阶段或用户拍板）

1. **`H6` 前置闸怎么跑**：是先做一张最小验证卡（只做 herdr 适配器 + 一个真实 run），还是直接在 P2 首批卡里带 `-Backend herdr` 跑对照？——建议前者，代价小、可随时止损。
2. **若 `H6` 通过，02 与 03 何时合并**：是把 03 的差异面回灌进 02 形成单一输入（白名单只留一份），还是长期两份并列？——建议回灌成一份，避免两份输入漂移（本仓已有"两份入口逐渐漂移"的明确教训）。
3. **`U-A8-9`（pane 快照 source）的专项验证由谁做**：主会话亲跑还是派 headless？
4. 是否安装 herdr 的 `claude`/`codex`/`kimi` 集成（`U-A8-2`）——它会写入用户 CLI 配置目录，属需要授权的动作。

---

## 11. A 方案审核与理解确认

- **事件类型**：A-完整（`DHR-A-08`），**草案，未确认**。`design/README.md` 白名单在用户拍板前不改。
- **本事件的性质**：新增一份**平行候选**设计输入，起因 = 用户 2026-08-16 提出「以 Herdr 为底座试一份」+「Runner 可以集成在 agent-console 中常驻」。**不修改 02**，02 仍是当前唯一正式 P2 输入。
- **机器事实来源**：全部取自 [evidence/03](./evidence/03-Herdr底座-preflight实测与审核记录.md) 的 `E-A8-01～10`（2026-08-16 本机实测，可复算）。
- **用户已拍板项**（2026-08-16 对话）：① 本文定位 = 平行候选 A 方案，B 开工前做底座对比决策；② Runner 归属 = agent-console 只托管守护 relay 宿主进程 + 只读看板（`H11`）；③ no-go 处置 = 先做拓扑对比实测（已完成，见 evidence/03）。
- **审核记录**：**尚未交叉审核**。本文为主会话独立起草，按本仓惯例须经 fresh 换人审核后方可提确认。
- **讲解记录**：待补。
- **理解问题**：见 §10 的 4 条待决策。

## 文档更新日志

| 日期 | 编辑模型 | 更新内容 |
|---|---|---|
| 2026-08-16 | Claude（Opus 5 · 1M） | 首版草案：Herdr 底座平行候选 A 方案。含三方底座实测对照、决策 `H1～H12`、对 02 的精确差异修改单、新增验收 `B19～B26` / `H6～H8`、二选一判据 `J1～J5`、P0 前置闸 `H-A8-1`（Herdr 交互体验 no-go 复验）与风险/未验证登记。**推翻 02 两条**：决策 6 护栏③（位图截图 → 宿主直读 pane 文本快照 + 内容级断言）、§7「不做非 psmux 后端」（改为三后端并存、注册表选择）。 |
