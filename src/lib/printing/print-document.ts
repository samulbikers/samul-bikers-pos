export function printDocument(title: string, bodyHtml: string) {
  const frame = document.createElement("iframe");
  frame.title = title;
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(frame);

  const doc = frame.contentWindow?.document;
  if (!doc) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(`<!doctype html>
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
  doc.close();

  window.setTimeout(() => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      window.setTimeout(() => frame.remove(), 1500);
    }
  }, 350);
}
