# WFP P1 × OBD P5 · 单卡接力总表

> 类型：卡级衔接总表，人工/会话维护；不是 relay_log.py 执行计划，不建账本，不派发角色。
> 范围：WFP_02～WFP_13、OBD_42～OBD_45，另 2026-09-30 追加 WFP_06 前置维护卡 OBD_OPT-1；保留 WFP_01、OBD_41 两行已交棒前置，共 18 张原卡。
> 用户于 2026-09-28 明确要求纳入深度交错的 OBD。本表只摘录已有任务与依赖，不发任务号、不改变合同或执行模式。

关联原工作项：WFP P1 GitLab #58、OBD P5 GitLab #59（链接见原计划）。本表是已有计划的衔接索引，不是新增 dh-relay 设计、DevPlan 或任务卡。本表入库登记于 dh-relay Issue #79。

最近核对：2026-09-30 21:15:15 +08:00（维护会话 wfp06-orch：收 obdopt1-orch card-chain update，核 `wt/OBD_OPT-1` 提交 `460b13aec`/`6275e32b5` 与其 execution_strategy 后新增 OBD_OPT-1 行（自动接续栏留空=否，待用户写定））。上次：2026-09-30 21:08:54（WFP_06 进入等待 OBD_OPT-1）；再上次：2026-09-30 19:59:24 +08:00（WFP_05 收口完成、WFP_06 自动接续拉起与维护会话移交，交出方 wfp05-orch 最后一次核对；依据 GitLab MR !130 merge `975656c5e`（squash `60b2f519e`）、verify `d0435d21b`、收尾 MR !131 merge `2feb3f0b9`、Issue #70 已关闭、relay master `c97cbd0f6` 三方合并保留 relay 独有文件；自动接续核对：WFP_06 接棒条件齐（WFP_05 verify `d0435d21b`、OBD_44 verify `ebe169ed6` 均为 GitLab master 祖先）→ 已按开局五步拉起；OBD_45 缺 WFP_06 技术就绪，未拉起）。上次：2026-09-30 15:33:10（OBD_44 收口）。其余行沿用 2026-09-28 16:32:57 只读快照，恢复时重新核实。

**维护会话（唯一写入者）**：WFP_06 单卡 orchestrator `wfp06-orch`（Herdr `w59:t1`/`w59:p1`，Claude Code Opus 5.5/medium，Remote Control 已开）；2026-09-30 19:58 由 wfp05-orch 按「维护人卡收口前移交」移交，收到确认后改本页头（登记见 WFP_06 工作区 execution_strategy「卡级总表」）。历史：2026-09-29 Wfp03主控 → wfp04-orch（会话 `c7595b97…`/`dd12ecff…`）→ 2026-09-30 07:57 obd44-orch（会话 `ae88ebf0…`）→ 15:42 wfp05-orch（会话 `e0d1dffe…`）→ wfp06-orch。

**自动接续授权**：本列 2026-09-30 由用户指示主会话代填加列，初值全部「否」（用户原话「好的 你帮我加下」，指针为本次 dh-relay 提交）；2026-09-30 11:5x 用户在主会话（Claude Code 会话 `eebcb7db-1e5c-428c-a843-9c53deae08d6`）指示「可以你来起草」并在选项中确认：WFP_06、OBD_45 两行改「是，orchestrator=Claude Code Opus 5.5/medium」，其余行仍「否」，指针为本次 dh-relay 提交；改「是」只由用户写定，写「是」须带 `orchestrator=<模型>/<推理档>`；维护会话与各卡 orchestrator 只读本列。规则见 relay-light SKILL「自动接续」（v1.3.0）。

## 权威来源与恢复入口

