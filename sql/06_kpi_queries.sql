-- =====================================================================
-- 06_kpi_queries.sql
-- The queries behind every KPI card and chart of the dashboard, written
-- against SUPERSTORE.V_SALES_ENRICHED. Use them to check the dashboard:
-- the numbers on screen must equal the results of these queries.
--
-- KPI definitions
--   Total Sales        = SUM(SALES)
--   Total Profit       = SUM(PROFIT)
--   Profit Margin %    = 100 * SUM(PROFIT) / SUM(SALES)
--   Orders             = COUNT(DISTINCT ORDER_ID)         (not the number of lines)
--   Avg Order Value    = SUM(SALES) / COUNT(DISTINCT ORDER_ID)
--   Active Customers   = COUNT(DISTINCT CUSTOMER_ID)
--   Avg Ship Days      = average of SHIP_DAYS over orders / order lines
--   Sales YoY Growth % = 100 * (sales this year / sales last year - 1)
-- =====================================================================

-- [K1] Headline KPI cards, all years
SELECT ROUND(SUM(SALES), 2)                                   AS TOTAL_SALES,
       ROUND(SUM(PROFIT), 2)                                  AS TOTAL_PROFIT,
       ROUND(100.0 * SUM(PROFIT) / SUM(SALES), 2)             AS PROFIT_MARGIN_PCT,
       COUNT(DISTINCT ORDER_ID)                               AS ORDERS,
       ROUND(1.0 * SUM(SALES) / COUNT(DISTINCT ORDER_ID), 2)  AS AVG_ORDER_VALUE,
       COUNT(DISTINCT CUSTOMER_ID)                            AS ACTIVE_CUSTOMERS,
       (SELECT ROUND(AVG(1.0 * SHIP_DAYS), 2) FROM SUPERSTORE.DIM_ORDER) AS AVG_SHIP_DAYS_PER_ORDER
FROM SUPERSTORE.V_SALES_ENRICHED;

-- [K2] KPIs per year with year-on-year growth (card deltas)
SELECT CAL_YEAR,
       ROUND(SUM(SALES), 2)                                   AS TOTAL_SALES,
       ROUND(SUM(PROFIT), 2)                                  AS TOTAL_PROFIT,
       ROUND(100.0 * SUM(PROFIT) / SUM(SALES), 2)             AS PROFIT_MARGIN_PCT,
       COUNT(DISTINCT ORDER_ID)                               AS ORDERS,
       ROUND(1.0 * SUM(SALES) / COUNT(DISTINCT ORDER_ID), 2)  AS AVG_ORDER_VALUE,
       COUNT(DISTINCT CUSTOMER_ID)                            AS ACTIVE_CUSTOMERS,
       ROUND(100.0 * (SUM(SALES)  / LAG(SUM(SALES))  OVER (ORDER BY CAL_YEAR) - 1), 1) AS SALES_YOY_PCT,
       ROUND(100.0 * (SUM(PROFIT) / LAG(SUM(PROFIT)) OVER (ORDER BY CAL_YEAR) - 1), 1) AS PROFIT_YOY_PCT
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY CAL_YEAR
ORDER BY CAL_YEAR;

-- [K3] Monthly sales, one line per year (line chart)
SELECT CAL_YEAR, CAL_MONTH, MONTH_NAME,
       ROUND(SUM(SALES), 2) AS TOTAL_SALES
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY CAL_YEAR, CAL_MONTH, MONTH_NAME
ORDER BY CAL_YEAR, CAL_MONTH;

-- [K4] Sales and margin by region (bar chart)
SELECT REGION,
       ROUND(SUM(SALES), 2)                                         AS TOTAL_SALES,
       ROUND(SUM(PROFIT), 2)                                        AS TOTAL_PROFIT,
       ROUND(100.0 * SUM(PROFIT) / SUM(SALES), 2)                   AS PROFIT_MARGIN_PCT,
       ROUND(100.0 * SUM(SALES) / SUM(SUM(SALES)) OVER (), 1)       AS SHARE_OF_SALES_PCT
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY REGION
ORDER BY TOTAL_SALES DESC;

-- [K5] Sales and margin by category (donut chart)
SELECT CATEGORY,
       ROUND(SUM(SALES), 2)                                         AS TOTAL_SALES,
       ROUND(SUM(PROFIT), 2)                                        AS TOTAL_PROFIT,
       ROUND(100.0 * SUM(PROFIT) / SUM(SALES), 2)                   AS PROFIT_MARGIN_PCT,
       ROUND(100.0 * SUM(SALES) / SUM(SUM(SALES)) OVER (), 1)       AS SHARE_OF_SALES_PCT
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY CATEGORY
ORDER BY TOTAL_SALES DESC;

