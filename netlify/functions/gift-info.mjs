// What the recipient's form needs to know about a gift: who sent it, the message, and how many programs it includes.
// Only with a valid purchase code (the link from the gift email). Never returns prices or payment data.
import { json, verify, LANG } from "../lib/shared.mjs";
import { getGift, getAddon } from "../lib/orders.mjs";

export default async req => {
  const u = new URL(req.url), order = u.searchParams.get("order") || "", t = u.searchParams.get("t") || "", pl = LANG(u.searchParams.get("plan_lang"));
  if (!verify(order, pl, t)) return json(403, { error: "no_valid_purchase" });
  const g = await getGift(order).catch(() => null);
  if (!g) return json(404, { error: "no_gift" });
  const a = await getAddon(order).catch(() => null);
  return json(200, { gift: true, from_name: g.from_name, to_name: g.to_name, to_email: g.to_email, message: g.message, occasion: g.occasion,
                     programs: a && a.paid ? 3 : 2 });
};
