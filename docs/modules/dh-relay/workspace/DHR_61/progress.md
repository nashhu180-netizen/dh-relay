<!-- dh:v1 -->
# progress — DHR_61

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-29 | 主会话 | B-23 已合入主树；用户明文确认 DHR_61 D 开工。完成 S0 工作区骨架与 S1/S2 施工合同，尚未改实现文件。计划工作树=`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_61`，分支=`wt/DHR_61`，client=`codex-cli`。 | E-001 | 创建后核验 worktree/branch，再按 task_plan 步骤 1 写 D1 红例。 |
| 2026-08-29 | 主会话 | 用户以“继续”授权既定 D1/D2 范围的 S3。按 TDD 新增 D1 Attempt Receipt 红例，首次 `node --test test/attempt-contract.test.mjs` 为 0/1；新增 `relay.attempt-receipt/v1` 与 Store 的受校验持久化/重放入口后，同命令及 `test/store.test.mjs` 共 20/20 通过。未读取用户配置、凭据或环境。 | E-002、E-003 | 先处理 F-001 的身份快照来源/授权；未解决前不接 workflow-driver。 |
| 2026-08-29 | 主会话 | 用户明文授权迁移用户级 Registry，并只读显式 `nonsecret` 投影。已将 `C:/Users/nash/.dh-relay/executor-profiles.json` 的旧 fields 名称数组迁移为 `{pointer,classification:"nonsecret"}`，并在原路径生成精确备份；迁移后 validator=`PASS`。未改任何被引用的用户配置文件。新增 D1 身份快照纯函数、D2 pause/fence/waiting_human 基础契约与 Store 定向测试；fixture selftest=50/50、audit=0 违规、定向 47/47。 | E-004~E-007 | 处理 F-001 剩余的 unavailable fallback，补 journal/recovery、pause resolution 与 RPC v2；不将当前基础称为 D1/D2 完成。 |
| 2026-08-29 | 主会话 | 两次 `npm test` 均只返回部分 case 输出，未给总结或退出码；只读核对后确认均为本轮 DHR_61 test process tree，已精确停止残留进程，未碰既有服务。 | E-008 | 排查全量回归未得终态的 Windows 进程/临时 Store 干扰，另用隔离 basetemp 取得终态。 |
| 2026-08-29 | 主会话 | 用户明确授权为 `codex-ninth` 增加可公开读取的非敏感规则。已设置用户级路径变量 `CODEX_NINTH_HOME`，并为 `herdr.codex.ninth` 登记 `config.toml` 的五个模型/执行能力 JSON Pointer；未读取或记录其任何字段值，Registry validator=`PASS`。 | E-009 | F-001 的规则缺失已消除；仍需受信任 projection provider 才能实际签发带该 fallback 的身份快照。 |
| 2026-08-29 | 主会话 | 实现受信任 projection provider：仅从已登记 JSON Pointer 读取 TOML/JSON 的 `nonsecret` 字段，原始配置与未列字段不外泄；带规则的 Herdr source/fallback 在开 Attempt 前冻结为 `relay.attempt-receipt/v1`。pause 的工件、事件与状态改经 prepared journal 可恢复提交；缺 journal 的残缺 pause 拒绝打开 Run。 | E-010 | F-001 已关闭；继续 D2 resolution、retry 与 RPC v2，未完成前不解除 DHR_34。 |
| 2026-08-29 | 主会话 | 先写 D2 resolution 红例（Store 不存在 `appendFallbackPauseResolution`），再实现 resolution、新 Attempt Receipt、resolution/receipt/event/state 的单个 prepared journal 提交、重放完整性与 open Attention 投影。v1 list/inspect/subscribe 遇到 open Attention 明确拒绝 `E_ATTENTION_REQUIRES_READ_MODEL_V2`，不静默省略。 | E-011、E-012 | resolution 的 Store 语义已完成；仍须冻结并接通独立 bootstrap/RPC v2 endpoint 与 retry 的当前 Registry 等值复核，DHR_34 继续阻塞。 |
| 2026-08-30 | 主会话 | 完成独立 bootstrap、RPC v2 descriptor/read model/subscribe、`retry-with-profile` 与 v1 Attention 兼容闸；v1 capability 固定为 `994d5f…c971e`，v2 当前基线为 `fb55f2…d073`。 | E-013、E-014 | 进入 heavy 配方代码轮 1。 |
| 2026-08-30 | 主会话 + Opus 5 代码轮 1 | fresh 代码轮 1 报出 journal committed 重放、容量证明、双向账本、事件入口、v1 backfill、迁移排序等 P0/P1；施工方逐项整改，同一 reviewer 复验后 P0/P1 归零。 | E-015 | 并发启动 fresh 代码轮 2、需求、一致性、教训四路 Review Batch。 |
| 2026-08-30 | Review Batch + 主会话 | 四路 Opus 复核完成。需求/一致性/代码轮 2 报出的候选集来源、projection 故障域、Attention 双定义、RPC 冲突断连、capability 双轨、坏账错误映射与 Store 失败后分叉均已整改；代码轮 2 真实变异 `appendResult` fence 守卫后 11/13 红，字节还原后 13/13 绿。 | E-016、E-017 | 取得最终全量终态并更新收口工件。 |
| 2026-08-30 | 主会话 | 用户明文“就当61完成好了”，作为本卡 H=0 的人类放行确认；不替代机器闸、独立复核、verify 与合并。 | E-018 | 完成最终闸门、verify 与主树收口。 |
| 2026-08-30 | 主会话 | 冻结点回归暴露并闭合三项：恢复既有 Attempt 不应重新要求 projection；Herdr 测试 2 秒轮询上限不耐全量并发；Windows `wx` 锁创建在释放竞争窗会短暂 `EPERM/EACCES`。均作最小修正，新增 mutation poison 与坏 Run RPC 定向反例；最终全量、契约、基线、凭据形态扫描、diff 闸全部取得终态。 | E-019 | 等代码轮 2 最终末注后提交 implementation，再跑 verify 提交并合入主树。 |
| 2026-08-30 | 主会话 | 精确路径提交 Windows 锁修复 `38cb30f` 与 DHR_61 implementation `7083a2d`；在提交字节上重跑 verify：全量 237/237、契约审计与两套基线全部通过，工作树起跑前为空。DevPlan 标记 DHR_61 完成并解除 DHR_34 前置阻塞。 | E-020 | 生成独立 `verify(dh-relay):` 提交，合入 master 并恢复 DHR_34。 |
| 2026-08-30 | 主会话 | 尝试生成独立 `verify(dh-relay):` 提交时被 PreToolUse 闸门拒绝：全模块 `dh dh-relay` 尚有 70 个存量失败；逐项过滤确认 DHR_61 新增失败为 0。未使用 `--no-verify`，并撤回“已完成/已解阻”表述。 | E-021 | 另立治理任务清除模块基线后，回到本卡重跑 verify 与合入。 |
| 2026-08-30 | 主会话 | DHR_62 已合入 master 并清除治理基线；DHR_61 rebase 后确认 `relay-core/` 与原 237/237 提交字节零差异。新一轮全量 236/237，唯一失败为 Windows 临时目录删除 `EBUSY`；DHR_61 与 master 隔离复跑同一桥接文件均 7/7。audit/selftest/capability/fixture/diff 闸均通过。 | E-022 | 补齐 R18 标准收口登记，重跑 `dh dh-relay`。 |
| 2026-08-30 | 主会话 | 教训复核的 miner 备料产出已完成：复核结论与可搬运候选已落 `review-lessons-opus.md` / `lesson_candidates.md`；as-built 已更新 `as-built/relay-core.md` §3.12；E9 交付汇报已生成，摘要为 Attempt 身份、pause/retry、RPC v2、五路复核、机器闸与 DHR_34 边界；E10 证据展示区已生成并落 `review.md` 的 `DHR_61-E10-v1`。 | E-023 | 模块闸通过后提交收口证据并形成 verify。 |
| 2026-08-30 | 主会话 | 收口证据提交 `35df80d` 上再次执行全量，取得 237/237、exit 0；前一轮 Windows `EBUSY` 清理竞态未复现。 | E-026 | 回填 E10 后形成独立 verify 提交。 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | inspect | `git log -1 --oneline bbf78f9`；P6 DevPlan DHR_61 卡 | observed | B-23 已入主树且 DHR_61 的 D 开工范围已落户；未施工。 |
| E-002 | red-test | `cd relay-core; node --test test/attempt-contract.test.mjs` | fail (0/1) | 缺失 `relay.attempt-receipt/v1` 时 D1 正例被拒，红测确实钉在缺合同上。 |
| E-003 | test | `cd relay-core; node --test test/attempt-contract.test.mjs test/store.test.mjs` | pass (20/20) | 新 Receipt 合同的脱敏字段闭集、六项容量上限、Store 持久化/重放与既有 Store 行为均通过。 |
| E-004 | migration | `node profiles/migrate-profile-registry.mjs C:/Users/nash/.dh-relay/executor-profiles.json` | pass | 用户授权下仅迁移 fields 元数据；备份=`executor-profiles.json.bak-dhr61-2026-08-29T14-55-11-895Z`，无配置文件写入。 |
| E-005 | validate | `node profiles/validate-profiles.mjs C:/Users/nash/.dh-relay/executor-profiles.json` | pass | 迁移后用户级 Registry 仍符合闭集、脱敏、路径与 alias 校验。 |
| E-006 | test | `node --test test/contracts.test.mjs test/attempt-contract.test.mjs test/profile-identity.test.mjs test/profiles.test.mjs test/store.test.mjs` | pass (47/47) | 新 schema/fixture/Registry/Store 基础与既有定向回归均通过。 |
| E-007 | contract-check | `node tools/validate.mjs --selftest`；`npm run audit`；`node tools/capability-baseline.mjs` | pass (50/50; 0 违规; 12 schema) | 新协议 golden、结构审计、shared-ID 约束、token 清单与 capability 基线自洽。 |
| E-008 | test-cleanup | 两次 `npm test` 无终态；CIM 命令行/父链核验后停止仅含 `DHR_61/relay-core` 的 test 子进程 | observed | 全量回归未得终态，不作为通过证据；残留已清。 |
| E-009 | config-rule | 设置用户级 `CODEX_NINTH_HOME`；`node profiles/validate-profiles.mjs C:/Users/nash/.dh-relay/executor-profiles.json` | pass | `herdr.codex.ninth` 的非敏感字段白名单、可解析路径、config 存在性和 alias 均获校验；未读取配置值。 |
| E-010 | test + contract-check | `node --test test/profile-identity.test.mjs test/attempt-contract.test.mjs test/agent-node.test.mjs test/store.test.mjs`；`npm run audit`；`node tools/validate.mjs --selftest`；`git diff --check`；追加 `node --test test/attempt-contract.test.mjs test/store.test.mjs` | pass (34/34；追加 25/25；audit 0 违规；selftest 50/50；diff 无错误) | projection 只读白名单、Herdr Receipt 冻结、派生 ID 校验、prepared journal 补全、无 journal 残缺/路径逃逸 fail-closed 与 Store 既有行为均有终态证据。 |
| E-011 | red-test + test | `node --test test/attempt-contract.test.mjs` | fail (7/9 → `appendFallbackPauseResolution is not a function`)，后 pass (9/9) | 先证实 resolution API 缺失；随后证实同一 journal 的 fresh Attempt、同键幂等、旧 Attempt fence 与未冻结 profile 拒绝。 |
| E-012 | test + contract-check | `node --test test/store.test.mjs`；`npm run audit`；`node tools/validate.mjs --selftest`；`node tools/capability-baseline.mjs --write`；`git diff --check` | pass (18/18；audit 0 违规；selftest 50/50；13-contract capability hash=`a320483f...d976e0fc`；diff 无错误) | Store 既有回归、resolution schema/token/capability 基线和结构审计均有终态；联合 RPC 回归未得终态，未作为通过证据。 |
| E-013 | test | `node --test test/attempt-contract.test.mjs test/agent-node.test.mjs` | pass (22/22) | pause 人工候选集只能是 Receipt fallback 快照的有序子集；缺 projection 规则只冻结该 Herdr 节点，不拖停整届 driver。 |
| E-014 | contract-check | `npm run audit`；`node tools/validate.mjs --selftest`；`node tools/capability-baseline.mjs`；`git diff --check` | pass (0 违规；57/57；19 份 digest 与 `fb55f2…d073` 相符；diff 无错误) | 23 份 schema/shape、90 份 fixture、v1/v2 capability 双轨与结构 token 自洽。 |
| E-015 | review | `review-code1-opus.md` §7 | pass (P0=0，P1=0 after rework) | 代码轮 1 与整改复验闭合；未闭 P2/P3 逐项保留，不冒充零风险。 |
| E-016 | review | `review-code2-opus.md`、`review-req-opus.md`、`review-consistency-opus.md`、`review-lessons-opus.md` | observed | heavy Review Batch 四条 fresh 路径齐备；模型启动与状态栏均为 Opus 5，hook 的 Fable 自述矛盾如实留痕。 |
| E-017 | mutation | `review-code2-opus.md` §4 | pass (mutant 11/13, exit 1；restored 13/13, exit 0；before/after SHA256=`19f2b088…0ecb`) | `appendResult` 的 `E_ATTEMPT_FENCED` 守卫有真实杀伤力，且生产文件字节级还原。 |
| E-018 | human-acceptance | 用户 2026-08-30 明文：“就当61完成好了” | observed | H=0 卡的人类放行确认；不豁免 verify 与机器闸。 |
| E-019 | test + contract-check | `npm test`；`npm run audit`；`node tools/validate.mjs --selftest`；`node tools/capability-baseline.mjs`；`node tools/fixture-manifest.mjs`；凭据形态扫描；`git diff --check` | pass (237/237，exit 0；DHR_61 RPC/Store 定向 27/27；Windows lock 压测连续 3/3；audit 0 违规；selftest 57/57；capability 19 份；fixture 90 份；生产/文档凭据形态 0，3 处测试 sentinel；diff 无错误) | 最终冻结字节全量绿；v1 hash=`994d5f…c971e`，v2 hash=`fb55f2…d073`。中间非绿均如实登记并由恢复语义、测试等待上限及 Windows 锁创建竞争修正闭合。 |
| E-020 | verify | HEAD=`7083a2d`（父提交含锁修复 `38cb30f`）上执行 `npm test`、audit、selftest、capability、fixture、`git diff --check` | pass (237/237，exit 0；audit 0 违规；selftest 57/57；capability 19 份；fixture 90 份；diff 无错误) | 独立 verify 提交的机器依据；用户 E-018 放行与五路 Opus P0/P1=0 均已齐备。 |
| E-021 | governance-gate | `git commit -m "verify(dh-relay): DHR_61 identity pause and RPC contracts"` 的 PreToolUse 输出；`dh dh-relay` 按路径复查 | blocked (全模块 70 failures；DHR_61 failures=0) | 属于模块存量治理阻塞，不把测试绿误报成 verify 已形成；禁止绕过 hook。 |
| E-022 | test + baseline | rebase 后 HEAD=`20cf510`；`git diff 7083a2d..HEAD -- relay-core`；`npm test`；DHR_61 与 master 各跑 `node --test test/dsh-bridge.test.mjs`；audit/selftest/capability/fixture/diff check | observed + pass（实现字节零差异；全量 236/237，唯一 `EBUSY` 清理失败；隔离两侧各 7/7；audit 0；selftest 57/57；capability 19；fixture 90；diff 无错误） | 不把偶发清理失败写成全量绿；行为断言与冻结实现仍由 E-020 的同字节 237/237、当前其余 236 项及双侧隔离复跑共同支撑。 |
| E-023 | closeout | `review-lessons-opus.md`、`lesson_candidates.md`、`as-built/relay-core.md` §3.12、`review.md` `DHR_61-E10-v1` | pass | E6 miner、E7 as-built、E9 交付摘要与 E10 机器证据包均有仓内可回链内容。 |
| E-024 | review-dispatch | Herdr pane `dhr61_r1`，`claude --model opus`，状态栏 `Opus 5` | pass | 代码轮 1 由未参与施工的 Opus 实例执行，结论落 `review-code1-opus.md`。 |
| E-025 | review-dispatch | Herdr Review Batch panes `dhr61_code2` / `dhr61_req` / `dhr61_consistency` / `dhr61_lessons`，状态栏均为 `Opus 5` | pass | 代码轮 2、需求、一致性、教训四路独立派发与落件可回链。 |
| E-026 | test | HEAD=`35df80d`；`cd relay-core; npm test` | pass (237/237，exit 0) | 当前提交字节的最终全量终态；此前 `EBUSY` 清理竞态未复现。 |
