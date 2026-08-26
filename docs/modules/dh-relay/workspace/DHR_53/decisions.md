<!-- dh:v1 · decisions.md — 主控夜间自主决策记录（用户授权「按第一性原理判断、判断内容记 workspace」）。非模板件，收口时随卡合入。 -->
# decisions — DHR_53 夜间主控决策记录（2026-08-26 夜）

> 用户当晚原话（节选）：「我想你做主控，完成 …… 这几个任务」「代码可以让 omp 的 Ox Alpha·推理强度 Max 进行……如果他真的不行，就换 codex terra，推理强度 high」「复核用 dev-harness 新的复核流程，subagent + codex terra 推理强度 High」「授权你进行，人验我明天搞……如果需要决策，你根据第一性原理和我的需求来判断，判断的内容 workspace 中记录下即可。」

## D-000 ★必须先看：两段粘贴内容没有进入我的上下文

- **事实**：用户消息里有两块粘贴文本 —— 「施工顺序大概是 `[Pasted text #1 +9 lines]`」与「我想你做主控，完成 `[Pasted text #2 +3 lines]` 这几个任务」。这两块在我这边**只剩占位符**，正文没有送达；我查过本 session 的 transcript（`~/.claude/projects/D--MyFiles-ai-workflow-dh-relay/fde78536-*.jsonl`）里同样只有占位符，无法还原。
- **影响**：「今晚具体做哪几张卡」这一条是**我推断的，不是用户明说的**。
- **处置**：不阻塞（用户已睡且明确授权自主判断），按下面 D-001 的推断执行，并在这里显式标红。**明天人验第一件事应是确认卡选对了没**；若选错，今晚产出仍是 P7 链条上迟早要做的第一批，不作废，只是顺序提前/推后。

## D-001 今晚做哪张卡：DHR_53（必要时续 DHR_54），不碰 DHR_30 / P6

**推断依据（第一性原理）**：

1. **依赖链是硬的**。P7 §1 的顺序是 `DHR_53 → 54 → 55 → 56 →（57 ∥ 58）→ 59 → 60`。无论用户粘贴的是哪几张卡，链头都是 DHR_53；从链头做起在任何一种解读下都不会白做。
2. **今晚无人在场，只有「离线可机判」的卡能做**。P7 §1 批次 1（DHR_53→54）明写「不启动真实 Agent」，产出是 schema / resolver / fixtures / 反例测试 —— 全部可机器验收，不需要真实终端、不需要截图、不需要人盯。DHR_56 起要 P6 Herdr 与真实终端，DHR_30 要 DSH 渲染截图作需求境证据（brief 完成条件 #5），这两类今晚**物理上做不完**，硬做只会产出一堆待人验的半成品。
3. **风险闸不动**。design/10 §10-5 与 P7「新根闸」要求：resolver 迁移验收前禁止正式 `dh_relay/runtime/` start。今晚的活全部在 fixture / 受控测试目录内进行，**不启用新根、不起真实 Run**，闸原样保留。

**决定**：今晚主攻 **DHR_53**，做到 dev-harness 的「待验收」（E10 备料完成）为止；**不代签 verify、不合入 master、不销户**——E11 人闸留给明天的用户。若 DHR_53 提前收敛且状态健康，再评估是否开 DHR_54（见 D-004）。

## D-002 前置未满足仍开工：P6 Gate 与「DHR_30 进 master」的放宽范围

**冲突事实**：P7 §1「前置」写的是 `P6 Gate 通过` + `DHR_30 的 CLI/Read Model 稳定接口收口并进入 master`；任务表 DHR_53 备注为 `blocked-by-phase-gate:P6`。二者今晚都不满足（P6 卡 DHR_32~35 未开工；DHR_30 在 `wt/DHR_30` 上只有 4 笔提交，未收口）。

**判断**：这两条前置对 DHR_53 的**实际内容**没有功能依赖，它们保护的是**别的东西**：

