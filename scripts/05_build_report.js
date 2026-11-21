#!/usr/bin/env node
// Step 5: build the Word report. Usage: node scripts/05_build_report.js
// Needs the npm package "docx".  Output: Task4_SAP_HANA_KPI_Dashboard_Report.docx
const fs = require('fs');
const path = require('path');
const L = require('./report/lib');
const A = require('./report/part_a');
const B = require('./report/part_b');
const { D, FONT, COL } = L;
const { Document, Packer, Paragraph, TextRun, Footer, AlignmentType, PageNumber, PageOrientation } = D;

const bodyA = [
  ...A.cover(), ...A.contents(), ...A.s1(), ...A.s2(), ...A.s3(), ...A.s4(), ...A.s5(), ...B.s6(),
];
const bodyLand = [...B.s7Land()];
const bodyC = [
  ...B.s7Read(), ...B.s8(), ...B.s9(), ...B.s10(), ...B.s11(), ...B.s12(),
  ...B.appendixA(), ...B.appendixB(), ...B.appendixC(),
];

const small = { size: 16, color: COL.grey, font: FONT };
const makeFooter = () => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
  new TextRun({ ...small, text: 'Superstore Sales Performance Dashboard  |  Task 4, Week 4  |  Page ' }),
  new TextRun({ ...small, children: [PageNumber.CURRENT] }),
  new TextRun({ ...small, text: ' of ' }),
  new TextRun({ ...small, children: [PageNumber.TOTAL_PAGES] }),
] })] });
const margin = { top: 1440, right: 1440, bottom: 1300, left: 1440 };
const section = (children, o = {}) => ({
  properties: {
    titlePage: !!o.first,
    page: { size: { width: 11906, height: 16838, orientation: o.landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT }, margin },
  },
  footers: o.first
    ? { default: makeFooter(), first: new Footer({ children: [new Paragraph({ children: [] })] }) }
    : { default: makeFooter() },
  children,
});

const h = (size, color, before, after) => ({
  run: { font: FONT, size, bold: true, color },
  paragraph: { spacing: { before, after }, keepNext: true, keepLines: true },
});

const doc = new Document({
  creator: 'Mehul Vishwakarma',
  title: 'Superstore Sales Performance Dashboard: SAP HANA Task 4 Report',
  description: 'Week 4 task: KPI dashboard using SAP HANA',
  styles: {
    default: {
      document: { run: { font: FONT, size: 21 } },
      heading1: h(34, COL.navy, 360, 160),
      heading2: h(26, COL.blue, 280, 120),
      heading3: h(22, COL.grey, 200, 90),
    },
  },
  numbering: { config: L.numberingConfig() },
  sections: [
    section(bodyA, { first: true }),
    section(bodyLand, { landscape: true }),
    section(bodyC),
  ],
});

const out = path.resolve(__dirname, '..', 'Task4_SAP_HANA_KPI_Dashboard_Report.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log('Wrote', path.relative(process.cwd(), out), (buf.length / 1e6).toFixed(2), 'MB');
});
