#!/usr/bin/env python3
"""Step 4: draw the diagrams used in the Word report (docs/figures/*.png).

  fig_process.png          project process in six steps
  fig_architecture.png     data flow from Excel files to the dashboard
  fig_star_schema.png      the star schema with keys and row counts
  fig_wireframe_page1.png  wireframe (sketch) of page 1
  fig_wireframe_page2.png  wireframe (sketch) of page 2
  fig_date_fix.png         evidence for the date repair (before and after)
"""
import datetime as dt
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.patches import Circle, FancyBboxPatch, Rectangle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

NAVY, BLUE, ORANGE, TEAL, GREEN, RED = "#1F3864", "#2E75B6", "#E07B10", "#1F9A8A", "#2E9E5B", "#C0392B"
GREY, LIGHT, BORDER = "#5B6573", "#E3E8F0", "#B8C1CF"


def canvas(w, h, xmax, ymax):
    fig = plt.figure(figsize=(w, h), dpi=150, facecolor="white")
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, xmax)
    ax.set_ylim(0, ymax)
    ax.axis("off")
    return fig, ax


def box(ax, x, y, w, h, fc, ec="none", r=1.2, lw=1.2):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={r}", fc=fc, ec=ec, lw=lw))


def arrow(ax, x1, y1, x2, y2, color=GREY):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=2, shrinkA=0, shrinkB=0))


# ---------------------------------------------------------------- process
def fig_process():
    fig, ax = canvas(7.6, 2.3, 120, 36)
    steps = [
        ("1", "Conceptualize", "scenario, KPIs,\ndata sources", BLUE),
        ("2", "Prepare\ndata", "clean, validate,\nmodel", TEAL),
        ("3", "Build in\nSAP HANA", "tables, views,\nchecks", NAVY),
        ("4", "Design", "wireframes,\nchart choice,\nfilters", ORANGE),
        ("5", "Implement", "connect Tableau,\nbuild, test", GREEN),
        ("6", "Document", "report, README,\nGitHub", "#7A4FA3"),
    ]
    w, gap, x0 = 16.2, 3.4, 2.0
    for i, (n, ttl, sub, c) in enumerate(steps):
        x = x0 + i * (w + gap)
        box(ax, x, 3, w, 31, c)
        ax.text(x + w / 2, 29, n, color="white", ha="center", va="center", fontsize=14, fontweight="bold")
        ax.text(x + w / 2, 21.5, ttl, color="white", ha="center", va="center", fontsize=8.2, fontweight="bold", linespacing=1.2)
        ax.text(x + w / 2, 10.5, sub, color="white", ha="center", va="center", fontsize=7.2, linespacing=1.3)
        if i < len(steps) - 1:
            arrow(ax, x + w + 0.3, 18.5, x + w + gap - 0.3, 18.5)
    fig.savefig(OUT / "fig_process.png")
    plt.close(fig)


# ----------------------------------------------------------- architecture
def fig_architecture():
    fig, ax = canvas(7.6, 3.4, 120, 46)
    cols = [
        (1.5, "Source files", "5 Excel files\nsales, customers,\ndates, location,\nproduct\n(9,994 rows each)", GREY),
        (21.5, "Clean and check", "Python script\n01_prepare_data.py\n\nfixes dates, keys,\npostal codes", TEAL),
        (41.5, "Load files", "6 CSV files\n\n1 fact table\n5 dimensions", BLUE),
        (61.5, "SAP HANA", "schema SUPERSTORE\n\n6 column tables\nview\nV_SALES_ENRICHED", NAVY),
        (81.5, "Tableau Desktop", "live connection\n(SAP HANA\nconnector + ODBC)\n\nworksheets, filters", ORANGE),
        (101.5, "Users", "2-page dashboard\n\nmanagement,\nsales managers,\nanalysts", GREEN),
    ]
    w = 17
    for i, (x, title, body, c) in enumerate(cols):
        box(ax, x, 12, w, 28, "white", ec=c, lw=2.2)
        box(ax, x, 33, w, 7, c, r=1.2)
        ax.text(x + w / 2, 36.5, title, color="white", ha="center", va="center", fontsize=7.8, fontweight="bold")
        ax.text(x + w / 2, 22.5, body, ha="center", va="center", fontsize=7.0, color=NAVY, linespacing=1.35)
        if i < len(cols) - 1:
            arrow(ax, x + w + 0.2, 26, cols[i + 1][0] - 0.2, 26)
    ax.text(60, 6.5, "SAP HANA calculates sums, joins and filters. The tool receives only the aggregated result.",
            ha="center", va="center", fontsize=7.4, color=GREY, style="italic")
    fig.savefig(OUT / "fig_architecture.png")
    plt.close(fig)


