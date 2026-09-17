# R1 · reviewer — 代码轮 1（标准档必做，先于其余两路）

先读同目录 `README.md`。你是**复核**，只读不改、不提交，做完即停。**不采信施工者自述，自己回原始来源核、自己跑。** 施工者不复核自己的卡——你是 fresh 实例。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_24`。

## 范围
`git log --oneline master..HEAD`、`git diff master --name-only`、`git diff master -- tools/relay-light/`。

## 判据（逐条 PASS/FAIL，FAIL 给 P1/P2 与整改动作）
1. **正确性**：`resource_close` 实现逐条对照 design/01 第 257、301–328 行——编码（裸字符集、`%HH` 大小写、`+` 不当空格、单次解码、无效 UTF-8/控制字符拒绝、非法 `%`）、token 规则（单空格、首尾/连续空格、Tab/换行、每 token 恰一个裸 `=`）、闭集大小写敏感、重复/未知/缺键/空值、写入者（pane→monitor；workspace/worktree→orchestrator，`by` 与 `agent` 前缀一致）、node 存在且非 superseded、不进 agent 状态机、不改节点/阶段派生、add 拒绝时账本字节不变、lint 同一校验集并报 seq/字段。自己构造边界输入实跑 CLI 验证至少 10 例（含 `%2b`/`%2B`、`+`、`%ZZ`、`%C3`（截断 UTF-8）、`%0A`、`reason=%20%20`、键顺序打乱）。
2. **不误伤**：非 `resource_close` 事件的自由 note 未被解析；rlt12-win-01 账本 lint 0；既有断言未被删除或削弱（`git diff master -- tools/relay-light/test_relay_log.py` 看删除行）。
3. **测试有效性**：新用例能在旧实现上失败（抽 3 条用 `git show master:tools/relay-light/relay_log.py` 替换到临时目录跑，证明非空测）；A2 20 词断言、A155/A156/A158 oracle 每个「怎么证明」要素有对应用例。
4. **代码质量**：add 与 lint 是否共用同一校验函数（避免漂移）；错误信息指明 seq/字段；无死代码、无把 wire format 常量散落多处。
5. **回归**：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` 与 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 自己复跑，记退出码与用例数；`git status --porcelain` 无新增 `__pycache__`。

## 产出
`workspace/RLT_24/review.code-round1.md`：
```
## 结论
APPROVE | REVISE   （有任一 P1 即 REVISE）
## 逐条判据
| # | 判据 | 结论 | 级别 | 依据（文件:行 / 命令输出） | 整改动作 |
## 实跑边界输入记录
## 范围外发现
```
并在 `review.md`「复核路径登记」code-round1 行填结论。信号：
```
DONE task=RLT_24 role=reviewer-code1 node=R1 status=<APPROVE|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: review.code-round1.md, review.md
```
