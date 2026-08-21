# P4-CM6b 只读审计（DHR_50）

## 范围与方法

审计范围按 DevPlan：`<pilot>/relay-control-pilot/src/dsh-host/`、`src/dsh-client/`、`<pilot>/dsh-home/` 与 DHR_26/49/50 工作区。2026-08-21 对运行时代码（排除 `test/`、`scripts/`）以词边界搜索 `writeFile|appendFile|mkdir|rmSync|unlink|rename|copyFile|spawn|exec|child_process|fetch|http.request|https.request`，结果为 `runtime-write-network-scan=0-matches`。审计时的八个运行时文件 SHA-256 已由终端输出留存；命中的文件系统写入仅在测试、证据采集或变异脚本中，非 Host/Client 的生产加载路径。

## 结论

| 审计点 | 事实 | 结论 |
|---|---|---|
| Relay 运行写权 | Host 运行时只读取显式 fixture，导出五个只读查询方法；Client 经 Remote 只调用取值路径。没有 `.dh-runtime/relay/` 写 API、网络写 API 或进程派活入口。 | 通过 |
| DSH 配置写入 | `dsh-home` 是独立 DSH profile 的插件安装状态；安装/卸载会改它，但不等于 Relay Run 写权。 | 通过，边界已披露 |
| fork DSH | `<pilot>` 根只含 `dsh-home/`、`evidence/`、`relay-control-pilot/`，无 `.git`；DSH 为全局 npm 安装的 `@deepseek-ai/dsh`，Pilot 未含 monorepo checkout 或其源码副本。 | 通过 |
| 本卡增量 | DHR_50 只新增本仓工作区和报告附录；不改 Pilot / DSH / fixture。 | 通过 |

## 未覆盖边界

- 此审计不替代 DHR_26 / DHR_49 已完成的插件安装卸载行为证据。
- 目录内测试、变异和证据采集脚本可向临时位置写报告或测试夹具；它们不属于运行时插件面，不能据此宣称“目录内零写”。
