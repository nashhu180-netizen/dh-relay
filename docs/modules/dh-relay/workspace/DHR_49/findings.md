<!-- dh:v1 · findings.md — 施工发现。🟢 事实与推断分开。 -->
# findings — DHR_49

## 现场侦察结论（S2，2026-08-20，主会话 Opus，只读）

> 研究对象 = 本机 rc.7 安装树 `C:\Users\nash\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\`（`dsh --version` = `0.1.0-rc.7`，与 DHR_26 版本基线一致）。**全部为只读阅读所得，尚未上机验证**——凡未标「实测」的条目一律属推断，须在批 1 探针里坐实后才能写进结论。

### F-A：Client bundle 的产物形态 = 一个自注册 JS 文件，**不强制过打包器**

官方 client bundle（如 `dsh-client-ui-plan/lib/client.js`，5.8 KB）整体就是：

```js
window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-client-ui-plan",
  factory: (require) => {
    var module = { exports: {} };
    let react = require("react");
    // …
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
```

**推断（待批 1 坐实）**：这意味着树外 Client Bundle **可以手写**，不需要 tsdown / rolldown / monorepo 构建链。官方包用 `tsdown` 只是因为它们写 TSX + CSS Modules；改用 `React.createElement` 手写就没有编译步骤。若成立，则 §4.4 的头号止损条件「Client Bundle 只能在 DSH monorepo checkout 内构建（变相 fork）」**不命中**，且「清净重跑」判据变得平凡（源文件即产物）。

### F-B：UI 注册面 = `ctx.slots`，槽位名是**闭集**

`apply(ctx)` 里用 `ctx.slots.inject("<槽位名>", () => ctx.slots.register({ name, locale, inject }, Component))` 挂组件。全树扫出的槽位名（`sidebar.*` / `settings.*` / `conversation.*` 三族）见 `evidence/recon/slot-names.txt`（批 1 落盘）。候选：

| 候选槽位 | 适配度 |
|---|---|
| `settings.plugins.tab` / `settings.section` | 官方 `dsh-client-ui-settings-plugin-inventory` 就是「设置页里的一张列表」，与列表屏形态最近，样板可逐行对照 |
| `sidebar.footer.action` + `conversation.input.overlay` | 侧栏按钮开浮层，更像「面板」，但要多接一个 overlay 生命周期 |

**待定**：批 1 探针先确认哪个槽位在本机 `web` profile 下真的渲染得出来，再定；**不预先在文档里写死**。

### F-C：Client → Host 的数据通路 = Typert Remote，且**树外可自挂**

- 官方 client 取宿主数据走 `ctx.remote.<namespace>.<method>()`（实例：`ctx.remote.pluginInventory.list()`）。
- 该 namespace 由 **Host 侧**继承 `TypertRemoteService`（来自 `@deepseek-ai/dsh-typert-protocol`）、方法打 `@Remote("list")` 装饰器、`super(ctx, "pluginInventory")` 注册。
- 描述符是两份**生成的纯数据文件**：`exports["./typert"]`（宿主面 `TYPERT`）与 `exports["./remote"]`（客户端面 `TYPERT_REMOTE`）。内容是普通对象字面量 + zod schema，**可手写**（生成器 `@deepseek-ai/dsh-typert-generator` 未发布到本机树）。
- 宿主侧发现机制：`dsh-typert-loader` 在插件挂载时读 package.json 的 `exports["./typert"]`，动态 import 后校验并注册进 `ctx.typert`；文件头注释明说 `ctx.typert.register()` 手动路径也保留（"hand-written wire schemas, tests, non-loader compositions"）。
- 客户端侧：`@deepseek-ai/dsh-api-remotes` 把五个一方包的 `TYPERT_REMOTE` **静态内联**进自己的 bundle，逐个 `await ctx.remote.$mount(contribution)`。

  🔑 **`ctx.remote.$mount(contribution)` 是公开客户端 API**（`dsh-api-gateway/lib/client.js` 的 `ClientRemoteService.$mount`）。**推断（待坐实）**：树外 client 插件可以自带一份手写 `TYPERT_REMOTE` 字面量、自己 `$mount`，不必挤进 `dsh-api-remotes` 的一方闭集。**这条是本卡可行性的关键支点。**

### F-D：两侧对 codec schema 的严格度**不一样**——客户端不需要 zod

| 侧 | 校验点 | 要求 |
|---|---|---|
| 宿主 | `dsh-typert-loader` 的 `requireStrictCodec` | 硬查 `'_zod' in codec.schema && typeof codec.schema.parse === 'function'`——**必须是真 zod v4 实例** |
| 客户端 | `dsh-api-gateway/lib/client.js` 只调 `codec.schema.parse(value)` | 结构化接口 `TypertSchema { parse(value) }`，**无 `_zod` 检查** |

- `TypertCodec` 只有两种 mode：`'strict'`（带 `typeSymbol` + `schema`）与 `'src-json'`（无 schema）。
- **推断**：客户端描述符里的 schema 可以是手写的 `{ parse(v) { … } }`，于是 client bundle **不必内联 zod**（官方 `dsh-api-remotes` 有 201 KB，正是因为把 zod 整个打进去了）。宿主侧则用真 zod——`zod@4.4.3` 就在 `…/dsh/node_modules/zod`，安装树里现成。

### F-E：装法必须是 **tgz，不能是目录 link**（承接 DHR_26 §12d）

- 当前 `web` profile 的 `package.json` 里 `@personal/dsh-relay-host` 是 `link:D:/…/src/dsh-host`（目录安装）。DHR_26 §12d 已证：目录安装下 Node 按软链真实路径向上找 `node_modules`，**任何 bare import 都解析不到 profile 的 fallback 农场**。
- DHR_26 的 Host 靠「零 bare import」绕开了这个坑。**但本卡的宿主半边绕不开**：`TypertRemoteService` 与 zod 都必须 bare import。
- **推断**：本卡的包只能走 **`npm pack` → `dsh plugin add <tgz>`**（真拷贝进 profile 树）。这同时把「构建配方」定型为 `npm pack` 一步，清净重跑 = 删 tgz 与 profile 依赖后重 pack 重装。
- ⚠️ 这也意味着**改一行代码就要重 pack 重装**，开发回路比 link 装法慢，批 1 要先把这条回路的耗时量出来。

### F-F：包的形状 = 一个包同时带宿主半边和客户端半边

官方 `dsh-api-gateway` / `dsh-client-ui-*` 的形状是同一个 package.json 里：

```json
"main": "lib/index.js",
"exports": {
  ".":        { "default": "./lib/index.js" },
  "./client": { "default": "./lib/client.js" },
  "./typert": { "default": "./lib/typert.host.js" },
  "./remote": { "default": "./lib/typert.remote-client.js" }
},
"dsh": { "client": { "inject": [...], "platform": "web" } }
```

**这对本卡的范围很重要**：新包 `src/dsh-client/` 可以**自己**带宿主半边（一个只读 Typert Remote 网关，`inject: ['relayPilot']` 消费 DHR_26 的 Host 服务），于是 **`src/dsh-host/` 一行都不用改**——正好落在任务卡写死的变更范围 `src/dsh-client/` + `dsh-home/` 之内，不需要走 B-调整扩范围。

### F-G：命名避让

DHR_26 的 Host 已占用 `ctx.relayPilot`。`TypertRemoteService` 的 `super(ctx, ns)` 也会 provide `ctx.<ns>`，故本卡网关**必须换个 namespace**（暂定 `relayPanel`），否则与 DHR_26 撞名。批 1 探针须显式验证两个服务共存。

## 批 1 实测：侦察推断逐条坐实 / 修正（2026-08-20）

> 以下为**上机实测**，优先级高于上面的源码阅读推断。证据 = `<pilot>/evidence/dhr49/batch1/probe-transcript.md`。

1. **F-A 成立，且比预期更强**：client bundle 完全手写、零打包器。安装进 profile 的 `lib/client.js` 与源文件 **SHA256 逐字节相同**（`67B8510F…62BC`）——不存在"构建产物"这个东西，`npm pack` 只是搬运。
2. **F-B 修正为定论**：面板落点 = **`settings.section`**。官方 slots 契约原文写明它是「One settings page per list entry」，注册选项 `id` / `order` / `label`（`SlotLabel = string | (() => string)`，**纯字符串可用，不必接 locale 服务**），owner 只递一个 `close`。实测：设置对话框导航栏多出「Relay」项，点开即整页内容区。
3. **F-C 成立——这是本卡的支点**：`ctx.remote.$mount(TYPERT_REMOTE)` 对**树外包手写的**描述符照常生效，不必挤进 `dsh-api-remotes` 的一方闭集。probe 阶段 `remote-mounted` 通过。
4. **F-D 成立**：客户端描述符的 codec schema 用手写 `{ parse }` 即可，bundle 里零 zod（5.4 kB tarball vs 官方 `dsh-api-remotes` 的 201 kB）。宿主侧 `./typert` 用真 zod（`zod@4.4.3`，装树现成），过 `requireStrictCodec` 的 `_zod` 硬查。
5. **F-E 部分修正**：tgz 装法确实必需（宿主半边 bare import `@deepseek-ai/dsh-typert-protocol` + `zod`），但**"开发回路慢"的担心不成立**——`npm pack` + `plugin remove/add` 实测 **694ms / 560ms**，profile 软链农场早已建好，不重建。整轮改-装-重启回路约几十秒。
6. **F-F 成立**：新包自带宿主半边（`RelayPanelGateway`）消费 DHR_26 的 `ctx.relayPilot`，**`src/dsh-host/` 一行未改**，变更范围与任务卡逐字一致。
7. **F-G 成立**：namespace 用 `relayPanel`，与 DHR_26 的 `ctx.relayPilot` 共存无冲突，两个插件条目同时活在组合树里（`--dump-config` 495 行）。

### 新事实（侦察阶段没预见到的）

8. 🔴 **自己 `$mount` 出来的 namespace 不能在顶层 `inject` 里声明——会死锁**。Cordis 守着服务属性访问（报 `cannot get property "remote.relayPanel" without inject`），但这个 namespace 正是本插件 `apply` 里挂出来的，声明它等于要求它在自己被创建之前就存在。正解是挂完之后开自己的作用域：`ctx.inject(["slots", "remote.relayPanel"], (scope) => {…})`，与官方 client bundle 同一写法。
9. 🔴 **Remote 调用返回信封 `{ ok, value }`，Host 侧失败不 reject**（`dsh-api-gateway/lib/client.js:256-264`）。直接读 `result.<field>` 会**静默拿到 `undefined`**：面板显示占位符、控制台零报错、probe 也记成"成功"——第一次实测就栽在这，排查全靠回头读官方 `dsh-client-ui-plan` 的写法。**教训候选**：一个"成功但值是空的"故障，比抛异常难查得多；边界返回值是信封时，拆信封必须显式，不能靠字段名对不上自己冒出来。
10. **`settings.section` 的组件在面板被打开时才 mount**，所以取数发生在用户点开「Relay」那一刻，不在插件 apply 时。这对批 2 的列表屏是好事（不打开就不取数），但意味着**任何"装上就该看到数据"的断言都是错的**，复跑者必须点进去才算数。

## 批 2：面板落点的三版与用户原话（2026-08-20，**中途闸输入事实，未分类**）

> 任务卡规定：用户对列表屏的评价必须拆成 (i) DSH 渲染能力/机制 → DM 事实 ／ (ii) 信息组织/字段 → P5 契约输入 ／ (iii) 控制面偏好 → 只登记带往 DHR_50，**且由用户逐条点选，主会话不得整包代裁**。
> 本节只**原样登记**用户在中途闸正式开始前提出的评价，**不预先归类**。

| # | 时间 | 用户原话 | 触发的动作 | 归属 |
|---|---|---|---|---|
| U-01 | 2026-08-20 | 「我确认下：relay 在 dsh 中不会就是放在 设置中 展示的把？」 | 第一版落点 `settings.section`（设置里的一页）被质疑 | **待用户点选** |
| U-02 | 2026-08-20 | 「不能就放在首页吗？」 | 查证：首页=中栏 `conversation` 是 `kind:'single'` 且已被 ui-conversation 占，注册进去会把整个会话界面顶掉 | **待用户点选** |
| U-03 | 2026-08-20 | 「老实讲，这个设计也有点傻。感觉是在对话框上面改了一层。我觉得UI设计上你可以去开个任务，先看下社区的插件是咋做的。」 | 第二版落点 `sidebar.footer.action` + `shell.overlay` 全屏浮层同样被否；据此派出只读调研 agent 摸官方 39 个一方 client 包的界面做法 | **待用户点选** |
| U-04 | 2026-08-21 | 「CLI是咋展示的。我记得昨天对的时候有接力计划，runid啥的」 | 复跑 pilot CLI 两层实测并原样回贴：`list` 一行一个 run（分组表/grouped 两种版式），`show` 详情里才有「接力计划（N 步）」棒序表（步骤/内容/角色/状态/尝试/前置） | **待用户点选** |
| U-05 | 2026-08-21 | 「不完全是我要的，接力计划可以理解为一个workflow，有几个接力计划在跑就有几个workflow，我想把这个在面板里体现出来」 | 词表对齐（见下「接力计划／run／workflow 词表对齐」）；给出三种形态选项供点选，用户选定「列表补『流程』列 + 做详情屏（棒序表）」，未选「按 workflow 分堆」 | **待用户点选** |

### 中途闸点选结果（2026-08-21）：**用户以原话作答，未采用三分桶**

> 任务卡预设的 (i)/(ii)/(iii) 三分桶，用户在四道题上**全部选了「Other」并以自己的话作答**。按「主会话不得整包代裁」的规矩，此处**原样登记用户判词**，三分桶归属栏保持未填，不由 AI 补。

| # | 用户判词（原话） | 主会话读到的意思（**待用户确认，非结论**） |
|---|---|---|
| U-01 | 「relay 不应该放设置里」 | 这是一条**要求**，不是对成因的归类：设置页永久出局 |
| U-02 | 「但是，你后来不是找到个方法，在对话框旁边新加了一个页签实现了吗？」 | 用户认为该条已被 v3 化解。**主会话须先纠一处**：v3 落在会话内的 tab 条，**不是首页**——见下「U-02 的一处必须纠正」 |
| U-03 | 「你开始直接盖在对话框的方法有点傻，但是后来改进放的位置可以」 | v2（侧栏按钮+全屏浮层）被否；**v3 落点通过**。落点问题到此收敛 |
| U-05 | 「本质是我增加需求了。或者说一开始没有讨论清楚」 | 用户自判为**需求增补/前期未谈清**，而非对已交付物的缺陷指认 |

#### U-02 的一处必须纠正（不能让它以「已解决」入账）

v3 的 `conversation.view` 是**会话内**主区域的加法位，`scope: session`。空白 hero 态（还没开会话时的首页）整个会话头被隐藏，**tab 条不出现**。所以：

- ✅ 「在对话框旁边加个页签、点进去整个中栏归我渲染」——成立，已由用户亲跑确认（E-029）。
- ❌ 「Relay 放到首页」——**仍不成立**。首页 hero 三个座位全是 `single` 且被占、`replaceRisk: shadows-shipped-ui`，第三方进不去。
- ⚠️ 由此的固有别扭：**想看「所有接力任务一览」，得先开一个对话**。官方 Trajectory 有同样性质。首页上唯一常驻加法位是 `conversation.input.dock`（输入框正上方整行，`replaceRisk: none`），可做一条「Relay：N 个运行中」的提示条，但 rc.7 **没有公开 API 能从它跳到 Relay tab**（`actions.setView` 是 ui-conversation 私有）。

#### U-05 的范围核对：**不越界，无需另开卡**

用户选定的形态（列表补「流程」列 + 详情屏承载棒序表）对照任务卡 §3.2 完成条件逐条核：

| 要做的 | 是否在本卡范围 | 依据 |
|---|---|---|
| 列表行补「流程」列 | **在**。仅新增一列展示 list 模型**已有**字段 `workflow_name`，不动 Read Model 契约、不动分堆键 | 完成条件「列表屏由冻结 fixture 重建」；变更范围仅 `src/dsh-client/` |
| 详情屏（含接力计划棒序表） | **在**。detail 模型 `nodes[]` 已有 `node_id`/`title`/`role`/`node_status`/`depends_on`/`attempt`/`detail` 七字段，CLI `show` 已经这么渲染过一次 | 完成条件「详情屏由冻结 fixture 重建」＝批 4 既定内容 |
| 按 workflow 分堆 | **不做**（用户未选）。会推翻本卡在验的 P4-DM6 | 候选丙，见上「形态决定」表 |

故 U-05 虽被用户自判为「增加需求」，**落到工程上没有越出 DHR_49 的变更范围**，不触发拆卡。

### 落点三版实录

| 版本 | 落点 | 实测结果 | 用户判 |
|---|---|---|---|
| v1 | `settings.section`（设置对话框里的一整页） | 渲染成功，导航栏多出「Relay」项 | 否（U-01） |
| v2 | `sidebar.footer.action` 入口按钮 + `shell.overlay` 全屏浮层 | 渲染成功，侧栏底部出现 Relay 按钮，点开是居中浮层，刷新后重建一致 | 否（U-03） |
| v3 | **`conversation.view`**（会话头部 tab 条上的一个页签，与 Chat / Trajectory 并列） | 注册成功（`slot-registered` 到位）；**渲染尚未由 AI 验到**——见下方「v3 渲染事实」 | **落点未被否**；渲染已由用户亲跑确认（2026-08-21，原话「对，是你说的」）。形态另有意见，见 U-05 |

### 机制定论：主区域加法位**存在**，我的第一版判断是错的（2026-08-20）

侦察阶段我从类型注释读出「三根柱子全 single 全被占 ⇒ 第三方只能做浮层」，并把它当成待验证的机制限制记了下来。**这个判断是错的**，错因是只读了 `dsh-client-ui-layout` 的类型注释就外推到全局，没去看官方包实际怎么做界面。

独立调研（只读 agent，语料 = 本机一方 client 包）+ 本人复核后的定论：

1. **本机有一份机器可读的完整槽位目录**，比各包 `.d.ts` 注释全得多：`dsh-cordis-client-runner/lib/client.js:2121` 的 `const CLIENT_SLOT_API = [...]`（到 3654 行），**42 个槽位**（我此前从 client bundle 里扫出的是 28 个，漏了一多半）。每条带 `kind` / `scope` / **`occupants`（含包名+组件名+id）** / `replaceRisk` / `registerOptions` / `standardProps` / 可直接抄的 `example` / 上游源码行号。同文件 `:1114` 的 `SERVICE_API` 给出每个 `ctx.<service>` 的方法签名。**以后查槽位与服务面直接查这两个数组。**
2. **`conversation.view` 是主区域的加法位**（已本人复核 `:2897` 条目原文）：`kind: 'list'`、`scope: 'session'`、`replaceRisk: none`，现占用者 `client-ui-conversation ChatView id:'chat'` 与 `client-ui-trajectory TrajectoryView id:'trajectory'`。官方 `registerOptions.id` 文档原话：「a fresh id is added beside the shipped entries」。注册一个新 id = 会话头部 tab 条上多一个页签，点进去**整个中栏主体区归你渲染**。官方 Trajectory 就是这么做的一整套界面。
3. **首页 hero 的座位关死了**：`conversation.hero.workspace` / `conversation.hero.agentPreset`（及 `…directoryFlow`）全是 `single` 且被占，`replaceRisk` 均为 `shadows-shipped-ui`，第三方加不进去、只能顶掉。
4. **右栏能开、不能放**：`ctx.layout` 只有三个方法 `toggleSidebar()` / `openDetails()` / `closeDetails()`，插件能把右栏拉出来；但 `details` 是 single 被 `DetailsPanel` 占，其内部的 `conversation.details.tool` 也是 single 被 `ToolDetails` 占，**右栏一个 list/keyed 加法位都没有**。硬抢 `details` 会连带让所有工具详情瞎掉，不走这条。三列宽度由纯函数 `computeColumns` 解算（`DETAILS_MIN/MAX=300/520`、`CENTER_MIN=640`），**没有「申请第四列」这种 API**。
5. **首页上唯一的常驻加法位是 `conversation.input.dock`**（`kind: list`，`replaceRisk: none`，现占用者 QueueDock / TodoDock / GoalDock）——输入卡片正上方的整行。适合做一条「Relay：N 个任务运行中」的入口条，但它**不能**切到 Relay tab（见下）。**本卡未采用，登记为可选增强。**

### v3 落点的固有代价（**属 P4-DM 事实，不是实现问题**）

1. **session 作用域**：空白 hero 态整个会话头被隐藏，tab 条不出现——**必须先有会话才看得见**。对「所有接力任务一览」这种全局视图，这在语义上是别扭的：想看全局却得先开一个对话。Trajectory 有同样的性质。
2. **第三方无法用代码切到自己的 tab**：`actions.setView` 是 ui-conversation 的私有 store 动作；公开的 `ctx.conversation`（`IConversation`）对外只有 `send` / `cancel` / `updateQueue` / `loadOlder` / `input` / `blocks`。只能靠用户手点。这意味着任何「从别处一键跳到 Relay 面板」的设计在 rc.7 上都做不出来。

### v3 渲染事实（AI 侧到注册为止，渲染由用户亲跑取得）

**⚠️ 2026-08-21 按轮 2 复核改为分段登记。** 本节原来写死「AI 侧仍只到 `slot-registered`，不得改写成 AI 已验」，那是**写于卡点解除之前**的登记，此后一直没跟上。它现在是**低报**：低报比高报安全，但代价真实——DM3 的机器证会被读成「最终落点上只有人判、没有机器证」，而 DHR_50 的人判读的就是这个。

**① E-029 时点（卡点未解）**：AI 侧只确认到**注册成功**（`window.__RELAY_PANEL_PROBE__` 停在 `slot-registered`），**未确认渲染**。卡点：要看见 tab 必须先有会话；建会话必须先选工作区；而「添加工作区」拉起的是**宿主机上的原生文件夹选择框**（`dsh-client-ui-directory-picker-native`），浏览器自动化驱动不了它。此外建会话本身要真发一条消息调模型，属用户额度。

**② E-042 时点（卡点解除）**：绕开原生选择框（`SSH_TTY` → `browse`），AI 侧此后可以自己进到有会话的实例。

**③ E-039 / E-045 / E-053 / E-054 / E-055 / E-067（已取得渲染事实）**：AI 在浏览器里驱动了 **列表 → 点卡片 → 详情 → 返回 → 键盘进入** 全链路；读到渲染后的 `paddingBottom: 142px`（浮层留白真的生效）；取了详情屏**屏内全文 SHA256**（680 字符）并在 DSH 重启、浏览器刷新后逐字符对照。**这些是机器证，不是人判。**

故 v3 的渲染事实**只能由用户亲跑取得**——这与任务卡「需求境证据 · 主证据 = 用户亲跑端到端」的规定同向，不是退让。操作路径已写进 `review.md` 需求境证据栏。

**2026-08-21 人判证据**：用户按该路径亲跑，确认会话头部 tab 条上出现「Relay」页签、点进去是列表屏，与描述一致（原话「对，是你说的」）。**这一条仍然是人判、且不可被机器证替代**——「用户自己能不能照着跑起来」本来就只有用户能答。

**机器证与人判是两件事，都齐了，别混着记**：人判管「用户能否自己跑起来 + 好不好用」，机器证管「同一 fixture 能否重建出同一屏」。上面 ③ 那串是后者。

## 接力计划／run／workflow 词表对齐（2026-08-21，回应 U-04/U-05）

> 起因：用户对三个词的关系已模糊，且提出「有几个接力计划在跑就有几个 workflow」。本节以 `design/01` §3 术语表、`design/02` §2.3～2.4 与 pilot Read Model 实际字段为准对齐，**不凭印象**。

| 词 | 正式含义 | 落在哪个字段／文件 | 客户端哪里看得见 |
|---|---|---|---|
| **接力计划 / RelayPlan** | 这一次运行的棒序表：谁先跑、谁后跑、谁依赖谁、每棒什么角色（`design/01` §3 术语表） | run 目录下 `active-plan.json`（`plan_version` / `plan_hash`）；投影后落 detail 模型的 `nodes[]`（`node_id`/`title`/`role`/`node_status`/`depends_on`/`attempt`/`detail`） | 仅 CLI `show`：「接力计划（N 步）」表。**面板未做**（详情屏在批 4） |
| **Run** | 接力计划的一次执行实例，带 `run_id` | list 模型每个数组元素；`relay-state.json` 的 `run_id` | CLI `list` 每一行；面板列表屏每一行 |
| **workflow_name（流程）** | 这个 run 由哪个**模板**实例化而来（如 `dev-harness/task-standard@1` / `单卡完整流水` / `夜间批量体检`） | list 与 detail 模型均有 `workflow_name` | CLI `show` 与 `list --layout grouped` 有「流程」行；`--layout split/table` **无此列**；面板列表屏**无此列** |

两条判定（**均为已核事实，非推测**）：

1. **接力计划 : run = 1 : 1**。一个 run 目录同一时刻只有一份生效计划（`active-plan.json` 单文件 + `relay-state.json.plan_version` 单值；重编排走 CAS 晋级涨 `plan_version`，不并存）。故「有几份接力计划在跑」= 「有几个 run 在跑」= 列表屏的行数。用户这层直觉成立。
2. **`workflow_name` 不唯一，不能当接力计划的身份**。它是模板名，多张卡走同一模板即多个 run 共享同一 `workflow_name`。因此「有几个接力计划就有几个 workflow」在**计数**上不成立（N 个 run 可能只有 M<N 个不同 workflow_name）。这是把 `workflow_name` 用作分堆键的直接反例。

### 形态决定（用户 2026-08-21 点选）

| 候选 | 内容 | 用户判 | 影响面 |
|---|---|---|---|
| 甲 | 列表行补「流程」列（`workflow_name`）+ 做详情屏承载棒序表 | **选定** | 列表屏改一列（批 2 返工）；详情屏本就在批 4 计划内。分堆键仍取源头 `group`，**不动本卡在验的架构约束** |
| 乙 | 列表行内直接铺开棒序（不进详情屏） | 未选 | 需给 list Read Model 加 `nodes`，**动契约**，越出本卡变更范围 |
| 丙 | 把分堆维度从源头 `group` 换成按 `workflow_name` 分堆 | 未选 | **会直接推翻本卡正在验的 P4-DM6**（分堆只读源头），且撞上判定 2 的不唯一问题 |

> 归属仍待用户在中途闸点选：甲的「补流程列」偏 (ii) 信息组织/字段，「做详情屏」是本卡既定范围内的推进。主会话不代裁。

## F-005：版本号不变时 `dsh plugin add` 静默保留旧内容（构建配方缺口）

**现象**：改完代码 → `npm pack` → `dsh plugin --profile web add <tgz>`，pnpm 打印 `Already up to date`，退出码 0，看着完全成功。实际装进 profile 的仍是**上一版**：四个文件的 SHA256 与源码全不同，安装副本里搜不到本轮新加的 `relayPanel/get` 与「接力计划」。

**成因**：包版本固定为 `0.0.0-pilot.1` 从没变过。pnpm 按**版本号**判定是否需要重装，不看 tarball 内容哈希。

**为什么危险**：失败是静默的，且症状出现在**下游**——真机上看到的是「新功能没生效」，很容易被误诊成代码写错、槽位没注册、缓存问题，而不是「装的根本不是这一版」。批 4 是先核了四个哈希才发现的，不是从症状倒查出来的。

**修法（已并入 README 配方）**：更新安装必须 `remove` 再 `add`：

```powershell
dsh plugin --profile web remove '@personal/dsh-relay-panel'
dsh plugin --profile web add <pilot>\relay-control-pilot\dist\personal-dsh-relay-panel-0.0.0-pilot.1.tgz
```

**并且每次装完必须核哈希**，不能靠命令退出码——安装副本与源码逐字节相同才算装上（E-041）。

**对 DM2 的影响**：不影响「干净重跑」判据（全新 profile 没有旧版可复用），只影响**更新**路径。但配方若不写这一步，任何按配方复跑并迭代的人都会踩。

## F-006：原生文件夹选择框有一条不改绑定地址的绕法

批 1～3 一直把「添加工作区拉起宿主机原生文件夹框、浏览器自动化驱动不了」当成硬阻塞。**它不是硬的。**

`@deepseek-ai/dsh-host-directory-picker-auto` 在**启动时**按环境解析后端（源码 `resolveDirectoryPickerBackend`）：

```js
if (facts.bindHost !== "127.0.0.1") return "browse";
if (present(facts.env.SSH_CONNECTION) || present(facts.env.SSH_TTY)) return "browse";
if (facts.platform === "darwin" || facts.platform === "win32") return "native";
// …linux 还要看 DISPLAY / WAYLAND_DISPLAY 与 chooser 二进制
```

解析成 `browse` 时挂的是 `dsh-client-ui-directory-picker-browse`——**页内**目录选择器，带「编辑路径」输入框，可完全自动化驱动。

**选哪个开关**：

| 开关 | 效果 | 采否 |
|---|---|---|
| `--host 0.0.0.0` | 解析为 browse | **不用**。改绑定地址等于把服务暴露到网络，为自动化便利做对外可达性变更不划算 |
| `SSH_TTY=<任意非空>` | 解析为 browse | **采用**。纯进程内环境变量，无网络暴露，只影响这一次启动 |

加完工作区后以常规环境重启即恢复原生框；工作区登记落在 `storages/workspace.json`，重启后仍在（E-042）。

**这条推翻了我此前的一个归因**：我把「AI 侧验不了渲染」记成原生对话框不可驱动，实际只是我没往下看那个 auto 插件凭什么选后端。**同一类错误本卡里犯了第二次**（第一次是只读类型注释就断言「第三方只能做浮层」，见 L-09）——都是读到一层封装就停下，没去看它的决策依据。

## F-007：hero 态无页签，工作区级别也绕不开（固有代价①再证）

为 dh-relay 新建工作区后，DSH 自动在其中建了一个空会话。该会话处于 hero 态，`document.querySelectorAll('[role="tab"]')` 返回**空数组**——「对话 / 轨迹 / Relay」三个页签一个都不在。

即：**建好工作区 ≠ 面板可见**。要看见 Relay 页签，那个会话里必须先有一次交互（至少一条消息），而这要花一次模型调用。官方 Trajectory 同此性质，不是本插件的实现问题。

**代价有多大：一次性，不是每次**（2026-08-21 实测，回应用户「每次都要发条消息才出现？」）。

拿昨天建的 `Hi` 会话验：期间 DSH 重启五次、页面刷新多次，**一条消息都没再发**，点开该会话立刻拿到 `tabs: ["对话","轨迹","Relay"]`，且 `selectedTab` 仍是 `Relay`——上次停在哪个页签也被记住了。

所以准确表述是：

| | 要不要再花一次调用 |
|---|---|
| 重开已有会话 / 重启 DSH / 刷新页面 | **不要**。页签常在，还记得上次选的是 Relay |
| 新建一个会话 | **要**。新会话从 hero 态起步，页签条不存在 |

**实际用法因此是**：留一个专用会话当 Relay 控制台，总回到它——总成本是**一次**消息，不是每次。

**但这仍是一条该带往 DHR_50 的事实**：面板在语义上不属于任何一场对话，却被绑在会话生命周期上；「想看全局状态，得先有一场对话」这件事本身别扭，且第三方无法用代码切到自己的页签（见固有代价②），两条叠加意味着「从别处一键打开 Relay」在 rc.7 上做不出来。

## F-008：输入框归会话不归视图，删不掉但能让它不碍事

**用户原话（2026-08-21）**：「对话框 和 上面的流程的关系是啥？对话框有用吗？没有用的话能不能去掉？」——附截图，输入框压住了列表最后一张卡片。

### 归属：会话的，不是视图的

输入框是 `ConversationRoot` 里的 **composer seat**，**无条件渲染**，与当前哪个页签无关：

```js
const composerSeat = jsx("div", { ref: seatResizeRef, className: css.composerSeat, "data-composer-seat": "", children: composer })
return jsx("div", { className: css.root, "data-phase": phase, children: [
  renderSlot("conversation.session.header", {}),
  jsx("div", { className: css.scrollBody, children: [renderSlot("conversation.session", {}), composerSeat] })
]})
```

对 Relay 面板它**没有用**：面板只读，在那儿发消息进的是对话，不进 relay。

### 能不能去掉：不能（按页签去掉做不到）

唯一的接管口是 `conversation.composer`（`kind: chain`，`replaceRisk: none`，现占用者 ApprovalPanel / SubagentReadOnlyComposer / QuestionComposer）。它的路由选择器签名是 `select: (owner) => unknown | null`，而 owner 货币是：

```ts
interface ComposerChainProps {
  interactions: readonly PendingInteraction[]
  session: ConversationSnapshot | undefined
}
```

**没有「当前哪个视图」这个信息**（活动视图 id 在 ui-conversation 的私有 store 里，`setView` 也是私有动作——同固有代价②）。所以第三方要么在**所有**页签替换掉输入框（连「对话」一起废掉），要么都不替换。**按页签隐藏做不到。**

### 能做的：照官方 Trajectory 的做法，让它变浮层并留出空间

`ConversationRoot` 的样式里有一条 `:has()` 规则，把决定权交给了视图：

```css
.scrollBody:has([data-conversation-composer-overlay]) > .composerSeat {
  position: absolute; bottom: 0; left: 0; right: var(--dsh-composer-height-scrollbar);
}
.scrollBody:has([data-conversation-composer-overlay]) > [data-slot=conversation.session] > .viewArea {
  flex: 1 1 0; min-height: 0; overflow: hidden;
}
```

视图只要在自己的根上打 `data-conversation-composer-overlay`，seat 就变浮层、滚动权交回视图。官方 `dsh-client-ui-trajectory` 打的正是这个属性（全仓只有 ui-conversation 与 ui-trajectory 两个包出现过它）。

底部留白也照抄官方：ui-conversation 把量到的 seat 高度发布成 `--dsh-composer-height`，Trajectory 用

```css
--dsh-trajectory-bottom-clearance: calc(var(--dsh-composer-height, 152px) + 16px)
```

本面板同法。实测 `paddingBottom: 142px`（=126 实测 + 16），滚到底最后一张卡不再被压（E-045）。

### 中途我查错了一次，记下来

第一次查「轨迹页签下输入框在不在」，我用的是 `document.querySelector('[class*="InputBar"]')`，得到 `false`，据此差点回答「轨迹下输入框不存在，所以按视图可以隐藏」。**这是错的**——CSS Modules 把类名哈希成 `uV2eYG_*`，那个选择器永远匹配不上任何东西，返回 false 只说明我选择器写错了。改用官方自己留的 `[data-composer-seat]` 复查，三个页签**都有** seat，真正的差别只是 `position`（轨迹 `absolute`、当时的 Relay `sticky`）。

教训见 L-18：**用哈希过的类名当探针，"没找到"和"不存在"分不开**；要用稳定锚点（`data-*` 属性、`role`），并且对"不存在"这种否定结论额外验一次正控。

## F-009：`relay focus` 在设计里只出现一次、没有正文定义（设计缺口，带往 P5）

**起因**：用户 2026-08-21 问「目前的 relay 是只读的，应该会改成点击可以拉起对应的 herdr 吧？」

查证结果：`relay focus <run_id> <node_id>` **确实在** `design/06` §2 的参考 CLI 面里（与 `attention answer` / `approve` 并列）。但全 `design/` 目录里 **grep 只命中这一处**——没有语义正文，没说它是「把那一棒的终端调到前台」还是别的，也没说在 herdr 这种「多 pane 共享一个操作系统窗口」的底座下 focus 到底 focus 什么。

**这是设计缺口，不是本卡能补的**。登记为 P5（DHR_30 协议设计）输入：`focus` 的语义、它在 psmux / herdr 两种底座下各自的落地形态、以及它算不算控制合同的一部分，都要在 P5 定。

### 顺带核清楚的四条边界（供 DHR_50 与 P5 参考，均已在设计里有依据）

1. **GUI 点击永远只能是便利，不能是必经路径**。`design/06` §3 硬约束 8：「GUI 能力只作为展示增强。流程完成条件不能依赖浏览器内存、页面组件或点击事件本身。」所以"点击拉起终端"可以做，但同一件事必须始终能用 CLI 完成。

2. **浏览器页面抬不起操作系统窗口**，这条路必须走宿主侧。插件的 host 半边跑在 DSH 服务进程里，可以 shell 出去调 `relay focus` / `herdr agent attach`；所以形态是「点击 → Remote 调用 → 宿主执行」。**那是写 / 副作用路径**，正是 P4 Pilot 非目标里排除的「不接 Relay 运行写权」——本卡不做，不是做不到。

3. **目标必须由句柄给，不许客户端猜**。`design/03` §105 明令禁用「以窗口标题、pane 序号、UI 焦点、sidebar 顺序推导目标」。所以 Read Model 若要支撑 focus，得**带上 pane/agent 句柄**——这是给 P5 契约的一条具体输入。

4. **跨机不成立**。`design/06` §5：「当前不要求 Windows 上的 DSH 远程控制 Linux Runtime。」所以「点一下拉起 herdr」只在同机场景成立；Linux 那边仍是 SSH + CLI + `herdr agent attach`。

### 还有一层更前的不确定：herdr 本身没定

- `design/03` 是**平行候选 A 方案**，与 `design/02`（psmux 底座）**二选一**，都还是 P2 完整流水的设计输入候选。
- H10（用户 2026-08-17 拍板）把它改成「底座可配置：psmux 不变、herdr 追加」，并因此在 `dev_plan/P3` 拆成两张卡。
- **H6 是前置闸**：要用户在一个真实接力 run 的拓扑下亲自用一段时间，判 herdr 的交互体验在「低频作答」场景下可不可接受；`design/03` 原话「你判否则本方案整份不生效」。这是对 agent-console 仓 2026-08-14「太卡 no-go」的定向复验。

所以「点击拉起 herdr」这个形态，前面压着两道还没过的闸：**底座选型（H6）** 与 **写权接入（P5）**。

## F-010：DHR_26 的 `isPlainJson` 把 DAG 误判成非 JSON（偏保守，不改）

写 DM5b 的校验器时顺手拿 DHR_26 的 `src/dsh-host/fixture-store.mjs` 做交叉对照，实测到一处分歧：

```js
const shared = { x: 1 }
isPlainJson({ a: shared, b: shared })   // false
JSON.stringify({ a: shared, b: shared }) // '{"a":{"x":1},"b":{"x":1}}' —— 处理得好好的
```

原因：它的 `seen` 集合**只加不减**，于是「同一个对象在两个兄弟位置各出现一次」（DAG，非循环）被当成了循环引用。

**判断**：方向偏保守——它错杀合法 JSON，不会放行非法的，所以**不削弱 DM5a**，也没有实际触发路径（fixture 都来自 `JSON.parse`，产不出 DAG）。**不在本卡改动范围内**（任务卡：不改 `src/dsh-host/`）。登记为事实，供 DHR_50 与后续卡处置。

本卡自己那个校验器不共用它、也不共这个 bug：`test/dsh-client-read-model-purity.test.mjs` 的 `purityViolations()` 用一条**祖先链**（而不是全局 seen）判循环，DAG 判纯。两侧判决在语料上逐条对照，分叉当场红——DM5a／DM5b 拆开就是为了谁也不替谁签字（`design/evidence/09`），共用一个校验器等于把刚拆开的耦合粘回去。

### 附注（2026-08-21，CP4 复核带出来的第二处）：**数组盲点，两侧共享**

`isPlainJson` 的数组分支是 `value.every(item => isPlainJson(item, seen))`——**只看索引元素**。实测：

```js
const runs = [{ run_id: "a" }]
runs.ctx = { live: true }
isPlainJson({ runs })                        // true  ← 挂在数组自身上的东西看不见
isPlainJson({ runs: RunList.from([...]) })   // true  ← Array 子类也放行
```

本卡校验器第一版**共享同一个盲点**，CP4 复核用一个真 Cordis Context 挂在 `model.runs.ctx` 上把它捅穿了（12/12 全绿放行，见 E-073）。本卡这侧已修（E-074），**DHR_26 那侧不在本卡改动范围内**。

这也解释了为什么 §B 的交叉对照照不出这个洞：**两侧盲点相同，对照就成了两个瞎子互相担保**。这条比 DAG 那条要紧——DAG 是错杀（偏保守），数组盲点是**漏放**（偏危险），方向相反。一并带给 DHR_50。


## F-011：跨 realm 时「是不是普通对象」不能用原型 identity 判

客户端 bundle 是 `vm.runInContext` 跑起来的，它 `new` 出来的每个对象都带着 **vm 那个 realm 的** `Object.prototype`。所以从测试这边看：

```js
Object.getPrototypeOf(fromBundle) === Object.prototype   // 永远 false
```

DM5b 校验器第一版正是这么写的，`loadList()` 的返回值和探针全被判成「不是普通对象：Object」——一个自相矛盾的理由，是它把问题指出来的。

**改法**：判据换成**原型链根不根**——`proto === null || Object.getPrototypeOf(proto) === null`。这个性质跨 realm 成立，而 `Date.prototype` / `Map.prototype` / `Context.prototype` / 任何 class 的 prototype 都还在各自 realm 的 `Object.prototype` 底下一层，照样逮得住（`§A` 用另一个 realm 的 `Date` 单独验了这条）。

**连带**：`assert.deepStrictEqual` 会比原型，所以验收口径点名的「`JSON.parse(JSON.stringify(x))` 深等自身」在跨 realm 下同样会假红。本卡的做法是先把**普通对象**重挂到本 realm 的原型上再比，而 Date / class 实例 / 活对象一律原样保留——这样往返那条网仍然逮得住它们。

**顺带一条量程说明**（写完才看清，如实记）：往返深等其实被那个逐字段的 walker **完全包住**了——walker 全绿就意味着值已经是纯 JSON，往返必然相等。所以它不是独立的第二条证据，留着只因为验收口径点了它的名、以及 walker 万一被削弱时还兜一层。

## F-012：P4-DM2 现状 = 两条判据都跑了、都不完整，**不得记 pass**

> 本条 2026-08-21 12:45 重写。首版写的是「跨机未成立（目标机不可达）」——**那个结论已经过期**，详见下面判据②。

| 判据 | 结果 | 缺口 |
|---|---|---|
| ① 本机清净重跑 | **成立，但由两段拼成** | 未跑端到端全冷运行 |
| ② 换机重跑 | **部分成立** | 「可加载」未证 |

### 判据①：清了产物没清缓存，补跑后成立

CP3 复核抓出一个真洞：任务卡原文是「删除产物**与依赖缓存**」，而施工时只删了产物。硬证据——`fsutil hardlink list` 显示 profile 里的 `client.js` 与 `.pnpm-store/v11/files/8b/c5a1f6…` **是同一个文件**（硬链，links=2），其 mtime 比那次重装早 11 分钟。pnpm 的 store 是内容寻址的（文件名 = 内容 sha512 十六进制，本包六个文件逐条对上），所以「逐字节相同」里有一部分是硬链带来的恒等。

**根因在我这边**：`task_plan.md` 3.2 把卡里的「依赖缓存」写成了「`node_modules`」，而本 Pilot 根本没有 `node_modules`，那一项等于自动满足。已在 task_plan 就地更正并标注。

**补跑结论**：全新空 store + 全新空项目冷装（`reused 0, downloaded 1`），四个 bundle 文件与源码**逐字节相同**。warm 硬链并没有掩盖差异。

**仍存的缺口，不合并陈述**（CP3 二轮复审后重写）：本机**主动未跑**端到端全冷运行——不是被挡住。pnpm 只拒绝「给已存在的 profile 换 store」，而端到端那条路是**全新 `DSH_HOME`**，没有任何东西拒绝它，只是要付约 5.5 分钟不可中断的符号链农场重建 + 网络重下依赖，本轮判为不划算。另有第二个缺口：warm 那半里 `@personal/dsh-relay-host` 与 `absence-probe` 是 **`link:` 绝对路径**装的，全冷环境下必须重装，而这两半都没覆盖（冷那半是空项目、没有 host；warm 那半复用旧 link）——面板的数据全来自 `ctx.relayPilot`，不点名会让人以为只差一个符号链农场。**这两个缺口在判据②的目标机全冷环境里被一并真跑了**（那台机器此前从没装过 DSH），但两台机器的 store / Node / profile 历史都不同，目标机成立不等于本机那条路径已验证，故本机侧保留登记。冷 store 的对比面也已从 `lib/` 四个文件扩到 tarball 除 README 外的**全部六个成员**（含决定接线的 `cordis.patch.yml` 与 `package.json`），接缝才闭合。

### 判据②：真跑了，大部分成立，差最后一格

12:00 首探不可达 → 12:31 复测已可达（原结论过期，见 L-22）→ 用户放行在目标机装 DSH → 判据②完整跑了一遍。目标机此前**从没装过 DSH**，所以这一轮顺带跑成了一个真正的**全冷环境**。

目标机：Ubuntu 24.04 / 系统 Node **v18.19.1** / npm 9.2.0。

| 判据②要求 | 结果 |
|---|---|
| 配方能在目标机执行 | **成立**，但跑出一处配方缺陷 |
| 产出 bundle 且与本机一致 | **成立，逐字节相同** |
| 全套断言在目标机通过 | **成立，216/216，skipped 0** |
| 宿主半边加载并答出同一份数据 | **成立**，`fixture_hash` 与基线逐字符相同 |
| 客户端 bundle 在目标机浏览器里加载 | **成立**（载入／挂 Remote／注册视图／注入样式四步齐全） |
| **面板渲染出数据** | **未证** |

**未证那一格的原因要说清**：Relay 页签在目标机上没出现，因为该实例里没有开着的会话——hero 空屏整个会话头连同页签栏是隐藏的（F-007，`conversation.view` 固有代价①）。开会话要在目标机上发消息，那需要该机器的 LLM 凭据，**我没有去配**。所以这**不是 bundle 的问题**：bundle 已证明能载入、能挂 Remote、能注册视图、能注入样式；缺的是 DSH 的一个 UX 前置条件。

### 判据②跑出来的三件实质产出

**① 配方缺陷（已修）**：`npm pack --pack-destination ../../dist` 在 `dist/` 不存在时直接 `ENOENT`——`--pack-destination` 不会自建目录。本机一直没事只因为 `dist/` 早就在，**配方从没在"目录不存在"的状态下被走过**。

**② 交付物可复现、外包装不可**：同一份源码，tarball 的 sha256 跨平台不同（win32 `f72c6cf5…` / linux `968e668f…`），但里面四个 bundle 文件**逐字节相同**。加上「改 README 就变」，tarball 哈希在两个维度上都不能当「装的是不是这一版」的判据。

**③ 实证了 CP3 提前指出的陷阱**：不设 `RELAY_PANEL_DSH_PACKAGE_JSON` 时目标机 `skipped 12`，设了之后 `skipped 0`。而跨机最该证的那 11 条（真 Cordis、真 zod 品牌、装饰器契约、DM5b 的 §A/§C）恰好就在被跳的那批里——**「202 全绿」会把它们藏掉**。
### 记账口径

任务卡：「②失败而①成立时如实登记『本机可复现、跨机未成立』，**不得记 pass**」。

现在②比「未成立」好得多，但仍差「产出**可加载** bundle」那一格，所以照实写成 **「跨机可产出同字节 bundle、全套断言通过、宿主与客户端 bundle 均加载成立；面板渲染未证」**，**DM2 仍不得记 pass**。 ⚠️ **2026-08-21 用户点选「暂时不动目标机」（E-127）**：这一格**就此定格为未证，不再等补**。按 L-25 口径登记——这是**用户的取舍判断，不是被挡住、也不是遗漏**；补法一直在（目标机上开个会话即可），是决定不补。 三态归属是 DHR_50 由用户人判，本卡不代裁。


## F-013：DSH 在 Linux 上装不全就会「第三方插件一个都加载不了」，而报错完全不指向根因

这是判据②在一台干净 Linux 机器上撞出来的，**属于 DSH 本身的跨平台脆弱性**，不是本包的问题。P5/P6 若要在 Linux Runtime 上用 DSH，这条是硬前提。

### 三条没写进任何文档的外部前提

| # | 前提 | 撞上时看到什么 |
|---|---|---|
| 1 | **Node ≥ 20.12** | `SyntaxError: "node:util" does not provide an export named "parseEnv"`。`util.parseEnv` 是 20.12+ 才有的，而 `@deepseek-ai/dsh@0.1.0-rc.7` 的 `package.json` **根本没有 `engines` 字段**，npm 装的时候不拦 |
| 2 | **`pnpm` 在 PATH 上** | `dsh: pnpm not found on PATH — install pnpm to manage profile plugins` |
| 3 | **平台原生插件 `node-addon-require-builtin` 的绑定装上了** | 见下 —— 这条最隐蔽 |

### 第 3 条的根因链（值得完整记下来）

```
npm i -g @deepseek-ai/dsh（用系统 npm 9.2.0）
  → 跳过了 optional 平台包 node-addon-require-builtin-linux-x64-gnu
  → requireInternal() 拿不到 Node 内部 ESM loader
  → loader.internal === undefined
  → cordis-plugin-loader 退化成"从加载器自己的位置做普通 import()"
  → 永远走不到 profile 的 node_modules
  → 报错：Cannot find package '@personal/dsh-relay-host'
```

加载器的关键那一行：

```js
if (this.ctx.loader.internal) return await this.ctx.loader.internal.import(name, this.ctx.baseUrl, {});
else return await import(/* 从加载器自己的位置解析 */);
```

`ctx.baseUrl` 是 **profile 目录**，走上面那支才解析得到 `profiles/<p>/node_modules/@personal/*`。

**两个 `@personal` 包报同样的错，`link:` 装的和 tgz 装的一视同仁**——所以与装法无关，排除了 F-E 那条老怀疑。

**不是没发布 Linux 版**：`optionalDependencies` 里七个平台包都声明了，`npm view node-addon-require-builtin-linux-x64-gnu version` → `0.1.5`。用 `--include=optional` 重装即可修好。

### 为什么值得单开一条

**报错说的是「找不到我的插件」，真正断掉的却是一个平台相关的原生插件，中间隔着两层。** 任何人在 Linux 上第一次装 DSH 都可能撞上，而错误信息把人往「我的插件装错了」的方向带——本卡就是先怀疑 `link:` 装法、再怀疑符号链农场，读到 `cordis-plugin-loader` 源码才定位到。

### 顺带修正一条本地经验的适用范围

`src/dsh-host/README.md` 那条「首启建符号链农场，约 5.5 分钟且不能中断」是 **Windows 特有的**：目标机 Linux 上建同一个 `web` profile 的农场用了 **1 秒**。


## F-014（2026-08-21，CP2 复核带出）：生产 bundle 上 export 了 6 个测试钩子

`src/dsh-client/lib/client.js` 在 `exports` 上挂了 `__groupRuns__` / `__RunRow__` / `__NodeTable__` / `__AttentionTable__` / `__duration__` / `__PAGE_PROPS__` / `__TYPERT_REMOTE__`。

**这是有意为之，不是疏忽**：本包没有打包步骤，浏览器 bundle 是手写的，测试要拿到纯函数做镜像断言就只能从 `exports` 走（`loadClientBundle` 在 Node 的 `vm` 里跑同一份文件）。代价是**树外插件的 `exports` 是 DSH 宿主看得见的表面**——这些钩子在生产里也在。

**判定：卫生问题，非功能缺陷。** 它们都是纯函数、无副作用、不写任何东西，被外部调用最多是拿到一份只读渲染结果。**本卡不改**（改要么引入条件导出、要么引入打包步骤，两者都超出「最小 Pilot」范围）。

**带给 P5/P6**：真做产品化时，要么用条件导出把这批钩子收进 `NODE_ENV !== 'production'` 分支，要么接受一个打包步骤。**别在没有打包器的前提下追求"干净的 exports"**——那会把测试逼回"测常量而不是测实现"的老路（本卡在词表那条上刚栽过，见 L-32）。

## 止损条件逐条实测（§4.4）

> **2026-08-21 整表推到实测终态。** 轮 2 换人复核指出：完成条件 #5 要的是「§4.4 止损逐条命中与否」的**终态**，而此表 7 行里有 4 行仍停在过程态（「待批 2/4」「未测」），且其中一行的理由是本卡自己**已经撤回**的说法。止损表是 DHR_50 人判三态的直接输入，停在过程态等于把判断材料扣着不给。

| 止损条件 | 侦察阶段预判 | 批 1 实测 | 何时最终定 |
|---|---|---|---|
| Client Bundle 只能在 DSH monorepo checkout 内构建 | 预判不命中 | **实测不命中**——bundle 手写、零构建链，安装产物与源文件逐字节相同（E-008） | 已定（批 1） |
| 构建配方在清净重跑下不可复现 | 预判不命中 | **未命中（有量程）**：清 store 冷装出同字节、装回后可加载；**端到端全冷运行本机主动未跑**——2026-08-21 更正：此处原写「pnpm 不让给已存在 profile 换 store」，那是本卡已撤回的说法（`clean-rerun.txt` §6 与 L-25：判为不划算、主动未跑，写成被挡住是双标）。跨机那侧则**真的跑成了全冷环境**（目标机此前从没装过 DSH，E-083）。量程见 F-012 | **已定（批 3 + 跨机）** |
| Windows 下 Profile 或插件生命周期不稳定 | 未知 | **未命中（初步）**——install / 3 次重启 / 浏览器刷新全程无异常，控制台零 error；**卸载清理批 4 已做**——`--dump-config` 三态 505 → 502 → 505，A 与 C 逐字节相同、A 与 B 的 diff 恰好只有面板 3 行（E-050），运行时那半由 E-037/E-038 承担 | **已定（批 4）** |
| 单个最小面板要求大范围导入未公开内部模块 | 预判不命中 | **实测不命中**——只用 `ctx.slots` / `ctx.remote.$mount` / `ctx.inject` 三个公开面；客户端 bundle **只 require 宿主提供的 `react` / `react/jsx-runtime`**（契约测试改成白名单钉死，CP1 P2 修正了原来"零 bare import"的过强说法）。另有两处**非文档化但官方自用**的形态需一并登记：全局 `window.__ModuleLoader__`（所有官方 client bundle 的入口形态）、把 `Remote(name)` 当普通函数调用来施加装饰器（Node 24 无装饰器语法且本包无编译步骤）——后者有专门回归测试盯着 | 已定（批 1，CP1 后修正措辞） |
| DSH 重启后无法从普通 JSON 重建页面 | 未知 | **未命中（初步）**——3 次重启 + 1 次刷新均重建出同一 `fixture_hash`。**详情屏已在最终落点取到机器证**（E-053 重启、E-054 刷新 + 屏内全文 SHA256）。**列表屏那半 2026-08-21 已补齐**（E-102/E-103）：最终落点上首载/刷新/**DSH 进程重启**三次，屏内全文 SHA-256 逐字相同（`076c9d4a…`，663 字符）；「其实没刷新」这个替代解释用一正一负两道控排掉（否定控=标记消失，**身份控=探针是新对象**），比 E-054 那次强一档。此前只有 E-015/E-016，取自 v1/v2 两个**已废弃**落点，顶不了最终落点的格（轮 2 复核 P2 指出）。**跨机那侧的列表屏渲染仍未证**（目标机没有开着的会话） | **已定（批 4 + 轮 2 返工）** |
| 面板必须自行从 `run_status` 推导分组才能渲染 | 预判不命中 | **实测不命中**——`groupRuns()` 全程只读 `group`；两条镜像断言（改 `group` 必移动 / 只改 `run_status` 渲染模型逐字不变）加一条源码级切片断言钉住，6 条变异全见红（E-011/E-012/E-014）。fixture 里 `fake-run-0007` 是 `run_status: failed` 而 `group: needs_you`，两键**真的分叉**，镜像断言不是恒真 | **已定（批 2）** |
| 用户在对话中明确喊停 | — | 未命中 | 随时 |

## 待验证事实（禁止写成结论）

- F-A ~ F-G 全部为**源码阅读推断**，无一条上机验证过。批 1 探针跑通前，任何一条都不得写进 `review.md` 或 P4 报告。
- ~~换机重跑的可达性本轮未验~~ → **已验（2026-08-21）**：目标机可达、Ubuntu 24.04 / Node v18.19.1、**未装 DSH**。测试与打包跨机跑通、bundle 逐字节相同；「可加载」因未装 DSH 未证。详见 F-012 与 `evidence/dhr49/batch3/cross-machine.txt`。仍未知：目标机装上 DSH 后是否为同版本 `0.1.0-rc.7`、是否需要独立 Home。
- 面板刷新 / DSH 重启后的重建行为未验。
- Client bundle 的 `rev`（内容哈希）由谁计算、树外包是否照常参与，未验。

## 范围外发现（记账不顺手做）

- **F-001（账目缺口，本卡顺手补）**：DHR_26 已于 2026-08-20 打了 `verify(dh-relay): DHR_26 …`（`c90cf88`）并销户，但 DevPlan `P4 §3.1` 的 DHR_26 行仍写「未开始」、工作区列仍是占位符。成因见 `workspace/DHR_26/devplan-handoff.md`：当时 P4 文件被 B-11 会话占用，回填被推迟到「B-11 落盘后」；B-11 已落盘（`d0c0ff9`）但回填未执行。本卡开工回填 DevPlan 时一并补齐。
- **F-002（并行 WIP，已发生但无害，留痕）**：`P4-DSH工作台最小Pilot-开发方案.md` 开工时有另一会话（DHR_27）的未提交修改，含头部 `dh:status` 块与 §3.1 的 DHR_27 行。本卡按纪律**只改 §3.1 的 DHR_26 行与 DHR_49 行**、不碰 `dh:status` 块，行级零重叠。
  **实际后果（2026-08-20 事后核实）**：DHR_27 会话在本卡批 1 施工期间收口，其提交 `e08a130`「回填 DHR_27 verify SHA 与销户留痕，刷 P4 现状块」**把本卡这两行回填一并卷了进去**——因为二者落在同一文件，对方提交该文件时整文件入库。内容正确、无冲突、无丢失，但**DHR_49 的开工回填在 git 历史里挂在 DHR_27 的销户提交下**，不在本卡自己的提交里。
  **教训方向（不在本卡处置）**：行级不重叠 ≠ 提交级不重叠。同一文件的并行 WIP，只要另一方 `git add <该文件>`，你的未提交改动就会被顺走。要真隔离得靠 worktree 或错开时间，光靠"改不同的行"只防冲突、不防归属错位。已记入 `lesson_candidates.md`。

- **F-004（流程违规，本卡自认）**：`task_plan.md` 给 CP1 定的出口是「有 open P0/P1 先收敛再进批 2」，但我在 CP1 复核结论**返回之前**就开工了批 2 编码（20:30 起改源，20:38 新建 grouping 测试）。CP1 复核者独立发现并记为 P2。
  **后果不是假想的**：批 1 源码在复核者读到一半时被覆写，而树外无 git ⇒ 无 diff、无回滚点；复核者只能靠 profile 安装副本重建批 1 快照才把复核做完，而那份副本再装一次插件就没了（P1-1）。等于我把「换人复核」的对象弄丢了一次。
  **动机是「不想空转等复核」，但这恰恰是闸口存在的理由**——闸口就是用来阻止「还没人知道有没有 P0/P1 就往前推」的。
  **已改行为**：①后续检查点等复核结论回来再进下一批；②派审后**立刻**冻结上一批源码（无 git 下唯一的留痕手段），已对批 1 补做（`evidence/dhr49/batch1/src-snapshot/`）。
  **不写成「已优化」**：这是失序，按宪章留痕，不包装。

- **F-003（环境事实，供批 3 与复跑者）**：`<experiment-root>` 整个目录**不在任何 git 仓库里**（`dh-relay-p4-pilot/` 无 `.git`，父目录也没有）。因此本卡的代码没有版本控制兜底——`src/dsh-client/` 的每一步都靠 `progress.md` 的证据账本留痕，删了就没了。批 3 的「清净重跑」要动产物与依赖时，**先确认删的是产物不是源**。
