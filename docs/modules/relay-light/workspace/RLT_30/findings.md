<!-- dh:v1 -->
# findings — RLT_30

| ID | 级别 | 事实 / 边界 | 状态 / 下一步 |
|---|---|---|---|
| F-001 | P3 | 卡内张力：完成条件 5①要求 AGENTS relay-light 段「监工」= 0，②的白名单又点名「原『监工 monitor』」更名说明句。两条同时成立的唯一写法是保留该更名说明句、删去其中「监工」二字（改为「原名 monitor」）。 | 按此施工；句子仍登记为白名单 W4；复核核对 |
| F-002 | P2 | 教训复核 LES-1：brief 基线误记 `master@7147bca`（该提交只在 `relay/p21-normal-run` 分支，不是 HEAD 祖先），疑从会话启动快照抄来；实际基线 `git merge-base HEAD origin/master` = `724506c`。审计 diff 一直用 `18540c7`，结论不受影响 | 已改 brief；教训候选 L-02 |
| F-003 | P3 | 教训复核 LES-2：白名单 W3（反引号 `` `[monitor]` `` 兼容句）整条被冻结词正则先删去，实际命中 0；属预期，非漏检 | 在 task_plan §3 注明，不删条目 |
| F-004 | P3 | 代码复核 CR-1：task_plan §6 测试名与 S4 证据文件名笔误 | 已改 task_plan |
| F-005 | P3 | 代码复核 CR-2：adapter 的 watcher 取档回退链 / stage-lead 旧名兼容句与 AGENTS 两段 watcher 措辞无结构测试守护（grep 只防残留、不证句子在） | 后续项，不在本卡补（改测试须重跑全量证据）；建议下张触及 skill 的卡在 `test_install_skill` 加断言 |
| F-006 | P3 | 代码复核 CR-3（改名前既有）：`by` 等于应有写者但 agent 推出写者不同时，A85 告警成「must be written by stage-lead (by=monitor), not stage-lead (by=monitor)」同义反复；改前为「monitor, not monitor」 | 后续项：`not` 后改显示 agent 推出的写者 |
| F-007 | P3 | 代码复核 CR-4：grep 白名单按整行放行，同行混入新残留会被放过；现两行已人工核只含别名句 | 接受；收紧写法记教训候选 L-01 |
| F-008 | P3 | 需求复核 RQ-1（冻结面）：watch 通知显示 `monitor#1 -> idle`；未写 `herdr=` 时 watch 按 `monitor-<n>` 猜 Herdr 名，编排若以 `stage-lead-1` 命名 pane 会挂不上 | 后续项：adapter 把 `monitor_launch` note 必写 `herdr=` 升为强约束 |
| F-009 | P3 | 需求复核 RQ-2：roles.toml 模板注释未写明 `[watcher]` 只管完整模式（现由两 adapter single-task 段承载） | 后续项，顺手补注释 |
| F-010 | P3 | `dh gate` 报 label-marker-mismatch：DevPlan RLT_30 卡「任务类型」人读标签后接了配方说明，解析器要求标签严格等于「常规」（B-11 审核未发现） | 已把说明拆到独立「复核配方」行，内容不变、仅格式；gate 复跑 |
| F-011 | P2 | `dh relay-light` R30：按整条分支 `origin/master...HEAD` 计算，RLT_30 名下多出 6 个允许路径外文件——均为 RLT-A-15 / RLT-B-11 规划事件产物（design/01、design/README、drafts/A15 两件、evidence/15、dev_plan/drafts/RLT-B-11），提交于 D-start 前（`197a54a`～`18540c7`），用户 2026-09-28 定「RLT_30 在 plan/RLT_A_15 施工、同 PR #71 合入」；RLT_30 施工 diff `18540c7..HEAD` 全在允许路径内（code_review 核 25 文件）。同理 RLT_27 也被误挂 | 已闭合：用户 2026-09-28 点选「认定为规划事件，不算越界」 |
| F-012 | 信息 | `dh relay-light` R14：解析器只认 `> DH_nn 计划` 卡头，RLT_ 卡一律报「找不到验收口径」 | 工具覆盖面限制；brief 完成条件已逐字复制卡验收（人工核） |

## 可恢复的下一步

读 `task_plan.md` 步骤表与 `progress.md` 日志定位；未完成的步骤按表续做。
