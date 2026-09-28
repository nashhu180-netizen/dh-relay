"""RLT_30 完成条件 5 的 grep 检查（从仓根运行：python3 docs/modules/relay-light/workspace/RLT_30/evidence/grep_check.py）。

①「监工」= 0；② monitor 删冻结词后残留只允许落在 task_plan §3 内容锚定白名单行；③ roles.toml 无 [monitor] 段头。
冻结词正则与 design/drafts/A15/A15-候选.md promotion-check 同一条。
"""
import re
import sys
from pathlib import Path

FILES = [
    "tools/relay-light/skill/SKILL.md",
    "tools/relay-light/skill/references/adapter-claude-code.md",
    "tools/relay-light/skill/references/adapter-codex.md",
    "tools/relay-light/skill/roles.toml",
    "tools/relay-light/skill/dh-mapping.toml",
]
FROZEN = re.compile(
    r'monitor#|monitor_launch|monitor_restart|monitor_relaunch_count|relaunch_monitor'
    r'|"by": ?"monitor"|by=monitor|`\[monitor\]`|`monitor` 字段|`monitor` 为 stage-lead 的冻结账本标识'
)
# task_plan §3 白名单：每条 = (编号, 行内必须同时出现的全部锚点子串)
WHITELIST = [
    ("W1", ("账本标识", "monitor#")),
    ("W2", ("监督 / 监控 / monitor",)),
    ("W3", ("`[monitor]`", "兼容")),
    ("W4", ("原名 monitor", "更名")),
]


def agents_relay_light_lines(text: str) -> list[tuple[int, str]]:
    """AGENTS.md 中 `## relay-light 编排协议段` 起、到下一个 `## ` 二级标题前（含其 ### 子段）。"""
    out, inside = [], False
    for n, line in enumerate(text.splitlines(), 1):
        if line.startswith("## "):
            inside = line.startswith("## relay-light 编排协议段")
        if inside:
            out.append((n, line))
    return out


def main() -> int:
    bad = 0
    targets: list[tuple[str, int, str]] = []
    for rel in FILES:
        for n, line in enumerate(Path(rel).read_text(encoding="utf-8").splitlines(), 1):
            targets.append((rel, n, line))
    agents = agents_relay_light_lines(Path("AGENTS.md").read_text(encoding="utf-8"))
    if not agents:
        print("AGENTS.md relay-light 段未找到"); return 2
    targets += [("AGENTS.md", n, line) for n, line in agents]

    print("[1] 监工:")
    hits = [t for t in targets if "监工" in t[2]]
    for rel, n, line in hits:
        print(f"  {rel}:{n}: {line.strip()[:140]}")
    print(f"  count={len(hits)}"); bad += len(hits)

    print("[2] monitor residual (after frozen regex):")
    whitelisted, residual = [], []
    for rel, n, line in targets:
        if "monitor" not in FROZEN.sub("", line):
            continue
        tag = "+".join(w for w, anchors in WHITELIST if all(a in line for a in anchors)) or None
        (whitelisted if tag else residual).append((tag, rel, n, line))
    for tag, rel, n, line in whitelisted:
        print(f"  [{tag}] {rel}:{n}: {line.strip()[:140]}")
    for _, rel, n, line in residual:
        print(f"  [RESIDUAL] {rel}:{n}: {line.strip()[:140]}")
    print(f"  whitelisted={len(whitelisted)} residual={len(residual)}"); bad += len(residual)

    print("[3] roles.toml [monitor] section header:")
    heads = [l for l in Path(FILES[3]).read_text(encoding="utf-8").splitlines() if l.startswith("[monitor]")]
    print(f"  count={len(heads)}"); bad += len(heads)
    print("RESULT:", "PASS" if bad == 0 else f"FAIL ({bad})")
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
