// Shared helpers for the PupFlow checkout functions.
// Environment variables (set in Netlify > Project configuration > Environment variables):
//   PAYPAL_ENV            "sandbox" (fake money, default) or "live"
//   PAYPAL_CLIENT_ID      from developer.paypal.com > Apps & Credentials
//   PAYPAL_CLIENT_SECRET  same place. Never put it in the code.
//   ORDER_SECRET          any long random text; signs the purchase code the form receives
//   MAKE_WEBHOOK_URL      where finished forms are sent (Make/Zapier). Optional while testing.
//   PRICE_USD             optional, defaults to "19.00" (launch promo; regular price 29.00)
//   LIST_PRICE_USD        optional, the regular price shown crossed out during the promo, defaults to "29.00"
import crypto from "node:crypto";

export const PRICE = () => process.env.PRICE_USD || "0.10"; // TEMPORARY test price (2026-10-10). Put back "19.00" after the live test.
export const LIST_PRICE = () => process.env.LIST_PRICE_USD || "29.00";
export const API = () => (process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");

export function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

export async function paypalToken() {
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal credentials are not set");
  const r = await fetch(API() + "/v1/oauth2/token", {
    method: "POST",
    headers: { authorization: "Basic " + Buffer.from(id + ":" + secret).toString("base64"), "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error("PayPal auth failed " + r.status);
  return (await r.json()).access_token;
}

export async function paypal(path, opts = {}) {
  const token = await paypalToken();
  const r = await fetch(API() + path, {
    ...opts,
    headers: { authorization: "Bearer " + token, "content-type": "application/json", ...(opts.headers || {}) },
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

// Purchase code: order id + plan language, signed so nobody can invent one.
export function sign(order, planLang) {
  const secret = process.env.ORDER_SECRET;
  if (!secret) throw new Error("ORDER_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(order + "|" + planLang).digest("hex").slice(0, 32);
}
export function verify(order, planLang, token) {
  if (!order || !token) return false;
  const good = sign(order, planLang);
  return token.length === good.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(good));
}
export const LANG = l => (l === "es" ? "es" : "en");
