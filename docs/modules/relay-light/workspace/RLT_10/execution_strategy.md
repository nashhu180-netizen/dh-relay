<!-- dh:v1 -->
# execution_strategy — RLT_10

## 操作模型

RLT_10 采用 dispatch/README.md 冻结的六角色手动接力。W builder 只产出七件套与分批计划；B1–B3 严格串行，每批 exec 停止后由 audit 小审。任一 `BLOCKED` 交 decide，尤其是已知 `lint --json` 需要触及禁改程序的冲突。全批施工与小审闭合后才能拉 normal 三路 review；monitor 只监督边界、信号和停棒，不替代任何业务角色。

## 角色、写权限与禁止事项

| dispatch 角色 | 阶段 / 职责 | 写权限 | 禁止事项 |
|---|---|---|---|
| builder (`rlt10-build`) | W：七件套 + 分批 task_plan | RLT_10 workspace 七件套 | 不改 `tools/`、DevPlan/design；不施工、复核或派活 |
| audit (`rlt10-audit`) | W plan-review；每批 checker 小审 | 主控指定的独立审核记录/信号 | 不修测试/薄壳，不代替 exec，不把小审当 normal 复核 |
| exec (`rlt10-exec`) | 按已 PASS 计划逐批施工 | allowed-paths 中测试/薄壳/runner 登记与 RLT_10 施工账 | 不改 `relay_log.py`/`install_skill.py`/计划合同；不越批、不自审 |
| decide (`rlt10-decide`) | 任一 BLOCKED 的独立裁决 | 主控指定 decision 记录/信号 | 不顺手扩 allowed-paths 或修程序；不越过用户/合同闸 |
| monitor (`rlt10-monitor`) | 常驻监督角色、边界、信号与停止 | 仅监督记录/信号（按 dispatch 指定） | 不施工、不审核、不裁决、不替主控改状态 |
| review (`rlt10-review`) | CONSTRUCTION_DONE 后 normal 三路复核 | 各路独立 review 记录及 `review.md` 指定区 | 施工者不得兼任；只读代码，不合并或降级路径 |

## 批次同步点

```text
W builder DONE(W_READY)
  → audit(W) PASS
  → B1 exec lint contract/mapping
      ├─ BLOCKED(--json / forbidden relay_log.py) → decide → orchestrator re-dispatch
      └─ DONE(READY_FOR_REVIEW) → audit(B1) PASS
  → B2 exec stdlib AST DONE(READY_FOR_REVIEW) → audit(B2) PASS
  → B3 exec thin shell/suite DONE(READY_FOR_REVIEW) → audit(B3) PASS
  → orchestrator explicit re-dispatch → exec DONE(CONSTRUCTION_DONE)
  → normal review batch: code-round1 / requirement / lesson
```

- audit 未 PASS 不得开下一批；BLOCKED 未裁决不得绕行到 B2/B3。
- B3 首次派单只能发 `READY_FOR_REVIEW`；B3 audit PASS 后仍需 orchestrator 明确重派才可发 `CONSTRUCTION_DONE`。
- W_READY 不是 D-start；CONSTRUCTION_DONE 不是 review、verify、验收、push、PR、CI 或 merge。

## 结构化信号

所有角色在 `progress.md` “信号”节末追加独占一行：

```text
DONE task=RLT_10 role=<builder|audit|exec|decide|review> batch=<n|W|R> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator
```

写完信号立即停止，不等 `node_closed`，不自行启动下一角色或阶段。
