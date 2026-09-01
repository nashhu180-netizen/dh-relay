<!-- dh:v1 · review-brief — DHR_70 轮 2b 整改复验（收口最后一道）。主控写，复核者只读。 -->
# review-brief · DHR_70 · 轮 2b 整改复验

## 你是谁 / 不是谁

你是**复核 worker**，不是主控。只读、不改任何文件（codex `--sandbox read-only`）。
不要派活、不要回头问用户。先读仓根 `AGENTS.md`「编排协议段 → 复核 worker」。

你是 fresh 实例，**不继承本卡前五路（`dhr70rev1` / `dhr70rev1b` / `dhr70rev2` / `dhr70req` / `dhr70con` / `dhr70les`）任何会话**。它们的结论都已落盘，你只读、**不假设它们对**。

## 基线怎么定（重要）

**不要用任何写死的 commit。** 你的 cwd 就是任务 worktree，`git rev-parse --short HEAD` 是什么就审什么，并在形态自述里**写出你看到的 HEAD**。

- 全卡：`git diff master..HEAD`
- 本轮主战场（轮 2 之后的全部整改）：`git log --oneline b6a3b47..HEAD` 与 `git diff b6a3b47..HEAD`

（上一批派单把基线写死成 `b6a3b47`，导致需求路把已修好的缺口又报了一遍——本卡记为 L-7007，所以这次改成让你自报。）

## 背景：轮 2 给的是 changes-requested，五条整改要你验

| 编号 | 谁提的 | 问题 | 主控怎么处理的 |
|---|---|---|---|
| F-70-R2-01 (P2) | `dhr70rev2` | A2 只证了口径后半句——轮询把 `lease-lost` 响应整个丢弃，"旧 actor 拒绝且零 mutation"从未被断言 | A2 每次被拒都走 `assertRejected`（`E_LEASE_HELD` + 零 Result）+ `events.jsonl` 逐字节不变，加 `refusals >= 1` |
| F-70-REQ-01 (**P1**) | `dhr70req` + `dhr70con` 裁决 1/2 独立收敛 | design/12「Gate 生命周期」末句字面禁止从 drivers map 删 gate，实现却先删后重建 → 「契约无变化」声明不成立 | **用户对话授权扩路径**，同步 design/12 该句 + DevPlan 允许路径 + review 声明改「契约同步」 |
| F-70-REQ-02 (P1) | `dhr70req` | A2 未证明零 mutation 与合法换届 | 判为**提出时已过期**（派单基线写死所致），缺口由更早两笔提交闭合 |
| F-70-LES-01 (P2) | `dhr70les` | 真重蹈候选-48：用"隔离单跑一次绿"推出"零新增失败" | 三轮全量 + master 同条件对照，见 `progress.md` E-7016 |
| F-70-LES-02 (P2) | `dhr70les` | 门槛账本缺 exit code / wall-clock | E-7015 / E-7016 补记 |

材料都在 `docs/modules/dh-relay/workspace/DHR_70/`：`review.md`（五路登记 + AI 提交区）、`findings.md`、`progress.md`（证据账本 E-7002~E-7020）、六份 `review-*-codex.md` 复核者原文。

## 你要判什么

按 P0/P1/P2/P3 定级，无发现也要明说。**最后必须给总结论**。

1. **五条整改逐条判闭合性**。特别是：
   - F-70-R2-01：新加的 `assertRejected` + 逐字节比对 + `refusals >= 1`，**真的能挡住**"被 fence 期间写非 Result 事件、之后再正常重建"的实现吗？请具体推演。
   - F-70-REQ-02 判为"过期"是否成立？还是主控在用"派单基线"当挡箭牌回避一条真问题？**这一条请带着怀疑去看。**
2. **契约同步改得对不对**（本轮最重要）。读 `design/12`「Gate 生命周期」改后的原文 + 那段 DHR_70 同步说明：
   - 新措辞有没有**顺手放宽**什么？尤其"单写者一律不放宽"这句在代码里成立吗？
   - 它与 `service.mjs` 实际行为**逐字对得上**吗？
   - 有没有超出用户授权范围（授权仅限「Gate 生命周期」一节措辞）而改到了 §4 验收清单、reason code 表或别的小节？请用 `git diff` 核，**不要只读改后的文本**。
3. **变异证据是否可信**（`review.md` 变异点登记表 + `progress.md` E-7017）。轮 2 选的点是 `service.mjs:474` 反转判据，预测 A2 红在 `assert.equal(settled.error, undefined)`，**实际红在 `refusals >= 1`**，且 A3-1 也连带变红。主控给的解释是"判据反转是双向的，`lease-lost` 反被吞掉"。请独立判断：
   - 这个解释成立吗？
   - 红因与"该保护唯一负责的场景"对得上吗（候选-45 的要求）？
   - hash 链（施加前/后/还原后）是否自洽？
4. **F-70-LES-01 的新证据够不够**。三轮 18/15/14 + master 同条件对照差集为空 —— 这足以支撑"本卡零新增失败"吗？还是仍有过度声称？主控把结论收窄成了"零新增**稳定**失败"，这个收窄准确吗？
5. **E8 填的 AI 提交区**：完成条件 A1~D 的证据挂得实不实？验收项元数据表里 DHR_70-C 记「部分覆盖」而非「等价覆盖」，这个自我降级是否诚实且必要？H=0 声明成立吗？
6. **越界**：`git diff --name-only master..HEAD` vs DevPlan `dh:allowed-paths:v1 task=DHR_70`（注意该清单本卡内被改过两次：design/12 与 DevPlan 卡节属**用户授权扩入**，`as-built/relay-core.md` 属**按 brief 既有声明补登**）。这两次变更本身合理吗？有没有"自己给自己开路径"的成分？
7. **整改有没有引入新问题**（止损换人硬条）。

## 硬边界

- 只读。跑不了测试就如实申报「仅静态审」。
- 只写事实与级别，但**轮 2 复验要给总结论**：`approved` / `changes-requested` / `需人裁决`。
- 密钥/凭据值永不出现在结论里。

## 产出格式

完整结论输出到 stdout（主控会落盘为 `review-code2-reverify-codex.md`）：

```
## 形态自述（含你看到的 HEAD short sha）
## 五条整改逐条闭合判定
## 契约同步正确性判定（含 git diff 核出的实际改动范围）
## 变异证据可信度判定
## 新发现
## 逐点结论（上面 7 点）
## 轮 2b 总结论：approved / changes-requested / 需人裁决
```
