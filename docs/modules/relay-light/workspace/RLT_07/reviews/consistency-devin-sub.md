# review — RLT_07 一致性（devin-sub, fresh）

> 独立复核路径 consistency；只读闭集比对（design ↔ DevPlan ↔ relay_log.py/TOML ↔ 交付物 ↔ tests）。verdict 与逐条发现如下。

```text
REVIEW verdict=REQUEST_CHANGES
path=consistency card=RLT_07
findings=P0:0 P1:1 P2:2 P3:5
```

## 发现表（严重级|位置|问题|建议）

| 严重级 | 位置 | 问题 | 建议 |
|---|---|---|---|
| P1 | SKILL.md+双 adapter vs §3.4/§3.5/§5.2.1/§9 与 relay_log.py:823-832,858-879,886-889,1081-1087 | `add` 强制的 note 合同与控制事件在 skill 三件中整体零命中（`decider=`/`strategist=`/`stage_id=`/`outcome=`/`plan_loaded`/`stage_start`/`monitor_launch`/`node_start`/`stage_close`/`monitor_restart`/`plan_amend` 均无匹配）。实现强制：`escalate` 必须恰一 `decider=<名>#<n>`/`strategist=<名>#<n>` helper token 否则 A69 exit 2；`decision` 须复述同一 helper；`stage_result` 必须 `stage_id=`+`outcome=`；stage 事件必须 `stage_id=`；决策类事件记被阻塞/触发 agent 名下、strategist 生命周期事件记 `strategist#n` 自己名下、`escalate` 可作链首无 blocked。SKILL.md 只有状态机骨架与一句 mode 说明——照现文档操作，监工/编排写出的第一个控制事件与第一个 escalate 都会被账本拒且无文可解 | 在 SKILL.md 账本用法节补：控制事件清单与写者、`add` 强制 note 字段（`stage_id=`/`outcome=`/helper token 语法）、决策链事件归属与 strategist 链特例 |
| P2 | SKILL.md R 模板 vs §4.2/§6.1 | R scribe 行 `trigger` 留空但 note 写「监工在全部 reviewer done 后拉起」——§4.2 明文「留空 = 节点开始即发起」且留空是给「批内持续在场的角色」；同时「机器体检与四道闸（scribe 跑脚本）、miner」在单节点 R 模板里没有任何 agent 行或时机槽承载（§6.1「按上述分节点」与 §10.1 单节点样例本身两可） | 为 R scribe 交代真实拉起时机（注明空 trigger 例外含义），并让体检/四道闸/miner 有落点 |
| P2 | 双 adapter vs §7.2 | 前台阻塞循环的三分路丢了 `blocked` 支路：adapter 写「返回 `idle`/`done`/`blocked` 后先读产出判断是否合格，再写账本的 `done`」；design 分路为「blocked → 记 blocked 走升级；done/idle → 读产出→记 done」。照此 blocked 返回会被误记 done | 按 §7.2 原文补回 `blocked` 分路 |
| P3 | SKILL.md lint 签名 vs relay_log.py:1862-64 | `lint --plan <dir> [--json]` 的 `--json` 无实现（lint parser 仅 `--plan`/`--config-dir`），照抄 design §3.1，A80 owner 是 RLT_10——冻结先于实现 | 加注「`--json` 随 RLT_10 落地」防读者按签名调用即报错 |
| P3 | SKILL.md 占位符双拼写 | 模板/清单用 `review.<路>.md`，硬规则 5 用 `review.<路径>.md`（承设计原文）；`decision.<n>.md`（design）vs `decision.<d>.md`（SKILL，轮1修复）语义同字母歧义 | 统一写法或在清单注明等价 |
| P3 | review.md 轮1行 vs code-round1 报告 | review.md 称「P2×1+P3×9 全部整改或转需求路」，但报告末条 P3（关键词断言强度）实为「不整改：oracle 证法强度符合档位」——既不属整改也非转路 | 如实重述为「9 条 P3：8 条整改/转路、1 条维持原判」 |
| P3 | progress.md 批次证据 vs task_plan 交接清单 | progress 记 commit「已推 #11」，task_plan 明「construction Node 不 commit」——提交者与授权链未记录 | progress 补记提交责任人及授权出处 |
| P3 | execution_strategy.md | 仍是 W 期快照（「D-start 未授权」「授权列全待主控填写」），与三批完成/轮1闭合事实并存；RLT_05 同款先例（冻结快照不更新） | 若为既定约定则知悉，否则补「授权实况以 progress.md 为准」 |

## 已核对一致项（供主控采信）

- 事件目录闭集：skill/adapter/模板出现的账本事件名全部 ∈ relay_log.py 事件集；状态机行与设计 §3.4 句式逐字同构；checkpoint 不增 attempt、新实例归 #1 一致。
- 模板↔lint：节点类型闭集；`on:done:coder`/`on:blocked`/`close=agent:checker` 等判定串逐字一致；三档 recipe 展开后 A116 reviewer 集合可过。
- 占位符三方一致：清单八项 = 模板实际使用集 = 测试 `_fill` 替换集。
- 决策文件序号：`decision.<d>.md` 全卡递增，C/X 共享计数器不互覆盖。
- TOML↔文档：11 角色名逐一等于 roles.toml 键；模型名仅存于 roles.toml；落点约定一致。
- 双 adapter 隔离：`~/.codex`/`~/.claude` 零交叉；命令模板结构同构。
- workspace 内部：F-001 resolved/F-002 open 四处一致；轮1 verdict 与报告一致；skip 理由逐字对应 F-002。
- 测试↔文档：29 条新测试断言字面量在交付文件中全部存在。

## 未能执行（主控处理）

只读环境无 exec/git 权限：未实跑测试复证、未查 commit 作者、未核 name-only 边界。
