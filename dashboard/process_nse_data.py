"""
process_nse_data.py
────────────────────────────────────────────────────────────
Run this script daily (after scraping) to convert the raw
NSE participant OI CSV into a pre-computed "dashboard CSV".

Usage
-----
  python process_nse_data.py                          # uses defaults
  python process_nse_data.py --input raw.csv --output dashboard_data.csv

Your daily scraping workflow
─────────────────────────────
  1. Scrape NSE → append row to  nse_participant_oi_combined.csv   (raw)
  2. Run this script             → overwrites  nse_oi_dashboard.csv  (processed)
  3. git add & commit both files → GitHub Pages dashboard auto-refreshes

Nothing else needed. The dashboard HTML/JS is deployed once and reads
nse_oi_dashboard.csv fresh on every browser visit.
"""

import csv
import argparse
import sys
from pathlib import Path
from collections import defaultdict

# ── Column definitions ─────────────────────────────────────────────────────
OUTPUT_COLUMNS = [
    "date",
    # Index futures net (long − short) per participant
    "fii_net_idx",     # FII index futures net
    "dii_net_idx",     # DII index futures net
    "cl_net_idx",      # Client index futures net
    "pr_net_idx",      # Pro index futures net
    # Stock futures net
    "fii_net_stk",     # FII stock futures net
    "dii_net_stk",     # DII stock futures net
    # Put-Call Ratios
    "pcr_idx",         # Market-wide index options PCR
    "pcr_stk",         # Market-wide stock options PCR
    "fii_pcr",         # FII-only index PCR
    "dii_pcr",         # DII-only index PCR
    "cl_pcr",          # Client-only index PCR
    # Long / Short ratios (total_long / total_short)
    "fii_ls",
    "dii_ls",
    "cl_ls",
    "pr_ls",
    # DII hedging intensity = DII index put long / DII index call long
    "dii_hedge",
    # FII options net direction = FII index call long − FII index put long
    "fii_opt_net",
    # FII − DII net index futures divergence
    "fii_dii_div",
    # Aggregate OI (sum of all participant longs — best proxy for total market OI)
    "total_oi",
    # Raw long / short for FII and DII (needed for certain charts)
    "fii_tl", "fii_ts",
    "dii_tl", "dii_ts",
    # FII and DII index option longs (for options charts)
    "fii_call_l", "fii_put_l",
    "dii_call_l", "dii_put_l",
]


def safe_div(numerator: float, denominator: float, precision: int = 4) -> float:
    """Return numerator / denominator, or 0 if denominator is 0."""
    if denominator == 0:
        return 0.0
    return round(numerator / denominator, precision)


