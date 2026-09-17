# X1 自证 — CI 浅克隆 detached checkout 下 A158 兼容用例可跑

背景：review.code-round1.md P1——`baseline_impl()` 原实现 `git show master:…`
在 `actions/checkout@v4`（默认 fetch-depth=1、detached HEAD、无 `master`/
`origin/master` ref）下必然 rc=128 → 用例 ERROR → `relay-light-python` 与
`relay-tests-pwsh` 硬门禁在 PR 上必红。X1 把基线钉死为本卡基线 SHA
`b41cd2d9e48814c93352f969a085971a60546565`：`git cat-file -e` 探测 → 缺失则
`git fetch --depth=1 origin <sha>` → `git show <sha>:<path>`；fetch 仍不可得
时 `self.fail` 带原因，不静默 skip。

模拟方法：`/tmp/rlt24-ci-sim` 用 `git init` + `git fetch --depth=1 origin
<HEAD sha>` + `git checkout --detach FETCH_HEAD` 复刻 CI 检出形态；origin 指
本仓本地路径 `/home/nash/work/dh-relay`（HEAD sha `407b4c0` 为 `wt/RLT_24`
ref 尖、基线 `b41cd2d` 为 `master` ref 尖，均属 advertised tip，SHA fetch
默认放行——GitHub 侧另有 allowReachableSHA1InWant 兜底）。随后把本 worktree
**修改后**的 `test_relay_log.py` 覆盖进检出（该文件是 HEAD 与 X1 提交间唯一
代码差异，覆盖后等价于在浅克隆里跑 X1 版测试），跑
`RelayResourceCloseBackwardCompatTests` 全类。命令、输出、退出码原样记录。

## 命令与输出（原样）

```
$ rm -rf /tmp/rlt24-ci-sim && git init /tmp/rlt24-ci-sim
已初始化空的 Git 仓库于 /tmp/rlt24-ci-sim/.git/
（另有 init.defaultBranch 中文提示，略）

$ cd /tmp/rlt24-ci-sim && git remote add origin /home/nash/work/dh-relay
$ git fetch --depth=1 origin 407b4c064e98525dd16d852789a5d7e71efb3712
来自 /home/nash/work/dh-relay
 * branch            407b4c064e98525dd16d852789a5d7e71efb3712 -> FETCH_HEAD
FETCH_EXIT=0

$ git checkout --detach FETCH_HEAD
HEAD 目前位于 407b4c0 docs(relay-light): RLT_24 R1 code-round1 REVISE (CI shallow checkout baseline)
CO_EXIT=0

$ git rev-parse --verify master        → fatal: 需要一个单独的版本    (rc=128)
$ git rev-parse --verify origin/master → fatal: 需要一个单独的版本    (rc=128)
$ git show master:tools/relay-light/relay_log.py >/dev/null
  → fatal: 无效的对象名 'master'                                       (rc=128)
$ git cat-file -e b41cd2d9e48814c93352f969a085971a60546565:tools/relay-light/relay_log.py
  → fatal: 路径 'tools/relay-light/relay_log.py' 在磁盘上，但是不在 'b41cd2d…' 中 (rc=128)
$ git cat-file -t b41cd2d9e48814c93352f969a085971a60546565
  → fatal: git cat-file: could not get object info                     (rc=128)
$ git rev-list --count HEAD            → 1   （浅克隆，仅 1 个提交）
```

即：检出形态与 CI 一致——无 `master`/`origin/master` ref、detached HEAD、
基线对象缺失，旧 `git show master:` 行为 rc=128（P1 故障复现）。

```
$ cp <worktree>/tools/relay-light/test_relay_log.py tools/relay-light/test_relay_log.py
$ cd /tmp/rlt24-ci-sim/tools/relay-light
$ PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseBackwardCompatTests
...
----------------------------------------------------------------------
Ran 3 tests in 15.934s

OK
EXIT=0
```

跑后核验（证明走的是 fetch 回退路径而非假绿）：

```
$ git cat-file -t b41cd2d9e48814c93352f969a085971a60546565   → commit（测试内 fetch 已物化基线对象）
$ cat .git/shallow
407b4c064e98525dd16d852789a5d7e71efb3712    ← 检出时 fetch
b41cd2d9e48814c93352f969a085971a60546565    ← 测试内 `git fetch --depth=1 origin <sha>` 追加
$ git show b41cd2d…:tools/relay-light/relay_log.py | grep -c resource_close
0   ← 基线确实是不含 resource_close 的旧实现，非自我比较
```

## 对照：本地（对象已在库，走 cat-file 直通路径）

```
$ cd <worktree>/tools/relay-light
$ PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseBackwardCompatTests
...
----------------------------------------------------------------------
Ran 3 tests in 15.301s

OK
EXIT=0
```

## 结论

- 浅克隆 detached、无 `master`/`origin/master`、基线对象缺失的 CI 形态下，
  X1 版 `baseline_impl()` 经 `cat-file -e` 失败 → `git fetch --depth=1 origin
  b41cd2d…` → `git show <sha>:<path>` 链路取回旧实现，3/3 用例 OK。
- 本地完整克隆下对象已存在，直通路径同样 3/3 OK。
- fetch 失败路径以 `self.fail` 报错并带 fetch rc 与 stderr 摘要，不静默
  skip；A158 在门禁环境的证明力保留。
