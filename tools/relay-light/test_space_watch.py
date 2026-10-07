"""RLT_31: dynamic workspace discovery and deterministic notification behavior."""
import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import space_watch as sw


def agent(name, status="working", seq=1, workspace="w68", pane=None):
    return dict(name=name, agent="codex", agent_status=status, state_change_seq=seq,
                workspace_id=workspace, pane_id=pane or f"pane-{name}")


class FakeHerdr:
    def __init__(self):
        self.rows = [agent("watcher2"), agent("toy-builder"), agent("orch", workspace="w-main")]
        self.sent = []
        self.fail = False
        self.list_calls = 0
        self.get_calls = []

    def agents(self):
        self.list_calls += 1
        return copy.deepcopy(self.rows)

    def get(self, name):
        self.get_calls.append(name)
        return copy.deepcopy(next(a for a in self.rows if a.get("name") == name or a.get("pane_id") == name))

    def notify(self, name, message):
        if self.fail:
            raise sw.WatchError("notification_unconfirmed")
        self.sent.append((name, message))
        target = next(a for a in self.rows if a.get("name") == name)
        target.update(agent_status="working", state_change_seq=target["state_change_seq"] + 1)
        return sw.state(target)


class SpaceWatchTests(unittest.TestCase):
    def setUp(self):
        self.client = FakeHerdr()
        self.env = {"HERDR_ENV": "1", "HERDR_PANE_ID": "pane-watcher2"}
        self.watch = sw.SpaceWatch("w68", "orch", None, self.client, self.env)

    def test_baseline_and_unchanged_are_silent(self):
        self.assertEqual([], self.watch.poll())
        self.assertEqual([], self.watch.poll())
        self.assertEqual([], self.client.sent)
        self.assertEqual(2, self.client.list_calls)
        self.assertNotIn("orch", self.watch.previous)
        self.assertNotIn("watcher2", self.watch.previous)
        self.assertEqual(["pane-toy-builder", "pane-toy-builder"], self.client.get_calls)

    def test_dynamic_new_final_including_names_without_prefix(self):
        self.watch.poll()
        self.client.rows.extend([agent("toy-final"), agent("reviewer-no-toy-prefix")])
        changes = self.watch.poll()
        self.assertEqual(2, len(changes))
        self.assertIn("toy-final", self.client.sent[-1][1])
        self.assertIn("reviewer-no-toy-prefix", self.client.sent[-1][1])

    def test_report_1257_working_to_done_once(self):
        self.client.rows.append(agent("toy-final"))
        self.watch.poll()
        self.client.rows[-1].update(agent_status="done", state_change_seq=2)
        self.assertEqual(1, len(self.watch.poll()))
        for _ in range(3):
            self.assertEqual([], self.watch.poll())
        self.assertEqual(1, len(self.client.sent))
        self.assertIn("working:1:pane-toy-final -> done:2:pane-toy-final", self.client.sent[0][1])

    def test_sequence_change_without_status_change(self):
        self.watch.poll()
        self.client.rows[1]["state_change_seq"] += 1
        self.assertEqual(1, len(self.watch.poll()))

    def test_status_change_without_sequence_change(self):
        self.watch.poll()
        self.client.rows[1]["agent_status"] = "done"
        self.assertEqual(1, len(self.watch.poll()))

    def test_only_self_excluded_even_notify_inside_workspace(self):
        self.client.rows[2]["workspace_id"] = "w68"
        self.watch.poll()
        self.client.rows[0]["state_change_seq"] += 1
        self.client.rows[2]["state_change_seq"] += 1
        self.assertEqual(1, len(self.watch.poll()))
        self.assertIn("orch", self.client.sent[0][1])
        self.assertNotIn("watcher2", self.client.sent[0][1])

    def test_notification_echo_is_silent_and_target_still_monitored(self):
        self.client.rows[2]["workspace_id"] = "w68"
        self.watch.poll()
        self.client.rows[1]["agent_status"] = "done"
        self.assertEqual(1, len(self.watch.poll()))
        self.assertEqual([], self.watch.poll())
        self.client.rows[2]["agent_status"] = "done"
        self.assertEqual(1, len(self.watch.poll()))
        self.assertEqual([], self.watch.poll())
        self.assertEqual(2, len(self.client.sent))

    def test_other_worker_changed_during_notify_is_reported_next_poll(self):
        self.client.rows[2]["workspace_id"] = "w68"
        self.watch.poll()
        self.client.rows[1]["agent_status"] = "done"
        notify = self.client.notify
        def concurrent(name, message):
            self.client.rows[1]["state_change_seq"] += 1
            return notify(name, message)
        with patch.object(self.client, "notify", side_effect=concurrent):
            self.watch.poll()
        self.assertEqual(1, len(self.watch.poll()))

    def test_notify_target_replaced_since_snapshot_preserves_baseline(self):
        self.client.rows[2]["workspace_id"] = "w68"
        self.watch.poll()
        baseline = self.watch.previous.copy()
        self.client.rows[1]["agent_status"] = "done"
        with patch.object(self.client, "notify", return_value=sw.AgentState("replacement", "working", 10)):
            with self.assertRaisesRegex(sw.WatchError, "notification_target_replaced"):
                self.watch.poll()
        self.assertEqual(baseline, self.watch.previous)
        self.assertIsNotNone(self.watch.pending_message)

    def test_unnamed_agents_use_pane_not_kind_labels(self):
        self.client.rows.extend([agent("anonymous-a"), agent("anonymous-b")])
        for row in self.client.rows[-2:]:
            row.pop("name")
        self.watch.poll()
        self.client.rows[-1]["agent_status"] = "done"
        self.assertEqual(1, len(self.watch.poll()))
        self.assertIn("pane-anonymous-b", self.client.sent[0][1])
        self.assertNotIn("codex", self.client.get_calls)

    def test_departure_and_reentry(self):
        self.watch.poll()
        self.client.rows[1]["workspace_id"] = "other"
        self.assertIn("-> absent", self.watch.poll()[0])
        self.client.rows[1]["workspace_id"] = "w68"
        self.assertIn("absent ->", self.watch.poll()[0])

    def test_replacement_with_same_status_and_sequence(self):
        self.watch.poll()
        self.client.rows[1]["pane_id"] = "replacement"
        self.assertEqual(1, len(self.watch.poll()))

    def test_failed_notification_does_not_consume_delta(self):
        self.watch.poll()
        baseline = copy.deepcopy(self.watch.previous)
        self.client.rows[1]["agent_status"] = "done"
        self.client.fail = True
        with self.assertRaises(sw.WatchError):
            self.watch.poll()
        self.assertEqual(baseline, self.watch.previous)
        self.client.fail = False
        self.assertEqual(1, len(self.watch.poll()))

    def test_missing_seq_and_failed_get_fail_closed(self):
        self.watch.poll()
        baseline = copy.deepcopy(self.watch.previous)
        del self.client.rows[1]["state_change_seq"]
        with self.assertRaises(sw.WatchError):
            self.watch.poll()
        self.assertEqual(baseline, self.watch.previous)
        self.assertEqual([], self.client.sent)

    def test_workspace_identity_and_self_target_are_checked(self):
        for own, notify, env in [("not-here", "orch", self.env),
                                  ("toy-builder", "orch", self.env),
                                  ("watcher2", "watcher2", self.env),
                                  (None, "orch", {"HERDR_ENV": "1"})]:
            with self.subTest(own=own, notify=notify, env=env):
                with self.assertRaises(sw.WatchError):
                    sw.SpaceWatch("w68", notify, own, self.client, env).poll()

    def test_list_get_race_is_not_false_disappearance(self):
        self.watch.poll()
        with patch.object(self.client, "get", return_value=agent("toy-builder", workspace="elsewhere")):
            with self.assertRaises(sw.WatchError):
                self.watch.poll()
        self.assertEqual([], self.client.sent)

    def test_polls_at_120_seconds_with_no_files(self):
        def stop(seconds):
            self.assertEqual(120, seconds)
            raise KeyboardInterrupt
        with patch("builtins.open", side_effect=AssertionError("unexpected file write")):
            with self.assertRaises(KeyboardInterrupt):
                sw.run(self.watch, sleep=stop)

    def test_environment_and_receipt_before_any_command(self):
        for env in [{}, {"HERDR_ENV": "0"}, {"HERDR_ENV": "1", "RELAY_RECEIPT": ""}]:
            with self.subTest(env=env):
                with patch.dict(os.environ, env, clear=True), patch("subprocess.run") as run:
                    self.assertEqual(2, sw.main(["--workspace", "w68", "--notify", "orch"]))
                    run.assert_not_called()


