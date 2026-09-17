# RLT_24 X1 回核 · 代码轮 1 打回路（fresh 复核人，同 R1）

复核人：rlt24-review（reviewer#1）。对象：`git diff 407b4c0..5551624`（X1 整改提交；HEAD=0ff3426 另含 coder 信号与两路定向回核文档）。只核 R1 的 P1/P2 是否闭合、有无引入新问题。

## 结论

**APPROVE**（P1=0，P2=0）。R1 两条判据均闭合且经独立实跑验证，未引入新问题。

## 逐项核验

| # | 项 | 结论 | 级别 | 依据（文件:行 / 命令输出） | 整改动作 |
|---|---|---|---|---|---|
| 1 | R1-P1：`baseline_impl()` 依赖 `git show master:`，CI 浅克隆 detached checkout 下必 ERROR，阻塞 `relay-light-python` 与 `relay-tests-pwsh` 硬门禁 | PASS 闭合 | — | 整改后 `test_relay_log.py:7712–7754`：`git cat-file -e <sha>:<path>` 探测 → 缺失则 `git fetch --depth=1 origin <sha>` → 复核对象存在 → `git show <sha>:<path>`。**自己复刻 CI 形态实跑**：`/tmp/rlt24-ci-verify` = `git init` + `git fetch --depth=1 origin 0ff3426…` + `git checkout --detach FETCH_HEAD`——检出态 0 refs、`rev-list --count HEAD`=1、`master`/`origin/master` 均 rc=128、基线对象缺失（`cat-file` rc=128），与 `actions/checkout@v4` pull_request 一致。跑 `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseBackwardCompatTests`：**3/3 OK（16.4s）**；跑后 `.git/shallow` 含 `0ff3426…` 与 `b41cd2d…` 两行、`cat-file -t` = commit——证明走的是测试内 fetch 回退、非假绿。本地完整克隆直通路径同 3/3 OK。 | 无。 |
| 2 | R1-P1 附带要求：fetch 失败须明确报错、不得静默 skip | PASS 闭合 | — | 代码路径：`fetched.returncode != 0 or present.returncode != 0` → `self.fail`，消息含 spec、fetch rc 与 stderr 摘要（`test_relay_log.py:7740–7753`）。**实测**：浅克隆内将 `BASELINE_SHA` 猴补丁为 `"1"*40` → `cat-file` 失败 → `git fetch` rc=128（`upload-pack: not our ref`）→ 用例 FAIL 且打印完整原因「A158 baseline unavailable… refusing to silently skip」，非 skip、非裸 ERROR。 | 无。 |
| 3 | R1-P2：基线是移动目标（合入后 `master` 含 `resource_close`，退化为自我比较） | PASS 闭合 | — | `BASELINE_SHA = "b41cd2d9e48814c93352f969a085971a60546565"` 钉死。核对：`git rev-parse master`、`origin/master`、`merge-base master HEAD` 三者均为 `b41cd2d`（本卡基线，dispatch/README L12 登记一致）；`git show b41cd2d:tools/relay-light/relay_log.py \| grep -c resource_close` = 0——基线确为第 20 词之前的实现；固定 SHA 在合入后仍指向旧实现，证明力不随 master 漂移。 | 无。 |
| 4 | X1 是否引入新问题（范围/副作用/语义） | PASS | — | X1 diff 仅 `test_relay_log.py`（baseline_impl 及其注释/docstring）+ 工作区工件（evidence/findings/lesson/progress），全在允许路径闭集；`relay_log.py` 零改动；测试文件内已无任何 `master:` revspec。`cat-file` 直通路径令正常克隆零网络零副作用，fetch 仅在对象真缺失时触发；findings X1 节如实登记残余边界（服务端须放行按 SHA 取对象——GitHub 开 allowReachableSHA1InWant，`b41cd2d` 合入后仍是 master 可达祖先；本地路径型 origin 拒发时响报错而非假绿）——口径诚实，非缺陷。 | 无。 |
| 5 | 回归亲跑 | PASS | — | 复跑 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`：exit 0，`Ran 217 tests in 512.817s OK`；复跑 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`：exit 0，内含 Python 217/217 + install 7，`RELAY ALL PASS (SKIPPED: 1)`（既有跳过项）。`git diff --check` 干净；`git status --porcelain` 仅见本卡工作区复核产出，无 `__pycache__`/`.pyc`。 | 无。 |

## 实跑记录（本轮）

```
$ git init /tmp/rlt24-ci-verify && git remote add origin /home/nash/work/dh-relay
$ git fetch --depth=1 origin 0ff3426a4336794d08694ca97f02fe21ea7f3124 && git checkout --detach FETCH_HEAD
$ git for-each-ref | wc -l            → 0
$ git rev-parse --verify master       → fatal rc=128；origin/master 同
$ git rev-list --count HEAD           → 1
$ git cat-file -e b41cd2d…:tools/relay-light/relay_log.py → rc=128（基线对象缺席）
$ cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest \
    test_relay_log.RelayResourceCloseBackwardCompatTests → Ran 3 tests OK (16.386s)
$ cat .git/shallow → 0ff3426… + b41cd2d…（测试内 fetch 落痕）；cat-file -t b41cd2d… → commit
$ BASELINE_SHA="1"*40 猴补丁后同用例 → FAIL：self.fail 消息含 fetch rc=128 与「not our ref」stderr，无 skip
$ worktree 内 python3 -m unittest test_relay_log → 217/217 OK；pwsh run-relay-tests.ps1 → RELAY ALL PASS
```

## 范围外发现

- 无新增。findings X1 节已如实登记「fetch-by-SHA 依赖服务端放行」的残余边界（GitHub 无障碍；极端本地 origin 下响报错），与本复核结论一致。
