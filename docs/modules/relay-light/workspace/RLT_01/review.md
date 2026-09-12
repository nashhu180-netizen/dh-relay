<!-- dh:v1 -->
# review — RLT_01

> RLT_01 task_type=`normal`。施工者不得复核自己的卡；复核 Recipe 三路：代码轮 1、需求方向、教训，另有有效单测要求。

## Normal Recipe 路径登记

| 路径 | 时序/独立性 | 必审靶子 | reviewer | 证据 | 状态 |
|---|---|---|---|---|---|
| code-round1 | construction 完成后的代码复核；fresh，非施工者 | 整卡 diff、A124 证法（mid-failure 注入+重跑收敛）、manifest 字段、五件闭集、只进 allowed-paths | `rlt01-cr1-devin-sub` · Devin subagent · fresh | `reviews/code-round1-devin-sub.md`；focused 7 OK、回归 108 OK、冒烟 exit 0 | approved 2026-09-12 · open=3 全 P3 观察项 |
| requirement | 独立路径 | 逐字对齐 DevPlan RLT_01 卡与 design §8.1；无 RLT_07 业务内容抢跑、无真实用户目录写入 | `rlt01-req-devin-sub` · Devin subagent · fresh | `reviews/requirement-devin-sub.md` | approved 2026-09-12 · open=3 全 P3（F-01 已修，F-02 转 RLT_07，F-03 转 findings F-002） |
| lesson | 独立路径 | 核 `lesson_candidates.md` 证据、去重与可复用性；若 absent 形成可核查 N/A | `rlt01-les-devin-sub` · Devin subagent · fresh | `reviews/lesson-devin-sub.md`；87 条库候选去重核对 | approved 2026-09-12 · lessons-absent N/A 成立 |

## 批次小审登记

| Batch | 小审 reviewer | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| 1 | （单批卡，normal 三路复核即覆盖） | — | — | — |

## 有效单测·改坏必红（代码轮 1 必填）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 | 命令 | 施加 hash | 还原 hash | 行为红结果 | 状态 |
|---|---|---|---|---|---|---|---|---|
| `install_skill.py` `install_all` 缺件检查（副本 `/tmp/rlt01-cr1-mut/`） | `missing = [...]; if missing: raise InstallError` → 删除 | fail-closed 源完整性 | `test_source_missing_file_fails_closed` | `/tmp/rlt01-cr1-mut` 内 `python3 -m unittest test_install_skill.py` | `76734a75…` | `8c94c234…` | `FAILED (failures=1)` AssertionError 行为断言红；还原后全绿 | done |
