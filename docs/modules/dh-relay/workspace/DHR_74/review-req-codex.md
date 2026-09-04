<!-- review-req-codex.md — DHR_74 需求方向复核原文（fresh 只读 codex，gpt-5.6-terra high，--sandbox read-only）。
     采集：herdr agent read --source recent-unwrapped；TUI 硬换行原样保留，仅去掉行首缩进与 bullet 前缀。 -->
## 形态自述

- 只读静态复核；未跑测试、未写文件。
- 开工时 HEAD：5a5b1d977f847aec4d14bfa8cda37976552cc18e。派单候选
  为 49196f8；差异仅为三份 DHR_74 review brief，未改变施工交付。

- 原始六轮 stdout/JUnit 已抽查；各轮均为 55 tests / 51 pass / 4
  skip / 0 fail，耗时 279.579–280.265s，四个 skip 名称一致。

- brief.md 与 DevPlan 存在实质漂移，以下以 DevPlan 为准。

## 发现

### F-74-REQ-01 (P1) 机器证 A 未满足“精确 op”，兜底也未完整满足，
却写成“达成”

- 位置：construction.DONE:8；DevPlan §3.2 DHR_74「机器证 A」。
- 事实：E-7405/06/07 表明停顿时 workflow-driver.mjs:319-326 的
  Attention 写入未完成，并记录 LOOP-LAG；但没有捕获“停住的精确
  op / 路径 / 耗时 / 现场”。LOOP-LAG 证明事件循环期间没有推进，不
  能证明具体卡在 submitControl、Store 写队列或某个 fs op。

- 与口径的偏差：口径要求复现时钉精确 op；未钉死才可走“≥10 轮 × 2
  种负载条件的复现率与对照，并如实登记未钉死”。实际只给出空载 10
  轮、追猎 15 轮、CPU 采样 8 轮及 High 优先级 6 轮；没有定义并执
  行第二种负载条件，也没有将 A 如实表述为未钉死。

- 依据：progress.md:13,17,60,63-65；findings.md:F-7402；
  construction.DONE:8。

### F-74-REQ-02 (P1) 机器证 B 没有停顿的红→绿对照

- 位置：construction.DONE:9；progress.md:16；DevPlan §3.2「机器证
  B」。

- 事实：E-7403b 与 E-7404仅证明 fs 写数从 56,775 降至 17,650；E-
  7404 仍 699s、11 红，且包含 DHR_69/A、DHR_68/C 停顿红。交付文本
  也承认“放大修复未消除停顿”。

- 与口径的偏差：测试侧修复要求“修复前复现 / 修复后同条件消失”。实
  际没有停顿本身的同条件红→绿。

- 依据：progress.md:14,16,61-62；findings.md:F-7401；E-7403b、E-
  7404 原始 stdout/JUnit。

### F-74-REQ-03 (P1) C 的绿证只证明合并组合，且“零签名”和 DHR_71
留痕不可核

- 位置：progress.md:18-36,66；construction.DONE:10,21；DevPlan
  §3.2「机器证 C」。

- 事实：六轮数字、耗时和四个同名 skip 均由原始 stdout/JUnit 支
  持。但它们运行在 wt/DHR_74@22dc16c，该提交合并了 wt/DHR_71；故
  证据证明的是 DHR_71+DHR_74 的组合版本，不足以单独归因“DHR_74 修
  好了”，也不能替代 DHR_71 在其最终集成基线上的独立收口证据。

- 与口径的偏差：C 要求同时记入 DHR_71 证据账；当前 workspace/
  DHR_71/progress.md、construction.DONE、brief.md 没有 E-7408 /
  22dc16c / 六轮证据引用。所谓“EPERM/stall 签名扫描 0 命中”也只有
  progress 的转述，原始六轮 stdout/JUnit 没有扫描命令、签名定义或
  输出可复核。

- 依据：六份 evidence/gate-round*.txt/.junit.xml；
  progress.md:19,34-36；对 DHR_71 工件的静态检索无命中。

### F-74-REQ-04 (P1) brief 漂移，且部分“×10 等比缩放”不符合
DevPlan 的逐字例外

- 位置：brief.md:22-26；DevPlan §3.2 DHR_74 允许路径；relay-core/
  test/dhr69-false-ready.test.mjs 的 b9619c3 差异。

- 事实：brief 未写入 DevPlan 后补的“夹具时间参数等比放大”授权，仍
  只允许临时目录根、清理顺序、import 探针；不能作为实际 12 行时间
  参数修改的施工合同。更具体地，dhr69-false-ready.test.mjs 将
  herdrPollMs 从 2 改为 20，但同一 driver options 中的
  observationLostMs / doneTimeoutMs 仍为 60,000，未按 DevPlan 所
  述同倍率调整。