class HerdrDeliveryTests(unittest.TestCase):
    def reply(self, result=None, *, code=0, raw=None):
        return subprocess.CompletedProcess([], code,
            raw if raw is not None else json.dumps({"result": result}).encode(), b"secret stderr")

    def test_delivery_wait_and_sequence_advancement(self):
        replies = [self.reply({"agent": agent("orch", seq=10)}),
                   self.reply({"type": "agent_prompted"}),
                   self.reply({"agent": agent("orch", seq=11)})]
        with patch("subprocess.run", side_effect=replies) as run:
            sw.Herdr().notify("orch", "event")
        self.assertEqual(["herdr", "agent", "prompt", "orch", "event", "--wait",
                          "--until", "working", "--timeout", "5000"], run.call_args_list[1].args[0])
        self.assertTrue(all("send-keys" not in c.args[0] for c in run.call_args_list))

    def test_accepted_stalled_not_delivery(self):
        replies = [self.reply({"agent": agent("orch")}),
                   self.reply({"type": "agent_prompted"}),
                   self.reply({"agent": agent("orch")})]
        with patch("subprocess.run", side_effect=replies):
            with self.assertRaisesRegex(sw.WatchError, "notification_unconfirmed"):
                sw.Herdr().notify("orch", "event")

    def test_seq_advance_without_working_is_unconfirmed(self):
        for status in ("idle", "done", "blocked", "unknown"):
            replies = [self.reply({"agent": agent("orch", seq=10)}),
                       self.reply({"type": "agent_prompted"}),
                       self.reply({"agent": agent("orch", seq=11, status=status)})]
            with self.subTest(status=status), patch("subprocess.run", side_effect=replies):
                with self.assertRaisesRegex(sw.WatchError, "notification_unconfirmed"):
                    sw.Herdr().notify("orch", "event")

    def test_rejected_timeout_or_invalid_reply_does_not_send_enter(self):
        for bad in [self.reply(code=1), self.reply(raw=b"not json"),
                    self.reply({"type": "wrong"}), subprocess.TimeoutExpired("herdr", 15)]:
            replies = [self.reply({"agent": agent("orch")}), bad]
            with self.subTest(bad=bad), patch("subprocess.run", side_effect=replies) as run:
                with self.assertRaises(sw.WatchError):
                    sw.Herdr().notify("orch", "event")
                self.assertEqual(2, run.call_count)

    def test_error_payload_and_duplicate_or_malformed_inventory(self):
        for raw in [b'{"error": {"message":"private"}}', b'[]', b'{"result": {"agents": [1]}}']:
            with patch("subprocess.run", return_value=self.reply(raw=raw)):
                with self.assertRaises(sw.WatchError):
                    sw.Herdr().agents()


class ProtocolTests(unittest.TestCase):
    def test_three_docs_and_watcher_dispatch_use_fixed_workspace_scope(self):
        root = Path(__file__).parent / "skill"
        for rel in ["SKILL.md", "references/adapter-codex.md", "references/adapter-claude-code.md"]:
            text = (root / rel).read_text()
            section = text.split("### watcher 节拍与安全 Enter", 1)[1].split("### 恢复依据", 1)[0]
            for token in ["space_watch.py", "workspace_id", "只排除 watcher 自己", "--workspace", "--notify", "120", "存活", "不再"]:
                self.assertIn(token, section, rel)
            self.assertNotIn("按名字前缀", section)
            if rel != "SKILL.md":
                self.assertIn("phase=watcher", section)
                self.assertIn("--self", section)


if __name__ == "__main__":
    unittest.main()
