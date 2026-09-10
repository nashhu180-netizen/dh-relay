<!-- dh:v1 -->
# RLT_03 · heavy Recipe lessons 独立复核（Sol）

## 复核身份

| 项 | 实测 |
|---|---|
| review_path_id | `lessons` |
| 角色 | heavy Recipe lessons 独立复核 worker；非主控、非施工者 |
| pane / session | `w15:pD` / `kpi-agg` |
| Codex session | `01a08a6f-9b1d-7d41-b261-b04e675deeb8` |
| 实际模型配置 | `gpt-5.6-sol`，`model_reasoning_effort=medium`；由本 pane 对应 Codex 进程命令行实测，不以模型自报代替 |
| worktree | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc` |
| 施工提交 | `b7f4ecc`；当前两条 Python 的 SHA-256 与该提交逐字节一致 |
| 唯一写入 | 本报告；未改代码、`review.md`、`progress.md`、`findings.md`、DevPlan，未 commit/push |

## 结论

**VERDICT=CHANGES_REQUESTED**

| 级别 | open |
|---|---:|
| P0 | 0 |
| P1 | 0 |
| P2 | 2 |
| P3 | 0 |

本卡不是 `lessons-absent`：在册候选中有 16 条命中施工/复核情境，其中 9 条出现过可核查的重蹈。大多数行为缺口已经由后续返工闭合，但 lessons 工件仍只有 `L-000` 占位，且现役负例测试仍绑定若干未冻结的 detail 文案；因此 lessons 路径不能批准。

## 命中清单

| 在册条目 | 是否重蹈 | RLT_03 证据 | 裁决 |
|---|---|---|---|
| 候选-1 · reason/分支逐项断言并用守卫兜底 | **是，后续闭合** | batch 1 初绿仍漏 A18/A90 与表尾分支；batch 4 初称矩阵闭合仍漏 A18/A69；最终以 42-ID 映射、静态守卫和定向变异补齐。见 `progress.md:35-40,62-76`、`batch-1-opus.md`、`batch-4-sol.md`。 | 历史重蹈成立；行为面已闭合，不新增同义候选。 |
| 候选-2 · 矩阵 oracle 不得来自被测数据 | 否 | 测试直接冻结事件词、状态转移正反例与 HC-ID；既有复核的反向变异能使错误实现转红，未见从生产常量反推期望的自证循环。 | 通过。 |
| 候选-6 · 边界断言必须配变异 | **是，后续闭合** | A58/A17 变异曾存活；A69 equality 精确变异也曾在 53 tests 下存活，随后补到转红。见 `batch-3-sol.md` P2-1/P2-2、`batch-4-recheck-sol.md` P2-1、`batch-4-recheck2-sol.md`。 | 重蹈成立；最终实现/测试 SHA 未再变化，闭合证据有效。 |
| 候选-10 · 文档纠错 append，历史不偷改 | 否 | 合同换号后，活动口径改为 A126/A128/A129/A130；历史 E-006 等旧号原样保留并明确作为当时事实。见 `progress.md:21-27`、`batch-4-contract-rework-recheck-opus.md`。 | 通过。 |
| 候选-11 · 补丁要巡检完整同类目标清单 | **是，后续闭合** | A69 先补 owner/resume，后又暴露 helper note 缺失、空 escalate/kind 校验漏口、同 kind 异实例 equality 缺口；同一机制连续由不同轮次补洞。见 `progress.md:16,18-20`、F-025/F-026/F-033~F-035。 | 重蹈成立；最终 decider/strategist × decision/user_decision 四路已闭合。 |
| 候选-12 · 部分证据不得写成全称闭合 | **是，后续闭合** | batch 4 曾写“16/16、43/43 全覆盖”；复核复算为 10/16 fully covered、10 个 ID partial/omitted；合同重划后又曾写“无 partial”，最终为 A128/A120 加限定。见 `progress.md:17-18,23,26`、`batch-4-sol.md`、`batch-4-contract-rework-opus.md`。 | 重蹈成立；活动收口措辞已修正，历史记录保留。 |
| 候选-25 · 根因翻新触发止损 | **是，过程层未形成显式止损记录** | A69 从 ownership → helper note → 空 escalate/kind → equality，跨至少四个根因层继续沿原补丁路线收敛；未见第二次根因翻新时的止损/换路线判断记录。 | 重蹈成立；代码现已闭合，但该过程事实必须进入任务 lessons 工件，不能只散落在 review/findings。 |
| 候选-39 · 新测试须证明被入口拾取 | 否 | 本卡权威测试入口就是显式 `python3 -m unittest tools/relay-light/test_relay_log.py -v`；计数按 12→16→23→29→39→42→46→53 留痕，每轮均直接执行该文件。 | 通过。 |
| 候选-40 · 模型身份如实登记，不作为独立性前提 | 否 | 既有 Opus 报告均把路由写成不可外部核验；本报告另由进程命令行登记 Sol/medium。fresh session 与模型自报没有混为同一事实。 | 通过。 |
| 候选-45 · 变异须命中唯一负责保护 | **是，后续闭合** | A58/A17 初始负例被 A49/A74 代杀；A88 type 变异曾被 A24 次生杀死；A69 `other#9` 曾被 kind 校验代杀。后续均改为 sole-violation fixture。 | 重蹈成立；相应精确变异最终已转红。 |
| 候选-47 · 返工清单全部分组逐项落表 | **是，后续闭合** | RLT-B-04 编号迁移代码/测试正确，但 workspace 文档组仍残留活动 A86 与 A128 “无 partial”过度宣称，fresh Opus 再提出两项 P2 才补齐。 | 重蹈成立；documentation-only recheck 已 APPROVE。 |
| 候选-49 / 候选-68 · 最终提交基线重取变异/终态证据 | 否 | 最后一次代码复核记录的 SHA 为 `e62ba2a…` / `1fbf726d…`；当前文件与提交 `b7f4ecc` 同 SHA，后续 `e4b4cd6` 只改 progress。 | 通过；此前中间态证据不被冒充为最终字节事实。 |
| 候选-61 · 负例钉 reason + 零 mutation，不钉 detail | **是，当前未闭合** | 现役测试仍精确绑定非冻结 detail，例如 `cannot read relay_plan.md`、`first line must be`、`cannot append relay_log.jsonl`、`last ledger line is not newline-terminated`（`test_relay_log.py:502,508,626,639`）；brief 只冻结错误通道/格式与 HC-ID，并未冻结这些措辞。 | 当前 P2；应改为稳定 code/退出码/零写入或状态不推进断言，detail 仅作诊断辅助。 |
| 候选-65 · reviewer 自报实际 HEAD | 否 | 每份既有 review 都登记所见 branch/HEAD；本报告亦自报当前 `e4b4cd6`，未沿用派单中的历史 SHA。 | 通过。 |
| 候选-66 · 代码纵审不能替代实现↔契约横比 | **是，后续闭合** | 多轮代码小审后，batch 4 才暴露 A73/A62、A90/A62、A88/RLT_05 allowed-paths 三组正式冲突；随后以 RLT-A-04/RLT-B-04 正式重划 owner，而非在代码里猜。 | 重蹈成立；正式合同同步后闭合。 |

