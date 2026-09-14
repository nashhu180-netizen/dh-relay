<!-- dh:v1 -->
# lesson_candidates — RLT_09

> W 阶段不预判教训；仅在施工/复核出现可核查现场且可复用时追加，并记录证据与去重结论。

## 候选

| ID | 触发现场 | 可复用规则候选 | 证据 / 去重 | 状态 |
|---|---|---|---|---|

B1：本批无新增教训候选。

| L-B2-01 | lint 断言编号依赖「违规检查触发顺序」：多违规 fixture 只验证最先触发的规则，放宽其中一条会让断言漂到下一个先触发规则 | 放宽 lint 规则前先全仓 grep 该规则编号的断言，对每个 fixture 重新评估其实际首触发规则；新正例必须满足其余全部规则、只保留目标变量差异 | B2 两处 fixture 收窄（A129→A89）与 `test_a120_keeps_four_hard_constraints` 四反例 | 候选 |
| L-B3-01 | 验收条款先于实现满足时无 RED 可跑：伪称「实现前失败」造假证据 | 用「断言变异红」替代——先把期望改成未发生的行为跑失败证明测试咬合，再改回正确期望跑绿，并在证据里如实标注实现零改动 | B3 A121：变异断言期待 `DHR_90:F#1` 失败、实际为 X#2；`relay_log.py` 零 diff | 候选 |
| L-B4-01 | 施工前先查冻结静态源码守卫：直觉上的「临时文件+原子 rename」恰被 `test_static_forbidden_primitive_and_pane_guards` 的禁表（tempfile/mkstemp/os.replace/os.rename/shutil.move）封死 | 实现选型前 grep 该守卫的禁表；受限环境下用 O_EXCL 顺序号分配 + unlink-重建恢复 + 事后重采样验证替代原子 rename；探针摸不到子进程时用 in-process main(argv) 注入口 | B4 全量回归曾三红灯（tempfile/mkstemp/os.replace 命中禁表），改写后复绿；m4 双采样腿 in-process 化 | 候选 |
| L-B5-01 | 验证 CLI 非 ASCII 输出合同：text=True 捕获会在父进程解码掩盖子进程编码错误 | 用 bytes 捕获 + 显式 UTF-8 解码断言；env 白名单剔除 PYTHONUTF8/PYTHONIOENCODING 后单独注入目标编码，并保留一条 utf-8 环境 fixture sanity 腿证明不是 fixture 本身坏 | B5 RelayCliEncodingTests：RED 八腿 UnicodeEncodeError:'charmap'、GREEN 全绿 | 候选 |
| L-R-01 | 给业务仓做改动集守门/取证时，初版方案用临时 `GIT_INDEX_FILE` + `git add -A`/`write-tree` 取 before/after tree 差：会把含敏感 untracked 的内容写进真实 object database（普通 status/diff 观测不到），且 tree blob 经 clean/EOL filter 不等于工作树原始 bytes，无法支撑按原值恢复 | 禁止经会写业务仓 object database 的 Git plumbing 造快照；用仓外受限目录（0700/0600）保存工作树原始状态元组 `(kind, sha256, mode, symlink_target)`，并以 object database 递归指纹 + `count-objects -v` 双证零污染 | review.plan.md P1-02 + W3 复审 + W4 闭合（`0898ab9`）；B4 实现即按此落地；去重：与候选-25「返工根因翻新→换路线」邻接——本条是该教训在本卡的具体技术结论 | 候选 |
| L-R-02 | 冻结 oracle 条款互斥（§4.5.2 要求 planner-amend 写方案文件 vs A122 三类闭集）或字面不可执行（撞另一冻结规则）时，代码层没有「保守实现」可选，扩 fixture 冒充逐字满足是造假 | 闭合路径 = findings 登记 → decide 出带授权代价的选项表 → 用户点选 → 最小 A-adjust（验收 ID 不增/不删/不改号）→ 同步下游引用 → 重审后再施工 | F-001 + review.plan.md P1-01/P1-03 → `decision.1` → `evidence/08` 完整工件链；去重：与 RLT_10 LC-2（oracle↔allowed-paths）、RLT_05 L-003（plan↔design 漂移不选边）邻接——本条覆盖 oracle↔oracle 互斥形态 | 候选 |
