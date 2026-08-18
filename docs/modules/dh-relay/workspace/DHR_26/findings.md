# findings · DHR_26

## 上游 rc.6 / rc.7 已确认事实

基线：`deepseek-ai/deepseek-harness@99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`。

1. DSH rc.7 的 Cordis 包版本为 `4.0.1`，Schemastery 为 `3.18.1`。rc 后缀只属于 DSH 包族，不能机械套到通用 vendor 包。rc.6 发布提交 `fb82698709c39f1860b0ab0ed147e1fa30c1d5d0` 同样携带 Cordis `4.0.1`，因此 Host 的 `^4.0.0` peer 同时覆盖计划允许的 rc.6 续验分支。
2. Cordis `Service` 构造函数以 `super(ctx, '<serviceName>')` 注册服务，并把 provider 生命周期与 fiber 清理绑定。
3. rc.6 与 rc.7 的 profile plugin 管理实现一致，均支持 `dsh plugin --profile <name> add <path>` 首次使用时初始化 profile，用 pnpm 安装依赖，并把声明 `dsh.bundle.patch` 的依赖加入 profile bundle stack；remove 后会移出该层。
4. `--patch` 是单次 invocation overlay。profile bundle 是持久依赖和持久 layer，适合 DHR_26 安装、禁用和卸载验证。
5. rc.6 与 rc.7 启动器都在挂载树前提供 `ctx.appExit`。one-shot 插件应调用该接口，请求有界清理和退出，避免 profile 的用户配置监听让进程常驻。
6. 官方 Client 包通过 package manifest 的 `dsh.client` 声明平台/注入/立即加载，通过 `exports["./client"]` 暴露 bundle 与类型。profile 的 `cordis.yml` 所在目录形成 `ctx.baseUrl` 扫描锚点，元数据负缓存需要重启后刷新。

## 施工中发现并修复的问题

| 级别 | 问题 | 处理 |
|---|---|---|
| P1 | 并发草案把 Cordis/Schemastery 版本写成 `0.1.0-rc.7`，实际包不存在。 | 改用零构建 JS；仅声明 `@deepseek-ai/cordis ^4.0.0` peer。 |
| P1 | 草案没有 `dsh.bundle.patch`，`dsh plugin add` 只会装普通依赖，Host 行不会加入 profile。 | 新增 `cordis.patch.yml` 和 package `dsh.bundle.patch`。 |
| P1 | 草案 snapshot 硬编码 rc.7，会把升级失败后的 rc.6 验证误标成 rc.7。 | 移除公开 snapshot 方法；版本由独立快照脚本从 CLI/包现场采集。 |
| P1 | 普通 profile 会启动配置监听，单纯打印 probe 可能不退出。 | probe 和 absence probe 通过公共 `ctx.appExit` 请求有界退出。 |
| P1 | 只有正则静态测试，未证明 fixture 原样传输、schema swap 拒绝与服务清理。 | 增加行为测试与 transcript 逐字段对证，当前 18/18 通过。 |
| P2 | npm 10 在错误的 `--prefix ... pack` 调用下会读取调用目录 manifest。 | 操作器改为 `npm pack <absolute-host-root> --dry-run`。 |

## Host 契约

- 包名：`@dh-relay/dsh-relay-pilot-host`
- 服务：`ctx.relayPilot`
- 方法：`listRuns()`、`inspectRun(runId?)`
- 配置：`detailFixture`、`listFixture`，操作器通过绝对环境变量传入
- 返回：只允许普通 JSON object；schema 不匹配立即失败
- 写权：无文件写 API，无 Relay 写操作
- DSH 私有类型：无导入

## 待本机确认

实际 rc.6/rc.7 包清单差异、用户当前 DSH 安装方式、profile 安装路径、真实 `dsh.client` manifest 路径、实际类型和 bundle 路径仍需操作器在用户机器采集。当前不对 DHR_49 的 Client 构建可行性作判断。
