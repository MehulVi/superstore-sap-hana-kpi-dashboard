// Report content, part B: sections 6-12 and appendices.
const L = require('./lib');
const { COL, CONTENT_W, P, H1, H2, H3, bullets, numbered, table, spacer, callout, code, figure, readCsv, readText, fmtCell } = L;

function s6() {
  const q2 = readCsv('docs/query_results/Q2.csv');
  return [
    H1('6. Implementation steps', true),
    P('This section describes how the dashboard is built, from an empty SAP HANA schema to the finished Tableau pages. Steps 1 to 5 prepare the data in SAP HANA. Steps 6 to 10 build the dashboard. The architecture is shown in Figure 4.'),
    ...callout('Status of these steps',
      'Steps 1 to 5 were tested as described in Section 9, on an equivalent SQLite database. Steps 6 to 10 describe the procedure for Tableau Desktop. The dashboard pictures in Section 7 are mock-ups of the intended result.', COL.blue, COL.tintBlue),
    H2('Step 1: Create the schema and the tables'),
    P('Run `sql/01_create_schema_and_tables.sql` in the SQL console of the SAP HANA Database Explorer. It creates the schema `SUPERSTORE` and six column tables. Two of them are shown here; the complete script is in Appendix A.1.'),
    ...code(`CREATE SCHEMA SUPERSTORE;

CREATE COLUMN TABLE SUPERSTORE.DIM_CUSTOMER (
    CUSTOMER_ID    NVARCHAR(20)  NOT NULL PRIMARY KEY,
    CUSTOMER_NAME  NVARCHAR(100) NOT NULL,
    SEGMENT        NVARCHAR(20)  NOT NULL
);

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
);`),
    H2('Step 2: Load the cleaned data'),
    P('Load the six CSV files from `data/clean/`: the dimension tables first, the fact table last. The easiest way is the Import Data wizard of the Database Explorer (right-click a table, choose Import Data, select the CSV file, tick that the file has a header row). Files on the server can also be loaded with an `IMPORT` statement:'),
    ...code(`IMPORT FROM CSV FILE '/path/to/fact_sales.csv' INTO SUPERSTORE.FACT_SALES
  WITH RECORD DELIMITED BY '\\n' FIELD DELIMITED BY ',' OPTIONALLY ENCLOSED BY '"'
       SKIP FIRST 1 ROW ERROR LOG '/path/to/fact_sales.err';`),
    P('Expected row counts: DIM_CUSTOMER 793, DIM_PRODUCT 1,894, DIM_GEOGRAPHY 632, DIM_ORDER 5,009, DIM_DATE 1,461, FACT_SALES 9,994.'),
    H2('Step 3: Link the tables'),
    P('Add the relationships after loading, so the order of loading does not matter (`sql/03_add_foreign_keys.sql`). Each fact row points to one row in each dimension:'),
    ...code(`ALTER TABLE SUPERSTORE.FACT_SALES ADD CONSTRAINT FK_FACT_CUSTOMER
    FOREIGN KEY (CUSTOMER_ID) REFERENCES SUPERSTORE.DIM_CUSTOMER (CUSTOMER_ID);

ALTER TABLE SUPERSTORE.FACT_SALES ADD CONSTRAINT FK_FACT_PRODUCT
    FOREIGN KEY (PRODUCT_KEY) REFERENCES SUPERSTORE.DIM_PRODUCT (PRODUCT_KEY);
-- ... the same for GEO_KEY, ORDER_ID and ORDER_DATE`),
    H2('Step 4: Create the dashboard view'),
    P('The view `V_SALES_ENRICHED` joins the fact table with all five dimensions and adds the discount band. The dashboard connects to this one view, so every chart uses the same, consistent data. The view is shortened here; the complete version is in Appendix A.2.'),
    ...code(`CREATE VIEW SUPERSTORE.V_SALES_ENRICHED AS
SELECT
    f.SALES_ID, f.ORDER_ID, f.ORDER_DATE,
    d.CAL_YEAR, d.CAL_QUARTER, d.CAL_MONTH, d.MONTH_NAME,
    o.SHIP_MODE, o.SHIP_DAYS,
    c.CUSTOMER_NAME, c.SEGMENT,
    p.CATEGORY, p.SUB_CATEGORY,
    g.STATE, g.REGION,
    f.QUANTITY, f.DISCOUNT,
    CASE WHEN f.DISCOUNT = 0    THEN 'No discount'
         WHEN f.DISCOUNT <= 0.2 THEN 'Up to 20%'
         WHEN f.DISCOUNT <= 0.4 THEN '21-40%'
         ELSE 'Above 40%' END AS DISCOUNT_BAND,
    f.SALES, f.PROFIT
    -- ... all columns are listed in Appendix A.2
FROM SUPERSTORE.FACT_SALES f
JOIN SUPERSTORE.DIM_CUSTOMER  c ON f.CUSTOMER_ID = c.CUSTOMER_ID
JOIN SUPERSTORE.DIM_PRODUCT   p ON f.PRODUCT_KEY = p.PRODUCT_KEY
JOIN SUPERSTORE.DIM_GEOGRAPHY g ON f.GEO_KEY     = g.GEO_KEY
JOIN SUPERSTORE.DIM_ORDER     o ON f.ORDER_ID    = o.ORDER_ID
JOIN SUPERSTORE.DIM_DATE      d ON f.ORDER_DATE  = d.CAL_DATE;`),
    H2('Step 5: Check the data'),
    P('Run `sql/05_data_quality_checks.sql`. It counts the rows of every table and runs twelve integrity checks. Two of them are shown here:'),
    ...code(`-- Orders shipped before they were ordered (expected: 0)
SELECT COUNT(*) FROM SUPERSTORE.DIM_ORDER WHERE SHIP_DATE < ORDER_DATE;

-- Fact rows without a customer (expected: 0)
SELECT COUNT(*) FROM SUPERSTORE.FACT_SALES f
LEFT JOIN SUPERSTORE.DIM_CUSTOMER c ON f.CUSTOMER_ID = c.CUSTOMER_ID
WHERE c.CUSTOMER_ID IS NULL;`),
    P('Result of all twelve checks (run on the equivalent SQLite database, see Section 9):', { keepNext: true }),
    ...table(['Check', 'Result', 'Expected', 'Status'],
      q2.rows.map((r) => [r[0], r[1], r[2], r[3]]), [5400, 1100, 1300, 1226],
      { size: 17, align: ['left', 'right', 'right', 'center'], keepTogether: true }),
    H2('Step 6: Connect Tableau to SAP HANA'),
    ...numbered([
      'Install the SAP HANA client, which contains the ODBC driver, on the computer that runs Tableau. Use the same 32/64-bit version as Tableau.',
      'Open Tableau Desktop. Choose **Connect > To a Server > SAP HANA**.',
      'Enter the server and the port of the SAP HANA instance. Choose user name and password. For SAP HANA Cloud use port 443 and tick **Require SSL**. Click **Sign In**.',
      'Select the schema `SUPERSTORE` and drag the view `V_SALES_ENRICHED` onto the canvas. Choose **Live**.',
      'Open a worksheet. Check the data types: `ORDER_DATE` is a date, `POSTAL_CODE` is a string, and `CAL_YEAR`, `CAL_QUARTER` and `CAL_MONTH` are dimensions, not measures.',
    ]),
    H2('Step 7: Create the calculated fields'),
    P('The KPIs are defined once as calculated fields and reused in every worksheet. Margin divides sums, and orders are a distinct count (Section 2.4).'),
    ...code(`Profit Margin      SUM([PROFIT]) / SUM([SALES])
Orders             COUNTD([ORDER_ID])
Avg Order Value    SUM([SALES]) / COUNTD([ORDER_ID])
Active Customers   COUNTD([CUSTOMER_ID])
Result Type        IF SUM([PROFIT]) < 0 THEN "Loss" ELSE "Profit" END

Sales 2017         SUM(IF [CAL_YEAR] = 2017 THEN [SALES] END)
Sales 2016         SUM(IF [CAL_YEAR] = 2016 THEN [SALES] END)
Sales Change       [Sales 2017] / [Sales 2016] - 1`),
    P('The last three fields feed the change arrow of the KPI cards. `Result Type` colours the bars red for losses. The same pattern is used for the other cards.'),
    H2('Step 8: Build the worksheets'),
    ...table(['Worksheet', 'Columns / rows', 'Marks and formatting'], [
      ['KPI cards (6)', 'One sheet per KPI', 'Text mark showing the measure and `Sales Change`. Apply Region, Category and Segment filters, but not Year, so the arrow always compares 2017 with 2016.'],
      ['Monthly sales by year', 'Columns `CAL_MONTH` (discrete). Rows `SUM(SALES)`.', 'Line with circles. Colour by `CAL_YEAR`. 2017 thicker and orange.'],
      ['Sales by region', 'Rows `REGION`. Columns `SUM(SALES)`.', 'Bar sorted descending. Label: sales and `Profit Margin`. Orange for the lowest margin.'],
      ['Sales by category', 'Angle `SUM(SALES)`. Colour `CATEGORY`.', 'Pie turned into a donut with a second, white pie on a dual axis. Total in the middle.'],
      ['Sales by segment', 'Columns `SEGMENT`. Rows `SUM(SALES)`.', 'Column. Label: sales and percent of total.'],
      ['Ship mode', 'Rows `SHIP_MODE`. Columns: order lines as percent of total.', 'Bar. Label: average `SHIP_DAYS`.'],
      ['Margin by sub-category', 'Rows `SUB_CATEGORY`. Columns `Profit Margin`.', 'Bar sorted by margin. Colour by `Result Type`: blue profit, red loss.'],
      ['Margin by discount band', 'Columns `DISCOUNT_BAND` sorted by `DISCOUNT_BAND_SORT`. Rows `Profit Margin`.', 'Column with zero line. Colour by `Result Type`.'],
      ['Top 8 states', 'Rows `STATE` (filter: top 8 by sales). Columns `SUM(SALES)`.', 'Bar. Colour by `Result Type`.'],
      ['Region x category', 'Rows `REGION`. Columns `CATEGORY`.', 'Square marks. Colour `Profit Margin`, diverging red-yellow-green centered at 0. Value in each cell.'],
      ['Top 10 customers', 'Rows `CUSTOMER_NAME` (filter: top 10 by sales). Columns: sales, profit, margin, orders.', 'Text table. Negative profit in red.'],
    ], [1900, 3300, 3826], { size: 17, boldFirst: true }),
    H2('Step 9: Assemble the dashboard'),
    ...numbered([
      'Create a dashboard with a fixed size of 1600 x 900 pixels.',
      'Place the worksheets in horizontal and vertical layout containers, following the wireframes in Figures 5 and 6.',
      'Show the filters `CAL_YEAR`, `REGION`, `CATEGORY` and `SEGMENT` as drop-downs. Set each to **Apply to Worksheets > All Using This Data Source**.',
      'Add a highlight action (**Dashboard > Actions > Add Action > Highlight**) from the region and category charts to all other charts.',
      'Apply the colours of Section 5.4 and add the title, the source note and the chart notes.',
      'Create the second dashboard the same way and add navigation buttons between the two pages.',
    ]),
    H2('Step 10: Acceptance test'),
    P('The dashboard is accepted only if its numbers equal the results of the queries in `sql/06_kpi_queries.sql`. With all filters set to All, and then with the filters named below:', { keepNext: true }),
    ...table(['Check', 'Expected value', 'Query'], [
      ['Total Sales', '$2,297,200.86', 'K1'],
      ['Total Profit', '$286,397.02', 'K1'],
      ['Profit Margin', '12.47%', 'K1'],
      ['Orders', '5,009', 'K1'],
      ['Average Order Value', '$458.61', 'K1'],
      ['Active Customers', '793', 'K1'],
      ['Year = 2017: Total Sales and Orders', '$733,215.26 and 1,687', 'K2'],
      ['Region = West: Sales and Margin', '$725,457.82 and 14.94%', 'K4'],
      ['Category = Furniture: Margin', '2.49%', 'K5'],
      ['Discount band Above 40%: Margin', '-77.40%', 'K9'],
      ['Sales of the three segments added together', 'equals Total Sales', 'K6'],
    ], [4300, 3226, 1500], { size: 18, align: ['left', 'left', 'center'], keepTogether: true }),
    H2('Step 11: Troubleshooting'),
    ...table(['Symptom', 'Likely cause', 'Fix'], [
      ['Tableau reports a missing driver', 'SAP HANA ODBC driver not installed, or the wrong 32/64-bit version', 'Install the SAP HANA client that matches Tableau'],
      ['Connection to SAP HANA Cloud fails', 'SSL not enabled, wrong port, or the computer\'s IP address is not allowed', 'Tick Require SSL, use port 443, add the IP address to the instance\'s allowed addresses'],
      ['Margin shows 12.03% instead of 12.47%', 'Average of line margins used', 'Use `SUM([PROFIT]) / SUM([SALES])`'],
      ['Orders are almost twice too high', 'Rows are counted instead of distinct orders', 'Use `COUNTD([ORDER_ID])`'],
      ['Years appear as 2,017', 'Year is treated as a number', 'Convert `CAL_YEAR` to a dimension and remove the number format'],
      ['Postal codes lose the leading zero', 'Field read as a number', 'Keep `POSTAL_CODE` as a string'],
      ['Months sorted alphabetically', 'Text month names sort alphabetically', 'Sort by `CAL_MONTH`'],
    ], [2700, 3200, 3126], { size: 17 }),
  ];
}

