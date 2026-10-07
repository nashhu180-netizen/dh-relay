<!-- dh:v1 -->
# 过程

- 2026-10-07：先创建 Issue #151；核 master/origin/master=9e1a6e7，再创建独立任务 worktree；登记完成条件及环境缺口后开始施工。

- 初版 watcher 19 tests PASS；安装/协议 19 tests PASS；有效单测 mutation RED(exit=1 业务断言)→精确字节恢复→GREEN(exit=0)，见 mutation.md。
- 独立代码/需求初审分别 FAIL(P1投递确认)/CHANGES_REQUIRED(HIGH通知回声)，原始报告与独立 signal 保留；教训适用路径 PASS，候选不新入册。
- decider 局部去回声方案 DECIDED 后整改：after-state 仅同步目标、其他成员保持快照；通知必须 working/seq推进/同pane；未命名成员按pane监控；watcher tests 增至24 PASS。代码/需求定向复查已派同一原 reviewer。

- 代码/需求定向复查均PASS，原FAIL保留；教训适用PASS。通知自身回声由独立decider决定after-state同步，不增排编排。
- 进入远端候选提交/PR/CI；SW6仍BLOCKED。无真实Herdr环境，不合入、不verify、不清树；不伪造 w68 状态或补跑。

- GitHub Draft PR #152：https://github.com/nashhu180-netizen/dh-relay/pull/152；初始候选commit acc1aa1f030fea27cea07469d2b7e172f3007bcd 已push，Actions触发。报告原作者在原始报告完整字节后追加记录行，消除EOF多余空行，原失败结论保留。
- 本地完整回归在整改前已启动，不能单独当成整改后精确候选的全量证据；整改后24 watcher tests、19 install tests通过，最终完整版本以该PR最新head的Actions为准。
- 停止与交接：待SW6真实Herdr管理pane实跑；命令 python3 tools/relay-light/space_watch.py --workspace <实际space ID> --notify <实际编排名> --self <实际watcher名>，不能猜编排名/伪造HERDR_ENV。进入该会话后先核身份与现役get字段，不改旧w68历史报告，不盲目重发未知通知。SW6关闭前PR保持Draft，Issue保持open，master未改，任务树保留。

- 本地初始全量Python回归313 tests / 813.253s / OK。最终候选相关测试43 tests / 0.875s / OK；完整最终head等待Actions，初始本地全量不能代替最终精确候选CI。
- 同步AGENTS single-task watcher单句，解决入口只列wait/get/read与新脚本职责冲突；先补登记允许路径，再改摘要，不扩大watcher写权或通知权限。

- 仓级PowerShell回归：RELAY ALL PASS (SKIPPED: 1)。该启动在整改前，运行尾部读取到了已整改文档/安装器；最终整包版本仍以最新head CI为准。入口摘要独立review-entry-sync.md PASS，未增加watcher写权。
