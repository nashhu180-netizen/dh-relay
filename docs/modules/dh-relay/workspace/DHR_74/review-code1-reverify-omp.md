开工时 HEAD：`0a24cb4`。以上全部证据核对完成（只读；未跑任何测试/门禁）。

---

`HEAD: 0a24cb4`
`复核者: omp/deepseek-v4-flash`

## 形态自述

只读窄复核（代码轮 1 reverify）。范围：整改面（`541e695` 整改主提交 + `fe2de18` 移交项补回）、新证据（`98f2585` E-7409）、全卡改动面（`84f2514..HEAD`，fork 点为 master 上的 DHR_71 收口 squash）。仅用 `git log/show/diff/grep/rev-parse` + 静态阅读，未运行测试。开工时工作树仅有三份主控预置的 0B 落盘占位（`review-*-omp.md`），复核者零写入。分支拓扑核实：merge-base(`master`,`HEAD`)=`84f2514`；`22dc16c` 不在 HEAD 祖先链；旧形态备份 ref `keep/dhr74-pre-rebase-260903` 存在（tip `2a4c05d`）；master 侧 6 笔提交（`abff757`…`a8b96f4`）均未触碰 `relay-core`（`git diff 84f2514..master --stat -- relay-core/` 空）。

## 逐点结论

### 1. F-74-R1-01 是否真闭合 —— 通过

逐行核对五个门禁文件当前时间参数 vs DevPlan 修订口径（P6 §3.2，HEAD 副本 :534-538，与 master 一致）：

| 文件:行 | 现值 | 口径判读 |
|---|---|---|
| agent-node:243,286 | `herdrPollMs: 20`（原 5） | ×4，符合「绝对值一致才是」:535 |
| dhr64-driver-observation:38 | `20 / done 80 / obs 40`（原 2/8/4） | 符合 :536 示例「8/4 → 80/40」 |
| dhr69:56,105 | `poll 20`，`obs/done 60_000` 不变 | 符合 :536「墙钟上限保持不变」 |
| dhr70-submission-gate:353 | `20 / done 200`（原 2/20） | 符合 :536 示例「20 → 200」 |
| herdr-adapter:228,244,307,351,607 | 夹具默认 2/5/5→20/50/50、10/2→100/20 ×2、obs 100→1000、40→400 | 全部保持 poll 数语义同比例（如 100ms@2ms=50 polls → 1000ms@20ms=50 polls） |

- 预算常量：herdr-adapter:574 `75_150`，推导注释 :572-573 已改按 poll=20 重推；算术 `5×(10_000+20)×1.5 = 75_150` 正确，且该用例实际生效 poll=20（runtimeFixture 默认，driver options 只覆盖 `herdrReadyTimeoutMs:0`）。
- 旧「12 行 ×10 等比」自述残留扫描：`progress/findings/construction.DONE/brief` 全部清除；仅 `brief.md:44` 以否定句保留（「此前…不是本卡口径」），合理。`progress:13,60` 的「单跑 ×10」指跑 10 轮，非缩放语义，不算残留。
- 全卡 relay-core diff 的 assert 行增删计数 = 0（`grep '^[+-].*assert\.'` 空）。

### 2. 冲突重解有没有丢东西 —— 通过

`git diff master..HEAD --stat -- relay-core/` 恰为 9 个文件：五个门禁测试文件（仅时间参数/注释/常量行）+ 探针三件套 + `fs-probe.README.md`。由于 master relay-core ≡ `84f2514` relay-core，且 84f2514=DHR_71 最终代码，DHR_71 引入的 `try/finally`（herdr-adapter #10 恢复届用例 :365-381）、`dumpDriverScene`（herdr-adapter 4 处、agent-node 引用）、`untilEvent` 有界等待、S1~S4 skip 标记均与 master 逐字节一致（diff 中无这些区域的行改动；skip 计数 master/HEAD 均为 agent-node 1 条、herdr-adapter 其余）。rebase 重解两处（agent-node 5→20、herdr-adapter 10/2→100/20）已确认就是上表现值，DHR_71 内容零丢失、零被改。

