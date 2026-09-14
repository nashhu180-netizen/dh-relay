#!/usr/bin/env python3
"""Fail-closed parser, structural linter, and append-only ledger for relay-light plans."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tomllib
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from urllib.parse import quote


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
DEFAULT_CONFIG_DIRS = (".claude/skills/relay-light", ".codex/skills/relay-light")
CONFIG_PATH_SAFE = "/:~-._"
RECIPE_TIERS = frozenset({"heavy", "normal", "light"})
PROVENANCE_KEYS = ("config_dir", "plan")
STAGE_RESULT_OUTCOMES = ("done", "blocked", "failed", "cancelled")
SUGGESTED_ACTIONS = ("open_next_stage", "wait_user", "relaunch_monitor", "notify_user", "none")
STAGE_ORDER = ("W", "C", "R", "X", "F")
TERMINAL_RESULT_OUTCOMES = frozenset({"done", "cancelled"})
# design §3.4/§3.5 + HC-RL-A85: each event has exactly one legal writer.
CONTROL_WRITERS = {
    "plan_loaded": "orchestrator",
    "stage_start": "orchestrator",
    "monitor_launch": "orchestrator",
    "stage_close": "orchestrator",
    "node_start": "monitor",
    "node_close": "monitor",
    "monitor_restart": "monitor",
    "stage_result": "monitor",
    "plan_amend": "monitor",
}
WRITER_BY_EVENT = {
    **CONTROL_WRITERS,
    **{event: "monitor" for event in AGENT_EVENTS},
}
# design §3.4: these four events are addressed by the note's `stage_id=`; every
# other row belongs to the stage instance of its `node`.
STAGE_NOTE_EVENTS = frozenset(
    {"stage_start", "monitor_launch", "stage_result", "stage_close"}
)


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


@dataclass(frozen=True)
class RoleSpec:
    name: str
    model: str
    launch: str


@dataclass(frozen=True)
class RelayLimits:
    rework_max_rounds: int
    attempt_max: int
    on_exceed: str


@dataclass(frozen=True)
class RelayConfig:
    """One resolved config directory with both TOML files loaded and frozen."""

    config_dir: Path
    roles: tuple[RoleSpec, ...]
    stages: tuple[tuple[str, tuple[str, ...]], ...]
    recipes: tuple[tuple[str, tuple[str, ...]], ...]
    limits: RelayLimits

    def recipe_reviewers(self, recipe: str) -> tuple[str, ...] | None:
        for name, reviewers in self.recipes:
            if name == recipe:
                return reviewers
        return None


def _error(code: str, message: str, *, exit_code: int = 2) -> RelayError:
    return RelayError(exit_code, code, message)


def _fail(exc: RelayError) -> int:
    print(f"error: {exc.code} {exc.message}", file=sys.stderr)
    return exc.exit_code


def _configure_utf8_stdio() -> None:
    """F-003: keep CLI stdout/stderr UTF-8 under ASCII or legacy locale encodings.

    Only streams that actually support `reconfigure` are touched; test doubles
    and already-closed streams are left as-is — the original objects are never
    closed or replaced.
    """
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is None:
            continue
        try:
            reconfigure(encoding="utf-8")
        except (OSError, ValueError, AttributeError):
            continue


def _expand_user(value: str, home: Path) -> Path:
    if value == "~":
        return home
    if value.startswith("~/") or value.startswith("~\\"):
        return home / value[2:]
    return Path(value)


def _normalized_dir(path: Path | str) -> Path:
    return Path(os.path.abspath(os.path.normpath(str(path))))


def resolve_config_dir(explicit: str | None, home: Path) -> Path:
    """§6.2.1: an explicit dir wins; otherwise exactly one installed side must exist."""
    if explicit:
        directory = _normalized_dir(_expand_user(explicit, home))
        if not directory.is_dir():
            raise _error("HC-RL-A135", f"explicit config dir does not exist: {directory}", exit_code=3)
        return directory
    candidates = [_normalized_dir(home / relative) for relative in DEFAULT_CONFIG_DIRS]
    installed = [candidate for candidate in candidates if candidate.is_dir()]
    if len(installed) == 1:
        return installed[0]
    raise _error(
        "HC-RL-A135",
        f"found {len(installed)} installed relay-light config dirs out of "
        f"{', '.join(str(candidate) for candidate in candidates)}; pass --config-dir",
        exit_code=3,
    )


def _load_toml(path: Path, code: str) -> dict[str, object]:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise _error(code, f"cannot read {path.name}: {exc}", exit_code=3) from exc
    except UnicodeDecodeError as exc:
        raise _error(code, f"invalid UTF-8 in {path.name}: {exc}", exit_code=3) from exc
    try:
        return tomllib.loads(text)
    except tomllib.TOMLDecodeError as exc:
        raise _error(code, f"invalid TOML in {path.name}: {exc}", exit_code=3) from exc


def _string_tuple(value: object, code: str, what: str) -> tuple[str, ...]:
    if not isinstance(value, list) or not value:
        raise _error(code, f"{what} must be a non-empty list of strings", exit_code=3)
    names = tuple(value)
    if not all(isinstance(name, str) and name for name in names):
        raise _error(code, f"{what} must be a non-empty list of strings", exit_code=3)
    return names


def _parse_roles(data: dict[str, object]) -> tuple[RoleSpec, ...]:
    if not data:
        raise _error("HC-RL-A131", "roles.toml must define at least one role", exit_code=3)
    roles: list[RoleSpec] = []
    for name, entry in data.items():
        if not isinstance(entry, dict):
            raise _error("HC-RL-A131", f"role {name} must be a table", exit_code=3)
        model = entry.get("model")
        launch = entry.get("launch")
        if not isinstance(model, str) or not model or not isinstance(launch, str) or not launch:
            raise _error("HC-RL-A131", f"role {name} must define non-empty model and launch", exit_code=3)
        roles.append(RoleSpec(name=name, model=model, launch=launch))
    return tuple(roles)


def _parse_mapping(
    data: dict[str, object],
) -> tuple[tuple[tuple[str, tuple[str, ...]], ...], tuple[tuple[str, tuple[str, ...]], ...], RelayLimits]:
    stages: list[tuple[str, tuple[str, ...]]] = []
    recipes: list[tuple[str, tuple[str, ...]]] = []
    for section, collected in (("stages", stages), ("recipes", recipes)):
        table = data.get(section)
        if not isinstance(table, dict) or not table:
            raise _error("HC-RL-A92", f"dh-mapping.toml {section} must be a non-empty table", exit_code=3)
        key = "dh_nodes" if section == "stages" else "reviewers"
        for name, entry in table.items():
            if not isinstance(entry, dict):
                raise _error("HC-RL-A92", f"{section}.{name} must be a table", exit_code=3)
            collected.append((name, _string_tuple(entry.get(key), "HC-RL-A92", f"{section}.{name}.{key}")))
    limits = data.get("limits")
    if not isinstance(limits, dict):
        raise _error("HC-RL-A92", "dh-mapping.toml limits must be a table", exit_code=3)
    counters: list[int] = []
    for key in ("rework_max_rounds", "attempt_max"):
        value = limits.get(key)
        if not isinstance(value, int) or isinstance(value, bool):
            raise _error("HC-RL-A92", f"limits.{key} must be an integer", exit_code=3)
        counters.append(value)
    on_exceed = limits.get("on_exceed")
    if not isinstance(on_exceed, dict):
        raise _error("HC-RL-A92", "dh-mapping.toml limits.on_exceed must be a table", exit_code=3)
    action = on_exceed.get("action")
    if not isinstance(action, str) or not action:
        raise _error("HC-RL-A92", "limits.on_exceed.action must be a non-empty string", exit_code=3)
    return tuple(stages), tuple(recipes), RelayLimits(counters[0], counters[1], action)


def load_config(config_dir: str | Path) -> RelayConfig:
    """HC-RL-A131/A92: load both TOML files from one resolved directory, fail closed."""
    directory = Path(config_dir)
    roles = _parse_roles(_load_toml(directory / "roles.toml", "HC-RL-A131"))
    stages, recipes, limits = _parse_mapping(_load_toml(directory / "dh-mapping.toml", "HC-RL-A92"))
    return RelayConfig(config_dir=directory, roles=roles, stages=stages, recipes=recipes, limits=limits)


@dataclass(frozen=True)
class XRound:
    """One planned X rework round of a card: the coder fixes, the reviewer re-reviews (§6.1)."""

    stage_id: str
    card: str
    k: int
    dh_nodes: tuple[str, ...]


def plan_x_rounds(card: str, config: RelayConfig) -> tuple[XRound, ...]:
    """HC-RL-A99: round count comes only from the loaded limits.rework_max_rounds.

    This stays the internal equivalent of template generation — it writes no files,
    adds no subcommand, and shares its upper bound with the HC-RL-A97 lint rule.
    """
    dh_nodes = dict(config.stages).get("X")
    if dh_nodes is None:
        raise _error("HC-RL-A92", "dh-mapping.toml stages.X must define dh_nodes", exit_code=3)
    return tuple(
        XRound(stage_id=f"{card}:X#{k}", card=card, k=k, dh_nodes=dh_nodes)
        for k in range(1, config.limits.rework_max_rounds + 1)
    )


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


def lint_plan(path: str | Path, config: RelayConfig) -> Plan:
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
    # HC-RL-A120: a stage instance may reappear only as a table-tail append —
    # every run before the last must be distinct; the last run may repeat an
    # earlier stage_id. All other hard constraints stay unchanged.
    if len(stage_runs[:-1]) != len(set(stage_runs[:-1])):
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
        if not agent.agent:
            raise _error("HC-RL-A24", f"line {agent.line}: agent is empty")
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
    # HC-RL-A89: a dependency may only point at the same or an earlier stage of the card.
    # Checked before A109 so a backward edge is never misreported as parallelism.
    for node in active_nodes:
        for dependency in node.depends_on:
            target = active_by_name.get(dependency)
            if target is None or target.card != node.card:
                continue
            if STAGE_ORDER.index(target.stage) > STAGE_ORDER.index(node.stage):
                raise _error(
                    "HC-RL-A89",
                    f"line {node.line}: {node.node} depends on {dependency} of later stage "
                    f"{target.stage_id}",
                )
    for card, stages in stages_by_card.items():
        for index, stage_id in enumerate(stages[1:], start=1):
            earlier_stage = stages[index - 1]
            stage_nodes = [node for node in active_nodes if node.stage_id == stage_id]
            earlier_nodes = {node.node for node in active_nodes if node.stage_id == earlier_stage}
            if not any(earlier_nodes & _ancestors(node.node, dependencies) for node in stage_nodes):
                raise _error("HC-RL-A109", f"card {card} stage {stage_id} is parallel with {earlier_stage}")
    # HC-RL-A97: an X round beyond limits.rework_max_rounds is rejected, exactly.
    for node in active_nodes:
        if node.stage == "X" and node.k > config.limits.rework_max_rounds:
            raise _error(
                "HC-RL-A97",
                f"line {node.line}: {node.stage_id} exceeds "
                f"rework_max_rounds={config.limits.rework_max_rounds}",
            )
    _lint_recipe_reviewers(plan, active_nodes, agents_by_node, config)
    return plan


def _lint_recipe_reviewers(
    plan: Plan,
    active_nodes: list[NodeSpec],
    agents_by_node: dict[str, list[AgentSpec]],
    config: RelayConfig,
) -> None:
    """HC-RL-A116: the marker recipe must be one of the frozen three tiers and every active R
    instance must match the configured reviewer set for that tier."""
    if plan.recipe not in RECIPE_TIERS:
        raise _error(
            "HC-RL-A116",
            f"recipe {plan.recipe} must be one of {sorted(RECIPE_TIERS)}",
        )
    expected = config.recipe_reviewers(plan.recipe)
    if expected is None:
        raise _error("HC-RL-A116", f"recipe {plan.recipe} is not configured in dh-mapping.toml")
    for stage_id in dict.fromkeys(node.stage_id for node in active_nodes if node.stage == "R"):
        names = {
            agent.agent
            for node in active_nodes
            if node.stage_id == stage_id
            for agent in agents_by_node[node.node]
            if agent.role == "reviewer"
        }
        if not names:
            continue
        if names != set(expected):
            raise _error(
                "HC-RL-A116",
                f"{stage_id} reviewer set {sorted(names)} does not match recipe "
                f"{plan.recipe} {sorted(expected)}",
            )


LINT_VIOLATION_LINE_RE = re.compile(r"^line (?P<line>[1-9][0-9]*): ")


def _lint_violation(exc: RelayError) -> dict[str, object]:
    """HC-RL-A80: one violation row; `line` is the real plan line or null."""
    match = LINT_VIOLATION_LINE_RE.match(exc.message)
    return {
        "rule": exc.code,
        "message": exc.message,
        "line": int(match.group("line")) if match else None,
    }


# ── HC-RL-A122 planner-amend allowlist guard (P1-02 frozen algorithm) ──────────
#
# `lint --amend-check before|after` snapshots the business worktree as raw
# bytes/mode/symlink state — never through Git index, clean/smudge or EOL filters —
# into a caller-chosen 0700 runtime directory outside the repo and all git metadata.
# `after` recomputes the exact change set; success requires actual == proposed.


@dataclass(frozen=True)
class RawPathState:
    """One observed worktree path: regular / symlink / absent / special."""

    kind: str
    mode: int | None = None
    size: int | None = None
    sha256: str | None = None
    symlink_target: str | None = None
    raw_id: str | None = None

    def diff_tuple(self) -> tuple[object, ...]:
        return (self.kind, self.sha256, self.mode, self.symlink_target)


_ABSENT_PATH = RawPathState("absent")


@dataclass(frozen=True)
class IndexState:
    exists: bool
    sha256: str | None = None
    mode: int | None = None

    def diff_tuple(self) -> tuple[object, ...]:
        return (self.exists, self.sha256, self.mode)


@dataclass(frozen=True)
class ObjectDbFingerprint:
    """Recursive listing of the real object directory plus `count-objects -v`."""

    entries: tuple[tuple[str, str, int | None, int | None, str | None], ...]
    count_objects: str


@dataclass(frozen=True)
class WorktreeSnapshot:
    repo_root: str
    head: str | None
    index: IndexState
    porcelain_sha256: str
    tracked: tuple[str, ...]
    untracked: tuple[str, ...]
    paths: dict[str, RawPathState]
    objects: ObjectDbFingerprint
    raw_dir: str


_GIT_READONLY_COMMANDS = frozenset(
    {
        ("rev-parse", "--show-toplevel"),
        ("rev-parse", "HEAD"),
        ("rev-parse", "--git-path", "index"),
        ("rev-parse", "--git-path", "objects"),
        ("rev-parse", "--git-common-dir"),
        ("status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignored=no"),
        ("ls-files", "-z", "--cached"),
        ("ls-files", "-z", "--others", "--exclude-standard"),
        ("check-ignore", "--no-index", "-z", "--stdin"),
        ("count-objects", "-v"),
    }
)
_AMEND_PLAN_DIR_RE = re.compile(r"docs/modules/(?P<module>[^/]+)/relay/(?P<plan_id>[^/]+)")
_AMEND_DESIGN_RE = re.compile(r"docs/modules/[^/]+/design/")
_AMEND_DRIVE_RE = re.compile(r"^[A-Za-z]:")


def _git_readonly(
    repo_root: Path,
    argv: tuple[str, ...],
    stdin: bytes = b"",
    allow_exit: tuple[int, ...] = (0,),
) -> bytes:
    """P1-02: the guard runs only frozen read-only git commands, locks disabled."""
    if argv not in _GIT_READONLY_COMMANDS:
        raise _error("HC-RL-A122", "git invocation outside the read-only allowlist")
    env = dict(os.environ)
    env["GIT_OPTIONAL_LOCKS"] = "0"
    try:
        proc = subprocess.run(
            ["git", "-C", str(repo_root), *argv],
            input=stdin,
            capture_output=True,
            check=False,
            env=env,
        )
    except OSError as exc:
        raise _error("HC-RL-A122", f"cannot run git {argv[0]}: {exc}", exit_code=3) from exc
    if proc.returncode not in allow_exit:
        raise _error(
            "HC-RL-A122", f"git {argv[0]} exited {proc.returncode} in read-only mode", exit_code=3
        )
    return proc.stdout


def _resolve_repo_root(repo: str) -> Path:
    candidate = Path(os.path.abspath(repo))
    raw = _git_readonly(candidate, ("rev-parse", "--show-toplevel"))
    return Path(os.path.realpath(os.fsdecode(raw.strip())))


def _git_path(repo_root: Path, name: str) -> Path:
    raw = _git_readonly(repo_root, ("rev-parse", "--git-path", name))
    path = Path(os.fsdecode(raw.strip()))
    if not path.is_absolute():
        path = repo_root / path
    return Path(os.path.realpath(path))


def _is_repo_relative(rel: str) -> bool:
    if not rel or "\0" in rel:
        return False
    if rel.startswith(("/", "\\")) or _AMEND_DRIVE_RE.match(rel):
        return False
    return all(part not in ("", ".", "..") for part in rel.split("/"))


def _decode_git_z_paths(data: bytes, *, meta: bool) -> list[str]:
    paths: list[str] = []
    for item in data.split(b"\0"):
        if not item:
            continue
        if meta:
            tab = item.find(b"\t")
            if tab < 0:
                raise _error("HC-RL-A122", "malformed git ls-files record")
            item = item[tab + 1 :]
        rel = os.fsdecode(item)
        if not _is_repo_relative(rel):
            raise _error("HC-RL-A122", "git reported a path outside the repo-relative contract")
        paths.append(rel)
    return paths


def _read_git_path_sets(repo_root: Path) -> tuple[frozenset[str], frozenset[str], bytes]:
    """Frozen read-only sets: tracked ∪ non-ignored untracked, plus raw porcelain v2."""
    tracked = frozenset(
        _decode_git_z_paths(_git_readonly(repo_root, ("ls-files", "-z", "--cached")), meta=False)
    )
    untracked = frozenset(
        _decode_git_z_paths(
            _git_readonly(repo_root, ("ls-files", "-z", "--others", "--exclude-standard")),
            meta=False,
        )
    )
    porcelain = _git_readonly(
        repo_root, ("status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignored=no")
    )
    return tracked, untracked, porcelain


def _lstat_or_none(path: Path) -> os.stat_result | None:
    try:
        return path.lstat()
    except FileNotFoundError:
        return None
    except OSError as exc:
        raise _error(
            "HC-RL-A122",
            f"cannot lstat a worktree path: {exc.strerror or type(exc).__name__}",
            exit_code=3,
        ) from exc


def _index_state(repo_root: Path) -> IndexState:
    index_path = _git_path(repo_root, "index")
    info = _lstat_or_none(index_path)
    if info is None or not stat.S_ISREG(info.st_mode):
        return IndexState(False)
    try:
        data = index_path.read_bytes()
    except OSError as exc:
        raise _error("HC-RL-A122", f"cannot read the real index: {exc}", exit_code=3) from exc
    return IndexState(True, hashlib.sha256(data).hexdigest(), stat.S_IMODE(info.st_mode))


def _object_database_fingerprint(repo_root: Path) -> ObjectDbFingerprint:
    """Recursive (name, lstat type, size, mtime_ns, file sha256) listing + count-objects."""
    objects_dir = _git_path(repo_root, "objects")
    entries: list[tuple[str, str, int | None, int | None, str | None]] = []
    if objects_dir.is_dir():
        for root, dirnames, filenames in os.walk(objects_dir):
            for name in (*dirnames, *filenames):
                path = Path(root) / name
                rel = path.relative_to(objects_dir).as_posix()
                info = _lstat_or_none(path)
                if info is None:
                    raise _error(
                        "HC-RL-A122", "object database entry vanished during fingerprint"
                    )
                if stat.S_ISDIR(info.st_mode):
                    entries.append((rel, "dir", None, info.st_mtime_ns, None))
                elif stat.S_ISLNK(info.st_mode):
                    entries.append((rel, "symlink", None, info.st_mtime_ns, os.readlink(path)))
                elif stat.S_ISREG(info.st_mode):
                    data = path.read_bytes()
                    entries.append(
                        (
                            rel,
                            "regular",
                            len(data),
                            info.st_mtime_ns,
                            hashlib.sha256(data).hexdigest(),
                        )
                    )
                else:
                    entries.append((rel, "special", None, info.st_mtime_ns, None))
    count = _git_readonly(repo_root, ("count-objects", "-v")).decode("utf-8", "replace")
    return ObjectDbFingerprint(tuple(sorted(entries)), count)


def _restricted_dir(path: Path) -> None:
    os.mkdir(path, 0o700)
    if os.name == "posix":
        try:
            os.chmod(path, 0o700)
            if stat.S_IMODE(path.lstat().st_mode) != 0o700:
                raise _error(
                    "HC-RL-A122", "snapshot directory permissions cannot be tightened"
                )
        except BaseException:
            try:
                os.rmdir(path)
            except OSError:
                pass
            raise


def _restricted_writer(path: Path):
    descriptor = os.open(
        path,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0),
        0o600,
    )
    if os.name == "posix":
        os.fchmod(descriptor, 0o600)
    return os.fdopen(descriptor, "wb")


def _store_raw_copy(raw_dir: Path, data: bytes) -> str:
    """One raw copy under a fresh 0600 name allocated by O_EXCL create."""
    serial = 0
    while True:
        name = f"raw-{serial:05d}"
        serial += 1
        try:
            with _restricted_writer(raw_dir / name) as handle:
                handle.write(data)
        except FileExistsError:
            continue
        return name


def _same_stat(left: os.stat_result, right: os.stat_result) -> bool:
    return (
        left.st_mode,
        left.st_size,
        left.st_mtime_ns,
        left.st_ino,
    ) == (right.st_mode, right.st_size, right.st_mtime_ns, right.st_ino)


def _snapshot_raw_path(repo_root: Path, relpath: str, raw_dir: Path) -> RawPathState:
    """Raw lstat+bytes capture — no git clean/smudge/EOL filter is ever applied."""
    target = repo_root / relpath
    first = _lstat_or_none(target)
    if first is None:
        if _lstat_or_none(target) is not None:
            raise _error("HC-RL-A122", "worktree path appeared during sampling")
        return _ABSENT_PATH
    if not stat.S_ISREG(first.st_mode) and not stat.S_ISLNK(first.st_mode):
        return RawPathState("special", mode=stat.S_IMODE(first.st_mode))
    if stat.S_ISLNK(first.st_mode):
        link_target = os.readlink(target)
        second = _lstat_or_none(target)
        if second is None or not _same_stat(first, second):
            raise _error("HC-RL-A122", "worktree path changed during sampling")
        raw_id = _store_raw_copy(raw_dir, os.fsencode(link_target))
        return RawPathState(
            "symlink",
            mode=stat.S_IMODE(second.st_mode),
            symlink_target=link_target,
            raw_id=raw_id,
        )
    try:
        descriptor = os.open(
            target, os.O_RDONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_NOFOLLOW", 0)
        )
    except OSError as exc:
        raise _error(
            "HC-RL-A122",
            f"cannot sample a worktree path: {exc.strerror or type(exc).__name__}",
            exit_code=3,
        ) from exc
    with os.fdopen(descriptor, "rb") as handle:
        data = handle.read()
    second = _lstat_or_none(target)
    if second is None or not _same_stat(first, second):
        raise _error("HC-RL-A122", "worktree path changed during sampling")
    raw_id = _store_raw_copy(raw_dir, data)
    return RawPathState(
        "regular",
        mode=stat.S_IMODE(second.st_mode),
        size=len(data),
        sha256=hashlib.sha256(data).hexdigest(),
        raw_id=raw_id,
    )


def _snapshot_worktree(repo_root: Path, snapshot_dir: Path, phase: str) -> WorktreeSnapshot:
    """Full raw-state capture of every tracked + non-ignored untracked worktree path."""
    phase_dir = Path(snapshot_dir) / phase
    raw_dir = phase_dir / "raw"
    _restricted_dir(phase_dir)
    _restricted_dir(raw_dir)
    head_raw = _git_readonly(repo_root, ("rev-parse", "HEAD"), allow_exit=(0, 128))
    head = head_raw.decode("utf-8", "replace").strip() or None
    index = _index_state(repo_root)
    tracked, untracked, porcelain = _read_git_path_sets(repo_root)
    objects = _object_database_fingerprint(repo_root)
    paths = {
        rel: _snapshot_raw_path(repo_root, rel, raw_dir)
        for rel in sorted(tracked | untracked)
    }
    snapshot = WorktreeSnapshot(
        repo_root=str(repo_root),
        head=head,
        index=index,
        porcelain_sha256=hashlib.sha256(porcelain).hexdigest(),
        tracked=tuple(sorted(tracked)),
        untracked=tuple(sorted(untracked)),
        paths=paths,
        objects=objects,
        raw_dir=str(raw_dir),
    )
    _write_json_restricted(
        phase_dir / "manifest.json",
        {
            "version": 1,
            "phase": phase,
            "repo_root": snapshot.repo_root,
            "head": snapshot.head,
            "index": {
                "exists": index.exists,
                "sha256": index.sha256,
                "mode": index.mode,
            },
            "porcelain_sha256": snapshot.porcelain_sha256,
            "tracked": list(snapshot.tracked),
            "untracked": list(snapshot.untracked),
            "paths": {
                rel: {
                    "kind": state.kind,
                    "mode": state.mode,
                    "size": state.size,
                    "sha256": state.sha256,
                    "symlink_target": state.symlink_target,
                    "raw_id": state.raw_id,
                }
                for rel, state in paths.items()
            },
            "objects": {
                "entries": [list(entry) for entry in objects.entries],
                "count_objects": objects.count_objects,
            },
        },
    )
    return snapshot


def _diff_worktree_snapshots(before: WorktreeSnapshot, after: WorktreeSnapshot) -> tuple[str, ...]:
    """actual = paths whose (kind, raw sha256, permission mode, symlink target) differ."""
    union = set(before.paths) | set(after.paths)
    return tuple(
        sorted(
            rel
            for rel in union
            if before.paths.get(rel, _ABSENT_PATH).diff_tuple()
            != after.paths.get(rel, _ABSENT_PATH).diff_tuple()
        )
    )


def _require_plain_parents(repo_root: Path, target: Path) -> None:
    ancestors: list[Path] = []
    parent = target.parent
    while parent != repo_root:
        ancestors.append(parent)
        if parent.parent == parent:
            raise _error("HC-RL-A122", "restore target escapes the repo")
        parent = parent.parent
    for ancestor in reversed(ancestors):
        info = _lstat_or_none(ancestor)
        if info is None:
            os.mkdir(ancestor, 0o700)
        elif stat.S_ISLNK(info.st_mode) or not stat.S_ISDIR(info.st_mode):
            raise _error(
                "HC-RL-A122", "restore parent chain contains a symlink or non-directory"
            )


def _restore_one_path(before: WorktreeSnapshot, repo_root: Path, rel: str) -> None:
    state = before.paths.get(rel, _ABSENT_PATH)
    target = repo_root / rel
    current = _lstat_or_none(target)
    if state.kind == "special":
        raise _error("HC-RL-A122", "cannot restore a special path; manual takeover required")
    if state.kind == "absent":
        if current is None:
            return
        if stat.S_ISREG(current.st_mode) or stat.S_ISLNK(current.st_mode):
            target.unlink()
            return
        raise _error("HC-RL-A122", "restore target became a directory or special file")
    _require_plain_parents(repo_root, target)
    current = _lstat_or_none(target)
    if current is not None and not (
        stat.S_ISREG(current.st_mode) or stat.S_ISLNK(current.st_mode)
    ):
        raise _error("HC-RL-A122", "restore target became a directory or special file")
    if state.kind == "regular":
        data = (Path(before.raw_dir) / str(state.raw_id)).read_bytes()
        if current is not None:
            target.unlink()
        descriptor = os.open(
            target,
            os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0),
            0o600,
        )
        try:
            with os.fdopen(descriptor, "wb") as handle:
                handle.write(data)
                handle.flush()
                os.fsync(handle.fileno())
            if os.name == "posix" and state.mode is not None:
                os.chmod(target, state.mode)
        except BaseException:
            try:
                target.unlink()
            except OSError:
                pass
            raise
        return
    if state.kind == "symlink":
        if current is not None:
            target.unlink()
        os.symlink(str(state.symlink_target), target)
        return
    raise _error("HC-RL-A122", f"unknown snapshot kind: {state.kind}")


def _restore_worktree_snapshot(before: WorktreeSnapshot, relpaths: tuple[str, ...]) -> None:
    """Restore raw bytes/mode/symlink/existence for the given paths from before copies."""
    repo_root = Path(before.repo_root)
    for rel in sorted(set(relpaths)):
        if not _is_repo_relative(rel):
            raise _error("HC-RL-A122", "restore set contains a non repo-relative path")
        _restore_one_path(before, repo_root, rel)


def _write_json_restricted(path: Path, payload: dict[str, object]) -> None:
    with _restricted_writer(path) as handle:
        handle.write(json.dumps(payload, ensure_ascii=True, sort_keys=True).encode("utf-8"))


def _load_json(path: Path) -> dict[str, object]:
    try:
        data = json.loads(path.read_bytes().decode("utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise _error("HC-RL-A122", f"cannot read snapshot manifest: {exc}", exit_code=3) from exc
    if not isinstance(data, dict):
        raise _error("HC-RL-A122", "snapshot manifest is not an object")
    return data


def _load_sample_snapshot(phase_dir: Path) -> WorktreeSnapshot:
    data = _load_json(phase_dir / "manifest.json")
    index = data["index"]
    objects = data["objects"]
    return WorktreeSnapshot(
        repo_root=str(data["repo_root"]),
        head=data["head"],
        index=IndexState(index["exists"], index["sha256"], index["mode"]),
        porcelain_sha256=str(data["porcelain_sha256"]),
        tracked=tuple(str(rel) for rel in data["tracked"]),
        untracked=tuple(str(rel) for rel in data["untracked"]),
        paths={
            rel: RawPathState(
                kind=state["kind"],
                mode=state["mode"],
                size=state["size"],
                sha256=state["sha256"],
                symlink_target=state["symlink_target"],
                raw_id=state["raw_id"],
            )
            for rel, state in data["paths"].items()
        },
        objects=ObjectDbFingerprint(
            tuple(tuple(entry) for entry in objects["entries"]),
            str(objects["count_objects"]),
        ),
        raw_dir=str(phase_dir / "raw"),
    )


def _snapshots_equivalent(left: WorktreeSnapshot, right: WorktreeSnapshot) -> bool:
    return (
        left.head == right.head
        and left.index.diff_tuple() == right.index.diff_tuple()
        and left.porcelain_sha256 == right.porcelain_sha256
        and left.tracked == right.tracked
        and left.untracked == right.untracked
        and {rel: state.diff_tuple() for rel, state in left.paths.items()}
        == {rel: state.diff_tuple() for rel, state in right.paths.items()}
        and left.objects == right.objects
    )


def _remove_snapshot_dir(snap: Path) -> None:
    if snap.is_dir() and not os.path.islink(snap):
        shutil.rmtree(snap, ignore_errors=True)


def _normalize_proposed(proposed: tuple[str, ...], repo_root: Path) -> tuple[str, ...]:
    seen: set[str] = set()
    normalized: list[str] = []
    for raw in proposed:
        if not raw or "\0" in raw:
            raise _error("HC-RL-A122", "proposed path is empty or contains NUL")
        if raw.startswith(("/", "\\")) or _AMEND_DRIVE_RE.match(raw):
            raise _error("HC-RL-A122", f"absolute proposed path rejected: {raw}")
        parts = [part for part in raw.replace("\\", "/").split("/") if part]
        if any(part in (".", "..") for part in parts):
            raise _error("HC-RL-A122", f"proposed path with . or .. rejected: {raw}")
        rel = "/".join(parts)
        if rel in seen:
            raise _error("HC-RL-A122", f"duplicate proposed path: {rel}")
        resolved = Path(os.path.realpath(repo_root / rel))
        if not resolved.is_relative_to(repo_root):
            raise _error("HC-RL-A122", f"proposed path resolves outside the repo: {rel}")
        seen.add(rel)
        normalized.append(rel)
    return tuple(normalized)


def _reject_ignored(repo_root: Path, proposed: tuple[str, ...]) -> None:
    stdin = b"".join(os.fsencode(rel) + b"\0" for rel in proposed)
    raw = _git_readonly(
        repo_root,
        ("check-ignore", "--no-index", "-z", "--stdin"),
        stdin=stdin,
        allow_exit=(0, 1),
    )
    ignored = set(_decode_git_z_paths(raw, meta=False))
    hits = [rel for rel in proposed if rel in ignored]
    if hits:
        raise _error("HC-RL-A122", f"proposed path is git-ignored: {hits[0]}")


def _prepare_snapshot_dir(snapshot_dir: str, repo_root: Path) -> Path:
    snap = Path(snapshot_dir)
    if not snap.is_absolute():
        raise _error("HC-RL-A122", "--snapshot-dir must be an absolute path")
    if os.path.lexists(snap):
        raise _error("HC-RL-A122", "--snapshot-dir already exists")
    if os.path.realpath(snap) != os.path.abspath(snap):
        raise _error("HC-RL-A122", "--snapshot-dir has a symlink parent chain")
    resolved = Path(os.path.realpath(snap))
    common_raw = _git_readonly(repo_root, ("rev-parse", "--git-common-dir"))
    common = Path(os.fsdecode(common_raw.strip()))
    if not common.is_absolute():
        common = repo_root / common
    forbidden_roots = (
        repo_root,
        _git_path(repo_root, "index").parent,
        _git_path(repo_root, "objects"),
        Path(os.path.realpath(common)),
    )
    for root in forbidden_roots:
        if resolved.is_relative_to(root):
            raise _error(
                "HC-RL-A122", "--snapshot-dir must live outside the repo and git metadata"
            )
    _restricted_dir(snap)
    return snap


def _before_cards(before: WorktreeSnapshot, plan_file_rel: str) -> tuple[str, ...]:
    """Read the marker cards from the before raw copy — never the post-edit plan."""
    state = before.paths.get(plan_file_rel, _ABSENT_PATH)
    if state.kind != "regular" or not state.raw_id:
        raise _error("HC-RL-A122", "cannot read the before copy of relay_plan.md")
    try:
        text = (Path(before.raw_dir) / state.raw_id).read_bytes().decode("utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        raise _error(
            "HC-RL-A122", f"cannot decode the before relay_plan.md: {exc}", exit_code=3
        ) from exc
    lines = text.splitlines()
    try:
        _, fields = _parse_marker(lines[0] if lines else "")
    except RelayError as exc:
        raise _error("HC-RL-A122", f"before plan marker unreadable: {exc.message}") from exc
    cards = tuple(card for card in fields["cards"].split(",") if card)
    if not cards:
        raise _error("HC-RL-A122", "before plan marker has no cards=")
    return cards


def _check_amend_allowlist(
    proposed: tuple[str, ...],
    plan_rel: str,
    module: str,
    cards: tuple[str, ...],
    before: WorktreeSnapshot,
) -> None:
    """decision.1 ①B: exactly three path classes; design/ and anything else is A122."""
    plan_file = f"{plan_rel}/relay_plan.md"
    dev_plan_re = re.compile(rf"docs/modules/{re.escape(module)}/dev_plan/P[0-9]+-[^/]*\.md")
    task_plans = {f"docs/modules/{module}/workspace/{card}/task_plan.md" for card in cards}
    observed = set(before.tracked) | set(before.untracked)
    for rel in proposed:
        if _AMEND_DESIGN_RE.match(rel):
            raise _error("HC-RL-A122", f"design/ is a forbidden area: {rel}")
        allowed = (
            rel == plan_file or dev_plan_re.fullmatch(rel) is not None or rel in task_plans
        )
        if not allowed:
            raise _error(
                "HC-RL-A122", f"proposed path outside the three-class allowlist: {rel}"
            )
        if before.paths.get(rel, _ABSENT_PATH).kind == "special":
            raise _error(
                "HC-RL-A122", f"proposed path is a directory or special file: {rel}"
            )
        segments = rel.split("/")
        for depth in range(1, len(segments)):
            ancestor = "/".join(segments[:depth])
            if ancestor in observed:
                raise _error(
                    "HC-RL-A122",
                    f"proposed path crosses a tracked/gitlink ancestor: {rel}",
                )


def _validate_amend_before(
    plan_dir: str,
    repo: str,
    snapshot_dir: str,
    proposed: tuple[str, ...],
    config: RelayConfig,
) -> int:
    repo_root = _resolve_repo_root(repo)
    plan_root = Path(os.path.realpath(plan_dir))
    try:
        plan_rel = plan_root.relative_to(repo_root).as_posix()
    except ValueError:
        raise _error("HC-RL-A122", "--plan must point inside the repository")
    match = _AMEND_PLAN_DIR_RE.fullmatch(plan_rel)
    if match is None:
        raise _error("HC-RL-A122", "--plan must be docs/modules/<module>/relay/<plan_id>/")
    module = match.group("module")
    normalized = _normalize_proposed(proposed, repo_root)
    _reject_ignored(repo_root, normalized)
    snap = _prepare_snapshot_dir(snapshot_dir, repo_root)
    try:
        before = _snapshot_worktree(repo_root, snap, "before")
        verify = _snapshot_worktree(repo_root, snap, "verify")
        if not _snapshots_equivalent(before, verify):
            raise _error("HC-RL-A122", "worktree is not silent: two before-samples disagree")
        shutil.rmtree(snap / "verify")
        cards = _before_cards(before, f"{plan_rel}/relay_plan.md")
        _check_amend_allowlist(normalized, plan_rel, module, cards, before)
        _write_json_restricted(
            snap / "manifest.json",
            {
                "version": 1,
                "repo_root": str(repo_root),
                "plan_rel": plan_rel,
                "module": module,
                "proposed": list(normalized),
            },
        )
    except BaseException:
        _remove_snapshot_dir(snap)
        raise
    print(f"lint: amend-check before ok ({len(normalized)} proposed path(s))")
    return 0


def _restore_after_failure(
    before: WorktreeSnapshot, restore_set: set[str], snap: Path
) -> None:
    try:
        _restore_worktree_snapshot(before, tuple(sorted(restore_set)))
        restored = _snapshot_worktree(Path(before.repo_root), snap, "restored")
        residual = _diff_worktree_snapshots(before, restored)
        meta_equal = (
            restored.head == before.head
            and restored.index.diff_tuple() == before.index.diff_tuple()
            and restored.objects == before.objects
        )
    except (RelayError, OSError):
        residual = ("<unrestored>",)
        meta_equal = False
    if residual or not meta_equal:
        raise _error(
            "HC-RL-A122",
            "restore could not be verified; restricted snapshot kept for manual "
            f"takeover at runtime handle {snap}",
        )
    _remove_snapshot_dir(snap)


def _validate_amend_after(plan_dir: str, repo: str, snapshot_dir: str, config: RelayConfig) -> int:
    repo_root = _resolve_repo_root(repo)
    plan_root = Path(os.path.realpath(plan_dir))
    try:
        plan_rel = plan_root.relative_to(repo_root).as_posix()
    except ValueError:
        raise _error("HC-RL-A122", "--plan must point inside the repository")
    snap = Path(snapshot_dir)
    if not snap.is_dir() or os.path.islink(snap):
        raise _error("HC-RL-A122", "--snapshot-dir must be an existing real directory")
    run = _load_json(snap / "manifest.json")
    if (
        run.get("version") != 1
        or run.get("repo_root") != str(repo_root)
        or run.get("plan_rel") != plan_rel
    ):
        raise _error("HC-RL-A122", "snapshot-dir does not belong to this repo/plan run")
    before = _load_sample_snapshot(snap / "before")
    proposed = tuple(str(item) for item in run.get("proposed", ()))
    after = _snapshot_worktree(repo_root, snap, "after")
    actual = _diff_worktree_snapshots(before, after)
    failure: RelayError | None = None
    if set(actual) != set(proposed):
        unchanged = sorted(set(proposed) - set(actual))
        unexpected = len(set(actual) - set(proposed))
        failure = _error(
            "HC-RL-A122",
            "actual != proposed "
            f"(unchanged proposed: {','.join(unchanged) or 'none'}; "
            f"unexpected changed paths: {unexpected})",
        )
    elif (
        after.head != before.head
        or after.index.diff_tuple() != before.index.diff_tuple()
        or after.objects != before.objects
    ):
        failure = _error(
            "HC-RL-A122", "HEAD, real index, or object database changed during the window"
        )
    else:
        try:
            lint_plan(plan_root / "relay_plan.md", config)
        except RelayError as exc:
            failure = exc
    if failure is None:
        _remove_snapshot_dir(snap)
        print(
            "lint: amend-check after ok "
            f"(actual == proposed: {len(actual)} path(s)); plan lint ok"
        )
        return 0
    _restore_after_failure(before, set(actual) | set(proposed), snap)
    raise failure


def _lint_command(
    plan_dir: str,
    as_json: bool,
    config: RelayConfig,
    *,
    amend_check: str | None = None,
    repo: str | None = None,
    snapshot_dir: str | None = None,
    proposed_path: tuple[str, ...] = (),
) -> int:
    try:
        if amend_check is None:
            lint_plan(Path(plan_dir) / "relay_plan.md", config)
        elif amend_check == "before":
            return _validate_amend_before(plan_dir, repo or "", snapshot_dir or "", proposed_path, config)
        else:
            return _validate_amend_after(plan_dir, repo or "", snapshot_dir or "", config)
    except RelayError as exc:
        if exc.exit_code == 3:
            return _fail(exc)
        if as_json:
            document = {"ok": False, "violations": [_lint_violation(exc)]}
            print(json.dumps(document, ensure_ascii=False))
        else:
            print(f"lint: {exc.code} {exc.message}", file=sys.stderr)
        return exc.exit_code
    if as_json:
        print(json.dumps({"ok": True, "violations": []}, ensure_ascii=False))
    else:
        print("lint: ok")
    return 0


def _runtime_plan(plan_dir: str, config: RelayConfig) -> Plan:
    """Load a plan for add/status, where any invalid plan is an input failure."""
    try:
        return lint_plan(Path(plan_dir) / "relay_plan.md", config)
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
    # JSONL records are delimited by LF. str.splitlines() also splits valid
    # JSON string content such as U+0085/U+2028/U+2029, making a successful
    # append unreadable on the next command.
    for expected_seq, line in enumerate(text[:-1].split("\n"), start=1):
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
            if event == "plan_amend":
                raise _error(
                    "HC-RL-A119", f"plan_amend must be written by monitor#<n>: {agent}"
                )
            raise _error("HC-RL-A69", f"control event requires orchestrator or monitor: {event}")
        return
    if name in RELAUNCH_EXEMPT_AGENT_NAMES:
        # HC-RL-A122: planner-amend never writes blocked/escalate — an out-of-scope
        # finding is reported only through its ordinary done.note, then the monitor
        # writes the blocked stage_result.
        if name == "planner-amend" and event in {"blocked", "escalate"}:
            raise _error("HC-RL-A122", f"planner-amend must not write {event}")
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


def _validate_plan_amend_note(note: str) -> None:
    """HC-RL-A119: a plan_amend note carries the proposal filename plus nodes=<node,…>."""
    if not any("=" not in token for token in note.split()):
        raise _error("HC-RL-A119", "plan_amend note must carry the proposal filename")
    nodes = _note_tokens(note).get("nodes")
    if nodes is None or not nodes or any(not item for item in nodes.split(",")):
        raise _error("HC-RL-A119", "plan_amend note must carry nodes=<node,node>")


def _validate_planner_amend_done_note(note: str) -> None:
    """HC-RL-A122: a planner-amend `done` either carries an ordinary free-form note
    (successful amend) or exactly the structured out-of-scope form
    `outcome=out-of-scope proposal=<方案文件名> reason=<非空原因>`."""
    tokens = _note_tokens(note)
    if "outcome" not in tokens:
        return
    if tokens["outcome"] != "out-of-scope":
        raise _error("HC-RL-A122", "planner-amend done outcome must be out-of-scope")
    proposal = tokens.get("proposal", "")
    if not proposal or "/" in proposal or "\\" in proposal:
        raise _error(
            "HC-RL-A122",
            "planner-amend out-of-scope done.note must carry proposal=<方案文件名>",
        )
    if not tokens.get("reason"):
        raise _error(
            "HC-RL-A122", "planner-amend out-of-scope done.note must carry reason=<非空原因>"
        )


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
    if event == "decision" and agent in owners:
        note_helper = _validate_decision_helper(note)
        if note_helper != owners[agent]:
            raise _error(
                "HC-RL-A69", f"decision event {event} must carry helper {owners[agent]} in note"
            )


def _validate_strategist_conclusion(
    entries: list[dict[str, object]], node: NodeSpec, event: str, agent: str
) -> None:
    """HC-RL-A97: a strategist-attributed chain closes only through user_decision — even in
    decision_mode=auto (§4.5.1: strategist findings always go to the user first)."""
    if event not in {"resume", "cancelled"}:
        return
    helper = _active_decision_owners(entries, node.node).get(agent)
    if helper is None or helper.partition("#")[0] != "strategist":
        return
    latest = _latest_for_instance(entries, node.node, agent)
    if latest is None or latest["event"] != "user_decision":
        raise _error(
            "HC-RL-A97",
            f"{event} on {agent} requires a user_decision on the strategist chain",
        )


def _validate_agent_transition(
    plan: Plan, entries: list[dict[str, object]], node: NodeSpec, event: str, agent: str
) -> None:
    name, attempt = _agent_parts(agent)
    if event == "agent_launch":
        if not _node_started(entries, node.node):
            raise _error("HC-RL-A78", f"node {node.node} must start before agent launch")
        _require_trigger(plan, entries, node, name)
        launches = [
            entry
            for entry in entries
            if entry["node"] == node.node
            and entry["event"] == "agent_launch"
            and _agent_parts(str(entry["agent"]))[0] == name
        ]
        if not launches:
            if attempt != 1:
                raise _error("HC-RL-A58", f"first attempt for {name} must be #1")
            return
        prior_attempt = max(_agent_parts(str(entry["agent"]))[1] for entry in launches)
        if attempt != prior_attempt + 1:
            raise _error("HC-RL-A58", f"attempt for {name} must increment by one")
        prior_agent = f"{name}#{prior_attempt}"
        prior = _latest_for_instance(entries, node.node, prior_agent)
        assert prior is not None
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
    _validate_writer(event, agent)
    _validate_event_semantics(plan, entries, node, event, agent, note)
    _validate_writer_handoff(plan, entries, node_name, event, note)


def _validate_event_semantics(
    plan: Plan, entries: list[dict[str, object]], node: NodeSpec, event: str, agent: str, note: str
) -> None:
    """Per-event contract: node gates, stage ordering, agent state machine."""
    if event == "plan_loaded":
        _validate_plan_loaded_note(note)
        _require_sole_plan_loaded(entries)
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
    if event in CONTROL_EVENTS:
        if event == "plan_amend":
            _validate_plan_amend_note(note)
        _validate_stage_event(plan, entries, event, note)
        return
    if event in AGENT_EVENTS:
        if event == "done" and _agent_parts(agent)[0] == "planner-amend":
            _validate_planner_amend_done_note(note)
        _validate_decision_ownership(entries, node, event, agent, note)
        _validate_strategist_conclusion(entries, node, event, agent)
        _validate_agent_transition(plan, entries, node, event, agent)


def _validate_writer(event: str, agent: str) -> None:
    """HC-RL-A85: an event's writer must be its frozen owner (§3.4)."""
    owner = WRITER_BY_EVENT[event]
    actual = _writer_from_agent(agent)
    if actual != owner:
        raise _error("HC-RL-A85", f"{event} must be written by {owner}, not {actual}")


