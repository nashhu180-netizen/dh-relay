<!-- dh:v1 · findings.md — 施工发现。🟢 事实与推断分开。 -->
# findings — DHR_26

## DSH rc.7 树外插件事实

研究基线：DeepSeek Harness commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`（`dsh-v0.1.0-rc.7`）。

1. **Host Service**：公开框架入口为 `Service` from `@deepseek-ai/cordis`；`super(ctx, 'relayPilot')` 把实例暴露为 `ctx.relayPilot`。本插件无需导入 DSH RC 私有包。
   > **⚠️ 已被 §12e 取代**：本卡最终**不用** `Service`。`Service` 只是 `ctx.provide` 的糖衣，而 import 它会让插件的可用性依赖安装拓扑。现用 `apply(ctx, config)` + `ctx.provide('relayPilot', api)`，零 bare import。
2. **Profile 安装**：`dsh plugin --profile <name> <pnpm args>` 在 `$DSH_HOME/profiles/<name>` 转发 pnpm；相对路径会锚到调用 cwd。声明 `dsh.bundle.patch` 的依赖被自动加入 `dsh.profile.bundles`。
3. **`--patch` 边界**：它是启动时最后叠加的临时覆盖，适合 probe/disable/re-enable 证据；profile 安装是独立 Home 内的持久依赖与 bundle 层，适合日常复跑。
4. **显式禁用**：配置行支持 `disabled: true/false`。
   > **⚠️ 已被 §15 取代**：原文写「当前只具备配置与静态生命周期证据」——2026-08-20 已补齐动态证据：真 Cordis 下注册→dispose 后服务消失（E-016），以及包外探针对 removed 态的直接取证（E-017）。另注意 `disabled: true` 启动时 `apply()` 不执行，那份 `present:false` 只证明**未注册**，不证明**已清理**。
5. **Client 发现（交 DHR_49）**：Host Loader 的活插件条目若 package.json 声明 `dsh.client.platform='web'` 且 `exports['./client']` 指向可读 bundle，就进入 Client Module Registry；解析锚点是配置树 `ctx.baseUrl`（profile/cordis.yml 所在包）。
6. **Client 产物形态**：rc.7 官方 bundle 由 `window.__ModuleLoader__.load({ id, factory })` 注册；浏览器依赖通过 factory 的 `require` 解析。
7. **安装侧模块解析**：DSH profile boot 会维护一个指向当前 DSH 安装依赖的 module fallback。Host package 因此故意不声明 npm dependency 或 peer copy 的 Cordis。
   > **⚠️ 部分被 §12d/§12e 取代**：fallback 农场真实存在，但**只对物理装进 profile 树的包生效**（Node 按真实路径向上找 `node_modules`）。靠它解析 = 把正确性押在安装方式上。最终改为零 bare import，不再依赖该 fallback。

## 冒烟实测更正的事实（2026-08-18 晚，Windows / dsh 0.1.0-**rc.6**）

> 本节是真机跑出来的，优先级高于上面基于源码阅读的推断。每条都有 `evidence/smoke-rc6/` 下的机器证据。

8. **Cordis 插件导出形态（原实现有 bug，已修）**：`@deepseek-ai/cordis-plugin-loader` 的 `Loader.unwrapExports` 第一步就是 `exports = exports.default ?? exports`。probe 原来同时写 `export const inject` 与 `export default apply`，默认导出是**裸函数**，于是整个模块命名空间被替换成这个函数、`inject` 被静默丢弃，启动时报 `cannot get property "relayPilot" without inject`。正确形态是**不写 default 导出**，让命名空间本身当插件对象（`apply`/`inject`/`name` 均为命名导出）。`test/probe.test.mjs` 用 loader 原样的 unwrap 逻辑把这条钉成回归测试。
9. **`ctx.appExit` 确实存在**：由 `@deepseek-ai/dsh-cmdline` 以 `ctx.provide("appExit", host.exit)` 提供，`ctx.get('appExit')` 可取。一次性 probe 必须调它，否则跑完转录进程仍不退出。已实测：调用后 `dsh` 退出码 0、stderr 全空。
10. **DHR_25 的 list 与 detail 本来就不是一一对应**：`runs-active.json` 列 `0005/0007/0002/0001/0006`，而 detail 文件只有 `0001~0005`。即 `0006`/`0007` 无 detail，`0003`/`0004` 有 detail 却不在 list 里。这是上游样例集的正常形态，不是数据损坏——旧实现把它当错误 `throw`，直接让**整棵插件树加载失败**。
11. **安装渠道 = npm 全局，已升到 rc.7**；`npm root -g` = `C:\Users\nash\AppData\Roaming\npm\node_modules`，registry 为默认 `registry.npmjs.org`，rc.7 就是 `dist-tags.latest`。`npm install -g @deepseek-ai/dsh@0.1.0-rc.7` 改动 530 个包、耗时 3 分钟。rc.6/rc.7 双快照与对差见 `evidence/smoke-rc7/`：**195→195 包，无增无删，186 个 `@deepseek-ai/*` 自家包同步 rc.6→rc.7，安装根未变，未解析依赖数恒为 2**。
11b. **本插件对 rc.6→rc.7 的变动不敏感**：两个版本下的 probe 转录**逐字节完全一致**（`fixture_hash` 同为 `67fb18b3…`）。rc.7 上 install → probe → disable → enable → remove → 重新 add 全套通过；remove 用 `--dump-config` 验证（组合树 313 行、0 行 relay），重装后回到 325 行。
11c. **`absence-probe` 有个设计限制**：它打包在插件内部，插件被 `remove` 后它自己也没了，报 `Cannot find package`。**只能验 disabled，验不了 removed**；removed 走 `--dump-config` 前后对比。
12. **首次进入全新 `DSH_HOME` 要建软链农场，中断会留下不自愈的损坏**：`profiles/node_modules/` 下会出现一个**空目录**（非软链），下次启动直接 `exists and is not a symlink` 硬失败，须手工删除。上机第一次 boot 不要打断。
12b. **耗时随 profile 大小差异极大，别按 smoke 的经验估 web**：`smoke`（只有 `dsh-base`）约 510 条软链 / 52 秒；`web`（多带 `dsh-web-app`）跑满 300 秒才建到 191 条就被超时中断，并如期留下损坏空目录 `@aws-crypto/supports-web-crypto`。**复现结论**：这个陷阱是真的，且 web profile 必须给足时间或干脆放后台，不能套用一个几分钟的超时。修复方式是整个删掉 `profiles/node_modules/` 重建（`profiles/<name>/` 的配置不受影响，不必重装插件）。
12c. **目录安装 = `link:` 依赖，不是拷贝**：`dsh plugin --profile web add ./src/dsh-host` 在 profile `package.json` 里写的是 `link:D:/.../src/dsh-host`（软链到源码），而 tgz 安装是真拷贝落进 profile 树。
12d. **🔴 目录安装会打断 Cordis 解析——根因已彻底修掉（改法见 12e）**。现象：`dsh --profile web --patch ...` 硬失败于 `Cannot find package '@deepseek-ai/cordis' imported from D:\...\src\dsh-host\index.mjs`（稳定复现两次，证据 `evidence/target-web/link-install-failure.txt`）。机制：fallback 农场 `profiles/node_modules/@deepseek-ai/cordis` **确实存在**，但 profile 里的插件是指向源码树的软链，而 Node 的 ESM 按**软链的真实路径**向上找 `node_modules`——于是从 `src\dsh-host` 一路走到盘根，永远走不到 `profiles/node_modules/`。**结论：「不打包 Cordis、靠 profile module fallback 解析」这个设计，只在包被物理装进 profile 树时成立——它把正确性押在了安装拓扑上。**
12e. **✅ 改用公开的 `ctx.provide`，插件现在零外部依赖，两种装法都能跑**。`index.mjs` 原来唯一的外部依赖是 `import { Service } from '@deepseek-ai/cordis'`。核实：`provide` 本就被 mixin 到 context 上（`this.mixin("reflect", ["get","set","provide","accessor","mixin"])`，`cordis/lib/index.js:735-741`），**`ctx.provide(...)` 就是公开写法**；DSH 自己注册 `appExit` 用的正是它（`dsh-cmdline/lib/index.js:29`）。Cordis 的 `Service` 构造函数内部干的也只是 `ctx.reflect.provide(name, self, check)`，且 `provide` 包在 `ctx.fiber.effect(...)` 里、卸载自动清理——两者生命周期语义一致。改造后插件形态为 `apply(ctx, config)` + `ctx.provide('relayPilot', api)`，运行时文件**零 bare import**（`test/package-contract.test.mjs` 钉死）。实测：此前必然失败的 `dsh plugin add ./src/dsh-host` 目录安装现在退出码 0，且与 tgz 装法的 probe 转录**逐字节相同**，`fixture_hash` 仍为 `67fb18b3…`。
12f. **更正一条我先前的错判**：我曾记「`ctx.reflect` 是否稳定公开 API 没把握」。这是错的——`ctx.provide` 是文档化的公开面，且我在查 `appExit` 时就已亲眼见过 `ctx.provide("appExit", host.exit)`，只是没把两件事连起来。第一轮复核（grok）指出了这一点，核实成立。

## 实现事实

- Host 从 DHR_25 fixture 原样构造 `{list, details}`：**两个模型之间不做任何交叉校验、不推导任何字段**；list 里缺 detail 的 run 照常列出，`getRun()` 返回 `null`，缺失情况记进 `snapshot.diagnostics`（`detail-missing` / `detail-unlisted`）。不根据 `run_status` 生成 `group`、节点或状态。
- 读哪些文件完全由配置决定：`listFixture`（必填）+ `detailFixtures`（显式数组）。**没有目录扫描，没有「自动挑一份 list」的启发式**——往 fixture 目录里丢文件不会改变行为。
- `canonicalJson` / `sha256Canonical` / `fixture_hash` **不是无消费者的死代码**（我曾误判为无人使用）：`fixtureHash()` 是服务公开方法，probe 转录带 `fixture_hash`，`scripts/verify-transcript.mjs` 用 `canonicalJson` 做字段级同一判定，四轮真机证据靠这个 hash 对拍（均为 `67fb18b3…`）。
- 服务注册走 `ctx.provide('relayPilot', api)`，不继承 `Service`；`api` 只有五个只读查询方法，无写路径、无活对象、无 dispose 句柄外泄。
- 对外返回值经过 JSON clone；内部 snapshot deep-freeze；不存在 Cordis Context、Fiber、活动对象或函数穿过服务边界。
- Host 不注册 route、event、timer、process handler；服务行由 fiber 拥有，`ctx.provide` 包在 `ctx.fiber.effect(...)` 里，插件卸载时自动释放。
- `run_id` 支持任意非空字符串；特殊属性名使用 null-prototype map 与 own-key 查询，避免原型污染。

## 未验证事实（禁止写成结论）

- ~~用户本机当前是否仍为 rc.6~~ → 升级前实测为 rc.6，**现已升至 rc.7**（npm 全局渠道）。~~B-10 预采文件是否存在/未漂仍未核~~ → **2026-08-20 已核**：预采件仍在 `<pilot>/evidence/dsh-version-baseline/rc6-before-upgrade.txt`，其 194 个内置包与本卡自采的 `evidence/smoke-rc6/dsh-snapshot-rc6.json` **逐包同名同版本**，后者多出的第 195 个仅为主包 `@deepseek-ai/dsh@0.1.0-rc.6`（预采件按设计不含主包）。两份升级前快照互相印证、无漂移；证据链登记为「B-10 预采前快照 ∧ 本卡实采前快照（二者一致）+ 本卡升级后快照」（E-012）。
- ~~rc.7 实际升级结果与包差异~~ → 已做，见上 §11 与 `evidence/smoke-rc7/dsh-upgrade-rc6-to-rc7-diff.json`。
- ~~Windows Profile 安装、disable/re-enable/remove 后的真实服务清理~~ → 已实测：rc.7 上 install → probe → disable → enable → remove → 重新 add 全套通过。
- ~~DSH 进程里首次 `ctx.relayPilot` probe 输出~~ → 已实测，转录与 fixture 逐字段一致（`transcript-report.json` = `IDENTICAL`）。
- ~~上述冒烟跑在临时 `DSH_HOME` 与 `smoke` profile 上，不是目标机 profile~~ → 目标机接线**已完成**：DevPlan 指定的独立 `DSH_HOME` + `web` profile，目录安装与 tgz 安装两种形态均通过，见 `evidence/target-web/` 与 `evidence/zero-import/`。
- ~~第二轮换人交叉评估仍未做~~ → **两轮均已完成**（轮 1 claude-grok / grok-4.5，2026-08-18；轮 2 codex-ninth / gpt-5.6-sol `--sandbox read-only`，2026-08-20，含一次返工收敛复检），逐条处置见 `review.md` 与本文件 §15~§19。**verify 收口与用户签收仍未做**。

## 交给 DHR_49 的硬输入

`dsh.client` + `exports['./client']` + profile `ctx.baseUrl` 扫描锚点 + module-loader wrapper + profile bundle patch，是树外 Client 的最小路径；不需要 checkout/fork DSH monorepo。真实 Windows 加载仍须目标机补证。

## 侦察落档补齐：Client 类型定义位置（2026-08-20，第二轮复核 P1）

> 任务卡「侦察落档」逐字要求登记「本机可用类型定义位置」，前一版漏了这一项。**这是 DHR_49 的开工输入，缺则 DHR_49 不得开工**，故单列一节。以下路径与内容均在本机 rc.7 安装树上实读核过。

13. **类型定义在哪**（根 = `C:\Users\nash\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\`）：

    | 文件 | 里面是什么 |
    |---|---|
    | `dsh-client-modules/lib/types/client/manifest.d.ts` | Client 侧的**线上契约**：`WebBootEntry`（`id` = 包名、`url` = `/plugins/<id>/client.js?rev=<rev>`、`rev` = bundle 内容哈希、`inject`、`immediately`）、`WebBootGraph`、`BootManifest` / `BootModuleRow` / `BootPluginRow`、`ClientModuleLoader` / `ClientModuleRecord` / `ClientPluginHandoff` / `DshWindow`；并 `declare module '@deepseek-ai/cordis'` 把 `ctx.modules` 挂进 Context |
    | `dsh-client-modules/lib/types/client/index.d.ts` | 标准 `./client` 导出面：`ClientModuleSystem`、`parseBootManifest`、`apply(ctx: Context)`；注释写明 module system 由 shell kernel 在 cordis 之前建好，插件面只负责把它 `provide` 成 `ctx.modules` |
    | `dsh-client-modules/lib/types/client/system.d.ts` | `ClientModuleSystem` 实现面类型 |
    | `dsh-client-modules/lib/types/index.d.ts` | 宿主侧（Node 半边）类型，与 Client 半边同源 |

14. **官方 client 插件的声明实例**（本机 rc.7 树上共 **39** 个包声明了 `dsh.client`）。以 `@deepseek-ai/dsh-api-gateway@0.1.0-rc.7` 为样板，逐字如下：

    ```json
    "dsh": { "client": { "inject": ["@deepseek-ai/dsh-typert-registry", "@deepseek-ai/dsh-client-connection"], "platform": "web", "immediately": true } },
    "exports": {
      ".":        { "types": "./lib/types/index.d.ts",        "default": "./lib/index.js" },
      "./client": { "types": "./lib/types/client/index.d.ts", "default": "./lib/client.js" },
      "./package.json": "./package.json"
    }
    ```

    即 DHR_49 的最小形状 = 包声明 `dsh.client.platform='web'` + `exports['./client']` 指向可读 bundle；`inject` 是**信息性**的图元数据（真正的边由各包 `dsh.client` 声明经 entry 创建到达 fiber），`immediately: true` 表示一阶段预取。**不需要 checkout 或 fork DSH monorepo**。

## 第二轮换人复核（codex / gpt-5.6-sol，只读）的处置（2026-08-20）

15. **卸载清理的证据补硬**（复核 P1）：此前 `absence` 那批 `present:false` 是 Host **以 `disabled: true` 启动**时取的——`apply()` 压根没跑，只能证明「没注册过」，证明不了「注册了再卸载会清干净」。补两条独立证据：
    - `scripts/service-lifecycle-probe.mjs`：用本机 rc.7 的真 Cordis 建 Context → `ctx.plugin(host)` → 读到活服务（`fixtureHash` 与四轮转录同为 `67fb18b3…`、5 条 run）→ `fiber.dispose()` → `ctx.get('relayPilot')` 变回 `undefined`。结论 `CLEANED`，退出码 0。
    - 新包 `@personal/dsh-relay-absence-probe`（`src/dsh-absence-probe/`）：把 absence 探针搬到 Host **包外**，于是 `dsh plugin remove` 之后它自己还活着，能直接对 removed 态发言。实测三态：装着 → `present:true` 退 1（正控）；remove 后 → `present:false` 退 0（**真 removed 证据**，不再只有 `--dump-config` 行数）；装回 → `present:true` 退 1。
16. **转录校验器不再能自证**（复核 P1）：`verify-transcript.mjs` 原来从转录自己的 `snapshot.detail_fixtures` 取待核清单，数组为空时 `every(...)` 空真、`degrade_honoured` 也空真，于是「只带 list、把 details 和 diagnostics 全删掉」的转录也能判 `IDENTICAL`。改为期望清单由调用方给（`--expect-list` / `--expect-details`），并加：转录自称读的文件集必须等于期望集、`details` 的 key 集不得多出、缺 detail 的 run 集必须由磁盘算出后对上、`fixture_hash` **从磁盘重算**再比、`detail_missing_returns_null` 必须严格为 `true`。三条变异对照全部见红：掏空 details→`DIFF`、改 `fixture_hash`→`DIFF`、篡改某条 detail 字段→`DIFF`；真转录仍 `IDENTICAL`。
17. **「零 bare import」契约测试补漏**（复核 P2）：原正则只认字面量静态 import，`import(expr)` / `createRequire()` / `require()` 全是开着的门；运行时文件清单还是手写死的。改为从 `package.json` 的 `files` 派生运行时文件清单（并加一条断言：包根下每个 `.mjs` 都必须在清单里），四种写法一律禁。四条变异逐条见红（动态 import / createRequire / require() / 新增未登记的 `.mjs`）。
    > **变异测试当场逮到我自己写的 bug**：第一版断言里的 `\b` 被写成了字面的**退格字符 0x08**（`/\bcreateRequire\b/` 实为 `/<0x08>createRequire<0x08>/`），所以 createRequire 那条变异体一开始**没见红**。修掉后四条全红。教训：断言写完必须跑变异，「测试全绿」不等于「断言在咬」——这已是本卡第二次栽在同一件事上（第一次是合成 fixture 全绿、真数据灭树）。
18. **漂移检查改逐字节**（复核 P2）：`check-drift.ps1` 原先先按 UTF-8 解码并归一化 CRLF 再哈希，不同字节可能被判相同；且施工者自述的「新增一条契约测试」实际不存在。改为直接哈希原始字节（行尾差异仍报，但标注为 `line endings only`），并在脚本头写明它是**收口必跑的采集命令、不是单测**——不再宣称有自动闸。两包（`dsh-host` + `dsh-absence-probe`）统一覆盖；文件数随本轮新增脚本变化，最近一次实跑为 **27 个文件逐字节一致**（文件数随脚本增删变化，以实跑输出为准）。
19. **包内 overlay 的自相矛盾注释已改**（复核 P2）：`absence.patch.yml` 原注释还写着「或在 `plugin remove` 之后运行」，而这条路径必然报 `Cannot find package`。改为只声明它管 disabled 态，并指向包外新探针。

## 复跑时容易踩的一条（2026-08-20 主会话实测）

20. **`fixtureRoot` 是在 boot 时从 `RELAY_PILOT_FIXTURE_ROOT` 解析的，不是安装时固化的**。不设该环境变量直接 `dsh --profile web --patch probe.patch.yml`，Host 会 fail-closed 报 `fixture-read-failed: cannot read <cwd>\runs-active.json` 并让整棵插件树加载失败。这是设计使然（不猜目录、不扫描），但意味着**每次跑探针都要带上这个变量**，不是只在安装那一步带。README 的目标机流程已补一条显式警告。
