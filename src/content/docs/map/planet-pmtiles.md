---
title: "使用 planet.pmtiles 搭建高性能地图服务"
description: "使用 Planetiler 将 OpenStreetMap 的 PBF 数据生成 planet.pmtiles，再通过 Nginx 或 Cloudflare Worker 暴露 Range 访问，并用 MapLibre GL 直接加载。"
---

# 使用 planet.pmtiles 搭建高性能地图服务

## 一、背景

之前搭建离线地图服务时，我主要使用的是 `GeoServer + OpenStreetMap + PostGIS` 这套方案。它的优点是标准、灵活，但链路也比较重：PBF 需要先导入数据库，GeoServer 再从 PostGIS 查询、渲染并输出 WMS 瓦片。

这套方案在全球 OSM 数据量比较大的时候会明显吃力。实际使用中，地图缩放、拖动都容易卡，后端也需要维护 PostgreSQL/PostGIS、GeoServer、样式和字体等一整套东西。

现在更推荐的方案是：

```text
planet.osm.pbf -> Planetiler -> planet.pmtiles -> Nginx/Worker 静态 Range 访问 -> MapLibre GL
```

关键差异在于：`planet.pmtiles` 是已经预生成好的矢量瓦片归档文件，浏览器通过 HTTP Range 请求按需读取其中的小片段。服务端不再实时查数据库、不再动态渲染瓦片，只需要把一个静态文件正确地提供出去即可。因此这个方案比之前的 GeoServer 方案快很多，拖动和缩放基本不会卡。

本文后半段补充了一个实际可访问的 demo：

```text
https://pmtiles-demo.wuliang142857.me/
```

这个 demo 使用 MapLibre GL 直接读取同一个全球 `planet.pmtiles`，Worker 只负责同源 Range 转发，底图样式和之前的 `fux3-map-server` demo 保持一致。

## 二、从 PBF 生成 planet.pmtiles 的工具