def _stage_instances(plan: Plan) -> dict[str, tuple[NodeSpec, ...]]:
    instances: dict[str, list[NodeSpec]] = {}
    for node in plan.nodes:
        if not node.superseded:
            instances.setdefault(node.stage_id, []).append(node)
    return {stage_id: tuple(nodes) for stage_id, nodes in instances.items()}


def _active_node_map(plan: Plan) -> dict[str, NodeSpec]:
    return {node.node: node for node in plan.nodes if not node.superseded}


def _stage_entries(
    entries: list[dict[str, object]], stage_id: str, nodes_by_name: dict[str, NodeSpec]
) -> list[dict[str, object]]:
    return [entry for entry in entries if _stage_of(entry, nodes_by_name) == stage_id]


def _stage_id_from_note(note: str, event: str, code: str) -> str:
    stage_id = _note_tokens(note).get("stage_id")
    if not stage_id:
        raise _error(code, f"{event} note must contain stage_id=<card>:<stage>#<k>")
    return stage_id


def latest_stage_result(
    entries: list[dict[str, object]], stage_id: str, nodes_by_name: dict[str, NodeSpec]
) -> dict[str, object] | None:
    """The newest `stage_result` row of one instance (HC-RL-A105: latest wins)."""
    latest: dict[str, object] | None = None
    for entry in _stage_entries(entries, stage_id, nodes_by_name):
        if entry["event"] == "stage_result":
            latest = entry
    return latest


