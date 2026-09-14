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
