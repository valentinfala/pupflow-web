// Creates the PayPal order for the 3rd training program (sold inside the form, after the plan was bought).
// Only for a real plan purchase (valid purchase code). If this plan already has a paid add-on, nothing is charged again.
import { json, paypal, verify, LANG, ADDON_PRICE, ADDON_TAG, sign } from "../lib/shared.mjs";
import { getAddon } from "../lib/orders.mjs";
export default async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const { order, token, plan_lang } = await req.json().catch(() => ({}));
  const pl = LANG(plan_lang);
  if (!verify(order, pl, token)) return json(403, { error: "no_valid_purchase" });
  try {
    const prev = await getAddon(order).catch(() => null);
    if (prev && prev.paid) return json(200, { already: true, addon_order: prev.addon_order, addon_token: sign(prev.addon_order, ADDON_TAG(order)) });
    const r = await paypal("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: ADDON_PRICE() },
          description: pl === "es" ? "PupFlow: 3.er programa de entrenamiento" : "PupFlow: 3rd training program",
          custom_id: ADDON_TAG(order),
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
