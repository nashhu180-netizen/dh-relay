<!-- dh:v1 · task_plan.md — 施工图（实施方案的家）。🔵 开工那一刻才写，一次性消耗品：跑偏了去 progress.md 记实际，不回头改这里。 -->
# task_plan — DHR_49 树外 DSH Client Bundle 与最小 Relay 面板

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：执行者默认「只知道本文件 + `brief.md` + DevPlan 任务卡」，不得靠脑补上下文施工；按步骤照做，偏离路线只记 `progress.md` 不回写本文件；每批先跑本批验证并给阶段汇报，再进下一批。

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `docs/modules/dh-relay/dev_plan/P4-DSH工作台最小Pilot-开发方案.md` §3.2 DHR_49 卡 + §2.3 + §4.2 + §4.4 | 唯一权威验收口径、架构约束、DM 编号、止损条件 |
| C-002 | `docs/modules/dh-relay/workspace/DHR_26/findings.md` §5 §6 §13 §14 +「交给 DHR_49 的硬输入」 | 本卡的**硬依赖输入**：`dsh.client` 声明形态、bundle 产物形态、类型定义位置、官方样板 |
| C-003 | 本工作区 `findings.md`「现场侦察结论」F-A ~ F-G | 本轮只读侦察出的通路（`ctx.slots` / `ctx.remote.$mount` / codec 两侧严格度 / tgz 装法） |
| C-004 | `<pilot>/relay-control-pilot/testdata/fake/runs-active.json`、`run-*.json` | 两屏要重建的**同一组 fixture**；列表 5 条（group ∈ {needs_you×2, blocked, running, done}），detail 5 份 |
| C-005 | `<pilot>/relay-control-pilot/src/dsh-host/index.mjs` | DHR_26 Host 服务面：`fixtureHash()` / `listRuns()` / `getRun(runId)` / `diagnostics()`；本卡网关只读它 |
| C-006 | 官方样板（只读，不拷贝代码）：`…/@deepseek-ai/dsh-client-ui-plan/lib/client.js`（最小 UI 插件）、`…/dsh-client-ui-settings-plugin-inventory/lib/client.js`（列表屏 + `ctx.remote` 取数）、`…/dsh-host-plugin-inventory/lib/typert.host.js`（描述符样板） | 形状对照物 |
| C-007 | `<pilot>/dsh-home/profiles/web/package.json` | 目标 profile 现状：bundles = base + web-app + `@personal/dsh-relay-host`（link 装） |

**约定简写**：`<pilot>` = `D:\MyFiles\ai-workflow\dh-relay-p4-pilot`；`<rcp>` = `<pilot>\relay-control-pilot`；`DSH_HOME` = `<pilot>\dsh-home`。

## 分批与检查点

本卡有多个可独立验证的功能点，且带真未知，**分 4 批**，每批跑完先落证据、再派 fresh 小审只看本批 diff。

**批 1 = 可行性探针**（回答「树外 client 插件到底装不装得上、`ctx.remote.$mount` 到底能不能自挂」）——这批是**判否/继续的分水岭**，做完必须给阶段汇报。
**批 2 = 列表屏**（含 DM6 镜像断言）——做完触发**列表屏中途闸**，停下等用户亲跑表态。
**批 3 = 构建配方定型 + 清净重跑 + 换机重跑**（DM2）。
**批 4 = 详情屏 + 装卸清理**（DM4b/DM5b）——**必须等中途闸放行才能开工编码**。

> ⚠️ 批 3 的顺序是刻意的：配方要在**已有可加载 bundle** 之后才谈得上「清净重跑还能不能产出可加载 bundle」。若批 1 就命中止损，批 2~4 全部不做，直接走 §4.4 诚实收口。

## 施工步骤 (Steps)　★详细级

### 批 1 · 可行性探针（分水岭）

