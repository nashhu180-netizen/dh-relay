<!-- dh:v1 -->
# DHR_76 · 需求方向独立复核（Batch-7601）· 定向复审

## 复核边界与结论

- 复核者：`/root/dhr76_requirements`；heavy 同一收口 Batch 的需求方向路径；只读生产、测试与脱敏证据。
- 候选：`24e575f70233abfbc29578292e2773547f527f15`；生产实现仍按 `5e04dd8` 复核。E-7640/E-7641 等早一轮测试提交只增加测试，生产文件未变；本复核未运行测试。
- 权威合同：P6 DevPlan DHR_76（`:486-514`）、B-41 设计证据（`:7-10`、`:20-33`）、DHR_76 `brief.md` A~F 原命题。DHR_65/DHR_63 的已接受结构证据用于确定“结构等价”的正式输入，不以 stale golden 示例覆盖 live 语义。
- **当前结论：`changes-requested`，P0=0，P1=0，P2=3。** A、B、C 的已执行主要路径、D 的正常 Windows 清理路径及 F 已有终态；仍缺 C 的 60s 整轮终态，且 D 的非合作 OS/child-error 边界只能作受限不可证。E 的失败项均有终态并已区分 DHR75/Host 基线失败，canonical 账本仍需主控机械同步后再收口。

## 范围核对

候选生产改动仍限于 `relay-core/profiles/validate-profiles.mjs`、`relay-core/runtime/executors/herdr/profile-registry.mjs`、`relay-core/runtime/workflow-driver.mjs`；测试、脚本与证据落在 B-41 允许的 DHR_76 工作区路径。未见触及 `host.mjs`、`lease.mjs`、`store/**`、`contracts/**`、Herdr CLI、用户 registry 或凭据的越界改动；`workflow-driver.mjs:205-211` 仍只是 loader await 后、`openAttempt()` 前的既有 stopping 复查。

## A~F 逐项复核

### A：全表严格性

**前次 P1-A-01 撤回。** 前次把 `golden-registry.json` 的 Codex main → ninth 边当作本卡权威，结论不成立：

- DHR_63 已接受记录明确 live `herdr.codex.main.fallback_profile_ids=[]`、ninth 仍回退到 main，且 golden 与 live 有值级分歧：`docs/modules/dh-relay/workspace/DHR_63/findings.md:9-10`、`review.md:16-24`。
- 已接受 DHR_65 夹具的正式结构是 main 无 fallback、ninth → main、ninth 无 `config_fingerprint_rule`：`relay-core/test/dhr65-registry-loader.test.mjs:21-65`。因此 B-41 所说的结构等价副本应以 DHR_65/live 结构为准，不能强行采用 stale golden 的双向边。
- 当前 DHR_76 夹具已按该结构表达：`relay-core/test/dhr76-profile-validation-lease.test.mjs:38-55`、`:63-85`；结构断言锁住五个 ID、产品、headless、fallback 与 config rule 存在性：`:236-252`。实际 F 只读投影也记录 main 空 fallback、ninth → main、ninth 无 config，且 `last_write_utc` 早于本次运行：`evidence/real-f/DHR76-F-20260905T020020638Z-cb6e298d/registry-projection.json`。
- DHR65 的每个注册 Profile 坏 alias/config loader 与 driver 四零终态已分别由 `E-7649-loader-alias-final.stdout.txt`、`E-7650-loader-config-final.stdout.txt` 给出；A 末项跳过的生产变异红、还原绿与 hash 由 `E-7629-mutation-a.json`、`E-7636-a-restored.json` 闭合。

**A：满足。** 不以 golden 的错误边关系形成整改要求，也不要求修改真实 registry。

### B：调度不饿死

**B：满足。** `E-7642-host-loader.stdout.txt` 在实际 Host → loader 链路上覆盖五个真实异步 alias，默认 15s TTL 断言、expiry 单调前移、续租与 contender 语义均有终态；`E-7643-mutation-b.json` 的同步 `spawnSync(16s)` 变异 exit=1，`E-7644-ttl-control.json` 的 60s TTL 对照以 `60000 !== 15000` exit=1；两组 hash 均还原。候选 `E-7645-b-restored.json` 在 `24e575f` 上重新取得 Host-loader、五 Profile 与 TTL 正向绿。

### C：先校验后启动与错误面

**已闭合的部分：**

- 四类 spawn error、非零、signal、空结果已由实际 loader 与 driver 的四零路径覆盖：`E-7640-error-driver.stdout.txt` / `.json`。
- 正式 15s alias timeout 的 loader 与 driver 各一次、root child close、Windows 后代清零和四零已由 `E-7641-production-timeout.stdout.txt` / `.json` 覆盖。
- 同一运行文档同时放入 Codex/Claude 两个候选，五个 alias 完成后只启动首选 Codex：`E-7646-two-profile-selection.stdout.txt` / `.json`；当前用例为 `:598-643`。
- DHR65 完整结构的 alias/config loader 与 driver 四零已由 `E-7649`、`E-7650` 终态补齐，外层 `E_BAD_VALUE:PROFILE_REGISTRY` 和 detail 内部错误面均有断言。

**P2-C-01 · 60s 整轮预算尚无原始终态**