# ------------------------------------------------------------ star schema
def fig_star():
    fig, ax = canvas(8.0, 6.3, 120, 94)
    RH, HH = 3.3, 5.0
    DY = 14  # shift everything up so the bottom table fits

    def table(x, ytop, w, name, rows, color, keys=()):
        h = HH + RH * len(rows) + 1.2
        y = ytop - h
        box(ax, x, y, w, h, "white", ec=color, lw=2)
        ax.add_patch(Rectangle((x, ytop - HH), w, HH, fc=color, ec="none"))
        ax.text(x + w / 2, ytop - HH / 2, name, color="white", ha="center", va="center", fontsize=8.4, fontweight="bold")
        pos = {}
        for i, r in enumerate(rows):
            yy = ytop - HH - RH * (i + 0.5) - 0.4
            is_key = r in keys
            ax.text(x + 1.3, yy, r, fontsize=7.4, va="center", color=NAVY, fontweight="bold" if is_key else "normal")
            pos[r.split()[0]] = yy
        return dict(x=x, y=y, w=w, h=h, ytop=ytop, pos=pos)

    fact_rows = ["SALES_ID  (PK)", "ORDER_ID  (FK)", "ORDER_DATE  (FK)", "CUSTOMER_ID  (FK)", "PRODUCT_KEY  (FK)",
                 "GEO_KEY  (FK)", "SALES", "QUANTITY", "DISCOUNT", "PROFIT"]
    fact = table(43, 66 + DY, 34, "FACT_SALES   9,994 rows", fact_rows, NAVY, keys=fact_rows[:6])
    d_date = table(2, 76 + DY, 31, "DIM_DATE   1,461 rows",
                   ["CAL_DATE  (PK)", "CAL_YEAR", "CAL_QUARTER", "CAL_MONTH", "MONTH_NAME", "YEAR_MONTH"], BLUE, keys=["CAL_DATE  (PK)"])
    d_cust = table(2, 36 + DY, 31, "DIM_CUSTOMER   793 rows",
                   ["CUSTOMER_ID  (PK)", "CUSTOMER_NAME", "SEGMENT"], TEAL, keys=["CUSTOMER_ID  (PK)"])
    d_ord = table(87, 76 + DY, 31, "DIM_ORDER   5,009 rows",
                  ["ORDER_ID  (PK)", "ORDER_DATE", "SHIP_DATE", "SHIP_MODE", "SHIP_DAYS"], ORANGE, keys=["ORDER_ID  (PK)"])
    d_prod = table(87, 42 + DY, 31, "DIM_PRODUCT   1,894 rows",
                   ["PRODUCT_KEY  (PK)", "PRODUCT_ID", "PRODUCT_NAME", "CATEGORY", "SUB_CATEGORY"], "#7A4FA3", keys=["PRODUCT_KEY  (PK)"])
    d_geo = table(43, 15.5 + DY - 1, 34, "DIM_GEOGRAPHY   632 rows",
                  ["GEO_KEY  (PK)", "POSTAL_CODE", "COUNTRY", "CITY", "STATE", "REGION"], GREEN, keys=["GEO_KEY  (PK)"])

    def link(x1, y1, x2, y2, label, lx, ly):
        ax.plot([x1, x2], [y1, y2], color=GREY, lw=1.6, zorder=0)
        ax.text(x1 + (0.8 if x2 > x1 else -0.8), y1 + 1.2, "1", fontsize=8, color=GREY, ha="center", fontweight="bold")
        ax.text(x2 + (-0.8 if x2 > x1 else 0.8), y2 + 1.2, "N", fontsize=8, color=GREY, ha="center", fontweight="bold")
        ax.text((x1 + x2) / 2, (y1 + y2) / 2, label, fontsize=7, color=GREY, ha="center", va="center",
                style="italic", bbox=dict(fc="white", ec="none", pad=1.5))

    link(d_date["x"] + d_date["w"], d_date["pos"]["CAL_DATE"], fact["x"], fact["pos"]["ORDER_DATE"],
         "ORDER_DATE = CAL_DATE", 38, 56.2)
    link(d_cust["x"] + d_cust["w"], d_cust["pos"]["CUSTOMER_ID"], fact["x"], fact["pos"]["CUSTOMER_ID"],
         "CUSTOMER_ID", 38, 35.2)
    link(d_ord["x"], d_ord["pos"]["ORDER_ID"], fact["x"] + fact["w"], fact["pos"]["ORDER_ID"],
         "ORDER_ID", 82, 62.2)
    link(d_prod["x"], d_prod["pos"]["PRODUCT_KEY"], fact["x"] + fact["w"], fact["pos"]["PRODUCT_KEY"],
         "PRODUCT_KEY", 82, 43.2)
    # geography sits below the fact table
    ax.plot([60, 60], [d_geo["ytop"], fact["y"]], color=GREY, lw=1.6, zorder=0)
    ax.text(60.8, fact["y"] - 1.9, "N", fontsize=8, color=GREY, fontweight="bold")
    ax.text(60.8, d_geo["ytop"] + 0.6, "1", fontsize=8, color=GREY, fontweight="bold")
    ax.text(62.5, (d_geo["ytop"] + fact["y"]) / 2, "GEO_KEY", fontsize=7, color=GREY, style="italic", va="center")
    ax.text(60, 92, "One fact table (one row = one product on one order) and five dimensions. 1 = one row, N = many rows.",
            ha="center", fontsize=7.4, color=GREY, style="italic")
    fig.savefig(OUT / "fig_star_schema.png")
    plt.close(fig)


