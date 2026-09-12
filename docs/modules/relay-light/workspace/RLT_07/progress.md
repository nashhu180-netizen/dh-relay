<!-- dh:v1 -->
# progress — RLT_07

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-12 | W builder | 读取 AGENTS、DevPlan RLT_07 卡与依赖表、design/01 §2/§5/§6/§7/§9/§11 与 RLT_03/RLT_05 七件套格式；创建 RLT_07 标准档七件套，冻结三批施工顺序与 heavy 复核骨架；findings 登记 RLT_01 未完成依赖 | master 基线 `77bde7006b3ef56b9e2b04a8717e462e221241fe`；Issue #10；worktree `.dh-worktrees/RLT_07`（`wt/RLT_07`）；本工作区七文件 | `W_READY`；等主控裁决 RLT_01 依赖并另行 D-start/派 construction，不改 DevPlan「未开始」 |
| 2026-09-12 | 主控 | RLT_01 经 PR #13 合入 master（`25bdbcb`）；`wt/RLT_07` rebase 到该基点；task_plan 改写为「向 RLT_01 骨架填业务内容」，依赖表三项全部完成 | merge commit `25bdbcb`；rebase 后 `81c1d76` + `a401734`；F-001 resolved | 用户授权开工，进入 Batch 1 |
| 2026-09-12 | C batch-1 | 填 `skill/SKILL.md` 核心内容（角色表/五阶段模板容器/账本用法/拓扑布局/硬规则/放弃项）；`test_relay_log.py` 新增 `SkillCoreDocTests` 11 例覆盖 A12/A19/A27/A66/A67/A98/A100/A117/A132 | 红：focused 11 例 14 failures（骨架缺全部核心小节）；绿：focused 11/11 OK；全量 119 tests OK（174.4s）；`git diff --check` exit 0；commit `63c9e56` 已推 #11（rebase 后 force-with-lease） | 批次交主控小审 |
| 2026-09-12 | 主控小审 B1 | 按 task_plan B1 小审输入过一遍：diff 仅 SKILL.md/test_relay_log.py/workspace 三处 allowed-paths；六小节清点齐、模型名/术语/凭据/落点扫描全过；红绿 E-ID 已入账 | focused 红→绿、全量 119 OK、diff 边界干净 | PASS，派 Batch 2 |
| 2026-09-12 | C batch-2 | SKILL.md「五阶段模板」节落地 W/C/R/X/F 五块可抽取模板（占位符 `<card>/<prev>/<n>/<k>/<打回路>/<reviewer>`）；新增 `SkillTemplateTests` 11 例：五块抽取清点、三档 recipe 全链 lint 干净、A127 节点类型闭集、A95/A133 C 模板形状、A102/A113/A103/A114/A96 模板驱动行为断言；实测发现 decision_mode 模式门未在 relay_log.py 实现 → 记 F-002，两条负例腿以 skip 钉住 | 红：模板未落地时抽取断言红；运行时断言 = late-added discriminator；实测探针：consult 下 decision 后直接 resume rc=0（oracle 要求 2）→ F-002；绿：focused 9 ok + 2 skipped；全量 130 tests OK（200.1s）；commit `a575562` 已推 #11 | 批次交主控小审 |
| 2026-09-12 | 主控小审 B2 | diff 仅 SKILL.md/test_relay_log.py/workspace；五模板可抽取且三档 lint 干净；C 模板四 agent trigger/close 与 A95 逐格一致；A127 节点类型闭集过；行为断言全部对已实现的账本语义成立；F-002 两条腿如实阻塞登记 | focused 9 ok + 2 skipped、全量 130 OK、diff 边界干净 | PASS（带 F-002 open），派 Batch 3 |
| 2026-09-12 | C batch-3 | 填 `references/adapter-claude-code.md` 与 `adapter-codex.md`：本侧 `--config-dir` 固定、add/status/lint 三子命令 × Windows `python`/Linux `python3`/远程 `bash -lc` 模板、claude kind `pane run`+`rename` 起法、`agent_prompt_stalled`→`send-keys enter`+seq 复验+`agent read` 终判、wait 接收者三方式与无 watch 前台回退、派活 prompt 模板含凭据禁写原文；新增 `SkillAdapterTests` 6 例覆盖 A21/A26/A27/A136/A12 五件非骨架/不调用 watch 子命令 | 红：骨架无业务内容时结构断言红；绿：focused 6/6 OK；全量 136 tests OK（274.9s）；commit `e80a520` 已推 #11 | 批次交主控小审 |
| 2026-09-12 | 主控小审 B3 | diff 仅两 adapter + test + workspace；A136 枚举机检全部调用带本侧 --config-dir 且三子命令齐；A21 三方式+前台回退原文在；A26 双平台/claude kind/stalled 条目齐；A27 凭据禁令在派活模板；五件非骨架；`relay_log.py watch` 零调用 | focused 6/6、全量 136 OK、diff 边界干净 | PASS——整卡施工完成（CONSTRUCTION_DONE），待 heavy 五路复核 |

## 施工批次状态（预填，不代表已执行）

| Batch | 功能单元 | 红 | 绿 | 小审 | 状态 |
|---|---|---|---|---|---|
| 1 | SKILL.md 核心小节与横向硬规则 + 结构测试 | focused 11 例 14 failures（2026-09-12） | focused 11/11 OK（2026-09-12） | PASS（主控 2026-09-12） | 完成 |
| 2 | 五阶段模板 + 运行时合同测试 | 模板抽取断言对未落地模板先红（已随实现转绿）；运行时断言属 late-added discriminator（语义已在 RLT_03/05 实现，本批在模板形状上钉住）；A96/A114 两条 mode-gate 负例腿因 F-002 以 skip 钉住 | focused 11 例 9 ok + 2 skipped（2026-09-12） | PASS（主控 2026-09-12，带 F-002 open） | 完成（F-002 待裁决） |
| 3 | 双 adapter + 五件齐收尾 | adapter 骨架无业务小节/枚举断言先红（随实现转绿） | focused 6/6 OK（2026-09-12） | PASS（主控 2026-09-12） | 完成 |

## 信号

```text
DONE task=RLT_07 batch=3 status=CONSTRUCTION_DONE evidence=focused-adapter-6ok,full-136ok,diff-clean next=main-controller
```
