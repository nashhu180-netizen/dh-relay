<!-- dh:v1 -->
# visual_map — DHR_51-F225

```text
acquire lease → openStore / append lease event → tick renew
                         │
                 lease 换手发生
                         │
            E_LEASE_HELD:lease-lost
                         │
          lost_lease 摘要 + 不 release
```

证据点：定向回归、全量 90 条、接管者 epoch=99 保持不变。
