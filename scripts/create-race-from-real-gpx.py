#!/usr/bin/env python3
"""
Create a multi-boat race from a single real GPX sailing track.

Takes a real 1Hz GPS sailing track and produces 3 "sailor" GPX files
by applying position offsets, speed variation, and slight heading
perturbations. This preserves real sailing characteristics (tacking
patterns, speed oscillations, GPS noise) while simulating a race.

Usage: python3 scripts/create-race-from-real-gpx.py
"""

import xml.etree.ElementTree as ET
import math
import random
from datetime import datetime, timedelta

INPUT = "sample-gpx/real-race/nola_corfu_2.gpx"
OUTPUT_DIR = "sample-gpx/real-race"

NS = "http://www.topografix.com/GPX/1/1"

SAILORS = [
    {
        "name": "Sailor Alpha",
        "file": "race_sailor_a.gpx",
        "lat_offset": 0.0,
        "lon_offset": 0.0,
        "speed_factor": 1.0,
        "heading_jitter_deg": 0,
        "time_delay_s": 0,
    },
    {
        "name": "Sailor Bravo",
        "file": "race_sailor_b.gpx",
        "lat_offset": 0.0003,
        "lon_offset": -0.0002,
        "speed_factor": 0.92,
        "heading_jitter_deg": 3,
        "time_delay_s": 5,
    },
    {
        "name": "Sailor Charlie",
        "file": "race_sailor_c.gpx",
        "lat_offset": -0.0002,
        "lon_offset": 0.0004,
        "speed_factor": 0.97,
        "heading_jitter_deg": 2,
        "time_delay_s": 12,
    },
]


def parse_time(t_str):
    for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S+00:00"]:
        try:
            return datetime.strptime(t_str, fmt)
        except ValueError:
            continue
    return datetime.fromisoformat(t_str.replace("Z", "+00:00")).replace(tzinfo=None)


def load_track(path):
    tree = ET.parse(path)
    root = tree.getroot()
    ns = {"gpx": NS}
    points = []
    for pt in root.findall(".//gpx:trkpt", ns):
        lat = float(pt.get("lat"))
        lon = float(pt.get("lon"))
        ele_el = pt.find("gpx:ele", ns)
        ele = float(ele_el.text) if ele_el is not None else 0.0
        time_el = pt.find("gpx:time", ns)
        t = parse_time(time_el.text) if time_el is not None else None
        points.append({"lat": lat, "lon": lon, "ele": ele, "time": t})
    return points


def transform_track(points, cfg):
    random.seed(hash(cfg["name"]))
    result = []
    base_lat = points[0]["lat"]
    base_lon = points[0]["lon"]

    for i, p in enumerate(points):
        dlat = (p["lat"] - base_lat) * cfg["speed_factor"] + cfg["lat_offset"]
        dlon = (p["lon"] - base_lon) * cfg["speed_factor"] + cfg["lon_offset"]

        jitter_rad = math.radians(random.gauss(0, cfg["heading_jitter_deg"]) * 0.00001)
        cos_j = math.cos(jitter_rad)
        sin_j = math.sin(jitter_rad)
        dlat_r = dlat * cos_j - dlon * sin_j
        dlon_r = dlat * sin_j + dlon * cos_j

        new_lat = base_lat + dlat_r + cfg["lat_offset"]
        new_lon = base_lon + dlon_r + cfg["lon_offset"]

        new_time = None
        if p["time"] is not None:
            new_time = p["time"] + timedelta(seconds=cfg["time_delay_s"])

        result.append({
            "lat": round(new_lat, 6),
            "lon": round(new_lon, 6),
            "ele": p["ele"],
            "time": new_time,
        })

    return result


def write_gpx(points, name, path):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="TSS Race Generator">',
        "<trk>",
        f"<name>{name}</name>",
        "<trkseg>",
    ]
    for p in points:
        t_str = p["time"].strftime("%Y-%m-%dT%H:%M:%SZ") if p["time"] else ""
        lines.append(
            f'<trkpt lat="{p["lat"]}" lon="{p["lon"]}">'
            f'<ele>{p["ele"]}</ele>'
            f"<time>{t_str}</time>"
            f"</trkpt>"
        )
    lines.append("</trkseg>")
    lines.append("</trk>")
    lines.append("</gpx>")
    with open(path, "w") as f:
        f.write("\n".join(lines))


def main():
    print(f"Loading real track from {INPUT}...")
    points = load_track(INPUT)
    print(f"  {len(points)} points, {(points[-1]['time'] - points[0]['time']).total_seconds()/60:.0f} min")

    for cfg in SAILORS:
        transformed = transform_track(points, cfg)
        out_path = f"{OUTPUT_DIR}/{cfg['file']}"
        write_gpx(transformed, cfg["name"], out_path)
        print(f"  -> {out_path} ({cfg['name']})")

    print("\nDone! Load these 3 files in the app:")
    for cfg in SAILORS:
        print(f"  sample-gpx/real-race/{cfg['file']}")


if __name__ == "__main__":
    main()
