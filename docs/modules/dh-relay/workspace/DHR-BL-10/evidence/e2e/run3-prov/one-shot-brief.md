# DHR-BL-10 G3 provenance 复跑 · 一次性验证棒（无业务）

你是 relay worker（provenance 复跑第3棒）。这是工具链验证任务，不是业务任务。按顺序执行以下步骤，全部完成后立即结束，不等用户回复。

1. 先读 $env:RELAY_RECEIPT 指向的 JSON 确认 node_id=A、attempt_id=1，然后照抄执行：
   pwsh -NoProfile -File "$env:RELAY_TOOL" checkpoint -Status working -Note "G3 provenance 复跑：已进场，身份校验通过"
2. 在当前目录创建文件 g3-prov.md，内容两行：第一行"DHR-BL-10 G3 provenance 复跑证据棒（zcode 第3棒）"，第二行写你观察到的当前日期。
3. 在当前目录创建纯文本 session-log.txt，记录：node_id / attempt_id / launch_id / session_id 四个值、前两步完成的确认、一句话总结。禁止出现任何密钥或 token 字样值。
4. 在当前目录创建纯文本 handoff-body.txt，内容一行："G3 provenance 复跑完成：checkpoint 与 result 均由真实 zcode 会话写出。"然后照抄执行（引号内为绝对路径原样用）：
   pwsh -NoProfile -File "$env:RELAY_TOOL" result -Status succeeded -Summary "G3 provenance rerun succeeded by zcode baton-3" -NextAction none -HandoffBody "C:\Users\nash\AppData\Local\Temp\relay-zcode-e2e-prov-abbfaa4d43ec4f9a898e20d7c251fbc7\work\handoff-body.txt" -TailFrom "C:\Users\nash\AppData\Local\Temp\relay-zcode-e2e-prov-abbfaa4d43ec4f9a898e20d7c251fbc7\work\session-log.txt" -ChangedPaths "C:\Users\nash\AppData\Local\Temp\relay-zcode-e2e-prov-abbfaa4d43ec4f9a898e20d7c251fbc7\work\g3-prov.md"

约束：不派活、不起 watcher、不改 Runner 状态文件；若某一步无法完成，把原因写进 session-log.txt 后改用 -Status decision_required 交棒并结束。任何文件与命令参数中不得出现密钥。