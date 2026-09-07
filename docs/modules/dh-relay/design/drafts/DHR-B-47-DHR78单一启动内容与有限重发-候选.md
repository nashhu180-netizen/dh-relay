<!-- dh:planning-no-event:v1 artifact="design/drafts/DHR-B-47-DHR78单一启动内容与有限重发-候选.md" reason="B47 已确认形成史，正式事件登记于 P6 DevPlan" -->
# DHR-B-47 · P6 单一启动内容与一次补发（A33 精简候选）

> 已确认·形成史。用户明确“确认写入”，本版已落入 [正式 P6 DevPlan](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md)。下文保留候选原貌；DHR_78 已正式登记为未开始，不授权开工或真实运行。形成史归档到 design/drafts，不作为 DevPlan 任务真相。

## 1. 唯一正式输入与调整范围

在 master@6a3244d 调用 resolveDesignContract：state=new、mode=manifest、diagnosticCode=null，8 份 designInputs。第 8 份 [design/15](../../design/15-Herdr-Agent单一启动内容与有限重发.md) 当前为 HC-SD-A9..A12/H3：A9 由 DHR_78 核心发送侧与 DHR_35 外围脚本侧共同承接，A10..A12/H3 由 DHR_78 承接。其余 7 份输入既有分期和任务承接不变；旧 A1..A8/H1/H2 已退役，不计当前验收。

用户要求把过重的方案收回当前 P6；已明确确认 A33 正式替换。此次 B 只负责将精简合同转成可开工任务，保留 DHR_35 自己的真实闭环责任。

## 2. 拟新增任务 DHR_78

- **目标**：合并任务指针与 Receipt 提交说明，通过唯一 Host Adapter sender 发送；同一存活 driver 首次 accepted 后 60 秒无进展，向同一 Agent 原样补发一次；发送前持久占次，恢复不自动重发。
- **非目标**：不做未来 Ticket/PlanHome/P7 接口、node_closed 或新停止枚举；不做 timeline 协议、event seq 游标、持久 UTC 计时、checkpoint/Result 事务改造；不建设新的事务框架或跨重启 prompt 重建；不修改公开 event/RPC/read-model、Herdr 产品、用户配置或凭据。
- **档位**：标准（Herdr 组件接线及发送计数持久写入）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_78 type=heavy -->
- **状态/依赖/工作区**：未开始；依赖已完成 DHR_77；工作区尚未建立，开工时登记 workspace/DHR_78。
- **Design**：本任务消费模块共享正式 design/15，无独立同生同灭专题，不新增专题双链。

### 验收口径

