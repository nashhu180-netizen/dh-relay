<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_18 watch（single-task）

> 修订日志：
> - 2026-09-23 builder#1 初稿（phase=plan，review_round=1 remediation_count=0）。
> - 2026-09-23 builder#1 整改 1（按 `review.plan.md` round 1 FAIL）：P1-1 虚拟时钟改离散事件调度器 + 多线程节拍用例（batch 1 桩与 R-A82-3/7、R-A82-12、R-A83-1）；P1-2 D11 区分超时与提前失败并加 30 秒退避（R-A82-11）；P1-3 H12 探针改为 kill 后零提示原样观察 + 「操作者介入」节，watch 死亡发现机制新增 D12 **待 decider 裁决**（本棒 BLOCKED）；P1-4 删 batch 2 adapter 第 5 项、SKILL.md:40 冲突并入 F-004；P2-1～P2-5 与 4c/7/8b 一并处理（见各处「整改 1」标注）。
> - 2026-09-24 builder#1 整改 1 续（按 `decisions.md` UD-1/UD-2 与 `decision.f007-watch-death.md` §4 B′/§6）：D12 落用户裁决 F「pane 内 shell 重启循环 + B′ 编排 tick 对账兜底」，新增 D13 退出码合同；batch 2 纳入 adapter 两层死亡处置句与 SKILL.md 三处（UD-2），补齐须同步的旧文本断言（`test_a21`「未实现」、`test_no_watch_subcommand_invoked` 反转、`test_a136` 枚举纳入 watch）；batch 3 H12 改为两段演示（kill 后自动恢复 / 关阶段级 watch pane 后编排 tick 对账发现），扮编排探针为新增实例须先过 model-allocation gate。仍为 3 批。

## 0. Zero-context 执行入口

固定仓根 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`；所有路径为仓根相对路径。每个角色先读 `AGENTS.md` → `dispatch/README.md` → 自己的 brief → 本文件对应批次。派单协议、signal schema、写者边界、Git 纪律以 `dispatch/README.md` 为准，本文件不重抄。

### 0.1 RELAY_RECEIPT preflight（每棒第一步）

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_18
env | grep -c '^RELAY_RECEIPT='   # 期望 0
```

命中（≥1）：产出型角色只写本角色精确 `BLOCKED.*.md`（`reason=relay_receipt_present`）后停止；monitor 零写入只 prompt 通知 orchestrator。不得清除任何 `RELAY_*`。

### 0.2 权威输入

- DevPlan「#### RLT_18」段（约第 644 行）、任务表 RLT_18 行、批次表第 5 批行。
- design/01（逐字为准，不改）：§3.6 watch（约 486–497）、§7.2 等待与节奏（约 894–908）、第 115/140/189/1436–1439 行、`HC-RL-A82`/`A83`/`A101`（约 1351–1353）、`HC-RL-H11`/`H12`（约 1408–1409）。
- 现行术语：`tools/relay-light/skill/SKILL.md`（stage-lead、watcher 旁路角色「`relay_log.py watch` 程序落地后由程序承担」、single-task 节）。
- 实现与桩：`tools/relay-light/relay_log.py`（`main` 子命令注册、`derive_status`/`status_document`、`read_ledger`、`TERMINAL_EVENTS`、`_runtime_plan`）；`tools/relay-light/test_relay_log.py`（`mock.patch`、临时计划目录写法、`ast` 源码守卫写法约第 940 行、`test_a21_wait_receiver_and_three_methods` 约第 6293 行）。
- Herdr 0.9.0 实测（builder 2026-09-23 只读 `--help` / `agent get`）：`herdr agent wait <T> [--until S]* [--timeout MS]`，无 `--until` 时匹配 idle/done/blocked，超时非零退出；`herdr agent get <T>` 输出单行 JSON，状态在 `result.agent.agent_status`（另有 `state_change_seq`、`name`、`pane_id`）；`herdr agent prompt <T> <TEXT>`。

## 1. 固定边界（三批共通）

