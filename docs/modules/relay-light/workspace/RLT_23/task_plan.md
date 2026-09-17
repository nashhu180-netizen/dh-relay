# RLT_23 · 分批施工计划（W1）

权威顺序：DevPlan「#### RLT_23」目标、非目标、范围和轻档 → 设计 §11 `HC-RL-A151`～`A154`（并与 `A140` 一致）→ RLT_11 F-003/F-005/F-006/F-007。Issue #38，基线 `7cee7ed`，任务 worktree `wt/RLT_23`。W1 只规划；W2 审完、编排派批后 coder 才改 skill。

## 批次切法与依赖

两批均可在一个 coder 回合写完并自证。C1 聚合监工运行时观察：A151 投递确认、A153 判活；C2 聚合启动与退场：A152 按主控侧启动、A154 F 阶段删树确认。这让每批能凭各自明确的文本和反查命令给 checker 一份完整证据。**前置**：C2 必须等 C1 的 checker PASS，因为两批都编辑 `SKILL.md` 与 adapter；C2 基于最新 HEAD 增补，不覆盖 C1。除这项同文件顺序依赖，任一批的 HC 判据不借另一批的测试结果。

## 每批共通约束

1. 只改 `tools/relay-light/skill/**` 与 `docs/modules/relay-light/workspace/RLT_23/**`。不改 `tools/relay-light/*.py`（含测试、安装器）、design、DevPlan、AGENTS、其它卡工作区、历史工件或 `~/.claude` / `~/.codex` 已安装副本。**不跑 `install_skill.py`**。
2. 每批在本任务 worktree 跑两条回归并在 `progress.md` 记录原命令、退出码、必要输出摘要；若失败记录真实失败和 BLOCKED，不能写成 PASS：

   ```bash
   cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill
   PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
   ```

   第二条从仓根执行。测试命令必须逐条带 `PYTHONDONTWRITEBYTECODE=1`；已有 `__pycache__` 只登记 pre-existing，不删。`test_relay_log.py` 的 `SkillCoreDocTests`、`SkillAdapterTests`、A140/A149 结构断言和 `test_install_skill.py` 的五文件清单为现有回归靶，不改测试使之变绿。
3. 以 `git diff master --name-only` 核本卡从基线的已跟踪差异，以 `git diff --name-only`、`git diff --cached --name-only`、`git ls-files --others --exclude-standard` 覆盖工作树/index/untracked；四集合均只含允许路径。`git diff --check` 必须零错误。提交只 `git add` 点名文件，禁止 `git add -A` / `git add .`；scope 用英文 `relay-light`，不 push。
4. coder 每批在 pane 给四行小结：`做了什么 / 证据 / 偏离与 findings / 下一步`，缺项写「无」；在 `progress.md` 记证据 ID、命令、退出码、改动路径及批次信号。范围外发现只记本卡 `findings.md`。checker/复核者不替 coder 修改 skill。
5. 本卡是轻档文本任务；各 HC 的逐字命中和零命中反查是本批新增的机器证。已有单测绿只证明旧结构未回归，不代替新增机器证或后续独立复核。

## C1 · 派活通知投递与监工判活（A151、A153）

- **目标**：通知必须确认实际送达；`agent_lost` 判断须使用三种活性证据，不能把 pane 的 `working → done` 当作收工；A140 的 `ledger_silent` 口径保持有效。
- **文件与插入锚点**：
  - `tools/relay-light/skill/SKILL.md`：在 `## 五阶段模板` 之前、`**批内不换人**` 段之后新增 `## 派活纪律与监工判活`，放 A151 和 A153 两条原文。不要改 A140 的 `**ledger_silent** 处置` 原文。
  - `tools/relay-light/skill/references/adapter-claude-code.md` 与 `adapter-codex.md`：两者 `## 派活提交纪律` 中现有「`agent start` 后先 wait --until idle 再 prompt」段之后补 A151；两者 `## stalled 处置` 之后、`## ledger_silent 处置` 之前新增 `## agent_lost 判活（监工模板）`，放 A153。不要改现有 `ledger_silent` 段。
