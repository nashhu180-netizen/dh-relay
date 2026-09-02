<!-- dh:v1 -->
# DHR-B-35 · 第二轮定向复审 brief

你是 **B-调整定向复审者**（`b35ver1`），fresh、只读，不改文件、不拉终端、不派活、不问用户。

## 待审对象

`docs/modules/dh-relay/dev_plan/drafts/DHR-B-35-driver持续观测与定向回归复绿-候选.md`（**v2**）。第一轮两名审核者提出 9 个议题（草案 §8 列了每条与主控裁决），主控称全部采纳并改写。

## 你要做的

1. 逐条核 §8 的 9 个议题：v2 正文是否**真的**把它改到位（不是只在 §8 写「采纳」）。每条给 `到位 / 未到位（说明差在哪）`。
2. 重点独立核三处，须自行打开源码：
   - 出口⑤「actor 结束或失租 → driver fail-closed 退出」是否与 `relay-core/runtime/host.mjs`（`E_LEASE_HELD:lease-lost`）、`relay-core/runtime/service.mjs:445-480`（只认 `actor-closed` 重建 gate）的现役语义兼容，会不会反过来破坏 DHR_70 的晚交路径。
   - §2 关于「读模型无独立 open Attention 对象、CLI 分堆由 group 派生」的陈述是否属实（`relay-core/store/store.mjs` `openAttentions`/`readOpenAttentions`、`relay-core/store/state.mjs`、`relay-core/runtime/discovery.mjs`）。
   - DHR_71 / DHR_72 对 `relay-core/test/herdr-adapter.test.mjs` 的用例行级切分（`:242`/`:279`/`:305` vs `:354`/`:510`）是否真的不共享夹具；若共享，指出哪一段。
3. 只报**新增** P0/P1；P2 及措辞随手列，不展开。
4. 对 D-B35-6、D-B35-7 的 v2 措辞给出「可交用户确认 / 仍需改」的判断。

## 产出

```
## 结论：PASS / 不通过
## 9 条逐核
## 新增 P0/P1
## 三处独立核对
## D-B35-6 / D-B35-7
## 我实际打开了什么
```
