// Report content, part A: cover, contents, sections 1-5.
const L = require('./lib');
const { D, COL, CONTENT_W, P, H1, H2, H3, bullets, numbered, table, spacer, callout, code, figure, FONT } = L;
const { Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType } = D;

function cover() {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const nb = { top: none, bottom: none, left: none, right: none };
  const t = (text, size, color, bold, after) => new Paragraph({
    spacing: { after }, children: [new TextRun({ text, size, color, bold, font: FONT })] });
  const banner = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA }, borders: nb,
      shading: { type: ShadingType.CLEAR, fill: COL.navy, color: 'auto' },
      margins: { top: 500, bottom: 500, left: 400, right: 400 },
      children: [
        t('SAP HANA DATA ANALYST INTERNSHIP', 20, 'C9D4E8', true, 240),
        t('Superstore Sales Performance Dashboard', 52, 'FFFFFF', true, 200),
        t('Visualizing key performance indicators with SAP HANA and Tableau: conceptualization, design, implementation and evaluation', 24, 'DCE5F3', false, 0),
      ],
    })] })],
  });
  const info = table(['Item', 'Detail'], [
    ['Task', 'Task 4 (Week 4): Dashboard Creation'],
    ['Prepared by', 'Mehul Vishwakarma'],
    ['Internship provider', 'Yuva Intern'],
    ['Date', '21 November 2026'],
    ['Data', 'Superstore order data, 9,994 order lines, 3 January 2014 to 30 December 2017'],
    ['Visualization tool', 'Tableau Desktop (SAP HANA connector)'],
    ['Repository', 'GitHub: superstore-sap-hana-kpi-dashboard (link given in the submission form)'],
  ], [2600, 6426], { size: 20, boldFirst: true });
  return [spacer(1200), banner, spacer(500), ...info];
}

function contents() {
  return [
    H1('Contents', true),
    ...table(['Section', 'What it covers'], [
      ['1. Introduction', 'Objective, checklist of the task deliverables, project approach, and what is and is not verified'],
      ['2. Conceptualization', 'Business scenario, stakeholders, business questions, KPI definitions with worked examples, data sources'],
      ['3. Data preparation and model', 'Problems found in the raw data, the date repair with evidence, the star schema, the preparation pipeline'],
      ['4. Tool selection', 'Requirements, comparison of Tableau, SAP Analytics Cloud and Power BI, justification, how the tool connects to SAP HANA'],
      ['5. Dashboard design', 'Design principles, wireframes, placement of every element, chart choices and rationale, colours, filters'],
      ['6. Implementation steps', 'Step-by-step build with code snippets: SAP HANA tables, views, checks, Tableau connection, worksheets, acceptance tests'],
      ['7. Final dashboard', 'Mock-ups of both dashboard pages and a reading guide'],
      ['8. Insights', 'What the dashboard shows, the decisions it supports, two deep dives'],
      ['9. Validation and project status', 'Tests performed and results, and an honest status table'],
      ['10. Challenges and incremental improvements', 'Problems met during the work and what was changed'],
      ['11. Potential improvements and future enhancements', 'Prioritized list of improvements'],
      ['12. Conclusion', 'Summary and evaluation criteria checklist'],
      ['Appendix A', 'SQL: table definitions, views, all KPI queries'],
      ['Appendix B', 'Reference results of the KPI queries'],
      ['Appendix C', 'Data dictionary'],
    ], [3300, 5726], { size: 19, boldFirst: true }),
  ];
}

