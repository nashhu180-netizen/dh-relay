# review-brief · DHR-BL-10 需求复核（E4 · normal 配方第 2 路）

你是 dh-relay 的**需求复核 worker**。**只读，不改任何文件。** 不派活、不问用户、不做验收裁决。
结论输出到 stdout，由主控落盘。

## 你要回答的唯一问题

**交付的东西，是不是用户当初要的那个东西？有没有在施工过程中漂走？**

你不核代码质量（那是代码轮 1 的活，已完成），你核**需求 ↔ 交付**的对齐。

## 读什么

1. `docs/modules/dh-relay/backlog.md` 的 `DHR-BL-10` 条目 —— **需求原文**（户口本，唯一权威）
2. `docs/modules/dh-relay/workspace/DHR-BL-10/brief.md` —— 8 条完成条件、边界（In/Out of scope）、允许路径
3. `git diff` + `git status` —— **实际交付了什么**
4. `docs/modules/dh-relay/workspace/DHR-BL-10/progress.md` 的证据账 E-001~E-013
5. `docs/modules/dh-relay/workspace/DHR-BL-10/evidence/e2e/` —— 真实拉起一棒的七份证据
6. `docs/modules/dh-relay/workspace/DHR-BL-10/findings.md` F-001~F-008

## 背景（决定你要多疑）

- 用户在对话里点选确认了两件事：**接线形态 = 只接 headless 一次性位**（不接常驻交互施工位）、**档位 = 标准档 · task_type=normal**。
- 施工全程由 **zcode 自己**完成（GLM-5.3 + GLM-5.3-Flash），即被接入的 CLI 给自己接线。
- 中途主控加派过两轮返工（代码轮 1 的 R1/R2；教训冲突 F-007）。**返工最容易把范围悄悄撑大**，重点查这个。

## 逐条核这些

1. **完成条件 8 条逐条对账**：brief 里每条，实际有没有兑现？证据是不是真支撑那条？有没有"条件说 A、证据证的是 A′"。
   特别核**条件 7（唯一人验项）**：`evidence/e2e/` 的七份工件，能不能独立证明「zcode 这一棒是按 relay 协议交的棒」，而不是「跑了个命令然后有人手写了几个 json」。看身份字段是否自洽、是否与夹具 receipt 一致。
2. **边界有没有被突破**：brief 的 Out of scope 列了 5 类（`relay-core/`、`tools/contracts|runner|policy|adapters/`、常驻交互位、桌面端 config 治理、P5/P6 阶段闸与 DevPlan 状态）。实际 diff 有没有碰？
3. **允许路径**：`brief.md` 的 `dh:allowed-paths:v1` 清单 vs 实际 `git status` 全部改动（含未跟踪文件）。逐条比对，**登记目录名不等于放行整棵子树**。
4. **需求原意有没有被返工带偏**：F-007 那轮把「大小写不敏感派发」改成了「fail-closed 报错」。这属于**需求内的质量收敛**，还是**悄悄多做了一件用户没要的事**？给出你的判断和理由。
5. **有没有该做没做的**：backlog 条目里承诺的东西，有没有哪条静悄悄没落地。
6. **文档口径一致**：backlog 条目、brief、as-built 三处对「zcode 接的是哪个位」的描述是否一致，有没有一处写成"也支持常驻交互"。

## 输出格式

```
## 结论：approved / 有漂移
## 完成条件对账表
| # | 条件 | 兑现? | 支撑证据 | 我的判断 |
## 边界与允许路径核查
（逐条列，含未跟踪文件）
## 发现（若有）
| ID | 级别 | 问题 | 证据 | 建议处置 |
## 我核过且认为无漂移的点（逐条，别写"其余正常"）
```
