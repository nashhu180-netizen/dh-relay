# DHR_53 旧实施 path/blob manifest

> 用途：在删除旧 `wt/DHR_53` worktree 与施工分支前，保存被 DHR-A-23/DHR-B-21 取代的实现身份。本文不使旧实现重新生效，也不作为新 DHR_53 的验收证据。

## 1. 身份

| 字段 | 值 |
|---|---|
| 生成日期 | 2026-08-27 |
| 旧 worktree | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\DHR_53` |
| 旧分支 | `refs/heads/wt/DHR_53` |
| merge base | `669934b9a4b6ea67e6e03633b9e38a7e88cf8b46` |
| legacy HEAD | `fec9ec1bbbab90813d7d3f3aad1dc847c317ca81` |
| legacy tree | `6452aebbab080ea6002ddd749b6cbc8061352744` |
| 退场前状态 | `git status --porcelain=v1 --untracked-files=all` 为空 |
| 完整 tree 路径数 | 769 |
| 相对 merge base 变更路径数 | 61 |
| archive tag | `refs/tags/archive/DHR_53/pre-A23-fec9ec1` |
| archive tag object | `03495673319c77693acefed9879718a398087556`（annotated tag） |
| archive peeled commit | `fec9ec1bbbab90813d7d3f3aad1dc847c317ca81` |

## 2. 旧提交链

| commit | tree | subject |
|---|---|---|
| `b619e4ae72e3f910b8dcda4908e71e6c927200af` | `b63c64aec3f8de6b30e0f39a77b0d245080fb79f` | `feat(dh-relay): 冻结 DHR_53 Plan/ResolvedPlan/RunBinding 契约` |
| `cb8a91136ab7ebcbe2f67e9085178c16ceaffcc3` | `5efa05afd1153aef2d1b4fda63516669f4d33b7f` | `feat(dh-relay): DHR_53 确定性 Plan Resolver` |
| `e03cee45a4aaf60f577e5895b75f1a6c34fe1fa4` | `b11e85101d36fde39fc2036243b6bffaf7ab4b3b` | `docs(dh-relay): DHR_53 记轮1复核结论与后端切换决策` |
| `fec9ec1bbbab90813d7d3f3aad1dc847c317ca81` | `6452aebbab080ea6002ddd749b6cbc8061352744` | `fix(dh-relay): DHR_53 收敛代码复核轮1的6条发现` |

## 3. 相对 merge base 的 path/blob 清单

`0000000000000000000000000000000000000000` 表示该侧不存在路径。清单来自：

```powershell
git diff --raw --no-abbrev --no-renames 669934b9a4b6ea67e6e03633b9e38a7e88cf8b46..fec9ec1bbbab90813d7d3f3aad1dc847c317ca81
```

| 状态 | base blob | legacy blob | 路径 |
|---|---|---|---|
| M | `9993820eb887270066b6cb88ddfe16b8d64cf469` | `868e64c35d193b350cff8694e630cbb874591788` | `docs/modules/dh-relay/workspace/DHR_53/decisions.md` |
| M | `dd13294780425e2a6c19d034f1f42d9b4540d3de` | `a9ff863ce6d95381c51c0fe4189368378d39e42a` | `docs/modules/dh-relay/workspace/DHR_53/findings.md` |
| M | `8f1a65d47bcb9f1501f9dfb3f9893b3e5b57a5e2` | `e3aac45aec878dfa5a9072ae779502d895cc3da9` | `docs/modules/dh-relay/workspace/DHR_53/progress.md` |
| M | `28e522aaff86d272b3bc218bc3c22d67b7d29fc9` | `d0ef69920321361ad81f1a9c205ccedcf79dda07` | `docs/modules/dh-relay/workspace/DHR_53/review.md` |
| A | `0000000000000000000000000000000000000000` | `f2cff04d828ee965176df3f52f2f021befbb25b6` | `docs/modules/dh-relay/workspace/DHR_53/reviews/r1-batch1-codex.md` |
| M | `02a78e41fcc5f31f25210103b863feefbaa4d438` | `d4454d0d743ce8f90f90fd01c1e08718c8bc529e` | `relay-core/capability-baseline.json` |
| M | `a20fc0d15fa2ebdb69ca1a49eb563a71b2ede94f` | `86fc10c0a3935846e3a8f19e984ea50c6e75615b` | `relay-core/contracts/reason-codes.md` |
| A | `0000000000000000000000000000000000000000` | `fbb5f262a6d9790d63ed8c6b6d9bcccb3f67efd0` | `relay-core/contracts/relay.plan.v1.schema.json` |
| A | `0000000000000000000000000000000000000000` | `614c27260fb0681ea699e2a271987c9b58ec09a1` | `relay-core/contracts/relay.resolved-plan.v1.schema.json` |
| A | `0000000000000000000000000000000000000000` | `74528648d2287d8f0529aebeb555428811c64769` | `relay-core/contracts/relay.run-binding.v1.schema.json` |
| D | `eda40c6951afce5e1ffe9e809fd7dc25942fd0fa` | `0000000000000000000000000000000000000000` | `relay-core/contracts/v0-shapes/relay.resolved-plan.v1.shape.json` |
| A | `0000000000000000000000000000000000000000` | `5f5a3396d7ccab55d33a7935de135d4657ad1aaa` | `relay-core/fixtures/golden/plan.v1.json` |
| A | `0000000000000000000000000000000000000000` | `e611c3c5cc6a8a3caab2dae0dc19d3913fa8154b` | `relay-core/fixtures/golden/resolved-plan.v1.json` |
| A | `0000000000000000000000000000000000000000` | `765d11ab980d65718ded5f7ce2ec10c72e6b30b3` | `relay-core/fixtures/golden/run-binding.v1.json` |
| M | `015905f82440f31d6948b499c84aea3f5c0be573` | `c390b85b638b606168f68b4077a39ef23a647faa` | `relay-core/fixtures/manifest.json` |
| A | `0000000000000000000000000000000000000000` | `a184fdcc442394fecbe85c3b2eb32d1b1283a69d` | `relay-core/fixtures/negative/plan-absolute-locator.expect.json` |
| A | `0000000000000000000000000000000000000000` | `254da73c4bdef7260e9e61bb48ae758c061062d0` | `relay-core/fixtures/negative/plan-absolute-locator.json` |
| A | `0000000000000000000000000000000000000000` | `559b5e163e038e79d086740e9d35f2aabc980e5c` | `relay-core/fixtures/negative/plan-carries-acceptance-copy.expect.json` |
| A | `0000000000000000000000000000000000000000` | `2ad4f184c06456a876e022dba57e558967ba3abb` | `relay-core/fixtures/negative/plan-carries-acceptance-copy.json` |
| A | `0000000000000000000000000000000000000000` | `19d55d59ba83c9755e17b1141114cbb497bafe24` | `relay-core/fixtures/negative/plan-locator-escape.expect.json` |
| A | `0000000000000000000000000000000000000000` | `8c8cf1b84249c08b85adecaba7fa615e8f9734a8` | `relay-core/fixtures/negative/plan-locator-escape.json` |
| A | `0000000000000000000000000000000000000000` | `a8b9bf2c49d1f2c3eb1b95062d6cafe6c127d4c9` | `relay-core/fixtures/negative/plan-missing-task-id.expect.json` |
| A | `0000000000000000000000000000000000000000` | `f6e55c9057bc34bb17bbdd6ea215797a442e8aab` | `relay-core/fixtures/negative/plan-missing-task-id.json` |
| A | `0000000000000000000000000000000000000000` | `0698a097db496ff1bb2480175700c6d7e414ecca` | `relay-core/fixtures/negative/plan-unknown-field.expect.json` |
| A | `0000000000000000000000000000000000000000` | `65b7b4e36001ea0e1a746cbc002292f424bb3fc6` | `relay-core/fixtures/negative/plan-unknown-field.json` |
| A | `0000000000000000000000000000000000000000` | `d6c13cd5d16ee41efe9106ebd424defcb39aca4e` | `relay-core/fixtures/negative/plan-writes-run-id.expect.json` |
| A | `0000000000000000000000000000000000000000` | `53e0ea98ad9e5af11707743b522a7f9dcefcb40b` | `relay-core/fixtures/negative/plan-writes-run-id.json` |
| A | `0000000000000000000000000000000000000000` | `42a43f666a89fdee98c318294eec11fe55a33b5c` | `relay-core/fixtures/negative/resolved-plan-duplicate-node-id.expect.json` |
| A | `0000000000000000000000000000000000000000` | `3468439eb266c6d269b7d64352545ae9647f5cc4` | `relay-core/fixtures/negative/resolved-plan-duplicate-node-id.json` |
| A | `0000000000000000000000000000000000000000` | `bdd33973ff134924e9120ec6a7afbe0f4c516350` | `relay-core/fixtures/negative/resolved-plan-heavy-missing-path.expect.json` |
| A | `0000000000000000000000000000000000000000` | `40d4162029a2373c20b484e9644efa841e4f2d77` | `relay-core/fixtures/negative/resolved-plan-heavy-missing-path.json` |
| A | `0000000000000000000000000000000000000000` | `22cb06c24b9b67b2d8f1b5a4b1657c2dde106f33` | `relay-core/fixtures/negative/resolved-plan-illegal-downgrade.expect.json` |
| A | `0000000000000000000000000000000000000000` | `0b9c662f4cfa484dc87891f4db6e80ec08776ab8` | `relay-core/fixtures/negative/resolved-plan-illegal-downgrade.json` |
| A | `0000000000000000000000000000000000000000` | `f40825629e42e915e4466cc6c4a49e5db3949250` | `relay-core/fixtures/negative/resolved-plan-na-without-digest.expect.json` |
| A | `0000000000000000000000000000000000000000` | `44e22069178c37fc6aa05fe058140d5b5582b182` | `relay-core/fixtures/negative/resolved-plan-na-without-digest.json` |
| A | `0000000000000000000000000000000000000000` | `ca07d1a46a626e291fd72d8182f58073f20b32d4` | `relay-core/fixtures/negative/resolved-plan-na-without-evidence.expect.json` |
| A | `0000000000000000000000000000000000000000` | `7c52896b548f3ad2dc4084d92201039a0f14ff6d` | `relay-core/fixtures/negative/resolved-plan-na-without-evidence.json` |
| A | `0000000000000000000000000000000000000000` | `a62eae9d6be43c685847f321939f77aa888e3ae9` | `relay-core/fixtures/negative/resolved-plan-node-missing-deadline.expect.json` |
| A | `0000000000000000000000000000000000000000` | `3544530195aab062f8227f7644a071239467bda9` | `relay-core/fixtures/negative/resolved-plan-node-missing-deadline.json` |
| A | `0000000000000000000000000000000000000000` | `bdd33973ff134924e9120ec6a7afbe0f4c516350` | `relay-core/fixtures/negative/resolved-plan-normal-empty-recipe.expect.json` |
| A | `0000000000000000000000000000000000000000` | `a42514471005183977322109b39618baed156c99` | `relay-core/fixtures/negative/resolved-plan-normal-empty-recipe.json` |
| A | `0000000000000000000000000000000000000000` | `bdd33973ff134924e9120ec6a7afbe0f4c516350` | `relay-core/fixtures/negative/resolved-plan-recipe-path-missing.expect.json` |
| A | `0000000000000000000000000000000000000000` | `33045be48ab3d5c85095722b44fb70e5f0ab6ccb` | `relay-core/fixtures/negative/resolved-plan-recipe-path-missing.json` |
| A | `0000000000000000000000000000000000000000` | `a0b3d008da2cf1c7a213341542f35e9649cdd0ea` | `relay-core/fixtures/negative/resolved-plan-source-digests-incomplete.expect.json` |
| A | `0000000000000000000000000000000000000000` | `10a2f891f8ca7a05d4a6d685f62733cc3d29d35b` | `relay-core/fixtures/negative/resolved-plan-source-digests-incomplete.json` |
| A | `0000000000000000000000000000000000000000` | `dbcec7a0b8d70a21e874adbb0b881f70db46ec68` | `relay-core/fixtures/negative/run-binding-digest-empty.expect.json` |
| A | `0000000000000000000000000000000000000000` | `6cd23b5825fbcdaf626dcbdc1937ad5f49ae5f53` | `relay-core/fixtures/negative/run-binding-digest-empty.json` |
| A | `0000000000000000000000000000000000000000` | `c5138aabf59625301b4b10bd217878eca55ead0e` | `relay-core/fixtures/negative/run-binding-generation-changes-plan-id.expect.json` |
| A | `0000000000000000000000000000000000000000` | `1ee9eaab2944da786bc258b63bf77fda102406ba` | `relay-core/fixtures/negative/run-binding-generation-changes-plan-id.json` |
| M | `1ce427ac13ea210e0c5518a0f3507ce5d99663bc` | `3b5ab7b484dd4721c7c27a66dbb0b56f19d540d6` | `relay-core/package.json` |
| A | `0000000000000000000000000000000000000000` | `123796bd4f437ff1dc2fac6176363643827eb113` | `relay-core/resolver/devplan.mjs` |
| A | `0000000000000000000000000000000000000000` | `1a6c643187de45a4b6438208dc4bd6707bb1dbd8` | `relay-core/resolver/git.mjs` |
| A | `0000000000000000000000000000000000000000` | `092ae1444fad8fadb20ee08821678818c635a9af` | `relay-core/resolver/inputs.mjs` |
| A | `0000000000000000000000000000000000000000` | `f9765e401c4b46cd9f5470a09c063f443eea0cec` | `relay-core/resolver/locator.mjs` |
| A | `0000000000000000000000000000000000000000` | `40b30782e2d95a1bd88e95b664daf9c871061bee` | `relay-core/resolver/recipe.mjs` |
| A | `0000000000000000000000000000000000000000` | `e8ed12df2e8e4dbb956a9255a29a11f952cbb061` | `relay-core/resolver/resolve.mjs` |
| M | `2b7e84b39d96e574b62a378ac5715d5df0164c2c` | `5796c3c8ef894823df140c8b42a3ff270e6b1213` | `relay-core/test/contracts.test.mjs` |
| A | `0000000000000000000000000000000000000000` | `3ba00c4c97f55eb8907b8b7057b3893a0e29afaf` | `relay-core/test/resolver.test.mjs` |
| M | `bebe54ae08a8aa8f2106db24c470f90109638da4` | `66aa31322264bd3702f2c67c8de5ae7592b7870d` | `relay-core/tools/capability-baseline.mjs` |
| M | `57a9b6d3b01d563f9f905e6931b5fbf386c37808` | `5c3401196f3d6673d34dcbf23df0973dfde40832` | `relay-core/tools/structural-tokens.txt` |
| M | `f1151ab0787f5e5d130f5b58cc474e92638e4cf2` | `203446a7b6cd9fd197b454f55100988840613e33` | `relay-core/tools/validate.mjs` |

## 4. 旧 workspace 指针

这些 blob 用于审计旧 brief、施工说明、复核和证据；未出现在上表的路径表示它们与 merge base 相同，但仍属于旧现场上下文。

| blob | 路径 |
|---|---|
| `c8c6343f74a1685ceb64f12cd1b280393887d5fc` | `docs/modules/dh-relay/workspace/DHR_53/brief.md` |
| `3eecaecf62afc6a787d6f67d99a41b63f025d88b` | `docs/modules/dh-relay/workspace/DHR_53/task_plan.md` |
| `2ae5e243a60c103d171fbf5450c0400911c6346f` | `docs/modules/dh-relay/workspace/DHR_53/execution_strategy.md` |
| `fda6c1699795cfa2c34b02a4a1fe4d6506eab0f4` | `docs/modules/dh-relay/workspace/DHR_53/visual_map.md` |
| `e3aac45aec878dfa5a9072ae779502d895cc3da9` | `docs/modules/dh-relay/workspace/DHR_53/progress.md` |
| `a9ff863ce6d95381c51c0fe4189368378d39e42a` | `docs/modules/dh-relay/workspace/DHR_53/findings.md` |
| `7020e5ec44890b18dc500a4900ee3744e24e83b5` | `docs/modules/dh-relay/workspace/DHR_53/lesson_candidates.md` |
| `d0ef69920321361ad81f1a9c205ccedcf79dda07` | `docs/modules/dh-relay/workspace/DHR_53/review.md` |
| `868e64c35d193b350cff8694e630cbb874591788` | `docs/modules/dh-relay/workspace/DHR_53/decisions.md` |

## 5. 恢复与禁止事项

- 审计读取：`git show archive/DHR_53/pre-A23-fec9ec1:<path>`。
- 临时恢复整树时只能另建 detached worktree；不得重新创建 `wt/DHR_53` 并继续旧施工。
- 新 DHR_53 必须从届时登记的精确 `master` SHA 建新 worktree，旧通过数、review 与测试不能计入新验收。
- 本 manifest 与 archive tag 仅保证可追溯，不授权施工、合入、push 或发布。
