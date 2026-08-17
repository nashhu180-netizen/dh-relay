# dh-relay

**接力执行范式的 Runner**——没有常驻 AI 主控，Runner 按状态把任务一棒一棒交给一串终端里的 worker。

一个 run 里，Runner 是运行状态的**唯一写者**：它按接力计划（RelayPlan）拉起 worker、收 checkpoint 与 result、判交棒还是挂起、必要时触发重编排。worker 只管干自己那一棒，不需要知道全局；主控不需要一直在线盯着。

relay 是给**任意业务仓**用的通用工具——它操作的一直是别人的仓，代码住在哪与能否干活本就解耦。

## 现在能跑到什么程度

| 阶段 | 状态 |
|---|---|
| **P1 最小接力 PoC** | ✅ 已交付（`DHR_01`~`DHR_03` 销户）。契约层、Runner、确定性 fake 回放、真实 psmux 宿主、dogfood 两场演练（阻塞→重编排、决策挂起）全部跑通 |
| **P2 完整流水** | 🟡 19 张卡做完 1 张（`DHR_04` 前置隔离与落点守卫已收口）。目标是一批真实标准档任务卡从授权到 verify 销户全自动接力 |
| **P3 可配置终端后端 / Herdr 底座** | 📋 已拆计划，未开工 |

真实业务试点：`IHSR_05` 已在 infohub 仓走六棒跑通并销户。

**三条结构性议题待用户定序**，都在 [docs/modules/dh-relay/backlog.md](docs/modules/dh-relay/backlog.md)：拆独立仓（`DHR-BL-5`，本仓即其产物）、换实现语言（`DHR-BL-7`，用户已明确「在 Linux 肯定不会用 PowerShell」）、流水步骤可扩展性（`DHR-BL-8`）。

## 仓库结构

```
docs/modules/dh-relay/   dev-harness 模块工件（与拆分前同路径）
├─ design/               产品设计与验收（P1/P2/P3）+ evidence/ 交叉审核记录
├─ dev_plan/             三份开发方案 = 任务表与状态权威
├─ workspace/DHR_*/      逐卡工作区（brief / progress / findings / review / 证据）
├─ as-built/             现役实现快照（contracts / runner / psmux-host / policy）
├─ knowledge/            教训库候选
└─ backlog.md            需求池（未排期的增强、bug、议题）

tools/                生产代码（拆仓时由 tools/relay/ 提级一层）
├─ contracts/         relay/v1 契约：schema、身份链、状态机、脱敏
├─ runner/            Runner 本体、状态存储、确定性回放
├─ host/              宿主循环、worker 入口、agent 工具、dogfood 包装
├─ adapters/          终端后端适配器（psmux 现役 / fake 测试用）+ preflight
├─ policy/            隔离、内容、落点三类守卫
├─ dogfood/           两场演练夹具
└─ tests/             测试套件，入口 run-relay-tests.ps1
```

## 跑测试

```powershell
pwsh tools/tests/run-relay-tests.ps1
```

期望终态 `RELAY ALL PASS (SKIPPED: 1)`——跳过的是需要真实终端的 `relay-psmux-real`，要跑它设 `RELAY_REAL_TERMINAL=1`。

> ⚠️ 在 relay attempt 进程里跑全量回归**必然假红**（`RELAY_RUN_ROOT` 被继承导致一个用例失败）。已知坑，见 backlog `DHR-BL-4`；绕过办法是**新开子进程**清 `RELAY_*` 再跑，**不要**在自己的 shell 里清（会摧毁本棒的 relay 身份）。

## 跑 dogfood 演练

```powershell
pwsh tools/host/run-dogfood.ps1 -Scenario blocked  -ScreenshotOnLaunch -ScreenshotOnStop
pwsh tools/host/run-dogfood.ps1 -Scenario decision -ScreenshotOnLaunch -ScreenshotOnStop
```

需要 `psmux` 在 PATH 里。`decision` 场景要你在弹出的 `RELAY:relay-<run>-S-000N` 窗口里回答一次——脚本不代答、不往终端注入按键。

## 给 coding agent

进本仓先读 [AGENTS.md](AGENTS.md)（唯一权威入口）。被派进来干一棒的 worker，重点看它的「编排协议段」。

## 历史

2026-08-17 从 `dh-crew` 仓用 `git filter-repo` 拆出，保留全部 31 笔提交历史。文档 `docs/modules/dh-relay/` **保持原路径**（`dh` 工具链按这一层解析模块）；代码 `tools/relay/` **提级为 `tools/`**（独立仓里只有 relay 一份代码）。拆分的可行性核查、执行记录与踩到的坑见 [docs/modules/dh-relay/backlog.md](docs/modules/dh-relay/backlog.md) `DHR-BL-5`。

`docs/modules/dh-relay/workspace/DHR_*/` 与 `docs/modules/dh-relay/design/evidence/` 是**历史留痕**，拆仓时未做路径改写。里面的 doc 路径继续有效；只有 `tools/relay/` 是 dh-crew 时期的旧地址，本仓对应 `tools/`。
