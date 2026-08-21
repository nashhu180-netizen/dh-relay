# DHR_50 证据索引

## 取证边界

- 日期：2026-08-21；本卡只读 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\`，未修改 Pilot、DSH 或 fixture。
- DSH 版本：`0.1.0-rc.7`；独立 Home：`<pilot>/dsh-home`；profile：`web`（DHR_26 / DHR_49 已落盘事实）。
- 本卡重跑的 CLI 只读命令：

  ```powershell
  node .\bin\relay-pilot.mjs list .\testdata\fake\runs-active.json --format json
  node .\bin\relay-pilot.mjs list .\testdata\fake\runs-active.json --layout grouped
  node .\bin\relay-pilot.mjs show .\testdata\fake\run-chinese.json --format json
  node .\bin\relay-pilot.mjs show .\testdata\fake\run-chinese.json
  node .\bin\relay-pilot.mjs hash .\testdata\fake\run-chinese.json
  ```

## CM4

| ID | 一侧/类型 | 证据 | 证明什么 | 限制 |
|---|---|---|---|---|
| E-501 | CLI 当前只读转录 | 上述命令；结果摘要写入 [cm4-field-comparison.md](./cm4-field-comparison.md) | CLI 仍从冻结 list/detail fixture 输出同一组字段和值 | CLI 输出为文本/JSON，不证明 DSH 渲染 |
| E-502 | DSH 列表屏真实 DOM 转录 | `<pilot>/evidence/dhr49/batch2/_mirror/screen-baseline.txt` | `Relay` 页面、5 条、fixture `67fb18b3`、四组分组及五条卡片的可见字段 | `innerText`，非像素级证据 |
| E-503 | DSH 列表屏重建 | `<pilot>/evidence/dhr49/batch2/list-screen-rebuild.md` | 首载/刷新/DSH 重启后三次 `innerText` SHA-256 均为 `076c9d4a…9e24`，run 顺序恒为 `0005/0007/0002/0001/0006` | 同机、同浏览器；目标机无会话，未验证该侧 UI |
| E-504 | DSH 详情屏真实截图 | `<pilot>/evidence/dhr49/batch4/detail-screen-relayplan.png` | `fake-run-0005` 的元数据、五步节点表和一条 Attention 在真实 DSH `Relay` 页签呈现 | 截图无法覆盖不可见字段或像素外语义 |
| E-505 | DSH Host 同一输入 | `<pilot>/evidence/dhr49/batch1/probe-transcript.md`；`batch3/clean-rerun.txt` | DSH 浏览器端报告 Host `fixture_hash=67fb18b3d7d84fa8…d39612c`；清净重跑报告 5 条与详情全文 SHA-256 | Host/payload 证据不能替代 UI 字段对照，只补 UI 不显示的协议元数据 |

## CM6b

| ID | 证据 | 证明什么 |
|---|---|---|
| E-506 | [cm6b-audit.md](./cm6b-audit.md) | 对运行时代码、工作区和 Pilot 根目录的只读审计结果 |
| E-507 | `workspace/DHR_26/findings.md` §38~43；`workspace/DHR_49/review.md` 的 DM5b / DM4b 记录 | Host/Client 只消费普通 JSON、DSH 插件生命周期和已知限制 |

## 与主报告的诚实差额输入

主报告 `DM-deferred-facts: stoploss-not-triggered` 是 2026-08-20 的时点快照。DHR_49 于其后增加的事实必须由本卡逐条核对：两屏实证、DM2 判据②缺“目标机面板渲染出数据”、H-e2e 未做、目标机 UI 未验证、三态尚待人判。
