# RLT_27 施工步骤

1. 入口核对：cwd/branch/HEAD、AGENTS、brief、relay plan 与专用 config；git rebase master 若祖先已包含则明确 no-op，禁止 autostash/清理。不得回头加载 dev-harness 扩流程。
2. W：builder 只在 evidence/builder.md 写合同/文件边界核对；七件套由主会话预建，builder 验证即可。独立 plan-reviewer 审合同后 PASS 才封口。
3. C：coder 写 linux-codex-usage.md（实际路径、启动/等待办法、已知限制、哪些能力未验证），可用确定性只读命令核实。checker 独立核对文档与真实环境，不臆测端到端通过。scribe 记本阶段事实。
4. R：lesson 与 consistency 两个 fresh Codex 分别审只读材料，各写自身 review；scribe 汇总。R 阶段任一路 FAIL 则记录真实阻塞并停止交主会话，不回送已退场的 C 阶段 coder，不自动建立 X 或改计划。W/C 中同节点送审失败才由同一 live 送审/判定方 checkpoint 往返。
5. F：scribe 收拢 status/lint/各工件与前置测试证据，给 review.md 机器证与人验展示。只生成备料，不 commit/verify/清理。不把 agent idle/done 当实际产出或自然完成，须读文件和完成信号。

生产代码和安装副本禁改。各 worker 仅写派单列出的文件；coder 写 findings/lesson_candidates，scribe 写 progress，reviewer 各写自己的 review 文件。主会话保留先行环境取证与计划落户权。
