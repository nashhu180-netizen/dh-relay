<!-- dh:v1 · review-brief — DHR_70 轮 1b 整改复验派单。主控写，复核者只读。 -->
# review-brief · DHR_70 · 轮 1b 整改复验

## 你是谁 / 不是谁

你是**复核 worker**，不是主控。只读、不改任何文件（codex `--sandbox read-only`）。
不要派活、不要回头问用户。先读仓根 `AGENTS.md`「编排协议段 → 复核 worker」。

你是 fresh 实例，**不继承轮 1 的会话**。轮 1 的结论已经落盘，你只读它、不假设它对。

## 背景（一句话）

轮 1（`dhr70rev1`）在本卡提出一条 P2：`relay-core/test/dhr70-submission-gate.test.mjs` 的 A2 用例只断言了"提交成功 + Result 唯一 + 重投幂等"，**没证明提交是经由新取的 lease 落地的**——一个绕开 lease 直接落盘的错误实现能让 A2 保持绿。施工方已整改。

- 轮 1 原文：`docs/modules/dh-relay/workspace/DHR_70/review-code1-codex.md`
- **整改增量 diff：`git diff b6a3b47..8ed411d`**（这是你的主战场）
- 全卡基线（背景，不用重审）：`git diff 35ff2db..8ed411d`

## 你要判什么

按 P0/P1/P2/P3 定级，无发现也要明说。

1. **F-70-R1-01 闭没闭**。整改加的三条断言（`holder_pid === process.pid`、`epoch === held.epoch + 2`、`lease_acquired` 序列恰新增一条），**真的能挡住轮 1 描述的那个失效场景吗**？请具体推演：如果实现改成"绕开 lease、直接往 Store 落盘"，这三条里哪一条会红、为什么？如果三条都挡不住，说明整改是装饰性的，请直说。
2. **`epoch === held.epoch + 2` 会不会太脆**。这是精确等值断言。请核 `relay-core/runtime/lease.mjs` 的 epoch 递增语义与 `renew()` 是否改 epoch，判断：
   - 正常路径下 epoch 是不是**必然**恰好 +2？有没有可能合法地变成 +3（比如中途多取了一次 lease）而让用例假红？
   - 反过来，会不会有实现缺陷路径也恰好产出 +2 而让它假绿？
3. **`leaseEpochs` 这个新 helper 有没有解析坑**。它按 `event.kind === 'lease_acquired'` 过滤、拿 `detail` 按 `:` 切第二段转 Number。核 `host.mjs:69` 写入的 detail 形态，判断解析是否稳、`NaN` 会不会被静默吞掉。
4. **整改有没有引入新问题**。这是硬条：轮 1 的修复本身若产生了上一轮不存在的 open 问题（无论 P 级），必须点出来。特别核：新断言会不会让 A2 在**慢机 / 高并发**下不稳（`until` 轮询期间会不会多取一次 lease）。
5. **越界**：`git diff --name-only b6a3b47..8ed411d` 是否仍在 DevPlan `dh:allowed-paths:v1 task=DHR_70` 内。
6. **轮 1 的其余 7 点结论，你独立复核后同不同意**。不要求重做，但如果你发现轮 1 某条判错了（尤其第 1 点"单写者未放宽"和第 3 点"`await dead.done` 推理成立"），必须指出。

## 硬边界

- 只读。跑不了测试就如实申报「仅静态审」。
- 只写事实与级别，不替主控做验收裁决。
- 密钥/凭据值永不出现在结论里。

## 产出格式

完整结论输出到 stdout（主控会落盘为 `review-code1-reverify-codex.md`）：

```
## 形态自述
## F-70-R1-01 闭合判定（闭合 / 未闭合 / 部分，附推演）
## 发现（新问题，含"整改引入的新问题"）
## 逐点结论（上面 6 点）
## 对轮 1 其余结论的独立意见
```
