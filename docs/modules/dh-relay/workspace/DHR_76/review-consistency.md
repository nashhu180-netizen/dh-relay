<!-- dh:v1 -->
# DHR_76 一致性独立复核（Batch-7601）

## 复核边界

- 复核快照：候选 `2f198e5`（生产改动锚点 `5e04dd8`）；只读检查现有代码、DHR_76 工件、DHR_65/DHR_63 结构证据和当前 F 投影。
- 未运行测试、未改生产代码、未改 DevPlan；本文件是本路唯一新增复核工件。
- 复核问题集中在同步/异步 validator、loader 外层错误、HerdrCLI 既有 timeout、Host TTL/fencing、stop 生命周期，以及 A/D 合同的一致性。

## 结论

**DHR-B-42 合同同步后的最终一致性结论：`approved`；P0=0，P1=0，P2=0。**

已读取的 E-7653（A/C/60s round 4 pass）、E-7654（A mutation red）、E-7656（config-restored 4 pass，含 loader/Host 与原生 spawn error→close）以及 E-7643/E-7644（B/TTL 对照 red）把 A config 与正式 60s round 的证据补齐；哈希已还原。用户随后确认 decision-cleanup.md 的最小澄清，DHR-B-42 已把异常失败返回写入 DevPlan/brief/task_plan；fresh B-42 审核 P0/P1/P2=0，E-7662 证明该分支明确失败并标记清理未确认。原 P1-CONS-01 据此关闭。

### 关于 golden 与真实 registry 的裁决

`golden-registry.json` 不是本卡应强行采用的业务 fallback 权威。DHR_63 的已接受事实记录了 live `main.fallback_profile_ids=[]` 与 golden `main -> ninth` 的值级分歧，并明确 golden 不能直接充当完整结构等价副本；DHR_65 的已接受 fixture 保留了当前结构：Codex main 空 fallback、Codex ninth -> main、ninth 无 config rule。当前 F 只读 projection 也观察到五个 ID、同一 fallback 方向和 ninth 无 config，且报告的 last-write 早于本卡 F、没有用户配置写入。

因此，DHR_76 `completeRegistry()` 的 **fallback 图本身与 DHR_65/live 结构一致**；需求复核中要求补 golden 双向边的 P1-A 结论不成立，不应为“变绿”改真实业务图。config 形状已在当前候选修正，并由 E-7653/E-7656 终态闭合。

## 横向比对清单

| 比对项 | 同类位置/数量 | 结论 | 级别 |
|---|---|---|---|
| sync/async 校验顺序 | `validate-profiles.mjs:99-147` / `:217-249`；结构、每 Profile config -> alias 顺序一致；`resolveAlias:false` 委托 sync | 一致。runtime 只把 alias 探针改成可让出事件循环的 async 路径 | — |
| alias 结果语义 | sync `:55-67` 只按 status 判断 `where`；async `:175-177,239-246` 要求无 signal、非空 stdout，普通 miss 才走 pwsh fallback | 有意差异，符合 runtime 空结果 fail-closed 与静态/CLI 兼容合同 | — |
| loader 错误形状 | `profile-registry.mjs:12-20`；validator `:137-147,217-249` | 正常错误仍是外层 `E_BAD_VALUE:PROFILE_REGISTRY`，detail 保留 `E_UNRESOLVED_ALIAS`；ENOENT 的空 registry 行为未被 DHR_76 改写 | — |
| timeout 域 | validator `validate-profiles.mjs:9-11,213-246` 为 alias 15s / round 60s / cleanup 10s；HerdrCLI `herdr-cli.mjs:40-81` 既有普通 10s / start 60s | 两套边界未混用，DHR_76 没有改 HerdrCLI；async validator 的独立预算是必要的 | — |
| Host TTL / renew | `host.mjs:30,38,72-83`、`lease.mjs:20,149-170`；默认 TTL 15,000ms | 一致，异步 spawn 让 renew tick 继续运行；未见 TTL-only 或 writeGuard 放宽 | — |
| fencing | `host.mjs:62-64`、`lease.mjs:133-170`、`workflow-driver.mjs:207-211` | 一致，epoch/holder 校验仍在原位置；没有新增写者或绕过 | — |
| stop 生命周期 | `workflow-driver.mjs:207-211,608-616`；DHR_76 stop 用例 `:532-573` | 一致：loader await 后、`openAttempt` 前只复查既有 stopping，不发取消信号；loader 未完成时 current 为空，不会有 kill 误语义 | — |
| 五 Profile fallback 图 | DHR_76 `dhr76-profile-validation-lease.test.mjs:53-64`；DHR_65 `dhr65-registry-loader.test.mjs:45-55`；golden `golden-registry.json:4-24`；F projection | DHR_76 与已接受 DHR_65/live 一致，和 stale golden 的 main -> ninth 不一致是有意且有证差异 | — |
| 五 Profile config 形状 | DHR_76 `:41-63` 与 `:239-253`；DHR_65 `:21-55`；F projection | 已修正为 `[true,false,true,true,true]`；ninth 无 config，main/Claude 有 config，fields/expected_identity 形状对齐；`${DHR76_PROFILE_HOME}/profile.json` 是 schema-valid 的脱敏 fixture 路径；E-7653/E-7656 已闭合运行链 | — |
| cleanup/close | `validate-profiles.mjs:163-197`；D 合同 task plan `:15-17`、brief `:24-25` | 正常 close 路径等待 cleanup；cleanup grace 到期分支先 reject，未把 root child close/后代无残留作为返回前置条件 | P1 |
| child error | `validate-profiles.mjs:179-213`；E-7655 Node close contract；E-7656 原生 missing-exe loader/driver 4 pass | 正常 Node failed spawn 的 error→close 已有真实路径证据；人工构造 error 后永不 close 仍不可证，但不属于已证生产 Node 语义，不计 P2 | — |
| 正式预算证据 | D 用例 `dhr76...:355-397` 为补充性 3s round；C 正式 timeout `:634-682`；E-7653 整轮 stdout | 5 探针实际 `64.740s`，位于 60s round + 10s cleanup 界内，outer 120s 未超；60s P2 已闭合，D 的“10s 内不 close”仍由 P1 合同分歧覆盖 | — |

