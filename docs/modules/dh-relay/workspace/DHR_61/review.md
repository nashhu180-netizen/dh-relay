<!-- dh:v1 -->
# review — DHR_61

## 独立复核区

**第一轮**（fresh）

| 复核者 | 范围 | 发现 | 派出证据 | 证据 |
|---|---|---|---|---|
| Opus 5 · `dhr61_r1` | 全程增量、D1/D2 契约、Store/RPC/Registry 与定向探针 | P0/P1 经整改复验归零；P2/P3 保留 | e:E-024 | E-015；`review-code1-opus.md` |

**第二轮**（fresh，实例不同于轮 1）

| 复核者 | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| Opus 5 · `dhr61_code2` | 全程增量、轮 1 闭合项与真实变异 | P0=0；P1 整改后归零，非阻断项转 findings | e:E-025 | E-016、E-017；`review-code2-opus.md` |

### 需求、教训与一致性（均为独立实例）

**需求复核结论**：approved；D1/D2、P6-IQ-A1/A3/A5 与 DHR_34 D3 边界经整改复验无 open P0/P1｜派出=e:E-025｜证据(E-016)｜由 Opus 5 · `dhr61_req`

**教训复核结论**：approved；代码纪律 clean，账本滞后已补，候选已搬运至 `lesson_candidates.md`｜派出=e:E-025｜证据(E-016、E-022)｜由 Opus 5 · `dhr61_lessons`

| 路径 | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| 需求 | D1/D2、P6-IQ-A1/A3/A5 与 DHR_34 D3 边界 | P1 全部整改；P2 边界/证据项已闭合或登记 | 独立 Opus 5 pane | E-016；`review-req-opus.md` |
| 教训 | 在册教训、凭据边界与流程留痕 | 代码纪律 clean；账本滞后已补，候选已搬运 | 独立 Opus 5 pane | E-016；`review-lessons-opus.md` |
| 一致性 | Receipt、event、Store、RPC、capability 与散文 | P1 经整改复验归零；非阻断开放点登记 F-006/F-007 | 独立 Opus 5 pane | E-016；`review-consistency-opus.md` |

### 有效单测·变异点登记

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `store/store.mjs` · `appendResult` 的 fenced guard | 保留 → 删除整行 | 身份 fence / 迟到写拒绝 | `attempt-contract.test.mjs` 两条 | `node --test --test-concurrency=1 test/attempt-contract.test.mjs` | `19f2b088…0ecb` → mutant `e38a102b…0b2` | `19f2b088…0ecb`，`diff` 空 | Opus 5 · `dhr61_code2` | mutant 11/13、exit 1；restore 13/13、exit 0 |

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_61 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| Attempt/Receipt、pause/retry 与 attention 合同 | `contracts/**`、Store 回放、RPC v1/v2、Runtime 签发点 | 一致；Attention 单一定义、RPC error 与 capability 双轨已整改 | P0/P1=0；P2 开放点见 F-006/F-007 | e:E-025 |

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| P6-IQ-A1 | 构造脱敏 profile，开立/重放 Attempt Receipt；历史 launch receipt 继续过 fixture；凭据形态扫描 | E-003、E-010、E-013~E-016、E-019 | 满足 |
| P6-IQ-A3 | 写 canonical pause，重放 fence/`waiting_human`/Attention；注入损坏、路径逃逸、未恢复 mutation、迟到 checkpoint/result 与 v1 兼容场景 | E-010~E-017、E-019 | 满足 |
| P6-IQ-A5 | 用冻结且当前仍全等的 profile retry；注入关闭 pause、新幂等键、快照不匹配与旧 Attempt 迟到写 | E-011、E-013~E-017、E-019 | 满足 |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | Attempt Receipt 在开立、持久化与重放中保有同一 `executor_identity`；`launch-receipt/v2` 历史形态仍可读，Receipt、事件、日志与测试样本零敏感值。 | machine | E-003、E-010、E-013~E-016、E-019 | 是 |
| 2 | 单条 canonical `fallback_pause_created` 原子重放 fence、`waiting_human` 与 Attention；重复、冲突、损坏、截断及 journal 强杀阶段均 fail-closed，迟到写入返回 `E_ATTEMPT_FENCED`，v1 不静默丢失 Attention。 | machine | E-010~E-017、E-019 | 是；失败句柄须 reopen，坏列表整请求 fail-closed |
| 3 | v2 `retry-with-profile` 仅接受冻结且仍匹配的 profile；同键幂等，关闭 pause、快照不匹配和部分失败均有定向反例，旧 Attempt 始终 fenced。 | machine | E-011、E-013~E-017、E-019 | 是 |

