# DHR_26 evidence boundary

本目录分**六批**，环境与结论各不相同，**不要混着读**；后面的批次会推翻前面的结论，读之前先看这张表。

| 批 | 目录 | 环境 | 现在还成立吗 |
|---|---|---|---|
| 一 | 根目录几个文件 | Linux / Node 22 sandbox（非目标机） | ❌ 已过时，仅留痕 |
| 二 | `smoke-rc6/` | Windows · dsh **rc.6** · 临时 Home · `smoke` profile | ✅ 成立（版本已非锁定版） |
| 三 | `smoke-rc7/` | Windows · dsh **rc.7** · 全新临时 Home · `smoke` profile | ✅ 成立 |
| 四 | `target-web/` | Windows · rc.7 · **目标 Home** · `web` profile | ⚠️ **部分被批五推翻**：其「必须装 tgz」的结论已不成立 |
| 五 | `zero-import/` | 同上，去掉最后一个外部依赖之后 | ✅ 成立，**当前口径以本批为准** |
| 六 | `round2-lifecycle/` | 同上，第二轮复核后补证 | ✅ 成立，DM4a 的卸载证据在这里 |

## 批一 · 代码级（根目录几个文件）

来自最初的 Linux / Node 22 sandbox，不是 Windows 目标机证据。`host-tests.txt` 记的是旧版 `11/11`——那一版**只跑自造 fixture**，接上真 fixture 即失败，已被批二取代，保留仅作留痕。`pack-dry-run.json` 记的是 `0.0.0-pilot.1` 的包内容（现为 pilot.2）。

## 批二 · `smoke-rc6/` · 真机冒烟（2026-08-18 晚）

Windows / Node v24 / `dsh 0.1.0-rc.6`，临时 `DSH_HOME` 的 `smoke` profile，读真 DHR_25 冻结 fixture。详见 `smoke-rc6/README.md`。

已复跑：28/28 单测（含真 fixture 用例）；DSH 真实启动 probe 退出码 0、转录与 fixture 逐字段 `IDENTICAL`；disable/enable 双向与正控；rc.6 基线包快照（**这份就是本卡实采的升级前快照**，与 B-10 预采件逐包一致，见 findings §「未验证事实」）。

## 批三 · `smoke-rc7/` · 目标版本真机（2026-08-18 晚，升级后）

按原渠道 `npm install -g @deepseek-ai/dsh@0.1.0-rc.7` 升级后，在**全新** `DSH_HOME` 上用 `dsh plugin add` 正规重建 profile 复跑全套。详见 `smoke-rc7/README.md`。

已复跑：rc.6→rc.7 包对差（195→195、无增删、186 个自家包同步升版）；install → probe → disable → enable → remove → 重新 add 全套；**rc.6 与 rc.7 的 probe 转录逐字节完全一致**。

## 批四 · `target-web/` · 目标机接线（2026-08-18 晚）

DevPlan 指定的独立 `DSH_HOME`（`dh-relay-p4-pilot\dsh-home`）+ **`web`** profile + `materialize.ps1` 铺到权威落点后接线。详见 `target-web/README.md`。

**当时查出的问题**：`dsh plugin add .\src\dsh-host`（目录安装）装不起来——`link:` 软链让 Node 从源码树真实路径解析 bare import，够不到 profile 的 cordis fallback 农场（`link-install-failure.txt` 是原始 stderr，仍是有效的根因证据）。当时的处置是改用 `npm pack` 出来的 tgz。

> 🔴 **本批的「目标机必须装 tgz」这条结论已被批五推翻，不要照它操作。** 根因（插件依赖外部包解析）已经修掉，现在两种装法都能跑。批四的其余结论（probe `IDENTICAL`、disable/enable、`--dump-config` 502→490 行）仍然成立。

## 批五 · `zero-import/` · 去依赖改造后复验（2026-08-18 晚）

`index.mjs` 去掉最后一个外部依赖（`import { Service } from '@deepseek-ai/cordis'` → `apply(ctx, config)` + `ctx.provide('relayPilot', api)`），运行时文件零 bare import。详见 `zero-import/README.md`。

结论：**改造前必然失败的目录安装现在退出码 0**，且与 tgz 装法的 probe 转录**逐字节相同**；40/40 单测（materialize 后零环境变量）；`fixture_hash` 仍为 `67fb18b3…`，与批二/三/四完全一致。

## 批六 · `round2-lifecycle/` · 第二轮复核后的补证（2026-08-20）

第二轮换人复核（codex / gpt-5.6-sol，只读）指出两条 P1，本批是对这两条的机器答复。详见 `round2-lifecycle/README.md`。

- **卸载清理**：新包 `@personal/dsh-relay-absence-probe` 装在 Host **包外**，于是 remove 之后探针还活着——装着 `present:true` 退 1（正控）→ remove 后 `present:false` 退 0（真 removed 证据）→ 装回 `present:true` 退 1。外加 `service-lifecycle-probe.mjs` 在真 Cordis 上跑「注册 → 读到活服务 → dispose → 服务消失」，结论 `CLEANED`。
- **转录校验器**：`verify-transcript.mjs` 改为由调用方给期望清单，并重算 hash；三条变异（掏空 details / 改 hash / 篡改 detail）全部判 `DIFF`，真转录仍 `IDENTICAL`。

## 复跑注意

跑任何 probe 都必须同时带 `DSH_HOME` 与 `RELAY_PILOT_FIXTURE_ROOT`——`fixtureRoot` 是 boot 时才从环境变量解析的，漏了会 fail-closed 报 `fixture-read-failed` 并让插件树加载失败（findings §20）。

## 仍缺失

verify 收口与用户签收。（两轮独立换人复核已完成：轮 1 = claude-grok / grok-4.5，轮 2 = codex-ninth / gpt-5.6-sol，见 `review.md`。）