### 3. F-74-R1-05 是否真闭合 —— 通过

`541e695` 对 herdr-adapter 的改动仅 :569-575 一处（注释 + `BLOCKED_FIVE_POLLS_BUDGET_MS` 75_015→75_150），断言一行未动（:577 的 `assert.equal` 为上下文行）。算式与夹具实际值一致（见结论 1）。

### 4. F-74-R1-04 / R1-03 降级是否到位又没过头 —— 通过

- README「覆盖边界」四条与实现核对：`fs-probe-shim.mjs` 包装 16 个具名 ESM op（rename/writeFile/appendFile/readFile/open/mkdir/mkdtemp/rm/unlink/readdir/stat/lstat/cp/chmod/utimes/copyFile），`open` 返回的 FileHandle 方法未包 —— 与 store.mjs 实际用法吻合（`writeAtomicText` 走 `handle.writeFile/sync/close`，store.mjs:226-237）；`fs-probe-hooks.mjs` 只拦 ESM resolve，CJS 不经 hook；队列无探针；LOOP-LAG = 500ms interval drift>400ms（register.mjs:35-39）。四条陈述均准确。
- 未降过头：findings F-7402 保留「已排除调度优先级单因子（High 2/6 仍红）」——有 E-7407 六轮对照支撑，正确保留；F-7401 保留「放大侧红→绿对照成立（56,775→17,650）」——与原始 EXIT-SUMMARY 逐字一致（probe-gate writeFile:56775 → postfix writeFile:17650）。

### 5. F-74-R1-06 是否真闭合 —— 通过

progress 证据账本 E-7408 行已填实：「6 轮 51 pass / 4 skip / 0 fail，279.6–280.3s；**组合分支过程证据**，非独立基线验收」；六轮原始 `.txt` 数字逐轮核对（280.0/280.3/280.0/279.9/280.0/279.6s）与账本一致；construction.DONE:10 与「机器证 C」节均明确标为组合分支过程证据并指向 E-7119/E-7409。

### 6. 新证据 E-7409 是否站得住 —— 通过（含两条 P3 提示）

- 原始数字核对：round1/2/3 `.txt` 与 `.junit.xml`：tests 55 / pass 51 / fail 0 / skipped 4、duration_ms 284547.7/284224.6/285453.0 → 284.548/284.225/285.453s，与 progress E-7409 表逐条一致；junit 每份 55 testcase / 4 skipped / 0 failure（重数核对）。签名扫描命令重放：四类签名 0 命中、exit 1；「空扫自证」重放得 21 命中 / 6 文件（junit 各 6、txt 各 1），与记录一致 —— 该自证足以证明 glob 确实覆盖 6 份文件、非空扫。
- skip 核销：三轮 md5 均为 `4c02834abdc0f90eec2f58e9ff10ce32`，且与 DHR_71 E-7119 三轮摘要**相同**（同一批 S1~S4）；四条的完整用例名就在同目录 `.txt` 里可逐名核对（agent-node 1 条 + herdr-adapter 3 条 DHR_33 用例，均挂 F-3520→DHR_72）。md5 + 同批文件内可恢复名单，足以支撑「同一批」。
- 条件措辞：progress 明确「2026-09-03 白天，主控 session 在跑但三轮期间零并发 worker（复核与整改 pane 均已关闭）」，签名扫描文档附 F-71-LES-02 条款 —— 与 E-7119 的条件描述同构可比，足够。
- P3 提示 a：E-7409「墙钟 292/292/293s」无法从落盘工件直接还原（`.txt` 只有 duration_ms；文件名时间戳间隔 304/305s 含命令重启开销）。虽与「≤370s」判据无冲突，建议运行记录里补 start/end 时间戳以便未来独立复核。
- P3 提示 b：`e7408-bl17-signature-scan.txt` 的签名集不含 S-CRED（文件自己也注明 "does not inspect credentials"）。因 E-7408 已降级为过程证据，此缺口可接受，仅提示账目一致性。

### 7. 横比结论是否诚实 —— 通过，措辞建议维持

