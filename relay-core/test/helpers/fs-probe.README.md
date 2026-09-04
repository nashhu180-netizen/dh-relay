<!-- DHR_74 允许路径内新增（relay-core/test/helpers/**）。诊断探针，非生产代码；卸载 = 不注入 NODE_OPTIONS 即完全消失。 -->
# fs-probe 阈值与日志口径

- SLOW 阈值：单 op > 1000ms 首报；5000ms / 15000ms 追报（`SLOW` / `STILL-SLOW-5s` / `STILL-SLOW-15s`）。
- 进程 exit 时打 `EXIT-SUMMARY`（各 op 调用计数、slow 计数、max_elapsed）与 `EXIT-PENDING`（仍卡着的 op 清单）。
- 脱敏：打印时把 UUID 形态（含 receipt_id 路径段）替换为 `~<sha256 前 12>`——脱敏在打印这一步内建（F-7106 口径），不靠事后扫描。
- 日志走 stderr；不写文件、不改任何 fs 行为（纯观测，零语义影响）。

## 覆盖边界（不能用它下什么结论）

- 只包 ESM `node:fs/promises` 的具名 op；`FileHandle` 实例方法（`writeFile` / `sync` / `close`）未包。
- CJS `require('fs')` 与同步 API 不经 loader hook。
- 不观测 actor `submitControl` 队列与 Store 写队列的入队/出队/深度；「fs 无慢 op」不能推出「写队列没卡」。
- `LOOP-LAG` 只证明 timer 未按期获调度，不能区分同步 JS / GC / OS 调度 / 探针自身 I/O。
