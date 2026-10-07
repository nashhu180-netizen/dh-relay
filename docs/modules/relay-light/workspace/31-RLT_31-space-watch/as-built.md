# RLT_31 实现快照（候选、尚未实跑验收）

入口：space_watch.py --workspace <Herdr ID> --notify <编排名> [--self <watcher名>]；默认120秒。只依赖stdlib和PATH herdr，需真实 HERDR_ENV=1；RELAY_RECEIPT 存在即拒绝。自身份从自己的pane定位，指定self也与pane比对。

每轮全局 list 后按 workspace_id 精确筛选，成员 get 使用 pane_id，agent 为类型不参与身份判定；只有自身排除。首成功快照建基线；内存字典比较status、seq、pane、新增/离开。通知前后核同pane、seq推进、working与CLI --wait；极快结束、停滞或超时报未确认。内部notify成员只同步确认after-state避免回声；其它成员保持旧快照，因此投递期间其它成员变化下轮仍报。目标投递期间自己的事件仅提供聚合观察，无事件因果归因保证。

所有失败非零退出，保留已发生事件的白名单UNCONFIRMED提示而不盲目重发；无文件日志/快照、不读终端正文、不发按键/Enter。watcher仅维护该子进程并查PID/退出码；通知不参与节点放行。

安装器将原有五份skill文本与脚本同源复制到两用户级skill目录，所有文件逐一sha256回读；本卡仅在临时home验证，未更改现役副本。完整relay/ledger/Runner不改。
