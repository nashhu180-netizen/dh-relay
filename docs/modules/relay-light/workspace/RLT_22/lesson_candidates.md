<!-- dh:v1 · lesson_candidates.md — 教训候选。🟢 收尾顺手记。AI 起草、人裁决。 -->
# lesson_candidates — RLT_22

> **建工作区期不预判教训。** 本文件在 D 开工时只留占位与写法说明；任何候选必须有**施工/复核现场的具体证据**才可追加，不得在开工时把「预计会踩的坑」包装成教训。
> 已知的合同冲突、范围外事实与风险一律先进 `findings.md`，**不在本文件重复包装**（沿 RLT_10 先例）。教训候选与 finding 的分界：finding 记「这一次发生了什么、怎么处置」，教训候选记「下一次别人怎么才能不重犯的可复用规则」。
> 收口时由 normal Recipe 的教训路复核；若全程确无候选，须形成**可核查的 N/A**（写明库版本=在册条目数 + 「无候选」或「无重犯」），不得空过。

## 候选

| ID | 触发现场（证据 E-ID / 文件:行） | 可复用规则候选 | 状态 |
|---|---|---|---|
| C-1 | progress.md E-003：A145 首版把**所有** checkpoint 拿去验 token 数，全量回归打挂既有 test_a102… 与 test_agent_launch…（两例的 note 均无 ready token） | 条件式合同（「note 含 X 时才管 Y」）的守卫子句要与主断言同批进测试：先写「不含 X 的普通路径不受影响」的反向用例钉住射程，再写含 X 的合同用例；否则闸会无声外溢到既有路径 | ready-for-review |
| C-2 | progress.md B2 日志行 + E-007：oracle 要求「重复 agent_launch 由 A58/A49 拦、编号不是 A144」，迫使 launch 分支把 attempt/资格检查移到 trigger 前置之前 | 错误码优先级本身就是合同：新增前置闸时先问「多重违规同时在场时谁先说话」，把检查顺序连同报错码一起写进测试；只测单违规场景会在组合场景下串号 | ready-for-review |
| C-3 | progress.md B2 日志行返工 2：`ready_seq` 取值时机放在 reviewer#1 launch 之后，取到 launch 行的 seq 而非信号行 | 回指型 token（seq/编号）的取样点必须紧跟目标行写入；中间插入任何其他写账动作（哪怕被拒绝的 launch 不增行、合法的 launch 会增行）都会让变量悄悄指错行 | ready-for-review |
| C-4 | progress.md B1/B2 日志行两次「整行替换」失误（B1 行、B2 行曾被 B2/B3 新行覆盖后复原）；本会话早期 worktree「被删」误判（实为 shell cwd 漂移到子目录） | 跨多轮会话的施工：①凡相对路径操作前先 `pwd` 重锚；②对日志/表格类文件的追加写用「锚定旧行+插入新行」而非整段替换，替换完成后立即 grep 回读校验旧行仍在 | ready-for-review |
| C-5 | findings.md F-009：`[limits.on_exceed].note` 说明文字在卡面变更范围内却无任何验收咬住，直至 B3 施工才显式登记 | 卡面变更范围里有、验收清单里没有的条目（说明文字/注释类），开工盘点时当场列「无机器证清单」交编排裁决，不要等收口才暴露 | ready-for-review |

> 状态流：`ready-for-review`（AI 觉得可能重要）→ 人裁决 → `needs-promotion` / `promoted` / `rejected`。
> `needs-promotion` 不阻塞收尾，但要留在升格队列可见；升格进正式教训库是**单独的维护动作**，要人批准。relay-light 模块级 `knowledge/` 的归属见 RLT_08 F-4（归 RLT_11），本卡不建。

## 分批登记位（施工方按批追加，无候选也要写「本批无」）

- B1（trigger 四态扩集 + 送审信号写入合同）：C-1（A145 闸误伤普通 checkpoint，回归打挂后整改）
- B2（拉起前置 + 封口配对闸）：C-2（检查顺序即合同）、C-3（ready_seq 取样时机）、C-4（追加写失误与 cwd 漂移）
- B3（止损第三套投影 + 向后兼容 + 模板/adapter 同步）：C-5（无机器证条目开工盘点即登记）
