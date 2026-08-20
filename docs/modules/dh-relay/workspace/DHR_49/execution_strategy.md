<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。solo 任务可只填操作模型一行。 -->
# execution_strategy — DHR_49

## 操作模型

**solo（主会话 Opus 自干施工）**——用户 2026-08-20 在开工闸点选「全留主会话」，不委托 S1 brief / E4 需求复核 / E5 教训复核 / E6 miner / E7 as-built。

**唯一例外 = 复核**：两轮独立换人复核是硬闸（G6），施工者不复核自己的卡，故必派 fresh agent：

- **轮 1（批次小审合集）**：CP1 / CP2 / CP3 / CP4 四个检查点各派一个 fresh subagent，只看本批 diff 与证据。
- **轮 2（增量复核）**：收口时另派 fresh-context、未参与实施、不继承轮 1 会话上下文的独立实例，核全程 + 各批小审记录 + 收口增量 diff。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| CP1~CP4 批次小审（fresh subagent ×4） | **只读**：`<pilot>/relay-control-pilot/src/dsh-client/`、`<pilot>/relay-control-pilot/test/`、`<pilot>/evidence/dhr49/`、本工作区 `brief.md` / `task_plan.md` / `progress.md`。**零写权** | 主会话（开工闸已授权复核委托） |
| 轮 2 增量复核（fresh-context 独立实例） | 同上 + 可只读仓内已落账的轮 1 记录（`review.md`）。**零写权** | 主会话 |

- 只读形态按 `references/复核只读派发.md`；`review.md` 登记可区分的实例/会话身份。
- 复核派出前先 `dh dispatch` 在 `progress.md` 落 `review-dispatch` 行，再在 `review.md` 引用 `e:E-xxx`。

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标「待验收」。
- 子 agent 默认无写权，要人批准。
- **本卡专有**：CP2 列表屏中途闸是计划内强制暂停——用户未明示放行前不得开工详情屏编码，不设超时自动放行。
- **本卡专有**：不自裁 DSH 三态（`passed / passed-with-constraints / stopped-by-pilot`），只登记事实，三态归 DHR_50 人判。