function s1() {
  return [
    H1('1. Introduction', true),
    H2('1.1 Objective'),
    P('The task asks for a comprehensive dashboard that visualizes key performance indicators (KPIs) using SAP HANA, and for a document that explains how the dashboard was conceived, designed and built. This report is that document. It follows the order given in the task: conceptualization, tool selection, dashboard design, implementation and documentation.'),
    P('The goal is to turn raw order data into insight. A manager who opens the dashboard should be able to answer, in about two minutes and without writing SQL: **Are we growing? Is the growth profitable? Where does it come from? What is costing us money?**'),
    H2('1.2 Checklist of the task deliverables'),
    ...table(['What the task asks for', 'Where it is covered'], [
      ['A DOC file that details the development process (conceptualization, design, technical steps)', 'This report, Sections 2 to 6'],
      ['Screenshots or mock-ups of the final dashboard design', 'Section 7 (Figures 7 and 8) and the folder `dashboard/` in the repository'],
      ['Explanation of tool selection', 'Section 4'],
      ['Explanation of data sources used', 'Sections 2.5 and 3, Appendix C'],
      ['Explanation of visualization rationale', 'Section 5.3'],
      ['A section on potential improvements and future enhancements', 'Section 11'],
      ['Conceptualization: business scenario, relevant KPIs and data sources', 'Section 2'],
      ['Dashboard design: wireframes with placement of charts, tables and filters', 'Section 5 (Figures 5 and 6)'],
      ['Implementation steps: integration, data linking, code snippets', 'Section 6 and Appendix A'],
      ['Supporting diagrams, screenshots and incremental improvements', 'Figures 1 to 8 and Section 10'],
    ], [5200, 3826], { size: 19 }),
    H2('1.3 Project approach'),
    P('The work followed six steps, shown in Figure 1. Each step has its own section in this report.', { keepNext: true }),
    ...figure('docs/figures/fig_process.png', 'The six steps of the project', 1, 600),
    H2('1.4 What is verified and what is not'),
    P('Two points are stated here so that nothing is hidden.'),
    ...bullets([
      '**The dashboard pages in this report are design mock-ups.** They were drawn with Python from the real query results. They are not screenshots from Tableau.',
      '**The SQL was tested on SQLite, not on SAP HANA.** The views and queries were run unchanged on an equivalent SQLite database and checked against the raw Excel files. The SAP HANA statements follow SAP HANA syntax, but they have not been executed on a SAP HANA system.',
    ]),
    P('Section 9 lists exactly what has been tested and what remains to be done.'),
    H2('1.5 Project files'),
    P('All files are in the GitHub repository `superstore-sap-hana-kpi-dashboard`: the raw and cleaned data, the SQL scripts, the Python scripts, the dashboard images, the diagrams and this report. The README in the repository explains how to reproduce every result.'),
  ];
}

