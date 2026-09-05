<!-- dh:v1 -->
# findings — DHR_76

## Open

- F-7601：A~F 尚未执行。DHR_75 专项代码未在 master，本卡仅修 Profile 前置，若真实 F 被 Herdr CLI 同步行为阻塞，留原始白名单证据，不能扩修 DHR_75。
- 权限边界：用户级 registry/config 只读；绝不输出配置原文、Receipt 凭据或完整窗口枚举。

## 恢复锚点

worktree=.dh-worktrees/DHR_76，branch=wt/DHR_76；读 brief/task_plan/progress。用户 2026-09-05 已确认 D-start 至 E10，未授权 E11。卡面是唯一合同；完成本卡后不自行推进 DHR_75/72/35。

## 施工期证据缺口（非放行结论）

- F-7602：测试 worker 初版 stop 用无效 registry，不能判别新 stopping 护栏；C 负例过短 timeout 掩盖指定错误；B 仅单次 contender/首尾 expiry；D epoch 尚未与校验 await 相连。主控已要求按真实触发整改，不把测试标题当覆盖。
- 首个测试文件在生产前建立，但没有可引用的修前断言红输出；不追认TDD已完成。后续有效生产变异须留下真实红/还原绿。
- 主控先行代码提交 7940f31 仅固定生产候选；测试、脚本与工件仍施工中，不能称候选已验收。

## 代码轮1整改

- F-76-C1-01 P1：原宽限到期伪 finish/unref 没有证明 close；5e04dd8 删除该回退。正常超时须真实 close，清理未确认时显式 reject，保持 loader fail-closed；待独立复审。
- F-76-C1-02 P2：预先校验所有 config 改变混合错误首错。5e04dd8 用共享结构/单Profile检查保持 config→alias 原顺序；待定向回归和复审。

## 真实F脚本诊断

- 首轮4f940db、次轮b4709ad不计F通过：有序Dictionary字段访问错误，以及PowerShell7.6.5默认JSON日期转DateTime导致白名单拒收日期。次轮主控只读现场已见6事件（含attempt/observation），但持久时点证据为空，不能补猜通过。
- 5e04dd8修正DateKind String、Dictionary访问和集合数组转换；check-real-f-projection.ps1已实测合法先行样本通过、后续续租倒推拒绝、detail不导出。第三轮待终态。此前两轮service/pane/fixture清理均有summary证明。

- 2026-09-05 真实F第三次未通过证据判定：Sort-Object seq -Unique 对OrderedDictionary未按键排序，导致事件投影只剩run_created。现场白名单观察到Attempt与Host事件，但不手工补造通过；修复为保留顺序和显式键表达式，新增三事件投影自测通过，待重新运行。
- C错误用例的1s/5s/1s非正式预算在当前机器提前触发清理错误；移除该覆盖，采用15s/60s/10s正式预算。epoch断言通过但清理mock API错误，修复测试后重跑；不改生产以适配测试。

## 收敛裁决（2026-09-05，仍未放行）

- F-7601/7602 的初始“未执行”已被后续 ledger 覆盖；A/B/C/D正常路径/F均有原始终态。初次测试预算和mock API错误、F投影错误保留为历史失败，不倒改为通过。
- 代码轮1两项由5e04dd8整改并通过独立复审。代码轮2在24e575f生产候选静态P0/P1/P2=0，A/B/TTL真实变异与哈希已核。
- A的golden双向fallback要求已被一致性和需求复审撤回：DHR63/DHR65/live才是此处权威。真实config可选形状缺口由3249c95补，E7651暴露绝对路径不符schema，2f198e5改为模板环境，E7653结构/首错/60s整轮4项pass。
- F-76-D-CLOSE（resolved，DHR-B-42）：用户于2026-09-05确认 decision-cleanup.md 的最小澄清。10s清理宽限耗尽仍未确认时允许 probe-close-timeout 明确失败返回，但必须标记清理未确认、不得声称无残留、不得继续启动，异常不计清理验收通过；正常路径仍须close和Windows子树清零。fresh B-42审核P0/P1/P2=0，E-7662专项pass；未签E11/verify/合入。
- DHR75专项A的2fail/B的1fail及runtime Host单项基线fail均保留原始终态；对应禁改生产与master相同。它们不被本卡绿色局部证据替代，也不触发跨卡施工。
