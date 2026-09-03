<!-- 证据 · DHR_71 独立基线三轮的 BL-17 / 凭据签名扫描（主控执行，命令与签名定义可复核）。 -->
# BL-17 签名扫描 — DHR_71 独立基线 round1~3（2026-09-03）

## 扫描对象

`evidence/own-baseline-round{1,2,3}-*.txt` 与同名 `.junit.xml`，共 6 份（三轮的 spec stdout + JUnit）。

## 签名定义（本次冻结）

| 代号 | 正则 | 含义 |
|---|---|---|
| S-EPERM | `EPERM｜operation not permitted` | 原子 rename 被拒（F-7003 / F-7004 族，BL-17 的 EPERM 形态） |
| S-STALL | `test timed out｜HUNG｜EXIT-PENDING` | 停顿形态红（F-7108 / F-7109：等满预算、进程退出仍有在途 op） |
| S-FAIL | `not ok ｜<failure` | 任一失败用例（spec / JUnit 两种表达） |
| S-CRED | `rcpt-[0-9a-f]{8}｜herdr-[0-9a-f]{8}` | 凭据 / 原始 Receipt 形态（design/12 §2 脱敏红线） |

## 命令

以上四类合并为一条正则，对 6 份文件做计数扫描（ripgrep，等价 `grep -aEc`）：

```
rg -c "EPERM|operation not permitted|test timed out|HUNG|EXIT-PENDING|not ok |<failure|rcpt-[0-9a-f]{8}|herdr-[0-9a-f]{8}" \
   --glob "own-baseline-round*" <evidence 目录>
```

## 结果

**0 命中 / 6 份文件**（`Found 0 total occurrences across 0 files`）。

对照自证（证明 glob 与扫描确实覆盖到这 6 份文件、不是空扫）：同目录同 glob 用 `skipped|<testsuite` 扫描 →
`Found 21 total occurrences across 6 files`（三份 `.junit.xml` 各 6 命中、三份 `.txt` 各 1 命中）。

## 结论

三轮独立基线记录中：零 EPERM 形态、零停顿形态、零失败用例、零凭据形态。

**条件措辞**：本结论只覆盖这 6 份记录本身；它不证明停顿机制已消除——F-7402 登记的事件循环整段冻结是随机环境事件，未复现 ≠ 已修复。

## 逐文件明细（独立第二次扫描，`grep -aEc` 形态）

同签名定义用 Git Bash `grep -aEc` 逐文件重扫，结果落 `bl17-signature-scan-20260903T090258Z.txt`：
6 份文件 × 4 类签名**全部为 0**。两次扫描（ripgrep 合并计数 / grep 逐文件计数）互为对照。
