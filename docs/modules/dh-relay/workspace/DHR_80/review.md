<!-- dh:v1 -->
# review — DHR_80

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| `/root/dhr80_batch1_review`（fresh，只读，未参与施工） | 批次 1 新增专项测试与 progress/findings；独立复跑专项 | P0=0、P1=0；P2=F-8003，要求批次 2 转绿时移除旧拒绝断言，避免假红 | e:E-8004 | E-8002～E-8004 |
| `/root/dhr80_batch2_review`（fresh，只读，未参与施工） | 原批 batch2 专项与 DHR_80 workspace 初审 | P0=0、P1=2；P1-A=F-8004（历史旧 Receipt 缺完整字节/旧 submit 零 mutation oracle）；P1-B=F-8005（五类拒绝缺逐例完整 mutationSnapshot，合法 retry/replay delta 未单独钉死）；结论 `changes-requested` | e:E-8011 | E-8005～E-8010 |
| `/root/dhr80_batch2_review`（同一 fresh 实例定向复审） | 仅核 F-8004/F-8005 整改增量与两项定向子例 | `APPROVED_BATCH_2`；P0/P1/P2/P3=0；两条 P1 逐项闭合，EPERM 瞬态仍作为不可证环境限制保留 | e:E-8019 | E-8014～E-8019 |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| `/root/dhr80_code_round2`（fresh Terra medium；未参与施工、实例≠轮1） | `8918461..e1c4981` 全程、批次小审闭合、B-50 与收口增量 | P0/P1/P2/P3=0；mode 被现役 service/gate/actor/Store 消费，专项正负例、恢复、零 mutation 与 done/idle 零启动闭合；默认全量 exit 1 边界未被掩盖 | approved | e:E-8030 | E-8002～E-8029、E-8034～E-8035 |

**有效单测·变异点登记**

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `relay-core/runtime/attempt-retry.mjs:47` | 删除整行 `result_submission_mode: 'receipt-bound/v1'` → 原样恢复 | Receipt-bound 提交入口可发现性与恢复 gate | `dhr80-retry-result-bridge.test.mjs:236,347,414` | `cd relay-core; node --test --test-concurrency=1 test/dhr80-retry-result-bridge.test.mjs` | `sha256:26b663ede7a143b81ef1a1e1151949dc776bf75879481cd818966a40a1089660` | `sha256:9c036fb04164cebd28120af9bc4e1613622f189c7aa43970a8446406e6f67a33` | `/root/dhr80_code_round2` | 红：exit 1，2/7 pass、5 fail、0 cancelled；`:318` 为 undefined，`:371/:445` 实见 `E_IDENTITY_MISMATCH`。恢复绿：exit 0，7/7 pass、0 fail/cancelled。 |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|----------|
| 1 | P0=0 / P1=2 | `/root/dhr80_batch2_review` 初审；P1-A/B 登记为 F-8004/F-8005 | changes-requested |
| 2 | P0=0 / P1=0 | 仅改 `relay-core/test/dhr80-retry-result-bridge.test.mjs` 与 DHR_80 workspace；整改后专项 7/7、组合 21/21；同一 fresh reviewer 定向复审原两条 P1 | approved（E-8019） |
| 3 | P0=0 / P1=0 | heavy Review Batch 四路并发：代码轮2、需求、一致性直接 approved；教训路仅 P2 as-built 终态措辞滞后，最小修正后原 reviewer 定向复审 P0~P3=0 | approved（E-8030～E-8033） |

**需求复核结论**：approved；验收 1~4 满足，验收 5 在 B-50 下仍为部分（默认全量 exit 1，heavy 路径/变异随后已补齐但残余仍须 E10 展示），验收 6 待人验；design/11/12、DHR_35/DHR_79 与零真实 Agent 边界未漂移｜由 `/root/dhr80_requirement_review` fresh Terra medium｜派出=e:E-8031

