# rework-brief · DHR-BL-10 返工轮 4（收敛 E5 判违反的候选-1/5/6/12 + 需求复核 RQ-2/RQ-3）

铁律同前：不 commit / push / stash / reset / checkout；不派活；不问用户；卡住写 progress 后 `DONE(blocked)`。
**工作树里有大量未提交成果，弄丢即事故。**

## 前情（主控已处理，你不用管）

- 需求复核 RQ-1（P1「大小写 fail-closed 未获用户授权」）已由**用户 2026-08-27 在对话里点选「接受，补进需求」**。
  主控已把该行为变更正式写进 `backlog.md` 的 `DHR-BL-10` 条目与 `brief.md` 完成条件 **9 / 10**。你按新口径干活即可。
- 完成条件 6 已按 RQ-2 重写并新增 6b（散文里的检索模式字面量不算命中）。

## 任务 A（核心）：给第 34 行实拉分支补直接断言

**缺口**：返工轮 3 加的 `worker entry exits nonzero under real -NoExit launcher on miscased cli` 断言
传的是 **`-DryRun`**（见 `tools/tests/relay-agent-tool.ps1` 该用例的 ArgumentList），所以它只覆盖了**第 31 行**的 default，
**第 34 行（实拉分支）的 default 至今没有任何直接断言**。教训复核判此处违反候选-1（每个分支都要有断言）、
候选-6（断言要配变异对照）、候选-12（部分证据写成整条兑现）、候选-5。

**做法**（沿用教训复核给的方案，比"真的拉起 CLI"安全）：

1. 复用你在返工轮 1 发明的 PATH/PATHEXT stub 技术（`relay-zcode-stub-` 那段）。
2. 在同一隔离目录里放**三个 sentinel stub**：`claude.ps1` / `codex.ps1` / `zcode.ps1`，每个被调用时往各自的 sentinel 文件写一行标记后 `exit 0`。
3. **不传 `-DryRun`**，以真实 launcher 形态启动：`pwsh -NoProfile -NoExit -File <entry> ... -Cli CLAUDE`。
4. 有界等待（≤15s 轮询），断言三条：
   - 进程**已退出** ∧ **退出码 = 4**
   - `claude` sentinel 文件**不存在**（证明没拉起 claude）
   - `codex` sentinel 文件**不存在**（证明没掉进旧 else 去拉 codex —— 这是本卡最初那个 bug 的反向证据）
   断言名建议：`worker entry real-launch branch rejects miscased cli without invoking any cli`
5. 再补一条 `-Cli CODEX` 的同形断言（同样三条检查）。
6. `finally` 恢复 PATH/PATHEXT、清临时目录、兜底 Kill 残留进程。**绝不允许留下挂起的 pwsh。**

**变异对照（候选-6 硬要求）**：把**第 34 行**的 `-CaseSensitive` 临时去掉，该断言必须变红
（去掉后 `CLAUDE` 会匹配 `'claude'` 分支 → 拉起 claude sentinel → 断言失败）。红相位输出记 `progress.md`，确认后还原并核 SHA256。

## 任务 B：修一处引号缺陷

`tools/tests/relay-agent-tool.ps1` 返工轮 3 那个用例的 ArgumentList 里，`-WorkDir` 的值写成了
`"`"$(Join-Path $root 'work')`'"` —— **开头是转义双引号、结尾却是转义单引号**，不配对。
当前断言仍绿（因为 default 分支先于路径使用触发退出码 4），但这是潜在缺陷。改成两端配对的写法并复跑确认仍绿。

## 任务 C（收敛需求复核 RQ-3）：给 e2e 证据补可归因来源

**问题**：`evidence/e2e/` 七份工件能证明协议字段自洽，但**不能独立证明它们由真实 zcode 进程产生**——静态文件可事后手写。

**做法**：重跑一次 e2e，并额外捕获可交叉验证的来源证据，落到 `evidence/e2e/provenance/`：

1. `launch-command.txt`：本次拉起的**完整命令行原文**。
2. `process.txt`：worker 进程的 PID、启动时刻、退出码、退出时刻（用 `Start-Process -PassThru` + `StartTime` / `ExitTime` / `ExitCode`）。
3. `zcode-session.txt`：本次 zcode 进程写下的**自有会话记录**的交叉引用——`~/.zcode/cli/rollout/` 下在本次时间窗内新增/更新的 `model-io-sess_*.jsonl` 的**文件名、大小、mtime**（**只记元信息，绝不拷贝文件内容**——里面有完整 prompt 与模型往返，且可能含路径与凭据形态）。
4. 在 `provenance/README.md` 里写清**如何交叉验证**：进程启动/退出时刻 ⊂ rollout 文件 mtime 窗口 ⊂ 四份工件的 `written_at` 区间，三者时间线互相咬合，静态伪造无法同时满足。

**密钥闸**：`provenance/` 拷进仓前逐份扫描；`zcode-session.txt` 只允许出现文件名/字节数/时间戳。

## 任务 D：回填

- `findings.md`：编号**先看清当前最大号**再顺延（本卡已发生过一次编号偏差）。新增：
  - RQ-1 的最终处置（用户已授权，已补进 backlog 与 brief 完成条件 9/10）→ resolved
  - RQ-2 的处置（完成条件 6 已重写 + 新增 6b）→ resolved
  - RQ-3 的处置（provenance 已补）→ resolved
  - 教训复核判违反候选-1/5/6/12 的收敛登记 → resolved
  - 任务 B 的引号缺陷 → resolved
  - **F-013 保持 open**（成功路径 `exit $code` 在 `-NoExit -File` 下同样不终结进程，范围外，转 backlog）
- `lesson_candidates.md`：按教训复核的裁决**修订**——L-001 与 L-003 标 `rejected`（复核判不够格，理由分别是"没有由错误归纳出可迁移教训"与"『天然隔离』过强、独立性仍需四层实核"）；
  L-002 与 L-004 按其建议改措辞（L-002 收窄为「每个**拟使用**的参数须实测」；L-004 改为「涉及**语言默认语义**的重构/扩展，先核对适用的既有教训」）。
  再追加一条：`-NoExit` + `-File` 形态下 `throw` 与 `exit` 都不终结进程，只有 `[Environment]::Exit()` 会——给由 launcher 拉起的脚本设计失败路径，必须按**真实 launcher 形态**验证。
- `progress.md`：日志 + 证据（任务 A 红/绿、任务 B、任务 C 的 provenance、全量回归）。
- `visual_map.md`：补返工轮 4 步骤行。
- **不动 `review.md` 的独立复核区与人类签名区**；变异点登记表若锚点行号漂了就更新。

## 完成信号

结构化 DONE，含：任务 A 的断言名与红/绿实测输出、任务 B 的前后写法、任务 C 的 provenance 落点与三条时间线的实际值、
findings 新增编号、`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 末行原文、最终断言数、确认无残留 pwsh。