function s2() {
  return [
    H1('2. Conceptualization', true),
    P('Conceptualization defines what the dashboard is for before any chart is drawn. It has four parts: the business scenario, the questions to answer, the KPIs that answer them, and the data that feeds them.'),
    H2('2.1 Business scenario'),
    P('Superstore is a US retailer that sells furniture, office supplies and technology products. Its customers belong to three segments (Consumer, Corporate and Home Office) and are located in four regions (Central, East, South and West). The data covers orders placed between 3 January 2014 and 30 December 2017.'),
    P('Management reviews performance every month. At present the numbers sit in separate Excel files, so nobody sees growth, profit and shipping on one screen. The dashboard brings them together.'),
    H2('2.2 Stakeholders and the decisions they make'),
    ...table(['Stakeholder', 'Decision', 'Needs to see'], [
      ['Sales director', 'Growth targets for next year', 'Headline KPIs, yearly growth, monthly trend'],
      ['Regional managers', 'Where to put sales effort', 'Sales and margin by region and state'],
      ['Merchandising manager', 'Pricing, assortment and discounts', 'Margin by sub-category and by discount band'],
      ['Customer manager', 'Key accounts and delivery service', 'Top customers, ship mode and shipping speed'],
    ], [2200, 3000, 3826], { size: 19, boldFirst: true }),
    H2('2.3 Business questions'),
    ...bullets([
      '**Growth:** are sales rising, and is there a seasonal pattern?',
      '**Profitability:** is the growth profitable, or is margin falling?',
      '**Sources:** which regions, categories, segments and customers drive sales and profit?',
      '**Leaks:** which products, discounts and places lose money?',
      '**Service:** how fast do we ship, and how is shipping split between ship modes?',
    ]),
    H2('2.4 KPI selection'),
    P('Eight KPIs were chosen. Together they describe size (sales), quality (profit and margin), activity (orders and customers), efficiency (order value and shipping time) and momentum (growth). Each KPI answers one of the questions above.'),
    ...table(['KPI', 'Formula', 'Question it answers', 'Value 2014-2017'], [
      ['Total Sales', '`SUM(SALES)`', 'How big is the business?', '$2,297,200.86'],
      ['Total Profit', '`SUM(PROFIT)`', 'How much do we earn?', '$286,397.02'],
      ['Profit Margin %', '`100 * SUM(PROFIT) / SUM(SALES)`', 'How much of each dollar is profit?', '12.47%'],
      ['Orders', '`COUNT(DISTINCT ORDER_ID)`', 'How many purchases are made?', '5,009'],
      ['Average Order Value', '`SUM(SALES) / COUNT(DISTINCT ORDER_ID)`', 'How much does a purchase bring?', '$458.61'],
      ['Active Customers', '`COUNT(DISTINCT CUSTOMER_ID)`', 'How many customers buy?', '793'],
      ['Average Ship Days', 'average of `SHIP_DAYS` over orders', 'How fast do we deliver?', '3.96 days'],
      ['Sales YoY Growth %', '`100 * (sales this year / sales last year - 1)`', 'Are we growing?', '+20.4% in 2017'],
    ], [1700, 3000, 2526, 1800], { size: 18, boldFirst: true }),
    H3('Worked examples: why the definitions matter'),
    ...bullets([
      '**Margin is a ratio of sums.** Total profit divided by total sales is $286,397.02 / $2,297,200.86 = **12.47%**. Averaging the 9,994 individual line margins gives 12.03%, which is wrong because it treats a $2 line and a $20,000 line as equally important.',
      '**Orders are distinct order numbers.** The data has 9,994 order lines but only 5,009 orders, because one order can contain several products. Counting rows would almost double the number of orders.',
    ]),
    H2('2.5 Data sources'),
    P('The project uses five Excel files provided with the task. They are splits of one Superstore order table: row *n* of every file describes sales row *n*. This was checked by comparing the key columns of every file with `sales.xlsx` (all 9,994 rows match).'.replace(/\*n\*/g, 'n')),
    ...table(['File', 'Rows', 'Content', 'Distinct entities'], [
      ['sales.xlsx', '9,994', 'Sales ID, order ID, customer ID, postal code, product ID, sales, quantity, discount, profit', '5,009 orders, 793 customers, 1,862 product IDs'],
      ['customers.xlsx', '9,994', 'Customer ID, customer name, segment', '793 customers, 3 segments'],
      ['dates.xlsx', '9,994', 'Order ID, order date, ship date, ship mode', '5,009 orders, 4 ship modes'],
      ['location.xlsx', '9,994', 'Postal code, country, city, region, state', '632 locations, 4 regions'],
      ['product.xlsx', '9,994', 'Product ID, product name, category, sub-category', '1,894 products, 3 categories, 17 sub-categories'],
    ], [1700, 800, 3926, 2600], { size: 18, boldFirst: true }),
    P('The dataset does not state a currency. All customers are in the United States, so amounts are treated as US dollars.'),
  ];
}

