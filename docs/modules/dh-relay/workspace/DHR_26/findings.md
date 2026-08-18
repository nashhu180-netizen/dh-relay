<!-- dh:v1 · findings.md — 施工发现。🟢 事实与推断分开。 -->
# findings — DHR_26

## DSH rc.7 树外插件事实

研究基线：DeepSeek Harness commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`（`dsh-v0.1.0-rc.7`）。

1. **Host Service**：公开框架入口为 `Service` from `@deepseek-ai/cordis`；`super(ctx, 'relayPilot')` 把实例暴露为 `ctx.relayPilot`。本插件无需导入 DSH RC 私有包。
2. **Profile 安装**：`dsh plugin --profile <name> <pnpm args>` 在 `$DSH_HOME/profiles/<name>` 转发 pnpm；相对路径会锚到调用 cwd。声明 `dsh.bundle.patch` 的依赖被自动加入 `dsh.profile.bundles`。
3. **`--patch` 边界**：它是启动时最后叠加的临时覆盖，适合 probe/disable/re-enable 证据；profile 安装是独立 Home 内的持久依赖与 bundle 层，适合日常复跑。
4. **显式禁用**：配置行支持 `disabled: true/false`；是否真正清理服务必须在目标进程验证，当前只具备配置与静态生命周期证据。
5. **Client 发现（交 DHR_49）**：Host Loader 的活插件条目若 package.json 声明 `dsh.client.platform='web'` 且 `exports['./client']` 指向可读 bundle，就进入 Client Module Registry；解析锚点是配置树 `ctx.baseUrl`（profile/cordis.yml 所在包）。
6. **Client 产物形态**：rc.7 官方 bundle 由 `window.__ModuleLoader__.load({ id, factory })` 注册；浏览器依赖通过 factory 的 `require` 解析。
7. **安装侧模块解析**：DSH profile boot 会维护一个指向当前 DSH 安装依赖的 module fallback。Host package 因此故意不声明 npm dependency 或 peer copy 的 Cordis，而从该 fallback 解析安装方自己的 `@deepseek-ai/cordis`，避免第二份框架身份；代码不固化任何绝对安装路径。

## 实现事实

- Host 从 DHR_25 fixture 原样构造 `{list, details}`，只校验关联一致性，不根据 `run_status` 生成 `group`、节点或状态。
- 对外返回值经过 JSON clone；内部 snapshot deep-freeze；不存在 Cordis Context、Fiber、活动对象或函数穿过服务边界。
- Host 不注册 route、event、timer、process handler；生命周期只由 Cordis Service 行拥有。
- `run_id` 支持任意非空字符串；特殊属性名使用 null-prototype map 与 own-key 查询，避免原型污染。

## 未验证事实（禁止写成结论）

- 用户本机当前是否仍为 rc.6；B-10 预采文件是否存在/未漂。
- rc.7 实际升级结果与包差异。
- Windows Profile 安装、disable/re-enable/remove 后的真实服务清理。
- DSH 进程里首次 `ctx.relayPilot` probe 输出。

## 交给 DHR_49 的硬输入

`dsh.client` + `exports['./client']` + profile `ctx.baseUrl` 扫描锚点 + module-loader wrapper + profile bundle patch，是树外 Client 的最小路径；不需要 checkout/fork DSH monorepo。真实 Windows 加载仍须目标机补证。
