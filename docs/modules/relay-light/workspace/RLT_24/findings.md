# findings — RLT_24

本节点无。后续 coder 只在此记范围外发现、阻塞与证据，不顺手越界修改。

## C1

- F-C1-01（范围外发现，转派候选项）：`tools/relay-light/skill/SKILL.md`、两份 adapter 模板与 `docs/modules/relay-light/as-built/` 尚未收录 `resource_close`（词表、写入者归属、wire format、关后记账纪律）。本卡允许路径不含这些文件，按 README 规定只登记不修改；建议收口时由编排评估是否派单同步。
- F-C1-02（口径记录，非阻塞）：A51 静态闸 `assertNotIn('"pane"', source)` 禁源码出现双引号 `"pane"` 字面量，而 §3.4 要求 `object_type=pane` 枚举值。按字面口径用单引号 `'pane'` 承载枚举值实现，守卫本身未改、语义（账本不记 pane ID 结构字段）未放松。
- F-C1-03（口径记录，非阻塞）：design §3.4「add 拒绝时点」表按 19 词时代的次序写「写入者/node 校验 → note 校验」，但 `resource_close` 的法定写入者由解码后 `object_type` 决定，客观上必须先解析 note 才能做归属比对。C1 保持「追加前全量校验、任一不合法退 2、字节不变」的硬承诺，校验顺序为 node→agent 类→note 语法→写入者归属→node 归属。
- F-C1-04（**阻塞，待 decider/编排裁定合同**，check.C1.md P1 #1 整改 r1 触发）：冻结 wire format 下 `object_type=workspace` **无法可靠区分阶段空间与编排空间**，故「编排空间非 F 首有效 node 退 2」（task_plan.md L34/L76）无可实现判据。证据：①design/01 L319 与 decision.1.md §2.2 均写「`workspace`（阶段空间与编排空间）」——两类共用同一枚举值；②wire format 键闭集仅 `object_type/object_id/outcome/reason` 且明写「不设额外可选扩展键」（design/01 L318）；③`object_id` 仅约束「非空非纯空白 UTF-8、可辨识的真实资源标识」（L312），设计/decision.1/skill/adapter/relay_plan schema 均无终端空间命名约定（空间是 `herdr workspace create` 运行时资源，计划表不含其标识）；④node 位置不能区分——F 首有效节点同时是 F 阶段自身空间与编排空间的合法指向，C1 处一条 `workspace` 关闭行在「C 阶段空间」读法下合法、在「编排空间」读法下非法，行内容完全相同；⑤checker 复跑用 `object_id=orchestrator-ws` 辨认编排空间，本质即命名猜测，派单明令「不靠猜 object_id 命名」。实现侧三个候选都越界：按 object_id 模式匹配＝猜命名且双向不可靠；增键/增枚举值＝改冻结 wire format，超出允许路径（RLT_24 不改设计正文，O-005 裁决设计变更走规划事件）。**现实现覆盖的可计算边界**：node 存在且非 superseded；`workspace`/`pane` 的 node 为其所在阶段首有效节点；`worktree` 的 node 为 F 阶段首有效节点——「编排空间→F」在当前合同下只能是写入者纪律（类似 §13「不做写入者身份校验」的定位），不能由校验器机械执行。候选裁定方向（不替裁决）：a) 设计层冻结 `object_id` 命名约定或保留前缀；b) wire format 增区分键/`object_type` 枚举（新 A 事件）；c) 把该判据改述为「写入者纪律 + C4 取证人验」并修订 task_plan；d) 其它合同变更。裁定前 C1 维持已提交实现不动。

## C2

- 本批无新发现。F-C1-04 已随 `decisions.md` 第 1 行用户裁决（选项 A，降为写入者纪律）与 task_plan r2 闭合，C2 不受影响。