function s3() {
  return [
    H1('3. Data preparation and model', true),
    P('Good dashboards depend on good data. Before loading anything into SAP HANA, the five files were reviewed for problems. Every fix is implemented in the script `scripts/01_prepare_data.py` and protected by an assertion, so the script stops if a rule is ever broken.'),
    H2('3.1 Problems found and how they were solved'),
    ...table(['Problem', 'Evidence', 'Fix'], [
      ['**Dates are corrupted.** Real dates and text are mixed, and the real dates have day and month swapped.', 'Without a fix, 1,708 order lines ship before they are ordered (Section 3.2).', 'Swapped dates are repaired and text dates are read as month/day/year. After the fix, 0 lines ship early.'],
      ['Postal codes lost their leading zero.', 'The smallest value was 1040.', 'Stored as 5-character text, for example `01040`.'],
      ['The four descriptive files repeat the same row once per sales line.', '9,994 rows for 793 customers.', 'De-duplicated and linked to the fact table by keys.'],
      ['32 product IDs carry two different product names.', '1,862 product IDs but 1,894 products.', 'Surrogate key `PRODUCT_KEY`, because `PRODUCT_ID` is not unique.'],
      ['One postal code appears with two city/state values.', '631 postal codes but 632 locations.', 'Surrogate key `GEO_KEY`.'],
      ['Sales values have up to 4 decimals.', 'Rounding to 2 decimals would change more than 4,000 values.', 'Stored as `DECIMAL(15,4)`. Nothing is rounded.'],
    ], [3000, 2900, 3126], { size: 18 }),
    H2('3.2 The date problem in detail'),
    P('The file `dates.xlsx` stores order and ship dates in two different forms: about 40% are real dates and about 60% are text such as `6/16/2016`. The text values are in month/day/year order. The real dates were created when the spreadsheet read text like `11/8/2016` in day/month order, so 8 November 2016 became 11 August 2016: day and month are swapped. A text value can only survive when its day is above 12, because then it cannot be read as a month.'),
    P('The repair rule has two parts: for a real date, swap day and month back; for a text value, read it as month/day/year. The rule was tested in three ways:'),
    ...bullets([
      '**Ship before order:** before the repair 1,708 order lines ship before they are ordered and 3,013 take more than 7 days. After the repair none ship early and all 9,994 lines ship in 0 to 7 days (Figure 2).',
      '**Ship mode:** after the repair the delivery times follow the ship mode names (Table below). Same Day is the fastest and Standard Class the slowest.',
      '**Order numbers:** the year inside the order number (for example `CA-2016-152156`) matches the repaired order year for all but 5 of the 5,009 orders.',
    ]),
    ...figure('docs/figures/fig_date_fix.png', 'Days between order and shipment, before and after the date repair', 2, 560),
    ...table(['Ship mode', 'Orders', 'Fastest (days)', 'Average (days)', 'Slowest (days)'], [
      ['Same Day', '264', '0', '0.05', '1'],
      ['First Class', '787', '1', '2.19', '4'],
      ['Second Class', '964', '1', '3.23', '5'],
      ['Standard Class', '2,994', '3', '5.00', '7'],
    ], [2600, 1500, 1600, 1700, 1626], { size: 19, align: ['left', 'right', 'right', 'right', 'right'], boldFirst: true, keepTogether: true }),
    P('The repair rests on an assumption (the day/month swap) that is strongly supported by these tests. It cannot be checked against the original source system, which was not available.'),
    H2('3.3 The star schema'),
    P('The cleaned data is organized as a star schema: one fact table in the center and five dimension tables around it (Figure 3). The fact table holds the numbers (sales, quantity, discount, profit). The dimension tables hold the descriptions used for filtering and grouping (who, what, where, when).', { keepNext: true }),
    ...figure('docs/figures/fig_star_schema.png', 'Star schema of the Superstore data in SAP HANA (schema SUPERSTORE)', 3, 420),
    ...table(['Table', 'Rows', 'Key', 'Content'], [
      ['FACT_SALES', '9,994', '`SALES_ID`', 'One row per product on one order: sales, quantity, discount, profit, and keys to every dimension'],
      ['DIM_CUSTOMER', '793', '`CUSTOMER_ID`', 'Customer name and segment'],
      ['DIM_PRODUCT', '1,894', '`PRODUCT_KEY`', 'Product ID, name, category, sub-category'],
      ['DIM_GEOGRAPHY', '632', '`GEO_KEY`', 'Postal code, city, state, region'],
      ['DIM_ORDER', '5,009', '`ORDER_ID`', 'Order date, ship date, ship mode, ship days'],
      ['DIM_DATE', '1,461', '`CAL_DATE`', 'Calendar 2014 to 2017: year, quarter, month, month name'],
    ], [1900, 800, 1900, 4426], { size: 18, boldFirst: true, align: ['left', 'right', 'left', 'left'] }),
    P('**Why a star schema?** It needs only simple joins, aggregates quickly in the column store of SAP HANA, and dashboard tools understand it. **Why surrogate keys?** `PRODUCT_ID` and `POSTAL_CODE` are not unique, so a generated key is the only safe primary key.'),
    H2('3.4 The preparation pipeline'),
    ...numbered([
      'Read the five Excel files and check that all files are row-aligned with `sales.xlsx`.',
      'Repair the dates, calculate `SHIP_DAYS` and restore the leading zeros of the postal codes. Stop if any order ships before it is ordered.',
      'Build the five dimension tables and assign surrogate keys where needed.',
      'Build the fact table with keys instead of descriptions. Stop if any key is missing.',
      'Write six CSV files to `data/clean/`, ready to load into SAP HANA.',
    ]),
  ];
}

