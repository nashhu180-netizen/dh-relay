<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。核心是把"每个施工步骤证据到位没"摊开。 -->
# visual_map — DHR_27

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 批 1 冻结 v1 fixture | 100 | freeze-manifest.json + testdata/v1 零绝对路径扫描绿 + 源目录冻结前后哈希全等（E-002/E-003/E-005；复核修复后重冻 E-019/E-022） | present |
| 批 2 投影器 + project 子命令 | 100 | 投影 schema 校验绿 + 确定性哈希 + 映射表逐条测试绿 + 全量无回归（E-008/E-009；小审补测后 E-021 159/159） | present |
| 批 3 活现场演示 | 100 | 演示前后 `.dh-runtime\relay\` 整树 503 文件快照全等 + 活/冻投影语义级全等（E-012/E-013/E-024） | present |
| 批 3 CM6a 审计 | 100 | 写 API / DSH import 双向 grep 转录（E-011，cm6a-audit.txt） | present |
| 批 3 P4 主报告 | 100 | evidence/10 落盘、`DM-deferred-facts:` 锚点可 grep、CM4 记「延后（DHR_50）」（E-014；批 3 小审 10 项断言抽查吻合） | present |
| 复核轮 1（批次小审 ×3 前移） | 100 | 三批 fresh 小审 approved + 发现全部处置（review.md 第一轮表；F-004/005/008/010） | present |
| E4 需求复核 / E5 教训复核 / E14 一致性复核 / E6 miner | 100 | review.md 各登记位 + lesson_candidates 5 条 + F-006/007/009 | present |
| 复核轮 2（E2 fresh 增量） | 100 | 第二轮表登记（approved，P3×3 处置收敛）+ 返工收敛表关账 0 open P0/P1（E-025） | present |
| 人判备料 H1/H4 | 90 | 终端转录 + fixture hash + CLI 输出 + 版本实耗已齐（主报告 §2/§5）；对话人验展示区随 E9/E10 发出 | partial |

> 证据状态四态：`missing / partial / present / waived`
