# DHR_76 · 代码轮 2 · fresh 定向复审

## 复核身份与范围

- reviewer：`/root/dhr76_code2`；独立 fresh 代码轮 2；只读复核生产候选与专项测试，不运行重测试、不修改生产代码/测试代码。
- candidate：`24e575f`（最终测试/边界证明提交，承接 `f05e66b`）；生产实现来自 `5e04dd8`，生产三文件相对 `3243087` 的候选变更为：
  - `relay-core/profiles/validate-profiles.mjs`
  - `relay-core/runtime/executors/herdr/profile-registry.mjs`
  - `relay-core/runtime/workflow-driver.mjs`
- 专项复核：`relay-core/test/dhr76-profile-validation-lease.test.mjs`；并核对 DHR_65 loader 与既有 profile/identity/Host lease 调用边界。
- 允许写入仅本报告；未修改 DevPlan、生产代码或测试。

## 结论（当前静态轮 2）

**静态复核通过：P0=0，P1=0，P2=0。**

候选保留同步 CLI/static 入口，并将 runtime loader 切到 `validateProfilesAsync()`；异步入口先做完整结构/fallback 校验，再按 registry 顺序逐 Profile 执行 config → alias 探针。未见只传目标 Profile、跳过 fallback 关系、放宽错误面或把校验推迟到 Attempt 之后的路径。

## 逐项复核

### P0

无。

### P1

无新的生产缺陷。

- `validate-profiles.mjs:99-147,217-249`：`validateStructure()` 先保留 schema、dangling fallback、pause-size 和 credential 检查；async 逐条复用 `validateProfileConfig()`，随后执行 `where.exe`/PowerShell fallback。`where` 成功要求 status=0 且 stdout 非空；普通 status=1 才进入 fallback；spawn error、signal、非零 fallback、空结果和超时不能形成成功结果。超时后的 close/cleanup 不再伪造完成：`validate-profiles.mjs:163-197` 在 cleanup 未确认或 root child 未 close 时 reject `E_UNRESOLVED_ALIAS:*`。
- cleanup timer 的 10,000ms 是冻结的硬宽限；到期未见 root `close` 时超时分支直接 reject `E_UNRESOLVED_ALIAS:probe-close-timeout`，不 resolve 正常 probe、不 `unref`、不返回成功。这与“宽限内等待 close，超时 fail-closed”一致；OS 清理失败后的“后代最终清零”反例未执行，只能写不可证，不能因此放行。
- `profile-registry.mjs:12-20`：loader 对 async validator 使用 `await`，既有 `E_BAD_VALUE:PROFILE_REGISTRY` 外层错误面保留；validator 内部错误仍在 detail 中留下 `E_UNRESOLVED_ALIAS` 或其它错误码。
- `workflow-driver.mjs:205-239`：loader 返回后先检查既有 `stopping`，随后才解析 Profile 并进入 `openAttempt()`；未见向探针传取消信号，也未见轮询、Result、lease、recovery 语义改动。epoch 丢失后的 actor 写仍交给既有 writeGuard/fencing 拒绝。

### P2

无新的生产缺陷。

- `validate-profiles.mjs:9-11,217-237`：15,000ms 单探针、60,000ms 整轮、10,000ms cleanup 常量和 deadline 参数仍冻结；单探针完成后检查整轮 deadline，未见 TTL 被拉长。
- `dhr76-profile-validation-lease.test.mjs:223-258,392-466`：专项同时覆盖五个真实 node 子进程、事件循环机会、Host actor lease expiry 递进、重复 contender 的 `E_LEASE_HELD` 和 lease renewals；静态上与 B 合同一致。
- `dhr76-profile-validation-lease.test.mjs:229-353,480-632`：专项覆盖五 Profile/fallback 图、非目标坏 alias、dangling fallback、config→alias 首错、错误面、epoch takeover、stop 期间零 Attempt/Agent/pane/Result；测试使用的异步 child 与生产 probe 接口形状一致。

## 变异锚点与机器证

### A：非目标 Profile 跳过

生产文件：`relay-core/profiles/validate-profiles.mjs`，async `validateProfilesAsync()` 内约第 227 行，唯一 async registry loop：

```js
for (const profile of json.profiles) {
```

变异替换为：

```js
for (const profile of json.profiles.slice(0, -1)) {
```

只允许命中 async 循环；同步入口约第 140 行保持不变。预期红测：

```powershell
node --test --test-concurrency=1 --test-name-pattern="DHR_76/A: a non-target invalid alias remains" test/dhr76-profile-validation-lease.test.mjs
```

