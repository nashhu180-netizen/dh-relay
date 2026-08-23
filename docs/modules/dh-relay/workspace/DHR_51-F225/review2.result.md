verdict: changes-requested

## findings

- P0：无。
- P1：`relay-core/runtime/host.mjs:17` 的 `isLostLease` 使用 `startsWith('E_LEASE_HELD:lease-lost')`，不只匹配约定的 fencing 错误 `E_LEASE_HELD:lease-lost`；例如 `E_LEASE_HELD:lease-lost-extra` 也会被初始化期 `catch`（`host.mjs:83-87`）或 tick 期 `catch`（`host.mjs:75-80`）吞掉，错误会被错误收敛成 `lost_lease`，并跳过 release。应改为精确匹配，并补一个其它 `E_LEASE_HELD` 形态不会被吞的回归。
- P2：无。
- P3：无。

## 已核对事实

- `finally` 仅在 `lostLease === false` 时调用 `lease.release()`（`host.mjs:88-91`）；失租路径不会释放接管者租约。初始化期 `openStore`/`appendEvent` 的 `writeGuard` 错误与 tick 期 renew 错误共用 `isLostLease` 语义（`host.mjs:58-87`）。
- 当前 `lease.mjs` 的生产路径确实产生精确的 `E_LEASE_HELD:lease-lost`，普通抢占错误是 `E_LEASE_HELD`；但这不能证明前缀匹配满足“其它形态不吞”的边界。
- 现有 lost-lease 回归在 `relay-core/test/runtime.test.mjs:547-555` 覆盖模拟换手后的停机、`lost_lease=true`、非 graceful，并断言接管者租约 `after.epoch === 99`，因此接管者 epoch 保持有断言。

## 已执行命令与结果

- `node --test --test-name-pattern='host：租约被换手后旧会话自动停机且不释放别人的租约' test/runtime.test.mjs`（cwd `relay-core`）：1 test，1 pass，0 fail，exit 0。

## 未能确认项

- 未有直接回归覆盖初始化期 `writeGuard` 在租约换手后抛错的场景；代码路径已静态确认会进入同一 `catch`，但该路径的运行期证据仍缺。

## incremental verdict

verdict: approved

- P0：无。
- P1：原 finding 已收敛。`relay-core/runtime/host.mjs:17` 现在使用 `error?.message === 'E_LEASE_HELD:lease-lost'` 精确匹配；当前 `lease.mjs` 的普通 `E_LEASE_HELD` 以及其它非精确消息不会进入 `lost_lease` 分支。
- P2：无。
- P3：无。

复查命令：`node --test --test-name-pattern='host：租约被换手后旧会话自动停机且不释放别人的租约' test/runtime.test.mjs` → 1 test / 1 pass / 0 fail / exit 0。

未能确认项：初始化期 `writeGuard` 换手场景仍没有独立运行期回归；本次增量复查未发现新的代码问题。
