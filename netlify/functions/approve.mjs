// Buttons from the review emails: send the plan to the customer, build it again, or show / hide the customer's dog on the website.
// Opening the link only shows a confirm button (mail apps sometimes open links on their own); the action runs on POST.
import crypto from "node:crypto";
import { getOrder, saveOrder, dispatch, linkSig, showcase, getStory, saveStory, actionLink } from "../lib/orders.mjs";
const page = (title, text, form = "") => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>PupFlow</title><body style="font-family:system-ui,sans-serif;max-width:520px;margin:12vh auto;padding:0 20px;color:#22313F;text-align:center">
<h1 style="color:#154E55;font-size:26px">${title}</h1><p style="font-size:17px;line-height:1.5">${text}</p>${form}</body>`,
  { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export default async req => {
  const u = new URL(req.url), order = u.searchParams.get("order") || "", a = u.searchParams.get("a") || "", s = u.searchParams.get("s") || "";
  const good = linkSig(order, a);
  if (!/^[A-Z0-9]{6,40}$/.test(order) || !["send", "regenerate", "publish", "unpublish"].includes(a) || s.length !== good.length
      || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return page("Link inválido", "Este link no es válido o está incompleto.");
  const rec = await getOrder(order);
  if (!rec) return page("No encontrado", "No encontramos esa compra.");
  const who = esc(rec.dog?.name || "este perro"), mail = esc(rec.email || "");
  const btn = (label) => `<form method="post"><button style="background:#F28C38;color:#fff;border:0;border-radius:999px;padding:16px 34px;font-size:18px;font-weight:700;cursor:pointer">${label}</button></form>`;
  if (a === "publish" || a === "unpublish") return showcaseAction(req, a, order, rec, who, btn);
  if (req.method !== "POST") {
    return a === "send"
      ? page(`¿Mandar el plan de ${who}?`, `Se envía a ${mail}.`, btn("Sí, enviar"))
      : page(`¿Armar de nuevo el plan de ${who}?`, "Te llega un mail nuevo para revisar.", btn("Sí, armar de nuevo"));
  }
  if (a === "send") {
    if (rec.status === "sent") return page("Ya enviado", `El plan de ${who} ya se mandó a ${mail}.`);
    if (rec.status === "sending") return page("Enviando", "Ya se está enviando. En un par de minutos le llega al cliente.");
    const d = await dispatch("send-plan", order);
    if (!d.ok) return page("No se pudo enviar", "No pudimos arrancar el envío. Probá de nuevo en un rato.");
    await saveOrder(order, { status: "sending", approved_at: new Date().toISOString() });
    return page("Listo, se está enviando", `El plan de ${who} le llega a ${mail} en un par de minutos.`);
  }
  const d = await dispatch("generate-plan", order);
  if (!d.ok) return page("No se pudo", "No pudimos arrancar el generador. Probá de nuevo en un rato.");
  await saveOrder(order, { status: "regenerating" });
  return page("Armando de nuevo", "En unos minutos te llega un mail con la versión nueva para revisar.");
};

// Customer's dog on the website. Opening the link shows the card; publishing copies the photo to the public store.
const story = (c, photo) => `<div style="text-align:left;border:1px solid #DCE9EA;border-radius:22px;overflow:hidden;margin:22px 0;box-shadow:0 18px 40px -30px rgba(21,78,85,.6)">
  ${photo ? `<img src="${esc(photo)}" alt="" style="width:100%;aspect-ratio:4/3.4;object-fit:cover;display:block">` : ""}
  <div style="padding:16px 18px;font-size:15px;line-height:1.45"><b style="font-size:22px">${esc(c.name)}</b><br><span style="color:#5B6B78">${esc(c.line)}</span>
  <p style="margin:10px 0 4px"><b>Antes del plan:</b> ${c.before.map(esc).join(" · ")}</p>
  <p style="margin:4px 0"><b>Su plan:</b> ${esc(c.kcal)} kcal por día · ${c.meals} comidas · ${c.time} min por día</p>
  ${c.progs.map(p => `<p style="margin:4px 0">✓ <b>${esc(p.t)}</b>. Meta al día 90: ${esc(p.g)}</p>`).join("")}</div></div>`;
async function showcaseAction(req, a, order, rec, who, btn) {
  const st = await getStory(order);
  if (!st || !st.card) return page("No hay card", "Para esta compra no se armó ninguna card para la web.");
  if (a === "publish") {
    if (req.method !== "POST") {
      if (st.status === "published") return page("Ya está en la web", `${who} ya se muestra en la web.`);
      return page(`¿Mostrar a ${who} en la web?`, "Así se va a ver la card (en la web aparece en inglés o en español según el visitante).",
        story(st.card.es, rec.photo?.data) + btn("Sí, publicar"));
    }
    const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(rec.photo?.data || "");
    if (!m) return page("Falta la foto", "Esta compra no tiene una foto que se pueda publicar.");
    await showcase().set("photo/" + order, Buffer.from(m[2], "base64"), { metadata: { type: "image/" + m[1] } });
    await saveStory(order, { status: "published", published_at: new Date().toISOString() });
    return page("Publicado", `${who} ya aparece en la web, arriba de todo en la sección de los perros. Si el cliente pide quitarlo, usá este link:<br><a href="${actionLink(order, "unpublish")}">Quitar de la web</a>`);
  }
  if (req.method !== "POST") {
    if (st.status !== "published") return page("No está en la web", `${who} no se está mostrando en la web.`);
    return page(`¿Quitar a ${who} de la web?`, "Deja de aparecer en unos minutos.", btn("Sí, quitar"));
  }
  await showcase().delete("photo/" + order);
  await saveStory(order, { status: "removed", removed_at: new Date().toISOString() });
  return page("Quitado", `${who} ya no aparece en la web.`);
}
