"""Tests for install_skill.py — RLT_01: single-source to per-side replica sync (HC-RL-A124)."""

from __future__ import annotations

import hashlib
import json
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


if __name__ == "__main__":
    unittest.main()