| # | 改动文件（Create/Modify/Test + 路径） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|---|---|---|
| 1.1 | Record · `<rcp>/evidence/dhr49/recon/` | 把 S2 侦察的机器事实落盘：`slot-names.txt`（全树槽位名枚举）、`client-plugin-count.txt`（声明 `dsh.client` 的包数与清单）、`dsh-version.txt`。**只读采集，不改安装树。** | 三个文件非空；`dsh --version` = `0.1.0-rc.7`（与 DHR_26 基线一致，漂了就停下记事实） |
| 1.2 | Create · `<rcp>/src/dsh-client/package.json` | 最小树外包 `@personal/dsh-relay-panel`：`"type":"module"`、`main: lib/index.mjs`、`exports` 四口（`.` / `./client` / `./typert` / `./remote`）、`"dsh":{"client":{"platform":"web","inject":[]}}`、`files` 白名单。**`inject` 先留空**，等 1.5 确认真实依赖再填。 | `node -e "require('<rcp>/src/dsh-client/package.json')"` → 无异常 |
| 1.3 | Create · `<rcp>/src/dsh-client/lib/client.js` | **手写** bundle（F-A）：`window.__ModuleLoader__.load({id:"@personal/dsh-relay-panel", factory:(require)=>{…}})`；本步只做**存在性探针**——`apply(ctx)` 里 `console.log('[relay-panel] client apply', Object.keys(ctx))` 并把结果写进 `window.__RELAY_PANEL_PROBE__`。**不用 JSX、不 require zod**。 | 见 1.6 |
| 1.4 | Create · `<rcp>/src/dsh-client/lib/index.mjs` | 宿主半边：`export const inject = ['relayPilot']`（消费 DHR_26 服务）+ `export function apply(ctx){…}`。本步先只 `ctx.logger?.info` 打一行，**不注册 Typert**。 | 见 1.6 |
| 1.5 | Test · `<rcp>/test/dsh-client-package-contract.test.mjs` | 先写失败测试（TDD 跑红）：①`exports` 四口齐全且指向真实文件；②`lib/client.js` **零 `require("zod")`**；③`dsh.client.platform === 'web'`；④`files` 覆盖包根全部 `.js`/`.mjs`（照抄 DHR_26 §17 的「从 `files` 派生清单」写法，**并跑变异**——DHR_26 教训：断言写完不跑变异等于没断言）。 | `node --test test/dsh-client-package-contract.test.mjs` → 先全红，实现后全绿；4 条变异体逐条见红 |
| 1.6 | Cmd · 装载探针（**tgz 装法**，F-E） | `cd <rcp>/src/dsh-client && npm pack` → `dsh plugin --profile web add <tgz>`；起 web：`$env:DSH_HOME=…; $env:RELAY_PILOT_FIXTURE_ROOT=…; dsh --profile web`（**F-20：fixture root 每次都要带**）；浏览器打开 web app，DevTools 查 `window.__RELAY_PANEL_PROBE__`。 | 期望：插件树加载成功（无 `Cannot find package`）、控制台出现 `[relay-panel] client apply`、`__RELAY_PANEL_PROBE__` 有值。**转录 + 截图入 `evidence/dhr49/batch1/`** |
| 1.7 | Cmd · Typert 自挂探针 | 宿主半边加真 Typert 网关：`class RelayPanelGateway extends TypertRemoteService`（`super(ctx,'relayPanel')`，**避开 DHR_26 已占的 `relayPilot`**，F-G），方法 `list()` / `detail(runId)`（⚠️ 实现为 `get(runId)`） / `hash()` 只转发 `ctx.relayPilot`；手写 `lib/typert.host.js`（真 zod schema，`_zod` 硬查，F-D）与 `lib/typert.remote-client.js`（客户端 schema 用手写 `{parse}`，**不内联 zod**）。client 侧 `apply` 改为 `await ctx.remote.$mount(TYPERT_REMOTE)` 后调 `ctx.remote.relayPanel.hash()`。 | 期望：控制台打出的 `fixture_hash` 与 DHR_26 四轮转录的 `67fb18b3…` **逐字符相同**。这是**通路打通的判据**；不同或报错 → 记事实、评估是否命中止损 |
| **CP1** | 检查点 | 跑批 1 全部测试 + 派 fresh 小审只看本批 diff；`progress.md` 记证据 E-xxx；**给阶段汇报**：通路成立与否、§4.4 逐条命中与否 | 有 open P0/P1 先收敛再进批 2 |

> **批 1 命中止损的处置**：停止扩张，把「配方现状 / 失败点 / 版本基线 / §4.4 逐条」写全（止损 ≠ 无产出），直接进收口，DM2/DM3/DM6/DM4b/DM5b 逐条如实记 fail 或 N/A，**不自裁三态**。

