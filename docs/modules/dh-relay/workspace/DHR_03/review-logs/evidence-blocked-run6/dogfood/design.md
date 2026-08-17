# dogfood·blocked — 假需求（一屏）

目标：在运行现场 `work/` 目录下产出 `A.txt`，其内容必须**引用 `B.txt` 的第一行**（原样抄一遍，前缀 `ref: `）。

验收：
- `work/A.txt` 存在，且包含一行 `ref: <B.txt 第一行>`。
- `work/B.txt` 存在，第一行形如 `B-DONE-<时间戳>`。

说明：这是 dh-relay DHR_03 的 dogfood 夹具，全部内容为演练用；不涉及真实业务。
