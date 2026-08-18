# visual_map — DHR_26

```text
DHR_25 fake fixtures
  detail: relay.pilot-read-model/v1
  list:   relay.pilot-run-list/v1
        |
        | read as UTF-8 JSON
        v
@personal/dsh-relay-pilot-host
  ctx.relayPilot.detail()
  ctx.relayPilot.list()
  ctx.relayPilot.snapshot()
        |
        | ordinary JSON only
        v
DSH 0.1.0-rc.7 process in isolated Home
  <experiment-root>\dsh-home\
        |
        | host smoke transcript
        v
DHR_26 evidence
  progress.md
  findings.md
  review.md
        |
        v
DHR_49 task_plan input
  client declaration shape
  exports["./client"] shape
  profile scan anchor
  type definitions location
  --patch/profile boundaries
```

## 证据点

| 证据点 | 预期产物 | 回填位置 |
|---|---|---|
| rc.6 未漂复验 | `dsh --version` 与 B-10 预采快照一致，或登记预采作废 | `progress.md` |
| rc.7 升级后快照 | 版本号、内置包版本、安装目录结构 | `findings.md` |
| Host 静态契约 | `node --test tests/*.test.mjs` 通过 | `progress.md` |
| DSH 进程内调用 | `ctx.relayPilot.snapshot/detail/list` 转录 | `progress.md` 与 `review.md` |
| 卸载清理 | 服务或事件注册清理证据 | `review.md` |
| DHR_49 输入 | client/plugin/profile 侦察事实 | `findings.md` |
