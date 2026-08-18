<!-- dh:v1 · review.md — 验收与复核入口。🔴 只登记真实证据。 -->
# review — DHR_49 本地需求境、列表中途闸与复核交接

## 代码级证据（已存在）

| 项 | 命令/工件 | 结果 |
|---|---|---|
| Client tests | `node --test test/*.test.mjs` | 10/10 PASS（sandbox Node 22） |
| 清净重建 | `node scripts/verify-build.mjs` | `CLEAN REBUILD IDENTICAL 59dbd95c...` |
| module factory | VM 执行 `lib/client.js`，factory 只 require React，slot 注册成功 | PASS |
| read-only route | GET/HEAD/POST/effect-dispose mock | PASS |
| package | `npm pack --dry-run --json` | prepare 后 11 files，0 bundled dependency |

## Windows 本地 materialize 与代码复跑

```powershell
# 在包含 DHR_26、DHR_49 两个工作区的 checkout 内执行
pwsh -NoProfile -File .\docs\modules\dh-relay\workspace\DHR_26\materialize.ps1 -Force
pwsh -NoProfile -File .\docs\modules\dh-relay\workspace\DHR_49\materialize.ps1 -Force

$root = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot'
$pilot = "$root\relay-control-pilot"
$env:DSH_HOME = "$root\dsh-home"
$env:RELAY_PILOT_FIXTURE_ROOT = "$pilot\testdata\fake"
Set-Location $pilot

node .\src\dsh-client\scripts\verify-build.mjs
node --test .\src\dsh-host\test\*.test.mjs .\src\dsh-client\test\*.test.mjs
```

预期：Client 清净重建 SHA256 为 `59dbd95c583b3ee57c74c69b9eca497147c81687fe3b299bb123a22eb99ff5ae`；Host+Client 共 21 条测试全绿。

## 安装与启动

```powershell
dsh plugin --profile web add .\src\dsh-host
dsh plugin --profile web add .\src\dsh-client
dsh --profile web
```

打开 DSH 打印的 Web URL，在侧栏底部点击 **Relay Pilot**。第一次加载时同时保留：启动终端完整转录、浏览器截图/录屏、`/relay-pilot/snapshot` 响应与 fixture hash。

## 列表屏中途闸（必须在首次真实渲染后暂停）

先只看列表，不急着点详情。用户亲自操作刷新、滚动、打开/关闭，然后逐条填写：

| 观察/评价 | 候选归属 | 用户点选 | 后续 |
|---|---|---|---|
| 表格/卡片渲染、布局、刷新、性能、侧栏机制 | (i) DSH 渲染能力 | 待填 | 命中 §4.4 时按止损优先 |
| 字段缺失、group/排序、命名、信息结构 | (ii) Read Model/P5 输入 | 待填 | 记录给 DHR_30，不污染 DM |
| 机制和字段均可，但更偏好 CLI/键盘流 | (iii) 控制面偏好 | 待填 | 带往 DHR_27，不改 DM 事实 |

一条评价可双属，但必须逐条点选，不能整包由 AI 代裁。详情代码虽已存在，**本表未填前不得把列表中途闸写成通过**。

## 详情、刷新与重启

中途闸记录后：

1. 点击任一 Run，确认详情 header、Nodes、Attention 都对应相同 `run_id`。
2. 点 Back 回列表，确认 group 与顺序不漂。
3. 浏览器硬刷新，记录列表/详情与 fixture hash。
4. 停止 DSH 后重新执行 `dsh --profile web`，再次打开两屏，记录同一 hash。
5. 对照 CLI `relay-pilot list/show --format json`；字段级一致性最终由 DHR_27 正式收口，本卡只留预证。

## 安装 / 禁用 / 启用 / 卸载

```powershell
# 配置树中 Client row 应 disabled
dsh --profile web --patch .\src\dsh-client\disable.patch.yml --dump-config
# 后层恢复
dsh --profile web --patch .\src\dsh-client\disable.patch.yml --patch .\src\dsh-client\enable.patch.yml --dump-config
# 实际禁用/恢复各启动一次，核侧栏按钮与 snapshot route 缺席/恢复
# 最后卸载
dsh plugin --profile web remove @personal/dsh-relay-client
```

卸载后重启 DSH：`Relay Pilot` 按钮与 `/relay-pilot/snapshot` 都应不存在；Host 可单独保留供 DHR_26 复核。记录每条命令、退出码、stdout/stderr 与页面结果。

## ThinkPad 换机重建

```powershell
# Windows：复制纯源码（不要依赖已生成 lib）
scp -r .\src\dsh-client thinkpad:~/dhr49-client
ssh thinkpad 'cd ~/dhr49-client && rm -rf lib && node scripts/verify-build.mjs && node --test test/*.test.mjs && sha256sum lib/client.js'
```

预期：Node 18 可运行；10/10 PASS；SHA256 同为 `59dbd95c...`。失败时如实登记「本机可复现、跨机未成立」，不得记 DM2 pass；按 DevPlan 只降约束、不自动停轨。

## 两轮独立复核（本地待填）

| 轮次 | reviewer/会话 | 范围 | 结论 | P0/P1 |
|---|---|---|---|---|
| review1 | 未开始 | 全量代码、build、DSH 两屏、生命周期、换机证据 | missing | unknown |
| review2 | 未开始 | fresh 对抗：group 伪推导、私有模块、伪截图、刷新/清理 | missing | unknown |

## 当前验收判断

- P4-DM2：**partial**（本机 clean rebuild 通过；ThinkPad missing）。
- P4-DM3：**partial**（两屏代码与 module factory 通过；真实 DSH/刷新/重启 missing）。
- P4-DM4b：**partial**（effect/slot cleanup 代码证；真实生命周期 missing）。
- P4-DM5b：**partial**（模型只接普通 JSON；真实 DSH 边界转录 missing）。
- P4-DM6：**partial-to-strong**（独立 Client 变异测试通过；真实 UI 核对 missing）。
- 列表中途人闸：**missing**。
- 三态：**不得在本卡裁定**。
- 状态：保持「进行中」，不得 verify。
