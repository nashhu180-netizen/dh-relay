<!-- dh:v1 -->
# DHR_76 · 代码轮 1 · 定向复审 candidate 5e04dd8

## 形态自述

`/root/dhr76_code1`，独立只读静态复核；未运行测试、未修改生产代码或测试代码、未 rebase。
复核基线为 `7d42532`，本轮生产候选为 `5e04dd8`；只读检查其相对上一候选 `7940f31` 的整改和三份生产文件。工作树中的测试/脚本在途变化不作为本轮代码结论。复核对象仅为：

- `relay-core/profiles/validate-profiles.mjs`
- `relay-core/runtime/executors/herdr/profile-registry.mjs`
- `relay-core/runtime/workflow-driver.mjs`

## 上一候选发现及本轮定向复核

### F-76-C1-01（原 P1，已闭合）超时清理失败现在以显式错误终止，不再伪造完成

- **位置**：`relay-core/profiles/validate-profiles.mjs:163-197`（候选 `5e04dd8`）。
- **整改事实**：cleanup 宽限到期只设置 `cleanupOk=false` 并显式 reject `E_UNRESOLVED_ALIAS:probe-close-timeout`，不再调用 `finish`，也不再 `unref()`。因此 root child 未发出 `close` 时不会把探针当作已完成。
- **整改事实**：Windows `taskkill /T /F` 的 `error`、非零退出或半宽限计时器到点均设置 `cleanupOk=false`，但仍通过 `finish` 等待 root child `close`；随后 reject `E_UNRESOLVED_ALIAS:probe-cleanup-incomplete`。loader 的既有 catch 会保留稳定外层 `E_BAD_VALUE:PROFILE_REGISTRY`，并把该明确错误写入 detail。
- **边界判断**：只有 root child 已 `close` 且 taskkill 进程以 0 退出时，才会返回普通 alias 失败结果；代码没有把 OS 拒绝 kill 或 close 未发生宣称成“无残留”。实际后代是否清零仍属于 D 的运行证据，静态复核不代替该证明。

### F-76-C1-02（原 P2，已闭合）sync/async 现在保持相同首错顺序

- **位置**：`relay-core/profiles/validate-profiles.mjs:99-147,217-249`（候选 `5e04dd8`）。
- **整改事实**：共享 `validateStructure` 保留 registry 级校验；共享 `validateProfileConfig` 负责单 profile 的 headless/config 检查。sync 和 async 都按 `json.profiles` 顺序执行“config → alias”；async 的 `resolveAlias:false` 直接复用 sync 入口。
- **首错判断**：profile[0] alias 与 profile[1] config 混坏时，async 会先检查 profile[0] config，再探测 profile[0] alias，保持原同步首错；不再先扫完整表 config。未发现首错优先级漂移。

## 已核对且本轮未发现生产缺陷的面

- **全表严格性**：候选异步入口先执行共享 `validateStructure`，再按 `json.profiles` 顺序执行共享 `validateProfileConfig` 与 alias 探针；schema、fallback dangling/capacity、headless、所有 config 及每一项 alias 均保留，并未只校验目标 profile 或跳过 fallback 关系。
- **异步成功/失败/空结果**：`where.exe`/`pwsh` 仅在 status=0、无 signal、stdout 含非空白内容时成功；spawn error、signal、非零 fallback、空 stdout 和 timeout 均不能得到成功结果。status=1 仅作为既有“where 普通 miss，转 Get-Command”分支。
- **错误包装**：`loadExecutorProfiles()` 对 validator 返回值和 probe reject 均仍返回 `reason='E_BAD_VALUE:PROFILE_REGISTRY'`；普通 alias 失败与 cleanup 错误均保留 `E_UNRESOLVED_ALIAS` 文本在 detail；没有观察到 Attempt 之后才校验的路径。
- **15s/60s/10s 参数**：候选默认常量分别为 `15_000/60_000/10_000`；每个 child timer 与整轮 deadline 均存在，10s cleanup 是单独的回收宽限。由于 cleanup 可能占用额外宽限，最终全量证据仍需记录实际墙钟边界。
- **stop 边界**：`workflow-driver.mjs:207-211` 的 `await loadExecutorProfiles()` 返回后、解析 profile 和 `openAttempt()` 之前新增了既有 `stopping` 复查；没有向探针传取消信号，也没有改轮询、Result、lease、recovery 语义。epoch 丢失时后续 actor 写仍由 actor/Store fencing 拒绝。

## 定向复审结论

**本轮静态整改通过（新增 P0/P1/P2=0）**。原 P1/P2 均已按上文闭合；清理是否实际消灭 Windows 子孙进程、B/D 运行边界、F 真实运行、第二轮 fresh 复核、E10/E11 和用户验收仍待各自证据，不由本轮代码复核代签。
