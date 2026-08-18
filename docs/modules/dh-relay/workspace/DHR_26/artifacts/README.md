# artifacts — DHR_26

本目录保存 DHR_26 的可审查施工输入。它不属于 dh-relay 现役生产代码，也不接入本仓 `tools/`。

## 目录

```text
artifacts/
  src/dsh-host/
    package.json
    tsconfig.json
    src/index.ts
    tests/static-contract.test.mjs
```

## 使用方式

1. 在用户本机把 `artifacts/src/dsh-host/` 复制到：

   ```text
   D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-host\
   ```

2. 在复制后的目录执行：

   ```text
   node --test tests/*.test.mjs
   npm run typecheck
   npm run build
   ```

3. 在 DSH `0.1.0-rc.7` 独立 Home 中按 profile 或 patch 方式加载，配置两份 DHR_25 fake fixture 路径。

## 源包保证

源包设计目标是暴露 `ctx.relayPilot`，并提供三组方法：

- `snapshot()`：返回 detail/list fixture 的 schema version、bytes 和 sha256，便于早交付和对证。
- `detail()`：返回 `relay.pilot-read-model/v1` 的普通 JSON 对象。
- `list()`：返回 `relay.pilot-run-list/v1` 的普通 JSON 对象。

源包不导入 DSH RC 私有类型，不生成状态推导，不改写 fixture 字段。真正是否能被 DSH rc.7 加载，以本机独立 Home smoke 为准。