### 批 2 · 列表屏（DM3 列表半 + DM6，本卡最不可替代的产出）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 2.1 | Test · `<rcp>/test/dsh-client-grouping.test.mjs` | **先写失败测试**，把 §2.3 架构约束钉成两条镜像断言（对纯函数 `groupRuns(list)`，从 client bundle 里 export 出来供测试直接 import）：<br>①**改 `group` 必须移动**：把 `fake-run-0001` 的 `group` 由 `running` 改成 `done`，它必须出现在 done 节；<br>②**只改 `run_status` 必须逐字不变**：把 `fake-run-0001` 的 `run_status` 由 `running` 改成 `failed` 而 `group` 不动，渲染模型**逐字节相同**；<br>③**词表外 `group` 自成一节原样打印**：注入 `group:"zz_unknown"`，必须单独成节且节标题原样 `zz_unknown`。 | `node --test test/dsh-client-grouping.test.mjs` → 先红后绿；**加变异**：把实现改成从 `run_status` 推导，②必须见红 |
| 2.2 | Modify · `<rcp>/src/dsh-client/lib/client.js` | 实现 `groupRuns()`：**只读 `group` 字段**分节与排序，**代码里不得出现 `run_status` 参与分组的任何分支**（测试 2.1② + 一条源码级断言双保险）。渲染用 `React.createElement`（`require("react")` / `require("react/jsx-runtime")`，F-A），挂进 1.5 确定的槽位。样式用官方同款 `<style data-plugin-css>` 注入法。 | 见 2.4 |
| 2.3 | Test · 源码级断言 | ⚠️ **偏差登记（2026-08-21，CP2 复核 P3）：实际落在 `test/dsh-client-grouping.test.mjs`，不是 `dsh-client-package-contract.test.mjs`。** 计划里 2.1 + 2.3 的「双保险」原意是两个文件互不牵连；现在两道网在同一文件，整文件被跳过或被 `--test-name-pattern` 过滤时会一起失效。CP2 返工后已加第三道（守恒断言，也在同一文件）——**三道同源仍是同一个单点**，这条偏差留档给收口时判。原文：在 package-contract 测试里加一条：`lib/client.js` 内 `run_status` 只允许出现在**展示**上下文，不得出现在分组/排序函数体内（按函数体切片正则 + 变异验证）。 | 变异（把 group 换成 run_status 推导）→ 见红 |
| 2.4 | Cmd · 真机渲染 | 重 pack 重装 → 起 web → 打开面板，看到 5 条 run 按 `group` 分成 4 节（needs_you 2 条 / blocked / running / done）。**刷新页面**、**重启 DSH** 各一次，页面从同一 fixture 重建相同内容。 | 三次渲染逐项一致；**截图/录屏入 `evidence/dhr49/batch2/`**（附属留痕，供零上下文复核 worker 核 DM3） |
| 2.5 | Cmd · 中途闸材料 | 把**可复跑的操作路径**（起 DSH → 装 Host/Client → 载 fixture → 打开两屏的完整命令序列）写进 `review.md` 需求境证据栏，并在对话里交给用户。 | 用户照着敲能自己跑起来 |
| **CP2 = 列表屏中途闸** | **强制暂停** | 派 fresh 小审本批 diff；**然后停下**，请用户亲跑并表态。用户若判「不如 CLI 好用」，主会话提**候选归属表**（逐条：评价 → 候选桶 (i)/(ii)/(iii) → 理由），**由用户逐条点选**，不整包代裁。分类经确认且命中 §4.4 → 改走止损收口，**不再提供「继续做详情屏」选项**。 | **收到用户明示放行前，不得开工详情屏编码**；不设超时自动放行。等待期间只做不涉详情屏的收尾（整理配方文档、留痕） |

