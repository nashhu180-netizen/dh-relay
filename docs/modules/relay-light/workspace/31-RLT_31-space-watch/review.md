<!-- dh:v1 -->
# RLT_31 验收与复核（待真实环境）

授权见 brief.md；状态：本地候选复核收敛，未全验收、未verify、未合入。人验栏为空，SW6 是机器环境证据缺口，不能用 H=0 自动放行。

| ID | 命题/证明路径 | 版本/环境与独立 oracle | 覆盖态/实际结果 |
|---|---|---|---|
| SW1 | 全workspace动态发现，仅排自身；外部目标不纳入 | test_space_watch 状态fixture、未命名pane测试 | 等价本地证明PASS；真实字段SW6待核 |
| SW2 | status/seq与成员变化机械通知、无变化静默 | 24 watcher tests、mutation.md业务断言；原HIGH与复查记录 | 本地PASS；目标通知窗口内只聚合观察、无逐事件归因 |
| SW3 | 确认投递、失败不消费、不Enter | subprocess注入、seq前进但非working拒绝、pending事件；原P1与复查 | 本地PASS；真实通知SW6待核 |
| SW4 | 三份协议/两派单模板/安装器同源 | 19 install/protocol tests，临时home复制哈希 | PASS；未发布/安装现役skill |
| SW5 | 环境/receipt failclosed、零文件写入、复核/CI | 24 watcher tests、下表三路；完整CI待PR | 部分完成：本地安全闸PASS，CI待确认 |
| SW6 | 真实Herdr状态变化与通知送达 | 需Herdr管理pane；当前HERDR_ENV缺失 | 未覆盖/BLOCKED；不得以mock/CI替代 |

## 独立复核（normal三路）

| 路径 | 独立实例 | 原结论 | 最终结论/证据 |
|---|---|---|---|
| code-round1 | /root/rlt31_code_review | FAIL，P1-01 | PASS，review-code-recheck.md及独立signal |
| requirement | /root/rlt31_requirement_review | CHANGES_REQUIRED，同space回声HIGH | PASS，review-requirement-recheck.md及独立signal |
| lesson | /root/rlt31_lesson_review | PASS | 适用PASS，review-lesson.md；findings F-006拒绝路径N/A建议，候选只去重不入册 |

决策来源：独立 /root/rlt31_decision 的 decision-notify-echo.md（DECIDED，仅局部after-state基线）。原FAIL报告/signal完整保留，没有覆盖或将PASS冒充真实环境证据。

## 尚未闭合的放行条件

SW6、完整必需CI、实际合入态复验与verify。主会话不得对自己的实现作独立复核；此表只汇总独立报告与实际测试。当前不进入已完成/不关闭Issue、不清理任务树。
