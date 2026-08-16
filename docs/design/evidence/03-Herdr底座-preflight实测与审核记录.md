# Herdr 底座 · preflight 实测与审核记录（DHR-A-08）

本文件是过程证据，不是正式设计输入。正式口径以 `design/README.md` 白名单中的输入为准。

> 实测日期：2026-08-16 · 实测机：用户本机（Windows 11 26100）· 执行者：主会话（Claude Opus 5 1M）
> 目的：为 `design/03`（Herdr 底座平行候选 A 方案）取得机器事实，并复验 agent-console 仓 2026-08-14 记下的「Herdr 太卡 no-go」。

<a id="preflight-a8"></a>

## 1. 实测环境与口径

| 项 | 值 |
|---|---|
| herdr | `0.8.0-preview.2026-08-04-d78e3d3b5126`，channel `preview`，protocol 19，schema_version 1 |
| herdr 安装位置 | `C:\Users\nash\scoop\shims\herdr.exe`；配置 `%APPDATA%\herdr\config.toml` |
| orca | `C:\Users\nash\AppData\Local\Programs\Orca\resources\bin\orca.exe`（Electron 应用 + runtime） |
| psmux | 现役 relay 宿主，作对照基线 |
| 实测隔离 | 全部在主会话自建的命名会话 `relay-probe-a` / `relay-probe-b1` / `relay-probe-b2` 内进行；用户原有 `default` / `kpi` 会话**全程未被读写**；实测后三个探针会话已 stop+delete，探针目录 `D:\wt\_herdr_probe_0816` 已删除 |
| 未清理项（诚实登记） | ① 本次为测试而启动的 Orca 应用**实测后仍在运行**（用户可自行关闭；未改其任何配置）；② 探针目录曾被 claude 写入 `~/.claude.json` 的 `projects` 信任条目，目录已删、条目为悬空项，未做清理以免改动用户 CLI 配置 |

**取证方式**：全部为 CLI 直接调用 + 原始 JSON 回读，无中间层。延迟数据为同一 PowerShell 会话内 12～15 次连续调用的排序取值，**空载**（未叠加 relay 真实负载），故只可用于**量级比较**，不可当作负载下的容量结论。

## 2. 逐条实测结果

### E-A8-01 · `herdr --session <name> <subcommand>` 可在 pane 外精确定向

```
herdr --session relay-probe-a pane list
→ {"id":"cli:pane:list","result":{"panes":[{"pane_id":"w1:p1",...,"workspace_id":"w1"}],...}}  exit=0
```

**结论**：宿主进程不必身处任何 pane 内，即可精确指挥指定命名会话；每个命名会话有独立 socket（`%APPDATA%\herdr\sessions\<name>\herdr.sock`）。

**对照 psmux**：DHR_03 findings **F-016** 记录本机 psmux `attach -t <name>` 无视目标、总接到当前会话，正因如此 `psmux-adapter.ps1` 的拉起被迫绕成「可见窗口进程直接 `new-session`（非 `-d`）拥有会话 + 轮询会话出现 + 设标题 + 等 attached + EnumWindows 标题全等」。**herdr 下这整条绕法不再需要**。

### E-A8-02 · agent 状态枚举与状态变更序号是一等公民

`agent get` / `agent list` 返回：

```json
{"agent":"claude","agent_status":"idle","interactive_ready":true,"name":"probea",
 "pane_id":"w1:p2","state_change_seq":1,"cwd":"D:\\wt\\_herdr_probe_0816\\cardA",
 "terminal_title_stripped":"claude","workspace_id":"w1","tab_id":"w1:t1"}
```

状态枚举 `idle | working | blocked | done | unknown`；`state_change_seq` 单调递增，可用于去重与顺序判定。

### E-A8-03 · `blocked` 检出：**部分覆盖，界线已实测清楚**

