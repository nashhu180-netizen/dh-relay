# DHR-B-31 · DHR66 Codex projection 漂移修复 — 审核与授权记录

> 事件性质：B-adjust 草案。正式设计输入 `design/12` 的 P6-RI-A5 不变；本记录不得包含配置正文、projection 值或凭据。

<a id="review-b31"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-31 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->

## 触发与独立事实

- DHR66 E-6602：registry 声明 `/model`、`/profiles` 均为 nonsecret；现役 reader 因配置缺 `/profiles` 在 Attempt/Agent/pane/Result 前 fail-closed。
- E-6603：本机 Codex CLI 0.151.0 的 `--profile` 从 `$CODEX_HOME/<name>.config.toml` overlay 加载；main alias 无 profile selector，当前 overlay 文件为 0，基础配置无 `/profiles`，`codex --strict-config --version` exit 0。
- 因此向基础产品配置伪造 `profiles` 标量既不对应当前入口选择，也可能把合法 strict config 变成未知字段配置；不能作为 P6 身份证据。

## 候选方案

仅修改用户级 executor registry：从 `herdr.codex.main.config_fingerprint_rule.fields` 删除漂移的 `/profiles` 声明，保留已声明 nonsecret 且当前存在的 `/model`。随后用既有 `freezeProfileIdentity` 证明 Receipt 仍只有 `executor_profile_id`、脱敏 `account_alias`、`config_fingerprint`、`executor_capability_hash` 四字段；负例继续证明未声明、坏、不安全或不可证 projection fail-closed。Codex 产品配置变更前后 SHA-256 必须相同。

### 方案问题

待 fresh reviewer 核对：删除漂移 pointer 是否仍完整承接 `design/12` P6-RI-A5 的“两指定 Profile 修复后通过”，以及是否误把模型配置等同账号主体。

### 用户理解风险

本卡证明的是冻结的 Profile registry 身份快照和配置指纹，不证明 ChatGPT 账号主体；`expected_identity` 在 DHR32 已明确不可证。真实产品是否能执行并提交 Receipt-bound Result 仍由 DHR35 证明。

### 需要用户决定的问题

无新增产品取舍。用户于 2026-08-31 明文授权主控完成 P6 剩余任务，并要求普通决策按需求自行判断；主控据此拒绝伪造产品配置键，选择最小 registry 修复。最终人验仍由用户次日执行。

<a id="understanding-b31"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-31 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->

## 理解与授权

- 理解命题：若现役 main 入口根本不选择任何 Codex overlay，往基础配置补一个 `profiles` 字段不能证明入口身份；应修正 Relay registry 的漂移声明，并保持产品配置不变。
- 用户授权：2026-08-31，“剩余任务你做主控，全部完成，明天我来人验，决策你根据需求自己判断”。该授权覆盖 B-31 的主控裁决与机器侧推进至 E10；不代替次日人验，不包含 push、发布或 P7。

## Fresh 审核与主控裁决

fresh-context 只读审核：P0=0、P1=3、P2=1，无新增用户决定；无需 A-full。主控全部采纳：

1. **P1 `/model` 正向可证性**：E-6604 的只读 dry-run 已证明 proposed registry formal errors=0、现役 reader 可读取 `/model`、`freezeProfileIdentity` 只返回 Receipt 四字段且两枚 hash 长度均为 64；不记录 model 值。
2. **P1 P6-RI-A5 组合覆盖**：DHR66 不单独宣称 A5 全部通过。最终联合证据固定为 DHR63 `E-6320/E-6321/E-6330`（正式 registry 与 formal validator）、DHR65 `E-6518/E-6519/E-6525`（完整 registry runtime、Attempt/Agent/pane/Result 零副作用与主干复验）、DHR35 `E-3512`（真实 live registry 的 projection 缺失在 Attempt 前直达红证）、DHR66 `E-6602~E-6607`（Codex 漂移红证、现役配置契约、正负例、精确 mutation 与写后复验）。只有 DHR66 mutation 后复验通过，四处证据合取才可写 P6-RI-A5 closed。
3. **P1 生命周期负例边界**：DHR66 只声明 reader/identity projection；真实 projection 缺失的 Attempt 前拒绝引用 DHR35 E-3512，Agent/pane/Result 零副作用引用 DHR65 E-6518/6519，不用 identity 单测替代。
4. **P2 model 指纹不是账号主体**：`/model` 只参与 `config_fingerprint`；`executor_profile_id` 和脱敏 `account_alias` 来自 registry，`expected_identity` 继续不可证。真实执行与 Receipt-bound Result 仍由 DHR35 验证。

补充反例 E-6605：classification 非 nonsecret、坏 pointer、不安全值、缺 `/model` 四类均 fail-closed。修改前后仍须证明 Codex 产品配置 SHA-256 不变、registry 仅发生一个 field 删除，并完成最终工件凭据扫描。
