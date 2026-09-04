<!-- review-code1-codex.md — DHR_74 代码复核轮 1 原文（fresh 只读 codex，gpt-5.6-terra high，--sandbox read-only）。
     采集：herdr agent read --source recent-unwrapped；TUI 硬换行原样保留，仅去掉行首缩进与 bullet 前缀。 -->
## 形态自述

Codex（GPT-5），read-only sandbox；仅静态审查，未运行测试。
开工时 HEAD：5a5b1d977f847aec4d14bfa8cda37976552cc18e；施工候选按
派单固定为 49196f8，HEAD 上的 5a5b1d9 仅为复核派单。

## 发现

### F-74-R1-01 (P1) “×10 等比共缩”既不等比，也未遵守配对参数限定

- 位置：relay-core/test/agent-node.test.mjs:243,286；relay-core/
  test/dhr69-false-ready.test.mjs:56,105

- 事实：前两处 herdrPollMs 为 5→20，实际为 ×4；DHR69 为 2→20，但
  同一 options 中的 observationLostMs / doneTimeoutMs 仍为
  60_000。这与 DevPlan :529-536 的“×10、同一 options 配对参数同倍
  率”不符，也使 progress/findings/construction 的“12 行 ×10 等
  比”自述不成立。

- 失效场景：DHR69 若 host 进入 done 后 Result 在 60–600 秒间才落
  定，当前候选仍按 60 秒走超时；按已授权的共缩规则则应保留到 600
  秒。测试时间语义并未维持同倍率。

- 依据：b9619c3 的逐行 diff；DevPlan 允许路径原文。

### F-74-R1-02 (P1) 候选整体包含 DHR_74 未授权的 DHR_71 改动

