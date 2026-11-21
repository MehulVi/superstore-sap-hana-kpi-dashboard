-- =====================================================================
-- 01_create_schema_and_tables.sql
-- Star schema for the Superstore KPI dashboard in SAP HANA.
--   1 fact table  : FACT_SALES  (one row = one product on one order)
--   5 dimensions  : DIM_CUSTOMER, DIM_PRODUCT, DIM_GEOGRAPHY, DIM_ORDER, DIM_DATE
-- Run as a user that may create schemas. In SAP HANA Cloud you can run this
-- in the Database Explorer SQL console.
-- =====================================================================

CREATE SCHEMA SUPERSTORE;

CREATE COLUMN TABLE SUPERSTORE.DIM_CUSTOMER (
    CUSTOMER_ID    NVARCHAR(20)  NOT NULL PRIMARY KEY,
    CUSTOMER_NAME  NVARCHAR(100) NOT NULL,
    SEGMENT        NVARCHAR(20)  NOT NULL
);

-- PRODUCT_ID alone is not unique in the source data (32 IDs carry two names),
-- so a surrogate key is used as primary key.
CREATE COLUMN TABLE SUPERSTORE.DIM_PRODUCT (
    PRODUCT_KEY    INTEGER       NOT NULL PRIMARY KEY,
    PRODUCT_ID     NVARCHAR(20)  NOT NULL,
    PRODUCT_NAME   NVARCHAR(200) NOT NULL,
    CATEGORY       NVARCHAR(30)  NOT NULL,
    SUB_CATEGORY   NVARCHAR(30)  NOT NULL
);

-- POSTAL_CODE alone is not unique (one code has two city/state values).
CREATE COLUMN TABLE SUPERSTORE.DIM_GEOGRAPHY (
    GEO_KEY        INTEGER       NOT NULL PRIMARY KEY,
    POSTAL_CODE    NVARCHAR(5)   NOT NULL,
    COUNTRY        NVARCHAR(40)  NOT NULL,
    CITY           NVARCHAR(60)  NOT NULL,
    STATE          NVARCHAR(40)  NOT NULL,
    REGION         NVARCHAR(20)  NOT NULL
);

CREATE COLUMN TABLE SUPERSTORE.DIM_ORDER (
    ORDER_ID       NVARCHAR(20)  NOT NULL PRIMARY KEY,
    ORDER_DATE     DATE          NOT NULL,
    SHIP_DATE      DATE          NOT NULL,
    SHIP_MODE      NVARCHAR(20)  NOT NULL,
    SHIP_DAYS      INTEGER       NOT NULL
);

CREATE COLUMN TABLE SUPERSTORE.DIM_DATE (
    CAL_DATE       DATE          NOT NULL PRIMARY KEY,
    CAL_YEAR       INTEGER       NOT NULL,
    CAL_QUARTER    INTEGER       NOT NULL,
    CAL_MONTH      INTEGER       NOT NULL,
    MONTH_NAME     NVARCHAR(12)  NOT NULL,
    YEAR_MONTH     NVARCHAR(7)   NOT NULL
);

-- ORDER_DATE is repeated in the fact table so that it can be joined to
-- DIM_DATE directly.
CREATE COLUMN TABLE SUPERSTORE.FACT_SALES (
    SALES_ID       INTEGER       NOT NULL PRIMARY KEY,
    ORDER_ID       NVARCHAR(20)  NOT NULL,
    ORDER_DATE     DATE          NOT NULL,
    CUSTOMER_ID    NVARCHAR(20)  NOT NULL,
    PRODUCT_KEY    INTEGER       NOT NULL,
    GEO_KEY        INTEGER       NOT NULL,
    SALES          DECIMAL(15,4) NOT NULL,
    QUANTITY       INTEGER       NOT NULL,
    DISCOUNT       DECIMAL(4,2)  NOT NULL,
    PROFIT         DECIMAL(15,4) NOT NULL
);