-- [K6] Sales and margin by customer segment (column chart)
SELECT SEGMENT,
       ROUND(SUM(SALES), 2)                                         AS TOTAL_SALES,
       ROUND(SUM(PROFIT), 2)                                        AS TOTAL_PROFIT,
       ROUND(100.0 * SUM(PROFIT) / SUM(SALES), 2)                   AS PROFIT_MARGIN_PCT,
       ROUND(100.0 * SUM(SALES) / SUM(SUM(SALES)) OVER (), 1)       AS SHARE_OF_SALES_PCT
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY SEGMENT
ORDER BY TOTAL_SALES DESC;

-- [K7] Ship mode: share of order lines and average days to ship (bar chart)
SELECT SHIP_MODE,
       COUNT(*)                                                     AS ORDER_LINES,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1)           AS SHARE_OF_LINES_PCT,
       ROUND(AVG(1.0 * SHIP_DAYS), 2)                               AS AVG_SHIP_DAYS
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY SHIP_MODE
ORDER BY ORDER_LINES DESC;

-- [K8] Profit margin by sub-category (bar chart, losses in red)
SELECT SUB_CATEGORY, CATEGORY,
       ROUND(SUM(SALES), 2)                                         AS TOTAL_SALES,
       ROUND(SUM(PROFIT), 2)                                        AS TOTAL_PROFIT,
       ROUND(100.0 * SUM(PROFIT) / SUM(SALES), 2)                   AS PROFIT_MARGIN_PCT
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY SUB_CATEGORY, CATEGORY
ORDER BY PROFIT_MARGIN_PCT DESC;

-- [K9] Profit margin by discount band (column chart)
SELECT DISCOUNT_BAND,
       COUNT(*)                                                     AS ORDER_LINES,
       ROUND(SUM(SALES), 2)                                         AS TOTAL_SALES,
       ROUND(SUM(PROFIT), 2)                                        AS TOTAL_PROFIT,
       ROUND(100.0 * SUM(PROFIT) / SUM(SALES), 2)                   AS PROFIT_MARGIN_PCT
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY DISCOUNT_BAND, DISCOUNT_BAND_SORT
ORDER BY DISCOUNT_BAND_SORT;

-- [K10] Profit margin by region and category (heatmap)
SELECT REGION, CATEGORY,
       ROUND(SUM(SALES), 2)                                         AS TOTAL_SALES,
       ROUND(100.0 * SUM(PROFIT) / SUM(SALES), 2)                   AS PROFIT_MARGIN_PCT
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY REGION, CATEGORY
ORDER BY REGION, CATEGORY;

-- [K11] Top 8 states by sales (bar chart)
SELECT STATE,
       ROUND(SUM(SALES), 2)                                         AS TOTAL_SALES,
       ROUND(SUM(PROFIT), 2)                                        AS TOTAL_PROFIT,
       ROUND(100.0 * SUM(PROFIT) / SUM(SALES), 2)                   AS PROFIT_MARGIN_PCT
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY STATE
ORDER BY TOTAL_SALES DESC
LIMIT 8;

-- [K12] Top 10 customers by sales (table)
SELECT CUSTOMER_NAME, SEGMENT,
       ROUND(SUM(SALES), 2)                                         AS TOTAL_SALES,
       ROUND(SUM(PROFIT), 2)                                        AS TOTAL_PROFIT,
       ROUND(100.0 * SUM(PROFIT) / SUM(SALES), 2)                   AS PROFIT_MARGIN_PCT,
       COUNT(DISTINCT ORDER_ID)                                     AS ORDERS
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY CUSTOMER_ID, CUSTOMER_NAME, SEGMENT
ORDER BY TOTAL_SALES DESC
LIMIT 10;

-- [K13] Loss-making order lines: how many and how much profit they remove
SELECT COUNT(*)                                                     AS LOSS_MAKING_LINES,
       ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM SUPERSTORE.V_SALES_ENRICHED), 1) AS SHARE_OF_ALL_LINES_PCT,
       ROUND(SUM(PROFIT), 2)                                        AS PROFIT_LOST
FROM SUPERSTORE.V_SALES_ENRICHED
WHERE PROFIT < 0;
