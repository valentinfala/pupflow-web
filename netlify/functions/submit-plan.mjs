// Receives the finished form. Only accepted with a valid purchase code from capture-order.
// Forwards everything to the automation (MAKE_WEBHOOK_URL), which builds and emails the PDF.
// payment_status is read from PayPal here, server side. The automation must only build the PDF
// when it is "COMPLETED"; "PENDING" means the sale still has to be accepted in PayPal.
import { json, verify, LANG, paypal } from "../lib/shared.mjs";
export default async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const body = await req.json().catch(() => null);
  if (!body || !body.payload) return json(400, { error: "bad_body" });
  const { order, token, purchase_lang, payload } = body;
  if (!verify(order, LANG(purchase_lang), token)) return json(403, { error: "no_valid_purchase" });
  let payment_status = "UNKNOWN", capture_id = "";
  try {
    const r = await paypal(`/v2/checkout/orders/${encodeURIComponent(order)}`, { method: "GET" });
    const cap = (((r.data.purchase_units || [])[0] || {}).payments || {}).captures?.[0] || {};
    if (r.ok) { payment_status = cap.status || r.data.status || "UNKNOWN"; capture_id = cap.id || ""; }
  } catch (e) {}
  // Payment fields go last so the form can never overwrite them.
  const record = { ...payload, order_id: order, received_at: new Date().toISOString(), payment_status, capture_id };
  const hook = process.env.MAKE_WEBHOOK_URL;
  if (!hook) return json(200, { ok: true, forwarded: false }); // testing without automation yet
  const r = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(record) });
  if (!r.ok) return json(502, { error: "automation_failed", status: r.status });
  return json(200, { ok: true, forwarded: true });
};
