<!-- dh:v1 -->
# progress — DHR_78

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-09-07 | 用户 / 主会话 | 用户明文“确认，开工”；在主干登记 DHR_78 为进行中并建立标准档 v2 七件套，尚未改生产代码或启动真实 Agent。 | E-7801 | 提交 D-start 骨架并创建 `wt/DHR_78`。 |
| 2026-09-07 | 主会话 | 新增专项负例：没有 `instruction_ref` 的 Herdr node 不得开 Attempt 或启动 Agent；现状仍调用 `agentStart`，按预期失败。 | E-7802 | 实现 schema 接纳、仓根内引用验证与唯一启动 sender。 |
| 2026-09-07 | 主会话 | 完成当前施工面：仓内摘要校验、单一 Host Adapter sender、发送前 Store 占次和私有记录、60 秒一次补发、源变更/进展/恢复抑制；既有 Herdr 驱动 fixture 适配新输入。 | E-7803～E-7808 | 等待未授权历史 fixture 的范围扩展；不进入复核或收口。 |
| 2026-09-07 | 主会话 | 按调整卡补充发送前 Store 确认、`blocked` 禁补发、可注入单调计时与“占次后、调用前 stop”的恢复 Attention；两条历史 fixture 已补 `instruction_ref`。 | E-7809～E-7811 | fixture 测试需改写其旧的 Result 结算驱动，超出仅 fixture 适配范围；记录阻塞后停止。 |
| 2026-09-07 | 用户 / 主会话 | 用户明文批准三条 schema 治理路径扩围；主会话同步补齐两条既批准 fixture 路径的机读白名单，并闭合 Review Batch 的 source/host 漂移、条件必填与 Store-only 补发 P1。 | E-7813～E-7815 | 运行最终受影响回归与有效变异。 |
| 2026-09-07 | 主会话 / fresh reviewers | 专项、契约与受影响 11 文件均取得当前自然终态；有效变异红、恢复 hash 一致且绿；heavy 五路 P0/P1 清零。完整 `npm test` 的旧合同尾项保持未得终态，未冒充全量绿。 | E-7815～E-7820 | 补 miner、as-built、dh check 与 E10 人验证据展示。 |
| 2026-09-07 | 主会话 / fresh miner | `dh mine dh-relay DHR_78` 自然终态 exit 0；fresh miner 去重后抽出候选-84，主会话复核后追加候选区，未动正册。 | E-7821 | 完成 AI 提交区与候选提交。 |
| 2026-09-07 | 主会话 | E7 as-built 已更新；E9 七段交付汇报与 E10 H3 四例安全摘要已生成，尚待本轮对话发出。模块体检修正本卡账本/派出/变异锚点结构后通过。 | E-7822 | 精确创建候选提交并发出 E9/E10；停在 E11 前。 |
| 2026-09-07 | 主会话 / 用户 | E9 七段交付汇报与 E10 H3 四例安全摘要已在对话发出；用户回复“认可”，HC-SD-H3 与默认本地收口包生效。 | E-7823、E-7829 | rebase 当前 master 后执行合入态复验、verify 与销户。 |
| 2026-09-07 | 主会话 | DHR_78 候选从 `34d53f7` rebase 到 master `3c3a905`；唯一冲突为 P6 任务表相邻 DHR_78/DHR_80 行，精确保留两行，新候选 `99e2884`。 | E-7830 | 在新候选补提交确认账并重取核心回归。 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-7813 | authorization / scope | 用户对话明文“批准”；DevPlan `dh:allowed-paths:v1`、brief、task_plan | observed | 精确加入 `audit-contracts.mjs`、`structural-tokens.txt`、`capability-baseline.json`；另把已批准但只写在散文中的两条 fixture 路径补入机读白名单。用途限制不变。 |
| E-7814 | review remediation | `workflow-driver.mjs`、run/v2 schema、DHR_78/contract tests | observed | Store 最终确认后再次校验 source/digest 与实际 host；Herdr node 条件必填 `instruction_ref`；60 秒资格只由 Store checkpoint/Result 裁决；仓根越界与初始摘要不匹配均在 Attempt/Agent 前拒绝。 |
| E-7815 | test | `node --test --test-concurrency=1 test/dhr78-startup-dispatch.test.mjs test/contracts.test.mjs` | natural terminal: 32 pass / 0 fail / 0 cancelled，8638.6033ms，exit 0；其中 DHR_78 专项另复跑 17/17，7100.2865ms，exit 0 | HC-SD-A9-core/A10/A11/A12 专项与正式契约、审计、capability 基线当前同版通过。 |
| E-7816 | affected regression / green | contracts、agent-node、DHR64/69/70/72/75/77、herdr-adapter、DHR78 共 11 文件串行命令 | natural terminal: 125 pass / 0 fail / 0 cancelled，127801.8498ms，exit 0 | Receipt-bound、连续观测、lease、host_ref 与旧 adapter 断言在当前候选未退化。前一轮 124/1 是 Windows `state.json` rename EPERM，当前同命令自然复绿，不删历史失败事实。 |
| E-7817 | mutation / red-green | reviewer `/root/dhr78_code2` 选择 `workflow-driver.mjs` 最终 host 状态 guard；定向 `--test-name-pattern="Store 最终确认后 host 状态漂移"` | 原 hash `110f6a2d…` → 变异 `470f48bc…`；变异后 0/1、exit 1（实际发送 1，期望 0）；apply_patch 还原 hash `110f6a2d…`，1/1、exit 0 | 最终发送前 host 状态 guard 被现有断言真实咬住。先前 `store.mjs:701 OR→AND` 变异仍绿，因 confirm 有独立闸，已如实作废且恢复 hash `fa9110e…`。 |
| E-7818 | full suite / no terminal | `npm test` | 主控在 identity-quota 旧 `herdrJudge`/Receipt-bound 路径长时间静默后 Ctrl-C；exit 1 来自中止，**未得自然终态、无可用 aggregate** | 禁止宣称全量通过。中止前可见 DHR_76 frozen 60s 用例约 56.1s 完成而断言期望超时、CLI pending 50 路并发旧用例失败；DHR_78 当时一个假时钟竞态已修并以 E-7815/E-7816 重取。DHR_76 与 identity-quota 均有 master B-45 同形基线，且由独立卡/工作树处理，不扩入 DHR_78。 |
| E-7819 | dsh bridge / green | `node --test --test-concurrency=1 test/dsh-bridge.test.mjs` | natural terminal: 7 pass / 0 fail / 0 cancelled，20340.3855ms，exit 0 | 先前 EBUSY 未复现；当前 bridge 回归完整终态通过，F-7802 关闭，但不推导环境中永不再抖动。 |
| E-7820 | heavy review batch | code1 `/root/dhr78_code1`；code2 `/root/dhr78_code2`；requirement `/root/dhr78_requirement`；lessons+consistency `/root/dhr78_lesson_consistency` | final: 五路 P0=0 / P1=0；代码轮 2、需求、教训、一致性均 approved | heavy Recipe 闭合，可进入 E10；reviewer 明确这不等于 H3/E11、verify 或全量 npm 绿。 |
| E-7821 | miner / candidate | `dh mine dh-relay DHR_78` + fresh `/root/dhr78_miner` 去重抽取 | command natural terminal exit 0；新增候选-84，正册 0 写入 | 旧 fixture 只补输入、不迁移 Receipt-bound 结算动作会无终态；与候选-58 相邻但不重复。 |
| E-7824 | requirement evidence / pending human | `review.md` 四例脱敏安全摘要；E10 对话展示 | machine facts ready；human verdict pending | HC-SD-H3 只待用户判断日常可用性与人工代价，不以真实 Agent 替代。 |
| E-7825 | review-dispatch | fresh `/root/dhr78_code1`，代码轮 1，只读完整 diff | settled；最终 P0/P1=0，approved | heavy 代码轮 1 派出与终态。 |
| E-7826 | review-dispatch | fresh `/root/dhr78_code2`，代码轮 2 + 独立变异选点 | settled；整改后 P0～P3=0，approved | heavy 代码轮 2 派出、变异红绿与终态。 |
| E-7827 | review-dispatch | fresh `/root/dhr78_requirement`，需求方向 | settled；P0/P1=0，approved | 需求方向派出与终态；H3 明确保留用户裁决。 |
| E-7828 | review-dispatch | fresh `/root/dhr78_lesson_consistency`，教训 + 一致性 dedicated pair | settled；两路 P0～P3=0，approved | 教训与一致性两路派出及终态。 |
| E-7822 | check | `dh dh-relay` | 首轮 exit 1：2 failures 为本卡 planning-no-event 旧措辞；最小修正证据表、复核派出、变异锚点与 marker 后复跑 exit 0：0 failures / 91 warnings | DHR_78 的 R18/R27/R29/R31 当前缺口清零；剩余为存量 warning 与候选提交前 R30 提示，不冒充零 warning。 |
| E-7823 | report / human evidence | 本轮对话 E9 七段交付汇报 + E10 HC-SD-H3 四例安全摘要 | sent | 目标、能力、测试、复核、残余、四例人工动作与授权边界均已展示。 |
| E-7829 | authorization | 用户在 E10 后对请求语回复“认可” | observed / pass | HC-SD-H3 人判通过；授权本地 squash、合入复验、`verify(dh-relay)`、状态回填与 DHR_78 worktree/branch 清理；不含 push/deploy/真实 Agent/DHR_35/DHR_80。 |
| E-7830 | rebase / boundary | `git rebase master`：`34d53f7` → `99e2884`，base=`3c3a905` | natural terminal exit 0；DevPlan 单冲突手工保留 DHR_78 最新行与 DHR_80 未开始行；其他文件无冲突 | 消费 master 新增的 DHR_80 计划提交，不覆盖主树两个未跟踪 DHR_80 工件，不触碰独立 DHR_79 worktree。 |