- **拟写入纪律原文（以下两句在三份文件各原样一处；不用同义改写）**：

  > 向 agent 发通知后必须读 pane 末行确认实际投递；pane 出现 `queued` 排队提示时补 `send-keys enter` 并复核送达；未确认投递不得当作已通知。

  > pane 的 `working → done` 不等于 agent 收工（长 `sleep` 中也会被报 `done`）；判 `agent_lost` 前必须同时确认 pane 无 `Running tools` 计时器在走、账本无该 agent 新行、Herdr `agent get` 状态非 working；不得单凭 pane 状态判死重拉。`ledger_silent` 仍按 A140 核 Herdr 状态 + pane 末行 + 允许路径产出：三者均无变化才中断；任一仍在变化不得中断。

- **机械核验（从仓根执行；第一、二条的文件命中数均为 3，各文件恰一次）**：

  ```bash
  rg -l -F '向 agent 发通知后必须读 pane 末行确认实际投递；pane 出现 `queued` 排队提示时补 `send-keys enter` 并复核送达；未确认投递不得当作已通知。' tools/relay-light/skill/SKILL.md tools/relay-light/skill/references/adapter-{claude-code,codex}.md | wc -l
  rg -l -F 'pane 的 `working → done` 不等于 agent 收工（长 `sleep` 中也会被报 `done`）；判 `agent_lost` 前必须同时确认 pane 无 `Running tools` 计时器在走、账本无该 agent 新行、Herdr `agent get` 状态非 working；不得单凭 pane 状态判死重拉。' tools/relay-light/skill/SKILL.md tools/relay-light/skill/references/adapter-{claude-code,codex}.md | wc -l
  rg -l -F '三者均无变化才中断' tools/relay-light/skill/SKILL.md tools/relay-light/skill/references/adapter-{claude-code,codex}.md | wc -l
  rg -l -F '任一仍在变化不得中断' tools/relay-light/skill/SKILL.md tools/relay-light/skill/references/adapter-{claude-code,codex}.md | wc -l
  rg -n -e '发出即视为送达|发出即送达|通知发出即完成|只凭 pane.*(done|agent_lost)|仅凭 pane.*判死' tools/relay-light/skill/SKILL.md tools/relay-light/skill/references/adapter-{claude-code,codex}.md
  ```

  第三、四条预期各 3；末条预期零行且 `rg` 退出 1。A153 还要人工核同一句中三要素同时为否时才判 lost，不能仅靠三个词分散命中。A140 原段不删不弱化。
- **回归**：本计划「每批共通约束」两条命令；逐条登记退出码。
- **预期证据落点**：上述三份 skill 文本、本卡 `progress.md` 的 `E-C1-*`（命中/反查、回归、四集合路径、commit SHA）与 `check.C1.md` 的独立批次结论。

## C2 · 主控侧启动分叉与 F 收口（A152、A154）

- **前置与目标**：C1 checker PASS 后读取最新三份文件；把现有 adapter `## 环境预检（拉起前）` 近第 47/49 行的无主控侧条件 bypass 句收窄为按主控侧的条件，F 阶段加独立可勾选删树行。Codex 主控下沿用既有 bypass 结论；Claude 主控下 codex worker 使用默认 sandbox。
- **文件与插入锚点**：
  - `tools/relay-light/skill/SKILL.md`：在 C1 新增的 `## 派活纪律与监工判活` 段续加 A152；在 `### F 阶段模板` 的 scribe 表格闭合后、下一个 `## 账本用法` 之前加 `**F 阶段收口 checklist**` 及独立复选行。不要改 R 模板、F 表格 node/agent 行或 A140 段。
  - 两份 `references/adapter-*.md`：逐份改写 `## 环境预检（拉起前）` 原 bypass 段，写明下方两句主控侧分叉；保留只读启动失败、`NOT_RUN`、`launch_fix=` 与提示词只读约束的现有条件机制，不允许出现无主控限定的「改用 bypass」命令句。`## agent 拉起` 的 codex/claude 命令形态保持原状。
