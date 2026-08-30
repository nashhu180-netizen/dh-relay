<!-- dh:v1 -->
# DHR_65 · Progress

## 日志

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-08-30 | 主控 | 用户 D-start；主树建立标准档八件套，建立独立 `wt/DHR_65` 并 self-rebase `master@a9b39f0`。 | E-6500、E-6501 | 先写 loader alias fail-open 红测。 |
| 2026-08-30 | 主控 | 初版三 Profile fixture 的红测证明坏 alias 被 loader 接受且 driver 会进入 host 轮询；fresh review 随后判定它不足以代表完整 registry。 | E-6502 | 仅保留为问题复现，不作为完成证据。 |
| 2026-08-30 | 主控 | fresh review 提出 P1：fixture 遗漏两条已登记 Profile；P2：driver 坏 config/确定性屏障与默认 test 接入不足。 | E-6509、E-6510、E-6511 | 补齐完整五 Profile synthetic fixture、双路径 driver 负例与 B-26。 |
| 2026-08-30 | 主控 | 用户授权 B-26：仅将 DHR65 专属测试加入既有 `npm test` 显式清单；不扩展生产、driver、既有测试或用户级 registry 范围。 | E-6512 | 重跑专项、mutation、回归、审计与体检。 |
| 2026-08-30 | 主控 | 将专属 fixture 扩至完整五 Profile 结构与 fallback 图；每条 alias/config 坏值均直测 loader，且各取一条 alias/config 经 driver 证明启动前零 Attempt/Agent/pane/Result。 | E-6513 | 施加最终实现级 mutation 并还原转绿。 |
| 2026-08-30 | 主控 | 对 `resolveAlias:true` 施加 `true→false` mutation；坏 alias loader 与 driver 断言失败；还原同一 source hash 后专项测试转绿。 | E-6515 | 复跑既有 profile 回归、审计、体检和 fresh reverify。 |
| 2026-08-30 | fresh 代码复核 | fresh reverify 发现 alias driver 的 8 秒保险等待低于 Windows `where.exe`→`pwsh Get-Command` alias 探测实际耗时，专项未稳定取得终态。 | E-6517 | 仅把测试保险上界调至受支持环境实测范围，保持超时失败与 settle cleanup。 |
| 2026-08-30 | 主控 | 将 alias driver 的测试保险 timeout 从 8 秒调为 60 秒；不改生产行为、fixture、断言或 driver。loader 子集 3/3 与 driver 子集 2/2 均取得终态。 | E-6518 | 重取最终 mutation，安排代码复核 re-reverify。 |
| 2026-08-30 | fresh lesson-miner | 已运行 `dh mine dh-relay DHR_65` 只读备料并按去重筛子追加候选-56～58；未写正册。 | E-6520 | 回填三路 final 结论，做 E8/E9 前体检。 |
| 2026-08-30 | 主控 | `dh dh-relay` 指出候选库未列入任务允许路径；用户明文「确认」B-27，仅授权追加 DHR65 miner 候选。 | E-6522 | 重跑范围/文档体检，生成 E10 证据包。 |
| 2026-08-30 | 主控 | B-27 后复跑坏 alias 覆盖未得终态；用户授权 B-28 的 `-NoProfile` 试验，但既有 profile 回归暴露 `claude-grok` alias 失效，已在未提交树回退。清理仅属本卡的旧无终态 Node 测试残留后，原 fallback 的坏 alias 专项恢复终态。 | E-6523 | 重跑受影响 driver、profile 回归、mutation与卫生检查。 |
| 2026-08-30 | 主控 | 原实现下重跑五个精确 DHR65 断言均 exit 0；`resolveAlias:true→false` mutation 令五 Profile 坏 alias 断言失败，随后还原。 | E-6524 | 复核收口记录、模块体检与 E10 展示。 |
| 2026-08-30 | 主控 | 用户 E11 明文“认可，授权”；`dh wt done DHR_65` 已 squash 至 master。主干重跑专项五项、profiles、audit 与模块体检均获终态。 | E-6525 | 创建主干 verify 并完成任务树/分支销户。 |

## 证据账本

