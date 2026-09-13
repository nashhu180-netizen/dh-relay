<!-- dh:v1 -->
# decision.1 — B1 lint --json 实现缺口

- 日期：2026-09-13；角色：`rlt10-decide`；Issue：#16。
- `kind=consult`；`status=PENDING_USER`；推荐 A，尚未批准任何选项。
- 现场：`wt/RLT_10`，读取时 HEAD `91d9fe6`；`git rebase master` 返回 up to date，工作区干净。
- 输入：[F-001](findings.md)、[progress](progress.md) 最后一条 exec B1 BLOCKED（施工提交 `5b79d03`，E-B1-001～005）；权限依据：[dispatch/decide.md](dispatch/decide.md)。

## 判定与证据

这是冻结产品合同与本卡允许路径之间的冲突，属于方向决策，不能按 `auto` 处理。

1. [design/01](../../design/01-RelayLight-产品设计与验收.md) §3.1 明列 `lint --plan <dir> [--json] [--config-dir <dir>]`；§3.5 和 §11 HC-RL-A80 要求 JSON 顶层 `ok/violations`、违反项 `rule/message/line`，以及退出码 0/2/3 和 stderr 合同。
2. [DevPlan §RLT_10](../../dev_plan/P1-RelayLight-开发方案.md#rlt_10--测试合同与仓库入口)、brief、task_plan 与 dispatch 均把 `relay_log.py` 排除在闭集外；A80 又是本卡四条完成条件之一。决策者不能自行扩路径或缩验收。
3. 当前 `tools/relay-light/relay_log.py:1854` 起的 CLI 分发仅给 status 注册 `--json`，lint 未注册；`:652` 的 `_lint_command` 仅输出文本。修复需要贯通参数注册、分发及 JSON 序列化，不是只加一个参数声明。
4. exec 的 E-B1-002 记录合法计划分支 `0 != 2`，E-B1-003 记录原始 CLI 返回 `error: arguments unrecognized arguments: --json`。两者足以支持签名缺口的行为 RED；语义违规分支的 `JSONDecodeError` 是空 stdout 的后果，不能单独作为有效 RED。E-B1-004 的 97 项结果为 1 failure + 1 error，不能称整组 GREEN。

本棒只读核对源码、合同与既有证据，未重跑测试；以上动态结果归属于 exec，未作独立复核或验收。

## 供编排征询的选项

| 选项 | 具体授权与实施边界 | 收益 | 代价与验收影响 |
|---|---|---|---|
| **A（推荐）：扩本卡允许路径，只补 lint --json** | 用户明确授权 RLT_10 增加 `tools/relay-light/relay_log.py`，用途限于实现既有 A80 的 lint JSON 参数、分发、输出及必要的真实行号传递；由授权规划角色同步 DevPlan 的范围/allowed-paths 和 workspace、dispatch 合同，再重新派 B1 | 保留原四条验收与唯一 A80 入口，直接把现有 RED 转 GREEN；无需修改 design 的产品要求 | 本卡由测试接入扩到最小实现修复，增加源码复核与回归负担；不能将路径授权泛化为重写 lint 引擎、status/add、installer 或 runner。若发现需改变规则语义或扩大架构，再 BLOCKED |
| B：B1 保留 RED，expectedFailure 标注并后移实现 | 用户明确同意延期 A80，并由规划角色记录后续承接卡、依赖和本卡阶段性交付边界；如要继续 B2/B3，须另行调整当前 B1 audit PASS 前置合同 | 暂时维持实现文件禁改，允许经批准后推进测试入口工作 | F-001 与 A80 仍未闭合；expectedFailure 的 exit 0 不代表合同通过，也不能据此宣称 A11 全绿或解锁 RLT_12。当前冻结入口含全部五分支，方法级 expectedFailure 会使整体测试标为预期失败并降低其他分支的回归保护；拆分入口又需调整已冻结证法。后续必须移除标注并取得正常 GREEN，故不推荐 |
| C：停卡，另开 lint --json 小卡 | 保留本卡提交和 BLOCKED；由编排向用户申请新卡立项及所需 Issue/版本动作，按一卡一 worktree 独立修复 A80，完成相应复核与合入后再恢复 RLT_10 | 保持 RLT_10 原允许路径和原验收条件，修复责任独立 | 增加 Issue、规划、worktree、独立复核与合入衔接成本；B1～B3 与 RLT_12 准入继续等待。恢复时需同步已批准修复基线并重跑原冻结入口 |

推荐 **A**：现有设计已明确要求该功能，问题是承接范围遗漏。以最小范围扩展修复，能保留验收强度且减少跨卡等待。若用户坚持 RLT_10 只改测试与入口，则选 C。B 仅适合作为明确的阶段性延期，不构成当前合同下的收口方案。

## 批准后的交接条件（非本棒执行）

- 编排记录用户选项与明确授权，再由获授权角色同步必要合同。本文件的推荐、既有 commit 权限及 exec 的 BLOCKED 均不等于扩路径或续批授权；未获答复时 B1 继续 BLOCKED。
- 若选 A，保留 `test_lint_cli_exit_stderr_and_json_contract` 原精确入口与完整断言。实现需使合法计划输出 `{"ok":true,"violations":[]}` 并 exit 0，语义违规输出字段完整、真实规则 ID/消息/行号的 JSON 并 exit 2，同时遵守既有 stderr 合同；解析/配置失败维持 exit 3 与可读错误，不伪造 lint 违反项。不能只吞掉 `--json` 或复用 status schema。
- B1 恢复后须记录冻结入口、A94 四类别和两份 Python 回归结果，再由 audit 检查调整后的范围与证据；B1 audit PASS 前不进入 B2。后续 normal 三路复核、平台证据和验收闸保留；不把本决策当作验收结论。

## 完成信号

`DONE task=RLT_10 role=decide batch=1 status=CONSULT evidence=decision.1.md next=orchestrator`
