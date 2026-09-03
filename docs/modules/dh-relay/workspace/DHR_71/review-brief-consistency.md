<!-- dh:v1 · review-brief — DHR_71 一致性复核派单（light 配方两路之一 · 横向）。主控写，复核者只读。 -->
# review-brief · DHR_71 · 一致性复核（横向）

## 你是谁 / 不是谁

你是**复核 worker**，不是主控。只读、不改任何文件（codex `--sandbox read-only`）。不要派活、不要回头问用户。先读仓根 `AGENTS.md`「编排协议段 → 复核 worker」。

## 这一路是横向的

不问"这次改动对不对"，问"本次产出的东西，和仓里已有的同类实现是否自洽"。跨路径不一致是多次任务累积长出来的，纵向复核看不见。**做法**：对本次改动引入或修改的每样"同类物"，grep 出仓里的同类实现，并排比。不扫全仓，只扫"本次碰到的东西在别处有没有兄弟"。

**输出硬要求**：必须列出**比对清单**（扫了哪些维度、每个维度找到几处同类）。结论是"全部一致"也要列——只写"看过没问题"= 空过。发现的不一致**必须逐条裁决**「有意差异」还是「遗漏」，理由写清楚。本卡是 **light** 卡，没有代码轮次——**这一路是它仅有的横向闸**。

## 你要审什么

cwd = worktree `.dh-worktrees/DHR_71`，HEAD = `ecdc941`，基线 = `master@25d697d`，diff = `git diff master...HEAD`。改动全在 `relay-core/test/**`（`helpers/bounded-wait.mjs` 新建；`agent-node.test.mjs`、`herdr-adapter.test.mjs`、`dhr69-false-ready.test.mjs` 用例体）+ 本工作区。生产代码零改动。

`review.md` 的 `dh:consistency-review:v1` 块已冻结**六个比对对象**，你必须逐个给出「定义是否一致 + 裁决」：

| # | 比对对象 | 要并排比的同类路径 |
|---|---|---|
| 1 | 有界等待工具的口径（等目标事件不等断言值） | 新 `helpers/bounded-wait.mjs` vs 既有 `helpers/settled-state.mjs` vs `herdr-adapter.test.mjs` `runtimeUntil`（`:204-210`，冻结未动）vs `agent-node.test.mjs` `untilAsync`（`:39`）vs `dhr69-false-ready.test.mjs` 文件级 `until`（`:15`） |
| 2 | 等待上限与生产默认值的关系 | 各用例的 `timeoutMs`（15s / 30s / 60s / 120s / 75_015 / 90s）vs `workflow-driver.mjs:33-34` 默认值 vs `herdr-cli.mjs:17/:41` vs B-36 冻结的「按真实调用链逐段相加 × 1.5」规则——每个数字都能回溯到规则吗？同一条链在两处用例上算出的数一致吗？ |
| 3 | driver 生命周期兜底（`try/finally stop` vs `t.after(stop)`） | 本卡改的 `agent-node.test.mjs` 三条用例 vs 同文件其余 `startWorkflowDriver` 调用点 vs `herdr-adapter.test.mjs` 各用例（`:510` 等既有 `t.after(() => driver.stop())`）vs `dhr69-false-ready.test.mjs` 两个夹具（worker 称"本来就是 stop 后才 rm"）vs `dhr64-driver-observation` / `dhr70-submission-gate` 的同类写法——**652s 的根因是 `rm` 与 `stop` 的登记顺序**，仓里还有多少处同样的顺序隐患？逐处列出并裁决（本卡范围外的只列不改） |
| 4 | skip 标记的形态与理由措辞 | S1~S4 的 `{ skip: 'F-3520 → DHR_72：…' }` 四条互相之间 vs 仓内既有 skip 用法（`grep -rn "skip:" relay-core/test`）vs DevPlan DHR_72 机器证 E「按完整用例名核销」 |
| 5 | 绿闸命令与证据口径 | task_plan 固定的五文件命令 vs DevPlan 机器证 A 原文 vs `evidence/gate-round*-20260902T0525Z.txt` 实际命令行（含 `--test-timeout=180000`）vs `package.json` 的 npm test（本卡不改它）——两条命令的差异是否已被 progress 如实登记？ |
| 6 | 允许路径 vs 实际 diff（含用例行级冻结与反向禁改） | DevPlan `dh:allowed-paths:v1 task=DHR_71` + B-36 行级限定 vs `git diff --name-only master...HEAD` + 逐 hunk 行号；特别核：`dhr69-false-ready.test.mjs` 多出的一行 import（主控已裁「机械前提、等价放行」——你独立判这个裁决站不站得住）；S3/S4 用例体内是否只动了等待/清理/skip、断言一字未动 |

**六个是下限。** 建议自行取用的横向维度：`dumpDriverScene` 的脱敏（`redactIds`）与 `wt/DHR_35` 的 `scripts/redact-receipt-ids.mjs` 口径是否一致（`~<sha256 前 12>`）；新 helper 的命名/导出组织与 `helpers/` 目录既有文件是否同一风格；`FILE_TEST_TIMEOUT_MS` 这种文件级常量在别的测试文件有没有兄弟。

## 硬边界

- 只读。跑不了测试就如实申报「仅静态审」。
- 只写事实与级别，不替主控做验收裁决。裁定「有意差异」的说明理由该补进哪份文档或注释——但你不改文件。
- 密钥 / 凭据值 / 原 Receipt ID 永不出现在结论里。

## 产出格式

完整结论输出到 stdout（主控会落盘为 `review-consistency-codex.md`）：

```
## 形态自述
## 比对清单（扫了哪些维度、每个维度找到几处同类）
| 维度 | grep/搜索方式 | 找到几处同类 |
## 六个冻结比对对象（逐个）
### 1. …
- 并排定义：
- 定义是否一致：
- 裁决（一致 / 有意差异 / 遗漏）：
- 依据：
## 自选维度的比对结果
## 不一致逐条裁决汇总
| 编号 | 不一致点 | 有意差异 or 遗漏 | 理由 | 建议落到哪 |
```
