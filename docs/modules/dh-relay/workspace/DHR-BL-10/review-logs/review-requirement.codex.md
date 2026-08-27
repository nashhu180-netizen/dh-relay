# 需求复核（E4）· DHR-BL-10

- **复核身份**：codex CLI · `/codex` 插件 · 只读 · `--fresh` 独立 thread · 2026-08-27
- **独立性**：未参与实施；未继承代码轮 1 / 技术裁定复核 / 教训复核任一会话
- **指令集**：[../review-briefs/review-requirement.md](../review-briefs/review-requirement.md)

## 结论：有漂移（1 × P1、2 × P2）

| ID | 级别 | 问题 | 处置 |
|---|---|---|---|
| RQ-1 | **P1** | 返工轮 2 把 `-Cli CLAUDE/CODEX` 改为 fail-closed 报错。候选-5 能说明工程理由，**却不是用户授权**；原始需求只要求新增 zcode 的 headless 位。该改动扩大交付行为面并改变既有 CLI 兼容性 | **用户 2026-08-27 对话点选「接受，补进需求」** → 主控回填 `backlog.md` DHR-BL-10「范围追加（RQ-1）」+ `brief.md` 完成条件 9/10 → F-014 resolved |
| RQ-2 | P2 | 完成条件 6 的实际 diff 门未通过：新增工件散文中含 `apiKey`、`.zcode` 等被条件明列禁止的字面量 | 主控重写完成条件 6（范围限定生产代码与 as-built 的新增行）并新增 6b（闸门自身的文档不算命中）→ F-015 resolved |
| RQ-3 | P2 | 七份 e2e 工件能证明协议字段自洽，但**不能独立证明由真实 zcode 进程产生**；人验项尚无用户确认 | 返工轮 4 补 `evidence/e2e/provenance/`（OS 进程账 + zcode 仓外会话日志元信息 + 工件 written_at 三线咬合 + 重跑法）→ F-016 resolved；人验待用户 |

## 完成条件对账（复核方原判）

条件 1/2/3/4/8 判「是」；条件 5 判「账本支持」（复核方只读未亲跑）；条件 6 判「否」→ RQ-2；条件 7 判「部分」→ RQ-3。

## 边界与允许路径核查（复核方原文要点）

- 生产/测试改动仅 `tools/host/relay-worker-entry.ps1`、`tools/host/run-dogfood.ps1`、`tools/tests/relay-agent-tool.ps1`，均在允许路径内
- 文档改动仅 `as-built/relay-psmux-host.md` 与 `workspace/DHR-BL-10/` 下工件，均在允许路径内
- 未跟踪文件全部落在 `workspace/DHR-BL-10/**` 放行子树内
- **未触及** `relay-core/`、`tools/contracts/`、`tools/runner/`、`tools/policy/`、`tools/adapters/`、DevPlan 状态
- backlog / brief / as-built 三处对「zcode 只走 headless 一次性形态、不驻留」的描述**一致**，无一处写成「也支持常驻交互」

## 复核方核过且判无漂移的点

zcode 调用形态与「只接 headless 位」一致；生产改动限于 host entry 与 dogfood 参数校验；claude/codex 规范小写下命令行字符串未变；`run-dogfood.ps1` 默认值仍 `claude`；as-built 描述与 backlog/brief 一致；e2e 工件身份字段与 receipt fixture 自洽（问题在来源可归因性，不在字段矛盾）。
