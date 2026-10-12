// Receives the finished form. Only accepted with a valid purchase code from capture-order.
// Saves the answers with the payment status read from PayPal (server side), then starts the plan generator.
// The generator only builds the PDF when the payment is COMPLETED.
import { json, verify, LANG } from "../lib/shared.mjs";
import { getOrder, saveOrder, paymentStatus, dispatch, getAddon } from "../lib/orders.mjs";
export default async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const body = await req.json().catch(() => null);
  if (!body || !body.payload) return json(400, { error: "bad_body" });
  const { order, token, purchase_lang, payload } = body;
  if (!verify(order, LANG(purchase_lang), token)) return json(403, { error: "no_valid_purchase" });
  const prev = await getOrder(order).catch(() => null);
  if (prev && prev.status === "sent") return json(200, { ok: true, already: true });
  const pay = await paymentStatus(order);
  // 3rd program: only when capture-addon recorded a paid add-on for this order (checked again with PayPal).
  // Without it, the plan keeps 2 programs whatever the form sent.
  const addon = await getAddon(order).catch(() => null);
  let extra = { extra_problem_paid: false };
  if (addon && addon.paid) {
    const ap = await paymentStatus(addon.addon_order);
    if (ap.payment_status === "COMPLETED" || ap.payment_status === "PENDING")
      extra = { extra_problem_paid: true, addon_order_id: addon.addon_order, addon_capture_id: ap.capture_id || addon.capture_id, addon_payment_status: ap.payment_status };
  }
  if (!extra.extra_problem_paid && payload.dog && Array.isArray(payload.dog.problems)) payload.dog.problems = payload.dog.problems.slice(0, 2);
  // Payment fields go last so the form can never overwrite them.
  const record = { ...payload, order_id: order, purchase_lang: LANG(purchase_lang), received_at: new Date().toISOString(), ...pay, ...extra, status: "received" };
  try { await saveOrder(order, record); }
  catch (e) { return json(500, { error: "store_failed" }); }
  const d = await dispatch("generate-plan", order).catch(() => ({ ok: false }));
  if (!d.ok) await saveOrder(order, { status: "dispatch_failed" }).catch(() => {});
  return json(200, { ok: true, queued: d.ok });
};
