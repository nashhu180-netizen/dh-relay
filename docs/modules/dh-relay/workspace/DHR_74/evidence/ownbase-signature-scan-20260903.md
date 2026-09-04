<!-- 证据 · DHR_74 独立基线三轮（E-7409）的 BL-17 / 凭据签名扫描与 skip 核销，主控执行，命令与判据可复核。 -->
# 签名扫描与 skip 核销 — DHR_74 独立基线 round1~3（2026-09-03）

## 扫描对象

`evidence/ownbase-gate-round{1,2,3}-*.txt` 与同名 `.junit.xml`，共 6 份。

## 签名定义（与 DHR_71 E-7119 同一套，便于两卡横比）

| 代号 | 正则 | 含义 |
|---|---|---|
| S-EPERM | `EPERM｜operation not permitted` | 原子 rename 被拒（BL-17 的 EPERM 形态） |
| S-STALL | `test timed out｜HUNG｜EXIT-PENDING` | 停顿形态红（F-7108 / F-7109） |
| S-FAIL | `not ok ｜<failure` | 任一失败用例 |
| S-CRED | `rcpt-[0-9a-f]{8}｜herdr-[0-9a-f]{8}` | 凭据 / 原始 Receipt 形态 |

## 命令与结果

```
rg -c "EPERM|operation not permitted|test timed out|HUNG|EXIT-PENDING|not ok |<failure|rcpt-[0-9a-f]{8}|herdr-[0-9a-f]{8}" \
   --glob "ownbase-gate-round*" <evidence 目录>
→ Found 0 total occurrences across 0 files    （零命中）
```

**空扫自证**（证明 glob 确实覆盖到这 6 份文件）：同目录同 glob 扫 `skipped|<testsuite` →
`Found 21 total occurrences across 6 files`（三份 `.junit.xml` 各 6、三份 `.txt` 各 1）。

## skip 核销

```
grep -c "^﹣ " <每轮 .txt>              → 三轮均为 4
grep "^﹣ " <每轮 .txt> | sed 's/ (.*//' | md5sum
→ 三轮同一摘要 4c02834abdc0f90eec2f58e9ff10ce32
```

即三轮 skip **恰 4 条且是同一批**（S1~S4，四条 DHR_33 用例，均挂 `F-3520 → DHR_72` 待重写），
按完整用例名逐条一致，无多解无少解。

## 条件措辞（F-71-LES-02）

结论仅覆盖这 6 份记录本身，且只在「该五文件冻结命令、`--test-concurrency=1`、2026-09-03 白天本机负载（无并发 worker）」下成立。
F-7402 的事件循环整段冻结是随机环境事件、机制未钉死；**未复现 ≠ 已修复**，后续轮次撞签名按 `.VOID-*` 作废留证重跑。
