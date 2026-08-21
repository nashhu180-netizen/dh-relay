<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。核心是把"每个施工步骤证据到位没"摊开。（叫"步骤"不叫"阶段"，避免和模块级 Stage 的"阶段"撞词） -->
# visual_map — DHR_28

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 批1·步1 ADR-001 语言/进程形态/代码根草案 | 100 | 六节结构 grep + P4 证据指针可复跑（抽验 ≥2 条） | present |
| 批1·步2 ADR-002 Agent 宿主四问 | 100 | `answer:` 锚点计数 = 4 | present |
| 批1·步3 progress/visual_map 回填 | 100 | E-001 / E-002 在证据账本内 | present |
| 批1·步4 批次检查点 1 小审 | 100 | review.md 第一轮行 + `dh dispatch` 回显 `e:E-xxx` | present |
| 批1·步5 用户裁决语言 + 代码根 | 100 | ADR-001「决策」行含用户点选记录，不含"待用户裁决" | present |
| 批2·步6 建 `relay-core/` + 迁入 ADR | 100 | 代码根 `adr/` 两份 ADR（E-010）；仓根忽略实测 = `.gitignore:17` 的任意深度模式 `.dh-relay/`，**比 DevPlan 要求的根锚定 `/.dh-relay/` 更宽**、需求已满足（E-011，风险移交 DHR_29 见 F-009） | present |
| 批2·步7 v1 六条缺口逐条处置表 | 100 | `v1-gap-disposition: G1~G6` 锚点计数 = 6 | present |
| 批2·步8 冻结 7 份正式 schema | 100 | 7 份 schema 存在且**可被 ajv2020 真实编译**（E-020，首跑 MissingRefError 已修）；AST 遍历实测 22 处闭合 / 3 处已登记开放点 / **0 处未登记开口** / **0 处私有类型泄漏**（E-022）；H6 与 G1/G3/G4/G5 实测 13/13（E-021·E-025） | present |
| 批2·步9 4 份 v0 形状 | 100 | `grep -c '"x-freeze-status": "v0-shape-only"' v0-shapes/*.shape.json` → 四份各 1；JSON 全 OK；已冻结协议计数仍为 7（E-014） | present |
| 批2·步10 reason code + 兼容矩阵 | 100 | reason code 去重实测 23（E-015）；兼容矩阵 v1 侧**实读** `tools/contracts/` 五文件后逐字段建表，小审抽验 6 条 5 真 1 假（假的 = `proposed_by`，已改判改型，F-016）；§0 计数复算 2/5/23/10/4=44（E-017 + D-15 修正） | present |
| 批2·步11 批次检查点 2 小审 | 100 | review.md 第一轮行 + `dh dispatch` 回显（e:E-018）；5 轮往返、第 5 轮 **approved** | present |
| 批3·步12 golden 正例 + negative 反例 + manifest | 100 | 跑红输出已贴 progress（E-032）：校验器不存在 + npm test 空绿；**11 份 golden + 22 份 negative**（每份配写死 reason **与出错位置 at** 的 .expect.json）；`fixtures/manifest.json` 逐份 canonical sha256 对证（E-037）。⚠️ 本行曾被改写成不含 manifest 并标 present，由批次检查点 3 小审 P1-1 抓出，见 findings F-047 | present |
| 批3·步13 独立校验器 + 测试转绿 | 100 | `validate.mjs --selftest` → **33/33 pass，退出码 0**；反例逐条命中写死 reason **与出错位置**（E-033 / E-038） | present |
| 批3·步14 静态中立性断言（禁词 + H6） | 100 | 正向 0 泄漏 exit 0；负向插 `cordis_hint` / `pi_session_ref` 均报错 exit 1，删禁词表 `dsh` 亦被拦（E-034 / E-039）；`npm test` **7/7**（E-035 / E-040） | present |
| 批3·步15 按路径 commit + progress 挂证据 | 100 | 批 3 提交 `f99363d`（63 文件）；小审返工提交见 progress 日志 | present |
| 批3·步16 批次检查点 3 小审 | 100 | review.md 第一轮行 + `dh dispatch` 回显（e:E-036）；轮1 **changes-requested**（P1×2 / P2×3 / P3×5），十条**全接全改**，findings F-047~F-056 | present |

> 证据状态四态：`missing / partial / present / waived`
> （waived = 有意豁免，必须在 progress.md 记原因和谁定的）

> 批2·步11 记 `present`：批次检查点 2 小审 **5 轮往返后于第 5 轮给出 approved**（「批 2 可以冻结了」），findings F-009~F-042 全部收敛或显式移交下游。复核者主动给出停止判据：前 4 轮找的是实际缺陷，第 5 轮起找的是当前 schema 里不存在的理论构造 ⇒ 边际收益递减，a/b/d 三条记录为已知边界不再迭代。
