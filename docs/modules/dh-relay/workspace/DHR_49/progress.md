<!-- progress.md — 施工日志 + 证据账本。🟢 边做边记。这是"实际发生了啥"，容忍跑偏——路径偏了记这里，不回写任何计划文档。项目有 journal 时本文件代替 journal（不双写）。 -->
# progress — DHR_49

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-20 | 主会话(Opus) | 开工闸：用户对话确认三项——确认开工 / 不开 worktree / 委托**全留主会话**（两轮换人复核仍派 fresh agent）；工作区 8 件套建立 | AskUserQuestion 三项点选 | S2 现场侦察 |
| 2026-08-20 | 主会话(Opus) | S2 现场侦察（只读，未上机）：摸清 client bundle 产物形态、UI 注册面、Client→Host 数据通路、两侧 codec 严格度差异、装法约束、包形状、命名避让，落 `findings.md` F-A~F-G + §4.4 止损**预判**表 | findings.md「现场侦察结论」 | 写 task_plan 施工步骤 |
| 2026-08-20 | 主会话(Opus) | 施工步骤落 `task_plan.md`：分 4 批（探针 → 列表屏 → 配方 → 详情屏），CP2 = 列表屏中途闸强制暂停 | task_plan.md | 回填 DevPlan，进批 1 |
| 2026-08-20 | 主会话(Opus) | 回填 DevPlan §3.1：DHR_49 行状态→进行中 + 工作区链接；**顺手补 F-001 账目缺口**——DHR_26 行由「未开始」改「已完成」并回填 verify SHA `c90cf88`（DHR_26 已收口但 §3.1 未回填，成因见 workspace/DHR_26/devplan-handoff.md）。**未碰头部 `dh:status` 块**（DHR_27 会话并行占用，F-002） | E-001 | 批 1 施工 |
| 2026-08-20 | 主会话(Opus) | 批 1 TDD：先写 4 条包契约失败测试（exports 四口 / client.js 零 zod / platform=web / files 覆盖运行时清单）→ 跑红（包不存在） | E-002 | 写实现 |
| 2026-08-20 | 主会话(Opus) | 批 1 实现：新包 `@personal/dsh-relay-panel`（`src/dsh-client/`）——宿主半边 `lib/index.mjs`（`RelayPanelGateway extends TypertRemoteService`，namespace `relayPanel`，`inject:['relayPilot']`，只转发不算数）+ 手写描述符 `lib/typert.host.js`（真 zod）/ `lib/typert.remote-client.js`（结构化 `{parse}`，零 zod）+ **手写** bundle `lib/client.js`（`window.__ModuleLoader__.load`，`React.createElement`，无打包器）。**`src/dsh-host/` 一行未改** | E-003 | 跑绿 + 变异 |
| 2026-08-20 | 主会话(Opus) | 批 1 验证：包契约 4/4 绿；新增防漂移测试 3/3 绿（bundle 内联描述符 vs `./remote` 逐项相同、两侧 schema 判决一致、注册 id/导出面）；**7 条变异逐条见红 + 正控全绿**（承接 DHR_26 §17 教训：断言写完必须跑变异）；全量回归 167/167 绿 | E-004 / E-005 / E-006 | 真机装载 |
| 2026-08-20 | 主会话(Opus) | 批 1 真机：`npm pack`（5.4 kB/6 文件）→ `dsh plugin --profile web add <tgz>`（694ms，EXIT 0）→ `dsh --profile web` → 浏览器 `http://127.0.0.1:3080`。**装载产物与源文件 SHA256 逐字节相同**（零构建步骤坐实）。踩两个坑并修：①`remote.relayPanel` 须走 `ctx.inject(names, cb)` 开作用域（顶层 inject 会死锁）；②Remote 返回信封 `{ok,value}` 不是裸值、失败不 reject（第一版静默拿 undefined、控制台无报错） | E-007 / E-008 | 判据对拍 |
| 2026-08-20 | 主会话(Opus) | 批 1 判据命中：面板在设置页渲染出 `fixture_hash: 67fb18b3…612c`，与 DHR_26 四轮转录**逐字符相同**；浏览器刷新、DSH 重启（本轮 3 次）后重建一致；控制台零 error/warn | E-009 | CP1 阶段汇报 + 小审 |
| 2026-08-20 | 主会话(Opus) | CP1 阶段汇报交付；用户点选「每批派 fresh 小审」。派出 CP1 只读复核 agent（brief=review-brief-cp1.md） | E-010 | 批 2 施工 |
| 2026-08-20 | 主会话(Opus) | 批 2 TDD：先写 7 条分组测试（分节顺序 / 镜像断言①②③ / 词表与 CLI 一致 / 空列表 / 源码级不读 run_status）→ 跑红 7/7 | E-011 | 实现 groupRuns |
| 2026-08-20 | 主会话(Opus) | 批 2 实现：`groupRuns()` 只读 `group`（分节 = 首现顺序，成员 = `runs[]` 顺序，词表外原样成节）+ Host 加 `list()` 只读转发 + 两侧描述符加 `relayPanel/list`（宿主真 zod 且**刻意宽松**——权威 schema 在 `src/read-model/`，此处重述会造第二真相源）+ 列表屏 UI（`React.createElement`，官方同款 `<style data-plugin-css>` 注入） | E-011 / E-013 | 跑绿 + 变异 + 真机 |
| 2026-08-20 | 主会话(Opus) | 批 2 验证：分组测试 7/7 绿（其中一条**是我的期望写反了、实现是对的**，已改断言）；6 条分组变异逐条见红 + 正控全绿；全量 174/174 绿 | E-011 / E-012 / E-013 | 真机镜像断言 |
| 2026-08-20 | 主会话(Opus) | 批 2 **真机 DM6 双向对照**（不是单测）：造两份变异 fixture，只换 `RELAY_PILOT_FIXTURE_ROOT` 重启 DSH、代码不动——①只改 `group`：run 换节、状态芯片仍显旧状态、`running` 整节消失；②只改 `run_status`：分节骨架与基线逐项相同、仅芯片改字 | E-014 / E-015 | 交中途闸 |
| 2026-08-20 | 主会话(Opus) | **落点被用户连否两版**（U-01 设置页 / U-03 全屏浮层，见 findings「批 2：面板落点的三版与用户原话」）。第二版改为 `sidebar.footer.action` 入口 + `shell.overlay` 浮层并实测通过（刷新后重建一致），仍被判「等于在对话框上盖一层」。按用户指示派出只读调研 agent 摸官方 39 个一方 client 包的界面做法，**中途闸暂缓交付**——落点未定时交出去等于让用户跑一个自己已经否掉的东西 | E-016 | 等调研结论定 v3 落点 |