这里容易记混：从 `.osm.pbf` 生成 `.pmtiles` 的核心工具不是 `pmtiles` 命令行，而是 Java 程序 [Planetiler](https://github.com/onthegomap/planetiler)。

`pmtiles` 命令行更多用于检查、转换、抽取或服务 PMTiles 文件；真正把 OpenStreetMap 原始 PBF 切成矢量瓦片的，是 `planetiler.jar`。

Planetiler 的基本能力是：

- 输入：`planet.osm.pbf` 或 Geofabrik 的区域 `.osm.pbf`
- 输出：`output.mbtiles` 或 `output.pmtiles`
- 内置 OpenMapTiles profile，默认生成 MapLibre 能直接加载的矢量瓦片图层
- 纯 Java 程序，不需要先导入 PostGIS，也不需要 GeoServer

## 三、准备数据和工具

### 3.1 安装 Java

Planetiler 当前建议使用 Java 21 或更高版本：

```bash
java -version
```

Ubuntu 上可以直接安装：

```bash
apt-get update
apt-get install -y openjdk-21-jre-headless wget
```

### 3.2 下载 Planetiler

```bash
mkdir -p /data/osm
cd /data/osm

wget https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar
```

### 3.3 准备 OSM PBF

刚开始不要直接处理全球 `planet.osm.pbf`，可以先从 [Geofabrik](https://download.geofabrik.de/) 下载一个区域包测试：

```bash
wget https://download.geofabrik.de/asia/china/zhejiang-latest.osm.pbf \
  -O zhejiang-latest.osm.pbf
```

如果要做全球地图，就准备完整的 `planet.osm.pbf`。全球数据对磁盘、CPU、内存要求都比较高，建议至少准备：

- SSD 空间：PBF 文件大小的 5 到 10 倍
- JVM 内存：至少 PBF 文件大小的 0.5 倍左右
- CPU：核心越多越好，Planetiler 会并行处理

### 3.4 预下载 Planetiler 辅助数据

Planetiler 使用内置的 OpenMapTiles profile 时，除了 OSM PBF，还需要几份辅助数据。第一次运行可以让 `--download` 自动下载；如果服务器网络较慢，更稳的做法是提前把这些文件下载到固定目录。

假设工作目录是 `/data/osm`，默认路径如下：

```text
/data/osm/
├── planetiler.jar
├── planet.osm.pbf
└── data/
    ├── sources/
    │   ├── natural_earth_vector.sqlite.zip
    │   ├── water-polygons-split-3857.zip
    │   ├── lake_centerline.shp.zip
    │   └── wikidata_names.json
    └── tile_weights.tsv.gz
```

几份静态辅助数据的来源如下：

| 文件 | 作用 | 下载地址 |
| --- | --- | --- |
| `data/sources/natural_earth_vector.sqlite.zip` | 低 zoom 级别的国家、海岸线、行政区等基础数据 | `https://naciscdn.org/naturalearth/packages/natural_earth_vector.sqlite.zip` |
| `data/sources/water-polygons-split-3857.zip` | 海洋和大面积水域面数据 | `https://osmdata.openstreetmap.de/download/water-polygons-split-3857.zip` |
| `data/sources/lake_centerline.shp.zip` | 湖泊中心线，用于水域标注和线状表达 | `https://github.com/acalcutt/osm-lakelines/releases/download/v12/lake_centerline.shp.zip` |
| `data/tile_weights.tsv.gz` | 可选的瓦片访问权重统计，用于生成更有参考价值的 tile size 统计 | `https://raw.githubusercontent.com/onthegomap/planetiler/main/layerstats/top_osm_tiles.tsv.gz` |

可以这样预下载：

```bash
mkdir -p /data/osm/data/sources

curl -fL \
  https://naciscdn.org/naturalearth/packages/natural_earth_vector.sqlite.zip \
  -o /data/osm/data/sources/natural_earth_vector.sqlite.zip

curl -fL \
  https://osmdata.openstreetmap.de/download/water-polygons-split-3857.zip \
  -o /data/osm/data/sources/water-polygons-split-3857.zip

curl -fL \
  https://github.com/acalcutt/osm-lakelines/releases/download/v12/lake_centerline.shp.zip \
  -o /data/osm/data/sources/lake_centerline.shp.zip

curl -fL \
  https://raw.githubusercontent.com/onthegomap/planetiler/main/layerstats/top_osm_tiles.tsv.gz \
  -o /data/osm/data/tile_weights.tsv.gz
```

Wikidata 比较特殊，它不是一个固定的压缩包。Planetiler 会扫描 PBF 中的 `wikidata=Q...` 标签，然后分批请求 Wikidata SPARQL endpoint：

```text
https://query.wikidata.org/bigdata/namespace/wdq/sparql
```

最终生成本地缓存：

```text
data/sources/wikidata_names.json
```

如果只是小区域数据，可以直接让 Planetiler 在线生成：

```bash
java -Xmx20g -jar planetiler.jar \
  --only-fetch-wikidata \
  --osm-path=planet.osm.pbf \
  --download-dir=data/sources
```

但全球 `planet.osm.pbf` 里的 QID 数量比较多，在线请求 Wikidata SPARQL 容易慢、超时或被限流。更稳的做法是下载 Wikidata 全量 dump，然后在本地只过滤 OSM 里实际出现过的 QID。

安装依赖：

```bash
apt-get update
apt-get install -y osmium-tool pbzip2
```

下载全量 Wikidata dump：

```bash
cd /data/osm/data/sources

curl -fL \
  https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.bz2 \
  -o latest-all.json.bz2
```

先从 OSM PBF 中抽取所有 `wikidata=Q...`，生成一个去重后的 QID 列表：

```bash
cd /data/osm/data/sources

/usr/bin/osmium tags-filter -R -f opl \
  /data/osm/planet.osm.pbf \
  n/wikidata w/wikidata r/wikidata \
  | LC_ALL=C grep -ao 'wikidata=Q[0-9][0-9]*' \
  | sed 's/wikidata=Q//' \
  | LC_ALL=C sort -T /data/osm/data/sources -S 8G -nu \
  > wikidata_qids.txt
```

这里有两个细节：

- `-R` 表示不要把被引用的节点、道路、关系一起输出，否则中间数据会被放大很多。
- `sort -T /data/osm/data/sources` 明确指定排序临时目录，避免默认使用空间很小的 `/tmp`。

然后用并行 bzip2 解压全量 dump，并通过本地脚本过滤出 Planetiler 需要的缓存格式：

```bash
cd /data/osm/data/sources

/usr/bin/pbzip2 -dc -p32 latest-all.json.bz2 \
  | ./filter-wikidata-labels.py \
      --qid-file wikidata_qids.txt \
      --output wikidata_names.json \
      --overwrite \
      2> filter-wikidata-labels.log
```

`pbzip2 -dc` 会把解压后的 JSON 输出到 stdout，所以必须接管道或重定向。不要裸跑这个命令，否则会把大量 JSON 直接打到终端。

如果要后台运行，可以把输出先写到临时文件，成功后再替换正式文件：

```bash
cd /data/osm/data/sources

nohup bash -lc '
set -Eeuo pipefail

/usr/bin/osmium tags-filter -R -f opl \
  /data/osm/planet.osm.pbf \
  n/wikidata w/wikidata r/wikidata \
  | LC_ALL=C grep -ao "wikidata=Q[0-9][0-9]*" \
  | sed "s/wikidata=Q//" \
  | LC_ALL=C sort -T /data/osm/data/sources -S 8G -nu \
  > wikidata_qids.txt.tmp

mv wikidata_qids.txt.tmp wikidata_qids.txt

/usr/bin/pbzip2 -dc -p32 latest-all.json.bz2 \
  | ./filter-wikidata-labels.py \
      --qid-file wikidata_qids.txt \
      --output wikidata_names.json.tmp \
      --overwrite \
      --progress-interval 1000000 \
      2> filter-wikidata-labels.log

mv wikidata_names.json.tmp wikidata_names.json
' > wikidata-dump-pipeline.log 2>&1 &
```

查看进度：

```bash
tail -f /data/osm/data/sources/wikidata-dump-pipeline.log
tail -f /data/osm/data/sources/filter-wikidata-labels.log
```

过滤脚本 `filter-wikidata-labels.py` 源码如下：

```python
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
            except Exception as exc:
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
```

后续正式生成 `planet.pmtiles` 时，只要 `data/sources/wikidata_names.json` 已经存在，Planetiler 会读取它。这个步骤不是必须的；不生成 Wikidata 缓存也能出图，只是地名翻译会少一些。

## 四、生成 planet.pmtiles

### 4.1 用本地 PBF 生成

对区域 PBF，可以这样生成：

```bash
java -Xmx16g -jar planetiler.jar \
  --download \
  --osm-path=zhejiang-latest.osm.pbf \
  --output=planet.pmtiles \
  --force
```

几个参数说明：

- `--osm-path`：指定本地已有的 `.osm.pbf` 文件。
- `--output=planet.pmtiles`：输出 PMTiles 文件。后缀是 `.pmtiles` 时，Planetiler 会直接写 PMTiles。
- `--download`：下载 OpenMapTiles profile 需要的辅助数据，比如 Natural Earth 和 water polygons。第一次运行建议保留。
- `--force`：如果输出文件已存在，直接覆盖。
- `-Xmx16g`：给 JVM 的最大堆内存。根据机器配置和 PBF 大小调整。

如果已经按上一节把辅助数据都放到了 `data/sources/`，可以去掉 `--download`，避免生成过程中再次访问外网。

生成完成后检查文件：

```bash
ls -lh planet.pmtiles
```

### 4.2 生成全球 planet.pmtiles

如果是全球数据，可以让 Planetiler 自动下载 OSM planet，也可以指定本地已有的 `planet.osm.pbf`。

自动下载并生成：

```bash
java -Xmx68g -jar planetiler.jar \
  --download \
  --area=planet \
  --bounds=planet \
  --download-threads=10 \
  --download-chunk-size-mb=1000 \
  --fetch-wikidata \
  --output=planet.pmtiles \
  --storage=mmap \
  --force
```

如果已经有本地 `planet.osm.pbf`，就把下载 OSM 的部分换成：

```bash
java -Xmx68g -jar planetiler.jar \
  --download \
  --osm-path=planet.osm.pbf \
  --bounds=planet \
  --fetch-wikidata \
  --output=planet.pmtiles \
  --storage=mmap \
  --force
```

`--storage=mmap` 会把节点位置缓存放到内存映射文件里，能降低 JVM 堆内存压力。机器内存特别充足时，可以改成 `--storage=ram`。

这里不要盲目照抄 `--nodemap-type=array`。我实际在一台 HDD 压力比较大的机器上试过，强制 `array` 后 `osm_pass2` 阶段随机读压力很大，CPU 利用率很低，最后还可能被系统杀掉。更稳的方式是保留 Planetiler 当前默认的 nodemap 类型，让它使用更保守的 `sparsearray` 路径，再把 PBF、临时目录和输出目录放到 SSD 上。

我这次全量生成时使用的布局是：

```text
/mnt/data_1/pmtiles-demo/
├── planet-260706.osm.pbf
└── data/sources/
    └── wikidata_names.json

/mnt/data_3/pmtiles-demo-run/
├── run-planet-pipeline.sh
├── pipeline.log
├── pipeline.pid
├── pipeline.done
├── pipeline.failed
└── planet.pmtiles
```

后台运行时建议留下明确的完成和失败标记：

```bash
nohup bash run-planet-pipeline.sh > pipeline.log 2>&1 &
echo $! > pipeline.pid
```

不要只看输出文件是否存在。Planetiler 刚启动时可能已经创建了一个很小的占位 `planet.pmtiles`，必须同时检查：

- `pipeline.done` 是否存在
- `pipeline.failed` 是否不存在
- `planet.pmtiles` 大小是否合理
- Range 请求或 `pmtiles show` 是否能读到有效 header 和 metadata

### 4.3 可选：检查 PMTiles

安装 PMTiles CLI 后可以检查元信息：

```bash
# 到 https://github.com/protomaps/go-pmtiles/releases 下载对应平台的 pmtiles 二进制，
# 解压后放到 PATH 中。

pmtiles show planet.pmtiles
```

这一步只是检查，不是生成。生成仍然靠 `planetiler.jar`。

## 五、部署 planet.pmtiles

### 5.1 Nginx 静态文件方案

参考 `/Users/admin/zone/fuxin3x/fux3-map-server`，生产部署时可以把文件放到：

```text
/cy/server/fux3-map-server/tiles/planet.pmtiles
```

然后通过 Nginx 暴露为：

```text
https://<host>/data/planet.pmtiles
```

PMTiles 的关键是 HTTP Range 请求。Nginx 需要正确设置 MIME、CORS 和 Range 相关响应头：

```nginx
http {
    types {
        application/x-protobuf pbf;
        application/vnd.pmtiles pmtiles;
    }
}

server {
    listen 8080;
    root /cy/server/fux3-map-server/;

    location /data/ {
        alias /cy/server/fux3-map-server/tiles/;

        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range" always;
        add_header Access-Control-Expose-Headers "Content-Length, Content-Range" always;
        add_header Accept-Ranges bytes always;

        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Range" always;
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        location ~* \.pmtiles$ {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Range" always;
            add_header Access-Control-Expose-Headers "Content-Length, Content-Range" always;
            add_header Accept-Ranges bytes always;

            expires 7d;
            add_header Cache-Control "public";
        }
    }
}
```

部署后用 Range 请求测试：

```bash
curl -v -r 0-1023 -o /dev/null \
  http://localhost:8080/data/planet.pmtiles
```

正常情况下应该能看到 `206 Partial Content`，或者至少确认响应头里有 `Accept-Ranges: bytes`、`Content-Range`、`Content-Type: application/vnd.pmtiles` 等信息。

### 5.2 Cloudflare Worker 同源代理方案

如果 `planet.pmtiles` 已经放到了一个支持 Range 的对象存储或 CDN 公开地址，也可以用 Cloudflare Worker 做一个轻量 demo。Worker 不保存瓦片数据，只把浏览器对同源路径的 Range 请求转发到上游文件。

这次 demo 的公开地址是：

```text
https://pmtiles-demo.wuliang142857.me/
```

浏览器实际读取的是同源路径：

```text
https://pmtiles-demo.wuliang142857.me/tiles/planet.pmtiles
```

Worker 再转发到真实的 PMTiles 文件：

```text
https://image-hosting.wuliang142857.me/maps/osm/planet-260706/planet.pmtiles
```

这个文件大小约 81 GB，不能让浏览器整文件下载。必须确认 Range 请求生效：

```bash
curl -sS --max-filesize 1024 \
  -D /tmp/planet-pmtiles-range.headers \
  -H 'Range: bytes=0-7' \
  https://pmtiles-demo.wuliang142857.me/tiles/planet.pmtiles \
  -o /tmp/planet-pmtiles-range.bin

sed -n '1,18p' /tmp/planet-pmtiles-range.headers
xxd -p -l 8 /tmp/planet-pmtiles-range.bin
```

正常结果应该包含：

```text
HTTP/2 206
content-range: bytes 0-7/86182339966
accept-ranges: bytes
content-type: application/vnd.pmtiles
504d54696c657303
```

`504d54696c657303` 是 `PMTiles` v3 文件头。

Worker 配置可以这样写：

```toml
name = "pmtiles-demo"
main = "src/worker.js"
compatibility_date = "2026-07-31"

[assets]
binding = "ASSETS"
directory = "./dist"
not_found_handling = "single-page-application"

[vars]
PLANET_PMTILES_URL = "https://image-hosting.wuliang142857.me/maps/osm/planet-260706/planet.pmtiles"

[[routes]]
pattern = "pmtiles-demo.wuliang142857.me"
custom_domain = true
```

核心 Worker 代码：

```javascript
const DEFAULT_PLANET_PMTILES_URL =
  'https://image-hosting.wuliang142857.me/maps/osm/planet-260706/planet.pmtiles';

const rangeHeaders = [
  'range',
  'if-range',
  'if-none-match',
  'if-modified-since',
  'cache-control',
];

function buildUpstreamHeaders(request) {
  const headers = new Headers();
  for (const name of rangeHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function withTileHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET, HEAD, OPTIONS');
  headers.set(
    'access-control-allow-headers',
    'Range, If-Range, If-None-Match, If-Modified-Since'
  );
  headers.set('accept-ranges', 'bytes');
  headers.set('content-type', headers.get('content-type') || 'application/vnd.pmtiles');
  headers.set(
    'cache-control',
    headers.get('cache-control') || 'public, max-age=31536000, immutable'
  );
  return headers;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/tiles/planet.pmtiles') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: withTileHeaders(new Response(null)),
        });
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { allow: 'GET, HEAD, OPTIONS' },
        });
      }

      const upstreamResponse = await fetch(
        env.PLANET_PMTILES_URL || DEFAULT_PLANET_PMTILES_URL,
        {
          method: request.method,
          headers: buildUpstreamHeaders(request),
        }
      );

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: withTileHeaders(upstreamResponse),
      });
    }

    return env.ASSETS.fetch(request);
  },
};
```

这里有一个坑：不要给这个上游 `fetch()` 加 `cf: { cacheEverything: true }`。我测试时它会让 Range 语义变得不可靠，Worker 可能尝试读取完整的 81 GB 文件。对 PMTiles 来说，正确转发 `Range` 和得到 `206 Partial Content` 比整文件缓存更重要。

如果使用 Workers Assets 托管前端页面，部署后根路径有时会短暂拿到旧的 `index.html`，表现为浏览器继续加载上一版 JS/CSS。可以让 Worker 对 HTML shell 单独返回 `no-store`，静态 hash 资源仍交给 Assets：

```javascript
async function fetchHtmlShell(request, env) {
  const url = new URL(request.url);
  const assetUrl = new URL('/index.html', url);
  assetUrl.searchParams.set('__asset_bust', Date.now().toString());

  const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));
  const headers = new Headers(assetResponse.headers);
  headers.set('cache-control', 'no-store');

  return new Response(assetResponse.body, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  });
}
```

## 六、前端加载方案

前端还是 `MapLibre GL + pmtiles.Protocol()`。如果 PMTiles 文件和页面不是同源，可以直接写完整 URL；如果用了上面的 Worker 代理，推荐让浏览器只访问同源路径：

```text
/tiles/planet.pmtiles
```

当前 demo 使用的核心代码如下：

```typescript
import * as maplibregl from 'maplibre-gl';
import { PMTiles, Protocol } from 'pmtiles';
import { getMapStyle } from './mapStyle';

const archiveUrl = `${window.location.origin}/tiles/planet.pmtiles`;
const protocolUrl = `pmtiles://${archiveUrl}`;

const protocol = new Protocol();
protocol.add(new PMTiles(archiveUrl));
maplibregl.addProtocol('pmtiles', protocol.tile);

const map = new maplibregl.Map({
  container: containerRef.current,
  style: getMapStyle(protocolUrl),
  center: [104.2, 34.8],
  zoom: 3,
  attributionControl: false,
});
```

`getMapStyle()` 里只需要把 `pmtiles://...` 作为 vector source URL：

```typescript
sources: {
  osm: {
    type: 'vector',
    url: pmtilesUrl,
  },
}
```

也就是说，前端只需要注册 `pmtiles://` 协议，然后把 `pmtiles://https://<host>/data/planet.pmtiles` 作为 MapLibre 的 vector source URL 即可。

如果样式中包含文字标注，还需要提供字体 glyph。当前 demo 复用了和旧 demo 类似的 OpenStreetMap 风格图层，但字体使用一个稳定的公开 glyph 服务：

```typescript
glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
```

如果部署在内网，参考项目里也可以通过 `/fonts/` 暴露 `Noto Sans Regular`、`Noto Sans Bold` 等字体 PBF 文件。关键是浏览器里字体请求必须返回 `.pbf`，不能返回 HTML 或长时间 pending，否则文字图层会阻塞 `map.on('load')`。

这次为了让 demo 观感和旧版保持一致，我直接复用了 `fux3-map-server/src/config/mapStyle.ts` 的底图分层：

- `landcover`、`landuse`、`park`、`water`、`waterway`
- `aeroway`、`boundary`、`building`
- 分级道路：`motorway`、`trunk`、`primary`、`secondary`、`tertiary`、`minor`、`path`
- `railway`、`bridge`
- 水域名、道路名、城市/乡镇/社区、POI、山峰和门牌号

页面上叠加的控制面板保持白色或半透明白，避免盖在地图上时出现明显偏黄的色块。

## 七、一个简单的 index.html demo

下面这个 demo 只依赖 CDN，可以直接保存成 `index.html` 打开。为了减少依赖，它只画背景、水域、建筑和道路，不包含文字标注，因此不需要字体 glyph。

把 `PMTILES_URL` 改成自己的地址即可：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PMTiles OSM Demo</title>
  <link
    href="https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.css"
    rel="stylesheet"
  />
  <script src="https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.js"></script>
  <script src="https://unpkg.com/pmtiles@3.0.6/dist/pmtiles.js"></script>
  <style>
    html,
    body,
    #map {
      height: 100%;
      margin: 0;
      width: 100%;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    const PMTILES_URL = 'pmtiles://http://localhost:8080/data/planet.pmtiles';

    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    const map = new maplibregl.Map({
      container: 'map',
      center: [120.15, 30.28],
      zoom: 11,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'vector',
            url: PMTILES_URL,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
          },
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#f2efe9',
            },
          },
          {
            id: 'landcover',
            type: 'fill',
            source: 'osm',
            'source-layer': 'landcover',
            paint: {
              'fill-color': '#d8ead2',
              'fill-opacity': 0.6,
            },
          },
          {
            id: 'water',
            type: 'fill',
            source: 'osm',
            'source-layer': 'water',
            paint: {
              'fill-color': '#a9d3df',
            },
          },
          {
            id: 'building',
            type: 'fill',
            source: 'osm',
            'source-layer': 'building',
            minzoom: 13,
            paint: {
              'fill-color': '#d9d0c9',
              'fill-opacity': 0.85,
            },
          },
          {
            id: 'road-casing',
            type: 'line',
            source: 'osm',
            'source-layer': 'transportation',
            paint: {
              'line-color': '#c8b9a6',
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                5,
                0.8,
                10,
                2,
                14,
                6
              ],
            },
          },
          {
            id: 'road',
            type: 'line',
            source: 'osm',
            'source-layer': 'transportation',
            paint: {
              'line-color': '#ffffff',
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                5,
                0.4,
                10,
                1.2,
                14,
                4
              ],
            },
          },
        ],
      },
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    map.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 120,
        unit: 'metric',
      }),
      'bottom-left'
    );
  </script>
