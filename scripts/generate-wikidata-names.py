#!/usr/bin/env python3
"""Generate Planetiler-compatible wikidata_names.json from an OSM PBF file."""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Iterable

import osmium
import requests


QID_RE = re.compile(r"^Q([1-9][0-9]*)$")
ENTITY_RE = re.compile(r"http://www\.wikidata\.org/entity/Q([0-9]+)$")
DEFAULT_ENDPOINT = "https://query.wikidata.org/bigdata/namespace/wdq/sparql"


class WikidataCollector(osmium.SimpleHandler):
    def __init__(self) -> None:
        super().__init__()
        self.qids: set[int] = set()
        self.elements = 0

    def _collect(self, obj: object) -> None:
        self.elements += 1
        tags = getattr(obj, "tags", None)
        if not tags:
            return
        value = tags.get("wikidata")
        if not value:
            return
        match = QID_RE.match(value)
        if match:
            self.qids.add(int(match.group(1)))

    def node(self, obj: object) -> None:
        self._collect(obj)

    def way(self, obj: object) -> None:
        self._collect(obj)

    def relation(self, obj: object) -> None:
        self._collect(obj)


def log(message: str) -> None:
    print(f"[{time.strftime('%Y-%m-%dT%H:%M:%S%z')}] {message}", file=sys.stderr, flush=True)


def endpoint_url(endpoint: str, proxy_prefix: str | None) -> str:
    if not proxy_prefix:
        return endpoint
    return proxy_prefix.rstrip("/") + "/" + endpoint


def extract_qids(pbf: Path, qid_file: Path) -> list[int]:
    log(f"Scanning PBF for wikidata tags: {pbf}")
    collector = WikidataCollector()
    collector.apply_file(str(pbf), locations=False)
    qids = sorted(collector.qids)
    qid_file.parent.mkdir(parents=True, exist_ok=True)
    qid_file.write_text("".join(f"{qid}\n" for qid in qids), encoding="utf-8")
    log(f"Scanned {collector.elements:,} elements; found {len(qids):,} unique QIDs")
    log(f"Wrote QID list: {qid_file}")
    return qids


def load_qids(qid_file: Path) -> list[int]:
    log(f"Loading QID list: {qid_file}")
    qids = []
    with qid_file.open("r", encoding="utf-8") as fp:
        for line in fp:
            line = line.strip()
            if line:
                qids.append(int(line))
    log(f"Loaded {len(qids):,} QIDs")
    return qids


def load_done_qids(output: Path) -> set[int]:
    done: set[int] = set()
    if not output.exists():
        return done
    log(f"Loading existing output for resume: {output}")
    with output.open("r", encoding="utf-8") as fp:
        for line_no, line in enumerate(fp, 1):
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
                done.add(int(row[0]))
            except Exception as exc:  # noqa: BLE001
                raise RuntimeError(f"Invalid JSON line {line_no} in {output}: {exc}") from exc
    log(f"Output already contains {len(done):,} QIDs")
    return done


def chunks(items: Iterable[int], size: int) -> Iterable[list[int]]:
    batch: list[int] = []
    for item in items:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def query_wikidata(
    session: requests.Session,
    url: str,
    qids: list[int],
    timeout: int,
    retries: int,
    retry_wait: float,
    user_agent: str,
) -> dict[int, dict[str, str]]:
    qid_list = " ".join(f"wd:Q{qid}" for qid in qids)
    query = (
        "SELECT ?id ?label where { "
        f"VALUES ?id {{ {qid_list} }} "
        "?id (owl:sameAs* / rdfs:label) ?label "
        "}"
    )
    headers = {
        "Accept": "application/sparql-results+json",
        "Content-Type": "application/sparql-query",
        "User-Agent": user_agent,
    }
    last_error: Exception | None = None
    for attempt in range(1, retries + 2):
        try:
            response = session.post(url, data=query.encode("utf-8"), headers=headers, timeout=timeout)
            if response.status_code >= 400:
                raise RuntimeError(f"HTTP {response.status_code}: {response.text[:500]}")
            payload = response.json()
            result: dict[int, dict[str, str]] = {}
            for row in payload.get("results", {}).get("bindings", []):
                entity = row.get("id", {}).get("value", "")
                label = row.get("label", {})
                match = ENTITY_RE.match(entity)
                lang = label.get("xml:lang")
                value = label.get("value")
                if match and lang and value:
                    result.setdefault(int(match.group(1)), {})[lang] = value
            return result
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt > retries:
                break
            log(f"Batch failed on attempt {attempt}/{retries + 1}: {exc}; retrying in {retry_wait}s")
            time.sleep(retry_wait)
    raise RuntimeError(f"Wikidata query failed after retries: {last_error}") from last_error