### 2026-09-07 施工调整授权与当前边界

- 用户在决策建议后明文“那你把任务卡调整下，然后给 terra 发消息，让他按照调整的做就行”。据此在本 worktree 更新 DevPlan、brief 与 task_plan；只新增两条 instruction_ref fixture 测试路径，优先完成既有发送安全合同整改，保留 construction 停止边界。
- 该次局部调整只修改任务工件；上表 E-7807/E-7808 为更早的历史施工账本，当时未取得完整原始 npm 输出，不独立背书退出码、逐项归因或“非本卡语义失败”。后续证据已按实际终态追加，EBUSY 不自动豁免。
- 此前“等待范围扩展”已由 E-7813 解除；整改、验证和复核终态以 E-7814～E-7828 为准，不将派出等同于 reviewer 已结算。

### 本轮工作区限定调整（2026-09-07）

- 用户明确限定只改 `docs/modules/dh-relay/workspace/DHR_78/` 下范围、计划、进度工件。本轮更新 brief、task_plan、progress；未修改生产代码、测试、工作区外文件或 Git 状态列，未执行复核、验收或提交。
- 精确承接：workflow-driver blocked 重发、stop-发送竞态；已占次未发送恢复的不确定投递处理与定时测试；两条新增 allowed paths 仅补 instruction_ref fixture。占次事实不证明实际投递结果，不授权改写旧测试的 Result 结算驱动。
- dsh-bridge Windows EBUSY 单独复现/定位；只有确证同一根因且所需时才提出进一步精确变更，不混入，不自动豁免。
- 全量仍仅有 E-7807 的 **330 pass / 30 fail / 0 cancelled** 记录，**无后续全量终态**。E-7809 是定向结果；E-7810/E-7811 保留未得终态。下表历史归因不是当前全量结论，本轮未复验其原始输出。