实际红证据：`E-7629-mutation-a.stdout.txt` / `E-7629-mutation-a.json`，施加时 candidate=`6cf6f7108ab0eff8b6ddb9a8e61b380bf50bc13b`，exit=1、outer_timeout=false；失败摘要为 `true !== false`，即 account5 坏 alias 被跳过后错误接受。`E-7629-mutation-a-hashes.json` 记录 before/restored SHA256=`893BF2C9AE978A65822CBACC54B005077C3D506F5FF7FAF3B18ADA58F253EF26`、mutated=`7541D9BA97110DF9883BAB1E28DA21480CD82B29247469FC477FDBAB32F8DF47`，还原 hash 与 before 一致。

实际还原绿证据：`E-7636-a-restored.stdout.txt` / `E-7636-a-restored.json`，candidate=`6cf6f7108ab0eff8b6ddb9a8e61b380bf50bc13b`、exit=0、outer_timeout=false；`DHR_76/A` 非目标 alias 与 dangling fallback 两项均 pass。A 变异红/还原绿和 hash 闭环已成立；随后测试/loader 候选收敛至 `24e575f`。

## 终审可引用的外部运行证据

以下为主控在候选上执行并提供的脱敏证据，本 reviewer 未重跑，仅核对原始 stdout/summary 的终态与报告命题：

- `E-7620-host-probes.stdout.txt`：Host 默认 15s、五个 async child alias probe、expiry 严格前移、30 次 contender 均为 `E_LEASE_HELD`、renewals=31，exit=0。
- `E-7623-errors-epoch.stdout.txt`：spawn/non-zero/signal/empty 四类错误与 epoch takeover 负例均 pass，exit=0；epoch 场景 driver=`{ok:false,error.reason:"E_LEASE_HELD"}`，Attempt/Agent/pane/Result 四零断言通过。
- `E-7625-stop.stdout.txt`：stop 发生在真实 delayed loader wait 内，loader_wait_ms=51717，Attempt/Agent/pane/Result 四零断言通过，exit=0。
- `E-7646-two-profile-selection.stdout.txt`：candidate=`24e575f70233abfbc29578292e2773547f527f15`，完整校验先于所选 Profile 启动，completed_aliases=5、selected_starts=1、unselected_starts=0，exit=0。
- `E-7638-wrapper-errors.stdout.txt` / `E-7638-wrapper-errors.json`：candidate=`f05e66bbc5e385b1b9ca70eee909cd9ae0f19ce4`，spawn error/non-zero/signal/empty 四类 validator 与 loader 外层 `E_BAD_VALUE:PROFILE_REGISTRY` 均 pass，exit=0、outer_timeout=false。
- `E-7637-lease-fencing.stdout.txt`：既有 lease/Host fencing 定向回归 9/9 pass，exit=0。
- `E-7639-host-lifecycle.stdout.txt` / `E-7639-host-lifecycle.json`：detached Host 存活/强杀重建与 shouldStop 优雅释放两项均 pass，exit=0。
- `evidence/real-f/DHR76-F-20260905T020020638Z-cb6e298d/summary.json` 与 `timeline.json`：DSH-off Windows、完整真实用户 registry、`herdr.codex.main`；`attempt_started` 时 lease sample fresh，随后首条 `host_observation_changed`，cleanup service_remaining_count=0、fixture_empty=true、verdict=true。

这些证据闭合了运行边界，但不改变本轮 reviewer 的职责边界：需求方向、教训、一致性复核和 E10/E11 仍由对应节点裁决。

### B：同步真实子进程等待（备选）

生产文件：`relay-core/profiles/validate-profiles.mjs`，async `validateProfilesAsync()` 入口约第 223-225 行。把原 deadline 行：

```js
const deadline = Date.now() + validationTimeoutMs;
```

临时替换为一次连续的真实同步 child wait，再重新计算 deadline：

```js
spawnSync(process.execPath, ['-e', 'setTimeout(() => {}, 16_000)'], {
  stdio: 'ignore', windowsHide: true,
});
const deadline = Date.now() + validationTimeoutMs;
```

不得改测试的 `spawnCommand`，也不得改 Host/lease 文件。入口连续阻塞约 16s，随后原 async probe 仍返回五个 alias 成功；Host actor 的 15s lease 在首个 async probe 前已失效。预期红测：

```powershell
node --test --test-concurrency=1 --test-name-pattern="DHR_76/B:" test/dhr76-profile-validation-lease.test.mjs
```