def write_rows(output: Path, rows: dict[int, dict[str, str]], timestamp_ms: int) -> int:
    count = 0
    with output.open("a", encoding="utf-8") as fp:
        for qid in sorted(rows):
            labels = dict(sorted(rows[qid].items()))
            fp.write(json.dumps([str(qid), labels, timestamp_ms], ensure_ascii=False, separators=(",", ":")))
            fp.write("\n")
            count += 1
    return count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Planetiler-compatible data/sources/wikidata_names.json from an OSM PBF."
    )
    parser.add_argument("--pbf", type=Path, required=True, help="Path to planet.osm.pbf or an extract .osm.pbf")
    parser.add_argument("--output", type=Path, required=True, help="Output wikidata_names.json path")
    parser.add_argument("--qid-file", type=Path, help="Cached list of QIDs extracted from the PBF")
    parser.add_argument("--rescan", action="store_true", help="Rescan the PBF even if --qid-file already exists")
    parser.add_argument("--overwrite", action="store_true", help="Delete existing output before querying")
    parser.add_argument("--batch-size", type=int, default=5000, help="QIDs per SPARQL request")
    parser.add_argument("--timeout", type=int, default=120, help="HTTP timeout in seconds")
    parser.add_argument("--retries", type=int, default=5, help="Retry count per batch")
    parser.add_argument("--retry-wait", type=float, default=10, help="Seconds between retries")
    parser.add_argument("--sleep", type=float, default=0.2, help="Seconds to sleep between successful batches")
    parser.add_argument("--max-qids", type=int, help="Limit QIDs for testing")
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT, help="Wikidata SPARQL endpoint")
    parser.add_argument("--proxy-prefix", help="Optional URL prefix proxy, for example https://proxy.example/")
    parser.add_argument(
        "--user-agent",
        default="Planetiler wikidata cache generator (https://github.com/onthegomap/planetiler)",
        help="HTTP User-Agent sent to Wikidata",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    qid_file = args.qid_file or args.output.with_suffix(".qids.txt")
    args.output.parent.mkdir(parents=True, exist_ok=True)

    if args.overwrite and args.output.exists():
        args.output.unlink()

    if qid_file.exists() and not args.rescan:
        qids = load_qids(qid_file)
    else:
        qids = extract_qids(args.pbf, qid_file)

    if args.max_qids:
        qids = qids[: args.max_qids]
        log(f"Limited to first {len(qids):,} QIDs for this run")

    done = load_done_qids(args.output)
    remaining = [qid for qid in qids if qid not in done]
    url = endpoint_url(args.endpoint, args.proxy_prefix)

    log(f"Endpoint: {url}")
    log(f"Remaining QIDs: {len(remaining):,}")
    if not remaining:
        log("Nothing to do")
        return 0

    session = requests.Session()
    written = 0
    started = time.time()
    total_batches = (len(remaining) + args.batch_size - 1) // args.batch_size
    timestamp_ms = int(time.time() * 1000)

    for index, batch in enumerate(chunks(remaining, args.batch_size), 1):
        log(f"Querying batch {index:,}/{total_batches:,}: {len(batch):,} QIDs")
        rows = query_wikidata(
            session=session,
            url=url,
            qids=batch,
            timeout=args.timeout,
            retries=args.retries,
            retry_wait=args.retry_wait,
            user_agent=args.user_agent,
        )
        batch_written = write_rows(args.output, rows, timestamp_ms)
        written += batch_written
        elapsed = max(time.time() - started, 1)
        log(
            f"Batch {index:,}/{total_batches:,} wrote {batch_written:,} rows; "
            f"total written {written:,}; elapsed {elapsed / 60:.1f}m"
        )
        if args.sleep > 0:
            time.sleep(args.sleep)

    log(f"Done: wrote {written:,} rows to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