def _require_sole_plan_loaded(entries: list[dict[str, object]]) -> None:
    """HC-RL-A89: plan_loaded is the first row and appears exactly once."""
    if entries:
        raise _error("HC-RL-A89", "plan_loaded must be the first and only plan_loaded row")


def _stage_lifecycle_events(
    entries: list[dict[str, object]], stage_id: str, nodes_by_name: dict[str, NodeSpec]
) -> list[str]:
    return [
        entry["event"]
        for entry in _stage_entries(entries, stage_id, nodes_by_name)
        if entry["event"] in {"stage_start", "monitor_launch", "stage_close"}
    ]


def _validate_stage_event(
    plan: Plan, entries: list[dict[str, object]], event: str, note: str
) -> None:
    """HC-RL-A89/A105/A112/A118: stage-level control events are ordered and note-typed."""
    if event not in {"stage_start", "monitor_launch", "stage_result", "stage_close"}:
        return  # monitor_restart / plan_amend carry no stage ordering rule (A93 covers races)
    instances = _stage_instances(plan)
    nodes_by_name = _active_node_map(plan)
    if event == "stage_result":
        tokens = _note_tokens(note)
        stage_id = tokens.get("stage_id")
        if not stage_id:
            raise _error("HC-RL-A105", "stage_result note must contain stage_id=")
        if stage_id not in instances:
            raise _error("HC-RL-A105", f"stage_result names unknown stage instance {stage_id}")
        outcome = tokens.get("outcome")
        if outcome not in STAGE_RESULT_OUTCOMES:
            raise _error(
                "HC-RL-A105",
                f"stage_result outcome must be one of {list(STAGE_RESULT_OUTCOMES)}, got {outcome!r}",
            )
        if outcome == "cancelled" and "user_decision" not in note:
            raise _error("HC-RL-A118", "cancelled stage_result note must cite the user_decision")
        unclosed = [node.node for node in instances[stage_id] if not _node_closed(entries, node.node)]
        if unclosed:
            raise _error(
                "HC-RL-A112",
                f"stage_result must follow the last node_close of {stage_id}; still open: {unclosed}",
            )
        # HC-RL-A123: the amend summary mirrors this instance's own plan_amend history.
        # A superseded row keeps its stage_id and node names stay unique (A46), so
        # attribution uses the full table — superseding the carrier cannot orphan it.
        all_nodes = {node.node: node for node in plan.nodes}
        stage_amends = any(
            entry["event"] == "plan_amend"
            for entry in _stage_entries(entries, stage_id, all_nodes)
        )
        if stage_amends:
            if not tokens.get("amend"):
                raise _error(
                    "HC-RL-A123",
                    f"stage_result for {stage_id} must carry amend=<proposal> after plan_amend",
                )
            nodes = tokens.get("nodes", "")
            if not nodes or any(not item for item in nodes.split(",")):
                raise _error(
                    "HC-RL-A123",
                    f"stage_result for {stage_id} must carry nodes=<node,node> after plan_amend",
                )
        elif "amend" in tokens:
            raise _error(
                "HC-RL-A123",
                f"stage_result for {stage_id} carries amend= without a stage plan_amend",
            )
        return

    code = "HC-RL-A89"
    stage_id = _stage_id_from_note(note, event, code)
    if stage_id not in instances:
        raise _error(code, f"{event} names unknown stage instance {stage_id}")
    seen = _stage_lifecycle_events(entries, stage_id, nodes_by_name)
    if event == "stage_start":
        if "stage_start" in seen:
            raise _error(code, f"stage {stage_id} already started")
        if "stage_close" in seen:
            raise _error(code, f"stage {stage_id} already closed")
        if "monitor_launch" in seen:
            raise _error(code, f"stage_start must precede monitor_launch of {stage_id}")
        return
    if event == "monitor_launch":
        if "stage_start" not in seen:
            raise _error(code, f"monitor_launch must follow stage_start of {stage_id}")
        return
    if "stage_start" not in seen:
        raise _error(code, f"stage_close requires stage_start of {stage_id}")
    if "stage_close" in seen:
        raise _error(code, f"stage {stage_id} already closed")
    if "monitor_launch" not in seen:
        raise _error(code, f"stage_close requires a monitor_launch of {stage_id}")
    unclosed = [node.node for node in instances[stage_id] if not _node_closed(entries, node.node)]
    if unclosed:
        raise _error(code, f"stage_close requires every node closed; still open: {unclosed}")
    result = latest_stage_result(entries, stage_id, nodes_by_name)
    if result is None:
        raise _error("HC-RL-A112", f"stage_close requires a stage_result for {stage_id}")
    outcome = parse_stage_result_note(str(result["note"])).outcome
    if outcome == "blocked":
        raise _error("HC-RL-A118", f"stage_close cannot follow outcome=blocked for {stage_id}")
    if outcome not in TERMINAL_RESULT_OUTCOMES:
        raise _error("HC-RL-A112", f"stage_close needs outcome=done/cancelled, got {outcome!r}")


