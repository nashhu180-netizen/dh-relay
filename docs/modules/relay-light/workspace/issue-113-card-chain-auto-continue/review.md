# Issue #113 · light 独立复核

复核者：Opus 子代理（只读，非施工者；施工为主会话 Fable 5.1）。范围：PR 对 `AGENTS.md`、relay-light SKILL、两侧 adapter、卡级总表模板的 diff；只评估协议一致性、权限边界与可执行性，未改运行代码。

## 首轮：三路 FAIL

- P1-1 「写定即视为明确确认」与 model-allocation gate「未获明确确认不得启动任何 agent」字面冲突，且下一卡 orchestrator 自身模型档未定。
- P1-2 adapter 写「或用户确认」，给 fail-closed 留了交互出口。
- P1-3 「自动接续」栏在总表内，而总表唯一写者就是收口 orchestrator，可自授权。
- P1-4 「每张下一卡」与「每次只拉一张」矛盾；非维护卡收口无总表写权无法执行。
- P2-5～9：编排职责未互引；「是」与 AGENTS 第 5 条授权包关系不清；新 orchestrator 拿不到 Issue/分支/PR；收口后才满足的条件无人再判；失败时维护权跳过已开工卡。
- P3-10～13：description 未标冻结；「空白」未定义；模板「前置卡」与 SKILL「收口卡」不一致；adapter 未提开局准备。

## 返工

gate 节加唯一例外；「是」必须写定 orchestrator 模型档；栏只由用户写定 + 页头「自动接续授权」来源指针 + 追溯不到按否；执行者改为维护会话（本卡收口前或收到非维护卡通知时）；多张逐张全部拉起、维护权交行序首张；启动 prompt 含 Issue/分支/worktree/PR/分配；失败只停该卡、汇报列半成品、维护权按默认规则；其余 P2/P3 逐条落实。

## 复审：一致性 PASS · 权限边界 PASS · 可执行性 PASS

残留 P2-A（维护会话未收口时代执行的授权/时机）与 P3-B/C/D/E 已在合入前修掉：执行者统一为维护会话、失败只停当前卡、汇报列半成品、代填附用户指针、AGENTS.md 措辞对齐。

## 验证

- 本地：test_install_skill 19 OK；`git diff --check` 通过。
- CI 与合入证据见 Issue #113。
