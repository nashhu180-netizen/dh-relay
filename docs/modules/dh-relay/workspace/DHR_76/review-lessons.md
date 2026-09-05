# DHR_76 / Batch-7601：lessons 独立复核

- `review_path_id`: `lessons`
- reviewer: `dhr76_lessons`
- mode: fresh independent review；只读复核
- current candidate: `3d55ca739029cf4e35383fe69eab6dfa36844c7a`
- production source: 当前生产三文件自 `5e04dd8` 后未改；E-7658 已用机器 SHA256 等价检查确认，`24e575f` 之后的 regression 源码也无变化。旧 evidence 保留原执行 SHA；纯提交 SHA 不替代等价检查，但不应因此要求不变的生产代码反复重跑。
- write scope: 本文件；未改代码、DevPlan、progress/findings 或他人报告，未运行测试。

## 结论

**lessons 路径的候选 68 与候选 73 正常预算现已闭合。** P0=0；旧 evidence 保留各自执行 SHA，E-7658 补足了生产三文件及 regression 源码的机器等价证明，新增/修改测试已有对应终态 raw。此前把 golden 的 main→ninth 当成 DHR_76/A 的必然权威，现予撤回；DHR_63、DHR_65、真实 F projection 才是本卡该处的事实边界。D 一致性及另一 D 复核提出的 P1 合同分歧仍由 `decision-cleanup.md` 待裁决，主控不得放行；本路不替其裁决。P2 边界另列为“不可证”，不能被报告中的“满足”覆盖。

### A 权威纠正：撤回“必须补 main→ninth”的旧发现

DHR_63 的已接受事实明确记录 live `main.fallback_profile_ids=[]` 与 stale golden 的 `main -> ninth` 值级分歧；golden 不能直接充当本卡完整结构等价副本。DHR_65 的已接受 fixture、当前真实 projection 与 DHR_76 的 fallback 形状一致：`herdr.codex.main` 无 fallback，`herdr.codex.ninth -> main`，ninth 无 config。故 `relay-core/test/dhr76-profile-validation-lease.test.mjs:63-74` 这一 fallback 形状没有因不匹配 golden 而构成 A 的 P1，不能要求为此改真实业务图。

主控已在 `3249c95` 修正真实 config 形状：`completeRegistry()` 与 `configuredRegistry()` 都是四条带 config 的 Profile，ninth 无 config，所需 `model`、`profiles`、`permissions`、`expected_identity` 字段形状齐全。E-7653（candidate `2f198e5`）已对完整 config、混合 config/alias first-error 和正式 60s round 取 raw；E-7654（同一 candidate）对 A mutation 取红，E-7656（candidate `3d55ca7`）对还原后的完整 loader、Host 和 native async error→close 取绿。该修正已不再是未取证项，不是要求把 live fallback 改成 golden 双向边。候选 6/12 的一般原则仍适用于后续真实 config/alias mutation，但本次不再提出 main→ninth 缺口。

### 候选 68：保留执行版本标签，source-equivalence 与变更测试均已补齐

已核对的 evidence JSON 显示 E-7640、E-7641、E-7642、E-7643、E-7644 的 `candidate` 为 `f05e66bbc5e385b1b9ca70eee909cd9ae0f19ce4`；A 的 E-7629/E-7636 还绑定在 `6cf6f71`。这些标签正确保留，不能改写成当前 SHA。E-7658-source-equivalence-final 则确认生产三文件与 `5e04dd8` 完全同 SHA、`24e575f` 之后 regression 源码无变化、生产 changed paths 为空；这满足“执行源码等价”而不是单靠文档提交 SHA。

当前终态证据分流完整：E-7653/E-7654 覆盖 config、正式 round 与 A mutation；E-7643-mutation-b-config、E-7644-ttl-control-config 覆盖 B/TTL 红；E-7656 覆盖还原后的 A/B/C 正常路径；新 F 目录 `DHR76-F-20260905T023258226Z-b51be59d/summary.json` 仍以 candidate=`24e575f`、五个 profile ID、registry before/after SHA256 相同、时序及 owned cleanup 作为 F 终态。旧 `cb6e298d` 只保留为旧执行版本，不能覆盖新 F。故候选 68 已闭合：标签不改写，变更测试用新 raw，未变生产用 E-7658 机器等价检查关联。

## 指定候选逐条判定

