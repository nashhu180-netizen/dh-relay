# adapter-codex — Codex 主控侧适配层

> relay-light 协议核心见同目录 `SKILL.md`。本文件只冻结 Codex 侧的命令模板、拉起写法与等待纪律；协议语义一律以 `SKILL.md` 为准。

`<RELAY_LOG>` 指 dh-relay 仓 `tools/relay-light/relay_log.py` 的绝对路径。

## 身份与配置目录

本侧默认安装副本 = `~/.codex/skills/relay-light/`。**每一个** `relay_log.py add/status/lint` 调用都显式带本侧 `--config-dir`（HC-RL-A136）；不带时五情形解析可能撞上双侧歧义退出 3。

## 账本命令模板

### Windows（`python`）

```powershell
python <RELAY_LOG> add --plan <plan_dir> --node <n> --event <e> --agent <a> --note "<t>" --config-dir ~/.codex/skills/relay-light/
python <RELAY_LOG> status --plan <plan_dir> --json --config-dir ~/.codex/skills/relay-light/
python <RELAY_LOG> lint --plan <plan_dir> --config-dir ~/.codex/skills/relay-light/
```

### Linux（`python3`）

```bash
python3 <RELAY_LOG> add --plan <plan_dir> --node <n> --event <e> --agent <a> --note "<t>" --config-dir ~/.codex/skills/relay-light/
python3 <RELAY_LOG> status --plan <plan_dir> --json --config-dir ~/.codex/skills/relay-light/
python3 <RELAY_LOG> lint --plan <plan_dir> --config-dir ~/.codex/skills/relay-light/
```

### 远程（`bash -lc`）

```bash
bash -lc "python3 <RELAY_LOG> status --plan <plan_dir> --json --config-dir ~/.codex/skills/relay-light/"
```

## agent 拉起

- 开 pane：`herdr pane split --current --direction right --cwd <任务 worktree> --no-focus`；第二次 `split` 显式传目标 pane，不要用 `--current`。
- **codex kind**：`herdr agent start <名> --kind codex --pane <pane_id>` 直接可用；复核只读形态尾部加 `-- --sandbox read-only`。
- **claude kind**（需要拉 claude 角色时同样适用）：`agent start --kind claude` 会撞 PATH 里无扩展名的 shim，必须经 shell 起再改名：
  ```powershell
  herdr pane run <pane_id> "claude --permission-mode acceptEdits"
  herdr agent rename <pane_id> <名>
  ```
- 角色 → 发起方式查 `roles.toml`，本文件不写死模型。

## 派活 prompt 模板（监工 → agent）

```text
[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>
读：<repo>/AGENTS.md → <任务工作区>/brief.md、task_plan.md、progress.md、findings.md
边界：<本节点 allowed-paths 一句话>
硬规则：你是 worker 不是主控；不拉终端不派活；卡住写 blocked 信号不憋死；
凭据/密钥值永不写进 note、progress、findings、decision 或任何工件与账本。
完成：按节点要求写产出 → 打小结 → 按任务工作区约定写完成信号即停；relay-light 无 node_closed，worker 完成即停、不等下一节点。
```

## 拉起监工 / 编排 的 prompt 片段

编排拉起监工、人拉起编排时，派单文案必须原样含等待硬规则：

```text
硬规则：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；watch 未实现时不得结束回合空等。
```

## 等待与接收者（硬规则）

`herdr agent wait` 是阻塞式 CLI、不是推送——**返回那一刻必须有接收者**，没人听信号就丢。三种满足方式：

1. **watch 推送**（设计已冻结、尚未实现；实现后由它唤醒监听者，收到 `[relay-light] tick` 对账）
2. **前台阻塞循环**：`herdr agent wait <agent> --timeout 1200000`（自带 20 分钟节拍）；返回后按状态分路——`blocked` → 账本记 `blocked` 走升级链；`done`/`idle` → **先读产出判断是否合格**，合格才写账本的 `done`
3. **后台挂起唤醒**（仅 Claude Code 侧 `run_in_background` 适用；Codex 侧无对应机制，不用）

watch 未实现前 Codex 侧**一律走方式 2 前台阻塞循环**，不得结束回合空等。`agent wait --until blocked` 只作可选模式，不是默认。

## stalled 处置

`herdr agent prompt` 发出后必须验证「真提交」：`herdr agent get <名>` 看 `state_change_seq` 是否变化、`status` 是否转 `working`。codex TUI 下长中文 prompt 可能停在输入框未提交（herdr 报 `agent_prompt_stalled` 或 seq 不动）——补一发 `herdr agent send-keys <名> enter`，再 `agent get` 复验，没动就再补；注意一发 enter 可能被吃成多行换行。终极判据 = `herdr agent read` 看输入框已清空。输入通道整体冻结时**别纠缠**：该实例弃用（账本记 `agent_lost`），开新 pane 拉 fresh 实例续派。

## 红线

- 凭据 / 密钥值永不进 prompt、note、工件、账本（A27）。
- 不硬编码模型名；角色 → 发起方式查 `roles.toml`（A132）。
- 本 adapter 只描述 Codex 侧；另一侧见 `adapter-claude-code.md`。
