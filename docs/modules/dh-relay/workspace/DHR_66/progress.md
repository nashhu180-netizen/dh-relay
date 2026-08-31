<!-- dh:v1 -->
# DHR_66 · Progress

## 日志

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-08-30 | 主控 | 用户明确 D-start；B-29 已 fast-forward 至 `master@7bb423f`，主树创建标准档八件套并冻结仅 `/profiles` nonsecret 的施工合同。 | E-6600 | 建立 `wt/DHR_66` 后 self-rebase，再执行零值泄露的基线探测。 |
| 2026-08-30 | 主控 | `wt/DHR_66` 已从工具的 `origin/master` 基线 self-rebase 到 `master@4c28b51`；读取 registry 声明与既有 identity reader 的脱敏摘要。 | E-6601 | 判断 `/profiles` 是否可在不改产品配置的边界内修复。 |
| 2026-08-30 | 主控 | `herdr.codex.main` 已声明 `/profiles` 为 nonsecret，但既有 reader 返回 `E_NONSECRET_PROJECTION_MISSING:/profiles`；目标配置的 `/profiles` 键不存在。未输出投影值、配置正文、路径或凭据。 | E-6602、F-6601 | 停止 DHR66；等待用户决定是否新开 B-adjust 扩展产品配置写入，或改定验收目标。 |
| 2026-08-31 | 主控 | 用户授权主控完成 P6 剩余任务并自行裁决；任务树 rebase 到 `master@aecb159`。现役 Codex CLI 0.151.0 帮助证明 `--profile` 使用 `$CODEX_HOME/<name>.config.toml` overlay，main alias 无 overlay selector，当前基础配置也无 `/profiles`。判定不得伪造产品配置键，起草 B-31：registry 删除漂移的 `/profiles` 声明并保留 `/model`。 | E-6603、F-6601 | fresh 审核 B-31；通过后仅改用户 registry 声明，产品配置保持字节不变。 |
| 2026-08-31 | 主控 | B-31 只读 dry-run：内存副本只删 `/profiles` 后 formal validator 通过，`freezeProfileIdentity` 返回原四字段和两枚 64 位 hash；相关 identity/profiles/runtime-loader 定向 23/23。未写 registry 或产品配置。 | E-6604 | 等 fresh B 审核裁决；若无 P0/P1，再做可恢复的精确 registry mutation。 |
| 2026-08-31 | fresh B reviewer + 主控 | fresh 审核 P0=0、P1=3：要求补 `/model` 正证、绑定 DHR63/65 的 A5 联合证据、不得用 reader 单测冒充生命周期零副作用。主控采纳；E-6604 已提供正证，另补四类 projection 负例 4/4 fail-closed，并冻结联合证据为 DHR63 E-6320/6321/6330 + DHR65 E-6518/6519/6525 + DHR66 E-6602~E-6605。 | E-6604、E-6605；design/evidence/29 | 定向复审 B-31；通过后执行精确 registry mutation。 |
| 2026-08-31 | 主控 | B-31 定向复审 P0/P1=0 后执行可恢复 mutation：同目录独占备份，registry 仅从目标 Profile 删除 `/profiles`、保留 `/model`；Codex config 前后 SHA-256 相同。写后 formal validator、live identity、strict config 与相关定向 23/23 全绿，registry 敏感形态 0。 | E-6606、E-6607 | 进入 light 教训/一致性两路复核，随后 miner、体检与 E10。 |
| 2026-08-31 | 两名 fresh light reviewer + 主控 | 教训与一致性初审各报同一 P1：task_plan/execution_strategy 仍可能把 B-31 前“补 `/profiles`”当活动指令；一致性另报 P2，要求用 DHR35 E-3512 补 projection 缺失直达 Attempt 前红证。主控采纳：task plan 顶部加 superseded notice、strategy 同步 B-31，联合证据补 DHR35。 | E-6608、E-6609 | 两路定向复验；不改 registry、产品 config 或生产代码。 |
| 2026-08-31 | 两名 fresh light reviewer | 教训定向复验 P0/P1=0、无新增候选；一致性定向复验 P0/P1/P2=0，五项横向清单全部 PASS。`dh mine` 已生成只读简报；既有候选已覆盖本卡教训，无需追加。as-built generic profile/Receipt 边界已准确，无生产行为变化，不更新。 | E-6608~E-6610 | 提交 DHR66 分支工件，重跑 dh-check/gate，形成 E10 人验包。 |
| 2026-08-31 | 主控 | 阶段汇报@E9 已发出七段交付口径；E10 放行证据包 `DHR_66-E10-v1` 已发出，H=0，并明确真实账号主体与真实 Agent 闭环不在本卡证明范围。 | E-6611、E-6612 | 重跑 dh-check/gate；停在 E10 等待用户次日人验，不执行 verify、合并或 DHR35。 |
| 2026-08-31 | 用户 + 主控 | 用户在已展示 E10 证据与本地收口授权包后明文回复“认可”；形成 E11 本地收口授权：精确 squash、合入复验、`verify(dh-relay)`、DevPlan/workspace 回填和 DHR_66 worktree/branch 清理。 | E-6612；对话确认（2026-08-31T10:00:24+08:00） | 连续执行 E12/E13；不含 push、deploy、环境操作或 DHR_35 开工。 |
| 2026-08-31 | 主控 | E12：`wt/DHR_66` 已精确 squash 到本地主干为 `459b8ac`；合入后 registry validator PASS、`codex --strict-config --version` exit 0、identity/profiles/loader 定向 23/23、`dh dh-relay` 0 failure（74 条存量 warning）。发现并修复 B-31 审核记录的机器路径命名，使 R29 绑定重新闭合。 | E-6607；主干复验 | 代签 `verify(dh-relay)` 并销户；不启动 DHR35。 |

