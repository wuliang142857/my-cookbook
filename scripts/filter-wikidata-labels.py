#!/usr/bin/env python3
"""Filter Wikidata latest-all JSON dump into Planetiler wikidata_names.json."""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import TextIO


ID_RE = re.compile(r'"id"\s*:\s*"Q([1-9][0-9]*)"')


def log(message: str) -> None:
    print(f"[{time.strftime('%Y-%m-%dT%H:%M:%S%z')}] {message}", file=sys.stderr, flush=True)


def parse_qid(value: str) -> int:
    value = value.strip()
    if value.startswith("Q"):
        value = value[1:]
    return int(value)


def load_qids(path: Path) -> set[int]:
    qids: set[int] = set()
    with path.open("r", encoding="utf-8") as fp:
        for line_no, line in enumerate(fp, 1):
            line = line.strip()
            if not line:
                continue
            try:
                qids.add(parse_qid(line))
            except ValueError as exc:
                raise ValueError(f"Invalid QID on {path}:{line_no}: {line!r}") from exc
    return qids


def load_done_qids(path: Path) -> set[int]:
    done: set[int] = set()
    if not path.exists():
        return done
    with path.open("r", encoding="utf-8") as fp:
        for line_no, line in enumerate(fp, 1):
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
                done.add(parse_qid(str(row[0])))
            except Exception as exc:  # noqa: BLE001
                raise ValueError(f"Invalid existing output on {path}:{line_no}: {exc}") from exc
    return done


def normalize_entity_line(line: str) -> str | None:
    line = line.strip()
    if not line or line in {"[", "]"}:
        return None
    if line.endswith(","):
        line = line[:-1]
    if not line or line in {"[", "]"}:
        return None
    return line


def extract_labels(entity: dict, languages: set[str] | None) -> dict[str, str]:
    labels: dict[str, str] = {}
    for lang, payload in entity.get("labels", {}).items():
        if languages is not None and lang not in languages:
            continue
        value = payload.get("value")
        if isinstance(value, str) and value:
            labels[lang] = value
    return dict(sorted(labels.items()))


def filter_dump(
    source: TextIO,
    output: Path,
    qids: set[int],
    done: set[int],
    languages: set[str] | None,
    progress_interval: int,
    max_lines: int | None,
    stop_after_matches: int | None,
) -> int:
    output.parent.mkdir(parents=True, exist_ok=True)
    timestamp_ms = int(time.time() * 1000)
    lines_seen = 0
    matched = 0
    written = 0
    started = time.time()
    pending = qids - done

    with output.open("a", encoding="utf-8") as out:
        for raw_line in source:
            lines_seen += 1
            if max_lines is not None and lines_seen > max_lines:
                break

            if progress_interval > 0 and lines_seen % progress_interval == 0:
                elapsed = max(time.time() - started, 1)
                log(
                    f"lines={lines_seen:,} matched={matched:,} written={written:,} "
                    f"remaining={len(pending):,} rate={lines_seen / elapsed:,.0f} lines/s"
                )

            line = normalize_entity_line(raw_line)
            if line is None:
                continue

            match = ID_RE.search(line)
            if not match:
                continue

            qid = int(match.group(1))
            if qid not in pending:
                continue

            matched += 1
            entity = json.loads(line)
            labels = extract_labels(entity, languages)
            if labels:
                out.write(json.dumps([str(qid), labels, timestamp_ms], ensure_ascii=False, separators=(",", ":")))
                out.write("\n")
                written += 1
            pending.remove(qid)

            if stop_after_matches is not None and matched >= stop_after_matches:
                break

            if not pending:
                break

    elapsed = max(time.time() - started, 1)
    log(
        f"done lines={lines_seen:,} matched={matched:,} written={written:,} "
        f"remaining={len(pending):,} elapsed={elapsed / 60:.1f}m"
    )
    return written


def parse_languages(value: str | None) -> set[str] | None:
    if value is None or value.strip() in {"", "*"}:
        return None
    return {item.strip() for item in value.split(",") if item.strip()}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Read Wikidata latest-all JSON from stdin and write Planetiler-compatible "
            "wikidata_names.json rows for QIDs listed in --qid-file."
        )
    )
    parser.add_argument("--qid-file", type=Path, required=True, help="Text file containing QIDs, one per line")
    parser.add_argument("--output", type=Path, required=True, help="Output wikidata_names.json path")
    parser.add_argument("--overwrite", action="store_true", help="Replace existing output instead of resuming")
    parser.add_argument(
        "--languages",
        help="Comma-separated language whitelist. Omit or use '*' to keep all labels from the dump.",
    )
    parser.add_argument("--progress-interval", type=int, default=1_000_000, help="Log progress every N input lines")
    parser.add_argument("--max-lines", type=int, help="Stop after N input lines, useful for testing")
    parser.add_argument("--stop-after-matches", type=int, help="Stop after N matching QIDs, useful for testing")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    qids = load_qids(args.qid_file)
    log(f"loaded {len(qids):,} target QIDs from {args.qid_file}")

    if args.overwrite and args.output.exists():
        args.output.unlink()

    done = load_done_qids(args.output)
    if done:
        log(f"resume mode: output already contains {len(done):,} QIDs")

    languages = parse_languages(args.languages)
    if languages is None:
        log("keeping labels for all languages")
    else:
        log(f"keeping labels for {len(languages):,} languages")

    written = filter_dump(
        source=sys.stdin,
        output=args.output,
        qids=qids,
        done=done,
        languages=languages,
        progress_interval=args.progress_interval,
        max_lines=args.max_lines,
        stop_after_matches=args.stop_after_matches,
    )
    return 0 if written >= 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
