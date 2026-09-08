<!-- dh:v1 -->
# review — DHR_81

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 | 证据 |
|---|---|---|---|---|
| `dhr81-code-round1`（独立、非机器强制只读） | `b42f7ae` + 整改 diff | 初审 P2×2：Receipt 非业务任务未固定、片段断言未锁顺序/失败/正文零复制；整改后复审 P0~P3=0 | e:E-8103 | 静态复审回收；E-8106 红→绿。 |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|---|
| `dhr81-code-round2`（fresh、独立、非机器强制只读） | `95d44e5` + 轮1记录 | P0~P3=0；选择将“Receipt 提交命令不是业务任务”反转为“是业务任务”的生产语义变异 | 已收敛 | e:E-8107 | E-8109 红、E-8110 还原绿；专项 17/17。 |

**有效单测·变异点登记**

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `runtime/startup-dispatch.mjs:27` | “Receipt 提交命令不是业务任务” → “Receipt 提交命令是业务任务” | 固定业务边界 | `DHR_78：首发和无进展补发使用同一启动内容，并在发送前持久占次` | E-8109 命令 | 95d44e5 内容基线 | 还原为 95d44e5 原文字面 | dhr81-code-round2 选择，主会话执行 | 0 pass / 1 fail；还原后 E-8110 17 pass / 0 fail |

**需求复核结论**：初审 P1×2（A13 明确性、A14 专项断言）已由 E-8106 整改闭合；复审 P0~P3=0，未把 fake 绿冒充 DHR_35 真实实录｜证据=E-8106｜由 `dhr81-requirements`（独立、非机器强制只读）｜派出=e:E-8104

**教训复核结论**：初审 P1×1/P2×1（业务边界与正文零复制）已由 E-8106 整改闭合；复审 P0~P3=0，未重蹈“fixture 绿替代真实副作用”的边界错误｜证据=E-8106｜由 `dhr81-lessons`（独立、非机器强制只读）｜派出=e:E-8105

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_81 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| `loadStartupInstruction()` 固定包络 | `workflow-driver.mjs` 唯一加载/发送链、`herdr-executor.mjs`、`herdr-cli.mjs` 与 DHR_78 专项快照 | 一致：唯一 sender，首发/解除 blocked/一次补发均转同一构造；无额外生产 prompt 路径 | 无遗漏；真实 Agent 副作用仍归 DHR_35 | e:E-8108 |

## AI 提交区　⚠️ This is not human approval

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 包络快照固定“打开指针→执行文件任务→按真实结果提交”的顺序，Receipt 命令不是业务任务。 | AI | E-8106、E-8110 | 已达成 |
| 2 | 正文不进入 prompt/记录/公开协议；缺失、越界、摘要变化仍在 Attempt/Agent 前拒绝。 | AI | E-8106、E-8110 | 已达成 |
| 3 | 唯一 sender、外围调用为 0、A10/A11/A12 直接回归保持自然终态绿色；不以 fake 替代真实副作用。 | AI | E-8110、一致性复核 e:E-8108 | 已达成（限 fake/fixture 边界） |
| 4 | 第二轮 fresh reviewer 选择生产语义变异，指定专项测试改坏必红、还原后绿。 | AI | E-8109、E-8110 | 已达成 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 启动包络执行语义 | 专项快照与直接回归 | machine | HC-SD-A13 | 等价覆盖 | 固定顺序和提交边界逐字匹配 | E-8106/E-8110：17/17、exit 0 | 95d44e5+ DHR_81 worktree | Node test | 真实 Agent side effect | current | automated | AI |
| 正文不复制与输入拒绝 | 专项正反例 | machine | HC-SD-A14 | 等价覆盖 | 正文零出现且拒绝分支保留 | E-8106/E-8110：17/17、exit 0 | 95d44e5+ DHR_81 worktree | Node test | 真实 Agent side effect | current | automated | AI |
| 唯一 sender 与回归 | 专项 fake/回归 | machine | HC-SD-A15 | 等价覆盖 | sender/外围调用及既有发送合同均通过 | E-8110：17/17、exit 0；e:E-8108 | 95d44e5+ DHR_81 worktree | Node test | DHR_35 A16/P6-M1 | current | automated | AI |

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| A13~A15 启动包络语义 | 读取固定包络与专项测试入口，确认 DHR_81 只验证文本/发送边界，不验证真实 Agent 副作用。 | E-8101 | 满足 |

**Confidence Challenge**：专项与变异均已闭合，五路复核 P0~P3=0；但 fake/专项绿色只证明固定包络和 sender 边界，不能替代 DHR_35 的真实 Agent task side effect、committed Ack/Result。

**设计契约传导声明**：契约无变化：DHR_81 只实现已确认的 design/15 A13~A15。

**材料齐没齐**：施工、heavy 五路复核、有效变异、miner 与 as-built 均已备料；尚未产生 E10 证据展示和用户 E11 确认。[x]

**as-built 更新了没**：已更新 `as-built/relay-core.md` §17。[x]

→ 当前状态：**已获 E11 本地收口授权，待 verify 提交**

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡无独立人验项；E10 已展示机器证据与完整收口包，且未把 DHR_35 的 H4/P6-H 归入本卡。

**E11 确认记录**：2026-09-08，用户明文“认可”，确认对象为 E10 所示本地收口包：精确 squash 合入 master、合入复验、`verify(dh-relay)`、DevPlan/workspace 回填与 DHR_81 worktree/branch 清理；明确不含 push、部署、真实 Agent 或 DHR_35 开工。