# -------------------------------------------------------------- wireframes
def wf_base(title):
    fig = plt.figure(figsize=(8.8, 4.95), dpi=200, facecolor="white")
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    return fig, ax


def region(ax, n, x, y, w, h, label, hint, fc="#F4F6F9", compact=False):
    ax.add_patch(Rectangle((x, y), w, h, fc=fc, ec="#6B7684", lw=1.0, ls=(0, (5, 3))))
    if n != "":
        ax.plot([x + 0.012], [y + h - 0.021], marker="o", ms=11, color=NAVY, mec="none", zorder=5)
        ax.text(x + 0.012, y + h - 0.021, str(n), color="white", ha="center", va="center", fontsize=7.5,
                fontweight="bold", zorder=6)
    if compact:
        ax.text(x + w / 2, y + h / 2, f"{label}   -   {hint}", ha="center", va="center", fontsize=7.6,
                color=NAVY, fontweight="bold")
        return
    ax.text(x + w / 2, y + h / 2 + 0.012, label, ha="center", va="center", fontsize=8.6, fontweight="bold", color=NAVY)
    ax.text(x + w / 2, y + h / 2 - 0.026, hint, ha="center", va="center", fontsize=7.0, color=GREY, linespacing=1.3)


def wireframe1():
    fig, ax = wf_base("Wireframe: page 1, Executive Overview")
    region(ax, 1, 0.012, 0.905, 0.976, 0.075, "HEADER", "dashboard title, data source note, page tabs", "#E9EDF3", compact=True)
    region(ax, 2, 0.012, 0.835, 0.976, 0.055, "FILTER BAR", "Year  |  Region  |  Category  |  Segment   (apply to every chart on both pages)", compact=True)
    cw = (0.976 - 5 * 0.010) / 6
    names = ["Total Sales", "Total Profit", "Profit Margin", "Orders", "Avg Order Value", "Active Customers"]
    for i, nme in enumerate(names):
        region(ax, 3 if i == 0 else "", 0.012 + i * (cw + 0.010), 0.700, cw, 0.120, "KPI CARD", f"{nme}\n+ change vs prior year")
    region(ax, 4, 0.012, 0.375, 0.600, 0.310, "LINE CHART", "Monthly sales, one line per year\n(trend and seasonality)")
    region(ax, 5, 0.622, 0.375, 0.366, 0.310, "BAR CHART", "Sales by region\n(label shows profit margin)")
    region(ax, 6, 0.012, 0.040, 0.300, 0.320, "DONUT CHART", "Sales by category\n(3 slices, label shows margin)")
    region(ax, 7, 0.322, 0.040, 0.330, 0.320, "COLUMN CHART", "Sales by customer segment")
    region(ax, 8, 0.662, 0.040, 0.326, 0.320, "BAR CHART", "Ship mode: share of order lines\nand average days to ship")
    ax.text(0.5, 0.015, "Reading order: header and filters, then KPIs (1 to 3), trend and region (4, 5), then composition: category, segment, shipping (6 to 8)",
            ha="center", fontsize=7, color=GREY, style="italic")
    fig.savefig(OUT / "fig_wireframe_page1.png")
    plt.close(fig)


