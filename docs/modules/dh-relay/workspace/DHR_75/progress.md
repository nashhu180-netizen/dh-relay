<!-- dh:v1 -->
# progress — DHR_75

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-04 | 主控 | 用户明文 D-start；在 `master@14008bd` 建 v2 七件工作区，冻结 heavy、允许路径、验收 A~F 与 E10 停线。 | 对话授权；DevPlan DHR_75 | 提交户口后开独立 worktree。 |
| 2026-09-04 | `/root/dhr75_s1_brief` | S1 fresh 只读校核：A~F/有效单测逐字承接，允许路径一致，禁改边界与授权止线准确，P0/P1=0。 | E-7502 | 主控提交户口并开树。 |
| 2026-09-04 | 主控 | 户口提交 `4559161` 后创建 `wt/DHR_75`；施工委托实例长时间无文件产出，主控收回后按 TDD 直接施工。 | E-7503 | 跑直接与冻结回归。 |
| 2026-09-04 | 主控 | 红证：现役 `spawnSync` 返回非 Promise，真实慢子进程结束前 renew timer 零调度；新增测试 1 fail/1 pass。 | E-7504 | 改为 async spawn 并补 Promise 传播。 |
| 2026-09-04 | 主控 | `herdr-cli` 改为 async `spawn`，超时等待 close；Windows 用 `taskkill /T /F` 清进程树；executor 全链补 await，直接回归转绿。 | E-7505/E-7506/E-7507 | 跑 host/DHR70/冻结五文件。 |
| 2026-09-04 | 主控 | 补齐机器证 B/C：首版 B 把所有 Herdr 动词都变成真实慢进程且 1.5s TTL 混入初始化抖动，诊断后收窄为仅 `agent get` 走真实慢子进程、5s 短 TTL；B 转绿，C 证明新 epoch 后三类旧写全拒。 | E-7510/E-7511 | 跑完整 DHR75 证据集并冻结候选。 |
| 2026-09-05 | `/root/dhr75_code_review1` + 主控 | heavy 代码轮1判代码 PASS、P0/P1=0，提出 taskkill 无自身上限与 pipe error 两条 P2；主控采纳，补 5s 清理闸、统一流错误收敛和逐次 lease/CLI/observation/checkpoint 时间线。 | E-7515/E-7516 | 叫回同一 reviewer 定向复审后提交整改。 |
| 2026-09-05 | 主控 + fresh 五路 | 代码轮2、教训、一致性均 PASS；第二轮指定生产变异按预期红、还原后绿。需求复核确认 A~E/有效变异闭合，但真实 F 因当前非 Herdr-managed pane 不可证，任务停在 E10 前 blocked。 | E-7520~E-7526 | 切入 `HERDR_ENV=1` 的受管 pane 后只补 F，再回需求复核。 |
| 2026-09-05 | 主控 | 已在 `HERDR_ENV=1`、DSH-off 的 Herdr pane 对 `e835edb` 跑冻结 Codex Profile；真实链仍在首观测前失租。定向计时定位为 Herdr CLI 之前的全 Profile 同步 alias 校验约 19.7s，超出 15s lease；该实现位于冻结禁改路径。 | E-7529/E-7530/E-7531 | 停在 E10 前；先走 B-adjust 决定承接卡与允许路径，不越界改代码。 |
| 2026-09-05 | 主控 | DHR_76 已收口后，把 `wt/DHR_75` rebase 到 `master@bf34886`；冲突只在测试入口，保留 DHR_76 与 DHR_75 两个独立 test token。DHR_75 专项 7/7 与 adapter 24 pass/3 frozen skip 均有终态通过。DHR_76 全套回归在第 4 项后无终态，已停止其本次 parent/child 测试进程，不将其计作通过或归因。 | E-7532/E-7533/E-7534 | 真实 F 仍须在 Herdr-managed pane 用新基线独立重跑；此前 E-7529 的失败只作旧基线事实。 |
| 2026-09-05 | 主控 | 在 `HERDR_ENV=1`、DSH-off 受管 pane 对 rebase 后候选跑冻结 Codex Profile。`attempt_started=06:15:53.096Z` 后首条 `host_observation_changed(alive)=06:16:00.057Z`，lease 到期为 `06:16:14.974Z`；F 的时序谓词成立。agent 随后在 `agent-ready` 显示 blocked，未发送无害命令，故无 checkpoint；该项仅为 F 的可选佐证。已脱敏并核验零原 Receipt/Attempt 字段与文件名。 | E-7535 | 等待 fresh 需求复核裁定该新实录后才可进入 E10；不把 blocked 或无 checkpoint 写成 DHR_72/DHR_35 通过。 |
| 2026-09-05 | 主控 | E11 授权后在主干暂存 squash 候选复验：DHR_75 整套在 A/B/C 后未取得终态，adapter 整套在 13 项通过后未取得终态，均无遗留测试进程；不记全套通过。分别重跑 D 两项，Windows timeout/子孙清理与 spawn/signal/空 stdout 均 1/1 exit=0。 | E-7537 | 提交 squash；主干体检如实保留 DHR_74 的独立 R31。 |
| 2026-09-05 | 用户 + 主控 | 用户在对话中明文确认 E11；DHR_75 已 squash 入 master `24ba064`。主干 `dh dh-relay` 仅余 DHR_74 R31，DHR_75 无 failure；verify 强闸因该独立失败拒绝，未代签、未销户。 | E-7538 | 不推送、不部署、不启动 DHR_72；DHR_74 R31 仍等 DHR_72 的 H。 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|---|---|---|---|---|
| E-7501 | inspect | `git rev-parse HEAD; git status --short; git worktree list --porcelain` | observed | D-start 基线为 `master@14008bd`，主树干净，既有 DHR_35/72/74 树未受扰动。 |
| E-7502 | session-run | `collaboration:/root/dhr75_s1_brief` | pass | S1 brief 校核 PASS；验收、允许路径、边界与 E10 止线无 P0/P1。 |
| E-7503 | inspect | `git rebase master; git branch --show-current; git rev-parse HEAD`（cwd=`.dh-worktrees/DHR_75`） | pass | 独立树为 `wt/DHR_75@4559161`，进场 rebase 已是最新 master。 |
| E-7504 | test | `node --test test/dhr75-host-lease-during-herdr.test.mjs`（修前） | fail | 2 tests：1 pass / 1 fail；失败为 `CLI 调用必须返回 Promise`，actual=`undefined`，构成同步阻塞红证。 |
| E-7505 | test | `node --test test/dhr75-host-lease-during-herdr.test.mjs`（初版修后） | pass | 5/5；默认 TTL 静态闸、事件循环 tick、真实 Host renew+contender、TTL-only 对照、Windows 超时进程树清理、spawn/signal/空 stdout 兼容均通过。 |
| E-7506 | test | `node --test test/herdr-adapter.test.mjs`（迁移前） | fail | 27 tests：20 pass / 4 fail / 3 skip；四红均为直接 CLI 包装测试尚未 await Promise。 |
| E-7507 | test | `node --test test/herdr-adapter.test.mjs`（迁移后） | pass | 27 tests：24 pass / 0 fail / 3 skip；三条 skip 是 DHR_72 冻结债，本卡未改写。 |
| E-7508 | test | `node --test --test-concurrency=1 test/runtime.test.mjs test/agent-node.test.mjs test/dhr64-driver-observation.test.mjs test/dhr69-false-ready.test.mjs test/dhr70-submission-gate.test.mjs` | fail | 54 tests：52 pass / 1 fail / 1 skip；唯一红为 `runtime.test.mjs:514` 5s 自停预算早于本机约 35s 初始化，文件不在本卡范围。DHR70/agent/DHR64/DHR69 均通过。 |
| E-7509 | test | 主树 `master@4559161` 与任务树分别运行 `node --test --test-name-pattern "会话在宿主层真实续租" test/runtime.test.mjs` | observed | 两边同名同因失败（约 35s，`freshLease=null`）；证明不是本卡 diff 引入。隔离 `TEMP=D:/Temp/dhr75-runtime` 仍同因失败。 |
| E-7510 | test | `node --test --test-name-pattern "DHR_75/B" test/dhr75-host-lease-during-herdr.test.mjs`（初版集成夹具） | fail | `attempt_started` 已落但 60s 内无 observation/checkpoint；诊断显示只调用一次真实 `agent get`。1.5s TTL 与本机 3.3s Store 初始化混入非目标变量。 |
| E-7511 | test | 同命令（仅 `agent get` 为真实慢子进程；5s TTL / 250ms tick） | pass | 1/1，约 29s；同一 Host actor 在慢调用后依次落 alive observation、checkpoint，lease 仍新鲜且 contender 返回 `E_LEASE_HELD`。 |
| E-7512 | test | `node --test test/dhr75-host-lease-during-herdr.test.mjs`（最终完整） | pass | 7/7，94.4s；A/B/C/D 在同一轮全部终态通过，含 TTL-only 反例、真实 Host/driver、三类 fencing、Windows 后代清理与错误形状。 |
| E-7515 | review-dispatch | `collaboration:/root/dhr75_code_review1`，候选 `fd3754e`，基线 `4559161` | pass | fresh 轮1：代码 PASS，P0/P1=0；P2 两条为 taskkill 清理缺自身上限/退出检查、pipe error 未收敛。另列 F、有效变异与时间线待补。 |
| E-7516 | test | 整改后 `node --test test/dhr75-host-lease-during-herdr.test.mjs`；再定向重试 `--test-name-pattern "DHR_75/B"` | observed | 完整轮 6 pass/1 fail，唯一红为已知 BL-17 `state.json.tmp -> state.json EPERM`；同一 B 有限重试 1/1 pass（29.2s），输出逐次时间线，记录 30+ 次 expiry 推进、两次真实慢 CLI、observation→checkpoint 与 contender 拒绝。D/Windows 后代清理在完整轮通过。 |
| E-7517 | test | `node --test test/herdr-adapter.test.mjs`（`adcdffb`） | pass | 27 tests：24 pass / 0 fail / 3 skip，113.3s；三条 skip 均为 DHR_72 冻结债。 |
| E-7518 | review-dispatch | `/root/dhr75_code_review1` 对 `fd3754e..adcdffb` 定向复审 | pass | F-7503/F-7504 闭合，P0/P1=0；剩余 P2 F-7505 是 taskkill 工具自身失效时的后代清理平台边界；时间线区间断言要求进一步收紧。 |
| E-7519 | test | `node --test --test-name-pattern "DHR_75/B" test/dhr75-host-lease-during-herdr.test.mjs`（逐项旧/新 expiry + CLI 区间断言） | pass | 1/1，29.7s；两次真实 CLI 区间内记录 30+ 次 expiry 单调推进，随后 observation seq=4、checkpoint seq=5、contender=`E_LEASE_HELD`。 |
| E-7520 | mutation | 轮2 `/root/dhr75_code_review2` 指定 `herdr-cli.mjs:103 callTimeoutMs→0`；命令见 `evidence/E-7520-mutation.txt` | pass | 原 hash `b69d4d2`→变异 `20bcdba`；红 exit=1、`:69 false !== true`；还原 hash `b69d4d2` 后绿 exit=0。 |
| E-7521 | inspect | `$env:HERDR_ENV`、DSH 进程、`herdr --version` | observed | `HERDR_ENV=null`、`dsh_process_count=0`、Herdr 0.8.2；Herdr skill 硬闸禁止外控，机器证 F 不可执行。 |
| E-7522 | review-dispatch | `/root/dhr75_requirement_review` 初审 + E-7519/E-7520 后定向复审 | fail | A~E 与有效变异 PASS；F=`unverifiable/blocked`，唯一 P1，不能进 E10/本地收口。 |
| E-7523 | review-dispatch | `/root/dhr75_lessons_review` 初审 + evidence/L-7501 后定向复审 | pass | 命中候选-73/78 的近失已纠正并沉淀 L-7501；候选-34/68/72 的证据落点已补；P0~P3=0。 |
| E-7524 | review-dispatch | `/root/dhr75_code_review2`，fresh，`4559161..dc547f7` | pass | P0/P1=0；F-7505 裁为非阻塞有意平台边界；独立选择 E-7520 生产变异点。 |
| E-7525 | inspect | `dh mine dh-relay DHR_75` | pass | exit=0，只读列出 81 条共享候选与抽取模板；L-7501 留本卡，因 allowed paths 不含共享 knowledge 不越界追加。 |
| E-7526 | review-dispatch | `/root/dhr75_consistency_review` | pass | 五维横向比对 PASS；P0/P1=0，P2=F-7505；未见 Promise/错误形状/10s-60s-15s/fake/package token 漂移。 |
| E-7527 | check | `dh dh-relay`（收口结构回填前） | fail | exit=1；DHR75 失败为 review 占位/R17/R12；另有存量 DHR74 R30/R31。前者本次回填，后者不归本卡。 |
| E-7528 | check | `dh dh-relay`（`d89a380`，blocked checkpoint） | observed | exit=1；DHR75 自身 failure=0，模块仅余存量 DHR74 R30/R31 两项；88 warnings 为存量提醒。证明本卡结构/R12/R17 已闭，但不覆盖真实 F。 |
| E-7529 | DSH-off real run | `HERDR_ENV=1` 的受管 pane；复用 DHR72 Windows runner、代码根改指 `wt/DHR_75@e835edb`；`ProfileId=herdr.codex.main`、`TimeoutSeconds=150` | fail | 事件止于 `attempt_started`，Host Observation=0；lease 从取得到 attempt 经过 20,337ms，attempt 时已过期 5,363ms。原始实录已脱敏保存于 `evidence/E-7529-real-f-r2/`。 |
| E-7530 | timing | 候选上两次 `loadExecutorProfiles()` 定向计时；静态追踪 `profile-registry.mjs → validateProfiles(resolveAlias:true) → spawnSync(where.exe/pwsh)` | observed | 两次为 19,676ms / 19,768ms，均在 `launchHerdrAgent()` 前；真实失租发生在本卡异步 Herdr CLI 获得执行前。 |
| E-7531 | evidence audit | DHR72 redactor 以 DHR75 workspace 为根执行并 dry-run；凭据样式计数；runner 后进程/pane 核销 | pass | redactor 首轮替换 2 个敏感 ID、7 文件、2 名称；复跑 0；凭据样式 0；DSH/service/fixture agent 均 0。 |
| E-7532 | session-run | `git rebase master`（cwd=`.dh-worktrees/DHR_75`）；冲突仅 `relay-core/package.json`，同时保留 `dhr76-profile-validation-lease.test.mjs` 与 `dhr75-host-lease-during-herdr.test.mjs` test token | pass | DHR_75 新基线=`master@bf34886`；DHR_76 的完整 Profile 校验与 DHR_75 的 lease 测试均未被入口冲突丢弃。 |
| E-7533 | test | `node --test --test-concurrency=1 --test-timeout=180000 --test-reporter=spec test/dhr75-host-lease-during-herdr.test.mjs`；随后同参数运行 `test/herdr-adapter.test.mjs` | pass | DHR_75 专项 7/7；adapter 24 pass / 3 frozen skip / 0 fail。专项时间线仍验证慢 CLI 期间续租、observation→checkpoint、contender=`E_LEASE_HELD`、fencing 与 Windows 进程树清理。 |
| E-7534 | bounded test | 同参数运行 `test/dhr76-profile-validation-lease.test.mjs`；四项输出后未得终态/退出码，确认并停止本次仅属该测试的 parent PID=17572 与 child PID=12968 | observed | 无终态不可算回归通过；未把该现象归因给 DHR_75，未重跑整套。 |
| E-7535 | DSH-off real run | 任务自有 `scripts/run-windows-checkpoint.ps1 -ProfileId herdr.codex.main -RelayRoot wt/DHR_75 -TimeoutSeconds 150`；`HERDR_ENV=1`、DSH process=0、独立 `DHR75-fixture-*` | observed | `attempt_started=06:15:53.096Z` 后首条 `host_observation_changed(alive)=06:16:00.057Z`，早于 lease expiry `06:16:14.974Z`，满足 DHR_75 F 的首观测/新鲜 lease 谓词。agent-ready=blocked，未发送无害命令，未见 checkpoint；checkpoint 非 F 必要条件。redactor 首跑 2 IDs/7 文件/2 文件名，dry-run=0，原 Receipt/Attempt 字段与文件名扫描均为 0。 |
| E-7536 | review-dispatch | collaboration read-only F evidence review | observed | 复核派出：/root/dhr75_f_review2｜fresh requirement re-review: E-7535 F PASS, P0/P1=0 |
| E-7537 | integration test | 主干暂存 squash 候选：DHR_75 全套与 adapter 整套均无终态（前者已输出 A/B/C 通过，后者已输出 13 项通过，均无残留 node）；分别运行 D timeout/子孙清理与 D 错误形状 | observed + pass | 两个 D 定向均 1/1、exit=0；无终态整套不算通过，保留 E-7533/E-7517 的已终态回归事实，不把本轮无终态归因于 DHR_75。 |
