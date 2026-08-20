# Transport mirror

`relay-control-pilot/src/dsh-host/` 是仓外 Pilot 源码的 GitHub 交接镜像，不改变 P4 DevPlan 的生产落点。请通过工作区根的 `materialize.ps1` 同步；脚本会要求既有 DHR_25 `testdata/fake` 存在，并拒绝在仓内造第二套 fixture。
