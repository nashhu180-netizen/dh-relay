<!-- dh:v1 -->
# DHR_33 · Findings

| ID | 级别 | 状态 | 描述 | 处置 |
|---|---|---|---|---|
| F-0 | P3 | open | 侦察发现：`test/control-plane-imports.test.mjs:21` 的 CONTROL_PLANE_DIRS 写死 `adapters/dsh-bridge` 而非整个 `adapters/`——将来在 `adapters/` 下新增目录会静默逃过控制面 import 纪律闸 | 本卡不动该测试（adapter 落 runtime/ 侧）；留给后续维护卡把 `:21` 收紧为 `'adapters'` |
