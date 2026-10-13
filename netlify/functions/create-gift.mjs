// Creates the PayPal order for a gift card. The giver pays the plan (and, if they want, the 3rd program) up front;
// the recipient never sees a price. Gift details are saved now and confirmed in capture-gift.
import { json, paypal, PRICE, ADDON_PRICE, LANG } from "../lib/shared.mjs";
import { saveGift } from "../lib/orders.mjs";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const clean = (s, n) => String(s || "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, n);

export default async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const b = await req.json().catch(() => ({}));
  const gift = {
    to_name: clean(b.to_name, 40), to_email: clean(b.to_email, 254).toLowerCase(), from_name: clean(b.from_name, 40),
    message: clean(b.message, 300), occasion: clean(b.occasion, 20), plan_lang: LANG(b.plan_lang), page_lang: LANG(b.page_lang),
    addon: b.addon === true,
  };
  if (!gift.to_name || !gift.from_name || !EMAIL.test(gift.to_email)) return json(400, { error: "bad_gift" });
  const amount = (Number(PRICE()) + (gift.addon ? Number(ADDON_PRICE()) : 0)).toFixed(2);
  const es = gift.plan_lang === "es";
  try {
    const r = await paypal("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: amount },
          description: (es ? "Gift card PupFlow: plan de 90 días (en español)" : "PupFlow gift card: 90-day plan (in English)") + (gift.addon ? (es ? " + 3.er problema" : " + 3rd problem") : ""),
          custom_id: `gift:${gift.plan_lang}:${gift.addon ? 3 : 2}`,
        }],
        application_context: { brand_name: "PupFlow", shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" },
      }),
    });
    if (!r.ok) return json(502, { error: "create_failed", detail: r.data && r.data.name });
    await saveGift(r.data.id, { ...gift, amount, status: "created", created_at: new Date().toISOString() });
    return json(200, { id: r.data.id });
  } catch (e) {
    return json(500, { error: "server", detail: String(e.message || e) });
  }
};
