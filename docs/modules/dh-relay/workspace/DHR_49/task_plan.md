<!-- dh:v1 · task_plan.md — 施工图。🔵 开工时冻结；实际偏离只记 progress。 -->
# task_plan — DHR_49 树外 Client Bundle 与两屏面板

> 执行契约头：终点以 `brief.md` 与 DevPlan DHR_49 为准。代码完成不等于 UI 人验完成；任何未在真实 DSH/ThinkPad 执行的步骤必须保持 missing。

## Context Packet

| ID | 来源 | 为什么 |
|---|---|---|
| C-01 | `brief.md` | 终点、边界、覆盖态 |
| C-02 | P4 DevPlan §2.3、DHR_49、§4.2/§4.4 | 两屏、group 约束、可复现与止损 |
| C-03 | DHR_26 `findings.md` | `dsh.client`、`./client`、profile 锚点、module-loader、安装边界 |
| C-04 | DSH rc.7 `docs/subsystems/client-modules.md`、`packages/client/web/src/platform.ts`、sidebar slot 契约 | Client 发现、平台模块和 UI seat 的公开事实 |
| C-05 | DHR_25 `testdata/fake/` | 唯一 Read Model 输入，不另造业务契约 |

## 批次与验证

### 批 A · 独立 Client model（已做）

1. 先写变异测试：首次出现的 `group` 和源 Run 顺序必须保留；改 group 必须移动；只改 run_status 分组签名逐字不变；未知 group 原样输出。
2. 实现 `validateSnapshot/groupRuns/groupingSignature/selectDetail`，不复用 Host 分组代码。
3. 特殊 `run_id='__proto__'` 只用 own-key 查询。
4. 证据：model tests 6/6。

### 批 B · 不依赖 monorepo 的确定性 bundle（已做）

1. 浏览器源只运行时 `require('react')`；React 由 DSH rc.7 platform module table 提供。
2. `scripts/build.mjs` 把独立 model + panel factory 包进 `window.__ModuleLoader__.load({id,factory})`；输入换行统一成 LF，避免 Windows/Linux hash 漂移。
3. `scripts/verify-build.mjs` 删除 `lib/` 后连续构建两次并比 hash。
4. 证据：`CLEAN REBUILD IDENTICAL 59dbd95c...`；bundle factory VM smoke 通过。

### 批 C · Node 只读桥与列表屏（已做代码，待 DSH）

1. Node 半部 inject `relayPilot/webServer`，注册 exact GET/HEAD `/relay-pilot/snapshot`；POST=405、`cache-control:no-store`、effect disposal 清 route。
2. 浏览器半部占 `sidebar.footer.action`，打开后 fetch snapshot；按 `groupRuns()` 生成 section，列表展示 workflow/status/progress/Attention/current node。
3. 列表屏数据属性钉 `data-relay-group` / `data-run-id`，便于真实浏览器证据和复核。

### 批 D · 详情屏（已做代码，真实中途闸仍 missing）

1. 点击列表 Run 后，只按 `run_id` own-key 读取 Host snapshot 中的详情。
2. 展示运行元数据、Nodes 表与 Attention 列表；Back 返回列表。
3. 用户本轮指令要求两任务一直做到代码开发完成，因此实现已包含详情屏；但**未发生列表屏真实预览与体验分类**，这不代替 DevPlan 的中途人闸，必须在本地补做并按 `progress.md` 的失序记录处理。

### 批 E · 目标机 / 换机需求境证据（用户本地待做）

1. Windows 独立 DSH_HOME：materialize → clean build → test → 安装 Host/Client → 启动 DSH Web。
2. 首次列表渲染即暂停评价，逐条分类 (i) 渲染机制 / (ii) 信息组织 / (iii) 控制面偏好；记录是否继续使用详情屏。
3. 打开详情、刷新浏览器、重启 DSH，核对同 fixture hash 与两屏内容。
4. disable/re-enable/remove Client；确认 route 与 sidebar UI 清理。
5. ThinkPad：复制同一源码，Node 18 执行 `verify-build.mjs` + tests；记录 SHA、退出码和包清单。

### 批 F · 复核与收口（用户本地，非本次授权）

两轮独立换人复核、真实截图/录屏与端到端操作路径、P0/P1 清零、`dh dh-relay` 可复跑后才进入待验收；用户确认后才 verify。本分支不执行复核/收口。
