# H2 方向决策账 · 真实业务任务接力试点（IHSR_05，2026-08-16）

> 承接 DHR_03 销户记录里的 H2 条件「先跑真实业务任务再定」。本文件是**试点运行事实与结论**的留痕，不是新任务卡；dh-crew 代码零改动，包装脚本与 brief 放在业务仓工作区。

## 试点对象

- 业务仓：`D:\MyFiles\ai-workflow\02-agent-workspace\infohub-vps-services`，任务 IHSR_05「源仓候选增量：aggregator 非默认化与手册目标态修订」（标准档；改源仓 Compose/回滚脚本/两份手册/journal，不部署）。
- 工作区：`docs/modules/infohub-service-recovery/workspace/05-IHSR_05-源仓候选增量与手册目标态修订/`；relay 包装 `relay/run-relay.ps1`（改编自 `tools/relay/host/run-dogfood.ps1`）+ 6 个 brief 模板；主控 oracle `evidence/run-local-validation.ps1`。
- 运行现场：`.dh-runtime/relay/RELAY-IHSR05-20260816100959`（首趟）、`RELAY-IHSR05-RW-20260816113004`（返工趟）；证据整拷至业务仓 `evidence/relay/`、`evidence/relay-rework1/`。

## 接力形态（与 DHR_03 dogfood 的差异）

| 项 | DHR_03 dogfood | 本试点 |
|---|---|---|
| 编排 agent | headless `claude -p` 一次性 orchestrator/replanner | **未启用**：主控包装直接写 plan-v1（build→review1→review2；返工趟 fix→review3→review4）；无 replanner |
| worker | 假需求 A/B/C | 真施工（cwd=源仓 worktree `D:\wt\IHSR_05`）+ 真复核（fresh Grok `~/.claude-grok` / fresh Opus 默认账号新会话），每节点独立 cwd 与 CLAUDE_CONFIG_DIR |
| 完成判据 | 文件存在 | 主控 oracle（Docker/WSL 断言）+ 两轮 fresh 复核 |
| 返工 | 无 | 第二趟 relay（fix + 两轮复审），共 6 棒 |

## 统一口径数据（对齐 DHR_03 H2 对照表）

| 口径 | 首趟 | 返工趟 |
|---|---|---|
| 人工操作次数（用户显式确认/回答/重启） | 1（build 窗口 AskUserQuestion 二选一，用户误点 + 主控 send-keys 双重落到选项 1；见 F-006） | 0 |
| 面向用户的状态通知数 | 主控在对话里约 8 条阶段汇报（非 relay 自动推送） | 约 4 条 |
| 棒数 / 全部交棒 | 3/3 succeeded | 3/3 succeeded |
| 宿主异常 | 1（截图 GDI+ 长路径崩溃→同 RunId 恢复成功） | 0 |
| 复核结论 | review1 approved / review2 changes-requested（P1×1） | review3 approved / review4 approved（P0/P1=0） |
| 总时长 | 10:10–11:20（含 23 min 宿主宕机） | 11:30–12:20 |

## 实证到的能力

1. 真实业务任务在 relay 上跑通「施工 → 两轮 fresh 复核 → 返工 → 两轮复审」六棒，worker 全程按 brief 写 checkpoint/result/handoff，无一棒憋死。
2. Runner 状态可续：宿主进程崩溃 23 分钟后以同 RunId 重启，直接吸收已落盘的 result、回收窗口、拉起下一棒。
3. fresh 复核有真牙：round2 用一条 `--dry-run` 命令推翻 round1 的降级理由并逮到 P1；round3/4 逐条复验返工。
4. 每节点独立账号/cwd 的接线（LaunchCommand 闭包按 node_id 映射）可用，无需改 dh-relay 代码。

## 暴露的问题（建议进 dh-relay backlog）

| ID | 级别 | 事实 | 建议 |
|---|---|---|---|
| RB-1 | P2 | `Save-RelayScreenshot` 在证据路径 >260 字符（含中文）时 GDI+ Save 抛 generic error，宿主循环整体崩溃（业务仓 F-005） | host 层截图必须 try/catch 非致命；或证据先落短路径再拷 |
| RB-2 | P2 | 无 replanner 时 worker `dependency_blocked` 会让宿主空转到 MaxTicks；本试点靠主控人工处理 | 提供「主控手动 propose v2」的最小路径或 CLI，不必起 headless replanner |
| RB-3 | P3 | 主控用 `psmux send-keys` 代答 worker 的 AskUserQuestion 落错选项（业务仓 F-006）；同时用户在窗口也误点 | decision 场景只允许用户本人在窗口作答；主控事后核 checkpoint |
| RB-4 | P3 | brief 模板/plan 结构/节点账号映射目前写死在业务仓包装里 | 若进完整流水，抽成 dh-relay 的通用「plan 描述文件 + brief 目录」输入 |
| RB-5 | P3 | 交互 claude 会在输入框展示自动建议的下一步（灰字），用户可能误发（本次出现「加 .gitattributes」建议，超范围） | worker 交棒后由宿主尽快 stop 会话（现已如此），并在 brief 里写明「交棒后不接受任何新指令」 |

## H2 判断（用户 2026-08-16 12:38 对话点选「值得，进完整流水」；IHSR_05 已 verify `87e1175` 销户）

- 条件「先跑真实业务任务再定」已满足：真实标准档任务全流程跑通并收敛到 0 P0/P1。
- 已裁决：H2=值得进完整流水；下一阶段优先级=RB-1/RB-2 → 编排 agent 接回 → 通用 plan/brief 输入 → 复核汇合/返工回路进 Runner。
- 用户 2026-08-16 另指示：下次 relay 派活试 codex-ninth（codex CLI + ninth 账号）当一棒。
