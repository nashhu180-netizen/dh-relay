# lesson 复核 — RLT_08

- **身份**：rlt08-review2（fresh 复核实例，未参与本卡施工/计划/小审），复核路 `lesson`（normal Recipe 三路之一）
- **模型自报**：Devin CLI / SWE-2 Max
- **日期**：2026-09-13
- **输入清单**：`dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`lesson_candidates.md`、`review.plan.md`（plan-review 三轮全录）、`check.C1.md`、`dispatch/exec.md`、`git log master..HEAD`（21 笔）、`git diff master -- AGENTS.md`（整卡 diff）、`docs/modules/dh-relay/knowledge/教训库-候选.md`（候选-1～73，本卡 fallback 源）与 `主控派活备忘-20260902.md`、`reviews/code-round1-rlt08-review.md`
- **方法**：只读复核。教训库定位：`docs/modules/relay-light/knowledge/` 不存在 → 按 review brief fallback 至 `docs/modules/dh-relay/knowledge/教训库-候选.md`；仓内无 `教训库.md` 正册，候选区即全部教训载体。判定句/标头由本复核者自行 `rg -F` / `sed` 抽取复跑。

## 一、相关既有教训条目：被遵守 or 重犯

> 筛选口径：与「AGENTS 常驻合同改动 / 双入口漂移 / 判定句可 grep」及本卡过程（派活合同、逐字 oracle、记账信号）相关的候选条目。

| 条目 | 相关性 | 本卡事实 | 判定 |
|---|---|---|---|
| 候选-4（派活前机械核 brief/task_plan 引用与合同目标存在） | 派活合同 | W 阶段 plan-review 在 exec 派出**之前**跑满三轮，首轮逮 P1-1（task_plan 与 `dispatch/exec.md` 对 B3 完成信号顺序给出冲突合同）、次轮逮 P1-4（exec.md 缺 AGENTS 铁律 7 要求的进场第一动作 rebase），全部闭合后才放施工 | **遵守**——这道闸真实存在且起效 |
| 候选-14（声称与上游一致须读源文件逐字段核） | AGENTS 常驻合同 / 判定句 | AGENTS L44 内嵌标头字面量经 sed 抽取与两份 `adapter-*.md` ```text``` 块首行逐字节相等（本复核者复跑，`adapter_count=2`）；判定句与 design §11 A34 oracle 逐字 | **遵守** |
| 候选-37（文本锚定断言对全文做正则会假绿，须限定范围） | 判定句可 grep | task_plan 初稿对 `tools/relay-light/skill/SKILL.md` 用全文件 `rg -F`，plan-review P1-2 逮住后改为 `awk` 截取阅读矩阵小节 + `count -eq 1` | **初稿曾踩同族坑，被 plan-review 拦下**，交付态遵守 |
| 候选-42（同卡多份合同/段落须互查，逐级复制漏项零红灯） | 双入口漂移 | P1-1/P1-4 正是该族新形态：同一 worker 的同一动作被 exec brief 与 task_plan/仓根铁律两份合同分别规定且不一致；由 plan-review 跨文档核对逮出 | **经闸遵守**，且产生新素材（见二.1） |
| 候选-65（派单不写死基线 commit，复核者自报 HEAD） | 复核派单 | `dispatch/review.md` 输入写「`git diff master -- AGENTS.md`（整卡 diff）」无写死区间；code-round1 自报基线 `851433c` 与 commit 数 | **遵守** |
| 候选-10（纠错 append + 不偷改历史信号） | B1 记账返工 | check.C1 整改要求「不要改写历史信号」；exec 保留首条 `red:/green:` 信号原样、追加更正 E-ID 信号 | **遵守** |
| 候选-13（写下教训≠生效，须当场转成可勾选检查） | 判定句可 grep | LC-2 在 B2 现场登记「`-F` 锁定句禁加反引号」；交付的 AGENTS L44 判定句裸文本无反引号，同卡内即被遵守 | **遵守** |
| 候选-36（机器证须跑验收口径点名的真产物） | AGENTS 合同改动 | 红绿/整卡机检均以真实 `AGENTS.md`、真 adapter、`dh relay-light` 实跑、真 dev-harness 仓为输入 | **遵守** |
| 候选-49/68（终态证据以最终提交为基线） | 记账 | E-013/E-014 整卡机检与四集合闭集在 `f3af14e` 落账后取 | **遵守** |
| 候选-52（派活层事故不落任何工件） | 本卡过程 | plan-review 三轮、B1 返工均有 progress 信号 + `review.plan.md`/`check.C1.md` 工件留痕——**事实落了账**；但可复用规则的抽取（lesson_candidates）未做，见二 | **部分遵守**——记录层满足，教训抽取层缺口 |

**双入口漂移专项**：`CLAUDE.md` 未改动，仍是「不复制规则、一切以 AGENTS.md 为准」的薄壳——本卡只改 AGENTS 即自动双入口一致，未引入漂移。唯一残留为 AGENTS 文件内部措辞：L95「独立仓里只有 relay 一份代码」与新 `tools/relay-light/` 并存（findings F-1 / code-round1 P2 已登记，收口裁决项，不重报）。

**判定句可 grep 专项**（本复核者复跑）：`rg -n -F '见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水'` 命中 AGENTS.md L44；`rg -F` 标头字面量同命中 L44；两 adapter 首行逐字节等于期望串。可单行 grep，成立。

**结论**：交付态中未发现相关教训被重犯的实例；唯一一类「先踩后被闸拦下」的是候选-37 的全文锚定（初稿层，未进交付）。

## 二、lesson_candidates.md 该登记未登记项

现有登记：LC-1（环境缺 `rg` 免 root 补装）、LC-2（`-F` 锁定句禁加反引号）、LC-3（`rg -c` 零命中输出空串）。三条均为 exec 批次工具层现场，登记规范。

**以下三个有证据且可复用的现场未登记**（与派单点名素材一致）：

### P2-1 · 同一 worker 的多份派活合同会互相漂移——plan-review 须有「跨文档合同一致性」显式检查（plan-review 三轮素材）

- 证据：`review.plan.md` 首轮 P1-1（`task_plan.md` 让 B3 直接 `CONSTRUCTION_DONE`、`dispatch/exec.md` 要求 audit PASS 后由编排再派令——worker 无法同时满足两份当前合同）；次轮 P1-4（`exec.md` 第 1 步是 `git status`，缺 AGENTS 铁律 7 与 task_plan 执行契约头要求的 rebase 第一动作）。
- 可复用规则候选：给同一 worker 同时下发专门 brief 与 task_plan 时，派工前审必须加一项「同一动作在各合同文件中的规定是否逐条一致」；不能只审单文件内部自洽。
- 关联：候选-42 家族（同卡文本互查）的新触发形——合同对合同，而非目标对验收口径。

### P2-2 · 首轮全面审过不等于合同冲突穷尽——回归轮要保留「全面复看」分量（plan-review 三轮素材）

- 证据：P1-4 在首轮未被发现，是第二轮「全面复看新增发现」才逮出（review.plan.md L96-101）；该缺陷自 `3620ee0` 起就在 exec.md，首轮漏、次轮中。
- 可复用规则候选：派活合同类缺陷一单多点、分散在不同文件，整改轮除回归旧项外须留一步全量复看；否则「首轮五项全 CLOSED」会造成已穷尽的错觉。

### P2-3 · 完成信号的 `evidence=` 引用必须先有已登记账本——B1 记账返工素材

- 证据：`check.C1.md` FAIL——exec 首个 `READY_FOR_REVIEW` 用 `red:…/green:…/baseline:…` 行内描述符，task_plan 要求登记稳定 E-ID 且信号 `evidence=<E-ID,...>`；当时 progress 无任何 E-ID 账本，信号引用悬空，补记账（`cbea9a6`）+ 更正信号后重审 PASS。
- 可复用规则候选：worker 发完成信号前，先确认 `evidence=` 引用的每个 ID 在证据账本里已存在；「信号引用存在性」是可机检项，属候选-4（引用目标存在性）在信号层的形态。

> 说明：exec.md 第 5 步与 task_plan 交接清单均要求「有则写」候选教训；以上三条证据链完整（review.plan.md / check.C1.md / commit 链），未登记属遗漏而非「无可写」。登记动作只需向 `lesson_candidates.md` 追加 2~3 行表格行。

## 三、其他观察

- **P3** — `docs/modules/relay-light/` 模块当前无 `knowledge/` 目录，本路按 brief fallback 用了 dh-relay 候选区。卡级 `lesson_candidates.md` 作为收口前暂存区工作正常；relay-light 模块级教训归宿（自建 knowledge/ 还是并入 dh-relay 候选区）值得收口时定一句，免得 miner 运行时无的放矢。
- **P3** — LC-2 是「写下即在同卡被遵守」的正面实例（候选-13 的反面证据），可在收口/人裁决时作为该候选有效性的佐证。

## 结论

**APPROVE_WITH_NITS**

既有相关教训在交付态均被遵守或经流程闸拦下，无重犯实例：判定句 oracle 逐字可 `rg -F` 单行命中、标头与 adapter 逐字节一致、AGENTS 改动纯增量无误伤、双入口薄壳设计未引入漂移。唯一实质缺口是 `lesson_candidates.md` 未登记三个有证据的可复用现场（P2-1～P2-3），属记账完备性问题、不否定 HC 交付；建议收口前补登，是否阻断由主控/用户裁决。本路只写事实与级别，不做验收裁决。
