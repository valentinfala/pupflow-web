// Receives the finished form. Only accepted with a valid purchase code from capture-order.
// Forwards everything to the automation (MAKE_WEBHOOK_URL), which builds and emails the PDF.
import { json, verify, LANG } from "../lib/shared.mjs";
export default async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const body = await req.json().catch(() => null);
  if (!body || !body.payload) return json(400, { error: "bad_body" });
  const { order, token, purchase_lang, payload } = body;
  if (!verify(order, LANG(purchase_lang), token)) return json(403, { error: "no_valid_purchase" });
  const record = { order_id: order, received_at: new Date().toISOString(), ...payload };
  const hook = process.env.MAKE_WEBHOOK_URL;
  if (!hook) return json(200, { ok: true, forwarded: false }); // testing without automation yet
  const r = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(record) });
  if (!r.ok) return json(502, { error: "automation_failed", status: r.status });
  return json(200, { ok: true, forwarded: true });
};
