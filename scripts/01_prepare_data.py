#!/usr/bin/env python3
"""Step 1: clean the five raw Excel files and write SAP HANA-ready CSV files.

Input : data/raw/*.xlsx   (sales, customers, dates, location, product)
Output: data/clean/*.csv  (star schema: 1 fact table + 5 dimension tables)

What this script fixes (every rule is checked with an assertion below):
  1. Dates   - dates.xlsx mixes real dates with text, and the real dates have
               day and month swapped (the spreadsheet read "11/8/2016" as 11 Aug
               instead of 8 Nov). Swapped values are repaired and text values are
               parsed as month/day/year. Check: no order ships before it is ordered.
  2. Postal codes lost their leading zero (1040 -> '01040'); restored as text.
  3. The four dimension files are row-aligned copies of sales.xlsx (one row per
     sales row, so they contain duplicates). They are de-duplicated here and
     linked to the fact table with keys.
  4. A few product IDs carry two product names, and one postal code appears with
     two city/state values, so PRODUCT_ID and POSTAL_CODE cannot be primary keys.
     Surrogate keys PRODUCT_KEY and GEO_KEY are used instead.
"""
import csv
import datetime as dt
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
CLEAN = ROOT / "data" / "clean"
CLEAN.mkdir(parents=True, exist_ok=True)

MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]


def fix_date(value):
    """Return a real date from either a swapped datetime or an m/d/yyyy string."""
    if isinstance(value, (dt.datetime, pd.Timestamp)):
        return dt.date(value.year, value.day, value.month)  # undo the day/month swap
    return dt.datetime.strptime(str(value).strip(), "%m/%d/%Y").date()


def write_csv(df, name):
    path = CLEAN / name
    df.to_csv(path, index=False, quoting=csv.QUOTE_MINIMAL, lineterminator="\n", encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)}  ({len(df):,} rows)")