def process_raw_csv(input_path: str, output_path: str) -> int:
    """
    Read raw NSE participant OI CSV (multiple rows per date),
    compute derived metrics, write one row per date to output CSV.

    Returns the number of trading days processed.
    """
    # ── Read raw CSV ─────────────────────────────────────────
    by_date: dict[str, dict[str, dict]] = defaultdict(dict)

    try:
        with open(input_path, newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            required = {
                "trade_date", "client_type",
                "future_index_long", "future_index_short",
                "future_stock_long", "future_stock_short",
                "option_index_call_long", "option_index_put_long",
                "option_stock_call_long", "option_stock_put_long",
                "total_long", "total_short",
            }
            if not required.issubset(set(reader.fieldnames or [])):
                missing = required - set(reader.fieldnames or [])
                sys.exit(f"❌  Input CSV is missing columns: {missing}")

            for row in reader:
                date = row["trade_date"].strip()
                ct   = row["client_type"].strip()
                if not date or not ct:
                    continue
                by_date[date][ct] = {
                    k: float(v) if v.strip() else 0.0
                    for k, v in row.items()
                    if k not in ("trade_date", "client_type")
                }
    except FileNotFoundError:
        sys.exit(f"❌  Input file not found: {input_path}")

    if not by_date:
        sys.exit("❌  Input CSV appears empty or has no valid rows.")

    # ── Compute metrics per date ──────────────────────────────
    output_rows = []
    for date in sorted(by_date):
        p  = by_date[date]
        fi = p.get("FII",    {})
        di = p.get("DII",    {})
        cl = p.get("Client", {})
        pr = p.get("Pro",    {})

        def g(part: dict, col: str) -> float:
            return part.get(col, 0.0)

        # Market-wide PCR (sum across FII + DII + Client + Pro)
        mkt_put_idx  = sum(g(x, "option_index_put_long")  for x in (fi, di, cl, pr))
        mkt_call_idx = sum(g(x, "option_index_call_long") for x in (fi, di, cl, pr))
        mkt_put_stk  = sum(g(x, "option_stock_put_long")  for x in (fi, di, cl, pr))
        mkt_call_stk = sum(g(x, "option_stock_call_long") for x in (fi, di, cl, pr))

        # Net index futures per participant
        fii_net_idx = g(fi, "future_index_long") - g(fi, "future_index_short")
        dii_net_idx = g(di, "future_index_long") - g(di, "future_index_short")

        out = {
            "date":        date,
            # Futures net
            "fii_net_idx": int(fii_net_idx),
            "dii_net_idx": int(dii_net_idx),
            "cl_net_idx":  int(g(cl, "future_index_long") - g(cl, "future_index_short")),
            "pr_net_idx":  int(g(pr, "future_index_long") - g(pr, "future_index_short")),
            "fii_net_stk": int(g(fi, "future_stock_long") - g(fi, "future_stock_short")),
            "dii_net_stk": int(g(di, "future_stock_long") - g(di, "future_stock_short")),
            # PCR
            "pcr_idx":  safe_div(mkt_put_idx,  mkt_call_idx),
            "pcr_stk":  safe_div(mkt_put_stk,  mkt_call_stk),
            "fii_pcr":  safe_div(g(fi, "option_index_put_long"), g(fi, "option_index_call_long")),
            "dii_pcr":  safe_div(g(di, "option_index_put_long"), g(di, "option_index_call_long")),
            "cl_pcr":   safe_div(g(cl, "option_index_put_long"), g(cl, "option_index_call_long")),
            # Long/Short ratios
            "fii_ls": safe_div(g(fi, "total_long"), g(fi, "total_short")),
            "dii_ls": safe_div(g(di, "total_long"), g(di, "total_short")),
            "cl_ls":  safe_div(g(cl, "total_long"), g(cl, "total_short")),
            "pr_ls":  safe_div(g(pr, "total_long"), g(pr, "total_short")),
            # DII hedging
            "dii_hedge":   safe_div(
                g(di, "option_index_put_long"),
                max(g(di, "option_index_call_long"), 1)   # avoid /0 when DII has no calls
            ),
            # FII options direction
            "fii_opt_net": int(g(fi, "option_index_call_long") - g(fi, "option_index_put_long")),
            # Divergence
            "fii_dii_div": int(fii_net_idx - dii_net_idx),
            # Total market OI proxy
            "total_oi": int(sum(g(x, "total_long") for x in (fi, di, cl, pr))),
            # Raw long/short (FII & DII)
            "fii_tl": int(g(fi, "total_long")),
            "fii_ts": int(g(fi, "total_short")),
            "dii_tl": int(g(di, "total_long")),
            "dii_ts": int(g(di, "total_short")),
            # Index option longs
            "fii_call_l": int(g(fi, "option_index_call_long")),
            "fii_put_l":  int(g(fi, "option_index_put_long")),
            "dii_call_l": int(g(di, "option_index_call_long")),
            "dii_put_l":  int(g(di, "option_index_put_long")),
        }
        output_rows.append(out)

    # ── Write processed CSV ───────────────────────────────────
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        writer.writerows(output_rows)

    return len(output_rows)


def main():
    parser = argparse.ArgumentParser(
        description="Convert raw NSE participant OI CSV → pre-computed dashboard CSV"
    )
    parser.add_argument(
        "--input", "-i",
        default="nse_participant_oi_combined.csv",
        help="Path to the raw input CSV (default: nse_participant_oi_combined.csv)",
    )
    parser.add_argument(
        "--output", "-o",
        default="nse_oi_dashboard.csv",
        help="Path for the processed output CSV (default: nse_oi_dashboard.csv)",
    )
    args = parser.parse_args()

    print(f"📥  Reading  : {args.input}")
    n = process_raw_csv(args.input, args.output)
    print(f"✅  Written  : {args.output}  ({n} trading days)")
    print(f"🌐  Push both CSVs to GitHub — dashboard will refresh automatically on next page load.")


if __name__ == "__main__":
    main()
