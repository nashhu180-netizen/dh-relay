# review — RLT_07 需求方向（devin-sub, fresh）

> 独立复核路径 requirement；只读复核。verdict 与逐条发现如下；行号以 `wt/RLT_07` HEAD 51e3bc2 为准，T = test_relay_log.py。

```text
REVIEW verdict=APPROVE_WITH_NITS
path=requirement card=RLT_07
acceptance=A12=命中 A19=命中 A21=部分 A26=命中 A27=命中 A66=命中 A67=命中 A95=命中 A96=部分 A98=命中 A100=命中 A102=命中 A103=命中 A113=命中 A114=部分 A117=命中 A127=命中 A132=命中 A133=命中 A136=命中
findings=P0:0 P1:0 P2:0 P3:7
```

## 20 条逐条核对摘要

| ID | 结论 | 交付物证据 | 对应测试 |
|---|---|---|---|
| A12 | 命中 | 五件齐；SKILL.md 六小节齐 | T:3327/3331/3833 |
| A19 | 命中 | SKILL.md「直跑 python 测试，命令与输出原样记入 progress.md」 | T:3349 |
| A21 | **部分** | 分句1命中（等待节逐字含规则+三方式+前台回退）；分句2字面未满足——面向监工/编排的 prompt 模板不存在 | T:3800 |
| A26 | 命中 | 双 adapter 三平台命令、claude kind 起法、stalled 处置齐 | T:3813 |
| A27 | 命中 | SKILL.md 硬规则1 + 两 adapter 派活模板凭据禁令 | T:3355/3825 |
| A66 | 命中 | 四行小结+缺项写「无」；scribe 三素材+不得发明 | T:3367/3372 |
| A67 | 命中 | findings/lesson→coder、progress→scribe、reviewer→review.<路>.md | T:3380 |
| A95 | 命中 | C 模板逐格核：trigger 空空、`on:done:coder`、`on:blocked`、`close=agent:checker`；三档 lint 干净 | T:3579/3563 |
| A96 | **部分** | 正例腿全中；consult 缺 user_decision 拒绝腿 skip 钉 F-002 | T:3649；skip T:3680 |
| A98 | 命中 | 落 `docs/modules/<模块>/relay/<plan_id>/` 不进任务工作区 | T:3344 |
| A100 | 命中 | 两术语定义+不得混用；adapter 用 `<任务工作区>` | T:3360 |
| A102 | 命中 | checkpoint 往返不耗 attempt | T:3595 |
| A103 | 命中 | X1 内 coder 从 #1 起、无前因 #2 被拒 | T:3622 |
| A113 | 命中 | done 后重拉拒、cancelled 后 #2 接受、agent_lost/stage failed 前因覆盖 | T:3609 + 存量 T:917-928 |
| A114 | **部分** | strategist 链全中（含 cancelled 终局、事件归属逐条）；decider 两负例腿 skip 钉 F-002 | T:3708/3744；skip T:3680/3696 |
| A117 | 命中 | 「唯一来源是任务卡的 task_type 字段…缺失停下问用户」 | T:3337 |
| A127 | 命中 | 节点类型闭集五类型，无 kickoff/verify | T:3572 |
| A132 | 命中 | 三份 md 对模型名零命中；测试闭集+词边界+排除 TOML | T:3389 |
| A133 | 命中 | C 模板默认含 checker 行 | T:3579 |
| A136 | 命中 | 每 adapter 7 个调用行全带本侧 `--config-dir`；测试认双形态 | T:3773 |

## A21 分句2 终裁

字面未满足、语义已满足 → 部分命中（P3）。理由：①硬规则约束对象是发起等待的一方（监工/编排），塞进监工→agent 派活模板属错受众；②但按字面，「监工与编排的 prompt 模板」载体应是面向监工/编排的派单 prompt，两份 adapter 中此类模板不存在；③语义上规则原文已逐字落在两 adapter 等待节，adapter 本身是监工/编排角色的权威指令源；④DevPlan 卡段自述口径完全满足，design §11 oracle 多分句更严。**建议**：(a) 按意图闭合并记录解读，或 (b) 补一段面向监工/编排的派单 prompt 片段含规则原文——勿改 agent 派活模板。

## 发现列表（严重级|位置|问题|建议）

| 严重级 | 位置 | 问题 | 建议 |
|---|---|---|---|
| P3 | 两 adapter 派活模板 | A21 分句2：等待硬规则原文未进任何 prompt 模板 | 见上终裁（主控已选 b：补监工/编排向片段） |
| P3 | task_plan.md L31 vs progress.md | task_plan 约定「oracle 只能越界满足→BLOCKED+停止」，实际以 skip 钉负例腿+F-002 继续施工；B2 小审事后批准 | 程序性记录，非缺陷 |
| P3 | SKILL.md A117 行 | 「任务卡的 task_type 字段」vs oracle「DevPlan 任务卡的 任务类型 字段」 | 语义等价；补「DevPlan 任务卡」锚定更稳 |
| P3 | adapter 派活模板首行 | `[relay-light] node=<n> role=<角色>` 与 A34 冻结标头不同形；「等 node_closed」指向 Runner 时代信号——relay-light 无 node_closed，A34 意图恰是「完成即停不等」 | A34 属 RLT_08 验收但工件在本卡；主控决定现在对齐或交 RLT_08 |
| P3 | SKILL.md R 模板 scribe 行 | trigger 空的形式语义是「节点开始即发起」，note 却写「全部 reviewer done 后拉起」——trigger 三态无法表达等 N 个 done | 在 note/正文补一句消除歧义 |
| P3 | SKILL.md decider/strategist 行 | 漏 design §2 的「可在方案文件里提出需要改计划」——plan_amend 归 RLT_09 | 补一句前向引用 |
| P3 | findings.md F-002 | 退出码证据以散文记录，未贴逐字探针命令/输出 | 附两行探针命令与实测 rc |

## 其他靶子结论

- A96/A114 如实性确认：relay_log.py 无任何 decision_mode 分支，F-002 事实准确。
- 范围抢跑：无。watch 仅标「未实现」；无 plan_amend/planner-amend/e2e/runner 触碰。
- 术语/职责语义、workspace 质量均过。
- 无法执行项：无 shell 权限未跑测试/边界命令（依据 progress 记录与轮1主控实证）；F-002 补门与 A21 取舍归主控。
