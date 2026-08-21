# relay-core — Relay v2 承重内核代码根

> 由 **DHR_28** 建立（2026-08-20）。语言与落点的裁决理由见 [`adr/ADR-001`](adr/ADR-001-runtime-language-and-code-root.md)；Agent 宿主归属见 [`adr/ADR-002`](adr/ADR-002-agent-host-ownership.md)。
> 治理工件（brief / task_plan / progress / findings / review）不在本目录，在 `docs/modules/dh-relay/workspace/DHR_28/`。

## 这是什么

控制面独立的承重内核的**契约层**。协议在这里冻结，之后 Runtime（DHR_29 Store / DHR_51 宿主 / DHR_52 RPC，`DHR-B-15` 拆卡）、Relay CLI（DHR_30）、以及任何客户端（DSH Bridge / Pi / 其他终端）都只认这一份契约来源。

**语言 = TypeScript / Node**（ADR-001，用户 2026-08-20 裁决）。**代码根 = 本仓新顶层目录**，与 `tools/`（P1 PowerShell Runner，只读作 Oracle）并列。

## 目录

| 目录 | 放什么 | 归哪张卡 |
|---|---|---|
| `adr/` | 架构决策记录 | DHR_28 |
| `contracts/` | 正式冻结的 schema、reason code、兼容矩阵、v1 缺口逐条处置表、v0 形状 | DHR_28 |
| `fixtures/golden/` | 正例（每份已冻结 schema 至少一份） | DHR_28 |
| `fixtures/negative/` | 反例 + 写死期望 reason code **与出错位置 `at`** 的 `.expect.json` | DHR_28 |
| `fixtures/manifest.json` | 基线对证清单：逐份 fixture 的 canonical sha256（承接 P4 §2.1）。改任何 fixture 后须跑 `node tools/fixture-manifest.mjs --write` | DHR_28 |
| `tools/` | 独立校验器与静态中立性检查 | DHR_28 |
| `store/` | 唯一写者 Store、不可变工件、追加事件账、原子快照、确定性回放 | DHR_29（尚未建） |
| `runtime/` | Detached 宿主、PID/lease、`run_id` 规范化与仓级锁内发号、恢复、只读宿主三态读数（**不注册 `bin`、不占 `relay` 命令名**） | DHR_51（尚未建） |
| `rpc/` | RPC 服务端：Named Pipe / UDS + NDJSON JSON-RPC 2.0，握手 `capability_hash` 比对 fail-closed | DHR_52（尚未建） |
| `cli/` | Relay CLI 参考客户端 | DHR_30（尚未建） |
| `adapters/` `workflows/` | 可选 DSH Bridge / Pi fixture；basic-agent-task | DHR_30 / DHR_31（尚未建） |

## 硬约束（施工前必读）

1. **协议平台/客户端/业务域无关**：`contracts/` 与 `tools/` 不得导入 DSH / Cordis / Pi / Herdr / DevHarness 私有类型（DevPlan §2.2、design/05 §6.2）。
   - 例外（白名单）：`pi-agent` / `dsh-agent` / `herdr-agent` 作为 `executor_kind` 的**不透明枚举字面量**允许出现——禁的是导入的类型名，不是厂商 token；且 design/06 H6 的契约断言本身依赖 `dsh-agent` 存在。见 ADR-002 净产出表的豁免注。
2. **不得把 Core 嵌入 DSH Web 进程**——design/05 §6.3 明列为不接受项，要改须回 A 立项。
3. **fail-closed**：未知字段、未知版本、能力不匹配一律拒绝，不得降级放行（P5-M6）。
4. **locator 一律相对/符号化**，禁绝对路径（承接 P4 缺口 G5）。
5. **运行现场不入仓**：Run Store 根 = `<repo>/.dh-relay/<run_id>/`，仓根 `.gitignore` 第 17 行 `.dh-relay/` 已覆盖（任意深度，比 DevPlan 要求的根锚定更宽）。Relay **不得自行改业务仓 `.gitignore`**，缺前置时 start fail-closed。
6. **`tools/`（仓根那个，PowerShell）只读**：行为、契约与测试命题作 Oracle，文件级实施不迁移。注意与本目录下的 `relay-core/tools/` 不是一回事。

## 测试

```
cd relay-core && npm test                        # node --test，10 条，含下面四项
node tools/validate.mjs --selftest               # golden + negative 全量（reason 与出错位置 at 双钉）
node tools/audit-contracts.mjs                   # 契约静态审计 11 维度；--write-tokens 重生成结构 token 清单
node tools/fixture-manifest.mjs                  # fixture 基线对证；--write 重新生成
node tools/capability-baseline.mjs               # 8 份（7 协议 + 1 共享定义）digest + capability_hash 基线；--write 重新生成
```

**改了什么就要重生成哪份基线**（三份互不覆盖，缺一就有一类改动可以悄悄发生）：

| 改了 | 跑什么 | 不跑会怎样 |
|---|---|---|
| 任一 fixture | `node tools/fixture-manifest.mjs --write` | fixture 被改软而 `--selftest` 仍绿 |
| 任一 schema 的**任意一个字**（含 `description`） | `node tools/capability-baseline.mjs --write` | 能力指纹变了却无人知道——`CANONICALIZATION.md` 明写「改一个错别字也是能力变更、也会断握手」 |
| 新增字段名 / 枚举值 / 常量 | `node tools/audit-contracts.mjs --write-tokens` | 「协议不导入私有类型」这条**全称命题**退回黑名单，证明不了「没有我没想到的那几种」 |

> **改了 fixture 就必须重生成 manifest**
> 没有这道闸，selftest 的通过数只能证明「当下盘上这批自洽」，证明不了「这批还是过审时那批」。
