<!-- dh:v1 -->
# progress — RLT_08

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-13 | W builder (`rlt08-build`) | 读取 AGENTS、DevPlan RLT_08/交付物矩阵、design/01 指定段落与四条 oracle、skill/双 adapter 及 RLT_07 格式；建立 RLT_08 七件套，冻结 B1–B3 红→绿与 audit 输入 | Issue #14；worktree `wt/RLT_08`；master `851433c`；`git rebase --autostash master` = up to date；A34 design/adapter 标头同构；本工作区七文件 | 发 `W_READY`；等 orchestrator 派 W audit，不进入施工 |

## 施工批次状态（预填，不代表已执行）

| Batch | 功能单元 | 红 | 绿 | 小审 | 状态 |
|---|---|---|---|---|---|
| 1 | 双模块身份 + `dh` 入口 | 待执行 | 待执行 | 待执行 | 未开始 |
| 2 | relay-light 编排协议 + Runner 冻结分流 + B-adjust 窄例外 | 待执行 | 待执行 | 待执行 | 未开始 |
| 3 | skill 阅读索引 + 整卡机检 + `dh relay-light` 解析证据 | 待执行 | 待执行 | 待执行 | 未开始 |

## 信号
