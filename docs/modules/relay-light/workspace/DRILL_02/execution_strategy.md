<!-- dh:v1 -->
# execution_strategy — DRILL_02

## 操作模型

DRILL_02 走 relay-light 计划 `dryrun-win-01` 的固定流水：`W1 → C1 → R1 → F1`（见 `relay/dryrun-win-01/relay_plan.md` 节点表）。监工（monitor#1）管节点内 agent 拉停与账本，worker 只完成派单指向的当前节点，写完完成信号即停——relay-light 流水无 `node_closed` 等待。本 W 节点 builder 只产出七件套与单批 task_plan；plan-reviewer 独立审计划，PASS 后监工 `node_close` 并交编排进 C 阶段。

## 角色、写权限与禁止事项

| relay-light 角色 | 阶段 / 职责 | 写权限 | 禁止事项 |
|---|---|---|---|
| orchestrator | 编排：管阶段、stage 开闭、裁决出口 | 计划/账本/派单（其自身权限） | 不替 worker 施工或复核 |
| monitor#1 | 监工：本阶段节点内拉 agent、wait、写账本 | `relay/dryrun-win-01/` 账本与 dispatch | 不施工、不审核业务内容、不越阶段 |
| builder#1 | W1：七件套 + task_plan | `workspace/DRILL_02/**` 中七件套与 `done.builder.md`（`progress.md` 为 scribe 独占） | 不碰 `.gitignore` 与 `tools/`；不提前进 C1；不代签复核 |
| plan-reviewer#1 | W1：审计划，产出 `review.plan.md`（PASS/FAIL） | 该审核记录（只读仓代码） | 不改计划与代码；FAIL 由监工回 builder |
| coder | C1：`.gitignore` 追加段 + 两条验收取证 | `.gitignore`、`workspace/DRILL_02/**` | 不改 `tools/`；不删 `__pycache__/` 凑判据；不 stash/清理他人 WIP |
| checker | C1：批次小审，产出 `check.C1.md` | 该审核记录（只读） | 不修代码，不替 R1 两路复核 |
| scribe | C1/R1/F1：`progress.md` 独占维护（日志/E-ID 登记）、review.md 汇总、收口备料 | `workspace/DRILL_02/**` 指定文件（含 `progress.md` 唯一写权） | 不改施工结论，不代签 |
| decider | C1 `on:blocked` 才拉起：裁决 BLOCKED | 指定 decision 记录 | 不扩 allowed-paths，不越用户/合同闸 |
| reviewer（lesson / consistency） | R1：light Recipe 两路独立复核 | `review.lesson.md` / `review.consistency.md` | 只读不改；不删路径不降级 |

## 批次同步点

```text
W1: builder DONE(W_READY)
  → plan-reviewer DONE(PASS|FAIL)（FAIL 则监工把 P1 项回 builder 同实例修订复审，直至 PASS）
  → monitor node_close + stage_result(done)
C1: coder DONE(READY_FOR_REVIEW|BLOCKED)
  ├─ BLOCKED → decider 裁决 → 监工按裁决重派
  └─ checker DONE(PASS|FAIL)（FAIL 回 coder）→ scribe 汇总 progress.md
R1: lesson + consistency 两路并发 DONE → scribe 汇总 review.md
F1: scribe 收口备料（as-built/AI 提交区/汇报证据区）
```

- 上一节点未 durable 收口，不得进入下一节点；worker 完成即停，不等 `node_closed`。
- `W_READY` 不是 C1 开工令——C1 由监工按 relay_plan 另派 coder。
- 测试绿 / checker PASS / reviewer 结论均不等于 verify、验收、push、PR、CI、merge 或发布；本卡为非正式预演，不计 RLT_12 状态。

## 结构化信号

durable signal 不共写：**每角色只写自有的 `done.<role>.md`**（文件名取 relay_plan agent 表名；scribe 跨节点由 batch 区分），**`progress.md` 归 scribe 独占**，其余角色不写。每角色在自有 done 文件写一行：

```text
DONE task=DRILL_02 role=<builder|plan-reviewer|coder|checker|scribe|decider|lesson|consistency> batch=<W|C1|R1|F1> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|BLOCKED|DONE> evidence=<逗号分隔,含 commit=SHA> next=monitor
```

status 取值以当班监工派单逐字为准；写完信号立即停止，不自行启动下一角色或阶段。
