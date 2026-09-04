<!-- dh:v1 · review-brief — DHR_74 代码复核轮 1 · 窄复核（只审整改面与新证据）。主控写，复核者只读。 -->
# review-brief · DHR_74 · 代码轮 1 窄复核（reverify）

## 你是谁 / 不是谁

只读复核 worker（codex `--sandbox read-only`），不是主控。不派活、不起子任务、不回头问用户。
先读仓根 `AGENTS.md`「编排协议段 → 复核 worker」。

**这是窄复核**：轮 1 的六条发现（F-74-R1-01~06）主控已全部采纳，整改已落。你只审**整改是否真的闭合**、以及**整改期间有没有新引入问题**，不重审已闭合的部分。

## 前情（读这几份就够）

| 读什么 | 是什么 |
|---|---|
| `workspace/DHR_74/review-code1-codex.md` | 轮 1 原文（你的前任，六条发现） |
| `workspace/DHR_74/review.md` | 主控裁决 + 整改清单 A~F |
| `workspace/DHR_74/remediation-brief-r1.md` | 整改派单 |
| `workspace/DHR_74/remediation1.DONE` | 整改者的收口自述 |
| `dev_plan/P6-...md` §3.2 `DHR_74` | 修订后的时间参数授权（**口径已变，别按旧文字审**） |

## 审查范围（cwd 已是 `wt/DHR_74`）

**本分支已重建**：从 `master`（已含 DHR_71 收口 squash `84f2514`）起新枝，只挑本卡 10 笔提交，**原来那个合并 `wt/DHR_71` 的提交 `22dc16c` 已丢弃**（旧形态备份在 ref `keep/dhr74-pre-rebase-260903`）。

- 整改面：`git diff` 覆盖 `541e695`（整改主提交）+ `fe2de18`（主控补回被压缩丢失的移交项）
- 新证据：`98f2585`（E-7409 独立基线三轮）
- 全卡改动面：`git diff master..HEAD`

## 逐条要你给结论的点

按 P0/P1/P2/P3 定级，说清在哪一行、什么输入下会怎样错。没问题也明说「看过、没发现」。

1. **F-74-R1-01 是否真闭合**。旧问题：「12 行 ×10 等比」与实际不符。现在 DevPlan 授权已改成「`herdrPollMs` 统一抬到 **20ms 绝对值**；配对超时**只在语义是等满 N 次 poll 时**同比例放大，墙钟上限保持不变；依赖 poll 推导的注释与常量随之更新」。请**逐行核**五个门禁文件的时间参数是否全部符合新口径（含 rebase 后重解冲突的两处：`agent-node` 两处 5→20、`herdr-adapter` 一处 `doneTimeoutMs: 10, herdrPollMs: 2` → `100/20`），以及自述（progress / findings / DONE / brief）是否还残留旧的「×10 等比」说法。
2. **冲突重解有没有丢东西**。分支重建时 `b9619c3` 在 master（已含 DHR_71 的 `finally` 结构与 S1 skip）上重放并冲突，主控的解法是「保留 master 侧结构，只把 poll 数值换成本卡的 20」。请核这三处解得对不对：DHR_71 的 `try/finally`、`dumpDriverScene`、`untilEvent` 有界等待、S1 的 `skip` 标记是否**原样保留**；有没有把 DHR_71 的东西改掉或把本卡的东西丢掉。`git diff master..HEAD -- relay-core/` 应当**只**剩本卡的 12 行时间参数 + 探针三件套 + README。
3. **F-74-R1-05 是否真闭合**。`herdr-adapter.test.mjs` 的 `BLOCKED_FIVE_POLLS_BUDGET_MS` 现在是 75_150 且注释按 poll=20 重推。请核算式与实际夹具值一致，且这处**只动了注释与常量**。
4. **F-74-R1-04 / R1-03 的降级是否到位又没过头**。README 新增的「覆盖边界」四条、findings 里 F-7402 的「未观测清单」——请判断：① 这些边界陈述**准确**吗（去核 `fs-probe-shim.mjs` 实际包了哪些 op、`store.mjs` 用的是哪套 API）；② 有没有**降过头**，把已经成立的事实也说成不确定（例如「已排除优先级单因子」是有 6 轮对照撑着的，不该被抹掉）。
5. **F-74-R1-06 是否真闭合**。E-7408 账本占位是否填实、且明确标注为**组合分支过程证据**（不是验收证据）。
6. **新证据 E-7409 是否站得住**（本轮新增，重点）。主控在重建后的独立基线上跑了三轮：`51 pass / 4 skip / 0 fail`、284.2–285.5s、四类签名零命中、三轮 skip 摘要一致。请核：
   - 原始 `evidence/ownbase-gate-round{1,2,3}-*.txt|.junit.xml` 的数字与 progress 的转述**是否逐条对得上**；
   - `evidence/ownbase-signature-scan-20260903.md` 的命令与判据**是否可复核**（含"空扫自证"那一步够不够证明扫描真的覆盖到文件）；
   - 三轮 skip 用 md5 摘要比对是否足以支撑「同一批 S1~S4」，还是需要逐名列出；
   - 这三轮跑在「主控 session 在跑、零并发 worker」的条件下，条件措辞写得够不够。
7. **横比结论是否诚实**。progress 写：DHR_71 基线（不含本卡时间参数）285–289s vs 本卡基线 284–285s，差异 ≈1%，故「时间参数改动对绿闸达标的必要性未证」。请判断这个推理成立吗？有没有**反过来低估**了本卡的贡献（放大侧 fs 写 56,775→17,650 是实打实的）？措辞该更强还是更弱？
8. **有效单测要求（normal）**。轮 1 你的前任判「未满足」，理由是缺一个能防回归的机械检查（例如「同一 options 里 poll 与配对超时的比例一致性」守卫）。整改**没有**加这类守卫（派单未要求）。请给最终结论：本卡该判满足 / 不适用 / 未满足，以及若判未满足，缺的那条守卫**是否值得单独立卡**（本卡允许路径不含新增用例）。
9. **越界**：`git diff --name-only master..HEAD` 逐条对 DevPlan `dh:allowed-paths:v1 task=DHR_74`（注意授权已修订）。特别核有没有碰 `store/**`、`runtime/**`、`contracts/**`、`package.json`、`fake-herdr.mjs`、`workspace/DHR_71/**`，以及断言零改动。

## 硬边界

只读、仅静态审（跑不了测试就如实申报）；只写事实与级别，不做验收裁决；范围外想法写「范围外观察」；密钥 / 凭据 / 原始 Receipt ID 零出现。

## 产出

完整结论到 stdout（主控落盘为 `review-code1-reverify-codex.md`），结构同轮 1：形态自述 / 发现（`F-74-R1B-NN`）/ 逐点结论（上面 9 点）/ 范围外观察。开工前自报你看到的 git HEAD。
