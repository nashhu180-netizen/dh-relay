"""Batch-1 through batch-4 acceptance tests for relay-light plan and ledger contracts."""

from __future__ import annotations

import ast
import hashlib
import json
import io
import os
import re
import shutil
import stat
import sys
import subprocess
import tempfile
import tomllib
import unittest
from contextlib import redirect_stderr
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock
from urllib.parse import quote, unquote

sys.path.insert(0, str(Path(__file__).parent))
import relay_log
from relay_log import EVENTS, RelayError, SUGGESTED_ACTIONS, _assert_acyclic, _validate_event, lint_plan, main, parse_plan


NODE_HEADER = "| node | card | stage | type | close | depends_on | note |"
AGENT_HEADER = "| agent | node | role | launch | output | trigger | note |"
SEPARATOR = "|---|---|---|---|---|---|---|"
SKILL_DIR = (Path(__file__).parent / "skill").resolve()
SUBCOMMANDS = ("add", "status", "lint")


def repo_config() -> relay_log.RelayConfig:
    return relay_log.load_config(SKILL_DIR)


def home_env(home: Path) -> dict[str, str]:
    """A subprocess environment whose user home is the given directory."""
    return {**os.environ, "HOME": str(home), "USERPROFILE": str(home)}


def encoded_path(path: str | Path) -> str:
    """The §6.2.1 percent-encoding of one normalized absolute path."""
    return quote(str(path).replace(os.sep, "/"), safe="/:~-._")


class RelayCliTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.plan_path = Path(self.tempdir.name) / "relay_plan.md"

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def write_plan(
        self,
        node_rows: list[str] | None = None,
        agent_rows: list[str] | None = None,
        marker: str | None = None,
        decision_mode: str | None = None,
    ) -> Path:
        if marker is None:
            mode = f" decision_mode={decision_mode}" if decision_mode else ""
            marker = (
                "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-10 "
                f"session=app{mode} recipe=normal cards=DHR_90 -->"
            )
        if node_rows is None:
            node_rows = [
            "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
            "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            ]
        if agent_rows is None:
            agent_rows = [
            "| builder | W1 | builder | | task_plan.md | | |",
            "| coder | C1 | coder | | code.md | | |",
            ]
        self.plan_path.write_text(
            "\n".join(
                [
                    marker,
                    "",
                    "## 节点表",
                    NODE_HEADER,
                    SEPARATOR,
                    *node_rows,
                    "",
                    "## agent 表",
                    AGENT_HEADER,
                    SEPARATOR,
                    *agent_rows,
                    "",
                ]
            ),
            encoding="utf-8",
        )
        return self.plan_path

    def assert_rule(self, rule: str, **kwargs: object) -> None:
        self.write_plan(**kwargs)
        with self.assertRaises(RelayError) as raised:
            lint_plan(self.plan_path, repo_config())
        self.assertEqual(rule, raised.exception.code)

    def reset_ledger(self) -> None:
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        if ledger_path.exists():
            ledger_path.unlink()

    def write_ledger_rows(self, rows: tuple[tuple[str, str, str, str, str], ...]) -> Path:
        """Write one exact-schema JSONL ledger from (ts, node, event, agent, note) tuples."""
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        lines = [
            json.dumps(
                {
                    "seq": seq,
                    "ts": ts,
                    "node": node,
                    "event": event,
                    "agent": agent,
                    "by": "orchestrator" if agent.startswith("orchestrator#") else "monitor",
                    "note": note,
                },
                ensure_ascii=False,
                separators=(",", ":"),
            )
            for seq, (ts, node, event, agent, note) in enumerate(rows, start=1)
        ]
        ledger_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        return ledger_path

    def write_single_node_plan(
        self, agents: list[str], *, close: str = "", decision_mode: str | None = None
    ) -> None:
        self.write_plan(
            node_rows=[f"| W1 | DHR_90 | DHR_90:W#1 | build | {close} | | |"],
            agent_rows=agents,
            decision_mode=decision_mode,
        )

    def start_ledger(self) -> None:
        """Load the plan and open `DHR_90:W#1` the legal way (start, then launch)."""
        result = self.run_add("plan_loaded", agent="orchestrator#1", note="skill=0.1.0")
        self.assertEqual(0, result.returncode, result.stderr)
        for event in ("stage_start", "monitor_launch"):
            result = self.run_add(
                event, agent="orchestrator#1", note="stage_id=DHR_90:W#1"
            )
            self.assertEqual(0, result.returncode, result.stderr)

    def run_lint_cli(self, plan_dir: Path) -> subprocess.CompletedProcess[str]:
        return self.run_cli("lint", "--plan", str(plan_dir))

    def run_cli(
        self,
        *arguments: str,
        env: dict[str, str] | None = None,
        config_dir: Path | None = SKILL_DIR,
        cwd: Path | None = None,
    ) -> subprocess.CompletedProcess[str]:
        """Run relay_log.py with a controlled --config-dir unless the caller supplies one."""
        argv = list(arguments)
        if (
            config_dir is not None
            and argv[:1]
            and argv[0] in SUBCOMMANDS
            and "--config-dir" not in argv
            and "--help" not in argv
            and "-h" not in argv
        ):
            argv.extend(["--config-dir", str(config_dir)])
        return subprocess.run(
            [sys.executable, str(Path(__file__).with_name("relay_log.py")), *argv],
            text=True,
            capture_output=True,
            check=False,
            env=env,
            cwd=cwd,
        )

    def run_add(
        self,
        event: str,
        *,
        node: str = "W1",
        agent: str = "monitor#1",
        note: str = "",
    ) -> subprocess.CompletedProcess[str]:
        arguments = [
            "add",
            "--plan",
            str(self.plan_path.parent),
            "--node",
            node,
            "--event",
            event,
            "--agent",
            agent,
        ]
        if note:
            arguments.extend(["--note", note])
        return self.run_cli(*arguments)


class RelayPlanLintTests(RelayCliTestCase):
    def test_valid_plan_defaults_decision_mode_and_resolves_default_dependency(self) -> None:
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | | |",
            ]
        )
        plan = parse_plan(self.plan_path)
        lint_plan(self.plan_path, repo_config())
        self.assertEqual("auto", plan.decision_mode)
        self.assertEqual(("W1",), plan.nodes[1].depends_on)

    def test_fixed_tables_and_cells_fail_closed(self) -> None:
        self.assert_rule(
            "HC-RL-A24",
            node_rows=["| W1 | DHR_90 | DHR_90:W#1 | build | | | unsafe | pipe |"],
        )

    def test_marker_requires_only_frozen_fields_and_allows_missing_generated(self) -> None:
        fields = {
            "skill": "0.1.0",
            "session": "app",
            "recipe": "normal",
            "cards": "DHR_90",
        }
        for missing in fields:
            with self.subTest(missing=missing):
                marker_fields = fields.copy()
                del marker_fields[missing]
                marker = "<!-- relay-light:plan v1 " + " ".join(
                    f"{key}={value}" for key, value in marker_fields.items()
                ) + " -->"
                self.assert_rule("HC-RL-A18", marker=marker)

        marker = "<!-- relay-light:plan v1 " + " ".join(
            f"{key}={value}" for key, value in fields.items()
        ) + " -->"
        self.write_plan(marker=marker)
        plan = lint_plan(self.plan_path, repo_config())
        self.assertEqual("", plan.generated)

    def test_empty_cards_is_a_plan_parse_error_in_the_lint_cli(self) -> None:
        self.write_plan(
            marker=(
                "<!-- relay-light:plan v1 skill=0.1.0 session=app recipe=normal cards=, -->"
            )
        )
        result = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(3, result.returncode)
        self.assertEqual("", result.stdout)
        self.assertRegex(result.stderr, r"^error: HC-RL-A18 ")

    def test_decision_mode_accepts_frozen_values_and_rejects_others(self) -> None:
        for decision_mode in ("auto", "consult"):
            with self.subTest(decision_mode=decision_mode):
                self.write_plan(
                    marker=(
                        "<!-- relay-light:plan v1 skill=0.1.0 session=app recipe=normal "
                        f"cards=DHR_90 decision_mode={decision_mode} -->"
                    )
                )
                self.assertEqual(decision_mode, lint_plan(self.plan_path, repo_config()).decision_mode)
        self.assert_rule(
            "HC-RL-A130",
            marker=(
                "<!-- relay-light:plan v1 skill=0.1.0 session=app recipe=normal "
                "cards=DHR_90 decision_mode=manual -->"
            ),
        )

    def test_node_number_is_unique_even_when_superseded(self) -> None:
        self.assert_rule(
            "HC-RL-A46",
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | superseded-by:W2 |",
                "| W1 | DHR_90 | DHR_90:W#2 | build | | | |",
            ],
            agent_rows=["| builder | W1 | builder | | task_plan.md | | |"],
        )

    def test_close_requires_an_active_agent_of_its_node(self) -> None:
        self.assert_rule(
            "HC-RL-A47",
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | all_agents_done | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            ],
        )
        self.assert_rule(
            "HC-RL-A47",
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:coder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            ],
        )

    def test_dependencies_must_exist_and_be_acyclic(self) -> None:
        self.assert_rule(
            "HC-RL-A48",
            node_rows=["| W1 | DHR_90 | DHR_90:W#1 | build | | nowhere | |"],
            agent_rows=["| builder | W1 | builder | | task_plan.md | | |"],
        )
        self.assert_rule(
            "HC-RL-A48",
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | C1 | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
            ],
        )

    def test_dependencies_cannot_target_superseded_nodes(self) -> None:
        self.assert_rule(
            "HC-RL-A72",
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | superseded-by:W2 |",
                "| W2 | DHR_90 | DHR_90:W#2 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
            ],
            agent_rows=[
                "| builder | W2 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
            ],
        )

    def test_superseded_forms_are_exact_and_point_to_an_existing_node(self) -> None:
        self.assert_rule(
            "HC-RL-A24",
            node_rows=["| W1 | DHR_90 | DHR_90:W#1 | build | | | superseded-by: |"],
            agent_rows=["| builder | W1 | builder | | task_plan.md | | |"],
        )
        self.assert_rule(
            "HC-RL-A24",
            node_rows=["| W1 | DHR_90 | DHR_90:W#1 | build | | | superseded-by:W9 |"],
            agent_rows=["| builder | W1 | builder | | task_plan.md | | |"],
        )
        self.write_plan(
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | supersededness unclear |",
                "| coder | C1 | coder | | code.md | | |",
            ]
        )
        lint_plan(self.plan_path, repo_config())

    def test_superseded_by_cannot_target_another_superseded_node(self) -> None:
        self.assert_rule(
            "HC-RL-A24",
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | superseded-by:W2 |",
                "| W2 | DHR_90 | DHR_90:W#2 | build | | | superseded-by:W3 |",
                "| W3 | DHR_90 | DHR_90:W#3 | build | | | |",
            ],
            agent_rows=["| builder | W3 | builder | | task_plan.md | | |"],
        )

    def test_empty_ledger_pending_nodes_exclude_superseded_rows(self) -> None:
        """HC-RL-A128/A84: superseded rows are absent from empty-ledger pending_nodes."""
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | superseded-by:W2 |",
                "| W2 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | | |",
            ],
            agent_rows=[
                "| builder | W2 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
            ],
        )
        result = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(["W2", "C1"], json.loads(result.stdout)["pending_nodes"])

    def test_lint_and_default_dependencies_skip_superseded_rows(self) -> None:
        """HC-RL-A128: lint ignores superseded rows and default dependencies skip them."""
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | legacy | build | | | superseded-by:W2 |",
                "| W2 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | | |",
            ],
            agent_rows=[
                "| builder | W2 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
            ],
        )
        plan = lint_plan(self.plan_path, repo_config())
        self.assertEqual((), plan.nodes[0].depends_on)
        self.assertEqual(("W2",), plan.nodes[2].depends_on)

    def test_agent_rows_reference_existing_nodes_with_unique_names(self) -> None:
        self.assert_rule("HC-RL-A24", agent_rows=["| builder | Z9 | builder | | task_plan.md | | |"])
        self.assert_rule(
            "HC-RL-A24",
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| builder | W1 | builder | | notes.md | | |",
            ],
        )
        self.assert_rule(
            "HC-RL-A24",
            node_rows=["| W1 | DHR_90 | DHR_90:W#1 | build | agent: | | |"],
            agent_rows=["|  | W1 | coder | | code.md | | |"],
        )

    def test_deep_acyclic_dependencies_do_not_raise_recursion_error(self) -> None:
        depth = 1_500
        dependencies = {
            f"N{index}": (() if index == depth - 1 else (f"N{index + 1}",))
            for index in range(depth)
        }
        _assert_acyclic(dependencies)

    def test_each_active_node_needs_an_active_agent(self) -> None:
        self.assert_rule("HC-RL-A75", agent_rows=[])
        self.assert_rule(
            "HC-RL-A75",
            agent_rows=["| builder | W1 | builder | | task_plan.md | | superseded |"],
        )

    def test_stage_must_be_known_and_grouped_contiguously(self) -> None:
        self.assert_rule(
            "HC-RL-A129",
            node_rows=["| Z1 | DHR_90 | DHR_90:Z#1 | build | | | |"],
            agent_rows=["| builder | Z1 | builder | | task_plan.md | | |"],
        )
        self.assert_rule(
            "HC-RL-A129",
            node_rows=[
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
                "| C2 | DHR_90 | DHR_90:C#1 | construction | | R1 | |",
                "| F1 | DHR_90 | DHR_90:F#1 | handoff | | C2 | |",
            ],
            agent_rows=[
                "| coder | C1 | coder | | code.md | | |",
                "| requirement | R1 | reviewer | | review.md | | |",
                "| checker | C2 | checker | | check.md | | |",
                "| scribe | F1 | scribe | | progress.md | | |",
            ],
        )
        # HC-RL-A120: C#1 reappearing at the table tail is a legal append; the
        # fixture's remaining real violation is the C2.depends_on=R1 A89 back-edge.
        self.assert_rule(
            "HC-RL-A89",
            node_rows=[
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
                "| C2 | DHR_90 | DHR_90:C#1 | construction | | R1 | |",
            ],
            agent_rows=[
                "| coder | C1 | coder | | code.md | | |",
                "| requirement | R1 | reviewer | | review.md | | |",
                "| checker | C2 | checker | | check.md | | |",
            ],
        )

    def test_a120_allows_append_and_superseded_separation(self) -> None:
        """HC-RL-A120: same-stage tail append and superseded separation pass lint."""
        # Tail append: every other rule holds; only C#1's second run sits at the tail.
        with self.subTest(case="tail-append"):
            self.write_plan(
                node_rows=[
                    "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                    "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
                    "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
                    "| C2 | DHR_90 | DHR_90:C#1 | construction | | C1 | |",
                ],
                agent_rows=[
                    "| builder | W1 | builder | | task_plan.md | | |",
                    "| coder | C1 | coder | | code.md | | |",
                    "| scribe | R1 | scribe | | review.md | | |",
                    "| checker | C2 | checker | | check.md | | |",
                ],
            )
            result = self.run_lint_cli(self.plan_path.parent)
            self.assertEqual(0, result.returncode, result.stderr)
            self.assertEqual("lint: ok\n", result.stdout)
            plan = lint_plan(self.plan_path, repo_config())
            self.assertEqual("DHR_90:C#1", plan.nodes[3].stage_id)

        # RLT_03 handoff: same-stage reoccurrence separated only by a superseded
        # row stays legal before and after the A120 relaxation.
        with self.subTest(case="superseded-separation"):
            self.write_plan(
                node_rows=[
                    "| C1 | DHR_90 | DHR_90:C#1 | construction | | | |",
                    "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | superseded-by:R2 |",
                    "| C2 | DHR_90 | DHR_90:C#1 | construction | | | |",
                    "| R2 | DHR_90 | DHR_90:R#1 | review | | C2 | |",
                ],
                agent_rows=[
                    "| coder | C1 | coder | | code.md | | |",
                    "| checker | C2 | checker | | check.md | | |",
                    "| scribe | R2 | scribe | | review.md | | |",
                ],
            )
            result = self.run_lint_cli(self.plan_path.parent)
            self.assertEqual(0, result.returncode, result.stderr)
            self.assertEqual("lint: ok\n", result.stdout)

    def test_a120_keeps_four_hard_constraints(self) -> None:
        """HC-RL-A120: a legal tail append does not relax A46/A72/A89/A109."""
        agents = [
            "| builder | W1 | builder | | task_plan.md | | |",
            "| coder | C1 | coder | | code.md | | |",
            "| scribe | R1 | scribe | | review.md | | |",
            "| checker | C2 | checker | | check.md | | |",
        ]
        cases = [
            (
                "A46-duplicate-node-number",
                "HC-RL-A46",
                [
                    "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                    "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
                    "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
                    "| C2 | DHR_90 | DHR_90:C#1 | construction | | C1 | superseded-by:C3 |",
                    "| C3 | DHR_90 | DHR_90:C#1 | construction | | C1 | |",
                    "| C2 | DHR_90 | DHR_90:C#1 | construction | | C1 | |",
                ],
                [*agents, "| checker | C3 | checker | | check.md | | |"],
            ),
            (
                "A72-depends-on-superseded",
                "HC-RL-A72",
                [
                    "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                    "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
                    "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | superseded-by:R2 |",
                    "| R2 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
                    "| C2 | DHR_90 | DHR_90:C#1 | construction | | R1 | |",
                ],
                [
                    "| builder | W1 | builder | | task_plan.md | | |",
                    "| coder | C1 | coder | | code.md | | |",
                    "| scribe | R2 | scribe | | review.md | | |",
                    "| checker | C2 | checker | | check.md | | |",
                ],
            ),
            (
                "A89-dependency-on-later-stage",
                "HC-RL-A89",
                [
                    "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                    "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
                    "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
                    "| C2 | DHR_90 | DHR_90:C#1 | construction | | R1 | |",
                ],
                agents,
            ),
            (
                "A109-same-card-parallel",
                "HC-RL-A109",
                [
                    "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                    "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
                    "| R1 | DHR_90 | DHR_90:R#1 | review | | W1 | |",
                    "| C2 | DHR_90 | DHR_90:C#1 | construction | | C1 | |",
                ],
                agents,
            ),
        ]
        for name, rule, node_rows, agent_rows in cases:
            with self.subTest(case=name):
                self.write_plan(node_rows=node_rows, agent_rows=agent_rows)
                result = self.run_lint_cli(self.plan_path.parent)
                self.assertEqual(2, result.returncode)
                self.assertEqual("", result.stdout)
                self.assertRegex(result.stderr, rf"^lint: {rule} ")

    def test_stage_id_card_and_instance_are_structural(self) -> None:
        self.assert_rule(
            "HC-RL-A104",
            node_rows=["| W1 | DHR_90 | DHR_91:W#1 | build | | | |"],
        )
        self.assert_rule(
            "HC-RL-A104",
            node_rows=["| W1 | DHR_90 | DHR_90:W#0 | build | | | |"],
        )
        self.write_plan()
        plan = lint_plan(self.plan_path, repo_config())
        self.assertEqual(("DHR_90", "W", 1), (plan.nodes[0].card, plan.nodes[0].stage, plan.nodes[0].k))

    def test_same_card_stages_are_serial_but_cards_can_be_parallel(self) -> None:
        self.assert_rule(
            "HC-RL-A109",
            node_rows=[
                "| W2 | DHR_91 | DHR_91:W#1 | build | | | |",
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W2 | |",
            ],
            agent_rows=[
                "| builder-a | W1 | builder | | task_plan.md | | |",
                "| builder-b | W2 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
            ],
            marker=(
                "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-10 "
                "session=app recipe=normal cards=DHR_90,DHR_91 -->"
            ),
        )
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| W2 | DHR_91 | DHR_91:W#1 | build | | W1 | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
                "| C2 | DHR_91 | DHR_91:C#1 | construction | | W2 | |",
            ],
            agent_rows=[
                "| builder-a | W1 | builder | | task_plan.md | | |",
                "| builder-b | W2 | builder | | task_plan.md | | |",
                "| coder-a | C1 | coder | | code.md | | |",
                "| coder-b | C2 | coder | | code.md | | |",
            ],
            marker=(
                "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-10 "
                "session=app recipe=normal cards=DHR_90,DHR_91 -->"
            ),
        )
        plan = lint_plan(self.plan_path, repo_config())
        dependencies = {node.node: node.depends_on for node in plan.nodes}
        self.assertEqual(("W1",), dependencies["C1"])
        self.assertEqual(("W2",), dependencies["C2"])
        self.assertNotIn("C1", dependencies["C2"])
        self.assertNotIn("C2", dependencies["C1"])
        self.assertEqual(2, len(plan.cards))

    def test_card_and_node_type_are_limited(self) -> None:
        self.assert_rule(
            "HC-RL-A87",
            node_rows=["| W1 | DHR_91 | DHR_91:W#1 | build | | | |"],
            agent_rows=["| builder | W1 | builder | | task_plan.md | | |"],
        )
        self.assert_rule(
            "HC-RL-A126",
            node_rows=["| W1 | DHR_90 | DHR_90:W#1 | kickoff | | | |"],
        )
        self.assert_rule(
            "HC-RL-A126",
            node_rows=["| W1 | DHR_90 | DHR_90:W#1 | verify-signoff | | | |"],
        )

    def test_forbidden_types_are_the_sole_violation_in_legal_plans(self) -> None:
        """HC-RL-A126: the forbidden type is the only violation in these fixtures."""
        for forbidden_type in ("kickoff", "verify-signoff"):
            with self.subTest(forbidden_type=forbidden_type):
                self.write_plan(
                    node_rows=[
                        f"| W1 | DHR_90 | DHR_90:W#1 | {forbidden_type} | agent:builder | | |",
                        "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
                    ],
                    agent_rows=[
                        "| builder | W1 | builder | | task_plan.md | | |",
                        "| coder | C1 | coder | | code.md | | |",
                    ],
                )
                with self.assertRaises(RelayError) as raised:
                    lint_plan(self.plan_path, repo_config())
                self.assertEqual("HC-RL-A126", raised.exception.code)

    def test_trigger_values_and_same_node_done_references_are_checked(self) -> None:
        self.assert_rule(
            "HC-RL-A35",
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| checker | C1 | checker | | check.md | on:later:builder | |",
            ],
        )
        self.assert_rule(
            "HC-RL-A35",
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| checker | C1 | checker | | check.md | on:done:nobody | |",
            ],
        )
        self.assert_rule(
            "HC-RL-A71",
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| checker | C1 | checker | | check.md | on:done:builder | |",
            ],
        )
        # HC-RL-A150: trigger is a four-state enum — one legal value of each passes.
        self.write_plan(
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| checker | C1 | checker | | check.md | on:review_ready:coder | |",
                "| scribe | C1 | scribe | | notes.md | on:done:coder | |",
                "| decider | C1 | decider | | decision.md | on:blocked | |",
            ],
        )
        lint_plan(self.plan_path, repo_config())
        for bad_trigger in (
            "on:review_ready:nobody",
            "on:review-ready:coder",
            "on:review_ready:",
        ):
            with self.subTest(trigger=bad_trigger):
                self.assert_rule(
                    "HC-RL-A35",
                    agent_rows=[
                        "| builder | W1 | builder | | task_plan.md | | |",
                        "| coder | C1 | coder | | code.md | | |",
                        f"| checker | C1 | checker | | check.md | {bad_trigger} | |",
                    ],
                )
        self.assert_rule(
            "HC-RL-A71",
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| checker | C1 | checker | | check.md | on:review_ready:builder | |",
            ],
        )
        # R form: the reviewer names a coder that only exists in another node —
        # A71 rejects mechanically since no same-node sender can exist.
        self.assert_rule(
            "HC-RL-A71",
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| requirement | R1 | reviewer | | review.requirement.md | on:review_ready:coder | |",
                "| lesson | R1 | reviewer | | review.lesson.md | | |",
            ],
        )

    def test_a150_lint_mapping_table_binds_review_ready_rows(self) -> None:
        """A150: the §3.5 lint-rule mapping table binds both `on:review_ready:` rows."""
        design_path = (
            Path(__file__).resolve().parents[2]
            / "docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md"
        )
        section = design_path.read_text(encoding="utf-8").split("### 3.5", 1)[1].split("### 3.6", 1)[0]
        bound: dict[str, str] = {}
        for line in section.splitlines():
            if not line.startswith("|") or "on:review_ready:" not in line:
                continue
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            bound[cells[-1]] = cells[0]
        self.assertIn("HC-RL-A35", bound)
        self.assertIn("HC-RL-A71", bound)
        self.assertIn("引用不存在", bound["HC-RL-A35"])
        self.assertIn("跨节点", bound["HC-RL-A71"])

    def test_lint_cli_smoke_uses_success_and_plan_error_contracts(self) -> None:
        self.write_plan()
        valid = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, valid.returncode)
        self.assertEqual("lint: ok\n", valid.stdout)
        self.assertEqual("", valid.stderr)

        missing = self.run_lint_cli(self.plan_path.parent / "missing")
        self.assertEqual(3, missing.returncode)
        self.assertEqual("", missing.stdout)
        self.assertRegex(missing.stderr, r"^error: HC-RL-A18 ")

        self.plan_path.write_text("not a relay plan\n", encoding="utf-8")
        malformed = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(3, malformed.returncode)
        self.assertEqual("", malformed.stdout)
        self.assertRegex(malformed.stderr, r"^error: HC-RL-A18 ")

    def test_lint_cli_exit_stderr_and_json_contract(self) -> None:
        """HC-RL-A80: lint signature, exit codes 0/2/3, stderr shape, --json document."""
        # Acceptance-ID whitelist frozen from the §11 first column (design/01).
        acceptance_ids = frozenset(
            """
            HC-RL-A2 HC-RL-A5 HC-RL-A11 HC-RL-A12 HC-RL-A13 HC-RL-A14 HC-RL-A15
            HC-RL-A16 HC-RL-A17 HC-RL-A18 HC-RL-A19 HC-RL-A21 HC-RL-A24 HC-RL-A26
            HC-RL-A27 HC-RL-A28 HC-RL-A29 HC-RL-A30 HC-RL-A31 HC-RL-A32 HC-RL-A33
            HC-RL-A34 HC-RL-A35 HC-RL-A37 HC-RL-A38 HC-RL-A39 HC-RL-A40 HC-RL-A41
            HC-RL-A42 HC-RL-A43 HC-RL-A44 HC-RL-A45 HC-RL-A46 HC-RL-A47 HC-RL-A48
            HC-RL-A49 HC-RL-A50 HC-RL-A51 HC-RL-A55 HC-RL-A56 HC-RL-A58 HC-RL-A59
            HC-RL-A60 HC-RL-A61 HC-RL-A62 HC-RL-A63 HC-RL-A65 HC-RL-A66 HC-RL-A67
            HC-RL-A68 HC-RL-A69 HC-RL-A70 HC-RL-A71 HC-RL-A72 HC-RL-A73 HC-RL-A74
            HC-RL-A75 HC-RL-A77 HC-RL-A78 HC-RL-A80 HC-RL-A81 HC-RL-A82 HC-RL-A83
            HC-RL-A84 HC-RL-A85 HC-RL-A87 HC-RL-A89 HC-RL-A92 HC-RL-A93 HC-RL-A94
            HC-RL-A95 HC-RL-A96 HC-RL-A97 HC-RL-A98 HC-RL-A99 HC-RL-A100
            HC-RL-A101 HC-RL-A102 HC-RL-A103 HC-RL-A104 HC-RL-A105 HC-RL-A106
            HC-RL-A107 HC-RL-A109 HC-RL-A110 HC-RL-A111 HC-RL-A112 HC-RL-A113
            HC-RL-A114 HC-RL-A115 HC-RL-A116 HC-RL-A117 HC-RL-A118 HC-RL-A119
            HC-RL-A120 HC-RL-A121 HC-RL-A122 HC-RL-A123 HC-RL-A124 HC-RL-A125
            HC-RL-A126 HC-RL-A127 HC-RL-A128 HC-RL-A129 HC-RL-A130 HC-RL-A131
            HC-RL-A132 HC-RL-A133 HC-RL-A134 HC-RL-A135 HC-RL-A136
            """.split()
        )
        lint_line = re.compile(r"^lint: (HC-RL-A[0-9]+) .+$")
        # Second W1 row sits at file line 7 and is the sole violation (A46).
        violation_rows = [
            "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
            "| W1 | DHR_90 | DHR_90:W#2 | build | | | |",
            "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
        ]

        with self.subTest(branch="valid plan exits 0"):
            self.write_plan()
            result = self.run_lint_cli(self.plan_path.parent)
            self.assertEqual(0, result.returncode)
            self.assertEqual("lint: ok\n", result.stdout)
            self.assertEqual("", result.stderr)

        with self.subTest(branch="semantic violation exits 2"):
            self.write_plan(node_rows=violation_rows)
            result = self.run_lint_cli(self.plan_path.parent)
            self.assertEqual(2, result.returncode)
            self.assertEqual("", result.stdout)
            lines = [line for line in result.stderr.splitlines() if line.strip()]
            self.assertTrue(lines)
            for line in lines:
                match = lint_line.fullmatch(line)
                self.assertIsNotNone(match, f"stderr line escapes contract: {line}")
                self.assertIn(match.group(1), acceptance_ids)

        with self.subTest(branch="parse or config failure exits 3"):
            missing = self.run_lint_cli(self.plan_path.parent / "missing")
            self.assertEqual(3, missing.returncode)
            self.assertEqual("", missing.stdout)
            self.assertRegex(missing.stderr, r"^error: HC-RL-A18 ")
            self.assertNotIn("lint:", missing.stderr)
            self.plan_path.write_text("not a relay plan\n", encoding="utf-8")
            malformed = self.run_lint_cli(self.plan_path.parent)
            self.assertEqual(3, malformed.returncode)
            self.assertEqual("", malformed.stdout)
            self.assertRegex(malformed.stderr, r"^error: HC-RL-A18 ")
            self.assertNotIn("lint:", malformed.stderr)
            bad_config = self.run_cli(
                "lint",
                "--plan",
                str(self.plan_path.parent),
                "--config-dir",
                str(self.plan_path.parent / "missing-config"),
            )
            self.assertEqual(3, bad_config.returncode)
            self.assertEqual("", bad_config.stdout)
            self.assertRegex(bad_config.stderr, r"^error: HC-RL-A135 ")
            self.assertNotIn("lint:", bad_config.stderr)

        with self.subTest(branch="--json parse failure keeps error contract"):
            missing = self.run_cli(
                "lint",
                "--plan",
                str(self.plan_path.parent / "missing"),
                "--json",
            )
            self.assertEqual(3, missing.returncode)
            self.assertEqual("", missing.stdout)
            self.assertRegex(missing.stderr, r"^error: HC-RL-A18 ")
            self.assertNotIn("lint:", missing.stderr)

        with self.subTest(branch="--json valid plan"):
            self.write_plan()
            result = self.run_cli(
                "lint", "--plan", str(self.plan_path.parent), "--json"
            )
            self.assertEqual(0, result.returncode)
            self.assertEqual("", result.stderr)
            document = json.loads(result.stdout)
            self.assertEqual({"ok", "violations"}, set(document))
            self.assertIs(document["ok"], True)
            self.assertEqual([], document["violations"])

        with self.subTest(branch="--json semantic violation"):
            self.write_plan(node_rows=violation_rows)
            result = self.run_cli(
                "lint", "--plan", str(self.plan_path.parent), "--json"
            )
            self.assertEqual(2, result.returncode)
            self.assertEqual("", result.stderr)
            document = json.loads(result.stdout)
            self.assertEqual({"ok", "violations"}, set(document))
            self.assertIs(document["ok"], False)
            self.assertTrue(document["violations"])
            for violation in document["violations"]:
                self.assertEqual({"rule", "message", "line"}, set(violation))
                self.assertIsInstance(violation["rule"], str)
                self.assertIn(violation["rule"], acceptance_ids)
                self.assertIsInstance(violation["message"], str)
                self.assertTrue(violation["message"])
                self.assertIsInstance(violation["line"], int)
                self.assertFalse(isinstance(violation["line"], bool))
            self.assertEqual("HC-RL-A46", document["violations"][0]["rule"])
            self.assertEqual(7, document["violations"][0]["line"])

        with self.subTest(branch="--json violation without a line keeps null"):
            self.write_plan(
                marker=(
                    "<!-- relay-light:plan v1 skill=0.1.0 session=app recipe=normal "
                    "cards=DHR_90 decision_mode=manual -->"
                )
            )
            result = self.run_cli(
                "lint", "--plan", str(self.plan_path.parent), "--json"
            )
            self.assertEqual(2, result.returncode)
            self.assertEqual("", result.stderr)
            document = json.loads(result.stdout)
            self.assertEqual({"ok", "violations"}, set(document))
            self.assertIs(document["ok"], False)
            self.assertTrue(document["violations"])
            for violation in document["violations"]:
                self.assertEqual({"rule", "message", "line"}, set(violation))
                self.assertIn(violation["rule"], acceptance_ids)
            self.assertEqual("HC-RL-A130", document["violations"][0]["rule"])
            self.assertIsNone(document["violations"][0]["line"])

    def test_relay_log_imports_are_stdlib_only(self) -> None:
        """HC-RL-A16: every top-level import in relay_log.py is stdlib."""
        source_path = Path(__file__).with_name("relay_log.py")
        tree = ast.parse(
            source_path.read_text(encoding="utf-8"), filename=str(source_path)
        )
        modules: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                modules.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                modules.add(node.module.split(".")[0])
        self.assertTrue(modules, "no imports collected; source path or parse is wrong")
        modules.discard("__future__")
        foreign = sorted(modules - sys.stdlib_module_names)
        self.assertFalse(
            foreign, f"non-stdlib top-level imports in relay_log.py: {foreign}"
        )

    def test_help_lists_exactly_the_three_frozen_subcommands(self) -> None:
        result = self.run_cli("--help")
        self.assertEqual(0, result.returncode)
        self.assertRegex(result.stdout, r"\{add,status,lint\}")

    def test_add_is_append_only_with_twenty_fixed_schema_events(self) -> None:
        self.write_plan()
        event_words = ["plan_loaded", "stage_start", "monitor_launch", *(["monitor_restart"] * 17)]
        before_entries = set(self.plan_path.parent.iterdir())
        prefix = b""
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        for sequence, event in enumerate(event_words, start=1):
            agent = "orchestrator#1" if event != "monitor_restart" else "monitor#1"
            note = {
                "plan_loaded": "skill=0.1.0",
                "stage_start": "stage_id=DHR_90:W#1",
                "monitor_launch": "stage_id=DHR_90:W#1",
            }.get(event, "")
            result = self.run_add(event, agent=agent, note=note)
            self.assertEqual(0, result.returncode, result.stderr)
            self.assertEqual("", result.stdout)
            ledger_bytes = ledger_path.read_bytes()
            self.assertTrue(ledger_bytes.startswith(prefix))
            prefix = ledger_bytes
            rows = [json.loads(line) for line in ledger_bytes.splitlines()]
            self.assertEqual(sequence, rows[-1]["seq"])
            self.assertEqual({"seq", "ts", "node", "event", "agent", "by", "note"}, set(rows[-1]))
            self.assertEqual("orchestrator" if agent.startswith("orchestrator#") else "monitor", rows[-1]["by"])
        self.assertEqual(list(range(1, 21)), [row["seq"] for row in rows])
        for row in rows:
            self.assertNotIn("pane", json.dumps(row, ensure_ascii=False))
        self.assertEqual(before_entries | {ledger_path}, set(self.plan_path.parent.iterdir()))

    def test_unicode_line_separators_round_trip_as_json_string_content(self) -> None:
        """HC-RL-A38/A56: a successful add must remain one readable JSONL row."""
        for separator in ("\u0085", "\u2028", "\u2029"):
            with self.subTest(separator=f"U+{ord(separator):04X}"):
                self.reset_ledger()
                self.write_plan()
                self.start_ledger()
                add = self.run_add("monitor_restart", note=f"before{separator}after")
                self.assertEqual(0, add.returncode, add.stderr)
                status = self.run_cli("status", "--plan", str(self.plan_path.parent))
                self.assertEqual(0, status.returncode, status.stderr)
                ledger_path = self.plan_path.parent / "relay_log.jsonl"
                rows = [json.loads(line) for line in ledger_path.read_text(encoding="utf-8").split("\n") if line]
                self.assertEqual(4, len(rows))
                self.assertEqual(f"before{separator}after", rows[-1]["note"])

    def test_all_nineteen_event_words_pass_lexical_validation(self) -> None:
        self.assertEqual(19, len(EVENTS))
        for event in EVENTS:
            with self.subTest(event=event):
                _validate_event(event, "monitor#1")

    def test_add_rejects_unknown_and_case_changed_events_without_writing(self) -> None:
        self.write_plan()
        for event in ("unknown", "NODE_START"):
            with self.subTest(event=event):
                result = self.run_add(event)
                self.assertEqual(2, result.returncode)
                self.assertEqual("", result.stdout)
                self.assertRegex(result.stderr, r"^error: HC-RL-A2 ")
                self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())
        invalid_agent = self.run_add("plan_loaded", agent="monitor")
        self.assertEqual(2, invalid_agent.returncode)
        self.assertEqual("", invalid_agent.stdout)
        self.assertRegex(invalid_agent.stderr, r"^error: HC-RL-A55 ")
        self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())

    def test_by_is_derived_from_agent_prefix_under_the_frozen_writer_contract(self) -> None:
        """HC-RL-A85: `by` mirrors the agent prefix, and only the owner may write the event."""
        self.write_plan()
        self.assertEqual(
            0, self.run_add("plan_loaded", agent="orchestrator#1", note="skill=0.1.0").returncode
        )
        self.assertEqual(
            0, self.run_add("stage_start", agent="orchestrator#1", note="stage_id=DHR_90:W#1").returncode
        )
        self.assertEqual(
            0, self.run_add("monitor_launch", agent="orchestrator#2", note="stage_id=DHR_90:W#1").returncode
        )
        self.assertEqual(0, self.run_add("node_start", agent="monitor#7").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="monitor#1").returncode)
        rows = [
            json.loads(line)
            for line in (self.plan_path.parent / "relay_log.jsonl").read_text(encoding="utf-8").splitlines()
        ]
        self.assertEqual(
            ["orchestrator", "orchestrator", "orchestrator", "monitor", "monitor"],
            [row["by"] for row in rows],
        )

    def test_empty_and_bad_ledger_follow_status_and_add_exit_contracts(self) -> None:
        self.write_plan()
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        empty = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(0, empty.returncode)
        self.assertEqual("", empty.stderr)
        empty_status = json.loads(empty.stdout)
        self.assertIsNone(empty_status["current_stage"])
        self.assertIsNone(empty_status["current_node"])
        self.assertEqual(["W1", "C1"], empty_status["pending_nodes"])

        first_event = self.run_add("node_start")
        self.assertEqual(2, first_event.returncode)
        self.assertFalse(ledger_path.exists())

        ledger_path.write_text("not-json\n", encoding="utf-8")
        bad = self.run_cli("status", "--plan", str(self.plan_path.parent))
        self.assertEqual(4, bad.returncode)
        self.assertEqual("", bad.stdout)
        self.assertRegex(bad.stderr, r"^error: ledger ")

        missing_plan = self.run_cli(
            "add", "--plan", str(self.plan_path.parent / "missing"), "--node", "W1",
            "--event", "plan_loaded", "--agent", "orchestrator#1",
        )
        self.assertEqual(3, missing_plan.returncode)
        self.assertRegex(missing_plan.stderr, r"^error: HC-RL-A18 ")
        missing_status = self.run_cli("status", "--plan", str(self.plan_path.parent / "missing"))
        self.assertEqual(3, missing_status.returncode)
        self.assertEqual("", missing_status.stdout)
        self.assertRegex(missing_status.stderr, r"^error: HC-RL-A18 ")

    def test_add_reports_ledger_read_failure_as_exit_four(self) -> None:
        self.write_plan()
        (self.plan_path.parent / "relay_log.jsonl").mkdir()
        result = self.run_add("plan_loaded", agent="orchestrator#1", note="skill=0.1.0")
        self.assertEqual(4, result.returncode)
        self.assertEqual("", result.stdout)
        self.assertRegex(result.stderr, r"^error: ledger ")

    def test_add_reports_genuine_append_failure_as_exit_four(self) -> None:
        self.write_plan()
        stderr = io.StringIO()
        with redirect_stderr(stderr), mock.patch("builtins.open", side_effect=OSError("injected write failure")):
            result = main(
                [
                    "add", "--plan", str(self.plan_path.parent), "--node", "W1",
                    "--event", "plan_loaded", "--agent", "orchestrator#1", "--note", "skill=0.1.0",
                    "--config-dir", str(SKILL_DIR),
                ]
            )
        self.assertEqual(4, result)
        self.assertRegex(stderr.getvalue(), r"^error: ledger ")
        self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())

    def test_non_newline_terminated_ledger_is_rejected_without_append(self) -> None:
        self.write_plan()
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        for trailing_bytes in (b"", b" "):
            with self.subTest(trailing_bytes=trailing_bytes):
                self.reset_ledger()
                self.assertEqual(
                    0,
                    self.run_add(
                        "plan_loaded", agent="orchestrator#1", note="skill=0.1.0"
                    ).returncode,
                )
                unterminated = ledger_path.read_bytes().rstrip(b"\n") + trailing_bytes
                ledger_path.write_bytes(unterminated)

                status = self.run_cli("status", "--plan", str(self.plan_path.parent))
                self.assertEqual(4, status.returncode)
                self.assertEqual("", status.stdout)
                self.assertRegex(status.stderr, r"^error: ledger ")

                add = self.run_add("checkpoint")
                self.assertEqual(4, add.returncode)
                self.assertEqual("", add.stdout)
                self.assertEqual(unterminated, ledger_path.read_bytes())

    def test_unreadable_ledger_status_exits_four(self) -> None:
        """HC-RL-A45: status over an unreadable ledger exits 4 with a ledger error."""
        self.write_plan()
        (self.plan_path.parent / "relay_log.jsonl").mkdir()
        result = self.run_cli("status", "--plan", str(self.plan_path.parent))
        self.assertEqual(4, result.returncode)
        self.assertEqual("", result.stdout)
        self.assertRegex(result.stderr, r"^error: ledger ")

    def test_status_and_lint_match_with_and_without_superseded_rows(self) -> None:
        """HC-RL-A128/A73: superseded rows leave lint untouched and status observables equal,
        except `superseded_ignored`, which A73 freezes as the only allowed difference."""
        self.write_plan()
        plain_lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, plain_lint.returncode, plain_lint.stderr)
        plain_status = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(0, plain_status.returncode, plain_status.stderr)
        plain_payload = json.loads(plain_status.stdout)

        # The superseded variant is the plain plan plus one superseded node row: the
        # `close`/`depends_on` cells stay identical so only `superseded_ignored` may differ.
        self.write_plan(
            node_rows=[
                "| W0 | DHR_90 | DHR_90:W#1 | build | | | superseded-by:W1 |",
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
            ],
        )
        superseded_lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, superseded_lint.returncode, superseded_lint.stderr)
        superseded_status = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(0, superseded_status.returncode, superseded_status.stderr)
        superseded_payload = json.loads(superseded_status.stdout)
        self.assertEqual(0, plain_payload.pop("superseded_ignored"))
        self.assertEqual(1, superseded_payload.pop("superseded_ignored"))
        self.assertEqual(plain_payload, superseded_payload)

    def test_missing_and_zero_byte_ledgers_match_for_status_and_lint(self) -> None:
        """HC-RL-A84: a zero-byte ledger behaves exactly like an absent ledger."""
        self.write_plan()
        missing_status = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(0, missing_status.returncode, missing_status.stderr)
        missing_payload = json.loads(missing_status.stdout)
        missing_lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, missing_lint.returncode, missing_lint.stderr)
        self.assertEqual("lint: ok\n", missing_lint.stdout)

        (self.plan_path.parent / "relay_log.jsonl").write_text("", encoding="utf-8")
        zero_status = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(0, zero_status.returncode, zero_status.stderr)
        self.assertEqual(missing_payload, json.loads(zero_status.stdout))
        zero_lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, zero_lint.returncode, zero_lint.stderr)
        self.assertEqual("lint: ok\n", zero_lint.stdout)

    def test_runtime_plan_semantic_errors_map_to_exit_three_while_lint_is_two(self) -> None:
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| W1 | DHR_90 | DHR_90:W#2 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
            ]
        )
        lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(2, lint.returncode)
        self.assertRegex(lint.stderr, r"^lint: HC-RL-A46 ")

        for command in (
            ("status", "--plan", str(self.plan_path.parent)),
            (
                "add", "--plan", str(self.plan_path.parent), "--node", "W1",
                "--event", "plan_loaded", "--agent", "orchestrator#1",
            ),
        ):
            with self.subTest(command=command[0]):
                result = self.run_cli(*command)
                self.assertEqual(3, result.returncode)
                self.assertEqual("", result.stdout)
                self.assertRegex(result.stderr, r"^error: HC-RL-A46 ")

    def test_ledger_read_rejects_extra_keys_and_noncontinuous_seq(self) -> None:
        self.write_plan()
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        row = {
            "seq": 1,
            "ts": "2026-09-10T00:00:00+00:00",
            "node": "W1",
            "event": "plan_loaded",
            "agent": "orchestrator#1",
            "by": "orchestrator",
            "note": "",
        }
        invalid_rows = {
            "extra-key": {**row, "pane": "w15:p4"},
            "noncontinuous-seq": {**row, "seq": 2},
        }
        for name, invalid_row in invalid_rows.items():
            with self.subTest(name=name):
                ledger_path.write_text(json.dumps(invalid_row) + "\n", encoding="utf-8")
                result = self.run_cli("status", "--plan", str(self.plan_path.parent))
                self.assertEqual(4, result.returncode)
                self.assertEqual("", result.stdout)
                before_index = ledger_path.read_bytes()
                self.assertRegex(result.stderr, r"^error: ledger ")
                self.assertEqual(before_index, ledger_path.read_bytes())

    def test_static_forbidden_primitive_and_pane_guards(self) -> None:
        source = Path(__file__).with_name("relay_log.py").read_text(encoding="utf-8")
        forbidden = (
            ".lower(", ".casefold(", "fcntl", "msvcrt", "filelock", "flock", "lockf",
            "tempfile", "mkstemp", "os.replace", "os.rename", "shutil.move", ".write_text",
        )
        for primitive in forbidden:
            with self.subTest(primitive=primitive):
                self.assertNotIn(primitive, source)
        self.assertNotIn('"pane"', source)

    def test_agent_launch_requires_node_start_and_terminal_agents_are_sealed(self) -> None:
        self.write_single_node_plan(["| coder | W1 | coder | | code.md | | |"])
        self.start_ledger()
        before_start = self.run_add("agent_launch", agent="coder#1")
        self.assertEqual(2, before_start.returncode)
        self.assertRegex(before_start.stderr, r"^error: HC-RL-A78 ")

        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("checkpoint", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="coder#1").returncode)
        sealed = self.run_add("checkpoint", agent="coder#1")
        self.assertEqual(2, sealed.returncode)
        self.assertRegex(sealed.stderr, r"^error: HC-RL-A60 ")

    def test_attempts_are_per_node_and_only_relaunch_after_authorized_causes(self) -> None:
        coder = "| coder | W1 | coder | | code.md | | |"
        self.write_single_node_plan([coder])
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(2, self.run_add("agent_launch", agent="coder#2").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        before_ineligible_relaunch = ledger_path.read_bytes()
        ineligible_relaunch = self.run_add("agent_launch", agent="coder#2")
        self.assertEqual(2, ineligible_relaunch.returncode)
        self.assertRegex(ineligible_relaunch.stderr, r"^error: HC-RL-A49 ")
        self.assertEqual(before_ineligible_relaunch, ledger_path.read_bytes())
        self.assertEqual(2, self.run_add("agent_launch", agent="coder#1").returncode)
        self.assertEqual(2, self.run_add("agent_launch", agent="coder#3").returncode)
        self.assertEqual(0, self.run_add("agent_lost", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#2").returncode)
        self.assertEqual(0, self.run_add("cancelled", agent="coder#2").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#3").returncode)

        self.reset_ledger()
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        # A112: a stage failure is only recordable after the instance's last node_close;
        # A137: the failed result must ref the instance whose newest event is agent_lost.
        self.assertEqual(0, self.run_add("agent_lost", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("node_close", agent="monitor#1").returncode)
        self.assertEqual(
            0,
            self.run_add("stage_result", agent="monitor#1", note="stage_id=DHR_90:W#1 outcome=failed ref=coder#1:agent_lost").returncode,
        )
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#2").returncode)
        self.assertEqual(
            0,
            self.run_add("stage_result", agent="monitor#1", note="stage_id=DHR_90:W#1 outcome=failed ref=coder#1:agent_lost").returncode,
        )
        before_duplicate_attempt = ledger_path.read_bytes()
        duplicate_attempt = self.run_add("agent_launch", agent="coder#2")
        self.assertEqual(2, duplicate_attempt.returncode)
        self.assertRegex(duplicate_attempt.stderr, r"^error: HC-RL-A58 ")
        self.assertEqual(before_duplicate_attempt, ledger_path.read_bytes())

    def test_relaunch_attempt_increment_is_exact_after_terminal_causes(self) -> None:
        for terminal_event in ("agent_lost", "cancelled"):
            with self.subTest(terminal_event=terminal_event):
                self.reset_ledger()
                self.write_single_node_plan(["| coder | W1 | coder | | code.md | | |"])
                self.start_ledger()
                self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
                self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
                self.assertEqual(0, self.run_add(terminal_event, agent="coder#1").returncode)
                for invalid_attempt in ("coder#1", "coder#3"):
                    result = self.run_add("agent_launch", agent=invalid_attempt)
                    self.assertEqual(2, result.returncode)
                    self.assertRegex(result.stderr, r"^error: HC-RL-A58 ")
                self.assertEqual(0, self.run_add("agent_launch", agent="coder#2").returncode)
                self.reset_ledger()

    def test_attempts_are_keyed_by_node_and_agent_name(self) -> None:
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
            ],
            agent_rows=[
                "| coder | W1 | coder | | code.md | | |",
                "| coder | C1 | coder | | code.md | | |",
            ],
        )
        self.start_ledger()
        for event, node, agent in (
            ("node_start", "W1", "monitor#1"),
            ("agent_launch", "W1", "coder#1"),
            ("done", "W1", "coder#1"),
            ("node_close", "W1", "monitor#1"),
        ):
            with self.subTest(event=event, node=node, agent=agent):
                self.assertEqual(0, self.run_add(event, node=node, agent=agent).returncode)
        self.assertEqual(
            0,
            self.run_add(
                "stage_start", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1"
            ).returncode,
        )
        for event, node, agent in (
            ("node_start", "C1", "monitor#1"),
            ("agent_launch", "C1", "coder#1"),
        ):
            with self.subTest(event=event, node=node, agent=agent):
                self.assertEqual(0, self.run_add(event, node=node, agent=agent).returncode)

    def test_agent_state_transition_table_rejects_invalid_next_events(self) -> None:
        cases = (
            ("decision needs escalate", ["agent_launch"], "decision"),
            ("resume needs decision", ["agent_launch"], "resume"),
            ("checkpoint is sealed after done", ["agent_launch", "done"], "checkpoint"),
        )
        for name, prefix, attempted in cases:
            with self.subTest(name=name):
                self.write_single_node_plan(["| coder | W1 | coder | | code.md | | |"])
                self.start_ledger()
                self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
                for event in prefix:
                    self.assertEqual(0, self.run_add(event, agent="coder#1").returncode)
                result = self.run_add(attempted, agent="coder#1")
                self.assertEqual(2, result.returncode)
                self.assertRegex(result.stderr, r"^error: HC-RL-A60 ")
                self.reset_ledger()

    def test_decision_and_user_decision_must_resume_before_original_agent_done(self) -> None:
        cases = (
            ("decision", ["agent_launch", "blocked", "escalate", "decision"], "auto"),
            (
                "user_decision",
                ["agent_launch", "blocked", "escalate", "decision", "user_decision"],
                "consult",
            ),
        )
        for name, prefix, mode in cases:
            with self.subTest(name=name):
                self.reset_ledger()
                self.write_single_node_plan(
                    ["| coder | W1 | coder | | code.md | | |"], decision_mode=mode
                )
                self.start_ledger()
                self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
                helper_note = "decider=decider#1"
                for event in prefix:
                    note = helper_note if event in {"escalate", "decision"} else ""
                    if event == "user_decision":
                        note = "approve-amend: 用户同意 decision.md"
                    self.assertEqual(0, self.run_add(event, agent="coder#1", note=note).returncode)
                skipped_resume = self.run_add("done", agent="coder#1")
                self.assertEqual(2, skipped_resume.returncode)
                self.assertRegex(skipped_resume.stderr, r"^error: HC-RL-A60 ")
                self.assertEqual(0, self.run_add("resume", agent="coder#1").returncode)
                self.assertEqual(0, self.run_add("done", agent="coder#1").returncode)
                self.reset_ledger()

    def test_agent_authorization_has_four_exempt_prefixes_and_active_nodes(self) -> None:
        self.write_single_node_plan(["| coder | W1 | coder | | code.md | | |"])
        self.start_ledger()
        control_with_regular_agent = self.run_add("node_start", agent="coder#1")
        self.assertEqual(2, control_with_regular_agent.returncode)
        self.assertRegex(control_with_regular_agent.stderr, r"^error: HC-RL-A69 ")
        # A85: agent events belong to the monitor, so the on-demand names are exercised
        # there; the orchestrator exemption shows on its own control events (start_ledger
        # already wrote the plan_loaded/stage_start/monitor_launch opening).
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        for agent in ("monitor#1", "planner-amend#1", "strategist#1"):
            with self.subTest(agent=agent):
                self.assertEqual(0, self.run_add("agent_launch", agent=agent).returncode)
        malformed_writer = self.run_add("agent_launch", agent="orchestrator#1")
        self.assertEqual(2, malformed_writer.returncode)
        self.assertRegex(malformed_writer.stderr, r"^error: HC-RL-A85 ")
        unknown = self.run_add("agent_launch", agent="outsider#1")
        self.assertEqual(2, unknown.returncode)
        self.assertRegex(unknown.stderr, r"^error: HC-RL-A59 ")
        missing_node = self.run_add("monitor_restart", node="missing", agent="monitor#1")
        self.assertEqual(2, missing_node.returncode)
        self.assertRegex(missing_node.stderr, r"^error: HC-RL-A59 ")

    def test_runtime_trigger_and_dependency_gates(self) -> None:
        self.write_single_node_plan(
            [
                "| coder | W1 | coder | | code.md | | |",
                "| scribe | W1 | scribe | | notes.md | on:done:coder | |",
                "| decider | W1 | decider | | decision.md | on:blocked | |",
                "| checker | W1 | checker | | check.md | on:review_ready:coder | |",
            ]
        )
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        before_scribe = self.run_add("agent_launch", agent="scribe#1")
        self.assertEqual(2, before_scribe.returncode)
        self.assertRegex(before_scribe.stderr, r"^error: HC-RL-A70 ")
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        waiting_scribe = self.run_add("agent_launch", agent="scribe#1")
        self.assertEqual(2, waiting_scribe.returncode)
        self.assertRegex(waiting_scribe.stderr, r"^error: HC-RL-A70 ")
        self.assertEqual(0, self.run_add("done", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="scribe#1").returncode)
        # HC-RL-A144: even with coder done, an on:review_ready: launch stays
        # fail-closed — the B1 placeholder, never the A70 on:done: branch.
        review_launch = self.run_add("agent_launch", agent="checker#1")
        self.assertEqual(2, review_launch.returncode)
        self.assertRegex(review_launch.stderr, r"^error: HC-RL-A144 ")

        self.reset_ledger()
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        before_blocked = self.run_add("agent_launch", agent="decider#1")
        self.assertEqual(2, before_blocked.returncode)
        self.assertRegex(before_blocked.stderr, r"^error: HC-RL-A77 ")
        self.assertEqual(0, self.run_add("blocked", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="decider#1").returncode)

        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
            ],
            agent_rows=[
                "| coder | W1 | coder | | code.md | | |",
                "| coder | C1 | coder | | code.md | | |",
            ],
        )
        self.reset_ledger()
        self.start_ledger()
        before_dependency = self.run_add("node_start", node="C1", agent="monitor#1")
        self.assertEqual(2, before_dependency.returncode)
        self.assertRegex(before_dependency.stderr, r"^error: HC-RL-A78 ")
        self.assertEqual(0, self.run_add("node_start", node="W1", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", node="W1", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("done", node="W1", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("node_close", node="W1", agent="monitor#1").returncode)
        self.assertEqual(
            0,
            self.run_add(
                "stage_start", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1"
            ).returncode,
        )
        self.assertEqual(0, self.run_add("node_start", node="C1", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", node="C1", agent="coder#1").returncode)

    def test_node_close_requires_all_terminals_and_configured_agent_done(self) -> None:
        agents = [
            "| coder | W1 | coder | | code.md | | |",
            "| checker | W1 | checker | | review.md | | |",
        ]
        self.write_single_node_plan(agents, close="agent:checker")
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="checker#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="coder#1").returncode)
        nonterminal = self.run_add("node_close", agent="monitor#1")
        self.assertEqual(2, nonterminal.returncode)
        self.assertRegex(nonterminal.stderr, r"^error: HC-RL-A17 ")
        self.assertEqual(0, self.run_add("agent_lost", agent="checker#1").returncode)
        lost_close_agent = self.run_add("node_close", agent="monitor#1")
        self.assertEqual(2, lost_close_agent.returncode)
        self.assertRegex(lost_close_agent.stderr, r"^error: HC-RL-A74 ")

        self.reset_ledger()
        self.start_ledger()
        self.assertEqual(0, self.run_add("monitor_restart", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        for agent in ("coder#1", "checker#1"):
            self.assertEqual(0, self.run_add("agent_launch", agent=agent).returncode)
            self.assertEqual(0, self.run_add("done", agent=agent).returncode)
        self.assertEqual(0, self.run_add("node_close", agent="monitor#1").returncode)
        duplicate_close = self.run_add("node_close", agent="monitor#1")
        self.assertEqual(2, duplicate_close.returncode)
        self.assertRegex(duplicate_close.stderr, r"^error: HC-RL-A68 ")
        self.assertEqual(0, self.run_add("monitor_restart", agent="monitor#1").returncode)

    def test_node_close_names_a_nonterminal_launched_agent_even_when_close_agent_is_done(self) -> None:
        self.write_single_node_plan(
            [
                "| coder | W1 | coder | | code.md | | |",
                "| checker | W1 | checker | | review.md | | |",
            ],
            close="agent:checker",
        )
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="checker#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="checker#1").returncode)
        result = self.run_add("node_close", agent="monitor#1")
        self.assertEqual(2, result.returncode)
        self.assertRegex(result.stderr, r"^error: HC-RL-A17 .*coder#1")

    def test_node_close_ignores_an_untriggered_agent(self) -> None:
        self.write_single_node_plan(
            [
                "| coder | W1 | coder | | code.md | | |",
                "| scribe | W1 | scribe | | notes.md | on:done:coder | |",
            ]
        )
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("node_close", agent="monitor#1").returncode)

    def test_decider_and_strategist_escalations_stay_with_the_triggering_agent(self) -> None:
        self.write_single_node_plan(["| coder | W1 | coder | | code.md | | |", "| decider | W1 | decider | | decision.md | | |"])
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("blocked", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("escalate", agent="coder#1", note="decider=decider#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="decider#1").returncode)
        helper_escalation = self.run_add("escalate", agent="decider#1", note="decider=decider#1")
        self.assertEqual(2, helper_escalation.returncode)
        self.assertRegex(helper_escalation.stderr, r"^error: HC-RL-A69 ")
        wrong_owner = self.run_add("decision", agent="decider#1", note="decider=decider#1")
        self.assertEqual(2, wrong_owner.returncode)
        self.assertRegex(wrong_owner.stderr, r"^error: HC-RL-A69 ")
        self.assertEqual(0, self.run_add("decision", agent="coder#1", note="decider=decider#1").returncode)
        self.assertEqual(0, self.run_add("resume", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="decider#1").returncode)

        self.reset_ledger()
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("escalate", agent="coder#1", note="strategist=strategist#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="strategist#1").returncode)
        helper_escalation = self.run_add("escalate", agent="strategist#1", note="strategist=strategist#1")
        self.assertEqual(2, helper_escalation.returncode)
        self.assertRegex(helper_escalation.stderr, r"^error: HC-RL-A69 ")
        wrong_owner = self.run_add("decision", agent="strategist#1", note="strategist=strategist#1")
        self.assertEqual(2, wrong_owner.returncode)
        self.assertRegex(wrong_owner.stderr, r"^error: HC-RL-A69 ")
        self.assertEqual(0, self.run_add("decision", agent="coder#1", note="strategist=strategist#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="strategist#1").returncode)
        self.assertEqual(0, self.run_add("user_decision", agent="coder#1", note="strategist=strategist#1").returncode)
        self.assertEqual(0, self.run_add("cancelled", agent="coder#1").returncode)
        rows = [json.loads(line) for line in (self.plan_path.parent / "relay_log.jsonl").read_text(encoding="utf-8").splitlines()]
        ownership = {row["event"]: row["agent"] for row in rows if row["event"] in {"escalate", "decision", "user_decision", "cancelled"}}
        self.assertEqual({"escalate": "coder#1", "decision": "coder#1", "user_decision": "coder#1", "cancelled": "coder#1"}, ownership)

    def test_plan_loaded_note_requires_non_empty_skill_token(self) -> None:
        """HC-RL-A18: plan_loaded must carry a non-empty skill=<version-or-token>."""
        self.write_plan()
        for bad_note in ("", "note=no-skill-token", "skill=", "version=0.1.0"):
            with self.subTest(note=bad_note):
                result = self.run_add("plan_loaded", agent="orchestrator#1", note=bad_note)
                self.assertEqual(2, result.returncode)
                self.assertEqual("", result.stdout)
                self.assertRegex(result.stderr, r"^error: HC-RL-A18 ")
                self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())
        result = self.run_add("plan_loaded", agent="orchestrator#1", note="skill=0.1.0")
        self.assertEqual(0, result.returncode, result.stderr)

    def test_decision_repeats_helper_while_user_decision_uses_frozen_note_shape(self) -> None:
        """HC-RL-A69: decision repeats the helper; user_decision retains the design note shape."""
        for helper_prefix, helper_instance in (("decider", "decider#1"), ("strategist", "strategist#1")):
            with self.subTest(helper=helper_instance):
                self.reset_ledger()
                self.write_single_node_plan(
                    [
                        f"| coder | W1 | coder | | code.md | | |",
                        f"| {helper_prefix} | W1 | {helper_prefix} | | {helper_prefix}.md | | |",
                    ],
                    decision_mode="consult",
                )
                self.start_ledger()
                self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
                self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
                if helper_prefix == "decider":
                    self.assertEqual(0, self.run_add("blocked", agent="coder#1").returncode)
                self.assertEqual(
                    0, self.run_add("escalate", agent="coder#1", note=f"{helper_prefix}={helper_instance}").returncode
                )
                ledger_path = self.plan_path.parent / "relay_log.jsonl"
                baseline = ledger_path.read_bytes()
                different_instance = f"{helper_prefix}#2"
                wrong_instance_decision = self.run_add(
                    "decision", agent="coder#1", note=f"{helper_prefix}={different_instance}"
                )
                self.assertEqual(2, wrong_instance_decision.returncode)
                self.assertRegex(wrong_instance_decision.stderr, r"^error: HC-RL-A69 ")
                self.assertEqual(baseline, ledger_path.read_bytes())
                for bad_note in ("", "note=free-text-only", f"{helper_prefix}=", f"{helper_prefix}=other#9"):
                    decision = self.run_add("decision", agent="coder#1", note=bad_note)
                    self.assertEqual(2, decision.returncode)
                    self.assertRegex(decision.stderr, r"^error: HC-RL-A69 ")
                self.assertEqual(0, self.run_add("decision", agent="coder#1", note=f"{helper_prefix}={helper_instance}").returncode)
                if helper_prefix == "decider":
                    self.assertEqual(0, self.run_add("agent_launch", agent="decider#1").returncode)
                else:
                    self.assertEqual(0, self.run_add("agent_launch", agent="strategist#1").returncode)
                    self.assertEqual(0, self.run_add("done", agent="strategist#1").returncode)
                self.assertEqual(
                    0,
                    self.run_add(
                        "user_decision",
                        agent="coder#1",
                        note="approve-amend: 用户同意 decision.md",
                    ).returncode,
                )
                if helper_prefix == "decider":
                    self.assertEqual(0, self.run_add("resume", agent="coder#1").returncode)
                    self.assertEqual(0, self.run_add("done", agent="coder#1").returncode)
                else:
                    self.assertEqual(0, self.run_add("cancelled", agent="coder#1").returncode)
                self.reset_ledger()

    def test_escalate_requires_exactly_one_matching_helper_token(self) -> None:
        """HC-RL-A69: escalate note must carry exactly one kind-matched helper token."""
        cases = {
            "decider": ("strategist=decider#1", "decider=decider#1 strategist=strategist#2", "decider=decider#1 decider=decider#1"),
            "strategist": ("decider=strategist#1", "strategist=strategist#1 decider=decider#2", "strategist=strategist#1 strategist=strategist#1"),
        }
        for helper_prefix, extra_bad_notes in cases.items():
            helper_instance = f"{helper_prefix}#1"
            with self.subTest(helper=helper_instance):
                self.reset_ledger()
                self.write_single_node_plan(
                    [
                        f"| coder | W1 | coder | | code.md | | |",
                        f"| {helper_prefix} | W1 | {helper_prefix} | | {helper_prefix}.md | | |",
                    ]
                )
                self.start_ledger()
                self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
                self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
                if helper_prefix == "decider":
                    self.assertEqual(0, self.run_add("blocked", agent="coder#1").returncode)
                ledger_path = self.plan_path.parent / "relay_log.jsonl"
                baseline = ledger_path.read_bytes()
                bad_notes = (
                    "", "note=free-text-only", f"{helper_prefix}=", f"{helper_prefix}=other#9",
                    *extra_bad_notes,
                )
                for bad_note in bad_notes:
                    escalation = self.run_add("escalate", agent="coder#1", note=bad_note)
                    self.assertEqual(2, escalation.returncode)
                    self.assertEqual("", escalation.stdout)
                    self.assertRegex(escalation.stderr, r"^error: HC-RL-A69 ")
                    self.assertEqual(baseline, ledger_path.read_bytes())
                self.assertEqual(0, self.run_add("escalate", agent="coder#1", note=f"{helper_prefix}={helper_instance}").returncode)
                self.reset_ledger()


class RelayReviewReadySignalTests(RelayCliTestCase):
    """RLT_22 — review-ready signal lifecycle: A144 launch gate, A145 write
    contract, A146 pairing gate (the B1 fail-closed placeholder was replaced by
    the full A144 precondition in B2)."""

    def write_w_plan(self) -> None:
        self.write_plan(
            node_rows=["| W1 | DHR_90 | DHR_90:W#1 | build | | | |"],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| plan-reviewer | W1 | plan-reviewer | | review.md | on:review_ready:builder | |",
                "| checker | W1 | checker | | check.md | | |",
            ],
        )

    def open_node_with_builder(self) -> None:
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="builder#1").returncode)

    def ledger_rows(self) -> list[dict[str, object]]:
        path = self.plan_path.parent / "relay_log.jsonl"
        if not path.exists():
            return []
        return [
            json.loads(line)
            for line in path.read_text(encoding="utf-8").splitlines()
        ]

    def test_a144_launch_gate_replaces_b1_placeholder(self) -> None:
        """A144 (B2): a current-instance signal arms the launch; without one the
        launch still exits 2 as A144 — never A70 — and leaves the ledger
        byte-identical. Repeat launches stay A58/A49's job, not A144's."""
        self.write_w_plan()
        self.open_node_with_builder()
        baseline = (self.plan_path.parent / "relay_log.jsonl").read_bytes()
        launch = self.run_add("agent_launch", agent="plan-reviewer#1")
        self.assertEqual(2, launch.returncode)
        self.assertRegex(launch.stderr, r"^error: HC-RL-A144 ")
        self.assertNotIn("HC-RL-A70", launch.stderr)
        self.assertEqual(
            baseline,
            (self.plan_path.parent / "relay_log.jsonl").read_bytes(),
        )
        # The valid signal arms the launch now — the B1 unconditional reject is gone.
        self.assertEqual(
            0,
            self.run_add(
                "checkpoint",
                agent="builder#1",
                note="ready_for_review=plan-reviewer 送审",
            ).returncode,
        )
        self.assertEqual(
            0, self.run_add("agent_launch", agent="plan-reviewer#1").returncode
        )
        # Repeat launches are gated by A58/A49 — the code must not be A144.
        rejected = self.run_add("agent_launch", agent="plan-reviewer#3")
        self.assertEqual(2, rejected.returncode)
        self.assertRegex(rejected.stderr, r"^error: HC-RL-A58 ")
        rejected = self.run_add("agent_launch", agent="plan-reviewer#2")
        self.assertEqual(2, rejected.returncode)
        self.assertRegex(rejected.stderr, r"^error: HC-RL-A49 ")
        self.assertNotIn("HC-RL-A144", rejected.stderr)

    def test_a144_rejects_without_a_current_instance_signal(self) -> None:
        """A144's nine rejections each exit 2 as A144 — never A70."""
        cases: list[tuple[str, bool, list[tuple[str, str]]]] = [
            ("plain checkpoint only", True, [("checkpoint", "no token")]),
            ("no agent events at all", False, []),
            (
                "signal then done",
                True,
                [("checkpoint", "ready_for_review=plan-reviewer"), ("done", "sealed")],
            ),
            (
                "signal then agent_lost",
                True,
                [("checkpoint", "ready_for_review=plan-reviewer"), ("agent_lost", "gone")],
            ),
            (
                "signal then cancelled",
                True,
                [("checkpoint", "ready_for_review=plan-reviewer"), ("cancelled", "halted")],
            ),
            (
                "signal names another reviewer",
                True,
                [("checkpoint", "ready_for_review=checker")],
            ),
            (
                "signal covered by a later plain checkpoint",
                True,
                [
                    ("checkpoint", "ready_for_review=plan-reviewer"),
                    ("checkpoint", "progress only"),
                ],
            ),
            (
                "blocked after the signal",
                True,
                [("checkpoint", "ready_for_review=plan-reviewer"), ("blocked", "stuck")],
            ),
        ]
        for label, launched, steps in cases:
            with self.subTest(case=label):
                self.write_w_plan()
                self.reset_ledger()
                self.start_ledger()
                self.assertEqual(
                    0, self.run_add("node_start", agent="monitor#1").returncode
                )
                if launched:
                    self.assertEqual(
                        0, self.run_add("agent_launch", agent="builder#1").returncode
                    )
                for event, note in steps:
                    self.assertEqual(
                        0,
                        self.run_add(event, agent="builder#1", note=note).returncode,
                        note,
                    )
                rejected = self.run_add("agent_launch", agent="plan-reviewer#1")
                self.assertEqual(2, rejected.returncode)
                self.assertRegex(rejected.stderr, r"^error: HC-RL-A144 ")
                self.assertNotIn("HC-RL-A70", rejected.stderr)

        # Ninth rejection — stale-attempt replay: builder#1's signal must not arm
        # builder#2; the current instance's latest event is its own launch.
        self.write_w_plan()
        self.reset_ledger()
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="builder#1").returncode)
        self.assertEqual(
            0,
            self.run_add(
                "checkpoint",
                agent="builder#1",
                note="ready_for_review=plan-reviewer",
            ).returncode,
        )
        self.assertEqual(
            0, self.run_add("agent_lost", agent="builder#1", note="gone").returncode
        )
        self.assertEqual(0, self.run_add("agent_launch", agent="builder#2").returncode)
        rejected = self.run_add("agent_launch", agent="plan-reviewer#1")
        self.assertEqual(2, rejected.returncode)
        self.assertRegex(rejected.stderr, r"^error: HC-RL-A144 ")
        self.assertNotIn("HC-RL-A70", rejected.stderr)

    def test_a145_ready_signal_write_contract(self) -> None:
        """A145: one `ready_for_review=` token per note, naming a same-node
        judgement-role agent, written only by a non-judgement agent."""
        self.write_w_plan()
        self.open_node_with_builder()

        self.assertEqual(
            0,
            self.run_add(
                "checkpoint", agent="builder#1", note="ready_for_review=plan-reviewer"
            ).returncode,
        )
        for bad_note in (
            "ready_for_review=plan-reviewer ready_for_review=checker",
            "ready_for_review=ghost",
            "ready_for_review=builder",
        ):
            with self.subTest(note=bad_note):
                rejected = self.run_add(
                    "checkpoint", agent="builder#1", note=bad_note
                )
                self.assertEqual(2, rejected.returncode)
                self.assertRegex(rejected.stderr, r"^error: HC-RL-A145 ")
        # A judgement-role agent never writes the signal itself.
        self.assertEqual(0, self.run_add("agent_launch", agent="checker#1").returncode)
        rejected = self.run_add(
            "checkpoint", agent="checker#1", note="ready_for_review=plan-reviewer"
        )
        self.assertEqual(2, rejected.returncode)
        self.assertRegex(rejected.stderr, r"^error: HC-RL-A145 ")

    def test_a145_signals_burn_no_attempt_and_have_no_add_cap(self) -> None:
        """A145/A102: signals accompany no agent_launch, keep attempt at 1, and
        `add` accepts more than `rework_max_rounds` (=2) consecutive signals."""
        self.write_w_plan()
        self.open_node_with_builder()
        for round_ in (1, 2, 3):
            self.assertEqual(
                0,
                self.run_add(
                    "checkpoint",
                    agent="builder#1",
                    note=f"ready_for_review=plan-reviewer round={round_}",
                ).returncode,
            )
        launches = [
            row["agent"]
            for row in self.ledger_rows()
            if row["event"] == "agent_launch" and row["agent"].startswith("builder#")
        ]
        self.assertEqual(["builder#1"], launches)
        # Relaunch after a loss lands exactly on #2 — the signals burned nothing.
        self.assertEqual(0, self.run_add("agent_lost", agent="builder#1", note="失联").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="builder#2").returncode)

    def _signal(self, sender: str, reviewer: str, node: str = "W1", note: str = "") -> int:
        """Write a `ready_for_review` checkpoint and return its ledger seq."""
        suffix = f" {note}" if note else ""
        self.assertEqual(
            0,
            self.run_add(
                "checkpoint",
                node=node,
                agent=sender,
                note=f"ready_for_review={reviewer}{suffix}",
            ).returncode,
        )
        return self._signal_seq(sender, reviewer, node)

    def _signal_seq(self, agent: str, reviewer: str, node: str = "W1") -> int:
        """Seq of the latest `ready_for_review=<reviewer>` checkpoint by <agent>."""
        rows = [
            row
            for row in self.ledger_rows()
            if row["node"] == node
            and row["event"] == "checkpoint"
            and row["agent"] == agent
            and relay_log._note_tokens(str(row["note"])).get("ready_for_review")
            == reviewer
        ]
        assert rows, f"no signal from {agent} to {reviewer} in {node}"
        return int(str(rows[-1]["seq"]))

    def _review_fixture(self) -> None:
        """Fresh W-shaped ledger: node open, builder#1 live, nothing written yet."""
        self.write_w_plan()
        self.reset_ledger()
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="builder#1").returncode)

    def _start_ledger_for(self, stage_id: str, node: str = "W1") -> None:
        result = self.run_add(
            "plan_loaded", node=node, agent="orchestrator#1", note="skill=0.1.0"
        )
        self.assertEqual(0, result.returncode, result.stderr)
        for event in ("stage_start", "monitor_launch"):
            result = self.run_add(
                event, node=node, agent="orchestrator#1", note=f"stage_id={stage_id}"
            )
            self.assertEqual(0, result.returncode, result.stderr)

    def test_a146_pairing_done_accepted_in_order(self) -> None:
        """A146 positive: after PASS the sender seals first, then the reviewer's
        `done` pairs `reviewed=<S>#<a>` + `ready_seq=<n>` at the latest signal."""
        self._review_fixture()
        self._signal("builder#1", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_launch", agent="plan-reviewer#1").returncode)
        # FAIL keeps the reviewer live; the reworked answer is a fresh signal.
        self.assertEqual(
            0,
            self.run_add(
                "checkpoint", agent="plan-reviewer#1", note="FAIL 整改"
            ).returncode,
        )
        self._signal("builder#1", "plan-reviewer", note="round2")
        self.assertEqual(0, self.run_add("done", agent="builder#1", note="返工完成").returncode)
        done = self.run_add(
            "done",
            agent="plan-reviewer#1",
            note="reviewed=builder#1 "
            f"ready_seq={self._signal_seq('builder#1', 'plan-reviewer')} PASS",
        )
        self.assertEqual(0, done.returncode, done.stderr)

    def test_a146_pairing_gate_rejections(self) -> None:
        """A146's seven rejections each exit 2 as A146 — at done-write time."""

        def assert_a146(done: subprocess.CompletedProcess[str]) -> None:
            self.assertEqual(2, done.returncode)
            self.assertRegex(done.stderr, r"^error: HC-RL-A146 ")

        # Missing reviewed= / missing ready_seq= / malformed reviewed= / bare note.
        self._review_fixture()
        seq = self._signal("builder#1", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_launch", agent="plan-reviewer#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="builder#1").returncode)
        for note in (
            f"ready_seq={seq} PASS",
            "reviewed=builder#1 PASS",
            f"reviewed=builder ready_seq={seq} PASS",
            "PASS",
        ):
            with self.subTest(note=note):
                assert_a146(self.run_add("done", agent="plan-reviewer#1", note=note))

        # ready_seq pointing at an old round's signal, not the latest.
        self._review_fixture()
        first = self._signal("builder#1", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_launch", agent="plan-reviewer#1").returncode)
        self.assertEqual(
            0, self.run_add("checkpoint", agent="plan-reviewer#1", note="FAIL").returncode
        )
        self._signal("builder#1", "plan-reviewer", note="round2")
        self.assertEqual(0, self.run_add("done", agent="builder#1").returncode)
        assert_a146(
            self.run_add(
                "done",
                agent="plan-reviewer#1",
                note=f"reviewed=builder#1 ready_seq={first} PASS",
            )
        )

        # ready_seq pointing at a signal addressed to another reviewer.
        self._review_fixture()
        other = self._signal("builder#1", "checker")
        self._signal("builder#1", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_launch", agent="plan-reviewer#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="builder#1").returncode)
        assert_a146(
            self.run_add(
                "done",
                agent="plan-reviewer#1",
                note=f"reviewed=builder#1 ready_seq={other} PASS",
            )
        )

        # ready_seq pointing at a non-checkpoint row.
        self._review_fixture()
        self._signal("builder#1", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_launch", agent="plan-reviewer#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="builder#1").returncode)
        assert_a146(
            self.run_add(
                "done",
                agent="plan-reviewer#1",
                note="reviewed=builder#1 ready_seq=1 PASS",
            )
        )

        # Cross-instance splice: ready_seq cites builder#1's signal while
        # reviewed= names builder#2.
        self._review_fixture()
        old = self._signal("builder#1", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_lost", agent="builder#1", note="gone").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="builder#2").returncode)
        self._signal("builder#2", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_launch", agent="plan-reviewer#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="builder#2").returncode)
        assert_a146(
            self.run_add(
                "done",
                agent="plan-reviewer#1",
                note=f"reviewed=builder#2 ready_seq={old} PASS",
            )
        )

        # The reviewed instance is still live — the reviewer cannot seal first.
        self._review_fixture()
        seq = self._signal("builder#1", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_launch", agent="plan-reviewer#1").returncode)
        assert_a146(
            self.run_add(
                "done",
                agent="plan-reviewer#1",
                note=f"reviewed=builder#1 ready_seq={seq} PASS",
            )
        )

        # The reviewed instance is agent_lost, not done.
        self._review_fixture()
        seq = self._signal("builder#1", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_launch", agent="plan-reviewer#1").returncode)
        self.assertEqual(0, self.run_add("agent_lost", agent="builder#1", note="gone").returncode)
        assert_a146(
            self.run_add(
                "done",
                agent="plan-reviewer#1",
                note=f"reviewed=builder#1 ready_seq={seq} PASS",
            )
        )

    def test_a146_gate_is_inert_without_a_signal_for_this_agent(self) -> None:
        """No signal naming this agent → no gate: R-shaped reviewers and every
        other review-role agent keep writing ordinary `done`s."""
        self._review_fixture()
        self.assertEqual(0, self.run_add("agent_launch", agent="checker#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="checker#1", note="PASS").returncode)

        # A signal naming plan-reviewer still does not gate checker's done.
        self._review_fixture()
        self._signal("builder#1", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_launch", agent="checker#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="checker#1", note="PASS").returncode)

    def test_a146_two_lanes_bind_their_own_ready_seq(self) -> None:
        """X node, two reviewer lanes — each `done` pairs with its own latest
        signal; one lane runs two rounds, the other one."""
        self.write_plan(
            node_rows=["| X1 | DHR_90 | DHR_90:X#1 | rework | | | |"],
            agent_rows=[
                "| coder | X1 | coder | | rework.md | | |",
                "| requirement | X1 | reviewer | | review.md | on:review_ready:coder | |",
                "| lesson | X1 | reviewer | | review.md | on:review_ready:coder | |",
            ],
        )
        self._start_ledger_for("DHR_90:X#1", node="X1")
        self.assertEqual(0, self.run_add("node_start", node="X1", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", node="X1", agent="coder#1").returncode)
        # Lane requirement, round 1 → FAIL, the reviewer stays live.
        self._signal("coder#1", "requirement", node="X1")
        self.assertEqual(
            0, self.run_add("agent_launch", node="X1", agent="requirement#1").returncode
        )
        self.assertEqual(
            0,
            self.run_add(
                "checkpoint", node="X1", agent="requirement#1", note="FAIL"
            ).returncode,
        )
        # Lane requirement round 2, then lane lesson's only round.
        self._signal("coder#1", "requirement", node="X1", note="round2")
        self._signal("coder#1", "lesson", node="X1")
        self.assertEqual(
            0, self.run_add("agent_launch", node="X1", agent="lesson#1").returncode
        )
        self.assertEqual(0, self.run_add("done", node="X1", agent="coder#1").returncode)
        for reviewer in ("requirement", "lesson"):
            done = self.run_add(
                "done",
                node="X1",
                agent=f"{reviewer}#1",
                note="reviewed=coder#1 "
                f"ready_seq={self._signal_seq('coder#1', reviewer, node='X1')} PASS",
            )
            self.assertEqual(0, done.returncode, done.stderr)

    def test_a146_rejects_at_done_write_time(self) -> None:
        """The pairing gate fires on the `done` write itself — the row never
        lands (ledger byte-identical), and a corrected `done` then succeeds."""
        self._review_fixture()
        seq = self._signal("builder#1", "plan-reviewer")
        self.assertEqual(0, self.run_add("agent_launch", agent="plan-reviewer#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="builder#1").returncode)
        baseline = (self.plan_path.parent / "relay_log.jsonl").read_bytes()
        rejected = self.run_add("done", agent="plan-reviewer#1", note="PASS")
        self.assertEqual(2, rejected.returncode)
        self.assertRegex(rejected.stderr, r"^error: HC-RL-A146 ")
        self.assertEqual(
            baseline,
            (self.plan_path.parent / "relay_log.jsonl").read_bytes(),
        )
        self.assertEqual(
            0,
            self.run_add(
                "done",
                agent="plan-reviewer#1",
                note=f"reviewed=builder#1 ready_seq={seq} PASS",
            ).returncode,
        )

    def test_a145_helper_scan_sees_decider_only(self) -> None:
        """A69's helper-token scan does not claim `ready_for_review=`: a note
        carrying it plus `decider=` is accepted, the helper token staying inert."""
        self.write_w_plan()
        self.open_node_with_builder()
        self.assertEqual(
            0,
            self.run_add(
                "checkpoint",
                agent="builder#1",
                note="ready_for_review=plan-reviewer decider=decider#1",
            ).returncode,
        )
        # Parser-level pins: a checkpoint never reaches the A69 helpers, so the
        # isolation contract is asserted on the functions themselves.
        mixed = "ready_for_review=plan-reviewer decider=decider#1"
        self.assertEqual("decider#1", relay_log._decision_helper(mixed))
        self.assertEqual("decider#1", relay_log._validate_decision_helper(mixed))
        for signal_note in (
            "ready_for_review=plan-reviewer",
            "ready_for_review=plan-reviewer reviewed=builder#1 ready_seq=3",
        ):
            with self.subTest(note=signal_note):
                self.assertIsNone(relay_log._decision_helper(signal_note))
                with self.assertRaises(RelayError) as raised:
                    relay_log._validate_decision_helper(signal_note)
                self.assertEqual("HC-RL-A69", raised.exception.code)


class RelayConfigTests(RelayCliTestCase):
    """Batch 1 (HC-RL-A92/A115/A116/A131/A135): config resolution, loading and recipe lint."""

    REVIEWERS = {
        "heavy": ["code-round2", "requirement", "lesson", "consistency"],
        "normal": ["requirement", "lesson"],
        "light": ["lesson", "consistency"],
    }

    @staticmethod
    def command_argv(
        subcommand: str,
        plan_dir: str,
        config_dir: str | None = None,
        note: str = "skill=0.1.0",
    ) -> list[str]:
        if subcommand == "add":
            argv = [
                "add", "--plan", plan_dir, "--node", "W1", "--event", "plan_loaded",
                "--agent", "orchestrator#1", "--note", note,
            ]
        else:
            argv = [subcommand, "--plan", plan_dir]
        if config_dir is not None:
            argv.extend(["--config-dir", config_dir])
        return argv

    @staticmethod
    def note_fields(note: str) -> dict[str, str]:
        return {
            token.split("=", 1)[0]: token.split("=", 1)[1]
            for token in note.split()
            if "=" in token
        }

    @staticmethod
    def note_values(note: str, key: str) -> list[str]:
        """Every value carried by the given key, so duplicates stay visible."""
        return [
            token.split("=", 1)[1]
            for token in note.split()
            if "=" in token and token.split("=", 1)[0] == key
        ]

    def ledger_note(self, index: int = -1) -> str:
        rows = [
            json.loads(line)
            for line in (self.plan_path.parent / "relay_log.jsonl").read_text(encoding="utf-8").splitlines()
        ]
        return rows[index]["note"]

    def copy_skill_config(self, name: str) -> Path:
        target = Path(self.tempdir.name) / name
        shutil.copytree(SKILL_DIR, target)
        return target

    def config_with_recipes(self, name: str, *, appendix: str = "", drop: str | None = None) -> Path:
        """A shipped config whose recipes table is extended or loses one tier."""
        target = self.copy_skill_config(name)
        mapping = target / "dh-mapping.toml"
        text = mapping.read_text(encoding="utf-8")
        if drop is not None:
            kept: list[str] = []
            skipping = False
            for line in text.splitlines(keepends=True):
                if line.lstrip().startswith("["):
                    skipping = line.strip() == f"[recipes.{drop}]"
                if not skipping:
                    kept.append(line)
            text = "".join(kept)
        mapping.write_text(f"{text}\n{appendix}", encoding="utf-8")
        return target

    def write_r_plan(self, reviewers: list[str], *, recipe: str = "normal") -> None:
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                *(f"| {name} | R1 | reviewer | | review.{name}.md | | |" for name in reviewers),
            ],
            marker=(
                "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-11 "
                f"session=app recipe={recipe} cards=DHR_90 -->"
            ),
        )

    def test_shipped_roles_toml_has_the_eleven_design_roles(self) -> None:
        """HC-RL-A131: roles.toml keys equal design §6.3 and every role carries model + launch."""
        roles = tomllib.loads((SKILL_DIR / "roles.toml").read_text(encoding="utf-8"))
        self.assertEqual(
            {
                "planner", "orchestrator", "monitor", "builder", "plan-reviewer",
                "coder", "scribe", "checker", "decider", "reviewer", "strategist",
            },
            set(roles),
        )
        for name, entry in sorted(roles.items()):
            with self.subTest(role=name):
                self.assertEqual({"model", "launch"}, set(entry))
                self.assertIsInstance(entry["model"], str)
                self.assertIsInstance(entry["launch"], str)
                self.assertTrue(entry["model"] and entry["launch"])

    def test_shipped_dh_mapping_carries_the_four_frozen_content_classes(self) -> None:
        """HC-RL-A92: stages/recipes/limits/on_exceed are present and E11-E13 stay out of relay."""
        mapping = tomllib.loads((SKILL_DIR / "dh-mapping.toml").read_text(encoding="utf-8"))
        self.assertEqual({"stages", "recipes", "limits"}, set(mapping))
        self.assertEqual(
            {
                "W": {"dh_nodes": ["S0", "S1", "S2"]},
                "C": {"dh_nodes": ["S3"]},
                "R": {"dh_nodes": ["E0", "E1", "E2", "E4", "E5", "E14", "E6", "E3"]},
                "X": {"dh_nodes": ["E2", "E3"]},
                "F": {"dh_nodes": ["E7", "E8", "E9", "E10"]},
            },
            mapping["stages"],
        )
        for stage, entry in mapping["stages"].items():
            with self.subTest(stage=stage):
                self.assertFalse({"E11", "E12", "E13"} & set(entry["dh_nodes"]))
        self.assertEqual(2, mapping["limits"]["rework_max_rounds"])
        self.assertEqual(3, mapping["limits"]["attempt_max"])
        self.assertEqual("strategist-then-user", mapping["limits"]["on_exceed"]["action"])
        self.assertTrue(mapping["limits"]["on_exceed"]["note"].strip())

    def test_shipped_recipes_match_the_dev_harness_node_table(self) -> None:
        """HC-RL-A115: heavy/normal/light carry exactly the frozen reviewer paths."""
        recipes = tomllib.loads((SKILL_DIR / "dh-mapping.toml").read_text(encoding="utf-8"))["recipes"]
        self.assertEqual(set(self.REVIEWERS), set(recipes))
        for tier, reviewers in self.REVIEWERS.items():
            with self.subTest(tier=tier):
                self.assertEqual(reviewers, recipes[tier]["reviewers"])

    def test_each_recipe_tier_lints_a_matching_r_instance(self) -> None:
        """HC-RL-A115/A116: each tier accepts its configured reviewer set regardless of row order."""
        for tier, reviewers in self.REVIEWERS.items():
            with self.subTest(tier=tier):
                self.write_r_plan(list(reversed(reviewers)), recipe=tier)
                result = self.run_lint_cli(self.plan_path.parent)
                self.assertEqual(0, result.returncode, result.stderr)
                self.assertEqual("lint: ok\n", result.stdout)

    def test_recipe_reviewer_mismatch_is_rejected_as_a116(self) -> None:
        """HC-RL-A116: an R instance whose reviewer set differs from its recipe is rejected."""
        self.write_r_plan(["requirement", "lesson", "code-round2"])
        lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(2, lint.returncode)
        self.assertEqual("", lint.stdout)
        self.assertRegex(lint.stderr, r"^lint: HC-RL-A116 ")
        self.assertIn("DHR_90:R#1", lint.stderr)
        self.assertIn("code-round2", lint.stderr)

        for subcommand in ("add", "status"):
            with self.subTest(subcommand=subcommand):
                result = self.run_cli(*self.command_argv(subcommand, str(self.plan_path.parent)))
                self.assertEqual(3, result.returncode)
                self.assertEqual("", result.stdout)
                self.assertRegex(result.stderr, r"^error: HC-RL-A116 ")
        self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())

    def test_one_mismatched_r_instance_rejects_the_whole_plan(self) -> None:
        """HC-RL-A116: every active R instance is checked, not only the first one."""
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
                "| W2 | DHR_91 | DHR_91:W#1 | build | | R1 | |",
                "| C2 | DHR_91 | DHR_91:C#1 | construction | | W2 | |",
                "| R2 | DHR_91 | DHR_91:R#1 | review | | C2 | |",
            ],
            agent_rows=[
                "| builder-a | W1 | builder | | task_plan.md | | |",
                "| coder-a | C1 | coder | | code.md | | |",
                "| requirement | R1 | reviewer | | review.requirement.md | | |",
                "| lesson | R1 | reviewer | | review.lesson.md | | |",
                "| builder-b | W2 | builder | | task_plan.md | | |",
                "| coder-b | C2 | coder | | code.md | | |",
                "| consistency | R2 | reviewer | | review.consistency.md | | |",
            ],
            marker=(
                "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-11 "
                "session=app recipe=normal cards=DHR_90,DHR_91 -->"
            ),
        )
        lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(2, lint.returncode)
        self.assertRegex(lint.stderr, r"^lint: HC-RL-A116 ")
        self.assertIn("DHR_91:R#1", lint.stderr)
        self.assertNotIn("DHR_90:R#1", lint.stderr)

    def test_an_r_instance_without_reviewer_rows_is_exempt_from_a116(self) -> None:
        """HC-RL-A116: a zero-reviewer R instance does not trigger the set check."""
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | W1 | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| scribe | R1 | scribe | | review.md | | |",
            ],
        )
        result = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("lint: ok\n", result.stdout)

    def test_recipe_value_must_name_a_configured_tier(self) -> None:
        """HC-RL-A116: the marker recipe must name a configured tier even without R instances."""
        self.write_plan(
            marker=(
                "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-11 "
                "session=app recipe=strict cards=DHR_90 -->"
            )
        )
        lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(2, lint.returncode)
        self.assertEqual("", lint.stdout)
        self.assertRegex(lint.stderr, r"^lint: HC-RL-A116 ")
        add = self.run_add("plan_loaded", agent="orchestrator#1", note="skill=0.1.0")
        self.assertEqual(3, add.returncode)
        self.assertRegex(add.stderr, r"^error: HC-RL-A116 ")
        self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())

    def test_recipe_tiers_stay_within_the_frozen_three_value_enum(self) -> None:
        """HC-RL-A116: adding a tier to the config must not legitimize recipe=<new tier>."""
        extended = self.config_with_recipes(
            "extended-recipes",
            appendix='\n[recipes.strict]\nreviewers = ["requirement", "lesson", "consistency"]\n',
        )
        self.write_r_plan(["requirement", "lesson", "consistency"], recipe="strict")
        lint = self.run_cli("lint", "--plan", str(self.plan_path.parent), "--config-dir", str(extended))
        self.assertEqual(2, lint.returncode)
        self.assertEqual("", lint.stdout)
        self.assertRegex(lint.stderr, r"^lint: HC-RL-A116 ")
        self.assertIn("strict", lint.stderr)
        for subcommand in ("add", "status"):
            with self.subTest(subcommand=subcommand):
                result = self.run_cli(
                    *self.command_argv(subcommand, str(self.plan_path.parent), str(extended))
                )
                self.assertEqual(3, result.returncode)
                self.assertEqual("", result.stdout)
                self.assertRegex(result.stderr, r"^error: HC-RL-A116 ")
        self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())

        self.write_r_plan(self.REVIEWERS["heavy"], recipe="heavy")
        positive = self.run_cli("lint", "--plan", str(self.plan_path.parent), "--config-dir", str(extended))
        self.assertEqual(0, positive.returncode, positive.stderr)
        self.assertEqual("lint: ok\n", positive.stdout)

    def test_a_config_without_one_frozen_tier_rejects_plans_using_it(self) -> None:
        """HC-RL-A116: dropping a tier from the config cannot silently legitimize it either."""
        narrowed = self.config_with_recipes("narrowed-recipes", drop="normal")
        self.write_r_plan(self.REVIEWERS["normal"], recipe="normal")
        lint = self.run_cli("lint", "--plan", str(self.plan_path.parent), "--config-dir", str(narrowed))
        self.assertEqual(2, lint.returncode)
        self.assertEqual("", lint.stdout)
        self.assertRegex(lint.stderr, r"^lint: HC-RL-A116 ")
        self.assertIn("normal", lint.stderr)
        add = self.run_cli(*self.command_argv("add", str(self.plan_path.parent), str(narrowed)))
        self.assertEqual(3, add.returncode)
        self.assertRegex(add.stderr, r"^error: HC-RL-A116 ")
        self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())

    def test_plan_loaded_provenance_is_rebuilt_from_the_real_resolver(self) -> None:
        """HC-RL-A135/§6.2.1: forged config_dir/plan tokens never survive into the ledger."""
        resolved = self.copy_skill_config("resolved")
        forged = self.copy_skill_config("forged")
        self.write_plan()
        plan_dir = str(self.plan_path.parent)
        actual_plan = encoded_path(os.path.normpath(os.path.abspath(plan_dir)))
        forged_config = encoded_path(forged)
        forged_plan = encoded_path(forged / "relay_plan.md")
        cases = {
            "forged": f"skill=0.1.0 config_dir={forged_config} plan={forged_plan} session=app cards=DHR_90",
            "duplicated": (
                f"skill=0.1.0 config_dir={forged_config} config_dir={forged_config} "
                f"plan={forged_plan} plan={forged_plan} session=app cards=DHR_90"
            ),
            "conflicting": (
                f"skill=0.1.0 config_dir={forged_config} config_dir={encoded_path(resolved)} "
                f"plan={forged_plan} session=app cards=DHR_90"
            ),
            "absent": "skill=0.1.0 session=app cards=DHR_90",
        }
        for name, note in cases.items():
            with self.subTest(case=name):
                self.reset_ledger()
                add = self.run_cli(
                    *self.command_argv("add", plan_dir, str(resolved), note=note)
                )
                self.assertEqual(0, add.returncode, add.stderr)
                recorded = self.ledger_note()
                self.assertEqual([encoded_path(resolved)], self.note_values(recorded, "config_dir"))
                self.assertEqual([actual_plan], self.note_values(recorded, "plan"))
                self.assertEqual(resolved.as_posix(), unquote(self.note_fields(recorded)["config_dir"]))
                self.assertEqual(
                    plan_dir.replace(os.sep, "/"),
                    unquote(self.note_fields(recorded)["plan"]),
                )
                self.assertNotIn(forged_config, recorded)
                self.assertNotIn(forged_plan, recorded)
                self.assertEqual("0.1.0", self.note_fields(recorded)["skill"])
                self.assertEqual("app", self.note_fields(recorded)["session"])
                self.assertEqual("DHR_90", self.note_fields(recorded)["cards"])

    def test_plan_loaded_records_the_normalized_absolute_plan_dir(self) -> None:
        """HC-RL-A135: a relative --plan is recorded as its normalized absolute path."""
        self.write_plan()
        add = self.run_cli(
            "add", "--plan", ".", "--node", "W1", "--event", "plan_loaded",
            "--agent", "orchestrator#1", "--note", "skill=0.1.0",
            cwd=self.plan_path.parent,
        )
        self.assertEqual(0, add.returncode, add.stderr)
        recorded = self.note_values(self.ledger_note(), "plan")
        self.assertEqual([encoded_path(self.plan_path.parent)], recorded)
        self.assertTrue(Path(unquote(recorded[0])).is_absolute())

    def test_structural_lint_precedes_the_recipe_check(self) -> None:
        """HC-RL-A116: a mismatching R instance is still reported under the structural rule."""
        self.write_plan(
            node_rows=[
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
                "| C2 | DHR_90 | DHR_90:C#1 | construction | | R1 | |",
            ],
            agent_rows=[
                "| coder | C1 | coder | | code.md | | |",
                "| requirement | R1 | reviewer | | review.md | | |",
                "| checker | C2 | checker | | check.md | | |",
            ],
        )
        lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(2, lint.returncode)
        # HC-RL-A120: C#1's tail reappearance is a legal append, so the first
        # structural rule to fire is the A89 back-edge — still ahead of A116.
        self.assertRegex(lint.stderr, r"^lint: HC-RL-A89 ")

    def test_each_subcommand_help_exposes_config_dir(self) -> None:
        """HC-RL-A135: add/status/lint each advertise --config-dir; the command set stays three."""
        for subcommand in SUBCOMMANDS:
            with self.subTest(subcommand=subcommand):
                result = self.run_cli(subcommand, "--help")
                self.assertEqual(0, result.returncode, result.stderr)
                self.assertIn("--config-dir", result.stdout)
        top_level = self.run_cli("--help")
        self.assertEqual(0, top_level.returncode)
        self.assertRegex(top_level.stdout, r"\{add,status,lint\}")

    def test_explicit_config_dir_is_normalized_and_percent_encoded(self) -> None:
        """HC-RL-A135: `~/...` expands, normalizes to an absolute path and is recorded encoded."""
        home = Path(self.tempdir.name) / "hôme dir"
        installed = home / ".claude" / "skills" / "relay-light"
        installed.parent.mkdir(parents=True)
        shutil.copytree(SKILL_DIR, installed)
        self.write_plan()
        plan_dir = str(self.plan_path.parent)

        tilde = self.run_cli(
            *self.command_argv("add", plan_dir, "~/.claude/skills/relay-light"), env=home_env(home)
        )
        self.assertEqual(0, tilde.returncode, tilde.stderr)
        fields = self.note_fields(self.ledger_note())
        expected = os.path.normpath(os.path.abspath(str(installed)))
        self.assertEqual(encoded_path(expected), fields["config_dir"])
        self.assertIn("%20", fields["config_dir"])
        self.assertIn("%C3%B4", fields["config_dir"])
        self.assertEqual(expected.replace(os.sep, "/"), unquote(fields["config_dir"]))
        self.assertEqual(plan_dir.replace(os.sep, "/"), unquote(fields["plan"]))
        self.assertEqual("0.1.0", fields["skill"])

        self.reset_ledger()
        relative = self.run_cli(*self.command_argv("add", plan_dir, os.path.relpath(SKILL_DIR)))
        self.assertEqual(0, relative.returncode, relative.stderr)
        self.assertEqual(encoded_path(SKILL_DIR), self.note_fields(self.ledger_note())["config_dir"])

    def test_default_config_dir_resolution_follows_the_five_cases(self) -> None:
        """HC-RL-A135/§6.2.1: single-side auto-detection; two-sided and zero-sided fail closed."""
        home = Path(self.tempdir.name) / "fake-home"
        home.mkdir()
        claude = home / ".claude" / "skills" / "relay-light"
        codex = home / ".codex" / "skills" / "relay-light"
        env = home_env(home)
        self.write_plan()
        plan_dir = str(self.plan_path.parent)
        ledger_path = self.plan_path.parent / "relay_log.jsonl"

        for subcommand in SUBCOMMANDS:
            with self.subTest(case="neither", subcommand=subcommand):
                result = self.run_cli(*self.command_argv(subcommand, plan_dir), env=env, config_dir=None)
                self.assertEqual(3, result.returncode)
                self.assertEqual("", result.stdout)
                self.assertRegex(result.stderr, r"^error: HC-RL-A135 ")
        self.assertFalse(ledger_path.exists())

        shutil.copytree(SKILL_DIR, claude)
        claude_only = self.run_cli("lint", "--plan", plan_dir, env=env, config_dir=None)
        self.assertEqual(0, claude_only.returncode, claude_only.stderr)
        self.assertEqual("lint: ok\n", claude_only.stdout)
        claude_add = self.run_cli(*self.command_argv("add", plan_dir), env=env, config_dir=None)
        self.assertEqual(0, claude_add.returncode, claude_add.stderr)
        self.assertEqual(
            encoded_path(os.path.normpath(os.path.abspath(str(claude)))),
            self.note_fields(self.ledger_note())["config_dir"],
        )
        before_both = ledger_path.read_bytes()

        shutil.rmtree(claude)
        shutil.copytree(SKILL_DIR, codex)
        codex_only = self.run_cli("lint", "--plan", plan_dir, env=env, config_dir=None)
        self.assertEqual(0, codex_only.returncode, codex_only.stderr)
        self.assertEqual("lint: ok\n", codex_only.stdout)

        shutil.copytree(SKILL_DIR, claude)
        both = self.run_cli("lint", "--plan", plan_dir, env=env, config_dir=None)
        self.assertEqual(3, both.returncode)
        self.assertEqual("", both.stdout)
        self.assertRegex(both.stderr, r"^error: HC-RL-A135 ")
        both_add = self.run_cli(*self.command_argv("add", plan_dir), env=env, config_dir=None)
        self.assertEqual(3, both_add.returncode)
        self.assertRegex(both_add.stderr, r"^error: HC-RL-A135 ")
        self.assertEqual(before_both, ledger_path.read_bytes())

        explicit = self.run_cli("lint", "--plan", plan_dir, "--config-dir", str(codex), env=env)
        self.assertEqual(0, explicit.returncode, explicit.stderr)

    def test_missing_explicit_config_dir_fails_closed(self) -> None:
        """HC-RL-A135: an explicit config dir that does not exist exits 3 with no ledger write."""
        self.write_plan()
        missing = str(Path(self.tempdir.name) / "absent")
        for subcommand in SUBCOMMANDS:
            with self.subTest(subcommand=subcommand):
                result = self.run_cli(*self.command_argv(subcommand, str(self.plan_path.parent), missing))
                self.assertEqual(3, result.returncode)
                self.assertEqual("", result.stdout)
                self.assertRegex(result.stderr, r"^error: HC-RL-A135 ")
        self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())

    def test_broken_configuration_exits_three_with_the_frozen_rule_ids(self) -> None:
        """HC-RL-A131/A92: roles and mapping failures are fail-closed on every subcommand."""
        self.write_plan()
        plan_dir = str(self.plan_path.parent)
        missing_roles = self.copy_skill_config("missing-roles")
        (missing_roles / "roles.toml").unlink()
        invalid_roles = self.copy_skill_config("bad-roles")
        (invalid_roles / "roles.toml").write_text('[planner]\nmodel = "高档"\n', encoding="utf-8")
        syntactically_broken = self.copy_skill_config("broken-mapping")
        (syntactically_broken / "dh-mapping.toml").write_text("not = = toml\n", encoding="utf-8")
        incomplete_mapping = self.copy_skill_config("incomplete-mapping")
        (incomplete_mapping / "dh-mapping.toml").write_text(
            (SKILL_DIR / "dh-mapping.toml").read_text(encoding="utf-8").split("[limits.on_exceed]")[0],
            encoding="utf-8",
        )

        cases = (
            ("HC-RL-A131", missing_roles),
            ("HC-RL-A131", invalid_roles),
            ("HC-RL-A92", syntactically_broken),
            ("HC-RL-A92", incomplete_mapping),
        )
        for rule, config_dir in cases:
            for subcommand in SUBCOMMANDS:
                with self.subTest(rule=rule, config=config_dir.name, subcommand=subcommand):
                    result = self.run_cli(*self.command_argv(subcommand, plan_dir, str(config_dir)))
                    self.assertEqual(3, result.returncode)
                    self.assertEqual("", result.stdout)
                    self.assertRegex(result.stderr, rf"^error: {rule} ")
                    self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())


PLAN_10_1_MARKER = (
    "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-09 session=app "
    "decision_mode=consult recipe=normal cards=DHR_90,DHR_91 -->"
)
PLAN_10_1_DIR = "docs/modules/dh-relay/relay/wave-2026-09/"
PLAN_10_1_NODE_ROWS = (
    "| W1 | DHR_90 | DHR_90:W#1 | build | agent:plan-reviewer | | |",
    "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:checker | W1 | |",
    "| C2 | DHR_90 | DHR_90:C#1 | construction | agent:checker | C1 | |",
    "| R1 | DHR_90 | DHR_90:R#1 | review | agent:scribe | C2 | |",
    "| F1 | DHR_90 | DHR_90:F#1 | handoff | agent:scribe | R1 | |",
)
# §10.1 rows verbatim, plus the agent rows the excerpt omits for C2/R1/F1
# (every active node needs an agent and every close target must exist: A47/A75).
PLAN_10_1_AGENT_ROWS = (
    "| builder | W1 | builder | | task_plan.md | | |",
    "| plan-reviewer | W1 | plan-reviewer | | review.plan.md | on:done:builder | |",
    "| coder | C1 | coder | zcode | (代码与 findings) | | |",
    "| checker | C1 | checker | | check.C1.md | | |",
    "| scribe | C1 | scribe | | progress.md | on:done:coder | |",
    "| decider | C1 | decider | | decision.1.md | on:blocked | |",
    "| coder | C2 | coder | zcode | code.md | | |",
    "| checker | C2 | checker | | check.C2.md | | |",
    "| requirement | R1 | reviewer | | review.requirement.md | | |",
    "| lesson | R1 | reviewer | | review.lesson.md | | |",
    "| scribe | R1 | scribe | | review.md | on:done:requirement | |",
    "| scribe | F1 | scribe | | progress.md | | |",
)
# §10.2 rows verbatim (seq 1-12), then the minimum continuation that realizes the
# §10.3 snapshot: §10.2 stops at stage_start, so C1 is still `ready` there.
LEDGER_10_2_ROWS = (
    ("2026-09-09T09:00:05+08:00", "W1", "plan_loaded", "orchestrator#1",
     "skill=0.1.0 config_dir=C:/Users/Alice%20Li/.claude/skills/relay-light "
     "plan=docs/modules/dh-relay/relay/wave-2026-09 session=app cards=DHR_90,DHR_91"),
    ("2026-09-09T09:00:10+08:00", "W1", "stage_start", "orchestrator#1", "stage_id=DHR_90:W#1"),
    ("2026-09-09T09:00:40+08:00", "W1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:W#1 ws=relay-w1"),
    ("2026-09-09T09:01:02+08:00", "W1", "node_start", "monitor#1", ""),
    ("2026-09-09T09:01:20+08:00", "W1", "agent_launch", "builder#1", "attempt=1"),
    ("2026-09-09T09:40:11+08:00", "W1", "done", "builder#1", "七件套齐，task_plan.md 已写"),
    ("2026-09-09T09:40:30+08:00", "W1", "agent_launch", "plan-reviewer#1", "on:done:builder"),
    ("2026-09-09T10:02:15+08:00", "W1", "done", "plan-reviewer#1", "review.plan.md 已读，无 P0"),
    ("2026-09-09T10:02:30+08:00", "W1", "node_close", "monitor#1", "双判据成立"),
    ("2026-09-09T10:02:35+08:00", "W1", "stage_result", "monitor#1",
     "stage_id=DHR_90:W#1 outcome=done task_plan 已过审"),
    ("2026-09-09T10:02:50+08:00", "W1", "stage_close", "orchestrator#1", "stage_id=DHR_90:W#1"),
    ("2026-09-09T10:03:05+08:00", "C1", "stage_start", "orchestrator#1", "stage_id=DHR_90:C#1"),
    ("2026-09-09T10:03:20+08:00", "C1", "node_start", "monitor#1", ""),
    ("2026-09-09T10:03:30+08:00", "C1", "agent_launch", "coder#1", ""),
    ("2026-09-09T10:31:12+08:00", "C1", "checkpoint", "coder#1", "check.R1 方案已送 checker"),
)
FIXED_NOW = datetime(2026, 9, 9, 10, 43, 52, tzinfo=timezone(timedelta(hours=8)))
STATUS_10_3_TEXT = (
    f"计划：{PLAN_10_1_DIR}   skill=0.1.0   session=app\n"
    "卡：DHR_90, DHR_91      decision_mode=consult\n"
    "当班写入者：monitor（DHR_90:C#1）\n"
    "\n"
    "阶段 DHR_90:W#1  closed   result=done\n"
    "阶段 DHR_90:C#1  open     result=—\n"
    "  节点 C1 construction   open\n"
    "    不可关：coder#1 无终态事件\n"
    "    在场 agent：coder#1  最近 checkpoint @ 10:31:12（静默 00:12:40）\n"
    "  节点 C2 construction   pending\n"
    "阶段 DHR_90:R#1  pending\n"
    "阶段 DHR_90:F#1  pending\n"
)
STATUS_TOP_LEVEL_KEYS = {
    "plan", "open_stages", "current_stage", "current_node", "last_stage_result",
    "suggested_action", "monitor_relaunch_count", "pending_nodes", "superseded_ignored",
    "stages", "nodes", "agents", "errors",
}
STATUS_PLAN_KEYS = {"marker", "cards", "decision_mode"}
STATUS_STAGE_KEYS = {"stage_id", "stage", "card", "k", "state", "nodes", "result"}
STATUS_RESULT_KEYS = {"stage_id", "outcome", "note", "amend", "nodes"}
# design §3.5: the top-level `last_stage_result` table freezes only these three keys;
# `amend`/`nodes` belong to `stages[].result` alone.
STATUS_LAST_RESULT_KEYS = {"stage_id", "outcome", "note"}
STATUS_NODE_KEYS = {"node", "card", "stage", "type", "state", "closable", "reasons"}
STATUS_AGENT_KEYS = {
    "node", "agent", "last_event", "last_ts", "idle_seconds", "launch_fix", "ledger_silent",
}
# A44: status wording restates ledger facts only; these are quality-judgement words.
JUDGEMENT_WORDS = ("合格", "不合格", "质量", "优秀", "正确", "错误", "通过", "pass", "fail", "quality")


class RelayStatusProjectionTests(RelayCliTestCase):
    """Batch 2 (HC-RL-A43/A44/A61/A62/A65/A73/A81/A134): complete read-only status projection."""

    def write_plan_10_1(self) -> None:
        self.write_plan(
            node_rows=list(PLAN_10_1_NODE_ROWS),
            agent_rows=list(PLAN_10_1_AGENT_ROWS),
            marker=PLAN_10_1_MARKER,
        )

    def status_payload(self, plan_dir: Path | None = None) -> dict[str, object]:
        result = self.run_cli("status", "--plan", str(plan_dir or self.plan_path.parent), "--json")
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("", result.stderr)
        document = json.loads(result.stdout)
        missing = STATUS_TOP_LEVEL_KEYS - set(document)
        self.assertEqual(set(), missing, f"status document is missing {sorted(missing)}")
        return document

    def status_text(self, plan_dir: Path | None = None) -> str:
        result = self.run_cli("status", "--plan", str(plan_dir or self.plan_path.parent))
        self.assertEqual(0, result.returncode, result.stderr)
        return result.stdout

    def status_projection(self) -> "relay_log.Status":
        """The injectable-now projection; guarded so a missing contract is reported, not imported."""
        derive = getattr(relay_log, "derive_status", None)
        self.assertIsNotNone(derive, "relay_log.derive_status is not implemented")
        return derive(
            lint_plan(self.plan_path, repo_config()),
            relay_log.read_ledger(self.plan_path.parent / "relay_log.jsonl"),
            now=FIXED_NOW,
        )

    def test_design_10_3_text_snapshot_is_reproduced_line_by_line(self) -> None:
        """HC-RL-A43: six items, plan/skill/session, cards, writer, stage/node/agent detail."""
        self.write_plan_10_1()
        self.write_ledger_rows(LEDGER_10_2_ROWS)
        status = self.status_projection()
        self.assertEqual(STATUS_10_3_TEXT, relay_log.render_status_text(status, PLAN_10_1_DIR))

    def test_design_fixture_projects_the_complete_document(self) -> None:
        """HC-RL-A62/A65/A81: the §10.1+§10.2 fixture has one exact full document."""
        self.write_plan_10_1()
        self.write_ledger_rows(LEDGER_10_2_ROWS)
        status = self.status_projection()
        self.assertEqual(
            {
                "plan": {
                    "marker": PLAN_10_1_MARKER,
                    "cards": ["DHR_90", "DHR_91"],
                    "decision_mode": "consult",
                },
                "open_stages": ["DHR_90:C#1"],
                "current_stage": "DHR_90:C#1",
                "current_node": "C1",
                "last_stage_result": None,
                "suggested_action": "none",
                "monitor_relaunch_count": 0,
                "pending_nodes": ["C2", "R1", "F1"],
                "superseded_ignored": 0,
                "stages": [
                    {
                        "stage_id": "DHR_90:W#1", "stage": "W", "card": "DHR_90", "k": 1,
                        "state": "closed", "nodes": ["W1"],
                        "result": {
                            "stage_id": "DHR_90:W#1", "outcome": "done",
                            "note": "stage_id=DHR_90:W#1 outcome=done task_plan 已过审",
                            "amend": None, "nodes": [],
                        },
                    },
                    {"stage_id": "DHR_90:C#1", "stage": "C", "card": "DHR_90", "k": 1,
                     "state": "open", "nodes": ["C1", "C2"], "result": None},
                    {"stage_id": "DHR_90:R#1", "stage": "R", "card": "DHR_90", "k": 1,
                     "state": "pending", "nodes": ["R1"], "result": None},
                    {"stage_id": "DHR_90:F#1", "stage": "F", "card": "DHR_90", "k": 1,
                     "state": "pending", "nodes": ["F1"], "result": None},
                ],
                "nodes": [
                    {"node": "W1", "card": "DHR_90", "stage": "DHR_90:W#1", "type": "build",
                     "state": "closed", "closable": True, "reasons": []},
                    {"node": "C1", "card": "DHR_90", "stage": "DHR_90:C#1", "type": "construction",
                     "state": "open", "closable": False, "reasons": ["coder#1 无终态事件"]},
                    {"node": "C2", "card": "DHR_90", "stage": "DHR_90:C#1", "type": "construction",
                     "state": "pending", "closable": False, "reasons": ["checker 无 done 终态"]},
                    {"node": "R1", "card": "DHR_90", "stage": "DHR_90:R#1", "type": "review",
                     "state": "pending", "closable": False, "reasons": ["scribe 无 done 终态"]},
                    {"node": "F1", "card": "DHR_90", "stage": "DHR_90:F#1", "type": "handoff",
                     "state": "pending", "closable": False, "reasons": ["scribe 无 done 终态"]},
                ],
                "agents": [
                    {"node": "W1", "agent": "builder#1", "last_event": "done",
                     "last_ts": "2026-09-09T09:40:11+08:00", "idle_seconds": 3821,
                     "launch_fix": None, "ledger_silent": False},
                    {"node": "W1", "agent": "plan-reviewer#1", "last_event": "done",
                     "last_ts": "2026-09-09T10:02:15+08:00", "idle_seconds": 2497,
                     "launch_fix": None, "ledger_silent": False},
                    {"node": "C1", "agent": "coder#1", "last_event": "checkpoint",
                     "last_ts": "2026-09-09T10:31:12+08:00", "idle_seconds": 760,
                     "launch_fix": None, "ledger_silent": False},
                ],
                "errors": [],
            },
            relay_log.status_document(status),
        )

    def test_status_json_schema_keys_types_and_order_are_exact(self) -> None:
        """HC-RL-A62: frozen top-level and nested key contracts, types, ordering and counts."""
        self.write_plan_10_1()
        self.write_ledger_rows(LEDGER_10_2_ROWS)
        payload = self.status_payload()
        self.assertEqual(STATUS_TOP_LEVEL_KEYS, set(payload))
        self.assertEqual(STATUS_PLAN_KEYS, set(payload["plan"]))
        self.assertEqual(["DHR_90", "DHR_91"], payload["plan"]["cards"])
        self.assertEqual("consult", payload["plan"]["decision_mode"])
        self.assertEqual(PLAN_10_1_MARKER, payload["plan"]["marker"])
        self.assertEqual(["DHR_90:C#1"], payload["open_stages"])
        self.assertEqual("DHR_90:C#1", payload["current_stage"])
        self.assertEqual("C1", payload["current_node"])
        self.assertIsNone(payload["last_stage_result"])
        self.assertIn(payload["suggested_action"], SUGGESTED_ACTIONS)
        self.assertIsInstance(payload["monitor_relaunch_count"], int)
        self.assertEqual(["C2", "R1", "F1"], payload["pending_nodes"])
        self.assertEqual(0, payload["superseded_ignored"])
        self.assertEqual([], payload["errors"])
        self.assertEqual(
            ["DHR_90:W#1", "DHR_90:C#1", "DHR_90:R#1", "DHR_90:F#1"],
            [stage["stage_id"] for stage in payload["stages"]],
        )
        self.assertEqual(["closed", "open", "pending", "pending"], [s["state"] for s in payload["stages"]])
        self.assertEqual([1, 1, 1, 1], [s["k"] for s in payload["stages"]])
        self.assertEqual(["W", "C", "R", "F"], [s["stage"] for s in payload["stages"]])
        self.assertEqual(["W1", "C1", "C2", "R1", "F1"], [n["node"] for n in payload["nodes"]])
        self.assertEqual(
            ["closed", "open", "pending", "pending", "pending"],
            [n["state"] for n in payload["nodes"]],
        )
        for stage in payload["stages"]:
            with self.subTest(stage=stage["stage_id"]):
                self.assertEqual(STATUS_STAGE_KEYS, set(stage))
                self.assertIsInstance(stage["k"], int)
                self.assertIsInstance(stage["nodes"], list)
        for node in payload["nodes"]:
            with self.subTest(node=node["node"]):
                self.assertEqual(STATUS_NODE_KEYS, set(node))
                self.assertIsInstance(node["closable"], bool)
                self.assertIsInstance(node["reasons"], list)
        for agent in payload["agents"]:
            with self.subTest(agent=agent["agent"]):
                self.assertEqual(STATUS_AGENT_KEYS, set(agent))
                self.assertIsInstance(agent["idle_seconds"], int)
                self.assertNotIsInstance(agent["idle_seconds"], bool)
        self.assertEqual(
            [("W1", "builder#1", "done"), ("W1", "plan-reviewer#1", "done"), ("C1", "coder#1", "checkpoint")],
            [(a["node"], a["agent"], a["last_event"]) for a in payload["agents"]],
        )
        self.assertEqual(
            ["2026-09-09T09:40:11+08:00", "2026-09-09T10:02:15+08:00", "2026-09-09T10:31:12+08:00"],
            [a["last_ts"] for a in payload["agents"]],
        )

    def test_status_wording_carries_no_quality_judgement(self) -> None:
        """HC-RL-A44: status restates ledger facts; no produce-quality verdict vocabulary."""
        self.write_plan_10_1()
        self.write_ledger_rows(LEDGER_10_2_ROWS)
        rendered = self.status_text() + json.dumps(self.status_payload(), ensure_ascii=False)
        for word in JUDGEMENT_WORDS:
            with self.subTest(word=word):
                self.assertNotIn(word, rendered)

    def test_current_node_and_node_states_follow_the_frozen_table(self) -> None:
        """HC-RL-A61: dependency-unclosed=pending, node_start=open, otherwise ready."""
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
                "| C2 | DHR_90 | DHR_90:C#1 | construction | agent:coder | C1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| coder | C2 | coder | | code.md | | |",
            ],
        )
        empty = self.status_payload()
        self.assertIsNone(empty["current_stage"])
        self.assertIsNone(empty["current_node"])
        self.assertEqual(["W1", "C1", "C2"], empty["pending_nodes"])
        self.assertEqual(["pending", "pending", "pending"], [n["state"] for n in empty["nodes"]])

        self.write_ledger_rows((("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),))
        started = self.status_payload()
        self.assertEqual("W1", started["current_node"])
        self.assertEqual("DHR_90:W#1", started["current_stage"])
        self.assertEqual(["ready", "pending", "pending"], [n["state"] for n in started["nodes"]])
        self.assertEqual(["C1", "C2"], started["pending_nodes"])

        self.write_ledger_rows((
            ("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
            ("2026-09-11T08:01:00+08:00", "W1", "node_start", "monitor#1", ""),
        ))
        open_node = self.status_payload()
        self.assertEqual(["open", "pending", "pending"], [n["state"] for n in open_node["nodes"]])
        self.assertEqual("W1", open_node["current_node"])

        self.write_ledger_rows((
            ("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
            ("2026-09-11T08:01:00+08:00", "W1", "node_start", "monitor#1", ""),
            ("2026-09-11T08:02:00+08:00", "W1", "node_close", "monitor#1", ""),
        ))
        closed_node = self.status_payload()
        self.assertEqual(["closed", "ready", "pending"], [n["state"] for n in closed_node["nodes"]])
        self.assertEqual("C1", closed_node["current_node"])
        self.assertEqual("DHR_90:C#1", closed_node["current_stage"])
        self.assertEqual(["C2"], closed_node["pending_nodes"])

    def test_closed_reads_only_node_close_and_closable_is_independent(self) -> None:
        """HC-RL-A81: closed comes from node_close alone; closable is derived separately."""
        self.write_single_node_plan(["| builder | W1 | builder | | task_plan.md | | |"], close="agent:builder")
        started = (
            ("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
            ("2026-09-11T08:01:00+08:00", "W1", "node_start", "monitor#1", ""),
            ("2026-09-11T08:02:00+08:00", "W1", "agent_launch", "builder#1", ""),
            ("2026-09-11T08:03:00+08:00", "W1", "done", "builder#1", "交付"),
        )
        self.write_ledger_rows(started)
        without_close = self.status_payload()["nodes"][0]
        self.assertEqual("open", without_close["state"])
        self.assertTrue(without_close["closable"])
        self.assertEqual([], without_close["reasons"])

        self.write_ledger_rows(started + (
            ("2026-09-11T08:04:00+08:00", "W1", "node_close", "monitor#1", "双判据成立"),
        ))
        with_close = self.status_payload()["nodes"][0]
        self.assertEqual("closed", with_close["state"])
        self.assertTrue(with_close["closable"])

        self.write_ledger_rows((
            ("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
            ("2026-09-11T08:01:00+08:00", "W1", "agent_launch", "builder#1", ""),
            ("2026-09-11T08:02:00+08:00", "W1", "node_close", "monitor#1", ""),
        ))
        unstarted_close = self.status_payload()["nodes"][0]
        self.assertEqual("closed", unstarted_close["state"])
        self.assertFalse(unstarted_close["closable"])
        self.assertEqual(["builder#1 无终态事件"], unstarted_close["reasons"])

    def test_superseded_rows_only_change_the_ignored_count(self) -> None:
        """HC-RL-A73: superseded rows leave every other projection field identical."""
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
            ],
        )
        self.write_ledger_rows((
            ("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
            ("2026-09-11T08:01:00+08:00", "W1", "node_start", "monitor#1", ""),
        ))
        plain_lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, plain_lint.returncode, plain_lint.stderr)
        plain = self.status_payload()
        self.assertEqual(0, plain["superseded_ignored"])

        self.write_plan(
            node_rows=[
                "| W0 | DHR_90 | DHR_90:W#1 | build | | | superseded-by:W1 |",
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            ],
            agent_rows=[
                "| builder-old | W1 | builder | | old.md | | superseded |",
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
            ],
        )
        superseded_lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, superseded_lint.returncode, superseded_lint.stderr)
        superseded = self.status_payload()
        self.assertEqual(2, superseded["superseded_ignored"])
        superseded.pop("superseded_ignored")
        plain.pop("superseded_ignored")
        self.assertEqual(plain, superseded)
        self.assertNotIn("W0", json.dumps(superseded, ensure_ascii=False))
        self.assertNotIn("builder-old", json.dumps(superseded, ensure_ascii=False))

    def test_unlaunched_agents_are_never_reported_as_dangling(self) -> None:
        """HC-RL-A65: a node whose coder is non-terminal does not make its scribe expected."""
        self.write_plan_10_1()
        self.write_ledger_rows(LEDGER_10_2_ROWS)
        payload = self.status_payload()
        self.assertEqual(["builder#1", "plan-reviewer#1", "coder#1"], [a["agent"] for a in payload["agents"]])
        construction = next(node for node in payload["nodes"] if node["node"] == "C1")
        self.assertEqual(["coder#1 无终态事件"], construction["reasons"])
        self.assertEqual("open", construction["state"])
        for unlaunched in ("checker", "scribe", "decider"):
            with self.subTest(agent=unlaunched):
                self.assertNotIn(unlaunched, json.dumps(payload["agents"], ensure_ascii=False))

    def test_stage_result_projection_carries_five_keys_with_and_without_amend(self) -> None:
        """HC-RL-A62: top-level `last_stage_result` freezes three keys; `stages[].result` five."""
        self.write_plan(
            node_rows=[
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | | |",
                "| C2 | DHR_90 | DHR_90:C#1 | construction | agent:coder | C1 | |",
            ],
            agent_rows=[
                "| coder | C1 | coder | | code.md | | |",
                "| coder | C2 | coder | | code.md | | |",
            ],
        )
        prefix = (
            ("2026-09-11T08:00:00+08:00", "C1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
            ("2026-09-11T08:01:00+08:00", "C1", "stage_start", "orchestrator#1", "stage_id=DHR_90:C#1"),
            ("2026-09-11T08:02:00+08:00", "C1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:C#1"),
            ("2026-09-11T08:03:00+08:00", "C1", "node_start", "monitor#1", ""),
            ("2026-09-11T08:04:00+08:00", "C1", "agent_launch", "coder#1", ""),
            ("2026-09-11T08:05:00+08:00", "C1", "done", "coder#1", "交付"),
            ("2026-09-11T08:06:00+08:00", "C1", "node_close", "monitor#1", "双判据成立"),
        )
        amended_note = "stage_id=DHR_90:C#1 outcome=done amend=decision.2.md nodes=C3,C4 本批完成，计划已追加两节点"
        self.write_ledger_rows(prefix + (
            ("2026-09-11T08:07:00+08:00", "C1", "plan_amend", "monitor#1", "decision.2.md nodes=C3,C4"),
            ("2026-09-11T08:08:00+08:00", "C1", "stage_result", "monitor#1", amended_note),
        ))
        amended = self.status_payload()
        # The stage-level result keeps the two plan-amend projection fields ...
        self.assertEqual(
            {
                "stage_id": "DHR_90:C#1", "outcome": "done", "note": amended_note,
                "amend": "decision.2.md", "nodes": ["C3", "C4"],
            },
            amended["stages"][0]["result"],
        )
        self.assertEqual(STATUS_RESULT_KEYS, set(amended["stages"][0]["result"]))
        # ... while the top-level summary carries exactly the three frozen keys.
        self.assertEqual(
            {"stage_id": "DHR_90:C#1", "outcome": "done", "note": amended_note},
            amended["last_stage_result"],
        )
        self.assertEqual(STATUS_LAST_RESULT_KEYS, set(amended["last_stage_result"]))
        self.assertEqual("DHR_90:C#1", amended["current_stage"])
        self.assertEqual("C2", amended["current_node"])

        plain_note = "stage_id=DHR_90:C#1 outcome=done 本批完成"
        self.write_ledger_rows(prefix + (
            ("2026-09-11T08:08:00+08:00", "C1", "stage_result", "monitor#1", plain_note),
        ))
        plain = self.status_payload()
        self.assertEqual(
            {"stage_id": "DHR_90:C#1", "outcome": "done", "note": plain_note, "amend": None, "nodes": []},
            plain["stages"][0]["result"],
        )
        self.assertEqual(
            {"stage_id": "DHR_90:C#1", "outcome": "done", "note": plain_note},
            plain["last_stage_result"],
        )
        self.assertEqual(STATUS_LAST_RESULT_KEYS, set(plain["last_stage_result"]))

    def test_plan_without_checker_passes_lint_and_status_without_a_dangling_agent(self) -> None:
        """HC-RL-A134: a C plan with the checker removed still lints and projects cleanly."""
        coder_ledger = (
            ("2026-09-11T08:00:00+08:00", "C1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
            ("2026-09-11T08:00:30+08:00", "C1", "stage_start", "orchestrator#1", "stage_id=DHR_90:C#1"),
            ("2026-09-11T08:00:45+08:00", "C1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:C#1"),
            ("2026-09-11T08:01:00+08:00", "C1", "node_start", "monitor#1", ""),
            ("2026-09-11T08:02:00+08:00", "C1", "agent_launch", "coder#1", ""),
            ("2026-09-11T08:03:00+08:00", "C1", "done", "coder#1", "交付"),
        )
        cases = (
            (
                "close=agent:checker",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:checker | | |",
                ["| coder | C1 | coder | | code.md | | |", "| checker | C1 | checker | | check.md | | |"],
                coder_ledger + (("2026-09-11T08:04:00+08:00", "C1", "agent_launch", "checker#1", ""),),
                ["checker#1 无终态事件"],
                True,
            ),
            (
                "close empty",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | | |",
                ["| coder | C1 | coder | | code.md | | |", "| scribe | C1 | scribe | | progress.md | on:done:coder | |"],
                coder_ledger,
                [],
                False,
            ),
            (
                "close=agent:scribe",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:scribe | | |",
                ["| coder | C1 | coder | | code.md | | |", "| scribe | C1 | scribe | | progress.md | on:done:coder | |"],
                coder_ledger,
                ["scribe 无 done 终态"],
                False,
            ),
        )
        for name, node_row, agent_rows, ledger, expected_reasons, has_checker in cases:
            with self.subTest(case=name):
                self.reset_ledger()
                self.write_plan(node_rows=[node_row], agent_rows=agent_rows)
                lint = self.run_lint_cli(self.plan_path.parent)
                self.assertEqual(0, lint.returncode, lint.stderr)
                self.assertEqual("lint: ok\n", lint.stdout)
                self.write_ledger_rows(ledger)
                payload = self.status_payload()
                self.assertEqual(expected_reasons, payload["nodes"][0]["reasons"])
                self.assertEqual(expected_reasons == [], payload["nodes"][0]["closable"])
                self.assertEqual([], payload["errors"])
                if not has_checker:
                    self.assertNotIn("checker", json.dumps(payload, ensure_ascii=False))

    def test_status_is_read_only_and_never_rejects_ledger_problems(self) -> None:
        """HC-RL-A44: status adds nothing, judges nothing, and reports anomalies without failing."""
        self.write_plan_10_1()
        ledger_path = self.write_ledger_rows(LEDGER_10_2_ROWS)
        malformed = self.write_ledger_rows(LEDGER_10_2_ROWS + (
            ("2026-09-11T08:09:00+08:00", "C1", "stage_result", "monitor#1",
             "stage_id=DHR_90:C#1 outcome=maybe 表结构有二义"),
        ))
        before_malformed = malformed.read_bytes()
        before_entries = sorted(path.name for path in self.plan_path.parent.iterdir())

        payload = self.status_payload()
        self.assertEqual(before_malformed, ledger_path.read_bytes())
        self.assertEqual(before_entries, sorted(path.name for path in self.plan_path.parent.iterdir()))
        self.assertEqual(["closed", "open", "pending", "pending", "pending"], [n["state"] for n in payload["nodes"]])
        self.assertNotEqual([], payload["errors"])
        self.assertTrue(all(isinstance(message, str) for message in payload["errors"]))
        for message in payload["errors"]:
            with self.subTest(message=message):
                self.assertIn("outcome", message)
        self.assertIsNone(payload["stages"][1]["result"])
        rendered = self.status_text()
        self.assertIn("阶段 DHR_90:C#1  open     result=—", rendered)
        self.assertEqual(before_malformed, ledger_path.read_bytes())

    def test_status_reports_the_last_writer_and_silence_without_driving_actions(self) -> None:
        """HC-RL-A43: the on-duty writer and per-agent silence are ledger facts, not commands."""
        self.write_plan_10_1()
        self.write_ledger_rows(LEDGER_10_2_ROWS)
        status = self.status_projection()
        self.assertEqual("monitor", status.last_writer)
        self.assertEqual("DHR_90:C#1", status.last_writer_stage)
        self.assertEqual(760, status.agents[2].idle_seconds)
        rendered = relay_log.render_status_text(status, PLAN_10_1_DIR)
        self.assertIn("当班写入者：monitor（DHR_90:C#1）", rendered)
        self.assertIn("最近 checkpoint @ 10:31:12（静默 00:12:40）", rendered)
        self.assertIn("不可关：coder#1 无终态事件", rendered)

    def test_status_rereads_appended_stage_in_plan_order(self) -> None:
        """HC-RL-A121: status re-reads the same plan; an appended X instance lands in plan order."""
        # 非 WCRF 计划（W → C → X#1，无 R/F）：两次 status 之间只改同一
        # relay_plan.md，追加 X#2 节点行及 A75/A24 所需的 agent 行。
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
                "| X1 | DHR_90 | DHR_90:X#1 | rework | | C1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| coder | X1 | coder | | rework.1.md | | |",
            ],
        )
        ledger_path = self.write_ledger_rows(
            (
                ("2026-09-14T09:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
                ("2026-09-14T09:01:00+08:00", "W1", "stage_start", "orchestrator#1", "stage_id=DHR_90:W#1"),
                ("2026-09-14T09:02:00+08:00", "W1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:W#1"),
                ("2026-09-14T09:03:00+08:00", "W1", "node_start", "monitor#1", ""),
                ("2026-09-14T09:04:00+08:00", "W1", "agent_launch", "builder#1", ""),
                ("2026-09-14T09:05:00+08:00", "W1", "done", "builder#1", ""),
                ("2026-09-14T09:06:00+08:00", "W1", "node_close", "monitor#1", ""),
                ("2026-09-14T09:07:00+08:00", "W1", "stage_result", "monitor#1", "stage_id=DHR_90:W#1 outcome=done"),
                ("2026-09-14T09:08:00+08:00", "W1", "stage_close", "orchestrator#1", "stage_id=DHR_90:W#1"),
                ("2026-09-14T09:09:00+08:00", "C1", "stage_start", "orchestrator#1", "stage_id=DHR_90:C#1"),
                ("2026-09-14T09:10:00+08:00", "C1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:C#1"),
                ("2026-09-14T09:11:00+08:00", "C1", "node_start", "monitor#1", ""),
                ("2026-09-14T09:12:00+08:00", "C1", "agent_launch", "coder#1", ""),
            )
        )
        first = self.status_payload()
        self.assertEqual(
            ["DHR_90:W#1", "DHR_90:C#1", "DHR_90:X#1"],
            [stage["stage_id"] for stage in first["stages"]],
        )
        self.assertEqual("DHR_90:C#1", first["current_stage"])
        self.assertEqual([], first["errors"])

        module = Path(relay_log.__file__)
        code_hash = hashlib.sha256(module.read_bytes()).hexdigest()
        ledger_hash = hashlib.sha256(ledger_path.read_bytes()).hexdigest()
        plan_dir_hashes = {
            path.name: hashlib.sha256(path.read_bytes()).hexdigest()
            for path in self.plan_path.parent.iterdir()
            if path.is_file()
        }

        # Between the two status calls: same plan file only — append the X#2 node
        # row to the node-table tail and its agent row to the agent-table tail.
        plan_text = self.plan_path.read_text(encoding="utf-8")
        node_row = "| X2 | DHR_90 | DHR_90:X#2 | rework | | X1 | |"
        agent_row = "| coder | X2 | coder | | rework.2.md | | |"
        self.assertIn("\n\n## agent 表\n", plan_text)
        plan_text = plan_text.replace(
            "\n\n## agent 表\n", f"\n{node_row}\n\n## agent 表\n", 1
        )
        plan_text = plan_text.rstrip("\n") + f"\n{agent_row}\n"
        self.plan_path.write_text(plan_text, encoding="utf-8")

        second = self.status_payload()
        self.assertEqual(
            ["DHR_90:W#1", "DHR_90:C#1", "DHR_90:X#1", "DHR_90:X#2"],
            [stage["stage_id"] for stage in second["stages"]],
        )
        self.assertEqual(first["stages"], second["stages"][: len(first["stages"])])
        self.assertEqual(
            {
                "stage_id": "DHR_90:X#2", "stage": "X", "card": "DHR_90", "k": 2,
                "state": "pending", "nodes": ["X2"], "result": None,
            },
            second["stages"][-1],
        )
        self.assertIn("X2", second["pending_nodes"])
        self.assertEqual([], second["errors"])

        self.assertEqual(code_hash, hashlib.sha256(module.read_bytes()).hexdigest())
        self.assertEqual(ledger_hash, hashlib.sha256(ledger_path.read_bytes()).hexdigest())
        after_hashes = {
            path.name: hashlib.sha256(path.read_bytes()).hexdigest()
            for path in self.plan_path.parent.iterdir()
            if path.is_file()
        }
        self.assertEqual(set(plan_dir_hashes), set(after_hashes))
        changed = {
            name for name in plan_dir_hashes if plan_dir_hashes[name] != after_hashes[name]
        }
        self.assertEqual({"relay_plan.md"}, changed)

        # A75 regression: an appended node without an active agent is still rejected.
        plan_text = self.plan_path.read_text(encoding="utf-8")
        orphan_row = "| F1 | DHR_90 | DHR_90:F#1 | handoff | | X2 | |"
        plan_text = plan_text.replace(
            "\n\n## agent 表\n", f"\n{orphan_row}\n\n## agent 表\n", 1
        )
        self.plan_path.write_text(plan_text, encoding="utf-8")
        result = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(3, result.returncode)
        self.assertEqual("", result.stdout)
        self.assertRegex(result.stderr, r"^error: HC-RL-A75 ")


DESIGN_10_2_ADDS = (
    ("W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
    ("W1", "stage_start", "orchestrator#1", "stage_id=DHR_90:W#1"),
    ("W1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:W#1 ws=relay-w1"),
    ("W1", "node_start", "monitor#1", ""),
    ("W1", "agent_launch", "builder#1", "attempt=1"),
    ("W1", "done", "builder#1", "七件套齐，task_plan.md 已写"),
    ("W1", "agent_launch", "plan-reviewer#1", "on:done:builder"),
    ("W1", "done", "plan-reviewer#1", "review.plan.md 已读，无 P0"),
    ("W1", "node_close", "monitor#1", "双判据成立"),
    ("W1", "stage_result", "monitor#1", "stage_id=DHR_90:W#1 outcome=done task_plan 已过审"),
    ("W1", "stage_close", "orchestrator#1", "stage_id=DHR_90:W#1"),
    ("C1", "stage_start", "orchestrator#1", "stage_id=DHR_90:C#1"),
)
# §10.2 写入者区间：编排 1-3、监工 4-10、编排 11-12（A93）
DESIGN_10_2_WRITERS = ("orchestrator",) * 3 + ("monitor",) * 7 + ("orchestrator",) * 2


class RelayLifecycleTests(RelayCliTestCase):
    """Batch 3 (HC-RL-A85/A89/A93/A105/A106/A110/A111/A112/A118): add-side stage lifecycle."""

    def write_design_plan(self) -> None:
        self.write_plan(
            node_rows=list(PLAN_10_1_NODE_ROWS),
            agent_rows=list(PLAN_10_1_AGENT_ROWS),
            marker=PLAN_10_1_MARKER,
        )

    def write_stage_plan(self) -> None:
        """DHR_90: `W#1`, a two-node `C#1`, and an `R#1` instance that can stay unstarted."""
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
                "| C2 | DHR_90 | DHR_90:C#1 | construction | agent:coder | C1 | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | agent:requirement | C2 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| coder | C2 | coder | | code.md | | |",
                "| requirement | R1 | reviewer | | review.requirement.md | | |",
                "| lesson | R1 | reviewer | | review.lesson.md | | |",
            ],
        )

    def add_ok(self, event: str, *, node: str = "W1", agent: str = "monitor#1", note: str = "") -> None:
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)

    def assert_rejected(
        self, event: str, *, code: str, node: str = "W1", agent: str = "monitor#1", note: str = ""
    ) -> subprocess.CompletedProcess[str]:
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        before = ledger_path.read_bytes() if ledger_path.exists() else None
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)
        self.assertRegex(result.stderr, rf"^error: {code} ")
        after = ledger_path.read_bytes() if ledger_path.exists() else None
        self.assertEqual(before, after, "a rejected add must not touch ledger bytes")
        return result

    def ledger_rows(self) -> list[dict[str, object]]:
        return [
            json.loads(line)
            for line in (self.plan_path.parent / "relay_log.jsonl").read_text(encoding="utf-8").splitlines()
        ]

    def drive_closed_w_stage(self) -> None:
        """A fully closed `DHR_90:W#1` instance ending with stage_close (§5.2.1 order)."""
        self.add_ok("plan_loaded", agent="orchestrator#1", note="skill=0.1.0")
        self.add_ok("stage_start", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("monitor_launch", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("node_start", node="W1")
        self.add_ok("agent_launch", node="W1", agent="builder#1")
        self.add_ok("done", node="W1", agent="builder#1")
        self.add_ok("node_close", node="W1")
        self.add_ok("stage_result", note="stage_id=DHR_90:W#1 outcome=done 本阶段收尾")
        self.add_ok("stage_close", agent="orchestrator#1", note="stage_id=DHR_90:W#1")

    def close_node(self, node: str) -> None:
        """Drive one node to a legal node_close (launch → done → close)."""
        self.add_ok("node_start", node=node)
        self.add_ok("agent_launch", node=node, agent="coder#1")
        self.add_ok("done", node=node, agent="coder#1")
        self.add_ok("node_close", node=node)

    def close_node_with_loss(self, node: str) -> None:
        """HC-RL-A137 夹具：节点内留一条 coder#1 agent_lost（实例最新事件），
        coder#2 done 满足 close=agent:coder——供 blocked/failed 的合法 ref= 目标。"""
        self.add_ok("node_start", node=node)
        self.add_ok("agent_launch", node=node, agent="coder#1")
        self.add_ok("agent_lost", node=node, agent="coder#1", note="pane 失联")
        self.add_ok("agent_launch", node=node, agent="coder#2")
        self.add_ok("done", node=node, agent="coder#2")
        self.add_ok("node_close", node=node)

    def drive_open_c_instance(self) -> None:
        """Start `DHR_90:C#1` and close its first node; `C2` is left open."""
        self.add_ok("stage_start", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("monitor_launch", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.close_node("C1")

    def status_payload(self) -> dict[str, object]:
        result = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(0, result.returncode, result.stderr)
        return json.loads(result.stdout)

    def test_design_10_2_sequence_is_accepted_in_order_with_writer_runs(self) -> None:
        """HC-RL-A89/A93/A105/A112: the §10.2 sequence is accepted row by row, in partition order."""
        self.write_design_plan()
        for node, event, agent, note in DESIGN_10_2_ADDS:
            with self.subTest(event=event):
                self.add_ok(event, node=node, agent=agent, note=note)
        rows = self.ledger_rows()
        self.assertEqual(list(range(1, 13)), [row["seq"] for row in rows])
        self.assertEqual(list(DESIGN_10_2_WRITERS), [row["by"] for row in rows])

        payload = self.status_payload()
        self.assertEqual("closed", payload["stages"][0]["state"])
        self.assertEqual("done", payload["stages"][0]["result"]["outcome"])
        self.assertEqual("open", payload["stages"][1]["state"])
        self.assertIsNone(payload["last_stage_result"])
        self.assertEqual("C1", payload["current_node"])
        self.assertEqual(["DHR_90:C#1"], payload["open_stages"])
        self.assertEqual([], payload["errors"])

    def test_stage_result_and_close_preconditions_exit_two(self) -> None:
        """HC-RL-A112/A89/A105: result-before-close and illegal stage_close are fail closed."""
        self.write_stage_plan()
        self.drive_closed_w_stage()
        self.drive_open_c_instance()
        self.assert_rejected(
            "stage_result", code="HC-RL-A112", note="stage_id=DHR_90:C#1 outcome=done 未关节点"
        )
        self.assert_rejected("stage_close", code="HC-RL-A89", agent="orchestrator#1",
                             note="stage_id=DHR_90:C#1")
        self.assert_rejected("stage_start", code="HC-RL-A89", node="C1", agent="orchestrator#1",
                             note="stage_id=DHR_90:C#1")
        # R#1 exists in the plan but never started: this must hit the
        # "monitor_launch must follow stage_start" branch, not the unknown-stage one.
        launch_before_start = self.assert_rejected(
            "monitor_launch", code="HC-RL-A89", node="R1", agent="orchestrator#1",
            note="stage_id=DHR_90:R#1",
        )
        self.assertIn("must follow stage_start", launch_before_start.stderr)
        self.assert_rejected("stage_start", code="HC-RL-A89", node="W1", agent="orchestrator#1", note="")
        self.assert_rejected("plan_loaded", code="HC-RL-A89", agent="orchestrator#1", note="skill=0.2.0")
        self.assert_rejected(
            "stage_result", code="HC-RL-A105", note="outcome=done 缺 stage_id"
        )
        self.assert_rejected(
            "stage_result", code="HC-RL-A105", note="stage_id=DHR_90:C#1 outcome=maybe"
        )
        self.assert_rejected(
            "stage_result", code="HC-RL-A105", note="stage_id=DHR_90:X#9 outcome=done"
        )

        self.close_node("C2")
        self.assert_rejected("stage_close", code="HC-RL-A112", agent="orchestrator#1",
                             note="stage_id=DHR_90:C#1")

    def test_blocked_and_cancelled_finales_follow_the_frozen_rules(self) -> None:
        """HC-RL-A118: blocked cannot close; cancelled must cite user_decision; both终局 then close."""
        self.write_stage_plan()
        self.drive_closed_w_stage()
        self.drive_open_c_instance()
        self.close_node_with_loss("C2")
        self.add_ok("stage_result", note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#1:agent_lost 表结构有二义")
        self.assert_rejected("stage_close", code="HC-RL-A118", agent="orchestrator#1",
                             note="stage_id=DHR_90:C#1")
        self.assert_rejected(
            "stage_result", code="HC-RL-A118",
            note="stage_id=DHR_90:C#1 outcome=cancelled 停卡",
        )
        self.add_ok(
            "stage_result",
            note="stage_id=DHR_90:C#1 outcome=cancelled 引用上条 user_decision，停卡",
        )
        # A106 routing is observable while the instance is still open awaiting stage_close.
        cancelled = self.status_payload()
        self.assertEqual("cancelled", cancelled["last_stage_result"]["outcome"])
        self.assertEqual("open_next_stage", cancelled["suggested_action"])
        self.assertEqual("open", cancelled["stages"][1]["state"])
        self.add_ok("stage_close", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        closed = self.status_payload()
        self.assertEqual("closed", closed["stages"][1]["state"])
        self.assertEqual([], closed["open_stages"])
        self.assertIsNone(closed["last_stage_result"])
        self.assertEqual("none", closed["suggested_action"])

        self.reset_ledger()
        self.drive_closed_w_stage()
        self.drive_open_c_instance()
        self.close_node_with_loss("C2")
        self.add_ok("stage_result", note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#1:agent_lost 先阻塞")
        self.assert_rejected("stage_close", code="HC-RL-A118", agent="orchestrator#1",
                             note="stage_id=DHR_90:C#1")
        self.add_ok("stage_result", note="stage_id=DHR_90:C#1 outcome=done 用户裁决后继续")
        resumed = self.status_payload()
        self.assertEqual("done", resumed["last_stage_result"]["outcome"])
        self.assertEqual("open_next_stage", resumed["suggested_action"])
        # A105: the instance keeps a history of results but only the newest one is read.
        self.assertEqual("done", resumed["stages"][1]["result"]["outcome"])
        self.assertEqual(
            "stage_id=DHR_90:C#1 outcome=done 用户裁决后继续",
            resumed["stages"][1]["result"]["note"],
        )
        self.add_ok("stage_close", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.assertEqual("closed", self.status_payload()["stages"][1]["state"])

    def test_writer_consistency_exits_two_for_every_frozen_owner(self) -> None:
        """HC-RL-A85: each event has exactly one legal writer, checked before it is appended."""
        self.write_stage_plan()
        self.assert_rejected("plan_loaded", code="HC-RL-A85", agent="monitor#7", note="skill=0.1.0")
        self.drive_closed_w_stage()
        for event, agent, note in (
            ("stage_start", "monitor#1", "stage_id=DHR_90:C#1"),
            ("node_start", "orchestrator#1", ""),
            ("node_close", "orchestrator#1", ""),
            ("monitor_restart", "orchestrator#1", ""),
            ("stage_result", "orchestrator#1", "stage_id=DHR_90:C#1 outcome=done"),
            ("plan_amend", "orchestrator#1", "decision.2.md nodes=C3"),
            ("agent_launch", "orchestrator#1", ""),
            ("checkpoint", "orchestrator#1", ""),
        ):
            with self.subTest(event=event, agent=agent):
                self.assert_rejected(event, code="HC-RL-A85", agent=agent, note=note)

    def test_writer_handoff_forbids_writes_after_the_instance_closed(self) -> None:
        """HC-RL-A93: stage_close ends the instance's write window."""
        self.write_stage_plan()
        self.drive_closed_w_stage()
        self.assert_rejected("monitor_restart", code="HC-RL-A93", node="W1", agent="monitor#1")
        self.assert_rejected(
            "stage_result", code="HC-RL-A93", note="stage_id=DHR_90:W#1 outcome=done 再写一条"
        )
        self.drive_open_c_instance()
        self.close_node("C2")
        self.add_ok("stage_result", note="stage_id=DHR_90:C#1 outcome=done 收尾")
        self.add_ok("stage_close", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.assert_rejected(
            "stage_result", code="HC-RL-A93", note="stage_id=DHR_90:C#1 outcome=done 关后补写"
        )

    def test_four_outcomes_drive_suggested_action_and_relaunch_count(self) -> None:
        """HC-RL-A106/A105: outcome → suggested_action, with failed relaunching the monitor once."""
        expectations = {
            "done": "open_next_stage",
            "cancelled": "open_next_stage",
            "blocked": "wait_user",
            "failed": "relaunch_monitor",
        }
        for outcome, expected in expectations.items():
            with self.subTest(outcome=outcome):
                self.reset_ledger()
                self.write_stage_plan()
                self.drive_closed_w_stage()
                self.drive_open_c_instance()
                note = f"stage_id=DHR_90:C#1 outcome={outcome}"
                if outcome in {"blocked", "failed"}:
                    # A137: 非终态结果必须 ref 本实例内最新为 blocked/agent_lost 的 agent
                    self.close_node_with_loss("C2")
                    note += " ref=coder#1:agent_lost"
                else:
                    self.close_node("C2")
                if outcome == "cancelled":
                    note += " 引用上条 user_decision，停卡"
                self.add_ok("stage_result", note=note)
                payload = self.status_payload()
                self.assertEqual(outcome, payload["last_stage_result"]["outcome"])
                self.assertEqual(expected, payload["suggested_action"])
                self.assertIn(payload["suggested_action"], SUGGESTED_ACTIONS)

        self.reset_ledger()
        self.write_stage_plan()
        self.drive_closed_w_stage()
        self.drive_open_c_instance()
        self.close_node_with_loss("C2")
        self.add_ok("stage_result", note="stage_id=DHR_90:C#1 outcome=failed ref=coder#1:agent_lost 复核未过")
        failed_once = self.status_payload()
        self.assertEqual("relaunch_monitor", failed_once["suggested_action"])
        self.assertEqual(0, failed_once["monitor_relaunch_count"])
        self.add_ok("monitor_launch", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("stage_result", note="stage_id=DHR_90:C#1 outcome=failed ref=coder#1:agent_lost 重拉后仍未过")
        failed_twice = self.status_payload()
        self.assertEqual(1, failed_twice["monitor_relaunch_count"])
        self.assertEqual("notify_user", failed_twice["suggested_action"])
        self.assertIn(failed_twice["suggested_action"], SUGGESTED_ACTIONS)

        self.add_ok("stage_result", note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#1:agent_lost 先阻塞")
        self.add_ok("stage_result", note="stage_id=DHR_90:C#1 outcome=done 用户裁决后继续")
        self.assertEqual("done", self.status_payload()["last_stage_result"]["outcome"])

    def test_repeated_stage_instances_stay_independent_and_alert_on_double_open(self) -> None:
        """HC-RL-A110/A111: R#1 and R#2 keep their own results; same-card double open是报警项."""
        self.write_plan(
            node_rows=[
                "| R1 | DHR_90 | DHR_90:R#1 | review | | | |",
                "| R2 | DHR_90 | DHR_90:R#2 | review | | | |",
            ],
            agent_rows=[
                "| requirement | R1 | reviewer | | review.requirement.md | | |",
                "| lesson | R1 | reviewer | | review.lesson.md | | |",
                "| requirement | R2 | reviewer | | review.requirement.md | | |",
                "| lesson | R2 | reviewer | | review.lesson.md | | |",
            ],
        )
        self.add_ok("plan_loaded", node="R1", agent="orchestrator#1", note="skill=0.1.0")
        self.add_ok("stage_start", node="R1", agent="orchestrator#1", note="stage_id=DHR_90:R#1")
        self.add_ok("monitor_launch", node="R1", agent="orchestrator#1", note="stage_id=DHR_90:R#1")
        self.add_ok("node_start", node="R1")
        self.add_ok("agent_launch", node="R1", agent="requirement#1")
        self.add_ok("agent_lost", node="R1", agent="requirement#1", note="pane 失联")
        self.add_ok("agent_launch", node="R1", agent="requirement#2")
        self.add_ok("done", node="R1", agent="requirement#2")
        self.add_ok("node_close", node="R1")
        self.add_ok("stage_result", node="R1", note="stage_id=DHR_90:R#1 outcome=failed ref=requirement#1:agent_lost 复核未过")

        self.add_ok("stage_start", node="R2", agent="orchestrator#1", note="stage_id=DHR_90:R#2")
        self.add_ok("monitor_launch", node="R2", agent="orchestrator#1", note="stage_id=DHR_90:R#2")
        double_open = self.status_payload()
        self.assertEqual(["DHR_90:R#1", "DHR_90:R#2"], double_open["open_stages"])
        self.assertTrue(
            any("HC-RL-A111" in message for message in double_open["errors"]),
            double_open["errors"],
        )

        self.add_ok("node_start", node="R2")
        self.add_ok("agent_launch", node="R2", agent="requirement#1")
        self.add_ok("done", node="R2", agent="requirement#1")
        self.add_ok("node_close", node="R2")
        self.add_ok("stage_result", node="R2", note="stage_id=DHR_90:R#2 outcome=done 复核通过")
        self.add_ok("stage_close", node="R2", agent="orchestrator#1", note="stage_id=DHR_90:R#2")

        payload = self.status_payload()
        self.assertEqual("failed", payload["stages"][0]["result"]["outcome"])
        self.assertEqual("done", payload["stages"][1]["result"]["outcome"])
        self.assertEqual("closed", payload["stages"][1]["state"])
        self.assertEqual(["DHR_90:R#1"], payload["open_stages"])
        self.assertEqual([], payload["errors"])

    def test_open_stages_lists_cross_card_parallel_instances(self) -> None:
        """HC-RL-A111: two cards may hold an open instance each without any alert."""
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| W2 | DHR_91 | DHR_91:W#1 | build | agent:builder | | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| builder | W2 | builder | | task_plan.md | | |",
            ],
            marker=(
                "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-11 "
                "session=app recipe=normal cards=DHR_90,DHR_91 -->"
            ),
        )
        self.add_ok("plan_loaded", node="W1", agent="orchestrator#1", note="skill=0.1.0")
        for node, stage_id in (("W1", "DHR_90:W#1"), ("W2", "DHR_91:W#1")):
            self.add_ok("stage_start", node=node, agent="orchestrator#1", note=f"stage_id={stage_id}")
            self.add_ok("monitor_launch", node=node, agent="orchestrator#1", note=f"stage_id={stage_id}")
        payload = self.status_payload()
        self.assertEqual(["DHR_90:W#1", "DHR_91:W#1"], payload["open_stages"])
        self.assertEqual([], payload["errors"])

    def test_status_alerts_writer_and_handoff_violations_read_only(self) -> None:
        """HC-RL-A85/A93: a legacy ledger is reported, never rewritten or rejected."""
        self.write_stage_plan()
        rows = (
            ("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
            ("2026-09-11T08:01:00+08:00", "W1", "stage_start", "monitor#1", "stage_id=DHR_90:W#1"),
            ("2026-09-11T08:02:00+08:00", "W1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:W#1"),
            ("2026-09-11T08:03:00+08:00", "W1", "node_start", "orchestrator#1", ""),
            ("2026-09-11T08:04:00+08:00", "W1", "agent_launch", "monitor#1", ""),
            ("2026-09-11T08:05:00+08:00", "W1", "done", "monitor#1", ""),
            ("2026-09-11T08:06:00+08:00", "W1", "node_close", "monitor#1", ""),
            ("2026-09-11T08:07:00+08:00", "W1", "stage_result", "monitor#1",
             "stage_id=DHR_90:W#1 outcome=done 收尾"),
            ("2026-09-11T08:08:00+08:00", "W1", "stage_close", "orchestrator#1", "stage_id=DHR_90:W#1"),
            ("2026-09-11T08:09:00+08:00", "W1", "monitor_restart", "monitor#1", "关后重拉"),
        )
        ledger_path = self.write_ledger_rows(rows)
        before = ledger_path.read_bytes()
        payload = self.status_payload()
        self.assertEqual(before, ledger_path.read_bytes())
        errors = payload["errors"]
        for code, event in (("HC-RL-A85", "stage_start"), ("HC-RL-A85", "node_start"),
                            ("HC-RL-A93", "monitor_restart")):
            with self.subTest(code=code, event=event):
                self.assertTrue(
                    any(code in message and event in message for message in errors), errors
                )
        self.assertEqual("DHR_90:W#1", payload["stages"][0]["stage_id"])
        self.assertEqual("DHR_90:C#1", payload["current_stage"])

    def test_monitor_owned_events_need_their_instances_stage_start(self) -> None:
        """HC-RL-A93: monitor writes only inside the instance's stage_start..stage_close window."""
        self.write_stage_plan()
        self.add_ok("plan_loaded", agent="orchestrator#1", note="skill=0.1.0")
        # Nothing has started: monitor-owned writes into W#1 or C#1 are pre-start.
        # (stage_result/agent rows are already sealed transitively via A112/A78/A60.)
        for event, node, note in (
            ("node_start", "W1", ""),
            ("monitor_restart", "W1", "盘点结果"),
            ("plan_amend", "W1", "decision.9.md nodes=C9"),
            ("monitor_restart", "C1", "盘点结果"),
        ):
            with self.subTest(event=event, node=node):
                self.assert_rejected(event, code="HC-RL-A93", node=node, note=note)
        # plan_loaded is already in the ledger; drive the rest of W#1 to its close.
        self.add_ok("stage_start", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("monitor_launch", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("node_start", node="W1")
        self.add_ok("agent_launch", node="W1", agent="builder#1")
        self.add_ok("done", node="W1", agent="builder#1")
        self.add_ok("node_close", node="W1")
        self.add_ok("stage_result", note="stage_id=DHR_90:W#1 outcome=done 本阶段收尾")
        self.add_ok("stage_close", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        # C#1 exists but never started; its dependencies closing does not open a window.
        for event, node, note in (
            ("node_start", "C1", ""),
            ("monitor_restart", "C1", "盘点结果"),
            ("plan_amend", "C1", "decision.9.md nodes=C9"),
        ):
            with self.subTest(event=event, node=node):
                self.assert_rejected(event, code="HC-RL-A93", node=node, note=note)

    def test_stage_close_requires_a_monitor_launch(self) -> None:
        """HC-RL-A89/§3.4: an instance needs at least one monitor_launch before it can close."""
        self.write_stage_plan()
        self.drive_closed_w_stage()
        # Drive C#1 with stage_start but no monitor_launch at all.
        self.add_ok("stage_start", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.close_node("C1")
        self.close_node("C2")
        self.add_ok("stage_result", node="C1", note="stage_id=DHR_90:C#1 outcome=done 收尾")
        self.assert_rejected(
            "stage_close", code="HC-RL-A89", agent="orchestrator#1", note="stage_id=DHR_90:C#1"
        )
        self.add_ok("monitor_launch", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("stage_close", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.assertEqual("closed", self.status_payload()["stages"][1]["state"])

    def test_node_scoped_events_cannot_claim_a_foreign_stage(self) -> None:
        """HC-RL-A93: a `stage_id=` note cannot reattribute a node's row to another instance."""
        self.write_stage_plan()
        self.drive_closed_w_stage()
        self.drive_open_c_instance()
        # The reviewer's bypass: a closed-W#1 row labelled with the open C#1 instance.
        self.assert_rejected(
            "monitor_restart", code="HC-RL-A93", node="W1", note="stage_id=DHR_90:C#1 盘点"
        )
        # An open-instance row pointing back at the closed W#1 instance is rejected too.
        self.assert_rejected(
            "monitor_restart", code="HC-RL-A93", node="C1", note="stage_id=DHR_90:W#1"
        )
        # A stage_id matching the node's own instance is redundant but consistent.
        self.add_ok("monitor_restart", node="C1", note="stage_id=DHR_90:C#1 盘点")

    def test_status_mirrors_pre_start_and_attribution_warnings(self) -> None:
        """HC-RL-A93/A89: legacy pre-start writes, foreign labels, launch-less closes are reported."""
        self.write_stage_plan()
        self.write_ledger_rows((
            ("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
            ("2026-09-11T08:01:00+08:00", "W1", "node_start", "monitor#1", ""),
            ("2026-09-11T08:02:00+08:00", "W1", "agent_launch", "builder#1", ""),
            ("2026-09-11T08:03:00+08:00", "W1", "stage_start", "orchestrator#1", "stage_id=DHR_90:W#1"),
            ("2026-09-11T08:04:00+08:00", "W1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:W#1"),
            ("2026-09-11T08:05:00+08:00", "W1", "done", "builder#1", "交付"),
            ("2026-09-11T08:06:00+08:00", "W1", "node_close", "monitor#1", "双判据成立"),
            ("2026-09-11T08:07:00+08:00", "W1", "stage_result", "monitor#1",
             "stage_id=DHR_90:W#1 outcome=done 收尾"),
            ("2026-09-11T08:08:00+08:00", "W1", "stage_close", "orchestrator#1", "stage_id=DHR_90:W#1"),
            ("2026-09-11T08:09:00+08:00", "W1", "monitor_restart", "monitor#1",
             "stage_id=DHR_90:C#1 盘点"),
            ("2026-09-11T08:10:00+08:00", "C1", "stage_start", "orchestrator#1", "stage_id=DHR_90:C#1"),
            ("2026-09-11T08:11:00+08:00", "C1", "node_start", "monitor#1", ""),
            ("2026-09-11T08:12:00+08:00", "C1", "agent_launch", "coder#1", ""),
            ("2026-09-11T08:13:00+08:00", "C1", "done", "coder#1", "交付"),
            ("2026-09-11T08:14:00+08:00", "C1", "node_close", "monitor#1", ""),
            ("2026-09-11T08:15:00+08:00", "C1", "stage_result", "monitor#1",
             "stage_id=DHR_90:C#1 outcome=done 收尾"),
            ("2026-09-11T08:16:00+08:00", "C1", "stage_close", "orchestrator#1", "stage_id=DHR_90:C#1"),
        ))
        payload = self.status_payload()
        errors = payload["errors"]
        self.assertTrue(
            any("HC-RL-A93" in message and "seq 2" in message for message in errors), errors
        )
        self.assertTrue(
            any("HC-RL-A93" in message and "seq 3" in message for message in errors), errors
        )
        # seq 10 sits on node W1 but claims C#1: attributed to W#1 it is post-close,
        # and the foreign stage_id label is itself an anomaly.
        self.assertTrue(
            any(
                "HC-RL-A93" in message and "seq 10" in message and "DHR_90:C#1" in message
                for message in errors
            ),
            errors,
        )
        # seq 17 closes C#1 without any monitor_launch.
        self.assertTrue(
            any(
                "HC-RL-A89" in message and "seq 17" in message and "monitor_launch" in message
                for message in errors
            ),
            errors,
        )

    def test_current_stage_prefers_the_open_instance_awaiting_close(self) -> None:
        """HC-RL-A106/A61: a started instance whose result awaits stage_close outranks a
        merely pending later node."""
        self.write_stage_plan()
        self.drive_closed_w_stage()
        self.drive_open_c_instance()
        self.close_node("C2")
        self.add_ok("stage_result", node="C1", note="stage_id=DHR_90:C#1 outcome=done 施工完成")
        # R1 is the first unclosed node, but its R#1 instance never started: the open
        # C#1 instance keeps current_stage so its done result can still route.
        payload = self.status_payload()
        self.assertEqual("DHR_90:C#1", payload["current_stage"])
        self.assertEqual("R1", payload["current_node"])
        self.assertEqual("done", payload["last_stage_result"]["outcome"])
        self.assertEqual("open_next_stage", payload["suggested_action"])
        self.assertEqual(["DHR_90:C#1"], payload["open_stages"])
        self.assertEqual(
            "pending",
            next(s for s in payload["stages"] if s["stage_id"] == "DHR_90:R#1")["state"],
        )

    def test_monitor_relaunch_count_counts_only_failed_caused_relaunches(self) -> None:
        """HC-RL-A106/§3.5: only a launch after a `failed` result is a failed-caused relaunch."""
        self.write_stage_plan()
        self.drive_closed_w_stage()
        self.drive_open_c_instance()
        # §7.3 crash recovery relaunches the monitor without any failed stage_result.
        self.add_ok(
            "monitor_launch", node="C1", agent="orchestrator#1",
            note="stage_id=DHR_90:C#1 监工掉线重拉",
        )
        recovered = self.status_payload()
        self.assertEqual(0, recovered["monitor_relaunch_count"])
        self.assertEqual("DHR_90:C#1", recovered["current_stage"])
        self.close_node_with_loss("C2")
        self.add_ok("stage_result", node="C1", note="stage_id=DHR_90:C#1 outcome=failed ref=coder#1:agent_lost 复核未过")
        failed_once = self.status_payload()
        self.assertEqual("relaunch_monitor", failed_once["suggested_action"])
        self.assertEqual(0, failed_once["monitor_relaunch_count"])
        self.add_ok("monitor_launch", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok(
            "stage_result", node="C1", note="stage_id=DHR_90:C#1 outcome=failed ref=coder#1:agent_lost 重拉后仍未过"
        )
        failed_twice = self.status_payload()
        self.assertEqual(1, failed_twice["monitor_relaunch_count"])
        self.assertEqual("notify_user", failed_twice["suggested_action"])

    def test_a89_lint_rejects_a_backward_cross_stage_dependency(self) -> None:
        """HC-RL-A89: a later stage may never be a dependency of an earlier stage (exact id)."""
        backward = [
            "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | | |",
            "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | C1 | |",
        ]
        agents = [
            "| coder | C1 | coder | | code.md | | |",
            "| builder | W1 | builder | | task_plan.md | | |",
        ]
        self.write_plan(node_rows=backward, agent_rows=agents)
        lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(2, lint.returncode)
        self.assertEqual("", lint.stdout)
        self.assertRegex(lint.stderr, r"^lint: HC-RL-A89 ")
        self.assertNotIn("HC-RL-A109", lint.stderr)
        for command in (
            ("status", "--plan", str(self.plan_path.parent)),
            ("add", "--plan", str(self.plan_path.parent), "--node", "W1", "--event", "plan_loaded",
             "--agent", "orchestrator#1", "--note", "skill=0.1.0"),
        ):
            with self.subTest(command=command[0]):
                result = self.run_cli(*command)
                self.assertEqual(3, result.returncode)
                self.assertEqual("", result.stdout)
                self.assertRegex(result.stderr, r"^error: HC-RL-A89 ")
        self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())

        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            ],
            agent_rows=agents,
        )
        forward = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, forward.returncode, forward.stderr)
        self.assertEqual("lint: ok\n", forward.stdout)

    def test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable(self) -> None:
        """HC-RL-A119: monitor#<n> writes it, note carries filename + nodes=, repeats freely."""
        self.write_stage_plan()
        self.drive_closed_w_stage()
        self.drive_open_c_instance()
        self.add_ok("node_start", node="C2")
        self.add_ok("agent_launch", node="C2", agent="coder#1")
        cases = (
            ("coder#1", "decision.2.md nodes=C3"),            # not monitor#<n>
            ("monitor#1", "nodes=C3,C4"),                     # no proposal filename token
            ("monitor#1", "decision.2.md"),                   # missing nodes=
            ("monitor#1", "decision.2.md nodes="),            # empty nodes list
            ("monitor#1", "decision.2.md nodes=C3,,C4"),      # empty list item
        )
        for agent, note in cases:
            with self.subTest(agent=agent, note=note):
                self.assert_rejected(
                    "plan_amend", code="HC-RL-A119", node="C2", agent=agent, note=note
                )
        before = self.status_payload()
        for _ in range(2):
            self.add_ok("plan_amend", node="C2", note="decision.2.md nodes=C3,C4")
        after = self.status_payload()
        volatile = {"agents", "errors"}
        self.assertEqual(
            {key: value for key, value in before.items() if key not in volatile},
            {key: value for key, value in after.items() if key not in volatile},
        )
        self.assertEqual([], before["errors"])
        self.assertEqual([], after["errors"])
        self.assertEqual(
            [{k: v for k, v in agent.items() if k != "idle_seconds"} for agent in before["agents"]],
            [{k: v for k, v in agent.items() if k != "idle_seconds"} for agent in after["agents"]],
        )
        self.add_ok("done", node="C2", agent="coder#1", note="交付")
        self.add_ok("node_close", node="C2")
        payload = self.status_payload()
        coder = next(
            agent
            for agent in payload["agents"]
            if agent["node"] == "C2" and agent["agent"] == "coder#1"
        )
        self.assertEqual("done", coder["last_event"])
        self.assertEqual("closed", payload["nodes"][2]["state"])
        self.assertEqual("open", payload["stages"][1]["state"])

    def test_stage_result_amend_summary_matches_stage_history(self) -> None:
        """HC-RL-A123: the amend summary is required iff this instance recorded a plan_amend."""
        self.write_stage_plan()
        self.add_ok("plan_loaded", agent="orchestrator#1", note="skill=0.1.0")
        self.add_ok("stage_start", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("monitor_launch", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("node_start", node="W1")
        self.add_ok("agent_launch", node="W1", agent="builder#1")
        self.add_ok("done", node="W1", agent="builder#1")
        self.add_ok("plan_amend", node="W1", note="decision.2.md nodes=C3,C4")
        self.add_ok("node_close", node="W1")
        for note in (
            "stage_id=DHR_90:W#1 outcome=done nodes=C3,C4",
            "stage_id=DHR_90:W#1 outcome=done amend=decision.2.md",
        ):
            with self.subTest(note=note):
                self.assert_rejected("stage_result", code="HC-RL-A123", note=note)
        self.add_ok(
            "stage_result",
            note="stage_id=DHR_90:W#1 outcome=done amend=decision.2.md nodes=C3,C4 计划已追加两节点",
        )
        self.add_ok("stage_close", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        # C#1 records no plan_amend: a bare amend= token is A123 while a plain
        # result passes — W#1's plan_amend must not bleed into this instance.
        self.drive_open_c_instance()
        self.close_node("C2")
        with self.subTest(note="amend-without-plan_amend"):
            self.assert_rejected(
                "stage_result",
                code="HC-RL-A123",
                note="stage_id=DHR_90:C#1 outcome=done amend=decision.9.md nodes=C9",
            )
        self.add_ok("stage_result", note="stage_id=DHR_90:C#1 outcome=done 收尾")
        self.add_ok("stage_close", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.assertEqual("closed", self.status_payload()["stages"][1]["state"])

    def test_a123_binds_plan_amend_whose_carrier_was_superseded(self) -> None:
        """HC-RL-A123: superseding the plan_amend carrier node must not orphan the binding."""
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
                "| C2 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | agent:requirement | C2 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| coder | C2 | coder | | code2.md | | |",
                "| requirement | R1 | reviewer | | review.requirement.md | | |",
                "| lesson | R1 | reviewer | | review.lesson.md | | |",
            ],
        )
        self.drive_closed_w_stage()
        self.add_ok("stage_start", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("monitor_launch", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("plan_amend", node="C1", note="decision.9.md nodes=C3")
        # The amendment retires its own carrier: C1 superseded-by C3, C3 tail-appended.
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | superseded-by:C3 |",
                "| C2 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | agent:requirement | C2 | |",
                "| C3 | DHR_90 | DHR_90:C#1 | construction | agent:coder | C2 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| coder | C2 | coder | | code2.md | | |",
                "| coder | C3 | coder | | code3.md | | |",
                "| requirement | R1 | reviewer | | review.requirement.md | | |",
                "| lesson | R1 | reviewer | | review.lesson.md | | |",
            ],
        )
        lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, lint.returncode, lint.stderr)
        self.close_node("C2")
        self.close_node("C3")
        self.assert_rejected(
            "stage_result",
            code="HC-RL-A123",
            note="stage_id=DHR_90:C#1 outcome=done 无 amend 摘要",
        )
        self.add_ok(
            "stage_result",
            note="stage_id=DHR_90:C#1 outcome=done amend=decision.9.md nodes=C3 C1 已由 C3 接替",
        )
        self.add_ok("stage_close", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.assertEqual("closed", self.status_payload()["stages"][1]["state"])

    def launch_planner_amend(self) -> None:
        """Open `DHR_90:W#1` and launch one planner-amend instance the ordinary way."""
        self.start_ledger()
        self.add_ok("node_start", node="W1")
        self.add_ok("agent_launch", node="W1", agent="planner-amend#1")

    def test_planner_amend_out_of_scope_lifecycle_contract(self) -> None:
        """HC-RL-A122: planner-amend 只走 agent_launch → done；out-of-scope done.note
        三 token 齐全；其名下 blocked / escalate / plan_amend 一律拒绝；monitor 随后
        写 stage_result outcome=blocked。"""
        self.write_plan()
        # 正例：结构化 out-of-scope done.note；普通成功 done.note 也合法。
        for note in (
            "outcome=out-of-scope proposal=decision.1.md reason=需新增验收条目",
            "task_plan 已改；relay_plan 追加 C3；lint 通过",
        ):
            with self.subTest(note=note):
                self.reset_ledger()
                self.launch_planner_amend()
                self.add_ok("done", node="W1", agent="planner-amend#1", note=note)
        # 反例：blocked / escalate / plan_amend 不由 planner-amend 写。
        for event, code in (("blocked", "HC-RL-A122"), ("escalate", "HC-RL-A122"), ("plan_amend", "HC-RL-A119")):
            with self.subTest(event=event):
                self.reset_ledger()
                self.launch_planner_amend()
                self.assert_rejected(
                    event, node="W1", agent="planner-amend#1", code=code,
                    note="outcome=out-of-scope proposal=decision.1.md reason=x" if event != "plan_amend" else "decision.1.md nodes=C3",
                )
        # 反例：done.note 带了 outcome= 就必须是完整的 out-of-scope 形态。
        for note in (
            "outcome=success proposal=decision.1.md reason=x",
            "outcome=out-of-scope proposal=decision.1.md",
            "outcome=out-of-scope reason=需要改设计",
            "outcome=out-of-scope proposal=dir/decision.1.md reason=x",
        ):
            with self.subTest(note=note):
                self.reset_ledger()
                self.launch_planner_amend()
                self.assert_rejected("done", node="W1", agent="planner-amend#1", code="HC-RL-A122", note=note)
        # monitor 交接：planner-amend done(out-of-scope) 后 monitor 写 blocked stage_result。
        self.reset_ledger()
        self.start_ledger()
        self.add_ok("node_start", node="W1")
        # builder#1 留 agent_lost 作合法 ref 目标，#2 done 满足 close=agent:builder
        self.add_ok("agent_launch", node="W1", agent="builder#1")
        self.add_ok("agent_lost", node="W1", agent="builder#1", note="pane 失联")
        self.add_ok("agent_launch", node="W1", agent="builder#2")
        self.add_ok("done", node="W1", agent="builder#2")
        self.add_ok("agent_launch", node="W1", agent="planner-amend#1")
        self.add_ok(
            "done", node="W1", agent="planner-amend#1",
            note="outcome=out-of-scope proposal=decision.1.md reason=需新增验收条目",
        )
        self.add_ok("node_close", node="W1")
        self.add_ok(
            "stage_result", agent="monitor#1",
            note="stage_id=DHR_90:W#1 outcome=blocked ref=builder#1:agent_lost proposal=decision.1.md 超出白名单",
        )
        forbidden = [
            row for row in self.ledger_rows()
            if row["agent"] == "planner-amend#1" and row["event"] in {"blocked", "escalate", "plan_amend"}
        ]
        self.assertEqual([], forbidden)


class RelayLimitsTests(RelayCliTestCase):
    """Batch 4 (HC-RL-A97/A99/A107): config-driven X planning and the two loss stops."""

    def add_ok(
        self, event: str, *, node: str = "X1", agent: str, note: str = ""
    ) -> subprocess.CompletedProcess[str]:
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(0, result.returncode, result.stderr)
        return result

    def assert_rejected(
        self,
        event: str,
        *,
        code: str,
        node: str = "X1",
        agent: str,
        note: str = "",
    ) -> subprocess.CompletedProcess[str]:
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(2, result.returncode)
        self.assertEqual("", result.stdout)
        self.assertRegex(result.stderr, rf"^error: {code} ")
        return result

    def ledger_rows(self) -> list[dict[str, object]]:
        path = self.plan_path.parent / "relay_log.jsonl"
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]

    def config_with_rework_limit(self, name: str, rounds: int) -> Path:
        """A complete copy of the shipped skill config with only the X limit changed."""
        target = Path(self.tempdir.name) / name
        shutil.copytree(SKILL_DIR, target)
        mapping = target / "dh-mapping.toml"
        text = mapping.read_text(encoding="utf-8")
        self.assertIn("rework_max_rounds = 2", text)
        mapping.write_text(
            text.replace("rework_max_rounds = 2", f"rework_max_rounds = {rounds}", 1),
            encoding="utf-8",
        )
        return target

    def write_x_plan(self, x_rounds: int, marker: str | None = None) -> None:
        """An otherwise legal serial plan carrying `x_rounds` X instances of DHR_90."""
        node_rows = [
            "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
            "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
        ]
        agent_rows = [
            "| builder | W1 | builder | | task_plan.md | | |",
            "| coder | C1 | coder | | code.md | | |",
            "| requirement | R1 | reviewer | | review.requirement.md | | |",
            "| lesson | R1 | reviewer | | review.lesson.md | | |",
        ]
        previous = "R1"
        for k in range(1, x_rounds + 1):
            node_rows.append(f"| X{k} | DHR_90 | DHR_90:X#{k} | rework | | {previous} | |")
            agent_rows.append(f"| coder | X{k} | coder | | rework.{k}.md | | |")
            previous = f"X{k}"
        self.write_plan(node_rows=node_rows, agent_rows=agent_rows, marker=marker)

    def x1_prelude(self) -> None:
        """A minimal ledger that lands coder#1 launched inside the opened X#1 instance."""
        self.write_ledger_rows(
            (
                ("2026-09-11T09:00:00+08:00", "X1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
                ("2026-09-11T09:01:00+08:00", "X1", "stage_start", "orchestrator#1", "stage_id=DHR_90:X#1"),
                ("2026-09-11T09:02:00+08:00", "X1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:X#1"),
                ("2026-09-11T09:03:00+08:00", "X1", "node_start", "monitor#1", ""),
                ("2026-09-11T09:04:00+08:00", "X1", "agent_launch", "coder#1", ""),
            )
        )

    def test_x_rounds_beyond_the_configured_limit_are_rejected_as_a97(self) -> None:
        """HC-RL-A97: a plan whose only violation is an X round over the limit fails exactly."""
        self.write_x_plan(3)
        limit_two = self.config_with_rework_limit("limit-two", 2)
        lint = self.run_cli(
            "lint", "--plan", str(self.plan_path.parent), "--config-dir", str(limit_two)
        )
        self.assertEqual(2, lint.returncode)
        self.assertEqual("", lint.stdout)
        self.assertEqual(1, lint.stderr.count("HC-RL-"))
        self.assertRegex(lint.stderr, r"^lint: HC-RL-A97 ")
        self.assertIn("DHR_90:X#3", lint.stderr)
        for command in (
            ("status", "--plan", str(self.plan_path.parent), "--config-dir", str(limit_two)),
            (
                "add", "--plan", str(self.plan_path.parent), "--node", "W1",
                "--event", "plan_loaded", "--agent", "orchestrator#1",
                "--note", "skill=0.1.0", "--config-dir", str(limit_two),
            ),
        ):
            with self.subTest(command=command[0]):
                result = self.run_cli(*command)
                self.assertEqual(3, result.returncode)
                self.assertEqual("", result.stdout)
                self.assertRegex(result.stderr, r"^error: HC-RL-A97 ")
        self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())

        # Same plan at the limit is legal; raising the config limit legalizes X#3 —
        # the rule reads limits.rework_max_rounds, not a hardcoded two.
        self.write_x_plan(2)
        within = self.run_cli(
            "lint", "--plan", str(self.plan_path.parent), "--config-dir", str(limit_two)
        )
        self.assertEqual(0, within.returncode, within.stderr)
        self.write_x_plan(3)
        limit_three = self.config_with_rework_limit("limit-three", 3)
        raised = self.run_cli(
            "lint", "--plan", str(self.plan_path.parent), "--config-dir", str(limit_three)
        )
        self.assertEqual(0, raised.returncode, raised.stderr)

    def test_plan_x_rounds_length_and_ids_come_from_the_loaded_config(self) -> None:
        """HC-RL-A99: one unchanged binary plans 2 or 3 X rounds purely from the config."""
        planner = getattr(relay_log, "plan_x_rounds", None)
        self.assertIsNotNone(planner, "relay_log.plan_x_rounds is not implemented")
        limit_two = self.config_with_rework_limit("limit-two", 2)
        limit_three = self.config_with_rework_limit("limit-three", 3)
        module = Path(relay_log.__file__)
        before = hashlib.sha256(module.read_bytes()).hexdigest()
        rounds_two = planner("DHR_90", relay_log.load_config(limit_two))
        between = hashlib.sha256(module.read_bytes()).hexdigest()
        rounds_three = planner("DHR_90", relay_log.load_config(limit_three))
        after = hashlib.sha256(module.read_bytes()).hexdigest()
        self.assertEqual(before, between)
        self.assertEqual(between, after)
        self.assertEqual(2, len(rounds_two))
        self.assertEqual(3, len(rounds_three))
        self.assertEqual(["DHR_90:X#1", "DHR_90:X#2"], [r.stage_id for r in rounds_two])
        self.assertEqual(
            ["DHR_90:X#1", "DHR_90:X#2", "DHR_90:X#3"], [r.stage_id for r in rounds_three]
        )
        self.assertEqual({"DHR_90"}, {r.card for r in (*rounds_two, *rounds_three)})
        self.assertEqual([1, 2, 3], [r.k for r in rounds_three])
        for x_round in (*rounds_two, *rounds_three):
            with self.subTest(stage_id=x_round.stage_id):
                self.assertEqual(("E2", "E3"), x_round.dh_nodes)
        # §6.2.1 re-derivation only: the explicit dir resolves and feeds the planner.
        resolved = relay_log.resolve_config_dir(
            str(limit_three), Path(self.tempdir.name) / "missing-home"
        )
        self.assertEqual(3, len(planner("DHR_90", relay_log.load_config(resolved))))
        # The public CLI is still exactly the three frozen subcommands.
        top_level = self.run_cli("--help")
        self.assertEqual(0, top_level.returncode)
        self.assertRegex(top_level.stdout, r"\{add,status,lint\}")

    def test_attempt_and_x_loss_stops_trigger_independently(self) -> None:
        """HC-RL-A107: each counter hits its own limit and opens the strategist exit alone."""
        probe = getattr(relay_log, "loss_stop", None)
        self.assertIsNotNone(probe, "relay_log.loss_stop is not implemented")
        config = repo_config()

        # Only the attempt counter reaches its limit: three coder attempts die.
        self.write_plan()
        self.write_ledger_rows(
            (
                ("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
                ("2026-09-11T08:01:00+08:00", "C1", "stage_start", "orchestrator#1", "stage_id=DHR_90:C#1"),
                ("2026-09-11T08:02:00+08:00", "C1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:C#1"),
                ("2026-09-11T08:03:00+08:00", "C1", "node_start", "monitor#1", ""),
                ("2026-09-11T08:04:00+08:00", "C1", "agent_launch", "coder#1", ""),
                ("2026-09-11T08:05:00+08:00", "C1", "agent_lost", "coder#1", ""),
                ("2026-09-11T08:06:00+08:00", "C1", "agent_launch", "coder#2", ""),
                ("2026-09-11T08:07:00+08:00", "C1", "agent_lost", "coder#2", ""),
                ("2026-09-11T08:08:00+08:00", "C1", "agent_launch", "coder#3", ""),
                ("2026-09-11T08:09:00+08:00", "C1", "agent_lost", "coder#3", ""),
            )
        )
        entries = relay_log.read_ledger(self.plan_path.parent / "relay_log.jsonl")
        stop = probe(lint_plan(self.plan_path, config), entries, config)
        self.assertEqual({("C1", "coder"): 3}, stop.attempts)
        self.assertEqual({}, stop.x_rounds)
        self.assertEqual((("C1", "coder"),), stop.attempt_exhausted)
        self.assertEqual((), stop.x_exhausted)
        self.assertTrue(stop.triggered)

        # Only the X counter reaches its limit: both planned X rounds open and fail.
        self.write_x_plan(2)
        self.write_ledger_rows(
            (
                ("2026-09-11T08:00:00+08:00", "X1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
                ("2026-09-11T08:01:00+08:00", "X1", "stage_start", "orchestrator#1", "stage_id=DHR_90:X#1"),
                ("2026-09-11T08:02:00+08:00", "X1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:X#1"),
                ("2026-09-11T08:03:00+08:00", "X1", "node_start", "monitor#1", ""),
                ("2026-09-11T08:04:00+08:00", "X1", "agent_launch", "coder#1", ""),
                ("2026-09-11T08:05:00+08:00", "X1", "done", "coder#1", ""),
                ("2026-09-11T08:06:00+08:00", "X1", "node_close", "monitor#1", ""),
                ("2026-09-11T08:07:00+08:00", "X1", "stage_result", "monitor#1", "stage_id=DHR_90:X#1 outcome=failed"),
                ("2026-09-11T08:10:00+08:00", "X2", "stage_start", "orchestrator#1", "stage_id=DHR_90:X#2"),
                ("2026-09-11T08:11:00+08:00", "X2", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:X#2"),
                ("2026-09-11T08:12:00+08:00", "X2", "node_start", "monitor#1", ""),
                ("2026-09-11T08:13:00+08:00", "X2", "agent_launch", "coder#1", ""),
                ("2026-09-11T08:14:00+08:00", "X2", "done", "coder#1", ""),
                ("2026-09-11T08:15:00+08:00", "X2", "node_close", "monitor#1", ""),
                ("2026-09-11T08:16:00+08:00", "X2", "stage_result", "monitor#1", "stage_id=DHR_90:X#2 outcome=failed"),
            )
        )
        entries = relay_log.read_ledger(self.plan_path.parent / "relay_log.jsonl")
        stop = probe(lint_plan(self.plan_path, config), entries, config)
        self.assertEqual({("X1", "coder"): 1, ("X2", "coder"): 1}, stop.attempts)
        self.assertEqual({"DHR_90": 2}, stop.x_rounds)
        self.assertEqual((), stop.attempt_exhausted)
        self.assertEqual(("DHR_90",), stop.x_exhausted)
        self.assertTrue(stop.triggered)

        # Neither counter at its limit: relaunch debt and a failed X#1 both stay open.
        self.write_x_plan(1)
        self.write_ledger_rows(
            (
                ("2026-09-11T08:00:00+08:00", "C1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
                ("2026-09-11T08:01:00+08:00", "C1", "stage_start", "orchestrator#1", "stage_id=DHR_90:C#1"),
                ("2026-09-11T08:02:00+08:00", "C1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:C#1"),
                ("2026-09-11T08:03:00+08:00", "C1", "node_start", "monitor#1", ""),
                ("2026-09-11T08:04:00+08:00", "C1", "agent_launch", "coder#1", ""),
                ("2026-09-11T08:05:00+08:00", "C1", "agent_lost", "coder#1", ""),
                ("2026-09-11T08:06:00+08:00", "C1", "agent_launch", "coder#2", ""),
                ("2026-09-11T08:07:00+08:00", "C1", "agent_lost", "coder#2", ""),
                ("2026-09-11T08:10:00+08:00", "X1", "stage_start", "orchestrator#1", "stage_id=DHR_90:X#1"),
                ("2026-09-11T08:11:00+08:00", "X1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:X#1"),
                ("2026-09-11T08:12:00+08:00", "X1", "node_start", "monitor#1", ""),
                ("2026-09-11T08:13:00+08:00", "X1", "agent_launch", "coder#1", ""),
                ("2026-09-11T08:14:00+08:00", "X1", "done", "coder#1", ""),
                ("2026-09-11T08:15:00+08:00", "X1", "node_close", "monitor#1", ""),
                ("2026-09-11T08:16:00+08:00", "X1", "stage_result", "monitor#1", "stage_id=DHR_90:X#1 outcome=failed"),
            )
        )
        entries = relay_log.read_ledger(self.plan_path.parent / "relay_log.jsonl")
        stop = probe(lint_plan(self.plan_path, config), entries, config)
        self.assertEqual({("C1", "coder"): 2, ("X1", "coder"): 1}, stop.attempts)
        self.assertEqual({"DHR_90": 1}, stop.x_rounds)
        self.assertEqual((), stop.attempt_exhausted)
        self.assertEqual((), stop.x_exhausted)
        self.assertFalse(stop.triggered)

    def test_attempt_loss_stop_counts_stage_failed_relaunch_debt(self) -> None:
        """HC-RL-A107: a stage failed after the last attempt also spends the counter."""
        probe = getattr(relay_log, "loss_stop", None)
        self.assertIsNotNone(probe, "relay_log.loss_stop is not implemented")
        self.write_plan()
        self.write_ledger_rows(
            (
                ("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
                ("2026-09-11T08:01:00+08:00", "C1", "stage_start", "orchestrator#1", "stage_id=DHR_90:C#1"),
                ("2026-09-11T08:02:00+08:00", "C1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:C#1"),
                ("2026-09-11T08:03:00+08:00", "C1", "node_start", "monitor#1", ""),
                ("2026-09-11T08:04:00+08:00", "C1", "agent_launch", "coder#1", ""),
                ("2026-09-11T08:05:00+08:00", "C1", "cancelled", "coder#1", ""),
                ("2026-09-11T08:06:00+08:00", "C1", "agent_launch", "coder#2", ""),
                ("2026-09-11T08:07:00+08:00", "C1", "cancelled", "coder#2", ""),
                ("2026-09-11T08:08:00+08:00", "C1", "agent_launch", "coder#3", ""),
                ("2026-09-11T08:09:00+08:00", "C1", "done", "coder#3", ""),
                ("2026-09-11T08:10:00+08:00", "C1", "node_close", "monitor#1", ""),
                ("2026-09-11T08:11:00+08:00", "C1", "stage_result", "monitor#1", "stage_id=DHR_90:C#1 outcome=failed"),
            )
        )
        config = repo_config()
        entries = relay_log.read_ledger(self.plan_path.parent / "relay_log.jsonl")
        stop = probe(lint_plan(self.plan_path, config), entries, config)
        self.assertEqual({("C1", "coder"): 3}, stop.attempts)
        self.assertEqual((("C1", "coder"),), stop.attempt_exhausted)
        self.assertTrue(stop.triggered)

    def test_strategist_chain_finales_require_a_user_decision_in_every_mode(self) -> None:
        """HC-RL-A97: resume/cancelled of a strategist chain need user_decision — auto too."""
        for decision_mode in ("auto", "consult"):
            for finale in ("resume", "cancelled"):
                with self.subTest(decision_mode=decision_mode, finale=finale):
                    self.reset_ledger()
                    self.write_x_plan(
                        1,
                        marker=(
                            "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-11 "
                            f"session=sess decision_mode={decision_mode} recipe=normal "
                            "cards=DHR_90 -->"
                        ),
                    )
                    self.x1_prelude()
                    self.add_ok(
                        "escalate", agent="coder#1",
                        note="strategist=strategist#1 返工超限，请出全局方案",
                    )
                    self.add_ok("agent_launch", agent="strategist#1")
                    self.add_ok(
                        "decision", agent="coder#1",
                        note="strategist=strategist#1 strategy.1.md",
                    )
                    self.add_ok("done", agent="strategist#1")
                    rejected = self.assert_rejected(finale, code="HC-RL-A97", agent="coder#1")
                    self.assertIn("user_decision", rejected.stderr)
                    self.reset_ledger()

    def test_strategist_chain_with_user_decision_runs_both_finales(self) -> None:
        """HC-RL-A97: user_decision unlocks resume; the cancelled finale stops the card."""
        self.write_x_plan(1)
        self.x1_prelude()
        self.add_ok("escalate", agent="coder#1", note="strategist=strategist#1 返工超限")
        self.add_ok("agent_launch", agent="strategist#1")
        self.add_ok("decision", agent="coder#1", note="strategist=strategist#1 strategy.1.md")
        self.add_ok("done", agent="strategist#1")
        self.add_ok(
            "user_decision", agent="coder#1", note="用户裁决：按 strategy.1.md 继续"
        )
        self.add_ok("resume", agent="coder#1", note="按 user_decision 与 strategy.1.md 继续")
        rows = self.ledger_rows()
        owners = {
            row["event"]: row["agent"]
            for row in rows
            if row["event"] in {"escalate", "decision", "user_decision", "resume"}
        }
        self.assertEqual(
            {
                "escalate": "coder#1",
                "decision": "coder#1",
                "user_decision": "coder#1",
                "resume": "coder#1",
            },
            owners,
        )
        self.assertEqual(
            ["strategist#1", "strategist#1"],
            [
                row["agent"]
                for row in rows
                if row["agent"] == "strategist#1" and row["event"] in {"agent_launch", "done"}
            ],
        )

        self.reset_ledger()
        self.write_x_plan(1)
        self.x1_prelude()
        self.add_ok("escalate", agent="coder#1", note="strategist=strategist#1 返工超限")
        self.add_ok("agent_launch", agent="strategist#1")
        self.add_ok("decision", agent="coder#1", note="strategist=strategist#1 strategy.1.md")
        self.add_ok("done", agent="strategist#1")
        self.add_ok(
            "user_decision", agent="coder#1", note="reject: 放弃这张卡"
        )
        self.add_ok(
            "cancelled", agent="coder#1", note="引用上条 user_decision，停卡"
        )
        rows = self.ledger_rows()
        owners = {
            row["event"]: row["agent"]
            for row in rows
            if row["event"] in {"escalate", "decision", "user_decision", "cancelled"}
        }
        self.assertEqual("coder#1", owners["cancelled"])

    def test_decider_chain_resume_stays_gate_free_in_auto_mode(self) -> None:
        """HC-RL-A97: the decider chain keeps its own gate — auto mode adds no user_decision."""
        self.write_x_plan(1)
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
                "| X1 | DHR_90 | DHR_90:X#1 | rework | | R1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| requirement | R1 | reviewer | | review.requirement.md | | |",
                "| lesson | R1 | reviewer | | review.lesson.md | | |",
                "| coder | X1 | coder | | rework.1.md | | |",
                "| decider | X1 | decider | | decision.1.md | on:blocked | |",
            ],
        )
        self.x1_prelude()
        self.add_ok("blocked", agent="coder#1")
        self.add_ok("escalate", agent="coder#1", note="decider=decider#1")
        self.add_ok("agent_launch", agent="decider#1")
        self.add_ok("decision", agent="coder#1", note="decider=decider#1 decision.1.md")
        self.add_ok("done", agent="decider#1")
        self.add_ok("resume", agent="coder#1")

    def test_plan_loaded_note_carries_config_dir_and_plan_keys(self) -> None:
        """HC-RL-A99/§6.2.1: a caller note without the provenance keys still lands with both."""
        self.write_plan()
        add = self.run_add(
            "plan_loaded",
            node="W1",
            agent="orchestrator#1",
            note="skill=0.1.0 session=handoff",
        )
        self.assertEqual(0, add.returncode, add.stderr)
        recorded = self.ledger_rows()[-1]["note"]
        for key, expected in (
            ("config_dir", encoded_path(SKILL_DIR)),
            ("plan", encoded_path(self.plan_path.parent)),
        ):
            values = [
                token.split("=", 1)[1]
                for token in str(recorded).split()
                if token.split("=", 1)[0] == key
            ]
            self.assertEqual([expected], values)


class RelayPlanAmendGuardTests(RelayCliTestCase):
    """RLT_09 B4 — HC-RL-A122: planner-amend 三类白名单守门（P1-02 原始快照算法）。"""

    MODULE = "tmod"
    PLAN_ID = "PLAN1"
    CARD = "TCD_1"
    PLAN_REL = f"docs/modules/{MODULE}/relay/{PLAN_ID}"
    PLAN_FILE = f"{PLAN_REL}/relay_plan.md"
    DEV_PLAN = f"docs/modules/{MODULE}/dev_plan/P1-main.md"
    DEV_PLAN_NEW = f"docs/modules/{MODULE}/dev_plan/P2-new.md"
    DEV_PLAN_UNTRACKED = f"docs/modules/{MODULE}/dev_plan/P3-scratch.md"
    TASK_PLAN = f"docs/modules/{MODULE}/workspace/{CARD}/task_plan.md"
    PROPOSAL = f"docs/modules/{MODULE}/workspace/{CARD}/decision.1.md"
    DESIGN = f"docs/modules/{MODULE}/design/01-design.md"
    NEW_CARD_TASK = f"docs/modules/{MODULE}/workspace/TCD_9/task_plan.md"
    DIRTY = "notes-dirty.txt"
    UNTRACKED = "scratch-untracked.txt"

    def setUp(self) -> None:
        super().setUp()
        if shutil.which("git") is None:
            self.skipTest("git is required for the A122 guard tests")
        self.repo = Path(self.tempdir.name) / "repo"
        self.runtime = Path(self.tempdir.name) / "runtime"
        self.runtime.mkdir()
        self._init_repo()

    def _git(self, *args: str, input_bytes: bytes | None = None) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["git", "-C", str(self.repo), *args],
            input=input_bytes, capture_output=True, check=False,
        )

    def _write(self, rel: str, content: str | bytes) -> Path:
        path = self.repo / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, bytes):
            path.write_bytes(content)
        else:
            path.write_text(content, encoding="utf-8")
        return path

    def _plan_text(self) -> str:
        return "\n".join(
            [
                f"<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-10 session=app recipe=normal cards={self.CARD} -->",
                "",
                "## 节点表",
                NODE_HEADER,
                SEPARATOR,
                f"| W1 | {self.CARD} | {self.CARD}:W#1 | build | agent:builder | | |",
                "",
                "## agent 表",
                AGENT_HEADER,
                SEPARATOR,
                "| builder | W1 | builder | | task_plan.md | | |",
                "",
            ]
        )

    def _init_repo(self) -> None:
        self.repo.mkdir()
        self._git("init")
        self._git("config", "user.email", "guard@test")
        self._git("config", "user.name", "guard")
        self._write(self.PLAN_FILE, self._plan_text())
        self._write(self.DEV_PLAN, "# dev plan\n")
        self._write(self.TASK_PLAN, "# task plan\n")
        self._write(self.PROPOSAL, "# proposal input\n")
        self._write(self.DESIGN, "# design forbidden\n")
        self._write(self.DIRTY, "v0\n")
        commit = self._git("add", "-A")
        self.assertEqual(0, commit.returncode, commit.stderr)
        commit = self._git("commit", "-m", "init")
        self.assertEqual(0, commit.returncode, commit.stderr)
        # 入场前现场：一份 tracked dirty 与一份未跟踪文件，都交由 before 快照吸收。
        self._write(self.DIRTY, "v1 dirty\n")
        self._write(self.UNTRACKED, "untracked u1\n")

    def run_amend(
        self, phase: str, snap: Path, proposed: tuple[str, ...] = ()
    ) -> subprocess.CompletedProcess[str]:
        argv = [
            "lint",
            "--plan", str(self.repo / self.PLAN_REL),
            "--amend-check", phase,
            "--repo", str(self.repo),
            "--snapshot-dir", str(snap),
        ]
        for path in proposed:
            argv.extend(["--proposed-path", path])
        return self.run_cli(*argv)

    def _objects_listing(self) -> tuple[tuple[str, int, str], ...]:
        objects = self.repo / ".git" / "objects"
        entries = []
        for path in sorted(objects.rglob("*")):
            if path.is_file():
                entries.append(
                    (
                        path.relative_to(objects).as_posix(),
                        path.stat().st_size,
                        hashlib.sha256(path.read_bytes()).hexdigest(),
                    )
                )
        return tuple(entries)

    def _count_objects(self) -> str:
        result = self._git("count-objects", "-v")
        self.assertEqual(0, result.returncode)
        return result.stdout.decode()

    @staticmethod
    def _state(path: Path) -> tuple[object, ...]:
        try:
            info = path.lstat()
        except FileNotFoundError:
            return ("absent",)
        if stat.S_ISLNK(info.st_mode):
            return ("symlink", os.readlink(path))
        if stat.S_ISREG(info.st_mode):
            return (
                "regular",
                stat.S_IMODE(info.st_mode),
                hashlib.sha256(path.read_bytes()).hexdigest(),
            )
        return ("special", stat.S_IMODE(info.st_mode))

    def test_snapshot_diff_captures_tracked_untracked_and_dirty_same_path_without_git_objects(self) -> None:
        """P1-02 矩阵：改前 dirty 不混入、同路径二次修改不漏报、tracked/untracked 三态、
        真实 index 与 object database 在守门窗口零变化。"""
        # staged 状态也允许入场：先把 dev_plan 改成 staged。
        self._write(self.DEV_PLAN, "# dev plan staged v1\n")
        self._git("add", self.DEV_PLAN)
        self._write(self.DEV_PLAN_UNTRACKED, "scratch u1\n")
        objects_before = self._objects_listing()
        count_before = self._count_objects()
        index_before = (self.repo / ".git" / "index").read_bytes()

        snap = self.runtime / "snap1"
        proposed = (self.DEV_PLAN, self.TASK_PLAN, self.DEV_PLAN_NEW, self.DEV_PLAN_UNTRACKED)
        result = self.run_amend("before", snap, proposed)
        self.assertEqual(0, result.returncode, result.stderr)
        self._write(self.DEV_PLAN, "# dev plan v2\n")           # staged dirty 后二次修改
        (self.repo / self.TASK_PLAN).unlink()                    # tracked 删除
        self._write(self.DEV_PLAN_NEW, "# new dev plan\n")       # absent → regular
        self._write(self.DEV_PLAN_UNTRACKED, "scratch u2\n")     # 既有 untracked 再改
        result = self.run_amend("after", snap)
        self.assertEqual(0, result.returncode, result.stderr)    # actual == proposed 精确相等
        self.assertFalse(snap.exists())
        self.assertEqual(objects_before, self._objects_listing())
        self.assertEqual(count_before, self._count_objects())
        self.assertEqual(index_before, (self.repo / ".git" / "index").read_bytes())
        # DIRTY / UNTRACKED 全程未动却被 before 吸收：actual 恰为 proposed 即证明未混入。

        # 同路径二次修改：task_plan 改前相对 HEAD 已 dirty（v1），再改为 v2 仍进入 actual。
        self._write(self.TASK_PLAN, "# task v1\n")
        snap2 = self.runtime / "snap2"
        result = self.run_amend("before", snap2, (self.TASK_PLAN,))
        self.assertEqual(0, result.returncode, result.stderr)
        self._write(self.TASK_PLAN, "# task v2\n")
        result = self.run_amend("after", snap2)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertFalse(snap2.exists())

        # untracked 运行中删除也进入 actual。
        snap3 = self.runtime / "snap3"
        result = self.run_amend("before", snap3, (self.DEV_PLAN_UNTRACKED,))
        self.assertEqual(0, result.returncode, result.stderr)
        (self.repo / self.DEV_PLAN_UNTRACKED).unlink()
        result = self.run_amend("after", snap3)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertFalse(snap3.exists())
        self.assertEqual(objects_before, self._objects_listing())
        self.assertEqual(count_before, self._count_objects())

    def test_failed_amend_restores_raw_bytes_mode_and_symlink_across_clean_eol_filter(self) -> None:
        """clean/EOL filter 不参与快照与恢复：失败时还原的是工作树原始 bytes/mode/target。"""
        self._git("config", "filter.upcase.clean", "tr a-z A-Z")
        self._write(".gitattributes", "data.flt filter=upcase eol=crlf\n")
        self._write("data.flt", "lower v0\n")
        self.assertEqual(0, self._git("add", ".gitattributes", "data.flt").returncode)
        self.assertEqual(0, self._git("commit", "-m", "filter fixture").returncode)
        link_rel = "data.link"
        try:
            os.symlink("data.flt", self.repo / link_rel)
        except (OSError, NotImplementedError):
            link_rel = None
        if link_rel is not None:
            self.assertEqual(0, self._git("add", link_rel).returncode)
            self.assertEqual(0, self._git("commit", "-m", "link fixture").returncode)
        raw_bytes = b"raw-v1-bytes\x00\x01\xff\n"
        target = self.repo / "data.flt"
        target.write_bytes(raw_bytes)
        if os.name == "posix":
            os.chmod(target, 0o640)
        snap = self.runtime / "snap"
        result = self.run_amend("before", snap, (self.DEV_PLAN,))
        self.assertEqual(0, result.returncode, result.stderr)
        self._write(self.DEV_PLAN, "# dev plan v2\n")
        target.write_bytes(b"tampered v2\n")
        if os.name == "posix":
            os.chmod(target, 0o600)
        if link_rel is not None:
            (self.repo / link_rel).unlink()
            os.symlink("other-target", self.repo / link_rel)
        result = self.run_amend("after", snap)
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertIn("HC-RL-A122", result.stderr)
        # 恢复断言全部直接读工作树/lstat，不经 git show/checkout。
        self.assertEqual(raw_bytes, target.read_bytes())
        if os.name == "posix":
            self.assertEqual(0o640, stat.S_IMODE(target.lstat().st_mode))
        if link_rel is not None:
            self.assertEqual("data.flt", os.readlink(self.repo / link_rel))
        self.assertEqual("# dev plan\n", (self.repo / self.DEV_PLAN).read_text(encoding="utf-8"))
        self.assertFalse(snap.exists())

    def test_sensitive_untracked_stays_out_of_object_database_and_durable_evidence(self) -> None:
        """敏感 untracked 的正文/文件名/哈希不进 object database，也不回显到进程输出。"""
        canary_rel = "canary-QZ9-s3cret.key"
        canary_bytes = b"CANARY-BYTES-QZ9-\x00\xff-unique"
        canary_sha = hashlib.sha256(canary_bytes).hexdigest()
        canary = self._write(canary_rel, canary_bytes)

        outputs: list[str] = []
        snap_fail = self.runtime / "snap-fail"
        result = self.run_amend("before", snap_fail, (self.DEV_PLAN,))
        outputs.extend([result.stdout, result.stderr])
        self.assertEqual(0, result.returncode, result.stderr)
        if os.name == "posix":
            self.assertEqual(0o700, stat.S_IMODE(snap_fail.lstat().st_mode))
            for path in snap_fail.rglob("*"):
                expected = 0o700 if path.is_dir() else 0o600
                self.assertEqual(expected, stat.S_IMODE(path.lstat().st_mode), path.name)
        # 越界改动包含敏感 untracked：失败输出也不得回显其文件名。
        self._write(self.DEV_PLAN, "# dev plan v2\n")
        canary.write_bytes(b"tampered\n")
        result = self.run_amend("after", snap_fail)
        outputs.extend([result.stdout, result.stderr])
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertIn("HC-RL-A122", result.stderr)
        self.assertEqual(canary_bytes, canary.read_bytes())
        self.assertFalse(snap_fail.exists())

        snap_ok = self.runtime / "snap-ok"
        result = self.run_amend("before", snap_ok, (self.DEV_PLAN,))
        outputs.extend([result.stdout, result.stderr])
        self.assertEqual(0, result.returncode, result.stderr)
        self._write(self.DEV_PLAN, "# dev plan v3\n")
        result = self.run_amend("after", snap_ok)
        outputs.extend([result.stdout, result.stderr])
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertFalse(snap_ok.exists())

        # 证据面（进程输出）不回显 canary 文件名或其逐文件哈希。
        for output in outputs:
            self.assertNotIn("QZ9", output)
            self.assertNotIn(canary_sha, output)
        for path in (self.repo / ".git" / "objects").rglob("*"):
            self.assertNotIn("QZ9", path.name)
            if path.is_file():
                data = path.read_bytes()
                self.assertNotIn(canary_bytes, data)
                self.assertNotIn(canary_sha.encode(), data)

    def test_success_requires_actual_equal_proposed(self) -> None:
        """成功的唯一判据 actual == proposed：多路径=越界、少路径=no-op 都 fail closed。"""
        snap = self.runtime / "s1"
        result = self.run_amend("before", snap, (self.DEV_PLAN, self.TASK_PLAN))
        self.assertEqual(0, result.returncode, result.stderr)
        self._write(self.DEV_PLAN, "# dev v2\n")
        self._write(self.TASK_PLAN, "# task v2\n")
        result = self.run_amend("after", snap)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertFalse(snap.exists())

        # proposed 含 no-op → actual 少项 → 拒绝并恢复已写目标。
        snap = self.runtime / "s2"
        result = self.run_amend("before", snap, (self.DEV_PLAN, self.TASK_PLAN))
        self.assertEqual(0, result.returncode, result.stderr)
        self._write(self.DEV_PLAN, "# dev v3\n")
        result = self.run_amend("after", snap)
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertIn("HC-RL-A122", result.stderr)
        self.assertEqual("# dev v2\n", (self.repo / self.DEV_PLAN).read_text(encoding="utf-8"))
        self.assertFalse(snap.exists())

        # proposed 只含 A，实际同时碰 B → actual 多项 → 拒绝并恢复两处。
        snap = self.runtime / "s3"
        result = self.run_amend("before", snap, (self.DEV_PLAN,))
        self.assertEqual(0, result.returncode, result.stderr)
        self._write(self.DEV_PLAN, "# dev v4\n")
        self._write(self.TASK_PLAN, "# task v3\n")
        result = self.run_amend("after", snap)
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertEqual("# dev v2\n", (self.repo / self.DEV_PLAN).read_text(encoding="utf-8"))
        self.assertEqual("# task v2\n", (self.repo / self.TASK_PLAN).read_text(encoding="utf-8"))
        self.assertFalse(snap.exists())

    def test_mixed_forbidden_proposal_leaves_targets_and_proposal_unchanged(self) -> None:
        """禁区混合：预检整份拒绝，全部计划目标与输入方案文件原始状态零变化。"""
        watched = (self.PLAN_FILE, self.DESIGN, self.TASK_PLAN, self.PROPOSAL)
        before_states = {rel: self._state(self.repo / rel) for rel in watched}
        objects_before = self._objects_listing()
        snap = self.runtime / "snap"
        result = self.run_amend("before", snap, (self.PLAN_FILE, self.DESIGN))
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertIn("HC-RL-A122", result.stderr)
        self.assertIn("design", result.stderr)
        after_states = {rel: self._state(self.repo / rel) for rel in watched}
        self.assertEqual(before_states, after_states)
        self.assertEqual(objects_before, self._objects_listing())
        self.assertFalse(snap.exists())

    def test_allowlist_classes_and_precheck_rejections(self) -> None:
        """三类白名单逐项通过；design/新卡/越界/绝对/穿越/重复/目录各例拒绝。"""
        cases = [
            ((self.PLAN_FILE,), 0),
            ((self.DEV_PLAN,), 0),
            ((self.TASK_PLAN,), 0),
            ((self.DESIGN,), 2),
            ((self.NEW_CARD_TASK,), 2),                      # 新卡 task_plan 不被 before-cards 反向授权
            (("docs/modules/other/dev_plan/P1-x.md",), 2),   # 跨模块 dev_plan
            ((str((self.repo / self.PLAN_FILE).resolve()),), 2),
            (("../escape.md",), 2),
            ((f"{self.PLAN_REL}/extra.md",), 2),             # 计划目录内也只有 relay_plan.md 本身可写
            ((self.DEV_PLAN, self.DEV_PLAN), 2),             # 重复项
            ((f"{self.DIRTY}/inner.md",), 2),                # 祖先是 tracked 文件（submodule 内部同类拒绝）
            ((f"docs/modules/{self.MODULE}/workspace/{self.CARD}",), 2),
        ]
        for index, (proposed, expected) in enumerate(cases):
            with self.subTest(proposed=proposed):
                snap = self.runtime / f"case-{index}"
                result = self.run_amend("before", snap, proposed)
                self.assertEqual(expected, result.returncode, result.stderr)
                if expected:
                    self.assertIn("HC-RL-A122", result.stderr)
                    self.assertFalse(snap.exists())
                else:
                    # 零改动的 after 仍按 actual != proposed 收口并清理现场。
                    result = self.run_amend("after", snap)
                    self.assertEqual(2, result.returncode, result.stderr)
                    self.assertFalse(snap.exists())
        # Git ignored 路径在预检拒绝。
        self._write(".gitignore", f"docs/modules/{self.MODULE}/dev_plan/P9-ign.md\n")
        ignored = f"docs/modules/{self.MODULE}/dev_plan/P9-ign.md"
        self._write(ignored, "x\n")
        snap = self.runtime / "ignored"
        result = self.run_amend("before", snap, (ignored,))
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertIn("HC-RL-A122", result.stderr)
        self.assertFalse(snap.exists())

    def test_amend_after_lint_failure_restores_plan(self) -> None:
        """actual == proposed 但普通 lint 失败 → 从仓外副本恢复，lint 规则号透传。"""
        original = (self.repo / self.PLAN_FILE).read_bytes()
        snap = self.runtime / "snap"
        result = self.run_amend("before", snap, (self.PLAN_FILE,))
        self.assertEqual(0, result.returncode, result.stderr)
        (self.repo / self.PLAN_FILE).write_text("garbage without marker\n", encoding="utf-8")
        result = self.run_amend("after", snap)
        self.assertNotEqual(0, result.returncode, result.stderr)
        self.assertIn("HC-RL-A18", result.stderr)
        self.assertEqual(original, (self.repo / self.PLAN_FILE).read_bytes())
        self.assertFalse(snap.exists())

    def test_external_mutation_between_phases_fails_closed(self) -> None:
        """静默区破坏：HEAD/index/object database 任一变化与 before 双采样不一致都 fail closed。"""
        # HEAD 改变
        snap = self.runtime / "m1"
        self.assertEqual(0, self.run_amend("before", snap, (self.DEV_PLAN,)).returncode)
        self._write(self.DEV_PLAN, "# dev v9\n")
        self._git("add", "-A")
        self.assertEqual(0, self._git("commit", "-m", "external").returncode)
        result = self.run_amend("after", snap)
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertIn("HC-RL-A122", result.stderr)
        self.assertTrue(snap.exists())  # git 元数据不可验证 → 保留现场供人工接管
        # index 改变
        snap = self.runtime / "m2"
        self.assertEqual(0, self.run_amend("before", snap, (self.TASK_PLAN,)).returncode)
        self._write(self.TASK_PLAN, "# task external\n")
        self.assertEqual(0, self._git("add", self.TASK_PLAN).returncode)
        result = self.run_amend("after", snap)
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertTrue(snap.exists())
        # object database 改变（不动 HEAD/index 工作树）
        snap = self.runtime / "m3"
        self.assertEqual(0, self.run_amend("before", snap, (self.DEV_PLAN,)).returncode)
        self.assertEqual(
            0, self._git("hash-object", "-w", "--stdin", input_bytes=b"external-object").returncode
        )
        result = self.run_amend("after", snap)
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertTrue(snap.exists())
        # before 双采样不一致（第二次采到不同 object 指纹）→ 拒绝且不产生业务文件写入
        real_fingerprint = relay_log._object_database_fingerprint
        calls = [0]

        def flaky(repo_root: Path) -> relay_log.ObjectDbFingerprint:
            calls[0] += 1
            fingerprint = real_fingerprint(repo_root)
            if calls[0] == 2:
                fingerprint = relay_log.ObjectDbFingerprint(
                    fingerprint.entries + (("zz.fake", "regular", 1, 0, "0" * 64),),
                    fingerprint.count_objects,
                )
            return fingerprint

        snap = self.runtime / "m4"
        argv = [
            "lint", "--plan", str(self.repo / self.PLAN_REL),
            "--amend-check", "before", "--repo", str(self.repo),
            "--snapshot-dir", str(snap), "--proposed-path", self.DEV_PLAN,
            "--config-dir", str(SKILL_DIR),
        ]
        stderr = io.StringIO()
        with (
            mock.patch.object(relay_log, "_object_database_fingerprint", flaky),
            redirect_stderr(stderr),
        ):
            result_code = main(argv)
        self.assertEqual(2, result_code)
        self.assertIn("HC-RL-A122", stderr.getvalue())
        self.assertFalse(snap.exists())

    def test_normal_lint_and_argument_contract(self) -> None:
        """普通 lint 合同不变；amend-check 缺件按参数错误收口；顶层子命令仍三个。"""
        result = self.run_lint_cli(self.repo / self.PLAN_REL)
        self.assertEqual(0, result.returncode, result.stderr)
        plan_dir = str(self.repo / self.PLAN_REL)
        for argv in (
            ("lint", "--plan", plan_dir, "--amend-check", "before"),
            ("lint", "--plan", plan_dir, "--amend-check", "after", "--repo", str(self.repo)),
            (
                "lint", "--plan", plan_dir, "--amend-check", "before",
                "--repo", str(self.repo), "--snapshot-dir", str(self.runtime / "x"),
            ),
            (
                "lint", "--plan", plan_dir, "--amend-check", "after",
                "--repo", str(self.repo), "--snapshot-dir", str(self.runtime / "x"),
                "--proposed-path", self.DEV_PLAN,
            ),
            ("lint", "--plan", plan_dir, "--proposed-path", self.DEV_PLAN),
        ):
            with self.subTest(argv=argv):
                result = self.run_cli(*argv)
                self.assertEqual(2, result.returncode, result.stderr)
        result = self.run_cli("amend", "--plan", plan_dir)
        self.assertEqual(2, result.returncode)

    def test_before_rejects_bad_snapshot_dir(self) -> None:
        """snapshot-dir：必须绝对、未存在、无 symlink 父链、在仓与 git 元数据之外。"""
        existing = self.runtime / "exists"
        existing.mkdir()
        inside_repo = self.repo / "snap-inside"
        inside_git = self.repo / ".git" / "snap"
        for snap in (existing, inside_repo, inside_git):
            with self.subTest(snap=str(snap)):
                result = self.run_amend("before", snap, (self.DEV_PLAN,))
                self.assertEqual(2, result.returncode, result.stderr)
                self.assertIn("HC-RL-A122", result.stderr)
        argv = [
            "lint", "--plan", str(self.repo / self.PLAN_REL),
            "--amend-check", "before", "--repo", str(self.repo),
            "--snapshot-dir", "relative-snap", "--proposed-path", self.DEV_PLAN,
        ]
        result = self.run_cli(*argv)
        self.assertEqual(2, result.returncode, result.stderr)
        if os.name == "posix":
            link = self.runtime / "linked"
            os.symlink(self.repo, link)
            result = self.run_amend("before", link / "snap", (self.DEV_PLAN,))
            self.assertEqual(2, result.returncode, result.stderr)

    def test_snapshot_dir_tolerates_realpath_name_expansion(self) -> None:
        """Windows 8.3 短路径等效形态：realpath 展开后字符串变化但父链无 symlink
        ——不得误报 'symlink parent chain'；同一补丁下真 symlink 父链仍拒。"""
        snap = self.runtime / "x2snap"
        real_realpath = os.path.realpath

        def expands_8_3(path, *args, **kwargs):
            resolved = real_realpath(path, *args, **kwargs)
            if os.fspath(path) == os.fspath(snap):
                # 模拟 8.3→长名展开：同一目录项、不同字符串。
                return str(Path(resolved).parent.parent / "RUNNER~1" / snap.name)
            return resolved

        argv = [
            "lint", "--plan", str(self.repo / self.PLAN_REL),
            "--amend-check", "before", "--repo", str(self.repo),
            "--snapshot-dir", str(snap), "--proposed-path", self.DEV_PLAN,
            "--config-dir", str(SKILL_DIR),
        ]
        stderr = io.StringIO()
        with (
            mock.patch.object(os.path, "realpath", expands_8_3),
            redirect_stderr(stderr),
        ):
            self.assertEqual(0, main(argv), stderr.getvalue())
        self.assertTrue(snap.is_dir())
        if os.name == "posix":
            # 同一补丁形态下真 symlink 父链仍须整链拒绝。
            link = self.runtime / "linked83"
            os.symlink(self.repo, link)
            snap2 = link / "snap"
            argv[argv.index(str(snap))] = str(snap2)
            stderr = io.StringIO()
            with (
                mock.patch.object(os.path, "realpath", expands_8_3),
                redirect_stderr(stderr),
            ):
                code = main(argv)
            self.assertEqual(2, code)
            self.assertIn("symlink parent chain", stderr.getvalue())
            self.assertFalse(snap2.exists())


class SkillCoreDocTests(unittest.TestCase):
    """RLT_07 Batch 1 — HC-RL-A12/A19/A27/A66/A67/A98/A100/A117/A132 SKILL.md 核心合同。"""

    SKILL_MD = SKILL_DIR / "SKILL.md"
    ADAPTERS = (
        SKILL_DIR / "references" / "adapter-claude-code.md",
        SKILL_DIR / "references" / "adapter-codex.md",
    )
    FIVE_FILES = (
        SKILL_MD,
        *ADAPTERS,
        SKILL_DIR / "roles.toml",
        SKILL_DIR / "dh-mapping.toml",
    )
    MODEL_NAMES = ("opus", "gpt-5.6-terra")

    @classmethod
    def skill_text(cls) -> str:
        return cls.SKILL_MD.read_text(encoding="utf-8")

    def test_a12_five_files_present(self) -> None:
        missing = [p.name for p in self.FIVE_FILES if not p.is_file()]
        self.assertEqual([], missing)

    def test_a12_required_sections(self) -> None:
        text = self.skill_text()
        for section in ("角色表", "五阶段模板", "账本用法", "拓扑布局", "硬规则", "放弃项"):
            with self.subTest(section=section):
                self.assertRegex(text, rf"(?m)^##\s*{section}\b")

    def test_a117_recipe_sourced_from_task_type_only(self) -> None:
        text = self.skill_text()
        self.assertIn("task_type", text)
        self.assertIn("唯一来源", text)
        # 字段缺失时必须问用户、不得自行默认
        self.assertRegex(text, r"缺失.*问用户|问用户.*缺失|不得.{0,4}默认")

    def test_a98_plan_ledger_live_in_module_relay_dir(self) -> None:
        text = self.skill_text()
        self.assertIn("docs/modules/<模块>/relay/<plan_id>/", text)
        self.assertRegex(text, r"不.{0,4}任务工作区|不进.{0,4}工作区")

    def test_a19_linux_direct_test_before_closeout(self) -> None:
        text = self.skill_text()
        self.assertIn("Linux", text)
        self.assertIn("直跑 python 测试", text)  # oracle 原文「直跑 python 测试」逐字钉住
        self.assertRegex(text, r"原样.{0,6}progress|progress.{0,6}原样")

    def test_a27_credential_values_never_written(self) -> None:
        text = self.skill_text()
        self.assertIn("凭据", text)
        self.assertRegex(text, r"永不|禁写")

    def test_a100_terminology_not_mixed(self) -> None:
        text = self.skill_text()
        self.assertIn("终端空间", text)
        self.assertIn("任务工作区", text)
        # 两词必须各有定义语境且文档明令不混用
        self.assertRegex(text, r"不混用|不得混用|不是同一")
        # oracle：「workspace」一词在中文语境下不单独出现——三份文档全扫；
        # <workspace> 占位符与 CJK 紧邻裸词两种形态都拒（协议标头 workspace=<…> 是英文字段名，不算裸词）
        for path in (self.SKILL_MD, *self.ADAPTERS):
            doc = path.read_text(encoding="utf-8")
            with self.subTest(file=path.name):
                self.assertNotIn("<workspace>", doc)
                self.assertIsNone(
                    re.search(r"[一-鿿]workspace|workspace[一-鿿]", doc),
                    f"{path.name}: bare 'workspace' adjacent to Chinese",
                )

    def test_a66_coder_four_line_summary(self) -> None:
        text = self.skill_text()
        self.assertIn("四行", text)
        self.assertIn("无", text)  # 缺项写「无」

    def test_a66_scribe_materials_and_boundary(self) -> None:
        text = self.skill_text()
        self.assertIn("素材", text)
        self.assertIn("优先级", text)
        self.assertRegex(text, r"不.{0,4}发明")
        self.assertIn("findings", text)
        self.assertIn("lesson_candidates", text)

    def test_a67_writer_mapping(self) -> None:
        text = self.skill_text()
        self.assertRegex(text, r"findings\.md.{0,40}coder|coder.{0,40}findings\.md")
        self.assertRegex(
            text,
            r"lesson_candidates\.md.{0,40}coder|coder.{0,40}lesson_candidates\.md",
        )
        self.assertRegex(text, r"progress\.md.{0,40}scribe|scribe.{0,40}progress\.md")

    def test_a143_light_plan_review_severity_classification(self) -> None:
        """HC-RL-A143: SKILL.md 的 plan-reviewer 模板写明 light 档两级分级——
        措辞/格式/引用陈旧一律 P2 不阻断；allowed-paths、写入者边界、
        节点/阶段边界、验收命令与完成信号四类仍 P1；附 heavy/normal 不变。"""
        text = self.skill_text()
        self.assertIn("P2 不阻断", text)
        for anchor in (
            "allowed-paths",
            "写入者边界",
            "节点/阶段边界",
            "验收命令与完成信号",
            "P1 阻断",
            "heavy/normal 不变",
        ):
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, text)

    def test_ledger_note_contract_documented(self) -> None:
        """add 强制的 note 合同、控制事件写入者与决策归属必须在 SKILL.md 可查（一致性 P1 整改钉住）。"""
        text = self.skill_text()
        for token in (
            "stage_id=",
            "outcome=",
            "decider=",
            "strategist=",
            "config_dir=",
            "plan=",
            "plan_amend",
            "monitor_restart",
        ):
            with self.subTest(token=token):
                self.assertIn(token, text)
        self.assertIn("恰含一个", text)  # helper token 数量闸
        self.assertIn("被阻塞", text)  # 决策类事件记在触发 agent 名下
        # strategist 链归属：decision 记触发 coder 名下、agent_launch/done 才记 strategist 名下
        # （一致性复核整改引入的反例钉住——decision 若归 strategist 会被账本 A69 拒）
        self.assertRegex(text, r"`decision`.{0,24}coder 名下")
        self.assertNotRegex(text, r"`decision`.{0,24}strategist 名下")
        self.assertIn("planner-amend", text)  # 四名豁免清单含改计划实例

    def test_a132_no_hardcoded_model_names(self) -> None:
        for path in (self.SKILL_MD, *self.ADAPTERS):
            text = path.read_text(encoding="utf-8")
            for name in self.MODEL_NAMES:
                with self.subTest(file=path.name, name=name):
                    pattern = rf"(?<![A-Za-z0-9.-]){re.escape(name)}(?![A-Za-z0-9.-])"
                    self.assertIsNone(re.search(pattern, text, re.IGNORECASE))

    def test_planner_amend_template_contract(self) -> None:
        """RLT_09 B4 / HC-RL-A122：SKILL.md 必须给出可执行的 planner-amend 模板——
        输入四件、三类闭集白名单、design/ 禁区、预检整份拒绝、一次改完、
        after 精确 diff + 普通 lint、最多修三次、结构化 out-of-scope done.note、
        monitor 写 blocked stage_result、不写 blocked/escalate/plan_amend、不建新卡七件套。"""
        text = self.skill_text()
        for token in (
            "planner-amend",
            "--amend-check",
            "before",
            "after",
            "--proposed-path",
            "--snapshot-dir",
            "outcome=out-of-scope",
            "proposal=",
            "reason=",
            "stage_result",
            "outcome=blocked",
            "relay_plan.md",
            "dev_plan/P<N>-",
            "task_plan.md",
            "design/",
        ):
            with self.subTest(token=token):
                self.assertIn(token, text)
        # 输入恰四件：方案文件、当前 relay_plan、开发方案、已有卡 task_plan。
        for token in ("方案文件", "relay_plan", "开发方案", "task_plan"):
            with self.subTest(input=token):
                self.assertIn(token, text)
        # 一次改完 + 最多修三次 + 第三次零文件变化收尾。
        self.assertIn("一次改完", text)
        self.assertRegex(text, r"最多.{0,4}修.{0,2}三次|最多.{0,4}三次")
        self.assertIn("零文件变化", text)
        # 禁区命中：任何文件都不改，只写结构化 done.note 后停止。
        self.assertRegex(text, r"禁区.{0,30}不改|任何文件都不改|零变化")
        # 禁写事件与七件套边界。
        self.assertRegex(text, r"不写.{0,12}`?blocked`?.{0,12}`?escalate`?|禁.{0,4}blocked")
        self.assertIn("七件套", text)


class SkillTemplateTests(RelayCliTestCase):
    """RLT_07 Batch 2 — HC-RL-A95/A133/A127/A102/A113/A103/A114/A96 模板与运行时合同。"""

    NODE_TYPES = {"build", "construction", "review", "rework", "handoff"}
    CARD = "DHR_90"
    TEMPLATE_RE = re.compile(
        r"###\s+([WCXRF]) 阶段模板.*?```markdown\n(.*?)```", re.S
    )

    @classmethod
    def _template_rows(cls) -> dict[str, dict[str, list[str]]]:
        """Split each `### <S> 阶段模板` fenced block into its node/agent row lists."""
        text = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
        blocks: dict[str, dict[str, list[str]]] = {}
        for stage, body in cls.TEMPLATE_RE.findall(text):
            rows: dict[str, list[str]] = {"node": [], "agent": []}
            current = None
            for line in body.splitlines():
                if re.match(r"^\|\s*node\s*\|\s*card\s*\|", line):
                    current = "node"
                    continue
                if re.match(r"^\|\s*agent\s*\|\s*node\s*\|", line):
                    current = "agent"
                    continue
                if not line.startswith("|") or line.startswith("|---"):
                    continue
                if current:
                    rows[current].append(line)
            blocks[stage] = rows
        return blocks

    @staticmethod
    def _cells(row: str) -> list[str]:
        return [cell.strip() for cell in row.strip().strip("|").split("|")]

    @classmethod
    def _fill(
        cls, row: str, *, prev: str = "", n: str = "1", k: str = "1", path: str = "requirement"
    ) -> str:
        return (
            row.replace("<card>", cls.CARD)
            .replace("<prev>", prev)
            .replace("<n>", n)
            .replace("<k>", k)
            .replace("<d>", "1")
            .replace("<打回路>", path)
        )

    def _assembled_plan(
        self, *, recipe: str = "normal", include_x: bool = False
    ) -> tuple[list[str], list[str]]:
        """Instantiate the SKILL.md stage templates into lint-able node/agent rows."""
        blocks = self._template_rows()
        order = ["W", "C", "R", "X"] if include_x else ["W", "C", "R", "F"]
        node_rows: list[str] = []
        agent_rows: list[str] = []
        prev = ""
        for stage in order:
            nrows = [self._fill(row, prev=prev) for row in blocks[stage]["node"]]
            arows: list[str] = []
            for row in blocks[stage]["agent"]:
                filled = self._fill(row, prev=prev)
                if "<reviewer>" in filled:
                    reviewers = repo_config().recipe_reviewers(recipe) or ()
                    arows.extend(
                        filled.replace("<reviewer>", name).replace("<路>", name)
                        for name in reviewers
                    )
                else:
                    arows.append(filled)
            node_rows.extend(nrows)
            agent_rows.extend(arows)
            prev = self._cells(nrows[-1])[0]
        return node_rows, agent_rows

    def _write_template_plan(
        self, *, recipe: str = "normal", decision_mode: str = "auto", include_x: bool = False
    ) -> None:
        node_rows, agent_rows = self._assembled_plan(recipe=recipe, include_x=include_x)
        self.write_plan(
            node_rows=node_rows,
            agent_rows=agent_rows,
            marker=(
                "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-12 session=app "
                f"decision_mode={decision_mode} recipe={recipe} cards=DHR_90 -->"
            ),
        )

    def add_ok(self, event: str, *, node: str, agent: str, note: str = "") -> None:
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)

    def assert_rejected(
        self, event: str, *, node: str, agent: str, note: str = "", code: str | None = None
    ) -> None:
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        before = ledger_path.read_bytes() if ledger_path.exists() else None
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)
        expected = rf"^error: {re.escape(code)} " if code else r"^error: "
        self.assertRegex(result.stderr, expected)
        after = ledger_path.read_bytes() if ledger_path.exists() else None
        self.assertEqual(before, after, "a rejected add must not touch ledger bytes")

    def ledger_rows(self) -> list[dict[str, object]]:
        return [
            json.loads(line)
            for line in (self.plan_path.parent / "relay_log.jsonl").read_text(encoding="utf-8").splitlines()
        ]

    def _close_w_stage(self) -> None:
        """plan_loaded → W#1 fully closed (builder + plan-reviewer), per W template."""
        self.add_ok("plan_loaded", node="W1", agent="orchestrator#1", note="skill=0.1.0")
        self.add_ok("stage_start", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("monitor_launch", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("node_start", node="W1", agent="monitor#1")
        self.add_ok("agent_launch", node="W1", agent="builder#1")
        self.add_ok("done", node="W1", agent="builder#1")
        self.add_ok("agent_launch", node="W1", agent="plan-reviewer#1")
        self.add_ok("done", node="W1", agent="plan-reviewer#1")
        self.add_ok("node_close", node="W1", agent="monitor#1")
        self.add_ok("stage_result", node="W1", agent="monitor#1", note="stage_id=DHR_90:W#1 outcome=done")
        self.add_ok("stage_close", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")

    def _open_c1(self) -> None:
        self.add_ok("stage_start", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("monitor_launch", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("node_start", node="C1", agent="monitor#1")

    def _close_stage(self, node: str, stage_id: str) -> None:
        self.add_ok("node_close", node=node, agent="monitor#1")
        self.add_ok("stage_result", node=node, agent="monitor#1", note=f"stage_id={stage_id} outcome=done")
        self.add_ok("stage_close", node=node, agent="orchestrator#1", note=f"stage_id={stage_id}")

    def _drive_to_x1(self) -> None:
        """W closed → C closed → R closed → X#1 open. coder#1 is live in X1."""
        self._close_w_stage()
        self._open_c1()
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("agent_launch", node="C1", agent="checker#1")
        self.add_ok("done", node="C1", agent="checker#1", note="round=1 通过")
        self.add_ok("done", node="C1", agent="coder#1", note="本批完成")
        self._close_stage("C1", "DHR_90:C#1")
        self.add_ok("stage_start", node="R1", agent="orchestrator#1", note="stage_id=DHR_90:R#1")
        self.add_ok("monitor_launch", node="R1", agent="orchestrator#1", note="stage_id=DHR_90:R#1")
        self.add_ok("node_start", node="R1", agent="monitor#1")
        for reviewer in ("requirement#1", "lesson#1"):
            self.add_ok("agent_launch", node="R1", agent=reviewer)
            self.add_ok("done", node="R1", agent=reviewer)
        self.add_ok("agent_launch", node="R1", agent="scribe#1")
        self.add_ok("done", node="R1", agent="scribe#1", note="review.md 已收敛")
        self._close_stage("R1", "DHR_90:R#1")
        self.add_ok("stage_start", node="X1", agent="orchestrator#1", note="stage_id=DHR_90:X#1")
        self.add_ok("monitor_launch", node="X1", agent="orchestrator#1", note="stage_id=DHR_90:X#1")
        self.add_ok("node_start", node="X1", agent="monitor#1")

    # --- 结构合同 ---

    def test_five_stage_templates_extract(self) -> None:
        blocks = self._template_rows()
        self.assertEqual({"W", "C", "R", "X", "F"}, set(blocks))
        for stage, rows in blocks.items():
            with self.subTest(stage=stage):
                self.assertTrue(rows["node"], f"{stage} template has no node row")
                self.assertTrue(rows["agent"], f"{stage} template has no agent row")

    def test_templates_lint_clean(self) -> None:
        """Assembled main chain and rework chain both pass lint for every recipe tier."""
        for recipe in ("heavy", "normal", "light"):
            with self.subTest(recipe=recipe):
                self._write_template_plan(recipe=recipe)
                lint_plan(self.plan_path, repo_config())
        self._write_template_plan(include_x=True)
        lint_plan(self.plan_path, repo_config())

    def test_a127_no_kickoff_or_verify_node_types(self) -> None:
        for stage, rows in self._template_rows().items():
            for row in rows["node"]:
                node_type = self._cells(row)[3]
                with self.subTest(stage=stage, type=node_type):
                    self.assertIn(node_type, self.NODE_TYPES)

    def test_a95_a133_c_template_shape(self) -> None:
        """A95/A133: C node carries coder+checker+scribe+decider with frozen triggers/close."""
        blocks = self._template_rows()
        node_cells = [self._cells(row) for row in blocks["C"]["node"]]
        self.assertEqual(1, len(node_cells))
        self.assertEqual("construction", node_cells[0][3])
        self.assertEqual("agent:checker", node_cells[0][4])
        agents = {self._cells(row)[0]: self._cells(row) for row in blocks["C"]["agent"]}
        self.assertEqual({"coder", "checker", "scribe", "decider"}, set(agents))
        self.assertEqual("", agents["coder"][5])
        self.assertEqual("", agents["checker"][5])
        self.assertEqual("on:done:coder", agents["scribe"][5])
        self.assertEqual("on:blocked", agents["decider"][5])

    # --- 运行时合同（模板驱动的行为断言） ---

    def test_a102_checkpoint_round_trips_do_not_burn_attempts(self) -> None:
        """A102: checkpoint 往返不消耗 attempt——lost 后重拉仍是 #2 而非更高号。"""
        self._write_template_plan()
        self._close_w_stage()
        self._open_c1()
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("agent_launch", node="C1", agent="checker#1")
        for round_ in (1, 2, 3):
            self.add_ok("checkpoint", node="C1", agent="coder#1", note=f"round={round_} 小结")
            self.add_ok("checkpoint", node="C1", agent="checker#1", note=f"round={round_} 方案")
        self.add_ok("agent_lost", node="C1", agent="coder#1", note="pane 失联")
        # checkpoint 若计 attempt，此处合法号会被推高；#2 被接受即证明往返不增
        self.add_ok("agent_launch", node="C1", agent="coder#2", note="重拉 attempt=2")

    def test_a113_attempt_only_after_lost_or_cancelled(self) -> None:
        """A113: done 终态不允许重拉；agent_lost / cancelled 之后 attempt+1 合法。"""
        self._write_template_plan()
        self._close_w_stage()
        self._open_c1()
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("agent_launch", node="C1", agent="checker#1")
        self.add_ok("done", node="C1", agent="coder#1")
        self.assert_rejected("agent_launch", node="C1", agent="coder#2", code="HC-RL-A49")
        # cancelled 支路：checker 取消后重拉 +1
        self.add_ok("cancelled", node="C1", agent="checker#1", note="用户裁决取消")
        self.add_ok("agent_launch", node="C1", agent="checker#2", note="重拉 attempt=2")

    def test_a103_rework_node_starts_fresh_attempt(self) -> None:
        """A103: X 是新节点实例——C 节点 coder 到 #2，X1 内 coder 仍从 #1 起且互不干扰。"""
        self._write_template_plan(include_x=True)
        self._close_w_stage()
        self._open_c1()
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("agent_lost", node="C1", agent="coder#1", note="失联")
        self.add_ok("agent_launch", node="C1", agent="coder#2")
        self.add_ok("agent_launch", node="C1", agent="checker#1")
        self.add_ok("done", node="C1", agent="checker#1")
        self.add_ok("done", node="C1", agent="coder#2")
        self._close_stage("C1", "DHR_90:C#1")
        self.add_ok("stage_start", node="R1", agent="orchestrator#1", note="stage_id=DHR_90:R#1")
        self.add_ok("monitor_launch", node="R1", agent="orchestrator#1", note="stage_id=DHR_90:R#1")
        self.add_ok("node_start", node="R1", agent="monitor#1")
        for reviewer in ("requirement#1", "lesson#1"):
            self.add_ok("agent_launch", node="R1", agent=reviewer)
            self.add_ok("done", node="R1", agent=reviewer)
        self.add_ok("agent_launch", node="R1", agent="scribe#1")
        self.add_ok("done", node="R1", agent="scribe#1")
        self._close_stage("R1", "DHR_90:R#1")
        self.add_ok("stage_start", node="X1", agent="orchestrator#1", note="stage_id=DHR_90:X#1")
        self.add_ok("monitor_launch", node="X1", agent="orchestrator#1", note="stage_id=DHR_90:X#1")
        self.add_ok("node_start", node="X1", agent="monitor#1")
        self.add_ok("agent_launch", node="X1", agent="coder#1", note="新实例 attempt=1")
        self.assert_rejected("agent_launch", node="X1", agent="coder#2", code="HC-RL-A49")

    def test_a96_a114_decider_chain_positive_legs(self) -> None:
        """A96/A114 正例腿：两模式 resume 都记回原 coder#1，不新增 agent_launch。"""
        for decision_mode in ("auto", "consult"):
            with self.subTest(decision_mode=decision_mode):
                self.reset_ledger()
                self._write_template_plan(decision_mode=decision_mode)
                self._close_w_stage()
                self._open_c1()
                self.add_ok("agent_launch", node="C1", agent="coder#1")
                self.add_ok("agent_launch", node="C1", agent="checker#1")
                self.add_ok("blocked", node="C1", agent="coder#1", note="表结构有二义")
                self.add_ok("escalate", node="C1", agent="coder#1", note="decider=decider#1")
                self.add_ok("agent_launch", node="C1", agent="decider#1")
                self.add_ok("decision", node="C1", agent="coder#1", note="decider=decider#1 decision.1.md")
                self.add_ok("done", node="C1", agent="decider#1")
                if decision_mode == "consult":
                    self.add_ok("user_decision", node="C1", agent="coder#1", note="用户同意方案")
                self.add_ok("resume", node="C1", agent="coder#1", note="按 decision.1.md 继续")
                launches = [
                    row["agent"]
                    for row in self.ledger_rows()
                    if row["node"] == "C1"
                    and row["event"] == "agent_launch"
                    and str(row["agent"]).startswith("coder#")
                ]
                self.assertEqual(["coder#1"], launches)

    def test_a114_consult_resume_without_user_decision_rejected(self) -> None:
        self._write_template_plan(decision_mode="consult")
        self._close_w_stage()
        self._open_c1()
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("agent_launch", node="C1", agent="checker#1")
        self.add_ok("blocked", node="C1", agent="coder#1")
        self.add_ok("escalate", node="C1", agent="coder#1", note="decider=decider#1")
        self.add_ok("agent_launch", node="C1", agent="decider#1")
        self.add_ok("decision", node="C1", agent="coder#1", note="decider=decider#1 decision.1.md")
        self.assert_rejected("resume", node="C1", agent="coder#1")

    def test_a114_auto_mode_rejects_user_decision_on_decider_chain(self) -> None:
        self._write_template_plan(decision_mode="auto")
        self._close_w_stage()
        self._open_c1()
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("agent_launch", node="C1", agent="checker#1")
        self.add_ok("blocked", node="C1", agent="coder#1")
        self.add_ok("escalate", node="C1", agent="coder#1", note="decider=decider#1")
        self.add_ok("agent_launch", node="C1", agent="decider#1")
        self.add_ok("decision", node="C1", agent="coder#1", note="decider=decider#1 decision.1.md")
        self.assert_rejected("user_decision", node="C1", agent="coder#1", note="auto 不该有")

    def test_a114_cancelled_uses_triggering_agent(self) -> None:
        """A142: cancelled 纳入 A69 决策归属闸——触发 coder 名下可写，非触发 agent 退 2。"""
        self._write_template_plan()
        self._close_w_stage()
        self._open_c1()
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("agent_launch", node="C1", agent="checker#1")
        self.add_ok("blocked", node="C1", agent="coder#1")
        self.add_ok("escalate", node="C1", agent="coder#1", note="decider=decider#1")
        self.add_ok("agent_launch", node="C1", agent="decider#1")
        self.add_ok("decision", node="C1", agent="coder#1", note="decider=decider#1 decision.1.md")
        self.add_ok("done", node="C1", agent="decider#1")
        self.assert_rejected("cancelled", node="C1", agent="checker#1", note="越权取消", code="HC-RL-A69")
        self.assert_rejected("cancelled", node="C1", agent="decider#2", note="helper 身份", code="HC-RL-A69")
        self.add_ok("cancelled", node="C1", agent="coder#1", note="按 decision.1.md 取消本节点")

    def test_a114_strategist_chain_on_rework_template(self) -> None:
        """A114 strategist 链：记在触发 coder 名下、user_decision 永必需、无 blocked 起头。"""
        self._write_template_plan(include_x=True)
        self._drive_to_x1()
        self.add_ok("agent_launch", node="X1", agent="coder#1")
        self.add_ok("escalate", node="X1", agent="coder#1", note="strategist=strategist#1 原因=rework 超限")
        self.add_ok("agent_launch", node="X1", agent="strategist#1")
        self.add_ok("decision", node="X1", agent="coder#1", note="strategist=strategist#1 strategy.1.md")
        self.add_ok("done", node="X1", agent="strategist#1")
        # strategist 链缺 user_decision 写 resume 必拒（A97，已实现，模板形状上钉住）
        self.assert_rejected("resume", node="X1", agent="coder#1", code="HC-RL-A97")
        self.add_ok("user_decision", node="X1", agent="coder#1", note="approve: 继续")
        self.add_ok("resume", node="X1", agent="coder#1", note="引用 user_decision 继续")
        # 决策类事件逐条钉在触发 coder 名下，生命周期事件在 strategist 自己名下
        rows = [
            row
            for row in self.ledger_rows()
            if row["node"] == "X1"
            and row["event"] in {"escalate", "decision", "user_decision", "resume"}
        ]
        self.assertEqual(
            ["escalate", "decision", "user_decision", "resume"],
            [row["event"] for row in rows],
        )
        self.assertEqual(["coder#1"] * 4, [row["agent"] for row in rows])
        lifecycle = [
            row
            for row in self.ledger_rows()
            if row["node"] == "X1" and row["event"] in {"agent_launch", "done"}
            and str(row["agent"]).startswith("strategist#")
        ]
        self.assertEqual(
            [("agent_launch", "strategist#1"), ("done", "strategist#1")],
            [(row["event"], row["agent"]) for row in lifecycle],
        )

    def test_a114_strategist_chain_cancelled_finale(self) -> None:
        """A114 strategist 链终局之二：user_decision 后 cancelled 记回原 coder。"""
        self._write_template_plan(include_x=True)
        self._drive_to_x1()
        self.add_ok("agent_launch", node="X1", agent="coder#1")
        self.add_ok("escalate", node="X1", agent="coder#1", note="strategist=strategist#1 原因=rework 超限")
        self.add_ok("agent_launch", node="X1", agent="strategist#1")
        self.add_ok("decision", node="X1", agent="coder#1", note="strategist=strategist#1 strategy.1.md")
        self.add_ok("done", node="X1", agent="strategist#1")
        self.assert_rejected("cancelled", node="X1", agent="coder#1", code="HC-RL-A97")
        self.add_ok("user_decision", node="X1", agent="coder#1", note="reject: 停卡")
        self.add_ok("cancelled", node="X1", agent="coder#1", note="引用 user_decision 停卡")


class SkillAdapterTests(unittest.TestCase):
    """RLT_07 Batch 3 — HC-RL-A21/A26/A27/A136/A12 adapter 合同。"""

    ADAPTER_SIDES = {
        "adapter-claude-code.md": "~/.claude/skills/relay-light/",
        "adapter-codex.md": "~/.codex/skills/relay-light/",
    }

    @classmethod
    def _adapter_texts(cls) -> dict[str, str]:
        return {
            name: (SKILL_DIR / "references" / name).read_text(encoding="utf-8")
            for name in cls.ADAPTER_SIDES
        }

    def test_a136_every_call_carries_side_config_dir(self) -> None:
        """枚举两 adapter 全部 relay_log.py 调用（命令模板写作 <RELAY_LOG> 占位）：
        每处显式带本侧 --config-dir；add/status/lint 三子命令各至少一次。"""
        for name, side_dir in self.ADAPTER_SIDES.items():
            text = self._adapter_texts()[name]
            # 枚举面 = 全部 add/status/lint 调用行（不认 --plan 是否存在——不带 --plan 的调用也要过 --config-dir 检查）
            calls = [
                ln
                for ln in text.splitlines()
                if re.search(r"(?:<RELAY_LOG>|relay_log\.py)\s+(?:add|status|lint)\b", ln)
            ]
            with self.subTest(adapter=name):
                self.assertTrue(calls, f"{name} has no relay_log.py invocations")
                for line in calls:
                    self.assertIn("--config-dir", line, line)
                    self.assertIn(side_dir, line, line)
                for sub in ("add", "status", "lint"):
                    self.assertTrue(
                        any(
                            re.search(rf"(?:<RELAY_LOG>|relay_log\.py)\s+{sub}\b", ln)
                            for ln in calls
                        ),
                        f"{name} missing a {sub} invocation",
                    )
                # Windows python / Linux python3 双写法
                self.assertIn("python3 <RELAY_LOG>", text)
                self.assertIn("python <RELAY_LOG>", text)

    def test_a21_wait_receiver_and_three_methods(self) -> None:
        for name in self.ADAPTER_SIDES:
            text = self._adapter_texts()[name]
            with self.subTest(adapter=name):
                self.assertIn("接收者", text)
                self.assertIn("watch", text)
                self.assertIn("前台", text)
                self.assertIn("后台", text)
                self.assertIn("--timeout", text)
                # watch 未实现 → 前台 wait 回退必须写明
                self.assertIn("未实现", text)
                self.assertIn("空等", text)
                # A21 分句2：面向监工/编排的 prompt 片段必须含硬规则原文
                self.assertIn("`wait` 返回时必须有接收者", text)
                self.assertIn("拉起监工", text)
                # blocked 返回必须走升级分路，不许被记成 done
                self.assertRegex(text, r"blocked.{0,20}记.{0,4}blocked|blocked.{0,20}升级")

    def test_a26_command_forms_claude_kind_and_stalled(self) -> None:
        for name in self.ADAPTER_SIDES:
            text = self._adapter_texts()[name]
            with self.subTest(adapter=name):
                self.assertIn("bash -lc", text)
                self.assertIn("pane run", text)
                self.assertIn("rename", text)
                self.assertIn("agent_prompt_stalled", text)
                self.assertIn("send-keys", text)
                self.assertIn("state_change_seq", text)
                self.assertIn("agent_lost", text)

    def test_a27_dispatch_template_credential_ban(self) -> None:
        for name in self.ADAPTER_SIDES:
            text = self._adapter_texts()[name]
            with self.subTest(adapter=name):
                self.assertIn("派活 prompt", text)
                self.assertIn("凭据", text)
                self.assertIn("永不", text)

    def test_dispatch_template_header_and_completion(self) -> None:
        """派活模板首行 = A34 冻结标头形态；relay-light 无 node_closed，完成即停。"""
        for name in self.ADAPTER_SIDES:
            text = self._adapter_texts()[name]
            with self.subTest(adapter=name):
                self.assertIn("[relay-light] worker", text)
                self.assertRegex(text, r"node=.{0,8}·.{0,4}agent=.{0,12}#.{0,8}·.{0,4}workspace=", text)
                self.assertNotIn("等 node_closed", text)
                self.assertIn("完成即停", text)

    def test_a12_five_files_filled_not_skeleton(self) -> None:
        for rel in (
            "SKILL.md",
            "references/adapter-claude-code.md",
            "references/adapter-codex.md",
            "roles.toml",
            "dh-mapping.toml",
        ):
            path = SKILL_DIR / rel
            with self.subTest(file=rel):
                self.assertTrue(path.is_file(), rel)
                text = path.read_text(encoding="utf-8")
                self.assertNotIn("骨架占位", text, rel)
                self.assertNotIn("由 RLT_07 交付", text, rel)

    def test_no_watch_subcommand_invoked(self) -> None:
        for name in self.ADAPTER_SIDES:
            text = self._adapter_texts()[name]
            with self.subTest(adapter=name):
                self.assertIsNone(re.search(r"relay_log\.py\s+watch", text))
                self.assertIsNone(re.search(r"<RELAY_LOG>\s+watch", text))

    def test_a141_dispatch_wait_and_sandbox_fallback_discipline(self) -> None:
        """HC-RL-A141: 两 adapter 各含三段原文——
        ① agent start 后 wait --until idle 再 prompt，prompt 后读 pane 末行核真提交；
        ② 编排等待优先账本文件事件监听 + 监工连续空闲 ≥2 分钟且无新账本行告警；
        ③ 沙箱型只读启动不可用的预检替代（bypass 沙箱 + 提示词只读约束 + launch_fix=）。"""
        segments = (
            ("--until idle", "pane 末行", "send-keys"),
            ("账本", "监听", "2 分钟", "无新账本行"),
            ("bypass", "只读", "launch_fix="),
        )
        for name in self.ADAPTER_SIDES:
            text = self._adapter_texts()[name]
            for index, anchors in enumerate(segments, start=1):
                for anchor in anchors:
                    with self.subTest(adapter=name, segment=index, anchor=anchor):
                        self.assertIn(anchor, text)

    def test_planner_amend_reference_isomorphic(self) -> None:
        """RLT_09 B4 / A122：两 adapter 只保留指向 SKILL.md 核心模板的同构引用行。"""
        texts = self._adapter_texts()
        pointer_lines = {}
        for name, text in texts.items():
            with self.subTest(adapter=name):
                lines = [ln for ln in text.splitlines() if "planner-amend" in ln]
                self.assertTrue(lines, f"{name} lacks a planner-amend pointer")
                pointer_lines[name] = lines
        self.assertEqual(
            pointer_lines["adapter-claude-code.md"], pointer_lines["adapter-codex.md"]
        )


class RelayStageResultRefTests(RelayCliTestCase):
    """RLT_21 C1 — HC-RL-A137：stage_result 按 outcome 分校验与 ref= 引用合同。"""

    def add_ok(self, event: str, *, node: str, agent: str, note: str = "") -> None:
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)

    def assert_rejected(
        self, event: str, *, node: str, agent: str, note: str = "", code: str
    ) -> subprocess.CompletedProcess[str]:
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        before = ledger_path.read_bytes() if ledger_path.exists() else None
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)
        self.assertRegex(result.stderr, rf"^error: {re.escape(code)} ")
        after = ledger_path.read_bytes() if ledger_path.exists() else None
        self.assertEqual(before, after, "a rejected add must not touch ledger bytes")
        return result

    def _write_plan(self) -> None:
        """W1 + C1/C2 同属 DHR_90:C#1；C2 始终未启动，保证实例存在未关节点。"""
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
                "| C2 | DHR_90 | DHR_90:C#1 | construction | agent:coder | C1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| coder | C2 | coder | | code.md | | |",
            ],
        )

    def _close_w_stage(self) -> None:
        self.add_ok("plan_loaded", node="W1", agent="orchestrator#1", note="skill=0.1.0")
        self.add_ok("stage_start", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("monitor_launch", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("node_start", node="W1", agent="monitor#1")
        self.add_ok("agent_launch", node="W1", agent="builder#1")
        self.add_ok("done", node="W1", agent="builder#1")
        self.add_ok("node_close", node="W1", agent="monitor#1")
        self.add_ok(
            "stage_result", node="W1", agent="monitor#1",
            note="stage_id=DHR_90:W#1 outcome=done 工作区就绪",
        )
        self.add_ok("stage_close", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")

    def _open_c_stage(self) -> None:
        self.add_ok("stage_start", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("monitor_launch", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("node_start", node="C1", agent="monitor#1")

    def _blocked_coder(self) -> None:
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("blocked", node="C1", agent="coder#1", note="环境起不来")

    def test_a137_blocked_with_valid_ref_accepted_while_nodes_open(self) -> None:
        """节点未关 + blocked + 合法 ref= → 接受；同场景 done 仍拒 A112。"""
        self._write_plan()
        self._close_w_stage()
        self._open_c_stage()
        self._blocked_coder()
        self.assert_rejected(
            "stage_result", node="C1", agent="monitor#1", code="HC-RL-A112",
            note="stage_id=DHR_90:C#1 outcome=done 未关却报完成",
        )
        self.add_ok(
            "stage_result", node="C1", agent="monitor#1",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#1:blocked 等用户裁决",
        )
        # blocked 引用的合法形态之二：ref 指向本实例内一条 agent_lost
        self.reset_ledger()
        self._close_w_stage()
        self._open_c_stage()
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("agent_lost", node="C1", agent="coder#1", note="NOT_RUN 沙箱起不来")
        self.add_ok(
            "stage_result", node="C1", agent="monitor#1",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#1:agent_lost 等用户裁决",
        )
        # failed 与 blocked 同一路：节点未关 + 合法 ref 即接受
        self.add_ok(
            "stage_result", node="C1", agent="monitor#1",
            note="stage_id=DHR_90:C#1 outcome=failed ref=coder#1:agent_lost 复核不过",
        )

    def test_a137_missing_ref_and_unknown_instance_each_exit_two(self) -> None:
        """缺 ref=、ref 指向本实例内不存在的 agent、跨实例引用，各退 2 报 A137。"""
        self._write_plan()
        self._close_w_stage()
        self._open_c_stage()
        self._blocked_coder()
        self.assert_rejected(
            "stage_result", node="C1", agent="monitor#1", code="HC-RL-A137",
            note="stage_id=DHR_90:C#1 outcome=blocked 等用户裁决",
        )
        self.assert_rejected(
            "stage_result", node="C1", agent="monitor#1", code="HC-RL-A137",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#9:blocked 引用不存在",
        )
        # builder#1 属于已关闭的 W#1，不属于本实例 C#1
        self.assert_rejected(
            "stage_result", node="C1", agent="monitor#1", code="HC-RL-A137",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=builder#1:blocked 跨实例引用",
        )
        self.assert_rejected(
            "stage_result", node="C1", agent="monitor#1", code="HC-RL-A137",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#1:done 非法后缀",
        )

    def test_a137_ref_overridden_by_resume_or_terminal_each_exit_two(self) -> None:
        """ref 引用已不是该 agent 最新事件（resume / 终态覆盖）各退 2 报 A137。"""
        self._write_plan()
        self._close_w_stage()
        self._open_c_stage()
        self._blocked_coder()
        # 终态覆盖：coder#1 从 blocked 走到 agent_lost，ref=coder#1:blocked 已陈旧
        self.add_ok("agent_lost", node="C1", agent="coder#1", note="NOT_RUN 起不来")
        self.assert_rejected(
            "stage_result", node="C1", agent="monitor#1", code="HC-RL-A137",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#1:blocked 已被终态覆盖",
        )
        # resume 覆盖：blocked→escalate→decision→resume 后 blocked 不再是最新事件
        self.reset_ledger()
        self._close_w_stage()
        self._open_c_stage()
        self._blocked_coder()
        self.add_ok("escalate", node="C1", agent="coder#1", note="decider=decider#1")
        self.add_ok("decision", node="C1", agent="coder#1", note="decider=decider#1 decision.1.md")
        self.add_ok("resume", node="C1", agent="coder#1", note="按 decision.1.md 继续")
        self.assert_rejected(
            "stage_result", node="C1", agent="monitor#1", code="HC-RL-A137",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#1:blocked 已被 resume 覆盖",
        )

    def test_a137_stage_close_after_blocked_still_rejected(self) -> None:
        """blocked stage_result 被接受后，stage_close 仍被拒——A118 先于节点全关前置检查。"""
        self._write_plan()
        self._close_w_stage()
        self._open_c_stage()
        self._blocked_coder()
        self.add_ok(
            "stage_result", node="C1", agent="monitor#1",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#1:blocked 等用户裁决",
        )
        self.assert_rejected(
            "stage_close", node="C1", agent="orchestrator#1", code="HC-RL-A118",
            note="stage_id=DHR_90:C#1",
        )

    def test_a137_fully_closed_stage_result_still_requires_ref(self) -> None:
        """全节点已关时 blocked/failed 同样强制合法最新 ref——缺 ref 各退 2 报 A137。"""
        self._write_plan()
        self._close_w_stage()
        self._open_c_stage()
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("done", node="C1", agent="coder#1")
        self.add_ok("node_close", node="C1", agent="monitor#1")
        # C2 留一个 agent_lost 的 coder#1（#2 done 满足 close=agent:coder）：
        # 本阶段实例内 coder#1 的最新事件 = agent_lost，可作合法 ref 目标。
        self.add_ok("node_start", node="C2", agent="monitor#1")
        self.add_ok("agent_launch", node="C2", agent="coder#1")
        self.add_ok("agent_lost", node="C2", agent="coder#1", note="NOT_RUN 沙箱起不来")
        self.add_ok("agent_launch", node="C2", agent="coder#2")
        self.add_ok("done", node="C2", agent="coder#2")
        self.add_ok("node_close", node="C2", agent="monitor#1")
        # 全关节点实例：缺 ref= 的 blocked 与 failed 各退 2 报 A137
        self.assert_rejected(
            "stage_result", node="C1", agent="monitor#1", code="HC-RL-A137",
            note="stage_id=DHR_90:C#1 outcome=blocked 等用户裁决",
        )
        self.assert_rejected(
            "stage_result", node="C1", agent="monitor#1", code="HC-RL-A137",
            note="stage_id=DHR_90:C#1 outcome=failed 复核未过",
        )
        # 合法最新 ref 接受；stage_close 对 blocked 仍 A118
        self.add_ok(
            "stage_result", node="C1", agent="monitor#1",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#1:agent_lost 等用户裁决",
        )
        self.assert_rejected(
            "stage_close", node="C1", agent="orchestrator#1", code="HC-RL-A118",
            note="stage_id=DHR_90:C#1",
        )
        self.add_ok(
            "stage_result", node="C1", agent="monitor#1",
            note="stage_id=DHR_90:C#1 outcome=done 用户裁决后继续",
        )
        self.add_ok("stage_close", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")


class RelayNotRunRetryTests(RelayCliTestCase):
    """RLT_21 C1 — HC-RL-A138：NOT_RUN 止损出口与用户授权 launch_fix 组。"""

    def add_ok(self, event: str, *, node: str, agent: str, note: str = "") -> None:
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)

    def assert_rejected(
        self, event: str, *, node: str, agent: str, note: str = "", code: str
    ) -> subprocess.CompletedProcess[str]:
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        before = ledger_path.read_bytes() if ledger_path.exists() else None
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(2, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)
        self.assertRegex(result.stderr, rf"^error: {re.escape(code)} ")
        after = ledger_path.read_bytes() if ledger_path.exists() else None
        self.assertEqual(before, after, "a rejected add must not touch ledger bytes")
        return result

    def status_payload(self) -> dict[str, object]:
        result = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(0, result.returncode, result.stderr)
        return json.loads(result.stdout)

    def _write_plan(self) -> None:
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
            ],
        )

    def _open_c_node(self) -> None:
        self.add_ok("plan_loaded", node="W1", agent="orchestrator#1", note="skill=0.1.0")
        self.add_ok("stage_start", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("monitor_launch", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("node_start", node="W1", agent="monitor#1")
        self.add_ok("agent_launch", node="W1", agent="builder#1")
        self.add_ok("done", node="W1", agent="builder#1")
        self.add_ok("node_close", node="W1", agent="monitor#1")
        self.add_ok(
            "stage_result", node="W1", agent="monitor#1",
            note="stage_id=DHR_90:W#1 outcome=done",
        )
        self.add_ok("stage_close", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("stage_start", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("monitor_launch", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("node_start", node="C1", agent="monitor#1")

    def _not_run_loss(self, agent: str) -> None:
        self.add_ok("agent_launch", node="C1", agent=agent)
        self.add_ok("agent_lost", node="C1", agent=agent, note="NOT_RUN 沙箱起不来")

    def _exhaust_coder(self) -> None:
        """三连 NOT_RUN 把 (C1, coder) 打到 attempt_max 止损。"""
        for n in (1, 2, 3):
            self._not_run_loss(f"coder#{n}")

    def test_a138_not_run_exhaustion_rejects_next_launch_a107(self) -> None:
        """连续 attempt_max 条 NOT_RUN agent_lost 后，下一条 agent_launch 退 2 报 A107；
        非 NOT_RUN 的失联重置连击；此刻 blocked ref= 指向最后一条 agent_lost 被接受。"""
        self._write_plan()
        self._open_c_node()
        # 一条普通失联打断连击：随后三条 NOT_RUN 才构成连续止损
        self.add_ok("agent_launch", node="C1", agent="coder#1")
        self.add_ok("agent_lost", node="C1", agent="coder#1", note="pane 失联")
        for n in (2, 3):
            self._not_run_loss(f"coder#{n}")
        self.add_ok("agent_launch", node="C1", agent="coder#4")  # 连击=2，仍可重拉
        self.add_ok("agent_lost", node="C1", agent="coder#4", note="NOT_RUN 环境仍不可用")
        # 连击=3=attempt_max：无授权一律拒
        self.assert_rejected(
            "agent_launch", node="C1", agent="coder#5", code="HC-RL-A107", note="",
        )
        self.assert_rejected(
            "agent_launch", node="C1", agent="coder#5", code="HC-RL-A107",
            note="launch_fix=bypass_sandbox 无授权引用",
        )
        # 止损出口的合法收尾：blocked ref=<agent>#<attempt_max 内最新失联实例>:agent_lost
        self.add_ok(
            "stage_result", node="C1", agent="monitor#1",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#4:agent_lost 等用户裁决",
        )

    def test_a138_user_decision_authorizes_one_fix_group(self) -> None:
        """user_decision launch_fix=<token> 记在被止损 agent 名下，授权一组重拉预算；
        无授权、token 不一致、缺 token 各退 2；attempt 续增且组内重新止损计数。"""
        self._write_plan()
        self._open_c_node()
        self._exhaust_coder()
        self.add_ok(
            "stage_result", node="C1", agent="monitor#1",
            note="stage_id=DHR_90:C#1 outcome=blocked ref=coder#3:agent_lost 等用户裁决",
        )
        self.add_ok(
            "user_decision", node="C1", agent="coder#3",
            note="launch_fix=bypass_sandbox 用户裁决：换沙箱档重拉",
        )
        self.assert_rejected(
            "agent_launch", node="C1", agent="coder#4", code="HC-RL-A107",
            note="launch_fix=workspace-write token 不一致",
        )
        self.assert_rejected(
            "agent_launch", node="C1", agent="coder#4", code="HC-RL-A107", note="缺 token",
        )
        self.add_ok(
            "agent_launch", node="C1", agent="coder#4", note="launch_fix=bypass_sandbox",
        )
        # 组内止损重新计 attempt_max：#4/#5/#6 连丢后 #7 拒
        for n in (4, 5):
            self.add_ok("agent_lost", node="C1", agent=f"coder#{n}", note="NOT_RUN 仍起不来")
            self.add_ok(
                "agent_launch", node="C1", agent=f"coder#{n + 1}",
                note="launch_fix=bypass_sandbox",
            )
        self.add_ok("agent_lost", node="C1", agent="coder#6", note="NOT_RUN 仍起不来")
        self.assert_rejected(
            "agent_launch", node="C1", agent="coder#7", code="HC-RL-A107",
            note="launch_fix=bypass_sandbox 组预算已尽",
        )

    def test_a138_second_fix_group_and_premature_authorization_rejected(self) -> None:
        """每个 (node,agent) 至多一个 launch_fix 组；未止损时的授权 user_decision 同样退 2。"""
        self._write_plan()
        self._open_c_node()
        # 未止损：coder#1 只丢一条，授权 user_decision 不成立
        self._not_run_loss("coder#1")
        self.assert_rejected(
            "user_decision", node="C1", agent="coder#1", code="HC-RL-A107",
            note="launch_fix=bypass_sandbox 预算未耗尽",
        )
        # 走完一组授权后，第二条带 launch_fix 的 user_decision 被拒
        self._not_run_loss("coder#2")
        self._not_run_loss("coder#3")
        self.add_ok(
            "user_decision", node="C1", agent="coder#3", note="launch_fix=bypass_sandbox",
        )
        self.add_ok(
            "agent_launch", node="C1", agent="coder#4", note="launch_fix=bypass_sandbox",
        )
        self.add_ok("agent_lost", node="C1", agent="coder#4", note="NOT_RUN 仍起不来")
        self.assert_rejected(
            "user_decision", node="C1", agent="coder#4", code="HC-RL-A107",
            note="launch_fix=workspace-write 第二组",
        )

    def test_a138_status_reasons_list_not_run_count_and_fix_group(self) -> None:
        """status 不可关原因列出 NOT_RUN 计数与 fix 组（未授权 / 已授权两态）。"""
        self._write_plan()
        self._open_c_node()
        self._exhaust_coder()
        payload = self.status_payload()
        reasons = payload["nodes"][1]["reasons"]
        self.assertTrue(
            any("NOT_RUN" in reason and "3" in reason and "未授权" in reason for reason in reasons),
            reasons,
        )
        self.add_ok(
            "user_decision", node="C1", agent="coder#3", note="launch_fix=bypass_sandbox",
        )
        self.add_ok(
            "agent_launch", node="C1", agent="coder#4", note="launch_fix=bypass_sandbox",
        )
        self.add_ok("agent_lost", node="C1", agent="coder#4", note="NOT_RUN 仍起不来")
        reasons = self.status_payload()["nodes"][1]["reasons"]
        self.assertTrue(
            any(
                "NOT_RUN" in reason and "bypass_sandbox" in reason for reason in reasons
            ),
            reasons,
        )


class RelayLaunchFixStatusTests(RelayCliTestCase):
    """RLT_21 C1 — HC-RL-A139：launch_fix= 运行事实记账与 status --json 暴露。"""

    def add_ok(self, event: str, *, node: str, agent: str, note: str = "") -> None:
        result = self.run_add(event, node=node, agent=agent, note=note)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)

    def status_payload(self) -> dict[str, object]:
        result = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(0, result.returncode, result.stderr)
        return json.loads(result.stdout)

    def _write_plan(self) -> None:
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| checker | C1 | checker | | check.md | | |",
            ],
        )

    def _open_c_node(self) -> None:
        self.add_ok("plan_loaded", node="W1", agent="orchestrator#1", note="skill=0.1.0")
        self.add_ok("stage_start", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("monitor_launch", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("node_start", node="W1", agent="monitor#1")
        self.add_ok("agent_launch", node="W1", agent="builder#1")
        self.add_ok("done", node="W1", agent="builder#1")
        self.add_ok("node_close", node="W1", agent="monitor#1")
        self.add_ok(
            "stage_result", node="W1", agent="monitor#1",
            note="stage_id=DHR_90:W#1 outcome=done",
        )
        self.add_ok("stage_close", node="W1", agent="orchestrator#1", note="stage_id=DHR_90:W#1")
        self.add_ok("stage_start", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("monitor_launch", node="C1", agent="orchestrator#1", note="stage_id=DHR_90:C#1")
        self.add_ok("node_start", node="C1", agent="monitor#1")

    def test_a139_launch_fix_is_freeform_note_token_exposed_in_status_json(self) -> None:
        """agent_launch.note 可含 launch_fix=<token>：add 不校验计划 launch 列、
        不要求 plan_amend；status --json 该 agent 条目暴露 launch_fix，无则 null。"""
        self._write_plan()
        self._open_c_node()
        self.add_ok(
            "agent_launch", node="C1", agent="coder#1",
            note="launch_fix=workspace-write 沙箱换档",
        )
        self.add_ok("agent_launch", node="C1", agent="checker#1")
        agents = {agent["agent"]: agent for agent in self.status_payload()["agents"]}
        self.assertEqual("workspace-write", agents["coder#1"]["launch_fix"])
        self.assertIsNone(agents["checker#1"]["launch_fix"])
        self.assertIsNone(agents["builder#1"]["launch_fix"])

    def test_a139_lint_ignores_launch_column_vs_ledger_mismatch(self) -> None:
        """lint 不因计划 launch 列与账本 launch_fix 事实不一致而失败。"""
        self._write_plan()  # 计划 launch 列留空 → 取 roles.toml 默认档
        self._open_c_node()
        self.add_ok(
            "agent_launch", node="C1", agent="coder#1",
            note="launch_fix=workspace-write 与计划默认档不一致",
        )
        result = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("", result.stderr)


class RelayLedgerSilenceTests(RelayCliTestCase):
    """RLT_21 C1 — HC-RL-A140：limits.silence_timeout_min 与 ledger_silent 监工提示。"""

    def _write_plan(self) -> None:
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | W1 | |",
            ],
            agent_rows=[
                "| builder | W1 | builder | | task_plan.md | | |",
                "| coder | C1 | coder | | code.md | | |",
                "| checker | C1 | checker | | check.md | | |",
            ],
        )

    def _write_ledger(self) -> None:
        self.write_ledger_rows(
            (
                ("2026-09-11T08:00:00+08:00", "W1", "plan_loaded", "orchestrator#1", "skill=0.1.0"),
                ("2026-09-11T08:01:00+08:00", "W1", "stage_start", "orchestrator#1", "stage_id=DHR_90:W#1"),
                ("2026-09-11T08:02:00+08:00", "W1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:W#1"),
                ("2026-09-11T08:03:00+08:00", "W1", "node_start", "monitor#1", ""),
                ("2026-09-11T08:04:00+08:00", "W1", "agent_launch", "builder#1", ""),
                ("2026-09-11T08:05:00+08:00", "W1", "done", "builder#1", ""),
                ("2026-09-11T08:06:00+08:00", "W1", "node_close", "monitor#1", ""),
                ("2026-09-11T08:07:00+08:00", "W1", "stage_result", "monitor#1", "stage_id=DHR_90:W#1 outcome=done"),
                ("2026-09-11T08:08:00+08:00", "W1", "stage_close", "orchestrator#1", "stage_id=DHR_90:W#1"),
                ("2026-09-11T08:10:00+08:00", "C1", "stage_start", "orchestrator#1", "stage_id=DHR_90:C#1"),
                ("2026-09-11T08:11:00+08:00", "C1", "monitor_launch", "orchestrator#1", "stage_id=DHR_90:C#1"),
                ("2026-09-11T08:12:00+08:00", "C1", "node_start", "monitor#1", ""),
                ("2026-09-11T08:13:00+08:00", "C1", "agent_launch", "coder#1", ""),
                ("2026-09-11T09:25:00+08:00", "C1", "agent_launch", "checker#1", ""),
            )
        )

    def _status(self, now: datetime, config: relay_log.RelayConfig) -> relay_log.Status:
        return relay_log.derive_status(
            lint_plan(self.plan_path, config),
            relay_log.read_ledger(self.plan_path.parent / "relay_log.jsonl"),
            now=now,
            limits=config.limits,
        )

    def test_a140_silence_timeout_loads_with_default_and_override(self) -> None:
        """dh-mapping.toml 可加载 limits.silence_timeout_min；缺省 30；非法类型拒。"""
        self.assertEqual(30, repo_config().limits.silence_timeout_min)
        # 配置拷贝：删掉该键回退默认、改成 5 生效、非整数 fail closed
        for name, mutate, expected in (
            ("silence-absent", lambda text: text.replace("silence_timeout_min = 30\n", ""), 30),
            ("silence-five", lambda text: text.replace("silence_timeout_min = 30", "silence_timeout_min = 5"), 5),
        ):
            with self.subTest(name=name):
                target = Path(self.tempdir.name) / name
                shutil.copytree(SKILL_DIR, target)
                mapping = target / "dh-mapping.toml"
                mapping.write_text(mutate(mapping.read_text(encoding="utf-8")), encoding="utf-8")
                self.assertEqual(expected, relay_log.load_config(target).limits.silence_timeout_min)
        bad = Path(self.tempdir.name) / "silence-bad"
        shutil.copytree(SKILL_DIR, bad)
        mapping = bad / "dh-mapping.toml"
        mapping.write_text(
            mapping.read_text(encoding="utf-8").replace(
                "silence_timeout_min = 30", 'silence_timeout_min = "half"'
            ),
            encoding="utf-8",
        )
        with self.assertRaises(RelayError) as raised:
            relay_log.load_config(bad)
        self.assertEqual("HC-RL-A92", raised.exception.code)

    def test_a140_ledger_silent_marks_only_live_agents_over_threshold(self) -> None:
        """打桩时钟：账本最近事件超过阈值的在场 agent 标 ledger_silent；
        未超阈值的与已终态的不标——纯提示，非挂死判定。"""
        self._write_plan()
        self._write_ledger()
        config = repo_config()
        now = datetime(2026, 9, 11, 9, 43, 0, tzinfo=timezone(timedelta(hours=8)))
        agents = {a.agent: a for a in self._status(now, config).agents}
        # coder#1 静默 90 分钟 > 30 阈值；checker#1 静默 18 分钟；builder#1 已 done 终态
        self.assertTrue(agents["coder#1"].ledger_silent)
        self.assertFalse(agents["checker#1"].ledger_silent)
        self.assertFalse(agents["builder#1"].ledger_silent)
        document = relay_log.status_document(self._status(now, config))
        silent_flags = {a["agent"]: a["ledger_silent"] for a in document["agents"]}
        self.assertEqual(
            {"builder#1": False, "coder#1": True, "checker#1": False}, silent_flags
        )
        rendered = relay_log.render_status_text(self._status(now, config), "plan")
        self.assertIn("ledger_silent", rendered)
        # 阈值自定义 5 分钟：连 checker#1 也超时
        target = Path(self.tempdir.name) / "silence-five"
        shutil.copytree(SKILL_DIR, target)
        mapping = target / "dh-mapping.toml"
        mapping.write_text(
            mapping.read_text(encoding="utf-8").replace(
                "silence_timeout_min = 30", "silence_timeout_min = 5"
            ),
            encoding="utf-8",
        )
        five = relay_log.load_config(target)
        agents = {a.agent: a for a in self._status(now, five).agents}
        self.assertTrue(agents["checker#1"].ledger_silent)
        self.assertFalse(agents["builder#1"].ledger_silent)

    def test_a140_monitor_templates_carry_silence_protocol(self) -> None:
        """SKILL.md 与两份 adapter 都含 ledger_silent 处置原文的四个关键锚点。"""
        for rel in (
            "SKILL.md",
            "references/adapter-claude-code.md",
            "references/adapter-codex.md",
        ):
            with self.subTest(template=rel):
                text = (SKILL_DIR / rel).read_text(encoding="utf-8")
                self.assertIn("ledger_silent", text)
                self.assertIn("silent_timeout", text)
                self.assertIn("三者均无变化", text)
                self.assertIn("不得中断", text)


class RelayCliEncodingTests(RelayCliTestCase):
    """RLT_09 B5 / F-003：入口 UTF-8 防护——ascii/cp1252 stdio 下 status/lint 的
    中文输出仍按合同 exit 且 bytes 可 UTF-8 解码；不继承薄壳 PYTHONUTF8。"""

    def _run_bytes(
        self, *arguments: str, io_encoding: str | None
    ) -> subprocess.CompletedProcess[bytes]:
        """Real CLI subprocess with byte capture; PYTHONUTF8 is never inherited."""
        env = {
            key: value
            for key, value in os.environ.items()
            if key not in {"PYTHONUTF8", "PYTHONIOENCODING"}
        }
        if io_encoding is not None:
            env["PYTHONIOENCODING"] = io_encoding
        return subprocess.run(
            [
                sys.executable,
                str(Path(__file__).with_name("relay_log.py")),
                *arguments,
                "--config-dir",
                str(SKILL_DIR),
            ],
            capture_output=True,
            check=False,
            env=env,
        )

    def _write_chinese_plan(self) -> None:
        """A fully valid plan whose card carries non-ASCII text."""
        self.write_plan(
            marker=(
                "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-10 "
                "session=app recipe=normal cards=卡X -->"
            ),
            node_rows=["| W1 | 卡X | 卡X:W#1 | build | agent:builder | | |"],
            agent_rows=["| builder | W1 | builder | | task_plan.md | | |"],
        )

    def _write_chinese_lint_violation(self) -> None:
        """marker lists DHR_90 only; the 卡X node row trips A87 echoing the card."""
        self.write_plan(
            node_rows=["| W1 | 卡X | 卡X:W#1 | build | agent:builder | | |"],
            agent_rows=["| builder | W1 | builder | | task_plan.md | | |"],
        )

    def test_fixture_baseline_succeeds_in_utf8_environment(self) -> None:
        """Fixture sanity: identical commands already pass under UTF-8 stdio."""
        self._write_chinese_plan()
        plan_dir = str(self.plan_path.parent)
        for argv in (
            ("status", "--plan", plan_dir),
            ("status", "--plan", plan_dir, "--json"),
        ):
            with self.subTest(argv=argv):
                result = self._run_bytes(*argv, io_encoding="utf-8")
                self.assertEqual(0, result.returncode)
                self.assertIn("卡X", result.stdout.decode("utf-8"))
        self._write_chinese_lint_violation()
        result = self._run_bytes("lint", "--plan", plan_dir, io_encoding="utf-8")
        self.assertEqual(2, result.returncode)
        self.assertIn("卡X", result.stderr.decode("utf-8"))

    def test_status_stdout_is_utf8_decodable_under_ascii_and_cp1252(self) -> None:
        self._write_chinese_plan()
        plan_dir = str(self.plan_path.parent)
        for encoding in ("ascii", "cp1252"):
            for argv in (
                ("status", "--plan", plan_dir),
                ("status", "--plan", plan_dir, "--json"),
            ):
                with self.subTest(encoding=encoding, argv=argv):
                    result = self._run_bytes(*argv, io_encoding=encoding)
                    self.assertEqual(
                        0, result.returncode, result.stderr.decode("utf-8", "replace")
                    )
                    self.assertIn("卡X", result.stdout.decode("utf-8"))

    def test_lint_stderr_and_json_are_utf8_decodable_under_ascii_and_cp1252(self) -> None:
        self._write_chinese_lint_violation()
        plan_dir = str(self.plan_path.parent)
        for encoding in ("ascii", "cp1252"):
            with self.subTest(encoding=encoding, mode="stderr"):
                result = self._run_bytes("lint", "--plan", plan_dir, io_encoding=encoding)
                self.assertEqual(2, result.returncode)
                self.assertIn("卡X", result.stderr.decode("utf-8"))
            with self.subTest(encoding=encoding, mode="json"):
                result = self._run_bytes(
                    "lint", "--plan", plan_dir, "--json", io_encoding=encoding
                )
                self.assertEqual(2, result.returncode)
                document = json.loads(result.stdout.decode("utf-8"))
                self.assertIn("卡X", json.dumps(document, ensure_ascii=False))


if __name__ == "__main__":
    unittest.main()
