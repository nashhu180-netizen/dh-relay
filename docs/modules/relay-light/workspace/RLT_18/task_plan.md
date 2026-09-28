<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_18 watch（single-task）

> 修订日志：
> - 2026-09-23 builder#1 初稿（phase=plan，review_round=1 remediation_count=0）。
> - 2026-09-23 builder#1 整改 1（按 `review.plan.md` round 1 FAIL）：P1-1 虚拟时钟改离散事件调度器 + 多线程节拍用例（batch 1 桩与 R-A82-3/7、R-A82-12、R-A83-1）；P1-2 D11 区分超时与提前失败并加 30 秒退避（R-A82-11）；P1-3 H12 探针改为 kill 后零提示原样观察 + 「操作者介入」节，watch 死亡发现机制新增 D12 **待 decider 裁决**（本棒 BLOCKED）；P1-4 删 batch 2 adapter 第 5 项、SKILL.md:40 冲突并入 F-004；P2-1～P2-5 与 4c/7/8b 一并处理（见各处「整改 1」标注）。
> - 2026-09-24 builder#1 整改 1 续（按 `decisions.md` UD-1/UD-2 与 `decision.f007-watch-death.md` §4 B′/§6）：D12 落用户裁决 F「pane 内 shell 重启循环 + B′ 编排 tick 对账兜底」，新增 D13 退出码合同；batch 2 纳入 adapter 两层死亡处置句与 SKILL.md 三处（UD-2），补齐须同步的旧文本断言（`test_a21`「未实现」、`test_no_watch_subcommand_invoked` 反转、`test_a136` 枚举纳入 watch）；batch 3 H12 改为两段演示（kill 后自动恢复 / 关阶段级 watch pane 后编排 tick 对账发现），扮编排探针为新增实例须先过 model-allocation gate。仍为 3 批。
> - 2026-09-24 builder#1 整改 2（按 `review.plan.md`「复审 round 2」FAIL；plan 阶段最后一次整改；UD-1/UD-2 不变）：P1-A D13 退出码改为与现有实现一致（2 参数/无 open stage、3 计划/配置、4 账本），循环停止集 {0,2,3,4}，启动期读失败短重试、运行期重读失败跳过本轮不退出（D4/D13、R-A83-12、新增 R-A82-14/15）；P1-B watch 调用行固定参数顺序 `--plan … --notify …` 首两位，存活检查按 `--plan <plan_dir> --notify <自己的名>` 定位层级（D12、adapter 第 2/3a 项、R-A83-8）；P1-C H12-② 改为先关阶段级 watch pane、后让 worker 回 idle，记三时刻；P2-A H12-① 按 `^python3? .*relay_log\.py watch` 取 PID；P2-B 保持「0/确定性错误不重拉」取向。顺带修正 batch 2 第 2 项残留的 `--config-dir <本侧 skill 目录>` 为 `<plan_dir>/config/`。

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
| D4 | 「在场 agent」取法 | 每 30 秒主循环重读 plan + ledger（只读 `_runtime_plan` + `read_ledger` + `derive_status`，与 `status --json` 同一投影函数，不起子进程）；阶段级在场 = 绑定 stage 内 `agents[]` 中 `last_event ∉ TERMINAL_EVENTS` 者；新出现的在场 agent 新开线程，已盯过并退出的不再重开。**整改 2（P1-A）运行期重读失败**：某轮 plan 或 ledger 读取/lint/解析失败（`RelayError` 任何 exit_code，含账本末行未以换行结尾的半行、planner-amend 非原子写入中的计划）→ 本轮跳过、stderr 报一行、保留上一次成功的快照用于退出判定与在场集合、30 秒后再读；**不退出进程**，连续失败不加速也不退避加长；agent 线程查账本终态时读失败同样视为「本轮未知、非终态」继续。只有**启动期**读失败才按 D13 退出。 | §3.6「读 `status --json` 取在场 agent」；进程内复用同一投影比 shell 调自己更可测，输出字段一致。 |
| D5 | ledger agent 标识 ↔ Herdr agent 名 | 解析顺序：① 该实例 `agent_launch`（编排级为 `monitor_launch`）note 中的 `herdr=<name>` token；② 缺省 `<名字>-<attempt>`（`#`→`-`，与 SKILL 命名规范「空间名用 `-` 不用 `#`」同向）。解析不出合法 Herdr 名（空、含空白）时该 agent 跳过并 stderr 报一行，不崩。adapter（batch 2）写明 stage-lead 记 `herdr=` token 的约定。 | design 未给映射；token 方式不改账本 schema（note 自由文本），不碰 SKILL.md。若 plan-review 认为需改 SKILL 合同，应转 findings + decider，而非本卡越界改。 |
| D6 | `--notify` 解析 | `--notify` 直接是 Herdr agent 名（例 `rlt-orch`、`p21-29-C1` 里的 stage-lead 名）；校验非空、无空白、仅 ASCII，否则 argparse 错误 exit 2。watch 不对 notify 目标做 `agent get` 预检（目标忙也要排队送达，H11 验的就是这个）。 | §3.6 `herdr agent prompt <notify> ...`。 |
| D7 | 通知文本 | 状态变化：`[relay-light] <ledger_agent> -> <state>`（ledger 标识，含 `#`，例 `[relay-light] coder#1 -> idle`）；tick：`[relay-light] tick`。发前断言 `text.isascii()` 且无换行，违者不发并 stderr 报一行（整改 1：反例用例 R-A82-13）。`<state>` 取 Herdr 返回的 `agent_status` 原值（idle/done/blocked/unknown）。 | design 原文格式；ledger 标识让接收方直接对账。 |
| D8 | 线程收敛 | 每 agent 一个 daemon 线程；阻塞 wait 用 `herdr agent wait <n> --timeout 30000` 分段挂（超时即检查 stop 事件与账本终态后再挂），使主线程置 stop 后 ≤30 秒全部线程可 join（「超时返回」与「提前失败」的区分见 D11）；退出前 join 全部线程（每个 join 超时 35 秒，超时仅 stderr 报）。进程 exit 0。 | 保持「挂 wait」语义且可收敛；30 秒与 §3.6 轮询周期同粒度。 |
| D9 | 去重口径 | 以 agent 为键记「上次已通知状态」；同一状态再次观察到（包括 30 秒 `get` 轮询看到的 settled 态、分段 wait 立即返回）一律不再发；只有观察到 `working` 后（即经历一次重挂）再返回的非 working 状态才算新转换，可再次通知（即使与上次同值）。 | 「同一 `(agent, 状态)` **转换**只通知一次」——`working→idle→working→idle` 是两次转换。plan-review 若判为「终身只一次」需改用例 R-A82-5。 |
| D10 | tick 起点与归属 | tick 自 watch 启动起每 1200 秒一次（单调时钟，主循环驱动，不是 agent 线程）；阶段级与编排级 watch 各自发各自的 tick 给各自 `--notify`；退出时不补发。 | §3.6「20 分钟兜底计时由 watch 维持」；§7.2 收 tick 跑 status + agent list 对账。 |
| D11 | herdr 失败 | 适配层返回 `(rc, stdout)`。**整改 1 区分两种 wait 非零**：① 超时返回（本次调用经虚拟/单调时钟测得耗时 ≥ timeout）→ 视为「未返回」立即重挂；② 提前非零返回（耗时 < timeout，如名字解析错、目标已关、herdr 自身报错）→ 先 `clock.sleep(30)` 再重试，**不得无间隔重挂**。`get` 非零或 JSON 不可解析 → 本轮跳过，下一次仍在 30 秒后（连续失败不加速）；`prompt` 非零 → stderr 报一行，不重试、**不标记已通知**（下一次观察可再试）。以上都不写账、不退出进程。任一 agent 线程任意 90 秒窗口内 herdr 调用（wait+get）≤ 4 次（R-A82-11）。 | 只通知不写账；失败不能伪装成已送达；design 486 的 30 秒节拍与 1437「不做秒级盯屏」禁止热循环。 |
| D12 | watch 进程死亡由谁、怎样发现（P1-3） | **已裁决**（`decisions.md` UD-1，用户 2026-09-24 选 F = 自动重启 + B′ 兜底）。三层：① **进程级**——watch 所在 pane 不直接跑 watch，而跑 shell 重启循环（D13）；进程崩溃或被杀几秒内由循环重拉，仍是 design 482「单独开一个 pane 运行」，不引入 watcher agent。② **阶段级 pane/shell 被关**——由编排收到**自己** watch 的 20 分钟 tick 做 §7.2 对账时发现：某 open stage 的 stage-lead 为 idle、该 stage 有未关节点、其 worker 已 idle/done/blocked 而账本无对应终态 → `herdr agent prompt <stage-lead> "[relay-light] stage-stalled <stage_id>"`；stage-lead 被任何 prompt 唤醒时**先核 watch 存活**（**整改 2（P1-B）按层级与通知对象定位**：`pgrep -f -- 'relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名>'`；Windows `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名>*' }`。同一 plan 目录下阶段级与编排级 watch 的 `--notify` 不同（stage-lead 名 vs 编排名），故不会互相误判；前提是 D13 的调用行参数顺序固定），不在则按 D13 重拉或改前台 `herdr agent wait <agent> --timeout 1200000`。③ **编排级 watch 的 pane 被关**——如实写「无自动发现，依赖人工，按 §7.3 恢复」。完整 relay 不保留人肉 watcher agent；watch 仍只通知不写账、不做驱动器；对账与 `stage-stalled` 判定由编排（agent）按 adapter 执行，**不进 watch 程序**（程序不做停滞检测，design 1437）。 | 用户裁决；落字以 `decision.f007-watch-death.md` §6.3 B′ 草案为底，加自动重启层。 |
| D13 | 重启循环与 watch 退出码合同（整改 2 重写，P1-A） | **退出码沿用 relay_log 现有合同，不重映射**：正常退出（阶段级末节点关闭 / 编排级末阶段 `stage_close`）**0**；参数错误与「阶段级启动时无 open stage」**2**（`_error` 缺省）；计划/配置不可用 **3**（`_runtime_plan`/`load_config`）；账本读取/解析失败 **4**（`_ledger_error`）；其余（未捕获异常 Python 为 1、被信号杀 137/143）为其它非零。**启动期**读 plan/ledger 失败先在进程内重试 2 次、间隔 2 秒（`clock.sleep`，吸收 append 半行与非原子改计划的瞬时态），仍失败以原生退出码退出；**运行期**失败不退出（见 D4）。重启循环停止集 = **{0, 2, 3, 4}**（正常结束或确定性错误，不空转），其余 `sleep 5` 后重拉。**调用行参数顺序固定**：`watch --plan <plan_dir> --notify <名>` 为 watch 之后的首两个参数，`--level`、`--config-dir` 在其后（P1-B 存活检查依赖此顺序；argparse 本身不限顺序，约束在 adapter 文本并由 R-A83-8 断言）。Linux：`while :; do python3 <RELAY_LOG> watch --plan <plan_dir> --notify <名> --level <stage|plan> --config-dir <plan_dir>/config/; rc=$?; case $rc in 0|2|3|4) break;; esac; sleep 5; done`；Windows：`while ($true) { python <RELAY_LOG> watch --plan <plan_dir> --notify <名> --level <stage|plan> --config-dir <plan_dir>/config/; if ($LASTEXITCODE -in 0,2,3,4) { break }; Start-Sleep 5 }`。重启后去重状态与 tick 计时从零开始：已 settled 的在场 agent 可能各再收一次通知，属预期，adapter 写明「重启后可能重复一次通知，按对账处理」。UD-1①「退出后短暂等待即重拉」对 0 与确定性错误不重拉，属细化非偏离（plan-review round 2 P2-B 认可）。 | 程序内不做自重启（保持 watch 单一职责）；循环写在 adapter，由 R-A83-8 结构断言 + R-A83-12 退出码单测 + R-A82-14/15 运行期容错单测共同钉住。 |

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
  | R-A82-14 | 运行期账本半行不退出（整改 2，P1-A） | watch 运行中把账本末行写成无换行半行（例 `{"seq": 7, "ts"`）→ 下一主循环与 agent 线程均不退出、不发 prompt、stderr 报一行；补齐为合法行加换行后下一轮恢复：新增终态被识别、线程按 R-A82-4 退出 | 运行期重读失败不退出 |
  | R-A82-15 | 运行期计划 lint 失败不退出（整改 2，P1-A） | watch 运行中把 `relay_plan.md` 改成 lint 失败的内容 → 连续 3 轮（90 虚拟秒）不退出、在场集合与退出判定沿用上次成功快照、每轮 stderr 一行且 herdr 调用节拍不变；改回合法后恢复 | 运行期重读失败不退出 |
  | R-A101-1 | 静态检查 | `ast` 解析 `relay_log.py`，收集 watch 定界函数/类（D 前缀集）的**调用闭包**（递归解析其调用的模块级函数），断言闭包内无 `append_event`、`_add_command`、`open(` 带写模式（`'a'`/`'w'`/`'x'`/`'+'`）、`.write_text`/`.write_bytes`/`os.replace`/`os.rename`/`shutil.` 写操作、`_write_json_restricted`、`_restricted_writer`；并断言闭包非空且含 `HerdrClient`/`run_watch`（防空集假绿）；**整改 1（P2 判据 7）**：另断言全模块所有 `subprocess.run`/`subprocess.Popen` 调用中，首参为以 `"herdr"` 开头的 list 字面量、或首参是变量/表达式的，都位于 `HerdrClient` 类体内（`_git_readonly` 的 git 调用首参以 `"git"` 开头，不受限） | 静态检查无写账调用 |
  | R-A101-2 | 变异自证 | 在测试内把一行 `append_event(...)` 注入 watch 函数源码副本（字符串层面，不改仓内文件）→ 同一检查函数返回违规 | 检查非恒真 |
  | R-A101-3 | 运行期旁证 | 跑完 R-A82-1～6 全流程后，fixture 目录 `relay_log.jsonl` / `relay_plan.md` 字节除测试自身追加外不变；`mock.patch.object(relay_log, "append_event")` 在 watch 运行段 `assert_not_called`。**整改 1（P2-2）**：测试侧追加终态一律**直接写原始 JSONL 行**（按 `read_ledger` 行格式，seq 递增），不调 `append_event`，故 patch 只可能记录 watch 线程的调用；R-A82-4 同此写法 | 只通知不写账 |
  | R-CLI-1 | CLI | `watch` 缺 `--plan`/`--notify` exit 2；`--notify` 含空白/非 ASCII exit 2；阶段级无 open stage exit 2 且 plan 目录零变化 | D1/D2/D6 |

