# review-brief — DHR_49 CP4（批 4 小审）

> **你是复核 worker，不是主控。** 只读不改。禁止再拉终端派活 / 起 watcher，禁止调 AskUserQuestion 或以任何方式回头问用户。规则全在本 brief 里——**别自己去加载 dev-harness skill、别自加「先读一下流程规则」这类步骤**，这份就是你的完整指令集。卡住 / 缺信息，就把 `blocked` 连同缺什么写进结论里，不要停在原地。

## 你的任务

对 DHR_49 **批 4（详情屏 + 装卸清理 + DM5b 纯 JSON 断言）**做**只读**复核，按级别逐条给发现。

## 范围（只读，零写权）

| 路径 | 是什么 |
|---|---|
| `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-client\lib\client.js` | 浏览器 bundle：详情屏、棒序表、列表卡片可点、浮层布局、探针 `record()` |
| `…\src\dsh-client\lib\index.mjs` | 宿主半边：本批新增 `get(runId)` |
| `…\src\dsh-client\lib\typert.host.js` / `typert.remote-client.js` | 两侧描述符：本批新增带参 invocation `relayPanel/get` |
| `…\test\dsh-client-detail.test.mjs` | 详情屏断言（11 条） |
| `…\test\dsh-client-unload.test.mjs` | 卸载清场断言（4 条） |
| `…\test\dsh-client-read-model-purity.test.mjs` | **P4-DM5b 纯 JSON 断言（12 条）——本批最新、最需要你盯** |
| `…\test\helpers\load-client-bundle.mjs` | 在 Node 里跑浏览器 bundle 的夹具 |
| `…\scripts\mutate-dsh-client-detail.mjs` / `mutate-dsh-client-purity.mjs` | 两份变异脚本（22 条 / 12 条） |
| `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\evidence\dhr49\batch4\` | 本批证据：三态转录 `lifecycle.txt`、截图若干、`hmr-disposer-transcript.md` |
| `D:\MyFiles\ai-workflow\dh-relay\docs\modules\dh-relay\workspace\DHR_49\` | `brief.md` / `task_plan.md`（批 4 那一节）/ `progress.md`（E-033~E-055）/ `findings.md`（F-008~F-011） |

**范围外**：`src/dsh-host/`（DHR_26 产物，本卡声称一行未改）、`src/cli/`、`src/read-model/`、`src/render/`、批 1/2/3 的产物、其它任务卡工作区。范围外发现只记一行，不展开、不动手。

**你可以跑只读命令**：`node --test <上述测试文件>`、`node scripts/mutate-dsh-client-detail.mjs`、`node scripts/mutate-dsh-client-purity.mjs`、读文件、`git log`。
**不要**跑 `dsh plugin add/remove`、不要起 DSH、不要 `npm pack`、不要改任何文件。

## 本批声称做到了什么（你要核的就是这些）

1. **详情屏**：列表卡片可点 / 可键盘（Enter、空格，Tab 不触发）进入详情；取数走新增的 `ctx.remote.relayPanel.get(runId)`；缺 detail 的 run 答 `null` 不抛、不灭树。
2. **棒序归源头**：接力计划表按 `nodes[]` 的**源顺序**逐行打印——不按 `depends_on` 拓扑重排、不把在跑的那棒提前、不重新编号；`depends_on` 只被打印。两条镜像断言钉住。
3. **词表与 CLI 一致**：面板与 CLI `show` 对同一 fixture 的 role / node_status 译法逐节点相同。
4. **浮层布局**：所有屏根走共享 `PAGE_PROPS`（带 `data-conversation-composer-overlay`），底部留白来自 `calc(var(--dsh-composer-height,152px) + 16px)`，不写死像素。
5. **卸载清场（DM4b 客户端半边）**：disposer 撤 Remote 贡献、摘 `<style data-plugin-css>`、`delete` 掉 `window.__RELAY_PANEL_PROBE__`。
6. **装卸三态（DM4b）**：`--dump-config` 505 → 502 → 505，A 与 C 逐字节相同，A 与 B 的 diff 恰好只有面板 3 行。
7. **P4-DM5b**：面板消费路径上拿到的是脱离的纯 JSON——无函数、无 Cordis 活对象；宿主网关侧与客户端消费侧各验一遍。
8. 12 条 purity 断言 + 12 条变异全见红；22 条详情/卸载变异全见红；全量 213/213。

## 专挑这几类（按此顺序）

**A. DM5b 那份断言是不是在空转（最要紧，请花最多时间）**

被测的东西本来就是从 JSON 文件读出来的，「它是纯 JSON」几乎不用做什么就成立。所以请具体回答：

- `purityViolations()` 有没有漏掉某类"活对象"？举得出反例最好——什么东西能穿过它但显然不该算纯 JSON？
- `isPlainRooted()` 用「原型链根不根」代替「`=== Object.prototype`」来跨 realm，这个放宽有没有代价？`Object.create(Object.create(null))` 之类会不会被误判成纯？会的话要紧吗？
- 走到非普通对象就**停止下潜**（不进去看）——会不会因此漏报嵌得更深的东西？
- `intoThisRealm()` 是为了让 `deepStrictEqual` 能跨 realm 用。它会不会**把本该红的情形洗白**？
- §C 的镜像断言（往 Read Model 里掺活对象必须见红）覆盖够不够？`mutate-dsh-client-purity.mjs` 的 12 条变异里，有没有哪条其实是被**别的**断言逮住的（而不是被 DM5b 那几条）？
- 文件头声称「往返深等被 walker 完全包住，不是独立的第二条证据」——**这个自述对不对**？有没有反例说明往返能逮住 walker 逮不住的东西？

**B. 证据与结论对不对得上**

- `progress.md` E-033~E-055 每条是否真能复跑？有没有"结论比证据强"的地方？
- `evidence/dhr49/batch4/lifecycle.txt` 里那段「这份转录证不到什么」的自述——**是否诚实完整**？`--dump-config` 的行数差能证明"清理"吗？自述有没有替自己留后门？
- `hmr-disposer-transcript.md` 声称用"探针对象身份变了"排除了"页面其实整个重载了"这个替代解释——**这个排除成立吗**？
- E-054 用「刷新前往 window 写标记、刷新后读到 null」证明确实刷新了——有没有别的解释？

**C. 行为回归与隐性逻辑**

- 本批往 `client.js` 加了不少东西，有没有削弱既有断言（尤其批 2 的分组镜像断言）？
- `record()` 改成 `detail === undefined ? { stage } : { stage, detail }` —— 有没有副作用？`probe[stage]` 那一行的语义变了吗？
- 详情屏的 React hook（取数、`alive` 守卫、`loadRun` 稳定身份）有没有竞态或泄漏？切 run 时旧请求回来会不会盖掉新的？
- `get(runId)` 的参数 codec 两侧（真 zod vs 手写 `{parse}`）判决会不会分叉？

**D. 断言是否在咬**

- 两份变异脚本覆盖够不够？有没有明明该拦却没拦的写法（想到就直说，不必真去改）。
- `test/dsh-client-detail.test.mjs` 里那条 `roots === 7` 的源码级断言——它是"数出来的魔数"，将来加一屏就会红。这是特性还是坑？

**E. 目标范围 / 权限 / 安全**

- 有没有做超出 `task_plan.md` 批 4 的事？`src/dsh-host/` 真没动？（这些目录不在任何 git 仓库里，要靠读代码与 `progress.md` 判断）
- 有没有引入写权（本卡明确只读）？
- 有没有凭据、绝对路径、机器名进入**入仓**的产物（`docs/modules/dh-relay/workspace/DHR_49/` 下的文件）？

**F. 过早收口**

- 有没有把"未验证"写成"已成立"？
- `task_plan.md` 4.2 写的是 `relayPanel.detail(runId)`，实现叫 `get(runId)`。这个偏差有没有被如实登记？登记的位置对不对？

## 输出格式（直接把结论文本返回，不要写文件）

```
## 结论
<approved / changes-requested / 需人裁决>

## 发现
| 级别 | 位置(file:line) | 问题 | 为什么是问题 | 建议 |
|---|---|---|---|---|
| P0/P1/P2/P3 | | | | |

## 我核过但没问题的点
- <逐条列，让主控知道你的覆盖面；"全部一致"要写明扫了什么>

## 范围外发现（只记不做）
- <一行一条>
```