## P1-CONS-01（已由 DHR-B-42 关闭）：cleanup 10s 到期先 reject

- **锚点**：`relay-core/profiles/validate-profiles.mjs:179-197`，尤其 `:182-187`。
- **事实**：timeout 调用 `terminate()` 后设置 `cleanupTimer`。若宽限到期，回调执行 `child.kill()`、置 `cleanupOk=false`，随后直接 `reject(new Error('E_UNRESOLVED_ALIAS:probe-close-timeout'))`；这条路径没有设置 `settled`，也没有等待 `child.once('close', finish)`。只有 child 先发 close，`finish()` 才会 await Windows `taskkill` cleanup（`:163-177`）。
- **合同对照**：DHR_76 brief `:24-25`/`task_plan.md:15-17` 明确要求探针超时后等待 child close，并证明 Windows 子进程及后代无残留。
- **场景**：root child 或 taskkill 在 10s 内不发 close 时，loader 已向上返回失败，child/后代是否还活着与错误终态脱钩。当前 E-7641 的 child 能正常 close，只证明正常清理路径；它没有覆盖该反例。
- **最终裁决**：用户确认 10s 为硬清理宽限；到期仍未确认时允许明确失败返回，必须标记清理未确认、不得声称无残留、不得继续启动，且异常不计清理验收通过。DHR-B-42 已同步正式合同，E-7662 对应实现分支通过，因此该项关闭；正常 close/Windows 子树清零仍由 E-7659 证明。

## A config 形状与运行链：已闭合

- **锚点**：`relay-core/test/dhr76-profile-validation-lease.test.mjs:41-89,239-253`；对照 `relay-core/test/dhr65-registry-loader.test.mjs:21-55`；只读 F projection 为 `docs/modules/dh-relay/workspace/DHR_76/evidence/real-f/DHR76-F-20260905T020020638Z-cb6e298d/registry-projection.json`。
- **事实**：`profile()` 现在按正式形状给 main、Claude main/grok/account5 配置 rule，仅 ninth 缺省；main fields 为 `/model,/profiles`，Claude fields 为 `/model,/permissions`，Claude main 保留带 `***` 的 `expected_identity`。`completeRegistry()` 与 `configuredRegistry()` 都断言 `[true,false,true,true,true]`。workspace 下存在非敏感 `fixtures/profile.json`，环境模板 `${DHR76_PROFILE_HOME}/profile.json` 由 validator 展开后可用于正向配置检查。
- **终态**：E-7653-round-config 为 4 pass，包含结构、混合 config/alias 首错、成功和五探针整轮；stdout 记录 `elapsed_ms=64740`，位于 60s + 10s 界内，JSON 记录 outer 120s 未超。E-7654 的非目标 alias 变异 exit 1；E-7656-config-restored（记录候选 `3d55ca7`）为 4 pass，含完整 config loader、Host 路径、非目标 alias、结构和原生 missing-exe error→close/driver 四零。E-7654/E-7643/E-7644 的 mutation/TTL 哈希均已还原。
- **独立判断**：A 的 config 结构与运行证据已闭合；60s round 的 P2 证据已闭合。该判断不要求把 synthetic path value 做成用户真实路径，也不要求改真实 registry；golden 双向 fallback 结论仍不成立。

## 非阻塞残余（不计 P2）

1. `child.once('error', () => { failed = true; })`（`validate-profiles.mjs:211`）在人工注入“error 后永不 close”时会使 `terminate()`（`:179-180`）直接返回；但 E-7655 明确 Node failed spawn 会在 error 后发 close，E-7656 已通过真实 nonexistent-executable 的 loader/driver error→close。该人工无 close 场景仍不可证，不升级为生产 P2；D cleanup grace 合同另计 P1。
2. D 用例的 3s round（`dhr76...:376-383`）是快速补充路径；E-7653 已提供正式 60s/10s/120s 预算终态，因此不再保留预算 P2。

## 已确认无新增不一致

- `profile-registry.mjs` 的 async loader 接线、外层错误包装和 `workflow-driver.mjs` 的 loader-await 后 stop recheck 处于同一链路；没有发现把校验挪到 Attempt 之后的路径。
- Host/lease/herdr-cli 只读对照显示本卡生产变更没有扩大 TTL、放宽 epoch/writeGuard 或改变既有 HerdrCLI timeout；这些路径本复核未提出范围外整改。
- B 的 sync 变异、TTL-only 对照以及 A config 变异均已按失败证据处理：E-7643 因 expiry samples 不足退出 1，E-7644 因 `60000 != 15000` 退出 1，E-7654 的非目标 alias 变异退出 1；哈希已还原。它们说明对照能拒绝错误实现，但不替代 D 的 P1 合同裁决。

## 证据边界

本报告主体是静态一致性判断；原复核未运行测试，仅读取已登记的终态。DHR-B-42 后续收敛依据用户确认、fresh B-42 只读审核与 E-7662 原始专项证据。没有把候选 SHA、绿色测试、F projection 或正常 child close 解释成 E11、verify 或合入；P1-CONS-01 仅因正式合同已澄清且对应失败分支有证据而关闭。