- **RED 先行**：先落全部用例，在未实现时跑 `python3 -m unittest test_relay_log.WatchTests`（cwd `tools/relay-light`）应全部失败/报错（`watch` 子命令不存在 / `run_watch` 缺失），存 `evidence/batch-1/red.txt`；再实现至 GREEN。
- **完成判据**：
  ```bash
  cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests -v 2>&1 | tail -3   # OK，用例数 ≥ 19
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
    2. 「等待与接收者」方式 1 改为现行：`python3 <RELAY_LOG> watch --plan <plan_dir> --notify <自己的 Herdr 名> --level <stage|plan> --config-dir <plan_dir>/config/`（整改 2：参数顺序按 D13 固定，`--config-dir` 按 `test_a136` 口径）（Windows 写 `python`），在当前阶段终端空间单独开一个载体位运行——**沿用本侧 adapter 既有载体约定**（claude 侧现行「一 agent 一 tab」、codex 侧现行 pane 写法；与 design 482「pane」/1440「不使用 tab」的既有偏离不是本卡引入，登记 findings F-006）；编排层 `--level plan`；收到 `[relay-light] tick` 跑 `status` 与 `herdr agent list` 对账。**整改 1 续**：调用写法统一 `--config-dir <plan_dir>/config/`（与现有 add/status/lint 行一致，满足 `test_a136`），且在 pane 里不直接跑而跑 D13 重启循环（Linux 与 Windows 两种写法都写）。
    3. 「watch 未实现前一律走方式 2/3」改为「watch 默认；watch 未启动时回退方式 2（Claude 侧可 3），此时 20 分钟节拍由前台 `herdr agent wait <agent> --timeout 1200000` 维持」，并**显式写节拍归属**：有 watch → watch 维持；无 watch → 前台 wait 维持。
    3a. **watch 死亡处置（D12，两份 adapter 同义，Claude/Codex 对称）**：
       - 进程级：「watch 所在 pane 跑重启循环（D13 两种写法）；进程崩溃或被杀几秒内自动重拉；重启后可能重复一次通知，按对账处理。」
       - stage-lead 段：「整个 watch pane 被关时本层无自动发现，由编排 tick 对账兜底（最长 20 分钟）。收到 `[relay-light] stage-stalled <stage_id>` 或任何唤醒时，先核 watch 存活（`pgrep -f -- 'relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名>'`，Windows 用 `Get-CimInstance Win32_Process` 按 `CommandLine -like '*relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名>*'`；只认自己这一层的 watch，编排级 watch 命中不算），不在则按重启循环重拉，或改前台 `herdr agent wait <agent> --timeout 1200000`。」
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
  | R-A83-12 | 退出码合同（整改 2 重写，D13） | 阶段级末节点关闭 → `main(["watch", ...])` 返回 0；缺 `--notify` / 阶段级无 open stage → 2；计划 lint 失败或配置目录无效 → 3；账本非法 JSON 行 → 4（启动期三类均在 2 次重试后退出，`FakeClock` 断言两次 2 秒重试且无真 sleep）；启动首读账本为无换行半行、第 2 次读前补齐换行 → 正常启动不退出；桩 `run_watch` 抛未捕获异常 → CLI 返回值 ∉ {0,2,3,4}（或异常外抛），证明重启循环会重拉 | 自动重启前提 |
  | R-A83-13 | SKILL UD-2 三处（整改 1 续） | SKILL.md 含 UD-2 第 40 行新句关键片段（`完整 relay 模式由`、`single-task` 无账本、`120 秒`）；硬规则 8 含「有 watch 时允许结束回合」；全文不含 `watch 未实现`、`不做 watch 推送的实现`；并断言对 `5ab3bba` 版 SKILL.md 三条中至少两条 FAIL（RED 有效，钉 SHA 纪律同 §1.3） | UD-2 落字 |
  | R-A83-11 | 空阶段不退出（整改 1，P2-5） | 绑定 stage 已 `stage_start` 但尚无 active 节点 / 节点未 `node_start` → 推进 90 秒不退出；首个节点加入并 `node_close`（且为唯一节点）后才退出 | D2 |
  | R-A83-7 | 退出后无 tick | 退出时刻之后无任何 prompt | 退出条件 |
  | R-A83-8 | adapter 结构检查（两份各一） | 含 `relay_log.py watch`/`<RELAY_LOG> watch` 命令行，且**每一条** watch 调用行（含重启循环行）匹配 `watch --plan \S+ --notify \S+`（整改 2，P1-B：两参数固定为 watch 后首两位）并带 `--config-dir <plan_dir>/config/`；含 `[relay-light] tick`；含 `--timeout 1200000`；含节拍归属两句（有 watch→watch 维持；无 watch→前台 wait 维持）；含 `herdr=`；含 D12 死亡处置关键词 `stage-stalled`、`pgrep -f -- 'relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名>'`（带 `--notify`，整改 2）、`Win32_Process`、`依赖人工`、`§7.3`；含 D13 重启循环两种写法关键词（`while :; do`、`0|2|3|4) break`、`sleep 5`、`$LASTEXITCODE -in 0,2,3,4`、`Start-Sleep 5`；整改 2 停止集）；**不再含** `watch 未实现`、`尚未实现`；硬规则句「`wait` 返回时必须有接收者」仍在 | 结构检查适配层写明归属 |
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
    - **H12-① 进程级自动恢复**：watch 运行、lead 已按「有 watch 允许结束回合」结束回合后，coder `kill` watch **Python 进程**（不杀循环 shell；整改 2（P2-A）：PID 用 `pgrep -f '^python3? .*relay_log\.py watch --plan <fixture> --notify rlt18-probe-lead-'` 取，先 `pgrep -af 'relay_log.py watch'` 全量摘录再标出所杀 python 行，记录时刻与 PID）；不向任何探针发提示；记录重启循环重拉的时刻与新 PID（同一 `^python3?` 模式摘录，证明循环 shell PID 未变、python PID 已变）、重拉后第一条通知/tick 的时刻与原文（lead 侧 `agent read` 白名单摘录）。观察窗 ≤ 5 分钟。
    - **H12-② 阶段级 pane 被关 → 编排 tick 对账发现**：fixture 账本另记 `monitor_launch note=herdr=rlt18-probe-orch stage_id=<s1>` 等编排级所需行；多开 `rlt18-probe-orch`（**扮编排的新增实例**，按 adapter 编排段派单）与一个 `--level plan --notify rlt18-probe-orch` 的编排级 watch pane（同样跑重启循环）。**整改 2（P1-C）事件顺序固定**：前置——worker 正在执行一个足够长的任务、`agent get` 为 `working`，lead 已按「有 watch 允许结束回合」处于空闲态；步骤——(1) 关闭**阶段级** watch 的整个 pane（记时刻 T1，并摘录此刻 worker 的 `agent get` 状态，须为 working）；(2) 等 worker 完成任务回 idle（记时刻 T2，此时已无阶段级 watch，lead 不应被通知）；(3) 不向任何探针发提示，观察至编排下一次 tick 之后 5 分钟、最长 T1 后 25 分钟（编排级 watch 须在 T1 前已运行，保证窗内至少一次 tick）：记录编排 tick 时刻 T3、编排对账输出摘录、是否发出 `[relay-light] stage-stalled <stage_id>` 及时刻、lead 收到后是否先按 `--notify <自己的名>` 核 watch 存活（且未被编排级 watch 误判为在）、其动作与时刻；或写「截至 T1 后 25 分钟未发生」。`H12.md` 必须含 T1/T2/T3 三个时刻与 T1 时 worker 状态摘录。
    - 编排级 pane 被关不做实测（D12③ 按裁决如实写依赖人工），只在 `H12.md` 注明「未演示，依据 UD-1」。
    - 如确需人工介入，`H12.md` 单列「操作者介入」节写明时刻、原文与原因；介入之后的观察不计入「自发」。允许真实等待 ≥25 分钟。
    - **模型闸**：`rlt18-probe-orch` 与 H11/H12 其它探针一样属新增角色实例，启动前由 orchestrator 走 model-allocation gate 取得用户确认并写入 `execution_strategy.md`；派单未给出其已确认模型即写 `BLOCKED.batch-3.coder.md reason=probe_model_unconfirmed`。
- **产出**：`evidence/batch-3/H11-claude.md`、`H11-codex.md`、`H12.md`（含 ①② 两节），每份只写「展示了什么、时刻、内容」+ 原始摘录文件引用，**不写结论**（结论格留给用户）；Herdr 输出先按白名单过滤（只保留 name/agent_status/state_change_seq/pane_id/时刻/prompt 原文），不录凭据、不录无关终端内容。
- **收尾**：全部 `rlt18-probe-*` tab 关闭，`herdr agent list` 摘录证明无残留；watch 进程与循环 shell 无残留（`pgrep -f 'relay_log.py watch'` 空）。
- **完成判据**：三份证据文件存在且各含「时刻」「内容」两节与原始摘录引用（`H12.md` 另含 H12-①、H12-② 两节与「操作者介入」节，无介入写「无」）；fixture lint exit 0；无 `rlt18-probe-*` 残留；§1.1 路径审计（fixture 例外，上述精确 glob）与 §1.6 回归全绿。
- **signal**：`DONE.batch-3.coder.md`。

## 4. 批后与收口（orchestrator 路由，worker 不自续）

- 每批：coder `DONE` → batch reviewer（原 reviewer 复审整改，最多 2 轮）→ PASS 且工件齐全 → orchestrator 对 coder 与 reviewer 各 `/clear` 并复验 → 下一批。
- 三批 PASS 后：workflow-final heavy 五路（code-round1 / code-round2 / requirement / consistency / lesson），每路每轮 fresh；E2 code_review attempt 1 fresh；主会话人验 H11/H12。
- 挂起项：A125 终局回归与 Windows 两副本（F-002）；用户级副本同步（收口另授权）；verify 钩子风险（F-003）。

## 5. UD-3 整改（2026-09-24 builder#ud3 · 计划稿，待 orchestrator 路由）

> §5 修订日志：
> - 2026-09-24 builder#ud3 初稿（`DONE.builder.ud3-plan.md`）。
> - 2026-09-24 builder#ud3 整改 1（按 `review.plan.ud3.md` round 1 FAIL + `decisions.md` UD-5 + `dispatch/README.md` UD-3 登记）：P1 #9 R-U3-1 否定项改为 `stage-stalled`/`pgrep`/`Win32_Process` 并正向断言「不做 watch 存活判定」；P1 #11 U1/U2 路径审计与 SKILL hunk 判据基点钉 `5ab3bba`（F-012 登记 #67 漂移）；P2 #2/#3/#6/#7/#8/#10/#13/#14 全部吸收；Q1–Q6 结论按 UD-5 落进正文，§5.7 改为裁决引用。

> 依据：`decisions.md` UD-3（用户人判 H12，**方向已定，本节不重评**）：「还是加个 watch 的 agent 10 分钟检查一次。编排不做这个事情」；复用既有 watcher 角色；发现死后通知 stage-lead/编排重拉；本卡继续改。
> 本节**只追加**：§0–§4 与三批原文保持已 PASS 状态、字节不改。取代关系：D12 ②（编排 tick 对账 + `stage-stalled`）与 ③（编排级「依赖人工」）、D12 末句「完整 relay 不保留人肉 watcher agent」**由本节 D14–D23 取代**；D12 ①（pane 内 shell 重启循环）与 D13 退出码/循环合同**保留不变**。
> 标注约定：「小决策」= 按设计一致性由 builder 定稿，plan-review/decider 可驳；「UD-5」= 用户已于 2026-09-24 裁决（原 Q1–Q6，见 §5.7）。

### 5.1 一页结论

1. **程序零改动**：`relay_log.py` 不改；`WATCH_TICK_SECONDS = 1200` 与 20 分钟 tick 保留（A83、§3.6、§7.2 冻结合同不动）。
2. **兜底改由 watcher agent**：每终端空间一个（UD-5 Q2）；watcher **自身定时**每 10 分钟用 C1-1 修正后写法只读核本空间 watch；缺席且本层未正常结束 → `[relay-light] watch-down <stage|plan> <scope>` 报信给本空间派活方；stage-lead/编排按 D13 重启循环重拉。
3. **编排不承担存活对账**：两 adapter 删除 `stage-stalled` 规则与「编排级 watch 被关依赖人工」句；编排收 tick 只做 §7.2 通用对账。
4. **设计要改、须走 A-full（RLT-A-14）**：命中验收（H12）与角色层变更，不是本卡 worker 可改的范围；§5.3 给出流程判定与允许路径追加清单；UD-5 Q1 已定本卡同分支走 A-full。
5. **不开 batch 4**：SKILL single-task `batch=1|2|3` 闭集；按「人验退回的用户定向整改」执行，派单/signal 沿用 workflow-final 整改形态（`batch=na path=ud3`，先例 rq1-redemo、e2 coder-remediation；signal 名与轮次约定已由 orchestrator 登记于 `dispatch/README.md`），拆 U1 施工 + U2 H12 重演；之后 heavy 五路对 UD-3 差异 fresh 重审 + E2 fresh + 人验。

### 5.2 UD-3 细节定稿（D14–D23）

| # | 问题 | 定稿 | 类别 | 理由 |
|---|---|---|---|---|
| D14 | 兜底总形态（取代 D12 ②③） | 三层：① 进程级——D12①/D13 不变（循环几秒内重拉）；② 载体级（watch 的 pane/tab 被关，含阶段级与编排级）——本空间 watcher 10 分钟巡检发现 → 报信本空间派活方 → 派活方重拉；③ 编排**不做** watch 存活判定，tick 只跑 §7.2 通用对账（`status --json` + `herdr agent list`），不再发 `stage-stalled`。watch 仍只通知不写账、不做停滞检测（design 1437 不变）。 | UD-3 直落 | 用户原话 |
| D15 | watcher 每层一个还是每终端空间一个 | **每终端空间一个**（UD-5 Q2）：阶段空间一个（stage-lead 拉起，随阶段空间关闭）、编排空间一个（编排拉起，随编排收工关闭）。备选「全计划一个」（放编排空间，巡检所有阶段 watch，跨空间报信各 stage-lead）。 | UD-5 Q2 已定（每终端空间一个） | 理由：SKILL 角色表 watcher 行现文「编排或 stage-lead 拉起 / 一个终端空间 / 只报信给本空间派活方」；与「stage-lead 不跨阶段存活」同构，watcher 不需追踪动态变化的阶段/plan_dir/lead 名。代价：并发 watcher 数 = open 阶段数 + 1（同卡阶段不并行，典型 2 个），每个约 6 次模型回合/小时。备选省 agent 但跨越「本空间」职责边界。 |
| D16 | 10 分钟节拍实现 | **watcher agent 自身定时**。每轮 = 一次阻塞 shell 调用，醒来执行 D18 检查：**Claude 侧只用 `run_in_background` 跑 `sleep 600`**（退出唤醒 session，同 adapter 方式 3 机制；不写前台长 sleep——新版 Claude Code 拦截长前台 sleep，且 590 s 贴着 600000 ms 工具上限）；**Codex 侧前台 `sleep 600`，shell 工具调用显式给超时参数 `timeout_ms=660000`**（≥ 600 s + 60 s 余量；不依赖工具缺省超时）。Codex 侧 600 s 前台调用无既有先例，U2 开跑前按 §5.6「节拍实测」用 Codex watcher 探针的真实工具超时跑一次 600 s 前台调用确认不断拍；若实测该 kind 不接受该超时，U2 写 BLOCKED 交 orchestrator，不临场改写法。节拍 ±1 分钟可接受；**不写后台守护脚本**（single-task monitor 自写守护误报的教训）。 | 小决策 | 「watch 给 watcher 发 tick」在 watch 死后恰好停摆——兜底依赖被兜对象，与 UD-1 讨论中用户指出的矛盾同构，排除。 |
| D17 | watch 程序 20 分钟 tick 去留 | **保留**，程序零改动；tick 继续驱动 stage-lead 与编排的 §7.2 通用对账；只删除 adapter 中编排据 tick 判 `stage-stalled` 的 B′ 规则。 | UD-5 Q3 已定（只取消存活检查，tick 与 §7.2 通用对账保留，A83 不改） | tick 属 §3.6/§7.2/A83 冻结合同；UD-3 原文只取消编排的「watch 存活对账」职责。 |
| D18 | 存活检查命令与判死口径 | 复用 C1-1 修正后写法，`--notify` 换成**本空间派活方**名、`--level` 按空间：阶段空间 `pgrep -af -- 'relay_log.py watch --plan <plan_dir> --notify <stage-lead 的 Herdr 名> --level stage' \| grep -v 'pgrep' \| grep -Ev "^($$\|$PPID) "`；编排空间同式换 `--notify <编排的 Herdr 名> --level plan`；Windows 同 adapter 现行 `Get-CimInstance Win32_Process … -notlike '*Get-CimInstance*' -and $_.ProcessId -ne $PID` 式。**非空 = 存活**（循环壳或 python 任一命中，勿缩窄）。**空** → 先只读跑 `python3 <RELAY_LOG> status --plan <plan_dir> --json --config-dir <plan_dir>/config/` 判本层是否已正常结束——**与 `_watch_should_exit` 一致，另加「stage 已 closed 即静默」**：阶段级 = `stages[]` 中本 `stage_id` 的 `nodes` 在 `nodes[]` 里全部 `state=closed`（与 `_watch_should_exit` 一致），**另加**该 stage `state=closed` 即静默（stage 以非全关节点收口时 watch 自身不退出、watcher 却静默——阶段已收口，结果可接受）；编排级 = `open_stages` 与 `pending_nodes` 均空且 `stages[-1].state=closed`（与 `_watch_should_exit` 一致）。已结束 → 静默，打印 `WATCHER_STOPPED` 结束巡检；未结束或 status 读失败 → 按 D19 报信（宁可多报）。**有意无 watch / 循环停止的收声（小决策，review #6 二选一取「N 轮收声」）**：同一缺席期连续 **3 轮**报信后 watch 仍缺席（≈30 分钟；覆盖派活方有意改前台 `herdr agent wait` 回退、或 watch 以 2/3/4 确定性错误退出循环停止两种情形）→ watcher 停止巡检并打印 `WATCHER_GAVE_UP`，不再发任何 prompt。取此项而非「派活方回退时关 watcher / 首行带 `mode=`」：不给派活方新增动作、不改 D23 首行，且对「派活方忘了关」同样收敛。 | 小决策 | watch 正常退出码 0 时循环 `break`、壳随之消失，watcher 看不到退出码，只能用账本投影区分「正常结束」与「死亡」；status 是只读命令，不违反 watcher 只读。3 轮收声防止对正在前台 wait 的派活方无限期排队 prompt。 |
| D19 | 通知格式与投递 | `herdr agent prompt <本空间派活方> "[relay-light] watch-down stage <stage_id>"`（编排空间：`"[relay-light] watch-down plan plan"`）。短 ASCII 单行（同 D7 约束）。缺席期间**每轮至多一条**，下一轮仍缺席再发（提醒），同一缺席期**至多 3 条**，第 3 条后仍缺席即按 D18 打印 `WATCHER_GAVE_UP` 收声；期间 watch 恢复则计数清零、静默。发完读派活方 pane 末行，**只在**出现 `queued` / `Press Enter to send` 时补一次 Enter，其它输入框残留一律不碰。watcher 不重拉 watch、不写账、不改文件、不派活、不判内容。 | 小决策 | 与 watch 通知同前缀便于接收方分路；queued 补 Enter 规则沿用 single-task monitor 实跑教训。 |
| D20 | 编排级 watch 死亡由谁发现 | 编排空间的 watcher → prompt 编排 `watch-down plan plan` → 编排核自己 watch（`--notify <自己的 Herdr 名> --level plan`）后按重启循环重拉。取代 D12③「无自动发现，依赖人工」。 | UD-3 直落 | 用户点选「通知监工/编排去重拉」。 |
| D21 | watcher 拉起时机与首轮 | 派活方**先**起 watch（重启循环）**后**起 watcher；watcher 拉起后立即检查一次（看不到即报），随后进入 10 分钟节拍。stage-lead 收到 `watch-down` 或任何唤醒时先核自己这一层 watch 存活的现行规则**保留**（F-009 run-1 证明它能提前发现，且成本低）。 | 小决策 | 避免首轮 10 分钟盲区；保留既有已测规则，减少改动面。 |
| D22 | watcher 自身死亡 | 不设二级兜底（避免递归）；残余风险 = watch 与 watcher 同时失守。派活方在 tick 对账看 `herdr agent list` 时若见本空间 watcher 缺席则重拉（顺带，不新增巡检节拍）。watcher 不入账本（design §3.5 agent 名豁免集只有 orchestrator/monitor/planner-amend/strategist 四类，不能写 `agent_launch`），watch 程序也不盯它。 | UD-5 Q4 已定（按推荐） | 用户接受该残余风险与「对账时顺带重拉」。 |
| D23 | watcher 派单首行与模型档 | 首行 `[relay-light] watcher · space=<stage_id\|orchestrator> · notify=<派活方 Herdr 名> · plan=<plan_dir>`（非 worker 标头；AGENTS.md relay-light 段只定义 worker 标头，AGENTS.md 不在允许路径 → findings F-010）。模型档：`roles.toml` 无 `[watcher]` 段且本卡不动 roles.toml；adapter 写「watcher 用低档，缺省沿用 `roles.toml` `[monitor]` 档，由派活方拉起时指定」，roles.toml 不改。 | 首行小决策；模型档 UD-5 Q5 已定（按推荐） | SKILL 第 25 行「模型档全部写在 roles.toml」与 watcher 无段的既有不一致登记 F-011。 |

不受 UD-3 影响：single-task `phase=monitor`（120 秒人肉 watcher，SKILL 第 331 行节）与两 adapter 的 single-task 段；H11；D1–D11、D13；A82/A83/A101 全部机器证。

### 5.3 设计改动流程判定与允许路径

**需改 design/01 的点（改前 → 改后要点）**：

| 位置 | 改前 | 改后要点 |
|---|---|---|
| §2 角色表（约 121–135） | 表头「十一个角色」（design/01:121），11 角色，无 watcher（SKILL 自 #62 起有 watcher 行，design 未同步——既有缺口，F-011） | **表头「十一个角色」→「十二个角色（含旁路 watcher）」**（与 SKILL 第 25 行同口径）；新增「watcher（旁路）」行：拉起者 编排或 stage-lead；生命周期 一个终端空间；职责 每 10 分钟只读核本空间 watch 存活、缺席报信本空间派活方；不派活、不写账、不改文件、不入账本 |
| §3.6 watch（480–491） | 未提存活 | 末尾补一句：「watch 进程由所在 pane 的 shell 重启循环保活；pane 被关由本空间 watcher 10 分钟巡检发现，watch 本身不变」 |
| §7.2 等待与节奏（894–908） | 只有 watch 推送 + 20 分钟 tick / 无 watch 前台 wait | 补一段：tick 对账是通用对账；watch 存活由 watcher 10 分钟巡检承担，编排不做存活对账 |
| §7.3 恢复协议 | 只有监工挂掉 / 编排挂掉 | 新增「watch 挂掉」：进程级循环自拉；载体级 watcher 报 `watch-down` → 本空间派活方重拉；watcher 挂掉由派活方对账时顺带重拉（UD-5 Q4） |
| §12「不做」约 1437「实时监控：watch 推送 + 20 分钟兜底」 | 20 分钟兜底 | 「watch 推送 + 20 分钟 tick 对账 + watcher 10 分钟存活巡检，不做秒级盯屏」 |
| 注意 | design/01:299「`roles.toml` 十一个角色里只有这三个……」指 roles.toml 的段数（UD-5 Q5：roles.toml 不改、无 `[watcher]`），**不随表头改**，A-full 审核核对即可 | — |
| HC-RL-H12（约 1409） | 「watch 进程死亡后 20 分钟兜底是否接住｜杀掉 watch → 展示下一次例行查看的时刻与发现｜兜底是否兜得住，20 分钟是否可接受」 | 「watch 死亡后 watcher 10 分钟巡检是否接住｜①杀 watch 进程 → 循环自动重拉；②关闭阶段级/编排级 watch 载体 → 展示 watcher 下一次巡检的时刻、`watch-down` 通知与派活方重拉｜兜底是否兜得住，10 分钟是否可接受」。ID 处理建议「保留 H12 ID + 升契约版本」（判断对象同为 watch 死亡兜底，只换机制与时限），由 A-full 审核定 |

A82/A83/A101 不改（D17 保留 tick，UD-5 Q3）。

**流程判定**：命中 A-full 客观升级判据——改变验收契约（H12）、改变角色层/关键决策、属高危组件接线；A′ 不得改验收，「仅措辞」不适用。design §4.5（第 642 行）与 dev-harness 动作 A 规定设计改动在接力外走 A-full：GitHub Issue（复用 #65，**直接改 Issue 正文**加【扩界】子条，评论不算；该远端动作属 AGENTS.md GitHub 协作流程第 5 条须用户点名授权的动作——**授权来源：UD-5 Q1 用户点选的选项文本即含「Issue #65 正文扩界」**，仅授权该一项远端改动，不外推到 push/PR/合并）→ `design/drafts/A14/` 共创候选稿（醒目标「未生效」）→ 需求理解对齐 → fresh A 审核（`design/evidence/14-交叉审核记录-RLT-A14-watch兜底watcher巡检.md`）→ 主会话裁决 → 用户整版确认 → 原子晋级 design/01（头部新 `dh:planning-event:v1 id=RLT-A-14 stage=A-full`，增补说明行）。H12 口径变化同步 DevPlan RLT_18「验收口径」H12 行，属 B-adjust（只改一行口径、不拆任务），在 A-full 晋级之后。**以上均不是 U1/U2 coder 可做的事**：按 `dispatch/README.md` 登记，design/01（仅 A-14 晋级改动）、`design/drafts/A14/**`、`design/evidence/14-…` 与 DevPlan H12 口径行**仅 RLT-A-14 事件节点**（派单明写）可写。

**DevPlan RLT_18 允许路径需追加**（UD-5 Q1 选同分支执行 A-full；`dispatch/README.md` 已由 orchestrator 登记，DevPlan 行由 orchestrator/事件执行者按白名单或 B-adjust 追加）：
- `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`（仅 RLT-A-14 晋级改动）
- `docs/modules/relay-light/design/drafts/A14/**`
- `docs/modules/relay-light/design/evidence/14-交叉审核记录-RLT-A14-watch兜底watcher巡检.md`
- `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`（仅 RLT_18 段 H12 口径行，B-adjust）
- `tools/relay-light/skill/SKILL.md` 现注记「限 watcher 表述与『watch 未实现』过时措辞」扩为「……及 UD-3 watch 兜底表述（第 40 行 watcher 行、放弃项第 5 条）」
- 同步 `dispatch/README.md` 允许路径闭集（orchestrator 已写，含「路径审计基点一律 `5ab3bba`」）
- **不需追加**：`relay_log.py`（已在，且本整改零改动）；`roles.toml` 不动（UD-5 Q5）。

**本卡可做部分（不等 A-full）**：本计划（§5）与 plan-review；U1 的 RED 用例可先写。**U1 GREEN 提交以 RLT-A-14 用户整版确认为前置**（避免 adapter/SKILL 文案与晋级后设计不一致再返工）。

### 5.4 逐文件改动面（U1 施工清单）

**起点**：`a6773e7`（UD-3 记录提交）。以下「改前」均指该提交版本。

**(1) `tools/relay-light/relay_log.py` — 零改动**
- 改前→改后：不变。编排 tick 对账逻辑本就不在程序内（B′ 只在 adapter 文本），`WATCH_TICK_SECONDS`、`run_watch` tick 分支、`_watch_should_exit` 全保留。
- 验收：`git diff a6773e7 -- tools/relay-light/relay_log.py` 为空；`WatchTests` 全绿且用例数不减。

**(2) `adapter-claude-code.md` / `adapter-codex.md`（两份同义对称，差异仅本侧载体 tab/pane 与 Claude 侧 `run_in_background` 句）**
- a. 「拉起 stage-lead / 编排 的 prompt 片段」之后新增小节「拉起 watcher 的 prompt 片段」：D23 首行；硬规则原样：只读、自身 10 分钟定时（D16 本侧写法）、D18 检查命令（两 OS）与判死口径、D19 通知格式与 queued 补 Enter 条件、不重拉/不写账/不派活/不判内容、`WATCHER_STOPPED` 收尾与 3 轮收声 `WATCHER_GAVE_UP`（D18/D19）；模型档按 UD-5 Q5 写一句（低档、缺省沿用 `[monitor]`）。**措辞禁区**：新片段位于 single-task 段之前，`test_install_skill` 的 `line_with(…, "完全只读")` 与 `line_with(…, "RELAY_RECEIPT` fail closed 分流")` 取首个命中行——新片段**不得出现「完全只读」与「`RELAY_RECEIPT` fail closed 分流」两个短语**（只读性写作「只读」「不写账、不改文件」）。
- b. 「等待与接收者」方式 1 段末补一句：「watch 起来后在本空间拉起 watcher（见『拉起 watcher 的 prompt 片段』）」；节拍归属段补第三句：「watch 存活巡检 10 分钟节拍由 watcher 维持」。tick 句「收到 tick 跑 `status --json` 与 `herdr agent list` 对账」保留。
- c. 「watch 死亡处置」节重写：
  - 进程级：不变。
  - 新条「watcher 巡检」：D15/D18/D19/D21 要点（引用 a 小节，不重复长命令亦可，但检查命令两份各须完整出现一次）。
  - stage-lead 位：改前「由编排 tick 对账兜底（最长 20 分钟）。收到 `[relay-light] stage-stalled <stage_id>` 或任何唤醒时，先核……」→ 改后「由本空间 watcher 每 10 分钟巡检发现。收到 `[relay-light] watch-down stage <stage_id>` 或任何唤醒时，先核……」；C1-1 检查命令、过滤说明、「循环壳或 python 任一命中即算存活」、「不在则按重启循环重拉，或改前台 wait」**原文保留**。
  - 编排位：改前 tick 对账判 `stage-stalled` + 「编排自己的 watch 被关：无自动发现，依赖人工，按 §7.3 恢复」→ 改后「收到 tick 跑 `status --json` 与 `herdr agent list` 做 §7.2 通用对账，不做 watch 存活判定、不发任何 stall 提示；收到 `[relay-light] watch-down plan plan` 时核自己这一层 watch（`--notify <自己的 Herdr 名> --level plan`，同 C1-1 写法），不在则按重启循环重拉」。
  - 残余句（UD-5 Q4）：「watcher 自身缺席：派活方在 tick 对账见 `herdr agent list` 无本空间 watcher 时重拉，不另设巡检」。
  - 共通句：改前「完整 relay 不设人肉 watcher agent；watch 只通知不写账、不做停滞检测——停滞判定由编排按上条执行，不进程序」→ 改后「完整 relay 每终端空间一个 watcher agent，10 分钟只读巡检本空间 watch、只报信本空间派活方；watch 只通知不写账、不做停滞检测；编排不承担 watch 存活对账」。
- d. 不改：D13 两种循环写法、`herdr=` 约定、无 watch 回退与 `--timeout 1200000`、`wait` 接收者硬规则、single-task 段、stalled/agent_lost/ledger_silent 节。
- 验收断言（→ 测试 R-U3-1/2/3）：两份均不含 `stage-stalled`、`依赖人工`、`不设人肉 watcher agent`；均含 `watch-down stage`、`watch-down plan`、`10 分钟`、`sleep 600`、`WATCHER_STOPPED`、`WATCHER_GAVE_UP`、`queued`、两条 C1-1 检查命令（`--level stage` 与 `--level plan` 两式，均带 `grep -v 'pgrep'` 与 `^($$|$PPID)`）、`Win32_Process` 两式、`编排不承担 watch 存活对账`；Claude 份 watcher 片段含 `run_in_background` 且不含 `sleep 590`；Codex 份含 `timeout_ms=660000`；两份 watcher 片段均不含「完全只读」；仍含 `[relay-light] tick`、`--timeout 1200000`、D13 循环关键词、`` `wait` 返回时必须有接收者 ``；现有 `_PATTERN_LINE_MARKERS` 排除规则对新增检查命令行仍成立（含 `pgrep`/`Win32_Process`/`-like` 标记）。

**(3) `tools/relay-light/skill/SKILL.md`（只改两处，行号同 UD-2，hunk 数对 `5ab3bba` 仍 = 3；基点钉 `5ab3bba`，不用浮动 `origin/master`——master 已有 #67 改第 3、8–20 行，对 origin/master 已是 5 hunk，见 F-012）**
- 第 40 行 watcher 行职责列（**整列按模式分述，仍只在第 40 行内、单 hunk**）：改前「只盯 agent 状态变化、只报信给本空间派活方；不派活、不写账本、不改文件。完整 relay 模式由 `relay_log.py watch` 程序承担、人肉实例退役；`single-task` 模式无账本不接 watch，`phase=monitor` 角色仍以 120 秒节拍人肉充当」→ 改后「只观察、只报信给本空间派活方；不派活、不写账本、不改文件。完整 relay 模式：盯 agent 状态变化与 20 分钟 tick 由 `relay_log.py watch` 程序承担，watcher agent 每终端空间一个、每 10 分钟只读核本空间 watch 存活，缺席即报信本空间派活方（stage-lead/编排）重拉；`single-task` 模式无账本不接 watch，`phase=monitor` 角色以 120 秒节拍盯 agent 状态变化」。拉起者、生命周期列不变（UD-5 Q2 每终端空间一个，与现列「一个终端空间」一致）。
- 第 347 行放弃项：改前「不设人肉盯屏 watcher agent：……stage-lead/编排位的停滞对账由其本层 watch tick 驱动」→ 改后「不做人肉盯屏：等完成由 `relay_log.py watch`（默认）或前台 `herdr agent wait --timeout 1200000` 承担；状态变化通知、30 秒 `get` 轮询、20 分钟 tick 由程序负责；watch 存活由 watcher 10 分钟只读巡检兜底，编排不做存活对账，程序不做停滞检测」。
- 不改：第 25 行（「十二个角色」）、硬规则 8（第 287 行）、第 331 行 single-task monitor 节及其它全部内容。
- 验收：`git diff 5ab3bba -U0 -- tools/relay-light/skill/SKILL.md | grep -c '^@@'` = 3（第 40/287/347 行，与 UD-2 同三处）；另 `git diff a6773e7 -U0 -- tools/relay-light/skill/SKILL.md | grep -c '^@@'` = 2（本整改只动第 40/347 行的旁证；a6773e7 在本分支上可达）；R-U3-4。

**(4) `tools/relay-light/test_relay_log.py`**
- `SkillAdapterTests._assert_adapter_watch_contract`：删 `assertIn("stage-stalled")`、`assertIn("依赖人工")`、`assertIn("§7.3")`（§7.3 只出现在被删句）；改为 `assertNotIn("stage-stalled")`、`assertNotIn("依赖人工")`；加 (2) 验收断言全部正向项。该方法同时服务「5ab3bba 基线必假」检查，新增项在基线上仍为假，RED 有效性不降。
- `SkillCoreDocTests._skill_ud2_checks`：`watcher_row` 片段由 `完整 relay 模式由` 改为 `完整 relay 模式：` + `10 分钟` + `single-task` + `120 秒`，并加不含 `只盯 agent 状态变化、只报信`（第 40 行前半句已分模式）；`abandon5` 保持「含 `盯屏` 且不含 `不做 watch 推送的实现`」并加「不含 `停滞对账由其本层 watch tick 驱动`」；`test_a83_13` 加 `assertNotIn("人肉实例退役")`；「5ab3bba 至少两条为假」保持。
- 新用例（放 `SkillAdapterTests` / `SkillCoreDocTests`，只做文本结构与 schema 对照，不起真进程）：
  | ID | 用例 | 断言 |
  |---|---|---|
  | R-U3-1 | 两 adapter 编排位无存活对账 | 「编排位」条目中「收到 `[relay-light] tick`」所在句（至首个 `。`）不含 `stage-stalled`、`pgrep`、`Win32_Process`，且**正向**含 `不做 watch 存活判定`。RED 核对：`a6773e7` 版该句含 `stage-stalled` 且无「不做 watch 存活判定」（adapter-codex.md:116 / adapter-claude-code.md:114 同句）→ FAIL；按 §5.4(2)c 规定文案 → GREEN（「存活」只以「不做 watch 存活判定」形式出现，不再被否定项误伤） |
  | R-U3-2 | watcher 片段完整 | 两份均含 D23 首行模板、D18 两式命令（stage/plan）、`status --plan <plan_dir> --json`、`WATCHER_STOPPED`、`WATCHER_GAVE_UP`、`连续 3 轮`、D19 两种通知原文、`queued` 补 Enter 条件、「不重拉」「不写账」；Claude 份 `run_in_background` + 无 `sleep 590`，Codex 份 `timeout_ms=660000`；片段内不含「完全只读」「`RELAY_RECEIPT` fail closed 分流」 |
  | R-U3-3 | 通知文本 ASCII 单行 | 从两份 adapter 抽出全部 `"[relay-light] watch-down …"` 字面量，断言 `isascii()` 且无换行（同 D7） |
  | R-U3-4 | SKILL 两处 | `_skill_ud2_checks` 新版全真；不含 `人肉实例退役`、`停滞对账由其本层 watch tick 驱动` |
  | R-U3-5 | 判死口径键名：文档含且真实存在（RED 形式） | 两部分合一用例：① 两份 adapter watcher 片段**含**键名 `open_stages`、`pending_nodes`、`stages`、`nodes`、`state=closed`（a6773e7 版不含 `open_stages`/`pending_nodes` → RED）；② 这些键均为 `status_document` 真实输出键（最小 fixture 跑 `status --json` 取键集断言包含，防文档引用不存在字段）。②单独在 a6773e7 上为真，属守卫，由①保证整条 RED |
- **RED 纪律**：先落新断言，对 `a6773e7` 版文本跑应 FAIL，存 `evidence/ud3-u1/red.txt`。**测试内不钉 `a6773e7` 作基线**（本卡分支 squash 合入后该 SHA 在 master 不可达，CI 浅克隆会 `self.fail`）；测试内基线仍只用 `5ab3bba`。
- 回归：§1.6 两条命令全绿（含 `test_install_skill` single-task 结构断言不被新片段劫持）；WatchTests 用例数不减。

**(5) 本卡工作区**：`findings.md` 追加 F-010/F-011（本棒已写）；`progress.md` 由 U1/U2 coder 各在完成时追加一条（§1.4 纪律）；`review.md` 签名区 H12 行措辞由 orchestrator 在 A-full 晋级后同步。

### 5.5 批次划分与复核路径

**处理口径**：不按「计划修订新增批」——SKILL single-task 标头 `batch=1|2|3` 为闭集，新批需改 SKILL 协议，超出 UD-2/UD-3 授权范围。也不是普通的「workflow-final 整改轮」——UD-3 来自主会话人验中的用户方向裁决，不是 reviewer FAIL。**定为「人验退回的用户定向整改（UD-3）」**：派单与 signal 沿用 workflow-final 整改形态（`phase=workflow-final batch=na path=ud3`；先例 `DONE.workflow-final.rq1-redemo.coder.md` 与 `DONE.e2-code-review.coder-remediation-1.md`），**不占**原 heavy 各路返工额度。**轮次以 `dispatch/README.md`「UD-3 整改轮次约定」为准**（orchestrator 2026-09-24 登记）：ud3 各复核 `review_round` 在 ud3 范围内从 1 起计，每路（含 plan-review.ud3）返工上限 2 轮，超限交 decider/用户；coder signal `path=ud3`、复核 signal `path=<路名>`，`batch=na`。

**顺序**（严格串行，括号内为 signal 文件名）：
1. **plan-review（UD-3 计划）**：plan-review 原额度已用尽（round 1–3），一次 fresh plan-reviewer 只审 §5（`DONE.plan-review.ud3.md`，round 1 已 FAIL → 本整改 1 → `DONE.plan-review.ud3.round-2.md`）；FAIL 回本 builder 整改，最多 2 轮。
2. **U0 设计事件（本卡同分支，UD-5 Q1）**：RLT-A-14 A-full（Issue #65 正文扩界 → drafts/A14 候选稿 → fresh A 审核 → 用户整版确认）→ 晋级 → B-adjust H12 口径行；只由派单明写的 A-14 事件节点执行。
3. **U1 施工**（coder，一回合）：§5.4 (2)(3)(4)；RED 先行；完成判据：
   ```bash
   cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.SkillAdapterTests test_relay_log.SkillCoreDocTests test_relay_log.WatchTests -v 2>&1 | tail -3   # OK
   grep -c 'stage-stalled\|依赖人工' skill/references/adapter-*.md     # 均 0
   grep -c 'watch-down' skill/references/adapter-*.md                 # 均 ≥2
   grep -c 'sleep 600' skill/references/adapter-*.md                  # 均 ≥1
   cd ../.. && git diff 5ab3bba --stat -- tools/relay-light/relay_log.py   # 仅含 batch 1–3/整改既有改动；且 git diff a6773e7 --stat -- tools/relay-light/relay_log.py 为空（本整改零改动）
   git -c core.quotepath=false diff 5ab3bba -U0 -- tools/relay-light/skill/SKILL.md | grep -c '^@@'   # 3（第 40/287/347 行）
   ```
   外加**钉 `5ab3bba` 的路径审计**（§1.1 四条命令把 `origin/master` 一律替换为 `5ab3bba`；允许路径 = `dispatch/README.md` 当前闭集，U1/U2 不得出现 design/、DevPlan 改动——那些只属 A-14 事件节点）：
   ```bash
   git -c core.quotepath=false diff 5ab3bba --name-only    # 仅允许闭集 + orchestrator 自己的 execution_strategy.md / DevPlan 任务行 + A-14 事件节点已提交的 design 路径（非本 coder 提交）
   git -c core.quotepath=false diff 5ab3bba --stat -- docs/modules/relay-light/relay/ tools/relay-light/install_skill.py tools/relay-light/skill/roles.toml tools/relay-light/skill/dh-mapping.toml AGENTS.md   # 空
   git -c core.quotepath=false diff a6773e7 --name-only -- docs/modules/relay-light/design/ docs/modules/relay-light/dev_plan/ | xargs -r git log --format=%s a6773e7..HEAD -- | grep -v "RLT-A-14\|A14\|B-adjust"   # 空：design/DevPlan 改动只来自 A-14 事件提交
   git status --porcelain --ignored | grep __pycache__   # 空
   ```
   与 §1.6 回归。不用浮动 `origin/master`（已前进到 #67 `13d477b`，对它 SKILL 已 5 hunk，机械误报，F-012）。证据 `evidence/ud3-u1/`（red/green/regression-python/regression-pwsh/path-audit）。signal `DONE.workflow-final.ud3.coder-u1.md`（`phase=workflow-final agent=coder#ud3 batch=na path=ud3 review_round=1 remediation_count=0 verdict=READY`）。
4. **code-round1（fresh，定向 `a6773e7..U1`）**：先于 U2，文案若返工不必重演 H12。
5. **U2 H12 重演**（coder，实测特别授权，§5.6）：signal `DONE.workflow-final.ud3.coder-u2.md`；路径审计同 U1（钉 `5ab3bba`，另加 fixture 豁免 glob）。
6. **code-round2 / requirement / consistency / lesson 四路 fresh 并发**（宪章#5：code-round1 闭合后同一 Review Batch）：code-round2 审测试有效性；requirement 以晋级后 H12 新契约核 U2 证据；consistency 核 design(RLT-A-14) ↔ SKILL ↔ 两 adapter ↔ 测试四方一致；lesson 登记本轮教训候选（例：「兜底机制不能依赖被兜对象的节拍」）。signal `DONE.workflow-final.<path>.ud3.review-round-1.md`。
7. **E2 code_review**：UD-3 差异上**新 fresh attempt**（`DONE.e2-code-review.ud3.attempt-1.md`）；仅 open P0/P1 时同 session targeted attempt 2。
8. **主会话人验**：H12（新契约）+ H11（仍待判）。
9. **收口前**：master 已有 #67（`13d477b`）；PR 前 rebase 与否由 orchestrator/用户决定（#67 只动 SKILL 第 3、8–20 行，与第 40/287/347 行不重叠），worker 不做（F-012）。
- 不重跑：plan-review 原三轮、batch 1–3 batch-review、原 workflow-final 各路结论（对 `a6773e7` 前差异仍有效）。

### 5.6 H12 重演方案（U2）

- **授权与闸**：沿用 README「实测批」特别授权（w4B 开 tab、名以 `rlt18-probe-` 开头、用完关闭）；须 orchestrator 派单明写「实测批」。**watcher 探针是新角色实例**，全部探针启动前走 model-allocation gate 并写 `execution_strategy.md`；派单未给已确认模型 → `BLOCKED.workflow-final.ud3.coder-u2.md reason=probe_model_unconfirmed`。fixture 路径豁免 glob `docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/**` 由 orchestrator 先登记（同 batch 3 / rq1-redemo 先例）。
- **探针**（5 个 agent + 2 条 watch 载体）：`rlt18-probe-u3-lead`（扮 stage-lead）、`rlt18-probe-u3-worker`（扮在场 worker）、`rlt18-probe-u3-watcher-s`（阶段空间 watcher，**Claude kind**，覆盖 D16 Claude 侧 `run_in_background` 写法）、`rlt18-probe-u3-orch`（扮编排）、`rlt18-probe-u3-watcher-o`（编排空间 watcher，**Codex kind**，覆盖 D16 Codex 侧前台 `sleep 600` + `timeout_ms` 写法）；watch 载体为阶段级、编排级各一条（均跑 D13 循环）。lead/orch/watcher 均按 U1 定稿 adapter 原文派单，**不加提示**。
- **建议模型档**（供 orchestrator 走 model-allocation gate，用户可逐行改；未确认不得启动）：

  | 探针 | kind | 建议模型 | 推理档 | 依据 |
  |---|---|---|---|---|
  | rlt18-probe-u3-lead | claude | Claude Sonnet 5 | low | 同 batch-3 lead-claude 已确认档 |
  | rlt18-probe-u3-worker | devin | Devin SWE-2 | medium | 同 batch-3/RQ-1 worker 已确认档 |
  | rlt18-probe-u3-watcher-s | claude | Claude Sonnet 5 | low | UD-5 Q5 低档；Claude 侧写法覆盖 |
  | rlt18-probe-u3-orch | claude | Claude Sonnet 5 | low | 同 batch-3 probe-orch 已确认档 |
  | rlt18-probe-u3-watcher-o | codex | GPT-5.6 Sol | low | UD-5 Q5 低档；Codex 侧写法覆盖，同 batch-3 lead-codex 已确认 argv 形态 |

- **fixture**：`evidence/ud3-h12/fixture/<id>/`（`relay_plan.md` + `relay_log.jsonl` + `config/`，含 `agent_launch note=herdr=rlt18-probe-u3-worker` 与 `monitor_launch note=herdr=rlt18-probe-u3-lead stage_id=<s1>`；`relay_log.py add` 写入；lint exit 0）。
- **步骤**：
  - **节拍实测**（替代原 `sleep 120` 演示冒烟，约 11 分钟，与准备并行）：watcher-o（Codex）首轮检查后进入第一次 600 s 前台调用，按其真实工具超时（`timeout_ms=660000`）跑满，记录调用起止时刻与返回码，证明未被工具超时截断；watcher-s（Claude）同步记录 `run_in_background` 退出唤醒时刻。任一侧断拍 → 停止 U2 写 BLOCKED（`reason=watcher_cadence_broken`），不计入 H12。
  - **准备**（约 10 分钟）：起两条 watch → 起两个 watcher → 摘录两 watcher 首轮检查输出（须判「存活」且静默）；worker 开始一个 ≥15 分钟的长任务（`agent get` = working）；lead、orch 已结束回合。
  - **T1 相对 T0 的安排**（让用户看到接近最坏情况与一个对照）：**H12-A 在 watcher-s 某次检查完成后 ≤30 秒内关**（T1−T0 ≈ 0，发现时延接近 10 分钟上界）；**H12-B 在 watcher-o 下一次检查前约 1–2 分钟关**（T1′−T0′ ≈ 8–9 分钟，发现时延短）。两段均在 `H12.md` 标注 T1−T0 与 T3−T1。
  - **H12-A 阶段级载体被关**：T1 关阶段级 watch 的整个 tab（摘录 T1 时 worker 状态 = working 与 watcher-s 上次检查时刻 T0）；不向任何探针发提示；记录 watcher-s 下一次检查时刻 T3、`[relay-light] watch-down stage <s1>` 原文与到达 lead 的时刻；lead 存活核输出（须为空）与重拉时刻 T4、新 watch PID；worker 回 idle/done 后新 watch 发给 lead 的通知 T5。断言性观察（只记不判）：编排侧无任何 stall 提示；`T3 − T1 ≤ 10 分钟 + 一轮检查耗时`。
  - **H12-B 编排级载体被关**（与 H12-A 并行、共享观察窗，T1′ 按上条错开）：T1′ 关编排级 watch tab（记 T0′）；记录 watcher-o 的 `watch-down plan plan`、编排核存活与重拉时刻。
  - **H12-C 正常结束不误报**：UD-5 Q6 定**不做**；`H12.md` 注明「未演示，依据 UD-5」。
  - **H12-① 进程级**：UD-1① 与 D13 未变，UD-5 Q6 定**不重跑**，`H12.md` 引用 batch-3 既有证据。
  - **两侧覆盖**：D16 两侧写法分别由 watcher-s（Claude）与 watcher-o（Codex）实测；H12-A 只演 Claude 侧 watcher、H12-B 只演 Codex 侧 watcher，`H12.md` 写明「阶段级 × Codex watcher、编排级 × Claude watcher 组合未实测」。
- **10 分钟节拍能否缩短**：**不缩短**（UD-5 Q6）——H12 新契约判的正是「10 分钟是否可接受」，缩短节拍只证明机制、不呈现用户要判的体验。原「`sleep 120` 演示冒烟」删除，改为上方按真实工具超时的 600 s 节拍实测。
- **预计时长**：准备 + 节拍实测并行 ≈11 + H12-A/B 并行观察 ≤15（最长 T1 后 20 分钟截止，截止未发生如实写「截至 T1 后 20 分钟未发生」）+ 收尾 5 ≈ **30–35 分钟**墙钟；watcher 每个约 2–3 次模型回合。
- **产出**：`evidence/ud3-h12/H12.md`（H12-A/H12-B 各节 + 节拍实测节，含 T0/T1/T3/T4/T5 时刻与 T1−T0、T3−T1、原文摘录路径、「操作者介入」节——无介入写「无」），原始摘录放 `evidence/ud3-h12/raw/`；Herdr 输出按白名单过滤（name/agent_status/state_change_seq/pane_id/时刻/prompt 原文）；只写「展示了什么、时刻、内容」，**不写结论**。
- **收尾**：全部 `rlt18-probe-u3-*` 关闭、`herdr agent list` 摘录无残留；`pgrep -af 'relay_log.py watch'` 经 C1-1 过滤后为空；fixture lint exit 0；§1.1 路径审计（fixture 豁免 glob）与 §1.6 回归全绿。

### 5.7 已由 UD-5 裁决（原「待用户」）

用户 2026-09-24 对原 Q1–Q6 的点选见 `decisions.md` UD-5；结论已落进本节正文，此处只作索引：

| 原 # | 裁决 | 落点 |
|---|---|---|
| Q1 设计改动流程 | 本卡同分支走 A-full（RLT-A-14）：Issue #65 正文扩界（该远端动作的授权即此选项文本）、`design/drafts/A14/` 候选稿、fresh A 审核、用户整版确认后晋级 design/01，与代码同一 PR 收口 | §5.1-4、§5.3、§5.5-2 |
| Q2 watcher 粒度 | 每终端空间一个 | D15、§5.4(3) |
| Q3 20 分钟 tick | 只取消存活检查；程序 tick 与 §7.2 通用对账保留，程序零改动，A83 不改 | D17、§5.4(1) |
| Q4 watcher 自身死亡 | 按推荐：派活方对账时见缺席顺带重拉，不设二级兜底 | D22、§5.4(2)c |
| Q5 watcher 模型档 | 按推荐：低档，缺省沿用 roles.toml `[monitor]` 档，roles.toml 不改 | D23、§5.4(2)a、§5.6 模型档表 |
| Q6 H12 重演范围 | 按推荐：H12-A + H12-B 并行，不缩短 10 分钟节拍，H12-① 引用 batch-3 既有证据，H12-C 不做 | §5.6 |

review #14 所列补项的处理：①Issue #65 远端授权——UD-5 Q1 选项文本含该动作，已写入 §5.3（授权只及此一项）；②H12 两侧是否都演——§5.6 定 watcher-s 为 Claude、watcher-o 为 Codex，各覆盖一侧，未实测组合如实登记；③有意无 watch 时 watcher 收声——小决策「连续 3 轮后 `WATCHER_GAVE_UP`」，写入 D18/D19 与 §5.4(2)a，不上交用户。本整改无新增待用户项。
