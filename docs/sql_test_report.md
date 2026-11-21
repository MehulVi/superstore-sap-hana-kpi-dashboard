# SQL test report

Engine: SQLite 3.45.1 (a stand-in test, **not SAP HANA**). The views and queries in `sql/04`, `sql/05` and `sql/06` were executed unchanged; the SAP HANA table definitions in `sql/01` were translated mechanically. Run the same files in SAP HANA and compare the results with this report.

## Data-quality checks (`sql/05_data_quality_checks.sql`)

### Q1: Row count of every table (expected: 793, 1894, 632, 5009, 1461, 9994)

| TABLE_NAME | ROW_COUNT |
| --- | --- |
| DIM_CUSTOMER | 793 |
| DIM_PRODUCT | 1,894 |
| DIM_GEOGRAPHY | 632 |
| DIM_ORDER | 5,009 |
| DIM_DATE | 1,461 |
| FACT_SALES | 9,994 |

### Q2: Integrity checks (every RESULT_VALUE must equal EXPECTED_VALUE)

| CHECK_NAME | RESULT_VALUE | EXPECTED_VALUE | STATUS |
| --- | --- | --- | --- |
| Fact rows without a customer | 0 | 0 | PASS |
| Fact rows without a product | 0 | 0 | PASS |
| Fact rows without a location | 0 | 0 | PASS |
| Fact rows without an order | 0 | 0 | PASS |
| Fact rows without a calendar date | 0 | 0 | PASS |
| Fact order date differs from DIM_ORDER | 0 | 0 | PASS |
| Duplicate SALES_ID values | 0 | 0 | PASS |
| Orders shipped before they were ordered | 0 | 0 | PASS |
| Sales or quantity zero or negative | 0 | 0 | PASS |
| Discount outside 0 to 1 | 0 | 0 | PASS |
| Rows in V_SALES_ENRICHED minus rows in FACT_SALES | 0 | 0 | PASS |
| Sales in V_SALES_ENRICHED minus sales in FACT_SALES (rounded) | 0 | 0 | PASS |

### Q3: Known quirks of the source data (information only, handled by the design)

| ITEM | AFFECTED | HOW_IT_IS_HANDLED |
| --- | --- | --- |
| Product IDs that have more than one product name | 32 | Surrogate key PRODUCT_KEY in DIM_PRODUCT |
| Postal codes that appear with more than one city or state | 1 | Surrogate key GEO_KEY in DIM_GEOGRAPHY |
| Orders whose ID year differs from the order-date year | 5 | Left as in the source: the order date is used for all time analysis |
| Order lines with a negative profit (loss-making lines) | 1,871 | Kept: they are real business results and are analysed on the dashboard |

## KPI queries (`sql/06_kpi_queries.sql`)

### K1: Headline KPI cards, all years

| TOTAL_SALES | TOTAL_PROFIT | PROFIT_MARGIN_PCT | ORDERS | AVG_ORDER_VALUE | ACTIVE_CUSTOMERS | AVG_SHIP_DAYS_PER_ORDER |
| --- | --- | --- | --- | --- | --- | --- |
| 2,297,200.86 | 286,397.02 | 12.47 | 5,009 | 458.61 | 793 | 3.96 |

### K2: KPIs per year with year-on-year growth (card deltas)

| CAL_YEAR | TOTAL_SALES | TOTAL_PROFIT | PROFIT_MARGIN_PCT | ORDERS | AVG_ORDER_VALUE | ACTIVE_CUSTOMERS | SALES_YOY_PCT | PROFIT_YOY_PCT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2,014 | 484,247.50 | 49,543.97 | 10.23 | 969 | 499.74 | 595 | - | - |
| 2,015 | 470,532.51 | 61,618.60 | 13.10 | 1,038 | 453.31 | 573 | -2.80 | 24.40 |
| 2,016 | 609,205.60 | 81,795.17 | 13.43 | 1,315 | 463.27 | 638 | 29.50 | 32.70 |
| 2,017 | 733,215.26 | 93,439.27 | 12.74 | 1,687 | 434.63 | 693 | 20.40 | 14.20 |

