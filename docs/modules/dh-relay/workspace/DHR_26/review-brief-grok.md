# review-brief（第一轮 · 独立复核） — DHR_26 树外 Host Plugin

> 你是**复核 worker**。零上下文：读这一份就够，不要去加载任何流程框架、skill 或其他规范文档。
> **只读不改**：不要修改任何代码或文档。你的产出只有一份结论（见文末「输出」）。
> 不要替主控做验收裁决，不要勾任何签名区。只写事实与级别。

## 一、这是什么

`dh-relay` 是一个「接力执行范式 Runner」。P4 阶段要做一个最小 Pilot：把上一张卡（DHR_25）**冻结**的只读数据（fixture）通过一个树外插件，接进 DeepSeek Harness（DSH，一个基于 Cordis 框架的终端 AI 工作台）。

本卡 DHR_26 只做 **Host 侧**：一个**只读**的 Cordis Service，把 DHR_25 的 fixture 原样透传给 DSH，暴露为 `ctx.relayPilot`。

**任务卡的终点要求（这是判断"该不该做"的唯一标尺）**：
- 从 DHR_25 冻结 fixture 读取，**原样透传**。不推导、不派生任何字段。
- 只读。不注册 route / event / timer / process handler，不提供任何写命令。
- 不把 Cordis 打进包（避免运行时出现第二份框架身份），而是解析 DSH 安装方自己那份。
- 返回值必须是脱离的纯 JSON（不能让 Context、Fiber、函数等活对象穿过服务边界）。

## 二、代码在哪

仓库 worktree：`D:\MyFiles\ai-workflow\dh-relay-wt\DHR_26-host-fix`
插件源码：`docs/modules/dh-relay/workspace/DHR_26/artifacts/relay-control-pilot/src/dsh-host/`

