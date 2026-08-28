<!-- lesson_candidates.md -->
# lesson_candidates — DHR_30 Relay CLI 与可选 DSH/Pi Bridge

## 教训候选

| ID | 一句话教训 | 状态 |
|----|-----------|------|
| L-01 | **headless worker 的沙箱不是完工门的取证环境**：codex `--sandbox workspace-write` 只放行 worktree 内写入，而测试要写系统临时目录与 `~/.dh-relay`，会产出一片 `EPERM` 假红（本卡批次 C：worker 报 139/150 并据此停工，主控无沙箱同树复跑 149/150，一项不复现）。派活只要求 worker 跑**定向**测试；全量测试与四道闸一律主控在无沙箱环境跑。 | ready-for-review |
| L-02 | **文件系统层面的「检查后原子删除」不可得**：陈锁自动回收（判定 stale → unlink）无论加多少判据（mtime、owner token、pid 存活），判定与删除都不是同一个文件对象，替换竞态永远开着。F-019 为此耗了三轮返工。正确解法是**取消自动回收**：外锁一律稳定拒绝，按持有者存活二分给出可操作的恢复指引（进程已死 → 提示确认无 CLI 在跑后手工删锁）。把"自动正确"换成"稳定拒绝 + 人可恢复"，语义反而干净。 | ready-for-review |
| L-03 | **收权要和「可发现性」合同分层**：把私有数据直接放在共享根目录（`.dh-relay/`）再收紧整个目录，必然与"descriptor 沿业务仓 ACL 可发现"的合同相抵（R-F-03）。正确姿势是给自己的私有落点开一个**独占子目录**（`.dh-relay/private/`），子目录 owner-only、共享根照旧继承——两头互不干扰。 | ready-for-review |
| L-04 | **Windows 上收权必须三步**：`icacls /grant:r` 只覆盖同一 trustee 的 ACE，**不清除其他已存在的显式 ACE**（R-F-02）。要真的收成 owner-only 得 `/reset`（清一切既有显式 ACE，回到纯继承）→ `/inheritance:r`（断继承）→ `/grant:r <user>:(OI)(CI)F`，且任一步失败即 fail-closed。测试要断言"真实 DACL 里每条显式 ACE 都属当前用户"，并**预埋一条外来 ACE** 验证它确实被清掉——否则断言没牙。 | ready-for-review |
| L-05 | **测试里现算日期当期望值 = 跨午夜炸弹**（F-017/F-024 两次踩到）。期望值要么由 fixture 钉死、要么只验形态（`/^R001-crash-\d{8}$/`），盘上断言以实际返回的标识为准；绝不让"测试进程的时钟"和"被测代码的时钟"各算一次再比。 | ready-for-review |
| L-06 | **worker 实抓的架构缺口应上交主控裁决，不是扩 worker 白名单**：批次 C 的 F-026（run_list 无源头排序）需要改 runtime，超出施工白名单。worker 写 findings 停工 → 主控裁定这是对 P4 B-13「分堆与排序由源头给」的实现缺口、直修并把排序规则**冻结进设计文档**再让 worker 按规则修断言。这条链把"临时补丁"变成了"合同 + 实现 + 测试"三件齐。 | ready-for-review |
| L-07 | **并发测试的概率干扰要靠构造消除，不靠重试**：双 CLI 并发用例先后被两类干扰打断（后启进程把先启进程的残条当收敛目标重放；SIGKILL 落在锁释放窗内留下新鲜陈锁）。解法都不是加重试，而是改构造——诱饵残条 + 假 service 扣住答复直到两进程都重放过；轮询判据补"锁已释放"。改完 11 连跑全绿。**偶发红是构造有洞的信号，不是运气问题。** | ready-for-review |
| L-08 | **Read Model 的分堆与排序必须由源头给死**：源头只给字段、让每个客户端自己推导分组和顺序，各端必然漂移。合同要把词表序、词表外 group 的落位、null 的落位、堆内次序全部写死（design/06 §14.4），并用一对镜像断言钉住——「改 group 必须移动位置」+「只改 run_status 必须逐字不变」，两条都要"改前基线 + 改后差异"双证。 | ready-for-review |
| L-09 | **库接缝不替宿主决定持久化落点**：dsh-bridge 是给 DSH Host 内嵌的库，不是进程，因此它**不落本地 pending 账**——持久 request record 的义务归宿主客户端（CLI 有自己的账，DSH 宿主要重试须自备持久化并复用同一 requestId）。这条边界写进了代码注释，否则下一个人很容易顺手把 CLI 的 pending 复制过来，造出两套互不知情的幂等账。 | ready-for-review |

> 状态流：`ready-for-review` → 人裁决 → `needs-promotion / promoted / rejected`。
