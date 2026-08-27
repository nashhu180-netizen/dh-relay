<!-- lesson_candidates.md — 教训候选。🟢 收尾顺手记。AI 起草、人裁决。 -->
# lesson_candidates — DHR-BL-10

## 教训候选

| ID | 一句话教训 | 状态 |
|----|-----------|------|
| L-001 | 接第三方 CLI 进派活位时，先把它做成 PATH 命令 + 自带环境认证（与既有 CLI 同构），仓内代码就只剩一个分支名——绝对路径和凭据注入都不必进仓 | ready-for-review |
| L-002 | CLI 的 `--help` 不是契约：zcode 0.16.5 列了 `--max-turns` 但实现直接拒收。接新 CLI 必须逐个参数实测，别照抄帮助文本 | ready-for-review |
| L-003 | 「换模型做第二轮换人复核」与「换 CLI 账号」是两件事。历史上靠 `CLAUDE_CONFIG_DIR` 换账号来换模型，把两者耦在一起；换独立 CLI 后进程/配置/凭据/会话四层天然隔离，复核独立性更硬 | ready-for-review |

> 状态流：`ready-for-review`（AI 觉得可能重要）→ 人裁决 →`needs-promotion / promoted / rejected`