| ID | 类型 | 命令 / 路径 | 结果 | 支撑什么结论 |
|---|---|---|---|---|
| E-6500 | setup | `docs/modules/dh-relay/workspace/DHR_65/` | pass | 标准档工作区、完成条件和精确允许路径已在主树落户。 |
| E-6501 | setup | `git rebase master` in `wt/DHR_65` | pass：HEAD `a9b39f0`，无冲突 | 任务树与 D-start 后主干一致。 |
| E-6502 | test-red | `node --test relay-core/test/dhr65-registry-loader.test.mjs`（实现仍为 `resolveAlias:false`） | fail：坏 alias 负例与 driver 启动前零副作用断言失败 | 复现 DHR_63 F-6302 的 runtime alias fail-open。 |
| E-6503 | test | `node --test relay-core/test/dhr65-registry-loader.test.mjs` | superseded：初版 4/4 只覆盖三 Profile；fresh review 已判定不能用作完整 registry 结论。 | 仅保留初始绿测历史。 |
| E-6504 | regression | `node --test relay-core/test/profiles.test.mjs` | pass：14/14，exit 0 | formal validator 的既有 profile/credential/负例行为无回归。 |
| E-6505 | mutation | 初版 `profile-registry.mjs` 的 `resolveAlias:true→false→true` | superseded：只基于三 Profile fixture。 | 最终 mutation 以 E-6515 为准。 |
| E-6506 | regression | `npm test`（`relay-core/`） | 未得终态：输出中已有既有 `DHR_33 窄路径` 失败，工具未返回最终汇总/exit；不得记作绿色，也不归因于本卡。 | 全量默认回归不可作为本卡 green；定向证据另列。 |
| E-6507 | audit | `npm run audit`（`relay-core/`） | pass：24 schemas、227 `$ref` 解析失败 0、未登记开口 0、厂商 token 0、结构 token 漂移 0；exit 0 | 本卡未破坏 contracts/audit 基线。 |
| E-6508 | hygiene | `git diff --check`；对专属 test/workspace 做 credential-value pattern 扫描 | pass：diff exit 0；无 credential-shaped value。扫描命中仅为 mutation 的 Git 内容 hash（非凭据），已由上下文人工复核。 | 工件无配置正文或凭据，且无空白错误。 |
| E-6509 | review-dispatch | dh dispatch | observed | 复核派出：dhr65-code1-fresh｜normal code review of c52feda; read-only code |
| E-6510 | review-dispatch | dh dispatch | observed | 复核派出：dhr65-requirements-fresh｜normal requirements review of c52feda; read-only |
| E-6511 | review-dispatch | dh dispatch | observed | 复核派出：dhr65-lessons-fresh｜normal lessons review of c52feda; read-only |
| E-6512 | scope | 用户对话明文「授权」；DevPlan B-26 | pass | 允许路径最小增加 `relay-core/package.json`，仅添加专项 test 到既有显式 `npm test` 清单。 |
| E-6513 | test | 初版 `node --test --test-concurrency=1 relay-core/test/dhr65-registry-loader.test.mjs` | superseded：fresh code reverify 发现 alias driver 的 8 秒保险等待不稳定，不能继续作为最终绿证。 | 初版完整测试历史；最终专项绿证以 E-6518 为准。 |
| E-6514 | regression | `npm test`（`relay-core/`） | 未得终态：命令展开已列出 `test/dhr65-registry-loader.test.mjs`，但仍可见既有 DHR_33 窄路径失败，工具未返回最终汇总/exit；不得记作绿色。 | B-26 已静态接入默认清单；全量默认回归不可作为本卡 green。 |
| E-6515 | mutation | `profile-registry.mjs` 的 `resolveAlias:true→false→true`；`node --test --test-concurrency=1 relay-core/test/dhr65-registry-loader.test.mjs` | pass：mutant hash `c7aba8a4a9af89834d37172644fe64bb57e7da3d` 时 alias loader 与 driver 断言失败；还原 hash `75f0a0f03d726949cbe3087369b73b5d32f1dcc0` 后 5/5 pass、exit 0。 | loader alias-resolve 分支有有效的实现级 mutation，且已完整还原。 |
| E-6516 | regression/check | `node --test relay-core/test/profiles.test.mjs`；`npm run audit`；`dh dh-relay`；`git diff --check` | pass：profiles 14/14；audit 24 schemas/227 refs/0 errors；dh-check 0 failures（66 项历史 warnings）；diff 无空白错误。 | 既有 formal validator、合同审计与当前卡工件体检均未出现新增失败。 |
| E-6517 | review | `review-code1-reverify.md` | changes-requested：P2×1；fresh 专项 alias driver 在 8 秒保险等待内 timeout，P0/P1=0。 | 不将不完整终态写绿；仅修专项测试同步上界。 |
| E-6518 | test | `node --test --test-concurrency=1 --test-name-pattern "loader" relay-core/test/dhr65-registry-loader.test.mjs`；同命令 `--test-name-pattern "driver rejects"` | pass：loader 3/3、driver 2/2，均 exit 0；alias driver 13.1s、config driver 3.1s，60 秒 timeout 未触发。 | 完整五 Profile loader 覆盖与两条 driver 启动前零副作用均有稳定终态；两组互斥 name pattern 合计覆盖同一文件 5 项。 |
| E-6519 | mutation | `profile-registry.mjs` 的 `resolveAlias:true→false→true`；`node --test --test-concurrency=1 --test-name-pattern "loader rejects a bad alias" ...`，还原后 E-6518 两组 green。 | pass：mutant hash `c7aba8a4a9af89834d37172644fe64bb57e7da3d` 时 alias loader 断言失败、exit 1；还原 hash `75f0a0f03d726949cbe3087369b73b5d32f1dcc0` 后 loader 3/3、driver 2/2 均 exit 0。 | 最终实现级 mutation 覆盖 loader alias-resolve 分支，且 source 已还原。 |
| E-6520 | miner | `dh mine dh-relay DHR_65`；`workspace/DHR_65/miner-report.md`；`knowledge/教训库-候选.md` | pass：fresh miner 去重后新增候选-56～58，正册零写入。 | 标准档教训回流完成；候选待用户后续裁决，不影响本卡 verify。 |
| E-6521 | review | `review-code1-final.md`；`review-requirements-reverify.md`；`review-lessons-reverify.md` | pass：代码/需求/教训三路 final 均 P0/P1/P2/P3=0；代码 P2 timeout finding 已收敛。 | normal recipe 的独立代码、需求、教训复核全部闭合。 |
| E-6522 | scope | 用户对话明文「确认」；DevPlan B-27 | pass | 允许范围最小增加候选库 append，候选-56～58 合法；正册与其他 knowledge 文件仍不允许改。 |
| E-6523 | diagnosis/scope | B-28 的 `-NoProfile` 试验后 `profiles.test.mjs` 为 13/14（`claude-grok` 失效），故未提交即回退；清理仅属 DHR65 的残留 Node 测试进程后，原 fallback 的坏 alias loader 1/1、exit 0；DevPlan B-28 | pass | 未得终态由本卡残留测试进程造成；不牺牲 profile alias 兼容性，且不保留 validator 生产变更。 |
| E-6524 | test/mutation | 五次 `node --test --test-concurrency=1 --test-name-pattern <精确项> relay-core/test/dhr65-registry-loader.test.mjs` 均 1/1、exit 0；mutation hash `c7aba8a4a9af89834d37172644fe64bb57e7da3d` 下坏 alias 0/1、exit 1；还原后 source hash `75f0a0f03d726949cbe3087369b73b5d32f1dcc0`。 | pass | 完整 registry 好例、五 Profile alias/config 负例与两条 driver 启动前零副作用路径均有终态；实现级 alias-resolve 分支可被测试杀死且已还原。 |
| E-6525 | mainline-verify | `dh wt done DHR_65`；主干五个精确专项均 1/1、exit 0；`profiles.test.mjs` 14/14；`npm run audit` 0 违规；`dh dh-relay` 0 failure。 | pass | squash 后主干与任务树证据一致，用户 E11 已授权创建 verify；不含 push、部署、环境动作或 DHR35。 |