### K3: Monthly sales, one line per year (line chart)

| CAL_YEAR | CAL_MONTH | MONTH_NAME | TOTAL_SALES |
| --- | --- | --- | --- |
| 2,014 | 1 | January | 14,236.90 |
| 2,014 | 2 | February | 4,519.89 |
| 2,014 | 3 | March | 55,691.01 |
| 2,014 | 4 | April | 28,295.35 |
| 2,014 | 5 | May | 23,648.29 |
| 2,014 | 6 | June | 34,595.13 |
| 2,014 | 7 | July | 33,946.39 |
| 2,014 | 8 | August | 27,909.47 |
| 2,014 | 9 | September | 81,777.35 |
| 2,014 | 10 | October | 31,453.39 |
| 2,014 | 11 | November | 78,628.72 |
| 2,014 | 12 | December | 69,545.62 |
| 2,015 | 1 | January | 18,174.08 |
| 2,015 | 2 | February | 11,951.41 |
| 2,015 | 3 | March | 38,726.25 |
| 2,015 | 4 | April | 34,195.21 |
| 2,015 | 5 | May | 30,131.69 |
| 2,015 | 6 | June | 24,797.29 |
| 2,015 | 7 | July | 28,765.33 |
| 2,015 | 8 | August | 36,898.33 |
| 2,015 | 9 | September | 64,595.92 |
| 2,015 | 10 | October | 31,404.92 |
| 2,015 | 11 | November | 75,972.56 |
| 2,015 | 12 | December | 74,919.52 |
| 2,016 | 1 | January | 18,542.49 |
| 2,016 | 2 | February | 22,978.82 |
| 2,016 | 3 | March | 51,715.88 |
| 2,016 | 4 | April | 38,750.04 |
| 2,016 | 5 | May | 56,987.73 |
| 2,016 | 6 | June | 40,344.53 |
| 2,016 | 7 | July | 39,261.96 |
| 2,016 | 8 | August | 31,115.37 |
| 2,016 | 9 | September | 73,410.02 |
| 2,016 | 10 | October | 59,687.75 |
| 2,016 | 11 | November | 79,411.97 |
| 2,016 | 12 | December | 96,999.04 |
| 2,017 | 1 | January | 43,971.37 |
| 2,017 | 2 | February | 20,301.13 |
| 2,017 | 3 | March | 58,872.35 |
| 2,017 | 4 | April | 36,521.54 |
| 2,017 | 5 | May | 44,261.11 |
| 2,017 | 6 | June | 52,981.73 |
| 2,017 | 7 | July | 45,264.42 |
| 2,017 | 8 | August | 63,120.89 |
| 2,017 | 9 | September | 87,866.65 |
| 2,017 | 10 | October | 77,776.92 |
| 2,017 | 11 | November | 118,447.82 |
| 2,017 | 12 | December | 83,829.32 |

### K4: Sales and margin by region (bar chart)

| REGION | TOTAL_SALES | TOTAL_PROFIT | PROFIT_MARGIN_PCT | SHARE_OF_SALES_PCT |
| --- | --- | --- | --- | --- |
| West | 725,457.82 | 108,418.45 | 14.94 | 31.60 |
| East | 678,781.24 | 91,522.78 | 13.48 | 29.50 |
| Central | 501,239.89 | 39,706.36 | 7.92 | 21.80 |
| South | 391,721.91 | 46,749.43 | 11.93 | 17.10 |

### K5: Sales and margin by category (donut chart)

| CATEGORY | TOTAL_SALES | TOTAL_PROFIT | PROFIT_MARGIN_PCT | SHARE_OF_SALES_PCT |
| --- | --- | --- | --- | --- |
| Technology | 836,154.03 | 145,454.95 | 17.40 | 36.40 |
| Furniture | 741,999.80 | 18,451.27 | 2.49 | 32.30 |
| Office Supplies | 719,047.03 | 122,490.80 | 17.04 | 31.30 |