### 历史记录（保留原账）

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-7801 | authorization / planning | 用户对话明文“确认，开工”；本工作区七件套与 DevPlan DHR_78 | observed | 独立 D-start 成立；只授权当前 construction Node。 |
| E-7802 | test / red | `cd relay-core; node --test --test-concurrency=1 test/dhr78-startup-dispatch.test.mjs` | fail (1/1): `agentStart` 已调用 | 现状缺少 `instruction_ref` 时仍启动；为 A9 的最小失败基线。 |
| E-7803 | test / green | `cd relay-core; node --test --test-concurrency=1 test/dhr78-startup-dispatch.test.mjs` | pass (6/6), natural terminal | 缺失拒绝、首发/补发内容相等、进展/源变化抑制、恢复不重发、私有记录 fail-closed。 |
| E-7804 | targeted regression / green | `node --test --test-concurrency=1 test/dhr64-driver-observation.test.mjs test/dhr64-result-bridge.test.mjs test/dhr69-false-ready.test.mjs test/dhr70-submission-gate.test.mjs test/dhr72-continuous-observation.test.mjs test/dhr75-host-lease-during-herdr.test.mjs test/dhr77-host-ref.test.mjs test/agent-node.test.mjs test/herdr-adapter.test.mjs` | 各命令自然终态通过：3/3、10/10、10/10、6/6、8/8、15/15、13/13、9/9、27/27 | Receipt-bound、blocked、连续观测、lease/host_ref 与 Agent 边界未退化。 |
| E-7805 | static / green | `git diff --check`；`rg` 检查 driver 的旧 completion-only sender | pass；driver 中旧 sender 0，Adapter 仅一处 `agentPrompt` | 无空白错误；物理启动指令发送收敛。 |
| E-7806 | contract / green | `node tools/audit-contracts.mjs`；`node tools/capability-baseline.mjs`；`node --test --test-concurrency=1 test/contracts.test.mjs` | 审计 0 违规、baseline 通过、contracts 15/15 | 用户确认的三条治理路径已按最小方式同步。 |
| E-7807 | full suite / fail | `npm test` | natural terminal: 330 pass / 30 fail / 0 cancelled，367131ms；其中已在 E-7804/E-7803 复跑修正 13 项 | 剩余 17 项见 E-7808；完整套件不可记 pass。 |
| E-7808 | scope blocker | E-7807 失败逐条归因 | `identity-quota.test.mjs` 8 项、`dhr76-profile-validation-lease.test.mjs` 8 项缺新 `instruction_ref` fixture；`dsh-bridge.test.mjs` 1 项为 Windows `EBUSY` 清理 | 前两文件不在 DHR_78 allowed paths；后者非本卡语义失败。 |
| E-7809 | targeted regression / green | `git diff --check`; `node --test --test-concurrency=1 test/dhr78-startup-dispatch.test.mjs` | `diff --check` exit 0；DHR_78 8/8 pass、0 fail、0 cancelled，9585ms，自然终态 | 新增 blocked 禁发、发送前 stop、恢复未送达 Attention，以及原有 A9-A12 专项均通过。 |
| E-7810 | targeted regression / no terminal | `node --test --test-concurrency=1 test/identity-quota.test.mjs`；`test/dhr76-profile-validation-lease.test.mjs` | 两条均已进入原有测试的 Receipt-bound driver 场景；未取得自然终态或退出码，不能记 pass/fail | `instruction_ref` fixture 已有效；旧测试的 `herdrJudge` 不会提交 Receipt Result，改写其结算驱动超出本卡本次仅 fixture 适配的授权。 |
| E-7811 | targeted reproduction / no terminal | `node --test --test-concurrency=1 test/dsh-bridge.test.mjs` | 可见前三例通过（1359ms、3893ms、21773ms）；未得到自然终态/退出码，也未重现或排除末尾 Windows `EBUSY` | EBUSY 保持未证实，不豁免；若要改 bridge 清理逻辑，另报精确范围。 |
| E-7812 | targeted regression / no terminal | DHR_64、69、70、72、75、77、agent-node、adapter 的合并定向命令 | 前 18 个可见子例通过；随后命令未取得自然终态或退出码，不能将该组记为 pass | 与 E-7810 一样，Receipt-bound 旧 fixture 的结算未完成；不将局部可见通过累加为组通过。 |
