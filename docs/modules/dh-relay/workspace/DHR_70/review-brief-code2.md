<!-- dh:v1 · review-brief — DHR_70 第二轮代码复核派单（含变异点选点）。主控写，复核者只读。 -->
# review-brief · DHR_70 · 代码复核轮 2（增量 + 变异点选点）

## 你是谁 / 不是谁

你是**复核 worker**，不是主控。只读、不改任何文件（codex `--sandbox read-only`）。
不要派活、不要回头问用户。先读仓根 `AGENTS.md`「编排协议段 → 复核 worker」。

你是 **fresh 实例，不继承轮 1 / 轮 1b 的任何会话**。它们的结论已落盘，你只读它、**不假设它对**。

## 你的两个职责

轮 2 和轮 1 不是重做一遍。你有两件事，第二件是本卡**只有你能做**的：

1. **增量复核**：核全程 + 核轮 1/1b 的记录 + 查收口增量 diff。
2. **变异点选点**（重核卡硬要求）：由你指定「把生产代码的哪一行改坏、哪条测试必须因此变红」。**施工方自报的变异点一律判红**——因为施工方会挑一个自己知道能红的点，那证明不了测试的防护力。选点权在你。

## 材料

cwd = worktree。

| 读什么 | 是什么 |
|---|---|
| `git diff 35ff2db..HEAD` | 全卡 diff（`35ff2db` 是 master 基线） |
| `git log --oneline 35ff2db..HEAD` | 施工 + 整改的提交序列 |
| `review-code1-codex.md` | 轮 1 原文（一条 P2：A2 未证明 lease 换手） |
| `review-code1-reverify-codex.md` | 轮 1b 原文（整改复验） |
| `brief.md` / `task_plan.md` / `progress.md` / `findings.md` | 卡合同、施工图、证据账本 E-7002~E-7010、问题清单 |
| `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §3.2 DHR_70 | 唯一权威验收口径 + 允许路径 |
| `docs/modules/dh-relay/design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md` | 冻结语义 P6-RI-A1/A3 与「Gate 生命周期」 |

一句话背景：生产改动只有 `relay-core/runtime/service.mjs` 一处——`submitExecutorResult` 首轮 drivers 循环捕获精确的 `E_LEASE_HELD:actor-closed`，用新增的 `evictClosedActor` 摘掉这一届 driver 与已关闭的 actor，`continue` 到既有 durable 重建路径（重取 lease → 新 actor → 重建 gate）。

## 职责一：增量复核

按 P0/P1/P2/P3 定级，无发现也要明说。

1. **轮 1/1b 的结论你同不同意**。逐条独立核，尤其这三条（它们是本卡的承重墙）：
   - 「单写者未被放宽」——`continue` 之后走的路径真的重新过了 lease 与 `writeGuard` 吗？
   - 「`await dead.done` 不会 reject 中断循环」——`host.mjs` 真的把失败转成 fulfilled 了吗？
   - 「A3-1 判据放松后仍有防护力」。
2. **收口增量 diff**（`b6a3b47..HEAD`）：整改本身有没有引入新问题。
3. **完成条件 A1/A2/A3/B/C/D 逐条**：证据链成不成立、有没有"测试绿了但条件没被证明"的缝。
4. **本卡有没有修过头**：A3/B 四条负例是"没修过头"的闸，它们现在还真的在挡吗？
5. **越界**：`git diff --name-only 35ff2db..HEAD` vs DevPlan `dh:allowed-paths:v1 task=DHR_70`。

## 职责二：变异点选点（**必答，且要给到可直接执行的程度**）

选**一个**变异点。要求：

- **锚点必须在生产代码里**（`relay-core/runtime/service.mjs`），不能选测试文件——改测试证明不了测试的防护力。
- 变异要**语义上真的改坏**本卡修的那个行为（比如让 `actor-closed` 不再被摘除、让摘除不摘 actor 只摘 driver、让 `evictClosedActor` 不等 `dead.done`……由你判断哪个最能证伪），而不是改成语法错误或明显崩溃。
- 你要预测**哪条测试会红、红成什么样**。如果你选的点改坏后测试仍绿，那说明测试有洞——那本身就是一条 P1 发现，请直说。

按下表给全（主控会照此施加/还原并记 hash，你不需要也不能自己改文件）：

| 字段 | 要你给的内容 |
|---|---|
| 变异点锚点 | `relay-core/runtime/service.mjs:<行号>` |
| 原值 → 变异值 | 逐字给出原始代码片段与替换后的代码片段 |
| 语义类别 | 如「改条件 / 删摘除 / 反转判据」 |
| 对应测试 ID | 预期变红的具体用例名（从 `relay-core/test/dhr70-submission-gate.test.mjs` 里取准确的 test 名） |
| 运行命令 | 可直接复制执行的 `node --test ...` 命令（建议带 `--test-name-pattern` 只跑那一条） |
| 预期红的形态 | 断言会在哪一句失败、报什么 |

**选点理由也要写**：为什么这个点最能证明本卡的测试真的在防护，而不是走过场。

## 硬边界

- 只读。跑不了测试（沙盒写不了临时文件）就如实申报「仅静态审」——你**不需要**自己验证变异结果，那由主控施加后取证。
- 结论只写事实与级别；**但轮 2 要给总结论**：`approved` / `changes-requested` / `需人裁决`（这是轮 2 的规定动作，不算替主控做验收裁决）。
- 密钥/凭据值永不出现在结论里。

## 产出格式

完整结论输出到 stdout（主控会落盘为 `review-code2-codex.md`）：

```
## 形态自述
## 对轮 1 / 1b 结论的独立复核（逐条同意 / 不同意 + 理由）
## 新发现
### F-70-R2-01 (P?) 标题
## 完成条件 A1~D 逐条判定
## 越界判定
## 变异点选点（上面那张表 + 选点理由）
## 轮 2 总结论：approved / changes-requested / 需人裁决
```