def _validate_writer_handoff(
    plan: Plan, entries: list[dict[str, object]], node_name: str, event: str, note: str
) -> None:
    """HC-RL-A93: a monitor's writes sit inside its instance's stage_start..stage_close window."""
    nodes_by_name = _active_node_map(plan)
    node = nodes_by_name.get(node_name)
    note_stage = _note_tokens(note).get("stage_id")
    if event in STAGE_NOTE_EVENTS:
        stage_id = note_stage or (node.stage_id if node is not None else None)
    else:
        stage_id = node.stage_id if node is not None else None
        if note_stage is not None and stage_id is not None and note_stage != stage_id:
            raise _error(
                "HC-RL-A93",
                f"{event} on node {node_name} belongs to {stage_id}; note names {note_stage}",
            )
    if stage_id is None:
        return
    stage_rows = _stage_entries(entries, stage_id, nodes_by_name)
    if WRITER_BY_EVENT[event] == "monitor" and not any(
        row["event"] == "stage_start" for row in stage_rows
    ):
        raise _error("HC-RL-A93", f"{event} cannot precede stage_start of {stage_id}")
    closes = [row for row in stage_rows if row["event"] == "stage_close"]
    if closes:
        raise _error(
            "HC-RL-A93",
            f"{stage_id} was closed at seq {closes[-1]['seq']}; {event} cannot follow it",
        )


