import { type Order } from "@shared/schema";

function shopHeader() {
  return `
    <div class="shop-header">
      <div class="shop-name">Lavanderia Sunrise</div>
      <div class="shop-sub">Dacanlao, Calaca, Batangas 4212</div>
      <div class="shop-sub">0955 921 8921 · zareenans09@gmail.com</div>
    </div>`;
}

function divider() {
  return `<div class="divider">- - - - - - - - - - - - - - - - - - - -</div>`;
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatCurrency(v: string | number) {
  return `₱${Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

const BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; background: #fff; color: #000; }
  .shop-name { font-weight: bold; text-align: center; letter-spacing: 1px; }
  .shop-sub { text-align: center; }
  .divider { text-align: center; letter-spacing: 1px; }
  .row { display: flex; justify-content: space-between; }
  .label { opacity: 0.7; }
  .bold { font-weight: bold; }
  .center { text-align: center; }
  .badge { display: inline-block; border: 1px solid; padding: 1px 6px; border-radius: 3px; }
  .paid { color: #15803d; border-color: #15803d; background: #f0fdf4; }
  .unpaid { color: #b91c1c; border-color: #b91c1c; background: #fef2f2; }
  @media print {
    body { margin: 0; }
    @page { margin: 4mm; }
  }
`;

/* ─── STICKER ─────────────────────────────────────────────── */
export function printSticker(order: Order) {
  const win = window.open("", "_blank", "width=400,height=350");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Sticker - ${order.orderId}</title>
  <style>
    ${BASE_STYLES}
    body { width: 288px; padding: 8px; font-size: 11px; line-height: 1.4; }
    .shop-name { font-size: 13px; margin-bottom: 2px; }
    .shop-sub { font-size: 9px; }
    .order-id { font-size: 22px; font-weight: bold; text-align: center; letter-spacing: 2px; margin: 6px 0; border: 2px solid #000; padding: 4px; }
    .row { margin: 2px 0; font-size: 10px; }
    .divider { font-size: 9px; margin: 5px 0; }
    .tag-line { text-align: center; font-size: 9px; margin-top: 6px; opacity: 0.5; }
  </style></head><body>
  ${shopHeader()}
  ${divider()}
  <div class="order-id">${order.orderId}</div>
  ${divider()}
  <div class="row"><span class="label">Customer:</span><span class="bold">${order.customerName}</span></div>
  <div class="row"><span class="label">Service:</span><span>${order.service}</span></div>
  <div class="row"><span class="label">Weight:</span><span>${order.weight} kg</span></div>
  <div class="row"><span class="label">Received:</span><span>${formatDate(order.createdAt)}</span></div>
  ${order.notes ? `<div class="row"><span class="label">Notes:</span><span>${order.notes}</span></div>` : ""}
  <div class="tag-line">Lavanderia Sunrise · Laundry Sticker</div>
  </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

/* ─── RECEIPT ─────────────────────────────────────────────── */
export function printReceipt(order: Order, type: "dropoff" | "pickup") {
  const isPickup = type === "pickup";
  const title = isPickup ? "PICKUP RECEIPT" : "DROP-OFF RECEIPT";
  const note = isPickup
    ? "Thank you for choosing Lavanderia Sunrise!"
    : "We will notify you once your laundry is ready.\nKeep this receipt for reference.";

  const win = window.open("", "_blank", "width=500,height=700");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${title} - ${order.orderId}</title>
  <style>
    ${BASE_STYLES}
    body { width: 320px; padding: 12px; font-size: 12px; line-height: 1.6; }
    .shop-name { font-size: 16px; margin-bottom: 2px; }
    .shop-sub { font-size: 10px; }
    .receipt-title { text-align: center; font-size: 13px; font-weight: bold; letter-spacing: 2px; margin: 8px 0; }
    .order-id { font-size: 18px; font-weight: bold; text-align: center; margin: 6px 0; }
    .section { margin: 8px 0; }
    .section-label { font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; margin: 6px 0; }
    .divider { font-size: 10px; margin: 8px 0; }
    .footer { text-align: center; font-size: 10px; margin-top: 10px; opacity: 0.7; white-space: pre-line; }
    .badge { font-size: 11px; padding: 2px 8px; }
  </style></head><body>
  ${shopHeader()}
  ${divider()}
  <div class="receipt-title">${title}</div>
  <div class="order-id">${order.orderId}</div>
  ${divider()}

  <div class="section">
    <div class="section-label">Customer</div>
    <div>${order.customerName}</div>
    <div>${order.contactNumber}</div>
    <div>${order.email}</div>
    <div>${order.address}</div>
  </div>

  ${divider()}

  <div class="section">
    <div class="section-label">Service Details</div>
    <div class="row"><span>Service</span><span>${order.service}</span></div>
    <div class="row"><span>Weight</span><span>${order.weight} kg</span></div>
    ${order.notes ? `<div class="row"><span>Notes</span><span style="max-width:160px;text-align:right">${order.notes}</span></div>` : ""}
  </div>

  ${divider()}

  <div class="total-row">
    <span>TOTAL</span>
    <span>${formatCurrency(order.total)}</span>
  </div>
  <div class="row">
    <span class="label">Payment</span>
    <span class="badge ${order.paid ? "paid" : "unpaid"}">${order.paid ? "PAID" : "UNPAID"}</span>
  </div>

  ${divider()}

  <div class="section">
    <div class="row"><span class="label">${isPickup ? "Picked up" : "Received"}</span><span>${formatDate(isPickup ? order.createdAt : order.createdAt)}</span></div>
    <div class="row"><span class="label">Status</span><span>${order.status.replace(/_/g, " ").toUpperCase()}</span></div>
  </div>

  ${divider()}

  <div class="footer">${note}</div>
  </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}
