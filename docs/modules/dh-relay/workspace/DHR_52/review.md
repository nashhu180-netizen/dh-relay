<!-- dh:v1 -->
# review — DHR_52

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 | 证据 |
|---|---|---|---|---|
| | | | | |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|---|
| | | | | | |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|---|---:|---|---|
| 1 | | | |

**需求复核结论**：待派发

**教训复核结论**：待派发

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_52 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Runtime handshake capability 比较 | `relay.rpc/v1`、`capability-baseline.mjs`、`reason-codes.md` | 待复核 | 待复核 | 待派发 |
| subscribe notification | `relay.rpc/v1` 两个 `allOf` 分支与 fixtures | 待复核 | 待复核 | 待派发 |

## AI 提交区　⚠️ This is not human approval

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| 客户端断开不取消 Run | 建 Run、订阅后关闭连接、重连比对 state/events | | |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | capability mismatch 严格拒绝且基线一致 | AI | | |
| 2 | 断连不写 cancel 且重连状态一致 | AI | | |
| 3 | subscribe 完整自描述帧与三反例拒绝 | AI | | |
| 4 | F-057 有证据与裁决 | AI + 主控 | | |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| capability mismatch fail-closed | 实际 socket/pipe 双端握手测试 | machine | DHR52-M1 | 无法取证 | 不同合法 hash 必拒 E_CAPABILITY_MISMATCH | | Node + Windows | capability-baseline.json | 远程网络不在范围 | relay.rpc/v1 | test runner | task card |
| 断连不取消 | 连接关闭前后 Store state/events byte 比对 | machine | DHR52-M2 | 无法取证 | 无 cancel 且重连同态 | | Node + Windows | Store replay | SSH 真机另列 | relay.rpc/v1 | test runner | task card |
| 完整订阅帧 | schema + socket notification 正反例 | machine | DHR52-M3 | 无法取证 | 两正例完整、三反例拒绝 | | Node + Windows | frozen schema | 新 notification 不在范围 | relay.rpc/v1 | test runner | task card |
| F-057 reason 边界 | 固定反例与 reason-code 对照 | machine | DHR52-D1 | 无法取证 | 裁决有可复跑证据 | | Node + Windows | reason-codes.md | 新码须另获确认 | relay.rpc/v1 | main controller | task card |

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|---|---|---|---|---|---|---|
| 无 | — | — | — | — | — | — |

→ 当前状态：**进行中**

---

## 人类签名区

本卡当前无独立人判结果项。E10 将根据 F-057 是否形成需用户裁决的冻结契约变更，展示证据或声明 H=0 推导结果；此处不预填通过结论。
