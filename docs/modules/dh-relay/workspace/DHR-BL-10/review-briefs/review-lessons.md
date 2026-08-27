# review-brief · DHR-BL-10 教训复核（E5 · normal 配方第 3 路）

你是 dh-relay 的**教训复核 worker**。**只读，不改任何文件。** 不派活、不问用户。结论输出到 stdout。

## 你要回答的两个问题

1. **本卡有没有违反本仓已登记的教训？**（往回看）
2. **本卡有没有值得沉淀的新教训？**（往前看）

## 读什么

1. `docs/modules/dh-relay/knowledge/教训库-候选.md` —— **16 条既有候选，逐条过一遍**，别只挑眼熟的
2. `git diff` + `git status` —— 本卡实际改动
3. `docs/modules/dh-relay/workspace/DHR-BL-10/findings.md` F-001~F-008
4. `docs/modules/dh-relay/workspace/DHR-BL-10/lesson_candidates.md` —— 施工方已起草的候选
5. `docs/modules/dh-relay/workspace/DHR-BL-10/progress.md` —— 实际过程（含两次返工、一次网络中断）
6. `docs/modules/dh-relay/workspace/DHR-BL-10/review-logs/review-round1.codex.md` —— 代码轮 1 结论

## 已知的一条（主控已发现，你要独立复核它的处置对不对）

**候选-5**：「PowerShell 默认比较大小写不敏感，冻结枚举必须用 `-cin/-ceq/-cne` 或 Ordinal 比对，且修一处要全库 grep 同类算子」

本卡最初把 `$Cli -ceq 'claude'` 改成了大小写**不敏感**的 `switch`，与该教训方向相反；主控发现后加派返工轮 2，
改成 `switch -CaseSensitive` + `default{throw}`。

请你独立判断：
- 这个处置是否真的满足候选-5 的口径？还是只是"看起来像"？
- 候选-5 明文要求的「全库 grep 同类算子」这一步，本卡有没有真做、做全没有（看 F-008）？
- 有没有别的既有候选也被本卡踩到而无人发现？

## 逐条过 16 条候选

对每一条给一个裁决：`本卡未触及` / `本卡遵守了` / `本卡违反了（附证据）` / `本卡本可应用但没用上（附建议）`。
**禁止跳过**——16 条要逐条列出来，哪怕结论是"未触及"。
特别留意这几条与本卡形态接近的：候选-1（分支断言）、候选-4（brief 内部引用先核）、候选-5（大小写）、
候选-6（断言要配变异对照）、候选-11（补丁只治被指出的实例）、候选-12（证据只覆盖一部分却写成整条兑现）、候选-14（声称同口径要读源文件核）。

## 新教训候选

评估施工方在 `lesson_candidates.md` 起草的条目（L-001~）：够不够格、措辞准不准、有没有和既有 16 条重复。
再补你自己认为该沉淀的。本卡过程里这几件事值得你考虑：
- 派 AI worker 给自己所在的工具链接线（自举 dogfood）的风险与收益
- worker 被网络中断时，「禁止 git stash/reset」这条铁律实际起了什么作用
- `--help` 列出的参数不等于实现支持（zcode `--max-turns`）
- 主控写的 task_plan 里行号写错（as-built 21 vs 实际 9），worker 纠正了——这属于哪条既有教训

## 输出格式

```
## 结论：过 / 有违反
## 16 条候选逐条裁决
| 候选 | 一句话 | 裁决 | 证据 / 理由 |
## 候选-5 处置的独立判断
## 新教训候选评估
| 来源 | 一句话教训 | 我的裁决(够格/措辞需改/与候选-X重复/不够格) | 理由 |
## 我建议新增的候选（若有）
```