| 场景 | 屏幕实况 | herdr 报的状态 | 判定 |
|---|---|---|---|
| 启动时「信任此文件夹」弹窗（全新未信任路径 `D:\wt\_herdr_probe_0816\cardA`） | `❯ 1. Yes, I trust this folder / 2. No, exit / Enter to confirm` | `agent_status=idle`，且 `interactive_ready=true` | ❌ **未检出**。`agent start` 反而在 4.4s 内返回 exit=0 报成功 |
| 会话内问答/选择界面（AskUserQuestion 形态，= relay 的 `decision_required` 形态） | `❯ 1. Option A / 2. Option B / 3. Type something / Enter to select` | `working`（8s）→ **`blocked`**（10s 起稳定保持 40s+），`state_change_seq` 6→7 | ✅ **检出**，且状态稳定不抖 |
| 会话内 bash 命令执行（auto mode on，无弹框） | 直接执行完成 | `working` → `done`，`seq` 4→5 | ✅ 语义正确 |
| `esc` 取消问答框后 | 回到输入框 | `blocked` → `done`，`seq` 7→8 | ✅ 状态机双向响应正确 |

**结论**：herdr 的 `blocked` 覆盖 **agent 进程内的问答/审批界面**，不覆盖 **CLI 启动阶段的信任弹窗**（该阶段 herdr 仍把 pane 判为已就绪的 idle）。

**与 backlog 的对应**：
- `DHR-BL-1` 第 1 层「在等人检测」的**主要部分**（会话内确认框）herdr 原生提供，relay 不必自建末屏形态匹配。
- `DHR-BL-2`「工作树信任预置」**仍然必须做**——它正好落在 herdr 的盲区里；且盲区形态更坏：herdr 会报 `interactive_ready=true`，比 psmux 的「屏幕没变=idle」更容易骗过 Runner。

### E-A8-04 · 订阅事件面只有三种，且**没有退出/关闭事件**

`herdr api schema` 的 `subscription_event` 枚举：

```
pane.output_matched · pane.agent_status_changed · pane.scroll_changed
```

`pane.agent_status_changed` 载荷含 `pane_id / workspace_id / agent_status / state_labels / agent / title`。

**结论**：状态变化可推送（relay 的 tick 轮询可改事件驱动），但 **pane/会话退出、进程消亡没有事件**，失联判定仍需轮询或进程探测兜底。

### E-A8-05 · socket API 面 90 个方法（与 relay 相关的）

```
agent.start/prompt/wait/get/list/read/send_keys/explain/focus/rename
pane.split/run(send_input)/read/wait_for_output/report_agent/release_agent/
     clear_agent_authority/process_info/close/list/get
events.subscribe/events.wait · session.snapshot · notification.show
worktree.create/list/open/remove · workspace|tab.create/list/close/rename
server.agent_manifests/reload_agent_manifests/live_handoff/stop
client.window_title.set · plugin.*（插件面板）
```

`pane split --env KEY=VALUE` 实测可用（用于逐 profile 注入 `CLAUDE_CONFIG_DIR` 等）：

```
herdr --session relay-probe-a pane split --pane w1:p1 --direction right --cwd "D:\wt\_herdr_probe_0816\cardA" --no-focus
→ {"pane":{"pane_id":"w1:p2","cwd":"D:\\wt\\_herdr_probe_0816\\cardA\\","focused":false,...}}
```

`--no-focus` 实测被尊重（`focused:false`），不抢用户焦点。

### E-A8-06 · 支持的 agent kind 覆盖 relay 现役四条 CLI

`agent start --kind` 可选值含 `claude / codex / grok / kimi`（另有 pi、gemini、cursor、devin、agy、cline、omp、mastracode、opencode、copilot、kiro、droid、amp、hermes、kilo、qodercli、maki）。

**集成当前全部未安装**（`herdr integration status`）：`claude → ~/.claude/hooks/herdr-agent-state.ps1`、`codex → ~/.codex/herdr-agent-state.ps1`、`kimi → ~/.kimi-code/hooks/herdr-agent-state.ps1` 均为 `not installed`。**上述 E-A8-03 的 blocked 检出是在零集成的纯屏幕检测下取得的**——装集成后是否覆盖信任弹窗，本轮未测（信任弹窗发生在 CLI 会话建立之前，hook 大概率也来不及触发，但属未验证）。

### E-A8-07 · ⚠️ 检测清单联网自动更新（新增的不确定源）

`%APPDATA%\herdr\herdr-server.log` 显示每 30 分钟一次：

```
INFO herdr::logging: checking for updates event="update.check.start" subsystem="update"
WARN herdr::detect::manifest_update: skipping unknown remote manifest agent agent="qwen"
```