本地 B 用例仍保留五个 alias/result 的成功语义；Host actor B 用例应因事件循环被一次连续同步 child wait 饿死、默认 15s lease 无法续租而 exit=1（expiry 不前移、renewals 不足或 contender oracle 观察到接管）。还原后应 exit=0。A 是本轮主锚点，B 仅作对照。

B 已由主控在最终测试/loader 候选上实际施加并自动还原：`E-7643-mutation-b.json` 记录 candidate=`f05e66bbc5e385b1b9ca70eee909cd9ae0f19ce4`、exit=1、outer_timeout=false；失败摘要为 `expected multiple expiry samples, got 3`，说明一次连续同步等待确实饿死默认 15s Host 续租观测。`E-7643-mutation-b-hashes.json` 的 before/restored SHA256=`893BF2C9AE978A65822CBACC54B005077C3D506F5FF7FAF3B18ADA58F253EF26`、mutated=`AC0C71EEA2A21CD5766CAF3795D2BDBAC501BDA4F58C0B8AAA8ECFF5995E02BB`，还原 hash 与 before 一致。

最终候选的还原正向证据为 `E-7645-b-restored.json` / stdout：candidate=`24e575f70233abfbc29578292e2773547f527f15`、exit=0、outer_timeout=false；constants、五 Profile 图和真实 Host+loader B 共 3 项通过，B 记录五个 alias、elapsed_ms=32240、renewals=31、30 个 contender 全为 `E_LEASE_HELD`、expiry 单调前移。

### B-TTL-only：仅拉长 TTL（对照）

若主控需要同时记录 TTL-only 对照，不能改禁改的 Host/lease 文件；可临时只改专项测试 `relay-core/test/dhr76-profile-validation-lease.test.mjs` 的 actor 构造，在 `createHostSessionActor` 调用增加：

```js
ttlMs: 60_000,
```

然后仍执行上方 `DHR_76/B:` 命令；`before.expires_at_epoch_ms - Date.parse(before.acquired_at) === 15_000` 断言应立即变红，证明“只延长 TTL”不满足合同。该测试变异只能临时施加并必须还原；不得提交或把它当实现改动。

该 TTL-only 对照也已实际施加并还原：`E-7644-ttl-control.json` 在 candidate=`f05e66bbc5e385b1b9ca70eee909cd9ae0f19ce4`、exit=1、outer_timeout=false 下于首个 TTL 断言以 `60000 !== 15000` 变红；`E-7644-ttl-control-hashes.json` 记录 test-only before/restored SHA256=`77437CAEAA369CF096D7EAD6EE68ED271AF2FC17679BD0A60584F8A48DD59EAC`、mutated=`893596C0BBA03E8547F615FE451DF09A6EA4CAC0259A37B04F0414E2153AAFEB`。该对照证明默认 TTL 合同被测试直接钉住，且未改 `host.mjs`/`lease.mjs`。

## 最终候选的 A/C 覆盖

- `E-7645-b-restored.stdout.txt` 的 `DHR_76/A: five-profile fixture preserves the current DHR65 registry graph` 在 `24e575f` 上 exit=0，静态断言锁住五项：`herdr.codex.main`（codex-cli、无 fallback）、`herdr.codex.ninth`（codex-cli、fallback=`herdr.codex.main`）、`herdr.claude.main`（claude-code、无 fallback）、`herdr.claude.grok`（claude-code、无 fallback）、`herdr.claude.account5`（unverified、headless=false、无 fallback）；代码位置 `dhr76-profile-validation-lease.test.mjs:229-239`。A 的非目标坏 alias 与 dangling fallback 负例及独立生产跳过变异红/还原绿共同覆盖完整表与关系图。
- `E-7640-error-driver.json` / stdout 在 `f05e66b`（生产路径同 `24e575f`）上 4/4、exit=0：spawn error、non-zero、signal、empty 均在 validator 报 `E_UNRESOLVED_ALIAS`，loader 包装为 `E_BAD_VALUE:PROFILE_REGISTRY`，并由 driver helper 断言无 Attempt/Agent/pane/Result。对应最终测试位置 `dhr76-profile-validation-lease.test.mjs:271-305`。
- `E-7641-production-timeout.json` / stdout 在 `f05e66b`（生产路径同 `24e575f`）上 exit=0：正式 alias 15s 超时，loader 与拒绝 driver 各启动一次真实 child，均确认 `close`、后代清零、四零边界；对应最终测试位置 `dhr76-profile-validation-lease.test.mjs:634-671`。
- 双 Profile 选择由最终候选 `E-7646-two-profile-selection.json` / stdout 证明：五 alias 完成后 `selected_starts=1`、`unselected_starts=0`，且 `herdr.codex.main` 与 `herdr.claude.main` 两个 ref 均能解析；candidate=`24e575f70233abfbc29578292e2773547f527f15`、exit=0、outer_timeout=false，最终测试代码位置为 `dhr76-profile-validation-lease.test.mjs:587-632`。

