<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。 -->
# execution_strategy — DHR_04 隔离/禁改/落点守卫

## 操作模型

**用 dh-relay 自己驱动 dh-relay 的开发（stage0 自举）**——本卡是这条路线的第一张试水卡。

- **驱动器 = stage0 冻结副本 `D:\relay-stage0\`**：整份复制自 `tools/relay/` @ `34df46a`，**永不手改**。跑的代码与被改的代码物理分离，避免"开着车换发动机"。
- **被改对象 = 任务树 `.dh-worktrees/DHR_04`**：worker 的 cwd 落在这里，本卡只改 `tools/relay/policy|tests/` 与本工作区。
- **接力棒**：`build`（施工）→ `review1`（第一轮复核）→ `review2`（第二轮换人复核），由 stage0 Runner 按依赖串行调度，每棒一个可见 psmux 窗口。
- **主控（本会话）不写卡内代码**：只负责建 stage0、写接力计划与三份 brief、守着宿主终端、汇合复核结论、收口。
- **不做无人值守**（用户 2026-08-16 明确不需要）：P1 宿主是调用方进程内有界 tick 循环，主控留一个终端守着即可。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| `build` 棒 · grok（`CLAUDE_CONFIG_DIR=~/.claude-grok`） | 可写：任务树内 `tools/relay/policy/**`、`tools/relay/tests/**`、`docs/modules/dh-relay/workspace/DHR_04/{progress,findings,lesson_candidates}.md`。只读：其余全仓。禁改：`tools/relay/{contracts,runner,host,adapters}/**` 既有分支语义、dh-crew 一切、`D:\relay-stage0\`。 | 用户 2026-08-16 对话授权（"写代码让 grok 进行"） |
| `review1` 棒 · 默认账号（Opus） | **只读**全仓 + 写 `workspace/DHR_04/review-logs/review1.md` | 主控 |
| `review2` 棒 · account9（deepseek） | **只读**全仓 + 写 `workspace/DHR_04/review-logs/review2.md`；fresh 会话、可读已落账的 review1 | 主控 |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标"待验收"。
- 施工者（grok）不得复核自己的卡；两轮复核实例/会话互不重叠。
- **stage0 驱动器出问题不算本卡的 bug**：若跑不动是 relay 自身缺陷，停下记 `findings.md`，不在本卡顺手改 relay 核心（那是 DHR_05~DHR_10 的范围）。
- 本卡产出的守卫从下一张卡起成为每卡证据命令的必调项。