**教训复核结论**：approved after remediation；命中候选-31/39/48/51/58/62/81/84/85/86，未重蹈；唯一 P2 为 as-built 仍写“未得终态”，已同步 E-8029 并经原 reviewer 定向复审 P0~P3=0；无需新增 miner 候选｜由 `/root/dhr80_lessons_review` fresh Terra medium｜派出=e:E-8032

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_80 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|----------|--------------|------|----------|
| Receipt 字段语义与来源（2 个生产构造点） | `attempt-retry.mjs:44-48`、`workflow-driver.mjs:160-164` | 是 | 普通 Attempt 与 fresh retry 均写 immutable `receipt-bound/v1`；历史缺 mode 不迁移是有意差异 | e:E-8033 |
| gate 注册与恢复（4 个核心点、2 个兄弟套件） | `service.mjs:311-419,481-499`、`workflow-driver.mjs:269-270,588-589`、DHR64/DHR70 tests | 是 | retry 有意复用 durable Receipt→actor/lease/driver gate，不另造写者 | e:E-8033 |
| actor/lease/auth/fencing 拒绝（DHR80 3 组、兄弟 2 套件） | `dhr80-retry-result-bridge.test.mjs:529-610`、`dhr70-submission-gate.test.mjs:192-342` | 是 | 历史/未知/非当前、未认证、fenced、lease-lost 均在 Result 前拒绝并零 mutation | e:E-8033 |
| 幂等与冲突（retry/Result 两条链） | `attempt-contract.test.mjs:216-236`、`dhr80-retry-result-bridge.test.mjs:401-411,495-526` | 是 | 同 key 重放零新增；同 digest 幂等、冲突终态拒绝 | e:E-8033 |
| done/idle 零 Result（3 个既有观测套件 + 本卡） | `workflow-driver.mjs:461-472`、`dhr72-continuous-observation.test.mjs:32-73`、`dhr80-retry-result-bridge.test.mjs:612-675` | 是 | helper 构造只用于隔离零启动；主验收仍走真 RPC，属有意分层 | e:E-8033 |
| 文档与默认测试收录（1 脚本、4 类说明工件） | `package.json:12`、as-built、knowledge、backlog/workspace | 是 | 收录≠全量健康；B-50 的受限状态是用户授权的流程差异，不是 PASS | e:E-8033 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：对“一行 immutable mode 使 fresh retry Receipt 经正式 v2 submit / actor / gate / Store 闭环，且恢复、拒绝与零启动合同成立”置信度高：专项、受影响组合、正式 RPC committed Ack、完整 mutation snapshot 与生产变异均直接咬住。默认完整回归仍只有 exit 1，不能称全量健康；B-51 对称 A/B 只足以证明“未观察到 DHR_80 特有失败”。正式完成条件 5 要求的专项/受影响回归、heavy 五路与变异已闭合，原代码轮 2 reviewer 据此解除 F-8007 的本卡 P1 阻塞并保留为 P3 模块残余。

