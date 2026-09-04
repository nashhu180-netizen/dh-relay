<!-- dh:v1 -->
<!-- dh:planning-no-event:v1 artifact="dev_plan/drafts/DHR-B-40-review-brief.md" reason="DHR-B-40 只读审核派单形成史；不形成独立 planning event" -->
# DHR-B-40 fresh 只读审核 brief

你只做 B-adjust 方案审核，禁止修改任何文件、禁止运行真实 Agent、禁止提交/合并/推送。

## 必读

1. 仓根 `AGENTS.md`。
2. 候选：`docs/modules/dh-relay/dev_plan/drafts/DHR-B-40-Herdr同步启动阻塞HostLease续租-候选.md`。
3. 正式设计输入：
   - `docs/modules/dh-relay/design/10-薄RelayPlan与显式节点边界-产品设计调整.md`（重点 `HC-3AT-A29`、`HC-P1-A6`、`HC-CTRL-H1`）；
   - `docs/modules/dh-relay/design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md`（重点 `P6-RI-A3/A4`、Gate 生命周期）。
4. 独立事实核查：
   - `relay-core/runtime/host.mjs`、`lease.mjs`；
   - `relay-core/runtime/executors/herdr/herdr-cli.mjs`、`herdr-executor.mjs`；
   - DHR_72 worktree `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_72/docs/modules/dh-relay/workspace/DHR_72/progress.md` E-7212/E-7215~E-7218 与 `findings.md` F-7206/F-7208。

## 必审问题

1. `spawnSync` 阻塞同一事件循环与 15 秒 lease 续租饥饿之间是否由代码和三次现场共同支持，是否还有同等可能但被忽略的机制。
2. 新增 DHR_75 是否严格承接正式设计，还是需要先走 A-full 改产品合同。
3. 机器证 A~F 能否区分“简单拉长 TTL”与“续租在慢调用期间真实运行”，能否证明 fencing、超时清理和返回形状未退化。
4. 允许路径是否过宽或漏掉必改文件；`workflow-driver.mjs` 与 DHR_72 并行 WIP 的行级边界是否可执行。
5. `DHR_70 → DHR_75 → DHR_72 → DHR_35` 是否无环；DHR_73 与 DHR_74 回签义务是否被遗漏或错误前移。
6. heavy、五路复核、第二轮选变异点、真实 DSH-off 证据是否与风险相称。
7. 是否把 DHR_75 证据冒充 DHR_72 机器证 F/DHR_35 P6-M1，或把 B-38 quota 阻塞顺手纳入。
8. 正式落盘与 DHR_75 D-start、E10 与 E11/verify 是否明确分闸。

## 输出格式（回复正文，固定三段）

### 方案问题

逐条写：级别、问题、原始需求或独立事实、影响、建议。无问题也要列已核假设、反例和证据。

### 用户理解风险

指出哪些表述可能让用户误以为 TTL、fencing、DHR_72 或真实验收已经完成。

### 需要用户决定的问题

只列真正需要用户决定的取舍；给明确推荐与代价。不得替用户确认。

最后附：实际打开的文件、当前 HEAD、`git status --porcelain` 前后结果、是否运行测试（静态审核默认不运行）。