### K6: Sales and margin by customer segment (column chart)

| SEGMENT | TOTAL_SALES | TOTAL_PROFIT | PROFIT_MARGIN_PCT | SHARE_OF_SALES_PCT |
| --- | --- | --- | --- | --- |
| Consumer | 1,161,401.34 | 134,119.21 | 11.55 | 50.60 |
| Corporate | 706,146.37 | 91,979.13 | 13.03 | 30.70 |
| Home Office | 429,653.15 | 60,298.68 | 14.03 | 18.70 |

### K7: Ship mode: share of order lines and average days to ship (bar chart)

| SHIP_MODE | ORDER_LINES | SHARE_OF_LINES_PCT | AVG_SHIP_DAYS |
| --- | --- | --- | --- |
| Standard Class | 5,968 | 59.70 | 5.01 |
| Second Class | 1,945 | 19.50 | 3.24 |
| First Class | 1,538 | 15.40 | 2.18 |
| Same Day | 543 | 5.40 | 0.04 |

### K8: Profit margin by sub-category (bar chart, losses in red)

| SUB_CATEGORY | CATEGORY | TOTAL_SALES | TOTAL_PROFIT | PROFIT_MARGIN_PCT |
| --- | --- | --- | --- | --- |
| Labels | Office Supplies | 12,486.31 | 5,546.25 | 44.42 |
| Paper | Office Supplies | 78,479.21 | 34,053.57 | 43.39 |
| Envelopes | Office Supplies | 16,476.40 | 6,964.18 | 42.27 |
| Copiers | Technology | 149,528.03 | 55,617.82 | 37.20 |
| Fasteners | Office Supplies | 3,024.28 | 949.52 | 31.40 |
| Accessories | Technology | 167,380.32 | 41,936.64 | 25.05 |
| Art | Office Supplies | 27,118.79 | 6,527.79 | 24.07 |
| Appliances | Office Supplies | 107,532.16 | 18,138.01 | 16.87 |
| Binders | Office Supplies | 203,412.73 | 30,221.76 | 14.86 |
| Furnishings | Furniture | 91,705.16 | 13,059.14 | 14.24 |
| Phones | Technology | 330,007.05 | 44,515.73 | 13.49 |
| Storage | Office Supplies | 223,843.61 | 21,278.83 | 9.51 |
| Chairs | Furniture | 328,449.10 | 26,590.17 | 8.10 |
| Machines | Technology | 189,238.63 | 3,384.76 | 1.79 |
| Supplies | Office Supplies | 46,673.54 | -1,189.10 | -2.55 |
| Bookcases | Furniture | 114,880.00 | -3,472.56 | -3.02 |
| Tables | Furniture | 206,965.53 | -17,725.48 | -8.56 |

### K9: Profit margin by discount band (column chart)

| DISCOUNT_BAND | ORDER_LINES | TOTAL_SALES | TOTAL_PROFIT | PROFIT_MARGIN_PCT |
| --- | --- | --- | --- | --- |
| No discount | 4,798 | 1,087,908.47 | 320,987.60 | 29.51 |
| Up to 20% | 3,803 | 846,522.24 | 100,785.47 | 11.91 |
| 21-40% | 460 | 234,137.90 | -35,817.47 | -15.30 |
| Above 40% | 933 | 128,632.25 | -99,558.59 | -77.40 |

### K10: Profit margin by region and category (heatmap)

| REGION | CATEGORY | TOTAL_SALES | PROFIT_MARGIN_PCT |
| --- | --- | --- | --- |
| Central | Furniture | 163,797.16 | -1.75 |
| Central | Office Supplies | 167,026.42 | 5.32 |
| Central | Technology | 170,416.31 | 19.77 |
| East | Furniture | 208,291.20 | 1.46 |
| East | Office Supplies | 205,516.05 | 19.96 |
| East | Technology | 264,973.98 | 17.91 |
| South | Furniture | 117,298.68 | 5.77 |
| South | Office Supplies | 125,651.31 | 15.91 |
| South | Technology | 148,771.91 | 13.44 |
| West | Furniture | 252,612.74 | 4.55 |
| West | Office Supplies | 220,853.25 | 23.82 |
| West | Technology | 251,991.83 | 17.58 |

