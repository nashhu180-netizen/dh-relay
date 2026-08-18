<!-- dh:v1 · findings.md — 施工发现。🟢 事实与推断分开。 -->
# findings — DHR_49

## 构建与装载事实

1. rc.7 Client Module Registry 只要求活 Loader package 声明 `dsh.client.platform='web'`，并从 `exports['./client']` 取得可读 bundle；不要求插件源码位于 DSH monorepo。
2. rc.7 browser module table公开共享 React、React DOM、Cordis、slots、web-react、primitives 等模块。当前 bundle 只运行时 require `react`，其余通过注入的 Client Context 使用，因此不存在未公开内部模块依赖。
3. 官方 bundle wire 是 `window.__ModuleLoader__.load({id,factory})`。本卡 builder 直接生成该 wire，源文本先规范化换行，Windows/Linux 可得到同一字节产物。
4. Builder 无 npm 依赖；Node 18+ 即可。`prepare` 会在 profile 本地安装时生成 `lib/client.js`，pack dry-run 验证生成后的 `./client` 产物进入包。

## UI 与数据事实

- Node 半部只注册 exact GET/HEAD `/relay-pilot/snapshot`，读取 DHR_26 Service 的 detached snapshot；非 GET/HEAD 返回 405，响应 no-store，effect disposal 拥有 route 清理。
- Browser 半部注册 `sidebar.footer.action`，不改 DSH 上游 slot owner。
- `groupRuns()` 使用 `Map` 按首次出现的源 `group` 建节，并保持输入 Run 顺序；函数体无 `run_status` 读取。
- 两条镜像断言已机器验证：改 group 移动；只改 status 的 grouping signature 字节不变。未知 group 如 `operator/custom` 原样成节。
- 详情屏只按 `run_id` own-key 从同一 Host snapshot 的 `details` 读取，不重新计算 Nodes/Attention/状态。

## Pilot 约束，不得升级成生产结论

- same-origin route 只承载本地冻结 fake fixture，适用于 DSH Web Pilot；Electron/file://、正式远端信任、流式事件和生产 RPC 不在本卡证明范围。
- 视觉使用最小内联样式，目标是可操作和可证伪，不代表最终工作台视觉方案。
- 刷新/重启语义在代码上每次重新 fetch snapshot，但必须真实 DSH 证据才能把 DM3 记 pass。

## §4.4 止损逐项事实

| 条件 | 当前事实 |
|---|---|
| 只能在 DSH monorepo 构建 | 未命中：dependency-free builder 已在独立目录运行 |
| 清净重跑不可复现 | 未命中：同机两次 SHA 全等 |
| Windows Profile 生命周期不稳定 | 未验证 |
| 需大范围导入未公开内部模块 | 未命中：运行时仅 React，共享公开 module table |
| DSH 重启无法从普通 JSON 重建 | 未验证 |
| 必须从 run_status 推导 group | 未命中：静态检查+变异测试均证明无依赖 |
| 用户明确喊停 | 未发生 |

本卡只登记事实，不据此代裁三态。
