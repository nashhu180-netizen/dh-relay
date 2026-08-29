<!-- progress.md -->
# progress — DHR_30 Relay CLI 与可选 DSH/Pi Bridge

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-23 | 主会话 | 用户确认标准档 DHR_30 开工与 worktree；在主树完成落户和八件套准备。 | 对话确认；DevPlan §3.1 | 从本地 master 建 `wt/DHR_30`，进树自检后施工。 |
| 2026-08-23 | 主会话 | `dh wt new DHR_30` 初建于 `origin/master` `554e543`；已在任务树立即 rebase 到本地 `master` `e52a45b`。 | `git worktree list --porcelain`；`git rebase master`；`git merge-base --is-ancestor master HEAD` | 在此树开始 CLI TDD。 |
| 2026-08-23 | 主会话 | 代码侦察确认 DHR_52 RPC server 只分派注入 seam，DHR_51 detached host 不开 RPC；正式 CLI 所需的 Runtime↔RPC 装配与端点发布/发现无人承接。 | F-001；`rpc/server.mjs`、`runtime/host.mjs`、P5 DevPlan §2.1/§3.2 | 等用户裁决范围归属；不写假 endpoint CLI。 |
| 2026-08-23 | 主会话 | 用户确认 service 内嵌 host、项目级操作账本、私有本机访问、legacy 全 control 拒绝；A-full/B-adjust 经六轮独立复审后定稿。 | design/07、design/08、evidence/10、review A-full 六轮 | 按正式合同实施 service、RPC 与 CLI。 |
| 2026-08-23 | 主会话 | 按合同完成前三笔实现：契约扩展+service 基础（2cd5c85 原 22fb29f）、参考 CLI 接入（4621fc3 原 b77c4b1）、CLI 本机身份固化（564962d 原 b8804e3）。〔失序补录：本行为 2026-08-27 补记，当时未随手更新 progress〕 | 三笔提交 diffstat；relay-core 测试 | 继续 service/RPC/CLI 施工。 |
| 2026-08-27 | 主控 | master 历史在分叉后被重写（同内容不同 SHA），将 wt/DHR_30 五笔独有提交 `rebase --onto master 888c472`；唯一冲突 design/README 拆计划白名单，裁决 = master 新结构（design/10）+ 保留 A-13/A-14 晋升的 design/07/08；旧线以 `keep/dhr30-pre-rebase-260827`（b8804e3）保留。rebase 后 `npm ci` + `npm test` 91/91 全绿。 | E-005、E-006 | 派发 Opus worker 继续施工。 |
| 2026-08-27 | 主控 | 用户指示：主 session 做主控、施工派 Opus（推理强度 high）headless worker，按 PlanHome `dh-relay--p5-p6-mainline--DHR_30-DHR_35--260827` 主线推进；施工分批 A=task_plan 步骤 1~3（service/RPC）、B=步骤 4（CLI）、C=步骤 4b+5（Bridge+设计落档），每批 fresh 小审。 | 用户 2026-08-27 对话 | 派发批次 A。 |
| 2026-08-27 | 主控 | 批次 A 小审（codex exec `--sandbox read-only`，GPT-5 fresh-context，机器只读沙盒）：**changes-requested**——R-A-01~03 三条 P1（error receipt 合同偏离 / 孤儿 Store 未只读 / discovery 不校验损坏账）+ R-A-04 一条 P2（actor 更替订阅断流），登记为 F-012~F-015；F-008/F-010 裁断为实现正确、建议回写 design/08，F-009 解释成立但实现未达自述。B-18 授权范围与基线联动核过无夹带，凭据红线抽查通过。用户已指示暂停，返工未派发。 | E-014 | 待用户恢复后：派返工修 F-012~F-015，design/08 回写两处待用户确认。 |
| 2026-08-27 | 批次 A worker | 逐条盘点树内既有三笔实现对 design/07+08 的覆盖度：步骤1 契约面已落但缺正/反例与红测；步骤2 service 仅有 happy-path 骨架，reservation/discovery/operation event/owner-aware 清理全缺；步骤3 subscribe 为假快照、可预期失败仍断连。详见下方「批次 A 盘点」。 | E-007 | 按盘点缺口逐单元 TDD 续做。 |
| 2026-08-27 | 批次 A worker | 步骤 1 收口：补 6 份 golden（client-read-model 四视图 + operation 事件 + failed 回执）与 7 组反例（含 per-method params 未知字段、failed 回执缺 reason、operation detail 违 pattern、两视图互斥），加「映射表逐行经冻结契约校验」红测；重生成 fixture manifest。 | E-008 | 转步骤 2。 |
| 2026-08-27 | 批次 A worker | 步骤 2 主体：canonical repo root（Windows 大小写折叠 / UNC 保留 / realpath）、owner-aware 端点绑定与清理、Store 的 operation 回执与订阅 barrier、`runtime/ledger.mjs` 保留号与 phase 恢复表、`runtime/discovery.mjs` 四步发现、actor 四接口与失租拒写、`runtime/launcher.mjs` 有界就绪。credential 改到 bind 之后读/建。 | E-009、E-010、E-012 | 转步骤 3。 |
| 2026-08-27 | 批次 A worker | 步骤 3：contracts 连接闸收为「唯一首请求」、可预期失败一律稳定 error 不断连、legacy 只读投影与 `E_LEGACY_READ_ONLY`、`include_legacy`、subscribe 真 barrier + 实时推送 + cursor 补发与 `E_CURSOR_GAP`、error data 带 failed Receipt（契约同批改并重算三份基线）。 | E-011、E-013 | 交回批次 A 报告。 |
| 2026-08-27 | 批次 A worker | 施工中查出并修掉三个 P1/P2：同步 throw 被误当不可预期错误断连（F-004）、launcher 认陈旧 descriptor（F-005）、运行期重读 ledger 导致同键重试重复执行（F-006）。三者都是先由新红测抓出、再定位修复。 | E-011、E-012 | 已登记 findings。 |
| 2026-08-27 | 批次 A 返工 worker | 返工轮开工自检：`wt/DHR_30` 干净、起点 `5790a37`、`npm test` 123/123 绿。逐条 TDD（先红后绿）修 F-012~F-015 四条，四笔逻辑提交，范围内不动 CLI / dsh-bridge / design 文档。 | E-015~E-019 | 逐条落 findings 后交回报告。 |
| 2026-08-27 | 批次 A 返工 worker | F-012：冻结 schema 的 `error_response.data.receipt` 收为 required、`sendError()` 恒发（非 operation 发 null，operation 可预期失败发 failed Receipt）；补契约反例 + 运行期形状断言；同批重算三份基线，`capability_hash` 2971189e… → a990fdda…。 | E-015（9b20cfc） | 转 F-014。 |
| 2026-08-27 | 批次 A 返工 worker | F-014：discovery 完整性判据改用 Store 的同一段事件账逐行校验（新只读出口 `readEventLog`，不像 `openStore` 那样重写 state.json）；JSON 坏 / torn tail / seq 缺口三类进 fail-closed report，且损坏根照样占号（与 F-008 保守 seed 一致）。 | E-017（eef216d） | 转 F-013。 |
| 2026-08-27 | 批次 A 返工 worker | F-013：孤儿 Store 落成只读——投影 `read_only:true`（source 仍 runtime-v2）、`inspectRun` detail 判据改看 source 故孤儿仍可读，control 与 actor 建立两道闸拒绝。新增协议码 `E_ORPHAN_STORE_READ_ONLY` 并入 `contracts/reason-codes.md`（含三条边界 + 不可重试语义 + 反例形态说明），码总数 30→31。**理由**：现有 30 码里没有贴合的——`E_LEGACY_READ_ONLY` 是 v1 世代、`E_RUN_NOT_FOUND` 会用索引缺失否定事件账、`E_SERVICE_NOT_READY` 的语义是「退避后会成功」，三者用上去都会误导客户端的重试决策。该码不入任何 schema 枚举（`reason_code` 只约束形态），故不改 `capability_hash`。 | E-016（f81b44a） | 转 F-015。 |
| 2026-08-27 | 批次 A 返工 worker | F-015：订阅归属由 (连接, actor) 改为 (连接, run)。`actor.done` 摘 barrier、新 actor ready 后按 `lastSentSeq` 与新 barrier 的 `next_seq` 切分补发再排空缓冲，`emit()` 加 seq 去重。回归 subscribe→stop→resume 的推送序列与盘上事件账逐一相等。 | E-018（ddaa58f） | 四条修完，收口跑全量与四道闸。 |
| 2026-08-27 | 批次 A 返工 worker | 收口：`npm test` 127/127、validator 48/48、audit 11 维 0 违规 / token 217 个 0 未登记、manifest 79 份、capability 10 份对证通过。另记一条范围外新发现 F-016（runtime.test 的 detached 宿主用例在全量并发下偶发超时，与本轮改动无关）。 | E-019 | 交回结构化报告。 |
| 2026-08-27 | 批次 B worker | 红测先行：先写 `test/cli.test.mjs` 八用例钉住 B-1~B-5 全部合同（七命令×text/json、错误渲染二分、legacy/孤儿透传、pending 崩溃收敛、follow 重连、E_CURSOR_GAP 重快照、凭据 guard），旧骨架下首跑红（模块不存在 + 大面积断言红）。 | E-021 | 转实现。 |
| 2026-08-27 | 批次 B worker | 实现：删 `cli/main.mjs` 内联 ensureService，新建 `cli/{client,pending,render}.mjs`——服务发现只走 `ensureRuntimeService`、凭据只读 `readLocalUserCapability`（缺失报 `E_LOCAL_USER_UNAUTHORIZED`）、contracts 唯一首请求回证、start/stop/resume 先落 pending record 再发送且启动时按原幂等键收敛、text/json 只渲染同一 Read Model、receipt 非 null/null 两段措辞二分。`package.json` test 列表挂入 cli.test.mjs（沿用批次 A 先例）。 | E-022 | 转 events --follow。 |
| 2026-08-27 | 批次 B worker | events 收口：`--follow` 断线重连按已送达高水位（printedSeq/snapshotSeq 取 max）带 `after_seq` 续传，`E_CURSOR_GAP` 整体重快照不拼接，stdin 关闭/SIGINT 正常收尾退出码 0。修掉两个实测抓出的缺陷：①非 follow 在 headless 下 stdin 立即 EOF 会把静默窗口砍没（收尾信号只挂 follow、窗口锚定快照后）；②补发事件（≤ 快照 seq）曾被快照游标去重挡掉（去重基线改为已打印事件 seq）。 | E-022 | 转全量收口。 |
| 2026-08-28 | 批次 B worker | 收口：CLI 8/8 绿；四道闸 validator 48/48、audit 217 token 0 未登记、manifest 79 份、capability 10 份 `a990fdda…` 与基线逐字相等，contracts/fixtures/基线 `git diff` 为空（本批零漂移）。全量 `npm test` 134/135：唯一红 = F-017 日期炸弹（范围外文件、本地跨午夜后确定性红）；F-016 偶发红本批未复现。登记 F-017。 | E-023、E-024 | 交回结构化报告。 |
| 2026-08-28 | 批次 B 返工 worker | 返工轮开工自检：`wt/DHR_30` 干净、起点 `342e740`、`npm test` 135/135 绿、validator selftest 48/48、capability `a990fdda…` 零漂移。按 task_plan「批次 B 返工说明」RW-0~RW-6 施工，白名单外零改动；F-024 已由主控直修，未触碰 `test/rpc-service.test.mjs`。 | E-028 | 修 RW-1~RW-5 + F-025。 |
| 2026-08-28 | 批次 B 返工 worker | fix 提交 `2a7eebf`：RW-1 identity 改 `wx` 独占创建、EEXIST 重读赢家，收敛重放用 record 内 `client_id`（F-018）；RW-2 pending 跨进程独占锁 + 完整请求落账（F-019）；RW-3 pending 目录 0700 / 文件与锁 0600（F-020）；RW-4 非 follow events 按 `next_seq` 精确计数收齐、30s 仅作 fail-out（F-021）；RW-5 缺 `receipt` 报协议违约且 pending 保留（F-022）；F-025 按命令声明 positional 形状。既有崩溃收敛用例残条随新格式同步更新。 | E-029 | 转 RW-6 测试。 |
| 2026-08-28 | 批次 B 返工 worker | test 提交 `3a9183d`：RW-6 七组新回归全走真实/假 service 真实子进程（CLI 8→15 用例，全量 142/142 绿）；docs 提交落本记录与 findings 状态（F-018~F-023、F-025 → resolved）。 | E-030、E-031 | 交回结构化报告。 |
| 2026-08-28 | 主控 | E-032 返工轮主控复验：三提交在树、工作树干净；独立复跑全量 `npm test` **142/142 绿**、validator selftest 48/48、audit 0 违规（217 token 0 未登记）、manifest 79 对证、capability baseline 10 份对证且 `capability_hash = a990fdda` 不变；diff 范围核过（仅 cli/** + cli.test.mjs + workspace 两文档）；抽查 F-018 wx 独占创建/EEXIST 重读赢家与 F-022 缺 receipt 抛 `E_PROTOCOL_VIOLATION` 属实。zcode 正常退出（exit 0，本轮 8.5M tokens）。 | E-032 | 派返工定向复审（codex 只读 fresh-context，范围 = 342e740 + 三返工提交，判 F-018~F-025 闭合）。 |
| 2026-08-28 | 主控 | E-033 返工定向复审（codex exec 只读，GPT-5 fresh-context，未参与实施；提示词 UTF-8 文件 + stdin）：**5 闭 3 未闭**。closed = F-022（缺 receipt fail-closed）、F-024（主控直修午夜窗口，确认未削弱断言）、F-025（positional 严格）；closed-with-note = F-018（实现合规，测试补强并入 F-023）、F-021（乱序 fail-safe 备注）。not-closed = F-019（R-D-01：陈锁回收无 owner token，旧持锁者无条件 unlink 可删新锁破坏互斥）、F-020（R-D-02：`.dh-relay/` 早被 descriptor 用默认 ACL 建好，mkdir mode 不收权）、F-023（R-D-03：identity/双 CLI 两组并发回归杀伤力不足）。R-D-04（范围）主控**驳回**：task_plan.md 变更属主控 342e740 写返工规格，worker 三提交经 `git diff --name-only` 核实仅白名单六文件。裁决：三条未闭派返工二轮（task_plan「批次 B 返工二轮说明」RW2-1~3），仍按执行链 zcode 优先；F-019 一轮属「修完引入新问题」计 1 次，按止损换人规矩再犯一次即换人。 | E-033 | 派返工二轮（RW2-1~3）。 |
| 2026-08-28 | 主控 | E-039 返工二轮主控复验：worker 四提交（c36ca54 fix RW2-1~2 / 2784f38 fix F-018 残余竞争 / a987fcd test RW2-3+权限断言 / db57cf0 docs）在树、树干净、范围核过（仅 cli/client.mjs、cli/pending.mjs、cli.test.mjs、workspace 两文档）；独立复跑 `npm test` **144/144 绿**、validator selftest 48/48、audit 0 违规（217 token 0 未登记）、manifest 79 对证、capability_hash `a990fdda` 零漂移；抽查锁 owner token 实现（释放/提交前核验、非己锁绝不 unlink、易主整段重试、回收后 wx 抢建防双回收）方向正确。 | E-039 | 派返工二轮定向复审（codex 只读 fresh-context，判 F-019/F-020/F-023 闭合 + 2784f38 附带审）。 |
| 2026-08-28 | 主控 | E-040 返工二轮定向复审（codex exec 只读，GPT-5 fresh-context）：**F-023 closed**（两组并发回归实质增强、改坏会红）、**2784f38 closed**（重读有界 ≈475ms、wx 语义未掩盖）、范围与基线合规；**F-019/F-020 仍 not-closed**——R-E-01（P1，token 核验到 rename 无原子围栏，冻结超 10s 的活持锁者醒来仍可提交进他人临界区）、R-E-02（P1，合同 owner-only 无平台例外而 win32 chmod 近似 no-op、无 DACL 证明）、R-E-03（P2，临时/锁权限断言非确定性）。总结论 changes-requested。裁决：F-019/F-020 已两轮未全闭、剩余为精细系统语义，按止损精神第三轮**主控直修**，不再派 GLM。 | E-040 | 主控直修 R-E-01~03。 |
| 2026-08-28 | 主控 | E-041 主控直修：①R-E-01 陈锁回收改双判据——mtime 陈旧**且**持有者 pid 已死（kill 0/ESRCH）才回收，活进程绝不回收（醒来仍唯一持锁，微窗根除；pid 撞号仅致稳定拒绝非正确性损失），token 双核验保留兜底；②R-E-02 win32 用 icacls 去继承 + 只授当前用户 (OI)(CI)F、fail-closed、每进程每目录一次，测试断言真实 DACL 每条 ACE 属当前用户（本机 win32 实测真过）；③R-E-03 writeRecords 增测试专用 beforeRename 钩子，确定性 stat 断言临界区内锁/临时文件 0600。新增①′钉子用例（陈旧 mtime + 活 pid → E_PENDING_LOCK_BUSY 且外锁健在）。复验：CLI 17/17、全量 **144/144 绿**、validator 48/48、audit 0 违规、capability_hash `a990fdda` 零漂移。 | E-041 | 派第三次定向复审（只审本笔直修对 R-E-01~03 的闭合）。 |
| 2026-08-28 | 主控 | E-042 三轮定向复审（codex exec 只读，GPT-5 fresh-context）：R-E-03 closed-with-note；**R-E-01/R-E-02 仍 not-closed**——R-F-01（P1：判死与 unlink 非同一文件对象，「检查后原子删除」在文件系统语义下不可得，自动回收路径始终有替换竞态）、R-F-02（P1：icacls `/grant:r` 不清既有显式 ACE）、R-F-03（P2：**合同冲突**——design/08:59-64 要求 `.dh-relay/` descriptor 沿业务仓 ACL 可发现，收紧整目录与之相抵）。范围与基线合规（hash `a990fdda` 复证）。**F-019/F-020 已满 3 轮返工未收敛，按 G6 停止循环、摆用户裁决**：F-019 推荐取消自动回收（陈锁 fail-closed + 手工恢复指引），F-020 推荐 pending 迁独立私有子目录（合同 §2 路径口径回写，需用户确认）。两条 P1 属 CLI pending 子系统局部，不阻塞批次 C（dsh-bridge + design/06 落档）施工，但阻塞批次 B 终局与收口。 | E-042 | 待用户裁决 F-019/F-020 方案；评估批次 C 是否先行。 |
| 2026-08-28 | 批次B返工二轮 worker | 返工二轮开工自检：`wt/DHR_30` 干净、起点 `194eb95`、隔离 `node --test test/cli.test.mjs` 15/15 绿（一轮收口态）。按 task_plan「批次 B 返工二轮说明」RW2-1~3 施工；白名单外零改动，task_plan.md 未动。 | E-034 | 修 RW2-1~2。 |
| 2026-08-28 | 批次B返工二轮 worker | fix 提交 `c36ca54`：RW2-1 锁文件改 `{pid, token, at}`（token=randomUUID）——释放与提交（rename/收账 unlink）前重读锁文件核验 token，非己锁绝不 unlink、易主抛内部 lockLost 放弃本次提交、整段 read-modify-write 从抢锁重试；陈锁回收维持 mtime>10s，unlink 后以 `wx` 抢建、抢不到按普通竞争退避（防双回收）。RW2-2 写前显式收权：目录 mkdir+`chmod 0700`（descriptor 以默认 ACL 预建的目录也兜底收紧）、锁/临时/pending 三类文件 mode 0600 + `chmod 0600`。改后既有 15 用例全绿。 | E-035 | 转 RW2-3 测试。 |
| 2026-08-28 | 批次B返工二轮 worker | RW2-3① 补强实抓 **F-018 一处残余竞争**：identity 并发回归多轮跑批偶发红（`E_STORE_CORRUPT:client-identity-unreadable:unknown`）——EEXIST 输家在赢家 `wx` 建档与内容落盘之间重读到空/半截 JSON，SyntaxError（无 `.code`）被误判损坏。fix 提交 `2784f38`：EEXIST 后 25ms×20 短退避重读等赢家写完，耗尽仍读不出才 fail-closed，「绝不覆盖」语义不变。 | E-036 | 转 test 收口。 |
| 2026-08-28 | 批次B返工二轮 worker | test 提交 `a987fcd`（CLI 15→17 用例）：①identity 并发——假 service 增握手旁路，断言两 CLI 的 contracts 首请求 `client_id` 相同 + identity 文件即该 id + 预置身份「逐字未变、握手用预置 id」负向钉子；②双 CLI mutating——诱饵残条 + 假 service 扣住收敛答复到两进程都重放才放行（消除合法收敛路径的概率干扰），轮询到**两条 request_id 都在账且锁已释放**才 SIGKILL（超时即红），收敛语义维持；③权限断言：POSIX 真实 mode 0700/0600（真实 CLI 落账路径 + 模块级「已存在宽权限」场景），win32 降级；④新增陈锁回收/新鲜外锁不骚扰/强制临界区中途回收三场景。跑批又实抓一坑：SIGKILL 落在第二位 adder 的锁释放窗内留新鲜陈锁，收口 CLI 吃满 5s 退避后 E_PENDING_LOCK_BUSY——轮询补「锁已释放」判据后 11 连跑全绿。 | E-037 | 转完工门。 |
| 2026-08-28 | 批次B返工二轮 worker | 收口：全量 `npm test` **144/144 绿**（142 + 2 新增）；validator selftest 48/48；capability baseline 10 份对证 `capability_hash = a990fdda…` 不变；contracts/fixtures/三基线 `git diff` 为空；`git status` 干净。docs 提交落本记录与 findings（F-019/F-020/F-023 → resolved）。注：本轮共四笔提交而非 RW2-4 的三笔——RW2-3① 实抓的 F-018 残余竞争属实现缺陷，单独立 fix 提交（2784f38）以保可审性，其余仍按 fix/test/docs 拆分。 | E-038 | 交回结构化报告。 |
| 2026-08-28 | 主控 | E-043 用户裁决落地（F-019/F-020，G6 停损后摆用户的两条）：用户选「取消自动回收」+「迁独立私有子目录」。直修 `cli/pending.mjs`——①删掉 `LOCK_STALE_MS` 与全部自动回收路径，外锁一律稳定拒绝并按持有者存活二分给恢复指引（`lock-holder-dead:pid=..:since=..` 提示确认无 CLI 在跑后手工删锁 / `lock-holder-alive:pid=..`），R-F-01 的「检查后原子删除」竞态从根上消失；②pending 落点迁 `<repo>/.dh-relay/private/`（锁/临时同目录），private/ 为本模块独占子目录、descriptor 所在的 `.dh-relay/` 根仍沿业务仓 ACL，R-F-03 的合同冲突解除；icacls 补 `/reset` 三步收权清既有显式 ACE（R-F-02）。`design/08` §2 补落点条款；`test/cli.test.mjs` 两处用例改名重写（外锁三场景 + private/ owner-only 且外来 ACE 被清）。复验 CLI 17/17、全量 144/144 绿。 | E-043 | F-019/F-020 → resolved；转批次 C。 |
| 2026-08-28 | 主控 | E-044 主控直修 F-026（批次 C worker 实抓的架构缺口）：`run_list` 投影原按目录扫描顺序 push，源头 `group` 改变后条目位置不动，违反 P4 B-13「分堆与排序由源头给」。`runtime/discovery.mjs` 新增 `orderRunSummaries()`——分堆词表序 `needs_you → running → done → failed`、词表外 group 按首现顺序自成一堆排已知堆之后、group 为 null 殿后、堆内 `run_id` 升序；`runtime/service.mjs` 的 `listRuns` 出口统一套用。排序规则同步冻结进 `design/06` §14.4（客户端不得自行推导）。提交 `336b389`。 | E-044 | 续派批次 C worker 按已冻结规则修断言 + 完工门。 |
| 2026-08-28 | 批次 C worker（续做轮） | 按冻结排序规则重写 C-4 镜像断言①：同组基线 `[R001,R002]`（run_id 升序）→ R002 事件账进 `waiting_human` 后必须变 `[R002,R001]`，且该条目差异恰为 `run_status/group/updated_at` 三字段、未改的 R001 逐字不漂移；断言②维持。定向 `node --test test/read-model-mirror.test.mjs` 2/2 绿。全量门在其沙箱内报 11 项 `EPERM`，登记 F-027 后停工、未提交。 | E-045 | 主控接手裁 F-027 + 复验 + 落账。 |
| 2026-08-28 | 主控 | E-046 批次 C 主控复验 + F-027 裁决：范围核过（仅 `adapters/dsh-bridge/index.mjs`、`fixtures/clients/` 五份、三份新测试、`package.json` test 行、workspace 两文档，白名单外零改动）；无沙箱复跑全量 `npm test` **149/150**——唯一红是 `rpc-service.test.mjs:352` subscribe 超时（F-016 同族偶发，隔离 `node --test test/rpc-service.test.mjs` 11/11 绿），worker 报的 11 项 `EPERM` **一项不复现**。裁定 F-027 为施工沙箱取证限制而非产品缺陷（两条报错路径 `%TEMP%\...` 与 `~/.dh-relay` 均在 codex `workspace-write` 可写根外），降 P3 → resolved；今后不再要求 headless worker 自证全量门。抽查：adapter 零 `store/**` import、handshake 与 `cli/client.mjs` 逐字段一致、不写 pending 账（C-3 边界注释在位）；两条镜像断言双证成立。四道闸：validator 48/48、audit 0 违规（217 token 0 未登记）、manifest 79 对证、capability_hash `a990fdda` 零漂移。 | E-046 | 批次 C 三笔提交由主控代落（worker 已停工），随后派批次 C 小审。 |
| 2026-08-28 | 主控 | E-047 批次 C 小审（codex exec 只读，GPT-5 fresh-context，未参与实施；范围 `db57cf0..60018a0`，含此前从未被复核过的用户裁决直修 `6133507`）：**changes-requested**，四条发现登记为 F-028~F-031。清单判定：F-026 排序 closed、C-3 决策 closed、fixtures closed、范围与基线 closed-with-note（复核者独立复证 capability_hash `a990fdda`、manifest 79 份、validator 48/48、audit 0 违规）、F-019/F-020 closed-with-note、文档与 F-027 closed-with-note（**复核者在自己的只读沙箱里也复现了 `%TEMP%` 的 EPERM，独立佐证 F-027 判为沙箱限制成立**）；not-closed = C-4 镜像断言（R-G-03）、adapter 边界（R-G-01/R-G-02）。复核者另指出我的派活提示词把 `db57cf0..HEAD` 写成六笔（实为十笔，前四笔已在 E-042 范围内复核过）——提示词口径瑕疵，不影响复核覆盖。 | E-047 | 裁决四条 → 派批次 C 返工。 |
| 2026-08-28 | 主控 | E-048 四条发现的裁决与直修：**F-028 部分驳回**——`adapters/dsh-bridge/index.mjs:34-40` 的调用次序与参考实现 `cli/client.mjs:152-153` 逐字相同，凭据由**首次成功 bind 的 service** 创建是本仓既定引导设计（`cli/client.mjs:38-41` 明写，无独立 init 命令），adapter 自身只读、未越权，判非缺陷；保留的真问题是注释「绝不创建凭据」会被误读，转 RW3-1 精化。**F-029/F-030 采纳**，转 RW3-2/RW3-3 派返工。**F-031 主控直修**：`cli/pending.mjs` 两条锁拒绝文案补明「pid 只是瞬时存活线索、不是所有权凭据」，恢复步骤改为「停光本机 CLI → 复核锁面 → 才手工删除」；既有测试只匹配 `lock-holder-dead`/`lock-holder-alive` 前缀不受影响，CLI **17/17 绿**复证。 | E-048 | 派批次 C 返工（RW3-1~RW3-4，执行链按用户指示仍用 codex）。 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | observed | 用户对话确认；`dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §3.1 | observed | DHR_30 获得开工/worktree 授权。 |
| E-002 | command | `dh wt new DHR_30`；任务树内 `git rebase master`；`git merge-base --is-ancestor master HEAD` | pass | 任务树=`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\DHR_30`、分支=`wt/DHR_30`、基点与本地 master 一致。 |
| E-003 | inspect | `rg` / 逐段读取 `relay-core/rpc/server.mjs` 与 `relay-core/runtime/host.mjs`，对照 P5 §2.1/§3.2 | observed | F-001：现存 RPC 仅有注入 handler seam，host 不开 RPC，无法形成正式 CLI 的 Runtime 连接。 |
| E-004 | command | `dh dh-relay`（DHR_30 worktree，A-13/A-14、B-18 落盘后） | pass | 正式设计输入与 DevPlan B-adjust 结构校验 0 failure。 |
| E-005 | command | `git rebase --onto master 888c472 wt/DHR_30`（冲突 1 处已裁决）；`git branch keep/dhr30-pre-rebase-260827 b8804e3` | pass | wt/DHR_30 已基于重写后 master 9e62084；旧线可达性保留。 |
| E-006 | command | `cd relay-core && npm ci && npm test`（rebase 后任务树内） | pass | 91/91 全绿，rebase 未破坏既有实现基线。 |
| E-007 | inspect | 逐份读 `relay-core/{contracts,runtime,rpc,store,test}`，对照 design/07 §3~§7 与 design/08 §1~§5 | observed | 批次 A 起点盘点：步骤1 约 80%、步骤2 约 35%、步骤3 约 40%（缺口清单见下节）。 |
| E-008 | command | `cd relay-core && node tools/validate.mjs --selftest`（补正反例后） | pass | golden 17 + negative 30 全数命中写死的 reason 与出错位置，合计 47/47。 |
| E-009 | command | `cd relay-core && node --test test/store.test.mjs test/ledger.test.mjs test/discovery.test.mjs` | pass | 28/28：operation 回执落账与跨重启幂等、订阅 barrier 无缝、cursor 缺口拒绝、JCS 幂等键与摘要、六 phase 恢复表、四步发现与索引修复。 |
| E-010 | command | `cd relay-core && node --test test/discovery.test.mjs` | pass | 5/5：残缺根只进 report、Store 事件优先于 ledger、缺根保留号不释放、legacy 只读零猜值、runs.json 修复不动跨仓 segment。 |
| E-011 | command | `cd relay-core && node --test test/rpc-service.test.mjs` | pass | 8/8：真 socket + 真 Store + 真 lease；连接闸、稳定 error、保留号幂等、stop/resume 时序、subscribe 快照/增量/cursor、并发同键、逐 phase 崩溃重试。 |
| E-012 | command | `cd relay-core && node --test test/service.test.mjs` | pass | 10/10：含真实 detached 进程的双 launcher 竞争、篡改/陈旧/损坏 descriptor 全 fail-closed、SIGKILL 后重启重新发现且同键重试同一回执。 |
| E-013 | command | `cd relay-core && npm test && node tools/validate.mjs --selftest && node tools/audit-contracts.mjs && node tools/fixture-manifest.mjs && node tools/capability-baseline.mjs` | pass | 123/123；validator 47/47；audit 11 维度 0 违规、token 217 个 0 未登记；manifest 77 份；capability 10 份，`capability_hash = 2971189ecaa44507…`（因 error data 增 `receipt` 而变更）。 |
| E-014 | command | `codex exec --sandbox read-only -C .dh-worktrees/DHR_30 <批次A小审提示词>`（区间 02a0a6f..3f92e21） | observed | 批次 A 小审 changes-requested：R-A-01~04（→F-012~F-015）+ F-008/F-009/F-010 三处裁断；复核身份 = GPT-5 fresh-context 机器只读沙盒。 |
| E-015 | command | `cd relay-core && node --test --test-name-pattern="每一份 error data" test/rpc-service.test.mjs`（改 schema 前后各一次） | pass | F-012：改前红（「error data 必须恒带 receipt 字段」失败），改后绿。非 operation 三处 `receipt===null`、重启后 stop 得 failed Receipt 且同键重试同一份。 |
| E-016 | command | `cd relay-core && node --test --test-name-pattern="孤儿" test/rpc-service.test.mjs test/discovery.test.mjs` | pass | F-013：改前 2 红（read_only 仍为 false），改后 2 绿。孤儿可 list/status/inspect/subscribe，stop/resume 均 `E_ORPHAN_STORE_READ_ONLY`，事件账零字节变化且无 `host-lease.json`。 |
| E-017 | command | `cd relay-core && node --test test/discovery.test.mjs` | pass | F-014：6/6。新增「损坏事件账不得冒充完整 v2 Run」覆盖 JSON 坏 / torn tail / seq 缺口三类——改前红（坏账混进 v2 列表），改后进 fail-closed report 且 `next_seq` 仍为 2（损坏根照样占号）。 |
| E-018 | command | `cd relay-core && node --test --test-name-pattern="订阅无缝重挂" test/rpc-service.test.mjs` | pass | F-015：改前红（等新事件超时 17s），改后绿。subscribe→stop→resume 后推送 seq 序列与盘上事件账 deepEqual，`lease_acquired`×1 + `operation_committed`×2 全数推达。 |
| E-019 | command | `cd relay-core && npm test && node tools/validate.mjs --selftest && node tools/audit-contracts.mjs && node tools/fixture-manifest.mjs && node tools/capability-baseline.mjs` | pass | 返工轮收口：127/127；validator 48/48（golden 17 / negative 31）；audit 11 维 0 违规、token 217 个 0 未登记；manifest 79 份；capability 10 份，`capability_hash = a990fddad486f669…`（F-012 改契约所致，属预期）。 |
| E-021 | command | `cd relay-core && node --test test/cli.test.mjs`（实现前首跑） | fail | 红测证据：`cli/client.mjs` 不存在模块级红；旧骨架下文本渲染/`--include-legacy`/pending/follow 全部断言红。 |
| E-022 | command | `cd relay-core && node --test --test-timeout=150000 test/cli.test.mjs`（实现后，含两次缺陷修复回归） | pass | CLI 8/8：七命令×text/json 矩阵（`status --json` 与直连 RPC 结果 deepEqual）、错误二分措辞互斥、legacy/孤儿透传、pending 残条按原 request_id 收敛且不产生第二个 Run、follow 重连事件 seq 连续区间无重无漏、E_CURSOR_GAP 重快照恰一次。 |
| E-023 | command | `node tools/validate.mjs --selftest && node tools/audit-contracts.mjs && node tools/fixture-manifest.mjs && node tools/capability-baseline.mjs`；`git diff -- contracts fixtures capability-baseline.json` | pass | validator 48/48；audit token 217 个 0 未登记；manifest 79 份；capability 10 份 `a990fdda…` 逐字相等；契约/fixture/三份基线零 diff——本批未动契约，基线漂移闸通过。 |
| E-024 | command | `cd relay-core && npm test`（两遍）+ 隔离复跑 `node --test test/rpc-service.test.mjs` / `node --test test/runtime.test.mjs` | observed | 第一遍 133/135（+F-016 ESRCH 偶发）、第二遍 134/135；唯一稳定红 = F-017 日期炸弹，隔离复跑同断言红、`date` 证实本地已跨 2026-08-28；runtime.test 隔离 25/25 绿。两败均在批次 B 白名单之外、与本批改动无关。 |
| E-028 | command | `git status`（干净）；`node --test test/cli.test.mjs`；`npm test`；`node tools/validate.mjs --selftest`；capability baseline 对证（返工轮开工前） | pass | 起点 342e740 全量 135/135 绿、validator 48/48、capability_hash `a990fdda…` 不变——返工基线干净。 |
| E-029 | command | fix 提交 `2a7eebf`（client/pending/main + 崩溃用例残条新格式）；逐项隔离复跑 `node --test test/cli.test.mjs` | pass | RW-1~RW-5 + F-025 全部落地：identity `wx` 独占、pending 锁与完整请求、0600/0700、`next_seq` 精确收齐、缺 receipt 协议违约、多余 positional usage；CLI 8/8 既有用例全绿。 |
| E-030 | command | test 提交 `3a9183d`；`node --test test/cli.test.mjs`（15 用例）；`npm test` 全量 | pass | CLI 15/15 绿（新增：双 CLI 身份竞争、50 路并发 add/remove 零丢失、双 CLI 黑洞打断零丢失+收敛、凭据缺失子进程 E2E、缺 receipt 协议违约负例、慢 backfill 精确收齐、多余 positional usage）；全量 142/142 绿（135 存量 + 7 新增）。 |
| E-031 | command | `node tools/validate.mjs --selftest`；capability baseline 对证；`git diff -- contracts fixtures capability-baseline.json`；`git status` | pass | validator 48/48；capability_hash `a990fdda…` 不变；三份基线与 contracts/fixtures 零 diff（返工轮零契约漂移）；工作树干净，返工轮共三笔提交（2a7eebf / 3a9183d / docs）。 |
| E-034 | command | `git status`（干净）；`git log --oneline -1`（= 194eb95）；`node --test test/cli.test.mjs`（一轮收口态） | pass | 返工二轮开工基线：起点 194eb95，既有 CLI 15/15 绿。 |
| E-035 | command | fix 提交 `c36ca54`（cli/pending.mjs）；`node --test test/cli.test.mjs` | pass | RW2-1~2 落地且既有 15 用例零回归（含 50 路并发 add/remove、黑洞打断收敛、崩溃收敛）。 |
| E-036 | command | 全量跑批中 identity 并发回归偶发红（stderr=`E_STORE_CORRUPT:client-identity-unreadable:unknown`，退出码 1）；fix 提交 `2784f38`（cli/client.mjs）后多轮复跑不复现 | pass | RW2-3① 实抓 F-018 残余竞争并修复：EEXIST 后重读吃赢家半截建档 → 25ms×20 短退避重读，绝不覆盖语义不变。 |
| E-037 | command | test 提交 `a987fcd`（test/cli.test.mjs，CLI 17 用例）；`node --test test/cli.test.mjs` 连续 18 轮（含 2 个失败轮留痕） | pass | RW2-3 两组断言 + RW2-2 权限断言 + 锁 token 三场景落地；失败轮分别实抓 F-018 残余竞争（→E-036）与「杀在锁释放窗留新鲜陈锁」，后者补轮询锁判据后 11 连跑全绿。 |
| E-038 | command | `npm test`；`node tools/validate.mjs --selftest`；`node tools/capability-baseline.mjs`；`git diff --stat HEAD -- contracts fixtures capability-baseline.json`；`git status` | pass | 全量 144/144 绿；validator 48/48；capability_hash `a990fdda…` 不变；基线零 diff；工作树干净。 |
| E-039 | command | 返工二轮主控复验：`git log --oneline`（c36ca54 / 2784f38 / a987fcd / db57cf0）；`git diff --name-only 194eb95..db57cf0`；`npm test`；四道闸全套 | pass | 四提交在树、范围仅 cli/{client,pending}.mjs + cli.test.mjs + workspace 两文档；全量 144/144；capability_hash `a990fdda` 零漂移。 |
| E-040 | inspect | `codex exec --sandbox read-only`（GPT-5，fresh-context，提示词 UTF-8 文件 + stdin），范围 = 返工二轮四提交 | observed | F-023 与 2784f38 判 closed；F-019/F-020 仍 not-closed（R-E-01 无原子围栏 / R-E-02 win32 无 DACL 证明 / R-E-03 权限断言非确定性），总结论 changes-requested。 |
| E-041 | command | 主控直修 R-E-01~03（`cli/pending.mjs` + `test/cli.test.mjs`）；`node --test test/cli.test.mjs`；`npm test`；四道闸 | pass | CLI 17/17、全量 144/144；pid 存活双判据 + icacls DACL 断言 + beforeRename 确定性权限断言落地；基线零漂移。 |
| E-042 | inspect | `codex exec --sandbox read-only`（GPT-5，fresh-context），只审 E-041 直修对 R-E-01~03 的闭合 | observed | R-E-03 closed-with-note；R-F-01/R-F-02/R-F-03 三条新问题使 R-E-01/R-E-02 仍 not-closed。**满 3 轮未收敛，触发 G6 停损**，F-019/F-020 摆用户裁决。 |
| E-043 | command | 用户裁决落地：`cli/pending.mjs`（取消自动回收 + 迁 `private/`）、`design/08` §2、`test/cli.test.mjs`；`node --test test/cli.test.mjs`；`npm test` | pass | CLI 17/17、全量 144/144；提交 `6133507`。外锁一律稳定拒绝并带恢复指引；private/ owner-only 且外来 ACE 被 icacls `/reset` 清除。 |
| E-044 | command | `runtime/discovery.mjs` 新增 `orderRunSummaries()` + `runtime/service.mjs` listRuns 套用 + `design/06` §14.4 冻结规则；提交 `336b389` | pass | F-026 闭合：run_list 排序改由源头给（分堆词表序 + 堆内 run_id 升序），客户端不推导。 |
| E-045 | command | `node --test test/read-model-mirror.test.mjs`（批次 C worker 续做轮，沙箱内） | pass | 2/2 绿：断言①基线 `[R001,R002]` → 改 group 后 `[R002,R001]` 位置确实移动；断言②只改 run_status 时投影逐字不变。 |
| E-046 | command | 主控无沙箱复验：`git status --porcelain -uall`；`npm test`；`node --test test/{dsh-bridge,client-fixtures,read-model-mirror}.test.mjs`；`node --test test/rpc-service.test.mjs`；`node tools/validate.mjs --selftest`；`npm run audit`；`node tools/capability-baseline.mjs --verify`；`node tools/fixture-manifest.mjs --verify` | pass | 全量 149/150（唯一红 = F-016 同族 subscribe 偶发超时，隔离 11/11 绿）；批次 C 三份新测试 6/6；validator 48/48；audit 0 违规；manifest 79 对证；capability_hash `a990fdda` 零漂移。worker 报的 11 项 `EPERM` 一项不复现 → F-027 判为沙箱取证限制。 |
| E-047 | inspect | `node <codex.js> exec -c model_reasoning_effort=high --sandbox read-only -C <worktree> - < scratchpad/batch-c-review-prompt.txt`（GPT-5 fresh-context）；log:`scratchpad/codex-batch-c-review.log` | observed | changes-requested：R-G-01(P1)/R-G-02(P1)/R-G-03(P2)/R-G-04(P3) → F-028~F-031。8 项清单 5 closed / 2 closed-with-note / 2 not-closed。**注**：`codex` 这个 Git Bash shim 在工具沙箱里会因 `/usr/bin/dirname` 权限被拒而挂（MODULE_NOT_FOUND），改直调 `node .../@openai/codex/bin/codex.js` 后正常。 |
| E-048 | command | 主控直修 F-031（`cli/pending.mjs` 两条锁拒绝文案）；`node --test test/cli.test.mjs` | pass | CLI 17/17 绿；恢复指引不再把 pid 当所有权凭据。 |
| E-049 | command | **CLI 终端侧真实跑通冒烟**（用户 2026-08-28 点名重点）：scratchpad 全新真实 git 仓（`.gitignore` 前置），每条命令独立进程、service 由 CLI 自行发现拉起：`start`（receipt committed，run_id `R001-smoke-20260828`）→ `list` text/json 同源 → `status`（host alive、state_signature）→ `inspect`（node_states）→ `events`（seq 连续、快照+账面）→ `stop`（host 优雅停、Run 不取消、run_status 保持）→ `resume`（host 复活 epoch 不乱）→ `events --follow` 挂着时另一终端发 stop：**事件 [15] 与 runStateChanged 实时推达**；follow 客户端被杀后 Run 与账面零影响。转录 log:`scratchpad/cli-smoke-transcript.txt` | pass | 七命令真实终端全通；「客户端断开不取消 Run」在真实场景复证。**过程发现非缺陷行为一则**：后台跑 follow 时 stdin=/dev/null 立即 EOF 触发「stdin 关闭=优雅结束 follow」设计行为，表现为只打快照即退出——姿势问题，stdin 撑住后推送正常。 |
| E-050 | command | 批次 C 返工主控复验：范围核过（`git diff --name-only 37d7bb9..HEAD` 仅 adapter + 两份授权测试 + workspace 两文档 + 主控自己的 review.md）；无沙箱全量 `npm test` **153/153 绿**（150→153，F-016 偶发未现）；validator 48/48；audit 0 违规（217 token 0 未登记）；capability baseline 10 份对证 `a990fdda` 零漂移；manifest 79 对证。抽查 `0287c1e`：closePending 幂等 + 清计时器 + `E_CONNECTION_CLOSED` 稳定 reason、请求短路、`onClosed` 摘除活动集；worker 自抓的「重连快照抢先推进高水位误滤 cursor 补发」修正方向正确（仅首订阅推进 deliveredSeq）。 | pass | F-029/F-030 修复在树且有牙；派返工定向复审（fresh-context 只读）。 |
| E-020 | review-dispatch | `codex exec --sandbox read-only`；范围 `5790a37..3e160ad` | observed | F-012~F-015 定向复审 approved。 |
| E-026 | review-dispatch | `codex exec --sandbox read-only`；批次 B 四提交 | observed | changes-requested，F-018~F-025。 |
| E-033 | review-dispatch | fresh-context 定向复审；342e740 + 返工三提交 | observed | 5 闭 3 未闭，转返工二轮。 |
| E-051 | review-dispatch | fresh-context；范围 `37d7bb9..0ce5ab3` | observed | changes-requested，转 F-032/F-033。 |
| E-052 | test | F-032/F-033 两处变异双验 + 全量 | pass | 目标用例各自精准红，复原 7/7、全量 155/155。 |
| E-053 | review-dispatch | fresh-context；只审 `5327cfb` | observed | approved，F-032/F-033 closed。 |
| E-054 | review-dispatch | 第二轮全卡 fresh 复核 | observed | changes-requested，转 F-034/F-035。 |
| E-055 | test | `2602eab`；全量与变异 | pass | F-034/F-035 直修，全量 157/157。 |
| E-057 | test | `de79d05`；全量与两处变异 | pass | F-036/F-037 直修，全量 158/158。 |
| E-059 | review-dispatch | fresh-context 教训复核 | observed | changes-requested，候选与 miner 映射整改。 |
| E-060 | review-dispatch | fresh-context 需求复核 | observed | changes-requested，转 E-061/E-062。 |
| E-061 | e2e | `evidence/cli-smoke-20260828.txt` | pass | 真实 CLI 17 命令头/17 exit code 全 0。 |
| E-062 | remediation | review、DevPlan、教训候选整改 | observed | 需求/教训两路整改落地。 |
| E-063 | review-dispatch | fresh-context 整改闭合窄审 | observed | 需求车道裁定成立，三处精度问题直修。 |
| E-064 | review-dispatch | fresh-context R-P 终审 | observed | approved，五路复核收敛。 |

阶段汇报@批次B（G6 停损摆用户 F-019/F-020，2026-08-28 对话）；阶段汇报@批次C（施工+小审+返工全景交付汇报，2026-08-28 对话）；阶段汇报@CLI终端冒烟（E-049 结果与条件5裁决落地汇报，2026-08-28 对话）。

| 2026-08-28 | 主控 | E-051 返工定向复审（codex exec 只读，GPT-5 fresh-context；范围 `37d7bb9..0ce5ab3`）：**changes-requested**，但核心大件全部独立确认——F-029① pending close **closed**（contracts 首请求在途同样被收尾）、F-030 **closed**（字段面与 §14.2 一致、多/漏字段均红、15s deadline 把挂起转明确失败）、F-028 注释 **closed-with-note**（零行为变更）、deliveredSeq 高水位改动**主修方向被独立验证为真 bug 修复**（对照 `runtime/service.mjs:482-512`：服务端先快照再按旧 cursor 补发，旧实现确会丢补发）。新发现两条窄边界：R-H-01（P1 零预算路径静默死）、R-H-02（P2 gap 消耗重试预算破坏重快照合同）→ F-032/F-033。log:`scratchpad/codex-rw3-review.log` | E-051 | 两条均属四行级边界修补且非「修完引入新问题」恶化，按直修先例主控直修。 |
| 2026-08-28 | 主控 | E-052 主控直修 F-032/F-033：循环走完仍 active 统一 `closeSubscription('retries-exhausted')`；gap 分支恢复不占预算重试（`attempt -= 1; continue`，cursor 清空后下一击不可能再 gap）。新增两条回归：零预算断线走 onClosed（真实 socket）；重连途中 gap 不占预算（fake service 扣第二次 subscribe 回 gap，断言 cursor 序列 `[null,3,null]`）。**变异双验**：分别删掉两处修复，各自目标用例精准红（5.6s / 8.5s），复原 7/7。全量 `npm test` **155/155 绿**；capability_hash `a990fdda` 与 manifest 79 零漂移。 | E-052 | 派窄幅三审（只审 F-032/F-033 闭合）。 |
| 2026-08-28 | 主控 | E-053 窄幅三审（codex exec 只读，GPT-5 fresh-context；只审 `5327cfb`）：**approved，零新发现**。R-H-01 closed（active 门控 + closeSubscription 先置 active=false，无双通知）；R-H-02 closed（`attempt -= 1; continue` 不占预算不吃退避；独立对照 `service.mjs:482-490` 确认 after_seq=null 不可能连续 gap，无死循环；`[null,3,null]` cursor 序列证明 gap 落在重连循环内而非初订外层 catch）；两条回归均判有牙（fake service 的 descriptor/capability 匹配，不会误入 launcher 15s 等待）；范围仅 adapter + 该测试文件。log:`scratchpad/codex-rw3-narrow-review.log` | E-053 | **批次 C 收敛，第一轮批次小审合集全闭（F-001~F-033 无 open 的代码缺陷）**。派第二轮全卡换人复核。 |

| 2026-08-28 | 主控 | E-054 第二轮全卡换人复核（codex exec 只读，GPT-5 **fresh 会话**，不继承轮1上下文，只读仓内已落账记录；范围 `e52a45b..4061e76` 终态）：**changes-requested**。①抽查 F-012/F-013/F-019/F-020/F-026/F-029 六条**全部成立无一推翻**；②验收口径五条 4 pass + 1 缺口（B1 并列断言不完整）；③一致性三行独立裁决：pilot 演进=有意演进已落账、排序纪律=一致、幂等口径=一致；④收口风险清单全部背书（含 DSH 截图移交 DHR_31 + risk-accepted 口径「对范围划分无异议」）；⑤新发现 R-J-01（P1 唯一写者旁路入口）/ R-J-02（P2 B1 并列断言缺）→ F-034/F-035。log:`scratchpad/codex-round2-review.log` | E-054 | 裁决 R-J-01 半采纳半驳回、R-J-02 采纳直修（E-055）。 |
| 2026-08-28 | 主控 | E-055 主控直修 F-034/F-035（提交 `2602eab`）：删 service.mjs 零消费者 `export { openStore }`；新增 `test/control-plane-imports.test.mjs` 两钉（变异证有牙：cli 塞 store import 即红）；rpc-service 补 B1 双根并列四断言。全量 **157/157 绿**（155→157）；capability_hash `a990fdda` 零漂移。F-034 驳回半条的依据（design/07 §4 限定词、lease fencing 仲裁、生产零调用 grep 证据）全文见 findings。 | E-055 | 派轮2修复窄审（只审 F-034/F-035 闭合）；通过即进收口备料终局。 |
| 2026-08-28 | 主控 | E-056 轮2修复窄审（codex exec 只读，GPT-5 fresh-context；只审 `2602eab` + F-034 驳回独立评估）：**changes-requested**。①F-035 **closed**（四断言真钉同份清单并列）；②F-034 采纳半条 not-closed：R-K-02（P2）第二钉豁免 service.mjs 留回归豁口；③F-034 驳回半条**部分推翻**：宿主入口不删的半支被独立确认成立（runHostSession 先 lease 再 writeGuard），但 R-K-01（P1）坐实 `createRunWithNumbering` 是 fencing 外写路径（无 lease/ledger/Receipt 直建 Store，可接管无 run.json 残缺目录）→ F-036/F-037。log:`scratchpad/codex-round2-fix-review.log` | E-056 | 诚实采纳，主控直修两条（E-057）。 |
| 2026-08-28 | 主控 | E-057 主控直修 F-036/F-037（提交 `de79d05`）：startrun 建 Run 根改非递归 mkdir，EEXIST → `E_REQUEST_CONFLICT:run-root-exists`（残缺目录整体拒绝，新增回归钉拒绝+零落盘+索引不推进）；import 纪律钉删 service.mjs 豁免。**变异双验**：守卫改回 recursive 目标用例红；service 塞 createRunWithNumbering import 钉子精确报红。全量 **158/158 绿**（157→158；首跑两例负载时序 flake——`rpc-service` 并发同键 start 与 `service.test` 强杀重启——隔离复跑 21/21 绿，与 F-016/F-027 同族裁定）；audit 217 token 0 违规；validator 48/48；capability_hash `a990fdda` 零漂移。 | E-057 | 派 F-036/F-037 闭合定向复审；通过即进五路收尾（需求/教训复核）与收口备料。 |
| 2026-08-28 | 主控 | E-058 F-036/F-037 闭合定向复审（codex exec 只读，GPT-5 fresh-context；只审 `de79d05`）：**approved，零新发现**。F-036 closed（非递归 mkdir 原子争用无 TOCTOU；拒绝先于一切业务落盘；变异必红独立推演确认；「fail-closed + 生产静态禁调」口径被接受——能跑仓外任意代码的主体本就可绕过 Store API，非本修法新增攻击面）；F-037 closed（token 级匹配核实 defaultIndexPath 不误报、将来 import/别名/调用均必红）；`de79d05` 恰三文件无夹带。**代码路两轮 + 全部返工链正式收敛：F-001~F-037 无 open 代码缺陷**。log:`scratchpad/codex-f036-closure-review.log` | E-058 | 进五路收尾。 |
| 2026-08-28 | 主控 | E-059 教训复核（codex exec 只读，GPT-5 fresh-context；五路之教训路）：**changes-requested**。候选-19/20/21 达标；候选-17/18/22/23 需收窄/拆分（R-N-01~04）；R-N-05 miner 映射欠完备（L-05/L-08/L-09 弃选理由被复核推翻、L-06 应记"已宪章化"）；漏报六条（R-N-06~11，含「驳回也必须受审」——F-034→F-036 链的自指教训）。log:`scratchpad/codex-lessons-review.log` | E-059 | 主控直修候选库（E-062）。 |
| 2026-08-28 | 主控 | E-060 需求复核（codex exec 只读，GPT-5 fresh-context；五路之需求路）：**changes-requested**。R-M-01（P2）E-049 转录在 scratchpad 不可追溯——**采纳，属实**；R-M-02/03/04（P1）条件 2/3/4 缺"实际场景"证据——**按 G11 车道裁定部分采纳**（同源/幂等/Receipt 唯一是机器项，单测即证据；另以 E-061 重跑补真实场景对照）；R-M-05（P2）条件 5 落账三处不一致（review 内部自相矛盾 + DevPlan 未登记移交）——**采纳**；R-M-06（P3）验收元数据表空置——**采纳**。复核者确认条件 5 处理方向本身诚实（未伪装全通过）。log:`scratchpad/codex-requirement-review.log` | E-060 | 主控整改（E-061/E-062）。 |
| 2026-08-28 | command | E-061 CLI 终端冒烟**重跑并落仓**（R-M-01 整改）：全新真实 git 仓、15 条命令独立进程全 exit=0，run `R001-smoke2-20260828`；含 list text/--json 同 Run 同源对照、stop 后 Run 不取消、resume 宿主复活、follow 挂住时另一进程 stop 的**实时推送**（事件[6]+state 变化推达 follow 流）、follow 客户端消亡后账面零影响（events 7 条完好）。转录 202 行落仓 `workspace/DHR_30/evidence/cli-smoke-20260828.txt`。**过程发现（→F-038）**：套件历史遗留 13 个 detached service-main 进程（均指向已删除 temp 测试仓，含首次冒烟失败残留），长期驻留推高负载——正是全量跑时序 flake 的可疑载荷；已逐一核对命令行后清理，清后 service-main 进程数=0。 | E-061 | pass；遗留进程回收缺口记 F-038。 |
| 2026-08-28 | 主控 | E-062 需求/教训两路整改落地：①review.md 需求对齐证据行改挂 E-061 落仓转录；完成条件 1~4 由「待第二轮复核确认」更新为达成（附 R-M-02/03/04 的 G11 车道裁定理由）；条件 5 统一为「二分达成：接缝机器证 + 截图移交 DHR_31、带风险放行待 E10 整包确认」，消除 88/99 行自相矛盾；验收元数据表四行补覆盖态与实际执行结果（R-M-06）。②DevPlan P5：DHR_30 卡 P5-X 行与档位注登记截图义务移交（用户 2026-08-28 对话裁决回链），DHR_31 卡 H3 行登记承接与施工路径（R-M-05）。③教训候选库：候选-17/18/22/23 按 R-N-01~04 收窄/拆分，新增候选-24~29（含 R-N-07「驳回也必须受审」），miner 映射完备性说明落档（L-06 已宪章化，L-05/L-08/L-09 补报为候选-27/28/29）。 | E-062 | 派需求+教训两路整改窄审确认；通过即 E9 交付汇报 + E10 放行证据包。 |
| 2026-08-28 | 主控 | E-063 整改闭合窄审（codex exec 只读，GPT-5 fresh-context；审 `b962d35`）：**changes-requested**。教训路 R-N-01~11 **11/11 全闭**；需求路 R-M-02/03/04 车道裁定被**独立确认成立**（"同源/幂等/接缝属机器命题，移交后不应重复要求人验"）；not-closed 三条：R-P-01（P2）首版转录 17 命令头仅 15 exit 码（follow 与并发 stop 缺）且行数误记、R-P-02（P2）DHR_31 变更范围未含树外插件承接路径、R-P-03（P3）元数据 M1/M4 计数不准。**主控直修**：冒烟脚本补 exit 捕获后**重新生成**转录（不手改证据）——17 命令头=17 exit 码=全 0、224 行、并发 stop receipt_id 与 follow 流 seq[6] operation id 互证、内置自检行；DHR_31 变更范围补树外承接项（仅限截图义务随附）；元数据 M1/M4 计数照实修（17/17、7+2）。log:`scratchpad/codex-remediation-closure-review.log` | E-063 | 派 R-P-01~03 终审确认；通过即 E9/E10。 |
| 2026-08-28 | 主控 | E-064 R-P 终审（codex exec 只读，GPT-5 fresh-context；审 `5f9831b`）：**approved，R-P-01/02/03 全 closed、零新问题**（转录 17/17 全 0 实物复核、receipt_id 互证确认、DHR_31 范围与 H3 自洽、M1/M4 计数与实物一致）。**五路复核全部收敛**：代码轮1+轮2（换人）/需求/教训/一致性全闭，miner 已出候选-17~29；F-001~F-038 无 open 代码缺陷；四道闸全绿（158/158 · audit 0 违规 · validator 48/48 · capability_hash `a990fdda` 零漂移）。log:`scratchpad/codex-rp-final-review.log` | E-064 | 出 E9 收口汇报 + E10 放行证据包（对话）。 |
| 2026-08-28 | 用户+主控 | E-065 **E10 用户确认（AskUserQuestion 三题，2026-08-28 对话）**：①「认可，执行本地收口」——带风险放行（风险项 RISK-DHR30-DSH-RENDER=真实 DSH 渲染未证→移交 DHR_31，Risk-Count=1），授权包=精确 squash 合入本地 master + 合入复验 + verify 代签（risk-accepted）+ DevPlan/workspace 回填销户 + 本任务 worktree/branch 清理，不含 push/deploy/下一卡；②设计回写「随收口一并回写」——F-008 保守 seed 与 F-009 孤儿投影语义回写 design/08 §3、F-010 subscribe legacy 码回写 design/08 legacy 段、F-034 措辞澄清回写 design/07 §4，四条已落笔，findings 相应置 resolved；③尾巴「整批入验收池」——F-002/F-003/F-016/F-038 系统性回收/教训候选-17~29 裁决登记验收池。阶段汇报@收口汇报（七段，2026-08-28 对话）。 | E-065 | 执行 E11~E13 本地收口授权包。 |

本次 miner 产出 7 条候选（候选-17~23）→ 候选区（`knowledge/教训库-候选.md`；源自 workspace `lesson_candidates.md` L-01~L-09 提炼去重：L-05 与既有候选-12 邻域重叠不重报、L-08/L-09 属本卡合同已落档不成教训、其余七条按筛子转写）。

## 批次 A 盘点（步骤 1~3 起点，2026-08-27）

> 口径：design/07 §3~§7 + design/08 §1~§5 逐条对照树内 `2cd5c85 / 4621fc3 / 564962d` 三笔既有实现。

**步骤 1 · 契约与红测 —— 已完成**

- `contracts/relay.rpc-methods.v1.schema.json`：七个 method 的 params/result + `run_state_changed_notification` 已冻结，全部 `additionalProperties:false`。
- `contracts/relay.client-read-model.v1.schema.json`：`run_list / status / detail / event_stream_snapshot` 四视图 + `run_summary` / `run_status_view` 精确字段已冻结。
- `relay.rpc/v1`：request 按 method 用 `allOf` 收窄 params；response `result` 收为封闭并集；notification params 按 method 收窄。顶层信封字段未变。
- `relay.launch-receipt/v2`：新增 `client_id/method/state/reason` 与三条 `allOf`（failed 必带 reason、start↔kind、control↔kind）。
- `relay.event/v2`：新增 `operation_accepted/committed/failed` 三 kind 与 `^operation:<id>:<sha256>:<state>$` detail 断言。
- `contracts/reason-codes.md`：六个新码全部登记。
- 三份基线（fixture manifest 57 份 / capability baseline 10 份 / audit token 217 个）已随契约重生成，`npm test` 91/91、validator 34/34、audit 0 违规。

**步骤 1 · 未完成**

- S1-a：`fixtures/golden/` 无 `relay.client-read-model/v1` 与 `relay.rpc-methods/v1` 的正例——README「每份已冻结 schema 至少一份正例」这条对新增两份协议不成立。
- S1-b：design/08 §4「每码有 negative fixture」未兑现；新契约形状（per-method params 未知字段、failed receipt 的 reason 为 null、operation event detail 违 pattern、read model 两视图互斥）无任何反例钉住。
- S1-c：无红测断言 design/08 §1 的 CLI↔method↔Read Model 映射表本身。

**步骤 2 · Runtime 服务 —— 已完成**

- `runtime/endpoint.mjs`：`endpointForRepo` 由 repo root 的 SHA-256 导出（Windows pipe / Linux UDS），descriptor 临时文件 + 原子 rename 发布，退出不删。
- `runtime/credentials.mjs`：用户私有 `credential.json`（0600），值不进项目文件。
- `runtime/service.mjs`：单 async queue 的 `runtime-operations.json` 账本骨架（phase 字段已用）、内嵌 `createHostSessionActor`、不 import workflow/Process/executor。
- `runtime/service-main.mjs`：可 detached 拉起。

**步骤 2 · 未完成**

- S2-a：`canonicalRepoRoot()` 只做 `resolve()`；design/08 §2 要求的 Windows 大小写无关规范化 / UNC 保留 / Linux realpath 全缺——同一仓不同写法会算出不同 endpoint。
- S2-b：owner-aware 清理缺失。`rpc/transport.mjs` 的 `close()` 对 UDS 无条件 unlink（design/08 §2 明令不得沿用该语义），也没有 `EADDRINUSE` 先探测再 unlink-retry-once 的流程。
- S2-c：credential 在 bind **之前**读取/创建（`service.mjs:94` 早于 `createRpcServer` 的 bind），违反 design/07 §3.4「bind 失败候选绝不碰 credential」。
- S2-d：账本无 `next_seq`、无 `run_id_reserved` 相位；`start` 直接调 `createRunWithNumbering`——design/08 §3 明令禁止 RPC handler 走该旧入口，且崩溃重试会再发一个号。
- S2-e：账本写入无 fsync / 目录 fsync；记录形状与 design/08 §3 最小记录不符（存整份 receipt 而非 `receipt_id`）。
- S2-f：无各 phase 崩溃恢复，无重启 discovery（v2 根扫描 → ledger 对账 → `runs.json` 修复 → legacy 只读投影）四步。
- S2-g：`operation_accepted/committed/failed` 事件从未写进 Run Store；Receipt 只活在 ledger 里，design/07 §2「service 重启后仍能从 Run 事件账恢复」不成立。
- S2-h：actor 无 `submitControl()`；`stop` 走的是 `actor.stop()` 裸终止而非 lease 内先写 Receipt；`resume` 未验证新 actor ready 后才提交。
- S2-i：launcher↔service 无 bounded ready 协议。
- S2-j：测试只有一条 happy path（`test/service.test.mjs`，61 行）；双 launcher、各 phase crash/retry、actor lease/stop/resume、restart discovery 全无。

**步骤 3 · RPC 接线 —— 已完成**

- `rpc/server.mjs` `formal:true` 路径按冻结 `relay.rpc/v1` 校验整帧（含 per-method params）。
- 连接闸：`contracts` 之前的业务方法回 `E_CLIENT_NOT_AUTHORIZED`；identity 不符回 `E_SERVICE_IDENTITY_MISMATCH`。
- 带 `.reason` 的 handler 错误以 error response 回包、不断连。
- 客户端断开只清连接本地订阅（DHR_52 既有语义，不写 Store、不发 cancel）。

**步骤 3 · 未完成**

- S3-a：`subscribe` 是假实现——`snapshot_seq` 由事件条数算出，无写队列上的 barrier、无实时推送、无 `unsubscribe`、`after_seq` 被完全忽略、无 `E_CURSOR_GAP`。
- S3-b：不带 `.reason` 的可预期失败（`E_RUN_NOT_FOUND` / `E_GITIGNORE_MISSING` / `E_LEASE_HELD` 等裸 Error）走 `dropConnection`——违反 design/07 §5.2「业务 handler 不得以断开连接表达可预期失败」。
- S3-c：`contracts` 未被强制为「连接唯一首请求」，可重复调用。
- S3-d：`listRuns` 忽略 `include_legacy`；legacy v1 投影与 `E_LEGACY_READ_ONLY` 完全缺失。
- S3-e：无并发 snapshot/live/reconnect 用例。

## 批次 A 收口（步骤 1~3，2026-08-27）

> 上节缺口逐条的落点。批次 A 只做步骤 1~3；步骤 4（CLI 七命令）、4b（Bridge/fixtures）、5（设计落档）不在本批。

| 缺口 | 落点 | 状态 |
|---|---|---|
| S1-a | `fixtures/golden/client-read-model.v1.{run-list,status,detail,event-stream-snapshot}.json`、`event.v2.operation-committed.json`、`launch-receipt.v2.operation-failed.json` | 关闭 |
| S1-b | `fixtures/negative/dhr30-*.json` 7 组（+ `.expect.json` 逐份钉 reason 与出错位置） | 关闭 |
| S1-c | `test/contracts.test.mjs`「design/08 §1 的 CLI↔RPC method↔Read Model 映射表逐行经冻结契约校验」 | 关闭 |
| S2-a | `runtime/endpoint.mjs` `canonicalRepoRoot()`：realpath + Windows 大小写折叠 + UNC 保留 | 关闭 |
| S2-b | `rpc/transport.mjs` `bindOwnedEndpoint/probeEndpoint/shouldReclaimEndpoint/shouldUnlinkOnClose` | 关闭 |
| S2-c | `service.mjs` 就绪顺序改为 bind → credential → 发现 → 发布 descriptor | 关闭 |
| S2-d | `runtime/ledger.mjs` + `service.mjs` `runStart()`：`next_seq+1` 保留号先落盘再建 Store；RPC 路径不再调 `createRunWithNumbering` | 关闭 |
| S2-e | `ledger.mjs` `writeLedger()`：temp write + fsync → rename → 目录 fsync；记录形状对齐 design/08 §3 | 关闭 |
| S2-f | `runtime/discovery.mjs` 四步 + `recoveryFor()` 恢复表 + 逐 phase 崩溃重试用例 | 关闭 |
| S2-g | `store/store.mjs` `appendOperation()`：Receipt 工件与 `operation_*` 事件同批落 Run Store | 关闭 |
| S2-h | `runtime/host.mjs` `createHostSessionActor()` 四接口；stop 在 lease 内先提交 Receipt 再停机 | 关闭 |
| S2-i | `runtime/launcher.mjs` `ensureRuntimeService()` + `service-main.mjs` 输家静默退出 | 关闭 |
| S2-j | `test/service.test.mjs` 双 launcher / 篡改 descriptor / SIGKILL 重启；`test/rpc-service.test.mjs` 逐 phase 崩溃 | 关闭 |
| S3-a | `service.mjs` `subscribe()`：写队列内 barrier、`afterSend` 排空、cursor 补发、`E_CURSOR_GAP` | 关闭 |
| S3-b | `service.mjs` `withReason()` + `rpc/server.mjs` 同步 throw 修复（F-004） | 关闭 |
| S3-c | `rpc/server.mjs`：已授权连接再发 contracts 一律拒绝且不断连 | 关闭 |
| S3-d | `service.mjs` `listRuns(include_legacy)` + `isLegacy()` + `E_LEGACY_READ_ONLY` | 关闭 |
| S3-e | `test/rpc-service.test.mjs`「subscribe 先快照后增量」「并发同键 start」两条 | 关闭 |

**本批未做（按 Ticket 明示不做）**：CLI 七命令功能（步骤 4，`cli/main.mjs` 保持编译与全绿）、dsh-bridge、`fixtures/clients/`、design/06 字段落档、P4 §0.2 标记、`as-built/relay-core.md`、任何复核。

## 批次 A 返工轮（F-012~F-015，2026-08-27）

> 小审 changes-requested 的四条整改。逐条 TDD：先写红测钉住合同语义，再改实现，最后全量 + 四道闸。

| finding | 落点 | 提交 | 状态 |
|---|---|---|---|
| F-012 | `contracts/relay.rpc.v1.schema.json`（`data.required=["reason","receipt"]`）、`rpc/server.mjs` `sendError()`、`fixtures/golden/rpc.v1.error.json`、`fixtures/negative/dhr30-error-data-omits-receipt.*`、`test/rpc-service.test.mjs` | 9b20cfc | 关闭 |
| F-013 | `runtime/discovery.mjs` `claimedRunIds/orphans`、`runtime/service.mjs` `isOrphan/refuseOrphan` + `inspectRun` detail 判据、`contracts/reason-codes.md`（新码 + 边界）、`test/rpc-service.test.mjs`、`test/discovery.test.mjs`、`test/contracts.test.mjs` | f81b44a | 关闭 |
| F-014 | `store/store.mjs` `readEventLog()`、`runtime/discovery.mjs` `classifyRunRoot()`、`test/discovery.test.mjs` | eef216d | 关闭 |
| F-015 | `runtime/service.mjs` `attach/detach` + subscription 的 `actor/lastSentSeq/buffer/drain`、`test/rpc-service.test.mjs` | ddaa58f | 关闭 |

**返工轮未做（按 Ticket 明示不做）**：`cli/main.mjs`（批次 B）、dsh-bridge、design/06、design/07/08 与 F-008/F-010 的设计回写（待用户确认）、as-built、任何复核或验收动作。范围外新发现只记 findings（F-016）。

## 批次 B 派发准备（主控，2026-08-27）

- 返工轮主控复验：五提交在树、工作树干净、`npm test` 127/127 独立复跑绿（F-016 偶发未复现）。
- 返工定向复审已派 codex 只读（fresh-context，范围 = 5790a37..3e160ad 对 F-012~F-015 的闭合判定），结果落 review 环节账。
- 执行者变更（用户指示）：批次 B 由 zcode + GLM-5.3-Flash（推理强度 max）headless 施工；主控仍留本 session。
- 依「施工说明书粒度」规矩，task_plan.md 增「批次 B 施工说明（步骤 4 · headless worker 粒度）」节（B-0~B-5），承接批次 A 交接注意事项（删内联 ensureService、只读凭据、pending record、receipt 必填渲染二分、E_CURSOR_GAP 重新快照、legacy/孤儿拒绝透传）。

## 返工轮定向复审（2026-08-27 晚）

- E-020 review-dispatch：codex exec 只读（GPT-5，fresh-context，未参与实施），范围 = 5790a37..3e160ad 对 F-012~F-015 的闭合判定。首次派发因 Windows 进程参数编码把中文提示词打成乱码、codex 空转 72 分钟后被主控杀掉重派（提示词改走 UTF-8 文件 + stdin）；教训候选：headless 派发中文提示词一律走文件/stdin，不走 argv。
- 复审结论：**approve**。F-012/F-013/F-014/F-015 均判 closed；确认 sendError 全调用点收敛、孤儿双闸（runControl + ensureActor）无旁路、readEventLog 与 openStore 校验口径一致、订阅 seq 去重仅过滤重复不吞事件；三份基线联动自洽（仅 relay.rpc/v1 digest 变化，audit token 217/217 无需变更）、E_ORPHAN_STORE_READ_ONLY 不入 schema 枚举属实。R-B 新问题：无。
- 批次 A（步骤 1~3 + 返工）至此收敛，批次小审换人复核记录并入收口 review.md 时作代码轮 1 前移证据。

## 批次 B 收口（步骤 4 · CLI，2026-08-27 施工、本地跨午夜至 08-28 收口）

> 执行者 = zcode + GLM-5.3-Flash headless worker，按 task_plan「批次 B 施工说明」B-0~B-5 执行；TDD 先红后绿（E-021 → E-022）。

**改了什么**（全部在白名单内；contracts/、runtime/、rpc/、store/、design 文档零改动，E-023 证基线零漂移）：

| 文件 | 内容 |
|---|---|
| `cli/client.mjs`（新） | 唯一 RPC 客户端：`ensureRuntimeService` 发现/拉起 → `readLocalUserCapability` **只读**（缺失 `E_LOCAL_USER_UNAUTHORIZED`，绝不创建凭据）→ contracts 唯一首请求且响应与 descriptor 逐字段比对；`call()` 把稳定拒绝归一为 `{ok:false,error:{reason,receipt,detail}}`，传输层失败抛错（pending 收不收回的界线）。客户端身份另存 `<repoHash>.client.json`（非凭据，客户端可建），跨进程稳定——pending 幂等键与 request_digest 都依赖它。 |
| `cli/pending.mjs`（新） | `.dh-relay/pending-operations.json` 的 temp+rename 原子读写：新增残条、按 request_id 收回、全空删文件、损坏 fail-closed（E_STORE_CORRUPT）。 |
| `cli/render.mjs`（新） | 唯一渲染层：四视图 + receipt + event/runStateChanged 的人读渲染，只印传入对象已有字段（null 印 `-` 不猜值）；错误二分两段措辞常量（「同一份 failed Receipt」vs「结果未知；可安全重试」）。 |
| `cli/main.mjs`（重写） | 删内联 ensureService；argv 严格解析（未知 flag/命令即 usage 退出码 1）；七命令分派；mutating 先落残条再发送、确定结果即收回；启动时按原幂等键收敛残条（任何确定响应即收回，传输失败保留并报「结果未知」）；events 非跟随=快照+锚定静默窗口收补发、跟随=断线重连按高水位 after_seq 续传、E_CURSOR_GAP 整体重快照、SIGINT/stdin 关闭退出码 0；顺序化 stdout 落定后才 exit。 |
| `test/cli.test.mjs`（新） | 八用例全走真实 service 进程 + 真实 CLI 子进程，零 mock（E-022）。 |
| `relay-core/package.json` | test 列表挂入 `test/cli.test.mjs` 一行（沿用批次 A 挂新测试文件的先例）。 |

**测试数**：新增 8 用例（CLI 8/8 绿）；全量 135 = 127（存量）+ 8（本批）。

**遗留**：

- F-017（新登记，open）：存量 rpc-service.test.mjs 日期炸弹，本地跨午夜后确定性红，使「`npm test` 全绿」在本批收口时点上不可达（134/135）；修法建议已写入 findings，修复动作不在本批白名单内。
- F-016（存量，open）：本批全量两遍中一遍偶发 ESRCH、一遍未复现，维持原判。
- F-008/F-010 的 design/08 回写仍待用户确认（本批未触碰 design 文档）。
- `events` 文本渲染在重连时会补印一行新快照（状态刷新，JSONL 同理）——合同未禁止，留复核裁断。

## 批次 B 主控复验（2026-08-28 凌晨）

- E-025 主控复验：worker 三提交（386d1bc / 5d85f1f / 1492e0e）在树；首跑 `npm test` 134/135——唯一红即 F-017 日期炸弹（本地时钟跨过 08-27 午夜后确定性触发，与批次 B 零关联）。主控直修：期望 run_id 日期段改按 `localDateStamp()` 现算（一行 + import + 注释），复跑 **135/135 绿**；validator selftest 48/48、audit 0 违规（217 token 0 未登记）、manifest 79 对证、capability baseline 10 份对证且 `capability_hash = a990fdda` 不变（批次 B 契约零漂移坐实）。F-017 → resolved。
- 下一步：批次 B 小审（codex 只读 fresh-context，范围 = 386d1bc..HEAD + F-017 直修提交）。

## 批次 B 小审与裁决（2026-08-28 凌晨）

- E-026 review-dispatch：codex exec 只读（GPT-5，fresh-context，未参与实施），范围 = 386d1bc / 5d85f1f / 1492e0e / eb9629e 四提交，按 8 项清单逐条对证（凭据纪律 / pending 双执行窗口 / receipt 二分 / events 语义 / legacy·孤儿透传 / 范围与基线 / 测试有效性 / 代码质量）。提示词走 UTF-8 文件 + stdin。
- 复审结论：**changes-requested**，8 条新发现全部裁决成立，登记 F-018~F-025（1×P0：首次并发 identity 竞争可致二次执行；3×P1：pending 无锁并发丢条、pending 权限未收 owner-only、非 follow backfill 固定 400ms 窗；3×P2：缺失 receipt 静默归 null、测试缺口、F-017 直修残余午夜窗口；1×P3：argv 未全严格）。
- 复审通过面：凭据纪律主链路（只读 readLocalUserCapability、identity 文件 0600 无凭据）、pending 单进程路径、receipt 二分渲染（合规响应）、--follow 主路径（状态只来自快照/runStateChanged、after_seq 续传、E_CURSOR_GAP 整体重快照）、legacy/孤儿原样透传不重试、范围合规与基线零漂移（hash a990fdda 复证）、八用例真实进程无 mock 且关键断言有杀伤力。
- worker 开放点裁断：「重连补印一行新快照」**不违反合同**——subscribe 本就每次返回 snapshot，输出准确但重复，不构成状态误导；不作 finding、不返工。
- E-027 主控直修 F-024（R-C-07，涉 `test/rpc-service.test.mjs`，在返工 worker 白名单外）：崩溃收敛用例期望二分——钉死相位逐字比对 fixture 保留号，`accepted` 相位只验 `R001-crash-\d{8}` 形态、盘上断言以实际 Receipt 为准；隔离 11/11、全量 **135/135 绿**。F-024 → resolved。
- 其余 7 条（F-018~F-023、F-025）派返工：task_plan.md 增「批次 B 返工说明」节（RW-0~RW-6，worker 粒度），执行者按用户指示链 zcode + GLM-5.3-Flash（max）优先、额度尽则 codex terra high。

## 批次 B 返工轮（F-018~F-023、F-025 · RW-0~RW-6，2026-08-28）

> 执行者 = zcode + GLM-5.3-Flash headless worker；F-024 已由主控直修（E-027），本轮未触碰 `test/rpc-service.test.mjs`。改动面 = `cli/{client,pending,main}.mjs` + `test/cli.test.mjs` + workspace 两文档，白名单外零改动（E-031 证基线零漂移）。

| RW | finding | 落点 | 提交 | 状态 |
|---|---|---|---|---|
| RW-1 | F-018 | `cli/client.mjs`（identity `wx` 独占创建、EEXIST 重读赢家；`buildRequestEnvelope` 出口；`call()` 支持 clientId 覆盖）、`cli/main.mjs`（收敛重放按 record 内 `client_id`；残条缺 client_id → fail-closed E_STORE_CORRUPT，绝不换键重放）、`cli/pending.mjs`（record 持久 client_id） | 2a7eebf | 关闭 |
| RW-2 | F-019 | `cli/pending.mjs`（`pending-operations.lock` wx 独占 + 50ms×100 短退避 + mtime>10s 陈锁回收；add/remove 全程持锁；record 完整请求五字段）、`cli/main.mjs`（record 含 `request_digest`，与发送帧同源 `buildRequestEnvelope`+`requestDigest`） | 2a7eebf | 关闭 |
| RW-3 | F-020 | `cli/pending.mjs`（目录 0700、pending 与临时文件 0600、锁文件 0600）、`cli/client.mjs`（identity 目录 0700） | 2a7eebf | 关闭 |
| RW-4 | F-021 | `cli/main.mjs` `runEvents`（非 follow 显式带 `after_seq`=用户传入或 0——服务端缺省不补发；按订阅快照 `next_seq` 逐条计数收齐即完成；`E_CURSOR_GAP` 退化纯快照；30s 仅作 fail-out 报错退出码非 0；删除 400ms 静默窗） | 2a7eebf | 关闭 |
| RW-5 | F-022 | `cli/client.mjs` `call()`（`'receipt' in data` 缺失即抛 `E_PROTOCOL_VIOLATION`，措辞含服务端 reason 与「协议违约：error data 缺 receipt」；`receipt:null` 合法不受影响）、`cli/main.mjs`（协议违约按原文上报，不走「结果未知」措辞；pending 由抛错路径天然保留） | 2a7eebf | 关闭 |
| RW-6 | F-023、F-025 | `test/cli.test.mjs` 七组新回归（详见 E-030）；F-025 的实现 = `cli/main.mjs` `POSITIONAL_COUNTS` 按命令声明形状、多余/缺失一律 usage 退出码 1 | 实现 2a7eebf / 测试 3a9183d | 关闭 |

**测试数**：CLI 8 → 15 用例（全真实 service 进程 / 假 service / 真实 CLI 子进程，零 mock）；全量 135 → 142。

**实现要点与取舍**（复核可重点看这里）：

- 旧格式残条（无 `client_id`）无法复原原幂等键，重放等于换键二次执行——按 fail-closed 报 `E_STORE_CORRUPT` 并保留残条；既有崩溃收敛用例的残条 fixture 随新格式更新，并新增 `receipt.client_id`/`request_digest` 逐字断言。
- 「凭据缺失走子进程 E2E」需要在活 service 场景下快速失败：`connectCli` 新增只读预检——端点 `probeEndpoint` 为 alive 而本机凭据缺失 → 直接 `E_LOCAL_USER_UNAUTHORIZED`（拉起/补建凭据都是 service 侧权利，design/07 §3.4）。无 service 时照旧走 launcher 引导，不破坏「CLI 首次使用自助拉起」的既有验收。
- RW-6 的并发/违约/慢管道用例以最小假 service（绑定仓推导 endpoint、按同一 descriptor 回 contracts、其余方法交给用例）实现：黑洞 `control` 构造「已落 pending 未收 Receipt」窗口、伪造缺 `receipt` 的 error data、按节奏补发事件。真 service 造不出这三类场景。
- 双 CLI 黑洞用例在收尾换真 service 前先轮询端点为 absent：SIGKILL 的客户端句柄可能让管道名多活几百毫秒，而 launcher 对 absent 只 spawn 一次、撞 EADDRINUSE 的候选安静退出且不重试。
- pending 并发丢失断言只钉「已落账的残条绝不丢」（打断后残条完好 + 事后按原键收敛收回）；叠加 50 路并发 add/remove 的模块级确定性回归覆盖锁本身。

**本批未做（按 RW-0 明示不做）**：contracts/、runtime/、rpc/、store/、design 文档、三份基线零改动；不 push、不 merge、不复核自己的卡。范围外无新发现。

## 批次 B 返工二轮（F-019/F-020/F-023 · RW2-1~3，2026-08-28）

> 执行者 = zcode + GLM-5.3-Flash headless worker；对象 = 定向复审 E-033 判 not-closed 的三条。改动面 = `cli/pending.mjs`、`cli/client.mjs`（RW2-3① 实抓的 F-018 残余竞争）、`test/cli.test.mjs` + workspace 两文档；task_plan.md 未动，runtime 其余/rpc/store/contracts/design/三基线零改动（E-038 证零漂移）。

| RW | finding | 落点 | 提交 | 状态 |
|---|---|---|---|---|
| RW2-1 | F-019（R-D-01） | `cli/pending.mjs`：锁内容 `{pid, token, at}`（token=randomUUID）；释放与提交前重读锁文件核验 token——非己锁绝不 `unlink`；提交（rename / 收账 unlink）前核验失败抛内部 `E_PENDING_LOCK_LOST`，放弃本次提交、整段 read-modify-write 从抢锁重试（外圈 100 轮上限后 `E_PENDING_LOCK_BUSY`）；陈锁判据维持 mtime>10s，回收 unlink 后以 `wx` 抢建、抢不到按普通竞争退避（防双回收竞争） | c36ca54 | 关闭 |
| RW2-2 | F-020（R-D-02） | `cli/pending.mjs`：`ensurePendingDirectory()` 每次写前 mkdir(0700) + **显式 chmod 0700**（对 descriptor 以默认 ACL 预建的目录兜底收权）；锁/临时/pending 三类文件 mode 0600 + 显式 chmod 兜底（pending 在 rename 后 chmod，顺带收紧上一届宽权限账面）；POSIX 真实 mode 断言 + win32 降级断言（a987fcd） | c36ca54 | 关闭 |
| RW2-3 | F-023（R-D-03） | `test/cli.test.mjs`：①identity 并发——`startFakeService` 增 `onContract` 握手旁路（滤掉 launcher 的 `relay-launcher` 回证帧），断言两 CLI 的 contracts 首请求 `client_id` 相同 + identity 文件内容即该 id + 预置身份「文件逐字未变、握手用预置 id」负向钉子（覆盖写必双红）；②双 CLI mutating——诱饵残条 + 假 service 扣住收敛答复到两进程都重放才放行，轮询到两条 request_id 都在账**且锁已释放**才 SIGKILL（超时即红），黑洞退场换真 service 的收敛语义断言维持 | a987fcd | 关闭 |
| （附带修复） | F-018 残余竞争 | `cli/client.mjs`：RW2-3① 实抓——EEXIST 输家在赢家 `wx` 建档与内容落盘之间重读到空/半截 JSON，SyntaxError（无 `.code`）被误判 `E_STORE_CORRUPT` 退出 1；改 25ms×20 短退避重读等赢家写完，耗尽才 fail-closed，「绝不覆盖」语义不变 | 2784f38 | 关闭 |

**实现要点与取舍**（复核可重点看这里）：

- token 核验把「锁被陈锁回收」从静默破坏变成显式信号：释放路径核验失败 = 不 unlink（那把锁已是别人的）；提交路径核验失败 = 放弃本次结果整段重试（重读账面，绝不把旧快照提交进新持锁者的临界区）。收账 unlink（全空删文件）与 rename 同视为提交、同样核验——否则旧主仍可借「删文件」吞掉并发者刚写入的条目。临界区内的读没有逐次核验：10s 陈锁阈值对亚秒级 add/remove 足够，提交前的单点核验即可封住 R-D-01 的「两把逻辑锁并存」窗口。
- RW2-2 的收权做在 pending.mjs 每次写入口（`withPendingLock`/`writeRecords` 各自先 `ensurePendingDirectory`）：真实 mutating 路径上 `.dh-relay/` 几乎总是被 runtime/endpoint 的 descriptor 写入先用默认 ACL 建好，`mkdir` 的 mode 参数对已存在目录无效，显式 chmod 是唯一收权手段；win32 上 chmod 近似 no-op 且不抛错，POSIX 真实 mode 由测试钉住（win32 降级为断言写入路径无异常，RW2-2 原文口径）。
- 双 CLI mutating 用例的「两条 request_id 都在账」被两类**概率干扰**打断过（多轮跑批实抓，非臆造）：①后启 CLI 把先启 CLI 已落账的残条当收敛目标重放（黑洞挂起或被合法收敛掉）→ 用诱饵残条 + 假 service 扣答复到「两进程都重放过诱饵」才放行：两届 CLI 必然都越过 converge 再各自落账，与启动时序无关；②SIGKILL 落在第二位 adder 的锁释放窗（token 核验读 + unlink，约 1-5ms）内留下**新鲜**陈锁，收口 CLI 收敛吃满 5s 退避后 `E_PENDING_LOCK_BUSY` 退出 1 → 轮询判据补「锁已释放」：落完账的 CLI 不再碰锁，判据无歧义。两坑修复后 11 连跑全绿（全程 18 轮留痕）。
- 提交四笔而非 RW2-4 的三笔：RW2-3① 补强实抓的 F-018 残余竞争属实现缺陷（identity 读路径，非本轮 RW2-1~2 的锁/权限内容），单独立 fix 提交 2784f38 保复审焦点；其余按 fix（c36ca54）/ test（a987fcd）/ docs 拆分。

**本批未做**：task_plan.md（主控所有）、runtime/ 其余、rpc/、store/、contracts/、design 文档、三份基线零改动；不 push、不 merge、不复核自己的卡。F-018 残余竞争随 RW2-3 补强闭环（记于 F-018 行二轮补记），不另立 finding。

## 批次 C 落账（步骤 4b：dsh-bridge adapter + client fixtures + 镜像断言，2026-08-28）

> 执行者 = codex（GPT-5，`model_reasoning_effort=high`）headless worker，分两轮：首轮做 C-1~C-3 并在 C-4 实抓架构缺口后停工（F-026），续做轮按主控冻结的排序规则修断言。步骤 5（design/06 §14 落档 + P4 §0.2 标记）由主控直写（提交 `cea0b74`）；F-026 由主控直修（`336b389`，E-044）。三笔提交因 worker 在完工门误判后停工，由主控代落（E-046）。

**改了什么**（全部在 C-0 白名单内；contracts/、rpc/、store/、cli/、既有测试零改动，E-046 证基线零漂移）：

| 文件 | 内容 |
|---|---|
| `adapters/dsh-bridge/index.mjs`（新） | DSH Host 可内嵌的**库接缝**（非进程）：复用 `runtime/launcher` 的 `ensureRuntimeService` + `runtime/credentials` 只读取凭据（缺失原样抛 `E_LOCAL_USER_UNAUTHORIZED`，绝不创建）+ `rpc/transport`；**零 `store/**` import**，Read Model 只经 RPC。每会话 `contracts` 唯一首请求并与 descriptor 逐字段回证。查询（`listRuns`/`status`/`inspect`）原样返回 Read Model 不加工；窄 `control(runId, stop\|resume, {requestId})` 的幂等键归调用方，Receipt 与 error（含 `data.receipt: Receipt\|null`）原样透传、`E_LEGACY_READ_ONLY`/`E_ORPHAN_STORE_READ_ONLY` 不重试；`subscribe` 状态只来自快照与 `runStateChanged`（不从 event 反推），断线按已送达高水位带 `after_seq` 续传（默认 500ms×20 有界退避），`E_CURSOR_GAP` 整体重快照并回调 `onGap`（不拼接）。 |
| `fixtures/clients/`（新，5 份） | `pi-run-list` / `pi-status` / `pi-detail` / `pi-event-stream`（快照 + 事件 + next_seq 转录形态）/ `generic-control-receipt`（成功 + failed 两份 Receipt）。纯 JSON，任何语言可解析。 |
| `test/client-fixtures.test.mjs`（新） | 逐份 fixture 过对应冻结契约；外加「Pi 式中立消费」解析断言——只按 JSON 结构取字段、不 import 任何 relay 运行时代码。 |
| `test/dsh-bridge.test.mjs`（新） | 真实 service + 真实 Bridge：查询原样返回、控制拒绝原样透传且**不写 pending 账**；`E_CURSOR_GAP` 整体回快照且状态仅来自快照。 |
| `test/read-model-mirror.test.mjs`（新） | P5-M4 / B-13 两条镜像断言，各带「改前基线 + 改后差异」双证（见下）。 |
| `package.json` | test 列表挂三份新测试文件（144 → 150 用例）。 |

**关键设计决策（C-3，写死在代码注释里）**：Bridge **不落本地 pending 账**——design/08 §2 的持久 request record 归**宿主客户端**所有（CLI 有自己的账），库接缝无权替宿主决定持久化落点；宿主要重试必须自存并复用同一 `requestId`。`client_id` 取 `dsh-bridge-<repoHash>` 的确定性形态，跨会话稳定，正好满足崩溃重放收敛对同一 client_id 的要求。

**C-4 两条镜像断言的牙**（这批的核心证据）：

- **①改 `group` 必须移动**：alpha/beta 同为 `running` 时基线是 `[R001, R002]`（堆内 run_id 升序）；给 R002 的源头事件账追 `human_input_requested` 后必须变成 `[R002, R001]`——位置真的移动，且该条目差异**恰为** `run_status/group/updated_at` 三字段，未改的 R001 逐字不漂移。
- **②只改 `run_status` 必须逐字不变**：R001 从 `pending` 走到 `running`（同属 `group=running` 堆），除该条目 `run_status` 外整份投影 `deepEqual` 全等，R002 逐字不动。

**F-027 的裁决（值得记的一条流程教训）**：worker 在自己的 `--sandbox workspace-write` 沙箱里跑全量 `npm test` 得 139/150，11 项 `EPERM` 全落在锁文件创建上，据此判完工门不可达并停工。主控在同树同提交的无沙箱 shell 复跑得 **149/150**，`EPERM` 一项不复现——两条报错路径（系统临时目录、用户主目录 `~/.dh-relay`）本就在沙箱可写根之外，是沙箱按设计拒写。**结论：headless worker 的沙箱不能作为完工门的取证环境**；今后派活只要求 worker 跑定向测试，全量四道闸一律由主控在无沙箱环境跑。

**本批未做**：`task_plan.md`（主控所有）、`runtime/` 与 `design/`（F-026 修复与 §14.4 规则均由主控直做）、三份基线零改动；不 push、不 merge、不复核自己的卡。真实 DSH 页面截图属收口的需求对齐证据阶段，本批不做。

## 批次 C 返工（RW3-1~RW3-4，2026-08-28）

| 日期 | 执行者 | 事实 / 证据 | 提交 / 结论 |
|---|---|---|---|
| 2026-08-28 | headless worker | RW3-1 精化 adapter 自身只读凭据、首次成功 bind service 才创建凭据的注释；RW3-2 socket close/error 立即以 `E_CONNECTION_CLOSED` reject 全部 pending 并清计时器，订阅重试耗尽以可选 `onClosed('retries-exhausted')` 通知并摘除活动订阅。真实 Runtime service + 已接受 socket 的续传测试同时抓出并修正重连快照抢先推进高水位、误滤服务端 cursor 补发事件的缺口。 | fix `0287c1e` |
| 2026-08-28 | headless worker | RW3-2 三组真实 service + 真实 socket 回归：断线中途事件序列与真实 `events.jsonl` 按 seq 逐字一致、service 停止后两次重试耗尽只通知一次、pause 后 destroy socket 的在途查询在 5s 内以 `E_CONNECTION_CLOSED` 失败（注释掉 close reject 逻辑即红）。RW3-3 给改前/改后 `run_summary` 钉死六字段集合，并给测试 RPC 轮询加 15s 明确超时。 | test `0ee57b5`（worker 报告笔误 5bfd322，主控按 `git log` 更正）；定向 `node --test test/dsh-bridge.test.mjs test/read-model-mirror.test.mjs` **7/7 绿** |

**本轮边界**：仅改 `adapters/dsh-bridge/index.mjs`、两份授权测试与本 workspace 两文档；未触碰 `cli/`（F-031 主控直修）、`runtime/`、`rpc/`、`store/`、`contracts/`、fixtures、task_plan 或基线。全量与四道闸按 RW3-0 留主控无沙箱环境执行。