## 证据账本

| ID | 类型 | 命令 / 路径 | 结果 | 支撑什么结论 |
|---|---|---|---|---|
| E-6600 | setup | `docs/modules/dh-relay/workspace/DHR_66/`；DevPlan DHR_66 | pass | D-start 的目标、允许路径、完成条件与停止条件已落户；尚未读取 registry。 |
| E-6601 | worktree | `git rebase master` in `wt/DHR_66` | pass：HEAD `4c28b51`，无冲突 | 任务树与 D-start 后主干一致。 |
| E-6602 | identity-baseline | 脱敏 Node probe：仅输出 declared pointer 名、boolean、错误码、projection key 名和 SHA-256 | pass：`/profiles` 已声明 nonsecret；`E_NONSECRET_PROJECTION_MISSING:/profiles`；目标配置无 `/profiles` key | 真实 reader 在 Attempt 前 fail-closed；当前卡允许路径内无可写对象能补齐缺失配置键。 |
| E-6603 | contract-drift | `codex --help` / `codex --strict-config --version`；alias/config 脱敏结构探测 | CLI 0.151.0；`--profile` 指向 overlay 文件；main alias 无 selector；overlay 文件 0；基础配置无 `/profiles`；strict config exit 0 | 旧 `/profiles` projection 不再代表当前 main 入口，向产品配置补键不是合法修复。 |
| E-6604 | dry-run/test | 内存复制 registry，仅过滤 `/profiles`；`validateProfiles(resolveAlias:true)`；`freezeProfileIdentity`；`node --test --test-concurrency=1 test/profile-identity.test.mjs test/profiles.test.mjs test/dhr65-registry-loader.test.mjs` | proposed fields=`/model`；formal errors=0；identity keys=Receipt 四字段、两 hash 长度=64；23 pass / 0 fail，exit 0；零文件写入 | B-31 候选在现役 reader/validator/runtime-loader 范围内可行，且不需要产品配置或生产代码变更。 |
| E-6605 | negative | 临时 TOML 仅含 synthetic 非敏感值；依次施加 classification 非 nonsecret、坏 pointer、不安全值、缺 `/model` | 4/4 fail-closed：`E_NONSECRET_PROJECTION_INVALID:field`、`E_NONSECRET_PROJECTION_INVALID:model`、`E_NONSECRET_PROJECTION_UNSAFE`、`E_NONSECRET_PROJECTION_MISSING:/model`；临时目录已删除 | 修复后仍保持 projection 分类、路径、值安全与存在性的反例闭集；不含真实配置值。 |
| E-6606 | external-mutation | 精确校验旧 registry hash 与字段集合；同目录备份；仅删除 `herdr.codex.main` 的 `/profiles` field；写后结构/产品 config hash 复核，失败自动恢复 | pass：registry `052d0f…`→`ca6916…`；只改 1 Profile/删 1 pointer；剩余 `/model`；Codex config 前后均 `82e5a2…`；备份 `%USERPROFILE%/.dh-relay/executor-profiles.json.bak-DHR66-B31-20260830T165431Z` | mutation 可恢复且未修改 Codex 产品配置；未输出 projection 值或配置正文。 |
| E-6607 | post-mutation | formal validator；live loader/freeze 脱敏探针；`codex --strict-config --version`；三份 identity/profiles/loader 定向测试；registry 敏感形态计数 | validator PASS；loader/freeze PASS，四字段、两 hash=64；strict exit 0；23 pass / 0 fail；secret-shaped match=0；全部 exit 0 | DHR66 正向、现役配置合法性、既有负例/runtime 回归与零泄露在真实 mutation 后均有终态。 |
| E-6608 | review-dispatch | fresh subagent `dhr66_lessons_review` | CHANGES_REQUESTED：P0=0/P1=1；命中候选-32/42，旧 task plan 未标 superseded；无新增候选 | light 教训初审派出与 finding。 |
| E-6609 | review-dispatch | fresh subagent `dhr66_consistency_review` | CHANGES_REQUESTED：P0=0/P1=1/P2=1；旧 task plan/strategy 漂移，联合证据缺 DHR35 projection 直达红证 | light 一致性初审派出与 finding。 |
| E-6610 | miner/as-built | `dh mine dh-relay DHR_66`；fresh 教训复核；`as-built/relay-core.md` profile/Receipt 段只读对照 | miner exit 0；无新增候选；as-built 已描述 nonsecret projection 与 Receipt 零原值，B-31 未改仓内实现 | E6/E7 完成，无需改知识库或 as-built。 |
| E-6611 | delivery-report | 本对话七段交付汇报；`review.md` E9 | pass（已发出） | E9 已展示目标、范围、完成条件、过程账、机器终态、待裁决项与下一步。 |
| E-6612 | release-packet | `review.md` `releasePacket: DHR_66-E10-v1` | pass（已发出） | H=0；机器证据、实际值、差异、局限与可恢复备份均已向用户展示，等待 E11 人验授权。 |