def wireframe2():
    fig, ax = wf_base("Wireframe: page 2, Products & Customers")
    region(ax, 1, 0.012, 0.905, 0.976, 0.075, "HEADER", "dashboard title, data source note, page tabs", "#E9EDF3", compact=True)
    region(ax, 2, 0.012, 0.835, 0.976, 0.055, "FILTER BAR", "Year  |  Region  |  Category  |  Segment   (same filters as page 1)", compact=True)
    region(ax, 3, 0.012, 0.040, 0.345, 0.780, "BAR CHART", "Profit margin by sub-category\n(17 bars, losses in red)")
    region(ax, 4, 0.367, 0.440, 0.300, 0.380, "COLUMN CHART", "Profit margin by discount band\n(4 columns, losses in red)")
    region(ax, 5, 0.677, 0.440, 0.311, 0.380, "BAR CHART", "Top 8 states by sales\n(loss-making states in red)")
    region(ax, 6, 0.367, 0.040, 0.300, 0.390, "HEATMAP", "Profit margin: region x category\n(colour = margin, value in cell)")
    region(ax, 7, 0.677, 0.040, 0.311, 0.390, "TABLE", "Top 10 customers by sales\n(sales, profit, margin, orders)")
    ax.text(0.5, 0.015, "Purpose: explain WHY the headline numbers on page 1 look the way they do (profit drivers, geography, key accounts)",
            ha="center", fontsize=7, color=GREY, style="italic")
    fig.savefig(OUT / "fig_wireframe_page2.png")
    plt.close(fig)


# ---------------------------------------------------------------- date fix
def fig_date_fix():
    d = pd.read_excel(ROOT / "data" / "raw" / "dates.xlsx")

    def naive(v):
        return v if isinstance(v, (dt.datetime, pd.Timestamp)) else dt.datetime.strptime(str(v).strip(), "%m/%d/%Y")

    def fixed(v):
        if isinstance(v, (dt.datetime, pd.Timestamp)):
            return dt.datetime(v.year, v.day, v.month)
        return dt.datetime.strptime(str(v).strip(), "%m/%d/%Y")

    before = (d["Ship Date"].map(naive) - d["Order Date"].map(naive)).dt.days
    after = (d["Ship Date"].map(fixed) - d["Order Date"].map(fixed)).dt.days
    cats = ["Ships before it\nwas ordered", "0 to 7 days", "More than\n7 days"]

    def counts(s):
        return [int((s < 0).sum()), int(((s >= 0) & (s <= 7)).sum()), int((s > 7).sum())]

    cb, ca = counts(before), counts(after)
    fig, axes = plt.subplots(1, 2, figsize=(7.4, 3.2), dpi=200, sharey=True)
    for ax, vals, title in ((axes[0], cb, "Before the repair"),
                            (axes[1], ca, "After the repair")):
        bars = ax.bar(cats, vals, color=[RED, BLUE, ORANGE], width=0.58)
        for b, v in zip(bars, vals):
            ax.text(b.get_x() + b.get_width() / 2, v + 150, f"{v:,}", ha="center", fontsize=9, fontweight="bold", color=NAVY)
        ax.set_title(title, fontsize=9.5, fontweight="bold", color=NAVY, loc="left")
        ax.spines[["top", "right"]].set_visible(False)
        ax.tick_params(labelsize=7.6, colors=NAVY)
    axes[0].set_ylabel("Order lines", color=GREY, fontsize=8)
    axes[0].set_ylim(0, 11500)
    fig.tight_layout()
    fig.savefig(OUT / "fig_date_fix.png")
    plt.close(fig)
    print("date fix counts before/after:", cb, ca)


if __name__ == "__main__":
    fig_process()
    fig_architecture()
    fig_star()
    wireframe1()
    wireframe2()
    fig_date_fix()
    print("Wrote", ", ".join(sorted(p.name for p in OUT.glob("*.png"))))
