<!-- dh:v1 -->
# task_plan — DHR_76

## Context Packet

- brief.md 与 P6 DevPlan DHR_76：目标、六项验收与精确允许路径。
- design/evidence/38-DHR76-Profile同步校验阻塞HostLease-B调整交叉审核记录.md：预算、错误面、stop 竞态边界。
- relay-core/profiles/validate-profiles.mjs、runtime/executors/herdr/profile-registry.mjs、runtime/workflow-driver.mjs：同步校验和 loader await 后停止态。
- relay-core/test/dhr65-registry-loader.test.mjs：五 Profile 结构等价夹具与坏项零启动。
- runtime/host.mjs、lease.mjs、store/**：只读学习真实续租与 fencing；不得修改。
- workspace/DHR_75：只读参考证据和专项；不得移植其生产改动或替代各卡实录。

## 施工步骤

1. Test/Create relay-core/test/dhr76-profile-validation-lease.test.mjs：五 Profile 与 fallback、真实异步子进程累计 >15s、同 actor 两次续租、独立 contender、先验后启、超时/错误/清理/stop/epoch 负例。node --test --test-concurrency=1 test/dhr76-profile-validation-lease.test.mjs；每项外层上限 120s。先记录修前失败。
2. Modify profiles/validate-profiles.mjs：保留同步 CLI/静态入口，增加 runtime 异步完整校验；单 alias 15s、整轮 60s、清理宽限 10s。spawn error/非零/signal/超时/空结果保持 E_UNRESOLVED_ALIAS；真实 Windows 子树清理并等待 close。
3. Modify runtime/executors/herdr/profile-registry.mjs：await 完整校验，错误包装不变。Modify runtime/workflow-driver.mjs：仅 loader await 返回后、openAttempt 前复查 stopping；不传取消信号，不改其他语义。
4. Test dhr65-registry-loader、profiles、profile-identity、runtime lease/host、Herdr adapter；DHR_75 专项从其树读取并在本卡基线运行，不带入生产代码。追加 package.json 本卡测试。记录每个终态、区分基线问题。
5. 主会话执行本卡 DSH-off Windows 冻结 Codex Profile 的真实 F；完整 registry 只读；只保存白名单脱敏事件、时间线与 lease。attempt_started 时 lease 有效，随后首条 observation 才算通过；阻塞如实记 findings，不扩范围。
6. 自动代码轮1及整改后，fresh 代码轮2、需求、教训、一致性同 batch 并发（受工具槽位限制分派）；轮2选生产变异点，施工方施加、断言红、还原绿与 hash 记账。miner/as-built、dh check 和 E10 展示；不越 E11。

## 冻结决策

标准/高危/heavy；独立 worktree；单批功能；施工委托一个 worker，主会话负责工件、真实 F 与收敛。review mode=inline_registration，五路均保留独立身份；lesson 库存在时适用，不自行降级。所有 worker 禁止自派活/启动下一节点/改 DevPlan 状态。
