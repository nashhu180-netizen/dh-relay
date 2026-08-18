# artifacts · DHR_26 可执行施工输入

本目录保存可复制到仓外实验根的 DHR_26 施工包，不接入 dh-relay `tools/` 生产代码。

```text
artifacts/
  scripts/Invoke-Dhr26Pilot.ps1
  src/dsh-host/
    package.json
    cordis.patch.yml
    index.js
    service-factory.js
    fixture-store.js
    plain-json.js
    probe.js
    scripts/
    test/
```

复制到：

```text
<experiment-root>\relay-control-pilot\scripts\Invoke-Dhr26Pilot.ps1
<experiment-root>\relay-control-pilot\src\dsh-host\...
```

执行：

```powershell
cd D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot
.\scripts\Invoke-Dhr26Pilot.ps1
```

操作器不会复制或覆盖 DHR_25 fixture。它只读取 `<experiment-root>\relay-control-pilot\testdata\fake\`，写入 `<experiment-root>\evidence\dhr26\`、版本基线目录和独立 `<experiment-root>\dsh-home\`。