**结论**：herdr 的 agent 检测清单（决定 `blocked`/`working` 判定）**从网络拉取、自动更新，且 relay 无从感知**。这与 relay「机器事实靠冻结哈希」的地基直接冲突，必须在设计里单独处置（见 design/03 决策 H6）。同时 herdr 自身也在 preview 通道自动检查更新，版本会漂。

### E-A8-08 · 延迟对照（空载）

单位 ms，同会话连续调用排序取值：

| 调用 | p50 | p95 |
|---|---|---|
| `psmux list-sessions` | 138 | 977 |
| herdr 拓扑A `pane list`（4 panes） | 210 | 1495 |
| herdr `pane read --source detection` | 223 | 314 |
| herdr 拓扑A `api snapshot` | 318 | 1827 |
| herdr 拓扑B `pane list`（1 pane） | 343 | 549 |
| herdr 拓扑B `api snapshot` | 664 | 2438 |
| **`orca terminal list`（8 terminals）** | **3889** | **9724** |

**结论**：
- 空载下 psmux 单次最快，herdr 约为其 1.5～2.5 倍；两者同量级。design/02 记录的 psmux「88% 负载下单次 0.5～3.7s」未在本轮复现（本轮未造负载），故**负载下的对比仍未验证**。
- **orca 慢一个数量级**（p50 近 4s、p95 近 10s）。relay 的 Runner 每 tick 要对每个在册会话 probe，这个量级不可用于轮询宿主。

### E-A8-09 · 拓扑成本对照（用户 2026-08-16 提出的两种拓扑）

| 拓扑 | 每加一棒的成本 | 3 会话时总量 |
|---|---|---|
| **A：一个 run 一个 herdr 命名会话，每棒一个 pane** | +0 进程 · +~1.5 MB | 5 进程 / 84 MB（含用户原有 2 会话） |
| **B：每棒一个独立 herdr 命名会话** | +3 进程 · +~50 MB | 11 进程 / 183 MB |

叠加 E-A8-08 的延迟数据（拓扑 B 的 `api snapshot` p50 是拓扑 A 的 2.1 倍），**拓扑 A 在资源与延迟两个维度同时占优**，无需权衡。

### E-A8-10 · orca 的终端状态传导面（用户点名要对比的项）

`orca terminal list --json` 每个终端的完整字段：

```
handle · ptyId · incarnationId · orphaned · worktreeId · worktreePath · branch
tabId · leafId · title · connected · writable · lastOutputAt · preview
```

`orca terminal wait --for` 的可选条件只有 **`exit` 与 `tui-idle`** 两档（取自 `orca agent-context --json` 命令 schema，非人读 help 推断）。

**结论**：orca 的终端层**没有任何 agent 状态字段**，没有「在等人」这一维；活性信号只有 `connected` / `orphaned` / `lastOutputAt` / 文本 `preview`，与 psmux 的 `capture-pane` + 时间戳同层次，relay 仍须自算指纹。

orca 确有状态传导，但在它自己的编排层（`orchestration worker-start/show/read/stop/abandon/release`、`gate-create/gate-resolve`、`dispatch`）。采用该层等于让 orca 的 coordinator 与 relay Runner 争夺「运行状态唯一写者」，与 design/02 决策 3 及用户 2026-07-13「后面不用 orca」的定论冲突。

**优点登记（不掩盖）**：orca 有 psmux 与 herdr 都缺的两项——`terminal wait --for exit`（退出等待，补 E-A8-04 的缺口）与 `terminal read --cursor`（游标增量读，避免全屏重复取）。

## 3. 「Herdr 太卡 no-go」的复验状态

agent-console 仓 `AGENTS.md` 硬规则 9 与 `design/01` 记：**2026-08-14 用户在本机实测后因交互体验「实在太卡」放弃 Herdr 路线**，并把 A16/A18/H12/H13 四条 Herdr 专属验收项 retired。

**本轮复验结论**：
- **宿主侧（程序调用）不卡**：CLI 往返与 psmux 同量级（E-A8-08），远好于 orca。
- **用户侧（TUI 打字/渲染流畅度）本轮未复验**——它是主观体验，只能由用户判断，AI 不得代判。
- 用户 2026-08-16 对话中给出的新论据：**relay 底座下人机交互频率本就很低**（每卡必答 2 次 = 落户确认 + 收口确认，加偶发决策与协作），故 TUI 流畅度在本场景的权重低于「状态可机读」；且 psmux 现状也不流畅。
- 用户已在 `%APPDATA%\herdr\config.toml` 做过针对性调优（`default_shell` 指向 pwsh 7 以规避 Windows PowerShell 5.1 profile 启动卡顿），说明 08-14 的 no-go 是在调优之后仍成立还是之前得出，本轮未能区分。