function s7Land() {
  const { Paragraph, TextRun } = L.D;
  return [
    H1('7. Final dashboard'),
    P('Figures 7 and 8 show the two pages of the dashboard design with the real numbers of the dataset. Page 1 shows what is happening.'),
    ...figure('dashboard/page1_executive_overview.png', 'Dashboard page 1, Executive Overview (mock-up)', 7, 760),
    new Paragraph({ pageBreakBefore: true, spacing: { after: 120 }, children: [new TextRun({
      text: 'Page 2 explains why the numbers on page 1 look the way they do.', font: L.FONT, size: 21 })] }),
    ...figure('dashboard/page2_products_and_customers.png', 'Dashboard page 2, Products & Customers (mock-up)', 8, 760),
    ...callout('These are mock-ups',
      'The pictures were drawn with Python (`scripts/03_render_dashboard_mockups.py`) from the results of the KPI queries. They show the intended layout and the real numbers. They are not screenshots from Tableau. The full-size images are in the folder `dashboard/` of the repository. Real screenshots can be added to `dashboard/screenshots/` after the build in Section 6.'),
  ];
}

function s7Read() {
  return [
    H2('7.1 How to read the dashboard'),
    ...bullets([
      '**Start with the filters and the six cards.** They give the totals for the chosen scope. The arrow shows the change of 2017 against 2016. Green is favourable and red is unfavourable.',
      '**Read the line chart for the trend.** One line per year. The orange 2017 line shows the current year.',
      '**Read the region bar for the lowest margin.** The orange bar marks the region with the lowest profit margin.',
      '**Go to page 2 to find the cause.** Red always means a loss: red bars on the sub-category, discount-band and state charts show where money is lost.',
      '**Use the heatmap and the table for detail.** The heatmap shows margin for every region and category. The table lists the ten largest customers with exact values.',
    ]),
  ];
}

