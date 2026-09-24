# RLT-A-14 · 晋级复核（fresh）

复核对象：晋级提交 `94b763d`（`design/01` ← 用户整版确认候选稿 `drafts/A14/A14-候选.md` @ `e7c127d`，确认依据 `workspace/RLT_18/decisions.md` UD-7）。复核人 reviewer#a14promo，未参与候选稿与晋级提交。

## 结论

PASS。16 个改点（A-01~A-07、B-01~B-07、C-01~C-02）全部按候选稿「改后全文」逐字落入，`<晋级日期>` 三处均填 2026-09-24，无额外改动；晋级后文档自洽，晋级提交只触及 `design/01` 与 `drafts/A14/promotion-check.txt`。P1=0，P2=0。本结论只覆盖晋级批检查，不代表验收、verify 或后续合入闸。

## 逐项意见

| 编号 | 级别(P1/P2) | 位置（文件:行/节） | 问题 | 依据 | 整改动作 |
|---|---|---|---|---|---|
| — | — | — | 未发现晋级差异问题。 | 下列重构比对与一致性实测。 | — |

## 核验方法与结果（自跑脚本，不信自检文件）

### 1. 改点逐字落入 + 无额外改动（重构比对，最强口径）

不从 diff 正方向读，而从候选稿反方向重构：解析 `A14-候选.md`@e7c127d 全部 16 个改点的「改前原文 / 改后全文」代码块（含 C-02 四反引号嵌套围栏），在 `94b763d^` 的 design/01 上逐点校验「改前块唯一命中」后替换为「改后块」（B-01/B-05/B-06 的 `<晋级日期>`→`2026-09-24`；B-05 按稿内说明以 RLT-A-13 行首为锚、前插新段）。重构结果与 `94b763d` 的 design/01 **逐字节完全一致**——既证 16 点全落，也证零夹带。

- 派单写「17 个改点」，候选稿改点总表实为 16 行（A×7、B×7、C×2），与 `promotion-check.txt` 自报 16 一致；按实表 16 点核，全部 MATCH。此系派单措辞误差，非晋级缺陷。
- diff 统计佐证：design/01 共 +28/−11（11 处行替换 + 17 行纯插入），13 hunk，与 16 改点的插入/替换结构吻合。

### 2. 晋级日期、「用户已整版确认」、B-05 续行连接

- `<晋级日期>` 三处（B-01 标题、B-05 增补行、B-06 §11 总账）均填 `2026-09-24`，与晋级提交日期（2026-09-24 16:02 +0800）及 UD-7 确认日一致；全文无 `<晋级日期>` 残留。
- 「（用户已整版确认）」仅出现于 B-05 新增补行，措辞与候选稿改后全文逐字一致；UD-7 记录用户 2026-09-24 AskUserQuestion 点选确认，对象正是 `A14-候选.md`@e7c127d，措辞成立有依据。
- B-05 连接方式实测（design/01 L20–22）：L20 新增补段、L21 为裸 `>` 续行、L22 即原 `RLT-A-13 single-task 模式增补` 行——按稿「末行 `>` 续行与第 19 行连接、不另加空行」照抄，第 19 行及以下原样（该行同时是本 diff 未触碰的上下文行）。

### 3. 晋级后文档自洽（全部实跑 grep/计数）

- `dh:planning-event:v1` 恰 1 条且 `id=RLT-A-14`；`RLT-A-13` 只出现在历史索引表（B-04 新行）与 B-05/B-06 叙述中。
- `^\| HC-RL-[AH][0-9]+` 验收行 pre/post 均 159 条，ID 集合相等且无重复；逐 ID 比对仅 `HC-RL-H12` 一行变化（保号升契约 v2），`HC-RL-A82`/`A83`/`A101` 逐字节未动。
- `stage-stalled` 0 命中；`roles.toml` 十一个角色」句保留；「十二个角色」仅现于 L20（B-05 叙述）与 L124（§2 表头句，由 121 随 B-04/B-05 插入净下移 3 行，属预期移位）。
- 「20 分钟兜底」残留恰三处，均为候选稿「明确不改 / 有意保留」：L20（B-05 内 H12 v1 引文）、L492（§3.6 tick 节拍句）、L1369（A83 行）。
- evidence/14 可达：`design/evidence/14-交叉审核记录-RLT-A14-watch兜底watcher巡检.md` 存在，含 `<a id="review-rlt-a14">`（L13）、`<a id="understanding-rlt-a14">`（L59）及对应 `dh:planning-evidence:v1 event=RLT-A-14` 标记，与 B-02 声明的 review/understanding 路径逐字吻合。
- 候选稿核验要点 5（用词对齐）：design/01 L933 的 `[relay-light] watch-down stage <stage_id>` / `watch-down plan plan` 及「不做 watch 存活判定、不发任何 stall 提示」在两 adapter（`tools/relay-light/skill/references/adapter-claude-code.md`、`adapter-codex.md`）逐字存在。

### 4. 晋级提交范围

`git show --name-only 94b763d`：`design/01-RelayLight-产品设计与验收.md` 与 `design/drafts/A14/promotion-check.txt`，恰两文件。提交信息与 UD-7 口径一致（user-confirmed candidate @e7c127d）。

## 范围外发现

- 派单「17 个改点」与候选稿实表 16 行不符，已在 §1 说明；建议记账，不影响本批 PASS。
- `promotion-check.txt` §8 记录的 `?? workspace/RLT_18/evidence/ud3-u1/README.md` 为另一棒未跟踪文件，与本晋级无关（本复核只读旁观，未触碰）。
