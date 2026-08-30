<!-- dh:v1 -->
# DHR_65 · 教训复核（fresh）

> 复核形态：独立 fresh、只读；对比 `a9b39f0..c52feda`。未修改生产代码、测试、progress、findings 或既有 review；仅写本报告。未读取用户级 registry、配置正文或凭据。

## 结论

**CHANGES_REQUESTED**。P0=0，P1=1，P2=2，P3=1。

实现的一行修复（`profile-registry.mjs:15` 的 `resolveAlias:true`）与 DHR_63 已暴露的 loader/validator 分叉一致；我独立连续运行专属测试 5 次，均为 4/4、exit 0。但当前证据与教训闭合仍不能按“完整正式 registry 的任一条目”收口。

## Findings

### P1 · 完整 registry 覆盖声明与夹具不一致

- `relay-core/test/dhr65-registry-loader.test.mjs:34-40` 的 `completeRegistry()` 只有 `herdr.codex.main`、`herdr.claude.main`、`herdr.codex.ninth` 三条；既有正式/golden registry 记录为五条，另有 `herdr.claude.grok` 与 `herdr.claude.account5`（`relay-core/profiles/fixtures/golden-registry.json:2-58`；DHR_63 独立核对也记录当前 profile 数量为 5，见 `workspace/DHR_63/review-code1-codex.md:46`）。
- `:70-84` 的“every registered profile”循环实际只覆盖这三条。故任一坏 alias/config 的断言没有覆盖被省略的两个已登记 Profile，却在 `progress.md:20`、`review.md:40` 宣称“所有条目/完整结构等价”。
- 这直接复现/违反既有候选-11（机制补丁须逐项巡检同类目标清单）和候选-12（子集证据不得写成全称结论）。这是 DHR_65 完成条件 1 的证据缺口，需补齐与正式五条 ID/结构等价的脱敏夹具，或取得可核查的排除裁决；不能只改措辞。

### P2 · 新测试未被默认 `npm test` 拾取

- `relay-core/package.json:11-14` 的 `scripts.test` 是显式文件清单，不含 `test/dhr65-registry-loader.test.mjs`。本卡只直接运行新文件；`progress.md:23` 的 `npm test` 也没有终态，不能证明默认套件执行了这 4 个测试。
- 这违反既有候选-39“新增测试文件必须证明默认测试命令拾取”的适用条件。若 `package.json` 确实因本卡边界不可改，应在收口中明确登记为未接入的有效单测缺口并由上游授权处理；不能把专属命令绿等同于默认回归已包含。

### P2 · driver 零副作用断言靠固定 25 ms，可能在 loader 完成前提前通过

- `dhr65-registry-loader.test.mjs:106-115` 启动后台 driver 后仅 `setTimeout(25)`，随后检查零事件；没有等待 `driver.done`、确定的 preflight 终态或独立不变量。正确实现的定向测试单次耗时约 0.8–1.2 秒，说明 25 ms 明显不是“已完成”信号。
- 在慢 IO、`where.exe`/PowerShell 解析或实现 mutation 下，断言可能在 driver 尚未完成校验时观察到零副作用而假绿；`t.after(() => driver.stop())` 只提供清理，不补足证据终态。这与候选-35（异步测试要等不变量）和候选-51（挂死/终态须有明确门槛）相关。应等待可界定的 driver 终态后再断言，并保留有界清理。

### P3 · L-6501 内容准确但重复且不完整

- `workspace/DHR_65/lesson_candidates.md:6-7` 的 L-6501 正确捕捉了本卡核心：formal validator 负例不能替代 runtime consumer 证据，需实现级 mutation；实现与 E-6505 账本声明对这一点有响应。
- 但它几乎逐字重复 DHR_63 L-6302（`workspace/DHR_63/lesson_candidates.md:6-7`），未标“疑似重复/合并关系”，也没有覆盖本轮暴露的 fixture 全集、默认 runner 拾取、异步终态三个可复用约束。因此当前候选区不够充分；建议将 L-6501 收窄为“如何证明消费点 mutation”，并引用/合并 L-6302，另外沿用候选-11/12/35/39/51 的既有条目，不要把本卡教训只保留成一行泛化句。

## 既有教训逐项核对

| 既有教训 | 本卡状态 |
|---|---|
| DHR_63 L-6302；候选-6 | **部分避免**：`resolveAlias:true` 与账本中的实现级 `true→false` 红测方向正确；但本报告 P1/P2 说明证明覆盖面和终态仍不足。 |
| 候选-11 / 候选-12 | **未避免**：三条夹具被称为完整/所有条目，缺少正式五条中的两条。 |
| 候选-35 / 候选-51 | **部分避免**：注册了 stop 清理；driver 断言仍用固定 sleep，未等待终态/不变量。 |
| 候选-39 | **未避免**：新测试文件未列入显式 `npm test` 清单，且没有拾取增量证据。 |
| 候选-50 | **已避免**：测试显式注入 `herdrRegistryPath` 与 `DHR65_PROFILE_ROOT`，没有依赖用户家目录 registry。 |
| 候选-36 | **本卡不适用**：验收明确要求脱敏结构等价副本且禁止读取用户级 registry；不能据此反要求读取 live 值，但副本必须仍覆盖正式条目集合。 |

## 清洁与边界

- 本次独立定向测试 5 次均 `4/4 pass`、exit 0；未把未得终态的 `npm test` 当绿色，也未运行真实 Agent。
- 未发现本提交新增的凭据/配置正文披露；未改动任何非指定报告文件。没有 P0 发现。

LESSONS-REVIEW-DONE