function s8() {
  const k9 = readCsv('docs/query_results/K9.csv');
  return [
    H1('8. Insights'),
    P('All numbers in this section come from the queries in `sql/06_kpi_queries.sql` (Appendix B).'),
    ...table(['Insight', 'Evidence', 'Decision it supports'], [
      ['Growth is strong, but margin is slipping', '2017 sales +20.4%, but profit only +14.2%. Margin fell from 13.43% in 2016 to 12.74% in 2017.', 'Check whether growth is being bought with discounts'],
      ['**Discounts above 20% lose money**', 'Margin is 29.51% with no discount, -15.30% at 21-40% and -77.40% above 40%.', 'Cap discounts, or require approval above 20%'],
      ['Furniture is the weak category', '32.3% of sales but only 2.49% margin. Technology earns 17.40% and Office Supplies 17.04%.', 'Review furniture pricing and supplier cost'],
      ['Three sub-categories lose money', 'Tables -8.56%, Bookcases -3.02%, Supplies -2.55%.', 'Reprice, renegotiate or drop the worst products'],
      ['Central has the lowest margin', '7.92%, against 14.94% in the West. Central furniture is at -1.75%.', 'Look at discounting and cost in the Central region'],
      ['Big states can still lose money', 'Five of the eight largest states by sales lose money: Texas, Pennsylvania, Florida, Illinois and Ohio.', 'Review pricing and shipping cost by state'],
      ['Losses come from under a fifth of the lines', '1,871 lines (18.7%) lose $156,131.29 in total, about 55% of the total profit.', 'Track loss-making lines as a KPI'],
      ['The largest customer is unprofitable', 'Sean Miller: $25,043.05 sales and -$1,980.74 profit.', 'Review the terms of key accounts'],
    ], [2300, 3900, 2826], { size: 18 }),
    H2('8.1 Deep dive: discounts and profit'),
    P('The discount band chart on page 2 is the strongest single finding. The table shows margin for each band:', { keepNext: true }),
    ...table(['Discount band', 'Order lines', 'Sales', 'Profit', 'Margin'],
      k9.rows.map((r) => [r[0], fmtCell('ORDER_LINES', r[1]), fmtCell('TOTAL_SALES', r[2]), fmtCell('TOTAL_PROFIT', r[3]), fmtCell('PROFIT_MARGIN_PCT', r[4])]),
      [2300, 1500, 1900, 1900, 1426], { size: 18, align: ['left', 'right', 'right', 'right', 'right'], boldFirst: true, keepTogether: true }),
    P('The 1,393 lines with a discount above 20% sell $362,770.15 and lose $135,376.06 in total. The other 8,601 lines sell $1,934,430.71 and earn $421,773.08, a margin of 21.80%. In other words, a small group of heavily discounted lines removes about a third of the profit that all other lines earn ($135,376.06 of $421,773.08).'),
    P('Heavy discounts are not spread evenly. 25.6% of furniture lines carry a discount above 20%, against 11.3% of office supplies lines and 9.3% of technology lines.'),
    ...callout('Careful reading',
      'The data shows that heavy discounts and losses go together. It does not prove that discounts alone cause the losses: low-margin products may also receive bigger discounts. A controlled comparison should be made before a pricing policy is changed.', COL.blue, COL.tintBlue),
    H2('8.2 Deep dive: why furniture is weak'),
    ...bullets([
      '**Category level:** furniture is 32.3% of sales but earns only $18,451.27 profit (margin 2.49%). Technology earns $145,454.95 and office supplies $122,490.80 on similar sales.',
      '**Sub-category level:** inside furniture, Tables (-$17,725.48) and Bookcases (-$3,472.56) lose money, while Furnishings (14.24%) and Chairs (8.10%) are profitable.',
      '**Region level:** Central furniture has a margin of -1.75%, West furniture 4.55%.',
      '**Discount level:** furniture has the highest share of lines with discounts above 20% (25.6%), which is consistent with the weak margin (see 8.1).',
    ]),
    P('Together these results point to a specific action: look first at table and bookcase pricing and at discounting in the Central region, instead of treating all furniture alike.'),
  ];
}

