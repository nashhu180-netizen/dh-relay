<!-- dh:v1 · review-brief — DHR_71 教训复核派单（light 配方两路之一）。主控写，复核者只读。 -->
# review-brief · DHR_71 · 教训复核

## 你是谁 / 不是谁

你是**复核 worker**，不是主控。只读、不改任何文件（codex `--sandbox read-only`）。不要派活、不要回头问用户。先读仓根 `AGENTS.md`「编排协议段 → 复核 worker」。

## 库的现状

- **正册 `docs/modules/dh-relay/knowledge/教训库.md` 不存在**——本仓只有候选库。按 dev-harness 口径，正册不存在时本路结论是 **`N/A（可核查）`**，不拉 Pair、不要求 Binding。
- 候选库：`docs/modules/dh-relay/knowledge/教训库-候选.md`，当前 68 条（候选-1 ~ 候选-68）。
- **`N/A` 不等于不用干活**：你仍要扫候选库，找出与本卡改动**触发场景匹配**的条目，逐条判断本卡有没有重蹈。

## 你要审什么

cwd = worktree `.dh-worktrees/DHR_71`，HEAD = `ecdc941`，基线 = `master@25d697d`，diff = `git diff master...HEAD`。

本卡干了什么（一句话）：**只改测试**——给 Herdr 定向回归五文件做有界等待（新 `relay-core/test/helpers/bounded-wait.mjs`：`untilEvent` / `withDeadline` / `dumpDriverScene`），`agent-node.test.mjs` 三条用例 + `herdr-adapter.test.mjs` 两条用例体 + `dhr69-false-ready.test.mjs` 一条用例体换等待并把 `driver.stop()` 放进 `try/finally`；按 B-36 冻结清单 skip 恰 4 条语义陈旧用例（S1~S4）；定位 652s 挂死（`rm` 撞 driver 正在写的 tmp 永不返回）。三轮绿闸 55/51/4/0。生产代码零改动。

**必读**：
- `docs/modules/dh-relay/workspace/DHR_71/brief.md`（完成条件、边界、B-36 同步段）
- `docs/modules/dh-relay/workspace/DHR_71/task_plan.md`（主控预写的施工说明书——注意第 4 步①主控给的 652s 第一嫌疑后来被 worker 负例证伪）
- `docs/modules/dh-relay/workspace/DHR_71/progress.md`（证据账本 E-71xx、上限推导、652s 归因）
- `docs/modules/dh-relay/workspace/DHR_71/findings.md`（F-7101~F-7107）
- `docs/modules/dh-relay/workspace/DHR_71/construction.DONE`
- `docs/modules/dh-relay/workspace/DHR_71/lesson_candidates.md`（本卡新记 L-7101~L-7107）
- `docs/modules/dh-relay/workspace/DHR_71/evidence/hang-repro-20260902T0338Z.txt`、`gate-round{1,2,3}-20260902T0525Z.txt`
- `docs/modules/dh-relay/design/evidence/36-DHR71隔离清单与绿闸范围校正-B调整交叉审核记录.md`（B-36 三轮审核账）

## 逐条要你给结论的点

1. **候选库命中扫描**。按本卡的改动性质（异步等待 / 测试收尾顺序 / 上限推导 / skip 记账 / 证据脱敏 / 派活与主控假设）扫全部 68 条候选，列出**命中清单**，命中的逐条深读原文判断本卡**有没有重蹈**。主控已知形态接近的至少有：候选-31（"全量绿"要带并发条件）、候选-35（等不变量不等期望值）、候选-48（环境假红是要证明的结论）、候选-51（挂死≠失败、常驻轮询要注册停止钩子）、候选-58（异步测试 timeout 必须有界）、候选-64~67（派活三事实闭环 / 基线别写死）、候选-68（放行包终态证据要在最终提交上重取）。**这些是主控点的名，不是全集。**
2. **本卡最像重蹈的地方，请重点验**：
   - 主控在 task_plan 第 4 步①把「缺 `t.after(stop)`」写成 652s 挂死的第一嫌疑并要求 worker 先补上；worker 的负例（`hang-repro` A/B 组）证明补了也照样挂。主控这个"先给嫌疑再让人证"的做法，有没有命中候选-26 / 候选-48 一类「裁决方的假设也是待审对象」的教训？worker 的处理（证伪后不删改动、如实登记）对不对？
   - `:510` 首轮保留 45s 的理由是「在生产 60s 之内还有余量」，方向反了，被 B-36 第一轮审核抓出（R1-04）。这是不是候选库里已有的教训形态？若不是，L-7106 是否把它讲准了？
   - `dumpDriverScene` 初版把 `fake.sent` 原样打进超限输出（含 Receipt ID 形态），worker 自己发现后改成打印时脱敏（L-7104）。对照 DHR_35 的 F-3521 教训与 design/12 §2——这次是"打印前脱敏"还是"事后扫描"？
   - 三轮绿闸都跑在同一台机、同一负载状态下；「每次跑都一个结果」的结论有没有带并发/负载条件（候选-31）？
3. **本卡新记的七条教训候选（L-7101~L-7107）质量核**。逐条判断：是不是真教训（可复用、有触发场景）还是流水账；与 68 条候选**有没有重复**（重复的指出编号）；L-7103「超时是表象不是归类」与 L-7106「上限方向别搞反」是否可合并。
4. **有没有该记而没记的教训**。特别看：B-36 事件本身（主控把两条语义红当时序红、把两条不同调用链当同一条并共用公式，各被一轮审核抓出）——这两次主控失守是否值得成为一条候选，还是已被候选-12 / 候选-14 / 候选-33 覆盖？

## 硬边界

- 只读。跑不了测试就如实申报「仅静态审」。
- 只写事实与级别，不替主控做验收裁决，不替人裁决候选条目的升册。
- 密钥 / 凭据值 / 原 Receipt ID 永不出现在结论里。

## 产出格式

完整结论输出到 stdout（主控会落盘为 `review-lessons-codex.md`）：

```
## 形态自述（模型 / 沙盒 / HEAD / 是否能跑测试）
## 正册状态结论（N/A 可核查 的依据）
## 候选库命中清单（扫了多少条、命中哪几条、逐条重蹈判定）
## 发现
### F-71-LES-01 (P?) 标题
## 本卡 L-7101~L-7107 质量核（逐条）
## 该记而未记的
```
