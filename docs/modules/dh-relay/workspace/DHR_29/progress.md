<!-- dh:v1 -->
# progress — DHR_29

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-21 | 主会话 | 用户授权 DHR_29 标准档高危施工至 E10；已创建 worktree 并从 origin/master 起点 rebase 到 master。K-1 裁决为本批新增事件产生者。 | `wt/DHR_29`；HEAD `c44d392`；用户对话授权 | 完成现状侦察与 TDD 施工图。 |
| 2026-08-22 | 主会话 | 批次 2（交接续做）：按 F-003/F-004 先补 6 组反例再最小修复 `store/{state,store}.mjs`——`openStore` 磁盘重建 + 事件完整性 fail-closed 校验；写前 schema 校验、receipt+attempt 身份链、终态守卫与隔离留痕并存、fresh attempt 不被旧终态锁死、串行写队列消并发重号。契约零触碰。 | E-009 / E-010 | 更新 findings 后派批次 2 只读复核。 |

| 2026-08-22 | 主会话 | 批次 2 复核回收（CP2=approved，P2×1+P3×6）并同日收敛：P2=compat-matrix §4b 四个无对应事件值逐条裁决落账（全部显式不补+理由）；P3 已修=checkpoint 判定次序改身份链→幂等→终态守卫（堵冒用白拿 ack）、工件损坏包装 `E_STORE_CORRUPT`、reason-codes B11 行措辞对齐实现、sk- 脱敏与账内 schema 违规行补测试钉、as-built §3.5 补自愈取舍；P3 不修=state.json 篡改静默自愈（as-built 已记有意取舍）、旧 result 重投进隔离区（与 task_plan 步骤 3 口径自洽）。派出前后 git 基线比对零差异。 | E-012 / E-013 / F-005 / F-006 | 五路复核：轮 2 增量 + 需求 + 教训 + 一致性。 |
| 2026-08-22 | 主会话 | 五路复核回收：轮 2 代码增量=approved（一轮 P0/P1/P2 逐分句核销、指纹独立复算一致、4 条 P3 观察）；需求=有漂移（批次 1 三项静默没做 + §4b 计数漂移）；教训=过（L-001 改写 + 3 新候选）；一致性=2 处不一致 + K-1/K-2 未回填。同日漂移收敛：P1 fixture Oracle 测试落地、F-042 ajv 权威+K-3 结构闸进审计、指纹批（指名更正+checkpoint 口径）同批重生成基线（新 hash `970b5460…`）、§4b 计数对账式、as-built 刷新。 | E-018 / E-019 / F-009~F-011 | AI 提交区备料，待人验。 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | command | `git rebase master`；`git rev-parse HEAD` | pass | 任务树 `wt/DHR_29` 已基于 `master@c44d392`，没有采用落后的 `origin/master@554e543`。 |
| E-002 | observed | `workspace/DHR_29/` | pass | 标准档八件套已创建，尚未改生产代码。 |
| E-003 | command | `cd relay-core; npm test` | observed | 任务树尚未安装 `node_modules`，`validate.mjs` 导入 `ajv` 报 `ERR_MODULE_NOT_FOUND`；fixture manifest、contract audit、capability baseline 均独立通过，缺口是本地依赖环境。 |
| E-004 | command | `cd relay-core; npm ci; npm test; node tools/{validate,audit-contracts,fixture-manifest,capability-baseline}.mjs` | pass | lockfile 依赖安装后，基线 10/10 测试、33/33 fixture selftest、11 维审计、55 份 manifest 与 8 份 capability baseline 全绿。 |
| E-005 | test | `npm test`（先增 `test/store.test.mjs`） | pass | 红测先报 `ERR_MODULE_NOT_FOUND: store/store.mjs`；实现后 13/13 绿，钉住 JSONL 追加、不可变 run/receipt 工件、原子 state 快照、独立回放签名、checkpoint/result 幂等、终态冲突拒绝、Receipt 迟到隔离与 K-1 事件回放。 |
| E-006 | command | `node tools/{fixture-manifest,capability-baseline,audit-contracts}.mjs --write` 后重跑 `npm test` / selftest / audit / manifest / baseline | pass | 契约修订批次 1 已一次改动共享 identifier 与 `human_input_requested` 产生者；三份基线同批重生成，13/13 测试、33/33 fixture、164 token 审计、55 fixture manifest、8 协议 capability baseline 全绿，hash=`4adfe6dc6f55d63a…`。 |
| E-007 | review-dispatch | dh dispatch | observed | 复核派出：fresh-context-cp1｜批次 1 只读小审：Store 事件账/回放、Receipt 幂等与 seq、K-1 产生者、脱敏、契约基线与范围漂移；简报=workspace/DHR_29/review-brief-cp1.md |
| E-009 | test | `npm test`（先增 6 组 F-003/F-004 反例跑红，后实现转绿） | pass | 红相：缺 `openStore`/`applyEvents` 导入即失败 + checkpoint 幂等次序错 2 例。绿相 21/21：openStore 跨重启幂等/冲突判定成立、损坏账本 fail-closed（半行 / seq 断档 / 外来 run / run.json 缺失）、快照加增量在每个切点逐字节一致、写前 schema 拒绝且不落盘不留痕、身份链不符按 B11 处置、终态污染隔离与 fresh attempt 解锁、并发 seq 无重号。 |
| E-010 | command | `node tools/validate.mjs --selftest`；`node tools/audit-contracts.mjs`；`node tools/fixture-manifest.mjs`；`node tools/capability-baseline.mjs`（均只读校验） | pass | 本批零契约触碰：33/33 selftest、11 维审计 0 违规、164 token 无未登记、55 份 manifest 相符、8 份基线 digest 相符且 capability_hash=`4adfe6dc6f55d63a…` 与 E-006 一致。 |
| E-008 | review | `review-brief-cp1.md` 的 fresh-context 只读复核 | fail | `changes-requested`：P0=结果/隔离工件脱敏不完整；P1=恢复、schema 校验、身份链、终态污染、fresh attempt、并发 seq；P2=反例与账本不足。详见 review.md / findings.md。 |
| E-011 | review-dispatch | dh dispatch | observed | 复核派出：fresh-context-cp2（会话内 scout，侦测型降级·非机器只读，派出前后 git 基线比对）｜批次 2 只读小审：openStore 重建与 fail-closed 完整性校验、写前 schema 校验、receipt+attempt 身份链、终态守卫与 fresh attempt 解锁、串行写队列、applyEvents 快照折叠等价、测试空绿抽查、范围漂移；简报=workspace/DHR_29/review-brief-cp2.md |
| E-012 | review | `review-brief-cp2.md` 的 fresh-context 只读复核（会话内 scout 实例 ReviewCp2，未参与实施；回收后 `git status`/`git rev-parse` 与派出基线比对零差异） | pass | `approved`：批次 2 无阻塞缺陷；21/21 与四闸由复核者独立复现（capability_hash 一致）；5 组变异实证全红无空绿；范围无漂移。附 P2×1（§4b 四值裁决未落账，批次 1 范围）+ P3×6 观察项。 |
| E-013 | command | `npm test`；`node tools/validate.mjs --selftest`；`node tools/audit-contracts.mjs`；`node tools/fixture-manifest.mjs`；`node tools/capability-baseline.mjs`（收敛批后复跑） | pass | 21/21 绿（含新增冒用重投 / 账内 schema 违规行 / sk- 双路钉子）；33/33 selftest、审计 0 违规、55 manifest、8 基线 digest 相符，capability_hash=`4adfe6dc6f55d63a…` 不变——本收敛批只动 `contracts/*.md` 与代码/测试，指纹零漂移实证。 |
| E-018 | review | 三路并行回收：`review-brief-round2.md`（fresh-context-round2 实例）、`review-brief-requirement.md`（fresh-context-req 实例）、`review-brief-lesson-consistency.md`（fresh-context-lesson 实例兼两路）；派出证据 e:E-014~E-017 | observed | 轮 2=approved（含 5 组变异实证与指纹复算；沙箱 FS 只读无法跑测试，以静态审查+三方记录互证并如实声明）；需求=有漂移→F-009；教训=过+3 候选（L-001 根因实钉 dev-harness dh-wt.mjs:105-106）；一致性=第 1/5 行不一致→F-007/F-008，K-1/K-2 回填完成。 |
| E-019 | command | `npm test`；四闸（selftest/audit/manifest/baseline）——漂移收敛后全量复跑 | pass | **23/23** 绿（新增 P1 fixture 复验测、F-037/F-070 反测验）；audit 新闸全零（ajv.validateSchema 0 拒、meta 分叉 0、K-3 内联 pattern 0）；55 manifest 相符；capability_hash 批次内更替为 `970b54601ae582a5…` 且基线同批重生成对证相符。 |
| E-014 | review-dispatch | dh dispatch | observed | 复核派出：fresh-context-round2（会话内 scout，侦测型降级·非机器只读；未继承第一轮会话，可只读仓内一轮记录）｜代码轮 2 增量复核：收敛批 diff、两轮小审闭环核对、全卡边界与指纹、空绿带扫尾；简报=workspace/DHR_29/review-brief-round2.md |
| E-015 | review-dispatch | dh dispatch | observed | 复核派出：fresh-context-req（会话内 scout，侦测型降级·非机器只读）｜需求复核：DevPlan §4.1 DHR_29 验收口径逐条对账；简报=workspace/DHR_29/review-brief-requirement.md |
| E-016 | review-dispatch | dh dispatch | observed | 复核派出：fresh-context-lesson（会话内 scout，侦测型降级·非机器只读）｜教训复核：L-001 沉淀判定 + 库命中检查 + 新候选；简报=workspace/DHR_29/review-brief-lesson-consistency.md 第一部分 |
| E-017 | review-dispatch | dh dispatch | observed | 复核派出：fresh-context-lesson（同实例兼做）｜一致性复核：B11 分野/K-2 seq/脱敏/终态记账/错误码形态/§4b 裁决 六向横扫；简报=workspace/DHR_29/review-brief-lesson-consistency.md 第二部分 |
