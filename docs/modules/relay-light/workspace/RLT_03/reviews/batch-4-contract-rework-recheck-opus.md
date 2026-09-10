<!-- dh:v1 -->
# RLT_03 · Batch 4 contract-rework=RLT-B-04 rework=1 定向复核（fresh Opus，独立只读）

## VERDICT

**VERDICT=APPROVE**

| 级别 | open 数量 |
|---|---:|
| P0 | 0 |
| P1 | 0 |
| P2 | 0 |
| P3 | 4（沿用首审登记，均不阻塞） |

首审 `reviews/batch-4-contract-rework-opus.md` 的两项 P2 已**按指定原文闭合**，且闭合方式与首审要求逐字对应；生产与测试文件 SHA-256 与首审基线**完全一致**（零代码改动），`git diff --check` exit 0，允许路径无越界。本轮为定向复核，未重复全量行为审核。

---

## 复核基线与只读证明

- 分支 `wt/RLT_03`，HEAD `baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b`，`git diff --name-only master...HEAD` 为空（未 commit）。
- 生产/测试 SHA-256 与首审报告记录的基线**逐字节一致**：
  - `tools/relay-light/relay_log.py` = `e62ba2a073b1008b7a6da21506c9de4baad80f1e7e045d5454612bd14637ee8d` ✅（与首审记录相同）
  - `tools/relay-light/test_relay_log.py` = `1fbf726d3df31a3e898e6833729a550ad681ca5845cf4f236ac57a79dd93ba16` ✅（与首审记录相同）
  - 即 rework=1 **确为零代码改动**，与 E-046「documentation-only」自述一致；无须重跑 53 tests 即可判定行为面不变（首审 §3.1~§3.5 建立的红绿与静态结论原样继承）。
- `git diff --check` → exit 0 ✅。
- `git status --short` 与首审时一致：仅入场既有的 `M design/01`、`M P1-开发方案`（主控 RLT-A-04/RLT-B-04 WIP）+ 未跟踪 `design/drafts/A04-*`、`design/evidence/05-*`、`dev_plan/drafts/RLT-B-04-*`、`workspace/RLT_03/`、`tools/relay-light/`。
- 本轮 rework 的写入面（按 mtime 核，首审报告落盘时刻 16:10:28 为界）**只有两个文件**：`findings.md`（16:12:43）、`progress.md`（16:13:23）。`brief.md`、`task_plan.md`、`execution_strategy.md`、`review.md`、`lesson_candidates.md`、既有 reviews、两个 py 文件、design/01、DevPlan **均未在首审后被触碰** ✅ —— 与首审要求「两项均不涉及生产代码或测试」精确吻合。
- `tools/relay-light/` 目录仍仅两个 py 文件，无 `__pycache__`、无临时文件（A39 静态面保持）✅。
- 本 reviewer 未改任何已有文件；唯一持久写入为本报告。未 commit、未 verify、未改 DevPlan 状态列、未整改、未启动下一节点。

---

## P2-1 复核 — `findings.md` F-003 活动口径退役号

**✅ 已闭合。**

现行 `findings.md:11`（F-003，status 仍为 `open`，正确保留）：

- **问题列**：已改写为「A116/A89/A120 分别属 RLT_05/RLT_05/RLT_09，不能在 RLT_03 静默提前实现；现行冲突口径：design/01 §3.5（lint 映射表 A129 行，约 :409）含 §4.5「追加行落在表尾不算违规」豁免，而 §11（A129 取证行，约 :1132）不含该豁免——design §3.5 与 §11 对 A129 是否包含 §4.5 表尾豁免存在文本分歧」。
- **处理列**：「已移除 A116、A89 与 A120 特判；**本卡按 §11 严格执行 A129**（隔断即拒，含同 stage 表尾追加）；放宽归 RLT_09/A120，RLT_09 必须显式处理/反转该表尾用例后才可实现其放宽」。
- **证据列**：已追加 `batch-4-contract-rework-opus P2-1` 溯源。

逐条对照首审要求：`A86` → `A129` ✅；冲突重述为「§3.5(:409) 含豁免 / §11(:1132) 不含 → 本卡按 §11 严格执行、放宽归 RLT_09/A120」✅；仅改 `findings.md`、未动代码 ✅。

