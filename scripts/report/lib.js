// Helper functions for building the Word report with docx-js.
const fs = require('fs');
const path = require('path');
const D = require('docx');
const {
  Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType, BorderStyle,
  WidthType, ShadingType, VerticalAlign,
} = D;

const ROOT = path.resolve(__dirname, '..', '..');
const FONT = 'Arial';
const COL = {
  navy: '1F3864', blue: '2E75B6', orange: 'E07B10', grey: '5B6573', light: 'EEF2F8',
  border: 'C9D2E0', red: 'C0392B', green: '2E9E5B', code: 'F3F5F8', tintOrange: 'FDF1E3', tintBlue: 'E8F1FA',
};
const CONTENT_W = 9026; // A4 page, 1-inch margins (DXA)

// ---------- inline text: **bold** and `code` ----------
function runs(text, base = {}) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((s) => s !== '');
  return parts.map((p) => {
    if (p.startsWith('**')) return new TextRun({ font: FONT, ...base, text: p.slice(2, -2), bold: true });
    if (p.startsWith('`')) {
      return new TextRun({ ...base, text: p.slice(1, -1), font: 'Courier New', size: Math.max((base.size || 21) - 2, 14), color: COL.navy });
    }
    return new TextRun({ font: FONT, ...base, text: p });
  });
}

const P = (text, o = {}) => new Paragraph({
  children: runs(text, o.run || {}),
  spacing: { before: o.before ?? 0, after: o.after ?? 120, line: 276 },
  alignment: o.align, keepNext: o.keepNext, indent: o.indent,
});

const H1 = (text, pageBreak = false) => new Paragraph({
  heading: D.HeadingLevel.HEADING_1, pageBreakBefore: pageBreak, children: [new TextRun({ text })],
});
const H2 = (text) => new Paragraph({ heading: D.HeadingLevel.HEADING_2, children: [new TextRun({ text })] });
const H3 = (text) => new Paragraph({ heading: D.HeadingLevel.HEADING_3, children: [new TextRun({ text })] });

// ---------- lists ----------
const numberedRefs = [];
function bullets(items) {
  return items.map((t) => new Paragraph({
    numbering: { reference: 'bullets', level: 0 }, spacing: { after: 70, line: 270 }, children: runs(t),
  }));
}
function numbered(items) {
  const ref = `num${numberedRefs.length + 1}`;
  numberedRefs.push(ref);
  return items.map((t) => new Paragraph({
    numbering: { reference: ref, level: 0 }, spacing: { after: 70, line: 270 }, children: runs(t),
  }));
}
function numberingConfig() {
  const level = (fmt, text) => [{
    level: 0, format: fmt, text, alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 540, hanging: 300 } } },
  }];
  return [
    { reference: 'bullets', levels: level(D.LevelFormat.BULLET, '\u2022') },
    ...numberedRefs.map((ref) => ({ reference: ref, levels: level(D.LevelFormat.DECIMAL, '%1.') })),
  ];
}

// ---------- tables ----------
function table(headers, rows, widths, o = {}) {
  const sum = widths.reduce((a, b) => a + b, 0);
  if (sum !== CONTENT_W && !o.allowOddWidth) throw new Error(`column widths sum to ${sum}, expected ${CONTENT_W}`);
  const line = { style: BorderStyle.SINGLE, size: 4, color: COL.border };
  const borders = { top: line, bottom: line, left: line, right: line };
  const fs = o.size || 18;
  const al = (i) => ({ left: AlignmentType.LEFT, right: AlignmentType.RIGHT, center: AlignmentType.CENTER }[(o.align || [])[i] || 'left']);
  const cell = (text, i, { head = false, shade, boldFirst = false, keep = false } = {}) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, borders, verticalAlign: VerticalAlign.CENTER,
    shading: head ? { type: ShadingType.CLEAR, fill: COL.navy, color: 'auto' }
      : shade ? { type: ShadingType.CLEAR, fill: shade, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: String(text).split('\n').map((ln) => new Paragraph({
      alignment: al(i), keepNext: keep || undefined, spacing: { before: 0, after: 0, line: 252 },
      children: runs(ln, { size: fs, bold: head || (boldFirst && i === 0) || undefined, color: head ? 'FFFFFF' : undefined }),
    })),
  });
  const head = new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, i, { head: true, keep: !!o.keepTogether })) });
  const body = rows.map((r, ri) => new TableRow({
    cantSplit: true,
    children: r.map((c, i) => cell(c, i, { shade: ri % 2 === 1 ? 'F6F8FB' : undefined, boldFirst: o.boldFirst, keep: !!o.keepTogether && ri < rows.length - 1 })),
  }));
  return [new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: [head, ...body] }), spacer()];
}
const spacer = (after = 120) => new Paragraph({ spacing: { before: 0, after }, children: [] });