function s4() {
  return [
    H1('4. Tool selection', true),
    H2('4.1 Requirements'),
    P('The task requires a visualization tool that integrates with SAP HANA. Beyond that, the dashboard design in Section 5 needs the following:'),
    ...bullets([
      'A supported connection to SAP HANA, preferably live, so that SAP HANA does the calculation.',
      'The chart types of the design: line, bar, column, donut, heatmap, table and KPI tiles.',
      'Shared filters that apply to every chart on both pages.',
      'Conditional colours (red for losses) and custom labels on the marks.',
      'A tool that can be obtained and learned within the time of the task.',
    ]),
    H2('4.2 Candidates compared'),
    P('Three widely used tools were compared. The comparison is qualitative and based on the requirements above. Licensing and trial terms change, so they should be checked on the vendor websites.'),
    ...table(['Criterion', 'Tableau Desktop', 'SAP Analytics Cloud', 'Power BI Desktop'], [
      ['SAP HANA connection', 'Native SAP HANA connector. Needs the SAP HANA ODBC driver.', 'Live connection to SAP HANA, built on calculation views.', 'SAP HANA database connector. Needs the SAP HANA ODBC driver.'],
      ['Query mode', 'Live or extract', 'Live (data stays in SAP HANA) or import', 'DirectQuery or import'],
      ['Visual flexibility', 'Very high: free-form worksheets, dual axes, custom labels and colours', 'High: story-based, close to SAP planning', 'High: many chart types and a strong formula language'],
      ['Needs a calculation view?', 'No. Works on a plain SQL view.', 'Yes, for live models.', 'No.'],
      ['Availability for a learner', 'Desktop needs a licence or trial. Tableau Public has no SAP HANA connector.', 'Needs a SAP Analytics Cloud tenant (trial where offered).', 'Desktop is free to download.'],
      ['Typical best fit', 'Analysts who want full control of visual design', 'SAP-centered organizations with governed enterprise reporting', 'Microsoft-centered organizations'],
    ], [1700, 2442, 2442, 2442], { size: 17, boldFirst: true }),
    H2('4.3 Decision: Tableau Desktop'),
    P('**Tableau Desktop was selected.** The reasons are:'),
    ...bullets([
      '**It integrates with SAP HANA natively.** The SAP HANA connector meets the requirement of the task directly, and the connection can be live.',
      '**It matches the wireframes.** The free-form worksheet and container layout can reproduce the planned layout, including direct labels, red negative bars and a heatmap.',
      '**It works on the SQL view.** The dashboard reads `V_SALES_ENRICHED` directly, so no extra modeling layer is needed for a dataset of this size.',
      '**Interaction is built in.** Shared filters, tooltips and highlight actions need no code.',
    ]),
    P('**What would change the decision?** In an organization that already runs everything on SAP and needs governed enterprise reporting, SAP Analytics Cloud would be the natural choice. In a Microsoft-centered organization, Power BI would be. The data model and SQL views in this project work with all three tools. The repository guide `docs/connecting_bi_tool.md` explains the connection steps for Tableau and for SAP Analytics Cloud.'),
    H2('4.4 How Tableau connects to SAP HANA'),
    P('Figure 4 shows the data flow. Tableau connects to SAP HANA with the SAP HANA connector, which uses the SAP HANA ODBC driver installed on the analyst\'s computer. With a live connection, Tableau sends queries to SAP HANA; SAP HANA joins and aggregates the data and returns only the result for the selected filters.', { keepNext: true }),
    ...figure('docs/figures/fig_architecture.png', 'Data flow from the Excel files to the dashboard', 4, 600),
    ...table(['Option', 'How it works', 'Advantages', 'Disadvantages'], [
      ['Live', 'Every chart sends a query to SAP HANA', 'Always current. SAP HANA stays the single source of truth. Shows the integration.', 'Needs a working connection. Response time depends on SAP HANA and the network.'],
      ['Extract', 'Tableau copies the data into its own file', 'Fast and works offline.', 'A snapshot: it must be refreshed to show new data.'],
    ], [1000, 2400, 3000, 2626], { size: 18, boldFirst: true }),
    P('**Choice:** live. The dataset is small, so both options would perform well, and a live connection keeps SAP HANA as the single source of truth.'),
    P('**Prerequisites:** the SAP HANA ODBC driver on the analyst\'s computer; the address and port of the SAP HANA instance (for SAP HANA Cloud this is its SQL endpoint, port 443, with SSL required); a database user with read access to the schema `SUPERSTORE`.'),
  ];
}