**独立核对首审所引 design 行号仍成立**（本轮实读，非转引）：

```text
design/01:409  | 同一阶段的节点未按 stage 分组连续（忽略 superseded 行；§4.5 的追加行落在表尾不算违规） | HC-RL-A129 |
design/01:1132 | HC-RL-A129 | …同一阶段的节点按 stage 分组连续（忽略 superseded 行） | 单测：非法 stage 值、同 stage 节点被另一 stage 隔断各一例被拒…断言规则编号 A129 |
```

§3.5 带表尾豁免、§11 不带——F-003 新措辞对正式 design 的描述**属实**，非改写事实 ✅。

**退役号活动残留全仓复扫**：

```text
grep -nE "A64|A86|A88|A90|A73"  tools/relay-light/relay_log.py       → 0 hit ✅
grep -nE "A64|A86|A88|A90|A73"  tools/relay-light/test_relay_log.py  → 0 hit ✅
findings.md 命中 7 行：F-004 / F-029 / F-030 / F-031 / F-032 / F-033 / F-036——全部 status=resolved 的历史叙述留痕
progress.md 命中：日志行与 E-006/E-007/E-031/E-035/E-036/E-044/E-045/E-046 历史证据行；
              收口句(:100)内的 A73 出现在「非本卡 owner 边界（…A73…归 RLT_05）」，是正确的 owner 归属陈述而非活动实现口径
```

**唯一的 open + 活动口径残留（F-003）已消除**；保留项全部属首审 P3-3 明确要求「按原样保留、不做修正」的历史留痕，rework 未越权改写历史 ✅。

---

## P2-2 复核 — `progress.md` 矩阵收口句对 A128 的限定

**✅ 已闭合。**

现行 `progress.md:100` 收口句：

> RLT_03-owned 42 个 HC-ID：… A126 A128 A129 A130。上表 16 组 brief 条件已与 42 个 ID 全部对应并闭合（E-044/E-045：先红后绿、53 tests OK）：矩阵无退役编号、**无 blocker**。**A128 限定：四个封闭例外中 A46/A72/A75 已逐项取证并闭合；第四例外 A120（表尾/隔断放宽）按 RLT-B-04 归 RLT_09——其中「被 superseded 行隔开通过」当前已成立，「同 stage 追加在表尾通过」当前按 A129 §11 严格拒绝，须由 RLT_09 显式反转（见 F-003）。** 非本卡 owner 的边界：完整 status 生命周期（A61/A62/A73/A85/A89/A92）归 RLT_05，五阶段模板（A127）归 RLT_07，运行中改计划（A120）归 RLT_09——三者在生产代码与测试均未实现。

逐条对照首审要求：

| 首审要求 | 现状 | 判定 |
|---|---|---|
| 去掉无限定的「无 partial」宣称 | 原「矩阵无退役编号、无 partial、无 blocker」已改为「矩阵无退役编号、无 blocker」 | ✅ |
| A46/A72/A75 三例外「已逐项取证并闭合」 | 原文照录，且矩阵第 4 行（`:88`）与第 5 行仍逐项列出对应测试名 | ✅ |
| A120 表尾/隔断放宽归 RLT_09 | 原文照录，并与 §6 owner 表 `:566` 行的 A120→RLT_09 一致 | ✅ |
| 「superseded 隔开通过」已成立 / 「表尾追加通过」当前按 §11 拒绝 | 原文照录，且明写「须由 RLT_09 显式反转（见 F-003）」，与 F-003 双向互指 | ✅ |
| 仅改 `progress.md`、不动代码 | py 文件 SHA 不变 | ✅ |

首审对该实测结论（A120 表尾追加当前 `rc=2 HC-RL-A129`）已做过真 CLI 取证，本轮按定向复核范围不重复该行为验证；SHA 未变意味着该实测结论继续成立。

---

## 新增证据行 E-046 复核

`progress.md:77` 新增 E-046（`P2 closure / documentation-only`）：手段为 `git diff --check` + 定向 grep + `git status --short`，结论为「两项按指定闭合、零代码改动」。

