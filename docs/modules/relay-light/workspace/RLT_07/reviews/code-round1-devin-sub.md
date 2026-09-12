# review — RLT_07 代码轮 1（devin-sub, fresh）

> 独立复核路径 code-round1；只读复核。verdict 与逐条发现如下，行号以 `wt/RLT_07` HEAD 为准。

```text
REVIEW verdict=APPROVE_WITH_NITS
path=code-round1 card=RLT_07
tests_effective=yes — 模板抽取→占位符替换→三档 lint→运行时行为断言形成闭环
boundary=干净（主控补跑 git diff origin/master --name-only 实证：仅 workspace/RLT_07 + SKILL.md + 两 adapter + test_relay_log.py）
notes=F-002 处置如实：relay_log.py 无 decision_mode 分支，两条负例腿以 skip 钉住且理由链到 finding
```

## 发现与整改闭环

| 级别 | 位置 | 问题 | 处置 |
|---|---|---|---|
| P2 | SKILL.md C/X 模板 | `decision.<k>.md` 与 design 的卡内决策序号 `decision.<n>.md` 语义冲突：同卡 C1/C2/X1 的 decider 都会写 `decision.1.md`，同目录撞名覆盖、证据链断档 | **已整改**：占位符改 `decision.<d>.md`（`<d>`=卡内决策序号），占位符清单同步补 `<d>`/`<reviewer>`/`<路>` |
| P3 | test_relay_log.py A132 | 词边界字符类比 oracle 多收 `_`，`foo_opus` 形态逃逸 | **已整改**：边界类去 `_`，与 oracle 逐字一致（`[A-Za-z0-9.-]`） |
| P3 | 两 adapter 派活模板 | `<workspace>/brief.md` 裸 workspace 在中文语境边界形态（A100 oracle 第二分句） | **已整改**：改 `<任务工作区>` |
| P3 | test_relay_log.py A136 | 枚举只盖 `<RELAY_LOG>`+`--plan` 行；watch 断言只测字面 `relay_log.py` | **已整改**：枚举同时认 `<RELAY_LOG>` 与字面 `relay_log.py`；watch 断言补 `<RELAY_LOG> watch` 形态 |
| P3 | test_relay_log.py A12 | `assertNotIn("骨架占位")` 对 RLT_01 实际占位语「由 RLT_07 交付」近似空转 | **已整改**：补 `assertNotIn("由 RLT_07 交付")` |
| P3 | SkillTemplateTests helpers | `add_ok` 不断言 stdout、`assert_rejected` 不断言账本字节不变与 error 前缀 | **已整改**：对齐 RelayLifecycleTests 同名 helper 强度 |
| P3 | A114 strategist 链 | 缺 `cancelled` 终局正例与决策事件逐条归属断言 | **已整改**：新增 `test_a114_strategist_chain_cancelled_finale`；resume 链补 escalate/decision/user_decision/resume 全记 coder#1 + agent_launch/done 记 strategist#1 的逐条断言 |
| P3 | SKILL.md A19 | 「直跑测试」宽于 oracle 原文「直跑 python 测试」 | **已整改**：改「直跑 python 测试」 |
| P3 | adapter A21 | 「监工与编排的 prompt 模板含该硬规则原文」分句：等待节含原文、派活 prompt 模板（监工→agent）不含——解读自洽（被派 agent 不等待） | 不整改，转需求方向路终裁 |
| P3 | SkillCoreDocTests | A27/A66 等结构断言为关键词存在性，可被保词换义糊弄 | 不整改：oracle 证法即「结构检查命中原文」，强度符合档位 |
| — | — | tests_effective=yes；无全局状态泄漏；108+28=136 与 progress 账一致 | — |

## 验收 ID 逐项

- 命中：A12、A19、A21、A26、A27、A66、A67、A95、A98、A100、A102、A103、A113、A117、A127、A132、A133、A136
- 部分命中（如实挂 F-002）：A96（consult 拒绝腿 skipped）、A114（decider 两负例腿 skipped）
