// Captures the 3rd-program payment, checks it is real and belongs to this plan, and remembers it server side.
import { json, paypal, verify, LANG, ADDON_PRICE, ADDON_TAG, sign, captureOk } from "../lib/shared.mjs";
import { saveAddon } from "../lib/orders.mjs";
export default async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const { orderID, order, token, plan_lang } = await req.json().catch(() => ({}));
  if (!verify(order, LANG(plan_lang), token)) return json(403, { error: "no_valid_purchase" });
  if (!orderID || !/^[A-Z0-9]{6,40}$/.test(orderID)) return json(400, { error: "bad_order" });
  try {
    let r = await paypal(`/v2/checkout/orders/${orderID}/capture`, { method: "POST", body: "{}" });
    if (!r.ok && r.data && r.data.details && r.data.details.some(d => d.issue === "ORDER_ALREADY_CAPTURED")) {
      r = await paypal(`/v2/checkout/orders/${orderID}`, { method: "GET" });
    }
    if (!r.ok) return json(402, { error: "capture_failed", detail: r.data && (r.data.details?.[0]?.issue || r.data.name) });
    const o = r.data, pu = (o.purchase_units || [])[0] || {};
    const cap = ((pu.payments || {}).captures || [])[0] || {};
    const paid = o.status === "COMPLETED" && captureOk(cap) && pu.custom_id === ADDON_TAG(order)
      && cap.amount && cap.amount.currency_code === "USD" && Number(cap.amount.value) >= Number(ADDON_PRICE());
    if (!paid) return json(402, { error: "not_paid", status: o.status, capture: cap.status });
    await saveAddon(order, { paid: true, addon_order: o.id, capture_id: cap.id, payment_status: cap.status, value: cap.amount.value, paid_at: new Date().toISOString() });
    return json(200, { ok: true, addon_order: o.id, addon_token: sign(o.id, ADDON_TAG(order)), value: cap.amount.value });
  } catch (e) {
    return json(500, { error: "server", detail: String(e.message || e) });
  }
};
