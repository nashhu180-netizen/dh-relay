# agent-workbench MVP（AW_03→AW_07）· 单卡接力总表

> 类型：卡级衔接总表。人工/会话维护，不是 relay_log.py 执行计划。

Issue：豁免（本表不单独立 Issue；各卡在 agent-playground 自建 Issue/Draft PR）
维护会话：AW_04 orchestrator（Herdr `aw04-orch`，workspace `AW_04` w5H / pane w5H:p1，Claude Opus 5.5）；2026-10-01 由主控（w4V:p1）移交，已收到 `[relay-light] card-chain maintainer-ack AW_04` 并核对其 execution_strategy.md 登记
自动接续授权：用户 2026-10-01 在 agent-playground 主控会话原话「按建议建总表，开新的任务时，新建个space进行。一个任务一个space」，确认主控上一条提议（AW_04–AW_06 写「是」、AW_07 写「否」，分工沿用 AW_03 最终配置）；本栏由主控按该指示代填
最近核对：2026-10-01

分工（「是」行共用，写定即视为该卡 model-allocation gate 确认）：orchestrator=Claude Opus 5.5/medium；builder=Codex gpt-6-astra/medium；coder=Codex gpt-6-astra/medium；batch-reviewer=Codex gpt-6-astra/high；final-reviewer=Codex gpt-6-astra/medium（每轮 fresh）；decider=Claude Fable 5.1/medium；watcher=Devin SWE-2/medium。每张卡独立新建一个 Herdr workspace（用户：一个任务一个 space）。

| 任务 ID / 原卡与恢复入口 | 接棒条件 | 自动接续 | 接力情况 | 下一步 / 交棒去向 |
|---|---|---|---|---|
| AW_03；agent-playground:docs/modules/agent-workbench/dev_plan/P1-agent-workbench-V1-开发方案.md §AW_03；workspace agent-playground:docs/modules/agent-workbench/workspace/AW_03/ | AW_02 verify e5f2c6e（已满足） | 否（本表建立前已由用户单卡授权完成） | 已交棒：verify a96759f，合入 main bd04962（PR #7/#8，Issue #6） | AW_04 |
| AW_04；agent-playground:docs/modules/agent-workbench/dev_plan/P1-agent-workbench-V1-开发方案.md §AW_04 | AW_03 verify 提交 a96759f 已在 origin/main（bd04962）——以 verify 为准（已满足） | 是，orchestrator=Claude Opus 5.5/medium；其余角色见页头分工 | 进行中：Issue #9、Draft PR #10、分支 wt/AW_04（开工 a38169d）、Herdr workspace AW_04（w5H） | AW_04 收口时由其 orchestrator（维护会话）对 AW_05 自动接续 |
| AW_05；同上 §AW_05 | AW_04 verify 提交在 origin/main——以 verify 为准 | 是，orchestrator=Claude Opus 5.5/medium；其余角色见页头分工；真实企微群发送不在本栏预授权，AW_05 orchestrator 须在真实发送前向用户确认 | 等待：AW_04 verify | AW_04 收口时由维护会话自动接续 |
| AW_06；同上 §AW_06 | AW_05 verify 提交在 origin/main——以 verify 为准 | 是，orchestrator=Claude Opus 5.5/medium；其余角色见页头分工 | 等待：AW_05 verify | AW_05 收口时由维护会话自动接续 |
| AW_07；同上 §AW_07（目标机常驻部署） | AW_06 verify 在 origin/main，且用户单独给出部署/目标环境授权；AW_02 P2-5（MCP 转发调用方鉴别）须先关闭 | 否 | 等待：AW_06 verify 与用户部署授权 | 维护会话核对后报告用户，等放行 |
