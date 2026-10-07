#!/usr/bin/env python3
"""single-task Herdr workspace observer. Memory only; never sends keys.

Herdr-managed watcher runs this child, then checks its process/exit status.
Notifications are hints, never node completion or authorization.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from typing import Callable

POLL_SECONDS = 120


class WatchError(Exception):
    """An observation or delivery could not be proved; stop for the watcher."""


@dataclass(frozen=True)
class AgentState:
    pane_id: str
    status: str
    seq: int


def check_environment(env: dict[str, str]) -> None:
    if "RELAY_RECEIPT" in env:
        raise WatchError("relay_receipt_present")
    if env.get("HERDR_ENV") != "1":
        raise WatchError("herdr_environment_required")


class Herdr:
    def call(self, *args: str) -> dict:
        try:
            proc = subprocess.run(
                ["herdr", *args], capture_output=True, timeout=15, check=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            raise WatchError("herdr_command_failed") from None
        # Do not print stdout/stderr: they may contain terminal content/credentials.
        if proc.returncode:
            raise WatchError("herdr_command_rejected")
        try:
            payload = json.loads(proc.stdout)
        except (ValueError, UnicodeError):
            raise WatchError("herdr_invalid_json") from None
        if not isinstance(payload, dict) or "error" in payload:
            raise WatchError("herdr_error_response")
        result = payload.get("result")
        if not isinstance(result, dict):
            raise WatchError("herdr_missing_result")
        return result

    def agents(self) -> list[dict]:
        agents = self.call("agent", "list").get("agents")
        if not isinstance(agents, list) or any(not isinstance(a, dict) for a in agents):
            raise WatchError("herdr_invalid_agents")
        return agents

    def get(self, name: str) -> dict:
        agent = self.call("agent", "get", name).get("agent")
        if not isinstance(agent, dict):
            raise WatchError("herdr_missing_agent")
        return agent

    def notify(self, name: str, message: str) -> AgentState:
        before = state(self.get(name))
        # --wait validates a submission from idle/done with a new working state.
        # For an already working target also require sequence advancement below.
        result = self.call("agent", "prompt", name, message,
                           "--wait", "--until", "working", "--timeout", "5000")
        if result.get("type") != "agent_prompted":
            raise WatchError("notification_unconfirmed")
        after = state(self.get(name))
        if after.pane_id != before.pane_id or after.seq <= before.seq or after.status != "working":
            raise WatchError("notification_unconfirmed")
        return after


def agent_name(agent: dict) -> str:
    # agent is a kind (codex/claude), never a CLI identity. Unnamed
    # occupants are monitored using their opaque pane ID.
    name = agent.get("name") or agent.get("pane_id")
    if not isinstance(name, str) or not name or not name.isascii() or any(c.isspace() for c in name):
        raise WatchError("herdr_invalid_agent_name")
    return name


def state(agent: dict) -> AgentState:
    pane = agent.get("pane_id")
    status = agent.get("agent_status")
    seq = agent.get("state_change_seq")
    if (not isinstance(pane, str) or not pane or
        status not in {"idle", "working", "blocked", "done", "unknown"} or
        type(seq) is not int or seq < 0):
        raise WatchError("herdr_incomplete_state")
    return AgentState(pane, status, seq)


class SpaceWatch:
    def __init__(self, workspace: str, notify: str, own_name: str | None,
                 client: Herdr, env: dict[str, str]):
        self.workspace, self.notify, self.own_name = workspace, notify, own_name
        self.client, self.env = client, env
        self.previous: dict[str, AgentState] | None = None
        self.pending_message: str | None = None

    def snapshot(self) -> dict[str, AgentState]:
        check_environment(self.env)
        agents = self.client.agents()  # Rediscover every cycle; never a name prefix.
        members = [a for a in agents if a.get("workspace_id") == self.workspace]
        if self.own_name is None:
            pane = self.env.get("HERDR_PANE_ID")
            own = [a for a in members if pane and a.get("pane_id") == pane]
        else:
            own = [a for a in members if agent_name(a) == self.own_name]
        if len(own) != 1:
            raise WatchError("watcher_identity_not_in_workspace")
        if self.env.get("HERDR_PANE_ID") and own[0].get("pane_id") != self.env["HERDR_PANE_ID"]:
            raise WatchError("watcher_identity_mismatch")
        self.own_name = agent_name(own[0])
        if self.notify == self.own_name:
            raise WatchError("watcher_cannot_notify_self")
        target = self.client.get(self.notify)
        target_pane = target.get("pane_id")
        if not isinstance(target_pane, str) or not target_pane:
            raise WatchError("notification_target_identity_missing")
        if target_pane == own[0].get("pane_id"):
            raise WatchError("watcher_cannot_notify_self")
        snapshot = {}
        for member in members:
            name = agent_name(member)
            # The principal orchestrator is the recipient, never monitored.
            # Resolve its actual pane on each poll rather than using a prefix.
            if name == self.own_name or member.get("pane_id") == target_pane:
                continue
            if name in snapshot:
                raise WatchError("herdr_duplicate_agent")
            detail = self.client.get(member.get("pane_id"))
            # List/get may race a move or replacement. Never invent a disappearance.
            if (detail.get("workspace_id") != self.workspace or
                detail.get("pane_id") != member.get("pane_id")):
                raise WatchError("herdr_membership_changed_during_poll")
            snapshot[name] = state(detail)
        return snapshot

    def poll(self) -> list[str]:
        current = self.snapshot()
        if self.previous is None:
            self.previous = current  # First successful observation is baseline.
            return []
        changes = []
        for name in sorted(self.previous.keys() | current.keys()):
            old, new = self.previous.get(name), current.get(name)
            if old == new:
                continue
            def label(value: AgentState | None) -> str:
                return "absent" if value is None else f"{value.status}:{value.seq}:{value.pane_id}"
            changes.append(f"{name} {label(old)} -> {label(new)}")
        if changes:
            self.pending_message = f"[relay-light] space-change {self.workspace} " + "; ".join(changes)
            self.client.notify(self.notify, self.pending_message)
        # Failed delivery/observation raises before this assignment: baseline survives.
        self.previous = current
        self.pending_message = None
        return changes


def run(watch: SpaceWatch, *, sleep: Callable[[float], None] = time.sleep) -> None:
    while True:
        watch.poll()
        sleep(POLL_SECONDS)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True, help="exact Herdr workspace ID")
    parser.add_argument("--notify", required=True, help="orchestrator Herdr name")
    parser.add_argument("--self", dest="own_name", help="watcher name; default: current HERDR_PANE_ID")
    args = parser.parse_args(argv)
    watch = SpaceWatch(args.workspace, args.notify, args.own_name, Herdr(), dict(os.environ))
    try:
        check_environment(dict(os.environ))
        run(watch)
    except WatchError as exc:
        print(f"SPACE_WATCH_BLOCKED reason={exc}", file=sys.stderr, flush=True)
        if watch.pending_message:
            # Whitelisted state diff only; never raw CLI/pane content. The watcher
            # can identify the unconfirmed event even after this process exits.
            print(f"UNCONFIRMED {watch.pending_message}", file=sys.stderr, flush=True)
        return 2
    except KeyboardInterrupt:
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
