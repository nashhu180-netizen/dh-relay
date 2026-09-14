<!-- dh:v1 · check.C4.md -->
# check.C4 — RLT_09 B4 小审

- 候选：`bc89770`（B4 / A122 + P1-02）
- 范围：仅按 `audit.md` 模式 B 核 B4。
- 结论：**PASS**。

## A122 与 P1-02

- `RelayPlanAmendGuardTests` 10 项全部通过：三类闭集逐项允许；design、新卡 task_plan、跨模块、绝对/穿越/重复/目录/ignored 等路径在 before 预检拒绝；授权读取改前 marker cards，不能由改后新增 card 反向授权。
- design 混合提案在预检阶段整体拒绝，允许目标、design 目标、其它计划目标及输入方案文件的原始 bytes/mode/symlink 状态均不变，snapshot-dir 不残留；没有部分落笔。
- raw snapshot 覆盖 tracked clean/删除/staged+dirty 二次修改、既有/新增/删除 untracked、改前 dirty 同路径再改；成功只接受排序后的 `actual == proposed`，actual 多项和 proposed no-op 少项均拒绝并恢复。
- 核心对象库用例同时比较递归 objects 文件清单与 `git count-objects -v`，before/成功 after/失败恢复均相等；真实 index bytes 也不变。生产 Git 调用由 `_git_readonly` 固定 allowlist 并设置 `GIT_OPTIONAL_LOCKS=0`，无 `add/hash-object/write-tree/update-index` 等写对象路径。
- clean/EOL filter 失败例从仓外副本恢复原始工作树 bytes、permission mode 与 symlink target，不以 Git clean/smudge 内容作 oracle。
- 敏感未跟踪 canary 的正文、文件名及逐文件 hash 不进入对象库或进程输出；snapshot 0700、内部文件 0600，成功或验证恢复后删除。
- HEAD、真实 index、object database 及 before 双采样任一外部变化均 fail closed；普通 lint 合同保持。

## 命令与模板边界

- A135 用例通过：顶层仍只有 `add/status/lint`；A122 仅以 `lint --amend-check before|after` 下属模式提供，尝试 `amend` 顶层命令被拒。
- planner-amend 生命周期用例通过：只走普通 `agent_launch → done`；out-of-scope `done.note` 要有 `outcome/proposal/reason`，其名下 `blocked`、`escalate`、`plan_amend` 被拒，monitor 写 blocked `stage_result`。
- `SKILL.md` 差异只新增 planner-amend 四输入、三类白名单、before/after、整份预检、恢复/三次修复与结构化 done.note 模板，并把既有相关文字指向该模板；两份 adapter 各只新增同构的一行模板指针，未复制或扩张其它流程。

## 路径与复跑

- `git diff bc89770^ bc89770 --name-only` 的八项均在允许路径：`relay_log.py`、`test_relay_log.py`、仓内 `SKILL.md`、两份 adapter，以及 RLT_09 的三份 workspace 证据文件；未改 `install_skill.py`、`tools/tests/**`、design 或 dev_plan。
- `git diff --check bc89770^ bc89770` 无输出。
- 五个点名 P1-02 用例：exit 0，`Ran 5 tests in 5.070s`。
- 完整 guard + 模板 + A135 + adapter：13 tests，exit 0；另复跑 planner-amend 生命周期及 forbidden-primitive 两项，exit 0。
- Python 全量：exit 0，`Ran 159 tests in 229.043s`，`OK (skipped=2)`。
- PowerShell 全量：exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)`；包装段内 Python 159 与 install_skill 7 项通过。
- 测试生成的 `tools/relay-light/__pycache__/` 已删除。

本批未偏离 task_plan、未越允许路径，A122/P1-02 判据可复算且全量回归绿：**PASS**。
