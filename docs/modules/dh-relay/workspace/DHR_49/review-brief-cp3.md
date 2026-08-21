# review-brief — DHR_49 CP3（批 3 小审）

> **你是复核 worker，不是主控。** 只读不改。禁止再拉终端派活 / 起 watcher，禁止调 AskUserQuestion 或以任何方式回头问用户。规则全在本 brief 里——**别自己去加载 dev-harness skill、别自加「先读一下流程规则」这类步骤**，这份就是你的完整指令集。卡住 / 缺信息，就把 `blocked` 连同缺什么写进结论里，不要停在原地。

## 你的任务

对 DHR_49 **批 3（构建配方定型与可复现，P4-DM2）**做**只读**复核。这一批的产出主要是**文档与转录**，不是代码——所以你的重点是「**声称与证据对不对得上、另一个人照着能不能重跑**」。

## 范围（只读，零写权）

| 路径 | 是什么 |
|---|---|
| `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-client\README.md` | **构建配方全文 + 外部前提三问**，本批核心产出 |
| `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\evidence\dhr49\batch3\clean-rerun.txt` | 判据①本机清净重跑转录 |
| `…\evidence\dhr49\batch3\cross-machine.txt` | 判据②换机重跑：阻塞记录 |
| `…\evidence\dhr49\batch3\_raw\` | 上述两份的原始命令输出 |
| `…\relay-control-pilot\src\dsh-client\package.json` | `files` 白名单 / `exports` / `dsh.client`（配方声称的形状） |
| `…\relay-control-pilot\src\dsh-client\cordis.patch.yml` | profile 安装层 |
| `D:\MyFiles\ai-workflow\dh-relay\docs\modules\dh-relay\workspace\DHR_49\` | `task_plan.md`（批 3 那一节）/ `progress.md`（E-041、E-056~E-060）/ `findings.md`（F-005、F-012） |

**范围外**：`lib/` 下的实现代码与所有测试（那是 CP1/CP2/CP4 的活）、`src/dsh-host/`、其它任务卡工作区。范围外发现只记一行，不展开、不动手。

**你可以跑只读命令**：读文件、`tar -tzf <dist 里的 tgz>`、`sha256sum`、`git log`、`node --test`（如果你要核跳过条数，可以用 `RELAY_PANEL_DSH_PACKAGE_JSON=<不存在的路径> npm test`——它不改任何东西）。
**不要**跑 `dsh plugin add/remove`、不要起 DSH、不要 `npm pack`（会改 `dist/` 里的 tarball）、不要改任何文件。

## 本批声称做到了什么（你要核的就是这些）

1. **判据① 本机清净重跑成立**：删光 `dist/*.tgz`、卸掉 profile 里本包的依赖与 bundle 条目后，照 README 重跑，装出来的四个 bundle 文件与清场前**逐字节相同**；页面上 `RELOADABLE`、`fixture_hash` 仍为 `67fb18b3d7d84fa8a3f188f0db67539eb0421aeac4e5c3aadbf536807d39612c`。
2. **判据② 换机重跑未成立**：`ssh thinkpad` 连接超时（本机 Tailscale 后端 `NoState`）。**声称这是"没跑起来"而不是"跑失败"**，因此记「本机可复现、跨机未成立」，**DM2 不记 pass**。
3. **tgz 哈希变化已归因**：`62d66053…`（19781B）→ `a557dbe3…`（21117B）不是 `npm pack` 不确定，而是中途改过 `README.md`、npm 无条件把 README 打进包；`npm pack` 对同一份源码连打两次得同一哈希（声称实测过）。
4. **配方补丁两条**：①干净状态下 `dsh plugin remove` 会 exit 1，不能因此删掉这一步（它是防 F-005 的）；②判「装的是不是这一版」只能看安装副本 vs 源码逐文件哈希，不能看 tarball。
5. **外部前提三问**：不依赖本机 dsh 安装目录绝对路径（运行时）、不需要 monorepo checkout、不需要打包器。
6. **提前量出跨机跳过条数**：目标机若没装 DSH，213 条里跳 11 条（跑 202），并点名是哪 11 条。

## 专挑这几类（按此顺序）

**A. 「另一个人照着能不能重跑」——这是本批的存亡问题**

请**逐条走一遍 README 的命令**（只读地走：不真跑，但逐条核参数、路径、前后依赖），回答：

- 有没有哪一步**缺前提**？（比如某个环境变量没说、某个目录默认不存在、某条命令依赖前一条的副作用却没写）
- 路径占位符（`<pilot>` 等）是否一致、是否可替换？有没有混进只有本机成立的绝对路径？
- 「外部前提三问」的答案与实际代码对不对得上？（例如：README 说运行时不依赖 dsh 安装目录绝对路径，但 `test/helpers/dsh-install-tree.mjs` 里写死了一个——README 有没有把这个区分说清楚？）
- 第 2b 步的哈希核对循环，PowerShell 写法在别人机器上会不会因引号/编码出问题？

**B. 判据①的证据强度**

- `clean-rerun.txt` 声称"清场干净"，它列的四项核验够不够？**有没有漏掉某个会让"重跑"其实是"没真清"的东西**？（想一想：`pnpm-lock.yaml`？profile 的 pnpm store？全局 npm 缓存？`node_modules/.pnpm`？）
- 如果漏了，这会不会让「逐字节相同」这个结论变弱、甚至变成同义反复？
- 「装出来的 bundle 逐字节相同」和任务卡要求的「产出**可再次加载**的 bundle」是不是同一件事？两者都验了吗？

**C. 判据②的记账是否诚实**

- 「不是跑失败，是没跑起来」这个区分——**成立吗**？记成「阻塞/未执行」而不是 `fail`，对 DM2 的最终归属有没有实质影响？
- `cross-machine.txt` 里的诊断（Tailscale `NoState`、对端列表里没有 `thinkpad`）能支撑它的结论吗？有没有别的可能（防火墙？SSH 端口？别名过期？）没被排除？
- 任务卡原文是「②失败而①成立 → 如实登记『本机可复现、跨机未成立』，DM2 不得记 pass」。本卡的登记**是否严格照此**，有没有在别处（`review.md` / `findings.md` / `progress.md`）出现更宽松的说法？

**D. 归因是否被证实而不是被断言**

- tgz 哈希变化归因于 README——这个结论有没有被**实验**证实（连打两次同哈希）？转录里能看到那次实验吗？
- 「npm 无条件把 README 打进包」——有没有直接证据（`tar -tzf` 输出）？

**E. 文档与实现漂移**

- README 的「面板落在哪」「测试与验证」两节本轮刚被改过。**改后的内容与实现对得上吗**？（测试条数、变异脚本清单、槽位名）
- README 里还有没有别的过期陈述？

**F. 安全 / 入仓卫生**

- 转录与 README 里有没有凭据值？有没有机器名 / 用户名 / 绝对路径进入**入仓**的产物（`docs/modules/dh-relay/workspace/DHR_49/` 下的文件）？
- `evidence/` 在仓外，但 `progress.md` / `findings.md` 在仓内——它们引用的内容有没有把敏感信息带进来？

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
