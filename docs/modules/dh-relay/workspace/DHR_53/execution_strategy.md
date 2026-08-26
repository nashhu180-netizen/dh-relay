<!-- dh:v1 -->
# execution_strategy — DHR_53

## 操作模型

派子 agent（主控 = 本 Claude session；施工 = `omp`；复核 = fresh `codex`）。分 4 批，每批主控收口后再派下一批。

| 角色 | 后端 | 形态 | 备注 |
|---|---|---|---|
| 主控 | Claude Code（opus[1m]） | 主 session | 只做派活、验证、裁决、落账；不写生产代码 |
| 施工 | `omp`（默认 modelRoles `openrouter/stealth/ox-alpha:max`） | `omp -p --auto-approve --cwd <worktree>` 非交互 | 用户指定；分批派，每批一个 prompt |
| 施工兜底 | `codex exec -m gpt-5.6-terra`（effort high） | 可写沙盒 | omp 连续两批不可用/产出不可用时切换 |
| 复核 | `codex exec --sandbox read-only -m gpt-5.6-terra` | subagent 包裹，OS 级机器只读 | 每轮 fresh 会话；施工者不复核自己的卡 |

## 子 agent 授权

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| `omp` 施工 | 可写：`relay-core/contracts/`（仅新增文件 + `reason-codes.md` 追加）、`relay-core/resolver/`（新建）、`relay-core/fixtures/`、`relay-core/test/`、`relay-core/tools/validate.mjs`、`relay-core/package.json`（仅 `scripts.test`）、`relay-core/capability-baseline.json`（由工具生成）、本工作区 `progress.md` / `findings.md`。禁写：`docs/**/design/**`、`docs/**/dev_plan/**`、仓根 `.gitignore`、`AGENTS.md`、既有 7 份 schema、`.dh-worktrees/DHR_30/` | 主控（依据用户当晚授权） |
| `codex` 复核 | 全仓只读（OS 沙盒强制）；结论由主控转录进 `review.md` | 主控 |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标"待验收"。
- **今晚不代签 verify、不合入 master、不销户**：E11 人闸留给用户（见 `decisions.md` D-001/D-005）。
- 子 agent 默认无写权，要主控按上表批准。
- 施工 agent 不得自行进入复核（AGENTS.md 编排协议段 · 硬节点边界）。
