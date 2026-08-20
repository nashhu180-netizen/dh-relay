# target-web — 目标机接线证据（2026-08-18 晚）
> ⚠️ **本批的「必须装 tgz」结论已被 `zero-import/` 批推翻，不要照它操作。**
> 根因（插件依赖外部包解析）已从源头修掉，现在目录安装与 tgz 安装都能跑。
> 本批仍然有效的部分：`link-install-failure.txt` 的原始报错与根因分析、以及 probe / disable / enable / `--dump-config` 的其余结论。
> 另：本批 `absence-*` 只证明「禁用后未注册」，不证明「注册后卸载会清理」——后者见 `round2-lifecycle/`。


环境：Windows 11 · Node v24.12.0 · `dsh 0.1.0-rc.7`
`DSH_HOME`：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\dsh-home`（DevPlan 指定的独立 Home，**不是**临时目录）
Profile：**`web`**（完整 DSH web app 树：`dsh-base` + `dsh-web-app` + 本插件）
插件落点：`materialize.ps1` 铺到 `D:\...\relay-control-pilot\src\dsh-host`（权威落点，仓外）
Fixture：同目录树下的 `testdata/fake`（DHR_25 冻结件）

## 🔴 当时的首要发现：目录安装装不起来（**结论已被 `zero-import/` 推翻，见顶部提示**）

`task_plan` 批 D 与插件 README 原来写的是 `dsh plugin --profile web add .\src\dsh-host`。**实测硬失败**，稳定复现两次：

```
Error: dsh: plugin tree failed to load: failed to apply loader entry include (cordis:include):
  failed to import loader entry relay-pilot-host (@personal/dsh-relay-host):
  Cannot find package '@deepseek-ai/cordis' imported from
  D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-host\index.mjs
```

原始 stderr 见 `link-install-failure.txt`。机制：

1. 目录安装在 profile `package.json` 里记的是 `link:D:/.../src/dsh-host`，`profiles/web/node_modules/@personal/dsh-relay-host` 是一条指向源码树的**软链**。
2. fallback 农场 `profiles/node_modules/@deepseek-ai/cordis` **是存在的**（软链到全局 dsh 安装）。
3. 但 Node 的 ESM 解析按模块的**真实路径**向上找 `node_modules`：从 `D:\...\src\dsh-host` 往上是 `src` → `relay-control-pilot` → `dh-relay-p4-pilot` → `ai-workflow` → `D:\`，**这条路径上一个 `node_modules` 都没有**，更到不了 `profiles/node_modules/`。

**当时的结论**：本插件「不声明 Cordis 依赖、靠 profile module fallback 解析」的设计，只在包被**物理装进 profile 树**时成立，所以目标机流程改成了 `npm pack` → `dsh plugin add <tgz>`。

> **后续（`zero-import/` 批）**：这条约束已经不存在了——插件改为零 bare import 后不再需要解析任何外部包，目录安装与 tgz 安装的转录逐字节相同。上面这段保留为根因记录，**不是当前操作指引**。

## 换成 tgz 后的全套结果

| 文件 | 步骤 | 结论 |
|---|---|---|
| `probe-transcript.txt` | boot probe | 退出码 **0**、**5.6 秒**、stderr 全空、单行转录 |
| `transcript-report.json` | 转录校验 | `RESULT: IDENTICAL`；`fixture_hash` = `67fb18b3…`，与 smoke-rc6 / smoke-rc7 **三轮完全一致** |
| `absence-disabled.txt` | `disabled: true` | `present:false` 退出 0 |
| `absence-enabled.txt` | `disabled: false` | `present:true` 退出 1（正控） |
| `dump-installed.txt` | 组合树 | **502 行**，`relay-pilot-host` 在第 492 行，携带显式 `listFixture`/`detailFixtures` |
| `dump-after-remove.txt` | `plugin remove` | **490 行，0 行 relay** |

另：materialize 之后，`node --test src/dsh-host/test/*.test.mjs` **不设任何环境变量**即 28/28 通过——相对路径 `../../../testdata/fake` 解析正确。

## 链接农场耗时（`link-install-timing.txt`）

`web` profile 首次 boot 建软链农场耗时 **5 分 35 秒**（22:38:23 → 22:43:58），远超只装 `dsh-base` 的 profile（约 52 秒）。中途我用 300 秒超时打断过一次，如期留下损坏空目录 `@aws-crypto/supports-web-crypto`，下次启动即硬失败——**该陷阱已实测复现**。恢复方式：整个删掉 `profiles/node_modules/` 重建，`profiles/web/` 与已装插件不受影响。

## 收尾状态

跑完后已把 `web` profile 恢复为 tgz 安装并复验（退出码 0 / stderr 空），pilot 环境处于可用状态。

## 这批证据**不**覆盖什么

verify 收口与用户签收（两轮换人复核已于 2026-08-20 完成，见 `review.md`）。
