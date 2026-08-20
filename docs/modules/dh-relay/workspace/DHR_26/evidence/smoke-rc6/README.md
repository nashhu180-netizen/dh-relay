# smoke-rc6 — 真机冒烟证据（2026-08-18 晚）

环境：Windows 11 · Node v24.12.0 · `dsh 0.1.0-rc.6`（**不是** DevPlan 锁定的 rc.7）
Profile：临时 `DSH_HOME` 下的 `smoke` profile（**不是**目标机的 `web` profile）
Fixture：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\testdata\fake`（DHR_25 冻结件，仓外）

## 复跑命令

```bash
npm pack --pack-destination <dir>
pnpm add file:<dir>/personal-dsh-relay-host-0.0.0-pilot.2.tgz     # 在 $DSH_HOME/profiles/smoke 下
dsh --profile smoke --patch <pkg>/probe.patch.yml                  > probe-transcript.txt
dsh --profile smoke --patch <pkg>/disable.patch.yml --patch <pkg>/absence.patch.yml
dsh --profile smoke --patch <pkg>/enable.patch.yml  --patch <pkg>/absence.patch.yml
node scripts/verify-transcript.mjs --transcript <t> --fixture-root <f> --out transcript-report.json
node scripts/snapshot-dsh.mjs --label rc.6-baseline --out dsh-snapshot-rc6.json \
     --dsh-version 0.1.0-rc.6 --npm-root <npm root -g> --install-root <npm root -g>/@deepseek-ai/dsh
```

## 文件与结论

| 文件 | 结论 |
|---|---|
| `host-tests.txt` | `node --test test/*.test.mjs` → **28/28 PASS**，其中 fixture 与 probe 用例读的是真 DHR_25 冻结件 |
| `probe-transcript.txt` | `dsh` 启动 → **退出码 0，stderr 全空**，单行 `[relay-pilot-probe]` 转录；`appExit` 生效，进程未挂住 |
| `transcript-report.json` | `RESULT: IDENTICAL` —— list 与 5 份 detail 逐字段与磁盘 fixture 一致；`fake-run-0007`/`fake-run-0006` 按降级契约返回 null，不再让插件树加载失败 |
| `absence-disabled.txt` | `disabled: true` 后 `present:false`，退出 0 —— **禁用后服务未注册**（`disabled: true` 时 `apply()` 根本没跑，所以这条不等于「注册后卸载会清理」；那条证据在 `round2-lifecycle/`） |
| `absence-enabled.txt` | `disabled: false` 后 `present:true`，退出 1 —— **正控**，证明上一条不是恒假 |
| `dsh-snapshot-rc6.json` / `.txt` | rc.6 基线包闭包：195 个 `@deepseek-ai/*` 包、2 个未解析依赖 |

## 这批证据**不**覆盖什么

- rc.7 升级与 rc.6→rc.7 包差异（`compare-snapshots.mjs` 已就位，缺 after 快照）。
- `dsh plugin --profile web add/remove` 的目标机正式接线路径。
- verify 收口与用户签收（两轮换人复核已于 2026-08-20 完成，见 `review.md`）。