### 验收项元数据表

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| Attempt 身份快照一致且旧 launch receipt 可读 | schema + open/replay + fixture + 凭据扫描 | machine | P6-IQ-A1 | 覆盖 | 新旧正反例均通过且扫描零命中 | E-019 终态回填 | Node/Windows/Opus Review Batch | JSON schema / fixture | 真实产品闭环属 DHR_35 | attempt-receipt/v1 | test runner | AI 自动验收 |
| pause 原子性、fence、Attention 与 v1 可见失败 | Store 重放、损坏/截断/强杀反例、v1/v2 RPC 测试 | machine | P6-IQ-A3 | 覆盖 | 任一缺项或冲突 fail-closed，v1 不静默省略 | E-019 终态回填 | Node/Windows/Opus Review Batch | Store journal / RPC schema | D3 自动选择属 DHR_34 | fallback-pause/v1 | test runner | AI 自动验收 |
| retry 仅接受冻结匹配 profile 且无部分提交 | v2 retry 正反例与幂等/恢复测试 | machine | P6-IQ-A5 | 覆盖 | 同键同结果，非法输入零写入 | E-019 终态回填 | Node/Windows/Opus Review Batch | Store transaction / RPC schema | UI 体验属 DHR_35 | rpc-methods/v2 | test runner | AI 自动验收 |

### 业务化五段展示区

- 要证明啥：D1/D2 的持久协议安全，不包含人判体验项。
- 期望值：所有机器验收条件有可复跑证据，且 DHR_34 才可消费合同。
- 实际值：三条机器条件均完成，Review Batch 的 P0/P1 经整改复验归零；P2 开放点已明文登记且不改变 D1/D2 正确性。
- 差没差：与 DHR_61 完成条件无阻断差异；D3 quota 自动选择与真实 UI/产品闭环仍按边界留给 DHR_34/35。
- 证据局限：真实产品体验和 D3 自动 fallback 不在本卡。

## E10 放行证据包

`releasePacket: DHR_61-E10-v1`：实现字节为 rebase 后 `69c7f39`（与 rebase 前已取得 237/237 的 `7083a2d` 在 `relay-core/` 下零差异）；收口提交 `35df80d` 上全量复跑 237/237。此前一轮 236/237 的唯一失败是 Windows 临时目录清理 `EBUSY`，同一 `dsh-bridge.test.mjs` 在 DHR_61 与 master 隔离复跑均 7/7，且最终全量未复现。其余门禁为 audit 0 违规、selftest 57/57、capability 19 份、fixture 90 份、`git diff --check` 无错误。五路独立 Opus 复核均已收敛至 open P0/P1=0；三项完成条件均为机器等价覆盖。H=0：无人判结果项、无 open 方向项、无风险接受项；用户 E-018 已明文接受本卡进入收口，但不替代 verify。

→ 当前状态：**已完成；squash `84eb2bf` 与独立 verify `45233b9` 已在 master，DHR_34 前置阻塞已解除。**

---

## 人类签名区

本卡无独立人判验收项。用户于 2026-08-30 明文“**就当61完成好了**”，确认接受本卡进入收口；最终机器闸、五路独立复核、master squash `84eb2bf` 与独立 verify `45233b9` 均已齐备。
