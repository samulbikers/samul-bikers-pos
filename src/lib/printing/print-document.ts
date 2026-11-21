export function printDocument(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=420,height=760");
  if (!win) {
    window.print();
    return;
  }

  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace; color: #111; }
  .sheet { width: 80mm; margin: 0 auto; }
  h1, h2, h3, p { margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 3px 0; font-size: 11px; vertical-align: top; }
  th { text-align: left; border-bottom: 1px dashed #999; }
  .num { text-align: right; white-space: nowrap; }
  .center { text-align: center; }
  .rule { border-top: 1px dashed #999; margin: 8px 0; }
  .muted { color: #555; }
  .total { font-size: 15px; font-weight: 700; }
  @media print {
    @page { size: 80mm auto; margin: 4mm; }
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body><div class="sheet">${bodyHtml}</div></body>
</html>`);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 300);
}
