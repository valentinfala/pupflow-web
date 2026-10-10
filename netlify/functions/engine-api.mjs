// Private API for the plan generator (GitHub Actions). Every call needs the x-engine-key header = ENGINE_SECRET.
//   GET  ?op=get&order=ID      order record, with the payment status read again from PayPal
//   GET  ?op=pending           orders that never reached the generator (safety net)
//   POST ?op=status&order=ID   merge JSON body into the record (status, review notes, file name...)
//   PUT  ?op=pdf&order=ID      store the finished PDF (raw bytes)
//   GET  ?op=pdf&order=ID      read it back
//   GET  ?op=links&order=ID    signed links for the review email
//   POST ?op=story&order=ID    save the website card {card} of a customer who allowed it; returns the publish links
import { json } from "../lib/shared.mjs";
import { store, getOrder, saveOrder, paymentStatus, engineAuth, getStory, saveStory, actionLink } from "../lib/orders.mjs";
export default async req => {
  if (!engineAuth(req)) return json(401, { error: "auth" });
  const u = new URL(req.url), op = u.searchParams.get("op"), order = u.searchParams.get("order") || "";
  if (op !== "pending" && !/^[A-Z0-9]{6,40}$/.test(order)) return json(400, { error: "bad_order" });
  if (op === "get") {
    const rec = await getOrder(order);
    if (!rec) return json(404, { error: "not_found" });
    const pay = await paymentStatus(order);
    if (pay.payment_status !== "UNKNOWN") Object.assign(rec, pay);
    return json(200, rec);
  }
  if (op === "pending") {
    const { blobs } = await store().list({ prefix: "order/" });
    const out = [];
    for (const b of blobs) {
      const r = await store().get(b.key, { type: "json" });
      if (r && ["received", "dispatch_failed", "send_failed", "ai_failed"].includes(r.status)) out.push({ order: r.order_id, status: r.status, received_at: r.received_at });
    }
    return json(200, { pending: out });
  }
  if (op === "status" && req.method === "POST") {
    const patch = await req.json().catch(() => ({}));
    return json(200, await saveOrder(order, patch));
  }
  if (op === "pdf" && req.method === "PUT") {
    const buf = await req.arrayBuffer();
    if (!buf.byteLength) return json(400, { error: "empty" });
    await store().set("pdf/" + order, buf);
    return json(200, { ok: true, bytes: buf.byteLength });
  }
  if (op === "pdf") {
    const buf = await store().get("pdf/" + order, { type: "arrayBuffer" });
    if (!buf) return json(404, { error: "not_found" });
    return new Response(buf, { headers: { "content-type": "application/pdf", "cache-control": "no-store" } });
  }
  if (op === "links") {
    return json(200, { send: actionLink(order, "send"), regenerate: actionLink(order, "regenerate") });
  }
  if (op === "story" && req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const rec = await getOrder(order);
    if (!rec || !body.card || !rec.showcase?.ok) return json(400, { error: "no_consent_or_card" });
    const prev = await getStory(order);
    // A rebuilt plan updates the card but keeps it published if it already was.
    const st = await saveStory(order, { order, card: body.card, consent: rec.showcase, status: prev?.status === "published" ? "published" : "pending",
                                        created_at: prev?.created_at || new Date().toISOString() });
    return json(200, { status: st.status, publish: actionLink(order, "publish"), unpublish: actionLink(order, "unpublish") });
  }
  return json(400, { error: "op" });
};