- **拟写入纪律原文（两份 adapter 各两句；skill 派活纪律段也各一处）**：

  > Claude 主控下 codex worker 以默认 sandbox 启动，不加 `--dangerously-bypass-approvals-and-sandbox`；worker 只在 worktree 内写文档时默认 sandbox 已够。

  > Codex 主控下沿用既有 bypass 结论；仅在该主控侧的沙箱型只读启动不可用且账本连续 `NOT_RUN` 时，按环境预检改用 bypass 沙箱启动，提示词明确只读约束，并在 `agent_launch.note` 记录 `launch_fix=<token>`；不得把 bypass 写成无条件全局口径。

  原环境预检段改为以上条件化文本后，`launch_fix=` 所需 `note` 事实、无 `plan_amend`、不改计划 `launch` 列仍应明确保留。若两侧实际命令差异需要保留，置于两句之后、带同样主控条件，不能另立无条件例外。

- **F 模板拟写入独立行（逐字；不能并入说明段或其它 checklist 行）**：

  ```markdown
  **F 阶段收口 checklist**

  - [ ] 确认对应 worktree 已删（`git worktree list` / `git branch` 核对），先关终端空间再删树。
  ```

- **机械核验（从仓根执行）**：

  ```bash
  rg -l -F 'Claude 主控下 codex worker 以默认 sandbox 启动，不加 `--dangerously-bypass-approvals-and-sandbox`' tools/relay-light/skill/references/adapter-{claude-code,codex}.md | wc -l
  rg -l -F 'Codex 主控下沿用既有 bypass 结论' tools/relay-light/skill/references/adapter-{claude-code,codex}.md | wc -l
  rg -c -F 'Claude 主控下 codex worker 以默认 sandbox 启动' tools/relay-light/skill/SKILL.md
  rg -c -F 'Codex 主控下沿用既有 bypass 结论' tools/relay-light/skill/SKILL.md
  sed -n '/^### F 阶段模板/,/^## 账本用法/p' tools/relay-light/skill/SKILL.md | rg -c -F -- '- [ ] 确认对应 worktree 已删（`git worktree list` / `git branch` 核对），先关终端空间再删树。'
  rg -n -e 'codex.{0,16}一律.{0,16}bypass|codex.{0,16}总是.{0,16}bypass|所有 codex.{0,16}bypass|无条件.{0,12}bypass|^(拉起每个 agent 前.*改用 bypass 沙箱启动)' tools/relay-light/skill/SKILL.md tools/relay-light/skill/references/adapter-{claude-code,codex}.md
  ```

  前两条各预期 2，第三、四、五条各预期 1；末条零行且 `rg` 退出 1。**另须人工逐段反查**两份 adapter 的 `## 环境预检`：任何实际建议 bypass 的句子都必须附着 Codex 主控条件；不能只靠禁词扫描。F 项独立行须保留 Markdown `- [ ]`，本卡施工时不得勾选它。
- **回归**：本计划「每批共通约束」两条命令；逐条登记退出码。
- **预期证据落点**：三份 skill 文本、本卡 `progress.md` 的 `E-C2-*`（分叉/F 命中、反查、回归、四集合路径、commit SHA）与 `check.C2.md`。

## 统一停止与 F 阶段归属

DevPlan 四项非目标均为硬边界：不动账本 schema/事件类型；不改设计正文；不改 Herdr 或 devin 排队行为；不追溯历史 workspace。需越界、条文冲突或回归失败时，coder 在本卡 `findings.md` / `progress.md` 记事实和 `BLOCKED` 信号，停止当前批，交编排。不得以「软提醒」替代 A151～A154 的逐字纪律。

F 阶段收口由**编排**负责：合并后先关终端空间，再核对并删除对应 worktree；skill 两侧重同步在合并后从 **master 主检出**执行，逐文件比对 sha256。此同步和删树都不属于 C1/C2，worker 不跑 `install_skill.py`、不操作两侧安装副本、不代签 verify/人验。
