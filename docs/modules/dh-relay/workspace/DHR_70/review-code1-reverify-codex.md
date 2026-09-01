<!-- dh:v1 · DHR_70 轮 1b 整改复验 · 复核者原文（主控捕获落盘，未删改） -->
# review-code1-reverify-codex — DHR_70 轮 1b

- **复核者**：`dhr70rev1b`
- **形态**：codex `--sandbox read-only` · gpt-5.6-terra · high · **fresh，未继承 `dhr70rev1` 会话**
- **派发**：`/codex` 插件 companion，cwd = `.dh-worktrees/DHR_70`
- **派单**：`review-brief-code1-reverify.md`
- **基线**：整改增量 `git diff b6a3b47..8ed411d`
- **落账**：e:E-7009
- **codex session**：`01a05c30-7039-7101-a975-a738c8465fc2`

---

## 形态自述

Codex，read-only sandbox；仅静态审查，未运行测试、未修改文件。审查主战场：`git diff b6a3b47..8ed411d`。

## F-70-R1-01 闭合判定（闭合，附推演）

闭合。A2 新增断言能挡住"绕开 lease、直接向 Store 落盘 Result"的失效实现：

- 外部接管后的 lease 为 `holder_pid=999999999`、`epoch=held.epoch+1`；直接落盘不会改 lease，因此 `holder_pid === process.pid` 与 `epoch === held.epoch+2` 都会失败。
- 直接落盘也不会经 `host.mjs:69` 追加 `lease_acquired`，事件序列断言同样失败。

三条均非装饰性；它们共同证明成功路径至少经过一次本 service 的重新取 lease 和新 HostSession 初始化。

## 发现（新问题，含"整改引入的新问题"）

未发现 P0/P1/P2/P3 新问题，也未发现整改引入的新问题。

## 逐点结论

1. F-70-R1-01 已闭合，见上。
2. `epoch === held.epoch + 2` 在该 fixture 中不脆弱：`acquireLease()` 接管时固定为当前 epoch 加一；外部已写入 `held+1`，重取必为 `held+2`。`renew()` 仅更新到期时间、不改 epoch。`submitExecutorResult` 经单一 `enqueue` 串行，`until` 也逐次 await；慢机不会合法地产生第二次取 lease。合法的 `+3` 意味着同一提交中又起了一届 actor，不是 A2 应接受的路径。
3. `leaseEpochs` 当前解析稳定。`host.mjs:69` 的 detail 固定为 `epoch:<整数>`；epoch 来自 lease 的整数值。若 detail 非法而得出 `NaN`，与期望整数的 `deepEqual` 不会通过，不会被静默吞掉。
4. 新断言不会因 `until` 轮询或高并发而额外取 lease：轮询请求串行进入 service 队列，旧 actor 失租后只会被摘除一次，随后 durable 路径创建一届新 actor。20 秒 timeout 是有界失败，不会把超时伪装为通过。
5. 增量的 6 个文件均在 `dh:allowed-paths:v1 task=DHR_70` 内；`git diff --check` 无输出。
6. 轮 1 的其余结论均同意：单写者仍由 Store `writeGuard` fence；只捕获精确 `actor-closed`，不会吞掉 `lease-lost`；`await dead.done` 的删除回调先注册且该 Promise 会 fulfilled；Map 迭代中删除当前项不会漏后续项；A3-1 改为断言"拒绝且零 mutation"没有失去防护力。全量测试基线的"零新增失败"因未运行测试，仅能维持静态审无法独立证实的边界。

---

## 主控裁决（不属复核者原文）

- **轮 1 收敛**：F-70-R1-01 闭合，轮 1b 零新发现、零"整改引入的新问题"（止损换人硬条未触发）。轮 1 全程 **open P0/P1 = 0**。
- 第 2 点是主控在派单里主动提的自证脆性问题（怕 `epoch+2` 是过拟合断言），复核者独立核了 `renew()` 不改 epoch + 提交串行两条，结论是不脆。这条比"闭合"本身更有价值：它说明新断言不会变成后续维护的假红源。
- 第 6 点末句同轮 1 第 8 点，是只读沙盒的**边界如实申报**，非发现。F-7003 全量基线的原始输出留在 E-7007，进人验证据展示区。
