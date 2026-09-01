<!-- dh:v1 · review-brief — DHR_70 教训复核派单。主控写，复核者只读。 -->
# review-brief · DHR_70 · 教训复核

## 你是谁 / 不是谁

你是**复核 worker**，不是主控。只读、不改任何文件（codex `--sandbox read-only`）。
不要派活、不要回头问用户。先读仓根 `AGENTS.md`「编排协议段 → 复核 worker」。

## 库的现状（先记住，影响你的结论形态）

- **正册 `docs/modules/dh-relay/knowledge/教训库.md` 不存在**——本仓只有候选库。按 dev-harness 口径，正册不存在时本路结论是 **`N/A（可核查）`**，不拉 Pair、不要求 Binding。
- 候选库：`docs/modules/dh-relay/knowledge/教训库-候选.md`，当前 58 条（候选-1 ~ 候选-58）。
- **`N/A` 不等于你不用干活**：你仍要扫候选库，找出与本卡改动**触发场景匹配**的条目，逐条判断本卡有没有重蹈。这才是本路的实际产出。

## 你要审什么

cwd = worktree，HEAD = `b6a3b47`，基线 diff = `git diff 35ff2db..b6a3b47`。

本卡干了什么（一句话）：`relay-core/runtime/service.mjs` 的 `submitExecutorResult` 首轮 drivers 循环里，捕获 `E_LEASE_HELD:actor-closed`、摘掉这一届 driver 与已关闭的 actor、`continue` 到既有 durable 重建路径。外加一个新建的 6 用例定向测试套件 `relay-core/test/dhr70-submission-gate.test.mjs`、`package.json` 追加一个 token。

**必读**：
- `docs/modules/dh-relay/workspace/DHR_70/brief.md`（完成条件与红线）
- `docs/modules/dh-relay/workspace/DHR_70/progress.md`（证据账本 E-7002~E-7008）
- `docs/modules/dh-relay/workspace/DHR_70/findings.md`（F-7001/F-7002/F-7003）
- `docs/modules/dh-relay/workspace/DHR_70/lesson_candidates.md`（本卡新记的 L-7001~L-7004）

## 逐条要你给结论的点

1. **候选库命中扫描**。按本卡的改动性质（异步生命周期 / 并发锁 / 测试有效性 / 基线对齐 / 负例判据）扫全部 58 条候选，列出**命中清单**（哪几条与本卡触发场景匹配）。命中的逐条深读原文，判断本卡**有没有重蹈**。
   - 主控已知与本卡形态接近的至少有：候选-48（"环境假红"是要证明的结论、单次绿会把真抖动盖过）、候选-49（变异证据必须以最终提交为基线）、候选-51（挂死≠失败、常驻轮询 fixture 要注册停止钩子）、候选-56（validator 负例通过 ≠ runtime consumer 已闭合，消费点要用实现级 mutation 证明）、候选-58（新增异步测试要过 runner 拾取与终态屏障两道门、外部探测 timeout 必须有界）。**这几条是主控点的名，不是全集——你要自己扫全库，别只核这五条。**
2. **本卡最像重蹈的地方，请重点验**：
   - `progress.md` E-7007 声称"全量里那两条『新』红都是并发抖动"，判据是**隔离单跑绿**。这正是候选-48 警告的形态吗？"隔离单跑一次绿"够不够证明抖动？
   - 新测试套件里的 fixture 起了常驻 `runHostSession`（5s tick 轮询）。有没有注册停止钩子？会不会挂死而不是失败（候选-51）？套件门槛有没有记 exit code + wall-clock？
   - A2 用例耗时 5~6s 是"等 5s tick"。这个等待有没有**有界 timeout**，还是可能无限等（候选-58）？
3. **本卡新记的四条教训候选（L-7001~L-7004）质量核**。逐条判断：
   - 是不是**真教训**（可复用、有触发场景），还是流水账？
   - 与候选库现有 58 条**有没有重复**？重复的要指出对应候选编号。
   - L-7003（负例断言只钉"该不该拒"、别钉措辞）——这条是施工方自己踩的坑，请核它的表述是否准确、有没有把"我把判据写松了"包装成"判据本该更松"。这是本路唯一带审计意味的一问。
4. **有没有该记而没记的教训**。看完 diff 与 progress，本卡还有什么坑值得进候选库但施工方漏了？

## 硬边界

- 只读。跑不了测试就如实申报「仅静态审」。
- 只写事实与级别，不替主控做验收裁决，不替人裁决候选条目的升册。
- 密钥/凭据值永不出现在结论里。

## 产出格式

完整结论输出到 stdout（主控会落盘为 `review-lessons-codex.md`）：

```
## 形态自述
## 正册状态结论（N/A 可核查 的依据）
## 候选库命中清单（扫了多少条、命中哪几条、逐条重蹈判定）
## 发现
### F-70-LES-01 (P?) 标题
## 本卡 L-7001~L-7004 质量核（逐条）
## 该记而未记的
```
