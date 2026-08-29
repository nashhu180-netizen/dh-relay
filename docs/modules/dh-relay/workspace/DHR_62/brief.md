<!-- dh:v1 -->
# brief — DHR_62 全模块 dh-check 存量治理

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_62 | 计划外维护任务 | backlog `DHR_62` |

## 目标 (Outcome)

在不改变历史事实和生产代码的前提下，清零阻塞 DHR_61 verify 的模块级 dh-check 失败。

## Zero-context 自查

只治理当前 70 个 failure；存量 warning 不在范围，本卡新增 warning 必须解释或消除。查不到的证据写不可证，不得编造 E-ID、复核身份、集成口径或用户签名。

## 完成条件 ★必写

| # | 条件 | 谁验（AI / 人） | 出处 |
|---|---|---|---|
| 1 | `dh dh-relay` exit 0 且 failures=0。 | AI | DHR_62 / backlog |
| 2 | 每项修改均可回链现有工件；缺证据项保持未通过或明确 N/A。 | AI | DHR_62 / 防篡改边界 |
| 3 | 不改生产代码、不绕过 hook、不污染 DHR_32/33/34 并行 worktree。 | AI | AGENTS.md 宪章 |

## 边界 (Boundaries)

- In scope：命中 70 个 failure 的既有 workspace 文档、本卡工作区与 backlog 登记。
- Out of scope：生产代码、存量 warning 清理、补造测试/复核/人验、DHR_34 施工。
- 停止条件：某项只能靠改变历史结论或伪造证据消除；改记 findings 并保持失败。

## 触及子系统（收口时更新其 as-built）

- 为使现役边界与可证事实同步，允许最小更新 `as-built/relay-core.md`；不改任何生产代码或运行子系统。
- **失序补录（2026-08-30）**：首轮返工先按 R18 收口要求补了 as-built，后经复核才把“as-built 最小更新”与“存量/新增 warning 分流”回填本 brief；本行不伪装成开工前已冻结。