1. **允许路径闭集**（越界即 FAIL）：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/references/adapter-claude-code.md`、`tools/relay-light/skill/references/adapter-codex.md`、`tools/relay-light/skill/SKILL.md`（**UD-2 限定**：仅第 40 行 watcher 表述、硬规则 8、「放弃项」中「watch 未实现」过时措辞三处，只在 batch 2 改）、`docs/modules/relay-light/workspace/RLT_18/**`（`execution_strategy.md`、`decisions.md` 除外）。每批完成判据含：
   ```bash
   git -c core.quotepath=false diff origin/master --name-only    # 仅上述路径 + orchestrator 自己的 execution_strategy.md / DevPlan 任务行
   git -c core.quotepath=false diff origin/master --stat -- docs/modules/relay-light/relay/ tools/relay-light/install_skill.py tools/relay-light/skill/roles.toml tools/relay-light/skill/dh-mapping.toml docs/modules/relay-light/design/ AGENTS.md   # 期望空
   git -c core.quotepath=false diff origin/master -U0 -- tools/relay-light/skill/SKILL.md | grep -c '^@@'   # batch 1 期望 0；batch 2 起只允许 UD-2 三处（hunk ≤3，逐 hunk 在 path-audit.txt 标注对应项）
   git status --porcelain --ignored | grep __pycache__   # plan 期（2026-09-23 builder 实测）pre-existing 集合为空 → 期望仍为空
   ```
2. **不动**：design/、AGENTS.md、SKILL.md 中 UD-2 三处以外的内容与 skill 其它文件、`install_skill.py`、`docs/modules/relay-light/relay/**`（字节不变）、as-built、用户级 skill 副本（`~/.claude/skills/relay-light/**`、`~/.codex/skills/relay-light/**`）。范围外发现只记 `findings.md`。
3. **测试纪律**：每条命令带 `PYTHONDONTWRITEBYTECODE=1`；单测一律打桩 herdr 与时钟，不调真实 `herdr`、不真 sleep；已有 `__pycache__` 不删只登记。取旧实现作基线时钉死 `5ab3bba`，先 `git cat-file -e 5ab3bba^{commit}`，缺失 `git fetch --depth=1 origin 5ab3bba`，仍失败 `self.fail` 不 skip。
4. **progress 写入**：只由当前 batch coder 在本批完成时向 `progress.md`「施工里程碑」追加**一行**、「证据账本」追加本批证据行；不记 pane/agent 状态、轮询、通知。
5. **词汇**：只用 single-task 的 plan / batch / batch-review / workflow-final / e2；W/C/R/X/F 只在「被实现的完整 relay 合同」语境出现（watch 本身服务完整 relay 的阶段/编排两层）。
6. **回归命令**（每批完成判据都要跑，输出存本批 evidence）：
   ```bash
   cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s . -p 'test_*.py' 2>&1 | tail -5; cd ../..
   PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1 2>&1 | tail -5
   ```
   前者覆盖 CI `relay-light-python` 同口径（`test_relay_log` + `test_install_skill`），期望 `OK`；后者期望 `RELAY ALL PASS`（允许与基线一致的 SKIPPED）。

## 2. 设计解读（design 歧义 · 全部「待 plan-review 确认」）

design §3.6 冻结了行为但未冻结以下机制；以下是本计划采用的解读，**不改 design**。plan-review 若判定任一条越出 design 语义，应 FAIL 回 builder 或交 decider。

| # | 歧义 | 采用解读 | 理由 / 边界 |
|---|---|---|---|
| D1 | 阶段级 vs 编排级怎么区分 | CLI 在冻结签名 `watch --plan <dir> --notify <agent>` 上加**可选** `--level stage|plan`（缺省 `stage`）与 `--config-dir`（同 add/status/lint）。不加其它必填参数。 | §3.6「编排层用同一程序、`--notify` 指向编排」——同一程序两种用途必须可区分；缺省值保持冻结签名可直接用于阶段级。 |
| D2 | watch 如何得知「本阶段」与「本阶段末节点」 | 阶段级启动时取 `derive_status(...).current_stage` 作**绑定 stage_id**（为空则 exit 2 `watch_no_open_stage`，不写任何东西）；「末节点 `node_close` 后退出」= 绑定 stage **至少有一个 active 节点且**全部 active 节点在账本均已 `node_close`（整改 1：空集不算满足，刚 `stage_start` 尚无节点时不退出，R-A83-11）（等价于 status `stages[].nodes` 全为 closed）。运行中 `plan_amend` 追加到同一 stage_id 的新节点在下一次重读时自动纳入。 | 与 status 投影同源，避免 watch 自造阶段语义。 |
| D3 | 编排级「末阶段 `stage_close`」 | 编排级盯 open stage 的 stage-lead（`monitor_launch` 行，note 带 `stage_id=`，ledger 标识 `monitor#<n>`）。**整改 1**：`status` 的 `agents[]` 只收 `agent_launch`、不含 `monitor_launch`，而 status schema 已由 A62 冻结不得扩字段，故编排级在场者**不经 status 投影、直接由 `read_ledger` 取 `monitor_launch`**——这是对 design「读 `status --json` 取在场 agent」字面的有意偏离，仅限编排级；编排级**不**对节点 worker 发通知（R-A83-10）。退出条件 = status `pending_nodes` 为空且 `open_stages` 为空且计划最后一个 stage 实例已 `stage_close`。stage-lead 的「账本终态」= 其 stage 的 `stage_close`（或同 stage 后续 `monitor_restart`/新 `monitor_launch` 使旧实例失效）。 | 编排层的在场者是 stage-lead，不是 worker；终态借用 stage 生命周期事件，不新增事件。 |
| D4 | 「在场 agent」取法 | 每 30 秒主循环重读 plan + ledger（只读 `_runtime_plan` + `read_ledger` + `derive_status`，与 `status --json` 同一投影函数，不起子进程）；阶段级在场 = 绑定 stage 内 `agents[]` 中 `last_event ∉ TERMINAL_EVENTS` 者；新出现的在场 agent 新开线程，已盯过并退出的不再重开。 | §3.6「读 `status --json` 取在场 agent」；进程内复用同一投影比 shell 调自己更可测，输出字段一致。 |
| D5 | ledger agent 标识 ↔ Herdr agent 名 | 解析顺序：① 该实例 `agent_launch`（编排级为 `monitor_launch`）note 中的 `herdr=<name>` token；② 缺省 `<名字>-<attempt>`（`#`→`-`，与 SKILL 命名规范「空间名用 `-` 不用 `#`」同向）。解析不出合法 Herdr 名（空、含空白）时该 agent 跳过并 stderr 报一行，不崩。adapter（batch 2）写明 stage-lead 记 `herdr=` token 的约定。 | design 未给映射；token 方式不改账本 schema（note 自由文本），不碰 SKILL.md。若 plan-review 认为需改 SKILL 合同，应转 findings + decider，而非本卡越界改。 |
| D6 | `--notify` 解析 | `--notify` 直接是 Herdr agent 名（例 `rlt-orch`、`p21-29-C1` 里的 stage-lead 名）；校验非空、无空白、仅 ASCII，否则 argparse 错误 exit 2。watch 不对 notify 目标做 `agent get` 预检（目标忙也要排队送达，H11 验的就是这个）。 | §3.6 `herdr agent prompt <notify> ...`。 |
| D7 | 通知文本 | 状态变化：`[relay-light] <ledger_agent> -> <state>`（ledger 标识，含 `#`，例 `[relay-light] coder#1 -> idle`）；tick：`[relay-light] tick`。发前断言 `text.isascii()` 且无换行，违者不发并 stderr 报一行（整改 1：反例用例 R-A82-13）。`<state>` 取 Herdr 返回的 `agent_status` 原值（idle/done/blocked/unknown）。 | design 原文格式；ledger 标识让接收方直接对账。 |
| D8 | 线程收敛 | 每 agent 一个 daemon 线程；阻塞 wait 用 `herdr agent wait <n> --timeout 30000` 分段挂（超时即检查 stop 事件与账本终态后再挂），使主线程置 stop 后 ≤30 秒全部线程可 join（「超时返回」与「提前失败」的区分见 D11）；退出前 join 全部线程（每个 join 超时 35 秒，超时仅 stderr 报）。进程 exit 0。 | 保持「挂 wait」语义且可收敛；30 秒与 §3.6 轮询周期同粒度。 |
| D9 | 去重口径 | 以 agent 为键记「上次已通知状态」；同一状态再次观察到（包括 30 秒 `get` 轮询看到的 settled 态、分段 wait 立即返回）一律不再发；只有观察到 `working` 后（即经历一次重挂）再返回的非 working 状态才算新转换，可再次通知（即使与上次同值）。 | 「同一 `(agent, 状态)` **转换**只通知一次」——`working→idle→working→idle` 是两次转换。plan-review 若判为「终身只一次」需改用例 R-A82-5。 |
| D10 | tick 起点与归属 | tick 自 watch 启动起每 1200 秒一次（单调时钟，主循环驱动，不是 agent 线程）；阶段级与编排级 watch 各自发各自的 tick 给各自 `--notify`；退出时不补发。 | §3.6「20 分钟兜底计时由 watch 维持」；§7.2 收 tick 跑 status + agent list 对账。 |
| D11 | herdr 失败 | 适配层返回 `(rc, stdout)`。**整改 1 区分两种 wait 非零**：① 超时返回（本次调用经虚拟/单调时钟测得耗时 ≥ timeout）→ 视为「未返回」立即重挂；② 提前非零返回（耗时 < timeout，如名字解析错、目标已关、herdr 自身报错）→ 先 `clock.sleep(30)` 再重试，**不得无间隔重挂**。`get` 非零或 JSON 不可解析 → 本轮跳过，下一次仍在 30 秒后（连续失败不加速）；`prompt` 非零 → stderr 报一行，不重试、**不标记已通知**（下一次观察可再试）。以上都不写账、不退出进程。任一 agent 线程任意 90 秒窗口内 herdr 调用（wait+get）≤ 4 次（R-A82-11）。 | 只通知不写账；失败不能伪装成已送达；design 486 的 30 秒节拍与 1437「不做秒级盯屏」禁止热循环。 |
| D12 | watch 进程死亡由谁、怎样发现（P1-3） | **已裁决**（`decisions.md` UD-1，用户 2026-09-24 选 F = 自动重启 + B′ 兜底）。三层：① **进程级**——watch 所在 pane 不直接跑 watch，而跑 shell 重启循环（D13）；进程崩溃或被杀几秒内由循环重拉，仍是 design 482「单独开一个 pane 运行」，不引入 watcher agent。② **阶段级 pane/shell 被关**——由编排收到**自己** watch 的 20 分钟 tick 做 §7.2 对账时发现：某 open stage 的 stage-lead 为 idle、该 stage 有未关节点、其 worker 已 idle/done/blocked 而账本无对应终态 → `herdr agent prompt <stage-lead> "[relay-light] stage-stalled <stage_id>"`；stage-lead 被任何 prompt 唤醒时**先核 watch 存活**（`pgrep -f 'relay_log.py watch --plan <plan_dir>'`；Windows `Get-CimInstance Win32_Process` 按 CommandLine 匹配），不在则按 D13 重拉或改前台 `herdr agent wait <agent> --timeout 1200000`。③ **编排级 watch 的 pane 被关**——如实写「无自动发现，依赖人工，按 §7.3 恢复」。完整 relay 不保留人肉 watcher agent；watch 仍只通知不写账、不做驱动器；对账与 `stage-stalled` 判定由编排（agent）按 adapter 执行，**不进 watch 程序**（程序不做停滞检测，design 1437）。 | 用户裁决；落字以 `decision.f007-watch-death.md` §6.3 B′ 草案为底，加自动重启层。 |
| D13 | 重启循环与 watch 退出码合同 | watch 退出码：正常退出（阶段级末节点关闭 / 编排级末阶段 `stage_close`）**0**；参数/计划/账本/无 open stage 等确定性错误 **2**；其余（未捕获异常、被信号杀）为其它非零。重启循环只在退出码 ∉ {0, 2} 时 `sleep 5` 后重拉，0 与 2 即结束循环（防确定性错误每 5 秒空转）。Linux：`while :; do python3 <RELAY_LOG> watch --plan <plan_dir> --notify <名> --config-dir <plan_dir>/config/; rc=$?; [ "$rc" -eq 0 ] || [ "$rc" -eq 2 ] && break; sleep 5; done`；Windows：`while ($true) { python <RELAY_LOG> watch ...; if ($LASTEXITCODE -in 0,2) { break }; Start-Sleep 5 }`。重启后去重状态与 tick 计时从零开始：已 settled 的在场 agent 可能各再收一次通知，属预期，adapter 写明「重启后可能重复一次通知，按对账处理」。 | 程序内不做自重启（保持 watch 单一职责）；循环写在 adapter，由 R-A83-8 结构断言 + R-A83-12 退出码单测共同钉住。 |

## 3. 分批

批间依赖：batch 2 依赖 batch 1 的 `watch` 子命令与适配层；batch 3 依赖 batch 2 的 adapter 与完整退出逻辑。**严格顺序执行**，前批 batch-review PASS 且 orchestrator 完成 `/clear` 闸后才开下一批。

### batch 1 — watch 核心 + A82 + A101

- **承接 HC**：`HC-RL-A82`（全部）、`HC-RL-A101`（全部）。
- **目标**：`relay_log.py watch --plan <dir> --notify <agent> [--level stage|plan] [--config-dir <d>]` 子命令可运行（阶段级完整；编排级只需参数被接受并共用主循环骨架，退出逻辑留 batch 2）；每 agent 一线程；通知→30 秒 `get` 轮询→终态退出 / working 重挂；去重；只读。
- **文件与符号**（建议命名，coder 可调整但须在 progress 注明）：
  - `relay_log.py`：`class HerdrClient`（方法 `wait(name, timeout_ms) -> str|None`、`get(name) -> str|None`、`prompt(name, text) -> bool`，内部 `subprocess.run(["herdr", ...])`，**无任何文件写入**）；`class WatchClock`（`monotonic()`、`sleep(s)`，可注入）；`def run_watch(plan_dir, notify, level, config, herdr, clock, stop_event=None) -> int`；`def _watch_agent_loop(...)`；`def _watch_present_agents(...)`；`def _watch_herdr_name(...)`（D5）；`main` 注册 `watch` 子命令。所有 watch 专属函数名以 `_watch` / `run_watch` / `HerdrClient` / `WatchClock` 为前缀，供 A101 静态检查定界。
  - `test_relay_log.py`：新 `class WatchTests(unittest.TestCase)`；桩 `FakeHerdr`（脚本化 wait/get 返回序列、记录全部调用含时刻）与 `FakeClock`。**整改 1（P1-1）：`FakeClock` 是离散事件调度器，不是「各线程自推进」**——`sleep(s)` 以「当前虚拟时刻 + s」登记唤醒时刻后在条件变量上阻塞调用线程；`monotonic()` 返回全局虚拟时刻；测试驱动方 `advance_to(t)` 先等全部已登记线程处于阻塞（静止），再按唤醒时刻（同刻按登记序）逐个放行，每放行一个都等其再次阻塞或结束（静止等待）后才放下一个；每次静止等待设墙钟上限 5 秒，超时 `self.fail` 并打印各线程栈。虚拟时刻只由 `advance_to` 推进，线程 sleep 不叠加。测试可在 `advance_to` 的时刻点之间直接改 fixture 账本（写原始 JSONL 行，见 R-A101-3）。另保留 `WatchClock` 真实实现只在 CLI 路径使用。
- **用例清单**（每条映射 oracle「怎么证明」要素；A82 oracle =「打桩 herdr：断言无立即重挂、两条退出路径、去重」，A101 oracle =「静态检查 watch 代码路径无写账调用」）：

  | ID | 用例 | 断言 | oracle 要素 |
  |---|---|---|---|
  | R-A82-1 | wait 返回 idle → 发 prompt | `prompt(notify, "[relay-light] coder#1 -> idle")` 恰一次；文本 ASCII 单行 | 通知格式（§3.6） |
  | R-A82-2 | 通知后无立即重挂 | prompt 之后、虚拟时钟推进 30 秒之前，该 agent 的 `wait` 调用计数不增；首个后续调用是 `get` 且发生在 +30s | 无立即重挂 |
  | R-A82-3 | 30 秒周期 | 连续 3 次 `get` 虚拟时刻差均为 30 秒（±0）；**≥2 agent 线程 + tick 主循环同时存在**时仍精确成立（整改 1） | 30 秒轮询 |
  | R-A82-4 | 退出路径 (a) 账本终态 | 轮询期间向 fixture 账本追加该 agent `done`（测试直接写原始 JSONL 行，不经 watch、不调 `append_event`，见 R-A101-3）→ 线程在下一次轮询后结束；此后对该 agent 无任何 herdr 调用；`done`/`agent_lost`/`cancelled` 三个终态各一子测 | 退出路径 1 |
  | R-A82-5 | 退出路径 (b) 回 working 重挂 | `get` 返回 `working` → 下一调用是 `wait`；再返回 idle → 再通知一次（D9 转换口径） | 退出路径 2 + 去重边界 |
  | R-A82-6 | 去重 | 轮询期间 `get` 连续 N 次返回 idle、以及分段 wait 立即返回 idle，prompt 总数仍为 1 | 去重 |
  | R-A82-7 | 多 agent 并发 | 两个在场 agent 各自**真线程**（`threading.enumerate()` 断言每 agent 一条 watch 线程）；各自状态独立通知，互不去重；stop 后全部线程在墙钟 5 秒内 join | 每 agent 一线程 + 收敛 |
  | R-A82-8 | 新在场 agent | 运行中账本追加第二个 `agent_launch` → 下一主循环（≤30s 虚拟）为其新开线程 | 在场 agent 取法（D4） |
  | R-A82-9 | Herdr 名解析 | `herdr=` token 优先；缺省 `coder-1`；非法名跳过并 stderr 报 | D5 |
  | R-A82-10 | prompt 失败不算已通知 | 桩 prompt 返回失败 → 下一次观察同状态会再试一次；成功后才去重 | D11 |
  | R-A82-11 | 提前失败退避（整改 1，P1-2） | 桩 `wait` 立即返回 rc≠0（虚拟耗时 0）、`get` 也失败；虚拟时钟推进 90 秒，该 agent `wait`+`get` 总调用数 ≤ 4，且无 prompt；另一子测：`wait` 虚拟耗时 = timeout 的超时返回立即重挂（无 30 秒间隔） | D11 两类区分 |
  | R-A82-12 | 多线程节拍互不叠加（整改 1，P1-1） | agent A、B 与 tick 同时存在：A 在 t=0 通知、B 在 t=10 通知；A 的 `get` 时刻恰为 30/60/90，B 恰为 40/70/100，tick 恰为 1200；任一线程的 sleep 不推迟他者 | 30 秒节拍确定性 |
  | R-A82-13 | 短 ASCII 单行反例（整改 1，P2 4c） | ledger 标识或 Herdr 状态含非 ASCII 字符 / 含换行 → 不调用 `prompt`，stderr 恰一行报错；线程不崩 | 短 ASCII 单行 |
  | R-A101-1 | 静态检查 | `ast` 解析 `relay_log.py`，收集 watch 定界函数/类（D 前缀集）的**调用闭包**（递归解析其调用的模块级函数），断言闭包内无 `append_event`、`_add_command`、`open(` 带写模式（`'a'`/`'w'`/`'x'`/`'+'`）、`.write_text`/`.write_bytes`/`os.replace`/`os.rename`/`shutil.` 写操作、`_write_json_restricted`、`_restricted_writer`；并断言闭包非空且含 `HerdrClient`/`run_watch`（防空集假绿）；**整改 1（P2 判据 7）**：另断言全模块所有 `subprocess.run`/`subprocess.Popen` 调用中，首参为以 `"herdr"` 开头的 list 字面量、或首参是变量/表达式的，都位于 `HerdrClient` 类体内（`_git_readonly` 的 git 调用首参以 `"git"` 开头，不受限） | 静态检查无写账调用 |
  | R-A101-2 | 变异自证 | 在测试内把一行 `append_event(...)` 注入 watch 函数源码副本（字符串层面，不改仓内文件）→ 同一检查函数返回违规 | 检查非恒真 |
  | R-A101-3 | 运行期旁证 | 跑完 R-A82-1～6 全流程后，fixture 目录 `relay_log.jsonl` / `relay_plan.md` 字节除测试自身追加外不变；`mock.patch.object(relay_log, "append_event")` 在 watch 运行段 `assert_not_called`。**整改 1（P2-2）**：测试侧追加终态一律**直接写原始 JSONL 行**（按 `read_ledger` 行格式，seq 递增），不调 `append_event`，故 patch 只可能记录 watch 线程的调用；R-A82-4 同此写法 | 只通知不写账 |
  | R-CLI-1 | CLI | `watch` 缺 `--plan`/`--notify` exit 2；`--notify` 含空白/非 ASCII exit 2；阶段级无 open stage exit 2 且 plan 目录零变化 | D1/D2/D6 |

- **RED 先行**：先落全部用例，在未实现时跑 `python3 -m unittest test_relay_log.WatchTests`（cwd `tools/relay-light`）应全部失败/报错（`watch` 子命令不存在 / `run_watch` 缺失），存 `evidence/batch-1/red.txt`；再实现至 GREEN。
- **完成判据**：
  ```bash
  cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests -v 2>&1 | tail -3   # OK，用例数 ≥ 17
  PYTHONDONTWRITEBYTECODE=1 python3 relay_log.py watch --help | grep -- '--notify'    # 命中
  # herdr 调用只在 HerdrClient 内：由 R-A101-1 的 AST 断言机械承担（整改 1，替代原 grep）
  ```
  外加 §1.1 路径审计与 §1.6 回归全绿；单测运行时间 < 30 秒（证明无真 sleep）。
- **证据落点**：`docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/`（`red.txt`、`green.txt`、`regression-python.txt`、`regression-pwsh.txt`、`path-audit.txt`）。
- **signal**：`DONE.batch-1.coder.md`（整改 k：`DONE.batch-1.coder.remediation-<k>.md`）。

### batch 2 — A83 + 两层退出 + adapter 改写

- **开工前置（整改 1）**：D12 已由用户裁决（UD-1）并已回写本文件——满足。
- **承接 HC**：`HC-RL-A83`（全部）；`HC-RL-A82` 编排级分支回归；UD-1 死亡处置落字；UD-2 SKILL 三处。
- **目标**：20 分钟 tick；阶段级（D2）与编排级（D3）两层退出；两个 adapter 的等待段改写为「watch 默认、无 watch 回退」并写明节拍归属与 D5 `herdr=` 约定。
- **文件与符号**：
  - `relay_log.py`：主循环 tick（D10）；`def _watch_should_exit(level, bound_stage, status) -> bool`；编排级在场者取法（D3）。
  - `test_relay_log.py`：`WatchTests` 增用例；以下三条既有断言钉着旧文本，**必须同步**（builder 2026-09-24 全量 grep 两个测试文件确认只有这三处；`test_install_skill.py` 的 SingleTaskStructureTests 不涉及 watcher/watch/「未实现」，其五文件哈希断言比的是临时 home 安装副本与仓内源，SKILL 改动不破坏）：
    - `SkillAdapterTests.test_a21_wait_receiver_and_three_methods`（约第 6293 行）：`assertIn("未实现", text)` 语义过期，替换为不弱于原意的新断言（R-A83-9），其余断言保持。
    - `SkillAdapterTests.test_no_watch_subcommand_invoked`（约第 6356 行）：现断言 adapter **不含** `relay_log.py watch`，与本批目标正相反——**反转**为断言两份 adapter 均含 `<RELAY_LOG> watch` 调用（R-A83-8 承接），测试名改为 `test_watch_subcommand_documented`；在 progress 注明「反转而非删除」。
    - `SkillAdapterTests.test_a136_every_call_carries_side_config_dir`（约第 6265 行）：枚举正则 `(?:add|status|lint)` 扩为 `(?:add|status|lint|watch)`，使 watch 调用行（含重启循环行）同样必须带 `--config-dir <plan_dir>/config/`；「三子命令各至少一次」保持并另加 watch 至少一次。
  - `adapter-claude-code.md`、`adapter-codex.md`：
    1. 「拉起 stage-lead / 编排 的 prompt 片段」硬规则句：去掉「watch 未实现时不得结束回合空等」，改为「有 watch 时允许结束回合靠 prompt 唤醒；无 watch 时不得结束回合空等」（§7.2 一句话原文）。
    2. 「等待与接收者」方式 1 改为现行：`python3 <RELAY_LOG> watch --plan <dir> --notify <自己的 Herdr 名> --config-dir <本侧 skill 目录>`（Windows 写 `python`），在当前阶段终端空间单独开一个载体位运行——**沿用本侧 adapter 既有载体约定**（claude 侧现行「一 agent 一 tab」、codex 侧现行 pane 写法；与 design 482「pane」/1440「不使用 tab」的既有偏离不是本卡引入，登记 findings F-006）；编排层 `--level plan`；收到 `[relay-light] tick` 跑 `status` 与 `herdr agent list` 对账。**整改 1 续**：调用写法统一 `--config-dir <plan_dir>/config/`（与现有 add/status/lint 行一致，满足 `test_a136`），且在 pane 里不直接跑而跑 D13 重启循环（Linux 与 Windows 两种写法都写）。
    3. 「watch 未实现前一律走方式 2/3」改为「watch 默认；watch 未启动时回退方式 2（Claude 侧可 3），此时 20 分钟节拍由前台 `herdr agent wait <agent> --timeout 1200000` 维持」，并**显式写节拍归属**：有 watch → watch 维持；无 watch → 前台 wait 维持。
    3a. **watch 死亡处置（D12，两份 adapter 同义，Claude/Codex 对称）**：
       - 进程级：「watch 所在 pane 跑重启循环（D13 两种写法）；进程崩溃或被杀几秒内自动重拉；重启后可能重复一次通知，按对账处理。」
       - stage-lead 段：「整个 watch pane 被关时本层无自动发现，由编排 tick 对账兜底（最长 20 分钟）。收到 `[relay-light] stage-stalled <stage_id>` 或任何唤醒时，先核 watch 存活（`pgrep -f 'relay_log.py watch --plan <plan_dir>'`，Windows 用 `Get-CimInstance Win32_Process` 按 CommandLine 匹配），不在则按重启循环重拉，或改前台 `herdr agent wait <agent> --timeout 1200000`。」
       - 编排段：「收到 `[relay-light] tick`：跑 `status --json` 与 `herdr agent list` 对账；某 open stage 的 stage-lead 为 idle、该 stage 有未关节点且其 worker 已 idle/done/blocked 而账本无对应终态 → `herdr agent prompt <stage-lead> "[relay-light] stage-stalled <stage_id>"`。编排自己的 watch pane 被关：无自动发现，依赖人工，按 §7.3 恢复。」
       - 共通一句：「完整 relay 不设人肉 watcher agent；watch 只通知不写账，停滞判定由编排按上条执行，不进程序。」
    4. stage-lead `agent_launch` / 编排 `monitor_launch` 的 note 写 `herdr=<Herdr 名>`（D5）；未写时 watch 按 `<名字>-<attempt>` 猜。
    5. ~~single-task 段补句~~ **整改 1（P1-4）删除**：本卡不改两个 adapter 的 single-task 段与「编排等待纪律」；single-task 与 watch 程序的关系改由 SKILL.md 第 40 行承担（下项，UD-2）。
  - `SKILL.md`（UD-2，只改三处，其它合同字节不变）：
    1. 第 40 行 watcher 行职责列末句改为：「完整 relay 模式由 `relay_log.py watch` 程序承担、人肉实例退役；`single-task` 无账本，`phase=monitor` 仍由人肉 watcher 按 adapter 120 秒节拍承担」（UD-2 原文）。
    2. 硬规则 8 末句「watch 未实现时不得结束回合空等」改为「有 watch 时允许结束回合、靠 prompt 唤醒；无 watch 时不得结束回合空等」（design §7.2 一句话）。
    3. 「放弃项」第 5 条「不做 watch 推送的实现；watch 未实现时一律走前台 `wait` 回退」改为「watch 只通知不写账、不做驱动器与停滞检测；无 watch 时一律走前台 `wait` 回退」。
    不改 SKILL 第 331 行 single-task monitor 段与其它任何内容。
- **用例清单**（A83 oracle =「单测（打桩时钟）断言 tick 周期与退出条件；结构检查适配层写明归属」）：

  | ID | 用例 | 断言 | oracle 要素 |
  |---|---|---|---|
  | R-A83-1 | tick 周期 | 虚拟时钟推进 3601 秒，`prompt(notify, "[relay-light] tick")` 恰 3 次，时刻 1200/2400/3600 | tick 周期 |
  | R-A83-2 | tick 与状态通知独立 | 同时有 agent 通知时 tick 不被去重吞掉，也不重置 tick 计时 | tick 周期 |
  | R-A83-3 | 阶段级退出 | 绑定 stage 两节点，第一个 `node_close` 后仍运行；第二个（末节点）`node_close` 追加后下一主循环退出 exit 0，全部线程 join；其它 stage 的 `node_close` 不触发 | 阶段级退出条件 |
  | R-A83-4 | 阶段级对 plan_amend 追加节点 | 运行中同 stage 追加节点（superseded 规则按现有 lint）→ 原末节点 `node_close` 不再触发退出，直到新节点关闭 | 末节点语义（D2） |
  | R-A83-5 | 编排级退出 | `--level plan`：两阶段计划，第一阶段 `stage_close` 不退出；末阶段 `stage_close` 后退出 exit 0 | 编排级末阶段 `stage_close` |
  | R-A83-6 | 编排级盯 stage-lead | 编排级在场者为 open stage 的 `monitor#<n>`；其 stage `stage_close` 后该线程退出（D3） | A82 编排级分支 |
  | R-A83-10 | 编排级不越级报信（整改 1，P2 8b） | 计划含 stage-lead 与节点 worker 均在场；`--level plan` 下全部 `prompt` 调用的 agent 段只出现 `monitor#<n>`，对 worker 零 herdr 调用 | D3 |
  | R-A83-12 | 退出码合同（整改 1 续，D13） | 阶段级末节点关闭 → `main(["watch", ...])` 返回 0；无 open stage / 计划 lint 失败 / 账本损坏 → 2；桩 `run_watch` 抛未捕获异常 → CLI 返回值 ∉ {0, 2}（或异常外抛），证明重启循环会重拉而非误停 | 自动重启前提 |
  | R-A83-13 | SKILL UD-2 三处（整改 1 续） | SKILL.md 含 UD-2 第 40 行新句关键片段（`完整 relay 模式由`、`single-task` 无账本、`120 秒`）；硬规则 8 含「有 watch 时允许结束回合」；全文不含 `watch 未实现`、`不做 watch 推送的实现`；并断言对 `5ab3bba` 版 SKILL.md 三条中至少两条 FAIL（RED 有效，钉 SHA 纪律同 §1.3） | UD-2 落字 |
  | R-A83-11 | 空阶段不退出（整改 1，P2-5） | 绑定 stage 已 `stage_start` 但尚无 active 节点 / 节点未 `node_start` → 推进 90 秒不退出；首个节点加入并 `node_close`（且为唯一节点）后才退出 | D2 |
  | R-A83-7 | 退出后无 tick | 退出时刻之后无任何 prompt | 退出条件 |
  | R-A83-8 | adapter 结构检查（两份各一） | 含 `relay_log.py watch`/`<RELAY_LOG> watch` 命令行且带 `--notify`、`--config-dir`；含 `[relay-light] tick`；含 `--timeout 1200000`；含节拍归属两句（有 watch→watch 维持；无 watch→前台 wait 维持）；含 `herdr=`；含 D12 死亡处置关键词 `stage-stalled`、`pgrep -f 'relay_log.py watch`、`Win32_Process`、`依赖人工`、`§7.3`；含 D13 重启循环两种写法关键词（`while :; do`、`sleep 5`、`$LASTEXITCODE -in 0,2`、`Start-Sleep 5`）；**不再含** `watch 未实现`、`尚未实现`；硬规则句「`wait` 返回时必须有接收者」仍在 | 结构检查适配层写明归属 |
  | R-A83-9 | 旧断言替换不弱化 | 旧 `assertIn("未实现")` 删除处改为断言「无 watch」回退句存在 + `空等` 仍在；在 `5ab3bba` 版 adapter 上跑 R-A83-8 应 FAIL（钉 SHA 取旧文，按 §1.3 fetch 纪律） | RED 有效 |

- **RED 先行**：先写 R-A83-*，对未改 adapter 与无 tick 实现跑应失败，存 `evidence/batch-2/red.txt`；再实现/改写至 GREEN。
- **完成判据**：
  ```bash
  cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log -v 2>&1 | tail -3   # OK
  grep -c '未实现' skill/references/adapter-claude-code.md skill/references/adapter-codex.md   # 均为 0（仅限 watch 语境；如他处合法出现须在 progress 说明）
  grep -n 'timeout 1200000' skill/references/adapter-*.md    # 两份均命中
  grep -n '\[relay-light\] tick' skill/references/adapter-*.md    # 两份均命中
  grep -c 'stage-stalled' skill/references/adapter-*.md    # 两份均 ≥1
  grep -c 'watch 未实现\|不做 watch 推送的实现' skill/SKILL.md    # 0
  cd ../.. && git -c core.quotepath=false diff origin/master -U0 -- tools/relay-light/skill/SKILL.md | grep -c '^@@'   # ≤3，且逐 hunk 对应 UD-2 三处
  ```
  外加 §1.1 路径审计与 §1.6 回归全绿（含 `test_install_skill` 的 single-task 结构断言不回归）。
- **证据落点**：`evidence/batch-2/`（`red.txt`、`green.txt`、`adapter-grep.txt`、`regression-*.txt`、`path-audit.txt`）。
- **signal**：`DONE.batch-2.coder.md`。
- **注意**：adapter 与 SKILL.md 改完后 skill 五文件哈希变化，用户级副本与仓内源不一致属预期，**coder 不同步**；由 orchestrator 收口时取用户授权后 `install_skill.py --all`。

### batch 3 — 实测批（H11 / H12，只取证不判）

> 仅在 orchestrator 派单明写「实测批」时生效 README 特别授权：只在 Herdr workspace `w4B` 开 tab，agent 名以 `rlt18-probe-` 开头，用完关闭。**探针 agent 的模型/推理档属新增角色实例，须 orchestrator 先走 model-allocation gate 取得用户确认并写入 `execution_strategy.md`，coder 不自选模型**；派单未给出已确认模型即写 `BLOCKED.batch-3.coder.md reason=probe_model_unconfirmed`。

- **承接 HC**：`HC-RL-H11`、`HC-RL-H12`（人判；本批只交证据槽）。
- **fixture**：探针用完整 relay 的最小计划 + 账本放 `docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/fixture/<probe-id>/`（`relay_plan.md` + `relay_log.jsonl` + `config/`，由 coder 用 `relay_log.py add` 写入，`--config-dir` 指 fixture 自带 config）。**这是被测对象 watch 的输入 fixture，不是本卡 single-task 的运行账本**；single-task「不创建/读写 relay_plan/relay_log」的路径审计对且仅对 glob `docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/fixture/**` 例外（plan-review round 1 P2-3 已接受，条件：orchestrator 在 `execution_strategy.md` 或 `dispatch/README.md` 记一笔该豁免——**由 orchestrator 执行，batch 3 开工前核**）。审计命令：`git -c core.quotepath=false ls-files -co --exclude-standard | grep -E '(^|/)(relay_plan\.md|relay_log\.jsonl)$' | grep -v '^docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/fixture/' | grep '^docs/modules/relay-light/workspace/RLT_18/'` 期望空。fixture 不含任何凭据，且须过完整 lint：`python3 tools/relay-light/relay_log.py lint --plan <fixture> --config-dir <fixture>/config` exit 0。
- **探针设计**：
  - **H11-claude**：`rlt18-probe-lead-claude`（claude kind，扮被通知的 stage-lead）+ `rlt18-probe-worker`（任一 kind，扮在场 worker，fixture 账本记其 `agent_launch note=herdr=rlt18-probe-worker`）+ watch tab（`relay_log.py watch --plan <fixture> --notify rlt18-probe-lead-claude`）。先让 lead 执行一个 ≥90 秒的前台任务（例：让它跑 `sleep 90 && echo probe-busy-done`）确保 `agent get` 为 `working`；期间让 worker 完成一个短任务回 idle → watch 发 `[relay-light] <worker 的 ledger 标识，例 coder#1> -> idle`（D7）。记录：watch 发送时刻（watch stderr/stdout 或 coder 侧 `date` 对齐）、lead 忙态证据（`agent get` JSON 摘录 `agent_status`/`state_change_seq`）、lead 结束忙态后是否出现该 prompt 及其出现时刻与原文（`agent read` 摘录）。
  - **H11-codex**：同上，lead 换 codex kind（`rlt18-probe-lead-codex`，按 adapter 带 `--dangerously-bypass-approvals-and-sandbox`）。
  - **H12（整改 1 续，按 UD-1 两段演示；均为 kill/关闭后零提示原样观察）**：lead 与 watch 均按 batch 2 定稿 adapter 原样派单/启动（watch pane 跑 D13 重启循环）。
    - **H12-① 进程级自动恢复**：watch 运行、lead 已按「有 watch 允许结束回合」结束回合后，coder `kill` watch **Python 进程**（不杀循环 shell，记录时刻与 PID）；不向任何探针发提示；记录重启循环重拉的时刻与新 PID（`pgrep -af 'relay_log.py watch'` 摘录）、重拉后第一条通知/tick 的时刻与原文（lead 侧 `agent read` 白名单摘录）。观察窗 ≤ 5 分钟。
    - **H12-② 阶段级 pane 被关 → 编排 tick 对账发现**：fixture 账本另记 `monitor_launch note=herdr=rlt18-probe-orch stage_id=<s1>` 等编排级所需行；多开 `rlt18-probe-orch`（**扮编排的新增实例**，按 adapter 编排段派单）与一个 `--level plan --notify rlt18-probe-orch` 的编排级 watch pane（同样跑重启循环）。让 worker 回 idle 后关闭**阶段级** watch 的整个 pane（记录时刻），不向任何探针发提示，观察至关闭后 25 分钟：记录编排下一次 tick 时刻、编排对账输出摘录、是否发出 `[relay-light] stage-stalled <stage_id>` 及时刻、lead 收到后是否先核 watch 存活及其动作与时刻；或写「截至关闭后 25 分钟未发生」。
    - 编排级 pane 被关不做实测（D12③ 按裁决如实写依赖人工），只在 `H12.md` 注明「未演示，依据 UD-1」。
    - 如确需人工介入，`H12.md` 单列「操作者介入」节写明时刻、原文与原因；介入之后的观察不计入「自发」。允许真实等待 ≥25 分钟。
    - **模型闸**：`rlt18-probe-orch` 与 H11/H12 其它探针一样属新增角色实例，启动前由 orchestrator 走 model-allocation gate 取得用户确认并写入 `execution_strategy.md`；派单未给出其已确认模型即写 `BLOCKED.batch-3.coder.md reason=probe_model_unconfirmed`。
- **产出**：`evidence/batch-3/H11-claude.md`、`H11-codex.md`、`H12.md`（含 ①② 两节），每份只写「展示了什么、时刻、内容」+ 原始摘录文件引用，**不写结论**（结论格留给用户）；Herdr 输出先按白名单过滤（只保留 name/agent_status/state_change_seq/pane_id/时刻/prompt 原文），不录凭据、不录无关终端内容。
- **收尾**：全部 `rlt18-probe-*` tab 关闭，`herdr agent list` 摘录证明无残留；watch 进程无残留（`pgrep -f 'relay_log.py watch'` 空）。
- **完成判据**：三份证据文件存在且各含「时刻」「内容」两节与原始摘录引用（`H12.md` 另含 H12-①、H12-② 两节与「操作者介入」节，无介入写「无」）；fixture lint exit 0；无 `rlt18-probe-*` 残留；§1.1 路径审计（fixture 例外，上述精确 glob）与 §1.6 回归全绿。
- **signal**：`DONE.batch-3.coder.md`。

## 4. 批后与收口（orchestrator 路由，worker 不自续）

- 每批：coder `DONE` → batch reviewer（原 reviewer 复审整改，最多 2 轮）→ PASS 且工件齐全 → orchestrator 对 coder 与 reviewer 各 `/clear` 并复验 → 下一批。
- 三批 PASS 后：workflow-final heavy 五路（code-round1 / code-round2 / requirement / consistency / lesson），每路每轮 fresh；E2 code_review attempt 1 fresh；主会话人验 H11/H12。
- 挂起项：A125 终局回归与 Windows 两副本（F-002）；用户级副本同步（收口另授权）；verify 钩子风险（F-003）。
