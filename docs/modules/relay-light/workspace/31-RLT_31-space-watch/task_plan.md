<!-- dh:v1 -->
# RLT_31 施工基线

1. Create space_watch.py：stdlib CLI，按 workspace 发现+get 精确快照，身份由 --self（缺省 HERDR_AGENT_NAME）指定；默认 120 秒。只存内存，不输出完整 Herdr 响应。
2. Create test_space_watch.py：新角色、不带 toy 前缀、外 space、自身排除、status/seq 独立变化、离开/重入、通知未确认/失败、环境闸与无文件写入。
3. Modify SKILL/两 adapter：限定 single-task，脚本启停与健康巡检，watcher 派单固定 workspace/notify/self，安全 Enter 仍仅人工满足三条件才可一次；脚本永不发送 Enter。
4. Modify install_skill.py/test_install_skill.py：单源脚本随 skill 复制并核哈希；只在隔离临时 home 验证安装，用户级安装不属本卡发布授权。
5. 运行 Python discovery 与仓级 PowerShell runner；做有效单测 business mutation RED→逐字恢复→GREEN；独立代码/需求/教训复核，修复并定向复验。
6. push/PR/CI；全部硬门及真实 Herdr 验证通过才服务端合入、合入态复验、verify 与回填/清树。Herdr 缺失只保留 PR 和未覆盖项，不声称完成。

## 前置核对

2026-10-07 master/origin/master=9e1a6e772a723a0494878b35577c8672604b3ca8；主树干净；gh viewerPermission=ADMIN；CI 仅测试无部署步骤；Python/gh/herdr 可用；HERDR_ENV 未设置。Herdr list/get JSON 采用现役 CLI/留存 fixture，SW6 必须真实管理 pane，不能伪造 env。
