<!-- lesson_candidates.md -->
# lesson_candidates — DHR_53

## 教训候选

| ID | 一句话教训 | 状态 |
|----|-----------|------|
| L-001 | 粘贴文本可能不进 agent 上下文：只剩 `[Pasted text #N +k lines]` 占位符，transcript 里也无正文——凡是任务范围来自粘贴块的，agent 必须显式声明"我没读到"，不许沉默地按猜测开工。 | ready-for-review |
| L-002 | 后端能力类记忆会过期：`review-dispatch-fallback` 记的"codex 凭据已不在"当晚实测已不成立；派复核前先实跑一次探针再决定记账口径，别照记忆下结论。 | ready-for-review |

> 状态流：`ready-for-review` → 人裁决 → `needs-promotion / promoted / rejected`
