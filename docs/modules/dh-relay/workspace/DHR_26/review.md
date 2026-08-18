<!-- dh:v1 · review.md — 验收与复核入口。🔴 只登记真实证据。 -->
# review — DHR_26 本地接线与复核交接

## 代码级证据（已存在）

| 项 | 命令/工件 | 结果 |
|---|---|---|
| Host tests | `node --test src/dsh-host/test/*.test.mjs` | 11/11 PASS（sandbox Node 22，仅代码证） |
| 包内容 | `npm pack --dry-run --json` in `src/dsh-host` | 9 files，0 bundled dependency |
| 上游源码零改 | 分支只含 DHR workspace/transport mirror | 待 GitHub compare 复核 |

## 用户本地操作路径（主证据待执行）

```powershell
# 1) 在 dh-relay checkout 中 materialize 到既有 DHR_25 实验根
pwsh -NoProfile -File .\docs\modules\dh-relay\workspace\DHR_26\materialize.ps1 -Force

$root = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot'
$pilot = "$root\relay-control-pilot"
$env:DSH_HOME = "$root\dsh-home"
$env:RELAY_PILOT_FIXTURE_ROOT = "$pilot\testdata\fake"
Set-Location $pilot

# 2) 开工第一步：复验版本与 B-10 预采文件；若漂移，先重采 rc.6 前快照
Test-Path "$root\evidence\dsh-version-baseline\rc6-before-upgrade.txt"
dsh --version

# 3) 按本机原安装渠道升级到锁定的 0.1.0-rc.7；随后采集 dsh/version/内置包/目录快照并对差
#    升级命令取决于你原来的安装渠道，不在本分支猜测并替你执行。

# 4) 代码与包级复跑
node --test .\src\dsh-host\test\*.test.mjs

# 5) Profile 安装会自动激活 bundle；probe 只作为临时 overlay
#    保存完整 stdout/stderr 与退出码
dsh plugin --profile web add .\src\dsh-host
dsh --profile web --patch .\src\dsh-host\probe.patch.yml

# 6) 生命周期：分别保存 dump/启动日志
# disabled：relayPilot 应缺席
dsh --profile web --patch .\src\dsh-host\disable.patch.yml --dump-config
# re-enabled：同一 row 恢复
dsh --profile web --patch .\src\dsh-host\disable.patch.yml --patch .\src\dsh-host\enable.patch.yml --dump-config
# uninstall
dsh plugin --profile web remove @personal/dsh-relay-host
```

### 必须保存的目标机证据

- rc.6 预采复验或作废重采说明；rc.7 后快照；差异摘要。
- `[relay-pilot-probe]` 一整行，且其中同时有 list 与全部关联 detail。
- 安装、disabled、re-enabled、remove 各自命令、退出码、stdout/stderr；卸载后配置/服务行缺席。
- 日常 DSH_HOME 零改动的路径对证。

## 两轮独立复核（本地待填）

| 轮次 | reviewer/会话 | 范围 | 结论 | P0/P1 |
|---|---|---|---|---|
| review1 | 未开始 | 全量代码、边界、目标机证据 | missing | unknown |
| review2 | 未开始 | fresh 对抗，专查伪证据/私有类型/生命周期 | missing | unknown |

## 当前验收判断

- P4-DM1：**partial**（代码/配置成立；Windows rc.7 进程加载缺证）。
- P4-DM4a：**partial**（显式配置与无额外注册成立；真实装卸/清理缺证）。
- P4-DM5a：**partial**（代码证成立；目标进程返回值转录缺证）。
- 版本基线：**missing**。
- 三态：**不得在本卡裁定**。
- 状态：保持「进行中」，不得 verify。
