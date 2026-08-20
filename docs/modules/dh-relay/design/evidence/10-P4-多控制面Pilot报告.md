# P4 多控制面 Pilot 报告

> **主报告**（CLI 部分，DHR_27 交付，2026-08-20）——覆盖 P4-CM 结论、截至本卡的 DM 事实登记、CM4 与三态收敛的延后登记、v1 协议缺口、H1/H4 人判材料。
> **附录**（对证 + 三态，DHR_50 交付）——见文末「附录」节位，本报告落盘后由 DHR_50 追加，不回改本报告正文（留痕原则）。
> 计划出处：[P4 开发方案](../../dev_plan/P4-DSH工作台最小Pilot-开发方案.md) §3.2 DHR_27、§4.1、§4.5。

## 1. 结论摘要（P4-CM 必备控制面机器闸）

| ID | 命题 | 结论 | 证据 |
|----|------|------|------|
| P4-CM1 | 同一 fake Read Model 可由 Windows CLI 渲染文本和 JSON | **通过**（DHR_25） | [workspace/DHR_25/task.md](../../workspace/DHR_25/task.md) C1a/C1b 行；`<experiment-root>/evidence/windows/` |
| P4-CM2 | 同一 fake fixture 可在 Linux SSH 终端读取，JSON 语义一致 | **通过**（DHR_25，两侧 canonical sha256 全等，比"语义一致"更强） | task.md C2 行；`compare-reports.mjs → RESULT: IDENTICAL`（终版 90/90 双侧） |
| P4-CM3 | 冻结 v1 fixture 与活 v1 现场只读投影成功，源文件零写入 | **通过**（本卡，证据见 §2） | DHR_27 progress E-002/E-005/E-012/E-013 |
| P4-CM4 | CLI 与 DSH 对同一 Read Model 字段级一致 | **延后（DHR_50）**——按 B-11 三分规则登记，不计入"CM 全绿"判定、不阻塞 §4.5 解锁 | 承接卡 DHR_50；见 §3 |
| P4-CM5 | DSH 完全不启动时，P4 必备控制面轨仍可完成 | **通过**（DHR_25；本卡 CLI 侧施工与演示同样全程未启动 DSH） | task.md C2/CM5 行（进程扫描为空） |
| P4-CM6a | 截至 CLI 收口，CLI 主线全程不引入 Relay 运行写权、不 fork DSH（审计范围=`src/cli/`、`src/read-model/`、`src/render/`、`testdata/`） | **通过**（本卡） | `<experiment-root>/evidence/v1/cm6a-audit.txt`：范围内零写 API、唯一 fs 面 = `load.mjs` 的 `readFileSync`、零 DSH 依赖 |

**§4.5 解锁 P5 的机器侧条件（CM1/2/3/5/6a 全通过 ∧ CM4 已如实延后登记 ∧ 主报告落盘）至此满足；剩余条件 = 用户对 H1/H4 表态并明确同意进入 P5。**

## 2. CM3 证据（本卡新增）

### 2.1 冻结 v1 fixture（白名单过滤 + manifest 对证）

- 冻结对象：真实历史 run `RELAY-IHSR05-RW-20260816113004`（fix → review3 → review4 三节点接力，2026-08-16 跑于 dh-crew 仓 `.dh-runtime/relay/`）。
- 冻结方式：`scripts/freeze-v1-run.mjs` 只复制投影消费的 3 个文件；唯一授权改写 = `brief_ref` 主机绝对路径 → `briefs/<名>.md` 相对路径（manifest 逐字段留痕，原值只存哈希不存值，承接 AGENTS 宪章#6）；输出全量扫主机路径 fail-closed。
- `freeze-manifest.json`（首冻 2026-08-20T07:21:20Z；批 1 小审与 E14 复核修复后各重冻一次，末次 09:10:43Z——**三次冻结的 3 文件哈希逐字节稳定**，见 workspace E-020/E-022，批 3 小审独立复算吻合）：源 run 目录 **41 个文件全量 sha256 基线**；冻结 3 文件哈希：

| 文件 | 源 sha256（前 12） | 冻结 sha256（前 12） | 改写 |
|---|---|---|---|
| relay-state.json | 7b6031a06960 | 7b6031a06960（逐字节同源） | 0 |
| active-plan.json | c88e796d1b53 | c88e796d1b53（逐字节同源） | 0 |
| plans/relay-plan.v1.proposal.json | 714873ac3be2 | 2016c88e7253 | 3（三个节点的 brief_ref） |

- 测试钉住：`test/freeze.test.mjs` 4 条（fixture 白名单、零主机路径、brief_ref 改写、manifest 结构/自洽/全覆盖——每个源文件必须"被冻结或被点名排除"，不许静默丢）。

