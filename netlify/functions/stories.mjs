// Public: customers' dogs shown on the landing page (only the ones Valentín published).
//   GET                 { stories: [{ id, pos, src, en, es }] } newest first, at most 6
//   GET ?photo=ID       the dog's photo
import { json } from "../lib/shared.mjs";
import { showcase } from "../lib/orders.mjs";
export default async req => {
  const u = new URL(req.url), id = u.searchParams.get("photo");
  if (id) {
    if (!/^[A-Z0-9]{6,40}$/.test(id)) return new Response("", { status: 404 });
    const r = await showcase().getWithMetadata("photo/" + id, { type: "arrayBuffer" });
    if (!r) return new Response("", { status: 404 });
    return new Response(r.data, { headers: { "content-type": r.metadata?.type || "image/jpeg", "cache-control": "public, max-age=86400" } });
  }
  const { blobs } = await showcase().list({ prefix: "story/" });
  const out = [];
  for (const b of blobs) {
    const s = await showcase().get(b.key, { type: "json" });
    if (s && s.status === "published" && s.card) out.push({ id: s.order, at: s.published_at || "", pos: s.card.pos, en: s.card.en, es: s.card.es,
      src: "/.netlify/functions/stories?photo=" + s.order });
  }
  out.sort((x, y) => (y.at > x.at ? 1 : -1));
  return new Response(JSON.stringify({ stories: out.slice(0, 6).map(({ at, ...x }) => x) }),
    { headers: { "content-type": "application/json", "cache-control": "public, max-age=300" } });
};
