<!-- dh:v1 · task_plan.md — 施工图（实施方案的家）。🔵 开工那一刻才写，一次性消耗品：跑偏了去 progress.md 记实际，不回头改这里。
     标准档详到"另一个 agent 能照着直接施工"（动哪个文件 / 关键代码片 / 测试点）——因为马上执行、当场消耗、从不维护；轻档可只写大方向。
     本模板标准档专用；派 headless worker 的轻档请改用 `task_plan-轻档.md`。 -->
# task_plan — DHR_31 basic-agent-task 端到端闭环

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：执行者默认“只知道本文件 + `brief.md` + DevPlan 任务卡”，不得靠脑补上下文施工；按步骤照做，偏离路线只记 `progress.md` 不回写本文件；每批默认 3 步或一个可独立验证功能点后，先跑本批验证并给阶段汇报（①~⑦），再继续下一批。

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `docs/modules/dh-relay/dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §3.2 DHR_31 + §2.1/§2.3 + §4.1 | 验收口径唯一权威；实现单元与最小 Runtime 接口定义（`validate(request)` 在 §2.3） |
| C-002 | `docs/modules/dh-relay/workspace/DHR_31/brief.md` | 完成条件只读副本 + 边界 |
| C-003 | `relay-core/README.md` | 硬约束 6 条 + 「改了什么跑什么」基线对照表——动 relay-core 前必读 |
| C-004 | `docs/modules/dh-relay/as-built/relay-core.md` | 现役实现快照（runtime service / store / rpc / cli / bridge 是怎么长成现在这样的） |
| C-005 | `docs/modules/dh-relay/design/06-多控制面与Headless-SSH运行-设计补充.md` §11 验收命题 | H1/H2/H3/H5/H6/H7/H12 命题原文 |
| C-006 | `relay-core/contracts/`（schemas + `reason-codes.md` + `capability-baseline.json`） | 协议冻结集与指纹；`relay.resolved-plan/v1` v0 形状是 Workflow 定义的起点；改契约必须走批次 + 重生成三份基线 |
| C-007 | `docs/modules/dh-relay/workspace/DHR_30/review.md`（RISK-DHR30-DSH-RENDER 登记位：当前状态行 + 条件 5 取证路径分析）+ `workspace/DHR_30/evidence/` | 承接的风险项原文（另见 verify `93df648` Risk-Refs）；终端冒烟转录的证据格式先例 |
| C-008 | `docs/modules/dh-relay/workspace/DHR_26/findings.md` + DHR_49 workspace（DSH Host Plugin 侦察落档） | 树外 DSH 插件施工依据：`dsh plugin` profile 装载、`ctx.provide` API、repack 流程、rc 迭代风险 |
| C-009 | Code Scout 侦察报告（progress.md E-002 挂账） | relay-core 现状结构、CLI→runtime 调用链、测试与证据惯例 |

## 施工步骤 (Steps)　★详细级（轻档在 task.md 写精简 3–5 步即可）

<S2 主会话依据 Code Scout 侦察结果起草，写到 headless worker（codex）可照做粒度；起草后本节一次性冻结，跑偏只记 progress.md。>

（待 S2 填写——本卡派 codex headless worker 施工，步骤必须落到函数/文件/断言粒度并按批次检查点分批。）

## 关键决策（一句话各一行）

- Worktree：是，分支 = `wt/DHR_31`，目录 = `.dh-worktrees/DHR_31`
- 派子 agent：是——施工全部派 codex headless worker（用户 2026-08-28 确认「全用 codex，zcode 没额度」；DSH 部分不留主会话，取证不了的缺口记 findings 回落用户）
- Review：批次小审 + 轮 2 换人复核 = fresh-context subagent / codex 只读（按 `references/复核只读派发.md`）；E4/E5/E14/E6/E7 委托 subagent（用户确认按默认）
