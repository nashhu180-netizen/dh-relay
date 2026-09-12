# review — RLT_07 代码轮 2（devin-sub, fresh）

> 独立复核路径 code-round2。评审期间 HEAD 由 `51e3bc2` 推进到 `2283e0e`（并发教训路落盘，`git diff 51e3bc2..HEAD -- tools/` 为 0 行），四件代码交付物字节未变，结论对当前 HEAD 有效。

```text
REVIEW verdict=APPROVE_WITH_NITS
path=code-round2 card=RLT_07
findings=P0:0 P1:0 P2:0 P3:5
mutation=tools/relay-light/skill/SKILL.md:64 C模板节点行close列; agent:checker→agent:coder; 合同破坏(A95 close闸角色); SkillTemplateTests.test_a95_a133_c_template_shape; 施加dd57de48f3067db06961ef4ed0e2e20409d77f6af1251d65cc544f970ca7a85d; 还原8f15d9143a940c1b9a95dd7d2d56c7586c09f10f61d8292fcb0ed8f128ea7348(=施加前,字节一致); FAILED failures=1 AssertionError 'agent:checker' != 'agent:coder'(类级Ran 12: 1 failure+2 skipped,仅此一红)
full_suite=Ran 137, OK, skipped=2 (199.1s; 两条skip即F-002钉住的decision_mode负例腿)
```

## 发现表（严重级|文件：行|问题|建议）

| 严重级 | 文件：行 | 问题 | 建议 |
|---|---|---|---|
| P3 | test_relay_log.py `test_a100_terminology_not_mixed` | 只扫 SKILL.md，两 adapter 不在扫描面；轮1 修的 `<workspace>`→`<任务工作区>` 无测试钉住，adapter 回退永远绿 | 扫描面扩到 `self.ADAPTERS`；加 `assertNotIn("<workspace>", adapter_text)` 或实现 oracle 中文语境裸 workspace 检查 |
| P3 | test_relay_log.py `test_a19` | 断言未钉 oracle 原文 `python`——回退成「直跑测试」仍绿 | 增 `assertRegex(text, r"直跑.{0,6}python.{0,6}测试")` 或字面断言 |
| P3 | test_relay_log.py `assert_rejected` | 只钉 `^error: ` 前缀不钉规则码；基类同名方法有 `code=` kwarg 逐点钉 HC-RL 编号——错误规则触发的拒绝也会被判通过 | 加可选 `code` kwarg，strategist 腿钉 A97、attempt 腿钉 A49/A58 |
| P3 | test_relay_log.py `test_a136` | 枚举要求行内含 `--plan`——不带 `--plan` 的调用行逃逸 `--config-dir` 检查（当前模板全带，理论漏洞） | 枚举放宽为「含 `<RELAY_LOG>`/`relay_log.py` 的全部非注释行」再按子命令过滤 |
| P3 | SKILL.md A117 行 vs oracle | oracle「DevPlan 任务卡 任务类型 字段」vs SKILL「task_type 字段」 | 非本卡缺陷；转一致性路终裁是否并记两称 |

## 轮 1 逐条闭合验证

全部轮 1 发现核实：P2 `decision.<d>.md` 闭合属实（占位符清单+模板+测试三侧同步、无 `decision.<k>` 残留）；A132 边界类、`<任务工作区>`、A136 双形态、A12 骨架断言（实证 25bdbcb 骨架 frontmatter 恰含「由 RLT_07 交付」，断言非空转）、strategist cancelled 终例+归属断言均闭合属实；helper 强度「部分闭合」（所列缺口已修、code 钉未含——见 P3-3）；A19 文档侧闭合（测试未钉 python——P3-2）；A21 转需求路属实。

## 其他核查结论

- 测试有效性：无「永远绿」现行实例；模板真装计划过三档 lint；行为断言全部命中 relay_log.py 已实现校验（A49/A58/A60/A69/A74/A97），变异实证断 close 闸则 A95 红。
- 边界：`git diff origin/master --name-only` 13 文件全在 allowed-paths；`git status` 仅 `__pycache__`；`git diff --check` 干净。
- F-002：skip 理由链与 findings 一致，如实挂账。
- 无 blocked。