- **口径诚实** ✅：明写「本批零代码改动，无红绿重跑必要（Opus 建议的 53 tests 复跑留给主控/下轮按需执行）」——**没有**把未执行的复跑写成已执行，也**没有**把文档改动包装成行为证据。首审对 53 tests 复跑的措辞是「建议」而非要求，本轮以 SHA 逐字节一致直接替代该建议的证明目的。
- 对应日志行 `progress.md:26` 记 `CONSTRUCTION_DONE batch=4 contract-rework=RLT-B-04 rework=1`，Node Signal 段（文件末）同为 `CONSTRUCTION_DONE batch=4 contract-rework=RLT-B-04 rework=1` ✅，与本轮 rework 序号一致、未复用施工旧信号。

---

## 矩阵 / owner 一致性抽核（机械核算，非目视）

尽管本轮为定向复核，仍对首审 §4.1/§4.2 的三方集合做了一次独立脚本重算，确认 rework 未破坏已闭合的一致性：

| 来源 | 数量 | 结果 |
|---|---:|---|
| DevPlan §3.2 RLT_03 卡（`:137` 起）内 `HC-RL-A*` 去重 | 42 | 基准 |
| `progress.md` 收口句 42 ID 列表 | 42 | 与卡**双向差集皆空** ✅ |
| DevPlan §6 中 owner=RLT_03 的 ID | 42 | 与卡**双向差集皆空** ✅ |

- §6 全表 107 个 A 号，**无重复 owner**（Counter dups=∅）✅。
- 退役号 `A64/A86/A88/A90` 在 §6 **零 owner** ✅。
- 关键 owner 现读复核：`A126→RLT_03`(:539)、`A128→RLT_03`(:550)、`A129→RLT_03`(:551)、`A130→RLT_03`(:569)、`A73→RLT_05`(:543)、`A120→RLT_09`(:566)、`A127→RLT_07`(:549)、`A92→RLT_05`(:552)、`A62→RLT_05`(:538) —— 与 F-003 / 收口句 / 首审结论**逐条吻合** ✅。
- §11 取证方法现读复核：`:1129` A128（四例外含 A120）、`:1132` A129、`:1150` A126、`:1156` A130，与生产落点语义一致 ✅。

---

## P3（沿用首审登记，本轮无新增、无升级）

- **P3-1** · `relay_log.py:748` 空账本 pending 注释仍并列 A61/A62（F-023 要求的 RLT_05 占位声明）与 `:751` 的 A128/A84。SHA 未变故原样保留，判定不变：**不违约，无需本轮处理**。
- **P3-2** · `tools/relay-light/` 全程未跟踪，无基线可字节 diff。**本轮此项部分缓解**：首审已记录两文件 SHA-256，本轮据此完成了逐字节一致性判定——这正是首审建议的「每批在 progress 登记 SHA-256」的效果。建议主控在收口暂存时把该做法固化（与 F-008 同属收口时需主控精确处理项）。
- **P3-3** · `findings.md` F-004/F-029（及 F-030~F-033/F-036、progress 历史证据行）保留退役号，均为 resolved 的当时事实留痕。**本轮确认 rework 未改写这些历史行** ✅，符合留痕原则。
- **P3-4** · 既有 open findings（F-003 保持 open、F-007/F-008/F-010/F-016/F-017/F-024）未受本轮影响，窄返工边界保持 ✅。

---

## 收口结论

- 首审 **P2-1（F-003 活动口径退役号）与 P2-2（矩阵 A128 无限定闭合宣称）均已按指定原文完整闭合**，且经独立回读正式 `design/01` §3.5(:409)/§11(:1132) 与 DevPlan §6 owner 表确认新措辞**与正式合同一致**，不是为过审而编造的说法。
- **rework=1 为严格 documentation-only**：两个 py 文件 SHA-256 与首审基线逐字节相同，`git diff --check` exit 0，写入面仅 `findings.md` + `progress.md`，允许路径无越界，历史留痕未被改写，Node Signal 序号正确。
- 首审已判定的交付实质（四条编号迁移完整正确、A73 完全留给 RLT_05、53 tests 绿 + 5 处编号失配红可判别、前三批行为闸无回归、42-ID 三方集合精确相等）在 SHA 不变前提下**原样继承成立**。
- 本报告只写事实与级别，不做验收裁决、不整改、不启动下一节点。

**VERDICT=APPROVE**（P0=0 · P1=0 · P2=0 · P3=4 登记备查）

REVIEW_DONE batch=4 contract-rework=RLT-B-04 rework=1
