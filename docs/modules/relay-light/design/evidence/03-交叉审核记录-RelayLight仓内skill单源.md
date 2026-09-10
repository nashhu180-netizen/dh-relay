# RelayLight 仓内 skill 单源 — A/B 调整审核与确认记录

## review-rlt-a03

<!-- dh:planning-evidence:v1 event=RLT-A-03 artifact=design/01-RelayLight-产品设计与验收.md kind=review -->

- **事件**：`RLT-A-03`，A-full 增补。
- **候选**：`design/drafts/A02-仓内skill单源-增补候选.md` v6。
- **审核过程**：v1～v5 经多轮 fresh-context 复审，先后发现遗漏生产写入者、安装卡死锁、改源后无人重装及过度事务化等问题；用户随后明确要求“不用这么严谨，不用过度设计，不行就全部重新同步下就好”，据此收缩为 v6。
- **最终窄复审**：fresh-context Codex `gpt-5.6-terra` high，在 `git archive HEAD` 加候选草案的不可写快照中只读复核；P0=0、P1=0、P2=0，结论为“建议进入讲解与理解确认”。
- **最终核查结论**：仓内唯一源、失败后整套重同步、A32/A124/A125 唯一 owner、20 卡无环、RLT_18 终局重同步均成立；v4/v5 的 manifest 历史/ID、`plan_loaded` 新键、事务/回滚/中断恢复与逐次收据目录要求均已移除。

## understanding-rlt-a03

<!-- dh:planning-evidence:v1 event=RLT-A-03 artifact=design/01-RelayLight-产品设计与验收.md kind=understanding -->

- **讲解**：唯一源在仓内；安装器 `--all` 全量覆盖当前机器 Claude/Codex 两侧；失败不承诺原子或回滚，排除原因后整套重跑；退出 0 且两侧五文件哈希一致后才可启动新计划；只保留可覆盖的当前 manifest。
- **理解问题**：如果 `--all` 执行到一半失败，正确处理是什么？
- **用户回答**：`重新来一次`。
- **解释与判定**：理解正确；精确含义是先排除失败原因，再整套执行 `--all`，直到退出 0 且两侧五文件哈希一致。
- **用户确认**：2026-09-10 明文“确认”，授权将 v6 正式落入设计与开发方案；不授权任何任务开工、代码实现、用户目录写入、verify、合并或推送。

## adjust-rlt-b02

<!-- dh:planning-evidence:v1 event=RLT-B-02 artifact=dev_plan/P1-RelayLight-开发方案.md kind=review -->

- **事件**：`RLT-B-02`，B-adjust。
- **调整结论**：新增 `RLT_20` 首次安装卡；A32 改挂 RLT_20，A124 挂 RLT_01，A125 挂 RLT_17；卡数 19→20，验收 119→121。
- **依赖结论**：新增 `RLT_01/06/07/08 → RLT_20 → RLT_12` 与 `RLT_17 → RLT_18`；RLT_01 不依赖 RLT_07，图无环。
- **确认复用**：A/B 两份候选同轮讲解、理解与用户确认，见上节。

## understanding-rlt-b02

<!-- dh:planning-evidence:v1 event=RLT-B-02 artifact=dev_plan/P1-RelayLight-开发方案.md kind=understanding -->

- B-adjust 与 A-full 增补是同一项单源变更，同轮完成讲解与理解问题。
- 用户理解“失败后整套重跑”的处置，并于 2026-09-10 明文确认 v6 正式落盘。
