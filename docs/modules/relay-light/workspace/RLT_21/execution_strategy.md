<!-- dh:v1 -->
# execution_strategy — RLT_21

## 操作模型

手动派活、六角色、五批串行。builder 只完成 W 七件套；每个 exec 批次后必须由 audit 小审；合同张力交 decide；全部施工闭合后才启动 normal 三路独立复核。monitor 常驻监督信号与边界，不替代业务角色。

## 角色、写权限与禁止事项

| dispatch 角色 | 职责 | 写权限 | 禁止事项 |
|---|---|---|---|
| builder (`rlt21-build`) | W 七件套与分批计划 | RLT_21 七件套 | 不改 tools/design/DevPlan；不施工、不复核、不派活 |
| audit (`rlt21-audit`) | W plan-review；B1～B5 checker 小审 | `review.plan.md`、`check.C<n>.md` 与点名信号区 | 只读候选；不修代码/计划，不代 normal reviewer |
| exec (`rlt21-exec`) | 逐批 RED→GREEN、提交 | allowed-paths 内本批代码/测试/skill 与 coder 获准账 | 不越批、不自审、不改 design/DevPlan、不安装用户副本 |
| decide (`rlt21-decide`) | 对 BLOCKED 给出结构化裁决 | `decision.<n>.md` 与点名信号区 | 不施工、不静默扩 allowed-paths、不替用户裁决 |
| monitor (`rlt21-monitor`) | 监督角色、进度、边界、空闲告警 | dispatch 指定监督记录/信号 | 不施工、审核、裁决或改状态 |
| review (`rlt21-review/review2`) | CONSTRUCTION_DONE 后 normal 三路 | 各路独立报告与 `review.md` 指定区 | 施工者不得兼任；不修代码、不合并/verify/验收 |

## 批次同步点

```text
W builder → DONE(W_READY) → audit(W) PASS
  → B1 A137/A112 → audit(B1) PASS
  → B2 A138/A139
      └─ oracle 张力 → BLOCKED → decide → orchestrator 重派
  → audit(B2) PASS
  → B3 A140 → audit(B3) PASS
  → B4 A141/A143 → audit(B4) PASS
  → B5 A142 → audit(B5) PASS
  → exec 收束 CONSTRUCTION_DONE
  → normal: code-round1 → requirement 与 lesson（独立/fresh）
```

任一 FAIL/REQUEST_CHANGES 只开放指定整改节点；测试绿、小审 PASS、复核 APPROVE、verify、人验、PR CI 和合并互不代替。

## 信号格式

```text
DONE task=RLT_21 role=<builder|audit|exec|decide|review> batch=<W|1|2|3|4|5|R|X<n>> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator
```

信号落点以 dispatch/README.md 与具体角色 brief 为准；每个角色只写其获准报告/信号区，完成即停，不自行打开下一节点。
