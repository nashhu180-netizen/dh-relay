<!-- dh:v1 -->
# 发现与停止线

- F-001（open / 环境）：HERDR_ENV 缺失，仓内要求“不在 Herdr 里就不要试图从外部控制它”（knowledge/herdr-派活操作.md §1）。无法取 w68 实态，不伪造身份、不读取实时 pane、不补跑旧演练。SW6 待真实 Herdr 管理会话。
- F-002（实施选择）：动态 list 的 agent 名字段为 agent，get 为 result.agent；列表历史 fixture 无 seq，因此每轮对已筛选成员执行 get，拒绝缺 seq 的快照，防止盲比。
- F-003（范围）：现有安装器只装五份文本，新增脚本需同源打包；同步安装器是让 SKILL 指针可执行的必要配套，不安装到现役用户配置或部署。

- F-004（open / 需求复核 HIGH）：同 workspace 编排通知造成 seq 回声，下轮循环通知；不得通过增排编排解决，局部去回声交独立 decider。原 FAIL 报告保留。
- F-005（open / 代码复核 P1）：通知后只核 seq，缺 working 核对，需加强确认并覆盖非 working 响应。
- F-006（decided / 主会话）：教训路径已查库且命中既有条目，适用且 PASS；不采纳 reviewer 将路径标 lessons-absent/N/A 的建议。“本卡不新入正式库”只表示候选去重，不改变必做复核适用性。原报告保留，执行策略不删路径。

- F-007（decided / 独立 decider）：采纳 decision-notify-echo.md 的确认 after-state 单目标同步方案，不增排任何成员；本轮通知窗口里目标自己的并发变化只有聚合状态，API 无事件级归因，文本如实写边界。其他成员不得被全空间刷新吞掉。F-004/F-005 已实施整改，待原 reviewer 定向确认；原始 FAIL 信号不覆盖。
- F-008（resolved / CLI 字段核实）：现役/历史 Herdr fixture 表明 list.agent 为 kind（codex/claude），不是姓名；因此成员 get 使用 pane_id，未命名成员的快照 key 也用 pane。脚本仍严格要求 get 中 seq，缺字段报 blocked，待 SW6 实态核字段兼容性。

- F-004/F-005（resolved）：review-code-recheck.md、review-requirement-recheck.md 独立 PASS，原失败报告/信号保持原字节。去回声窗口聚合边界已写入三份协议，不以“排除编排”规避。

- F-009（resolved / 同源入口摘要）：仓根AGENTS.md仍将watcher限定为wait/get/read，与用户明确“只起脚本与巡检”新合同冲突。将AGENTS watcher单句同步纳入本维护卡文档范围，先登记精确允许路径再修改；不增角色写权、不改完整模式、不改变用户目标/验收，派需求reviewer核同源入口。