| 来源与 ID | 类型 | 本卡交付与证据 |
|---|---|---|
| [design/15 HC-SD-A9](../../design/15-Herdr-Agent单一启动内容与有限重发.md#3-当前验收清单) | 机器证·核心分账 | P6 node instruction_ref={path,sha256} 仓根内解析与摘要检查；首发前拒绝缺失/越界/摘要变化；driver 三处旧 completion-only 归零，核心只有一个 sender；prompt 同时包含任务指针和提交说明，无 workspace 目录硬编码。静态调用检查、fake 正反例。此卡只验核心分账，不能宣称包括 DHR_35 外围脚本在内的 A9 全量通过。 |
| [design/15 HC-SD-A10](../../design/15-Herdr-Agent单一启动内容与有限重发.md#3-当前验收清单) | 机器证 | 首次 accepted 后单调时钟 60 秒；同一 Store 队列内检查当前 Attempt checkpoint/Result 并把次数 1 增到 2；内容、源摘要和身份相同，已有进展不补发，授权后进展窄竞态保留。并发占次、边界时钟、进展先后与调用内容相等测试。 |
| [design/15 HC-SD-A11](../../design/15-Herdr-Agent单一启动内容与有限重发.md#3-当前验收清单) | 机器证 | 两次发送都先持久占次；错误/超时/失租/stop/身份变化停止发送；恢复或接管不再发旧 Attempt，首发占次后调用前崩溃明示可能未送达；不产生第三发，计时不阻塞观测/续租，Receipt-bound 完成不退化。有界故障注入与恢复测试。 |
| [design/15 HC-SD-A12](../../design/15-Herdr-Agent单一启动内容与有限重发.md#3-当前验收清单) | 机器证 | 私有发送记录只存版本、关联、次数、host_ref、摘要和 outcome，复用现有原子写与 Run 保留策略；无正文/凭据、额外快照、公开协议或 checkpoint/Result 提交改造。字段负例及范围检查。 |
| [design/15 HC-SD-H3](../../design/15-Herdr-Agent单一启动内容与有限重发.md#3-当前验收清单) | 人判 | 展示正常首发、60 秒无进展补发、已有进展不补发、首发占次后调用前崩溃四例安全摘要；最后一例清楚说明需检查现场，必要时 stop 旧执行再显式新执行。用户判断日常可用性与人工代价。 |

**测试与复核**：一份新增专项测试覆盖上述行为，受影响既有测试保留原断言目标并适配新输入。先代码轮 1 闭合，再按既有 heavy Recipe 执行其余路径；代码轮 2 独立选一个关键生产变异点，断言红、还原绿。其它场景用行为断言和故障注入，不要求逐项生产变异。所有测试须有终态，禁止用超时/未得终态宣称通过。

### 精确变更范围

<!-- dh:allowed-paths:v1 task=DHR_78 -->
- `relay-core/contracts/relay.run.v2.schema.json`
- `relay-core/runtime/startup-dispatch.mjs`
- `relay-core/runtime/workflow-driver.mjs`
- `relay-core/runtime/executors/herdr/herdr-executor.mjs`
- `relay-core/store/store.mjs`
- `relay-core/test/dhr78-startup-dispatch.test.mjs`
- `relay-core/test/contracts.test.mjs`
- `relay-core/test/herdr-adapter.test.mjs`
- `relay-core/test/agent-node.test.mjs`
- `relay-core/test/dhr64-driver-observation.test.mjs`
- `relay-core/test/dhr64-result-bridge.test.mjs`
- `relay-core/test/dhr69-false-ready.test.mjs`
- `relay-core/test/dhr70-submission-gate.test.mjs`
- `relay-core/test/dhr72-continuous-observation.test.mjs`
- `relay-core/test/dhr75-host-lease-during-herdr.test.mjs`
- `relay-core/test/dhr77-host-ref.test.mjs`
- `relay-core/test/helpers/fake-herdr.mjs`
- `relay-core/test/helpers/fake-herdr-bin.mjs`
- `relay-core/package.json`
- `docs/modules/dh-relay/workspace/DHR_78/**`
- `docs/modules/dh-relay/as-built/relay-core.md`
- `docs/modules/dh-relay/knowledge/教训库-候选.md`
- `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`

范围约束：startup-dispatch.mjs 仅承接当前 P6 指令构造/内部发送记录校验，不建扩展框架；Store 仅新增同队列进展查询与计数持久写，复用既有 guard/atomic writer，禁止改 checkpoint/Result 算法。现有测试与 fake 仅适配 instruction_ref、统一 sender 和直接回归；不得削弱原断言或修 unrelated 失败。package.json 仅登记本卡测试。教训仅追加候选。删除旧计划中独立 dispatch schema、compat-matrix、state.mjs、host.mjs、service.mjs、golden/negative 整目录授权；若实际确需额外路径，施工前列出具体依据，不提前放宽。

实施提示：复用现有 Store 队列与 lease guard；Herdr 调用留在队列外；人验报告从 fake 调用和现有事实提取安全字段，不定义独立 timeline 或增加业务提交写入。

## 3. 拟调整 DHR_35

- 保持“进行中”和现有 workspace；任务表依赖增加 DHR_78，备注标 blocked-by:DHR_78。目标、实施提示和覆盖/依赖汇总同步更新，移除“DHR_77 完成即已解除所有计划阻塞”的过时结论。
- DHR_78 本地收口后，DHR_35 在自身工作树对齐新 master；既有 e2e 脚本提供 instruction_ref 文件/摘要并移除外围任务 prompt。先过静态/受控闸：完整启动内容只经新 sender、外围 prompt 调用为 0。上述变更归 DHR_35，不进 DHR_78 代码清单。
- **新增机器证分账 · 来源 [design/15 HC-SD-A9](../../design/15-Herdr-Agent单一启动内容与有限重发.md#3-当前验收清单)**：DHR_35 提供合法 instruction_ref，外围 runner 的任务/提交 prompt 调用归零，并在吸收 DHR_78 的新基线上证明实际入口只有统一 sender。A9 的模块结论需核心分账与本外围分账均有证据才可记全量通过；该静态/受控分账不替代 P6-M1 真实实录。
- 真实 Codex/Claude 链仍由 DHR_35 自行取证；DHR_78 fake/人验不抵 P6-M1。Linux 延后、DSH-off、P6-X/P6-H、启动成功率和 DHR_73 旁支调查保持原合同。新指令文件由该卡显式提供，无固定 workspace 布局要求。
- 恢复旧 Attempt 不自动补发的人工路径遵循 A33；先检查/停止旧执行，确认停止后再显式新执行。不得自动重试未知发送、代写 Result 或绕过运行授权。

## 4. 排程、覆盖与确认落点

先完成 DHR_78 当前 P6 的受控可演示闭环，再由 DHR_35 取两条真实链。顺序 DHR_77 → DHR_78 → DHR_35，DHR_73 继续旁支；没有仅为未来接口先铺设施的批次。

A33 的 A9 分为核心/外围两个明确分账：DHR_78 完成其核心分账和 A10..A12/H3 后可收口；A9 模块全量结论在 DHR_35 外围分账闭合前保持部分覆盖，不能把它当成 DHR_78 已独自完成的证据。DHR_35 同时保留原真实链分账。旧 A1..A8/H1/H2 只保留 design/15 历史映射，不新建实现任务，不计入当前 pass。其它正式输入既有映射不改。

本次 B 确认后只更新 P6 DevPlan 的任务行/任务正文/依赖汇总、DevPlan README 对应索引，以及本候选形成史和审核证据。DHR_78 仍是未开始，workspace 在开工时建立。计划依赖解除不等于自动运行 DHR_35。