| 前置 | 它真正在防什么 | 对 DHR_53 是否成立 |
|---|---|---|
| P6 Gate | 防止在没有真实执行底座时就去接终端 / 起 Agent | **不成立**：DHR_53 全程不启动 Agent、不碰 Herdr |
| DHR_30 进 master | 防止新卡把业务判断倒灌回 DHR_30，或依赖一份还会变的接口 | **部分成立**：见下面的替代路径 |

**决定（放宽 + 补偿）**：

1. 允许 DHR_53 在 P6 Gate 未过、DHR_30 未进 master 的情况下开工，**限定于 schema / resolver / fixtures / 反例测试**。
2. **硬保留新根闸**：不创建正式 `dh_relay/runtime/` 目录、不 start、不写任何真实 Run 现场；根路由逻辑只在 fixture 目录与临时测试根上取证。
3. **不依赖 `wt/DHR_30` 的未合入代码**：DHR_53 只消费 master 上已 verify 的 `relay-core/store`、`relay-core/runtime`（DHR_29/51/52 成果）。若发现确实需要 DHR_30 的 Read Model 接缝，**停下记 findings，不去 `wt/DHR_30` 取货、不改 DHR_30 卡**（P7 §2 硬边界 1）。
4. 这条放宽**不写进 P7 计划正文**（改正文属 B-adjust，须用户确认）。任务表备注里只加一条指针指到本文件，事实如实登记。

**明天若用户不同意**：回滚成本 = 把 DHR_53 状态改回「未开始」、留下分支不合入即可；代码没有进 master，零污染。

## D-003 复核路径 id 冲突：以 dev-harness registry 为准

- design/10 §5.3 把四路写成 `code_round_2 / requirement_direction / consistency / lessons`；dev-harness 的权威 registry（`dev-harness/tools/dh-policy/registry.mjs` 的 `REVIEW_PATHS` / `TYPE_RECIPES`）里第三路 id 是 **`consistency_review`**，不是 `consistency`。
- **决定**：DHR_53 冻结的 Recipe 采用 **registry 的 id**（`code_round_1 / code_round_2 / requirement_direction / lessons / consistency_review`），并在 schema 描述里就地记明 design/10 的 `consistency` 是同一路径的**行文简写**，不是第二个 id。
- **理由**：Recipe 的用途是机判「必做路径有没有少」，它必须与真正裁决收口的那份 registry 对齐；两处 id 不一致会让 DHR_58 的 Batch 分配对不上 dev-harness 的复核账本。
- 该差异同时登记进 `findings.md`，供明天人验裁决是「有意差异」还是要回头改 design/10 行文。

## D-004 施工与复核的后端分工

| 角色 | 后端 | 形态 | 依据 |
|---|---|---|---|
| 施工 | `omp`（默认 modelRoles = `openrouter/stealth/ox-alpha:max`） | 在 `wt/DHR_53` 内非交互执行，分批施工 | 用户指定；已实测 `omp -p` 可用（E-002） |
| 施工兜底 | `codex exec -m gpt-5.6-terra`（effort high） | omp 连续两批不可用 / 产出不可用时切换 | 用户指定的兜底 |
| 复核 | **subagent 包裹 `codex exec --sandbox read-only -m gpt-5.6-terra`** | fresh context、OS 级机器只读 | 用户指定；`references/复核只读派发.md` 首选形态；已实测可用（E-003） |

- 记忆里那条「codex 凭据已不在 profile、只能 subagent 降级」（`review-dispatch-fallback`）**今晚实测已不成立**：`~/.codex/auth.json` 为 chatgpt 授权、`codex exec --sandbox read-only` 在本仓可跑（banner `sandbox: read-only`、`approval: never`）。故本卡复核**按机器只读记账**，不登记降级。该记忆条目待更新。
- 施工者不复核自己的卡（宪章 #5）：omp 只写代码，五路复核全部由 codex fresh 会话做。

## D-005 今晚不做的事（明确不越权）