- **WFP P1**：`wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/workflow-platform/dev_plan/P1-Prefect双轨平台-开发方案.md`；§2.3/§2.4 交接合同、§3.1 依赖及各原卡。
- **OBD P5**：`wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/base-data/dev_plan/P5-注册登录合并表-Prefect接入-开发方案.md`；§2 职责、§3.1 依赖及各原卡。
- WFP 本次当前输入取自 `/home/nash/work/wf-analytics-platform/.dh-worktrees/WFP_02`，分支 `wt/WFP_02`，16:32 快照 HEAD `63ace8baa9455a9526a23ae4470f7923e474dacb`；17:26 维护会话复核 HEAD `945e6fba0`（B0 `8134ea567`、B1 `945e6fba0` 已按批提交），B2 未提交 WIP 在途、未改动。 2026-09-29 02:14:07 +08:00 维护会话复核 `wt/WFP_02` HEAD `745ff5c67`（B0～B6 与收口均已提交并推 relay），GitLab master `c94160ef4` 已含本卡。
- OBD P5 本次读取于 WFP_01 checkout，HEAD `46eade4a0fad173c5816463f7deabf1cba3a25a7`。OBD_41 verify `1133cf3dd` 与 WFP_01 verify `0c5c2a44b` 本地均存在；完成状态引用原卡登记，不代表本次重做环境验收。
- **WFP_02 工作区**：`wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/workflow-platform/workspace/02-WFP_02-产品请求事实与幂等提交/`。恢复读 `execution_strategy.md`、worker 自写 signals、独立 review/decision 与 Herdr 实态。本次只核文件，未探测 agent 存活，不把文档角色状态当作实时进程事实。
- WFP_01 checkout 中 WFP_02「未开始」是旧副本；此表采用 WFP_02 checkout 的进行中登记及用户本轮说明。OBD P5 顶部「全部未开始」同样滞后，本次依据其 §3.1 的 OBD_41 已完成登记。

表中原卡定位采用上述仓名与相对路径，按任务 ID 查找原卡；已有 workspace 由原卡链接恢复，未建 workspace 的任务回原卡入口，不由本表自动建工作区。

## 卡级交接

行序便于阅读，**不是强制串行排程**。例如 OBD_42 交付后，WFP_04 与 OBD_43 没有相互新增依赖；是否分别开工仍需原卡授权。

