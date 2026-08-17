<!-- dh:v1 -->
# as-built · relay policy 守卫（`tools/policy/`）

> **阅读对象**：后续每张 P2 卡的施工与复核棒。**本守卫是所有后续卡任务级证据命令的常设机器闸**——不要在自己的卡里另写一套策略。
> 交付于 `DHR_04`。本文写**实际长成什么样**与**怎么用**，设计意图见 [design/02 B9](../design/02-完整流水-产品设计与验收.md)。

## 1. 它是什么

一个**纯谓词 + 黑盒 CLI**的 fail-closed 守卫，回答三个互相独立的问题：

| 模式 | 问什么 | 判据来源 |
|---|---|---|
| `dev-isolation` | 这批改动有没有越出 dh-relay 自己的开发边界 | 固定根（生产根 / 禁改根 / 文档根） |
| `content` | 这批写入是不是"卡被授权范围"的子集 | authority snapshot 的 `change_scopes` + 四条 harness 派生位置 |
| `landing` | 有没有在模块目录下自建 relay 文件夹、有没有往 legacy 根新写 | 落点规则 + run 前后路径快照 + marker 探针 |
| `all` | 上面三条一起跑 | — |

**默认拒绝**：允许集只能从固定根与 authority fixture 推导；未知路径归 `unclassified-path` 而不是放行。

## 2. 文件

| 文件 | 是什么 |
|---|---|
| `tools/policy/relay-policy.ps1` | 纯函数。无 IO、无全局状态，可被任意宿主 dot-source |
| `tools/policy/Invoke-RelayPolicyCheck.ps1` | 黑盒 CLI。头部注释是**输入契约与退出码契约的权威处** |
| `tools/tests/relay-policy.ps1` | 85 条断言，已接进 `run-relay-tests.ps1`（排在 `relay-contract-reason-coverage.ps1` **之前**） |
| `tools/tests/fixtures/policy/authority-2cards.json` | 合成 authority snapshot 夹具（两卡，含精确文件 scope 与目录 scope 各一） |

## 3. 怎么用（后续卡照抄这一段）

```powershell
# 1. 生成路径清单——三条命令都产出【裸路径】，NUL 分隔，可直接拼接
$a = (git -c core.quotePath=false diff --name-only -z master...HEAD) -join ''   # 本分支已提交
$b = (git -c core.quotePath=false diff --name-only -z HEAD) -join ''           # 工作区相对 HEAD
$c = (git -c core.quotePath=false ls-files -z --others --exclude-standard) -join ''  # 未跟踪
[IO.File]::WriteAllText($after, ($a+$b+$c), [Text.UTF8Encoding]::new($false))

# 2. 喂给守卫
pwsh -NoProfile -File tools/policy/Invoke-RelayPolicyCheck.ps1 `
     -Mode dev-isolation -AfterPath $after
```

三条**坑**，每条都是实测踩出来的：

1. **三点比较** `master...HEAD`，不是两点。两点会把 master 侧的文件也带出来。
2. **不要用 `git status --porcelain`**。它的条目是 `XY <path>`（状态码 + 空格 + 路径），不是裸路径；喂进去会报一批假违规。方向是 fail-closed 不放行，但整轮排查白费。
3. **不要手工剥 git 引号**。加了 `-c core.quotePath=false` 就没有引号；真出现带引号的条目，守卫会 `exit 3` 拒掉——**这是故意的**，见下。

## 4. 退出码契约

| 码 | 含义 | 触发 |
|---|---|---|
| `0` | 通过 | — |
| `1` | 判违规 | 输出 JSON 报告（`ok` / `reason` / `violations[]`） |
| `2` | **输入错误**（文件层面） | 缺参数、文件不存在、空文件、零条有效路径 |
| `3` | **守卫自身异常**（条目/路径层面） | 下表五种 throw |

**`2` 与 `3` 的分界线**：文件层面的问题给 2，条目或路径层面的问题给 3。

## 5. 拒绝优先级（改动这里会改变调用方拿到的 reason）

一条输入可能同时犯多条。**外层先报**，顺序是：

```
1 policy-path-empty            没有路径
2 policy-path-control-char     这不是"一条"清单条目（含 C0/DEL，如 NUL、孤立 CR）
3 policy-path-quoted           这不是裸路径（git core.quotePath 输出）
4 policy-path-not-relative     是路径，但不是仓库相对路径
5 policy-path-dotdot           是仓库相对路径，但内容非法
```

**分层的理由**：2/3 是「**条目**畸形」，4/5 是「**路径**畸形」。一坨同时犯两类的输入必须报**外层**那个——否则调用方会去修错的东西（拿到 `not-relative` 就去改路径写法，而真正的毛病是他把整份清单当成了一条）。

顺序有断言钉住（相邻三层各一条混合夹具）。**注意夹具必须让两层谓词都会命中才钉得住顺序**——两端包裹的 `"D:/repo/x"` 钉不住「引号 > 非相对」，因为前导引号让 `^[A-Za-z]:` 和 `IsPathRooted` 双双落空，只有引号层命中；要用尾随-only 的 `D:/repo/x"`。

