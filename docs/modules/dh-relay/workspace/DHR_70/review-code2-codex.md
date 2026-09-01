<!-- dh:v1 · DHR_70 代码复核轮 2（增量 + 变异点选点） · 复核者原文（主控捕获落盘，未删改） -->
# review-code2-codex — DHR_70

- **复核者**：`dhr70rev2`
- **形态**：codex `--sandbox read-only` · gpt-5.6-terra · high · **fresh，Review Batch 并发，四路互不继承会话**
- **派发**：`/codex` 插件 companion，cwd = `.dh-worktrees/DHR_70`
- **派单**：`review-brief-code2.md`
- **基线**：全卡 `git diff 35ff2db..cb742d4` + 轮 1/1b 记录 + 增量
- **落账**：e:E-7011

---

## 形态自述

只读静态审查，未运行测试，未修改文件。

## 对轮 1 / 1b 结论的独立复核（逐条同意 / 不同意 + 理由）

同意轮 1/1b 对以下事项的结论：

- 单写者未被放宽：仅精确捕获 `E_LEASE_HELD:actor-closed`；`lease-lost` 仍原样抛出。重建仍经 `ensureActor`，即重新取得 lease，并由 Store `writeGuard` 围栏。
- `await dead.done` 不会中断循环：`createHostSessionActor` 将底层失败转换为 fulfilled 的结果对象；`ensureActor` 的清理回调先注册，随后才继续 durable 重建。
- A3-1 放松具体错误 detail 后仍有防护力：其仍断言拒绝、零 Result、节点保持 `running` 且事件账本不变。
- 轮 1 的 F-70-R1-01 已闭合：A2 已验证重新取得本 service 的 lease、epoch 为外部接管后的下一届，并新增一条 `lease_acquired`。

不同意轮 1b “无新的 P2”的完整结论：A2 尚未直接证明旧 actor 在失租后的被拒提交确为零 mutation，见 F-70-R2-01。

## 新发现

### F-70-R2-01 (P2) A2 未直接验证旧 actor 被拒阶段的零 mutation

位置：`relay-core/test/dhr70-submission-gate.test.mjs:210-226`

A2 在外部接管后轮询提交；对包含 `lease-lost` 的响应直接丢弃，直到取得非 `lease-lost` 响应。随后只验证最终唯一 Result、lease 换手和 `lease_acquired` 序列。它没有对旧 actor 的被拒响应断言 `E_LEASE_HELD`，也没有在新 actor 成功前断言 Result、节点状态和事件账本均未变化。

因此，若错误实现会在旧 actor 被 fenced 时附带写入非 Result 事件，随后仍重新取 lease 并写入唯一 Result，当前 A2 仍可为绿。A3-1 覆盖了“无合法 lease 时”的零 mutation，但不能替代 A2 所要求的“旧 actor 拒绝且零 mutation，然后新 actor 接手”的阶段性证据。

## 完成条件 A1~D 逐条判定

- A1：成立。测试覆盖本届等待结束、lease 仍有效、current Receipt 的提交、唯一 Result 与幂等重投。
- A2：部分成立。生产路径静态上会摘除死 driver/actor，随后经 durable 路径重新取 lease、创建 actor、重建 gate；且 lease 换手已有断言。旧 actor 被拒且零 mutation 缺少直接阶段性验证，受 F-70-R2-01 影响。
- A3：成立。活跃外部 lease、非 current Receipt、终态冲突均保持拒绝；A3-1 对零 Result、节点不推进、事件不变有明确断言。
- B：成立。未知 Receipt 保持 `E_IDENTITY_MISMATCH`，未触发索引修复或 Result 写入。
- C：成立。`agent_get=idle ∧ pane_get=error` 不生成 `E_EXECUTOR_HOST_LOST` 或 `attempt_failed`，保留 gate 并可提交。
- D：路径均落在 DevPlan 的允许范围；`package.json` 仅追加本测试 token；`git diff --check` 无输出。测试执行结果仅引用现有 E-7010，未由本次只读审查复跑。

## 越界判定

无越界。`git diff --name-only 35ff2db..HEAD` 中的生产代码仅为 `relay-core/runtime/service.mjs`，测试、`package.json` 与 DHR_70 工作区文件均在 `dh:allowed-paths:v1 task=DHR_70` 内。

## 变异点选点（上面那张表 + 选点理由）

| 字段 | 内容 |
|---|---|
| 变异点锚点 | `relay-core/runtime/service.mjs:474` |
| 原值 → 变异值 | `if (String(error?.message ?? error) !== 'E_LEASE_HELD:actor-closed') throw error;` → `if (String(error?.message ?? error) === 'E_LEASE_HELD:actor-closed') throw error;` |
| 语义类别 | 反转判据 |
| 对应测试 ID | `DHR70 A2: 旧 actor 失租关闭后，非终态 Run 的晚交必须由新持 lease 的 actor 写入唯一 Result` |
| 运行命令 | `node --test --test-name-pattern="^DHR70 A2: 旧 actor 失租关闭后，非终态 Run 的晚交必须由新持 lease 的 actor 写入唯一 Result$" test/dhr70-submission-gate.test.mjs`（在 `relay-core` 目录执行） |
| 预期红的形态 | 旧 actor 抛出 `E_LEASE_HELD:actor-closed` 时变异后立即重新抛出，不会执行 eviction 与 durable 重建；A2 在 `assert.equal(settled.error, undefined)` 失败，错误为 `E_LEASE_HELD`，detail 含 `actor-closed`。 |

选点理由：它直接破坏本卡的核心修复行为——识别已关闭 actor、移除过期缓存并转入重新取 lease 的路径；不会以语法或崩溃方式取巧，且 A2 应明确变红。

## 轮 2 总结论：changes-requested

Codex session ID: 01a05c35-985a-7651-8454-fb9423be48ff
Resume in Codex: codex resume 01a05c35-985a-7651-8454-fb9423be48ff