def _encode_path(value: str | Path) -> str:
    return quote(str(value).replace(os.sep, "/"), safe=CONFIG_PATH_SAFE)


def _plan_loaded_note(note: str, plan_dir: str, config: RelayConfig) -> str:
    """§6.2.1/A135: the ledger always records the config dir and plan dir actually used.

    Caller-supplied ``config_dir=``/``plan=`` tokens are dropped rather than trusted: they
    cannot prove which configuration was read. Every other note token is preserved in order.
    """
    kept = [token for token in note.split() if token.partition("=")[0] not in PROVENANCE_KEYS]
    provenance = (
        f"config_dir={_encode_path(config.config_dir)}",
        f"plan={_encode_path(_normalized_dir(plan_dir))}",
    )
    return " ".join([*kept, *provenance])


def append_event(plan_dir: str, node: str, event: str, agent: str, note: str, config: RelayConfig) -> None:
    """Append one validated JSONL event without changing earlier ledger bytes."""
    plan = _runtime_plan(plan_dir, config)
    _validate_event(event, agent)
    ledger_path = Path(plan_dir) / "relay_log.jsonl"
    entries = read_ledger(ledger_path)
    if not entries and event != "plan_loaded":
        raise _error("HC-RL-A84", "first ledger event must be plan_loaded")
    _validate_runtime_event(plan, entries, node, event, agent, note)
    if event == "plan_loaded":
        note = _plan_loaded_note(note, plan_dir, config)
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


