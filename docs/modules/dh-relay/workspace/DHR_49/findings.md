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

### 落点三版实录

| 版本 | 落点 | 实测结果 | 用户判 |
|---|---|---|---|
| v1 | `settings.section`（设置对话框里的一整页） | 渲染成功，导航栏多出「Relay」项 | 否（U-01） |
| v2 | `sidebar.footer.action` 入口按钮 + `shell.overlay` 全屏浮层 | 渲染成功，侧栏底部出现 Relay 按钮，点开是居中浮层，刷新后重建一致 | 否（U-03） |
| v3 | 待调研结论 | — | — |

### 待验证的机制事实（**尚未定论，禁止写成结论**）

侦察阶段从类型声明读到：`dsh-client-ui-layout/lib/types/client/index.d.ts` 里主框架三根柱子 `sidebar` / `conversation` / `details` **全是 `kind:'single'` 且注释明说已被占、注册进去会 replace outright**；留给第三方的加法位是 `shell.overlay`（`kind:'list'`，注释原文「the additive seat for a frame-wide surface of your own」）与各种插空座位。

**若该结论经独立复核成立**，则「树外第三方插件在 DSH 里做不出常驻主界面，只能做浮层 / 弹窗 / 插空位」是一条 **DSH 渲染能力/机制限制**，属 (i) 桶、属 P4-DM 事实，须如实登记——**不是实现偷懒**。但目前只读了类型注释、未复核官方包的实际做法，故列为待验证。调研已派出（只读 agent，语料 = 本机 39 个一方 client 包）。

## 止损条件预判（§4.4 逐条，**预判不是结论**）

| 止损条件 | 侦察阶段预判 | 批 1 实测 | 何时最终定 |
|---|---|---|---|
| Client Bundle 只能在 DSH monorepo checkout 内构建 | 预判不命中 | **实测不命中**——bundle 手写、零构建链，安装产物与源文件逐字节相同（E-008） | 已定（批 1） |
| 构建配方在清净重跑下不可复现 | 预判不命中 | 未测 | 批 3 |
| Windows 下 Profile 或插件生命周期不稳定 | 未知 | **未命中（初步）**——install / 3 次重启 / 浏览器刷新全程无异常，控制台零 error；卸载清理待批 4 | 批 4 |
| 单个最小面板要求大范围导入未公开内部模块 | 预判不命中 | **实测不命中**——只用 `ctx.slots` / `ctx.remote.$mount` / `ctx.inject` 三个公开面；客户端 bundle **只 require 宿主提供的 `react` / `react/jsx-runtime`**（契约测试改成白名单钉死，CP1 P2 修正了原来"零 bare import"的过强说法）。另有两处**非文档化但官方自用**的形态需一并登记：全局 `window.__ModuleLoader__`（所有官方 client bundle 的入口形态）、把 `Remote(name)` 当普通函数调用来施加装饰器（Node 24 无装饰器语法且本包无编译步骤）——后者有专门回归测试盯着 | 已定（批 1，CP1 后修正措辞） |
| DSH 重启后无法从普通 JSON 重建页面 | 未知 | **未命中（初步）**——3 次重启 + 1 次刷新均重建出同一 `fixture_hash`；列表/详情两屏待批 2/4 | 批 2 / 批 4 |
| 面板必须自行从 `run_status` 推导分组才能渲染 | 预判不命中 | 未测（批 2 的镜像断言才是判据） | 批 2 |
| 用户在对话中明确喊停 | — | 未命中 | 随时 |

## 待验证事实（禁止写成结论）

- F-A ~ F-G 全部为**源码阅读推断**，无一条上机验证过。批 1 探针跑通前，任何一条都不得写进 `review.md` 或 P4 报告。
- 换机重跑（`ssh thinkpad`）的可达性本轮未验；Linux 真机上是否有同版本 DSH、是否需要独立 Home，均未知。
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
