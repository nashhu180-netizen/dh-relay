<!-- dh:v1 -->
# execution_strategy — RLT_08

## 操作模型

RLT_08 采用 dispatch/README.md 冻结的六角色手动接力。W builder 只产出七件套与分批计划；B1–B3 严格串行，每批 exec 停止后由 audit 小审；任一 `BLOCKED` 由 decide 处理；全批施工与小审闭合后才能拉 normal 三路 review。monitor 只监督信号和越界，不代替任何业务角色。

## 角色、写权限与禁止事项

| dispatch 角色 | 阶段 / 职责 | 写权限 | 禁止事项 |
|---|---|---|---|
| builder (`rlt08-build`) | W：七件套 + 分批 task_plan | RLT_08 workspace 七件套 | 不改 AGENTS/DevPlan/design；不施工、复核或派活 |
| audit (`rlt08-audit`) | W 计划审核；每批 checker 小审 | 主控指定的独立审核记录/信号 | 不修 AGENTS，不代替 exec，不把小审当 normal 复核 |
| exec (`rlt08-exec`) | 按已 PASS task_plan 逐批施工 | `AGENTS.md`、`progress.md`、`findings.md`、`lesson_candidates.md` | 不改 task_plan/DevPlan/design/review 结论；不越批、不自审 |
| decide (`rlt08-decide`) | 任一 BLOCKED 的独立裁决 | 主控指定的 decision 记录/信号 | 不顺手修文本，不越过用户闸，不改合同 |
| monitor (`rlt08-monitor`) | 常驻监督角色、边界、信号与停止 | 仅监督记录/信号（按 dispatch 指定） | 不施工、不审核、不裁决、不替主控改状态 |
| review (`rlt08-review`) | CONSTRUCTION_DONE 后 normal 三路复核 | 各路独立 review 记录及 `review.md` 指定区 | 施工者不得兼任；不修 AGENTS，不合并或降级路径 |

## 批次同步点

```text
W builder DONE(W_READY)
  → audit(W) PASS
  → B1 exec DONE(READY_FOR_REVIEW) → audit(B1) PASS
  → B2 exec DONE(READY_FOR_REVIEW) → audit(B2) PASS
  → B3 exec DONE(CONSTRUCTION_DONE) → audit(B3) PASS
  → normal review：code-round1 / requirement / lesson
```

- 批内单写者，不并行修 `AGENTS.md`。
- audit 未 PASS 不得开下一批；BLOCKED 必须先经 decide 并由 orchestrator 重新开放。
- W_READY 不是 D-start；CONSTRUCTION_DONE 不是 review/verify/验收/merge。

## 结构化信号

所有角色在 `progress.md` “信号”节末追加独占一行：

```text
DONE task=RLT_08 role=<builder|audit|exec|decide|review> batch=<n|W|R> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator
```

写完信号立即停止，不等 `node_closed`，不自行启动下一角色或阶段。
