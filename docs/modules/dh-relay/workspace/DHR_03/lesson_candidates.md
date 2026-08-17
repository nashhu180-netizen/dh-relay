<!-- lesson_candidates.md — 教训候选。🟢 收尾顺手记。AI 起草、人裁决。 -->
# lesson_candidates — DHR_03 接真实可见 psmux 并完成阻塞接力 dogfood

## 教训候选

| ID | 一句话教训 | 状态 |
|----|-----------|------|
| L-001 | tmux 兼容品（psmux）对"精确目标"语法可能静默不兼容（`-t =name` kill 无效却 exit 0）——写 adapter 前先用 5 分钟原语实测把"成功退出码≠真的做了"这类坑逮出来，并把它写成离线套件的 argv 断言，而不是信 man page | ready-for-review |

| L-002 | PowerShell 函数参数名不得撞自动变量（`$Args`/`$Input`/`$PID`/`$Host`…）——`[string[]]$Args` 让所有子进程调用静默变成无参执行，症状是"命令都成功但什么都没发生"；DHR_02 `$pid` 之后第二次踩（F-007） | ready-for-review |

| L-003 | 终端后端 preflight 的判据要写成「能区分对错」的强断言：批0 P4 只断言 probe ∈ {running, idle} 让 `window_activity` 不更新这个真实缺口漏网（F-009），到真实套件才红——判据设计时问一句"如果后端根本不干活，这条还会 pass 吗" | ready-for-review |

| L-004 | GetNewClosure 闭包在自身模块作用域解析函数名：给闭包用的辅助函数必须在脚本/全局作用域点源，函数体内点源在闭包被调用时不可见（F-011）；同理，闭包**内部**再 `.GetNewClosure()` 的嵌套闭包看不到外层闭包捕获的变量（复核返工时 `$exec` 变 null）——需要复用的清理逻辑写成脚本级函数、显式传参 | ready-for-review |

| L-005 | 多阶段拉起的失败分支清理要按"资源已创建的时刻"逐条对表：阶段1 客户端进程已起、会话未现时超时/失败，两条 return 都漏了 kill 与停进程（R2-01/R1 附注A），而阶段2/3 全有——单看每条 return 都"合理"，只有列一张〈已创建资源 × 失败分支〉表才看得出漏洞 | ready-for-review |

| L-006 | 进仓证据里的枚举类文件（可见窗口标题、进程列表、环境变量）先按白名单过滤再落盘：windows.txt 全量记录把用户微信/邮箱/笔记等窗口标题带进 evidence（R1-05），凭据扫描零命中≠隐私面干净；整屏截图更甚——RELAY 窗口之外把用户其他终端内容整页拍进仓（F-024·两轮复核都没看图内容）；事后只能清洗 22 份 txt、删 38 份 PNG 重取，并靠 squash 合入不带历史。规矩：进仓截图只拍目标窗口（PrintWindow），复核清单加一条"打开图看内容" | ready-for-review |

> 状态流：`ready-for-review`（AI 觉得可能重要）→ 人裁决 →`needs-promotion / promoted / rejected`