- 与口径的偏差：用户授权例外要求逐字限于 mkdtemp 根和“herdrPollMs
  与同一 options 的配对超时按 ×10”等比行；施工说明“5 文件 12 行均
  ×10”等表述超过差异事实。

- 依据：DevPlan §3.2 DHR_74 允许路径；git diff b9619c3^ b9619c3
  -- relay-core/test；findings.md:F-7401。

### F-74-REQ-05 (P1) 需求境证据尚不足以进入待验收

- 位置：brief.md、progress.md、construction.DONE。
- 事实：有需求来源、门禁操作及 E-7401~E-7408 机器证据；无 UI 不需
  要截图。但没有形成“原用户需求 / 人验项 / 场景操作路径 / 证据
  ID / 条件结论”的单一需求境记录，也没有可直接交用户确认的验收问
  题。

- 与口径的偏差：标准档进入待验收前的需求境硬闸尚缺人验项与可执行
  验收呈现；六轮门禁和探针可作为其中的机器证，不自动等于需求境验
  收。

- 依据：DevPlan §3.3；现有 construction.DONE 仅列机器证和移交。

## 逐点结论（上面 10 点逐条）

1. A：未达成。 函数级“写入未完成”是观察落点，不是精确停住 op；兜
   底缺少定义明确的第二负载条件，且未如实登记未钉死。

2. B：未达成。 放大量级下降是有效观察，但不是停顿红→绿；“达成（部
   分 + 登记）”仍把未满足的验收项写成达成。

3. C：指标层面达成，归因与留痕层面不完整。 六轮数据、四个一致
   skip、时长均成立；零 BL-17 签名不可由原始证据复核，且组合分支
   绿不能同时作为两张卡各自独立“已修好”的证据。DHR_71 尚未接收 E-
   7408。

4. 升级条款：未见被直接规避，但不能将测试参数调整表述为根因修复。
   现有证据并未证明必须改变 Store 语义，因此未触发“立即升高危”的
   必要条件；但 E-7404 仍出现停顿，故 Store 每 event 全量 replay
   只能是已登记的成本放大候选，不能降格为已解决的纯测试慢问题。

5. 非目标：未发现 Store/runtime/contracts/package.json 或 fake-
   herdr 改动，也未发现断言改写。 本地 origin/master 不含候选提
   交，支持“未推到该远端”；Git 静态信息不能证明从未向其他远端
   push。合并带入 DHR_71 改动，故不能把整个 4742b97..49196f8 范围
   都归为 DHR_74 自身改动。

6. 授权例外：路径总体在允许测试文件内，但逐字例外不通过。 dhr69
   的配对超时未随 poll 同倍率变化；brief 也漏同步时间参数授权，需
   以 DevPlan 修正和重核为准。

7. 措辞纪律：存在超证据措辞。 “机器证 A 达成”“机器证 B 达成”“四个
   替代解释全部排除”“DHR_71 门禁阻塞解除”“函数级已钉”均超出当前证
   据边界。条件措辞仅限制六连绿适用环境，不能修复这些前置强主张。

8. 移交与待办：大体可执行，但 C 的接收链缺口明显。 DHR_72、Store
   升级候选、环境 A/B、backlog 主控裁决均有接收方；F-7402 没有丢
   失，仍登记并要求 DHR_73 消费。DHR_71 的 E-7408 入账、最终集成
   基线与责任归属未完成。backlog 仍写 BL-17 open，和“复核后建议
   partially-resolved”不冲突，但尚未实际同步。

9. 需求境证据：部分具备，未完整具备。 E-7408 六轮和探针现场可作为
   场景机器证；仍需补一份面向用户的人验项：在何一基线执行何冻结命
   令、预期何结果、A/B 哪些仍未达成、用户应确认什么。

10. 卡序与影响面：未发现改变 71→72→73 的事实。 F-7402 的“同族概率
   高”明确为概率提示，未写成 DHR_73 根因结论；应保持为待调查输
   入，不能据此缩减 DHR_73 的 F-3516/F-3519 调查出口。

## 范围外观察

- git diff --check 4742b97..49196f8 对既有/新增证据文件报告多处
  trailing whitespace；这是工件整洁性问题，不作为本需求方向结论。

- 本轮未执行测试；所有运行结论均来自已保留的原始 stdout/JUnit 静
  态核对。

