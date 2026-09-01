<!-- dh:v1 · DHR_70 代码复核轮 1 · 复核者原文（主控捕获落盘，未删改） -->
# review-code1-codex — DHR_70 轮 1

- **复核者**：`dhr70rev1`
- **形态**：codex `--sandbox read-only`（OS 级沙盒，机器强制只读）· gpt-5.6-terra · reasoning effort high · fresh context
- **派发**：`/codex` 插件 companion（`codex-companion.mjs task --background`），cwd = `.dh-worktrees/DHR_70`
- **派单**：`review-brief-code1.md`
- **基线**：`git diff 35ff2db..b6a3b47`
- **落账**：e:E-7008
- **codex session**：`01a05c24-1c87-7090-8adf-e305e4ff2e4b`

---

## 形态自述

Codex（GPT-5.6-terra），read-only sandbox。仅做静态审查；未运行测试，未修改文件。

## 发现

### F-70-R1-01 (P2) A2 用例未直接验证"重新取 lease / 新 actor / 重建 gate"
- 位置：`relay-core/test/dhr70-submission-gate.test.mjs:213`
- 事实：A2 仅断言提交成功、Result 唯一及重投幂等；没有在成功后断言 `host-lease.json` 已由本 service 以新 epoch 取得，也没有以可观察事实证明旧 actor 未写、随后确实重建 gate。
- 失效场景：实现若错误地绕过 actor/lease 重建而直接走无 fencing 的持久化写入，仍可产出唯一 Result，使该用例保持绿色，却违反 A2 和单写者红线。
- 依据：外部接管在 `:196-205` 完成；后续断言集中于 `:213-227`，未再读取 lease 或核对新的 `lease_acquired` 事实。建议至少断言成功后 lease holder/epoch 已更替，并核对相应 lease 事件。

## 逐点结论

1. 单写者：看过、当前实现未放宽。`service.mjs:474` 只捕获精确的 `E_LEASE_HELD:actor-closed`；当前唯一产生该 detail 的位置是 `host.mjs:159`。`lease-lost` 由 `host.mjs:63` 与 `lease.mjs:152/159/170` 产生，字符串不同，会原样抛出。随后 durable 路径经 `ensureActor`，而它创建 actor 会先 `acquireLease`，Store 仍挂 `writeGuard`。

2. 黏旧进程：看过、未发现。`evictClosedActor` 删除旧 driver/已结束 actor 后，按 receipt 的持久化事实重建；没有把 Receipt 所属旧 actor 身份作为匹配条件。新测试也未要求命中写 Receipt 的原始进程。

3. `await dead.done`：推理成立。`ensureActor` 在 `service.mjs:225` 已先注册 `actors.delete` 回调；`dead.done` 的 await continuation 后注册，因此会在该回调之后继续。且 `createHostSessionActor` 把底层失败转换为 fulfilled 的 `{ outcome: 'failed' }`（`host.mjs:143-155`），故不会因 `dead.done` reject 中断循环。

4. `drivers` Map：看过、未发现。JS Map 迭代中删除当前 entry 是安全的，迭代器会继续后续未访问 entry；本循环只删除，不新增 driver，因此不会漏掉后续 run。新建 driver 在第一轮结束后的 durable 循环中发生。

5. A2 外路径：看过、未发现本次牵连。`commitReceipt`、`stopDriver`、订阅 `attach/detach` 均保持原逻辑；本改动仅在已收到 `actor-closed` 后摘除缓存，不会提前摘活 actor。`detach` 仍由 `actor.done` 回调执行。

6. 新测试：A1、A3-1/A3-2/A3-3、B、C 的拒绝/Result/终态断言总体明确；A3-1 改为钉"拒绝且零 mutation"而非 `actor-closed` 文案，未见被放松成失去单写者防护。A2 存在上述 F-70-R1-01 的可观察性缺口。

7. 越界：`git diff --name-only 35ff2db..b6a3b47` 共 6 个文件，均落在 DevPlan 的 `dh:allowed-paths:v1 task=DHR_70` 允许路径内；`package.json` 仅追加新测试 token。当前工作树另有未提交的 `progress.md` 修改和本派单文件，均不属于指定基线 diff。

8. F-7003：仅静态核，无法确认实际测试输出。`identity-quota.test.mjs` 未在本卡 diff 中修改，生产实现改动也仅位于 submission 路由；施工方同时记录了 master/本卡隔离复核的比较逻辑，未见把本卡改动伪称基线失败的静态矛盾。但"master 有 9 条稳定失败、全量零新增失败"没有提交的原始 stdout，无法由本次只读静态审独立证实。

## 范围外观察

无。

---

## 主控裁决（不属复核者原文）

- **F-70-R1-01 (P2)：采纳并已整改**（提交 `8ed411d`）。A2 补三条断言：提交成功后 `host-lease.json` 的 `holder_pid === process.pid`、`epoch === held.epoch + 2`（外部接管是 +1，本 service 重取是 +2），且 `events.jsonl` 的 `lease_acquired` 序列**恰新增一条**该 epoch。`lease_acquired` 只由 `host.mjs:69` 在取到 lease 之后写，所以新增一条 = 真的新起了一届 actor。整改后定向套件 6/6 绿（E-7009）。
- 轮 1 **无 P0/P1**。第 3、4 两点是主控派单时自己也存疑的点，复核者独立查到 `host.mjs:143-155` 把底层失败转成 fulfilled `{outcome:'failed'}`，与主控自查结论一致。
- 第 8 点「无法独立证实全量结论」是**如实申报只读边界**，不是发现；F-7003 的原始 stdout 留在 E-7007，人验证据展示区会展示。
