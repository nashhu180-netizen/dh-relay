#!/usr/bin/env python3
"""Fail-closed parser, structural linter, and append-only ledger for relay-light plans."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


NODE_HEADER = ("node", "card", "stage", "type", "close", "depends_on", "note")
AGENT_HEADER = ("agent", "node", "role", "launch", "output", "trigger", "note")
STAGES = frozenset({"W", "C", "R", "X", "F"})
NODE_TYPES = frozenset({"build", "construction", "review", "rework", "handoff"})
STAGE_ID_RE = re.compile(r"^(?P<card>[^:\s]+):(?P<stage>[A-Za-z]+)#(?P<k>[1-9][0-9]*)$")
MARKER_RE = re.compile(r"^<!-- relay-light:plan v1 (?P<fields>.+) -->$")
AGENT_INSTANCE_RE = re.compile(r"^[^#\s]+#[1-9][0-9]*$")
LEDGER_FIELDS = frozenset({"seq", "ts", "node", "event", "agent", "by", "note"})
CONTROL_EVENTS = frozenset(
    {
        "plan_loaded",
        "stage_start",
        "monitor_launch",
        "node_start",
        "node_close",
        "stage_result",
        "stage_close",
        "monitor_restart",
        "plan_amend",
    }
)
EVENTS = CONTROL_EVENTS | frozenset(
    {
        "agent_launch",
        "checkpoint",
        "blocked",
        "escalate",
        "decision",
        "user_decision",
        "resume",
        "done",
        "agent_lost",
        "cancelled",
    }
)
AGENT_EVENTS = EVENTS - CONTROL_EVENTS
TERMINAL_EVENTS = frozenset({"done", "agent_lost", "cancelled"})
CONTROL_AGENT_NAMES = frozenset({"orchestrator", "monitor"})
RELAUNCH_EXEMPT_AGENT_NAMES = frozenset(
    {"orchestrator", "monitor", "planner-amend", "strategist"}
)
DECISION_EVENTS = frozenset({"escalate", "decision", "user_decision", "resume"})
DECISION_HELPER_NAMES = frozenset({"decider", "strategist"})


class RelayError(Exception):
    """A contract violation with its frozen acceptance identifier."""

    def __init__(self, exit_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.exit_code = exit_code
        self.code = code
        self.message = message


class RelayArgumentParser(argparse.ArgumentParser):
    """Keep command-line parameter failures inside the relay error contract."""

    def error(self, message: str) -> None:
        raise _error("arguments", message)


@dataclass(frozen=True)
class NodeSpec:
    node: str
    card: str
    stage_id: str
    stage: str
    k: int
    type: str
    close: str
    depends_on: tuple[str, ...]
    note: str
    line: int
    superseded: bool


@dataclass(frozen=True)
class AgentSpec:
    agent: str
    node: str
    role: str
    launch: str
    output: str
    trigger: str
    note: str
    line: int
    superseded: bool


@dataclass(frozen=True)
class Plan:
    marker: str
    skill: str
    generated: str
    session: str
    recipe: str
    cards: tuple[str, ...]
    decision_mode: str
    nodes: tuple[NodeSpec, ...]
    agents: tuple[AgentSpec, ...]


def _error(code: str, message: str, *, exit_code: int = 2) -> RelayError:
    return RelayError(exit_code, code, message)


def _parse_marker(line: str) -> tuple[str, dict[str, str]]:
    match = MARKER_RE.fullmatch(line)
    if not match:
        raise _error("HC-RL-A18", "first line must be a relay-light plan marker", exit_code=3)
    fields: dict[str, str] = {}
    for token in match.group("fields").split():
        if "=" not in token:
            raise _error("HC-RL-A18", f"malformed marker token: {token}", exit_code=3)
        key, value = token.split("=", 1)
        if not key or not value or key in fields:
            raise _error("HC-RL-A18", f"invalid marker field: {token}", exit_code=3)
        fields[key] = value
    for required in ("skill", "session", "recipe", "cards"):
        if required not in fields:
            raise _error("HC-RL-A18", f"marker missing {required}=", exit_code=3)
    return line, fields


def _table_rows(lines: list[str], header: tuple[str, ...]) -> list[tuple[int, list[str]]]:
    expected = "| " + " | ".join(header) + " |"
    indices = [index for index, line in enumerate(lines) if line.strip() == expected]
    if len(indices) != 1:
        raise _error(
            "HC-RL-A24",
            f"missing or repeated fixed table header: {'/'.join(header)}",
            exit_code=3,
        )
    start = indices[0] + 1
    rows: list[tuple[int, list[str]]] = []
    saw_separator = False
    for index in range(start, len(lines)):
        line = lines[index]
        if not line.strip():
            break
        if not line.lstrip().startswith("|"):
            break
        values = line.split("|")
        if len(values) != len(header) + 2 or values[0].strip() or values[-1].strip():
            raise _error("HC-RL-A24", f"line {index + 1}: invalid table cell structure", exit_code=3)
        cells = [value.strip() for value in values[1:-1]]
        if all(cell and set(cell) <= {"-", ":"} for cell in cells):
            if saw_separator:
                raise _error("HC-RL-A24", f"line {index + 1}: duplicate table separator", exit_code=3)
            saw_separator = True
            continue
        if not saw_separator:
            raise _error("HC-RL-A24", f"line {index + 1}: table separator missing", exit_code=3)
        rows.append((index + 1, cells))
    if not saw_separator:
        raise _error("HC-RL-A24", f"table separator missing: {'/'.join(header)}", exit_code=3)
    return rows


def parse_plan(path: str | Path) -> Plan:
    """Parse the fixed relay_plan.md shape without guessing at Markdown."""
    plan_path = Path(path)
    try:
        lines = plan_path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        raise _error("HC-RL-A18", f"cannot read relay_plan.md: {exc}", exit_code=3) from exc
    if not lines:
        raise _error("HC-RL-A18", "relay_plan.md is empty", exit_code=3)
    marker, fields = _parse_marker(lines[0])
    node_rows = _table_rows(lines, NODE_HEADER)
    agent_rows = _table_rows(lines, AGENT_HEADER)

    nodes_unresolved: list[tuple[int, list[str]]] = node_rows
    nodes: list[NodeSpec] = []
    previous_active: str | None = None
    for line, cells in nodes_unresolved:
        node, card, stage_id, node_type, close, depends_raw, note = cells
        stage_match = STAGE_ID_RE.fullmatch(stage_id)
        stage = stage_match.group("stage") if stage_match else ""
        k = int(stage_match.group("k")) if stage_match else 0
        superseded = note.startswith("superseded-by:")
        if not depends_raw and previous_active is not None:
            dependencies = (previous_active,)
        elif depends_raw:
            dependencies = tuple(part.strip() for part in depends_raw.split(",") if part.strip())
        else:
            dependencies = ()
        nodes.append(
            NodeSpec(
                node=node,
                card=card,
                stage_id=stage_id,
                stage=stage,
                k=k,
                type=node_type,
                close=close,
                depends_on=dependencies,
                note=note,
                line=line,
                superseded=superseded,
            )
        )
        if not superseded:
            previous_active = node

    agents = tuple(
        AgentSpec(
            agent=cells[0],
            node=cells[1],
            role=cells[2],
            launch=cells[3],
            output=cells[4],
            trigger=cells[5],
            note=cells[6],
            line=line,
            superseded=cells[6] == "superseded",
        )
        for line, cells in agent_rows
    )
    cards = tuple(card for card in fields["cards"].split(",") if card)
    if not cards:
        raise _error("HC-RL-A18", "marker cards= must contain at least one card", exit_code=3)
    return Plan(
        marker=marker,
        skill=fields["skill"],
        generated=fields.get("generated", ""),
        session=fields["session"],
        recipe=fields["recipe"],
        cards=cards,
        decision_mode=fields.get("decision_mode", "auto"),
        nodes=tuple(nodes),
        agents=agents,
    )


def _ancestors(node: str, dependencies: dict[str, tuple[str, ...]]) -> set[str]:
    seen: set[str] = set()
    stack = list(dependencies[node])
    while stack:
        current = stack.pop()
        if current in seen:
            continue
        seen.add(current)
        stack.extend(dependencies[current])
    return seen


def _assert_acyclic(dependencies: dict[str, tuple[str, ...]]) -> None:
    visited: set[str] = set()
    for node in dependencies:
        if node in visited:
            continue
        visiting: set[str] = set()
        stack: list[tuple[str, bool]] = [(node, False)]
        while stack:
            current, leaving = stack.pop()
            if leaving:
                visiting.remove(current)
                visited.add(current)
                continue
            if current in visited:
                continue
            if current in visiting:
                raise _error("HC-RL-A48", f"dependency cycle includes {current}")
            visiting.add(current)
            stack.append((current, True))
            for dependency in reversed(dependencies[current]):
                if dependency not in visited:
                    stack.append((dependency, False))


def lint_plan(path: str | Path) -> Plan:
    """Return a parsed plan or raise a numbered fail-closed lint violation."""
    plan = parse_plan(path)
    if plan.decision_mode not in {"auto", "consult"}:
        raise _error("HC-RL-A130", f"invalid decision_mode: {plan.decision_mode}")
    all_nodes: dict[str, NodeSpec] = {}
    for node in plan.nodes:
        if not node.node:
            raise _error("HC-RL-A24", f"line {node.line}: node is empty")
        if node.node in all_nodes:
            raise _error("HC-RL-A46", f"line {node.line}: duplicate node {node.node}")
        all_nodes[node.node] = node

    for node in plan.nodes:
        if not node.note.startswith("superseded-by:"):
            continue
        replacement = node.note.removeprefix("superseded-by:")
        if not replacement or any(character.isspace() for character in replacement):
            raise _error("HC-RL-A24", f"line {node.line}: invalid superseded-by target")
        if replacement not in all_nodes:
            raise _error("HC-RL-A24", f"line {node.line}: unknown superseded-by target {replacement}")
        if all_nodes[replacement].superseded:
            raise _error("HC-RL-A24", f"line {node.line}: superseded-by target {replacement} is superseded")

    active_nodes = [node for node in plan.nodes if not node.superseded]
    active_by_name = {node.node: node for node in active_nodes}
    for node in active_nodes:
        stage_match = STAGE_ID_RE.fullmatch(node.stage_id)
        if not stage_match or stage_match.group("card") != node.card:
            raise _error("HC-RL-A104", f"line {node.line}: invalid stage_id {node.stage_id}")
        if node.stage not in STAGES:
            raise _error("HC-RL-A129", f"line {node.line}: invalid stage {node.stage}")
        if node.card not in plan.cards:
            raise _error("HC-RL-A87", f"line {node.line}: card {node.card} absent from marker")
        if node.type not in NODE_TYPES:
            raise _error("HC-RL-A126", f"line {node.line}: forbidden node type {node.type}")

    stage_runs: list[str] = []
    for node in active_nodes:
        if not stage_runs or stage_runs[-1] != node.stage_id:
            stage_runs.append(node.stage_id)
    if len(stage_runs) != len(set(stage_runs)):
        raise _error("HC-RL-A129", "nodes for a stage instance are not grouped contiguously")

    dependencies = {node.node: node.depends_on for node in active_nodes}
    for node in active_nodes:
        for dependency in node.depends_on:
            target = all_nodes.get(dependency)
            if target is None:
                raise _error("HC-RL-A48", f"line {node.line}: unknown dependency {dependency}")
            if target.superseded:
                raise _error("HC-RL-A72", f"line {node.line}: dependency {dependency} is superseded")
    _assert_acyclic(dependencies)
    agents_by_node: dict[str, list[AgentSpec]] = {node.node: [] for node in active_nodes}
    all_active_agent_names: set[str] = set()
    for agent in plan.agents:
        if agent.superseded:
            continue
        if agent.node not in all_nodes:
            raise _error("HC-RL-A24", f"line {agent.line}: agent node {agent.node} does not exist")
        if agent.node not in active_by_name:
            continue
        key = f"{agent.node}\0{agent.agent}"
        if key in all_active_agent_names:
            raise _error("HC-RL-A24", f"line {agent.line}: duplicate agent {agent.agent} in {agent.node}")
        all_active_agent_names.add(key)
        agents_by_node[agent.node].append(agent)

    for node in active_nodes:
        node_agents = agents_by_node[node.node]
        if not node_agents:
            raise _error("HC-RL-A75", f"line {node.line}: node {node.node} has no active agent")
        if node.close:
            prefix, separator, name = node.close.partition(":")
            if prefix != "agent" or not separator or name not in {agent.agent for agent in node_agents}:
                raise _error("HC-RL-A47", f"line {node.line}: invalid close value {node.close}")

    agent_names_anywhere = {agent.agent for agent in plan.agents if not agent.superseded}
    for node in active_nodes:
        for agent in agents_by_node[node.node]:
            if not agent.trigger or agent.trigger == "on:blocked":
                continue
            prefix = "on:done:"
            if not agent.trigger.startswith(prefix) or not agent.trigger[len(prefix) :]:
                raise _error("HC-RL-A35", f"line {agent.line}: invalid trigger {agent.trigger}")
            target_name = agent.trigger[len(prefix) :]
            if target_name not in agent_names_anywhere:
                raise _error("HC-RL-A35", f"line {agent.line}: unknown trigger agent {target_name}")
            if target_name not in {candidate.agent for candidate in agents_by_node[node.node]}:
                raise _error("HC-RL-A71", f"line {agent.line}: on:done must reference the same node")

    stages_by_card: dict[str, list[str]] = {}
    for node in active_nodes:
        stages_by_card.setdefault(node.card, [])
        if node.stage_id not in stages_by_card[node.card]:
            stages_by_card[node.card].append(node.stage_id)
    for card, stages in stages_by_card.items():
        for index, stage_id in enumerate(stages[1:], start=1):
            earlier_stage = stages[index - 1]
            stage_nodes = [node for node in active_nodes if node.stage_id == stage_id]
            earlier_nodes = {node.node for node in active_nodes if node.stage_id == earlier_stage}
            if not any(earlier_nodes & _ancestors(node.node, dependencies) for node in stage_nodes):
                raise _error("HC-RL-A109", f"card {card} stage {stage_id} is parallel with {earlier_stage}")
    return plan


def _lint_command(plan_dir: str) -> int:
    try:
        lint_plan(Path(plan_dir) / "relay_plan.md")
    except RelayError as exc:
        if exc.exit_code == 3:
            print(f"error: {exc.code} {exc.message}", file=sys.stderr)
            return 3
        print(f"lint: {exc.code} {exc.message}", file=sys.stderr)
        return exc.exit_code
    print("lint: ok")
    return 0


def _runtime_plan(plan_dir: str) -> Plan:
    """Load a plan for add/status, where any invalid plan is an input failure."""
    try:
        return lint_plan(Path(plan_dir) / "relay_plan.md")
    except RelayError as exc:
        if exc.exit_code == 3:
            raise
        raise RelayError(3, exc.code, exc.message) from exc


def _ledger_error(message: str) -> RelayError:
    return _error("ledger", message, exit_code=4)


def read_ledger(path: str | Path) -> list[dict[str, object]]:
    """Read one exact-schema JSONL ledger, treating absence as an empty ledger."""
    ledger_path = Path(path)
    if not ledger_path.exists():
        return []
    try:
        text = ledger_path.read_text(encoding="utf-8")
    except OSError as exc:
        raise _ledger_error(f"cannot read relay_log.jsonl: {exc}") from exc
    if not text:
        return []
    if not text.endswith("\n"):
        raise _ledger_error("last ledger line is not newline-terminated")

    entries: list[dict[str, object]] = []
    for expected_seq, line in enumerate(text.splitlines(), start=1):
        try:
            entry = json.loads(line)
        except json.JSONDecodeError as exc:
            raise _ledger_error(f"line {expected_seq}: invalid JSON") from exc
        if not isinstance(entry, dict) or set(entry) != LEDGER_FIELDS:
            raise _ledger_error(f"line {expected_seq}: ledger fields must be exactly seven fixed keys")
        if entry["seq"] != expected_seq or isinstance(entry["seq"], bool):
            raise _ledger_error(f"line {expected_seq}: invalid seq")
        if not all(isinstance(entry[field], str) for field in LEDGER_FIELDS - {"seq"}):
            raise _ledger_error(f"line {expected_seq}: non-string ledger value")
        if entry["event"] not in EVENTS:
            raise _ledger_error(f"line {expected_seq}: invalid event")
        if not AGENT_INSTANCE_RE.fullmatch(entry["agent"]):
            raise _ledger_error(f"line {expected_seq}: invalid agent")
        if entry["by"] not in {"orchestrator", "monitor"}:
            raise _ledger_error(f"line {expected_seq}: invalid by")
        entries.append(entry)
    return entries


def _validate_event(event: str, agent: str) -> None:
    if event not in EVENTS:
        raise _error("HC-RL-A2", f"invalid event: {event}")
    if not AGENT_INSTANCE_RE.fullmatch(agent):
        raise _error("HC-RL-A55", f"invalid agent: {agent}")


def _writer_from_agent(agent: str) -> str:
    return "orchestrator" if agent.startswith("orchestrator#") else "monitor"


def _agent_parts(agent: str) -> tuple[str, int]:
    name, attempt = agent.rsplit("#", 1)
    return name, int(attempt)


def _active_node(plan: Plan, node_name: str) -> NodeSpec:
    for node in plan.nodes:
        if node.node == node_name and not node.superseded:
            return node
    raise _error("HC-RL-A59", f"unknown or superseded node: {node_name}")


def _node_agents(plan: Plan, node_name: str) -> tuple[AgentSpec, ...]:
    return tuple(agent for agent in plan.agents if agent.node == node_name and not agent.superseded)


def _latest_by_name(entries: list[dict[str, object]], node: str, name: str) -> dict[str, object] | None:
    for entry in reversed(entries):
        if entry["node"] == node and entry["event"] in AGENT_EVENTS:
            entry_name, _ = _agent_parts(str(entry["agent"]))
            if entry_name == name:
                return entry
    return None


def _latest_for_instance(
    entries: list[dict[str, object]], node: str, agent: str
) -> dict[str, object] | None:
    for entry in reversed(entries):
        if entry["node"] == node and entry["event"] in AGENT_EVENTS and entry["agent"] == agent:
            return entry
    return None


def _node_started(entries: list[dict[str, object]], node: str) -> bool:
    return any(entry["node"] == node and entry["event"] == "node_start" for entry in entries)


def _node_closed(entries: list[dict[str, object]], node: str) -> bool:
    return any(entry["node"] == node and entry["event"] == "node_close" for entry in entries)


def _stage_failed_after(
    entries: list[dict[str, object]], stage_id: str, prior: dict[str, object]
) -> bool:
    expected_stage = f"stage_id={stage_id}"
    prior_index = entries.index(prior)
    for entry in entries[prior_index + 1 :]:
        if entry["event"] != "stage_result":
            continue
        fields = set(str(entry["note"]).split())
        if expected_stage in fields and "outcome=failed" in fields:
            return True
    return False


def _authorize_agent(plan: Plan, node: NodeSpec, event: str, agent: str) -> None:
    name, _ = _agent_parts(agent)
    if event in CONTROL_EVENTS:
        if name not in CONTROL_AGENT_NAMES:
            raise _error("HC-RL-A69", f"control event requires orchestrator or monitor: {event}")
        return
    if name in RELAUNCH_EXEMPT_AGENT_NAMES:
        return
    if name not in {spec.agent for spec in _node_agents(plan, node.node)}:
        raise _error("HC-RL-A59", f"agent {name} is not active for node {node.node}")


def _require_trigger(plan: Plan, entries: list[dict[str, object]], node: NodeSpec, name: str) -> None:
    spec = next((agent for agent in _node_agents(plan, node.node) if agent.agent == name), None)
    if spec is None or not spec.trigger:
        return
    if spec.trigger == "on:blocked":
        if any(
            entry["node"] == node.node
            and entry["event"] in {"blocked", "escalate"}
            and _latest_by_name(entries, node.node, _agent_parts(str(entry["agent"]))[0]) == entry
            for entry in entries
        ):
            return
        raise _error("HC-RL-A77", f"agent {name} requires a currently blocked escalation")
    target = spec.trigger.removeprefix("on:done:")
    latest = _latest_by_name(entries, node.node, target)
    if latest is None or latest["event"] != "done":
        raise _error("HC-RL-A70", f"agent {name} requires done:{target}")


def _decision_helper(note: str) -> str | None:
    for token in note.split():
        for prefix in ("decider=", "strategist="):
            if token.startswith(prefix) and AGENT_INSTANCE_RE.fullmatch(token[len(prefix) :]):
                return token[len(prefix) :]
    return None


def _validate_decision_helper(note: str) -> str:
    """HC-RL-A69: exactly one helper token whose kind matches its instance name."""
    tokens = [token for token in note.split() if token.startswith(("decider=", "strategist="))]
    if len(tokens) != 1:
        raise _error("HC-RL-A69", f"decision note must carry exactly one helper token, got {tokens or 'none'}")
    token = tokens[0]
    kind, _, value = token.partition("=")
    if not value or not AGENT_INSTANCE_RE.fullmatch(value) or value.partition("#")[0] != kind:
        raise _error("HC-RL-A69", f"decision helper token must be {kind}={kind}#<n>: {token}")
    return value


def _active_decision_owners(entries: list[dict[str, object]], node: str) -> dict[str, str]:
    owners: dict[str, str] = {}
    for entry in entries:
        if entry["node"] != node or entry["event"] != "escalate":
            continue
        helper = _decision_helper(str(entry["note"]))
        if helper is None:
            continue
        owner = str(entry["agent"])
        latest = _latest_for_instance(entries, node, owner)
        if latest is not None and latest["event"] in {"escalate", "decision", "user_decision"}:
            owners[owner] = helper
    return owners


def _validate_plan_loaded_note(note: str) -> None:
    """HC-RL-A18: plan_loaded must carry a non-empty skill=<version-or-token>."""
    for token in note.split():
        if token.startswith("skill=") and token[len("skill=") :]:
            return
    raise _error("HC-RL-A18", "plan_loaded note must contain a non-empty skill=<version>")


def _validate_decision_ownership(
    entries: list[dict[str, object]], node: NodeSpec, event: str, agent: str, note: str
) -> None:
    if event not in DECISION_EVENTS:
        return
    name, _ = _agent_parts(agent)
    if name in DECISION_HELPER_NAMES:
        raise _error("HC-RL-A69", f"decision event {event} must use its triggering agent")
    if event == "escalate":
        helper = _validate_decision_helper(note)
        if helper == agent:
            raise _error("HC-RL-A69", "decision helper identity belongs in note, not agent")
        return
    owners = _active_decision_owners(entries, node.node)
    if owners and agent not in owners:
        raise _error("HC-RL-A69", f"decision event {event} must use its triggering agent")
    if event in {"decision", "user_decision"} and agent in owners:
        note_helper = _validate_decision_helper(note)
        if note_helper != owners[agent]:
            raise _error(
                "HC-RL-A69", f"decision event {event} must carry helper {owners[agent]} in note"
            )


def _validate_agent_transition(
    plan: Plan, entries: list[dict[str, object]], node: NodeSpec, event: str, agent: str
) -> None:
    name, attempt = _agent_parts(agent)
    if event == "agent_launch":
        if not _node_started(entries, node.node):
            raise _error("HC-RL-A78", f"node {node.node} must start before agent launch")
        _require_trigger(plan, entries, node, name)
        prior = _latest_by_name(entries, node.node, name)
        if prior is None:
            if attempt != 1:
                raise _error("HC-RL-A58", f"first attempt for {name} must be #1")
            return
        _, prior_attempt = _agent_parts(str(prior["agent"]))
        if attempt != prior_attempt + 1:
            raise _error("HC-RL-A58", f"attempt for {name} must increment by one")
        if prior["event"] not in {"agent_lost", "cancelled"} and not _stage_failed_after(
            entries, node.stage_id, prior
        ):
            raise _error("HC-RL-A49", f"agent {name} is not eligible for relaunch")
        return

    latest = _latest_for_instance(entries, node.node, agent)
    if latest is None:
        raise _error("HC-RL-A60", f"agent {agent} has not launched in node {node.node}")
    prior_event = str(latest["event"])
    if prior_event in TERMINAL_EVENTS:
        raise _error("HC-RL-A60", f"agent {agent} is terminal")
    allowed = {
        "checkpoint": {"agent_launch", "checkpoint", "resume"},
        "blocked": {"agent_launch", "checkpoint", "resume"},
        "escalate": {"agent_launch", "checkpoint", "blocked", "resume"},
        "decision": {"escalate"},
        "user_decision": {"decision"},
        "resume": {"decision", "user_decision"},
        "done": {"agent_launch", "checkpoint", "resume"},
        "agent_lost": {"agent_launch", "checkpoint", "blocked", "escalate", "decision", "user_decision", "resume"},
        "cancelled": {"agent_launch", "checkpoint", "blocked", "escalate", "decision", "user_decision", "resume"},
    }
    if prior_event not in allowed[event]:
        raise _error("HC-RL-A60", f"event {event} cannot follow {prior_event} for {agent}")


def _validate_node_close(plan: Plan, entries: list[dict[str, object]], node: NodeSpec) -> None:
    if _node_closed(entries, node.node):
        raise _error("HC-RL-A68", f"node {node.node} is already closed")
    launched_agents = [
        str(entry["agent"])
        for entry in entries
        if entry["node"] == node.node and entry["event"] == "agent_launch"
    ]
    for launched_agent in launched_agents:
        latest = _latest_for_instance(entries, node.node, launched_agent)
        if latest is None or latest["event"] not in TERMINAL_EVENTS:
            raise _error("HC-RL-A17", f"agent {launched_agent} is not terminal for node {node.node}")
    if node.close:
        close_name = node.close.removeprefix("agent:")
        latest = _latest_by_name(entries, node.node, close_name)
        if latest is None or latest["event"] != "done":
            raise _error("HC-RL-A74", f"close agent {close_name} must be done")


def _validate_runtime_event(
    plan: Plan, entries: list[dict[str, object]], node_name: str, event: str, agent: str, note: str
) -> None:
    node = _active_node(plan, node_name)
    _authorize_agent(plan, node, event, agent)
    if event == "plan_loaded":
        _validate_plan_loaded_note(note)
        return
    if event == "node_start":
        if _node_started(entries, node.node) or any(
            entry["node"] == node.node and entry["event"] == "agent_launch" for entry in entries
        ):
            raise _error("HC-RL-A68", f"node {node.node} cannot start again")
        if any(not _node_closed(entries, dependency) for dependency in node.depends_on):
            raise _error("HC-RL-A78", f"dependencies must close before node {node.node} starts")
        return
    if event == "node_close":
        _validate_node_close(plan, entries, node)
        return
    if event in AGENT_EVENTS:
        _validate_decision_ownership(entries, node, event, agent, note)
        _validate_agent_transition(plan, entries, node, event, agent)


def append_event(plan_dir: str, node: str, event: str, agent: str, note: str) -> None:
    """Append one validated JSONL event without changing earlier ledger bytes."""
    plan = _runtime_plan(plan_dir)
    _validate_event(event, agent)
    ledger_path = Path(plan_dir) / "relay_log.jsonl"
    entries = read_ledger(ledger_path)
    if not entries and event != "plan_loaded":
        raise _error("HC-RL-A84", "first ledger event must be plan_loaded")
    _validate_runtime_event(plan, entries, node, event, agent, note)
    entry = {
        "seq": len(entries) + 1,
        "ts": datetime.now().astimezone().isoformat(),
        "node": node,
        "event": event,
        "agent": agent,
        "by": _writer_from_agent(agent),
        "note": note,
    }
    try:
        with open(ledger_path, "a", encoding="utf-8", newline="") as ledger_file:
            ledger_file.write(json.dumps(entry, ensure_ascii=False, separators=(",", ":")) + "\n")
    except OSError as exc:
        raise _ledger_error(f"cannot append relay_log.jsonl: {exc}") from exc


def _add_command(plan_dir: str, node: str, event: str, agent: str, note: str) -> int:
    try:
        append_event(plan_dir, node, event, agent, note)
    except RelayError as exc:
        print(f"error: {exc.code} {exc.message}", file=sys.stderr)
        return exc.exit_code
    return 0


def _status_command(plan_dir: str, as_json: bool) -> int:
    try:
        plan = _runtime_plan(plan_dir)
        entries = read_ledger(Path(plan_dir) / "relay_log.jsonl")
    except RelayError as exc:
        print(f"error: {exc.code} {exc.message}", file=sys.stderr)
        return exc.exit_code
    # Intentional RLT_05 placeholder (HC-RL-A61/A62): the full nonempty-ledger
    # status lifecycle is deliberately NOT implemented in RLT_03. Only the
    # empty-ledger pending_nodes projection required by HC-RL-A84 is live;
    # superseded rows are excluded from it (HC-RL-A128/A84).
    if as_json:
        pending_nodes = [node.node for node in plan.nodes if not node.superseded] if not entries else []
        print(json.dumps({"current_stage": None, "current_node": None, "pending_nodes": pending_nodes}))
    else:
        print("status: not started" if not entries else f"status: {len(entries)} ledger entries")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = RelayArgumentParser(prog="relay_log.py")
    subparsers = parser.add_subparsers(dest="command", required=True)
    add_parser = subparsers.add_parser("add")
    add_parser.add_argument("--plan", required=True)
    add_parser.add_argument("--node", required=True)
    add_parser.add_argument("--event", required=True)
    add_parser.add_argument("--agent", required=True)
    add_parser.add_argument("--note", default="")
    status_parser = subparsers.add_parser("status")
    status_parser.add_argument("--plan", required=True)
    status_parser.add_argument("--json", action="store_true")
    lint_parser = subparsers.add_parser("lint")
    lint_parser.add_argument("--plan", required=True)
    try:
        args = parser.parse_args(argv)
    except RelayError as exc:
        print(f"error: {exc.code} {exc.message}", file=sys.stderr)
        return exc.exit_code
    if args.command == "add":
        return _add_command(args.plan, args.node, args.event, args.agent, args.note)
    if args.command == "status":
        return _status_command(args.plan, args.json)
    if args.command == "lint":
        return _lint_command(args.plan)
    raise AssertionError(f"unreachable command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
