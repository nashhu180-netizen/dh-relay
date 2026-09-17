# findings — RLT_24

本节点无。后续 coder 只在此记范围外发现、阻塞与证据，不顺手越界修改。

## C1

- F-C1-01（范围外发现，转派候选项）：`tools/relay-light/skill/SKILL.md`、两份 adapter 模板与 `docs/modules/relay-light/as-built/` 尚未收录 `resource_close`（词表、写入者归属、wire format、关后记账纪律）。本卡允许路径不含这些文件，按 README 规定只登记不修改；建议收口时由编排评估是否派单同步。
- F-C1-02（口径记录，非阻塞）：A51 静态闸 `assertNotIn('"pane"', source)` 禁源码出现双引号 `"pane"` 字面量，而 §3.4 要求 `object_type=pane` 枚举值。按字面口径用单引号 `'pane'` 承载枚举值实现，守卫本身未改、语义（账本不记 pane ID 结构字段）未放松。
- F-C1-03（口径记录，非阻塞）：design §3.4「add 拒绝时点」表按 19 词时代的次序写「写入者/node 校验 → note 校验」，但 `resource_close` 的法定写入者由解码后 `object_type` 决定，客观上必须先解析 note 才能做归属比对。C1 保持「追加前全量校验、任一不合法退 2、字节不变」的硬承诺，校验顺序为 node→agent 类→note 语法→写入者归属→node 归属。