def _add_command(plan_dir: str, node: str, event: str, agent: str, note: str, config: RelayConfig) -> int:
    try:
        append_event(plan_dir, node, event, agent, note, config)
    except RelayError as exc:
        return _fail(exc)
    return 0


@dataclass(frozen=True)
class StageResultNote:
    """Read-only reading of one `stage_result` note (§5.2.1)."""

    stage_id: str | None
    outcome: str | None
    amend: str | None
    nodes: tuple[str, ...]


@dataclass(frozen=True)
class StageResult:
    stage_id: str
    outcome: str
    note: str
    amend: str | None
    nodes: tuple[str, ...]


@dataclass(frozen=True)
class StageState:
    stage_id: str
    stage: str
    card: str
    k: int
    state: str
    nodes: tuple[str, ...]
    result: StageResult | None


@dataclass(frozen=True)
class NodeState:
    node: str
    card: str
    stage_id: str
    type: str
    state: str
    closable: bool
    reasons: tuple[str, ...]


@dataclass(frozen=True)
class AgentState:
    node: str
    agent: str
    last_event: str
    last_ts: str
    idle_seconds: int


@dataclass(frozen=True)
class Status:
    """The full status projection. `last_writer` is text-only: §3.5 freezes thirteen JSON keys."""

    plan: Plan
    open_stages: tuple[str, ...]
    current_stage: str | None
    current_node: str | None
    last_stage_result: StageResult | None
    suggested_action: str
    monitor_relaunch_count: int
    pending_nodes: tuple[str, ...]
    superseded_ignored: int
    stages: tuple[StageState, ...]
    nodes: tuple[NodeState, ...]
    agents: tuple[AgentState, ...]
    errors: tuple[str, ...]
    last_writer: str | None
    last_writer_stage: str | None


def _note_tokens(note: str) -> dict[str, str]:
    """Split one note into `key=value` tokens; the first occurrence of a key wins."""
    tokens: dict[str, str] = {}
    for token in note.split():
        key, separator, value = token.partition("=")
        if separator:
            tokens.setdefault(key, value)
    return tokens


def parse_stage_result_note(note: str) -> StageResultNote:
    """Read-only parse of a `stage_result` note; an unknown outcome stays None."""
    tokens = _note_tokens(note)
    outcome = tokens.get("outcome")
    return StageResultNote(
        stage_id=tokens.get("stage_id") or None,
        outcome=outcome if outcome in STAGE_RESULT_OUTCOMES else None,
        amend=tokens.get("amend") or None,
        nodes=tuple(part for part in tokens.get("nodes", "").split(",") if part),
    )


def _stage_of(entry: dict[str, object], nodes_by_name: dict[str, NodeSpec]) -> str | None:
    """Attribute one ledger row to a stage instance.

    The four stage-level control events are addressed by the note's ``stage_id=``;
    every other row belongs to the stage of its ``node``, so a ``stage_id=`` token
    there cannot reattribute the row to a foreign instance.
    """
    if str(entry["event"]) in STAGE_NOTE_EVENTS:
        stage_id = _note_tokens(str(entry["note"])).get("stage_id")
        if stage_id:
            return stage_id
    node = nodes_by_name.get(str(entry["node"]))
    return node.stage_id if node is not None else None


def derive_last_writer(
    entries: list[dict[str, object]], nodes_by_name: dict[str, NodeSpec]
) -> tuple[str | None, str | None]:
    """The on-duty writer is the newest row's recorded `by` (§3.2), not a decision."""
    if not entries:
        return None, None
    return str(entries[-1]["by"]), _stage_of(entries[-1], nodes_by_name)


