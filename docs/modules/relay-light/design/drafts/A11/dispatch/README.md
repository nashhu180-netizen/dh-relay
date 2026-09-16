# RLT-A-11 派活总览（编排维护 · worker 只读）

## 身份与合同

- 规划事件：**RLT-A-11 最小 A-adjust**（不是任务卡；走 dev-harness A-adjust 原路，relay-light 白名单例外**不覆盖设计与验收**）
- GitHub Issue：**#37**（目标 / 非目标 / 验收口径以 Issue 正文为权威，`gh issue view 37` 可读）
- 来源：`docs/modules/relay-light/workspace/RLT_11/findings.md` 的 F-001、F-002 及文末「裁决落记」段；DevPlan `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的「RLT-A-11 调整（待开工）」条与「#### RLT_23」「#### RLT_24」两段卡片
- 设计权威：`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`（§11 验收清单、§12 持久化产物与退场路径、§15 查漏自查、`HC-RL-H10`、文件头 planning-event 声明与修订行）
- 先例（照着做，不要发明新格式）：RLT-A-09 的 `design/drafts/A09-*.md` 候选稿与复核记录、`design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md`；RLT-A-10 最小澄清行（design/01 第 20 行）
- 分支 / worktree：`plan/rlt-a11` @ `/home/nash/work/dh-relay/.dh-worktrees/RLT-A-11`（基线 `bd118f6` = origin/master）。**所有读写都在这个 worktree 里做**，不要去主检出 `/home/nash/work/dh-relay` 改文件。
- 本事件工作区（相当于任务卡的 workspace）：`docs/modules/relay-light/design/drafts/A11/`

## 允许路径（越界即 FAIL）

```
docs/modules/relay-light/design/drafts/A11/**
docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md      # 仅晋级批可写
docs/modules/relay-light/design/evidence/11-*.md                      # 仅晋级批可写，新建一份交叉审核记录
docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md          # 仅晋级批可写，限：RLT_23/RLT_24 卡「验收口径」行、「RLT-A-11 调整」条、顶部「现状/下一步」中与 RLT-A-11 相关的句子
```

**2026-09-16 用户裁决 O-005 出口 A 后的范围扩展**（见 `decisions.md`）：design/01 的晋级范围在原 §11/§12/§15/文件头之外，扩到 §0.1 事件词计数、§3.2 note 事件专属例外、§3.3 计数、§3.4 第 20 个控制事件 `resource_close` 与 wire format（含 A09 段「仍是那 19 个词」改写）、`HC-RL-A2` 行（**唯一允许改动的既有验收 ID 行**）、§12 两类终端空间「删失败怎么办」单元格；DevPlan 扩到 `#### RLT_24` 的目标 / 非目标 / 变更范围三句（允许路径行不动）。其余既有验收 ID 行仍逐字不变，H10 不在例外内。

任何超出上述路径的改动一律**不做**，写进 `drafts/A11/findings.md` 转派。

## 停止边界（Issue #37 非目标，原样）

- 不改任何实现代码，不动账本 schema 的实现（那是 RLT_24）；**2026-09-16 O-005 出口 A 例外**：允许在设计正文冻结 `resource_close` 第 20 事件词与其 note 子协议（实现仍归 RLT_24）
- 不追溯修改历史工件里已失效的 SHA 引用
- 不借本次 A-adjust 夹带其他设计改动（包括 RLT_22 findings 的 F-005 / F-010）
- 不改 dev-harness、不改 skill、不改 AGENTS.md

## 环境事实（Linux ThinkPad）

- 本事件是纯设计文档事件，**正常不需要跑测试**。万一要跑：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`；任何测试命令都带 `PYTHONDONTWRITEBYTECODE=1`。发现已有 `__pycache__` 只登记，不要删。
- 验收 ID 机械核验参考：`git show origin/master:docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md | grep -oE 'HC-RL-[AH][0-9]+' | sort -u` 对比工作树版本。

## worker 铁律（摘自仓根 AGENTS.md「编排协议段」）

1. 你是 worker 不是主控：**不得**再拉终端 / 派活 / 起 watcher，**不得**回头问用户（需要用户裁决的写进产物的「开放项」段）。
2. 只做 brief 指向的这一件事；别自行加载 dev-harness skill，别满仓库找「流程框架」。
3. 范围外新想法记 `drafts/A11/findings.md`，**不顺手做**。
4. 卡住必须落信号、不许憋死：把 `BLOCKED` 结构化写进 `progress.md` 并结束回合。
5. 完成即停，不越位派下一棒。**不 commit、不 push、不建分支**——git 由编排负责。
6. 密钥 / 凭据值永不入任何工件。

## 完成信号（统一格式，追加到 `docs/modules/relay-light/design/drafts/A11/progress.md`）

```
DONE task=RLT-A-11 role=<角色> node=<节点号> status=<OK|BLOCKED|REVISE|APPROVE> ts=<ISO8601>
  summary: <一行>
  artifacts: <逗号分隔的相对路径>
```

## 角色与派活文件

| 节点 | 角色 | 模型 | herdr 名 | brief |
|---|---|---|---|---|
| W1 | builder（建工作区 + 分批 task_plan） | codex gpt-5.6-sol medium | `rlta11-builder` | `W1-builder.md` |
| W2 | 审核（plan-review） | codex gpt-5.6-sol medium | `rlta11-audit` | `W2-plan-review.md` |
| C* | 施工 coder | devin swe-2-max | `rlta11-coder` | `C-coder.md` |
| C*-audit | 审核（候选稿 fresh 审 / 每批检查） | codex gpt-5.6-sol medium | `rlta11-audit` | `C-audit.md` |
| RV | 复核（定向复审） | devin swe-2-max | `rlta11-review` | 临时下发 |
| R | 开发后复核（晋级后一致性 + 机械核验） | devin swe-2-max | `rlta11-review2` | 临时下发 |
| — | 决策（仅 BLOCKED；小决策代执行，方向类列开放项交用户） | codex gpt-6-astra medium | `rlta11-decider` | 临时下发 |
| — | 监督 | devin swe-2-medium | `rlta11-monitor` | `M-monitor.md` |
| — | 编排（通知对象） | Claude 主会话 | `rlta11-orch` | — |
