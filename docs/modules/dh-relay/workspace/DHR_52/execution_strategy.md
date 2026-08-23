<!-- dh:v1 -->
# execution_strategy — DHR_52

## 操作模型

主控负责范围、冻结契约与 F-057 裁决；OMP `deepseek-v4-flash` 负责按 `task_plan.md` 施工；主控回收 diff、运行证据并主持复核/收口。一个 RPC 验收单元，不分批。

## 子 agent 授权

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---|---|---|
| OMP `deepseek-v4-flash`（`thinking=xhigh`） | 可写 `relay-core/rpc/**`、`relay-core/test/rpc.test.mjs`、`workspace/DHR_52/progress.md`；`relay-core/package.json` 仅限 F-208 的标准 test 门面接线；只读其它上下文；禁止其它 contracts/package/runtime/CLI/主干提交/再派 agent | 用户 2026-08-22 对话确认开工；用户 2026-08-22 指定不用 low，主控本文件精确限权 |

## 收尾铁律

- 无 capability mismatch、断连零写入、完整订阅帧三类证据，不许进待验收。
- F-057 未裁决时，冻结契约及三份基线必须保持零 diff。