## D：epoch、stop、真实子进程与清理的逐项裁决

- **D-epoch**：`workflow-driver.mjs:207-239` 在 loader `await` 后先检查 `stopping`，解析成功后才进入 `openAttempt()`；旧 actor 的迟到 Store 写仍走既有 fencing。`E-7623-errors-epoch.json`（候选 `5e04dd8`，生产路径此后未变）与 stdout 显示真实 delayed Node child 探针期间 epoch 1→2，driver=`{"ok":false,"error":{"reason":"E_LEASE_HELD"}}`，Attempt/Agent/pane/Result 均为零，exit=0。专项新增测试位置为 `dhr76-profile-validation-lease.test.mjs:480-542`。
- **D-stop**：`driver.stop()` 在 `loadExecutorProfiles()` 的真实异步 child 等待中触发，loader 返回后由 `workflow-driver.mjs:210` 的既有 `stopping` 复查挡住启动。`E-7625-stop.json`（候选 `6cf6f71`，生产路径此后未变）stdout 记录 loader_wait_ms=51717、Attempt/Agent/pane/Result 四零、exit=0；最终对应测试为 `dhr76-profile-validation-lease.test.mjs:544-585`。没有新增探针取消信号或轮询语义。
- **D-cleanup**：`validate-profiles.mjs:179-197` 将 10,000ms 作为硬清理宽限：宽限内等待 root child `close` 与 Windows `taskkill` 结果；到期仍无 `close` 时超时分支直接 reject `E_UNRESOLVED_ALIAS:probe-close-timeout`，若 root 已 close 但 cleanup/杀树失败，则由 `finish()` 等待 cleanup 后 reject `E_UNRESOLVED_ALIAS:probe-cleanup-incomplete`；两条路径都不 resolve 正常 probe、不伪造 close 或成功（代码也不调用 `unref`）。我的独立裁决是：这满足“未确认 close 不得成功”，并以硬上限兼容“必须等 close 才能确认成功”；超过 10s 的 OS 不合作清理不能被本代码证明为已清零，只能标不可证。`E-7641-production-timeout.json`（candidate=`f05e66b`，生产路径与 `24e575f` 相同）证明正常 Windows 超时路径 loader/driver 各一次、两次 child close、后代清零、exit=0；测试位置为 `dhr76-profile-validation-lease.test.mjs:355-383,634-671`。
- **D-subprocess/side effects**：D 的 epoch/stop/production-timeout 均使用真实 Node 子进程接口形状，后者还写 descendant PID 并在 close 后检查 `isProcessAlive=false`；静态及 E-7641/E-7625/E-7623 证据未见“假造 close/清理完成”路径。若要求覆盖 taskkill 失败、child 永不 close 的 OS 反例，当前证据不足，应写不可证，不能升级为通过或失败推断。

## 证据边界

- 本报告是静态轮 2 结论；未把代码审查当作运行验收。
- Windows 子进程树实际清零、真实 Host actor 续租/contender、epoch takeover、stop 等待 loader 的终态，已由上列脱敏 stdout/JUnit/summary 提供机器证；本 reviewer 不把静态检查单独当作这些运行结论。对“cleanup 失败且 OS 不配合时是否能清零”的未执行反例仍只能写“不可证”，不能由本报告推断通过。
- 真实 F、E10 展示、需求方向/一致性/教训复核、verify、E11、本地合入和清理不由代码轮 2 代签。

## 增量定向最终证据（candidate `3d55ca7`）

本节只补最终候选后的定向机器证，不重写前述静态审查。`E-7658-source-equivalence-final.json` 记录 production base=`5e04dd8`，当前 candidate=`3d55ca739029cf4e35383fe69eab6dfa36844c7a`；三个生产文件 SHA256 与基线一致，`regression_since_24e575f_changed=[]`、`production_changed_paths=[]`、`uncommitted_production_paths=[]`。因此后续测试提交只改变专项测试/证据脚本，不能把较早候选的生产行为误标为新生产变更。

