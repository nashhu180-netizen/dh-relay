<!-- dh:v1 -->
# DHR_34 · Review

## S1 开工预审（fresh Claude 实例；只读）

- 派发：Herdr pane `w1:pQ`，实例 `opus_kickoff_dhr34_r2`，cwd=`.dh-worktrees/DHR_34`；启动命令为 `claude --model opus`。
- 身份证据：启动屏显示 `Opus 5 with high effort`；实例自报 SessionStart `claude-fable-5`。来源互相矛盾，结论为**形态待证**，不登记为已核验 Opus。
- 只读边界：实例仅执行读取命令；主控回收后 `git status --short` 与 `git diff --check` 均无输出。
- 结论：**BLOCKED，不可派施工**。
  - P0-1：`launch-receipt.v2` 不含身份四件套，签发点 `service.mjs` 不在允许路径；DevPlan 要求扩 Receipt schema，而 brief 禁改 `contracts/**`。
  - P0-2：run-state 无 `paused`，全仓零命中；「无 fallback → paused + Attention」字面不可实现。
  - P2：控制通道在 `rpc/cli` 禁改路径，身份展示只能依既有 event.detail 或 result.structured 的脱敏承载，不能借预审扩线。
  - P3：registry 不可用与无 fallback 必须分作负例；可用 `attempt_id` 派生 agent 名作为 H12 的附加断言点。
- 最小 TDD（仅待范围/语义裁决后执行）：quota 分类器正反样本 → 身份冻结纯函数 → driver fallback fresh Attempt → 非额度不切换 → 无 fallback 的已裁决状态/Attention → M7 两份回归断言 → `audit-contracts` 证明 contracts 零 diff（若裁决保持禁改）。

## 独立复核区

### 代码轮 1（Opus · fresh）

| 复核者 | 范围 | 发现 | 派出证据 | 证据 |
|---|---|---|---|---|
| Opus 5 形态（身份来源冲突，待证）· `dhr34_code1` | 全程增量、D3/恢复/Store 边界与定向/全量探针 | 初审 P0=0、P1=1；整改复验后 APPROVED，open P0/P1=0 | Herdr `w1:p1C` | E-011~E-013；`review-code1-opus.md` |

### 代码轮 2（Opus · fresh，实例须不同于轮 1）

| 复核者 | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| Opus 5 形态（身份来源冲突，待证）· `dhr34_code2` | 全程与收口增量、有效 mutation | APPROVED；复验 open P0/P1=0 | Herdr `w1:p1D` | E-014~E-019；`review-code2-opus.md` |

### 需求、教训与一致性（均为 Opus 独立实例）

| 路径 | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| 需求 | 完成条件与身份/quota边界 | APPROVED；复验 open P0/P1/P2=0 | Herdr `w1:p1E` | `review-req-opus.md` |
| 教训 | 在册教训与候选 | APPROVED；fresh replacement 复验 open P0/P1=0 | Herdr `w1:p1H`（原 `w1:p1G` 交互异常后替换） | `review-lessons-opus.md` |
| 一致性 | 同类 Attempt/Receipt 路径 | APPROVED；复验 open P0/P1/P2=0 | Herdr `w1:p1F` | `review-consistency-opus.md` |

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| P6-M4：误判不切换 | 以受控合成结构化信号与显式注入的 synthetic detector 验证 quota、权限、网络、交叉不一致与 unknown；无 fallback 走 canonical pause | E-006~E-020 | **待人验**：安全 seam 机器通过且 `constrained`；真实样本/detector/judge/生产接线未完成，归 DHR_35 |
| P6-M2/M7：身份链不串用 | 对同一节点的 source 与 fallback Receipt / Attempt / Result 及恢复身份对证 | E-007~E-020 | **待人验**：机器与独立复核通过，等待用户签名 |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 高置信 quota 才 fallback；非 quota 不切；无 fallback 暂停并 Attention | machine | E-006~E-016 | 定向夹具通过；生产链路未接通，`constrained` |
| 2 | 身份链可证且客户端变化不串用 | machine | E-007~E-018；恢复用例故意令 event detail=source、Receipt=backup | machine 通过；Receipt 权威断言有判别力 |
| 3 | fallback 为 fresh Attempt | machine | E-006~E-016 | 定向夹具通过；真实执行闭环归 DHR_35 |
| 4 | heavy 有效单测 / mutation | code2 + lessons | E-015、E-019、E-020 | 自动 fallback 权限门改坏后 8/10、还原 10/10；最终树门与转红用例逐字复核仍在 |

## 人类签名区

> 未经用户在对话中明确确认，不填写本区、不代签 verify。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| P6-M4 的受限结论 | 查看 constrained 边界 | 认可本卡只交付安全 seam，真实 detector/judge 留 DHR_35 | [x] 2026-08-30 用户对话「接受」 |
| 二次 quota 的产品语义 | 查看一跳上限与 canonical pause | 认可不自动链第三身份，停等人工 | [x] 2026-08-30 用户对话「接受」 |
| 无真实样本时的 detector 策略 | 查看未登记 detector 负例 | 认可本卡不内置未证产品规则 | [x] 2026-08-30 用户对话「接受」 |

- [x] **E10 收口确认与 verify**（2026-08-30 用户对话「接受」）：认可本卡按 P6-M4 `constrained` 语义本地收口；真实 quota 样本、生产 detector/judge、retry 后执行闭环仍由 DHR_35 承接。
- 复核身份按候选-40 的用户裁决 B 登记：fresh 实例 + 独立会话构成换人复核；模型身份冲突仅作诊断记录，不影响本卡既有复核有效性。
