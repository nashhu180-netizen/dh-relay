# task — Issue #98 Skill 版本标识

## 完成条件

1. Skill 标题下显示 `版本：v1.0.0`，其它正文不变，结构校验通过。
2. PR 必需 CI 通过后合入 master，本机已有安装副本与源文件一致。

## 本卡开工授权

- 用户原话：2026-09-29「skill 补充个版本号吧」。轻档纯文档小修改，由主会话执行与自评。
- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/98
- 远端交付：origin=nashhu180-netizen/dh-relay；分支 wt/issue-98-skill-version；目标 master。
- 范围：版本行、本记录、已有本机安装副本同步。包括精确提交、PR、必要 CI、合入复验与本任务树清理；不含发布或其它任务。
- 总表：无（独立小修改）。

## 施工步骤

1. 在 tools/relay-light/skill/SKILL.md 标题下增加版本行。
2. 校验 Skill 结构与差异，提交并创建 PR，等待必要 CI。
3. 合入后复验并同步本机副本，核对哈希后清理任务树。

## 进度与验收

- 已核对远端权限、master 基线和 CI；仅测试 workflow，无部署发布步骤。
- 2026-09-29：quick_validate.py 返回 `Skill is valid!`；git diff --check 通过；Skill diff 仅新增版本行及空行。完成条件 1 通过。
- 完成条件 2 待远端 CI、合入及同步；最终 SHA、CI 与副本哈希证据追加至本 Issue，避免为记录 CI 结果递归创建收口 PR。
