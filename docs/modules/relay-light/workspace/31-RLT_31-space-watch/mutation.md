# 有效单测 SW2

- 变异点：SpaceWatch.poll 的相等判断，故意忽略相同 status 下的 seq 变化。
- 文件：tools/relay-light/space_watch.py
- 原始 SHA256：db84fb8eb5a771195b42cd487ee03ce8ac095adbec99d3dd919a1c247b6856f2
- 变异：在 old==new 条件添加 status 相同即跳过。
- 测试：python3 -m unittest test_space_watch.SpaceWatchTests.test_sequence_change_without_status_change（cwd=tools/relay-light）
- RED：exit=1，业务断言 AssertionError: 1 != 0；非 setup/import/fixture 失败。
- 恢复：finally 精确恢复原字节，SHA256 相等。
- GREEN：exit=0，1 test OK。
- 实际执行者：Codex /root；2026-10-07；mock 行为证明，不是 Herdr 实跑。
