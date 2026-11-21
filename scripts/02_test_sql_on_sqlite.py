#!/usr/bin/env python3
"""Step 2: test the SQL files on SQLite and save the reference results.

IMPORTANT - this is NOT SAP HANA. It is a stand-in test:
  * The SAP HANA table definitions (sql/01) are translated mechanically to SQLite
    (CREATE COLUMN TABLE -> CREATE TABLE, NVARCHAR -> TEXT, DECIMAL -> REAL, DATE -> TEXT).
  * The views and queries (sql/04, 05, 06) are run WITHOUT any change.
  * The results are compared with an independent calculation on the raw Excel files.
The same queries should give the same results in SAP HANA. Run them there
as the final check (see README).

Output: docs/query_results/*.csv and docs/sql_test_report.md
"""
import re
import sqlite3
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / "sql"
CLEAN = ROOT / "data" / "clean"
RAW = ROOT / "data" / "raw"
OUT = ROOT / "docs" / "query_results"
OUT.mkdir(parents=True, exist_ok=True)

TABLE_FILES = {
    "DIM_CUSTOMER": "dim_customer.csv",
    "DIM_PRODUCT": "dim_product.csv",
    "DIM_GEOGRAPHY": "dim_geography.csv",
    "DIM_ORDER": "dim_order.csv",
    "DIM_DATE": "dim_date.csv",
    "FACT_SALES": "fact_sales.csv",
}
EXPECTED_ROWS = {"DIM_CUSTOMER": 793, "DIM_PRODUCT": 1894, "DIM_GEOGRAPHY": 632,
                 "DIM_ORDER": 5009, "DIM_DATE": 1461, "FACT_SALES": 9994}


def hana_ddl_to_sqlite(sql):
    sql = re.sub(r"CREATE SCHEMA \w+;", "", sql)
    sql = sql.replace("CREATE COLUMN TABLE", "CREATE TABLE")
    sql = re.sub(r"NVARCHAR\(\d+\)", "TEXT", sql)
    sql = re.sub(r"DECIMAL\(\d+,\s*\d+\)", "REAL", sql)
    sql = re.sub(r"\bDATE\b", "TEXT", sql)
    return sql


def statements(text):
    return [s.strip() for s in text.split(";") if s.strip()]


def tagged_blocks(path):
    """Yield (id, title, sql) for every '-- [ID] title' block of a SQL file."""
    parts = re.split(r"^-- \[(\w+)\] (.*)$", path.read_text(), flags=re.M)
    for i in range(1, len(parts), 3):
        yield parts[i], parts[i + 1].strip(), parts[i + 2].strip().rstrip(";").strip()


def fmt(v):
    if pd.isna(v):
        return "-"
    if isinstance(v, float):
        return f"{v:,.2f}"
    if isinstance(v, int):
        return f"{v:,}"
    return str(v)


def md_table(df):
    head = "| " + " | ".join(df.columns) + " |"
    sep = "| " + " | ".join("---" for _ in df.columns) + " |"
    body = ["| " + " | ".join(fmt(v) for v in row) + " |" for row in df.itertuples(index=False)]
    return "\n".join([head, sep] + body)