</body>
</html>
```

实际项目中建议像 `fux3-map-server/src/config/mapStyle.ts` 那样整理成独立的 `mapStyle()` 方法，并按图层类型仔细排序。

如果需要显示地名，可以补充 `glyphs` 和 `place` 图层：

```javascript
style: {
  version: 8,
  glyphs: '/fonts/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'vector',
      url: PMTILES_URL,
    },
  },
  layers: [
    // ...
    {
      id: 'place-label',
      type: 'symbol',
      source: 'osm',
      'source-layer': 'place',
      minzoom: 4,
      layout: {
        'text-field': ['coalesce', ['get', 'name:zh'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.2,
      },
    },
  ],
}
```

## 八、排查点

### 8.1 页面空白

先检查浏览器控制台。如果是 `pmtiles://` 协议无法识别，通常是忘了执行：

```javascript
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);
```

### 8.2 网络请求 200 但地图不动或很慢

检查服务端是否支持 Range：

```bash
curl -v -r 0-1023 -o /dev/null \
  https://<host>/data/planet.pmtiles
```

PMTiles 不是一次性把整个文件下载下来，而是靠 Range 请求读取文件片段。如果服务端或对象存储不支持 Range，请求会变得非常慢，甚至不可用。

### 8.3 图层不显示

Planetiler 默认输出的是 OpenMapTiles 相关图层。MapLibre style 中的 `source-layer` 必须和 PMTiles 内部图层一致，例如：

- `water`
- `building`
- `transportation`
- `landcover`
- `landuse`
- `place`

如果换了自定义 Planetiler profile，前端样式也要同步调整。

### 8.4 文字不显示

文字图层依赖字体 glyph。检查：

```text
/fonts/{fontstack}/{range}.pbf
```

是否能正常访问。参考 `fux3-map-server` 的做法，把字体 PBF 文件通过 Nginx 的 `/fonts/` 路径提供出去。

### 8.5 地图只显示一小条或只显示 300px 高

MapLibre 会给容器加 `.maplibregl-map` 类。如果自己的 `.map-canvas` 是绝对定位，但被 MapLibre 的默认样式覆盖，可能出现外层容器实际高度是 0、canvas 只剩默认 300px 高的情况。

可以显式提高选择器优先级：

```css
.demo-shell > .map-canvas.maplibregl-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

然后用浏览器检查：

```javascript
document.querySelector('canvas').getBoundingClientRect()
```

正常情况下，canvas 的宽高应该和视口或地图容器一致。

### 8.6 字体请求 pending，地图一直不是 ready

如果 `map.on('load')` 一直不触发，但 PMTiles Range 请求已经是 `206`，再检查字体请求。文字图层会请求类似：

```text
/fonts/Noto%20Sans%20Regular/0-255.pbf
```

如果这个请求 pending、404，或者返回了 HTML，地图可能已经画出底图，但 load 状态迟迟不结束。公网 demo 可以先用稳定的公开 glyph 地址验证：

```typescript
glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
```

内网生产环境再把字体 PBF 收回到自己的 `/fonts/` 服务。

## 九、总结

这套方案的关键点很简单：

1. 用 Java 程序 `Planetiler` 把 `.osm.pbf` 生成 `planet.pmtiles`。
2. 用 Nginx 或对象存储把 `planet.pmtiles` 当静态文件提供出去，并确保支持 HTTP Range。
3. 前端使用 `MapLibre GL + pmtiles.Protocol()` 直接加载 `pmtiles://.../planet.pmtiles`。

相比 GeoServer 方案，PMTiles 方案没有 PostGIS 查询和 WMS 动态渲染，服务端压力小很多，浏览器交互也顺滑得多。对于离线或内网地图服务，这个方案更轻、更快，也更容易部署。

本文对应的在线 demo 和源码：

```text
https://pmtiles-demo.wuliang142857.me/
https://github.com/wuliang142857/pmtiles-demo
```