| 任务 ID / 原卡与恢复入口 | 接棒条件 | 自动接续 | 接力情况 | 下一步 / 交棒去向 |
|---|---|---|---|---|
| **WFP_01** 环境与归属基线；WFP P1 原卡及 workspace | 目标环境、版本、归属及底座验收 | 否 | 已交棒：原卡已完成，verify `0c5c2a44b` | WFP_02；下游继续引用原环境/归属证据 |
| **OBD_41** 大奉 SQL 与源对数；OBD P5 原卡及 workspace | SQL 写前/写后用户确认及源对数 | 否 | 已交棒：原卡已完成，verify `1133cf3dd` | OBD_42 消费已审 SQL/表合同及对数证据 |
| **WFP_02** 请求事实、幂等提交与最小 CLI；WFP P1 原卡，恢复入口见上 | WFP_01 验收及本卡既有开工授权 | 否 | 已交棒：原卡已完成，verify `8cfec8cb7` | WFP_03 消费；OBD_42 提供接口/测试/SHA：交棒包 `wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/workflow-platform/workspace/02-WFP_02-产品请求事实与幂等提交/handoff-WFP_03-OBD_42.md`（随 wf 仓 `wt/WFP_02-closeout` 文档收口落地）；实现合入 MR !114 `c94160ef4`；`deploy/test` 已同步未构建、test 未验证 |
| **WFP_03** 委托权限、开跑核验与发布准入；WFP P1 原卡 | WFP_02 验收（已满足，verify `8cfec8cb7`） | 否 | 已交棒：原卡已完成，verify `3f75d9b21`（2026-09-29 13:51，Verification=risk-accepted，Risk-Count 2：发布 test 后内部桥未配时 WFP_02 wfp-isolated-verify 开跑闸 FAILED；D1 真实服务身份未定，WFP_06 首业务接线前由用户决定）；wf 仓 GitLab MR !113 于 2026-09-29 13:50 合入 master `a2d5af06f`；Issue #62 随收尾 MR 关闭；B1～B3 batch-review PASS，workflow-final heavy 五路 PASS（含一轮返工、round2 fresh 复审），E2 code_review PASS，人验 P3 小修复核 PASS；未发布 test | 验收接口/测试/SHA 交 OBD_42；权限/准入接口（内部 `/start` `/admit` `/cleanup`、一次准入、受限收尾）交 WFP_04/05/06/07/10；遗留去处：资源名全局唯一→WFP_05/06/10，deployment 映射缓存→WFP_07，D1→WFP_06 首业务接线前 |
| **OBD_42** 查询与暂存业务部件；OBD P5 原卡 | OBD_41；WFP_02（已交棒）、WFP_03（已交棒）已验收接口/测试/SHA | 否 | 已交棒：原卡已完成，verify `cd19869b2`（2026-09-29 20:47，Verification=full，Risk-Count 0，全验收通过）；wf 仓 GitLab MR !121 于 2026-09-29 20:41 合入 master `f39312a07`（复核对象 `04cbad663`，合入态复验 335 passed）；Issue #64 随收尾 MR !122（`6d835f238`，2026-09-29 20:51）关闭；plan-review、B1～B3 batch-review、workflow-final heavy 五路、E2 code_review PASS；真实取证（项目 36，2026-09-21～22）登录 7267 行/激活 6193 行，B4 对照 6 项 ±1/+2 用户人验接受、根因带到 OBD_45；数数取消能力未证实；未发布 test | 交棒包 `wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/base-data/workspace/23-OBD_42-query-staging/handoff-WFP_04-OBD_43.md`：查询/暂存/安全清理及源能力证据交 WFP_04（P3 遗留归 WFP_04 装配时定）；业务部件交 OBD_43/44 | 查询/暂存/安全清理及源能力证据交 WFP_04；业务部件交 OBD_43/44 |
| **WFP_04** 查询与暂存的平台接线；WFP P1 原卡 | WFP_03、OBD_42；已确认表合同及源能力证据 | 否 | 已交棒：原卡已完成，verify `784300123`（2026-09-30，Verification=full，Risk-Count 0）；MR !126 合入 master（merge `a94e6b5e1`，squash `bed60b4bb`；生产代码复核对象 `440848b8d`，补测 `440d37e42`、`a50859761`）；收口 MR !128 `54a6770a8`；Issue #65 已关闭；relay `wt/WFP_04*` 已删（保留合并 `30f6e08da`）；范围外：共享夹具 resolve → Issue #68，E2 P3-5 → WFP_05 | 已校验暂存、外部请求/query ID/unknown/owner 事实交 WFP_05/06 |
| **OBD_43** 原子发布、实际读取与基础回收；OBD P5 原卡 | OBD_42；实际读入口、保留规则确认 | 否 | 已交棒：原卡已完成，verify `574a98c66`（2026-09-30，Verification=full，Risk-Count 0；MR !124 merge `66a84787f`，最终复核代码对象 `68d5e8f5b`，合入态复验 565 passed）；收口 MR !125 `b3ef1878c`；交接 `handoff-WFP_05-OBD_44-WFP_10.md` | Store/读取/基础回收及分项证据交 WFP_05；部件交 OBD_44；WFP_10 复用回收 |
| **WFP_05** 发布、读取与回收的准入接线；WFP P1 原卡 | WFP_04、OBD_43；WFP_03 准入接口；实际消费者/外部引用及保留期 | 否 | 已交棒：原卡已完成，verify `d0435d21b`（2026-09-30，Verification=full，Risk-Count 0）；MR !130 合入 master（merge `975656c5e`，squash `60b2f519e`；最终生产代码 `eba264121`），合入态复验后端 468 / 运行侧 1195 passed；收口 MR !131 `2feb3f0b9`；Issue #70 已关闭；交接 `handoff-WFP_06-WFP_08-WFP_10.md`（工作区 `workflow-platform/workspace/05-WFP_05-发布读取回收准入接线`）；遗留 F-plan-1 待裁决、D3② WFP_02 e2e 维护卡候选 | 真实发布/读/回收接线与结果引用交 WFP_06/08/10 |
| **OBD_44** 每日与范围补跑业务入口；OBD P5 原卡 | OBD_42、OBD_43；每日窗口确认 | 否 | 已交棒：原卡已完成，verify `ebe169ed6`（2026-09-30 15:25，Verification=full，Risk-Count 0）；MR !127 合入 master（merge `ff870aeca`，squash `934f356ad`；生产代码复核对象 `4c35ecd82`，含测试 `88b6a55b7`），合入态复验 1030 passed；收尾 MR !129 `118ce2cc4`；Issue #69 已关闭；plan-review r2、B1～B3 batch-review、workflow-final heavy 五路（code 路按 U6 第三轮补完整矩阵后 PASS）、E2 code_review round2 PASS，人验 U7 交付接受；交接 `base-data/workspace/25-OBD_44-range-entry/handoff-WFP_06-WFP_07-OBD_45.md`；遗留 D1（补 2026-09-21 前历史）本卡不做、待用户另定；relay `wt/OBD_44*` 待用户点名删除 | 同一套业务步骤/参数/窗口/覆盖合同交 WFP_06/07；业务部件交 OBD_45 |
| **OBD_OPT-1** 登录合并表业务入口可选发布注入（base-data 维护卡 OBD_OPT-P1，2026-09-30 新增行，WFP_06 D2 落卡 B）；Issue #72 | 开卡授权：用户 2026-09-30 对 wfp06-orch 确认（WFP_06 findings D2）；基于 GitLab master `32d652384` |  | 进行中：2026-09-30 21:14 开工，分支 `wt/OBD_OPT-1`（开工空提交 `a0c5c71a9`，编排建档 `460b13aec`、`6275e32b5`），Draft MR !134，worktree `.dh-worktrees/OBD_OPT-1`，Herdr w5A `obdopt1-orch`（Opus 5.5/medium，Remote Control 已开），分工用户已确认；工作区 `base-data/workspace/26-OBD_OPT-1-entry-publisher-injection`；plan 阶段进行中 | 合入/verify 后交 WFP_06：合入 SHA、verify SHA、publisher 签名与导入方式、测试入口 |
| **WFP_06** 首业务 Flow 装配与联合验收；WFP P1 原卡 | WFP_05、OBD_44（以两卡各自 verify 提交为准）；消费 WFP_02/03 已验收接口；不等 OBD_45 最终签收 | 是，orchestrator=Claude Code Opus 5.5/medium | 进行中：2026-09-30 19:5x 自动接续拉起（接棒条件 WFP_05 verify `d0435d21b`、OBD_44 verify `ebe169ed6`）；Issue #71，分支 `wt/WFP_06` @ GitLab master `2feb3f0b9`（开工空提交 `7f5f736d7`），Draft MR !132，worktree `.dh-worktrees/WFP_06`，Herdr w59 `wfp06-orch`（Opus 5.5/medium）；用户确认分工（coder=Codex gpt-6.1-sol high）与 U1 真实环境（数数真源只读+本机 PG/Prefect，test/prod 不在内）、D1 新建专用服务账号；**等待：OBD_OPT-1 合入/verify**（plan 阶段 builder BLOCKED：OBD_44 `run_login_day` 直调 `store.publish` 无发布注入点；decider 方案 `evidence/decision-1.md`，用户选定另开 base-data 维护卡 OBD_OPT-1 补可选 publisher 回调：Issue #72、Draft MR !134、分支 `wt/OBD_OPT-1` @ GitLab master `32d652384`、Herdr w5A `obdopt1-orch`；证据 WFP_06 findings D2） | 先登记技术就绪 SHA/接口/隔离证据供 OBD_45 同次取证；双方证据齐后交 WFP_07 |
| **OBD_45** 真实联合运行与业务对数；OBD P5 原卡 | OBD_41～44（以各卡 verify 提交为准）；WFP_06 技术装配就绪（以 WFP_06 行登记的技术就绪 SHA/接口/隔离证据为准，非最终验收） | 是，orchestrator=Claude Code Opus 5.5/medium | 等待：WFP_06 技术装配就绪（OBD_41～44 verify 已齐：`1133cf3dd`/`cd19869b2`/`574a98c66`/`ebe169ed6`） | 与 WFP_06 共用真实运行，分别取证/验收；业务对数、人判及平台证据齐后满足 WFP_07/13 的相关前置 |
| **WFP_07** 计划配置、每日更新与范围补跑；WFP P1 原卡 | WFP_06、OBD_45；每日窗口确认 | 否 | 等待：两侧联合验收 | 计划版本/实例快照/补跑摘要交 WFP_08；日常正式启用仍等 WFP_13 |
| **WFP_08** 网页与 CLI 运维闭环；WFP P1 原卡 | WFP_07 验收 | 否 | 等待：WFP_07 | 真实 UI/CLI/运行及 H1/H2/H3 证据；可操作业务交 WFP_09 |
| **WFP_09** 平台五并发、业务单槽与资源预算；WFP P1 原卡 | WFP_08 验收；复用 WFP_01 环境与 WFP_05 资源锁 | 否 | 等待：WFP_08 | 受控 Flow 五并发/第六排队、多 Worker 上限、首业务全局单槽及资源证据交 WFP_10 |
| **WFP_10** 周期回收与记录保留；WFP P1 原卡 | WFP_09；各类保留期确认；复用 WFP_04/05 回收及 WFP_03 权限 | 否 | 等待：WFP_09 及保留期确认 | 完整新侧回收/保留链及异常证据交 WFP_11 |
| **WFP_11** 备份恢复与跨服务故障演练；WFP P1 原卡 | WFP_10；维护人、备份保留期、RPO/RTO 等恢复目标确认 | 否 | 等待：WFP_10 及恢复目标确认 | 真实恢复/故障证据交 WFP_12 |
| **WFP_12** 新旧语义与旧侧装配回归；WFP P1 原卡 | WFP_11 验收 | 否 | 等待：WFP_11 | 最终真实装配兼容回归交 WFP_13；各前卡仍随改动做兼容检查 |
| **WFP_13** 首类受控启用、回退与观察；WFP P1 原卡 | WFP_12、OBD_45；精确启用授权及观察标准 | 否 | 等待：完整前置验收和用户启用授权 | 按原卡完成受控启用、回退和收益观察，不授权旧四组迁移或其它业务开工 |