def main():
    con = sqlite3.connect(":memory:")
    con.execute("ATTACH DATABASE ':memory:' AS SUPERSTORE")

    # 1. tables from the SAP HANA DDL ------------------------------------------
    for stmt in statements(hana_ddl_to_sqlite((SQL / "01_create_schema_and_tables.sql").read_text())):
        con.execute(stmt)

    # 2. load the cleaned CSV files -----------------------------------------------
    for table, csv_name in TABLE_FILES.items():
        df = pd.read_csv(CLEAN / csv_name, dtype=str, keep_default_na=False)
        cols = ", ".join(df.columns)
        marks = ", ".join("?" for _ in df.columns)
        con.executemany(f"INSERT INTO SUPERSTORE.{table} ({cols}) VALUES ({marks})",
                        df.itertuples(index=False, name=None))
    con.commit()

    # 3. views --------------------------------------------------------------------
    for stmt in statements((SQL / "04_create_views.sql").read_text()):
        con.execute(stmt)

    report = ["# SQL test report", "",
              f"Engine: SQLite {sqlite3.sqlite_version} (a stand-in test, **not SAP HANA**). "
              "The views and queries in `sql/04`, `sql/05` and `sql/06` were executed unchanged; "
              "the SAP HANA table definitions in `sql/01` were translated mechanically. "
              "Run the same files in SAP HANA and compare the results with this report.", ""]
    results = {}

    # 4. data-quality checks ---------------------------------------------------------
    report += ["## Data-quality checks (`sql/05_data_quality_checks.sql`)", ""]
    for qid, title, sql in tagged_blocks(SQL / "05_data_quality_checks.sql"):
        df = pd.read_sql_query(sql, con)
        if "RESULT_VALUE" in df.columns:  # show whole numbers without decimals
            for col in ("RESULT_VALUE", "EXPECTED_VALUE"):
                df[col] = df[col].map(lambda v: int(v) if float(v).is_integer() else v)
        results[qid] = df
        df.to_csv(OUT / f"{qid}.csv", index=False)
        report += [f"### {qid}: {title}", "", md_table(df), ""]
    q1 = results["Q1"].set_index("TABLE_NAME")["ROW_COUNT"].to_dict()
    assert q1 == EXPECTED_ROWS, f"row counts differ: {q1}"
    assert (results["Q2"]["STATUS"] == "PASS").all(), "an integrity check failed"

    # 5. KPI queries ----------------------------------------------------------------------
    report += ["## KPI queries (`sql/06_kpi_queries.sql`)", ""]
    for qid, title, sql in tagged_blocks(SQL / "06_kpi_queries.sql"):
        df = pd.read_sql_query(sql, con)
        results[qid] = df
        df.to_csv(OUT / f"{qid}.csv", index=False)
        report += [f"### {qid}: {title}", "", md_table(df), ""]

    # 6. independent cross-check against the raw Excel files ---------------------------------
    s = pd.read_excel(RAW / "sales.xlsx")
    loc = pd.read_excel(RAW / "location.xlsx")
    cust = pd.read_excel(RAW / "customers.xlsx")
    k1 = results["K1"].iloc[0]
    checks = [
        ("Total sales", round(s["Sales"].sum(), 2), k1["TOTAL_SALES"]),
        ("Total profit", round(s["Profit"].sum(), 2), k1["TOTAL_PROFIT"]),
        ("Orders", s["Order ID"].nunique(), k1["ORDERS"]),
        ("Active customers", s["Customer ID"].nunique(), k1["ACTIVE_CUSTOMERS"]),
    ]
    by_region = s.groupby(loc["Region"].values)["Sales"].sum().round(2)
    for _, r in results["K4"].iterrows():
        checks.append((f"Sales, region {r['REGION']}", by_region[r["REGION"]], r["TOTAL_SALES"]))
    by_segment = s.groupby(cust["Segment"].values)["Sales"].sum().round(2)
    for _, r in results["K6"].iterrows():
        checks.append((f"Sales, segment {r['SEGMENT']}", by_segment[r["SEGMENT"]], r["TOTAL_SALES"]))
    by_year_sum = results["K2"]["TOTAL_SALES"].sum()
    checks.append(("Sum of yearly sales (K2) = total sales", round(s["Sales"].sum(), 2), round(by_year_sum, 2)))

    rows = []
    for name, raw_value, sql_value in checks:
        ok = abs(float(raw_value) - float(sql_value)) < 0.011
        rows.append({"CHECK": name, "RAW_EXCEL": raw_value, "SQL_RESULT": sql_value,
                     "STATUS": "PASS" if ok else "FAIL"})
        assert ok, f"mismatch: {name}: raw={raw_value} sql={sql_value}"
    xc = pd.DataFrame(rows)
    report += ["## Independent cross-check against the raw Excel files", "",
               "Each value is recalculated directly from `data/raw/*.xlsx` with pandas "
               "(no SQL, no cleaned CSV) and compared with the SQL result.", "", md_table(xc), ""]

    (ROOT / "docs" / "sql_test_report.md").write_text("\n".join(report), encoding="utf-8")
    print("All SQL files ran. Integrity checks: PASS. Cross-check against raw Excel: PASS.")
    print(results["K1"].to_string(index=False))
    print(results["K2"].to_string(index=False))
    print(results["Q3"].to_string(index=False))


if __name__ == "__main__":
    sys.exit(main())
