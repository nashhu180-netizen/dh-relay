<!-- findings.md — 问题清单。🟢 边做边记。 -->
# findings — DHR_04 隔离/禁改/落点守卫

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-001 | P3 | stage0 自举形态本身的观察位（驱动器冻结/promote 节奏、包装脚本可复用度、每棒 brief 成本）——本卡边跑边记，供后续批次决定是否把包装抽成通用输入（对应 IHSR_05 RB-4）。 | 待填 | 观察记录 | open |
| F-002 | P3 | `relay-agent-tool.ps1` 的「propose without receipt and run root fails closed」在本棒进程继承了 `RELAY_RUN_ROOT` 时会误红：该用例 finally 把 `RELAY_RUN_ROOT` 恢复成调用方原值，随后一条断言假定它为空。不是本卡改动导致的语义回归。全量回归在清掉 `RELAY_RECEIPT`/`RELAY_RUN_ROOT` 的子进程里重跑。 | 本棒环境 `RELAY_RUN_ROOT=D:\relay-run-DHR_04\runs\RELAY-DHR04-20260816215716`；套件第 71–75 行 | 观察记录；本卡不改既有套件 | open |
| F-003 | P3 | B9 联证取 `git status --porcelain` 时，未跟踪目录默认只报 `?? src/` 不报文件。本卡联证用 `--untracked-files=all` 才能与 After−Before 文件快照交叉。后续卡写证据命令时不要漏这个开关。 | `_debug-git.ps1` 复现：porcelain=`?? src/` | 观察记录 | open |
| F-004 | P3 | 受限写联证只覆盖「未授权路径 + 环境拒写」一个象限（`src/gamma/locked/`），缺「授权路径在同一受限现场仍可写」对照腿。review1 原始要求是「证明越权写真的失败」，该象限已满足，且经 review4 独立验真（非管理员会话、真 `UnauthorizedAccessException`、`/deny`→`/grant` 变异恰红 2 条）。主控已裁决放行，不补测试。 | review3 R3-04 / review4 核成立；二次返工 brief 明确放行 | 观察记录；本卡不改测试 | open |

| F-005 | P3 | `-Mode all` 的顶层 `reason` 事实上恒为 `policy-violation:multi`：三 verdict 的允许集无包含关系，任何会失败的路径几乎必然跨族（连"纯 content 违规"`src/gamma/a.ts` 也因 dev-isolation 的 `unclassified-path` 而成双族），故"单族用原码"分支在 CLI 生产路径近乎不可达。**不是放行漏洞**——exit 1 正确、violations 逐条族码完整。属 reason 语义的观察精度问题；消费方按 violations 逐条分流即可。 | review6 R6-03：5 组单族意图输入 × `-Mode all` 顶层全 `policy-violation:multi`；GATE-2 变异禁用 multi 分支后套件恰红 | 观察记录；主控裁决放行，本卡不改 | open |
| F-006 | P3 | 覆盖闸只采集 `New-RelayValidationError` 参数、`reason =` 赋值及含 `verdict\|reason` 字样行上的 kebab 码，**守卫 `throw` 的码不在采集面内**。故本卡新增的 `policy-path-control-char` / `policy-path-quoted` / `policy-list-entry-not-string` 与既有 `policy-path-dotdot` / `policy-path-not-relative` / `policy-path-empty` 同待遇，闸门数仍为 70。不是漏登记，但意味着**守卫码的覆盖只靠套件自身断言保证**，闸门帮不上忙。 | `relay-contract-reason-coverage.ps1:55-76`；review5 已就既有两码核过同一结论 | 观察记录；若后续要把守卫码纳入闸门，属闸门本身的改动，不在本卡范围 | open |

| F-007 | P3 | **清单解析面整面不属于本卡，已另立 `DHR_22`。** `Invoke-RelayPolicyCheck.ps1` 现有「读文本文件 + 按 `[\0\r\n]+` 推断分隔符」的输入模式，是施工时为满足验收②③ 的 `git diff/status` 联证而长出来的，**不在本卡目标、非目标与三条机器证之内**——实施提示逐字要求「业务仓策略先做成只消费正式设计字段的**纯守卫**」，三条机器证也只说「以变更前后**路径集**证明」，从未规定守卫如何取得路径集。该面上已知三条残留：**R7-01/R8-02** `U+2028 / U+2029 / U+0085` 在文本与 JSON 字符串条目两条腿上都会把清单粘成一条路径，前缀落在 doc_root/production_root 即整坨放行（iso 与 landing EXIT=0）；**R8-03** 拆分正则认 `[\0\r\n]+` 而守卫正则拦 C0/DEL，两层对 TAB 的答案不同，排障语义不准。**这三条不是遗留缺陷，是待删面上的现象**——`DHR_22` 把输入收窄成 JSON 字符串数组后，同样的输入不再有歧义：`docs/…/x.md␨.dh-runtime/…` 作为**一个文件名**确实在 doc_root 下，放行是正确判定。 | review7 R7-01 / review8 R8-02、R8-03，两轮均判 P3 不阻塞；用户 2026-08-17 拍板拆卡 | 转 `DHR_22`（输入面收窄：只收 JSON 字符串数组、删分隔符推断；"路径集从哪来"归 DHR_12） | open |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
> 遗留（P0/P1 唯一合法路径）：状态列写 `遗留→<卡号 / backlog / 下计划名>（已确认）`——"已确认"三字代表用户已在对话里明确点头。AI 不得自行把 open 的 P0/P1 划成遗留。
