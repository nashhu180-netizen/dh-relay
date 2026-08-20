# DHR_26 — P4 DevPlan 回填建议（收口时机械执行）

> **为什么不直接改**：2026-08-20 master 的工作树里有**另一个会话未提交的 `DHR-B-11` 调整**（P4 / P5 / dev_plan README 三个文件 modified，尚未 commit），与本卡要改的 P4 §3.1 任务行落在同一个文件。按 AGENTS 宪章的并行 WIP 纪律，本卡收口只提交 `workspace/DHR_26/**`（零重叠），DevPlan 行等 B-11 落盘后再单独回填。
>
> 回填时**只做下面这几处机械更新**，不要整文件覆盖。

## 一、§3.1 任务索引行（替换 DHR_26 那一行）

```markdown
| DHR_26 | 树外装载 DSH Host Plugin、升级到 rc.7 并完成树外插件现场侦察 | 标准 | 已完成 | DHR_25 | [workspace/DHR_26/](../workspace/DHR_26/review.md) | <verify SHA> | 桌面控制面轨 · Host 半程；DM1 / DM4a / DM5a 与版本基线事实已登记，未贴三态标签（三态归 DHR_27 人判）；侦察落档已交付，DHR_49 开工输入齐备 |
```

- 用户签收前状态写 `待验收`；`verify(dh-relay): DHR_26 …` 提交打完后再改 `已完成` 并回填 SHA。

## 二、头部 `dh:status` 块（按当时实际改，下面是本卡相关口径）

- 现状：DHR_26 已完成——Host 插件树外可装可卸（目录 / tgz 两种装法转录逐字节相同）、`ctx.relayPilot` 在 DSH 进程内可调用且两份 schema 原样透传、rc.6→rc.7 升级前后快照与对差齐备；两轮换人复核 + 两次收敛复检闭合，P0/P1 清零。
- 进行到：P4 ▸ DHR_26 已完成 ▸ DHR_49 可开工（其硬依赖「侦察落档」已交付，见 workspace/DHR_26/findings.md §5/§6/§13/§14）。
- 下一步：按用户对 B-11 的排序决定先走 DHR_27（CLI 收口）还是 DHR_49（Client 轨）。
- 看什么：workspace/DHR_26/review.md（两轮复核与证据挂账）、evidence/round2-lifecycle/README.md（怎么复跑）。

## 三、阶段闸事实登记（§4.2 P4-DM 表不改 ID，只在 DHR_27 汇总时引用）

| ID | 事实 | 出处 |
|---|---|---|
| P4-DM1 | 成立（不改上游即可加载，服务可调用，原样透传） | workspace/DHR_26 E-002 E-007 E-009 E-018 E-022 |
| P4-DM4a | 成立（安装 / 禁用 / 启用 / 卸载四态均有转录；卸载清理另有真 Cordis 注册→dispose 证据） | E-003 E-006 E-007 E-016 E-017 |
| P4-DM5a | 成立（只传普通 JSON，无活对象、无 RC 私有类型） | E-009 E-018 E-019 E-020 |
| 版本基线 | rc.6 → rc.7 已升；195→195 包、changed=186 全为自家包、安装根未变；两份升级前快照互证 | E-004 E-005 E-012 |

> **不得**据此在 P4 计划里写 `passed / passed-with-constraints / stopped-by-pilot` —— 三态由 DHR_27 人判收敛（§2.3）。
