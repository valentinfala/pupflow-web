// Buttons from the review email: send the plan to the customer, or build it again.
// Opening the link only shows a confirm button (mail apps sometimes open links on their own); the action runs on POST.
import crypto from "node:crypto";
import { getOrder, saveOrder, dispatch, linkSig } from "../lib/orders.mjs";
const page = (title, text, form = "") => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>PupFlow</title><body style="font-family:system-ui,sans-serif;max-width:520px;margin:12vh auto;padding:0 20px;color:#22313F;text-align:center">
<h1 style="color:#154E55;font-size:26px">${title}</h1><p style="font-size:17px;line-height:1.5">${text}</p>${form}</body>`,
  { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export default async req => {
  const u = new URL(req.url), order = u.searchParams.get("order") || "", a = u.searchParams.get("a") || "", s = u.searchParams.get("s") || "";
  const good = linkSig(order, a);
  if (!/^[A-Z0-9]{6,40}$/.test(order) || !["send", "regenerate"].includes(a) || s.length !== good.length
      || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return page("Link inválido", "Este link no es válido o está incompleto.");
  const rec = await getOrder(order);
  if (!rec) return page("No encontrado", "No encontramos esa compra.");
  const who = esc(rec.dog?.name || "este perro"), mail = esc(rec.email || "");
  if (req.method !== "POST") {
    const btn = (label) => `<form method="post"><button style="background:#F28C38;color:#fff;border:0;border-radius:999px;padding:16px 34px;font-size:18px;font-weight:700;cursor:pointer">${label}</button></form>`;
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
