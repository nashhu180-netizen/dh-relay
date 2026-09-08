<!-- dh:v1 -->
# DHR-B-53 · startup 提交屏障 B-adjust 交叉审核记录

> 候选对象：`dev_plan/drafts/DHR-B-53-startup提交屏障-候选.md`。用户已完成理解与确认，DHR_82 已获 D-start；本记录仍不构成真实 Agent、verify、合并、push 或部署授权。

<a id="review-b53"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-53 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind="review" -->

## 方案形成前的过度设计裁决

- 由 Herdr 右侧 fresh Claude 会话 `opus_review` 只读核对现役 sender/driver、DHR_35 证据、design/15 与 DHR_78 测试。
- 启动命令指定 `--model opus --permission-mode plan`，界面显示 `Opus 5`；SessionStart hook 自报 `claude-fable-5-1[1m]`，两源矛盾，按仓内既有规则登记“形态待证”，不择一宣称。
- 裁决为 `MIXED`：删除 composer 检查、自动 Enter、通用 delivery 状态机、`--wait`、第三发和 runner 可读性联动；保留 startup 私有 turn-start 屏障。代码难度初判中低，流程风险 heavy。
- 最小建议：同 host 的 seq 前进才进入既有 accepted/60 秒计时；不可证时保守停止自动补发、写 Attention；不改 Store/schema/contracts/Receipt/Result。

## fresh-context B 候选审核

- reviewer：Herdr fresh pane `b53_review`，未参与候选起草；`plan` 权限模式，只读，未改文件或提交。
- 形态证据：启动命令指定 `--model opus --permission-mode plan`；界面显示 `Claude Code v2.1.263 / Opus 5 with high effort / Claude Max`。这是本机界面证据，不冒充服务端权威模型证明。
- 初审结论：`ADJUST`；P0=0，P1=6，另有一条共享发送归属 P2。方向、无需 A-full、标准/heavy、Luna max 均成立；难度应由“中低”改“中”。

### 方案问题、裁决与整改

| ID | 级别 | finding | 主控裁决与改动 | 定向复审 |
|---|---|---|---|---|
| P1-1 | P1 | 新专项若不加入 `package.json` 既有 test script，默认套件不会执行。 | 采纳；允许路径加入 `package.json`，严格限追加新专项。 | CLOSED |
| P1-2 | P1 | “恰一条 Attention”会与既有 `E_EXECUTOR_RESULT_MISSING` 并存，按总数断言必红。 | 采纳；改为只按新 detail 前缀计屏障 Attention，既有 Attention 不变。 | CLOSED |
| P1-3 | P1 | 现役 fake seq 随 `agentGet` 调用递增，会把屏障做成假绿。 | 采纳；要求可选 seq 冻结/前进钩子、默认行为不变，并在施工账登记 fake 证据边界。 | CLOSED |
| P1-4 | P1 | `state_change_seq ?? 0` 会吞掉字段缺失，与真实 seq=0/未前进混同。 | 采纳；候选明确区分字段缺失，缺失一律不可证并写安全 detail。 | CLOSED |
| P1-5 | P1 | ambiguous 保留 `authorized` 后，该值同时表示“未调用”和“已调用未确认”，恢复措辞可能促使操作员停掉实际在工作的 Agent。 | 采纳为 design/15 A11 的保守代价；候选明示双义、恢复措辞不变，并增加恢复不重发断言。 | CLOSED |
| P1-6 | P1 | 回归清单漏掉真正守 Herdr 调用期 lease 与共享适配器的测试组。 | 采纳；补 `dhr75-host-lease-during-herdr`、`dhr76-profile-validation-lease`、`herdr-adapter`。 | CLOSED |
| P2-1 | P2 | 若直接改 `sendStartupInstruction` 语义，会影响 `sendToHerdrAgent(text)` 通用路径，并要求越界改 adapter 测试。 | 采纳；屏障限定为 startup 专用函数或 driver 组合，两个既有发送函数的调用/返回形态不变。 | CLOSED |
| P1-7 | P1 | 新 Attention 若带新 `E_*` reason 会越界修改 reason 合同。 | 采纳；只复用 `human_input_requested`、不带新 reason，差异仅在 detail 前缀。 | CLOSED |

- 第二次定向复审：上述 P2-1/P1-7 均 CLOSED；无新 P0/P1，仅有不阻塞的 P3 可读性观察（§4.2 句子偏长）。
- 审核后结论：候选无未闭合 P0/P1；task_type=heavy、难度=中、Herdr `gpt-5.6-luna` reasoning=max 匹配。

## 用户理解风险

- 屏障把“静默假 accepted”改成“送达不可证时明确停下”，不修 Herdr/Codex 的物理 Enter；若真实 Herdr 不稳定给 seq，A10 自动补发可能长期不触发。
- `authorized` 的保守双义意味着恢复提示可能要求操作员检查并停止一个其实已经开始工作的旧 Agent；这是避免重复业务副作用的代价。

## 需要用户决定的问题

- 无新的设计决策：发送结果不明时保守停发已经由 design/15 §2、HC-SD-A11 冻结。本轮理解问题只核用户是否同意按既有保守口径落盘并开工，不重开产品语义。

<a id="understanding-b53"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-53 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind="understanding" -->

## 面向用户讲解与理解问答

- 用户先明确确认理解：不可证提交时“停止自动补发并提示人工”，且本卡不宣称修复 Herdr/Codex 的物理 Enter 问题。
- 最终确认：用户于 2026-09-08 明文回复“按此开工”。其授权范围为 DHR_82 正式落盘与通过 Herdr 派 Luna max 施工；不含真实 Agent、verify、合并、push、部署或 DHR_35。