function s5() {
  return [
    H1('5. Dashboard design', true),
    H2('5.1 Design principles'),
    ...bullets([
      '**One message per visual.** Each chart answers one question and its title says which.',
      '**Reading order.** The eye moves from top left to bottom right: filters, headline KPIs, trend, then breakdowns.',
      '**Values on the marks.** Labels sit directly on the bars so nobody has to read values off an axis. Colour is never the only carrier of meaning.',
      '**Fixed colour meaning.** The same colour always means the same thing (Section 5.4).',
      '**Correct measures.** Margin is always a ratio of sums, and orders and customers are distinct counts.',
      '**Two pages.** Page 1 shows what is happening. Page 2 explains why. Both pages share the same filters.',
    ]),
    H2('5.2 Wireframes'),
    P('A wireframe fixes the layout before any data is plotted. The numbers in Figures 5 and 6 match the numbers in the tables that follow.', { keepNext: true }),
    ...figure('docs/figures/fig_wireframe_page1.png', 'Wireframe of page 1, Executive Overview', 5, 600),
    ...table(['#', 'Element', 'Content', 'Why it is placed here'], [
      ['1', 'Header', 'Title, data source note, page tabs', 'Tells the reader what and where the data comes from'],
      ['2', 'Filter bar', 'Year, Region, Category, Segment', 'Directly under the header so the scope is visible before reading numbers'],
      ['3', 'KPI cards (6)', 'Sales, profit, margin, orders, average order value, customers, each with change against the previous year', 'First thing read: the answer in six numbers'],
      ['4', 'Line chart', 'Monthly sales, one line per year', 'Largest area, because growth and seasonality is the first business question'],
      ['5', 'Bar chart', 'Sales by region, label shows margin', 'Beside the trend: where does the sales come from'],
      ['6', 'Donut chart', 'Sales by category, label shows margin', 'Composition row: what is sold'],
      ['7', 'Column chart', 'Sales by customer segment', 'Composition row: to whom'],
      ['8', 'Bar chart', 'Ship mode share and average days', 'Composition row: how fast it is delivered'],
    ], [500, 1500, 3500, 3526], { size: 18, align: ['center', 'left', 'left', 'left'] }),
    ...figure('docs/figures/fig_wireframe_page2.png', 'Wireframe of page 2, Products & Customers', 6, 600),
    ...table(['#', 'Element', 'Content', 'Why it is placed here'], [
      ['3', 'Bar chart', 'Profit margin by sub-category (17 bars)', 'Tall panel on the left: 17 labels need height, and it is the main profit driver'],
      ['4', 'Column chart', 'Profit margin by discount band', 'Shows how discounts relate to profit'],
      ['5', 'Bar chart', 'Top 8 states by sales, losses in red', 'Geography: which large states lose money'],
      ['6', 'Heatmap', 'Margin by region and category', 'Two dimensions at once: where the weak spots are'],
      ['7', 'Table', 'Top 10 customers by sales', 'Exact values for key accounts'],
    ], [500, 1500, 3500, 3526], { size: 18, align: ['center', 'left', 'left', 'left'] }),
    H2('5.3 Visualization rationale'),
    P('For every visual, the table gives the question it answers, the chart type, why that type fits, and what was rejected.', { keepNext: true }),
    ...table(['Visual', 'Question', 'Chart', 'Why this chart', 'Rejected'], [
      ['KPI cards', 'What are the headline numbers?', 'Number tiles with change arrow', 'Fastest to read. The arrow shows the change against the previous year.', 'Gauges: waste space and are hard to read exactly'],
      ['Monthly sales by year', 'Are we growing? Is there seasonality?', 'Line, one line per year', 'Months line up, so years compare directly. Position on a common scale is easy to judge.', 'Stacked area (hides year comparison); 48 columns (cluttered)'],
      ['Sales by region', 'Which region leads or lags?', 'Horizontal bar, sorted', 'Ranking is easy to read and labels fit.', 'Pie (hard to compare); map (only 4 regions)'],
      ['Sales by category', 'What share does each category have?', 'Donut, 3 slices', 'Part-to-whole works when there are very few slices.', 'Donut with many slices'],
      ['Sales by segment', 'Which customer group buys most?', 'Column', 'Three categories compare well side by side.', 'Pie'],
      ['Ship mode', 'How is shipping split, and how fast?', 'Horizontal bar, share, with average days as label', 'Bar length shows share and the label shows the second measure.', 'Table (slower to scan)'],
      ['Margin by sub-category', 'What loses money?', 'Horizontal bar, sorted, red for negative', '17 categories need a ranked list, and the sign of the value matters.', 'Columns with rotated labels'],
      ['Margin by discount band', 'Do discounts cost profit?', 'Column with zero line, red for negative', 'Ordered bands show the margin turning negative.', 'Scatter of discount vs margin (more detail, harder for managers)'],
      ['Top 8 states', 'Which large states lose money?', 'Horizontal bar, red for loss', 'Exact comparison of sizes with a clear loss signal.', 'Filled map (area bias, hard to compare)'],
      ['Region x category', 'Where are the weak spots?', 'Heatmap with values in cells', 'Two dimensions and a ratio: colour shows the pattern, the number gives the value.', '12 grouped bars'],
      ['Top 10 customers', 'Who are the key accounts?', 'Table', 'Exact values of five measures side by side.', 'Bar chart (shows one measure only)'],
    ], [1300, 1500, 1500, 2526, 2200], { size: 16 }),
    H2('5.4 Colours and typography'),
    ...table(['Colour', 'Code', 'Meaning'], [
      ['Blue', '#2E75B6', 'Normal value'],
      ['Orange', '#E07B10', 'Highlight or needs attention: the latest year, the lowest margin, the weakest category'],
      ['Red', '#C0392B', 'Loss (negative profit or margin)'],
      ['Green', '#2E9E5B', 'Favourable change'],
      ['Dark navy', '#1F3864', 'Titles, labels and header'],
      ['Grey', '#5B6573', 'Secondary text such as chart notes and sources'],
    ], [1500, 1500, 6026], { size: 18, boldFirst: true, keepTogether: true }),
    P('One sans-serif typeface is used throughout. The size hierarchy is: KPI value (largest), chart title (bold), labels (regular). Every chart has its own title and a short note naming the chart type.'),
    H2('5.5 Filters and interactions'),
    ...bullets([
      '**Filters:** Year, Region, Category and Segment. Each is a multi-select drop-down. All four apply to every chart on both pages.',
      '**Tooltips:** sales, profit, margin and orders for the item under the cursor.',
      '**Highlight action:** selecting a region or category in one chart highlights the same item in the other charts.',
      '**KPI cards under a filter:** the values follow all four filters. The change arrow always compares 2017 with 2016 for the selected region, category and segment, and the Year filter does not change it.',
    ]),
  ];
}

module.exports = { cover, contents, s1, s2, s3, s4, s5 };
