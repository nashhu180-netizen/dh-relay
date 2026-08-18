# task_plan · DHR_26

## Context Packet

DHR_26 只承接 Host 半程。Client bundle、列表屏、详情屏、跨客户端镜像断言与三态裁定归 DHR_49/DHR_27。施工输入在 `artifacts/`，真实运行和证据写入仓外 `<experiment-root>`。

## 执行步骤

### S0 复制施工输入

将本工作区内容复制到实验根：

```powershell
$repo = '<dh-relay-repo>'
$experiment = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot'
$source = "$repo\docs\modules\dh-relay\workspace\DHR_26\artifacts"
$hostDest = "$experiment\relay-control-pilot\src\dsh-host"
$scriptDest = "$experiment\relay-control-pilot\scripts"
New-Item -ItemType Directory -Force -Path $hostDest, $scriptDest | Out-Null
Copy-Item "$source\src\dsh-host\*" $hostDest -Recurse -Force
Copy-Item "$source\scripts\Invoke-Dhr26Pilot.ps1" $scriptDest -Force
```

不得覆盖或改写 DHR_25 的 `testdata/fake/`。

### S1 一键运行

```powershell
cd D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot
.\scripts\Invoke-Dhr26Pilot.ps1
```

操作器固定使用 `<experiment-root>\dsh-home\`，不会使用日常 DSH Home。它要求 Node、npm、pnpm 与 dsh 在 PATH。

### S2 版本证据

1. 解析 `dsh --version`，只接受 `0.1.0-rc.6` 或 `0.1.0-rc.7`。
2. 复验 B-10 预采的 `rc6-before-upgrade.txt`。不可信时保留失效副本，并在 rc.6 现场重新采集。
3. 递归记录已安装 `@deepseek-ai/*` 包版本、路径和 `package.json` sha256。
4. rc.6 入口默认尝试升级到 `@deepseek-ai/dsh@0.1.0-rc.7`。
5. 升级失败时记录错误并继续 Host 生命周期验证，所有结果标注 rc.6；脚本最终以“版本链不完整”失败退出，避免误报 rc.7。

### S3 Host 包预检

运行 18 项 Node 测试、`node --check` 与 `npm pack <host-root> --dry-run`。任一失败立即停止安装。

### S4 profile 安装与首次调用

1. 按 schema 自动发现 DHR_25 detail/list fixture。
2. `dsh plugin --profile relay-pilot add <absolute-host-root>`。
3. `dsh --profile relay-pilot --dump-config` 核对 bundle 层。
4. 启用 probe 后启动 DSH。probe 从 `ctx.relayPilot` 读取两份模型、打印唯一 JSON 转录，并调用 `ctx.appExit(0)` 完成有界退出。
5. `verify-transcript.mjs` 对 fixture 与转录逐字段比较，必须输出 `RESULT: IDENTICAL`。
6. 首次成功后立即打印 `DHR26_EARLY_DELIVERY` 与报告。

### S5 禁用、卸载与清理

1. 设置 `RELAY_PILOT_HOST_DISABLED=1`，通过 `--patch` 注入只读 absence probe，必须得到 `present=false`。
2. `dsh plugin --profile relay-pilot remove @dh-relay/dsh-relay-pilot-host`。
3. dump config 中不得残留 `relay-pilot-host`。
4. 再次启动 absence probe，必须得到 `present=false`。
5. 重装并完成最终 probe，为 DHR_49 保留独立 profile 输入。

### S6 Client 侦察

记录本机 rc 版本下 `@deepseek-ai/dsh-client-modules` 的：

- `dsh.client` 声明
- `exports["./client"]`
- node/client 类型定义路径
- client bundle 路径
- profile `cordis.yml` 与 `ctx.baseUrl` 扫描锚点
- `--patch` 与 profile bundle 的边界

报告字段 `feasibility_judgement` 固定为 `null`，本卡不替 DHR_49 裁定可行性。

### S7 回填与复核

将 `<experiment-root>\evidence\dhr26\` 和版本差异摘要回填 `progress.md`、`findings.md`、`review.md`。随后派两轮 fresh 独立复核，P0/P1 清零后才能进入待验收。
