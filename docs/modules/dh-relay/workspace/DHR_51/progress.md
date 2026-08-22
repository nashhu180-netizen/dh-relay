<!-- dh:v1 -->
# progress — DHR_51

## 过程账 (Progress Ledger)

| 日期 | 谁 | 做了什么 | 节点 | 下一步 |
|------|----|----------|------|--------|
| 2026-08-22 | 主控(Claude) | 入口闸分流经用户对话内 AskUserQuestion 确认「确认，全量开工」；自本地 master b441fc6 建 worktree wt/DHR_51（F-010 教训：不从落后的 origin/master 切）；S0/S1/S2 落 brief/task_plan | S0~S2 | S3 施工按 task_plan 步骤 1~9 |
| 2026-08-22 | 主控(Claude) | S3 施工：`runtime/{runid,pidalive,repolock,lease,gitignore,startrun,host,host-main,status}.mjs` 九模块 + store 两处最小触碰（F-011 封堵 / writeGuard）+ 测试 41 条（contracts 10 / store 15 / runtime 16，含真并发发号与 detached 强杀恢复） | S3 | 五道机器闸实跑 → 收口段 |
| 2026-08-22 | 主控(Claude) | 机器闸实跑（worktree relay-core）：npm test 41/41 exit 0；validate --selftest pass=33 fail=0；audit-contracts 全绿（token 164 未登记 0、K-3 内联 pattern 0）；fixture manifest 55 份相符；capability baseline 8 份相符、capability_hash=970b54601ae582a5… 零漂移 | E0 前置 | 提交施工批次 → 派复核 |
| 2026-08-22 | 主控(Claude) | 真实场景预演（人判需求境机器侧，E-201）：临时仓建 Run `R001-demo-20260822` + detached 宿主（pid 13952）；**启动 shell 退出后新 shell 跑 `status.mjs` → host=alive**（events=2、租约在续）；SIGKILL 强杀 → 新会话接管 took_over=true epoch=2；现场清理 | 人判备料 | 等四路复核结果 → 返工收敛 → 轮2 |
| 2026-08-22 | 主控(Claude) | 四路复核回收：E4 needs_evidence（缺 Oracle 复验/测试隔离 F/索引原子性 G）、E14 两遗漏（跨仓锁粒度、指纹要素）、E5 两空洞（MUT-C 续租/MUT-D 接线）+ 教训命中 3 条、轮1 changes-requested（R1-01 损坏租约挂死 P1、R1-02 在途锁双持有人 P0、R1-03 renew 覆写接管者 P1 等） | E2/E4/E5/E14 | 返工收敛 |
| 2026-08-22 | 主控(Claude) | 返工收敛两批（67cc8c4/66d24e3/8960ae3/f109c58）：移交② P1 fixture Oracle 复验 + F-105 落账；F-009 用例注入 indexPath（清真实 home 13 条测试污染）；索引锁挪到 `<indexPath>.lock` 跨仓互斥 + 跨仓并发测试；宿主层续租/失租咬合测试（MUT-C 变异真红）；损坏租约 LEASE_CORRUPT 区分 + 有界超时（R1-01 修复，变异真红）；在途锁不偷（R1-02 修复，0/20 重叠探针）；renew 新鲜度闸 + unlink/wx（R1-03 修复，变异真红）；repolock nonce 归属；reason-codes §四内部前缀登记；E5 新候选-15 登记 | 返工收敛 | 轮2 增量复核 → 收口 |
| 2026-08-22 | 主控(Claude) | as-built/relay-core.md 收口更新：§3.6 runtime 小节、§3.5 已知边界五条刷新（F-011 关账/撕裂窗口评估/renew 微窗口/PID 复用/损坏租约）、§5 闸表 49 条、§8.4 lease 等价性回写、§10 阅读对象补 DHR_51/52 | E7 | 轮2 复核 → E8~E10 verify 备料 → E11 |
