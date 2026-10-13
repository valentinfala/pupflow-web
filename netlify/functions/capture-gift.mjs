// Captures the gift payment, checks it is real, complete and the right amount, then asks the generator
// to email the gift card to the recipient (and a receipt to the giver).
import { json, paypal, PRICE, ADDON_PRICE, captureOk } from "../lib/shared.mjs";
import { getGift, saveGift, saveAddon, dispatch } from "../lib/orders.mjs";

export default async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const { orderID } = await req.json().catch(() => ({}));
  if (!orderID || !/^[A-Z0-9]{6,40}$/.test(orderID)) return json(400, { error: "bad_order" });
  const gift = await getGift(orderID).catch(() => null);
  if (!gift) return json(404, { error: "no_gift" });
  try {
    let r = await paypal(`/v2/checkout/orders/${orderID}/capture`, { method: "POST", body: "{}" });
    if (!r.ok && r.data && r.data.details && r.data.details.some(d => d.issue === "ORDER_ALREADY_CAPTURED")) {
      r = await paypal(`/v2/checkout/orders/${orderID}`, { method: "GET" });
    }
    if (!r.ok) return json(402, { error: "capture_failed", detail: r.data && (r.data.details?.[0]?.issue || r.data.name) });
    const o = r.data, pu = (o.purchase_units || [])[0] || {};
    const cap = ((pu.payments || {}).captures || [])[0] || {};
    const need = Number(PRICE()) + (gift.addon ? Number(ADDON_PRICE()) : 0);
    const paid = o.status === "COMPLETED" && captureOk(cap) && String(pu.custom_id || "").startsWith("gift:")
      && cap.amount && cap.amount.currency_code === "USD" && Number(cap.amount.value) >= need - 0.001;
    if (!paid) return json(402, { error: "not_paid", status: o.status, capture: cap.status });
    const first = gift.status === "created";
    const rec = await saveGift(orderID, {
      status: first ? "paid" : gift.status, capture_id: cap.id, payment_status: cap.status, value: cap.amount.value,
      payer_email: (o.payer && o.payer.email_address) || "", paid_at: gift.paid_at || new Date().toISOString(),
    });
    // The 3rd program is already paid: record it as this plan's add-on, so the form allows 3 problems and the plan builds 3.
    if (gift.addon) await saveAddon(orderID, { paid: true, gift: true, addon_order: orderID, capture_id: cap.id, payment_status: cap.status, value: ADDON_PRICE(), paid_at: rec.paid_at });
    if (first) {
      const d = await dispatch("send-gift", orderID).catch(() => ({ ok: false }));
      if (!d.ok) await saveGift(orderID, { status: "paid", dispatch_failed: true }).catch(() => {});
    }
    return json(200, { ok: true, order: orderID, to_name: rec.to_name, to_email: rec.to_email, value: cap.amount.value });
  } catch (e) {
    return json(500, { error: "server", detail: String(e.message || e) });
  }
};
