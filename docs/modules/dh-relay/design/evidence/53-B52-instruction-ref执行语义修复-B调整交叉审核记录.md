<!-- dh:v1 -->
# DHR-B-52 · `instruction_ref` 执行语义修复 B-adjust 交叉审核记录

> 正式对象：`dev_plan/P6-Herdr多账号执行底座-开发方案.md`。编号预检发现 `DHR-B-51` 已用于 DHR_80 收口诊断，本事件顺延为 `DHR-B-52`；范围与验收不变。本文记录候选审核、用户反馈与落盘确认，不授权 DHR_81 D-start、真实 Agent 或 DHR_35 重跑。

<a id="review-b52"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-52 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind="review" -->

## fresh-context 只读审核

- reviewer：`/root/b51_review`，fresh-context、未参与原稿；按 review brief 只读，未修改文件。
- 基线：`master@4e73175300aca6d4cdef4a3b53601b913d27c6fa`；主控核对审核期间 HEAD 未变，工作树只有本事件候选/临时 brief。
- 引用的用户需求：“保留指针、正文不复制；统一 sender 明确命令先打开并执行”。
- 独立事实：现役 `startup-dispatch.mjs:25-30` 只有指针与提交命令，未写打开、执行及顺序；DHR_35 F-3529/E-3573 只证明 accepted/send_count=1、外围 prompt=0、46 checkpoint 后 `wrapper_invoked=false` 与 committed failed，不能猜成未读或已读未执行。

### 方案问题

P0=0、P1=0、P2=0、P3=0。审核确认 A13~A15 归 DHR_81、A16/H4 归 DHR_35 的分账诚实；最小生产/测试路径足够；标准/heavy 分类合理；`DHR_78（完成）→DHR_81→DHR_35` 无环，且没有把依赖偷换成 D-start 或真实运行授权。

### 用户理解风险

无 finding。需向用户明确区分两步：DHR_81 只让唯一 sender 把“先读并执行文件”说清楚；DHR_35 才用真实 Codex/Claude 证明文件任务确实执行后再提交。fake 绿不能替代真实 task side effect 或 P6-M1。

### 需要用户决定的问题

无新的产品/技术取舍。审核建议在理解问答后，仅请求是否把本 B-adjust 写入正式 P6 DevPlan；不得自动推导施工或运行授权。

<a id="understanding-b52"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-52 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind="understanding" -->

## 面向用户讲解与理解问答

- 全局地图：正式 design/15 是输入；DHR_81 修改固定启动包络并用 fake/快照验证；DHR_35 在新 committed SHA 上用真实 Codex/Claude 验证任务副作用与 committed success；结果分别保存在各自 workspace 证据账。
- 行为承诺：任务正文仍只在指针文件；唯一 sender 明确命令 Agent 打开、执行、最后提交。失败按既有错误面上报，不新增产品分支或协议。
- 独立验证：DHR_81 的静态/fixture 只证明话说清楚且旧发送合同不退化；DHR_35 的 `wrapper_invoked=true` 早于 succeeded Ack 才证明真实执行。
- 失败发现与处置：DHR_81 测试不绿则不收口；真实 Agent 未产生 task side effect 时，无论是否有 checkpoint/Result，都保持 P6-M1 不通过并保存脱敏事实。
- 主控曾提出“fake 绿但真实副作用仍缺失时如何判定”的问题；用户明确反馈“这些问题毫无价值”。主控采纳：该问题只复述既定证据边界，不形成真实取舍，不作为确认闸，也不再制造同类理解题。
- 用户随后明文“写入”，确认把本 B-adjust 写入正式 P6 DevPlan。授权仅含计划与审核证据落盘；不含 DHR_81 D-start、生产代码、真实 Agent、DHR_35 重跑、verify、合并、推送或部署。