| 候选 | 判定 | 复核事实与边界 |
|---|---|---|
| 6 | **未见本卡 fallback 权威重蹈，已由最终 A mutation 补证** | DHR_63/DHR_65/live 事实支持 main=[]、ninth→main；不能把 stale golden 当作缺口。E-7653 的完整 fixture/config 正向与 E-7654 的 targeted A mutation 红、E-7656 的还原绿，证明真实结构边界的断言能咬住；不改 live fallback。 |
| 12 | **未见新的错误 scope 重蹈，已由最终 config/first-error raw 支持** | E-7653 覆盖混合 config/alias first-error 与 stop probing，E-7656 覆盖还原后的完整 loader；旧 evidence 仍按各自执行 SHA 标签保留，不能被改写成当前 SHA。 |
| 68 | **已闭合** | E-7658 机器证明 production 三文件与 `5e04dd8` 同 SHA、`24e575f` 之后 regression 源码无变化；E-7653/E-7654/E-7656 与 B/TTL config mutation 提供修改测试的终态。旧标签正确保留，未变生产无需循环重跑。 |
| 69 | **未见成功路径重蹈；异常分支不可证** | driver/actor 的正常清理均在用例体内 `try/finally`；`t.after` 只负责 fixture/mocks。E-7656 又证明 native asynchronous spawn error 在 loader reject 前 close；仍没有 taskkill 非零或 root 永不 close 时的独立 raw evidence，不能把正常路径绿扩写成所有清理分支已证。 |
| 72 | **未见重蹈** | 当前 F projection 先按 allowlist 保留 seq/kind/at，detail/node/attempt/executor/run_id 不写入事件投影；未见凭据进入报告的证据。 |
| 73 | **正常正式预算已闭合；异常补充边界不可证** | E-7653 raw 明确 `round_budget_ms=60000`、五 probes、elapsed=64740ms、4/4 pass；E-7658 证明生产源未变。D 补充用例仍使用 `validationTimeoutMs=3000` 和短等待，未见逐段推导；它不能充当正式 120s outer 或异常清理反例的证明，也不构成新的 lesson。 |
| 78 | **未见重蹈** | 当前 Host-loader 证据为五个异步 child probes，超过默认 15s 且有 renewals/contender held；F 为真实 Windows DSH-off run。负载粒度与目标契约相符。 |
| 79 | **曾重蹈，已见整改** | 早期 F projection 的 DateKind/OrderedDictionary/sort 问题已在 `check-real-f-projection.ps1` 加 known-sample self-check；当前 F summary 使用 24e、五 ID projection 并通过 before/after hash。已知 parser lesson 不应重复登记；self-check 的独立 raw 文件未在本次范围内另见，故只采信脚本断言与 E-7648 结果，不扩大到未投影字段。 |
| 81 | **未命中** | 本卡证据链为 DHR_76 自身线性 candidate；未见把 DHR_75 或其他卡的组合绿并入本卡生产结论。跨卡材料只作背景，不能替代本卡 evidence。 |

## `lesson_candidates.md` 新候选

### L-7601：Windows 子进程 timeout 的清理必须同时证明 root close 与 descendant kill

**建议保留为候选，唯一性成立。** 它来自 `review-code1.md` 的 F-76-C1-01：timeout/finish/unref 只证明控制流结束，不能证明 root child 已 close 且后代已 dead。候选 69 约束 `try/finally` 的清理位置，候选 73 约束等待预算推导，三者关注面不同。E-7641 已证明正常 production timeout 的两 child close、descendants_alive=0 和 driver 四零；taskkill 失败/child 不 close 的异常 OS 分支仍是不可证边界，且 D 两复核的 P1 合同分歧继续阻塞主控放行，不能提前写成完整闭环。

### L-7602：异步 validation 必须保持同步 per-profile 顺序与 first-error priority

**建议保留为候选，唯一性成立。** 它来自 `review-code1.md` 的 F-76-C1-02：首版先扫描全部配置，可能改变同步校验的先后和首错优先级；候选 11/33/66 的范围不同。E-7653（candidate `2f198e5`）覆盖混合 config/alias 的 first-error 与 stop probing，E-7656（candidate `3d55ca7`）覆盖还原后的完整 loader/native error→close；旧 E-7638 仍按 `f05e66b` provenance 保留。E-7658 证明未变生产/regression 源码等价，因此不必因生产源码未变而重跑同一生产行为。

本次没有产生第三条新 lesson：F projection 的已知问题属于候选 79；A 的 mutation/证据范围属于候选 6/12；预算与清理边界属于候选 69/73；B/D 的未证项是现有候选或证据缺口，不另造重复条目。

## 终态 evidence 与不可证项

- E-7640：C 四种错误的 loader + driver 四零；raw pass，但 candidate=`f05e66b`。
- E-7641：正式 15s production timeout，实际 close/descendant dead；raw pass，但 candidate=`f05e66b`。
- E-7642：Host-loader 正向五 child/renewal；raw pass，但 candidate=`f05e66b`。
- E-7643 / E-7644：B sync16s 与 TTL-only mutation 均按预期红；两者 candidate=`f05e66b`。
- E-7645：24e 恢复绿、fixture graph/Host-loader；保留为该执行版本证据。
- E-7646：24e 双 Profile 选择绿；保留为该执行版本证据。
- E-7653：candidate `2f198e5`，完整 config/first-error 与正式 60s round，4/4 pass，五 probes elapsed 64740ms。
- E-7654：candidate `2f198e5`，A config fixture mutation 按预期红。
- E-7643-mutation-b-config：candidate `2f198e5`，B sync16s mutation 按预期红。
- E-7644-ttl-control-config：candidate `3d55ca7`，TTL-only mutation 按预期红。
- E-7656：candidate `3d55ca7`，A/B/C 还原、实际 Host 完整 loader、native missing-exe async error→close，4/4 pass。
- 新 F `DHR76-F-20260905T023258226Z-b51be59d/summary.json`：24e、完整五 ID、registry before/after hash、时序及 cleanup；可替代旧 `cb6e298d`。
- E-7658：candidate `3d55ca7`，production 三文件与 `5e04dd8` SHA256 相同，production changed paths 为空，`24e575f` 之后 regression 源码无变化。

候选正册文件 `docs/modules/dh-relay/knowledge/教训库.md` 在本仓不存在；本次只读取 E-7627 的目录并深读指定 6/12/68/69/72/73/78/79/81，故正册登记状态为 **N/A（可核查）**，不创建 Pair/Binding，也不以缺少正册推导“未命中”。

lessons 路径无需再补新的证据；仅保留异常 OS 清理失败、补充 3s budget 的推导、正册 Binding 为不可证。不要为 stale golden 改 live fallback，也不要要求每次文档提交重跑不变生产。D 一致性及另一 D 复核的 P1 合同分歧由 `decision-cleanup.md` 待裁决，保持阻塞，主控不放行。
