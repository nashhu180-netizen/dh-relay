# agent-workbench MVP（AW_03→AW_07）· 单卡接力总表

> 类型：卡级衔接总表。人工/会话维护，不是 relay_log.py 执行计划。

Issue：豁免（本表不单独立 Issue；各卡在 agent-playground 自建 Issue/Draft PR）
维护会话：AW_07 orchestrator（Herdr `aw07-orch`，workspace `AW_07` w62 / pane w62:p1，Claude Opus 5.5）；2026-10-06 由 AW_06 orchestrator（aw06-orch，w5R:p1）移交，已收到 `[relay-light] card-chain maintainer-ack AW_07` 并核对其 execution_strategy.md「卡级总表」登记
自动接续授权：用户 2026-10-01 在 agent-playground 主控会话原话「按建议建总表，开新的任务时，新建个space进行。一个任务一个space」，确认主控上一条提议（AW_04–AW_06 写「是」、AW_07 写「否」，分工沿用 AW_03 最终配置）；本栏由主控按该指示代填。AW_07 行：用户 2026-10-05 在 aw06-orch 会话原话「等结果，开新的space 自动接续」，随后在 AskUserQuestion 点选「只改自动接续，部署另授权 (Recommended)」——AW_07 改「是」、分工沿用页头，目标机部署授权移到部署前单独确认；本行由 aw06-orch 按该指示代填
最近核对：2026-10-07

分工（「是」行共用，写定即视为该卡 model-allocation gate 确认）：orchestrator=Claude Opus 5.5/medium；builder=Codex gpt-6-astra/medium；plan-reviewer=Codex gpt-6-astra/medium（fresh；用户 2026-10-01 原话「总表分工里把 plan-reviewer 补上，用 astra medium」，经主控转达）；coder=Codex gpt-6-astra/medium；batch-reviewer=Codex gpt-6-astra/high；final-reviewer=Codex gpt-6-astra/medium（每轮 fresh）；decider=Claude Fable 5.1/medium；watcher=Devin SWE-2/medium。每张卡独立新建一个 Herdr workspace（用户：一个任务一个 space）。

| 任务 ID / 原卡与恢复入口 | 接棒条件 | 自动接续 | 接力情况 | 下一步 / 交棒去向 |
|---|---|---|---|---|
| AW_03；agent-playground:docs/modules/agent-workbench/dev_plan/P1-agent-workbench-V1-开发方案.md §AW_03；workspace agent-playground:docs/modules/agent-workbench/workspace/AW_03/ | AW_02 verify e5f2c6e（已满足） | 否（本表建立前已由用户单卡授权完成） | 已交棒：verify a96759f，合入 main bd04962（PR #7/#8，Issue #6） | AW_04 |
| AW_04；agent-playground:docs/modules/agent-workbench/dev_plan/P1-agent-workbench-V1-开发方案.md §AW_04 | AW_03 verify 提交 a96759f 已在 origin/main（bd04962）——以 verify 为准（已满足） | 是，orchestrator=Claude Opus 5.5/medium；其余角色见页头分工 | 已交棒：verify 4ab4f8b，合入 main 59b68f1（PR #10 squash af928ea + 收口 PR #11，Issue #9）；合入态复核 review.merged.md PASS | AW_05（2026-10-02 已自动接续） |
| AW_05；同上 §AW_05 | AW_04 verify 提交在 origin/main——以 verify 为准 | 是，orchestrator=Claude Opus 5.5/medium；其余角色见页头分工；真实企微群发送不在本栏预授权，AW_05 orchestrator 须在真实发送前向用户确认 | 已交棒：verify c02dcaa，合入 main 78e6bd2（PR #13 squash 474e8cb + 收口 PR #14，Issue #12）；真实企微发送经用户 U-001/U-002 授权，群收件 U-007；合入态复核 review.merged.md PASS、凭据扫描 r4 254/254 分类 | AW_06（2026-10-03 已自动接续） |
| AW_06；同上 §AW_06 | AW_05 verify 提交在 origin/main——以 verify 为准 | 是，orchestrator=Claude Opus 5.5/medium；其余角色见页头分工 | 已交棒：verify 9e51e30，合入 main ffc71e3（PR #16 squash 9b72395 + 收口 PR #18，Issue #15）；第四次真实整链与群收件 U-027、E7 恢复；workflow-final 五路 PASS；合入态复核 review.merged.md PASS recommend=a、凭据扫描 unclassified 0；B2-F-001 遗留→AW_07（U-028） | AW_07（2026-10-06 用户人工放行开工） |
| AW_07；同上 §AW_07（目标机常驻部署） | AW_06 verify 在 origin/main——以 verify 为准；AW_02 P2-5（MCP 转发调用方鉴别）须先关闭（有证据指针）。目标机部署/环境授权不再是开工条件，改为部署前单独确认（用户 2026-10-05） | 是，orchestrator=Claude Opus 5.5/medium；其余角色见页头分工；目标机部署与任何测试/生产环境变更不在本栏预授权，AW_07 orchestrator 须在部署前向用户单独确认 | 进行中：开工依据同前（用户 2026-10-06 人工放行；Issue #19、Draft PR #20、分支 wt/AW_07、workspace w62）。plan-review r4 PASS（4fb1240）；batch1（本机）batch-review r2 PASS（e64a84d，被审 f8c7553），独立 reviewer 判 AW_02 P2-5 可关闭（路线 A：回环 TCP + /proc/net/tcp 对端 uid）；batch2 本机部署准备 review r1 PASS（7babfae，被审 fa2bae9），runbook 定点修订 8256cc3 编排核对通过；等待：用户在目标机手动执行 runbook §1 只读 admission 并贴回（U-008），后续 runtime 写入前需 GitLab 地址/获准 SHA/npm 源/ThinkBook 推送路径；B2-F-001 仍 open（证据：agent-playground:docs/modules/agent-workbench/workspace/AW_07/execution_strategy.md） | AW_07 收口；目标机部署前须用户单独确认 |