def _unclosable_reasons(
    entries: list[dict[str, object]], node: NodeSpec
) -> tuple[str, ...]:
    """§5.3 double criteria, reported in `_validate_node_close`'s own check order.

    Condition 1 is never waived, so its reasons come first; condition 2 is only
    surfaced once condition 1 holds, which is what the §10.3 sample shows.
    """
    launched: list[str] = []
    for entry in entries:
        if entry["node"] == node.node and entry["event"] == "agent_launch":
            agent = str(entry["agent"])
            if agent not in launched:
                launched.append(agent)
    reasons = [
        f"{agent} 无终态事件"
        for agent in launched
        if (latest := _latest_for_instance(entries, node.node, agent)) is None
        or latest["event"] not in TERMINAL_EVENTS
    ]
    if not reasons and node.close:
        close_name = node.close.removeprefix("agent:")
        latest = _latest_by_name(entries, node.node, close_name)
        if latest is None or latest["event"] != "done":
            reasons.append(f"{close_name} 无 done 终态")
    return tuple(reasons)


def _ledger_warnings(
    entries: list[dict[str, object]],
    nodes_by_name: dict[str, NodeSpec],
    instances: dict[str, tuple[NodeSpec, ...]],
    stage_starts: dict[str, int],
    stage_closes: set[str],
) -> list[str]:
    """Read-only anomaly report (HC-RL-A85/A93/A111). `status` never rewrites or rejects."""
    warnings: list[str] = []
    for entry in entries:
        event = str(entry["event"])
        owner = WRITER_BY_EVENT[event]
        actual = str(entry["by"])
        if actual != owner:
            warnings.append(
                f"seq {entry['seq']}: HC-RL-A85 {event} must be written by {owner}, not {actual}"
            )
    closes: dict[str, int] = {}
    starts: set[str] = set()
    launches: dict[str, int] = {}
    for entry in entries:
        event = str(entry["event"])
        stage_id = _stage_of(entry, nodes_by_name)
        if stage_id is None:
            continue
        if event not in STAGE_NOTE_EVENTS:
            note_stage = _note_tokens(str(entry["note"])).get("stage_id")
            if note_stage and note_stage != stage_id:
                warnings.append(
                    f"seq {entry['seq']}: HC-RL-A93 {event} on node {entry['node']} belongs to "
                    f"{stage_id}; note names {note_stage}"
                )
        if event == "stage_close":
            closes[stage_id] = int(entry["seq"])
            if not launches.get(stage_id):
                warnings.append(
                    f"seq {entry['seq']}: HC-RL-A89 stage_close of {stage_id} has no monitor_launch"
                )
            continue
        if event == "stage_start":
            starts.add(stage_id)
        elif event == "monitor_launch":
            launches[stage_id] = launches.get(stage_id, 0) + 1
        if stage_id in closes:
            warnings.append(
                f"seq {entry['seq']}: HC-RL-A93 {event} for {stage_id} follows its "
                f"stage_close at seq {closes[stage_id]}"
            )
            continue
        if (
            WRITER_BY_EVENT[event] == "monitor"
            and stage_id in instances
            and stage_id not in starts
        ):
            warnings.append(
                f"seq {entry['seq']}: HC-RL-A93 {event} for {stage_id} precedes its stage_start"
            )
    open_by_card: dict[str, list[str]] = {}
    for stage_id in stage_starts:
        if stage_id in stage_closes or stage_id not in instances:
            continue
        open_by_card.setdefault(instances[stage_id][0].card, []).append(stage_id)
    for card, stage_ids in open_by_card.items():
        if len(stage_ids) > 1:
            warnings.append(
                f"HC-RL-A111 card {card} has {len(stage_ids)} open stage instances: {stage_ids}"
            )
    return warnings


def _idle_seconds(ts: str, moment: datetime, errors: list[str], seq: object) -> int:
    try:
        recorded = datetime.fromisoformat(ts)
    except ValueError:
        errors.append(f"seq {seq}: ts is not ISO 8601")
        return 0
    if (recorded.tzinfo is None) != (moment.tzinfo is None):
        errors.append(f"seq {seq}: ts offset cannot be compared with the current time")
        return 0
    return max(0, int((moment - recorded).total_seconds()))


def _suggested_action(result: StageResult | None, relaunches: int) -> str:
    """§3.5/§2.1 routing table: a derived suggestion, never a command."""
    if result is None:
        return "none"
    if result.outcome in {"done", "cancelled"}:
        return "open_next_stage"
    if result.outcome == "blocked":
        return "wait_user"
    return "relaunch_monitor" if relaunches == 0 else "notify_user"


def derive_status(plan: Plan, entries: list[dict[str, object]], now: datetime | None = None) -> Status:
    """Project the whole status document from one plan and its complete ledger.

    `now` is injectable so clock and silence stay deterministic. This is a read-only
    projection: it neither validates lifecycle order nor judges any produce.
    """
    moment = now if now is not None else datetime.now().astimezone()
    active_nodes = tuple(node for node in plan.nodes if not node.superseded)
    nodes_by_name = {node.node: node for node in active_nodes}
    node_order = {node.node: index for index, node in enumerate(active_nodes)}
    started = bool(entries)
    errors: list[str] = []

    closed = {node.node: _node_closed(entries, node.node) for node in active_nodes}
    instances: dict[str, list[NodeSpec]] = {}
    for node in active_nodes:
        instances.setdefault(node.stage_id, []).append(node)

    stage_starts: dict[str, int] = {}
    stage_closes: set[str] = set()
    results: dict[str, StageResult] = {}
    latest_outcome: dict[str, str] = {}
    relaunches: dict[str, int] = {}
    for entry in entries:
        event = str(entry["event"])
        stage_id = _stage_of(entry, nodes_by_name)
        if event == "stage_result":
            parsed = parse_stage_result_note(str(entry["note"]))
            if parsed.stage_id is None:
                errors.append(f"seq {entry['seq']}: stage_result without stage_id=")
                continue
            if parsed.stage_id not in instances:
                continue  # a superseded or unknown instance stays out of the projection (A73)
            if parsed.outcome is None:
                errors.append(
                    f"seq {entry['seq']}: stage_result outcome must be one of {list(STAGE_RESULT_OUTCOMES)}"
                )
                continue
            results[parsed.stage_id] = StageResult(
                stage_id=parsed.stage_id,
                outcome=parsed.outcome,
                note=str(entry["note"]),
                amend=parsed.amend,
                nodes=parsed.nodes,
            )
            latest_outcome[parsed.stage_id] = parsed.outcome
            continue
        if event == "plan_amend" and "nodes" not in _note_tokens(str(entry["note"])):
            errors.append(f"seq {entry['seq']}: plan_amend note must carry nodes=")
        if stage_id is None or stage_id not in instances:
            continue
        if event == "stage_start":
            stage_starts.setdefault(stage_id, int(entry["seq"]))
        elif event == "stage_close":
            stage_closes.add(stage_id)
        elif event == "monitor_launch":
            # A106/§3.5: only a launch while the instance's latest result is `failed`
            # counts as a failed-caused relaunch; §7.3 crash recovery does not.
            if latest_outcome.get(stage_id) == "failed":
                relaunches[stage_id] = relaunches.get(stage_id, 0) + 1

    stages = tuple(
        StageState(
            stage_id=stage_id,
            stage=instance[0].stage,
            card=instance[0].card,
            k=instance[0].k,
            state=(
                "closed" if stage_id in stage_closes
                else "open" if stage_id in stage_starts
                else "pending"
            ),
            nodes=tuple(node.node for node in instance),
            result=results.get(stage_id),
        )
        for stage_id, instance in instances.items()
    )

    if started:
        node_states = {
            node.node: (
                "closed" if closed[node.node]
                else "pending" if any(not closed.get(dependency, False) for dependency in node.depends_on)
                else "open" if _node_started(entries, node.node)
                else "ready"
            )
            for node in active_nodes
        }
    else:
        node_states = {node.node: "pending" for node in active_nodes}

    stage_instances = {stage_id: tuple(nodes) for stage_id, nodes in instances.items()}
    open_ids = [stage_id for stage_id in stage_starts if stage_id not in stage_closes]
    awaiting_close = [
        stage_id
        for stage_id in open_ids
        if all(closed[node.node] for node in stage_instances[stage_id])
    ]
    current = next((node for node in active_nodes if not closed[node.node]), None) if started else None
    if current is not None and (current.stage_id in stage_starts or not open_ids):
        current_stage = current.stage_id
    elif started:
        # A merely pending node (its stage instance never started) must not shadow an
        # open instance — first one whose result awaits stage_close, else the latest
        # open one — so its last_stage_result/suggested_action stay routable (A106).
        pool = awaiting_close or open_ids
        current_stage = max(pool, key=lambda stage_id: stage_starts[stage_id]) if pool else None
    else:
        current_stage = None
    last_stage_result = results.get(current_stage) if current_stage is not None else None
    monitor_relaunch_count = relaunches.get(current_stage, 0) if current_stage is not None else 0
    errors.extend(
        _ledger_warnings(entries, nodes_by_name, stage_instances, stage_starts, stage_closes)
    )

    launches: dict[tuple[str, str], int] = {}
    for entry in entries:
        if entry["event"] != "agent_launch" or str(entry["node"]) not in nodes_by_name:
            continue
        launches.setdefault((str(entry["node"]), str(entry["agent"])), int(entry["seq"]))
    agents: list[AgentState] = []
    for (node_name, agent), _ in sorted(launches.items(), key=lambda item: (node_order[item[0][0]], item[1])):
        latest = _latest_for_instance(entries, node_name, agent)
        assert latest is not None
        last_ts = str(latest["ts"])
        agents.append(
            AgentState(
                node=node_name,
                agent=agent,
                last_event=str(latest["event"]),
                last_ts=last_ts,
                idle_seconds=_idle_seconds(last_ts, moment, errors, latest["seq"]),
            )
        )

    nodes = tuple(
        NodeState(
            node=node.node,
            card=node.card,
            stage_id=node.stage_id,
            type=node.type,
            state=node_states[node.node],
            closable=not (reasons := _unclosable_reasons(entries, node)),
            reasons=reasons,
        )
        for node in active_nodes
    )
    last_writer, last_writer_stage = derive_last_writer(entries, nodes_by_name)
    return Status(
        plan=plan,
        open_stages=tuple(stage.stage_id for stage in stages if stage.state == "open"),
        current_stage=current_stage,
        current_node=current.node if current is not None else None,
        last_stage_result=last_stage_result,
        suggested_action=_suggested_action(last_stage_result, monitor_relaunch_count),
        monitor_relaunch_count=monitor_relaunch_count,
        pending_nodes=tuple(node.node for node in active_nodes if node_states[node.node] == "pending"),
        superseded_ignored=(
            sum(1 for node in plan.nodes if node.superseded)
            + sum(1 for agent in plan.agents if agent.superseded)
        ),
        stages=stages,
        nodes=nodes,
        agents=tuple(agents),
        errors=tuple(errors),
        last_writer=last_writer,
        last_writer_stage=last_writer_stage,
    )


