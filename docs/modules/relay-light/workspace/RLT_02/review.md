<!-- dh:v1 -->
# review — RLT_02 与现役 Runner 一致性对照

## 独立复核区

本卡任务类型为 `light`：复核配方是**教训复核 + 一致性复核**两路，无代码轮次，不要求有效单测。施工者未参与复核；各轮均在 `git archive HEAD` 加当轮候选的不可写快照中完成。

### 教训复核

| 轮次 | 复核者 | 发现与处理 | 结论 |
|---|---|---|---|
| 初审 | `rlt02les`（fresh Terra high，只读） | P1 LES-01：29 条归纳行不能证明枚举闭集；P1 LES-02：v1 `replanner` 被压进 planner；P2 LES-03：README 不能代替行为源码。全部采纳 | changes-requested |
| 返工复验 | `rlt02les2`（fresh Terra high，只读） | LES-01/02/03 已闭合；新增 P1 LES-04：用无仓内证据的“v2 暂停”状态排除 comparator | changes-requested |
| 单点复验 | `rlt02les3`（fresh Terra high，只读） | 删除运行状态断言；保留“C-005～C-007 的 relay/v1 是本卡 comparator，五份 as-built 已读，v2 是并列实现但不在本卡验收范围” | approved；P0/P1/P2/P3=0 |

教训复核实际回读候选-5、候选-11、候选-12、候选-14、候选-34、候选-37、候选-57。最终确认：闭集先列后断言，枚举不靠省略号，说明文档不代替源码，局部 comparator 不泛化为“全部现役实现”。

### 一致性复核

初审复核者 `rlt02con`（fresh Terra high，只读）发现：P1×1（“现役 Runner”范围未与 v2 快照消歧）、P2×2（v1 replanner 的 node/receipt/proposer 语义遗漏；v1 12 个 event kind 未逐项映射）。Terra high 施工实例 `rlt02fix` 返工后，由新实例 `rlt02con2` 复验，原 1 个 P1 与 2 个 P2 全部闭合，P0/P1/P2/P3=0。

<!-- dh:consistency-review:v1 task=RLT_02 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| comparator 范围 | task_plan C-005～C-008；`tools/contracts/`、`tools/runner/`、`tools/host/`；五份 as-built | 一致 | 无需处置：代码 comparator 明确限定 relay/v1；v2 只作并列实现范围消歧，不作运行状态判断 | `rlt02con2` 复验 P1=0 |
| 角色闭集 | relay-light 11 角色；v1 node role 3、receipt role 3、proposal proposer 2 | 一致 | 无需处置：新增角色#12 独立裁决 `planner-amend ↔ replanner`，三种 v1 身份均已消费 | 对照 §2、§5；`rlt02con2` |
| 事件闭集 | relay-light 9 控制事件 + 10 agent 事件；v1 event kind 12 | 一致 | 无需处置：50 项主矩阵逐项归组，v1 12/12 无省略号 | 对照 §3、§5；`rlt02con2` |
| 节点与关闭闭集 | 两侧节点字段/状态、agent/final 终态、terminal 状态、阶段收尾与 host 结束谓词 | 一致 | 无需处置：另列闭集补充并指向节点#1～#5、关闭#1～#5 | 对照 §1、§4、§5；`rlt02con2` |
| 禁改边界 | `tools/runner/`、`tools/host/`、`tools/contracts/`、`relay-core/`、`docs/modules/dh-relay/` | 一致 | 无需处置：两次 `git diff --stat` 原样为空，本卡只改 relay-light 对照与工作区 | task.md 2026-09-09/10 证据 |

最终可复算结果：30 条归纳裁决（节点 5、角色 12、事件 8、关闭 5），全部为有意差异；50 项主矩阵（11 + 3 + 3 + 2 + 9 + 10 + 12）全部映射；节点与关闭另有闭集补充；在本卡限定的 relay/v1 comparator 内遗漏 0。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：本卡只证明 relay-light 与 task_plan 冻结的 relay/v1 comparator 的四类语义对照完整；不证明 relay-core v2 与 relay-light 一致，也不改变任何实现。

**需求对齐证据**：

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| HC-RL-A14：节点/角色/事件/关闭逐项裁决，现役实现零修改 | 读对照四张归纳表和 §5 闭集矩阵；复算 30 条归纳、50 项矩阵；检查五组禁改路径 diff | `as-built/现役Runner一致性对照.md`、`task.md`、本 review 两路独立复核 | 满足 |

**完成条件逐条挂证据**：

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 四类定义逐项有“有意差异/遗漏”二选一裁决，不留待定 | AI + 两路 fresh reviewer | 30 条归纳 + 50 项闭集；最终两路 P0/P1=0 | 达成 |
| 2 | 现役 `tools/runner/`、`tools/host/`、`tools/contracts/` 未修改 | AI | task.md 两次禁改路径命令原样为空 | 达成 |

**材料齐没齐**：task/task_plan/对照产物/教训复核/一致性复核/review 均齐。[x]

**as-built 更新了没**：本卡交付物本身即 `as-built/现役Runner一致性对照.md`，已随返工收敛。[x]

→ 当前状态：**机器证与 light 两路复核均已闭合，待用户口头确认销户**

---

## 人类签名区　✅ 仅凭用户对话确认解锁

本卡无业务人判项；这里只记录是否认可按已展示的机器证将轻卡销户。AI 不得代勾。

| 验什么 | 通过标准 | 结果 |
|---|---|---|
| RLT_02 只读对照可作为后续代码卡边界 | 30 条归纳与 50 项闭集可复算；两路复核最终 P0/P1=0；禁改路径为空 | [x] 2026-09-10 用户明文“relay-lite 开始开发”，确认收口并解锁 RLT_03 |
