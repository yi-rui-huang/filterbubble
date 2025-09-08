#!/usr/bin/env python3
import csv
import os
import sys
from collections import Counter, defaultdict

# IMDb title.basics.tsv expected columns:
# tconst	titleType	primaryTitle	originalTitle	isAdult	startYear	endYear	runtimeMinutes	genres

TSV_PATH = "/home/hyr/115/filterbubble/src/data/title.basics.tsv"

NULLS = {"\\N", "", None}


def safe_int(x):
    if x in NULLS:
        return None
    try:
        return int(x)
    except Exception:
        return None


def main(path: str):
    if not os.path.exists(path):
        print(f"ERROR: File not found: {path}")
        return 2

    # Basic metadata
    try:
        size_bytes = os.path.getsize(path)
    except Exception:
        size_bytes = -1

    def human_size(n):
        if n < 0:
            return "unknown"
        units = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        f = float(n)
        while f >= 1024 and i < len(units) - 1:
            f /= 1024.0
            i += 1
        return f"{f:.2f} {units[i]}"

    total = 0
    missing = Counter()
    title_type_counts = Counter()
    is_adult_counts = Counter()
    start_year_min = None
    start_year_max = None
    start_year_counts = Counter()
    end_year_present = 0
    runtime_count = 0
    runtime_min = None
    runtime_max = None
    runtime_sum = 0
    genre_counts = Counter()

    # Track a few examples for each titleType (up to 3)
    examples_by_type = defaultdict(list)

    with open(path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f, delimiter='\t')
        expected = [
            "tconst",
            "titleType",
            "primaryTitle",
            "originalTitle",
            "isAdult",
            "startYear",
            "endYear",
            "runtimeMinutes",
            "genres",
        ]
        if reader.fieldnames != expected:
            print("WARNING: Unexpected columns. Got:", reader.fieldnames)
            print("Expected:", expected)
        for row in reader:
            total += 1

            # Drop rows where runtimeMinutes is empty/null
            rm_raw_early = row.get("runtimeMinutes")
            rm_early = safe_int(rm_raw_early)
            if rm_early is None:
                # Skip this row entirely if runtimeMinutes is missing
                continue

            # titleType
            tt = row.get("titleType")
            if tt in NULLS:
                missing["titleType"] += 1
            else:
                title_type_counts[tt] += 1
                if len(examples_by_type[tt]) < 3:
                    examples_by_type[tt].append(row.get("primaryTitle", ""))

            # isAdult
            ia = row.get("isAdult")
            if ia in NULLS:
                missing["isAdult"] += 1
            else:
                is_adult_counts[ia] += 1

            # startYear
            sy_raw = row.get("startYear")
            sy = safe_int(sy_raw)
            if sy is None:
                missing["startYear"] += 1
            else:
                if start_year_min is None or sy < start_year_min:
                    start_year_min = sy
                if start_year_max is None or sy > start_year_max:
                    start_year_max = sy
                start_year_counts[sy] += 1

            # endYear present
            ey_raw = row.get("endYear")
            if ey_raw not in NULLS and safe_int(ey_raw) is not None:
                end_year_present += 1
            else:
                missing["endYear"] += 1

            # runtimeMinutes
            rm_raw = row.get("runtimeMinutes")
            rm = safe_int(rm_raw)
            if rm is None:
                missing["runtimeMinutes"] += 1
            else:
                runtime_count += 1
                runtime_sum += rm
                if runtime_min is None or rm < runtime_min:
                    runtime_min = rm
                if runtime_max is None or rm > runtime_max:
                    runtime_max = rm

            # genres
            g_raw = row.get("genres")
            if g_raw in NULLS:
                missing["genres"] += 1
            else:
                # genres are comma-separated, may include multiple
                for g in g_raw.split(','):
                    g = g.strip()
                    if g and g != "\\N":
                        genre_counts[g] += 1

            # track other missing
            if row.get("tconst") in NULLS:
                missing["tconst"] += 1
            if row.get("primaryTitle") in NULLS:
                missing["primaryTitle"] += 1
            if row.get("originalTitle") in NULLS:
                missing["originalTitle"] += 1

    print("Analysis of:", path)
    print(f"File size: {human_size(size_bytes)}")
    print(f"Total rows (excluding header): {total}")
    print()

    print("Title types (top 15):")
    for tt, c in title_type_counts.most_common(15):
        ex = "; ".join(examples_by_type.get(tt, []))
        print(f"  - {tt}: {c:,}" + (f"  e.g., {ex}" if ex else ""))
    other_types = len(title_type_counts) - 15
    if other_types > 0:
        print(f"  (+ {other_types} more types)")
    print()

    print("isAdult counts:")
    for k in sorted(is_adult_counts.keys()):
        print(f"  - {k}: {is_adult_counts[k]:,}")
    if not is_adult_counts:
        print("  (no data)")
    print()

    print("Start year range and top years:")
    if start_year_min is not None:
        print(f"  - Range: {start_year_min} .. {start_year_max}")
        print("  - Top 10 years by count:")
        for y, c in start_year_counts.most_common(10):
            print(f"    * {y}: {c:,}")
    else:
        print("  (no valid startYear data)")
    print()

    print("Runtime (minutes):")
    if runtime_count > 0:
        avg = runtime_sum / runtime_count
        print(f"  - Count: {runtime_count:,}")
        print(f"  - Min: {runtime_min}")
        print(f"  - Max: {runtime_max}")
        print(f"  - Mean: {avg:.2f}")
        print("  - Note: Median/percentiles not computed to avoid high memory usage.")
    else:
        print("  (no valid runtime data)")
    print()

    print("Genres (top 20):")
    if genre_counts:
        for g, c in genre_counts.most_common(20):
            print(f"  - {g}: {c:,}")
        other = len(genre_counts) - 20
        if other > 0:
            print(f"  (+ {other} more genres)")
    else:
        print("  (no genre data)")
    print()

    print("Missing values (selected columns):")
    sel = [
        "tconst",
        "titleType",
        "primaryTitle",
        "originalTitle",
        "isAdult",
        "startYear",
        "endYear",
        "runtimeMinutes",
        "genres",
    ]
    for k in sel:
        print(f"  - {k}: {missing.get(k, 0):,}")


if __name__ == "__main__":
    path = TSV_PATH
    if len(sys.argv) > 1:
        path = sys.argv[1]
    sys.exit(main(path) or 0)