**设计契约传导声明**：实际生产 diff 只在 `attempt-retry.mjs` 的新 retry Receipt 构造点补 `result_submission_mode: 'receipt-bound/v1'`；复用现役 service/gate/actor/Store 与恢复路径，不改公开 schema、Store 算法、历史 Receipt 或 Agent 启动语义。B-50 只调整施工进入 heavy review 的门槛，不改 design/11、design/12 与六条验收。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| fresh retry Receipt 的正式提交闭环 | 真 v2 `retry-with-profile` → `submit-executor-result`，核 committed Ack、Result/event/state | E-8002、E-8004、E-8005、E-8018 | 满足 |
| 重启恢复、幂等与历史 Receipt 边界 | 同一新 Receipt 重启提交、重复/冲突终态、历史缺 mode 拒绝 | E-8005、E-8013、E-8018 | 满足 |
| profile / pause / retry key / actor / lease / fence 负例 | 每类拒绝前后比较完整 durable mutation snapshot；合法 replay 比精确 delta | E-8014～E-8019 | 满足 |
| done/idle 无正式提交保持零 Result / fallback / launch | fake adapter + timeout 观察启动/发送计数与 Store 投影 | E-8009、E-8013、E-8021 | 满足 |
| heavy 证据门槛 | 专项、受影响组合、五路复核、变异与默认完整回归残余并列展示 | E-8021、E-8025、E-8029～E-8044 | 满足：正式门槛闭合；F-8007 为 P3 open 模块残余，不得称全量绿 |
| 本地收口确认 | 用户查看 E10 机器证、差异、局限与尾巴；不替代 DHR_35 真实产品验收 | E-8090；releasePacket-DHR80-v2（待展示） | 待人验 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|---------------|------|
| 1 | 机器证（design/11 P6-IQ-A5；design/12 P6-RI-A1）：最小失败复现使用当前 v2 retry-with-profile 与 submit-executor-result 入口；修复后 fresh Receipt 持久带正确模式，成功与失败提交均由新 Receipt 派生身份，经 actor/gate 返回 committed Ack，Result/event/state 一致。不得用直接 appendResult 或 helper-only 测试代替入口集成。 | AI | E-8002、E-8004、E-8005、E-8018 | 满足 |
| 2 | 机器证（design/12 P6-RI-A1/A3）：服务重启后从同一新 Receipt 恢复 gate，不开第二个 Attempt、不启动 Agent；重复同结果仅在 committed 后幂等，冲突终态拒绝。既有缺 mode 的历史 Receipt 保持不可提交，不因修复原地升级。 | AI | E-8005、E-8013、E-8018 | 满足 |
| 3 | 机器证（design/11 P6-IQ-A5；design/12 P6-RI-A3）：非冻结 profile、快照漂移、pause 已关闭/同键冲突拒绝且无新增重试事实；同键合法重放保持同一新 Receipt。旧 Attempt 始终 fenced，旧 Receipt 提交不污染新结果；失租/未认证/未知或非当前 Receipt 继续拒绝。 | AI | E-8014～E-8019 | 满足 |
| 4 | 机器证（design/12 P6-RI-A2）：done/idle 无正式提交仍不产生 Result 或自动 fallback；使用 fake adapter 验证本次重试结果修复不会新增 Agent 启动/指令发送。 | AI | E-8009、E-8013、E-8021 | 满足 |
| 5 | 证据门槛：专项与受影响回归自然终态、退出码及版本落账；heavy 五路独立复核，轮2选点的变异红/恢复绿。未终态不记通过，既有全量回归债不靠定向绿抵扣。 | AI | E-8018、E-8021、E-8025、E-8029～E-8044 | 满足：专项/受影响回归、五路、变异均闭合；默认全量 exit 1 作为 P3 残余保留，不被抵扣或改写为绿 |
| 6 | 人判：无新增业务选择；收口仍展示上述机器证据并取得本地收口确认，不代替 DHR_35 真实产品验收。 | 人 | releasePacket-DHR80-v2（待展示） | 待人验 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|-------------------------------|---------|-----------------------------------------------|----------|--------------|----------|-------------|--------------|-----------------|-------------------|----------------------|
| fresh retry Receipt 正式提交闭环 | 真 v2 retry RPC + submit RPC + actor/gate + committed Store mutation | machine | P6-RI-A1 | 等价覆盖 | succeeded/failed Ack 与 Result/event/state 一致 | E-8004/E-8005/E-8018：正式入口 committed，组合 21/21 | `wt/DHR_80@8360f82` | RPC/Store/lease fixture | 真实 Agent 属 DHR_35 | design/11+12 | test | automated |
| 重启恢复、幂等与历史兼容 | 服务重启、同 digest 重投、冲突与旧 Receipt 负例 | machine | P6-RI-A1-A3 | 等价覆盖 | 恢复同 Receipt gate且不新建/launch，拒绝零 mutation | E-8005/E-8013/E-8018：同 Receipt 恢复，历史缺 mode 拒绝 | `wt/DHR_80@8360f82` | Store reopen + RPC | 真实跨机不在本卡 | design/12 | test | automated |
| retry 选择、fence 与身份负例 | frozen/profile drift/pause/key/lease/auth/current receipt 正反例 | machine | P6-IQ-A5-RI-A3 | 等价覆盖 | 合法重放唯一；非法原因稳定且零推进 | E-8014～E-8019：完整 snapshot 与精确合法 delta | `wt/DHR_80@8360f82` | RPC + durable projections | DHR_79 缺失负例独立 | design/11+12 | test | automated |
| done/idle 无提交不产 Result/fallback | fake adapter + injected timeout | machine | P6-RI-A2 | 等价覆盖 | 仅既定 human input/waiting，启动/发送=0 | E-8009/E-8013/E-8021：Result/fallback/launch/send=0 | `wt/DHR_80@8360f82` | fake adapter + Store | 真实 Agent 属 DHR_35 | design/12 | test | automated |
| heavy 证据门槛 | 专项/受影响回归自然终态 + 五路 + 变异；默认完整回归残余不得隐去 | machine | DHR80-QUALITY-GATE | 等价覆盖 | 正式验收 5 全字段闭合；默认完整回归债不被定向绿抵扣 | E-8018/E-8021 绿、五路与变异闭合；E-8029 exit 1 保留，B-51 未观察到本卡特有失败，原 reviewer E-8044 解除 P1 | `wt/DHR_80@e597c64` | independent reviews + symmetric baseline A/B | 原全量负载下各失败根因未完全钉死；F-8007 P3 open | dev-harness | gate | automated |
| 本地收口确认 | 对话展示 releasePacket 后由用户确认 | human | DHR80-E11 | 否 | 用户明文认可执行本地收口 | 待执行 | `releasePacket-DHR80-v2` | user | 不替代 DHR_35 产品验收 | dev-harness | user review | user |

**业务化五段展示区**