- **A 配置形状与整轮预算**：专项 `dhr76-profile-validation-lease.test.mjs:41-64,239-253` 现在锁住四个带 `config_fingerprint_rule` 的 Profile（`main`、两个 Claude、`account5`），`herdr.codex.ninth` 明确无 config；字段包含 schema 所需的模板路径 `${DHR76_PROFILE_HOME}/profile.json` 与非 secret projection 字段。`E-7653-round-config.json`（candidate=`2f198e5`，生产文件与 `5e04dd8` 等价）exit=0、outer_timeout=false，四项通过：五 Profile 图、mixed config 首错、完整 registry 成功校验、五个真实 probe 的 60s round budget；stdout 记录 `round_budget_ms=60000`、`cleanup_grace_ms=10000`、`elapsed_ms=64740`、`calls=5`。
- **A 配置版变异红绿闭环**：`E-7654-mutation-a-config.json` candidate=`2f198e5`、exit=1、outer_timeout=false，非目标坏 alias 被跳过后出现 `true !== false`；`E-7654-mutation-a-config-hashes.json` 记录 before/restored=`893BF2C9AE978A65822CBACC54B005077C3D506F5FF7FAF3B18ADA58F253EF26`、mutated=`7541D9BA97110DF9883BAB1E28DA21480CD82B29247469FC477FDBAB32F8DF47`。其后 `E-7656-config-restored.json` 在 current candidate=`3d55ca7` exit=0，四项均通过：五 Profile 图、非目标坏 alias、Host 接 loader 续租、真实异步 spawn error close；stdout 记录 Host `renewals=31`、30 个 contender 全为 `E_LEASE_HELD`、五 alias 均被探测。
- **B 同步等待变异与 TTL-only 对照**：配置 fixture 上的 `E-7643-mutation-b-config.json` candidate=`2f198e5`、exit=1、outer_timeout=false，失败仍为 `expected multiple expiry samples, got 3`；hash before/restored=`893BF2C9AE978A65822CBACC54B005077C3D506F5FF7FAF3B18ADA58F253EF26`、mutated=`AC0C71EEA2A21CD5766CAF3795D2BDBAC501BDA4F58C0B8AAA8ECFF5995E02BB`。`E-7644-ttl-control-config.json` candidate=`3d55ca7`、exit=1、outer_timeout=false，在 15s 断言处以 `60000 !== 15000` 变红；test before/restored=`EF21A53F9972EF8CA15D0CD8F8E66304542C5F712C07A186E09AAD6D10015114`、mutated=`CE95EDE18F1479CB17D5081DC36E7C473D22DE262DAA1A8D38A0F18403C4214C`。两份 config 版变异均自动还原，production equivalence 机器证确认未改 Host/lease 或生产三文件。
- **C 错误面、identity 与原生 error→close**：`E-7657-config-errors-identity.json` candidate=`3d55ca7`、exit=0、outer_timeout=false，四类 C alias 错误与四项 DHR_61 identity projection 共 8/8 通过。`E-7656-config-restored.stdout.txt` 还记录真实 nonexistent executable 的异步 `error` 后 `close` 路径通过 loader 与 driver；对应测试 `dhr76-profile-validation-lease.test.mjs:703-728` 断言顺序为 `['error','close']`，driver 第二次同样为 `['error','close']`。`E-7655-node-close-contract.md` 只作为 Node 事件顺序参考，未被当作任意 OS 清理成功证据。
- **selection 与 D 正常清理的最终 raw**：`E-7659-config-start-cleanup.json` 在 candidate=`3d55ca739029cf4e35383fe69eab6dfa36844c7a`、exit=0、outer_timeout=false 下 2/2 通过；selection stdout 记录五 alias 完成、`selected_starts=1`、`unselected_starts=0`，D timeout stdout 记录 `elapsed_ms=7698`、`descendant_pid=17364`、`alive=false`。这替代旧 `E-7646` 作为当前 candidate 的 selection 证据，但仍只证明正常 close/清理路径，不能消除 D 异常清理合同 P1。

本增量证据不改变代码轮 2 的静态结论（P0=0、P1=0、P2=0），也不替代跨路一致性裁决：`review-consistency.md`/`decision-cleanup.md` 仍保留 D 异常清理合同的 P1 分歧，用户确认或正式合同调整前不具备放行条件。本报告对 taskkill 失败、child 永不 close 时的“已无残留”仍标记不可证。
