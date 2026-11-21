import { formatKes } from "@/lib/format";
import { servedBy, type ReceiptData } from "@/lib/receipts/receipt";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3 ${strong ? "text-[13px] font-semibold" : "text-[11px]"}`}>
      <span className={strong ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={`text-right ${strong ? "text-foreground" : "text-card-foreground"}`}>{value}</span>
    </div>
  );
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const mathBalances = Math.round(data.subtotal - data.discount + data.vat) === Math.round(data.total);

  return (
    <div className="rounded-lg border border-dashed border-border bg-background p-4 font-mono text-[11px] text-card-foreground">
      <div className="text-center">
        <p className="text-[14px] font-bold tracking-wide">{data.business.name.toUpperCase()}</p>
        <p className="mt-0.5 text-[11px] font-semibold">{data.business.branch}</p>
        <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
          {data.business.address}
          <br />
          {data.business.phone} · {data.business.email}
          <br />
          Tax PIN: {data.business.taxId}
        </p>
      </div>

      <div className="my-3 border-t border-dashed border-border" />
      <p className="text-center text-[12px] font-bold tracking-[0.15em]">OFFICIAL RECEIPT</p>
      <div className="my-3 border-t border-dashed border-border" />

      <div className="space-y-1">
        <Row label="Receipt No." value={data.number} />
        <Row label="Date & time" value={data.date} />
        <Row label="Till" value={data.till} />
        <Row label="Served by" value={servedBy(data)} />
        <Row label="Customer" value={data.customer} />
      </div>

      <div className="my-3 border-t border-dashed border-border" />
      <div className="grid grid-cols-[1fr_28px_64px_64px] gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Item</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit</span>
        <span className="text-right">Total</span>
      </div>
      <div className="mt-1 space-y-1.5">
        {data.lines.length ? (
          data.lines.map((line, index) => (
            <div key={`${line.title}-${index}`} className="grid grid-cols-[1fr_28px_64px_64px] gap-1">
              <span className="break-words">{line.title}</span>
              <span className="text-right">{line.quantity}</span>
              <span className="text-right">{formatKes(line.unitPrice)}</span>
              <span className="text-right">{formatKes(line.lineTotal)}</span>
            </div>
          ))
        ) : (
          <p className="text-[10px] text-muted-foreground">No line items</p>
        )}
      </div>

      <div className="my-3 border-t border-dashed border-border" />
      <div className="space-y-1">
        <Row label="Subtotal" value={formatKes(data.subtotal)} />
        <Row label="Discounts" value={`− ${formatKes(data.discount)}`} />
        <Row label="VAT (16%)" value={formatKes(data.vat)} />
        <div className="my-1 border-t border-dashed border-border" />
        <Row label="TOTAL PAID" value={formatKes(data.total)} strong />
      </div>

      <div className="my-3 border-t border-dashed border-border" />
      <div className="space-y-1">
        <Row label="Payment" value={`${data.paymentMethod} · ${data.status.toUpperCase()}`} />
        <Row label="Reference" value={data.paymentReference} />
      </div>

      <div className="my-3 border-t border-dashed border-border" />
      <p className="text-center text-[9px] leading-relaxed text-muted-foreground">
        Returns accepted within 7 days with this receipt and original packaging.
        <br />
        Warranty claims require this receipt.
        <br />
        <br />
        Thank you for shopping with us — ride safe.
      </p>
      {!mathBalances ? (
        <p className="mt-3 rounded border border-destructive/30 bg-destructive/5 p-2 text-center text-[9px] text-destructive">
          Total check failed: subtotal − discount + VAT does not equal total.
        </p>
      ) : null}
    </div>
  );
}
