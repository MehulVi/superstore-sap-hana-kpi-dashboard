-- =====================================================================
-- 04_create_views.sql
-- Two views for the dashboard tool (Tableau, SAP Analytics Cloud, Power BI).
--
-- V_SALES_ENRICHED : one flat row per order line with every attribute and
--                    measure a chart needs. Connect the dashboard to this view.
-- V_KPI_MONTHLY    : a small pre-aggregated view (month x region x category x
--                    segment) for fast overview pages.
--                    Note: ORDERS is a distinct count and must not be summed
--                    across groups. Use V_SALES_ENRICHED for order counts.
-- =====================================================================

CREATE VIEW SUPERSTORE.V_SALES_ENRICHED AS
SELECT
    f.SALES_ID,
    f.ORDER_ID,
    f.ORDER_DATE,
    d.CAL_YEAR,
    d.CAL_QUARTER,
    d.CAL_MONTH,
    d.MONTH_NAME,
    d.YEAR_MONTH,
    o.SHIP_DATE,
    o.SHIP_MODE,
    o.SHIP_DAYS,
    f.CUSTOMER_ID,
    c.CUSTOMER_NAME,
    c.SEGMENT,
    p.PRODUCT_ID,
    p.PRODUCT_NAME,
    p.CATEGORY,
    p.SUB_CATEGORY,
    g.POSTAL_CODE,
    g.CITY,
    g.STATE,
    g.REGION,
    g.COUNTRY,
    f.QUANTITY,
    f.DISCOUNT,
    CASE WHEN f.DISCOUNT = 0   THEN 'No discount'
         WHEN f.DISCOUNT <= 0.2 THEN 'Up to 20%'
         WHEN f.DISCOUNT <= 0.4 THEN '21-40%'
         ELSE 'Above 40%' END AS DISCOUNT_BAND,
    CASE WHEN f.DISCOUNT = 0   THEN 1
         WHEN f.DISCOUNT <= 0.2 THEN 2
         WHEN f.DISCOUNT <= 0.4 THEN 3
         ELSE 4 END AS DISCOUNT_BAND_SORT,
    f.SALES,
    f.PROFIT
FROM SUPERSTORE.FACT_SALES f
JOIN SUPERSTORE.DIM_CUSTOMER  c ON f.CUSTOMER_ID = c.CUSTOMER_ID
JOIN SUPERSTORE.DIM_PRODUCT   p ON f.PRODUCT_KEY = p.PRODUCT_KEY
JOIN SUPERSTORE.DIM_GEOGRAPHY g ON f.GEO_KEY     = g.GEO_KEY
JOIN SUPERSTORE.DIM_ORDER     o ON f.ORDER_ID    = o.ORDER_ID
JOIN SUPERSTORE.DIM_DATE      d ON f.ORDER_DATE  = d.CAL_DATE;

CREATE VIEW SUPERSTORE.V_KPI_MONTHLY AS
SELECT
    CAL_YEAR,
    CAL_QUARTER,
    CAL_MONTH,
    YEAR_MONTH,
    REGION,
    CATEGORY,
    SEGMENT,
    SUM(SALES)                AS TOTAL_SALES,
    SUM(PROFIT)               AS TOTAL_PROFIT,
    SUM(QUANTITY)             AS TOTAL_QUANTITY,
    COUNT(*)                  AS ORDER_LINES,
    COUNT(DISTINCT ORDER_ID)  AS ORDERS
FROM SUPERSTORE.V_SALES_ENRICHED
GROUP BY CAL_YEAR, CAL_QUARTER, CAL_MONTH, YEAR_MONTH, REGION, CATEGORY, SEGMENT;
