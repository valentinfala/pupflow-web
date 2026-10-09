// Receives the finished form. Only accepted with a valid purchase code from capture-order.
// Saves the answers with the payment status read from PayPal (server side), then starts the plan generator.
// The generator only builds the PDF when the payment is COMPLETED.
import { json, verify, LANG } from "../lib/shared.mjs";
import { getOrder, saveOrder, paymentStatus, dispatch } from "../lib/orders.mjs";
export default async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const body = await req.json().catch(() => null);
  if (!body || !body.payload) return json(400, { error: "bad_body" });
  const { order, token, purchase_lang, payload } = body;
  if (!verify(order, LANG(purchase_lang), token)) return json(403, { error: "no_valid_purchase" });
  const prev = await getOrder(order).catch(() => null);
  if (prev && prev.status === "sent") return json(200, { ok: true, already: true });
  const pay = await paymentStatus(order);
  // Payment fields go last so the form can never overwrite them.
  const record = { ...payload, order_id: order, purchase_lang: LANG(purchase_lang), received_at: new Date().toISOString(), ...pay, status: "received" };
  try { await saveOrder(order, record); }
  catch (e) { return json(500, { error: "store_failed" }); }
  const d = await dispatch("generate-plan", order).catch(() => ({ ok: false }));
  if (!d.ok) await saveOrder(order, { status: "dispatch_failed" }).catch(() => {});
  return json(200, { ok: true, queued: d.ok });
};