### 批 3 · 构建配方定型与可复现（DM2）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 3.1 | Create · `<rcp>/src/dsh-client/README.md` | **构建配方全文**（任务卡要求「登记配方全文 + 外部前提」）：逐条写命令、以及外部前提三问的答案——①是否依赖本机 dsh 安装目录绝对路径？②是否需要 monorepo checkout？③是否需要打包器？ | 另一个人照着能重跑 |
| 3.2 | Cmd · **清净重跑**（判据①） | 删掉 `*.tgz`、**依赖缓存（pnpm store）**、profile 里本包的依赖与 bundle 条目 → 按 README 重跑 → 产出可再次加载的 bundle。**前后 bundle 逐字节哈希对比**。<br>⚠️ **2026-08-21 更正**：本行原先把卡里的「依赖缓存」写成了「`node_modules`」，而本 Pilot 根本没有 `node_modules`，那一项等于自动满足——施工时据此漏清了 pnpm store（CP3 复核抓出，处置见 F-012 与 `evidence/dhr49/batch3/clean-rerun.txt` §5）。 | `RESULT: RELOADABLE` + 哈希记录入 `evidence/dhr49/batch3/clean-rerun.txt` |
| 3.3 | Cmd · **换机重跑**（判据②） | `ssh thinkpad`：先探可达性与该机 DSH 版本；按同一份 README 重跑，产出可加载 bundle。 | 成立 → 记 pass；**②失败而①成立 → 如实登记「本机可复现、跨机未成立」，DM2 不得记 pass**（任务卡硬要求） |
| **CP3** | 检查点 | fresh 小审 + `progress.md` 记证据 + 阶段汇报 | — |

### 批 4 · 详情屏与装卸清理（DM3 详情半 + DM4b + DM5b）

> **前置**：CP2 中途闸已由用户明示放行。未放行则本批不开工，DM3 详情屏记 `N/A`（分屏登记，**不得因列表屏已绿宣称 DM3 全过**）。

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 4.1 | Test · `<rcp>/test/dsh-client-detail.test.mjs` | 先写失败测试：详情视图模型从 `relay.pilot-read-model/v1` 逐字段重建；**缺 detail 的 run（`fake-run-0006`/`0007`）返回 null 时不得抛、不得灭树**（DHR_26 §10 教训）。 | 先红后绿 |
| 4.2 | Modify · `lib/client.js` | 列表项点击 → 详情屏，取数走 `ctx.remote.relayPanel.detail(runId)`（⚠️ **实现为 `get(runId)`**，名字改了契约没改；偏差登记见 progress 2026-08-21 那行）。 | — |
| 4.3 | Cmd · 真机两屏 + 刷新 + 重启 | 详情屏渲染、刷新、DSH 重启各验一次。 | 截图入 `evidence/dhr49/batch4/` |
| 4.4 | Cmd · DM4b 装卸清理 | `dsh plugin --profile web remove @personal/dsh-relay-panel` → 重启 → 面板与其 UI 注册（槽位条目、`<style data-plugin-css>` 标签）**均消失**；再装回 → 恢复。用 `--dump-config` 前后行数对照（照抄 DHR_26 §11b 手法）。 | 三态转录入 `evidence/dhr49/batch4/lifecycle.txt` |
| 4.5 | Test · DM5b RC 私有类型不入 Read Model | 断言 client 消费路径拿到的对象是纯 JSON：无函数、无 Cordis Context/Fiber、`JSON.parse(JSON.stringify(x))` 深等于自身。 | 绿 |
| **CP4** | 检查点 | fresh 小审 + 阶段汇报 → 进 E 收口 | — |

## 事实登记（贯穿全程，任务卡硬要求）

每批结束在 `findings.md` 追加：**构建配方全文**、**外部前提**（三问答案）、**§4.4 止损条件逐条命中与否**。
**不自行裁定「能用 / 带约束能用」**——三态归属由 DHR_50 人判收敛。

## 关键决策（一句话各一行）

- **Worktree**：否（用户 2026-08-20 点选）。本卡大头代码在仓外 `<pilot>`，worktree 隔离不到；仓内只动 `workspace/DHR_49/` 与 DevPlan 两行，与 DHR_27 会话零重叠。
- **派子 agent**：施工不派（用户点选「全留主会话」）；**两轮换人复核仍派 fresh agent**（硬闸 G6，不可省）。
- **Review**：轮 1 = 各批检查点的 fresh 小审合集；轮 2 = 收口时另派 fresh-context 独立实例做增量复核。**施工者不复核自己的卡。**
- **包名**：`@personal/dsh-relay-panel`（与 DHR_26 的 `@personal/dsh-relay-host`、`@personal/dsh-relay-absence-probe` 同族）。
- **Typert namespace**：`relayPanel`（避开 DHR_26 已占的 `relayPilot`，F-G）。
- **装法**：`npm pack` + tgz 安装（**不用目录 link**，F-E：本卡宿主半边必须 bare import，link 装法解析不到）。
- **不改 `src/dsh-host/`**：本卡宿主半边自带在 `src/dsh-client/` 包内（F-F），DHR_26 产物一行不动，变更范围与任务卡逐字一致。