function s9() {
  return [
    H1('9. Validation and project status', true),
    H2('9.1 Tests performed'),
    ...table(['What was tested', 'How', 'Result'], [
      ['Cleaning rules', 'Assertions in `01_prepare_data.py`: row alignment of all files, no order ships before it is ordered, rounding changes no value, unique keys', 'All pass'],
      ['Row counts', 'Query Q1 on every table', '793 / 1,894 / 632 / 5,009 / 1,461 / 9,994, as expected'],
      ['Integrity', 'Query Q2: twelve checks (no orphan rows, no duplicate IDs, no early shipments, view equals fact table)', '12 of 12 pass'],
      ['KPI results against the raw files', 'Totals, four regions, three segments and the yearly sum were recalculated with pandas straight from the raw Excel files and compared with the SQL results', '12 of 12 match (within one cent)'],
      ['Reproducibility', 'All scripts were run again from scratch in a clean copy of the repository', 'All generated files are identical'],
    ], [2300, 4600, 2126], { size: 18, boldFirst: true }),
    P('The SQL was executed on SQLite. The table definitions of `sql/01` were translated mechanically (`CREATE COLUMN TABLE` to `CREATE TABLE`, `NVARCHAR` to `TEXT`, `DECIMAL` to `REAL`, `DATE` to `TEXT`). The views, quality checks and KPI queries were run without any change. The full report is in `docs/sql_test_report.md`.'),
    H2('9.2 Project status'),
    ...table(['Item', 'Status'], [
      ['Data cleaning and star schema', 'Done and tested'],
      ['SAP HANA SQL: tables, load, keys, views, checks, KPI queries', 'Written. Views, checks and queries tested on SQLite. **Not yet executed on SAP HANA.**'],
      ['SAP HANA instance and data load', 'Not yet done (procedure in Section 6, steps 1 to 5)'],
      ['Tableau connection and worksheets', 'Not yet done (procedure in Section 6, steps 6 to 10)'],
      ['Dashboard pictures', 'Mock-ups drawn from the real results (Section 7)'],
      ['Real Tableau screenshots', 'To be added to `dashboard/screenshots/` after the build'],
      ['Documentation', 'Done: this report and the README of the repository'],
    ], [3600, 5426], { size: 18, boldFirst: true }),
    P('When the SQL has been run on SAP HANA and the dashboard has been built in Tableau, the real screenshots replace the mock-ups and this table is updated. Any difference between the SAP HANA results and `docs/sql_test_report.md` should be investigated before the dashboard is released.'),
  ];
}

