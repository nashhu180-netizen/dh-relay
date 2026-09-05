<!-- dh:v1 -->
# progress — DHR_76

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-05 | 主会话 | 用户确认 D-start；读取卡面和 B-41；主树干净，建立七件工作区 | E-7601 | 建独立树、施工 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|---|---|---|---|---|
| E-7601 | inspection | git status --short; git worktree list; P6 DevPlan DHR_76 | observed | master@3243087 干净；原无 DHR_76 树；用户确认后落户 |
| E-7602 | inspection | worktree wt/DHR_76@7d42532；review.md 模板定向重建 | observed | 发现初始化替换误命中多个空表行，已在施工期纠正；未形成验收结论 |
| E-7603 | inspection | HERDR_ENV=1; herdr --help; herdr pane; herdr agent | observed | 当前受管会话可执行本卡真实 F；CLI 语法已检查；仅准备脚本，未启动真实 Agent |
| E-7604 | check | dh dh-relay（施工期） | observed | exit=1；本卡 R3 边界标题已补、R12 场景证据尚待执行；其他为 DHR75/74 的主树存量与跨卡 R30，未改其工件 |
| E-7605 | session-run | collaboration:/root/dhr76_brief_check | observed | S1 只读：A~F/allowlist 一致、P0=0；task_plan 执行细节建议澄清，裁决见下方 |
| E-7606 | review-dispatch | dh dispatch | observed | 复核派出：dhr76-code1｜第一轮代码静态检查先行，测试仍在施工；最终候选与证据补齐后同实例定向复核，不提前放行 |
| E-7610 | test | evidence/E-7606-profiles.stdout.txt；run-bounded-tests.ps1 -TestFiles test/profiles.test.mjs -EvidenceName E-7606-profiles | pass | 14/14，exit=0，33.5s；生产内容后提交7940f31 |
| E-7611 | test | evidence/E-7611-identity.stdout.txt | pass | exit=0，5.4s；身份/配置投影定向回归 |
| E-7612 | test | evidence/E-7607-loader.stdout.txt；run-bounded-tests.ps1 -TestFiles test/dhr65-registry-loader.test.mjs -EvidenceName E-7607-loader | pass | 5/5，exit=0，106.4s；完整registry及坏alias/config零启动 |
| E-7613 | construction | 7940f31；node --check 三个生产文件 | observed | 主控接管生产，最小101行新增；异步runtime、sync兼容、loader await与stop复查；专项证据未闭合 |
| E-7614 | test | evidence/E-7614-lease-host.stdout.txt；runtime.test.mjs 按 lease/host 分组 | fail | 8 lease用例和2 host用例已输出pass，续租用例报错；组合命令120s外层终止（124），不算测试完成 |
| E-7615 | test | evidence/E-7615-dhr75-a.stdout.txt；scripts/dhr75-regression.test.mjs 按 DHR_75/A | fail | 1 pass/2 fail，exit=1；Herdr CLI 同步非Promise、慢调用不续租；该生产文件与master相同、DHR75未合入 |
| E-7616 | test | evidence/E-7616-host-master-baseline.stdout.txt；主树 runtime.test.mjs 单跑真实续租 | fail | exit=1，45.3s；与本卡组合中同名同因，会话必须持有租约 actual=null；不改禁改runtime.test |
| E-7617 | test | evidence/E-7617-adapter.stdout.txt；Herdr adapter 原始stdout实际包含27项 | pass | exit=0，105.1s；24pass/3既有skip/0fail，原先正则排除意图未生效，以原始输出为准 |
| E-7620 | test | evidence/E-7620-host-probes.stdout.txt | pass | 5e04dd8；exit=0，54.3s；真实Host默认15s、5探测、单调续租及contender拒绝 |
| E-7621 | test | evidence/E-7621-ac-cleanup.stdout.txt | fail | exit=1，69.1s；8pass/3fail，C错误用例人为1秒预算先触发timeout；Windows后代清理alive=false |
| E-7622 | test | evidence/E-7622-epoch.stdout.txt | fail | exit=1，62.7s；接管及四零断言均过，after hook误用mock.restore报错；改mock.mock.restore重跑 |
| E-7623 | review-dispatch | dh dispatch | observed | 复核派出：dhr76-code2｜heavy收口Batch-7601；fresh代码轮2，生产5e04dd8，独立选择变异锚点，证据收敛后终审 |
| E-7624 | review-dispatch | dh dispatch | observed | 复核派出：dhr76-requirements｜Batch-7601需求方向复核；A-F原命题等价覆盖；终态证据随后补齐 |
| E-7625 | review-dispatch | dh dispatch | observed | 复核派出：dhr76-lessons｜Batch-7601教训独立复核；受3个worker槽位约束在miner返回后派出；仍属同一batch |
| E-7630 | test | evidence/E-7623-errors-epoch.stdout.txt | pass | exit=0，79.4s；正式预算下4错误路径及epoch接管全过 |
| E-7631 | test | evidence/E-7625-stop.stdout.txt | pass | exit=0，77.9s；确认loader等待51.7s后stop，四零 |
| E-7632 | test | evidence/E-7626-dhr75-bcd.stdout.txt | fail | exit=1，80.6s；3pass/1fail，B同步CLI后lease=null；含异步活动报错原样保留 |
| E-7633 | real-run | evidence/real-f/DHR76-F-20260905T020020638Z-cb6e298d/summary.json及timeline.json、source-binding.json | pass | 6cf6f71；DSH-off完整真实registry；Attempt时prior lease有效，随后Host observation；owned清理全部完成 |
| E-7634 | test | evidence/E-7628-start-order.stdout.txt | pass | exit=0，60.8s；等待期四零、5探测close后仅selected Codex启动 |
| E-7635 | inspection | evidence/E-7627-mine.txt | observed | dh mine exit0，只读备料；候选只落本卡allowlist工作区，独立miner已产出2条本卡候选L-7601/7602，含去重依据 |
| E-7636 | review-dispatch | dh dispatch | observed | 复核派出：dhr76-consistency｜Batch-7601一致性独立复核；槽位释放后派出；含实际registry对golden权威与cleanup边界裁决 |
| E-7637 | mutation | evidence/E-7629-mutation-a.stdout.txt；E-7629-mutation-a-hashes.json；E-7636-a-restored.stdout.txt | pass | code2独立选末项跳过；变异exit1 true!==false，还原hash一致且exit0；恢复绿含fallback负例 |
| E-7638 | test | evidence/E-7637-lease-fencing.stdout.txt | pass | 9/9，exit0，40.0s；lease+Host epoch fencing独立终态 |
| E-7639 | test | evidence/E-7638-wrapper-errors.stdout.txt | pass | 6/6，exit0，38.0s；4错误外层wrapper、常量与首错 |
| E-7640 | test | evidence/E-7639-host-lifecycle.stdout.txt | pass | 2/2，exit0，79.9s；detached/shouldStop有终态，取代组合超时的缺口 |
| E-7641 | test | evidence/E-7640-error-driver.stdout.txt | pass | 4/4，exit0，54.3s；四类错误实际loader与driver四零 |
| E-7642 | test | evidence/E-7641-production-timeout.stdout.txt | pass | exit0，45.2s；正式15s超时，loader/driver各一次，两次child close与后代清零 |
| E-7643 | test | evidence/E-7642-host-loader.stdout.txt | pass | exit0，53.6s；实际Host接实际loader的五探测正向；15k TTL断言 |
| E-7644 | mutation | evidence/E-7643-mutation-b.stdout.txt；E-7643-mutation-b-hashes.json | pass | code2选入口真实spawnSync16s；exit1 expiry samples不足，alias成功未被修改；71.9s；before==restored |
| E-7645 | mutation | evidence/E-7644-ttl-control.stdout.txt；E-7644-ttl-control-hashes.json | pass | 仅测试actor ttl60000负对照；exit1 60000!=15000，21.5s；before==restored；未改禁改Host/lease |
| E-7646 | test | evidence/E-7645-b-restored.stdout.txt | pass | 24e575f；exit0，54.0s；还原实际Host-loader、正式TTL、5Profile结构 |
| E-7647 | test | evidence/E-7646-two-profile-selection.stdout.txt | pass | 24e575f；exit0，58.8s；run同时有Codex/Claude两候选，等完整校验后仅首选Codex启动 |
| E-7648 | real-run | evidence/real-f/DHR76-F-20260905T023258226Z-b51be59d/summary.json及timeline.json | pass | 24e575f；五真实Profile ID、before/after SHA256一致；Attempt02:34:04.765Z lease有效，obs02:34:31.975Z；全部owned清理完成 |
| E-7660 | test | evidence/E-7648-profiles-final.stdout.txt | pass | 24e575f；14/14 exit0，33.8s；生产最终实现直接回归 |
| E-7661 | test | evidence/E-7649-loader-alias-final.stdout.txt | pass | 24e575f；accepts/bad alias分组exit0，106.1s |
| E-7662 | test | evidence/E-7650-loader-config-final.stdout.txt | pass | 24e575f；bad config分组exit0，52.3s；与前组组成loader完整5项 |
| E-7663 | test | evidence/E-7651-round-config.stdout.txt | fail | 3249c95；结构fixture的绝对路径被schema拒绝，未运行到时钟边界；2f198e5改schema-valid环境模板 |
| E-7664 | test | evidence/E-7653-round-config.stdout.txt | pass | 2f198e5；4pass exit0；完整config结构/首错/成功/默认60s整轮，5探测64.740s，小于60+10s |
| E-7665 | mutation | evidence/E-7654-mutation-a-config*、E-7643-mutation-b-config*、E-7644-ttl-control-config* | pass | 完整config修复后A/B/TTL同锚点重变异均exit1，原始断言红非outertimeout；三份before==restored |
| E-7666 | test | evidence/E-7656-config-restored.stdout.txt | pass | 3d55ca7；4pass exit0，93.8s；A/B恢复绿、完整config、真实异步spawn error/close与driver四零 |
| E-7667 | test | evidence/E-7657-config-errors-identity.stdout.txt | pass | 3d55ca7；8pass exit0，56.9s；C四错误和identity/profile4项 |
| E-7668 | inspection | evidence/E-7658-source-equivalence-final.json；E-7655-node-close-contract.md | observed | 生产3文件从5e04dd8至3d55ca7同；其它regression源码与24e575f同；旧evidence保持原SHA，Node官方事件合同与实际error→close取证互证 |
| E-7669 | test | evidence/E-7659-config-start-cleanup.stdout.txt | pass | 3d55ca7；2pass exit0，65.8s；完整config双候选选择与正式Windows超时清理 |
| E-7670 | check | evidence/E-7660-dh-check.txt | fail | exit1：21失败/92警告；本卡R12结论格式与R27派出标记已修，余项为DHR75/74或R29既有规划事件新鲜度；不改范围外工件、不声明体检通过 |
| E-7671 | check | evidence/E-7661-dh-check-final.txt | fail | exit1，23失败/92警告；本卡R21/R27/R31待整改，未冒充体检通过 |
| E-7672 | decision | decision-cleanup.md；design/evidence/39-DHR76-异常清理失败返回-B调整交叉审核记录.md | confirmed | 2026-09-05用户明文“确认”；DHR-B-42同步DevPlan/brief/task_plan；fresh审核P0/P1/P2=0；不含E11/verify/合入 |
| E-7673 | test | evidence/E-7662-cleanup-unconfirmed.stdout.txt | pass | b781d08基线+测试增量；exit0，5.683s；probe-close-timeout、cleanup_unconfirmed=true、close_observed=false、kill_calls=2；生产未改 |
| E-7674 | mutation | evidence/E-7663-mutation-git-objects.json | observed | A/B变异与还原源码写为真实40位Git blob；重新计算SHA256与E-7654/E-7643原始证据逐字匹配，三个对象cat-file可读；供代码轮2补R31固定登记 |
| E-7659 | test | evidence/E-7659-config-start-cleanup.stdout.txt | pass | 3d55ca7；2pass exit0；完整config双候选选择与正式Windows超时清理；同一事实亦由E-7669记账，补本行供raw文件ID反查 |
| E-7675 | check | evidence/E-7664-dh-check-b42.txt | fail | exit1：16失败/91警告；本卡R31/R21/R27已清零，仅R8缺E-7659账本行与R14计划卡解析残留；R8已补，R14不改写合同规避；其余为其它卡或既有R29 |
| E-7676 | check | evidence/E-7666-dh-check-final2.txt | fail | exit1：15失败/91警告；DHR76仅R14“找不到DevPlan验收口径”，卡面与brief已逐字人工核对一致；其余14项属DHR75/74及既有R29，未改范围外工件 |
| E-7677 | test | evidence/E-7667-cleanup-unconfirmed-driver.stdout.txt | pass | 296b885基线+测试增量；2pass exit0，30.811s；never-close分支明确失败，driver的Attempt/Agent/pane/Result全0，kill_calls>=2；异常不声称无残留 |
| E-7678 | review | review-b42-code.md | pass | fresh增量终审approved，P0/P1/P2=0；E-7667与E-7659合成覆盖B-42，P1-CONS-01可关闭；R31登记处理合理 |
| E-7679 | report | review.md#E10放行证据包 | ready | 阶段汇报@E9与releasePacket-DHR76-v1已备料，将在本轮对话展示；shownVersion=8028cc7；H=0、Risk-Count=0；等待E11一次性本地收口确认 |
| E-7680 | check | evidence/E-7668-dh-check-e10.txt | fail | E10包后终态：exit1，15失败/91警告；DHR76仍无failure、仅R14计划卡解析warning；其余14个failure属DHR75/74及既有R29，完整raw保留 |
| E-7681 | acceptance | review.md人类签名区 | pass | 2026-09-05 13:44 +08:00用户对releasePacket-DHR76-v1明文“认可”；授权精确本地squash、合入复验、verify、DevPlan/workspace回填及本任务worktree/branch清理；不含push/deploy/环境操作/下一卡 |
| E-7682 | integration-test | evidence/E-7669-master-profiles.*；E-7670-master-loader-alias.*；E-7671-master-loader-config.* | pass | master@23de8cf；profiles 14/14、loader alias 3/3、loader config 2/2，均exit0 |
| E-7683 | integration-test | evidence/E-7672-master-host-cleanup.* | pass | master@23de8cf；3/3，exit0；真实Host默认15s租约期间续租17次、contender均E_LEASE_HELD；异常清理未确认时明确失败且driver四类副作用全0 |
| E-7684 | integration-test | evidence/E-7673-master-selection-cleanup.*；E-7676-master-selection.* | pass | master@23de8cf；正式Windows超时清理与后代死亡1/1；完整校验先于选择启动且等待期四零1/1，均exit0 |
| E-7685 | integration-test | evidence/E-7674-master-epoch-stop.* | pass | master@23de8cf；epoch接管与stop等待后四零2/2，exit0 |
| E-7686 | check | evidence/E-7675-master-dh-check.txt | fail | master@23de8cf；全仓exit1、15失败/94警告；DHR76无failure、仅R14计划卡解析warning，其余失败属DHR75/74及既有R29，不冒充全仓通过 |
| E-7687 | report | E10证据展示区已发出 | pass | releasePacket-DHR76-v1已在对话完整展示，用户于2026-09-05 13:44 +08:00明文“认可” |
| E-7688 | snapshot | E7 as-built已更新 | pass | as-built/relay-core.md已记录DHR76现役实现、B-42异常边界及跨卡证据边界 |
| E-7689 | report | E9交付汇报已发出 | pass | 七段结论与releasePacket-DHR76-v1已在对话展示并获用户认可 |
| E-7690 | closeout | squash=23de8cf；verify=6adb54e；release_mode=full | pass | DHR76已完成；DevPlan/workspace/as-built机械回填，随后只清理本任务worktree/branch；不push、不部署、不启动下一卡 |

