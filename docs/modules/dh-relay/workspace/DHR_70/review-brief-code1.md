<!-- dh:v1 · review-brief — DHR_70 第一轮代码复核派单。主控写，复核者只读。 -->
# review-brief · DHR_70 · 代码复核轮 1

## 你是谁 / 不是谁

你是**复核 worker**，不是主控。只读、不改任何文件（你跑在 codex `--sandbox read-only` 里，写操作会被 OS 沙盒拒绝——这是设计如此，别绕）。
不要再派活、不要起子任务、不要回头问用户。只做本轮复核，产出一份结论文本回给主控。

先读仓根 `AGENTS.md`「编排协议段 → 复核 worker」再动手。

## 你要审什么

**基线**：`git diff 35ff2db..b6a3b47`（= `master..wt/DHR_70`）。cwd 已经是该 worktree，HEAD 就是 `b6a3b47`。

改动共 6 个文件，其中**生产代码只有两处**：
- `relay-core/runtime/service.mjs` —— `submitExecutorResult` 首轮 drivers 循环 + 新增 `evictClosedActor`（唯一实现改动）
- `relay-core/package.json` —— 只向 test script 追加一个文件名 token

其余：`relay-core/test/dhr70-submission-gate.test.mjs`（新建定向套件）、`workspace/DHR_70/` 三份工件。

**必读上下文**（都在 cwd 内）：
| 读什么 | 为什么 |
|---|---|
| `docs/modules/dh-relay/workspace/DHR_70/brief.md` | 六条完成条件 A1/A2/A3/B/C/D 的逐字口径 + 边界 + 红线 |
| `docs/modules/dh-relay/workspace/DHR_70/progress.md` | 施工方的证据账本 E-7002~E-7007，含归因链 |
| `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §3.2 DHR_70 | 唯一权威验收口径 + `dh:allowed-paths:v1 task=DHR_70` |
| `docs/modules/dh-relay/design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md` | 冻结语义：「唯一 writer 与 Result mutation」「Gate 生命周期」、§4 P6-RI-A1/A3 |
| `relay-core/runtime/host.mjs`、`relay-core/runtime/workflow-driver.mjs` | `actor-closed` 的产生点、lease 续约、gate 注册；本卡**没改**它们，你要判断"没改"对不对 |

## 逐条要你给结论的点

按 P0/P1/P2/P3 定级，每条说清**在哪一行、什么输入下会怎样错**。没问题也要明说"看过、没发现"，别空过。

1. **单写者是否被放宽（最高优先级 · 红线）**。本卡红线是「修 `actor-closed` 不许用『失租后也允许写』实现」。请独立判断：`evictClosedActor` 那条 `continue` 之后走的 durable 重建路径，是不是**真的重新取了 lease**、还是绕开了 Store `writeGuard`。特别核 `String(error?.message ?? error) !== 'E_LEASE_HELD:actor-closed'` 这个**字符串精确比对**：
   - 它会不会漏掉某条本该也被摘掉的 actor-closed（比如 message 被包装过、或 detail 字段而非 message 携带该串）？
   - 它会不会**误吞**本该抛出的 `lease-lost`？请去 `host.mjs` / `store` 找齐所有能产生 `E_LEASE_HELD*` 的位置，确认分流正确。
2. **是否黏旧进程**。断言与实现都不得要求「必须打到写 Receipt 的那一届 service/actor」——那与重启恢复冲突。请检查实现与新测试里有没有这类隐含耦合。
3. **`await dead.done` 的那段推理是否成立**。注释声称「`ensureActor` 里的 `actors.delete` 回调注册得更早，所以 await 之后必然已摘除」。请核对 `service.mjs` 里 `ensureActor` 的回调注册顺序，判断这个 happens-before 是否真成立；如果 `dead.done` 已 reject（不是 resolve），`await` 会不会把异常抛出去打断循环？
4. **`drivers` map 的并发/迭代安全**。循环体内 `drivers.delete(runId)` 是在 `for...of drivers` 迭代过程中删元素——判断在 JS Map 迭代语义下是否安全，以及多个 run 并存时会不会漏掉后续 driver。
5. **A2 之外的路径有没有被牵连**。`commitReceipt` / `stopDriver` / `attach` / `detach` 各自取 actor 的方式，会不会因为 `actors` 被提前摘除而出问题。
6. **新测试是不是真的能兜住**。六条用例（A1/A2/A3-1/A3-2/A3-3+B/C）：断言够不够硬？有没有「改坏实现测试仍绿」的松口？特别看 A3-1，施工方自己记录过它原本把判据锁死在 `actor-closed` 字样上、第 6 步一修就红了、后来改成只钉"该不该拒"——请判断改后的判据**是不是被放松到失去防护力**。
7. **越界**：`git diff --name-only 35ff2db..b6a3b47` 逐条对 DevPlan `dh:allowed-paths:v1 task=DHR_70` 比。
8. **F-7003 的处理是否诚实**。施工方声称 master 全量基线本来就红（`identity-quota.test.mjs` 的 DHR_34 族 9 条），本卡零新增失败。你**跑不了测试**（只读沙盒写不了临时文件），所以只做静态核：它的隔离复核逻辑有没有漏洞、有没有把自己引入的红说成 pre-existing。

## 硬边界

- **只读**。跑不了测试就如实申报「仅静态审」，不许假装跑过。只读命令（`git diff` / `git show` / `grep` / 读文件）随便用。
- 只写事实与级别，**不替主控做验收裁决**（不要写 approved/rejected，那是轮 2 和主控的事）。
- 范围外的新想法写在结论末尾"范围外观察"，不要求本卡改。
- 密钥/凭据值永不出现在你的结论里。

## 产出格式

直接把完整结论输出到 stdout（主控会捕获并落盘为 `review-code1-codex.md`）。结构：

```
## 形态自述
（你的模型、sandbox 模式、是否跑过测试）

## 发现
### F-70-R1-01 (P?) 标题
- 位置：path:line
- 事实：
- 失效场景：什么输入 → 什么错误结果
- 依据：

## 逐点结论（上面 8 点逐条，无发现也要写"看过、没发现"）

## 范围外观察
```