### K11: Top 8 states by sales (bar chart)

| STATE | TOTAL_SALES | TOTAL_PROFIT | PROFIT_MARGIN_PCT |
| --- | --- | --- | --- |
| California | 457,687.63 | 76,381.39 | 16.69 |
| New York | 310,876.27 | 74,038.55 | 23.82 |
| Texas | 170,188.05 | -25,729.36 | -15.12 |
| Washington | 138,641.27 | 33,402.65 | 24.09 |
| Pennsylvania | 116,511.91 | -15,559.96 | -13.35 |
| Florida | 89,473.71 | -3,399.30 | -3.80 |
| Illinois | 80,166.10 | -12,607.89 | -15.73 |
| Ohio | 78,258.14 | -16,971.38 | -21.69 |

### K12: Top 10 customers by sales (table)

| CUSTOMER_NAME | SEGMENT | TOTAL_SALES | TOTAL_PROFIT | PROFIT_MARGIN_PCT | ORDERS |
| --- | --- | --- | --- | --- | --- |
| Sean Miller | Home Office | 25,043.05 | -1,980.74 | -7.91 | 5 |
| Tamara Chand | Corporate | 19,052.22 | 8,981.32 | 47.14 | 5 |
| Raymond Buch | Consumer | 15,117.34 | 6,976.10 | 46.15 | 6 |
| Tom Ashbrook | Home Office | 14,595.62 | 4,703.79 | 32.23 | 4 |
| Adrian Barton | Consumer | 14,473.57 | 5,444.81 | 37.62 | 10 |
| Ken Lonsdale | Consumer | 14,175.23 | 806.85 | 5.69 | 12 |
| Sanjit Chand | Consumer | 14,142.33 | 5,757.41 | 40.71 | 9 |
| Hunter Lopez | Consumer | 12,873.30 | 5,622.43 | 43.68 | 6 |
| Sanjit Engle | Consumer | 12,209.44 | 2,650.68 | 21.71 | 11 |
| Christopher Conant | Consumer | 12,129.07 | 2,177.05 | 17.95 | 5 |

### K13: Loss-making order lines: how many and how much profit they remove

| LOSS_MAKING_LINES | SHARE_OF_ALL_LINES_PCT | PROFIT_LOST |
| --- | --- | --- |
| 1,871 | 18.70 | -156,131.29 |

## Independent cross-check against the raw Excel files

Each value is recalculated directly from `data/raw/*.xlsx` with pandas (no SQL, no cleaned CSV) and compared with the SQL result.

| CHECK | RAW_EXCEL | SQL_RESULT | STATUS |
| --- | --- | --- | --- |
| Total sales | 2,297,200.86 | 2,297,200.86 | PASS |
| Total profit | 286,397.02 | 286,397.02 | PASS |
| Orders | 5,009.00 | 5,009.00 | PASS |
| Active customers | 793.00 | 793.00 | PASS |
| Sales, region West | 725,457.82 | 725,457.82 | PASS |
| Sales, region East | 678,781.24 | 678,781.24 | PASS |
| Sales, region Central | 501,239.89 | 501,239.89 | PASS |
| Sales, region South | 391,721.90 | 391,721.91 | PASS |
| Sales, segment Consumer | 1,161,401.34 | 1,161,401.34 | PASS |
| Sales, segment Corporate | 706,146.37 | 706,146.37 | PASS |
| Sales, segment Home Office | 429,653.15 | 429,653.15 | PASS |
| Sum of yearly sales (K2) = total sales | 2,297,200.86 | 2,297,200.87 | PASS |
