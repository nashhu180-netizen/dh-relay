<!-- dh:v1 · review-consistency-codex.md — DHR_71 复核原样输出（主控从 Herdr pane 收回落盘，未删改）。派出=e:E-7112；brief=review-brief-consistency.md；形态=codex gpt-5.6-terra · high · --sandbox read-only · Herdr 交互 pane · fresh · cwd=wt/DHR_71@28af9af -->
# dhr71con · 原样输出

## 形态自述

  静态、只读复核。候选为 HEAD 28af9af，基线为 master@25d697d；未运
  行测试、未改文件。结论：CHANGES REQUESTED（P1）。两处等待上限与进
  程级 --test-timeout=180000 不自洽，会让合法慢路径仍被错误判红，或
  先被 Node 的外层超时截断而丢失预期的 bounded-wait 现场。

  ## 比对清单（扫了哪些维度、每个维度找到几处同类）

   维度              grep/搜索方式                    找到几处同类
  ━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   等待工具与语义    bounded-wait、                              5
                     settledState、
                     runtimeUntil、
                     untilAsync、文件
                     级 until
  ────────────────  ──────────────────  ───────────────────────────
   等待/测试上限     timeoutMs:、预算     6 个等待上限 + 180s 外层
                     常量、--test-                            上限
                     timeout
  ────────────────  ──────────────────  ───────────────────────────
   driver 清理       startWorkflowDri        指定五文件 8 个启动点
                     ver(、
                     t.after(、.stop(
                     )
  ────────────────  ──────────────────  ───────────────────────────
   skip 形态         rg "skip:"           5 条，其中 DHR_71 冻结 4
                     relay-core/test                            条
  ────────────────  ──────────────────  ───────────────────────────
   绿闸命令          task plan、                          4 份口径
                     DevPlan、
                     progress/
                     evidence、
                     package.json
  ────────────────  ──────────────────  ───────────────────────────
   路径与 hunk       git diff --name-     4 个代码文件 + 28 个工作
                     only/-U0                               区文件
                     master...HEAD

  ## 六个冻结比对对象（逐个）

  ### 1. 有界等待工具的口径

  - 并排定义：新 untilEvent / withDeadline 等目标事件或 Promise 落
    定，超限输出现场；settledState 等“状态快照追上事件账”的不变量；
    既有 runtimeUntil、untilAsync、文件级 until 都是泛轮询。

  - 定义是否一致：修改后的调用均等 checkpoint、派生状态、轮询次数或
    driver 落定，不等最终断言值；与 settledState 的原则一致。

  - 裁决：一致。
  - 依据：新 helper 保留断言在等待之后；旧工具仅缺现场 dump，是未改
    存量差异，不构成语义冲突。

  ### 2. 等待上限与生产默认值的关系

  - 并排定义：
      - 恢复探活 15_000 = 10_000 × 1.5：一致。
      - driver.done 的 60_000：与生产 doneTimeoutMs 默认值一致。
      - :510 启动等待 120_000 = (10_000 + 60_000 + 10_000) × 1.5：
        一致。

      - :510 五次轮询 75_015 = 5 × (10_000 + 2) × 1.5：一致。
      - DHR69 90_000 = 6 × 10_000 × 1.5：一致。
      - agent-node 首 checkpoint 30_000：注释只计入 ready/一次
        agentGet 与 I/O 余量。

  - 定义是否一致：不一致。
  - 裁决：遗漏（P1）。
  - 依据：
      1. agent-node 的两条 Codex 启动路径同样会经过 paneSplit(10s)
         → agentStart(60s) → agentGet(10s)；其 30s 等待漏算了
         paneSplit 与 agentStart，小于合法的 80s 生产调用链。它与同
         为 Codex 启动链、已正确取 120s 的 herdr-adapter:510 横向矛
         盾。

      2. 同一 :510 用例先等最多 120s 的 waiting_human，再顺序等最多
         75.015s 的五次轮询；合计 195.015s，却由绿闸的单用例
         --test-timeout=180000 包住。最坏合法路径会先触发 Node 外层
         超时，第二段无法保证输出 untilEvent 的 dump，违背“超限即有
         界失败并打印现场”的目标。

  ### 3. driver 生命周期兜底

  - 并排定义：DHR_71 修改的 agent-node 三条均以 try/finally { await
    driver.stop() } 保证先停 driver 再执行已登记的 rm；herdr-
    adapter #10 的两个 fixture driver 也已在 finally 停止。

  - 定义是否一致：DHR_71 改动本身一致，且修复了 652s 对应的登记顺序
    问题。

  - 裁决：DHR_71 一致；另有范围外遗漏（P2）。
  - 依据：
      - herdr-adapter.runtimeFixture 与 DHR69 两个 fixture 均已
        按“先 stop、后 rm”注册，正确。

      - agent-node:357 是 process 优先路径，先 await driver.done，
        不是同一类并发写盘清理风险。

      - dhr64-driver-observation.fixture 与 dhr70-submission-
        gate:350 仍均为先登记 rm、后登记 driver.stop。正常成功路径
        已 await driver.done，但失败/超时清理路径仍保留与 652s 同型
        的顺序隐患。它们不在本卡允许范围，应单列 backlog/finding，
        不应顺手改。

  ### 4. skip 标记的形态与理由措辞

  - 并排定义：S1–S4 都是 { skip: 'F-3520 → DHR_72：…' }，并分别指出
    现役 Receipt-bound 语义与旧断言的差异。

  - 定义是否一致：一致。
  - 裁决：一致。
  - 依据：定向五文件中的 4 条 skip 与 DevPlan DHR_72 机器证 E 的四
    个完整用例名一一对应；仓内另 1 条 skip 是平台条件 skip，不混入
    本卡核销。

  ### 5. 绿闸命令与证据口径

  - 并排定义：task plan 固定五文件命令已含 --test-timeout=180000；
    progress 的 E-7101/E-7109 也登记同一 flag；DevPlan 只简写 node
    --test --test-concurrency=1；package.json 的 npm test 是不同的
    全量并发入口，且未被修改。

  - 定义是否一致：命令差异已如实登记，不存在把 npm 全量测试冒充为五
    文件绿闸的情况。

  - 裁决：一致，但受第 2 项 P1 影响。
  - 依据：--test-timeout 的使用符合 task plan“不改 package
    script”的边界；问题不在证据记载，而在 180s 数值不足以覆盖同一测
    试内两个顺序有界等待。

  ### 6. 允许路径 vs 实际 diff

  - 并排定义：实际 diff 仅含 relay-core/test/** 与 workspace/
    DHR_71/**；4 个代码文件均在允许目录内。

  - 定义是否一致：路径级一致；S3/S4 仅改 skip、等待与 try/finally，
    断言没有 hunk。

  - 裁决：一致；dhr69 import 为有意差异。
  - 依据：
      - dhr69-false-ready.test.mjs 的 import 位于 :179 用例体外，严
        格按行级文字看是边缘项；

      - 该行仅提供 untilEvent / dumpDriverScene 的静态导入，不动文
        件级 until、其他 9 条用例或任何断言；动态 import 只会把机械
        前提塞回用例体。

      - 因此主控“机械前提、等价放行”的裁决站得住；应保留 progress/
        DONE 中已有的偏差记录。

      - git diff --check master...HEAD 仅报 evidence 原样测试输出中
        的 trailing whitespace，非代码格式问题，且工作区说明已记录
        其原因。

  ## 自选维度的比对结果

  - Helper 组织：helpers/ 有 6 个同类模块；新文件采用现有 ESM named
    export 风格，命名与职责均自洽。

  - 脱敏：redactIds() 在 dump 输出点进行 SHA-256 前 12 位替换，符
    合“先脱敏再入证据”的方向。当前 worktree 未检索到可读取的 DHR35
    redact-receipt-ids.mjs，因此“与该脚本逐字一致”不可证，不能替其
    背书。

  - 文件级 timeout：FILE_TEST_TIMEOUT_MS=180_000 是目标文件新增的唯
    一此类常量；其作为 agent-node 三用例的外层安全网尚可，但不能修
    复 herdr-adapter:510 的 180s 全局截断问题。

  ## 不一致逐条裁决汇总

   编号              C-71-01
   不一致点          agent-node 首 checkpoint 预算 30s 漏算 Codex
                     paneSplit + agentStart
   有意差异 or 遗漏  遗漏（P1）
   理由              合法调用链至少 80s，与 :510 的同类链 120s 口径
                     冲突
   建议落到哪        agent-node.test.mjs 预算注释/常量及 progress
                     的机器证 B；重跑受影响证据
  ─────────────────────────────────────────────────────────────────
   编号              C-71-02
   不一致点          :510 的 120s + 75.015s 顺序等待超过 180s 单测
                     上限
   有意差异 or 遗漏  遗漏（P1）
   理由              外层 Node 超时可先于第二段 helper 的诊断触发
   建议落到哪        task plan/绿闸命令的 timeout，必要时该用例的显
                     式 timeout；重跑三轮
  ─────────────────────────────────────────────────────────────────
   编号              C-71-03
   不一致点          DHR64、DHR70 仍先登记 rm 再登记 driver.stop
   有意差异 or 遗漏  遗漏（P2，范围外）
   理由              与 652s 的清理顺序风险同型，但不属于本卡允许路
                     径
   建议落到哪        findings/backlog，另卡处理
  ─────────────────────────────────────────────────────────────────
   编号              C-71-04
   不一致点          DHR69 helper import 位于行级限定用例体外
   有意差异 or 遗漏  有意差异
   理由              最小机械前提，不影响文件级 helper、其余用例或
                     断言；已有审计记录
   建议落到哪        保留 progress/DONE 的现有裁决即可

