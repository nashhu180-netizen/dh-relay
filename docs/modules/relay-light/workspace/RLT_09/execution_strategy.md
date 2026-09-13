<!-- dh:v1 · execution_strategy.md -->
# execution_strategy — RLT_09

## 角色与权限

| dispatch 角色 | 本卡职责 | 可写 | 禁止 |
|---|---|---|---|
| `rlt09-orch` orchestrator | 分发、读信号、按闸门开下一节点 | 编排范围内既定进度/派单 | 施工、复核代签、跳过 audit |
| `rlt09-build` builder | W 七件套与分批 task_plan | `workspace/RLT_09/` | 程序、测试、复核、派活 |
| `rlt09-audit` plan-reviewer/checker | W 审计划；每批方向小审 | `review.plan.md`、`check.C*.md` | 改计划/代码；替代 heavy 复核 |
| `rlt09-exec` coder | 按 B1→B5 施工、测试、窄提交 | allowed-paths；coder 自写 findings/lesson 行 | design/dev_plan/tools/tests、越批、复核自己 |
| `rlt09-decide` decider | 任一 BLOCKED 时给可执行裁决案 | `decision.<n>.md` | 改代码/计划、代替用户作需用户裁决 |
| `rlt09-monitor` monitor | 常驻监督信号、范围和停棒纪律 | dispatch 规定的监督记录 | 施工、复核、越权放行 |
| `rlt09-review` reviewer | heavy 代码轮 1；整改闭合后代码轮 2 | 独立 reviews 文件、review 汇总指定区 | 改代码、复核外路径 |
| `rlt09-review2` reviewer | Review Batch 中需求方向、教训两路 | 各自独立 reviews 文件 | 改代码、合并两路为一次泛审 |
| `rlt09-review3` reviewer | Review Batch 中一致性一路 | 独立 consistency 报告 | 改代码、引用旧审代替 fresh 核验 |

所有 worker 不拉终端、不派活、不问用户；密钥/凭据值永不入文件、信号或命令输出摘录。

## 批次与同步点

```text
W builder W_READY
  → audit(W) PASS
  → B1 exec READY_FOR_REVIEW → audit(C1) PASS
  → B2 exec READY_FOR_REVIEW → audit(C2) PASS
  → B3 exec READY_FOR_REVIEW → audit(C3) PASS
  → B4 exec READY_FOR_REVIEW → audit(C4) PASS
  → B5 exec READY_FOR_REVIEW → audit(C5) PASS
  → orchestrator 重派 exec 发 CONSTRUCTION_DONE
  → code-round1
  → 必要整改及 code-round1 定向闭合
  → 同一 Review Batch 并发：code-round2 / requirement / consistency / lesson
  → orchestrator 汇总结论；P0/P1 进 X，其他进入后续收口闸
```

- audit FAIL：同一批返回同一个 exec，只改该批发现，重新 READY_FOR_REVIEW。
- 任一 BLOCKED：停在当前批，`rlt09-decide` 出 `decision.<n>.md`，由 orchestrator 按授权重派；不得自行进入下一批。
- 测试通过只是施工证据，不自动开启 heavy 复核；五路 reviewer 均须非施工者并使用独立报告。

## 信号格式

每条独占 `progress.md`「信号」节一行，并原样打印到终端：

```text
DONE task=RLT_09 role=<builder|audit|exec|decide|review> batch=<n|W|R|X<n>> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator
```

## 提交与边界核对

- W commit：`docs(relay-light): RLT_09 W workspace seven-piece and task_plan`。
- 施工 commit：每批一个可审提交，scope 固定 `relay-light`；不 push。
- 每批 audit 输入至少含批前/批后 SHA、RED/GREEN E-ID、目标 diff、`git diff --check`、tracked/untracked 四集合、`__pycache__` 清理结果。
- 不改 `install_skill.py`、`tools/tests/**`、`design/**`、`dev_plan/**`；范围外发现只登记，不顺手修。
