<!-- dh:v1 · review.md — RLT_30 验收靶与复核登记。 -->
<!-- dh:review-policy:v1 mode=single-full-targeted max_attempts=2 -->
# review — RLT_30

## 验收靶

| # | 验收 ID | 类型 | 证据 | 结论 |
|---|---|---|---|---|
| 1 | `HC-RL-A131`（RLT-A-15 修订：12 角色） | 机器证 | 待填 | 待填 |
| 2 | `HC-RL-A163`～`A165`、`A167`（措辞回归） | 机器证 | 待填 | 待填 |
| 3 | `HC-RL-A43`、`A44`（§10.3 样张逐字） | 机器证 | 待填 | 待填 |
| 4 | `HC-RL-A69`、`A85`、`A93`、`A119` + `A62`（三条规矩、键枚举不变） | 机器证 | 待填 | 待填 |
| 5 | grep 三项（完成条件 5） | 机器证 | 待填 | 待填 |
| 6 | 全量回归 + CI | 机器证 | 待填 | 待填 |
| 7 | 两机四份副本同步 | 机器证 | 合入后填 | 待填 |

## 独立复核区（执行者 ≠ 复核者；normal 三路）

**code_review 初审结论**：待填

**定向复查登记（attempt 2，仅 open P0/P1 后填；同一 reviewer_session_id）**：待填或 N/A

**有效单测·变异点登记**

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `tools/relay-light/relay_log.py:1725`（`_writer_display_name`） | `"stage-lead" if writer == "monitor" else writer` → `writer` | 改返回值 | `test_design_10_3_text_snapshot_is_reproduced_line_by_line`、`test_status_reports_the_last_writer_and_silence_without_driving_actions` | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest <两测试>`（`tools/relay-light/`） | 76636bc9ffb81c06f0ea8498ec4e767e55af5c0f | 716329a66000449511e122b84aaaf86b155f8b0a | 主会话（施工方；normal 卡不强制轮 2 选点，复核实例核对） | 断言失败 |
| `tools/relay-light/relay_log.py:1721`（`_writer_label`） | `"stage-lead (by=monitor)" if writer == "monitor" else writer` → `writer` | 改返回值 | `test_writer_consistency_exits_two_for_every_frozen_owner`、`test_a155_status_warnings_preserve_old_a85_a93`、`test_rlt30_close_writer_messages_name_stage_lead_with_ledger_value` | 同上（三测试） | 4ea55d174c24474fef19fe1be46943ace389b34c | 716329a66000449511e122b84aaaf86b155f8b0a | 主会话（同上） | 断言失败 |

**需求复核结论**：待填

**教训复核结论**：待填

---

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：待填

**设计契约传导声明**：待填

**需求对齐证据**：待填

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | roles.toml 12 角色、各有 model/launch | AI | | |
| 2 | single-task 观察者称 watcher、九值闭集含 watcher 不含 monitor；结构测试通过 | AI | | |
| 3 | status 文本与 §10.3 样张逐字一致；`derive_last_writer` 仍返回 `monitor` | AI | | |
| 4 | 错误/告警三条规矩；错误码与退出码、JSON 键枚举不变 | AI | | |
| 5 | grep ①②③ | AI | | |
| 6 | 全量回归 + CI 三硬门 | AI | | |
| 7 | 两机四份副本同步、LF 哈希一致 | AI | | |

**风险放行账表**：待填

**材料齐没齐**：[ ]
**as-built 更新了没**：[ ]

→ 当前状态：**施工中**

---

## 人类签名区

H=0，无人判项；E10 放行包确认记录收口时填写。
