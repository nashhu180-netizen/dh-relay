# phase=e2-code-review · E2 code reviewer — 整卡代码终审

先读同目录 `README.md`。你是 **fresh** 复核者，未参与本卡任何施工、批审或 workflow-final。只读（除自己的 review 文件与 signal），不提交，不改代码，不启动 agent，做完即停。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`。RELAY_RECEIPT preflight。

## 对象
`git diff 5ab3bba...HEAD -- tools/`（relay_log.py、test_relay_log.py、两个 adapter、SKILL.md）——以**最终代码**为准做一次完整代码评审；workspace 工件仅作背景（workflow-final 五路结论可读，但不得照抄其结论代替自己核查）。

## 判
正确性（watch 线程/重挂/去重/tick/两层退出/运行期重读/退出码/重启循环停止集/异常屏障/utf-8 解码）、A101 只通知不写账、测试有效性（能否在实现被破坏时失败）、跨平台（Windows 编码、进程、adapter 命令）、adapter 命令与实现参数逐字一致、安全（命令注入、路径/名字未转义进入 pgrep/PowerShell 模式）、回归（全量两条自己复跑一次并登记）。

## 产出
`workspace/RLT_18/review.e2-code-review.attempt-1.md`：`## 结论 PASS|FAIL`（任一 open P0/P1 即 FAIL）、`## 发现`（ID / 级别 / 文件:行 / 事实 / 建议）、`## 核查范围与方法`（含回归命令、用例数、退出码）。
signal `workspace/RLT_18/DONE.e2-code-review.attempt-1.md`：`DONE task=RLT_18 phase=e2-code-review agent=e2-reviewer#1 batch=na path=code_review review_round=1 remediation_count=0 verdict=PASS|FAIL evidence=docs/modules/relay-light/workspace/RLT_18/review.e2-code-review.attempt-1.md`
若 FAIL：orchestrator 派返工后会由**你本人（同一 session）**做 targeted attempt 2，只核 open P0/P1 是否闭合，产出 `review.e2-code-review.attempt-2.md` 与 `DONE.e2-code-review.attempt-2.md`。
