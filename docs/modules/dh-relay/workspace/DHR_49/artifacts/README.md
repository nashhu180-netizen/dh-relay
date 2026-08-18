# Transport mirror

`relay-control-pilot/src/dsh-client/` 是仓外 DHR_49 Client Plugin 的 GitHub 交接镜像。`materialize.ps1` 会把它同步到既有 DHR_25 Pilot 根，并在目标目录执行确定性 build；仓内镜像不是 DevPlan 的生产落点。