## Findings

### P2-LESSONS-1 · `lesson_candidates.md` 仍是施工前占位，无法承载本卡已发生的重蹈

`lesson_candidates.md:5-8` 只有 `L-000`“待施工与复核后提炼”，状态却已写 `ready-for-review`。这与上述候选-1/-6/-11/-12/-25/-45/-47/-66 的实证不相容，也没有形成“无新候选，仅复用既有条目”的可核查 N/A。

整改要求：由有权写该工件的节点把本报告命中表回填为任务 lessons 结论；至少显式登记候选-25 的本卡重蹈，并对“是否产生新候选”给出 `no-new-candidate` 或具体候选。不得保留 `L-000` 占位后声称 lessons 已闭合。

### P2-LESSONS-2 · 负例测试仍违反候选-61，当前回归网绑定未冻结 detail 文案

`tools/relay-light/test_relay_log.py:502,508,626,639` 的正则把 detail 文字提升成测试合同；而 `brief.md` 完成条件 16 只要求 `error: <code> <message>`，其余完成条件要求稳定 HC-ID/退出码与行为。这会令合法改写诊断文案产生假红。

整改要求：保留错误前缀、稳定 code、退出码以及“未落盘/字节不变/状态不推进”等行为断言；移除对非冻结 detail 句子的精确绑定。整改后按最终提交基线复跑相关单测，并至少做一处“只改 detail、不改 code/行为”的判别探针，证明不会假红。

## lessons-absent 判定

`lessons-absent = false`。可核查依据：候选库 87 条已按标题/触发场景闭集扫描；RLT_03 命中 16 条，9 条有重蹈证据，因此不适用空 N/A。未命中条目主要属于 PowerShell、文件锁/ACL、断连重连、异步轮询、Receipt、部署产物等本卡未触及场景，不强行挂靠。

## 派出证据 E-050

| ID | 类型 | 证据 | 结果 |
|---|---|---|---|
| E-050 | lessons independent review | 规定材料全读；候选库 87 条闭集扫描；RLT_03 既有 11 份 batch review 逐轮对照；`git branch --show-current` / `git rev-parse HEAD` / `git status --short`；进程命令行模型核验；当前 Python SHA 与 `b7f4ecc` blob 对拍；现役测试 detail 断言定点 grep | `review_path_id=lessons`；命中 16、重蹈 9；P0=0/P1=0/P2=2/P3=0；`VERDICT=CHANGES_REQUESTED`；唯一写入本报告 |

本报告只给出 lessons 路径事实与级别，不代替主控验收，不代签 verify，不改其它工件。
