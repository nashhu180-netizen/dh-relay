# review-brief — DHR_49 CP2（批 2 小审 · **补派**）

> **你是复核 worker，不是主控。** 只读不改。禁止拉终端派活 / 起 watcher，禁止调 AskUserQuestion 或以任何方式回头问用户。规则全在本 brief 里——**别自己去加载 dev-harness skill、别自加「先读一下流程规则」这类步骤**，这份就是你的完整指令集。卡住 / 缺信息，就把 `blocked` 连同缺什么写进结论里，不要停在原地。

## 先说清楚你的处境：这是一次**补派**

`task_plan.md` 的 CP2 检查点原文是两个动作——「派 fresh 小审本批 diff；**然后停下**，请用户亲跑并表态」。当时**只做了后半**（用户亲跑并确认），前半的 fresh 小审**从来没派过**，`review.md` 的 CP2 行至今是空的。这个漏洞是轮 2 换人复核查出来的。

所以你现在看到的树**不是批 2 当时的树**——批 3、批 4 以及三轮复核的返工都已经落在上面了。这不影响你的任务，但影响你的口径：

- 你要核的是**批 2 那部分产出的当前状态**，不是考古当时的快照。
- 如果你发现某处「看起来批 2 当时应该是错的，但后来被别的批次顺手修好了」，**照记**，标明是后修的。
- 批 2 之后对批 2 文件的改动本身也在你范围内——尤其 `test/dsh-client-grouping.test.mjs` 在 2026-08-21 刚被改过一次（词表期望值从手抄常量改成从 CLI 定义原文取），那是轮 2 复核带出的返工，**你是第一个看它的独立眼睛**。

## 这张卡是什么