## 联合取证与停止边界

1. WFP_06 在原 workspace 登记技术装配就绪提交 SHA、实际接口/测试入口和隔离装配证据后，OBD_45 才可进入同一次联合取证；不要求 WFP_06 先最终签收。业务与平台分别验收，双方证据齐后才放行后续相关前置，避免互等。
2. SQL 新增/修改仍走 P5 写前讨论、写后完整 SQL 用户审核；真实查询与环境写操作另需授权。业务缺陷回 OBD 责任卡，平台接线缺陷回 WFP 责任卡，不跨卡代写第二份实现。
3. 需要用户执行服务器命令、处理凭据或持续交互的任务按 relay-light 边界走交互单会话；本表记录等待与恢复入口，不派交互 worker。WFP_02 维持既有合同及原编排，本表不迁移、不重启该任务。
4. 不纳入 P4 群英 OBD_31 或订单/状态/VIEW/三表迁移卡：P1/P5 明确它们不是本次大奉首业务前置，也不能以大奉证据代验。以后纳入须另按原计划确认范围。
5. 本表不授予下一卡开工、commit/push/MR/合并、verify、清理或环境操作权限。未满足条件记“等待”，缺证据记“待核实”，不由摘要推定完成。

## 维护方式

- 协调会话在停下、恢复或交棒时更新对应行与核对时间。原卡/DevPlan 是任务及依赖权威；不一致时核实纠正本表，不改原合同。
- “施工结束”“复核通过”“合入”“验收通过”分开记录。只有交接条件有证据时写“已交棒”，保留提交 SHA 与原卡证据位置；不自动代表整卡完成。
- 后续交棒在对应行补分项验收提交 SHA、接口/测试及原 workspace 证据指针，不只写“已完成”。
- 跨模块只维护本文件一份；卡内批次、角色、review 和 signals 继续留原 workspace，不复制到此表。
