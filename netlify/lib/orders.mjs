// Order records (form answers, status, finished PDF) kept in Netlify Blobs, plus the link to the plan generator on GitHub.
// Extra environment variables:
//   ENGINE_SECRET   long random text, the same value saved in the GitHub repository secrets of pupflow-engine
//   GITHUB_TOKEN    fine-grained GitHub token with "Contents: read and write" on the engine repository
//   ENGINE_REPO     defaults to "valentinfala/pupflow-engine"
import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
import { paypal } from "./shared.mjs";

export const store = () => getStore({ name: "orders", consistency: "strong" });

export async function getOrder(order) {
  return await store().get("order/" + order, { type: "json" });
}
export async function saveOrder(order, patch) {
  const cur = (await getOrder(order)) || {};
  const next = { ...cur, ...patch, updated_at: new Date().toISOString() };
  await store().setJSON("order/" + order, next);
  return next;
}

export async function paymentStatus(order) {
  try {
    const r = await paypal(`/v2/checkout/orders/${encodeURIComponent(order)}`, { method: "GET" });
    const cap = (((r.data.purchase_units || [])[0] || {}).payments || {}).captures?.[0] || {};
    // Buyer's country (PayPal account or shipping address): the plan only shows US-only phone lines to US buyers.
    const country = r.data.payer?.address?.country_code || r.data.purchase_units?.[0]?.shipping?.address?.country_code || "";
    if (r.ok) return { payment_status: cap.status || r.data.status || "UNKNOWN", capture_id: cap.id || "", payer_country: country };
  } catch (e) {}
  return { payment_status: "UNKNOWN", capture_id: "" };
}

// Starts the generator. event: "generate-plan" or "send-plan".
export async function dispatch(event, order) {
  const token = process.env.GITHUB_TOKEN, repo = process.env.ENGINE_REPO || "valentinfala/pupflow-engine";
  if (!token) return { ok: false, status: 0 };
  const r = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: "POST",
    headers: { authorization: "Bearer " + token, accept: "application/vnd.github+json", "content-type": "application/json", "user-agent": "pupflow" },
    body: JSON.stringify({ event_type: event, client_payload: { order } }),
  });
  return { ok: r.status === 204, status: r.status };
}

// Signed one-click links for the review email (approve, regenerate).
export function linkSig(order, action) {
  return crypto.createHmac("sha256", process.env.ORDER_SECRET || "").update("link|" + order + "|" + action).digest("hex").slice(0, 32);
}
export function engineAuth(req) {
  const k = req.headers.get("x-engine-key") || "", s = process.env.ENGINE_SECRET || "";
  return s.length >= 16 && k.length === s.length && crypto.timingSafeEqual(Buffer.from(k), Buffer.from(s));
}

// Website cards of customers who allowed it (form checkbox "showcase"). Separate store, so the public
// stories function never reads order records. Keys: story/ID (card + state), photo/ID (JPEG bytes, only once published).
export const showcase = () => getStore({ name: "showcase", consistency: "strong" });
export async function getStory(order) {
  return await showcase().get("story/" + order, { type: "json" });
}
export async function saveStory(order, patch) {
  const cur = (await getStory(order)) || {};
  const next = { ...cur, ...patch, updated_at: new Date().toISOString() };
  await showcase().setJSON("story/" + order, next);
  return next;
}
export const SITE = () => process.env.URL || "https://pupflowplan.netlify.app";
export const actionLink = (order, a) => `${SITE()}/.netlify/functions/approve?order=${order}&a=${a}&s=${linkSig(order, a)}`;
