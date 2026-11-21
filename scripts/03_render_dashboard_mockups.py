#!/usr/bin/env python3
"""Step 3: draw the two dashboard pages (mock-ups) from the KPI query results.

Input : docs/query_results/K*.csv   (created by 02_test_sql_on_sqlite.py)
Output: dashboard/page1_executive_overview.png
        dashboard/page2_products_and_customers.png

These images are MOCK-UPS drawn with matplotlib. They show the intended
design with the real numbers of the dataset. They are not screenshots of
Tableau, SAP Analytics Cloud or any other BI tool. Replace them with real
screenshots once the dashboard is built in your BI tool.
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.colors import TwoSlopeNorm
from matplotlib.patches import Rectangle

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "docs" / "query_results"
OUT = ROOT / "dashboard"
OUT.mkdir(exist_ok=True)

# palette: one fixed meaning per colour
BG, NAVY, BLUE, ORANGE, TEAL, GREEN, RED = (
    "#EEF1F6", "#1F3864", "#2E75B6", "#E07B10", "#1F9A8A", "#2E9E5B", "#C0392B")
GREY, LIGHT, BORDER = "#5B6573", "#E3E8F0", "#D5DBE5"
YEAR_COLORS = {2014: "#A9BEDD", 2015: "#7C9DCB", 2016: BLUE, 2017: ORANGE}
W, H = 16, 9
FOOT = ("Numbers: results of sql/06_kpi_queries.sql on the Superstore dataset (9,994 order lines, 2014-2017)   |   "
        "Mock-up drawn with Python (matplotlib), not a screenshot of a BI tool")


def q(name):
    return pd.read_csv(RES / f"{name}.csv")


def money(v, digits=1):
    sign, a = ("-" if v < 0 else ""), abs(v)
    if a >= 1e6:
        return f"{sign}${a / 1e6:.2f}M"
    if a >= 1e3:
        return f"{sign}${a / 1e3:.{digits}f}K"
    return f"{sign}${a:,.0f}"


def new_page(title, active):
    fig = plt.figure(figsize=(W, H), dpi=150, facecolor=BG)
    base = fig.add_axes([0, 0, 1, 1])
    base.set_xlim(0, 1)
    base.set_ylim(0, 1)
    base.axis("off")
    base.add_patch(Rectangle((0, 0.915), 1, 0.085, fc=NAVY, ec="none"))
    base.text(0.013, 0.962, title, color="white", fontsize=19, fontweight="bold", va="center")
    base.text(0.013, 0.931, "Source: SAP HANA schema SUPERSTORE (view V_SALES_ENRICHED)   |   "
              "9,994 order lines   |   orders 3 Jan 2014 to 30 Dec 2017",
              color="#C9D4E8", fontsize=9.5, va="center")
    for i, name in enumerate(["Executive Overview", "Products & Customers"]):
        x = 0.655 + i * 0.172
        on = (i == active)
        base.add_patch(Rectangle((x, 0.933), 0.165, 0.050, fc="white" if on else "#2F4B7C", ec="none"))
        base.text(x + 0.0825, 0.958, name, ha="center", va="center", fontsize=11,
                  fontweight="bold", color=NAVY if on else "white")
    base.text(0.013, 0.885, "FILTERS", fontsize=9, color=GREY, fontweight="bold", va="center")
    for i, (lab, val) in enumerate([("Year", "All (2014-2017)"), ("Region", "All"),
                                    ("Category", "All"), ("Segment", "All")]):
        x = 0.065 + i * 0.145
        base.add_patch(Rectangle((x, 0.865), 0.135, 0.041, fc="white", ec=BORDER, lw=1))
        base.text(x + 0.008, 0.8855, f"{lab}:", fontsize=9, color=GREY, va="center")
        base.text(x + 0.058, 0.8855, f"{val}  v", fontsize=9, color=NAVY, va="center", fontweight="bold")
    base.text(0.988, 0.885, "Selections filter every chart on both pages", fontsize=9, color=GREY,
              ha="right", va="center", style="italic")
    base.text(0.013, 0.012, FOOT, fontsize=8, color=GREY, va="bottom")
    return fig, base


def panel(fig, base, x, y, w, h, title, note, pad=(0.012, 0.03, 0.012, 0.075)):
    """White card with title; returns an axes for the chart inside it."""
    base.add_patch(Rectangle((x, y), w, h, fc="white", ec=BORDER, lw=1))
    base.text(x + 0.010, y + h - 0.030, title, fontsize=12.5, fontweight="bold", color=NAVY, va="center")
    base.text(x + w - 0.010, y + h - 0.030, note, fontsize=8.5, color=GREY, ha="right", va="center")
    l, b, r, t = pad
    ax = fig.add_axes([x + l, y + b, w - l - r, h - b - t])
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color(BORDER)
    ax.tick_params(colors=GREY, labelsize=9, length=0)
    ax.set_facecolor("white")
    return ax


def hbar(ax, labels, values, colors, texts, xmax=None):
    y = np.arange(len(labels))
    ax.barh(y, values, color=colors, height=0.62)
    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=10, color=NAVY)
    ax.invert_yaxis()
    ax.set_xticks([])
    ax.spines["bottom"].set_visible(False)
    lo = min(0, min(values))
    hi = xmax or max(values) * 1.5
    ax.set_xlim(lo * 1.0 if lo < 0 else 0, hi)
    for yi, v, t in zip(y, values, texts):
        if v >= 0:
            ax.text(v + (hi - lo) * 0.015, yi, t, va="center", ha="left", fontsize=9.5, color=NAVY)
        else:
            ax.text(v - (hi - lo) * 0.015, yi, t, va="center", ha="right", fontsize=9.5, color=NAVY)


def kpi_card(base, x, y, w, h, label, value, delta_txt, delta_up, color):
    base.add_patch(Rectangle((x, y), w, h, fc="white", ec=BORDER, lw=1))
    base.add_patch(Rectangle((x, y), 0.004, h, fc=color, ec="none"))
    base.text(x + 0.014, y + h - 0.025, label, fontsize=9.5, color=GREY, fontweight="bold", va="center")
    base.text(x + 0.014, y + h * 0.47, value, fontsize=26, color=NAVY, fontweight="bold", va="center")
    arrow = "\u25B2" if delta_up else "\u25BC"
    base.text(x + 0.014, y + 0.020, f"{arrow} {delta_txt}", fontsize=9.5, va="center",
              color=GREEN if delta_up else RED, fontweight="bold")


def page1():
    k1, k2 = q("K1").iloc[0], q("K2").set_index("CAL_YEAR")
    k3, k4, k5, k6, k7 = q("K3"), q("K4"), q("K5"), q("K6"), q("K7")
    fig, base = new_page("Superstore Sales Performance Dashboard", 0)

    # KPI cards: totals for all years, change of the latest year against the year before
    a, b = k2.loc[2017], k2.loc[2016]
    pct = lambda x, y: 100 * (x / y - 1)
    cards = [
        ("TOTAL SALES", money(k1.TOTAL_SALES), f"{pct(a.TOTAL_SALES, b.TOTAL_SALES):+.1f}%  2017 vs 2016", pct(a.TOTAL_SALES, b.TOTAL_SALES) >= 0, BLUE),
        ("TOTAL PROFIT", money(k1.TOTAL_PROFIT), f"{pct(a.TOTAL_PROFIT, b.TOTAL_PROFIT):+.1f}%  2017 vs 2016", pct(a.TOTAL_PROFIT, b.TOTAL_PROFIT) >= 0, GREEN),
        ("PROFIT MARGIN", f"{k1.PROFIT_MARGIN_PCT:.1f}%", f"{a.PROFIT_MARGIN_PCT - b.PROFIT_MARGIN_PCT:+.1f} pts  2017 vs 2016", a.PROFIT_MARGIN_PCT >= b.PROFIT_MARGIN_PCT, ORANGE),
        ("ORDERS", f"{int(k1.ORDERS):,}", f"{pct(a.ORDERS, b.ORDERS):+.1f}%  2017 vs 2016", a.ORDERS >= b.ORDERS, TEAL),
        ("AVG ORDER VALUE", f"${k1.AVG_ORDER_VALUE:,.2f}", f"{pct(a.AVG_ORDER_VALUE, b.AVG_ORDER_VALUE):+.1f}%  2017 vs 2016", a.AVG_ORDER_VALUE >= b.AVG_ORDER_VALUE, BLUE),
        ("ACTIVE CUSTOMERS", f"{int(k1.ACTIVE_CUSTOMERS):,}", f"{pct(a.ACTIVE_CUSTOMERS, b.ACTIVE_CUSTOMERS):+.1f}%  2017 vs 2016", a.ACTIVE_CUSTOMERS >= b.ACTIVE_CUSTOMERS, NAVY),
    ]
    cw = (0.976 - 5 * 0.012) / 6
    for i, c in enumerate(cards):
        kpi_card(base, 0.012 + i * (cw + 0.012), 0.727, cw, 0.123, *c)

    # monthly sales by year (line chart)
    ax = panel(fig, base, 0.012, 0.385, 0.600, 0.328, "Monthly Sales by Year", "Line chart  |  one line per year",
               pad=(0.045, 0.03, 0.012, 0.075))
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for yr, g in k3.groupby("CAL_YEAR"):
        g = g.sort_values("CAL_MONTH")
        ax.plot(g.CAL_MONTH, g.TOTAL_SALES, color=YEAR_COLORS[yr], lw=3.2 if yr == 2017 else 2,
                marker="o", ms=4, label=str(yr), zorder=3 if yr == 2017 else 2)
    g17 = k3[k3.CAL_YEAR == 2017].sort_values("TOTAL_SALES").iloc[-1]
    ax.annotate(f"2017 peak: {money(g17.TOTAL_SALES, 0)} ({months[int(g17.CAL_MONTH) - 1]})",
                (g17.CAL_MONTH, g17.TOTAL_SALES), xytext=(g17.CAL_MONTH - 3.4, g17.TOTAL_SALES + 7000),
                fontsize=9, color=ORANGE, fontweight="bold",
                arrowprops=dict(arrowstyle="-", color=ORANGE, lw=0.8))
    ax.set_xticks(range(1, 13))
    ax.set_xticklabels(months)
    ax.set_ylim(0, k3.TOTAL_SALES.max() * 1.18)
    ax.yaxis.set_major_formatter(lambda v, _: f"${v / 1000:.0f}K")
    ax.grid(axis="y", color=LIGHT, lw=0.8)
    ax.set_axisbelow(True)
    ax.legend(ncol=4, frameon=False, loc="upper left", fontsize=9.5)

    # sales by region (bar chart, orange = lowest margin)
    ax = panel(fig, base, 0.628, 0.385, 0.360, 0.328, "Sales by Region", "Bar  |  label shows profit margin  |  orange = lowest margin",
               pad=(0.055, 0.03, 0.012, 0.075))
    low = k4.PROFIT_MARGIN_PCT.idxmin()
    hbar(ax, k4.REGION, k4.TOTAL_SALES, [ORANGE if i == low else BLUE for i in k4.index],
         [f"{money(s)}  margin {m:.1f}%" for s, m in zip(k4.TOTAL_SALES, k4.PROFIT_MARGIN_PCT)])

    # sales by category (donut)
    px, pw = 0.012, 0.300
    base.add_patch(Rectangle((px, 0.035), pw, 0.335, fc="white", ec=BORDER, lw=1))
    base.text(px + 0.010, 0.340, "Sales by Category", fontsize=12.5, fontweight="bold", color=NAVY, va="center")
    base.text(px + pw - 0.010, 0.340, "Donut  |  3 slices", fontsize=8.5, color=GREY, ha="right", va="center")
    ax = fig.add_axes([px + 0.005, 0.045, 0.135, 0.24])
    cat_color = {"Technology": BLUE, "Furniture": ORANGE, "Office Supplies": TEAL}
    ax.pie(k5.TOTAL_SALES, colors=[cat_color[c] for c in k5.CATEGORY], startangle=90, counterclock=False,
           wedgeprops=dict(width=0.38, edgecolor="white", linewidth=2))
    ax.text(0, 0.07, money(k1.TOTAL_SALES), ha="center", va="center", fontsize=13, fontweight="bold", color=NAVY)
    ax.text(0, -0.17, "total", ha="center", va="center", fontsize=9, color=GREY)
    for i, r in k5.iterrows():
        yy = 0.255 - i * 0.065
        base.add_patch(Rectangle((px + 0.152, yy - 0.010), 0.009, 0.016, fc=cat_color[r.CATEGORY], ec="none"))
        base.text(px + 0.167, yy + 0.004, r.CATEGORY, fontsize=10, fontweight="bold", color=NAVY, va="center")
        base.text(px + 0.167, yy - 0.019, f"{r.SHARE_OF_SALES_PCT:.0f}% of sales  |  margin {r.PROFIT_MARGIN_PCT:.1f}%",
                  fontsize=8.5, color=GREY, va="center")

    # sales by segment (column chart)
    ax = panel(fig, base, 0.324, 0.035, 0.320, 0.335, "Sales by Customer Segment", "Column")
    seg_color = [BLUE, BLUE, BLUE]
    ax.bar(k6.SEGMENT, k6.TOTAL_SALES, color=seg_color, width=0.58)
    for i, r in k6.iterrows():
        ax.text(i, r.TOTAL_SALES + k6.TOTAL_SALES.max() * 0.035, f"{money(r.TOTAL_SALES)}  |  {r.SHARE_OF_SALES_PCT:.0f}%",
                ha="center", fontsize=9.5, fontweight="bold", color=NAVY)
    ax.set_ylim(0, k6.TOTAL_SALES.max() * 1.15)
    ax.set_yticks([])
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="x", labelsize=10, colors=NAVY)

    # ship mode (bar chart)
    ax = panel(fig, base, 0.656, 0.035, 0.332, 0.335, "Ship Mode: Share of Order Lines", "Bar  |  average days to ship",
               pad=(0.090, 0.03, 0.012, 0.075))
    hbar(ax, k7.SHIP_MODE, k7.SHARE_OF_LINES_PCT, [BLUE, BLUE, BLUE, BLUE],
         [f"{s:.1f}%   avg {d:.1f} days" for s, d in zip(k7.SHARE_OF_LINES_PCT, k7.AVG_SHIP_DAYS)])

    fig.savefig(OUT / "page1_executive_overview.png", facecolor=BG)
    plt.close(fig)


def page2():
    k8, k9, k10, k11, k12 = q("K8"), q("K9"), q("K10"), q("K11"), q("K12")
    fig, base = new_page("Superstore Sales Performance Dashboard", 1)

    # sub-category margin (bar chart, red = loss)
    ax = panel(fig, base, 0.012, 0.035, 0.345, 0.815, "Profit Margin by Sub-Category", "Bar  |  red = loss-making",
               pad=(0.085, 0.03, 0.012, 0.075))
    hbar(ax, k8.SUB_CATEGORY, k8.PROFIT_MARGIN_PCT,
         [RED if v < 0 else BLUE for v in k8.PROFIT_MARGIN_PCT],
         [f"{v:.1f}%" for v in k8.PROFIT_MARGIN_PCT], xmax=58)
    ax.set_xlim(-18, 58)
    ax.axvline(0, color=GREY, lw=1)

    # discount band (column chart)
    ax = panel(fig, base, 0.373, 0.442, 0.300, 0.408, "Profit Margin by Discount Band", "Column  |  red = loss-making")
    v = k9.PROFIT_MARGIN_PCT
    ax.bar(k9.DISCOUNT_BAND, v, color=[RED if x < 0 else BLUE for x in v], width=0.58)
    for i, x in enumerate(v):
        ax.text(i, x + (4 if x >= 0 else -4), f"{x:.1f}%", ha="center", va="bottom" if x >= 0 else "top",
                fontsize=10, fontweight="bold", color=NAVY)
    ax.axhline(0, color=GREY, lw=1)
    ax.set_ylim(-100, 48)
    ax.set_yticks([])
    for s in ("left", "bottom"):
        ax.spines[s].set_visible(False)
    ax.tick_params(axis="x", labelsize=9.5, colors=NAVY, pad=2)
    ax.xaxis.set_ticks_position("top")

    # top states (bar chart)
    ax = panel(fig, base, 0.685, 0.442, 0.303, 0.408, "Top 8 States by Sales", "Bar  |  red = loss-making",
               pad=(0.085, 0.03, 0.012, 0.075))
    hbar(ax, k11.STATE, k11.TOTAL_SALES, [RED if p < 0 else BLUE for p in k11.TOTAL_PROFIT],
         [f"{money(s, 0)}  {m:.0f}%" for s, m in zip(k11.TOTAL_SALES, k11.PROFIT_MARGIN_PCT)], xmax=k11.TOTAL_SALES.max() * 1.55)

    # heatmap region x category
    ax = panel(fig, base, 0.373, 0.035, 0.300, 0.395, "Profit Margin: Region x Category", "Heatmap",
               pad=(0.080, 0.03, 0.012, 0.085))
    hm = k10.pivot(index="REGION", columns="CATEGORY", values="PROFIT_MARGIN_PCT")
    hm = hm.loc[["Central", "East", "South", "West"], ["Furniture", "Office Supplies", "Technology"]]
    ax.imshow(hm.values, cmap="RdYlGn", norm=TwoSlopeNorm(vcenter=0, vmin=-12, vmax=26), aspect="auto")
    ax.set_xticks(range(3))
    ax.set_xticklabels(hm.columns, fontsize=9.5, color=NAVY)
    ax.xaxis.set_ticks_position("top")
    ax.set_yticks(range(4))
    ax.set_yticklabels(hm.index, fontsize=10, color=NAVY)
    for s in ax.spines.values():
        s.set_visible(False)
    for i in range(4):
        for j in range(3):
            ax.text(j, i, f"{hm.values[i, j]:.1f}%", ha="center", va="center", fontsize=11.5,
                    fontweight="bold", color=NAVY)
    ax.set_xticks(np.arange(-.5, 3, 1), minor=True)
    ax.set_yticks(np.arange(-.5, 4, 1), minor=True)
    ax.grid(which="minor", color="white", lw=2.5)
    ax.tick_params(which="minor", length=0)

    # top customers (table)
    px, py, pw, ph = 0.685, 0.035, 0.303, 0.395
    base.add_patch(Rectangle((px, py), pw, ph, fc="white", ec=BORDER, lw=1))
    base.text(px + 0.010, py + ph - 0.030, "Top 10 Customers by Sales", fontsize=12.5, fontweight="bold", color=NAVY, va="center")
    base.text(px + pw - 0.010, py + ph - 0.030, "Table", fontsize=8.5, color=GREY, ha="right", va="center")
    cols = [("Customer", 0.010, "left"), ("Sales", 0.150, "right"), ("Profit", 0.205, "right"),
            ("Margin", 0.252, "right"), ("Orders", 0.296, "right")]
    top = py + ph - 0.068
    rh = 0.0285
    base.add_patch(Rectangle((px + 0.005, top - rh / 2), pw - 0.010, rh, fc=LIGHT, ec="none"))
    for name, dx, ha in cols:
        base.text(px + dx, top, name, fontsize=8.8, fontweight="bold", color=NAVY, ha=ha, va="center")
    for i, r in k12.iterrows():
        yy = top - (i + 1) * rh
        if i % 2 == 1:
            base.add_patch(Rectangle((px + 0.005, yy - rh / 2), pw - 0.010, rh, fc="#F6F8FB", ec="none"))
        cells = [r.CUSTOMER_NAME, money(r.TOTAL_SALES, 1), money(r.TOTAL_PROFIT, 1), f"{r.PROFIT_MARGIN_PCT:.1f}%", f"{int(r.ORDERS)}"]
        for (name, dx, ha), txt in zip(cols, cells):
            neg = name in ("Profit", "Margin") and r.TOTAL_PROFIT < 0
            base.text(px + dx, yy, txt, fontsize=8.8, color=RED if neg else NAVY, ha=ha, va="center",
                      fontweight="bold" if neg else "normal")

    fig.savefig(OUT / "page2_products_and_customers.png", facecolor=BG)
    plt.close(fig)


if __name__ == "__main__":
    page1()
    page2()
    print("Wrote dashboard/page1_executive_overview.png and dashboard/page2_products_and_customers.png")
