# execution_strategy · DHR_26

## 技术选择

Host 使用零构建 ESM 包。运行时代码只依赖 Node 标准库与 Cordis 公共 `Service`，避免为最小 Pilot 引入 TypeScript 编译链、Schemastery 版本耦合和 DSH 私有类型。profile 安装依靠 package manifest 的 `dsh.bundle.patch`，`dsh plugin remove` 同时移除依赖与 bundle 层。

## 数据边界

`FixtureStore` 每次调用都重新 `readFile`、`JSON.parse` 并检查固定 schema version。返回值就是新解析的普通 JSON 对象。Host 不修改字段，不生成摘要，不缓存状态，不根据 `run_status` 推导 `group`。运行时代码不含写文件 API。

## 生命周期边界

- 安装：profile 本地路径依赖 + bundle patch。
- 启用：`RELAY_PILOT_HOST_DISABLED=0`。
- 禁用：bundle 行的动态 `disabled` 表达式。
- 取证：probe 注入 `relayPilot`，打印普通 JSON 后调用 DSH 提供的 `ctx.appExit`。
- 卸载：`dsh plugin --profile ... remove`，随后用新 DSH 进程核对服务缺失。

## 版本策略

目标基线为 DSH rc.7。入口仍为 rc.6 时先采新鲜快照，再尝试升级。升级失败不会吞掉 Host 侧可得事实；操作器继续在 rc.6 执行，但最后返回版本链不完整，所有结论必须带 rc.6 标签。

## 修改边界

允许修改本工作区及仓外 `<experiment-root>/relay-control-pilot/src/dsh-host/`。禁止修改 DeepSeek Harness 上游仓库、dh-relay `tools/`、DHR_25 fixture 与日常 DSH Home。
