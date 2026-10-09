// Captures the payment and checks it is real and complete before giving the buyer a purchase code.
import { json, paypal, PRICE, LANG, sign } from "../lib/shared.mjs";
export default async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const { orderID } = await req.json().catch(() => ({}));
  if (!orderID || !/^[A-Z0-9]{6,40}$/.test(orderID)) return json(400, { error: "bad_order" });
  try {
    let r = await paypal(`/v2/checkout/orders/${orderID}/capture`, { method: "POST", body: "{}" });
    // Already captured (e.g. the buyer refreshed): read the order instead.
    if (!r.ok && r.data && r.data.details && r.data.details.some(d => d.issue === "ORDER_ALREADY_CAPTURED")) {
      r = await paypal(`/v2/checkout/orders/${orderID}`, { method: "GET" });
    }
    if (!r.ok) return json(402, { error: "capture_failed", detail: r.data && (r.data.details?.[0]?.issue || r.data.name) });
    const o = r.data, pu = (o.purchase_units || [])[0] || {};
    const cap = ((pu.payments || {}).captures || [])[0] || {};
    const paid = o.status === "COMPLETED" && cap.status === "COMPLETED"
      && cap.amount && cap.amount.currency_code === "USD" && Number(cap.amount.value) >= Number(PRICE());
    if (!paid) return json(402, { error: "not_paid", status: o.status, capture: cap.status });
    const pl = LANG(String(pu.custom_id || "").replace("plan_lang:", ""));
    return json(200, {
      ok: true, order: o.id, capture_id: cap.id, plan_lang: pl,
      email: (o.payer && o.payer.email_address) || "",
      token: sign(o.id, pl),
    });
  } catch (e) {
    return json(500, { error: "server", detail: String(e.message || e) });
  }
};
