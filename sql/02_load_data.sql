-- =====================================================================
-- 02_load_data.sql
-- Load the cleaned CSV files from data/clean/ (created by
-- scripts/01_prepare_data.py). Load the dimensions first, then the fact table.
--
-- OPTION A (easiest, works in SAP HANA Cloud and HANA Express)
--   SAP HANA Database Explorer -> right-click the table -> "Import Data"
--   -> "Import Data" -> choose the local CSV file -> match the columns.
--   Tick "The file has a header row".
--
-- OPTION B (server-side files): the statements below.
--   Replace /path/to/ with a directory on the HANA server that the database
--   is allowed to read. The CSV files use a header row, comma separators and
--   double quotes around values that contain commas.
-- =====================================================================

IMPORT FROM CSV FILE '/path/to/dim_customer.csv' INTO SUPERSTORE.DIM_CUSTOMER
  WITH RECORD DELIMITED BY '\n' FIELD DELIMITED BY ',' OPTIONALLY ENCLOSED BY '"'
       SKIP FIRST 1 ROW ERROR LOG '/path/to/dim_customer.err';

IMPORT FROM CSV FILE '/path/to/dim_product.csv' INTO SUPERSTORE.DIM_PRODUCT
  WITH RECORD DELIMITED BY '\n' FIELD DELIMITED BY ',' OPTIONALLY ENCLOSED BY '"'
       SKIP FIRST 1 ROW ERROR LOG '/path/to/dim_product.err';

IMPORT FROM CSV FILE '/path/to/dim_geography.csv' INTO SUPERSTORE.DIM_GEOGRAPHY
  WITH RECORD DELIMITED BY '\n' FIELD DELIMITED BY ',' OPTIONALLY ENCLOSED BY '"'
       SKIP FIRST 1 ROW ERROR LOG '/path/to/dim_geography.err';

IMPORT FROM CSV FILE '/path/to/dim_order.csv' INTO SUPERSTORE.DIM_ORDER
  WITH RECORD DELIMITED BY '\n' FIELD DELIMITED BY ',' OPTIONALLY ENCLOSED BY '"'
       SKIP FIRST 1 ROW ERROR LOG '/path/to/dim_order.err';

IMPORT FROM CSV FILE '/path/to/dim_date.csv' INTO SUPERSTORE.DIM_DATE
  WITH RECORD DELIMITED BY '\n' FIELD DELIMITED BY ',' OPTIONALLY ENCLOSED BY '"'
       SKIP FIRST 1 ROW ERROR LOG '/path/to/dim_date.err';

IMPORT FROM CSV FILE '/path/to/fact_sales.csv' INTO SUPERSTORE.FACT_SALES
  WITH RECORD DELIMITED BY '\n' FIELD DELIMITED BY ',' OPTIONALLY ENCLOSED BY '"'
       SKIP FIRST 1 ROW ERROR LOG '/path/to/fact_sales.err';

-- Expected row counts after loading:
--   DIM_CUSTOMER 793 | DIM_PRODUCT 1894 | DIM_GEOGRAPHY 632
--   DIM_ORDER 5009   | DIM_DATE 1461    | FACT_SALES 9994