- 不 push、不 deploy、不动 `~/.dh-relay/` 用户级索引、不动 `.dh-runtime/` 与 `.dh-relay/` 旧根内容。
- 不代签 `verify(dh-relay):`、不勾人类签名区、不把 DHR_53 标「已完成」。
- 不改 design/10、不改 P7 计划正文的目标/范围/验收/依赖（只回填状态列与工作区链接这类机械进度事实）。
- 不动 `wt/DHR_30` 与 DHR_30 的任何工件。
- 不创建 DHR_54~60 的 workspace（除非 D-001 的续做条件成立，届时在本文件追加一条决策）。

## 追加决策（施工过程中产生）

## D-006 用户澄清：粘贴块原意是 DHR_30/31 + P5P6 前置，但仍按 P7 继续（2026-08-27 凌晨）

- **用户澄清（原话）**：「DH30 DH31 还有 P5P6 前置项的任务」——即 D-000 里丢失的那块粘贴文本，原意是让我做 **DHR_30、DHR_31 与 P5/P6 的前置项**，不是 P7 链头。**我的推断（D-001）与用户原意不符，事实如实登记。**
- **用户随后裁决（原话）**：「你按自己的计划也可以的，把 P7 尽量完成，linux 涉及的部分如果有的话，不需要管」「不用掉头，继续好了」。
- **决定**：
  1. **不掉头**。DHR_53 继续施工，并在今晚**尽量把 P7 往前推**（DHR_53 → 54 → 55 → …，能推多远推多远）。
  2. **Linux 相关一律跳过**：`HC-CTRL-H9`（Linux 无 GUI 全链）本就归 P9 DHR_46，不在 P7 范围；若某卡内出现 Linux/SSH 专属分支，只留接口不验证，并在 findings 登记「按用户 2026-08-27 指示跳过」。
  3. D-001/D-002 的三条硬闸继续有效（不启动真实 Agent、不启用新根 start、不消费 `wt/DHR_30`）。
  4. **DHR_30/31 与 P6 前置卡今晚不做**，但它们仍是 P7 后段（DHR_56 起）的真实前置——推到那里时会显式停下说明，而不是假装绕过。
- **对 P7 后段的已知边界**（现在就写下，别等撞上）：DHR_56/57/58/59 需要 P6 的 Herdr 执行底座才能取真实终端证据。今晚若推进到那里，只能做到 **fake adapter + 契约/状态机层可机判**，真实终端与容量证据必须留给 P6 Gate 之后补，届时在对应卡的 findings 与 review 里如实登记「未取真实宿主证据」，不得用 fake 证据冒充。

## D-007 今晚的总路线：P7 推到 P6 坎为止，然后转 DHR_30 → 31 → P5/P6

- **用户裁决（原话）**：「推到 P6 就会过头继续 dhr30 31 还有 P5 和 P6」。
- **执行顺序（今晚定稿）**：

  ```text
  DHR_53 → DHR_54 → DHR_55          ← P7 里不依赖 P6 的部分，能推多远推多远
        ↓ 撞上 P6 前置（DHR_56 起要 Herdr 真实执行底座）
  DHR_30 → DHR_31                    ← P5 收尾
        ↓
  P6（DHR_32~35）                     ← Herdr 多账号执行底座
        ↓（P6 Gate 之后才回头）
  DHR_56~60                          ← 今晚不做
  ```

- **切换判据（机器可判，不靠感觉）**：当**下一张要开工的 P7 卡的验收必须依赖真实 Herdr Agent / 真实终端 / 容量预检**时，就是那道坎——当前判断是 **DHR_56**。DHR_54（Ticket 契约）与 DHR_55（Workflow Engine，消费 Read Model、经既有 actor 落账）都不需要真实宿主，属坎前。
- **切换时要做的事**：在本文件追加一条「已撞坎」记录（写明卡号、卡住的具体验收项），把 P7 当前卡收到「待验收」或「未开始」的干净状态，**不留半张卡**，再开 DHR_30。
- **Linux 跳过继续有效**（D-006）：P6 计划里的 Linux SSH Herdr 路径按用户指示不验证，只留接口并在 findings 登记跳过理由。

<!-- 后续 D-00x 追加于此 -->