function s10() {
  return [
    H1('10. Challenges and incremental improvements', true),
    P('The table lists the real problems met during the work and what was changed in response. Each row was found by a check or a visual review, not assumed in advance.'),
    ...table(['#', 'Problem found', 'How it was found', 'Change made'], [
      ['1', 'Dates mixed and swapped', '1,708 order lines shipped before they were ordered', 'Repair rule and an assertion in the script (Section 3.2)'],
      ['2', 'Rounding Sales to 2 decimals altered the data', 'An assertion failed on the first run: sales have up to 4 decimals', 'Kept 4 decimals and used `DECIMAL(15,4)`'],
      ['3', '`PRODUCT_ID` was not a unique key', '1,862 IDs against 1,894 products', 'Surrogate key `PRODUCT_KEY`'],
      ['4', '`POSTAL_CODE` was not unique and lost its leading zero', '631 codes against 632 locations; smallest code was 1040', 'Surrogate key `GEO_KEY`; postal code stored as text'],
      ['5', 'Descriptive files repeated one row per sales line', '9,994 rows for 793 customers', 'De-duplicated dimension tables linked by keys'],
      ['6', 'Mock-up v1: axis labels were clipped and spilled out of their panels', 'Visual check of the first render', 'Wider label margins in every bar panel'],
      ['7', 'Mock-up v1: colours had no fixed meaning (orange was used for a segment and a ship mode)', 'Design review against the colour rules', 'Orange reserved for highlight and attention; ordinary bars are blue'],
      ['8', 'Negative amounts printed as "$-2.0K"', 'Visual check of the table', 'Sign placed before the dollar sign: "-$2.0K"'],
      ['9', 'The heatmap note overlapped its title', 'Visual check', 'Shorter note'],
    ], [450, 3000, 2900, 2676], { size: 17, align: ['center', 'left', 'left', 'left'] }),
    H2('10.1 Lessons'),
    ...bullets([
      '**Check the data before designing charts.** The date problem would have produced wrong delivery times on every shipping chart.',
      '**Define KPIs precisely.** A ratio of sums and a distinct count avoid two common mistakes (Section 2.4).',
      '**Verify with an independent calculation.** Recalculating totals straight from the raw files gives confidence that the SQL is right.',
      '**Look at the picture, not only at the code.** Four of the nine problems above were found only by looking at the rendered output.',
    ]),
  ];
}

