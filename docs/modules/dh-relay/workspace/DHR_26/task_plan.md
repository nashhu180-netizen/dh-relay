<!-- dh:v1 · task_plan.md — 施工图。🔵 开工时冻结；实际偏离只记 progress。 -->
# task_plan — DHR_26 树外 Host Plugin

> 执行契约头：终点以 `brief.md` 与 DevPlan DHR_26 为准；代码先 TDD，目标机证据后补；任何本机未执行事实不得写成 PASS。

## Context Packet

| ID | 来源 | 为什么 |
|---|---|---|
| C-01 | `brief.md` | 终点、边界、状态语义 |
| C-02 | P4 DevPlan §2.3、§3.2 DHR_26、§4.2/§4.4 | Read Model、DM1/4a/5a 与止损口径 |
| C-03 | `dev-harness/SKILL.md`、`references/动作-D-开工.md` | 八文件、TDD、证据与状态机 |
| C-04 | DHR_25 仓外 `testdata/fake/` | 唯一 fixture 输入；不得在本卡复制第二套契约 |
| C-05 | DeepSeek Harness rc.7 `99f6f02` 的 Cordis/Client Modules/Profile 文档与源码 | 树外插件接口事实 |

## 批次与验证

### 批 A · 先钉 Read Model 不变量（已做）

1. 红测：从目录选择 populated list，按 `run_id` 关联详情；相关字段、Attention 数和节点总数不一致必须失败。
2. 最小实现：`fixture-store.mjs` 只读 JSON，生成冻结 snapshot；所有公开返回值深拷贝。
3. 安全补强：特殊 `run_id="__proto__"` 必须成为自有 JSON 键，不能污染对象原型或伪造详情。
4. 证据：`node --test src/dsh-host/test/*.test.mjs` → 11/11。

### 批 B · Cordis Service 与一次性 probe（已做）

1. `RelayPilotService extends Service`，`super(ctx, 'relayPilot')`。
2. 对外只暴露 `fixtureHash/listRuns/getRun/snapshot`，不注册 route/event/timer/process handler。
3. `probe.mjs` 注入 `relayPilot`，一次打印 `[relay-pilot-probe] <snapshot>`。
4. 静态测试只允许框架值导入 `@deepseek-ai/cordis`，禁止 `@deepseek-ai/dsh-*` 私有实现包。

### 批 C · 生命周期配置（已做代码，待目标机）

1. `cordis.patch.yml` 装 Host。
2. `disable.patch.yml` / `enable.patch.yml` 用 rc.7 Cordis 显式 `disabled` 覆盖层。
3. package 使用 peer Cordis、Node ≥18，不把 Cordis 打进包。
4. `npm pack --dry-run` 证明所需 9 个运行文件均进入包。

### 批 D · Windows rc.7 真实接线（用户本地待做）

1. 复验 B-10 rc.6 预采快照和当前版本；漂移则重采。
2. 按原安装渠道升到锁定 rc.7，采升级后快照并对差。
3. 在独立 `DSH_HOME` materialize、安装、加载 probe，保存首次终端转录。
4. 分别验证 disabled、re-enabled、remove；每次用 `--dump-config`/启动结果确认服务行与清理。
5. 把真实命令、退出码、版本和转录补到 `review.md`/`findings.md`。

### 批 E · 复核与收口（用户本地，非本次授权）

两轮换人复核、P0/P1 清零、`dh dh-relay` 与目标机命令可复跑后，才可进入「待验收」；用户签收后才 verify。本分支不执行这些动作。
