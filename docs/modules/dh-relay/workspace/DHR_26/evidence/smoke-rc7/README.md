# smoke-rc7 — 目标版本真机证据（2026-08-18 晚）

环境：Windows 11 · Node v24.12.0 · `dsh 0.1.0-rc.7`（DevPlan 锁定版本）
升级渠道：**npm 全局**（`npm root -g` = `C:\Users\nash\AppData\Roaming\npm\node_modules`，registry 为默认 `registry.npmjs.org`，rc.7 即 `dist-tags.latest`）
Profile：**全新** `DSH_HOME` 下的 `smoke` profile（用 `dsh plugin --profile smoke add` 正规建的，不是手工拼的）
Fixture：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\testdata\fake`（DHR_25 冻结件，仓外）

## 升级与版本差异

```bash
npm install -g @deepseek-ai/dsh@0.1.0-rc.7      # changed 530 packages in 3m
dsh --version                                   # 0.1.0-rc.7
```

`dsh-upgrade-rc6-to-rc7-diff.json`：**195 → 195 包，added=0，removed=0，changed=186，install_root 未变**。186 个变更全部是 `@deepseek-ai/*` 自家包从 `0.1.0-rc.6` 同步升到 `0.1.0-rc.7`，没有第三方依赖增删或跨大版本跳变。未解析依赖数 rc.6/rc.7 均为 2，无变化。

## 生命周期四步 + 版本无关性

| 文件 | 步骤 | 结论 |
|---|---|---|
| `probe-transcript.txt` | install → boot probe | 退出码 **0**，stderr 全空，单行转录；`appExit` 生效，首次 boot 仅 9.8 秒 |
| `transcript-report.json` | 转录校验 | `RESULT: IDENTICAL` —— list 与 5 份 detail 逐字段与磁盘一致；`0006`/`0007` 按降级契约返回 null |
| `absence-disabled.txt` | `disabled: true` | `present:false`，退出 0 —— **禁用后服务未注册**（`disabled: true` 时 `apply()` 根本没跑，所以这条不等于「注册后卸载会清理」；那条证据在 `round2-lifecycle/`） |
| `absence-enabled.txt` | `disabled: false` | `present:true`，退出 1 —— **正控**，证明上一条不是恒假 |
| `dump-after-remove.txt` | `dsh plugin remove` | 组合树 313 行，**0 行 relay-pilot**；profile `package.json` 的 `dsh.profile.bundles` 也被摘掉 |
| `dump-installed.txt` | 重新 `add` | 组合树 325 行，`relay-pilot-host` 行带显式 `listFixture`/`detailFixtures` 配置回归 |

**rc.6 与 rc.7 的 probe 转录逐字节完全一致**（`diff` 无差异，`fixture_hash` 同为 `67fb18b3…`）。说明本插件不依赖 rc.6→rc.7 之间任何变动的行为。

## 一个设计限制（诚实记录）

`absence-probe.mjs` 打包在插件**内部**，所以插件被 `remove` 之后它自己也不存在了，直接用会报 `Cannot find package '@personal/dsh-relay-host'`。**它只能验 disabled 状态，验不了 removed 状态**。removed 的证据因此走 `--dump-config` 前后对比（也正是 task_plan 批 D 第 4 步写的方法）。

## 这批证据**不**覆盖什么

- 目标机正式 profile 名是 `web`，本轮跑在临时 `DSH_HOME` 的 `smoke` profile 上；两者只差 profile 名与 Home 位置，但仍不等同于目标机接线。
- verify 收口与用户签收（两轮换人复核已于 2026-08-20 完成，见 `review.md`）。