function s11() {
  return [
    H1('11. Potential improvements and future enhancements', true),
    P('The list is ordered by priority. Priority and effort are the author\'s judgment.'),
    ...table(['Enhancement', 'What it adds', 'Priority', 'Effort'], [
      ['Build the dashboard in Tableau against SAP HANA and replace the mock-ups with real screenshots', 'Proof that the integration works end to end', 'High', 'Medium'],
      ['Create a graphical calculation view in SAP HANA on top of the tables', 'One governed model for all tools. Required for SAP Analytics Cloud live models.', 'High', 'Medium'],
      ['Alert for order lines with a discount above 20% or a negative profit', 'Stops the largest known profit leak at the source', 'High', 'Low'],
      ['Targets and forecast on the monthly chart', 'Budget against actual, and an outlook for the rest of the year', 'Medium', 'Medium'],
      ['Drill-through from sub-category to product to order', 'Root-cause analysis in two clicks', 'Medium', 'Medium'],
      ['Scheduled refresh and row-level security by region', 'Current data, and each regional manager sees only their own region', 'Medium', 'Medium'],
      ['Customer analytics: repeat rate and recency-frequency-value segments', 'Retention insight beyond the top 10 list', 'Low', 'Medium'],
      ['Mobile layout of the dashboard', 'Access for managers who are travelling', 'Low', 'Low'],
      ['Performance tuning for larger data (partitioning of the fact table, use of the pre-aggregated view `V_KPI_MONTHLY`)', 'Fast response if the data grows far beyond 9,994 lines', 'Low now', 'Medium'],
    ], [3700, 3226, 1000, 1100], { size: 17, align: ['left', 'left', 'center', 'center'] }),
    H2('11.1 Suggested roadmap'),
    ...numbered([
      '**Build and prove:** run the SQL on SAP HANA, build the Tableau dashboard, add real screenshots, and add the discount alert.',
      '**Govern:** create the calculation view, schedule the refresh and add row-level security.',
      '**Extend:** add targets and forecast, drill-through, customer analytics and the mobile layout.',
    ]),
  ];
}