## 证据账本 (Evidence Ledger)

<每条"完成"结论挂一条可复跑的命令 / grep / runtime 输出。不能空口说"做完了"。>

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | cmd | `git diff -- "docs/modules/dh-relay/dev_plan/P4-DSH工作台最小Pilot-开发方案.md"` | observed | DevPlan §3.1 两行已回填，`dh:status` 块未被本卡触碰（与 DHR_27 会话并行 WIP 零重叠） |
| E-002 | test | `node --test test/dsh-client-package-contract.test.mjs`（实现前） | observed（4/4 红，ENOENT: 包不存在） | TDD 跑红：包契约先于实现钉住 |
| E-003 | cmd | `<pilot>/evidence/dhr49/recon/`（`dsh-version.txt` / `slot-names.txt` 28 项 / `client-plugin-inventory.txt` 39 包） | observed | 侦察机器事实落盘；`settings.section` = 「一整页」槽位（官方 slots 契约 d.ts 原文），选它做面板落点 |
| E-004 | test | `node --test test/dsh-client-package-contract.test.mjs`（实现后） | pass（4/4） | 包形状满足 exports 四口 / 零 zod / platform=web / files 覆盖 |
| E-005 | test | `node --test test/dsh-client-typert-drift.test.mjs` | pass（3/3） | bundle 内联描述符与 `./remote` 无漂移；两侧 schema 判决一致 |
| E-006 | cmd | `node scripts/mutate-dsh-client-contract.mjs` | pass（`RESULT: ALL 7 MUTATIONS CAUGHT` + 正控全绿） | 断言确实在咬（DHR_26 §17 教训的强制动作） |
| E-007 | test | `node --test`（relay-control-pilot 全量） | pass（167/167，fail 0） | 批 1 无回归 |
| E-008 | cmd | `Get-FileHash` 对比 profile 安装产物 vs 源文件 `lib/client.js` | pass（`MATCH: True`，`67B8510F…62BC`） | **零构建步骤**：安装的就是手写源文件本身，§4.4「只能在 monorepo checkout 内构建」不命中 |
| E-009 | cmd | `<pilot>/evidence/dhr49/batch1/probe-transcript.md` + `panel-settings-relay.png` | pass（`host-value` = `67fb18b3…612c`，与 DHR_26 四轮转录逐字符相同；刷新/重启后一致；控制台零 error） | 树外 client bundle 可加载 ∧ `ctx.remote.$mount` 自挂手写描述符成立 ∧ 数据真从 Host 穿到浏览器 |
| E-010 | review-dispatch | Agent tool | observed | 复核派出：fresh-subagent-cp1（general-purpose, 零上下文）｜CP1 批1小审：树外Client Bundle可行性探针（src/dsh-client + 3份测试 + 变异脚本 + evidence/dhr49）只读复核；brief=workspace/DHR_49/review-brief-cp1.md |
| E-011 | test | `node --test test/dsh-client-grouping.test.mjs`（实现前 / 后） | observed 7/7 红 → pass 7/7 绿 | TDD：P4-DM6 的三条镜像断言先于实现钉住 |
| E-012 | cmd | `node scripts/mutate-dsh-client-grouping.mjs` | pass（`RESULT: ALL 6 MUTATIONS CAUGHT` + 正控全绿） | 镜像断言确实在咬：6 种「偷看 run_status / 自定优先级 / 兜底节 / 改词表」变体逐条见红 |
| E-013 | test | `node --test`（relay-control-pilot 全量） | pass（174/174，fail 0） | 批 2 无回归 |
| E-014 | cmd | `<pilot>/evidence/dhr49/batch2/dm6-mirror-assertions.md` + `mutant-fixtures/` | pass（双向成立） | **P4-DM6 真机双向对照**：①只改 `group` → run 换节且状态芯片仍显旧状态、`running` 节整节消失；②只改 `run_status` → 分节骨架与基线逐项相同、仅芯片改字 |
| E-015 | cmd | `<pilot>/evidence/dhr49/batch2/list-screen-baseline.png` | pass | 列表屏首次渲染：5 条 run 分 4 节，节序 = 源头 `runs[]` 首现顺序，标题词表与 CLI 一致 |
| E-016 | cmd | `<pilot>/evidence/dhr49/batch2/list-screen-overlay.png` + a11y 树转录 | pass | **落点改版后**：侧栏底部 `Relay` 入口按钮 → `shell.overlay` 全屏浮层；刷新后重建一致（4 节 / 5 条 / fixture 67fb18b3 全同） |
| E-017 | review | CP1 复核结论（`cp1-review` fresh subagent，只读，零上下文） | observed（changes-requested：2 P1 / 7 P2 / 6 P3；批 1 六条声称逐条复跑对拍**全部属实**） | 轮 1 批次小审已做；发现与处置逐条见 `review.md`「CP1 发现与处置」 |
| E-018 | cmd | `<pilot>/evidence/dhr49/batch1/src-snapshot/`（10 文件 + `SHA256SUMS.txt`）、`batch1/dsh-host-baseline.txt`（23 文件） | pass（`client.js` = `67b8510f…62bc`，与 E-008 记录的安装哈希逐字符相同） | **P1-1 已修**：批 1 源码快照抢救并永久落档；`src/dsh-host/` 内容基线补上（此前只有 mtime 佐证） |
| E-019 | test | `node --test test/dsh-client-host.test.mjs` | pass（6/6，非跳过） | **P1-2 已修**：宿主半边从零覆盖到 6 条断言，**用真库不用 stub**——`markRemote()` 的手工装饰器施加、两侧描述符集合、`_zod` 品牌硬查、两侧 schema 判决一致、`list()`/`hash()` 原样转发、注入声明 |
| E-020 | test | `node --test test/dsh-client-typert-drift.test.mjs test/dsh-client-package-contract.test.mjs` | pass | P2-1/2-3/2-4 与 P3-2/3-3 已修：描述符按 id 全量配对（新加不加用例就红）、`dsh.bundle.patch` 与 `files` 双向核对、require 改白名单、注释路径与 README 补齐 |
| E-021 | cmd | `node scripts/mutate-dsh-client-contract.mjs` | pass（`RESULT: ALL 15 MUTATIONS CAUGHT` + 两份正控全绿） | P2-2/P3-1 已修：变异由 7 条扩到 15 条并覆盖防漂移测试；每条变异 apply 后核对 sha256 确实变了，锚点漂了报「变异未生效」而非「没咬」。**扩容期间正控当场逮到我自己写的一个 realm bug**（vm 数组 prototype 导致 deepEqual 误报），已修 |
| E-022 | test | `npm test`（`scripts.test` 已由四份旧测试改为 `node --test`） | pass（185/185，fail 0，skipped 0） | P2-7 已修：复跑者按 `npm test` 拿到的不再是 partial 绿；全量含本卡 19 条新断言 |

## 硬依赖核验（开工前置）

| 前置 | 出处 | 核验结果 |
|---|---|---|
| DHR_26「侦察落档」已交付（缺则 DHR_49 不得开工） | DevPlan DHR_26 验收口径「机器证 · 侦察落档」 | **满足**——`workspace/DHR_26/findings.md` §5（`dsh.client` 声明形态）、§6（`exports['./client']` 产物形态）、§13（本机类型定义位置，4 份 `.d.ts` 逐项列出）、§14（官方 client 插件声明实例，本机 39 个包）、§2/§3（profile 扫描锚点与 `--patch` 边界）、「交给 DHR_49 的硬输入」节均已落盘 |
| DHR_26 已收口 | `git log --grep="^verify"` | **满足**——`c90cf88 verify(dh-relay): DHR_26 树外 DSH Host Plugin 与 rc.7 现场侦察 user-signed` |
| DSH 版本未漂 | `dsh --version` | **满足**——`0.1.0-rc.7`，与 DHR_26 版本基线一致 |
