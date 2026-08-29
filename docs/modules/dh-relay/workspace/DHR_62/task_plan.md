<!-- dh:v1 -->
# task_plan — DHR_62

## 要读的上下文 (Context Packet) ★前置

| ID | 路径 | 用途 |
|---|---|---|
| C-001 | `AGENTS.md` | 宪章与并行 WIP 边界 |
| C-002 | `workspace/DHR_62/brief.md` | 本卡合同 |
| C-003 | `dh dh-relay` 当前输出 | 70 项精确失败清单 |

## 施工步骤 (Steps)

| # | 动作 | 验证 |
|---|---|---|
| 1 | 按卡/规则分组 70 项，核对源文件与证据账。 | 分组数与总数一致 |
| 2 | 先做纯格式修复，再做须事实核验的引用/覆盖修复。 | 每批 `dh dh-relay` 失败单调下降 |
| 3 | 对不可证项保留未通过语义，不以文字漂绿。 | Opus fresh 复核 |
| 4 | 记录证据并收口。 | dh exit 0、diff-check 通过 |

## 关键决策

- 标准档，`task_type=normal`；施工 Codex，复核 Opus。
- 精确路径提交；不使用 `git add -A`。
