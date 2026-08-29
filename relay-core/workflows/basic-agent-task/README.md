# workflows/basic-agent-task — `relay/basic-agent-task@1`

> 由 **DHR_31** 建立（2026-08-28）。这是 Relay v2 的**第一个 Workflow 定义**，也是 P5-M5 /
> design/06 H1·H2·H5 的行使场景：无 DevHarness、无 DSH，只用 Runtime + Process Executor 跑通
> 「准备 → 处理 → 机器校验 → succeeded」。

## Workflow 定义就是一份 `relay.run/v2` 文档

`run.template.json` 不是新格式，它是一份**合法的已冻结 `relay.run/v2`**——本卡不引入任何新协议、
不改 `contracts/`。可用独立校验器直接对证：

```
node tools/validate.mjs workflows/basic-agent-task/run.template.json --schema relay.run/v2
```

三个节点、一条链，全部 `required: true`：

| node_id | 依赖 | 干什么 |
|---|---|---|
| `prepare` | — | 产出确定性输入清单（4 个 item） |
| `process-task` | `prepare` | 对清单做确定性变换（大写 + 长度 + 总长 + checksum） |
| `verify` | `process-task` | 拿 `prepare` 的原始输入**独立复算**并逐条断言，不符即非 0 退出 |

三个节点都是 `required: true`，`executor_profiles` 都只有 `kind: "process"`——所以它同时是
H6 可达性推导的**阴性对照**（必经闭包里没有 dsh-only 节点 → 放行）。

## `ref` 是**业务仓相对路径**

`executor_profiles[].ref` 是 `locator`（README 硬约束 4：相对/符号化，禁绝对路径）。Runtime 把它
按 **`resolve(<业务仓根>, ref)`** 解析，并在解析后再验一次「落点仍在仓内」——`../` 折叠出去的
路径一律 fail-closed（`E_BAD_VALUE`），不看它是否真的存在。

于是在业务仓 `X` 里跑这条 Workflow 的做法是：

1. 把本目录整份放到 `X/workflows/basic-agent-task/`（模板里的 ref 就是按这个位置写的）；
   放到别处就同步改 ref，仍必须是 `X` 内的相对路径。
2. 复制 `run.template.json`，按需要改 `summary` / `labels`（`run_id` 会被 Runtime 发号覆盖，
   模板里那个只是占位）。
3. `relay start --run <改好的 run.json>`（或经 RPC `start`）。

Runtime 只驱动**能在本仓解析到真实文件**的 `process` 节点：ref 指向的文件不存在时，该节点保持
`pending`、不开 Attempt——Runtime 不为一个自己启动不了的执行入口凭空造一个 Attempt。目录逃逸是
另一回事，那是 Run 文档本身有问题，必须响亮地失败。

## 步骤脚本合同

每个 step 是一个独立 Node 进程，`cwd` = 业务仓根：

- **stdin**：一个 JSON 对象
  ```jsonc
  {
    "run_id": "R001-...",
    "workflow_name": "relay/basic-agent-task@1",
    "node_id": "process-task",
    "attempt_id": "…",
    "upstream": { "prepare": { /* 该节点成功结果的 structured */ } }
  }
  ```
  `upstream` 覆盖 `depends_on` 的**传递闭包**（所以 `verify` 看得到 `prepare`，尽管它只直接依赖
  `process-task`）；尚无成功结果的节点取值为 `null`。
- **stdout**：一个 JSON 对象，原样成为 `relay.result/v2` 的 `structured`（空输出 = `{}`）。
  不是 JSON 对象即判 `E_BAD_VALUE`——协议要的是结构化结果，不是散文日志。
- **stderr**：自由文本，尾部若干字节会随失败结果记入 `structured.stderr_tail`。
- **退出码**：`0` = 成功；非 0 → `E_EXECUTOR_EXIT_NONZERO`；被 Runtime 中断 → `E_EXECUTOR_KILLED`。

步骤脚本**零依赖**（只用 Node 标准库），因为它们会被复制进任意业务仓，不该拖 relay-core 的实现细节。

## 可配置延时（`basic-agent-task.delay_ms`）

`process-task` 认一个 label：

```json
{ "key": "basic-agent-task.delay_ms", "value": "35000" }
```

它在**产出结构化结果之前**多睡这么多毫秒，然后把 `delay_ms` 一并写进结果载荷。用途是把
一条 Run 拉长到足以做断连/重连实录（DHR_31 批 3 · 3.2）。上限 10 分钟；值不是非负数就**直接
失败**（`E_EXECUTOR_EXIT_NONZERO`），不当 0 静默跑完——否则「延时没生效」会伪装成「跑得真快」。

被校验的字段一个都不受影响：`processed` / `count` / `total_length` / `checksum` 与不加延时时逐字
相同，所以 `verify` 照常复算通过。

**为什么是 label 而不是环境变量**：labels 是 `relay.run/v2` 里唯一的不透明搭车位——Relay 只存
不读，driver 原样转交，认这个 key 的是步骤脚本自己（业务层）。好处是**一份 run.json 自带全部
执行参数**，换台机器、换个终端、隔几天重放都是同一条 Run。环境变量做不到：service 是常驻进程，
变量在**它**起来那一刻就定死了，之后的 `relay start` 改不动它，于是「我明明设了 30 秒」和
「它 1 秒就跑完了」会同时为真。

### 生成一份慢跑的 run 文档

模板里的 ref 是**业务仓相对路径**，而 Workflow 未必躺在业务仓根下（在 dh-relay 仓里它在
`relay-core/` 下），所以生成时要按实际位置补前缀。`make-run.mjs` 就干这一件事——它默认按
自身位置推导前缀，**cwd 必须是业务仓根**：

```
node relay-core/workflows/basic-agent-task/make-run.mjs --out run-slow.json --delay-ms 35000
```

参数：`--out`（默认 `run-basic-agent-task.json`）、`--delay-ms`（默认 0 = 不加延时）、
`--prefix`（覆盖自动推导的前缀，例如 Workflow 已复制到业务仓根下时传 `--prefix ""`）。

生成完先自证一遍，**不启动任何 service**：

```
node relay-core/tools/validate.mjs run-slow.json --schema relay.run/v2
```

然后就可以起了：

```
node relay-core/cli/main.mjs start --run run-slow.json
```

`run_id` 是占位串，Runtime 会按仓级序号重新发号覆盖它，不必手改。

## 边界

- 驱动逻辑在 `runtime/workflow-driver.mjs` + `runtime/process-executor.mjs`，只在宿主 actor 一侧
  运行（唯一写者不破）；本目录**只有数据与步骤脚本**，没有调度代码。
- Attempt 终态一律经 `store.appendResult()` 记账——raw `appendEvent` 写终态会被
  `E_TERMINAL_STATE_CONFLICT` 硬拒，这是设计不是 bug。
