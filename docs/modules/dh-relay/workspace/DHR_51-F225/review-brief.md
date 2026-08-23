<!-- dh:v1 -->
# review-brief — DHR_51-F225

你是独立只读复核 worker。只审此维护树 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\DHR_51-F225` 中相对 `master` 的 diff；不得改代码、不得派活、不得问用户。

目标：检查 `relay-core/runtime/host.mjs` 是否只把 fencing 的 `E_LEASE_HELD:lease-lost`（包括初始化 `writeGuard` 写入期）收敛成不释放新租约的 `lost_lease`，且不吞没其它错误。

必查：

1. `finally` 中 release 的安全性；
2. 初始化期和 tick 期错误的语义是否一致；
3. `E_LEASE_HELD` 的其它形态会不会被误吞；
4. `relay-core/test/runtime.test.mjs` 现有 lost-lease 回归断言是否覆盖接管者 epoch 保持；
5. 运行 `node --test --test-name-pattern='host：租约被换手后旧会话自动停机且不释放别人的租约' test/runtime.test.mjs`。

将结论写到你被指定的独立结果文件，格式固定：`verdict: approved|changes-requested`，随后逐条 P0-P3 finding（无则写“无”）、已执行命令与结果、未能确认项。最后结束，不做任何其它操作。