### 2.2 活 v1 现场只读投影（仅一次演示）

命令序列（全程只读，输出经 stdout 重定向落 `<experiment-root>/evidence/v1/`）：

```powershell
# ① 演示前快照：dh-crew .dh-runtime\relay\ 整树 503 文件 path|size|mtime|sha256
# ② relay-pilot project <活 run 目录> --workflow-name dh-crew/manual-dispatch
#      --summary "IHSR05 修复与两轮复核接力（fix → review3 → review4）" --trigger human --trigger-by hyf
#    （detail 与 --out list 各一次）
# ③ relay-pilot show / list / hash 渲染转录
# ④ 演示后快照 → Compare-Object 逐行比对
```

- **零写入**：前后快照 **503 文件全等**（`RESULT: IDENTICAL`），同时覆盖 design/02 B1 子集「`.dh-runtime/relay/` 零新写」。冻结环节另有独立首验：源 run 目录 41 文件重哈希与 manifest 基线全等。
- **活投影 canonical sha256**：`e73ce2de193ce47e81fad7fcca00b20da67902a3edcc75d905386e920fa76688`。
- **冻结忠实性**：冻结 fixture 投影与活现场投影**语义级全等**（除 `source_refs` 外全字段 canonical 比对 IDENTICAL）；字节级 file_sha256 不同是设计使然——`source_refs` 内嵌各源文件 sha256，冻结版 plan 文件因授权改写哈希必异（`evidence/v1/frozen-vs-live-comparison.txt`）。
- 终端转录（Windows，真实输出，节选详情页）：

```text
[RELAY-IHSR05-RW-20260816113004] IHSR05 修复与两轮复核接力（fix → review3 → review4） · 已完成
流程 dh-crew/manual-dispatch
触发 人工（hyf） · 起于 2026-08-16T03:30:11.4585104+00:00 · 用时 54 分钟 · 第 未知 次运行
更新于 2026-08-16T04:24:14.5509671+00:00
日志位置 .dh-runtime/relay/RELAY-IHSR05-RW-20260816113004

接力计划（3 步）
| 步骤    | 内容    | 角色 | 状态   | 尝试次数 | 前置步骤 |
|---------|---------|------|--------|----------|----------|
| fix     | fix     | 执行 | 已完成 | 1        | -        |
| review3 | review3 | 复核 | 已完成 | 1        | fix      |
| review4 | review4 | 复核 | 已完成 | 1        | review3  |
```

完整转录：`evidence/v1/live-show.txt`、`live-list.txt`；测试：`test/project.test.mjs` 23 条（含映射表逐条、确定性、端到端只读、输出零主机路径；其中 6 条为批次小审驱动补测）；全量 **159/159** 绿（两轮换人复核修复全部收敛后的终值）。

### 2.3 版本与实耗

- **版本**：Windows 11（10.0.26100，x64）、Node v24.12.0；Linux 侧（DHR_25）Ubuntu 24.04、Node v18.19.1；DSH 全程未启动（CM5）。
- **实耗**：DHR_25 = 2026-08-18 一天（含九版全量重跑与六轮用户驱动的范围/排版迭代）；DHR_27 = 2026-08-20 约 1.5 小时（三批：冻结 → 投影器 → 演示+审计+本报告）。工作量未设硬闸（用户拍板）。

## 3. DM 组事实登记与延后声明（B-11 三分规则）

- **P4-CM4 = 延后（DHR_50）**：CLI↔DSH 对证在 DHR_50 补录；DSH 判否时记 N/A。本延后**不计入** CM 全绿判定、不阻塞 §4.5 解锁。
- **DM 组 = 事实截至本卡、三态未收敛**：`passed / passed-with-constraints / stopped-by-pilot` 的归属由 DHR_50 人判收敛，本报告不代裁。

DM-deferred-facts: stoploss-not-triggered

- 清单（截至 2026-08-20 主报告落盘时，桌面轨已登记事实——**DHR_26 已于同日收口销户**，verify 提交 `c90cf88`，用户对话签收，两轮换人复核闭合；正式登记见 [workspace/DHR_26/](../../workspace/DHR_26/)）：
  1. **P4-DM1 事实**：不改 DSH 上游即可加载树外 Host Plugin，`ctx.relayPilot` 在 DSH 进程内可调用，两份 schema 原样透传（probe 退出码 0 / stderr 空；fixture_hash `67fb18b3…` 五轮完全一致：rc.6 冒烟 / rc.7 冒烟 / 目标机 tgz / 目标机目录安装 / 2026-08-20 复跑）。
  2. **P4-DM4a 事实**：装卸与清理有证据——包外探针三态（装着 present:true / remove 后 present:false / 装回 present:true）均带退出码；真 Cordis 上注册→读活服务→dispose→服务消失，判 CLEANED。
  3. **P4-DM5a 事实**：Host 只传普通 JSON——运行时文件零 bare import，出参 JSON clone、内部深冻结、无 route/event/timer/process。
  4. **版本基线**：rc.6→rc.7 升级完成，195→195 包、added=0/removed=0/changed=186 全为 DSH 自家包、安装根未变；与 B-10 预采前快照逐包互证。
  5. **尚无事实的部分**：DHR_49（Client Bundle 构建配方 + 两屏面板）未开始——桌面轨"唯一真未知"仍未验证。
  6. 未观察到任何 §4.4 止损条件的命中记录（DHR_26 全卡无止损）。