同一份代码已被 materialize 到仓外权威落点（**那里能跑测试，因为 fixture 在隔壁**）：
`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-host\`
真 fixture：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\testdata\fake\`

跑测试（**不需要设任何环境变量**）：
```
cd D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot
node --test src/dsh-host/test/*.test.mjs
```

过程记录在 `docs/modules/dh-relay/workspace/DHR_26/` 下的 `findings.md` 与 `progress.md`；
机器证据在同目录 `evidence/`（`smoke-rc6/`、`smoke-rc7/`、`target-web/` 三批，各有 README）。

## 三、本轮改了什么（施工者自述，**请勿采信，自己核**）

上一版代码单测 11/11 全绿，但一接真 fixture 就整棵插件树加载失败。本轮修了四件事：

1. **砍掉自动发现与关联断言**。旧版递归扫描整个 fixture 目录、按「runs 数降序 + 路径字典序」自动挑一份 list、并强制要求 list 里每个 run 都必须有对应 detail（否则 throw）。但 DHR_25 的真 fixture 本来就不是一一对应：`runs-active.json` 列了 `0005/0007/0002/0001/0006`，而 detail 文件只有 `0001~0005`。改为：显式配置 `listFixture` + `detailFixtures`；缺 detail 的 run 照常列出、`getRun()` 返回 `null`、缺失记入 `snapshot.diagnostics`；两个模型之间不再做任何交叉校验。
2. **修 probe 的导出形态**。Cordis 的 loader 在 apply 插件前会执行 `exports = exports.default ?? exports`。旧版 probe 同时写了 `export const inject = [...]` 和 `export default apply`（裸函数），导致命名空间被替换、`inject` 被丢弃，报 `cannot get property "relayPilot" without inject`。改为不写 default 导出。
3. **接上 `ctx.appExit`**，让一次性 probe 跑完能退出进程。
4. **搬入四个证据采集件**：`scripts/snapshot-dsh.mjs`、`scripts/compare-snapshots.mjs`、`scripts/verify-transcript.mjs`、`absence-probe.mjs`。

另外把测试改成**必须读真 fixture**（找不到硬失败、不 skip），现 28/28。

## 四、请重点复核的点

### A. 正确性
- `fixture-store.mjs` 的「原样透传」是否真的原样？有没有残留任何派生、排序、补默认值、字段改名？
- `snapshot.diagnostics` 的两个 code（`detail-missing` / `detail-unlisted`）语义是否自洽？有没有漏掉的降级场景？
- 深冻结 + 每次出参 `cloneJson` 的隔离是否有洞？活对象有没有可能穿过边界？
- `run_id` 为 `__proto__` 等特殊值时的原型污染防护是否真的成立？
- `normalizeFixtureList` 接受数组 / JSON 数组串 / 分隔符串三种形态，有没有歧义或注入风险（尤其 Windows 路径含 `:`，而 `path.delimiter` 在 win32 是 `;`）？

### B. 测试形状（**本轮最想被挑战的地方**）
上一版失败的根因是「测试只跑自造 fixture，一次没碰真的」。本轮改成强制读真 fixture。请判断：
- 现在的测试是否真的能挡住同类问题复发？
- `test/probe.test.mjs` 里复刻了 Cordis loader 的 `unwrapExports` 逻辑作为回归测试——这种「复刻上游实现」的测试是否可靠？上游改了会怎样？
- 有没有该测而未测的路径？有没有测了但断言太弱的？

### C. 过度设计 / 冗余
本轮的立场是「一个只读 Pilot 应该宽容读取 + 缺失时降级，而不是 fail-fast 断言堆」。请判断：
- 还有没有残留的过度设计？（例如 `canonicalJson` / `sha256Canonical` / `fixture_hash` 目前没有任何消费者）
- 反过来，有没有**砍过头**的地方——被删掉的校验里，有哪些其实是该留的？

### D. 一个**未解决**的设计问题（请给明确倾向）

接线时发现：用 `dsh plugin --profile web add ./src/dsh-host`（**目录安装**）装这个插件，启动会硬失败：

```
Cannot find package '@deepseek-ai/cordis' imported from
D:\...\relay-control-pilot\src\dsh-host\index.mjs
```

机制：目录安装在 profile 里记的是 `link:` 依赖（软链到源码树）。Node 的 ESM 按模块的**真实路径**向上找 `node_modules`，从源码目录一路走到盘根都没有 `node_modules`，因此够不到 DSH 在 `profiles/node_modules/` 准备的 cordis fallback 农场（该农场里 cordis 确实存在）。装 `npm pack` 出来的 tgz 则是真拷贝落进 profile 树，能解析，实测通过。

**施工者当前的处置是「改文档」**：把安装流程改成必须装 tgz，并在 README 加警告。**插件代码一行没动。**

但施工者也找到了一条**真修法**：`index.mjs` 里唯一的外部依赖就是 `import { Service } from '@deepseek-ai/cordis'`。而翻 Cordis 源码，`Service` 构造函数自己干的事就是 `self.ctx.reflect.provide(name, self, check)`；`ctx.reflect.provide` 包在 `ctx.fiber.effect(...)` 里并返回 disposer，卸载时自动清理。也就是说：不继承 `Service`、改用 `ctx` 上的 `provide` 注册，插件就**零外部依赖**，两种装法都能跑。

**请给出明确倾向，并说明代价**：
1. 维持现状（只改文档，锁死 tgz 装法）；
2. 改用 `ctx.reflect.provide`，去掉最后一个 import；
3. 其他方案。

需要一并评估：`ctx.reflect` 是否属于稳定公开 API（施工者只看到 Cordis 自家 `Service` 在用，未见文档承诺）；改了之后任务卡与 `test/package-contract.test.mjs` 里钉的 `super(ctx, 'relayPilot')` 形态要怎么办；以及丢掉「源码目录装 + 改代码即时生效」的开发循环，对后续阶段是否是可接受的代价。

## 五、输出

把结论写成 Markdown 打印到 stdout（**不要写文件、不要改代码**），结构如下：

- 每条发现给级别：**P0**（阻断，必须修）/ **P1**（应修）/ **P2**（建议）/ **NIT**（吹毛求疵）
- 每条附：文件:行号 + 事实 + 为什么是问题 + 建议
- 单列一节回答上面 D 的设计问题，给出你选哪个方案及理由
- 最后单列一节：**「施工者自述里有哪些说法你核不实或不同意」**

只写事实与级别，不做验收裁决。
