<!-- dh:v1 -->
# 过程

- 2026-10-07：先创建 Issue #151；核 master/origin/master=9e1a6e7，再创建独立任务 worktree；登记完成条件及环境缺口后开始施工。

- 初版 watcher 19 tests PASS；安装/协议 19 tests PASS；有效单测 mutation RED(exit=1 业务断言)→精确字节恢复→GREEN(exit=0)，见 mutation.md。
- 独立代码/需求初审分别 FAIL(P1投递确认)/CHANGES_REQUIRED(HIGH通知回声)，原始报告与独立 signal 保留；教训适用路径 PASS，候选不新入册。
- decider 局部去回声方案 DECIDED 后整改：after-state 仅同步目标、其他成员保持快照；通知必须 working/seq推进/同pane；未命名成员按pane监控；watcher tests 增至24 PASS。代码/需求定向复查已派同一原 reviewer。

- 代码/需求定向复查均PASS，原FAIL保留；教训适用PASS。通知自身回声由独立decider决定after-state同步，不增排编排。
- 进入远端候选提交/PR/CI；SW6仍BLOCKED。无真实Herdr环境，不合入、不verify、不清树；不伪造 w68 状态或补跑。
