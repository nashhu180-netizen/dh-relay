# review-brief（第二轮 · 换人 fresh-context 对抗复核） — DHR_26 树外 DSH Host Plugin

> 你是**复核 worker**。零上下文：读这一份就够，不要去加载任何流程框架、skill 或别的规范文档。
> **只读不改**：不要修改任何代码或文档，不要创建文件。你的产出只有一份文字结论（见文末「输出」）。
> 不要替主控做验收裁决，不要勾任何签名区。只写事实与级别。
> 卡住 / 缺信息时直接在结论里写明「无法核验：X」，不要停在那里等人。

## 一、这是什么

`dh-relay` 是「接力执行范式 Runner」项目。P4 阶段做一个**仓外一次性 Pilot**：把上一张卡（DHR_25）**冻结**的只读数据（fixture）通过一个**树外插件**接进 DeepSeek Harness（DSH，一个基于 Cordis 框架的终端 AI 工作台，本机版本 `0.1.0-rc.7`）。

本卡 **DHR_26 只做 Host 侧**：一个只读服务，把 DHR_25 的两份 fixture 原样透传给 DSH 进程，暴露为 `ctx.relayPilot`。面板 UI 是下一张卡（DHR_49）的事，不在本卡范围。

**任务卡的终点（这是判断"该不该做/做没做到"的唯一标尺，逐字摘自 DevPlan §3.2 DHR_26）**：

- **P4-DM1**：不修改 DSH 上游源码即可加载 Host Plugin（`--patch` overlay 或 profile 安装）；`ctx.relayPilot` 在 DSH 进程内可被调用，**两份 schema 原样透传**，Host 不做二次加工、不推导状态。
- **P4-DM4a**：Host Plugin 可安装 / 卸载；上游有显式启用 / 禁用机制则一并验证，无则如实记「未验证」（不造假失败）；卸载后服务与事件注册得到清理。
- **P4-DM5a**：Host 只传普通 JSON，不传 Cordis 活动对象；DSH RC 私有类型不进 Read Model。
- **版本基线**：本机 DSH 由 `0.1.0-rc.6` 升到 `0.1.0-rc.7`；升级前后各留一份现场快照（`dsh --version`、内置包逐个版本号、安装目录结构），差异写进 `findings.md`。证据来源须**显式登记**是哪一份前快照。
- **侦察落档**：树外插件的构建与安装事实写进 `findings.md`（官方 client 插件的 `dsh.client` 声明形态、`exports["./client"]` 产物形态、profile 的 client 扫描锚点、类型定义位置、`--patch` 与 profile 安装各自的适用边界）。此件是下一张卡 DHR_49 的开工输入，**缺则 DHR_49 不得开工**。
- **事实登记（不裁定）**：本卡只登记事实，**不得**自行给出 DSH 桌面控制面轨的三态结论（`passed / passed-with-constraints / stopped-by-pilot`）——那是后面一张卡由人判收敛的。

**红线**：本卡是只读 Pilot——不得引入任何 Relay 写权、不得修改 DSH 上游、不得让凭据/密钥值进任何工件。

## 二、东西在哪

