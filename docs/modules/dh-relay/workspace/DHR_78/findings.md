<!-- dh:v1 -->
# findings — DHR_78

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|

| F-7801 | P1 / cross-card split | 两条新增路径已具备 `instruction_ref` fixture，但旧 `herdrJudge` 结算方式不会在 Receipt-bound driver 中提交 Result；完整套件因此未得终态。追溯 `0dd371d`（DHR_64）可证 driver 有意移除自动 quota fallback，旧 DHR_34 测试未同步迁移。 | E-7810、E-7818；master B-38；独立 `wt/DHR_79` | DHR_78 只做用户批准的输入 fixture 适配，不重接被移除的自动 fallback、不改旧断言；identity-quota 迁移保留在独立 DHR_79 工作树，后续 Receipt 重试闭环另由已立卡 DHR_80 承接。此债不冒充通过，也不反向扩大本卡。 | transferred |
| F-7802 | environment / closed by rerun | `dsh-bridge` 上次记录的 Windows `EBUSY` 在早期复现中未得终态。 | E-7811、E-7819 | 本轮以相同文件独立复跑取得 7/7、exit 0、自然终态；未改 bridge。只关闭本卡回归阻塞，不宣称环境抖动永久消失。 | closed |