### `not-relative` 的边界

拦：`~`、`~/…`、`~user/…`（POSIX 家目录）、`/…`、`//server/share/…`、`\\?\…`、`D:/…`、`C:\…`、盘符相对 `D:x`。

**放行**：`~$tmp.docx` 这类**无斜杠**的、以 `~` 开头的文件名（Office 锁文件）。**判别子是斜杠，不是 `$`**——`~<任意>/` 是家目录引用，`~<任意>` 无斜杠就是个文件名。放行它是因为这类临时文件会混进 `--untracked-files=all` 的清单，一律拦会让整份证据被一个锁文件打成 exit 3。

## 6. 已知边界（**不是缺陷，是本卡范围之外**）

**守卫的输入面（"一坨文本里有几条路径"）不属于 `DHR_04`，整面收窄已另立 `DHR_22`。**

现行读取器接受 JSON 字符串数组，或按 `[\0\r\n]+` 拆分的文本。后者有一类残留现象：`U+2028` / `U+2029` / `U+0085` 这三个 Unicode 行终止符**不在拆分集里**，也不在控制字符拦截集里（它们是 NTFS 合法文件名字符），所以含它们的清单会被粘成一条路径，前缀落在文档根上就整坨放行。

**为什么不在本卡修**：它们是合法文件名字符，自动当分隔符拆**会误伤真文件名**——这个面上不仅问题找不完，有些"修复"本身还是错的。`DHR_22` 把输入收窄成 JSON 字符串数组后，歧义消失：一条 JSON 字符串就是一条路径，`docs/…/x.md␨.dh-runtime/…` 作为**一个文件名**确实在文档根下，放行是**正确判定**。

详见 `workspace/DHR_04/findings.md` F-007。

## 7. 改这块之前要知道的

- **不要在后续卡里另写一套策略。** 本守卫是常设机器闸，各卡只调用、不复制。
- **纯函数层不做 IO**。要加新判定就加在 `relay-policy.ps1`，CLI 只负责读参数、组装、映射退出码。
- **新增 reason 码不会自动进覆盖闸**：闸门只采集 `New-RelayValidationError` 参数、`reason =` 赋值和含 `verdict|reason` 字样行上的码，**守卫 `throw` 的码不在采集面内**（见 findings F-006）。所以守卫码的覆盖**只靠套件自身断言保证**，加码必须同时加断言。
- **改拒绝优先级**要同时改第 5 节的注释、混合夹具断言和本文——三处一致才算改完。
- `content` 模式需要 authority snapshot；`landing` 模式需要 `-BeforePath`（run 前路径快照）。CLI 目前对 `landing`/`all` 恒传 `$null` marker 探针，故 `module-relay-folder` / `workspace-relay-folder` 两码在 CLI 生产路径不可达（纯函数层可达、有断言）——接真实探针的卡负责补。
