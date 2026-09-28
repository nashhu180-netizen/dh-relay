# findings — RLT_27

## F-001 · 收口检查器适用范围问题（暂缓）

- 状态：遗留→本文件 F-001（用户已确认暂缓，2026-09-20）；不继续优化，不新开检查器开发任务。
- 用户原话：“问题记录下，但先不继续优化了”。
- 已证事实：RLT_27 的 task_type 解析为 light，但 `dev-harness/tools/dh-check.mjs` 的 R11 调用 `reviewConcluded` 时只传 policyActive；`tools/dh-core.mjs` 的旧分支仍要求两名代码复核者，未按冻结 light 配方判断。
- 另一个阻塞：`tools/codex-verify-guard.mjs` 只提取模块 slug，运行整个模块的 dh-check；`tools/hooks/commit-msg` 也按模块检查。因此旧任务档案缺项会阻塞本次 verify。这是当前明写的检查范围，改成任务级需要单独规则确认，不直接当作小 bug 放宽。
- 复现入口：在 dev-harness 仓用现有 parseTaskType 读取本仓 DevPlan 的 RLT_27，结果 ok=true/type=light；reviewConcluded(review, {policyActive:false}) 为 false。真实 verify 尝试被 PreToolUse 拒绝，详情见 progress 的当前停止点。
- 影响：最小 Linux Codex 试跑已通过、PR #53 已合入、Issue #52 已关闭；无 verify SHA，正式销户/删树未执行。本问题不作为受控实战前置，不表示整个模块检查已通过。
- 恢复条件：只有用户以后明确重启此项才处理；届时先确认任务级检查与模块公共硬闸边界，再补 light/normal/heavy/legacy 及“当前任务缺证据必须拦截”的回归测试。不得禁用钩子、改提交入口绕过、伪造复核或顺带修旧冻结任务。
- 保留：两端任务树、分支、运行证据和清理前备份；本次只记问题，不改 dev-harness 代码、不继续版本收口。

- 已知：normal/heavy 配置与宪章不一致，RLT_25/A12 冻结；本次 light=lesson+consistency 双方一致，结果不可外推 normal/heavy。
- 已知：RLT_26 文档同步未复核，不使用其补丁；当前源 SKILL 的 lint --json/计数/stage_result 旧说明以已实现程序与当前冻结设计核实，不能隐瞒文档滞后。
- 已知：历史 Linux bwrap 失败不证明本次仍失败；权限故障先记实际失败，不无条件 bypass，不伪造 HERDR_ENV。
