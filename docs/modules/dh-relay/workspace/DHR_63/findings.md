<!-- dh:v1 -->
# DHR_63 · Findings

| ID | 级别 | 状态 | 描述 | 处置 |
|---|---|---|---|---|
| F-6301 | P2 | open（继承） | `herdr.codex.ninth` 的登录身份与独立配置根在本卡边界内不可证；DHR_32 已登记该入口未登录，且其独立配置根只能经 shim 内部变量到达。 | 按「不可证」处理；本卡仅移除该引用 Profile 上不可展开的 `config_fingerprint_rule`，不读取配置正文/凭据，也不改变既有「无可解析配置指纹即不可派」的 fail-closed 状态。DHR_35 需选择已解析 Profile 或另行取得授权裁决。 |
| F-6302 | P1 | 遗留→DHR_65（已确认） | 运行时 `loadExecutorProfiles` 固定以 `resolveAlias:false` 调用 validator；完整 registry 的坏 alias 在 validator 中返回 `E_UNRESOLVED_ALIAS`，但 loader 仍接受，不能证明 P6-RI-A5 的“拒绝真实启动”。 | B-25 已确认遗留→DHR_65（P6-RI-A5 runtime/mutation）；DHR_63 不改 loader/validator/生产代码，也不以 validator 负例冒充 runtime fail-closed。 |
| F-6303 | P1 | resolved（移交） | 原 normal 配方要求实现级 mutation，但本卡允许路径不能产出该证据。 | B-25 将 task_type 改为 light，并由 DHR_65 承接 runtime loader 的 normal mutation；registry 输入变异仅保留历史证据。 |
| F-6304 | P1 | closed（registry 部分） | `herdr.codex.main` 的 fallback 指向无配置指纹的 `herdr.codex.ninth`，导致 workflow-driver 启动前 guard 直接返回；当前 registry 已移除该 fallback 引用。 | 仅修改允许字段 `fallback_profile_ids` 为闭集内空数组；目标 Profile 的 preflight 条件投影为 `CLEAR`，ninth 自身仍因配置指纹「不可证」而保持直接选择 fail-closed。 |
| F-6305 | P2 | open（移交） | 当前 live registry 的 `herdr.codex.main.fallback_profile_ids=[]` 与 golden fixture 的 `['herdr.codex.ninth']` 存在值级分歧；golden 不能直接充当 DHR_65 所需的完整正式 registry 结构等价副本。 | DHR_65 必须用与 live fallback 语义一致的脱敏结构等价副本；DHR_63 不改 fixture 或 runtime。 |
| F-6306 | P2 | open（移交） | 当前无可行自动 fallback 边：Codex main 为空、Claude 无该字段、ninth 无可解析配置指纹。 | DHR_35 D-start 前须知悉 P6-M4 constrained 与 `E_FALLBACK_UNAVAILABLE` 约束；本卡不宣称自动切号可用。 |
| F-6307 | P2 | resolved | 两个目标 Profile 的既有引用 Profile `herdr.codex.ninth` 被维护时，原 Brief 未说明该最小例外，导致范围账本不完整。 | 已在 Brief 及允许路径明确：它不是第三个目标/可派 Profile，只允许移除不可展开的非敏感 `config_fingerprint_rule`；不扩展权限或读取边界。 |
