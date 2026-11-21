# Connecting a dashboard tool to SAP HANA

The dashboard reads from one view: `SUPERSTORE.V_SALES_ENRICHED`. All KPI logic is in the
queries of `sql/06_kpi_queries.sql`, and the numbers on the dashboard must match them.

Menu names differ between product versions. Check the current documentation of your tool if a step does not match.

## Tableau Desktop (SAP HANA connector)

1. Install the **SAP HANA client / ODBC driver** from SAP on the computer that runs Tableau. The connector does not work without it.
2. In Tableau: **Connect > To a Server > SAP HANA**. Enter the server and port of your HANA instance (for SAP HANA Cloud use the SQL endpoint, port 443), choose username and password, and tick **Require SSL** for HANA Cloud.
3. Select the schema `SUPERSTORE` and drag `V_SALES_ENRICHED` onto the canvas. Choose **Live** to send queries to SAP HANA each time, or **Extract** for a snapshot.
4. Create calculated fields. Always divide sums, never average line margins:

| Field | Formula |
| --- | --- |
| Profit Margin | `SUM([PROFIT]) / SUM([SALES])` |
| Orders | `COUNTD([ORDER_ID])` |
| Avg Order Value | `SUM([SALES]) / COUNTD([ORDER_ID])` |
| Active Customers | `COUNTD([CUSTOMER_ID])` |

5. Build one worksheet per visual (table below), then assemble the two dashboard pages as in `dashboard/`.
6. Add the four filters (`CAL_YEAR`, `REGION`, `CATEGORY`, `SEGMENT`) and apply them to all worksheets using this data source.

## SAP Analytics Cloud (live connection)

SAP Analytics Cloud live models read **calculation views** from SAP HANA, so a graphical calculation view is
needed on top of the tables (check the current SAP documentation for the exact requirements).

1. In SAP HANA (Business Application Studio or Web IDE), create a calculation view of type Cube. Join `FACT_SALES` with the five dimension tables as in the data model, and define `SALES`, `PROFIT` and `QUANTITY` as measures (sum). Add `ORDER_ID` and `CUSTOMER_ID` as attributes for the distinct counts.
2. In SAP Analytics Cloud: create a **live data connection** to SAP HANA, then create a **live model** on the calculation view.
3. Build the two pages as a story with the visuals below and the four filters.

## Visual to query to fields

| Visual | Query | Chart type | Fields |
| --- | --- | --- | --- |
| KPI cards | K1, K2 | Number tiles | Sales, Profit, Margin, Orders, Avg Order Value, Active Customers, change vs previous year |
| Monthly Sales by Year | K3 | Line | X = month, Y = sales, colour = year |
| Sales by Region | K4 | Bar | Region, sales, label = margin |
| Sales by Category | K5 | Donut | Category, sales |
| Sales by Customer Segment | K6 | Column | Segment, sales |
| Ship Mode | K7 | Bar | Ship mode, share of order lines, average ship days |
| Margin by Sub-Category | K8 | Bar | Sub-category, margin, red when negative |
| Margin by Discount Band | K9 | Column | Discount band (sorted by `DISCOUNT_BAND_SORT`), margin |
| Top 8 States | K11 | Bar | State, sales, red when profit is negative |
| Margin: Region x Category | K10 | Heatmap | Region, category, margin |
| Top 10 Customers | K12 | Table | Customer, sales, profit, margin, orders |

## Design rules used

- One message per visual, with the value shown as a label.
- Colour has a fixed meaning: **blue** = normal, **orange** = highlight or needs attention (latest year, lowest margin), **red** = loss, **green** = favourable change.
- Margin is always a ratio of sums, and orders and customers are distinct counts.
- Every number can be checked against a query in `sql/06_kpi_queries.sql`.