DHR_49 是 dev-harness **标准级**任务卡：在 DSH（`0.1.0-rc.7`）里做一个树外客户端插件 `@personal/dsh-relay-panel`，渲染**只读**的 Relay 面板。数据来自 DHR_25 冻结的 fixture，经 DHR_26 的宿主插件提供。代码不在 git 仓库里（在 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\`），只有文档入仓。

**批 2 = 列表屏**，对应验收判据 **P4-DM6**。这一批被本卡自称为「最不可替代的产出」，理由是：分堆与排序**由源头 `group` 字段给**，客户端一律不得从 `run_status` 推导——CLI 是单客户端时这条约束是自证的（写它的人就是定它的人），DSH 面板是第一个零共享代码的独立客户端，所以这里才是它第一次被真正证伪的机会。

## 范围（只读，零写权）

| 路径 | 是什么 |
|---|---|
| `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-client\lib\client.js` | 浏览器 bundle：**`groupRuns()`**、列表屏渲染、样式注入 |
| `…\test\dsh-client-grouping.test.mjs` | 批 2 的镜像断言（7 条）——**本批核心** |
| `…\test\helpers\cli-labels.mjs` | 2026-08-21 新增：从 CLI 定义原文取词表 |
| `…\test\dsh-client-cli-vocabulary.test.mjs` | 2026-08-21 新增：证上面那个取值器不是空转（5 条） |
| `…\scripts\mutate-dsh-client-grouping.mjs` | 批 2 变异脚本（6 条） |
| `…\scripts\mutate-cli-vocabulary.mjs` | 2026-08-21 新增（6 条）——**它会就地改仓内真文件再恢复，你只读它的代码，判断那三道保险够不够，不要跑它** |
| `…\src\render\text.mjs` | CLI 那侧的词表与分组渲染（**只读参照，本卡范围外，不许改**） |
| `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\evidence\dhr49\batch2\` | 批 2 真机证据：三次渲染截图等 |
| `D:\MyFiles\ai-workflow\dh-relay\docs\modules\dh-relay\workspace\DHR_49\` | `task_plan.md` 批 2 那一节（2.1~2.5）、`progress.md`（E-011~E-032 是批 2 时段）、`findings.md`、`review.md` |
| `D:\MyFiles\ai-workflow\dh-relay\docs\modules\dh-relay\dev_plan\P4-DSH工作台最小Pilot-开发方案.md` | **DM6 与 DM3 判据原文在这里** |

**范围外**：`src/dsh-host/`、`src/cli/`、`src/read-model/`、批 1/3/4 的独有产物、其它任务卡工作区、`dsh-home/`（**有凭据文件，绝对不要读**）。范围外发现只记一行。

**可以跑的只读命令**：`node --test test/dsh-client-grouping.test.mjs`、`node --test test/dsh-client-cli-vocabulary.test.mjs`、`npm test`、`node scripts/mutate-dsh-client-grouping.mjs`、读文件、`git log`。
**不要**：改任何文件、跑 `scripts/mutate-cli-vocabulary.mjs`（它会写仓内文件）、`dsh plugin add/remove`、起 DSH、`npm pack`、`npm install`。

## 批 2 声称做到了什么（你要核的就是这些）

1. **`groupRuns()` 只读 `group`**：分节顺序 = 各 group 首次出现的顺序，节内成员保持源顺序；代码里分组函数体内**不得出现 `run_status`**（有一条源码级切片断言钉着）。
2. **两条镜像断言**：①改 `group` 必须移动；②只改 `run_status` 而 `group` 不动，渲染模型**逐字节相同**。
3. **词表外的 `group` 自成一节**，标题原样打印，不翻译不改写。
4. **与 CLI 共用一套词表**（2026-08-21 返工后：期望值从 CLI 定义原文取，不再手抄）。
5. 6 条变异全见红，未变异正控全绿。

## 专挑这几类（按此顺序）

**A. 镜像断言是不是真的会咬（最要紧）**

- 断言②「只改 `run_status` 渲染模型逐字不变」——**它有没有可能是恒真的**？也就是说，fixture 里 `group` 与 `run_status` 是不是本来就一一对应？如果对应，这条断言证不到任何东西。**去 fixture 里数**，找出至少一个两键分叉的样本，或者报告找不到。
- 源码级切片断言（切 `groupRuns` 函数体扫 `run_status`）：切片边界是 `source.indexOf('\n\t\t}', start)`。**这个边界靠谱吗**？函数体里出现同样缩进的闭合花括号会怎样？切早了会不会漏扫？
- 6 条变异够不够？想得出「明明该拦却没拦」的写法就直说（不必真改）。

**B. 2026-08-21 那次词表返工（你是第一个独立看它的人）**

- `test/helpers/cli-labels.mjs` 用正则从 `src/render/text.mjs` 里抠词表。**这个取值器有没有可能悄悄空转**？比如解析出部分结果就当通过、或者某种写法下静默漏掉一半的键。
- `dsh-client-cli-vocabulary.test.mjs` 声称证明了「取值器真在读文件」。**这个自证成立吗**？有没有它绿了但取值器仍可能空转的情形？
- §3 那条「演算」——不真改文件，而是在内存里改一份源码字符串再解析，据此断言「若 CLI 这样改，面板断言必然见红」。**这个推理链有没有缺环**？
- `scripts/mutate-cli-vocabulary.mjs` **会就地改仓内真文件再恢复**（备份 + try/finally + 收尾 sha256 校验三道保险）。**只读它的代码**：三道保险够不够？有没有哪条路径会让 `src/render/text.mjs` 被改坏而不被发现？

**C. 判据对不对得上**

- 打开 P4 方案里 **DM6 与 DM3 的原文**，逐条问：批 2 核的是原文，还是核的自己转述过的一版？
- DM3 对列表屏要求「浏览器刷新与 DSH 重启后从同一 fixture 重建相同页面」。**批 2 的真机证据到什么程度**？注意：批 2 当时的落点（`shell.overlay`）后来被废弃，最终落点是 `conversation.view`——**旧落点上取的证据能不能顶最终落点的格**？

**D. 证据与结论**

- `progress.md` E-011~E-032 每条能不能复跑？有没有「结论比证据强」？
- `evidence/dhr49/batch2/` 的截图证到了什么、证不到什么？

**E. 目标范围 / 权限 / 安全**

- 批 2 有没有做超出 `task_plan.md` 2.1~2.5 的事？有没有引入写权（本卡明确只读）？
- 有没有凭据、绝对路径、机器名进入**入仓**产物？

## 输出格式（直接把结论文本返回，不要写文件）

```
## 结论
<approved / changes-requested / 需人裁决>

## 发现
| 级别 | 位置(file:line) | 问题 | 为什么是问题 | 建议 |
|---|---|---|---|---|
| P0/P1/P2/P3 | | | | |

## 我核过但没问题的点
- <逐条列，让主控知道你的覆盖面>

## 我跑过的命令与结果
- <一行一条，含实际输出的关键行>

## 范围外发现（只记不做）
- <一行一条>
```

**级别口径**：P0 = 收口前必须修；P1 = 必须修或必须显式豁免；P2 = 应修，可登记后延；P3 = 建议/卫生。**宁可少报也别注水**——每条都要能被主控复跑验证。