function s12() {
  return [
    H1('12. Conclusion', true),
    P('This project turned five raw Excel files into a clean star schema, a set of SAP HANA SQL views and tested KPI queries, a documented two-page dashboard design, and a report that explains every choice. The dashboard shows that Superstore is growing, with 2017 sales up 20.4%, but that profit is leaking in three places: discounts above 20%, the furniture category and several large states.'),
    P('The most important technical result was found before any chart was drawn. The date file was corrupted, and repairing it, with tests, made the shipping analysis possible. The most important business result is that 1,393 heavily discounted order lines lose $135,376.06 while all other lines earn $421,773.08.'),
    P('The work has clear limits, stated in Section 9: the SQL has been tested on SQLite but not yet on SAP HANA, and the dashboard pictures are mock-ups until the Tableau build is done. Section 6 gives the exact steps to close both gaps.'),
    H2('12.1 Evaluation criteria checklist'),
    ...table(['Criterion', 'How it is addressed', 'Where'], [
      ['Quality and clarity of the dashboard layout', 'Wireframes first, one message per visual, fixed colour meaning, reading order', 'Sections 5 and 7'],
      ['Effectiveness in communicating insights through visual aids', 'Chart type chosen per question; losses in red; values on the marks; insights linked to decisions', 'Sections 5.3 and 8'],
      ['Depth of explanation regarding tool and design choices', 'Tool comparison and decision, rationale for every chart, alternatives rejected', 'Sections 4 and 5'],
      ['Thoroughness in documenting the entire process', 'Every step from data review to acceptance test, code snippets, tests, honest status, improvement log', 'Sections 2 to 6, 9, 10, appendices'],
      ['Overall presentation and adherence to the task guidelines', 'Deliverables checklist, numbered figures, consistent layout, repository with README', 'Section 1.2'],
    ], [2900, 4326, 1800], { size: 18, boldFirst: true }),
  ];
}

