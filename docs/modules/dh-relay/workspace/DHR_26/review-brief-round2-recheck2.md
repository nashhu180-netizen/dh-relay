# review-brief（第二轮 · 第 2 次收敛复检，终检） — DHR_26

> 你是**复核 worker**，零上下文：读这一份就够。**只读不改**，不要创建任何文件。只写事实与级别，不做验收裁决、不给三态标签。

## 背景（一句话）

`dh-relay` P4 的 DHR_26：一个只读的树外 DSH（DeepSeek Harness / Cordis）Host 插件，把上一张卡冻结的 fixture 原样透传进 DSH 进程，暴露为 `ctx.relayPilot`。

**你的上一次复检**（同后端、另一会话）判 0 P0，但留了 2 条 P1 + 2 条 P2。施工方已按你的建议改完。**本轮只核这四条是否收敛、以及改动有没有引入新问题。**其余部分你前两轮已核过，不必重做。

## 东西在哪

- worktree：`D:\MyFiles\ai-workflow\dh-relay-wt\DHR_26-host-fix`，工作区 `docs\modules\dh-relay\workspace\DHR_26\`
- **仓外权威落点**（真正跑的）：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\{dsh-host,dsh-absence-probe}\`，fixture 在 `..\testdata\fake\`
- 本轮证据：`workspace\DHR_26\evidence\round2-lifecycle\`

```
cd D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot
node --test src/dsh-host/test/*.test.mjs        # 41 例
```

只读沙盒里跑不动的（会写临时文件的变异 harness、要写 --out 的校验器），如实申报「仅静态审」。

## 逐条核

### P1-1（上轮：转录校验只有部分字段参与裁决）

修法：`src/dsh-host/scripts/verify-transcript.mjs` 重写为**从磁盘独立重建整份期望 snapshot**（不复用 Host 自己的 loader），逐键比对，并禁止 snapshot 出现计划外的键；probe 信封（`event` / `service` / `list_schema` / `list_run_ids` / `list_sha256` / `detail_present_*` / `detail_missing_*`）全部纳入裁决，且要求「探针探的那条 missing run 真的没有 detail、探的那条 present run 真的有」。

新增 `scripts/transcript-mutation-check.mjs`：1 条正控 + 10 条变异，输出见 `evidence/round2-lifecycle/transcript-mutations.txt`（含你上轮点名的三类：删 `detail-unlisted` 诊断、改 `detail_missing_run_id`、改 `schema_version`）。

**请核**：现在还有没有能让它误判 `IDENTICAL` 的输入？重建逻辑本身是否与 Host 的实际契约一致（会不会把合法输出误判 DIFF）？`detail_fixtures` / `diagnostics` 按无序比较是否恰当？

### P1-2（上轮：批内 README 与 progress/findings 仍发布旧结论）

修法：`evidence/target-web/README.md` 顶部加 superseded 提示并把「必须装 tgz」改成历史记录；`evidence/smoke-rc6|smoke-rc7/README.md` 把 disable 结论改成「禁用后服务未注册」并指向 `round2-lifecycle/`；四份批 README 的「仍缺失」改为只剩 verify；`findings.md` 的「第二轮未做」「25 个文件」已更正；`progress.md` **append-only 追加**了纠错条目（第 26 条明说「契约测试从未存在」）。

**请核**：还有没有别处仍在发布过期或不实结论（含插件 README、patch 注释、`review.md`、`task_plan.md`、`brief.md`）？纠错方式是否诚实（旧句保留 + 追加纠错 vs 偷偷改写）？

### P2-1（上轮：运行时文件枚举可被子目录/glob 绕过）

修法：`test/package-contract.test.mjs` 改为按 `package.json` 的 `files` **递归展开**（目录条目也算），并断言除 `test/` `scripts/` 外磁盘上每个 `.mjs` 都在集合里；`files` 覆盖判定接受「被已声明的目录条目覆盖」。契约变异 harness 补两条子目录变异，现 7 条全红（`evidence/round2-lifecycle/contract-mutations.txt`）。

**请核**：还有没有能逃出枚举的形状（glob 条目如 `dist/**`、符号链接、大小写、`.js`/`.cjs` 扩展名）？`NOT_SHIPPED` 的三个排除项会不会把该查的漏掉？

### P2-2（上轮：包外探针证据没存退出码）

修法：三份 `absence-external-*.txt` 已重采，每份含命令、stdout、stderr、退出码。

**请核**：三份证据是否自洽（装着 exit 1 / removed exit 0 / 装回 exit 1）？还有没有别的证据文件只存了 stdout 而结论依赖退出码？

## 还要看的

- 新增/改动的文件有没有引入新问题：`scripts/transcript-mutation-check.mjs`、重写后的 `verify-transcript.mjs`、`contract-mutation-check.mjs` 的两条新变异、`package-contract.test.mjs` 的递归枚举。
- 有没有越权：本卡不得给 DSH 桌面轨三态结论（`passed` / `passed-with-constraints` / `stopped-by-pilot`）。

## 输出

1. 核验形态。
2. 四条逐条判定：`已收敛 / 部分收敛 / 未收敛` + 你自己核到的事实。
3. 新引入的问题（P0/P1/P2/NIT，位置 + 事实 + 为什么 + 建议）。
4. 还剩哪些 P0/P1。只给事实。