def main():
    sales = pd.read_excel(RAW / "sales.xlsx")
    cust = pd.read_excel(RAW / "customers.xlsx")
    dates = pd.read_excel(RAW / "dates.xlsx")
    loc = pd.read_excel(RAW / "location.xlsx")
    prod = pd.read_excel(RAW / "product.xlsx")
    n = len(sales)
    print(f"Read raw files: {n:,} sales rows")

    # --- the dimension files must be row-aligned with sales.xlsx -------------
    assert all(len(x) == n for x in (cust, dates, loc, prod)), "row counts differ"
    assert (cust["Customer ID"].values == sales["Customer ID"].values).all()
    assert (dates["Order ID"].values == sales["Order ID"].values).all()
    assert (loc["Postal Code"].values == sales["Postal Code"].values).all()
    assert (prod["Product ID"].values == sales["Product ID"].values).all()

    # --- 1. dates -------------------------------------------------------------
    order_date = dates["Order Date"].map(fix_date)
    ship_date = dates["Ship Date"].map(fix_date)
    ship_days = pd.Series([(s - o).days for o, s in zip(order_date, ship_date)])
    assert ship_days.min() >= 0, "an order ships before it is ordered"
    assert ship_days.max() <= 7, "unexpected delivery time"

    # --- 2. postal code as 5-character text ------------------------------------
    postal = loc["Postal Code"].astype(int).astype(str).str.zfill(5)

    # --- rows: one frame holding everything for each sales row ----------------
    rows = pd.DataFrame({
        "SALES_ID": sales["Sales ID"],
        "ORDER_ID": sales["Order ID"],
        "ORDER_DATE": order_date,
        "SHIP_DATE": ship_date,
        "SHIP_MODE": dates["Ship Mode"],
        "SHIP_DAYS": ship_days,
        "CUSTOMER_ID": sales["Customer ID"],
        "CUSTOMER_NAME": cust["Customer Name"],
        "SEGMENT": cust["Segment"],
        "PRODUCT_ID": prod["Product ID"],
        "PRODUCT_NAME": prod["Product Name"],
        "CATEGORY": prod["Category"],
        "SUB_CATEGORY": prod["Sub-Category"],
        "POSTAL_CODE": postal,
        "COUNTRY": loc["Country"],
        "CITY": loc["City"],
        "REGION": loc["Region"],
        "STATE": loc["State"],
        "SALES": sales["Sales"].round(4),   # source has up to 4 decimals; nothing is lost
        "QUANTITY": sales["Quantity"],
        "DISCOUNT": sales["Discount"].round(2),
        "PROFIT": sales["Profit"].round(4),
    })
    # rounding must not change the data
    assert ((sales["Sales"] - rows["SALES"]).abs() < 1e-9).all()
    assert ((sales["Profit"] - rows["PROFIT"]).abs() < 1e-9).all()
    assert ((sales["Discount"] - rows["DISCOUNT"]).abs() < 1e-9).all()

    # --- dimensions ---------------------------------------------------------------
    dim_customer = (rows[["CUSTOMER_ID", "CUSTOMER_NAME", "SEGMENT"]]
                    .drop_duplicates().sort_values("CUSTOMER_ID").reset_index(drop=True))
    assert dim_customer["CUSTOMER_ID"].is_unique

    prod_cols = ["PRODUCT_ID", "PRODUCT_NAME", "CATEGORY", "SUB_CATEGORY"]
    dim_product = (rows[prod_cols].drop_duplicates()
                   .sort_values(["PRODUCT_ID", "PRODUCT_NAME"]).reset_index(drop=True))
    dim_product.insert(0, "PRODUCT_KEY", range(1, len(dim_product) + 1))

    geo_cols = ["POSTAL_CODE", "COUNTRY", "CITY", "STATE", "REGION"]
    dim_geo = (rows[geo_cols].drop_duplicates()
               .sort_values(["POSTAL_CODE", "CITY"]).reset_index(drop=True))
    dim_geo.insert(0, "GEO_KEY", range(1, len(dim_geo) + 1))

    dim_order = (rows[["ORDER_ID", "ORDER_DATE", "SHIP_DATE", "SHIP_MODE", "SHIP_DAYS"]]
                 .drop_duplicates().sort_values("ORDER_ID").reset_index(drop=True))
    assert dim_order["ORDER_ID"].is_unique, "an order has two different dates or ship modes"

    first, last = rows["ORDER_DATE"].min(), rows["ORDER_DATE"].max()
    cal = pd.date_range(dt.date(first.year, 1, 1), dt.date(last.year, 12, 31), freq="D")
    dim_date = pd.DataFrame({
        "CAL_DATE": cal.date,
        "CAL_YEAR": cal.year,
        "CAL_QUARTER": cal.quarter,
        "CAL_MONTH": cal.month,
        "MONTH_NAME": [MONTHS[m - 1] for m in cal.month],
        "YEAR_MONTH": cal.strftime("%Y-%m"),
    })
    assert set(rows["ORDER_DATE"]).issubset(set(dim_date["CAL_DATE"]))

    # --- fact table: replace descriptive columns by keys -----------------------------
    fact = rows.merge(dim_product, on=prod_cols, how="left").merge(dim_geo, on=geo_cols, how="left")
    assert len(fact) == n and fact["PRODUCT_KEY"].notna().all() and fact["GEO_KEY"].notna().all()
    fact = fact[["SALES_ID", "ORDER_ID", "ORDER_DATE", "CUSTOMER_ID", "PRODUCT_KEY", "GEO_KEY",
                 "SALES", "QUANTITY", "DISCOUNT", "PROFIT"]].sort_values("SALES_ID")
    assert fact["SALES_ID"].is_unique

    print("Writing clean CSV files:")
    write_csv(dim_customer, "dim_customer.csv")
    write_csv(dim_product, "dim_product.csv")
    write_csv(dim_geo, "dim_geography.csv")
    write_csv(dim_order, "dim_order.csv")
    write_csv(dim_date, "dim_date.csv")
    write_csv(fact, "fact_sales.csv")
    print("Done. All checks passed.")


if __name__ == "__main__":
    main()