// ---------- appendices ----------
function evenWidths(n, firstOverride) {
  const first = firstOverride || (n <= 3 ? 2600 : 1900);
  const rest = Math.floor((CONTENT_W - first) / (n - 1));
  const w = [first, ...Array(n - 1).fill(rest)];
  w[n - 1] += CONTENT_W - w.reduce((a, b) => a + b, 0);
  return w;
}
function resultTable(id, title) {
  const t = readCsv(`docs/query_results/${id}.csv`);
  const align = t.head.map((h) => (/^[A-Z_]*(SALES|PROFIT|PCT|ORDERS|LINES|CUSTOMERS|VALUE|DAYS|LOST|YEAR)$|YOY/.test(h) && !/^(SUB_CATEGORY|CATEGORY|REGION)$/.test(h) ? 'right' : 'left'));
  const n = t.head.length;
  const hdr = (h) => h.replace(/^TOTAL_/, '').replace(/_PCT$/, ' %').replace(/_/g, ' ');
  const first = t.head[0] === 'CAL_YEAR' ? 800 : n >= 7 ? 1500 : undefined;
  return [
    H3(`${id}: ${title}`),
    ...table(t.head.map(hdr), t.rows.map((r) => r.map((v, i) => fmtCell(t.head[i], v))), evenWidths(n, first),
      { size: n >= 7 ? 14 : 15, align, boldFirst: true, keepTogether: true }),
  ];
}
function appendixA() {
  return [
    H1('Appendix A: SQL', true),
    P('The complete files are in the folder `sql/` of the repository. The three scripts below are the ones needed to build the data model and to check the dashboard.'),
    H2('A.1 Tables (sql/01_create_schema_and_tables.sql)'),
    ...code(readText('sql/01_create_schema_and_tables.sql'), { size: 14 }),
    H2('A.2 Views (sql/04_create_views.sql)'),
    ...code(readText('sql/04_create_views.sql'), { size: 14 }),
    H2('A.3 KPI queries (sql/06_kpi_queries.sql)'),
    ...code(readText('sql/06_kpi_queries.sql'), { size: 14 }),
  ];
}
function appendixB() {
  return [
    H1('Appendix B: Reference results of the KPI queries', true),
    P('These are the results of the queries in Appendix A.3, run on the equivalent SQLite database. The dashboard must show the same numbers (Section 6, step 10).'),
    ...resultTable('K1', 'Headline KPI cards, all years'),
    ...resultTable('K2', 'KPIs per year with year-on-year growth'),
    ...resultTable('K4', 'Sales and margin by region'),
    ...resultTable('K5', 'Sales and margin by category'),
    ...resultTable('K6', 'Sales and margin by customer segment'),
    ...resultTable('K7', 'Ship mode: share of order lines and average days to ship'),
    ...resultTable('K8', 'Profit margin by sub-category'),
    ...resultTable('K9', 'Profit margin by discount band'),
    ...resultTable('K10', 'Profit margin by region and category'),
    ...resultTable('K11', 'Top 8 states by sales'),
    ...resultTable('K12', 'Top 10 customers by sales'),
    ...resultTable('K13', 'Loss-making order lines'),
    P('K3 (monthly sales by year, 48 rows) is available as `docs/query_results/K3.csv`.'),
  ];
}
function appendixC() {
  const col = (lines) => lines.join('\n');
  return [
    H1('Appendix C: Data dictionary', true),
    P('Schema `SUPERSTORE`. PK = primary key, FK = foreign key.'),
    ...table(['Table', 'Columns'], [
      ['FACT_SALES\n9,994 rows', col([
        '`SALES_ID` INTEGER, PK: row number of the order line',
        '`ORDER_ID` NVARCHAR(20), FK: order of the line',
        '`ORDER_DATE` DATE, FK: date of the order',
        '`CUSTOMER_ID` NVARCHAR(20), FK: customer',
        '`PRODUCT_KEY` INTEGER, FK: product of the line',
        '`GEO_KEY` INTEGER, FK: delivery location',
        '`SALES` DECIMAL(15,4): sales amount (US dollars)',
        '`QUANTITY` INTEGER: units sold',
        '`DISCOUNT` DECIMAL(4,2): discount as a fraction (0.20 = 20%)',
        '`PROFIT` DECIMAL(15,4): profit (negative = loss)'])],
      ['DIM_CUSTOMER\n793 rows', col([
        '`CUSTOMER_ID` NVARCHAR(20), PK', '`CUSTOMER_NAME` NVARCHAR(100)', '`SEGMENT` NVARCHAR(20): Consumer, Corporate or Home Office'])],
      ['DIM_PRODUCT\n1,894 rows', col([
        '`PRODUCT_KEY` INTEGER, PK: generated key', '`PRODUCT_ID` NVARCHAR(20): business ID (not unique)', '`PRODUCT_NAME` NVARCHAR(200)',
        '`CATEGORY` NVARCHAR(30): Furniture, Office Supplies or Technology', '`SUB_CATEGORY` NVARCHAR(30): one of 17'])],
      ['DIM_GEOGRAPHY\n632 rows', col([
        '`GEO_KEY` INTEGER, PK: generated key', '`POSTAL_CODE` NVARCHAR(5): text, leading zero kept (not unique)', '`COUNTRY` NVARCHAR(40)',
        '`CITY` NVARCHAR(60)', '`STATE` NVARCHAR(40)', '`REGION` NVARCHAR(20): Central, East, South or West'])],
      ['DIM_ORDER\n5,009 rows', col([
        '`ORDER_ID` NVARCHAR(20), PK', '`ORDER_DATE` DATE', '`SHIP_DATE` DATE', '`SHIP_MODE` NVARCHAR(20): Standard Class, Second Class, First Class or Same Day',
        '`SHIP_DAYS` INTEGER: days from order to shipment, 0 to 7'])],
      ['DIM_DATE\n1,461 rows', col([
        '`CAL_DATE` DATE, PK', '`CAL_YEAR` INTEGER', '`CAL_QUARTER` INTEGER: 1 to 4', '`CAL_MONTH` INTEGER: 1 to 12',
        '`MONTH_NAME` NVARCHAR(12)', '`YEAR_MONTH` NVARCHAR(7): YYYY-MM'])],
      ['V_SALES_ENRICHED\nview', col([
        'One flat row per order line: all columns of the six tables above plus', '`DISCOUNT_BAND` (No discount, Up to 20%, 21-40%, Above 40%) and `DISCOUNT_BAND_SORT` (1 to 4)',
        'The dashboard connects to this view.'])],
      ['V_KPI_MONTHLY\nview', col([
        'Totals by month, region, category and segment: `TOTAL_SALES`, `TOTAL_PROFIT`, `TOTAL_QUANTITY`, `ORDER_LINES`, `ORDERS`',
        '`ORDERS` is a distinct count and must not be added up across groups.'])],
    ], [2200, 6826], { size: 17, boldFirst: true }),
  ];
}

module.exports = { s6, s7Land, s7Read, s8, s9, s10, s11, s12, appendixA, appendixB, appendixC };
