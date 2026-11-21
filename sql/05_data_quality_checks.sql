-- =====================================================================
-- 05_data_quality_checks.sql
-- Run after loading (02) and creating the views (04).
-- Each block starts with a tag line "-- [ID] title".
-- =====================================================================

-- [Q1] Row count of every table (expected: 793, 1894, 632, 5009, 1461, 9994)
SELECT 'DIM_CUSTOMER' AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM SUPERSTORE.DIM_CUSTOMER
UNION ALL SELECT 'DIM_PRODUCT',   COUNT(*) FROM SUPERSTORE.DIM_PRODUCT
UNION ALL SELECT 'DIM_GEOGRAPHY', COUNT(*) FROM SUPERSTORE.DIM_GEOGRAPHY
UNION ALL SELECT 'DIM_ORDER',     COUNT(*) FROM SUPERSTORE.DIM_ORDER
UNION ALL SELECT 'DIM_DATE',      COUNT(*) FROM SUPERSTORE.DIM_DATE
UNION ALL SELECT 'FACT_SALES',    COUNT(*) FROM SUPERSTORE.FACT_SALES;

-- [Q2] Integrity checks (every RESULT_VALUE must equal EXPECTED_VALUE)
SELECT CHECK_NAME, RESULT_VALUE, EXPECTED_VALUE,
       CASE WHEN RESULT_VALUE = EXPECTED_VALUE THEN 'PASS' ELSE 'FAIL' END AS STATUS
FROM (
    SELECT 'Fact rows without a customer' AS CHECK_NAME, COUNT(*) AS RESULT_VALUE, 0 AS EXPECTED_VALUE
      FROM SUPERSTORE.FACT_SALES f
      LEFT JOIN SUPERSTORE.DIM_CUSTOMER c ON f.CUSTOMER_ID = c.CUSTOMER_ID
     WHERE c.CUSTOMER_ID IS NULL
    UNION ALL
    SELECT 'Fact rows without a product', COUNT(*), 0
      FROM SUPERSTORE.FACT_SALES f
      LEFT JOIN SUPERSTORE.DIM_PRODUCT p ON f.PRODUCT_KEY = p.PRODUCT_KEY
     WHERE p.PRODUCT_KEY IS NULL
    UNION ALL
    SELECT 'Fact rows without a location', COUNT(*), 0
      FROM SUPERSTORE.FACT_SALES f
      LEFT JOIN SUPERSTORE.DIM_GEOGRAPHY g ON f.GEO_KEY = g.GEO_KEY
     WHERE g.GEO_KEY IS NULL
    UNION ALL
    SELECT 'Fact rows without an order', COUNT(*), 0
      FROM SUPERSTORE.FACT_SALES f
      LEFT JOIN SUPERSTORE.DIM_ORDER o ON f.ORDER_ID = o.ORDER_ID
     WHERE o.ORDER_ID IS NULL
    UNION ALL
    SELECT 'Fact rows without a calendar date', COUNT(*), 0
      FROM SUPERSTORE.FACT_SALES f
      LEFT JOIN SUPERSTORE.DIM_DATE d ON f.ORDER_DATE = d.CAL_DATE
     WHERE d.CAL_DATE IS NULL
    UNION ALL
    SELECT 'Fact order date differs from DIM_ORDER', COUNT(*), 0
      FROM SUPERSTORE.FACT_SALES f
      JOIN SUPERSTORE.DIM_ORDER o ON f.ORDER_ID = o.ORDER_ID
     WHERE f.ORDER_DATE <> o.ORDER_DATE
    UNION ALL
    SELECT 'Duplicate SALES_ID values', COUNT(*) - COUNT(DISTINCT SALES_ID), 0
      FROM SUPERSTORE.FACT_SALES
    UNION ALL
    SELECT 'Orders shipped before they were ordered', COUNT(*), 0
      FROM SUPERSTORE.DIM_ORDER
     WHERE SHIP_DATE < ORDER_DATE
    UNION ALL
    SELECT 'Sales or quantity zero or negative', COUNT(*), 0
      FROM SUPERSTORE.FACT_SALES
     WHERE SALES <= 0 OR QUANTITY <= 0
    UNION ALL
    SELECT 'Discount outside 0 to 1', COUNT(*), 0
      FROM SUPERSTORE.FACT_SALES
     WHERE DISCOUNT < 0 OR DISCOUNT > 1
    UNION ALL
    SELECT 'Rows in V_SALES_ENRICHED minus rows in FACT_SALES',
           COUNT(*) - (SELECT COUNT(*) FROM SUPERSTORE.FACT_SALES), 0
      FROM SUPERSTORE.V_SALES_ENRICHED
    UNION ALL
    SELECT 'Sales in V_SALES_ENRICHED minus sales in FACT_SALES (rounded)',
           ROUND(SUM(SALES) - (SELECT SUM(SALES) FROM SUPERSTORE.FACT_SALES), 2), 0
      FROM SUPERSTORE.V_SALES_ENRICHED
) CHECKS;

-- [Q3] Known quirks of the source data (information only, handled by the design)
SELECT ITEM, AFFECTED, HOW_IT_IS_HANDLED
FROM (
    SELECT 'Product IDs that have more than one product name' AS ITEM,
           COUNT(*) AS AFFECTED,
           'Surrogate key PRODUCT_KEY in DIM_PRODUCT' AS HOW_IT_IS_HANDLED
      FROM (SELECT PRODUCT_ID FROM SUPERSTORE.DIM_PRODUCT GROUP BY PRODUCT_ID HAVING COUNT(*) > 1) X
    UNION ALL
    SELECT 'Postal codes that appear with more than one city or state',
           COUNT(*),
           'Surrogate key GEO_KEY in DIM_GEOGRAPHY'
      FROM (SELECT POSTAL_CODE FROM SUPERSTORE.DIM_GEOGRAPHY GROUP BY POSTAL_CODE HAVING COUNT(*) > 1) Y
    UNION ALL
    SELECT 'Orders whose ID year differs from the order-date year',
           COUNT(*),
           'Left as in the source: the order date is used for all time analysis'
      FROM SUPERSTORE.DIM_ORDER o
      JOIN SUPERSTORE.DIM_DATE d ON o.ORDER_DATE = d.CAL_DATE
     WHERE SUBSTR(o.ORDER_ID, 4, 4) <> CAST(d.CAL_YEAR AS VARCHAR(4))
    UNION ALL
    SELECT 'Order lines with a negative profit (loss-making lines)',
           COUNT(*),
           'Kept: they are real business results and are analysed on the dashboard'
      FROM SUPERSTORE.FACT_SALES
     WHERE PROFIT < 0
) QUIRKS;