@dataclass(frozen=True)
class LossStop:
    """§7.3/A107: the two independent counters and which of them is spent.

    ``attempts`` counts ``agent_launch`` rows per ``(node, agent name)``; a pair is
    exhausted once it sits at ``limits.attempt_max`` while its latest row still calls
    for a relaunch — the same causes HC-RL-A49 grants: ``agent_lost``/``cancelled`` or a
    later ``stage_result outcome=failed`` on the node's stage. ``x_rounds`` holds, per
    card, the highest opened ``X#k`` round; a card is exhausted once that round reaches
    ``limits.rework_max_rounds`` and still fails. The counters never add up and never
    reset each other: either one alone opens the strategist exit.
    """

    attempts: dict[tuple[str, str], int]
    x_rounds: dict[str, int]
    attempt_exhausted: tuple[tuple[str, str], ...]
    x_exhausted: tuple[str, ...]

    @property
    def triggered(self) -> bool:
        return bool(self.attempt_exhausted or self.x_exhausted)


def loss_stop(plan: Plan, entries: list[dict[str, object]], config: RelayConfig) -> LossStop:
    """HC-RL-A107: read-only evaluation of both loss-stop counters against the config."""
    nodes_by_name = _active_node_map(plan)
    attempts: dict[tuple[str, str], int] = {}
    for entry in entries:
        if entry["event"] != "agent_launch":
            continue
        node = nodes_by_name.get(str(entry["node"]))
        if node is None:
            continue
        key = (node.node, _agent_parts(str(entry["agent"]))[0])
        attempts[key] = attempts.get(key, 0) + 1
    attempt_exhausted: list[tuple[str, str]] = []
    for (node_name, name), count in sorted(attempts.items()):
        if count < config.limits.attempt_max:
            continue
        latest = _latest_by_name(entries, node_name, name)
        assert latest is not None
        if latest["event"] in {"agent_lost", "cancelled"} or _stage_failed_after(
            entries, nodes_by_name[node_name].stage_id, latest
        ):
            attempt_exhausted.append((node_name, name))
    instances = _stage_instances(plan)
    opened: dict[str, tuple[int, str]] = {}
    for entry in entries:
        if str(entry["event"]) != "stage_start":
            continue
        stage_id = _stage_of(entry, nodes_by_name)
        if stage_id is None or stage_id not in instances:
            continue
        first = instances[stage_id][0]
        if first.stage != "X":
            continue
        current = opened.get(first.card)
        if current is None or first.k > current[0]:
            opened[first.card] = (first.k, stage_id)
    x_exhausted: list[str] = []
    for card in sorted(opened):
        k, stage_id = opened[card]
        result = latest_stage_result(entries, stage_id, nodes_by_name)
        outcome = (
            parse_stage_result_note(str(result["note"])).outcome if result is not None else None
        )
        if k >= config.limits.rework_max_rounds and outcome == "failed":
            x_exhausted.append(card)
    return LossStop(
        attempts=attempts,
        x_rounds={card: k for card, (k, _) in opened.items()},
        attempt_exhausted=tuple(attempt_exhausted),
        x_exhausted=tuple(x_exhausted),
    )


def _result_document(result: StageResult | None) -> dict[str, object] | None:
    """`stages[].result`: the full five-key shape, including the plan-amend projection."""
    if result is None:
        return None
    return {
        "stage_id": result.stage_id,
        "outcome": result.outcome,
        "note": result.note,
        "amend": result.amend,
        "nodes": list(result.nodes),
    }


def _last_result_document(result: StageResult | None) -> dict[str, object] | None:
    """Top-level `last_stage_result`: §3.5 freezes exactly {stage_id, outcome, note}."""
    if result is None:
        return None
    return {
        "stage_id": result.stage_id,
        "outcome": result.outcome,
        "note": result.note,
    }


def status_document(status: Status) -> dict[str, object]:
    """The frozen §3.5 document: exactly thirteen top-level keys."""
    return {
        "plan": {
            "marker": status.plan.marker,
            "cards": list(status.plan.cards),
            "decision_mode": status.plan.decision_mode,
        },
        "open_stages": list(status.open_stages),
        "current_stage": status.current_stage,
        "current_node": status.current_node,
        "last_stage_result": _last_result_document(status.last_stage_result),
        "suggested_action": status.suggested_action,
        "monitor_relaunch_count": status.monitor_relaunch_count,
        "pending_nodes": list(status.pending_nodes),
        "superseded_ignored": status.superseded_ignored,
        "stages": [
            {
                "stage_id": stage.stage_id,
                "stage": stage.stage,
                "card": stage.card,
                "k": stage.k,
                "state": stage.state,
                "nodes": list(stage.nodes),
                "result": _result_document(stage.result),
            }
            for stage in status.stages
        ],
        "nodes": [
            {
                "node": node.node,
                "card": node.card,
                "stage": node.stage_id,
                "type": node.type,
                "state": node.state,
                "closable": node.closable,
                "reasons": list(node.reasons),
            }
            for node in status.nodes
        ],
        "agents": [
            {
                "node": agent.node,
                "agent": agent.agent,
                "last_event": agent.last_event,
                "last_ts": agent.last_ts,
                "idle_seconds": agent.idle_seconds,
            }
            for agent in status.agents
        ],
        "errors": list(status.errors),
    }


def _clock(ts: str) -> str:
    try:
        return datetime.fromisoformat(ts).strftime("%H:%M:%S")
    except ValueError:
        return ts


def _duration(seconds: int) -> str:
    hours, remainder = divmod(max(0, seconds), 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def render_status_text(status: Status, plan_dir: str) -> str:
    """The §10.3 text shape. Node detail is printed for open stage instances only."""
    lines = [
        f"计划：{plan_dir}   skill={status.plan.skill}   session={status.plan.session}",
        f"卡：{', '.join(status.plan.cards)}      decision_mode={status.plan.decision_mode}",
        (
            "当班写入者：—" if status.last_writer is None
            else f"当班写入者：{status.last_writer}（{status.last_writer_stage}）"
        ),
        "",
    ]
    for stage in status.stages:
        if stage.state == "pending":  # §10.3: never-entered instances print no result token
            line = f"阶段 {stage.stage_id}  {stage.state}"
        else:
            outcome = stage.result.outcome if stage.result is not None else "—"
            line = f"阶段 {stage.stage_id}  {stage.state:<8} result={outcome}"
        lines.append(line)
        if stage.state != "open":
            continue
        for node in status.nodes:
            if node.stage_id != stage.stage_id:
                continue
            lines.append(f"  节点 {node.node} {node.type}   {node.state}")
            if node.state != "open":
                continue
            lines.extend(f"    不可关：{reason}" for reason in node.reasons)
            if node.closable:
                lines.append("    可关")
            for agent in status.agents:
                if agent.node != node.node:
                    continue
                lines.append(
                    f"    在场 agent：{agent.agent}  最近 {agent.last_event} @ {_clock(agent.last_ts)}"
                    f"（静默 {_duration(agent.idle_seconds)}）"
                )
    return "\n".join(lines) + "\n"


def _status_command(plan_dir: str, as_json: bool, config: RelayConfig) -> int:
    try:
        plan = _runtime_plan(plan_dir, config)
        entries = read_ledger(Path(plan_dir) / "relay_log.jsonl")
    except RelayError as exc:
        return _fail(exc)
    status = derive_status(plan, entries)
    if as_json:
        print(json.dumps(status_document(status), ensure_ascii=False))
    else:
        sys.stdout.write(render_status_text(status, plan_dir))
    return 0


def main(argv: list[str] | None = None) -> int:
    _configure_utf8_stdio()
    parser = RelayArgumentParser(prog="relay_log.py")
    subparsers = parser.add_subparsers(dest="command", required=True)
    add_parser = subparsers.add_parser("add")
    add_parser.add_argument("--plan", required=True)
    add_parser.add_argument("--node", required=True)
    add_parser.add_argument("--event", required=True)
    add_parser.add_argument("--agent", required=True)
    add_parser.add_argument("--note", default="")
    add_parser.add_argument("--config-dir")
    status_parser = subparsers.add_parser("status")
    status_parser.add_argument("--plan", required=True)
    status_parser.add_argument("--json", action="store_true")
    status_parser.add_argument("--config-dir")
    lint_parser = subparsers.add_parser("lint")
    lint_parser.add_argument("--plan", required=True)
    lint_parser.add_argument("--json", action="store_true")
    lint_parser.add_argument("--config-dir")
    lint_parser.add_argument("--amend-check", choices=("before", "after"))
    lint_parser.add_argument("--repo")
    lint_parser.add_argument("--snapshot-dir")
    lint_parser.add_argument("--proposed-path", action="append", default=[])
    try:
        args = parser.parse_args(argv)
        if args.command == "lint":
            if args.amend_check is None and (
                args.repo or args.snapshot_dir or args.proposed_path
            ):
                parser.error("--repo/--snapshot-dir/--proposed-path require --amend-check")
            if args.amend_check is not None:
                if not args.repo or not args.snapshot_dir:
                    parser.error("--amend-check requires --repo and --snapshot-dir")
                if args.amend_check == "before" and not args.proposed_path:
                    parser.error("--amend-check before requires at least one --proposed-path")
                if args.amend_check == "after" and args.proposed_path:
                    parser.error("--amend-check after takes no --proposed-path")
    except RelayError as exc:
        return _fail(exc)
    try:
        config = load_config(resolve_config_dir(args.config_dir, Path.home()))
    except RelayError as exc:
        return _fail(exc)
    if args.command == "add":
        return _add_command(args.plan, args.node, args.event, args.agent, args.note, config)
    if args.command == "status":
        return _status_command(args.plan, args.json, config)
    if args.command == "lint":
        return _lint_command(
            args.plan,
            args.json,
            config,
            amend_check=args.amend_check,
            repo=args.repo,
            snapshot_dir=args.snapshot_dir,
            proposed_path=tuple(args.proposed_path),
        )
    raise AssertionError(f"unreachable command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
