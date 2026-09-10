"""Batch-1 through batch-4 acceptance tests for relay-light plan and ledger contracts."""

from __future__ import annotations

import json
import io
import sys
import subprocess
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent))
from relay_log import EVENTS, RelayError, _assert_acyclic, _validate_event, lint_plan, main, parse_plan


NODE_HEADER = "| node | card | stage | type | close | depends_on | note |"
AGENT_HEADER = "| agent | node | role | launch | output | trigger | note |"
SEPARATOR = "|---|---|---|---|---|---|---|"


class RelayPlanLintTests(unittest.TestCase):
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
    ) -> Path:
        marker = marker or (
            "<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-10 "
            "session=app recipe=normal cards=DHR_90 -->"
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
            lint_plan(self.plan_path)
        self.assertEqual(rule, raised.exception.code)

    def reset_ledger(self) -> None:
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        if ledger_path.exists():
            ledger_path.unlink()

    def write_single_node_plan(self, agents: list[str], *, close: str = "") -> None:
        self.write_plan(
            node_rows=[f"| W1 | DHR_90 | DHR_90:W#1 | build | {close} | | |"],
            agent_rows=agents,
        )

    def start_ledger(self) -> None:
        result = self.run_add("plan_loaded", agent="orchestrator#1", note="skill=0.1.0")
        self.assertEqual(0, result.returncode, result.stderr)

    def run_lint_cli(self, plan_dir: Path) -> subprocess.CompletedProcess[str]:
        return self.run_cli("lint", "--plan", str(plan_dir))

    def run_cli(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(Path(__file__).with_name("relay_log.py")), *arguments],
            text=True,
            capture_output=True,
            check=False,
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

    def test_valid_plan_defaults_decision_mode_and_resolves_default_dependency(self) -> None:
        self.write_plan(
            node_rows=[
                "| W1 | DHR_90 | DHR_90:W#1 | build | agent:builder | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | agent:coder | | |",
            ]
        )
        plan = parse_plan(self.plan_path)
        lint_plan(self.plan_path)
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
        plan = lint_plan(self.plan_path)
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
        self.assertRegex(result.stderr, r"^error: HC-RL-A18 marker cards=")

    def test_decision_mode_accepts_frozen_values_and_rejects_others(self) -> None:
        for decision_mode in ("auto", "consult"):
            with self.subTest(decision_mode=decision_mode):
                self.write_plan(
                    marker=(
                        "<!-- relay-light:plan v1 skill=0.1.0 session=app recipe=normal "
                        f"cards=DHR_90 decision_mode={decision_mode} -->"
                    )
                )
                self.assertEqual(decision_mode, lint_plan(self.plan_path).decision_mode)
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
        lint_plan(self.plan_path)

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
        plan = lint_plan(self.plan_path)
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
                "| reviewer | R1 | reviewer | | review.md | | |",
                "| checker | C2 | checker | | check.md | | |",
                "| scribe | F1 | scribe | | progress.md | | |",
            ],
        )
        self.assert_rule(
            "HC-RL-A129",
            node_rows=[
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | | |",
                "| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |",
                "| C2 | DHR_90 | DHR_90:C#1 | construction | | R1 | |",
            ],
            agent_rows=[
                "| coder | C1 | coder | | code.md | | |",
                "| reviewer | R1 | reviewer | | review.md | | |",
                "| checker | C2 | checker | | check.md | | |",
            ],
        )

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
        plan = lint_plan(self.plan_path)
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
        plan = lint_plan(self.plan_path)
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
                    lint_plan(self.plan_path)
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

    def test_lint_cli_smoke_uses_success_and_plan_error_contracts(self) -> None:
        self.write_plan()
        valid = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, valid.returncode)
        self.assertEqual("lint: ok\n", valid.stdout)
        self.assertEqual("", valid.stderr)

        missing = self.run_lint_cli(self.plan_path.parent / "missing")
        self.assertEqual(3, missing.returncode)
        self.assertEqual("", missing.stdout)
        self.assertRegex(missing.stderr, r"^error: HC-RL-A18 cannot read relay_plan\.md:")

        self.plan_path.write_text("not a relay plan\n", encoding="utf-8")
        malformed = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(3, malformed.returncode)
        self.assertEqual("", malformed.stdout)
        self.assertRegex(malformed.stderr, r"^error: HC-RL-A18 first line must be")

    def test_help_lists_exactly_the_three_frozen_subcommands(self) -> None:
        result = self.run_cli("--help")
        self.assertEqual(0, result.returncode)
        self.assertRegex(result.stdout, r"\{add,status,lint\}")

    def test_add_is_append_only_with_twenty_fixed_schema_events(self) -> None:
        self.write_plan()
        event_words = ["plan_loaded", *(["monitor_restart"] * 19)]
        before_entries = set(self.plan_path.parent.iterdir())
        prefix = b""
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        for sequence, event in enumerate(event_words, start=1):
            agent = "orchestrator#1" if event == "plan_loaded" else "monitor#1"
            note = "skill=0.1.0" if event == "plan_loaded" else ""
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

    def test_by_is_derived_from_agent_prefix_without_event_ownership_validation(self) -> None:
        self.write_plan()
        self.assertEqual(0, self.run_add("plan_loaded", agent="monitor#7", note="skill=0.1.0").returncode)
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="orchestrator#1").returncode)
        self.assertEqual(0, self.run_add("checkpoint", agent="orchestrator#1").returncode)
        rows = [
            json.loads(line)
            for line in (self.plan_path.parent / "relay_log.jsonl").read_text(encoding="utf-8").splitlines()
        ]
        self.assertEqual(
            ["monitor", "monitor", "orchestrator", "orchestrator"],
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
                ]
            )
        self.assertEqual(4, result)
        self.assertRegex(stderr.getvalue(), r"^error: ledger cannot append relay_log\.jsonl:")
        self.assertFalse((self.plan_path.parent / "relay_log.jsonl").exists())

    def test_non_newline_terminated_ledger_is_rejected_without_append(self) -> None:
        self.write_plan()
        ledger_path = self.plan_path.parent / "relay_log.jsonl"
        self.assertEqual(0, self.run_add("plan_loaded", agent="orchestrator#1", note="skill=0.1.0").returncode)
        unterminated = ledger_path.read_bytes().rstrip(b"\n")
        ledger_path.write_bytes(unterminated)

        status = self.run_cli("status", "--plan", str(self.plan_path.parent))
        self.assertEqual(4, status.returncode)
        self.assertEqual("", status.stdout)
        self.assertRegex(status.stderr, r"^error: ledger last ledger line is not newline-terminated")

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
        """HC-RL-A128: superseded rows leave lint and status observables unchanged."""
        self.write_plan()
        plain_lint = self.run_lint_cli(self.plan_path.parent)
        self.assertEqual(0, plain_lint.returncode, plain_lint.stderr)
        plain_status = self.run_cli("status", "--plan", str(self.plan_path.parent), "--json")
        self.assertEqual(0, plain_status.returncode, plain_status.stderr)
        plain_payload = json.loads(plain_status.stdout)

        self.write_plan(
            node_rows=[
                "| W0 | DHR_90 | DHR_90:W#1 | build | | | superseded-by:W1 |",
                "| W1 | DHR_90 | DHR_90:W#1 | build | | | |",
                "| C1 | DHR_90 | DHR_90:C#1 | construction | | | |",
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
        self.assertEqual(plain_payload, json.loads(superseded_status.stdout))

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
                self.assertRegex(result.stderr, r"^error: ledger line 1: ")

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
        self.assertEqual(
            0,
            self.run_add("stage_result", agent="monitor#1", note="stage_id=DHR_90:W#1 outcome=failed").returncode,
        )
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#2").returncode)

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
            ("decision", ["agent_launch", "blocked", "escalate", "decision"]),
            ("user_decision", ["agent_launch", "blocked", "escalate", "decision", "user_decision"]),
        )
        for name, prefix in cases:
            with self.subTest(name=name):
                self.reset_ledger()
                self.write_single_node_plan(["| coder | W1 | coder | | code.md | | |"])
                self.start_ledger()
                self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
                helper_note = "decider=decider#1"
                for event in prefix:
                    note = helper_note if event in {"escalate", "decision", "user_decision"} else ""
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
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        for agent in ("orchestrator#1", "monitor#1", "planner-amend#1", "strategist#1"):
            with self.subTest(agent=agent):
                self.assertEqual(0, self.run_add("agent_launch", agent=agent).returncode)
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
            ]
        )
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(2, self.run_add("agent_launch", agent="scribe#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        self.assertEqual(2, self.run_add("agent_launch", agent="scribe#1").returncode)
        self.assertEqual(0, self.run_add("done", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="scribe#1").returncode)

        self.reset_ledger()
        self.start_ledger()
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", agent="coder#1").returncode)
        self.assertEqual(2, self.run_add("agent_launch", agent="decider#1").returncode)
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
        self.assertEqual(2, self.run_add("node_start", node="C1", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("node_start", node="W1", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_launch", node="W1", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("done", node="W1", agent="coder#1").returncode)
        self.assertEqual(0, self.run_add("node_close", node="W1", agent="monitor#1").returncode)
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
        self.assertEqual(2, self.run_add("node_close", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("agent_lost", agent="checker#1").returncode)
        self.assertEqual(2, self.run_add("node_close", agent="monitor#1").returncode)

        self.reset_ledger()
        self.start_ledger()
        self.assertEqual(0, self.run_add("monitor_restart", agent="monitor#1").returncode)
        self.assertEqual(0, self.run_add("node_start", agent="monitor#1").returncode)
        for agent in ("coder#1", "checker#1"):
            self.assertEqual(0, self.run_add("agent_launch", agent=agent).returncode)
            self.assertEqual(0, self.run_add("done", agent=agent).returncode)
        self.assertEqual(0, self.run_add("node_close", agent="monitor#1").returncode)
        self.assertEqual(2, self.run_add("node_close", agent="monitor#1").returncode)
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

    def test_decision_events_carry_the_same_helper_token_as_the_escalate(self) -> None:
        """HC-RL-A69: decider/strategist chains must repeat one helper token in notes."""
        for helper_prefix, helper_instance in (("decider", "decider#1"), ("strategist", "strategist#1")):
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
                baseline = ledger_path.read_bytes()
                wrong_instance_user_decision = self.run_add(
                    "user_decision", agent="coder#1", note=f"{helper_prefix}={different_instance}"
                )
                self.assertEqual(2, wrong_instance_user_decision.returncode)
                self.assertRegex(wrong_instance_user_decision.stderr, r"^error: HC-RL-A69 ")
                self.assertEqual(baseline, ledger_path.read_bytes())
                for bad_note in ("", f"{helper_prefix}="):
                    user_decision = self.run_add("user_decision", agent="coder#1", note=bad_note)
                    self.assertEqual(2, user_decision.returncode)
                    self.assertRegex(user_decision.stderr, r"^error: HC-RL-A69 ")
                self.assertEqual(
                    0,
                    self.run_add("user_decision", agent="coder#1", note=f"{helper_prefix}={helper_instance} approve-amend").returncode,
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



if __name__ == "__main__":
    unittest.main()
