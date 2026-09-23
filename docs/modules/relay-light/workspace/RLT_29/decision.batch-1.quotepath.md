# RLT_29 · batch-1 allowed-path audit 路径输出裁决

- 身份：decider#1；batch=1；review_round=1；remediation_count=0。
- 授权：用户本次派单允许代执行的小型机械决策；结论 RESOLVED，解决审计命令的路径表示差异，并按用户追加规则补齐 batch PASS 后的会话清理闸。

## 问题

task_plan §6 直接按行读取 git diff/ls-files 的路径输出。Git 2.43 在 core.quotepath 未设置时将中文路径输出为带引号的八进制转义字符串，与 allowed_exact 中的原始中文路径比较，误报合法路径越界。

## 证据

- BLOCKED.batch-1.coder.md：reason=allowed_path_audit_quotepath_env。
- evidence/baseline/summary.json：B-06 exit=1，三条误报分别是 design/01、design/evidence/13、DevPlan P1，均已在 allowed_exact；diff-check exit=0。
- evidence/baseline/B-06.txt：保留原始转义路径、allowlist_exit=1、diffcheck_exit=0。
- evidence/baseline/B-06-diagnostic.txt：同一逻辑仅规范 quotepath 后 allowed-path audit: PASS，changed_count=37，diagnostic_exit=0。这是已有诊断记录，不冒充本棒或 coder 恢复后的重跑结果。

## 裁决与执行

§6 的两个 subprocess Git 调用均增加命令级 `-c core.quotepath=false`，分别用于 diff 与 ls-files；不依赖或修改机器全局 Git 配置。已搜索 task_plan 的其它复制版本：仅此一组路径枚举调用，其余批次引用 §6，统一复用修订命令。

allowed_exact、allowed_prefix、比较逻辑、真实越界的非零退出和阻断谓词全部不变；不能借路径表示修正豁免真实越界。37/37 是历史诊断时点数量，不作为未来固定路径数。

## 用户追加裁决：batch PASS 后会话清理

来源为本次后续用户明确指令；合并至 task_plan §1.1、batch 路由/前置、batch-1 SKILL 实现要求及后续真实演示证据要求，不扩代码范围。

每个 batch 仅在该批 batch reviewer 的 durable signal 为 PASS 且本批工件齐全后，由 orchestrator 对该批 coder 与 batch reviewer 各执行一次 `/clear`，并分别复验已清理，之后才可启动下一批。工件齐全包括本批交付物、验证证据、coder signal、review 产物与 reviewer durable PASS；终端 idle/done 或 coder DONE 不替代此门。FAIL/整改期间禁止 `/clear`，保持原 coder/原 reviewer session，不借清理清零整改计数。monitor 常驻、不 clear；decider 按需，不纳入每批固定 clear。清理失败或无法复验时不得启动下一批，也不盲目重复发送 `/clear`。batch-3 同样先完成本批 PASS/工件齐全/双方 clear 复验，再进入后续 workflow-final；清理不改变 durable 工件或复核结论。

本次追加时 batch-1 尚未 PASS，不得现在 clear；本 decider 未执行任何 `/clear`。真实演示须逐批展示 PASS 与齐全工件、目标 tab/session、两次分别针对 coder/reviewer 的单次操作、双方复验和下一批启动时点；FAIL/整改保留 session、monitor 未 clear 也须核查。batch-3 coder 不预造自己未来 PASS 后的清理证据，后置操作由 orchestrator 执行并在后续演示展示。

## 边界

本棒只写 task_plan.md、本裁决、DONE.decision.batch-1.quotepath.md；不改代码、baseline 原始证据/summary、review、progress、design 或 DevPlan。不派 agent、不问用户、不执行版本动作，不以裁决替代 batch 施工或复核 PASS。

B-06 原 FAIL 与诊断均保留历史，不覆盖、不改写成 PASS。本次追加仅修改 task_plan.md 与本 decision，既有 DONE 单行保持不变；不执行 clear 或启动下一批。

## coder 恢复动作

1. 从 task_plan §6 使用修订后的原样命令，固定仓根 cwd，重新审计当前 tracked/untracked 路径；另执行 git diff --check。
2. 新建 evidence/baseline/B-06-rerun-quotepath.txt 与 evidence/baseline/summary-rerun-quotepath.json，记录实际命令、cwd、时间、退出码、输出、路径数/失败项，并引用原 summary、B-06 FAIL/diagnostic 和本裁决；不覆盖旧文件。若该新文件名已存在，使用新后缀保留每次记录。
3. 后续批次及 post 比较复用 §6 相同命令，以新重跑证据为修订命令的 baseline，保留与旧记录的可追踪关系。真实越界或其它失败仍按合同 BLOCKED；只有重跑通过并满足本批其它前置门后才恢复 batch-1 工作，不跳过 review。

4. 恢复 batch-1 后将上述清理闸落实到 SKILL；FAIL/整改保持原 coder/reviewer session，只有 reviewer durable PASS 且工件齐全才交 orchestrator 各 clear 一次并复验。后续演示依 task_plan 记录真实证据，不以本裁决代替实际操作。

## 检查

本棒完成后执行 git diff --check；以工具退出码为准。coder 重跑及新证据由 coder 恢复后完成。
