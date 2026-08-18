# findings — DHR_26

## 已确认事实

### DHR_26 任务边界

DHR_26 只负责 Host 半程：树外 Host Plugin、独立 Home、rc.6 到 rc.7 升级留证、Host 侧 `ctx.relayPilot` 调用和 DHR_49 施工输入。Client Plugin、面板 UI、列表屏、详情屏与跨客户端镜像断言验证均归 DHR_49。

### DSH rc.7 上游形态侦察

基线：`deepseek-ai/deepseek-harness`，`dsh-v0.1.0-rc.7@99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`。

观察到的 Host Service 形态：

- `packages/host/directory-picker/src/index.ts` 使用 `Context` 与 `Service` 来定义 `ctx.directoryPicker`，并通过 `declare module '@deepseek-ai/cordis'` 扩展 `Context`。
- 具体实现可继承抽象 Service，构造时调用 `super(ctx, '<serviceName>')`。
- `packages/host/directory-picker-browse/src/index.ts` 展示了带 `Config` 的默认导出插件类写法，并使用 `@deepseek-ai/schemastery` 定义配置。
- `packages/web/web-fetch-http/src/index.ts` 展示了 function plugin 写法：`export const name`、`export const inject`、`export const Config`、`export function apply(ctx, config)`。

本卡源包选择 Service 类 + `apply()` 双入口：`RelayPilot` 继承 Cordis `Service`，服务名固定为 `relayPilot`，同时导出 `apply(ctx, config)` 便于树外插件加载器按 function plugin 方式调用。

### 源包静态约束

`artifacts/src/dsh-host/` 当前约束：

- 只导入 `@deepseek-ai/cordis`、`@deepseek-ai/schemastery`、Node 标准库。
- 不导入任何 `@deepseek-ai/dsh-*` 私有类型。
- `ctx.relayPilot.detail()` 与 `ctx.relayPilot.list()` 返回 JSON parse 后的普通对象。
- `ctx.relayPilot.snapshot()` 返回 schema version、字节数与 sha256，用于早交付和对证。
- JSON 递归校验会拒绝函数、`undefined`、非有限数字、循环引用等非普通 JSON 值。

## 待本机补齐事实

| 项 | 状态 | 需要补充 |
|---|---|---|
| B-10 预采 rc.6 快照是否仍有效 | 待执行 | 当前 `dsh --version` 与快照文件存在性 |
| rc.7 安装路径和内置包版本 | 待执行 | 升级后快照与 diff 摘要 |
| profile 安装边界 | 待执行 | 是否可仅靠 profile 装载 Host Plugin |
| `--patch` overlay 边界 | 待执行 | 是否可用、如何回滚、是否污染上游 |
| `dsh.client` 声明形态 | 待执行 | 官方 client 插件声明文件与本机扫描结果 |
| `exports["./client"]` 产物形态 | 待执行 | 可供 DHR_49 使用的实际包结构 |
| profile client 扫描锚点 | 待执行 | DSH 从哪里发现 client bundle |
| 本机类型定义位置 | 待执行 | 用脱敏路径记录 rc.7 可用 d.ts 位置 |

## 当前判断

仓内源包具备静态施工价值，但 DHR_26 的核心机器证仍取决于本机 DSH rc.7 进程内调用。现阶段不能将 Host Plugin 记为已加载或已通过。
