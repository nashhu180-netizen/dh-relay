<!-- dh:v1 -->
# RLT_05 Batch 1 fresh 小审 — rlt05-b1-check-sol

- 时间：2026-09-11
- reviewer：`rlt05-b1-check-sol`
- 模型/形态：Codex `gpt-5.6-sol`，`--sandbox read-only`，fresh session
- 派出证据：`E-014`
- 范围：仅 Batch 1 两份 Python、两份 TOML、E-004～E-013、fixture 对齐与边界；不含 Batch 2～4 或 heavy 最终五路
- 结论：`CHANGES_REQUIRED`

## 检查结论

| 靶子 | 结论 | 证据/说明 |
|---|---|---|
| cwd / Git 基线 | PASS | worktree 正确；HEAD=master=`1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d` |
| Batch 1 路径闭集 | PASS | 功能增量仅两 Python、两 TOML；B06 既有 WIP 未误判为施工越界 |
| E-004～E-006 红绿记录 | PASS（既有证据） | 有效红 18 个 assertion failure；5 个 FileNotFoundError 未冒充有效红；focused 14/14、全文件 68/68 已落账 |
| fresh unittest / help / diff-check | NOT_RUN | reviewer 的只读命令在 Python/Git 命令启动前被 `bwrap: loopback: Failed RTM_NEWADDR` 阻断；不冒充 fresh green |
| shipped TOML ↔ design §6.3 | PASS | 11 角色、W/C/R/X/F、三档 Recipe、limits/on_exceed 静态一致；E11～E13 未混入 |
| 三 CLI `--config-dir` | PASS（静态） | `add/status/lint` 均声明 flag，顶层仍仅三命令 |
| A135 五情形主体 | PASS（静态） | 显式优先、Claude-only/Codex-only、双侧/零侧 fail closed，拒绝发生在写账前 |
| A135 来源真实性 | FAIL | 调用方预置 `config_dir=`/`plan=` 时被原样保留，无法保证账本记录实际来源 |
| A116 per-R 集合与结构优先级 | PASS | 每个活跃 R 实例独立比较；零 reviewer 豁免；结构 lint 先于 A116 |
| A116 Recipe 三值闭集 | FAIL | 当前只要求 recipe 在配置中存在；替换配置新增 `strict` 即可扩张合法档位 |
| fixture 对齐 | PASS（静态） | helper、直接 `lint_plan`、A129 fixture 与 append-failure fixture 均有逐项记录 |
| design §6.2 不复述具体集合 | PASS | 具体 reviewer 集合只在 §6.3 |
| Batch 边界 | PASS | status placeholder 保留；未见 lifecycle、X planner、模板、watch 或 plan-amend 抢跑 |

## Findings

### P1 — F-B1-RECIPE-ENUM

`tools/relay-light/relay_log.py:147-150,552-565`：design §11 的 HC-RL-A116 冻结 `recipe` 只能为 `heavy/normal/light`，当前实现只检查 `config.recipe_reviewers(plan.recipe)` 是否存在。自定义配置加入 `[recipes.strict]` 后，`recipe=strict` 会成为合法计划；现有 `test_relay_log.py:1417-1432` 只用 shipped 配置，未覆盖此绕过。

整改：锁定 Recipe 键闭集，或在加载配置时要求 recipes 键精确为三档；新增“配置含 strict + plan 使用 strict”拒绝断言。

### P1 — F-B1-PLAN-LOADED-PROVENANCE

`tools/relay-light/relay_log.py:902-925`：design §6.2.1 要求账本记录实际使用的配置目录，但 `_plan_loaded_note()` 对调用方已有的 `config_dir=`/`plan=` 原样保留。调用者可提交伪造、重复或冲突 token，账本仍成功追加；现有 `test_relay_log.py:1463-1488` 只覆盖缺字段自动补齐。

整改：拒绝重复/冲突 token，或无条件以 resolver 与实际 plan 路径生成规范值；增加拒绝时账本字节不增的反例。Batch 4 的判别器须以调用方输入为对象，不把写入后的自动规范化误当“缺键被接受”。

### P2 — F-A92-COVERAGE

`tools/relay-light/test_relay_log.py:1317-1331`：当前 shipped TOML 与 §6.3 一致，但测试只要求 R 节点集合为超集，未精确锁死 W/C/R/X/F 的完整键和值，不能阻止额外 R 节点或其它阶段漂移。

建议：对完整 stage mapping 做精确等值断言。本项不单独阻断，但可随本轮低成本闭合。

## 对施工 findings 的裁决

- `B1-F1`：P1 阻断。无 R/零 reviewer 的集合豁免可保留，但 `recipe` 合法值不能因替换配置新增档位而扩张；必须在 Batch 1 闭合。
- `B1-F2`：P1 阻断。自动补齐可以保留，但“调用方已写则原样保留”不满足实际来源真实性；必须在 Batch 1 闭合。

## 最终结论

`CHANGES_REQUIRED`。Batch 2 不得开放；先整改两项 P1，在可执行环境复跑 focused、全文件 unittest、三 CLI help 与 `git diff --check`。P2 建议同轮闭合。

## 定向复审 R1（E-024）

- 复审结论：`APPROVE`
- reviewer：同一 `rlt05-b1-check-sol`，Codex `gpt-5.6-sol`，`--sandbox read-only`
- 复审对象：E-015 的两项 P1、一项 P2；整改证据 E-017～E-023
- F-B1-RECIPE-ENUM：PASS。`RECIPE_TIERS` 先锁定 `heavy/normal/light`，reviewer 集合仍从 TOML 读取；扩展 strict、缺 normal、heavy 正例及拒绝前账本不增均有判别器。
- F-B1-PLAN-LOADED-PROVENANCE：PASS。调用方同名 token 被全部丢弃，再按实际 resolver 目录与规范绝对 plan 路径各重建一次；其它 token 保序；相对 `--plan .` 已覆盖。
- F-A92-COVERAGE：PASS。W/C/R/X/F 全键全值与顺序精确断言，E11～E13 明示缺席；该覆盖补强如实登记为 pass-before。
- 回归：fresh reviewer 的动态命令仍因 `bwrap RTM_NEWADDR` 为 `NOT_RUN`，未冒充通过；施工环境 E-018/E-019 为 18/18、72/72。主控另在正常 worktree 复跑 18/18、72/72，见 E-026。
- 边界：PASS。status placeholder 保留；未出现 Batch 2～4、heavy review、commit 或远端动作。
- open findings：none。

最终：Batch 1 小审可以闭合。是否启动 Batch 2 仍服从独立授权，不由本复审自动扩张。
