# task — Issue #107 Skill 版本号撞车修正

## 完成条件

1. Skill 标题下版本行为 `版本：v1.2.0`，其它正文不变，既有技能测试通过。
2. PR 必需 CI 通过后合入 master，本机两份安装副本与源文件一致。

## 本卡开工授权

- 用户原话：2026-09-30「可以」（回应主会话“开个一行小 PR 把版本升到 v1.2.0 再同步本机副本”）。轻档纯文档小修改，由主会话执行与自评（同 #98）。
- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/107
- 远端交付：origin=nashhu180-netizen/dh-relay；分支 wt/issue-107-skill-version-bump；目标 master。
- 范围：版本行、本记录、本机安装副本同步；含精确提交、PR、必要 CI、合入复验与本任务树清理。
- 总表：无（独立小修改）。

## 背景

PR #103（`4a33d31`，Draft MR/PR）与 PR #105（`ea11a17`，卡级总表通知与移交）各自从 v1.0.0 升为 v1.1.0，两批不同改动共用同一版本号，无法据版本判断副本是否含 #105。v1.2.0 标识同时包含两批改动的现行版本。

## 进度与验收

- 2026-09-30：SKILL diff 仅版本行一处；test_install_skill 通过；git diff --check 通过。完成条件 1 通过。
- 完成条件 2 的 CI、合入 SHA 与副本哈希证据追加至 Issue #107，不递归建收口 PR。
