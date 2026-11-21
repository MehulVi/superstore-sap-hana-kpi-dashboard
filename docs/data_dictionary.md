# Data dictionary

Schema `SUPERSTORE`. Source column names refer to the Excel files in `data/raw/`.

## FACT_SALES (9,994 rows): one row per product on one order

| Column | Type | Source | Description |
| --- | --- | --- | --- |
| SALES_ID | INTEGER, PK | sales.xlsx `Sales ID` | Row number of the order line |
| ORDER_ID | NVARCHAR(20), FK | sales.xlsx `Order ID` | Order the line belongs to |
| ORDER_DATE | DATE, FK | dates.xlsx `Order Date` (repaired) | Date of the order, used to join DIM_DATE |
| CUSTOMER_ID | NVARCHAR(20), FK | sales.xlsx `Customer ID` | Customer who placed the order |
| PRODUCT_KEY | INTEGER, FK | generated | Points to the product (ID and name) of this line |
| GEO_KEY | INTEGER, FK | generated | Points to the delivery location of this line |
| SALES | DECIMAL(15,4) | sales.xlsx `Sales` | Sales amount in US dollars |
| QUANTITY | INTEGER | sales.xlsx `Quantity` | Units sold |
| DISCOUNT | DECIMAL(4,2) | sales.xlsx `Discount` | Discount as a fraction (0.20 = 20%) |
| PROFIT | DECIMAL(15,4) | sales.xlsx `Profit` | Profit in US dollars (negative = loss) |

## DIM_CUSTOMER (793 rows)

| Column | Type | Description |
| --- | --- | --- |
| CUSTOMER_ID | NVARCHAR(20), PK | Customer business ID, for example `CG-12520` |
| CUSTOMER_NAME | NVARCHAR(100) | Customer name |
| SEGMENT | NVARCHAR(20) | Consumer, Corporate or Home Office |

## DIM_PRODUCT (1,894 rows)

| Column | Type | Description |
| --- | --- | --- |
| PRODUCT_KEY | INTEGER, PK | Generated key (PRODUCT_ID alone is not unique) |
| PRODUCT_ID | NVARCHAR(20) | Product business ID, for example `FUR-BO-10001798` |
| PRODUCT_NAME | NVARCHAR(200) | Product name |
| CATEGORY | NVARCHAR(30) | Furniture, Office Supplies or Technology |
| SUB_CATEGORY | NVARCHAR(30) | One of 17 sub-categories |

## DIM_GEOGRAPHY (632 rows)

| Column | Type | Description |
| --- | --- | --- |
| GEO_KEY | INTEGER, PK | Generated key (POSTAL_CODE alone is not unique) |
| POSTAL_CODE | NVARCHAR(5) | US postal code as text, leading zero kept |
| COUNTRY | NVARCHAR(40) | Always United States |
| CITY | NVARCHAR(60) | City |
| STATE | NVARCHAR(40) | State |
| REGION | NVARCHAR(20) | Central, East, South or West |

## DIM_ORDER (5,009 rows)

| Column | Type | Description |
| --- | --- | --- |
| ORDER_ID | NVARCHAR(20), PK | Order business ID, for example `CA-2016-152156` |
| ORDER_DATE | DATE | Date the order was placed (3 Jan 2014 to 30 Dec 2017) |
| SHIP_DATE | DATE | Date the order was shipped |
| SHIP_MODE | NVARCHAR(20) | Standard Class, Second Class, First Class or Same Day |
| SHIP_DAYS | INTEGER | Days from order to shipment (0 to 7), calculated in the preparation script |

## DIM_DATE (1,461 rows): calendar for 2014 to 2017

| Column | Type | Description |
| --- | --- | --- |
| CAL_DATE | DATE, PK | Calendar day |
| CAL_YEAR | INTEGER | Year |
| CAL_QUARTER | INTEGER | Quarter, 1 to 4 |
| CAL_MONTH | INTEGER | Month, 1 to 12 |
| MONTH_NAME | NVARCHAR(12) | English month name |
| YEAR_MONTH | NVARCHAR(7) | `YYYY-MM`, sorts correctly as text |

## Views

| View | Purpose |
| --- | --- |
| V_SALES_ENRICHED | One flat row per order line with all dimension attributes plus `DISCOUNT_BAND` (No discount, Up to 20%, 21-40%, Above 40%) and `DISCOUNT_BAND_SORT`. The dashboard connects to this view. |
| V_KPI_MONTHLY | Pre-aggregated by month, region, category and segment. `ORDERS` is a distinct count and must not be summed across groups. |