- 位置：22dc16c；docs/modules/dh-relay/workspace/DHR_71/**；
  relay-core/test/agent-node.test.mjs、herdr-adapter.test.mjs

- 事实：4742b97..49196f8 的字面 diff 含大量 DHR_71 workspace 工
  件，以及 DHR_71 引入的 skip、finally、bounded-wait 接线。DHR_74
  allowed-paths 只授权 workspace/DHR_74/**，测试文件也只授权探针/
  夹具/非断言时间行。

- 失效场景：若将该候选作为“DHR_74 窄范围施工”收口，DHR_71 的独立
  施工和复核变更会被错误归入 DHR_74 授权。

- 依据：22dc16c 的双亲 diff；DevPlan :529-536。未发现对 store/
  **、runtime/**、contracts/**、package.json 或 fake-herdr.mjs 的
  改动。

### F-74-R1-03 (P1) F-7402 的“排除写队列/CPU/内核归因”推理未闭合

- 位置：docs/modules/dh-relay/workspace/DHR_74/findings.md:16-
  17；construction.DONE:8,10；fs-probe-register.mjs:18-40

- 事实：探针没有直接观测 actor submitControl 队列或 Store 写队列
  的深度、入队时间和出队时间；“fs 无慢操作”不能推出“写队列没有卡
  住”。原始 CPU 日志相邻采样约 18–19 秒，并非 progress 所称 2
  秒，不能排除短暂 CPU/调度争用。

- 失效场景：一个已入队但迟迟未获执行的 Store/actor job，或 JS/GC/
  进程被 OS 暂停，均可产生“LOOP-LAG + 无 SLOW fs”的同样证据，却被
  当前结论误排除为非写队列问题。

- 依据：LOOP-LAG 只证明该 Node 事件循环约数秒没有执行 timer
  callback；不能区分同步 JS、GC、调试暂停、OS 调度或探针自身 I/
  O。六轮未复现不能证明随机冻结已经消除。

### F-74-R1-04 (P2) fs 探针不能支持“fs 全程健康”的排除性表述

- 位置：relay-core/test/helpers/fs-probe-shim.mjs:79-115；relay-
  core/store/store.mjs:226-237

- 事实：shim 仅计时 open()，返回的 FileHandle.writeFile()、
  sync()、close() 未被包装。Store 的 writeAtomicText() 正使用这些
  句柄方法。

- 失效场景：若慢点在 FileHandle 写入、同步或关闭阶段，探针只会记
  录很快的 open()，再报告零 SLOW，造成“fs 健康”的假阴性。

- 依据：Store 的主 persistState() 路径使用 writeAtomic()，其中
  writeFile/rename 确实受覆盖；因此结论仅能收窄为“该已覆盖路径未
  见慢调用”，不能扩展为全部 fs。

### F-74-R1-05 (P2) 五轮轮询预算仍按旧 2ms 计算

- 位置：relay-core/test/herdr-adapter.test.mjs:571-577
- 事实：fixture 已改为 herdrPollMs:20，注释与 75_015 预算仍按 2ms
  推导。正确同式结果为 5 × (10_000 + 20) × 1.5 = 75_150ms。

- 失效场景：五次合法、接近 CLI 上限的观测叠加正常调度开销时，可在
  75,015–75,150ms 被测试误报超时。

- 依据：同文件 :228 与 :571-575。

### F-74-R1-06 (P2) E-7408 账本仍是未填写占位

- 位置：docs/modules/dh-relay/workspace/DHR_74/progress.md:66
- 事实：账本结果仍写“（跑完后填）”，但下方表格和六份原始记录均已
  完整。

- 失效场景：只消费证据账本的复核者会得到未完成状态，无法从账本本
  身确认 E-7408。

- 依据：六份 .txt 均为 tests=55、pass=51、skipped=4、fail=0；六份
  JUnit 均为 55 testcase、4 skipped、0 failure。

## 逐点结论

1. ×10 共缩：发现 F-74-R1-01。
   DHR64 的 2/8/4→20/80/40、DHR70 的 2/20→20/200、herdr-adapter
   的配对设置总体自洽；但 agent-node 是 ×4，DHR69 的 60 秒配对超
   时未缩放，不能称全部 12 行均 ×10。

2. poll 次数变化：有变化，但未发现现有断言被直接绕过。
   fake-herdr.mjs:49,81-88 确认 status 每次 agentGet() 消费一项，
   与墙钟无关；故 poll 变慢会减少固定墙钟窗口内的状态推进次数。现
   有断言主要等单调事件，agent-node 的 1 秒等待仍远大于 20ms，
   DHR69 的 45 秒等待也足以消费短列表。未发现一个当前列表因减少
   poll 而跳过第 N 状态；但这不能修复 F-74-R1-01 的授权和比例问
   题。BLOCKED_FIVE_POLLS_BUDGET_MS 另见 F-74-R1-05。

3. 绿是否靠时序遮住：发现 F-74-R1-03。
   减少 poll 的确降低 fs/事件压力；但施工方也记录修后仍复现停顿，
   六轮绿只能证明该六轮、该负载条件下未重现。construction.DONE
   的“DHR_71 门禁阻塞解除”应收窄为“该冻结命令六轮满足门禁数字”，
   不能表述为随机冻结已被解除。

4. 断言及 DHR71 合并：部分无问题。
   全范围 diff 未见 assert.* 增删。S1–S4 的四个 skip 在 merge 后
   仍保持 parent-2 的名称和理由，六份 JUnit 也均为同一四条。
   但全范围并非“零结构改动”：22dc16c 引入/保留了 skip 标记、
   finally 收口及 bounded-wait；它们属于 DHR71 合并内容，不能同时
   被称作 DHR74 的零语义窄改动。

5. 探针卸载与污染：部分无问题，另见 F-74-R1-04。
   未设 NODE_OPTIONS 时，package.json 的 test script 未枚举
   helper，目标五个测试也未 import 探针，常规运行不加载它。ESM 的
   本地具名 export 会优先于 export * 同名 re-export，16 个包装函
   数有效。
   store.mjs、workflow-driver.mjs 均使用 ESM node:fs/promises，当
   前关键路径不受 CJS 缺口影响；但 FileHandle 后续操作仍未覆盖，
   故不能作全 fs 排除性结论。

6. LOOP-LAG 判据：发现 F-74-R1-03。
   漂移证明 timer 未按期获调度，只能支持“该主线程在该段时间未回到
   timer 阶段”。它不够证明“进程被整段饿死”，更不能定位内核/过滤驱
   动。pending 遍历、字符串处理、stderr 写入与 GC 都是需控制组排
   除的探针自身因素。

7. F-7402 排除法：发现 F-74-R1-03。
   写队列没有直接观测；CPU 采样实际粒度也不足以排除短暂争用；High
   优先级 2/6 红只反驳“优先级是唯一因素”。四个替代解释均“排除”的
   结论不成立。

8. normal 有效单测：判为未满足。
   六轮既有门禁是有效的回归执行证据，但本卡新增探针与“按同倍率缩
   放”没有新增确定性测试或断言守卫；尤其没有检查同一 driver
   options 的比例关系。重复绿跑不能防止未来再次出现 ×4 或遗漏配对
   超时。

9. 越界：发现 F-74-R1-02。
   未碰明确禁止的生产/共享路径；但字面候选包含 DHR71 workspace 和
   超出 DHR74 测试行级限定的 DHR71 合并内容。该部分需作为独立
   DHR71 变更或有明确整合授权，不能计为 DHR74 窄范围内。

10. 证据账本：原始数据支持数字，但账本不自洽。
   六份 txt 与 JUnit 支持 55/51/4/0、279.579–280.265 秒，且 skip
   名称完全一致。系列脚本曾误标 RED 不影响这些原始数字；问题是 E-
   7408 仍保留“跑完后填”占位，见 F-74-R1-06。

## 范围外观察

未运行测试；以上均为静态审查和已提交原始证据复核。未作验收裁决。