- 锚点：`relay-core/test/dhr76-profile-validation-lease.test.mjs:684-699`；合同来源 P6 DevPlan `:493` 的 15s/60s/10s/120s 冻结预算。
- 事实：用例已写成五个 11s 子进程、等待整轮截止并断言 `PROFILE_VALIDATION_TIMEOUT_MS`，但当前证据目录没有该命令的 JSON/stdout 终态；15s 单 alias 的 E-7641 不能替代整轮 60s 断言。
- 场景：若整轮 deadline 被删掉或计算提前/延后，现有 15s 正常/timeout 用例可能仍绿；该用例的存在不等于它已在候选上得到终态。
- 补证：在 `24e575f` 上执行该精确命名用例，保存 exit、外层 timeout、耗时、调用数和诊断输出；不得用静态代码或 E-7641 冒充。

### D：fencing、停止竞态与清理

**已闭合的部分：** epoch takeover、迟到写和启动四零见 `E-7623-errors-epoch.stdout.txt`；stop 在真实 loader await 期间的 stopping 复查和四零见 `E-7625-stop.stdout.txt`；实际 Host/lease lifecycle 与正常生产 timeout 的 child close、Windows 后代清零见 `E-7639-host-lifecycle.stdout.txt`、`E-7641-production-timeout.stdout.txt`。生产接线仍为 `profile-registry.mjs:12-20` 与 `workflow-driver.mjs:205-239`。

在 B-41 同时冻结 cleanup 10s 的解释下，代码的正常路径可接受：`validate-profiles.mjs:163-177` 等待已收到 root child `close` 后完成 cleanup；`:179-197` 在 10s 宽限内未收到 close 时显式 reject `E_UNRESOLVED_ALIAS:probe-close-timeout`，不伪造成功。故前次 P1-D-01 不再作为 P1。

**P2-D-01 · 非合作 OS 的“失败前 close/后代清零”只能作不可证**

- 锚点：`relay-core/profiles/validate-profiles.mjs:179-197`，尤其 `:182-187`。
- 场景：root child 或 Windows `taskkill` 在 10s 宽限内不发 `close` 时，调用方会收到显式失败，但本证据没有证明此时子进程及后代已经清零；E-7641 只覆盖正常 child close。
- 裁决：按 code2 的独立解释，硬 10s 宽限内正常路径必须 close，超过宽限显式 fail-closed，不把 OS 不合作伪造为通过，因此不升级为当前 P1；若主控把 D 原文解释为“即使失败也必须无限等待 close”，则需先修订预算/合同再复审，不能以现有证据直接放行。

**P2-D-02 · child `error` 事件路径没有独立清理终态**

- 锚点：`relay-core/profiles/validate-profiles.mjs:179-180,211-213`；当前错误测试使用的是 `spawnCommand` 同步 throw（`dhr76-profile-validation-lease.test.mjs:94-95`），不是 child 发出 `error` 后不发 `close`。
- 场景：若自定义 runner/OS 先发 child `error`，`failed=true` 会使后续 `terminate()` 直接返回；当前没有该注入的 bounded cleanup/outer error 原始证据。Node 正常实现是否总会补 `close` 未在本卡证明，故只记为受限 P2，不据此断言生产必现。

### E：直接回归与有效单测

**证据内容已具备终态，但账本需同步。** `E-7606` profiles 14/14、`E-7611` identity、`E-7617` adapter、`E-7637` lease/fencing、`E-7643`/ `E-7644` 变异红、`E-7645` 还原绿，以及候选 `24e575f` 的 `E-7648`、`E-7649`、`E-7650` 均可引用。DHR75/Host 既有专项的 E-7614、E-7615、E-7616、E-7632 虽为 exit=1，但失败原因与本卡生产无关且已留原始输出；它们不能被写成绿，也不应被误归为 DHR_76 候选回归失败。

主控仍需把 E-7649/E-7650 和最终候选、基线失败归因机械同步到 `progress.md`、`review.md`；本项是收口账本动作，不新增生产缺陷。

### F：真实产品边界

**F：满足。** 新 F 目录 `evidence/real-f/DHR76-F-20260905T023258226Z-b51be59d/` 的 `summary.json` 记录候选完整 SHA、DSH-off Windows、五个白名单 Profile ID、registry before/after SHA256 一致、Attempt lease 在事件时有效、随后首条 `host_observation_changed`、owned service/pane/fixture 清理完成和 exit=0。五 ID 检查由 `scripts/run-real-f.ps1:425-434` 执行；没有配置正文、Receipt 或凭据值。

## 复审状态

| 命题 | 当前判断 | 依据 |
|---|---|---|
| A 全表严格性 | 满足 | DHR65/live 结构、config 形状、末项跳过红→还原绿、alias/config loader 四零 |
| B 不阻塞续租 | 满足 | 实际 Host→loader、五 async probe、15s TTL、同步/TTL-only 红变异及还原绿 |
| C 先验后启 | 部分满足 | 错误 wrapper/driver 四零、正式 15s timeout、双 Profile 选择已过；60s 整轮尚无终态（P2-C-01） |
| D fencing/stop/清理 | 部分满足 | epoch/stop/正常 Windows close 清理已过；OS 不合作与 child-error 仅不可证（P2-D-01/02） |
| E 直接回归 | 终态已具备，账本待同步 | 既有基线失败如实保留；E-7649/E-7650 已有终态 |
| F 真实产品边界 | 满足 | 新 F 五 ID/hash/lease→observation/清理证据 |

补齐 C-01 的原始终态、完成 E 账本同步，并由主控对 D 的硬 10s 解释作一致性裁决后，可按同一 Batch 定向复审。本报告不代签 E10/E11、verify、用户确认、合入或清理。
