<!-- dh:v1 -->
# review — DHR_78

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| `/root/dhr78_code1`（fresh terra/medium） | 完整 diff、A9~A12、相关 fixture | 初审 P2×2，复查出现 P1×1；均经 final observe 的同 host + 可发送状态、故障负例和 fixture 序列适配闭合。第三次复查 P0/P1=0，approved。 | e:E-7825 | E-7820 |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| `/root/dhr78_code2`（fresh terra/medium，≠轮1） | 当前完整 diff + 关键变异点 | 初审 P1×2：Store confirm 后仍可 source/host 漂移；Herdr node 未条件必填 instruction_ref。整改后逐项闭合，P0/P1/P2/P3=0。 | approved | e:E-7826 | E-7814、E-7817、E-7820 |

**有效单测·变异点登记**

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| relay-core/runtime/workflow-driver.mjs:220 | `!['idle','working','done'].includes(status)` → `false` | 改条件 | `DHR_78：Store 最终确认后 host 状态漂移时不调用 Agent` | `node --test --test-concurrency=1 --test-name-pattern="Store 最终确认后 host 状态漂移" test/dhr78-startup-dispatch.test.mjs` | 470f48bc79312f2feb64db6e753a55fceff46b5c | 110f6a2d299eb64174032e447d34a1b67ea1480e | `/root/dhr78_code2`（fresh terra/medium，≠轮1） | 断言失败 |

**需求复核结论**：`/root/dhr78_requirement` fresh 终审 approved；P0/P1=0。确认 A9 三类拒绝、A10 Store-only、A11/A12 与精确 allowed paths 均闭合；完整 npm 旧尾项须保持“未得终态”，H3 只能在 E10 展示、E11 人判。证据 E-7820｜派出=e:E-7827

**教训复核结论**：`/root/dhr78_lesson_consistency` fresh 终审 approved；P0/P1/P2/P3=0。确认未重蹈最终校验早于异步边界、Windows 原子快照高频 reader、终态证据陈旧三类教训；H3 与完整 npm 边界保留。证据 E-7820｜派出=e:E-7828

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_78 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|----------|--------------|------|----------|
| 单一 sender 与私有发送记录 | workflow-driver 三入口、Store reserve/confirm/outcome、Herdr adapter 唯一 sender | 是 | approved；三入口均收敛同一 helper，公开协议零新增发送账 | e:E-7828 |
| source/host 最终校验 | startup loader + Herdr observation | 是 | approved；Store confirm 后 source 再验、host 再验、随后同步发送 | e:E-7828 |
| durable record 测试屏障 | Store 内存事实 + 原子持久快照 | 是 | approved；轮询内存事实，写方稳定后只读一次快照 | e:E-7828 |
| schema 治理同步 | run/v2、audit、token、capability baseline | 是 | approved；精确扩围与正式 schema 同步 | e:E-7828 |

