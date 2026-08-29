<!-- dh:v1 -->
# findings — DHR_61

## 问题

当前无 open P0/P1；DHR_61 已以 master squash `84eb2bf`、verify `45233b9` 收口。DHR_34 的 F-003/F-004 已由 B-23 分流至本卡并闭合，现只消费冻结合同施工 D3。

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-001 | P1 | 用户已授权且 E-004/E-005 已完成 Registry fields 元数据迁移；E-009 已为 `herdr.codex.ninth` 登记并校验 `config_fingerprint_rule`。E-010 已实现只读白名单 projection provider，并在 Herdr 签发时冻结 source/fallback 的 Receipt 身份；原始配置与非白名单字段不进入 Receipt。 | E-005、E-009、E-010；design/11 D1 | 已由 E-010 关闭。 | resolved 2026-08-29 |
| F-002 | P2 | 历史无总结与中间并发红均不冒充通过；最终冻结字节已取得 237/237，另有 DHR_61 定向 27/27 与 Windows lock 压测连续 3/3。 | E-008、E-015、E-019 | 保留历史失败观察；以最后一次完整 exit 0 为收口证据。 | resolved 2026-08-30 |
| F-003 | P1 | 原登记的 bootstrap/RPC v2/read model/v1 订阅关闭/retry 当前 Registry 复核缺口，现均已实现并经代码轮 1、需求与一致性复核。 | design/11 D2、P6-IQ-A3/A5；E-013~E-016 | 原句作为施工中历史保留；现状由 E-013~E-016 纠正。 | resolved 2026-08-30 |
| F-004 | P1 | Review Batch 发现 pause 的人工候选集可扩大到 Receipt 快照外、缺投影规则会扩大为整届 driver 失败、Attention 同名双定义、retry 冲突会在 RPC 静默断连、capability 双轨无权威说明。 | `review-req-opus.md` P1-1/P1-2；`review-consistency-opus.md` P1-1~P1-3 | Store 强制有序子集；缺规则仅保持该节点 pending；v0 Attention 与承重定义统一；冲突转稳定 error；CANONICALIZATION 明文双轨。 | resolved 2026-08-30 |
| F-005 | P1 | 未恢复 mutation 被读取时，`E_STORE_MUTATION_RECOVERY_FAILED` 未映射为 RPC reason，客户端看到静默断连；mutation 提交失败后同一 Store 句柄仍可能继续写。 | `review-code2-opus.md` P1-2/P1-3、P2-1 | Attention 读取异常统一 `withReason`；坏 Run 使整次 list 原子 fail-closed（不筛项、不伪造完整列表）；mutation 失败后句柄 poisoned，必须 reopen 恢复。 | resolved 2026-08-30（见代码轮 2 整改复验） |
| F-006 | P2 | committed journal/staging blob 暂不回收，Store 扫描成本与磁盘占用随 mutation 增长；`relay.subscription-terminal/v1` 暂无生产者；bootstrap/v2 认证仍需同时读取本地 v1 ready descriptor/credential。 | `review-code1-opus.md` P2-4/P3-1；`review-consistency-opus.md` P2-3/P2-4 | 不影响当前账本正确性与 DHR_34 D3；作为后续存储维护与 DHR_35 客户端接线项登记，禁止下游误当已提供完整 v2 控制通道。 | accepted nonblocking 2026-08-30 |
| F-007 | P2 | `listRuns` 遇任一不可恢复 Run 时整次返回稳定错误，而非部分列表。 | design/11 D2“该 Run 拒绝读写”与“不筛掉项目”；`review-code2-opus.md` P1-2 | 主控裁决为 fail-closed 的原子列表语义：v1 无逐项错误字段；返回部分列表会静默漏 Run，伪造“完整列表”。未来若要逐项错误，须升 Read Model 版本。 | accepted design 2026-08-30 |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞。
