# 源仓证据

2026-10-07：Issue #156 已建，源树固定 2246b16；独立仓 Issue #1 与任务树已建。

2026-10-07：source整体CI37598189335 SUCCESS（必需三job绿；观察relay-core timeout FAILURE保留）。用户确认迁最新总表并协调原维护者，AW本地主树5a47a4f原字节保存新仓；两维护会话消息接口active writer未送达，旧表仍权威。两PR保持Draft，暂停合入/主树同步/清理，最新候选和回执要求见独立仓docs/table-cutover.md。未改源主树或推送其无关未推提交。

2026-10-07：两原维护者暂停ACK已收；AW源5a47主树无未提交表改动；WFP确认PR158/65f87a0未合入最新delta并暂停该PR，新仓候选按最新原字节补录（9458e4f）。源主树未推提交保持完整。待新仓最新CI/定向复核、新仓合入及原维护者路径确认后合入本仓退休PR。

2026-10-07 实际交付：源PR157按仓库仅允许squash合入8cbff63；新仓PR2合入7a3346f。两原维护者已核新表/更新execution_strategy路径且保留维护权；AW5a47与WFP未合入PR158-65f87a0原字节已迁。source本地3b8a0e合并保留未推旧史5a47、与8cb同树，未推无关提交。源合入态PowerShell全部PASS（原条件skip1），主干空verify 3940ad542a20e76c51153dd6941db60f103cfc51按本卡授权留痕；远端verify由本次有限证据收口PR的squash主提交承载，最终sha以该PR实际merge_commit_sha为准。完整证据/复核/变异/失效日志/私有现场保全记录在独立relay-lite RLT_33 workspace。source历史dh失败及relay-core观察失败保留，不视为产品门通过。WFP恢复通知因原业务交互blocked排队，不冒充恢复确认；新路径权威已由其确认。Issue/本卡清理在两仓有限证据PR实际合入后执行；旧PR158与其它卡现场保持。

2026-10-07 收口更新：AW原维护者恢复回执已收；WFP排队通知已于第19次投递到原UUID/w6F:p1，未代答业务对话，恢复ACK待其确认。源PR159必要三job已PASS且完整workflow SUCCESS，按最新版同范围重新核CI；本源卡验收完成候选待PR159实际合入生效。最终远端verify SHA以PR159 merge_commit_sha为准，主验收/证据在独立仓，不另生收口PR。