- 仓库 worktree（本卡全部治理工件）：`D:\MyFiles\ai-workflow\dh-relay-wt\DHR_26-host-fix`
  - 工作区：`docs\modules\dh-relay\workspace\DHR_26\`
  - 仓内代码镜像：`docs\modules\dh-relay\workspace\DHR_26\artifacts\relay-control-pilot\src\dsh-host\`
- **仓外权威落点**（代码真源，测试在这里才能跑，因为 fixture 在隔壁）：
  `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-host\`
  真 fixture：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\testdata\fake\`
- 机器证据四批：`workspace\DHR_26\evidence\` 下的 `smoke-rc6/`（rc.6 冒烟）、`smoke-rc7/`（升级后复跑 + 版本对差）、`target-web/`（目标机 `web` profile 接线）、`zero-import/`（去依赖改造后两种安装形态对拍），各有 README。
- 第一轮复核结论与施工者逐条处置：`workspace\DHR_26\review.md`。

跑测试（**不需要设任何环境变量**，40 个用例）：

```
cd D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot
node --test src/dsh-host/test/*.test.mjs
```

> 如果你在只读沙盒里跑不了测试（临时文件被拒写），**如实申报「仅静态审」**，不要假装跑过。

## 三、这一轮你要做什么（与第一轮的分工）

第一轮（另一个模型，已完成）做的是全面排查，提了 2 个 P1 + 若干 P2，施工者已逐条处置：核心是把插件里唯一的外部依赖 `import { Service } from '@deepseek-ai/cordis'` 去掉，改成 `apply(ctx, config)` + `ctx.provide('relayPilot', api)`，从而让「源码目录安装」和「tgz 安装」两种形态都能跑。

**你是第二轮，任务是对抗式交叉评估，不是重复第一轮。** 请默认怀疑：施工者自述、第一轮结论、以及"已修复"的处置本身，都可能是错的。请重点看：

### A. 第一轮的修法是否真的成立（最高优先级）
- `ctx.provide('relayPilot', api)` 这个改法，在**卸载/禁用**时服务行是否真的被清理？证据（`evidence/zero-import/`、`evidence/target-web/` 的 `absence-*.txt` 与 `dump-*.txt`）能不能支撑这个结论，还是只支撑了「配置树里没有这一行」？
- 「运行时文件零 bare import」这条契约，测试（`test/package-contract.test.mjs`）钉得住吗？有没有能绕过正则的写法（动态 `import()`、`createRequire`、字符串拼接）？
- 第一轮提的 P1「权威落点 README 漂移」，施工者声称已回灌并新增 `check-drift.ps1` + 契约测试。请自己核：**仓内镜像与仓外权威落点现在是否逐字节一致**？漂移检查本身有没有洞（比如只比对文件名不比对内容、或漏掉某类文件）？

### B. 证据能不能支撑验收结论（第二高）
逐条核 DM1 / DM4a / DM5a / 版本基线 / 侦察落档：**声称的结论**与**证据文件里实际写的东西**之间有没有缺口？特别是：
- probe 转录是不是真的证明了「原样透传」，还是只证明了「跑通了」？`transcript-report.json` 的 `IDENTICAL` 判定逻辑（`scripts/verify-transcript.mjs`）自己是否可信——它会不会把不一致也判成一致？
- 版本基线的证据链：任务卡要求「显式登记是哪一份前快照」。现在实际用的是哪一份？`evidence/smoke-rc6/dsh-snapshot-rc6.json` 与仓外 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\evidence\dsh-version-baseline\rc6-before-upgrade.txt`（另一张卡预采的）是什么关系？工件里写清楚了吗？
- 「卸载后服务与事件注册得到清理」——`--dump-config` 的行数差能证明"清理"吗，还是只能证明"配置树里没了"？工件有没有把这个限度说清楚（施工者自己记了一条 `absence-probe` 只能验 disabled、验不了 removed 的限制，请核这个自述是否诚实完整）。

### C. 只读红线与安全
- 服务面有没有任何写路径、活对象泄漏（Context / Fiber / 函数穿过边界）、原型污染（`run_id` 为 `__proto__` 等）？
- 全部工件（含 evidence 下的 json/txt）里有没有混进凭据值、token、本机敏感路径？
- Host 有没有偷偷注册 route / event / timer / process handler？

### D. 有没有该做没做、或做过头
- 有没有被两轮都漏掉的 P0/P1？
- 有没有超出本卡范围的东西被顺手做了（比如摸到了 DHR_49 的 Client 侧、或引入了 Relay 写权）？
- 本卡有没有在哪里偷偷给出了三态裁定（`passed` / `passed-with-constraints` / `stopped-by-pilot`）？那是越权。
- 反过来：有没有砍过头——为了让测试变绿而删掉了本该有的校验？

## 四、输出

按下面结构写一份 Markdown 结论（直接输出正文，不要写文件）：

1. **核验形态**：你实际跑了什么命令、能不能跑测试、哪些只能静态审、哪些无法核验。
2. **逐条结论**：按 A / B / C / D 四组写。每条给出 **级别（P0 / P1 / P2 / NIT）**、**位置（文件:行）**、**事实**（你自己核到的，不是转述）、**为什么是问题**、**建议**。
3. **对第一轮与施工者自述的交叉评估**：哪些成立、哪些不成立、哪些是过度乐观的表述。
4. **能不能进"待验收"**：只给事实判断——还有哪些 P0/P1 未清零、哪些验收项证据不足。**不要**替用户做验收决定，也不要给三态标签。

级别口径：P0 = 结论不成立 / 红线被破；P1 = 会误导验收或下一张卡；P2 = 该修但不挡验收；NIT = 建议。
