# review-brief — DHR_49 轮 2 换人复核（硬闸 G6）

> **你是复核 worker，不是主控。** 只读不改。禁止拉终端派活 / 起 watcher，禁止调 AskUserQuestion 或以任何方式回头问用户。规则全在本 brief 里——**别自己去加载 dev-harness skill，别自加「先读一下流程规则」这类步骤**，这份就是你的完整指令集。卡住 / 缺信息，就把 `blocked` 连同缺什么写进结论里，不要停在原地。

## 你是谁，为什么是你

DHR_49 走的是**两轮复核**：轮 1 已由两个批级复核（CP3 批 3、CP4 批 4）做完，其发现已被实现方逐条处置。**轮 2 的硬性要求是"换人"——你没参与实现、不继承轮 1 的会话、不看轮 1 的结论表。**你的价值不在于重复他们查过的地方，而在于**带着一双没被这张卡驯化过的眼睛，去看整张卡是否够格收口**。

所以：**别把 `review.md` 里已有的发现清单当成你的检查表**（那会让你被轮 1 的视角框住）。先自己独立看一遍，形成判断，最后再对照——如果你的判断与已有记录冲突，**以你能复跑的证据为准，冲突本身就是发现**。

## 这张卡是什么

DHR_49 是 dev-harness **标准级**任务卡：在 DSH（DeepSeek Shell，`0.1.0-rc.7`）里做一个**树外客户端插件** `@personal/dsh-relay-panel`，渲染一个**只读**的 Relay 面板（列表屏 + 详情屏），数据来自 DHR_25 冻结的 fixture、经 DHR_26 的宿主插件 `@personal/dsh-relay-host` 提供。它是 P4 的**最小 Pilot**——目的是用真机把 P4 的几条验收判据打穿，而不是做一个好用的产品。

