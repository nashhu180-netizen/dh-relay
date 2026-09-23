"""Tests for install_skill.py — RLT_01: single-source to per-side replica sync (HC-RL-A124).

RLT_29 batch-3 adds pure-text structural assertions over SKILL.md and both
adapters for the `single-task` contract (model-allocation gate, RELAY_RECEIPT
fail-closed split, monitor read-only, topology, signal schema, recovery). The
doc root can be redirected with RELAY_LIGHT_SKILL_DIR so the same assertions
can be replayed against a pre-single-task snapshot to demonstrate they bite
(RED) before passing on the implemented docs (GREEN).
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent))
import install_skill

SKILL_DIR = (Path(__file__).parent / "skill").resolve()
FIVE_FILES = install_skill.SKILL_FILES


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class InstallSkillTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.home = Path(self.tempdir.name) / "home"
        self.home.mkdir()

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def targets(self) -> list[Path]:
        return [
            self.home / ".claude" / "skills" / "relay-light",
            self.home / ".codex" / "skills" / "relay-light",
        ]

    def assert_sides_match_source(self) -> None:
        for target in self.targets():
            for rel in FIVE_FILES:
                self.assertEqual(
                    sha256(target / rel),
                    sha256(SKILL_DIR / rel),
                    f"{target}:{rel}",
                )

    def test_cli_requires_all_flag(self) -> None:
        for argv in ([], ["--bogus"], ["sync"], ["--all", "extra"]):
            with self.assertRaises(SystemExit) as ctx:
                install_skill.main(argv, home=self.home)
            self.assertEqual(2, ctx.exception.code, argv)

    def test_five_file_set_is_closed_and_present(self) -> None:
        self.assertEqual(
            (
                "SKILL.md",
                "references/adapter-claude-code.md",
                "references/adapter-codex.md",
                "roles.toml",
                "dh-mapping.toml",
            ),
            FIVE_FILES,
        )
        for rel in FIVE_FILES:
            self.assertTrue((SKILL_DIR / rel).is_file(), rel)

    def test_all_installs_five_files_to_both_sides(self) -> None:
        self.assertEqual(0, install_skill.main(["--all"], home=self.home))
        self.assert_sides_match_source()

    def test_manifest_fields_after_success(self) -> None:
        self.assertEqual(0, install_skill.main(["--all"], home=self.home))
        for target in self.targets():
            manifest = json.loads((target / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(
                {"source_head", "source_dirty", "files", "installed_to", "installed_at"},
                set(manifest),
            )
            self.assertEqual(str(target), manifest["installed_to"])
            self.assertEqual(set(FIVE_FILES), set(manifest["files"]))
            for rel, digest in manifest["files"].items():
                self.assertEqual(sha256(SKILL_DIR / rel), digest, rel)
            self.assertIsNotNone(datetime.fromisoformat(manifest["installed_at"]))
            self.assertTrue(manifest["source_head"] is None or isinstance(manifest["source_head"], str))
            self.assertTrue(manifest["source_dirty"] is None or isinstance(manifest["source_dirty"], bool))

    def test_overwrites_stale_replica(self) -> None:
        self.assertEqual(0, install_skill.main(["--all"], home=self.home))
        stale = self.targets()[0] / "roles.toml"
        stale.write_text("corrupted by hand\n", encoding="utf-8")
        self.assertEqual(0, install_skill.main(["--all"], home=self.home))
        self.assert_sides_match_source()

    def test_mid_copy_failure_is_nonzero_and_rerun_converges(self) -> None:
        """HC-RL-A124: tamper one side, inject a mid-copy failure, rerun to converge."""
        self.assertEqual(0, install_skill.main(["--all"], home=self.home))
        tampered = self.targets()[1] / "SKILL.md"
        tampered.write_text("tampered replica\n", encoding="utf-8")

        source_hashes = {rel: sha256(SKILL_DIR / rel) for rel in FIVE_FILES}
        calls = {"n": 0}
        real_copy = install_skill._copy_file

        def flaky_copy(src: Path, dst: Path) -> None:
            calls["n"] += 1
            if calls["n"] == 8:  # second target, third file — mid-copy failure
                raise OSError("injected mid-copy failure")
            real_copy(src, dst)

        with mock.patch.object(install_skill, "_copy_file", side_effect=flaky_copy):
            self.assertNotEqual(0, install_skill.main(["--all"], home=self.home))

        self.assertEqual(source_hashes, {rel: sha256(SKILL_DIR / rel) for rel in FIVE_FILES})
        self.assertEqual(0, install_skill.main(["--all"], home=self.home))
        self.assert_sides_match_source()
        for target in self.targets():
            json.loads((target / "manifest.json").read_text(encoding="utf-8"))

    def test_source_missing_file_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as src_dir:
            src = Path(src_dir)
            for rel in FIVE_FILES[:-1]:
                dst = src / rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                dst.write_text("x\n", encoding="utf-8")
            self.assertNotEqual(0, install_skill.main(["--all"], home=self.home, source_dir=src))
        for target in self.targets():
            self.assertFalse(target.exists(), target)

    def test_roles_toml_replica_bytes_identical_to_source(self) -> None:
        self.assertEqual(0, install_skill.main(["--all"], home=self.home))
        src = (SKILL_DIR / "roles.toml").read_bytes()
        for target in self.targets():
            self.assertEqual(src, (target / "roles.toml").read_bytes(), str(target))


DOC_DIR = Path(os.environ.get("RELAY_LIGHT_SKILL_DIR", SKILL_DIR)).resolve()
SKILL_DOC = "SKILL.md"
ADAPTER_DOCS = (
    "references/adapter-claude-code.md",
    "references/adapter-codex.md",
)
ALL_SINGLE_TASK_DOCS = (SKILL_DOC,) + ADAPTER_DOCS
NINE_PHASE_SET = (
    "`plan` / `plan-review` / `batch` / `batch-review` / `workflow-final` / "
    "`e2-code-review` / `decision` / `monitor` / `human-acceptance`"
)


def skill_doc(rel: str) -> str:
    return (DOC_DIR / rel).read_text(encoding="utf-8")


class SingleTaskStructureTests(unittest.TestCase):
    """Pure-text contract assertions over SKILL.md + both adapters."""

    def section(self, text: str, heading_substr: str) -> str:
        lines = text.splitlines()
        for i, line in enumerate(lines):
            if line.lstrip().startswith("#") and heading_substr in line:
                end = len(lines)
                for j in range(i + 1, len(lines)):
                    if lines[j].lstrip().startswith("#"):
                        end = j
                        break
                return "\n".join(lines[i:end])
        self.fail(f"section containing {heading_substr!r} not found")

    def line_with(self, text: str, needle: str) -> str:
        for line in text.splitlines():
            if needle in line:
                return line
        self.fail(f"line containing {needle!r} not found")

    def test_single_task_mode_declared_parallel_and_exclusive(self) -> None:
        skill = skill_doc(SKILL_DOC)
        self.assertIn("## `single-task` 单卡接力模式", skill)
        self.assertIn("并列、互斥", skill)
        self.assertIn("不创建或读写 `relay_plan.md` / `relay_log.jsonl`", skill)
        self.assertIn("不使用 W/C/R/X/F", skill)
        for rel in ADAPTER_DOCS:
            text = skill_doc(rel)
            self.assertIn("## single-task 单卡接力模式（本侧适配）", text, rel)
            self.assertIn("不创建或读写 `relay_plan.md` / `relay_log.jsonl`", text, rel)
            self.assertIn("不使用 W/C/R/X/F", text, rel)

    def test_phase_closed_set_is_nine_phases_not_legacy_five(self) -> None:
        for rel in ALL_SINGLE_TASK_DOCS:
            text = skill_doc(rel)
            self.assertIn(NINE_PHASE_SET, text, rel)
            self.assertIn("`batch=1|2|3|na`", text, rel)
            self.assertIn("[relay-light:single-task] worker · phase=", text, rel)
            # design §7.5.5 legacy five-value example is not the phase oracle
            self.assertNotIn("plan|batch|final|decision|monitor", text, rel)

    def test_model_allocation_gate_hard_contract(self) -> None:
        for rel in ALL_SINGLE_TASK_DOCS:
            gate = self.section(skill_doc(rel), "model-allocation gate")
            # full role/instance model proposal table + explicit ask
            self.assertIn("全部拟启动角色/实例的模型与推理档提案表", gate, rel)
            self.assertIn("明确询问确认", gate, rel)
            # zero start before confirmation
            self.assertIn("未获明确确认不得启动任何 agent", gate, rel)
            # defaults are proposals only, per-role modification allowed
            self.assertIn("推荐默认仅是提案", gate, rel)
            self.assertIn("不写死模型", gate, rel)
            self.assertIn("逐角色修改", gate, rel)
            # confirmed snapshot mechanically recorded
            self.assertIn("execution_strategy.md", gate, rel)
            # unchanged confirmed snapshot reusable; any change re-asks
            self.assertIn("沿用已有明确确认且分配未变的快照", gate, rel)
            self.assertIn("新增/更换角色或实例、换模型或推理档必须再次询问确认", gate, rel)
            # max permission never substitutes for confirmation
            self.assertIn("最大工具权限均不推定确认", gate, rel)
            self.assertIn("不扩张 commit/push/PR/merge/deploy/verify/人验授权", gate, rel)

    def test_model_allocation_negative_examples(self) -> None:
        # both adapters enumerate the explicit 反例 list verbatim
        for rel in ADAPTER_DOCS:
            gate = self.section(skill_doc(rel), "model-allocation gate")
            self.assertIn(
                "缺询问、先启动后补确认、按未确认的默认选择直接拉起、角色/实例/模型/推理档变更免确认，均属违规",
                gate,
                rel,
            )
        # SKILL.md carries the equivalent hard prohibitions inside the gate
        gate = self.section(skill_doc(SKILL_DOC), "model-allocation gate")
        self.assertIn("未获明确确认不得启动任何 agent", gate)
        self.assertIn("必须再次询问确认", gate)
        self.assertIn("不推定确认", gate)
        self.assertNotIn("可先启动", gate)

    def test_model_allocation_gate_precedes_launch_section(self) -> None:
        skill = skill_doc(SKILL_DOC)
        self.assertIn("（启动任何 agent 之前的硬闸）", skill)
        self.assertLess(
            skill.index("model-allocation gate"),
            skill.index("### 生命周期与计数"),
        )
        for rel in ADAPTER_DOCS:
            text = skill_doc(rel)
            self.assertIn("拉起任何 agent 之前", text, rel)
            self.assertLess(
                text.index("model-allocation gate"),
                text.index("### 拓扑与拉起"),
                rel,
            )

    def test_relay_receipt_fail_closed_split_monitor_vs_producers(self) -> None:
        for rel in ALL_SINGLE_TASK_DOCS:
            line = self.line_with(skill_doc(rel), "RELAY_RECEIPT` fail closed 分流")
            # producers keep their exact per-role BLOCKED duty
            self.assertIn("builder/coder/reviewer/decider", line, rel)
            self.assertIn("本角色精确 `BLOCKED.*.md` 单行 signal", line, rel)
            # monitor exception: prompt-only, zero writes, no BLOCKED
            self.assertRegex(line, r"monitor[^；;]*零写入")
            self.assertIn("Herdr prompt", line)
            self.assertRegex(line, r"不写 `?BLOCKED`?")
            # neither branch may clear RELAY_* env
            self.assertRegex(line, r"不得清除任何 `?RELAY_\*`?")

    def test_monitor_repo_workspace_zero_write(self) -> None:
        for rel in ALL_SINGLE_TASK_DOCS:
            line = self.line_with(skill_doc(rel), "完全只读")
            self.assertIn("不写 signal", line, rel)
            for tok in ("progress", "execution_strategy", "轮询日志", "通知日志"):
                self.assertIn(tok, line, rel)
            self.assertIn("不路由", line, rel)
            self.assertIn("不分派", line, rel)
            self.assertIn("不启动 agent", line, rel)

    def test_one_workspace_one_named_tab_or_pane_per_instance(self) -> None:
        claude = skill_doc("references/adapter-claude-code.md")
        self.assertIn("一张任务卡 = 一个 Herdr workspace", claude)
        self.assertIn("每个角色实例一个独立具名 tab", claude)
        self.assertIn("herdr tab create", claude)
        codex = skill_doc("references/adapter-codex.md")
        self.assertIn("一张任务卡 = 一个 Herdr workspace", codex)
        self.assertIn("每个角色实例一个独立具名 pane", codex)
        self.assertIn("herdr pane split", codex)

    def test_durable_signal_schema_and_stop(self) -> None:
        schema = (
            "`DONE|BLOCKED task=<t> phase=<p> agent=<r>#<i> batch=<1|2|3|na> "
            "path=<path|na> review_round=<n> remediation_count=<0|1|2> "
            "verdict=<v> evidence=<repo 相对路径[,...]>`"
        )
        for rel in ADAPTER_DOCS:
            text = skill_doc(rel)
            self.assertIn(schema, text, rel)
            self.assertIn("reason=<snake_case>", text, rel)
            self.assertIn("写完 signal 即停", text, rel)
        skill = skill_doc(SKILL_DOC)
        self.assertIn(
            "`task phase agent batch path review_round remediation_count verdict evidence`",
            skill,
        )
        self.assertIn("reason=<snake_case>", skill)
        self.assertIn("写完即停", skill)

    def test_recovery_authorities_are_durable_only(self) -> None:
        for rel in ALL_SINGLE_TASK_DOCS:
            text = skill_doc(rel)
            self.assertIn("恢复权威只有四类", text, rel)
            self.assertIn("durable signals", text, rel)
            self.assertIn("execution_strategy.md", text, rel)
            self.assertIn("Herdr 实态", text, rel)
            self.assertIn("不依赖终端存活状态", text, rel)

    def test_roles_toml_stays_full_relay_default_template(self) -> None:
        roles = skill_doc("roles.toml")
        self.assertNotIn("single-task", roles)
        for rel in ADAPTER_DOCS:
            self.assertIn(
                "`roles.toml` 仍只是完整模式缺省模板，不为本模式写死模型",
                skill_doc(rel),
                rel,
            )


if __name__ == "__main__":
    unittest.main()