// ---------- boxed note ----------
function callout(title, text, color = COL.orange, fill = COL.tintOrange) {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const paras = [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, font: FONT, size: 20, color })] })];
  String(text).split('\n').forEach((t) => paras.push(new Paragraph({ spacing: { after: 60, line: 264 }, children: runs(t, { size: 19 }) })));
  return [new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      borders: { top: none, bottom: none, right: none, left: { style: BorderStyle.SINGLE, size: 28, color } },
      shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
      margins: { top: 100, bottom: 100, left: 180, right: 160 }, children: paras,
    })] })],
  }), spacer(160)];
}

// ---------- code ----------
function code(text, o = {}) {
  const sz = o.size || 16;
  const lines = text.replace(/\s+$/, '').split('\n');
  const out = lines.map((ln) => new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: COL.code, color: 'auto' },
    spacing: { before: 0, after: 0, line: 232 }, indent: { left: 140, right: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 14, color: COL.blue, space: 6 } },
    children: [new TextRun({ text: ln === '' ? ' ' : ln, font: 'Courier New', size: sz })],
  }));
  out.push(spacer(160));
  return out;
}

// ---------- figures ----------
let figN = 0;
function pngSize(buf) { return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }; }
function figure(rel, caption, expectedNo, w = 600) {
  figN += 1;
  if (expectedNo !== figN) throw new Error(`figure order: "${caption}" is figure ${figN}, text says ${expectedNo}`);
  const buf = fs.readFileSync(path.join(ROOT, rel));
  const { width, height } = pngSize(buf);
  const h = Math.round((w * height) / width);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: 'png', data: buf, transformation: { width: w, height: h },
        altText: { title: caption, description: caption, name: `figure${figN}` } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 220 },
      children: [new TextRun({ text: `Figure ${figN}: ${caption}`, italics: true, size: 18, color: COL.grey, font: FONT })],
    }),
  ];
}

// ---------- data ----------
function readCsv(rel) {
  const lines = fs.readFileSync(path.join(ROOT, rel), 'utf8').trim().split(/\r?\n/);
  const parse = (ln) => {
    const out = []; let cur = ''; let q = false;
    for (let i = 0; i < ln.length; i++) {
      const c = ln[i];
      if (q) { if (c === '"' && ln[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
    }
    out.push(cur); return out;
  };
  const head = parse(lines[0]);
  return { head, rows: lines.slice(1).map(parse) };
}
const readText = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const num = (v, d = 2) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = (v, d = 2) => (Number(v) < 0 ? '-$' : '$') + num(Math.abs(Number(v)), d);
function fmtCell(col, v) {
  if (v === '' || v === undefined) return '-';
  if (/SALES$|PROFIT$|AVG_ORDER_VALUE|PROFIT_LOST|^TOTAL_/.test(col) && !/PCT|YOY|MARGIN/.test(col)) return money(v);
  if (/PCT|YOY|MARGIN/.test(col)) return `${num(v, /YOY|SHARE/.test(col) ? 1 : 2)}%`;
  if (/ORDERS|LINES|CUSTOMERS|ROW_COUNT|AFFECTED/.test(col)) return num(v, 0);
  if (/^CAL_YEAR$/.test(col)) return String(v);
  if (/AVG_SHIP/.test(col)) return num(v, 2);
  return String(v);
}

module.exports = {
  D, ROOT, FONT, COL, CONTENT_W, runs, P, H1, H2, H3, bullets, numbered, numberingConfig, table, spacer,
  callout, code, figure, readCsv, readText, num, money, fmtCell,
};
