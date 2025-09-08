#!/usr/bin/env python3
import csv
import os
import sys

IN_PATH = "/home/hyr/115/filterbubble/src/data/title.basics.tsv"
OUT_PATH = "/home/hyr/115/filterbubble/src/data/title.basics.movie.with_genres.tsv"
NULLS = {"\\N", "", None}


def main(in_path: str, out_path: str) -> int:
    if not os.path.exists(in_path):
        print(f"ERROR: input not found: {in_path}", file=sys.stderr)
        return 2

    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    total = 0
    kept = 0

    with open(in_path, "r", encoding="utf-8", newline="") as fin, \
         open(out_path, "w", encoding="utf-8", newline="") as fout:
        reader = csv.reader(fin, delimiter='\t')
        writer = csv.writer(fout, delimiter='\t', lineterminator='\n')

        header = next(reader, None)
        if header is None:
            print("ERROR: empty input", file=sys.stderr)
            return 3
        writer.writerow(header)

        # Determine index of titleType column
        try:
            idx_title_type = header.index("titleType")
        except ValueError:
            print("ERROR: 'titleType' column not found in header", file=sys.stderr)
            return 4
        try:
            idx_genres = header.index("genres")
        except ValueError:
            print("ERROR: 'genres' column not found in header", file=sys.stderr)
            return 5
        try:
            idx_runtime = header.index("runtimeMinutes")
        except ValueError:
            print("ERROR: 'runtimeMinutes' column not found in header", file=sys.stderr)
            return 6

        for row in reader:
            total += 1
            if len(row) <= idx_title_type:
                continue
            if row[idx_title_type] == "movie":
                g = row[idx_genres].strip() if len(row) > idx_genres else ""
                rm = row[idx_runtime].strip() if len(row) > idx_runtime else ""
                if g not in NULLS and rm not in NULLS:
                    writer.writerow(row)
                    kept += 1

    print(f"Done. Read {total:,} rows; wrote {kept:,} rows to {out_path}")
    return 0


if __name__ == "__main__":
    in_path = IN_PATH
    out_path = OUT_PATH
    if len(sys.argv) >= 2:
        in_path = sys.argv[1]
    if len(sys.argv) >= 3:
        out_path = sys.argv[2]
    sys.exit(main(in_path, out_path))