- **登记时序说明**：本卡施工期间 DHR_26 正在并行收口（同日 15:59 verify），本报告落盘时其事实已完成正式登记；三态收敛仍按 B-11 延后至 DHR_50。DHR_50 附录按「诚实差额」机制核对本清单与桌面轨实际事实，发现遗漏须标 `honesty-gap`。

## 4. v1 协议缺口清单（P5 DHR_30 协议设计输入）

投影真实 v1 现场时逐条撞出的缺口（详见 DHR_27 findings F-002 与 `src/read-model/project-v1.mjs` 映射表）：

| 缺口 | 投影期处置 | 给 P5 的含义 |
|---|---|---|
| v1 不记录 `workflow_name / summary / trigger / trigger_by` | `project` 强制操作员补供（缺则 exit 2 点名），`source_refs` 加 `note` 留痕"操作员补供" | v2 协议应把"这是什么活、谁触发"记进 run 现场 |
| 无 run 级状态 | 投影器（源头侧）按节点聚合：failed > running > waiting_human > 全 succeeded；表外→unknown，unknown 归 `needs_you` 浮顶不沉底 | v2 应源头记 run 级状态，或冻结这套聚合语义为协议 |
| 无节点 title | `title = node_id` 1:1，不造语义 | v2 节点应带人话标题 |
| 无 run 级 `attempt` | 缺省=源头不记，屏幕显示"未知" | 沿用 DHR_25 结论："缺省不等于 1" |
| `brief_ref` 携带主机绝对路径 | 冻结时授权改写为相对路径；投影输出不含该字段 | v2 一切 locator 必须相对/符号化（同 `log_locator` 校验） |
| `terminal_state` 是 psmux 会话观测态、非任务结果 | 不参与状态映射 | v2 应把"会话观测"与"任务结果"分字段建模 |

## 5. P4-H 人判材料（H1 / H4，本卡范围）

> H2 / H3 涉 DSH，随 DHR_50 附录。判断人：用户；材料如下，结论待用户在对话中表态后由 DHR_27 工作区 review.md 登记。

- **H1（CLI+SSH 是否足以作为一条独立、正式的控制面——与 DSH 并行、可配置替换，不是保底）**：
  - fake fixture：Windows 与 Linux SSH 双侧 90/90 测试、七份 fixture canonical sha256 全等、四份人可读转录字节相同（DHR_25）。
  - 真实历史现场：本报告 §2——冻结投影 + 活现场零写入投影 + 全链渲染（`project → show/list/hash`）一次跑通，运行状态/进度/依赖/触发/用时全部可读。
- **H4（当前体验是否值得继续建 Relay Runtime）**：
  - 正面：客户端中立 Read Model 经受住了"第一份真数据"——v1 → Read Model 的映射只需一个纯函数投影器（约 250 行），列表/详情两屏零改动直接复用；架构约束（分堆源头给、客户端不推导）在真数据上未破。
  - 负面（如实）：v1 缺口清单（§4）说明现有 v1 现场作为长期数据源不够——继续建 Runtime 意味着 P5 要把这些缺口在 v2 协议里补齐。

- **H1/H4 判断结果**（2026-08-20 用户对话点选，过程见 workspace/DHR_27/review.md 确认记录）：**H1 =「够，认可」**——CLI+SSH 有资格作为一条独立、正式的控制面（与 DSH 并行、可配置替换；用户在 AI 解释「独立控制面」语义与三条判断问题后表态）；**H4 =「值得，继续」**——值得继续建 Relay Runtime（用户首轮答「不确定」，AI 补充 P4 已证事实与「暂不表态」合法选项后表态；**进 P5 的最终放行按 §4.5 另行确认，本表态不替代**）。

## 附录（DHR_50 交付节位）

> 本节位由 DHR_50 收口时追加：CLI↔DSH 跨客户端对证（P4-CM4 补录）、CM6b 审计、DSH 三态收敛（用户人判）、H2/H3、以及对 §3 `DM-deferred-facts:` 清单的诚实差额核对。未追加前本节留空。
