// Creates a PayPal order for one plan. The price is set here, never by the browser.
import { json, paypal, PRICE, LANG } from "../lib/shared.mjs";
export default async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const { plan_lang } = await req.json().catch(() => ({}));
  const pl = LANG(plan_lang);
  try {
    const r = await paypal("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: PRICE() },
          description: pl === "es" ? "Plan PupFlow de 90 días (en español)" : "PupFlow 90-day plan (in English)",
          custom_id: "plan_lang:" + pl,
        }],
        application_context: { brand_name: "PupFlow", shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" },
      }),
    });
    if (!r.ok) return json(502, { error: "create_failed", detail: r.data && r.data.name });
    return json(200, { id: r.data.id });
  } catch (e) {
    return json(500, { error: "server", detail: String(e.message || e) });
  }
};