- 要证明啥：人工 retry 的 fresh Receipt 能接收、恢复并安全拒绝结果提交，且不启动 Agent。
- 期望值：正式入口产生唯一 committed Result；非法/无提交路径零错误推进。
- 实际值：正式 retry/submit、重启、拒绝、done/idle 专项与受影响组合为 37/37；生产 mode 删除后专项 2/7、恢复后 7/7；五路复核均收敛。唯一默认全量在授权终止卡死子进程后为 365/370、5 fail、exit 1。
- 差没差：直接业务合同与期望一致；完整回归门槛有差异，F-8007 尚未证明五项均为基线债。
- 证据局限：fixture 不替代 DHR_35 的真实 Agent 产品闭环；DHR_76/C 与 `identity-quota` 仅有历史同形，CLI/DHR_69/F/DHR_76/B 未证明基线同形。

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

> 风险放行账仍为空：F-8007 经 B-51 与原 reviewer 复核解除 DHR_80 的 P1 阻塞，但保持 P3 open 模块残余；它不是本卡未满足验收项，也不通过风险接受伪装为通过。用户 E11 明文认可将 F-8006/F-8007 整批加入验收池 `ACC-2026-09-07-01`。

**材料齐没齐**：[x] brief、task_plan、progress 主证据账本、findings、heavy 五路 review、B-50 审核证据均齐；E6 miner 产出 0 条新候选（E-8036）。

**as-built 更新了没**：[x] `as-built/relay-core.md` 已覆盖真实 A→B 与 E-8029 的 exit 1 边界，并经教训 reviewer 定向复审通过（E-8032）。

### E10 证据展示包（releasePacket-DHR80-v2）

- **展示版本**：`wt/DHR_80@e597c64`（含 B-51 对称基线诊断；本节只做收口备料，不改变生产实现）。
- **机器证据摘要**：入口红→绿与 committed Ack 见 E-8002/E-8004/E-8005；拒绝与合法 retry/replay snapshot 见 E-8014～E-8019；受影响组合 37/37、audit 0 见 E-8021/E-8025；变异红 2/7、恢复绿 7/7 见 E-8034/E-8035。
- **复核与治理**：heavy 五路均收敛；B-51 对称诊断经原代码轮 2 reviewer `APPROVED_RESOLUTION`，P0/P1/P2=0、P3=1；as-built 已同步；E6 miner 新增候选 0 条（E-8030～E-8044）。
- **残余边界**：唯一默认完整 `npm test` 仍为 exit 1、370 tests / 365 pass / 5 fail / 0 cancelled。B-51 只证明未观察到 DHR_80 特有失败：DHR_76/C 与 identity-quota 两侧同形，CLI/DHR_69/F/DHR_76/B 在单点及小并发两侧同绿；不证明默认全量健康或原负载下全部根因。F-8007 以 P3 open 留在 DHR-BL-17。
- **E11 本地收口授权包**：用户若明文认可，将连续执行精确本地 squash 合入 master、合入后相关复验、`verify(dh-relay)`、DevPlan/workspace 回填销户、本任务 worktree/branch 清理；不含 push、deploy、环境/生产操作、真实 Agent、DHR_35、下一卡或兄弟卡修复。F-8006/F-8007 的尾巴分流须同拍裁决。

→ 当前状态：**E11 已认可；正在执行本地收口授权包，尚未 verify/销户**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

### 目的一：确认 DHR_80 本地收口证据边界（覆盖 DHR80-E11）

本工作区将展示正式入口、重启恢复、负例、done/idle 无提交、回归和独立复核证据；这些证据不替代 DHR_35 真实产品验收。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 人判：无新增业务选择；收口仍展示上述机器证据并取得本地收口确认，不代替 DHR_35 真实产品验收。 | 查看 E10 展示的命令终态、关键 Ack/拒绝摘要、零启动计数、五路复核和变异结果 | 证据足以支持本地收口，且未声称已跑真实 Agent/DHR_35 | [x] |

- 确认记录：2026-09-07T22:05:41+08:00，用户在 E10 `releasePacket-DHR80-v2` 后明文“认可”；同拍认可 F-8006/F-8007 整批入验收池 `ACC-2026-09-07-01`。
- verify 提交 SHA：待主干 squash、合入复验后生成。
- 签名：hyf（chat-confirm）　　时间：2026-09-07T22:05:41+08:00

→ 解锁状态：**已确认本地收口；待主干合入复验与 verify**

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-09-07T22:05:41+08:00 | hyf（对话明文“认可”） | releasePacket-DHR80-v2 | `wt/DHR_80@7add5bc` | E-8002～E-8046；默认 npm=370/365/5/0 exit 1；B-51 对称 A/B | P6-RI-A1、P6-RI-A2、P6-RI-A3、P6-IQ-A5、DHR80-QUALITY-GATE、DHR80-E11 | 通过；授权本地收口包，尾巴入 `ACC-2026-09-07-01` |