**因此**：design/03 把「Herdr 交互体验由用户复验通过」登记为 **P0 前置闸 H-A8-1**，未通过则整份方案不生效。AI 不改写 agent-console 仓的 no-go 结论（跨仓、且属该仓已确认设计）。

## 4. 本轮未验证项（诚实清单）

| 编号 | 未验证的事 | 为什么重要 |
|---|---|---|
| U-A8-1 | 负载下（多 agent 同时施工、CPU 高位）的 herdr CLI 延迟与稳定性 | design/02 的 psmux 超时阈值 90/30s 正是被负载逼出来的 |
| U-A8-2 | 装上 `integration install claude/codex` 后，检出面是否扩大（尤其信任弹窗） | 决定 DHR-BL-2 是否仍是硬需求 |
| U-A8-3 | `CLAUDE_CONFIG_DIR` 指向非默认目录（.claude-grok / .claude-account9）时，herdr 能否正常识别与报状态 | relay 的多账号 profile 全靠这个机制 |
| U-A8-4 | `events.subscribe` 的实际断线行为、丢事件与重连对账 | 决定能否从轮询改事件驱动 |
| U-A8-5 | herdr server 崩溃/升级后，pane 与其中 agent 的存活与恢复语义 | 对应 design/02 的 D18 宿主存活与接续 |
| U-A8-6 | 中文路径下的 pane cwd、标题与输入 | 本仓已有中文路径踩坑先例 |
| U-A8-7 | herdr `--remote`、live handoff 在 Windows 上的可用性 | 官方文档标 Windows 为 experimental beta、这些明确 unsupported（2026-08-13 资料核对，本轮未复核时效） |

## 4b. `E-A8-11` · `U-A8-9` 熔断点定向实测（2026-08-17）

**为什么单独跑这一条**：`design/03` 的 `H5`（确认闸护栏由位图截图改为宿主直读 pane 文本快照）全部押在「宿主能否稳定读到该 pane 当前展示的确认问题正文」上。首轮实测中曾出现 claude 进入 TUI 后 `detection` 只剩提示符行的现象，`U-A8-9` 因此被登记为本方案最大技术不确定点，并被排为验证卡的**第一批、熔断点**——不利即整条路径停。

**方法**：独立命名会话 `relay-u9`，`pane split --cwd <全新未信任目录>` → `agent start --kind claude` → 走过四个状态，每态把 `pane read` 的四种 source（`visible` / `recent` / `recent-unwrapped` / `detection`）各读一遍，记字符数与关键子串命中。测毕会话 stop+delete、目录已删。

| 状态 | `visible` | `detection` | 关键子串 | 判定 |
|---|---|---|---|---|
| S0 shell 提示符 | 19 字符 | 19 字符 | — | 正常 |
| S_trust 信任弹窗 | 523 | 523 | ✅ `I trust this folder` | **四 source 全可读** |
| S1 TUI 刚起（送出 Enter 后 ~6s） | **28** | **28** | ❌ 只剩 `PS D:\...> & claude` | **瞬态残缺** |
| S1 TUI 稳定（~10s 后） | 991 | 991 | ✅ TUI 内容 | 恢复，此后 32s 内稳定不变 |
| S2 working | 1181→1196 | 1176→961 | ✅ | 可读 |
| **S3 blocked（确认框展示中）** | **961** | **961** | ✅ 问题正文 + 选项 + 页脚 | **可读，45s+ 持续稳定** |

`S3` 态 `detection` 快照实际内容（节选，中文原样渲染）：

```
 ☐ 收口方式

请选择本次接力的收口方式：甲还是乙？

❯ 1. 甲
     选择方案甲
  2. 乙
     选择方案乙
  3. Type something.
─────────────────────────────────────────
  4. Chat about this

Enter to select · ↑/↓ to navigate · Esc to cancel
```

### 结论：`U-A8-9` **通过**，但带两条必须写进契约的附加条件

