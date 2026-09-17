# lesson_candidates — RLT_24

本节点无。后续由 coder 记录可复用教训候选；本文件不是已采纳教训库。

## C1

- L-C1-01：给「读取型命令」新增逐行校验入口时，先把「通用行闸」与「事件语义」拆成两个可复用层（`_ledger_lines` + `_validate_ledger_row` 先行、逐事件语义随后），再让语义层对**原始 note 值**（含非字符串）可见——否则像「非字符串 note 到底报 `ledger`/4 还是 `A155`/2」这种失败层级歧义只能事后补洞。计划评审期就钉死分流层级，本批因此零返工。
- L-C1-02：冻结静态守卫（如 `assertNotIn('"pane"', source)`）可能与后续 oracle 新增的字面量相撞；先读准守卫的精确口径（双引号字面量 ≠ 值域语义），用满足字面约束的写法落实现，比松动守卫安全，也比字符串拼接绕闸诚实。

## C2

- L-C2-01：「条件必填键」的空值要留给条件层判，别被通用「空值拒绝」抢先——`reason=` 若在解析层就按 A155 空值拒掉，`ok` 携带空 reason 就永远报不到 A156 的「必须完全不存在该键」。让该键的空值透传、由 outcome 条件统一裁决，五类反例的错误码才与验收归属一致。

## C3

- L-C3-01：「新旧实现投影一致」做成可执行断言的两个诚实要点——①旧实现用 `git show master:` 物化到 `/tmp` 并 grep 证明它真的不含新特性（`resource_close` 计数 0），否则「相等」可能只是自我比较；②动态字段排除面取最小集（只排 `now` 派生的 `idle_seconds`，账本来源的 `last_ts`/`ledger_silent` 留在比较内），并断言两侧输出键集相同证明排除对称——排除面越大越容易凑绿。兼容批首跑 GREEN 是合法证据，前提是断言本身确实覆盖了验收判据。

## C4

- L-C4-01：同 worktree 并行批的安全姿势可复用——证据批全程不 rebase/stash/reset、产出只落自己的 `evidence/` 子目录、共享文件（progress/findings/lesson）收尾时重读后一次性追加，与另一实例的未提交改动零冲突。
- L-C4-02：「可控失败」取证优先实跑而非打桩——对真实命令喂不存在的探针 id（如 `herdr workspace close <fake-id>`），并用前后资源清单快照自证零误触，比桩更诚实也照样安全；证据文件须明说实跑/打桩。

## X1

- L-X1-01：计划判据超出冻结合同的可计算边界（review.lesson P2；findings F-C1-04、decisions.md 第 1 行）。现象：W1 把「编排空间→F 首节点退 2」写成机器校验判据，W2 计划复审也未识别，施工 C1 撞墙走 BLOCKED→CONSULT 才发现 `object_type=workspace` 两空间共用枚举、四键闭集无扩展位、`object_id` 无命名约定——判据根本不可实现，最终靠用户裁决降为写入者纪律。为什么：验收判据要求的区分，wire format 的键闭集/枚举值/命名约定里根本没有载体。下次怎么做：W1 拆计划与 W2 计划评审对每条「须机器校验退 2」的判据，先核冻结 wire format 的键闭集与枚举能否承载该区分；承载不了的在计划期就标为写入者纪律或上报裁决，不留给施工撞墙。
- L-X1-02：测试依赖本地分支名（`git show master:…`）在 CI 浅克隆 detached checkout 下必崩（review.code-round1 P1）。现象：本地与 dev 机全绿、PR 上 `relay-light-python`/`relay-tests-pwsh` 两硬门禁必红——`actions/checkout@v4` 默认 fetch-depth=1 且无 `master`/`origin/master` ref。为什么：测试把「能取到基线」寄托在一个本地 ref 名上，而该 ref 只存在于全量克隆；且以 `master` 为基线是移动目标，合入后新旧自我比较令断言失效。下次怎么做：凡测试需要仓内 git 对象（基线实现、历史文件）时，把来源钉成固定 SHA——先 `git cat-file -e <sha>:<path>` 探测、缺失再 `git fetch --depth=1 origin <sha>`、fetch 仍失败带原因显式报错，不静默 skip；并用 `git init`+`git fetch --depth=1`+`checkout --detach FETCH_HEAD` 的 /tmp 浅克隆实测一遍取证（本卡见 `evidence/X1-ci-shallow-clone.md`）。
