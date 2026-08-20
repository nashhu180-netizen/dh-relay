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
| 批2·步6 建 `<CODE_ROOT>` + 迁入 ADR | 0 | 代码根 `adr/` 两份 ADR；仓根 `.gitignore` 含 `/.dh-relay/` | missing |
| 批2·步7 v1 六条缺口逐条处置表 | 0 | `v1-gap-disposition: G1~G6` 锚点计数 = 6 | missing |
| 批2·步8 冻结 7 份正式 schema | 0 | 7 份 schema 存在；`additionalProperties:false` 全域；无私有类型泄漏 | missing |
| 批2·步9 4 份 v0 形状 | 0 | `status: v0-shape-only` 计数 = 4 | missing |
| 批2·步10 reason code + 兼容矩阵 | 0 | reason code ≥5 条；兼容矩阵 v1 侧对得上 `tools/contracts/` | missing |
| 批2·步11 批次检查点 2 小审 | 0 | review.md 第一轮行 + `dh dispatch` 回显 | missing |
| 批3·步12 golden 正例 + negative 反例 + manifest | 0 | 跑红输出贴 progress；manifest sha256 齐 | missing |
| 批3·步13 独立校验器 + 测试转绿 | 0 | 全绿输出；反例逐条命中 `.expect.json` reason code | missing |
| 批3·步14 静态中立性断言（禁词 + H6） | 0 | PASS/故意插禁词后 FAIL 的红绿对照 | missing |
| 批3·步15 按路径 commit + progress 挂证据 | 0 | `git status --short` 只含本卡路径 | missing |
| 批3·步16 批次检查点 3 小审 | 0 | review.md 第一轮行 + `dh dispatch` 回显 | missing |

> 证据状态四态：`missing / partial / present / waived`
> （waived = 有意豁免，必须在 progress.md 记原因和谁定的）