## AI 提交区　⚠️ This is not human approval

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| 展示正常首发、无进展补发、已有进展不补发、首发占次后调用前崩溃四例安全摘要；最后一例清楚说明需检查现场，必要时 stop 旧执行后显式新执行，用户判断人工代价可接受。 | E10 以 fake Herdr 安全字段展示四例，不含正文、Receipt、terminal_id 或凭据 | E-7824 | 待人验 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | P6 node 使用仓根内且 SHA-256 匹配的 `instruction_ref`；缺失、越界或摘要变化均拒绝，三处旧 completion-only sender 归零，核心仅有一个 sender，内容含任务指针与 Receipt 提交说明。此项只覆盖 A9 核心分账。 | AI | E-7814～E-7816 | 是 |
| 2 | 同一存活 driver 首发 accepted 后 60 秒无当前 Attempt checkpoint/Result 时，在同一 Store 队列占用第 2 次并原样补发；已有进展不补发，授权后的迟到进展按合同保留窄竞态。 | AI | E-7815～E-7817 | 是 |
| 3 | 两次发送均先持久占次；错误、超时、失租、stop、身份或源摘要变化均停止；恢复/接管不发旧 Attempt，首发占次后调用前崩溃显示可能未送达，永无第三发且不阻塞观测/续租。 | AI | E-7815～E-7817 | 是 |
| 4 | 私有发送记录只含版本、关联、次数、host_ref、摘要与 outcome；复用原子写和 Run 保留策略，不存正文/凭据，不改公开协议或 checkpoint/Result 算法。 | AI | E-7815、E-7816、E-7820 | 是 |
| 5 | 展示正常首发、无进展补发、已有进展不补发、首发占次后调用前崩溃四例安全摘要；最后一例清楚说明需检查现场，必要时 stop 旧执行后显式新执行，用户判断人工代价可接受。 | 人 | E-7824 | 待人验 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|----------------|-------------------------------|---------|-----------------------------------------------|----------|--------------|----------|-------------|--------------|-----------------|-------------------|----------------------|
| 唯一 sender 与 instruction_ref | 静态调用检查、schema 正反例、fake 调用 | machine | HC-SD-A9-core | 等价覆盖 | 核心分账全部行为断言通过 | E-7815/E-7816 绿；五路 P0/P1=0 | Node 现行工作树；Windows | fake Herdr + contract validator | DHR_35 外围分账 | design/15 | test | automated |
| 60 秒补发 | 注入单调时钟、并发和进展测试 | machine | HC-SD-A10 | 等价覆盖 | 全部时序断言通过 | working/no-Store-progress 与已有 checkpoint 对照通过 | Node 现行工作树；Windows | fake clock/Herdr + Store | 授权后窄竞态按合同保留 | design/15 | test | automated |
| 安全失败与两发上限 | 故障注入、恢复、lease/stop 回归 | machine | HC-SD-A11 | 等价覆盖 | 全部负例断言通过 | E-7815/E-7816；变异 E-7817 红/恢复绿 | Node 现行工作树；Windows | fake Herdr/Store | 未送达不可自动恢复 | design/15 | test | automated |
| 私有记录边界 | 字段负例、契约与范围检查 | machine | HC-SD-A12 | 等价覆盖 | 无正文/公开协议/算法改造 | contract/audit/baseline 与字段损坏负例通过 | Node 现行工作树；Windows | static audit + Store reopen | 不作额外快照 | design/15 | test | automated |
| 四例日常可用性 | 对话展示安全摘要 | human | HC-SD-H3 | 部分 | 用户判断通过 | 四例机器事实已备；用户结论待 E11 | E10 对话 | user | 真实产品链属 DHR_35 | design/15 | user review | user |

### HC-SD-H3 四例安全摘要（E-7824；只含 fake 安全字段）

| 场景 | Store 进展 | 发送次数 | 摘要/身份 | outcome / 人工动作 |
|---|---:|---:|---|---|
| 正常首发 | 无 | 1 | prompt digest 固定；同 host_ref | accepted；无需人工介入 |
| 首发 accepted 后 60 秒无进展 | 无 checkpoint/Result | 2（原样一次） | 第二次 digest 与第一次相同；同 host_ref | accepted；之后绝无第三发 |
| 已有进展 | 有当前 Attempt checkpoint（Result 同样阻断） | 1 | 不产生第二次发送 | Store 返回 progress，保持现有执行 |
| 已占次、物理调用前崩溃/stop | 无法证明是否送达 | 0（本次受控例）且旧 Attempt 恢复不自动再发 | durable outcome=`authorized`，正文未入账 | **可能未送达；先检查现场，必要时先 stop 旧 Attempt，再显式新执行** |

→ 当前状态：**本地 squash `71e795e` 与 master 受影响回归 125/125 已闭合；本提交以 `verify(dh-relay)` 完成收口**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 展示正常首发、无进展补发、已有进展不补发、首发占次后调用前崩溃四例安全摘要；最后一例清楚说明需检查现场，必要时 stop 旧执行后显式新执行，用户判断人工代价可接受。 | 查看四例安全摘要，重点核对崩溃例的“可能未送达、检查现场、stop 后显式新执行”说明 | 用户认为日常可用性与人工代价可接受 | 通过；用户在 E10 后明文“认可” |

| 时间 | 确认者 | 确认对象 | 候选 | 结论 |
|---|---|---|---|---|
| 2026-09-07 | 用户（对话明文“认可”） | E9 七段交付汇报、E10 HC-SD-H3 四例安全摘要及本地收口授权包 | `34d53f7`；随后仅为消费 master DHR_80 计划提交而 rebase 为 `99e2884`，生产代码 diff 不变 | HC-SD-H3 通过；授权本地 squash、合入复验、`verify(dh-relay)`、回填及 DHR_78 worktree/branch 清理；不含 push/deploy/真实 Agent/DHR_35/DHR_80 |