1. **`H5` 成立**——确认框展示期间，`visible` 与 `detection` 均能完整读到问题正文、选项列表与操作页脚，且中文正常渲染（顺带部分结清 `U-A8-6` 的中文渲染顾虑；中文**路径**仍未单独验）。首轮观察到的"只剩提示符行"是 **TUI 重绘瞬态**，不是永久限制。

2. **附加条件甲 · 读取必须带稳定性检查**：TUI 启动/重绘期间存在约 10 秒的残缺窗口，此时取到的快照是退化内容。宿主**不得在任意时刻取一次就落证**，须满足「连续两次读取内容一致 ∧ 非退化（长度与结构过阈）∧ 命中期望子串」才写入事件账；超时未满足 → **fail-closed 不签发 ACK**，而不是落一份残缺证据。

3. **附加条件乙 · 子串断言不得被"输入回显"满足**：本轮实测暴露一个混淆——主控发给 agent 的 prompt 正文**也会回显在同一块屏幕上**，因此"问题正文出现在快照里"这个断言，**可以被 agent 仅仅把问题打进自己输入框而满足**，并未证明它真的向用户展示了选择界面。故 `B20` 的谓词必须收紧为**联合匹配**：问题正文 **∧** 该 CLI 的选择界面标记（如 `❯ 1.` 选项行与 `Enter to select` 页脚）**∧** 二者出现在屏幕底部的有界窗口内。逐 CLI 的标记清单须冻结进契约，并各配一条"只有回显、没有真界面"的反例。

> **附加条件乙是本轮最有价值的发现**：它堵的是一个真实的伪造路径——agent 声称"我问了用户"，却只是把问题打印出来。若按 `design/03` 首版那条朴素的子串断言实现，这条路径是通的。

<a id="understanding-b03"></a>

## 4c. `DHR-B-03` 讲解与理解确认（验证卡 `DHR_22` 插队）

- **事件**：`DHR-B-03`，`stage=B-adjust`，改 `dev_plan/P2-完整流水-开发方案.md`——插入验证卡 `DHR_22`。
- **为什么要插队而不是等 `design/03` 确认**：`design/03` 的 P0 前置闸 `H-A8-1`（用户亲判 Herdr 交互体验）**只能靠真跑来判**，真跑需要 relay 有 herdr 适配器，而 relay 今天只有 psmux 适配器 → 不插这张卡就形成死锁（不做适配器 ⇒ 判不了闸 ⇒ 方案永远确认不了 ⇒ 永远不排适配器）。
- **卡的性质**：**spike / 验证卡**，交付物是**证据与结论**（J1～J5 对照表 + 用户判定），不是 P2 能力承诺；**不占** `design/02` 的 B1～B18 / H3～H5 二十一项验收，故不在 P2 §3.3 覆盖对照表内，须显式标注以免被读成夹缝。
- **用户拍板（2026-08-16 对话点选）**：落地路径选**乙（spike 插队 P2）**（备选甲=先走完 `design/03` 确认再拆 B、丙=不入 DevPlan 当 A 阶段 preflight）；实战载体选 **① 接着跑 `DHR_04` 剩下的棒**（它正是撞出「瞎眼」问题的那一趟，前后对照最直接）。
- **理解问题**：`DHR_22` 产出的适配器代码，在 `design/03` 若最终被判否时怎么处置？
- **待用户回答**：（未答。候选=保留为 `backend` 可选项但默认永不启用 / 整体 revert / 降级为测试夹具。）

<a id="review-b03"></a>

## 4d. `DHR-B-03` 交叉审核记录

（**尚未交叉审核**。`DHR_22` 的卡定义由主会话起草，按本仓惯例须经 fresh 换人审核后方可施工；本轮只完成熔断点定向实测 `E-A8-11`，属 preflight，不含生产代码。）

<a id="understanding-a8"></a>

## 5. 讲解与理解确认

（待用户确认后回填。）

<a id="review-a8"></a>

## 6. 交叉审核记录

（待 fresh 换人审核后回填。本轮为主会话独立实测，尚未经交叉审核。）

## 文档更新日志

| 日期 | 编辑模型 | 更新内容 |
|---|---|---|
| 2026-08-16 | Claude（Opus 5 1M） | 首版：Herdr / orca / psmux 三方 preflight 实测（E-A8-01～10）、no-go 复验状态、7 条未验证项。 |
