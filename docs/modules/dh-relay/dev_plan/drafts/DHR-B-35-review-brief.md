<!-- dh:v1 -->
# DHR-B-35 · B-调整只读审核 brief

你是 **B-调整审核者**，不是主控。只读，不改任何文件、不拉终端、不派活、不问用户。结论写在回复正文。

## 待审对象

`docs/modules/dh-relay/dev_plan/drafts/DHR-B-35-driver持续观测与定向回归复绿-候选.md`

对照（请自行打开，不要只信草案陈述）：

- `relay-core/runtime/workflow-driver.mjs` `driveHerdrNode`：`:255-275` 发提交指令、`:330-422` 轮询循环、`:404-417` `done`/`idle` 分支、`:58-67` `waitForExecutorResult`
- `relay-core/store/state.mjs` `STATUS_TRANSITIONS`（草案 §2 的核心依据：`checkpoint_recorded` 推回 `running`）
- `relay-core/contracts/relay.event.v2.schema.json` `kind` 枚举（草案主张不加事件类型）
- `relay-core/test/herdr-adapter.test.mjs` `:242`、`:279`、`:305`、`:354`、`:510`；`relay-core/test/agent-node.test.mjs` `:198`、`:231`
- `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §0.2 B-33/B-34、§3.2 DHR_69/DHR_70/DHR_35、§4、§6
- `docs/modules/dh-relay/backlog.md` DHR-BL-17
- DHR_35 证据在分支 `wt/DHR_35`（未合入 master），用 `git show wt/DHR_35:docs/modules/dh-relay/workspace/DHR_35/findings.md` 等只读方式看 F-3516/F-3517/F-3519/F-3520；候选原文 `git show wt/DHR_35:docs/modules/dh-relay/workspace/DHR_35/b-adjust-candidate-single-sample-observation.md`

仓库：当前 cwd。不要写文件。

## 固定三段

1. **方案问题**（P0 正确性/越界；P1 验收不成立、依赖错误、允许路径与验收口径对不上；P2 可维护/措辞）
2. **用户理解风险**
3. **需要用户决定的问题**（没有就写无，不要发明决定点；草案 D-B35-6 / D-B35-7 是主控已开出的待确认项，请对其推荐给出你的判断）

每条：问题 → 原始需求或你独立打开的事实 → 影响 → 建议。

重点核：
- §2 的推论是否成立（继续观测后 `checkpoint_recorded` 能否让节点从 `waiting_human` 回 `running`，且不与 DHR_69 idle∧blocked 派生、DHR_70 gate 冲突）；
- DHR_72 机器证 D「无墙钟上限」在 service/lease 生命周期下是否真的有界；
- DHR_71 light 档 + 只改测试，能否真的交付绿闸；隔离 2 条语义用例的做法是否合理；
- DHR_73 双出口是否真能收口；
- 三张卡允许路径是否互相不重叠、且各自足以完成验收。

至少引用用户原话「先修 driver 再收 DHR_35」「那就按你的建议走」中的一句，并自行打开上面至少一个生产文件与一份 `wt/DHR_35` 证据核对草案陈述。

## 产出

```
## 结论：通过 / 不通过
## 方案问题
## 用户理解风险
## 需要用户决定的问题
## 我实际打开了什么
```
