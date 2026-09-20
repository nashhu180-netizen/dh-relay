# RLT_27 retry02 C1 coder result

- node: `C1`
- agent: `coder#1`
- outcome: `PASS`
- artifact: `docs/modules/relay-light/workspace/RLT_27/retry02/linux-codex-usage.md`
- retry: `retry02`
- coordinator correction / retry intervention: `1`
- attempt01: `preserved`
- evidence: current Linux read-only checks resolved Herdr/Codex/Python paths and versions; Herdr session status, workspace/agent topology, and `workspace create`, `pane split`, `agent start`, `agent prompt --wait`, `agent wait` help contracts were inspected
- checked: exact paths; Codex launch; foreground wait; durable completion criteria; known limitations and unverified capabilities
- restricted sandbox: `not verified`
- deviations: none
- findings: appended one authorized line to `findings.md` about Herdr readiness/state detection not being durable completion and the working-target turn ambiguity
- lessons: appended one authorized candidate to `lesson_candidates.md` about treating terminal states only as wake-up signals
- next: monitor may consume this signal and the guide; checker must independently verify and PASS before C1 can close; coder stops immediately and does not wait for `node_closed`
