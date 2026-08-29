<!-- dh:v1 -->
# DHR_32 · 证据地图

```text
本机五入口（codex / codex-ninth / claude / claude-grok / claude5）
   │ 步骤1 逐个审计（脱敏）
   ▼
evidence/audit-<alias>.md ×5 ──────────┐
   │ 事实机读化                          │ 双证之一：白名单脱敏
   ▼                                   ▼
relay-core/profiles/fixtures/golden-registry.json ──→ 步骤7 凭据扫描（双证之二）
   │ schema + 校验器（E_CREDENTIAL_* fail-closed）
   ▼
executor-profile.schema.json + validate-profiles.mjs + test/profiles.test.mjs
   │ 候选落户（仓外）
   ▼
~/.dh-relay/executor-profiles.json（sha256 登记在 evidence）
```

- 验收对应：B4→golden 条目可解析到真实 cli/config_dir；§7.1→字段闭集+零凭据双证；宪章#6→扫描记录；B15⑤→capabilities 逐项挂 CLI 开关依据。
