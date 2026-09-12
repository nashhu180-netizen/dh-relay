#!/usr/bin/env python3
"""relay-light skill installer — single-source to per-side replica sync.

`--all` derives two fixed targets from the current user home
(`~/.claude/skills/relay-light/` and `~/.codex/skills/relay-light/`), copies all
five skill files from the in-repo source `tools/relay-light/skill/` over them,
verifies sha256 per file, then writes one parseable current manifest per
target. Any step failing exits non-zero; there is no atomicity, rollback, or
resume — after a failure the two sides may be temporarily out of sync; fix the
cause and rerun the whole `--all` until it exits 0. Stdlib only.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SKILL_FILES = (
    "SKILL.md",
    "references/adapter-claude-code.md",
    "references/adapter-codex.md",
    "roles.toml",
    "dh-mapping.toml",
)
TARGETS = (".claude/skills/relay-light", ".codex/skills/relay-light")
MANIFEST_NAME = "manifest.json"


class InstallError(Exception):
    """A failed sync step; main reports it and exits non-zero."""


def _targets_for_home(home: Path) -> list[Path]:
    return [home / rel for rel in TARGETS]


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _copy_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dst)


def _git(source_dir: Path, *args: str) -> str | None:
    try:
        proc = subprocess.run(
            ["git", "-C", str(source_dir), *args],
            capture_output=True,
            text=True,
            timeout=15,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    return proc.stdout.strip() if proc.returncode == 0 else None


def _source_fields(source_dir: Path) -> dict:
    dirty_raw = _git(source_dir, "status", "--porcelain", "--", ".")
    return {
        "source_head": _git(source_dir, "rev-parse", "HEAD"),
        "source_dirty": None if dirty_raw is None else bool(dirty_raw),
    }


def _sync_target(source_dir: Path, target: Path) -> Path:
    for rel in SKILL_FILES:
        _copy_file(source_dir / rel, target / rel)
    files: dict[str, str] = {}
    for rel in SKILL_FILES:
        src_hash = _sha256(source_dir / rel)
        if _sha256(target / rel) != src_hash:
            raise InstallError(f"hash mismatch after copy: {target / rel}")
        files[rel] = src_hash
    manifest = {
        **_source_fields(source_dir),
        "files": files,
        "installed_to": str(target),
        "installed_at": datetime.now(timezone.utc).isoformat(),
    }
    manifest_path = target / MANIFEST_NAME
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return manifest_path


def install_all(source_dir: Path, home: Path) -> list[Path]:
    missing = [rel for rel in SKILL_FILES if not (source_dir / rel).is_file()]
    if missing:
        raise InstallError(f"skill source incomplete, missing: {', '.join(missing)}")
    return [_sync_target(source_dir, target) for target in _targets_for_home(home)]


def main(argv: list[str] | None = None, *, home: Path | None = None, source_dir: Path | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="install_skill.py",
        description="Sync the five-file relay-light skill source to both user-level replicas.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        required=True,
        help="overwrite all five files under ~/.claude/skills/relay-light/ and ~/.codex/skills/relay-light/",
    )
    parser.parse_args(argv)
    source = source_dir or (Path(__file__).resolve().parent / "skill")
    try:
        manifests = install_all(source, home or Path.home())
    except (InstallError, OSError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    for manifest_path in manifests:
        print(f"installed: {manifest_path.parent}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