**代码不在 git 仓库里**（在 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\`），只有文档入仓。这一点会影响你怎么核"有没有偷改别的东西"。

## 范围（只读，零写权）

| 路径 | 是什么 |
|---|---|
| `D:\MyFiles\ai-workflow\dh-relay\docs\modules\dh-relay\workspace\DHR_49\` | 本卡工作区八件套：`brief.md` / `task_plan.md` / `progress.md`（E-001~E-088）/ `findings.md`（F-001~F-013）/ `lesson_candidates.md`（L-01~L-30）/ `review.md` / 两份轮 1 brief |
| `D:\MyFiles\ai-workflow\dh-relay\docs\modules\dh-relay\dev_plan\P4-DSH工作台最小Pilot-开发方案.md` | 上位方案，**验收判据 DM2 / DM3 / DM4b / DM5b / DM6 的原文在这里** |
| `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-client\` | 本卡产物：浏览器 bundle（`lib/client.js`）、宿主半边（`lib/index.mjs`）、两侧 Typert 描述符、`README.md`（含复现配方） |
| `…\relay-control-pilot\test\dsh-client-*.test.mjs` | 本卡断言（契约 / 分组 / 宿主 / 详情 / 卸载 / DM5b 纯 JSON） |
| `…\relay-control-pilot\test\helpers\` | 夹具（在 Node 里跑浏览器 bundle、定位 DSH 装树） |
| `…\relay-control-pilot\scripts\mutate-dsh-client-*.mjs` | 五份变异脚本 |
| `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\evidence\dhr49\` | 真机证据：`batch1/`~`batch4/`、`batch3/clean-rerun.txt`、`batch3/cross-machine.txt`、`_raw/` |

**范围外**：`src/dsh-host/`（DHR_26 产物，本卡声称一行未改）、`src/cli/`、`src/read-model/`、`src/render/`、其它任务卡工作区、`dsh-home/`（**里面有凭据文件，绝对不要读**）。范围外发现只记一行，不展开、不动手。

**你可以跑只读命令**：`npm test`、`node --test <单个测试文件>`、`node scripts/mutate-dsh-client-*.mjs`、读文件、`git log` / `git diff`。
**不要**：改任何文件、跑 `dsh plugin add/remove`、起 DSH、`npm pack`、`npm install`、动 `dsh-home/`。

## 实现方声称的最终状态（你要核的就是这些）

1. **全量 `npm test` 217/217，fail 0，skipped 0**；五份变异脚本合计 **80 条全见红**，各自未变异正控全绿。
2. **P4-DM3（列表屏 + 详情屏）**：列表按源顺序、按 `status` 分组；详情屏可点可键盘进入，接力计划表按 `nodes[]` **源顺序**打印，不按 `depends_on` 重排；词表与 CLI `show` 逐节点一致。
3. **P4-DM6（分组镜像断言）**：面板的分组结果与 CLI 对同一 fixture 逐项相同。
4. **P4-DM4b（装卸清理，客户端半边）**：`--dump-config` 三态 505 → 502 → 505，A 与 C 逐字节相同，A 与 B 的 diff 恰好只有面板 3 行；disposer 撤 Remote 贡献、摘 `<style data-plugin-css>`、删 `window.__RELAY_PANEL_PROBE__`。
5. **P4-DM5b（RC 私有类型不得进 Read Model）**：面板消费路径拿到的是**脱离的纯 JSON**，宿主网关侧与客户端消费侧各验一遍，另有镜像断言（掺活对象必须见红）。
6. **P4-DM2（可复现性）**：判据①「本机清净重跑」成立（分两段，含一次全新空 store 的冷解重跑）；判据②「换机重跑」**大部分成立、差最后一格**（目标机 Ubuntu 上 217/217、bundle 逐字节相同、宿主半边答出同一 `fixture_hash`、客户端 bundle 四步加载齐全；**未证：面板渲染出数据**）。实现方声称 **DM2 不得记 pass**。
7. **不自裁三态**：`passed` / `passed-with-constraints` / `stopped-by-pilot` 归 DHR_50 由用户人判，本卡不代裁。

## 专挑这几类（按此顺序，前两类最要紧）

**A. 断言是不是在空转（花最多时间）**

这张卡的核心风险是「测试很多、数字很好看，但证的不是要证的东西」。请具体回答：

- 随机挑 **3~5 条**你觉得最像"必过"的断言，问：**把被测代码改成错的，它真会红吗？** 变异脚本没覆盖到的写法，你想到就直说（不必真去改）。
- **期望值是怎么来的？**有没有断言的"正确答案"是人手抄进测试里的常量？那种断言证的是"两份手抄对得上"，不是"实现对得上真源头"。已知 `ROLE_IN_CLI` / `STATUS_IN_CLI` 这类映射存在这个形态——**这个隐患被如实登记了吗，还是被"镜像断言"的说法盖过去了**？
- **五份变异脚本的正控**：未变异副本必须全绿**且零 skip**。有没有哪份的正控在装树不可达时会静默失效？
- `test/helpers/` 里的夹具有没有替被测代码"做了一半工作"，从而让断言测的是夹具？

**B. 结论有没有比证据强（同样最要紧）**

- `progress.md` 88 条证据，逐条问：**这条的"结论"字段，是不是超出了它"命令/观察"字段能支撑的范围？**特别看标了 pass 的真机条目。
- `evidence/dhr49/batch3/clean-rerun.txt` 与 `cross-machine.txt` 里的"这份证据证不到什么"自述——**诚实完整吗？有没有替自己留后门？**
- DM2 的两条判据，实现方自己判「不得记 pass」。**你同意吗？**如果你认为其中某一半其实成立（或某一半其实更弱），说清理由。
- 有没有把"我判为不划算所以没做"写成"被挡住所以做不了"？反过来，有没有把"确实做不了"轻描淡写成"没做"？
- **归因**：`217/217`、`80 条变异` 是谁跑的？文档里有没有把实现方自证写成"经复核验证"？

**C. 验收判据 vs 实现的对应**

- 打开 P4 方案里 DM2 / DM3 / DM4b / DM5b / DM6 的**原文**，逐条问：**实现方是在核原文，还是在核自己转述过的一版？**（已知有过一次转述走样并被登记纠正——你独立看一遍，有没有第二处。）
- `task_plan.md` 写的接口名与实际实现有没有对不上的？偏差登记在对的位置吗？
- 有没有做超出 `task_plan.md` 范围的事？本卡明确**只读**（面板不许写任何东西），有没有引入写权？

**D. 文档与产物的一致性**

- `src/dsh-client/README.md` 的复现配方，**照着敲能不能真跑通**？（不要真跑，读着挑漏步骤／过期数字／写死路径。已知它在一台无遗留状态的机器上暴露过一个 `mkdir` 缺步。）
- 注释、README、`progress.md` 里有没有**过期的绝对数字**（体积、条数、耗时、路径）？
- `findings.md` / `lesson_candidates.md` 里有没有"记成了教训但其实是本卡该修而没修"的条目？

**E. 安全与卫生**

- **有没有凭据、密钥、tailnet IP、主机名、本机绝对路径进入入仓产物**（`docs/modules/dh-relay/` 下的一切）？逐个文件扫。实现方声称已做占位替换——**核实**。
- 有没有读过 / 引用过 `dsh-home/.credentials.yaml` 的内容？
- 目标机上留下的东西，文档里交代清楚了吗（怎么清干净）？

**F. 够不够格收口**

- 站在「这张卡明天就要 `verify` 签字」的位置：**还有哪一条是签下去会后悔的？**
- 有没有该进 `findings.md` 的东西被写进了 `lesson_candidates.md`（当成经验记掉、而不是当成缺陷修掉）？

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

## 我跑过的命令与结果
- <一行一条，含实际输出的关键行>

## 与已有记录冲突的地方
- <你的独立判断与 review.md / progress.md 已记结论不一致之处；没有就写"无">

## 范围外发现（只记不做）
- <一行一条>
```

**级别口径**：P0 = 收口前必须修，否则结论不成立；P1 = 收口前必须修或必须显式豁免；P2 = 应修，可登记后延；P3 = 建议/卫生。**宁可少报也别注水**——每条都要能被主控复跑验证。
