<!-- dh:v1 -->
# findings — DHR_29

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-001 | P3 | `dh wt new` 从 `origin/master@554e543` 建树，落后于 `master@c44d392`。 | E-001 | 已立即 `git rebase master`；后续所有证据基于 `c44d392`。 | resolved |
| F-002 | P0 | Store 的 accepted result 与 `late_result_quarantined` 工件没有完整复用 v1 redaction 口径；隔离区可落明文凭据。 | E-008；`tools/contracts/relay-redaction.ps1:24-40` | 批次 1 补齐四类口径并双路同 sanitizer（E-005）；CP2 approved 确认红线未失守并补 sk- 双路钉（E-012/E-013）；轮 2 逐分句核销（E-018）。 | resolved |
| F-003 | P1 | Store 无 `openStore` 和磁盘重建；事件、receipt 与终态状态只在内存，强杀无法恢复。 | E-008 | 批次 2 已补齐（openStore 磁盘重建、五类完整性 fail-closed、工件回装、state.json 自愈、快照切点等价矩阵；E-009）；CP2 独立复现（E-012）；轮 2 核销（E-018）。 | resolved |
| F-004 | P1 | Store 未在写前校验 event schema、未完整核 receipt+attempt 身份、终态后事件可污染状态、fresh attempt 被旧终态锁死、并发 append 可重复 seq。 | E-008 | 批次 2 已补齐（写前冻结契约校验、身份链、终态守卫+隔离并存、终态按 receipt 记账、串行写队列；E-009）；CP2 独立复现（E-012）；轮 2 核销（E-018）。 | resolved |
| F-005 | P2 | 契约修订批次 1 验收第 2 条「四个无对应事件值逐条裁决并落账」漏执行——CP1 与批次 1 收口均未抓出，全树只有「待 DHR_29 判定」占位。 | E-012 | 批次 2 收敛批已补：`compat-matrix.md` §4b 四行逐一裁决（全部显式不补+实现依据）+ 结账句落账；指纹零漂移实证见 E-013。resolved 待轮 2 复核确认。 | resolved |
| F-006 | P3 | CP2 六条观察项：checkpoint 幂等先于身份校验的冒用 ack 洞、工件损坏裸异常、B11 措辞与实现字面出入、sk- 缺测试钉、state.json 自愈静默抹篡改、fresh attempt 后旧 result 重投进隔离区。 | E-012 | 前四条已修（判定次序重排 / `E_STORE_CORRUPT` 包装 / reason-codes §四措辞对齐 / sk- 双路钉）；后两条判不修并落账理由：自愈=有意取舍记入 as-built §3.5；隔离区处置与 task_plan 步骤 3 口径自洽。 | resolved |
| F-007 | P3 | 一致性复核第 1 行：`relay.checkpoint.v2.schema.json` `receipt_id` 的 description 仍写「按 B11 隔离而非接受」，与 v2 实际处置（checkpoint 拒识不留痕）相悖。 | E-017 | 与批次 1 遗留的指名更正合并为**一次指纹批**（2026-08-22）：checkpoint description 更正 + run-state `state_signature` 的 P5-M3 指名改归 DHR_51，同批重生成三份基线（E-019）。 | resolved |
| F-008 | P3 | 一致性复核第 5/6 行：reason-codes.md 未划「协议码 vs 进程内异常前缀」边界；OPEN-POINTS.md K-1 正文未随批次 1 销账。 | E-017 | 均为 md、不动指纹，收敛批已修：reason-codes §四后加边界声明；OPEN-POINTS K-1 加 ✅ 结账指针（K-2 亦同批回填）。 | resolved |
| F-009 | P1 | 需求复核【有漂移】四处静默没做：①P1 迟到结果 fixture 复验「不弱于 v1」未执行（点名的 v1 Oracle 零使用）；②批次 1-③ F-042 未做（audit 无 ajv validateSchema 接线）；③批次 1-⑤ 卡号指名更正无执行（run-state 仍写 P5-M3 由 DHR_29 承接）；④批次 1-⑥ done<=total 归属未改准。另 P2：§4b 计数漂移（仍写 15 值/新增 11，实为 16/12）。 | E-018 | 需求复核回收后一次收敛：①新增 P1 fixture 复验测试（stale/duplicate/wrong-hash 三件，两种提交次序，隔离 ≥ result_stale、冲突码 ≥ CAS）；②audit 第③闸接入 ajv 权威 + meta 分叉 tripwire；③④指纹批更正指名与归属（E-019）；P2 计数改 16/新增 12 并给 3+3+1+12=16 对账式。 | resolved |
| F-010 | P3 | 轮 2 代码复核四项观察：R2-3 as-built §5 数字陈旧（hash 3ccf/10 条 vs 实际）；R2-4a readState 首写前 ENOENT；R2-4b 幂等比较 stringify 键序敏感；R2-2 工件/事件跨文件撕裂窗口 openStore 不检测。 | E-018 | R2-3 已刷新 §5（E-019）；R2-4a 已修（建库即写初始快照）；R2-4b 与 R2-2 判登记不修：前者无实际碰撞面（同源对象同序），后者记入 as-built §3.5 已知边界、彻底消除归 DHR_51。 | resolved |
| F-011 | P3 | 轮 2 R2-1：`appendEvent` 原始入口可直接投递 `attempt_succeeded/failed/orphaned`，绕过终态守卫污染回放。 | E-018 | 非本批引入（批次 1 即存在，CP1/CP2 均未列）；运行期封堵归 **DHR_51**（runtime 层不暴露 raw 入口、结果只经 appendResult），已记 as-built §3.5 已知边界。 | open |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
