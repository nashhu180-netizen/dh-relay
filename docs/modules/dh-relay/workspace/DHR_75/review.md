<!-- dh:v1 -->
# review — DHR_75

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|
| 待派 | DHR_75 全部实现 diff 与机器证 A~F | 待填 | 待填 | 待填 |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|---|
| 待派 | 全程、轮1记录、收口增量 diff、生产变异点选取 | 待填 | 待填 | 待填 | 待填 |

**有效单测·变异点登记**

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| 待轮2选点 | 待填 | 改条件 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|---|---|---|---|
| 1 | 待填 | 待填 | 待填 |

**需求复核结论**：待填｜证据(E-xxx)｜由 待派｜派出=<待填>

**教训复核结论**：待填｜命中条目｜由 待派｜派出=<待填>

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_75 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Herdr CLI async 返回形状与超时清理 | 所有 `makeHerdrCli()` 直接/间接调用者、DHR_70/DHR_72 回归 | 待填 | 待填 | 待填 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：待施工与复核后填写。

**设计契约传导声明**：待收口填写。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| DHR_75 真实产品边界 | DSH-off Windows 冻结 Codex Profile：attempt_started → 首条 host observation，并核对当时 lease expiry | 待填 | 待填 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---|---|---|---|
| 1 | 机器证 A：慢 CLI 跨 ≥2 renew tick，TTL 仍 15 秒，contender 被拒，TTL-only 变异不过。 | AI | | |
| 2 | 机器证 B：慢调用后 observation 与 checkpoint 可达，修前红修后绿。 | AI | | |
| 3 | 机器证 C：旧 epoch observation/checkpoint/Result 全拒，零双写/重复 seq。 | AI | | |
| 4 | 机器证 D：CLI 返回/错误兼容，超时等 close，Windows 无子孙残留。 | AI | | |
| 5 | 机器证 E：直接回归均终态，B-38 明确排除。 | AI | | |
| 6 | 机器证 F：真实 DSH-off 首 observation 时 lease 新鲜，不替代后续卡。 | AI | | |
| 7 | heavy 有效单测：轮2选生产变异点，指定测试断言失败。 | AI | | |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 慢 Herdr 调用不饿死续租 | 短 TTL + 真实慢子进程 + lease 时间线 + contender | machine | DHR75-A | 否 | ≥2 renew，TTL 15s，contender E_LEASE_HELD | 待执行 | Windows/Node/Herdr 待记 | 事件账 + lease 文件 | 其它启动停摆机制 | P6-RI-A3/A4 | test+runtime | D-start |
| CLI 行为兼容与清理 | 返回矩阵 + child close + Windows 进程树检查 | machine | DHR75-D | 否 | 返回形状不变、无残留 | 待执行 | Windows/Node/Herdr 待记 | 原断言 + OS 进程检查 | Linux/SSH | DHR-B-40 | test+runtime | D-start |
| 真实产品首观测时 lease 新鲜 | DSH-off 冻结 Codex Profile 实录 | machine | DHR75-F | 否 | 首 observation 时 expiry 在未来 | 待执行 | Windows/Herdr/Codex 待记 | 脱敏事件账 + lease | 不替代 DHR72/DHR35 | P6-RI-A4-pre | runtime | D-start |

**业务化五段展示区**

- 要证明啥：Herdr 命令合法变慢时，Relay 的 Host lease 仍持续续租，并且旧 actor 仍不能越权写入。
- 期望值：至少两次续租、竞争者被拒、慢调用后首观测可达、默认 TTL 不变。
- 实际值：待执行。
- 差没差：待执行。
- 证据局限：本卡不证明 DHR_72 持续观测、DHR_35 完整闭环或全部启动停摆已解决。

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|---|---|---|---|---|---|---|
| 无 | | — | — | — | — | — |

**材料齐没齐**：未完成。

**as-built 更新了没**：未完成。

→ 当前状态：**施工中**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡没有产品体验型 H 项；E10 将展示全部机器证与 releasePacket。只有用户在对话中确认“已查看证据，认可执行本地收口”后，才允许 E12/E13。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 本地收口授权包 | 查看 E10 展示的机器证、复核结论、diff 与残余边界 | 明确同意或拒绝本地 squash/复验/verify/销户/任务树清理；不含 push/deploy/下一卡 | [ ] |

- 确认记录：待用户 E11。
- verify 提交 SHA：待用户 E11 后。
- 签名：hyf（待 chat-confirm）　　时间：

→ 解锁状态：**未验收**

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---|---|---|---|---|---|---|
| | | | | | | |
