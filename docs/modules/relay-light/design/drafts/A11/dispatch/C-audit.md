# C-audit · 审核 — 候选稿 fresh 审核 / 批检查

先读同目录 `README.md`。你是**审核**，只读不改，做完即停。你未参与候选稿起草。

编排派活时会指定模式与输出文件名：

## 模式 A：候选稿 fresh 全面审核（输出 `review.fresh-01.md`）

对象：`drafts/A11/A11-候选.md`。核对依据：`brief.md`、`task_plan.md`、Issue #37、RLT_11 findings F-001/F-002、design/01 正文（§11、§12、§15、H10、文件头）、DevPlan RLT_23/RLT_24 两段、真实产物清单（`git ls-files docs/modules/relay-light/relay/rlt12-win-01/ docs/modules/relay-light/workspace/RLT_21/ docs/modules/relay-light/workspace/RLT_12/`）。

必查：
1. §12 兜底类行：措辞是否真兜得住「计划目录 / 任务工作区目录下未点名产物」；对照清单是否与 `git ls-files` 实测一致、无遗漏类别；是否与现有六行口径冲突。
2. 职责分层口径：三点是否都写到（接力现场 / 施工现场 / `commit=` 旁注失效不构成契约破坏）；是否回链 H10；是否与 §3 账本合同、§0.1 两个 workspace 术语冲突；是否悄悄改了 H10 命题。
3. A151~：连续续号、不撞既有与退役号；每条是否原子（只含一个可独立失败断言）、「怎么验」是否可机械执行；是否覆盖 RLT_23 四条与 RLT_24 预期覆盖面；是否越权替实现卡定了本该是开放项的产品决定；RLT_23 为 light 档无「有效单测」硬要求，验收方式是否与档位匹配。
4. §11 总账数字、§15 稳定性行、文件头 planning-event 声明（可被 `dh:planning-event:v1 id=RLT-A-11 stage=A-adjust` 解析、review 回链指向将建的 evidence/11 锚点）、DevPlan 拟改文本是否自洽。
5. 停止边界与夹带。

## 模式 B：批检查（输出 `check.<批号>.md`）

对象：编排指定批次的实际 diff（`git -C /home/nash/work/dh-relay/.dh-worktrees/RLT-A-11 diff` 与 `git status --porcelain`）。核：只动允许路径；晋级文本与 `候选稿 + decisions.md` 逐字一致、无夹带；task_plan 该批完成判据逐条执行并记结果。

## 输出格式（两种模式通用，三段）

```
## 结论
APPROVE | REVISE   （有任一 P1 即 REVISE）

## 逐项意见
| 编号 | 级别(P1/P2) | 位置（文件:行/节） | 问题 | 依据 | 整改动作 |

## 范围外发现
```

然后 `progress.md` 追加：
```
DONE task=RLT-A-11 role=audit node=<节点> status=<APPROVE|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: <输出文件>
```
不改被审文件，不 commit，不回头问用户。