## S1 校核裁决与执行澄清（2026-09-05）

- A~F 与精确路径已由 brief 逐字冻结，task_plan 的简写不替代合同。校核提出的漏写细节均提醒施工方落实；不把简写误判为正式口径变更。
- 错误两层：validator 内部 E_UNRESOLVED_ALIAS；loader 包装 E_BAD_VALUE:PROFILE_REGISTRY，detail 含内部码。原步骤 2/3 分别描述两层，并无放宽；现显式澄清。
- 120s 外层上限落到每条指定测试命令；可按命名场景分开执行，每条均独立有界，不能用每项 timeout 放任单命令无限累加。
- A：保留完整五 Profile 与 fallback 结构、非目标坏项并变异生产跳过；B：默认 TTL=15000、expiry 单调、contender 精确 E_LEASE_HELD、同步与 TTL-only 对照；C：两个指定 Profile 可解析且只启所选；D：旧 epoch 后零双写/启动、stop 后四零和子孙清理；E：不改断言迁就实现，变异登记完整 hash/命令/锚点/失败摘要。已通知施工方。
- miner 仅只读 dh mine，产物只落本卡 lesson_candidates/workspace；共享 knowledge 不在允许路径，禁止追加。
- S1 建议不是新增需求或放宽 stop/lease 合同；施工步骤已冻结，按规程只在 progress 记实际澄清。

## 本轮停止点

DHR76已按用户认可完成本地收口：squash=`23de8cf`，verify=`6adb54e`，release_mode=full；合入后相关复验见E-7682~E-7686。仅余机械提交本页/DevPlan状态并清理本任务树与分支；不push、不部署、不启动下一卡。
