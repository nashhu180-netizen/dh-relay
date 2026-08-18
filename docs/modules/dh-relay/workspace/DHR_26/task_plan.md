# task_plan — DHR_26 施工计划

## Context Packet

DHR_26 的终点已经在 P4 DevPlan 锁定：Host 半程只证明树外 Host Plugin 能进入独立 DSH Home，并在 DSH 进程内暴露 `ctx.relayPilot`，从 DHR_25 fake fixture 原样返回 `relay.pilot-read-model/v1` 与 `relay.pilot-run-list/v1`。DHR_49 才承接 Client bundle、列表屏和详情屏。

施工必须遵守三条边界：第一，不修改 DeepSeek Harness 上游源码；第二，不改本仓 `tools/` 现役生产代码；第三，所有本机现场证据均落在 `<experiment-root>` 或本工作区，不写入日常 DSH Home。

本工作区的 `artifacts/src/dsh-host/` 是可复制到实验根的源包。它参考 DSH rc.7 中 Host Service 的常见形态：服务类继承 Cordis `Service`，通过 `declare module '@deepseek-ai/cordis'` 扩展 `Context`，构造时调用 `super(ctx, '<serviceName>')`；实现包仍需在本机 rc.7 环境内 typecheck、打包和加载。

## 施工步骤

### S0 本机前置核对

1. 在本机进入 dh-relay 仓库，确认当前分支或任务 worktree 指向 `wt/DHR_26-dsh-host-pilot`。
2. 确认 `<experiment-root>` 存在：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\`。
3. 确认 DHR_25 产物存在：`<experiment-root>\relay-control-pilot\`，且 fake fixture 能被读取。
4. 确认 B-10 预采快照存在：`<experiment-root>\evidence\dsh-version-baseline\rc6-before-upgrade.txt`。若不存在或当前 `dsh --version` 已不等于 `0.1.0-rc.6`，把预采快照标记为作废，并在本卡重新采“升级前快照”。

### S1 搬运 Host 源包

1. 新建或清理实验区目录：`<experiment-root>\relay-control-pilot\src\dsh-host\`。
2. 将本工作区 `artifacts/src/dsh-host/` 复制到上述目录。
3. 在实验区执行静态契约测试：`node --test tests/*.test.mjs`。
4. 静态测试只证明源包没有引入 DSH 私有类型、注册名为 `relayPilot`、只按普通 JSON 与文件 hash 工作。它不替代 DSH 进程内 smoke。

### S2 rc.7 升级与快照

1. 先记录当前 `dsh --version` 与 DSH 安装目录结构。
2. 若当前仍为 `0.1.0-rc.6`，按本机实际安装方式升级到 `0.1.0-rc.7`。
3. 升级后采集 `dsh --version`、内置包版本、安装目录结构，并与升级前快照做 diff。
4. 把快照路径、diff 摘要、版本号写进 `progress.md` 和 `findings.md`。所有结论必须标明 DSH 版本。

### S3 本机 typecheck 与打包

1. 在 `<experiment-root>\relay-control-pilot\src\dsh-host\` 安装依赖，依赖版本必须对齐本机 DSH rc.7 可用包。
2. 执行 `npm run typecheck` 和 `npm run build`。
3. 记录 DSH 可用类型定义的位置：例如安装包目录、profile 包目录或本机缓存目录。不得把含用户名或密钥的完整敏感路径写入仓内工件；必要时做路径脱敏。

### S4 独立 Home 安装

1. 使用 `<experiment-root>\dsh-home\` 作为独立 Home，禁止使用日常 DSH 配置目录。
2. 优先验证上游显式 profile 安装机制；若必须使用 `--patch` overlay，则把 patch 入口、适用边界、回滚方式写入 `findings.md`。
3. 任何“必须修改 deepseek-harness 上游源码”的路径都应立即止损登记，不继续硬改。

### S5 DSH 进程内 smoke

1. 启动独立 Home 的 DSH。
2. 在 DSH 进程内调用 `ctx.relayPilot.snapshot()`，确认返回：`service = ctx.relayPilot`、`protocol = relay.pilot-host/v1`、detail/list 的 schema version、字节数和 sha256。
3. 调用 `ctx.relayPilot.detail()` 与 `ctx.relayPilot.list()`，确认返回对象能 `JSON.stringify`，且 schema 与 DHR_25 fixture 原样一致。
4. 把首次成功调用的终端转录作为早交付证据写入 `<experiment-root>\evidence\DHR_26\host-smoke-first-call.txt`，并在 `progress.md` 登记。

### S6 卸载与清理

1. 按安装方式执行卸载或禁用。
2. 重启独立 Home 的 DSH。
3. 确认 `ctx.relayPilot` 不再存在或服务注册被清理。若 DSH 上游没有显式验证入口，登记“未验证”，不要把未知写成失败或通过。

### S7 DHR_49 输入沉淀

1. 在 `findings.md` 固化：`dsh.client` 声明形态、`exports["./client"]` 产物形态、profile client 扫描锚点、本机类型定义位置、`--patch` 与 profile 安装边界。
2. 给 DHR_49 准备“可以直接开工或止损”的事实包。DHR_26 自身不裁定三态。

## 小批检查点

- 批 1：工作区与源包静态检查完成。
- 批 2：rc.7 升级与前后快照完成。
- 批 3：Host Plugin 在独立 Home 内安装并完成 `ctx.relayPilot` smoke。
- 批 4：卸载清理与 DHR_49 侦察输入完成。

## 收口前要求

进入“待验收”前必须补齐本机证据、两轮独立复核和需求境证据。没有本机 `ctx.relayPilot` smoke 与卸载清理证据时，本卡不得标完成。
