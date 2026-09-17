# R3 · reviewer — 教训路（标准档必做，代码轮 1 闭合后与需求路并发）

先读同目录 `README.md`。你是**复核**，只读不改、不提交，做完即停。**不采信施工者自述，自己回原始来源核。** 工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_24`。

## 判据（逐条 PASS/FAIL，FAIL 给 P1/P2 与整改动作）
1. **来源教训回流**：RLT_11 F-004 以及 RLT_12 `workspace/RLT_12/progress.md` E-003（空槽）指出的「关闭无事件位」现象，在实现与证据里是否被闭合，而非仅加了一个词表项。
2. **与既有教训冲突或重犯**：对照 `docs/modules/dh-relay/knowledge/教训库-候选.md` 与 relay-light 各卡 `lesson_candidates.md`（`grep -l` 账本/schema/向后兼容/fixture/`__pycache__`/字节 相关条目）——本卡是否重犯（例如测试写入仓内账本、dotted 单测入口、`__pycache__` 入树、只测 add 不测 lint、状态派生漂移）。
3. **本卡 lesson_candidates.md / findings.md**：W2、checker、code-round1 抓出的 P1 模式是否已登记为候选教训（现象 / 为什么 / 下次怎么做）；需转派的范围外项（如 skill SKILL.md 控制事件表、adapter、as-built 未含 `resource_close`、`HC-RL-A85` 旧口径）是否在 findings 登记且写明建议承接方，没有被顺手改。
4. **不越界**：`git diff master --name-only` 只含允许路径；历史 workspace 工件、design、DevPlan、skill、`docs/modules/relay-light/relay/**` 均无变化。

## 产出
`workspace/RLT_24/review.lesson.md`：
```
## 结论
APPROVE | REVISE   （有任一 P1 即 REVISE）
## 逐条判据
| # | 判据 | 结论 | 级别 | 依据（文件:行） | 整改动作 |
## 范围外发现
```
并在 `review.md` 登记 lesson 行。信号：
```
DONE task=RLT_24 role=reviewer-lesson node=R3 status=<APPROVE|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: review.lesson.md, review.md
```