推理成立：DHR_71 独立基线（E-7119，**不含**本卡 12 行）三轮 285.1–289.0s 全绿 ⇒ 绿闸达标层面本卡时间参数**非必要**；本卡基线（E-7409）284.2–285.5s 全绿，最大差 ~1.7%、均值差 ~1%，「≈1%」成立。没有反过来低估：progress 明写「放大侧指标确有改善（fs 写 56,775→17,650、事件 28,404→8,841）」，即贡献被如实记账，仅拒绝把「改善」夸大成「绿闸必要条件」。措辞不必更强（E-7119 与 E-7409 非同时段运行，不能断言同负载下的因果必要性），也不该更弱（放大量级改善有原始 EXIT-SUMMARY 背书）。

### 8. 有效单测要求（normal）—— 维持「未满足」，缺口建议单独立卡

- 事实：整改未新增机械守卫；派单（remediation-brief-r1 R1-A~F）未要求；DevPlan 允许路径不含新增用例（:533-538 仅授权非断言行），本卡内补守卫确属越界。
- 判断：轮 1 的缺口（「同一 options 里 poll 与配对超时的比例一致性」等可防回归的机械检查）**仍然存在** —— E-7409 三连绿与 E-7119 三连绿都是回归执行证据，但没有任何断言/守卫能在未来把 poll 改回 2、或漏缩配对超时时让测试失败（F-74-R1-01 正是「参数违规但全绿」的例子）。故按配方字面仍判**未满足**。
- 建议：该守卫**值得单独立卡**（轻量级，纯夹具一致性静态/断言检查），或并入 DHR_72 的夹具重写范围一并落地；不应作为本卡整改轮「措辞/账目闭合」的阻塞项，但应在收口裁决中显式登记为遗留缺口，由主控决定由哪张卡承接。是否放行配方闸属主控裁决，本复核不代签。

### 9. 越界 —— 通过（注意 diff 基准）

- 以 fork 点 `84f2514..HEAD` 为基准的全卡改动清单 = `backlog.md`（仅 DHR-BL-17 内一条补录）+ `workspace/DHR_74/**` + 上述 9 个 relay-core 文件。**零**命中 `store/**`、`runtime/**`、`contracts/**`、`package.json`、`fake-herdr.mjs`、`workspace/DHR_71/**`、`dev_plan/`；断言零改动。
- 注意：派单写的 `git diff --name-only master..HEAD` 现会混入 master 侧 6 笔 post-fork 提交的文件（DHR_71 verify 证据、knowledge、DevPlan 重塑等，见形态自述）——那是 master 侧内容，不是本卡改动；按 merge-base 归因即干净。建议复核/收口文档统一以 `84f2514..HEAD` 为全卡口径。

## 问题清单

**P0/P1：无。**

P2：
1. （配方遗留，非整改缺陷）normal 有效单测按字面仍**未满足**——缺「poll/配对超时比例一致性」机械守卫；建议单独立轻量卡或并入 DHR_72，收口裁决中显式登记（对应第 8 点）。

P3：
2. E-7409「墙钟 292/292/293s」无落盘运行日志可独立还原（对应第 6 点 a）。
3. `e7408-bl17-signature-scan.txt` 签名集不含 S-CRED 类（对应第 6 点 b；E-7408 已降级为过程证据，可接受）。
4. progress/backlog 引用 DHR_71 基线写作 `wt/DHR_71@73c43eb`，DHR_71 自己的 progress 写 `b7f894f` —— relay-core 内容两提交完全一致（diff 空），无实质影响，仅建议跨卡引用统一。

## 范围外观察

- 五个门禁文件之外仍有测试文件使用 `herdrPollMs: 1~2`（如 `dhr64-result-bridge.test.mjs:191,227`、`identity-quota.test.mjs`、`dhr65-registry-loader.test.mjs:135`）。它们不在本卡冻结五文件命令内、不在授权面内、本次未被碰；但如果未来把这些文件纳入门禁，同一放大问题会再现。仅登记，不在本卡处理。
- 复核期间工作树出现的 `review-*-omp.md` 三个 0B 文件为主控预置落盘占位，复核者未写入任何文件。

未作验收裁决，未代主控签字。
