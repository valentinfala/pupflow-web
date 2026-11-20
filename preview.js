/* PupFlow free plan preview (landing). Builds a short, honest preview from 6 answers:
   calorie range (same formula as the real plan), meals per day, and the first 2 steps of
   each chosen program. Saves the answers so the post-payment form starts pre-filled. */
(() => {
  const T = {
    en: {
      eyebrow: "Free · 30 seconds", title: "See your dog's plan <em>before you pay.</em>",
      lead: "Answer 6 quick things and get a free preview: daily calories, meals and where training starts this week.",
      name: "Dog's name", namePh: "e.g. Chicha", sex: "Boy or girl?", boy: "Boy", girl: "Girl",
      age: "Age", a1: "Puppy under 4 mo", a2: "Puppy 4–12 mo", a3: "Adult 1–7 yrs", a4: "Senior 7+ yrs",
      weight: "Weight", wHint: "Not sure? A typical weight for the breed works.",
      energy: "Energy", e1: "Calm", e2: "Average", e3: "Very active",
      probs: "Top 2 things to fix", pick: "Pick 2",
      go: "Show {n}'s plan preview", goNo: "Show the preview",
      err: "Please fill in the name, age, weight, energy and 2 problems.",
      head: "{N}'S 90-DAY PLAN", tag: "Free preview",
      feed: "Food per day", kcal: "{a}–{b} calories a day", meals: "{m} meals a day, plus up to {t} calories in treats",
      mealsP4: "3 to 4 small meals a day", mealsP12: "3 meals a day (2 after 6 months)",
      feedNote: "Estimate from weight, age and energy. Your full plan turns it into cups or grams for your exact food.",
      week: "Week 1: where {n} starts", stepL: "Step",
      locked: "In {n}'s full plan",
      l1: "Hour-by-hour daily routine built on your minutes", l2: "Steps 3 to 6 of each program, plus what to do if it isn't working",
      l3: "Exact portions for {his} food", l4: "30 / 60 / 90-day milestones and a printable planner",
      unlock: "Unlock {n}'s full plan", note: "One-time payment · 14-day money-back guarantee · Your answers are saved",
      him: "him", his: "his", he: "he", He: "He",
      vet: "Medical condition or vet diet? Your full plan leaves calories to your vet.",
    },
    es: {
      eyebrow: "Gratis · 30 segundos", title: "Mira el plan de tu perro <em>antes de pagar.</em>",
      lead: "Responde 6 cosas rápidas y mira una vista previa gratis: calorías por día, comidas y por dónde empieza el entrenamiento esta semana.",
      name: "Nombre del perro", namePh: "ej.: Chicha", sex: "¿Macho o hembra?", boy: "Macho", girl: "Hembra",
      age: "Edad", a1: "Cachorro de menos de 4 meses", a2: "Cachorro de 4 a 12 meses", a3: "Adulto de 1 a 7 años", a4: "Mayor de 7 años",
      weight: "Peso", wHint: "¿No sabes? Sirve un peso típico de la raza.",
      energy: "Energía", e1: "Tranquilo", e2: "Normal", e3: "Muy activo",
      probs: "Las 2 cosas que más quieres mejorar", pick: "Elige 2",
      go: "Ver la vista previa del plan de {n}", goNo: "Ver la vista previa",
      err: "Completa el nombre, la edad, el peso, la energía y 2 problemas.",
      head: "PLAN DE 90 DÍAS DE {N}", tag: "Vista previa gratis",
      feed: "Comida por día", kcal: "{a} a {b} calorías por día", meals: "{m} comidas por día, más hasta {t} calorías en premios",
      mealsP4: "3 a 4 comidas chicas por día", mealsP12: "3 comidas por día (2 desde los 6 meses)",
      feedNote: "Estimación según peso, edad y energía. Tu plan completo la pasa a tazas o gramos para el alimento exacto que usas.",
      week: "Semana 1: por dónde empieza {n}", stepL: "Paso",
      locked: "En el plan completo de {n}",
      l1: "Rutina diaria hora por hora armada con tus minutos", l2: "Los pasos 3 a 6 de cada programa y qué hacer si no funciona",
      l3: "Porciones exactas para su alimento", l4: "Metas a 30, 60 y 90 días y un planificador para imprimir",
      unlock: "Desbloquear el plan completo de {n}", note: "Pago único · Garantía de 14 días · Tus respuestas quedan guardadas",
      vet: "¿Condición médica o dieta veterinaria? Tu plan completo deja las calorías en manos de tu veterinario.",
    },
  };
  // First 2 steps of each program, from the real training modules (pupflow-engine/data/modulos).
  const P = {
    leash_pulling: { en: ["Loose-leash walking", "Find the spot: hold a treat at your thigh. Mark and treat every time {n} is in that spot. 10 reps, indoors.", "Add steps: walk 2 steps, mark, treat at your thigh. Then 3, then 5, with the leash loose like a J."],
      es: ["Paseos sin tirones", "Encuentra el lugar: sostén un premio junto a tu pierna. Marca y premia cada vez que {n} está en ese lugar. 10 repeticiones, adentro.", "Suma pasos: camina 2 pasos, marca y premia junto a tu pierna. Después 3, después 5, con la correa floja como una J."] },
    jumping: { en: ["Polite greetings", "Manage first: leash, baby gate or a chew in another room when guests arrive. Every jump {he} practices makes it stronger.", "Reward four on the floor: if all four paws stay down when you walk up, mark and treat. If {he} jumps, turn away calmly."],
      es: ["Saludos educados", "Primero, prevenir: correa, una reja o algo para masticar en otro cuarto cuando llegan visitas. Cada salto que practica lo refuerza.", "Premia las cuatro patas en el piso: si no salta cuando te acercas, marca y premia. Si salta, date vuelta con calma."] },
    barking: { en: ["Less barking, more calm", "Reduce triggers: block the view from low windows and use white noise for hallway sounds.", "Meet needs first: a sniff walk, a puzzle feeder and a chew each day lower barking more than any cue."],
      es: ["Menos ladridos", "Reduce los disparadores: tapa la vista de las ventanas bajas y usa ruido blanco para los sonidos del pasillo.", "Primero, sus necesidades: un paseo para olfatear, un juguete con comida y algo para masticar cada día bajan más los ladridos que cualquier orden."] },
    separation: { en: ["Comfortable when alone", "Make departures boring: pick up keys, put on shoes, then sit down again, many times a day.", "Tiny absences: step outside for 5 seconds and come back calmly, before {he} gets worried. Then 10, 20, 30."],
      es: ["Tranquilidad cuando está solo", "Haz aburridas las salidas: agarra las llaves, ponte los zapatos y vuelve a sentarte, muchas veces al día.", "Ausencias cortitas: sal 5 segundos y vuelve con calma, antes de que se preocupe. Después 10, 20, 30."] },
    mouthing: { en: ["Gentle mouth", "Toys everywhere: keep a tug or soft toy in every room. When {n} goes for hands, offer the toy and play.", "Teeth on skin ends the game: say \"oops\" calmly and stop playing for 10 to 20 seconds. Then invite play with a toy."],
      es: ["Boca suave", "Juguetes en todos lados: ten un juguete para tirar o de peluche en cada cuarto. Cuando {n} va a las manos, ofrécele el juguete y juega.", "Dientes en la piel = fin del juego: di \"ups\" con calma y deja de jugar 10 a 20 segundos. Después invita a jugar con un juguete."] },
    house_training: { en: ["House training", "A fixed schedule: out first thing in the morning, after meals, naps and play, and before bed.", "Same spot, then reward: the moment {he} finishes outside, praise and treat right there, not back inside."],
      es: ["Hacer sus necesidades afuera", "Horarios fijos: afuera al despertar, después de comer, de dormir y de jugar, y antes de ir a dormir.", "Mismo lugar, y premio: apenas termina afuera, felicítalo y dale un premio ahí mismo, no al volver a casa."] },
    chewing: { en: ["Chew the right things", "Dog-proof: pick up shoes, cables and remotes, and gate off rooms with valuables.", "Reward the right choice: when {n} chews {his} own toy, calmly praise or drop a treat beside {him}."],
      es: ["Masticar lo correcto", "Prepara la casa: levanta zapatos, cables y controles, y cierra con una reja los cuartos con cosas valiosas.", "Premia la buena elección: cuando {n} mastica su juguete, felicítalo con calma o déjale un premio al lado."] },
    recall: { en: ["Coming when called", "Charge the word: say the recall word once and give an amazing treat. 10 times, twice a day.", "Short recalls: when {he}'s a few steps away, say the word, back up a little and reward big when {he} arrives."],
      es: ["Venir al llamado", "Carga la palabra: di la palabra de llamado una vez y da un premio buenísimo. 10 veces, dos veces al día.", "Llamados cortos: cuando está a pocos pasos, di la palabra, retrocede un poco y premia a lo grande cuando llega."] },
    dog_reactivity: { en: ["Calm around other dogs", "Avoid rehearsals: for 2 weeks, walk at quieter times and turn around when a dog is coming.", "A happy \"Let's go!\": teach a cheerful U-turn at home, then use it to leave surprise encounters."],
      es: ["Calma con otros perros", "Evita los encuentros: por 2 semanas, pasea en horarios tranquilos y date vuelta cuando viene un perro.", "Un \"¡vamos!\" alegre: enseña un giro contento en casa y úsalo para salir de los encuentros sorpresa."] },
    basic_obedience: { en: ["Everyday manners", "Name game: say {n}'s name once. The moment {he} looks at you, mark and treat. 10 times.", "Sit for everything: lure a sit with a treat over {his} head. Ask for it before meals, doors and the leash."],
      es: ["Buenos modales", "El juego del nombre: di el nombre de {n} una vez. Apenas te mira, marca y premia. 10 veces.", "Sentado para todo: guía el sentado con un premio sobre su cabeza. Pídelo antes de comer, de abrir la puerta y de poner la correa."] },
  };
  const ORDER = ["leash_pulling", "jumping", "barking", "separation", "mouthing", "house_training", "chewing", "recall", "dog_reactivity", "basic_obedience"];
  const CHIP = { en: { leash_pulling: "Pulls on leash", jumping: "Jumps on people", barking: "Barks a lot", separation: "Anxious alone", mouthing: "Nips & mouths", house_training: "Potty accidents", chewing: "Chews things", recall: "Won't come back", dog_reactivity: "Reacts to dogs", basic_obedience: "Basic manners" },
    es: { leash_pulling: "Tira de la correa", jumping: "Salta a la gente", barking: "Ladra mucho", separation: "Ansiedad al quedarse solo", mouthing: "Muerde y mordisquea", house_training: "Hace pis adentro", chewing: "Rompe cosas", recall: "No viene al llamado", dog_reactivity: "Reacciona a perros", basic_obedience: "Obediencia básica" } };

  const S = { dog_name: "", sex: "", age: "", weight: "", unit: "", activity: "", problems: [], done: false, started: false };
  try { const prev = JSON.parse(localStorage.getItem("pf-preview") || "null"); if (prev) Object.assign(S, prev.s || {}, { done: false }); } catch (e) {}
  let lang = "en";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const track = (t, n, d) => { if (window.PF_TEST) return; try { fbq(t, n, d); } catch (e) {} };
  const cl = n => { try { clarity("event", n); } catch (e) {} };

  function fill(s) {
    const t = T[lang], n = esc((S.dog_name || "").trim() || (lang === "es" ? "tu perro" : "your dog"));
    const g = S.sex === "female";
    const pr = lang === "en" ? { he: g ? "she" : "he", him: g ? "her" : "him", his: g ? "her" : "his" } : { he: "", him: "", his: "su" };
    return s.replace(/\{n\}/g, n).replace(/\{N\}/g, n.toUpperCase()).replace(/\{he\}/g, pr.he).replace(/\{him\}/g, pr.him).replace(/\{his\}/g, pr.his);
  }
  function kcal() {
    const w = parseFloat(String(S.weight).replace(",", "."));
    if (!(w > 0)) return null;
    const kg = S.unit === "kg" ? w : w / 2.2046;
    if (kg < 0.5 || kg > 110) return null;
    const rer = 70 * Math.pow(kg, 0.75);
    const F = { p4: [3.0, 3.0], p12: [2.0, 2.0], adult: { low: [1.4, 1.6], medium: [1.6, 1.8], high: [1.8, 2.0] }, senior: { low: [1.2, 1.2], medium: [1.4, 1.4], high: [1.6, 1.6] } };
    const f = S.age === "p4" ? F.p4 : S.age === "p12" ? F.p12 : (S.age === "senior" ? F.senior : F.adult)[S.activity || "medium"];
    const r10 = x => Math.round(x / 10) * 10;
    const lo = r10(rer * f[0] * 0.9), hi = r10(rer * f[1] * 1.1);
    return { lo, hi, treats: r10(rer * (f[0] + f[1]) / 2 * 0.1) };
  }
  function opt(group, val, label) {
    const on = group === "problems" ? S.problems.includes(val) : S[group] === val;
    return `<button type="button" class="pv-chip${on ? " on" : ""}" data-g="${group}" data-v="${val}" aria-pressed="${on}">${label}</button>`;
  }
  function renderForm() {
    const t = T[lang];
    if (!S.unit) S.unit = lang === "es" ? "kg" : "lb";
    $("pvEyebrow").textContent = t.eyebrow; $("pvTitle").innerHTML = t.title; $("pvLead").textContent = t.lead;
    $("pvForm").innerHTML = `
      <div class="pv-row two">
        <label class="pv-f"><span>${t.name}</span><input id="pvName" type="text" maxlength="30" autocomplete="off" placeholder="${t.namePh}" value="${esc(S.dog_name)}"></label>
        <div class="pv-f"><span>${t.sex}</span><div class="pv-chips">${opt("sex", "male", t.boy)}${opt("sex", "female", t.girl)}</div></div>
      </div>
      <div class="pv-f"><span>${t.age}</span><div class="pv-chips">${opt("age", "p4", t.a1)}${opt("age", "p12", t.a2)}${opt("age", "adult", t.a3)}${opt("age", "senior", t.a4)}</div></div>
      <div class="pv-row two">
        <div class="pv-f"><span>${t.weight}</span><div class="pv-w"><input id="pvW" type="number" inputmode="decimal" min="1" max="250" value="${esc(S.weight)}">
          <div class="pv-unit">${["lb", "kg"].map(u => `<button type="button" data-u="${u}" class="${S.unit === u ? "on" : ""}">${u}</button>`).join("")}</div></div><small>${t.wHint}</small></div>
        <div class="pv-f"><span>${t.energy}</span><div class="pv-chips">${opt("activity", "low", t.e1)}${opt("activity", "medium", t.e2)}${opt("activity", "high", t.e3)}</div></div>
      </div>
      <div class="pv-f"><span>${t.probs} <em class="pv-count">${S.problems.length}/2</em></span><div class="pv-chips">${ORDER.map(k => opt("problems", k, CHIP[lang][k])).join("")}</div></div>
      <p class="pv-err" id="pvErr" hidden>${t.err}</p>
      <button type="submit" class="btn block pv-go">✨ ${fill(S.dog_name.trim() ? t.go : t.goNo)}</button>`;
  }
  function renderOut() {
    const t = T[lang], out = $("pvOut");
    if (!S.done) { out.innerHTML = ""; out.classList.remove("show"); return; }
    const k = kcal();
    const meals = S.age === "p4" ? t.mealsP4 : S.age === "p12" ? t.mealsP12 : t.meals.replace("{m}", 2).replace("{t}", k ? k.treats : "");
    const steps = S.problems.map(p => {
      const d = P[p][lang];
      return `<div class="pv-prog"><b>${fill(d[0])}</b><ol><li>${fill(d[1])}</li><li>${fill(d[2])}</li></ol></div>`;
    }).join("");
    out.innerHTML = `
      <div class="pv-sheet">
        <div class="pv-top"><span>${fill(t.head)}</span><i>${t.tag}</i></div>
        <div class="pv-sec"><h4>🥣 ${t.feed}</h4>
          ${k ? `<p class="pv-big">${t.kcal.replace("{a}", k.lo).replace("{b}", k.hi)}</p>` : ""}
          <p>${S.age === "p4" || S.age === "p12" ? meals : (k ? meals : "")}</p><small>${t.feedNote}</small></div>
        <div class="pv-sec"><h4>🐾 ${fill(t.week)}</h4>${steps}</div>
        <div class="pv-sec pv-lock"><h4>🔒 ${fill(t.locked)}</h4>
          <ul>${["l1", "l2", "l3", "l4"].map(x => `<li>${fill(t[x])}</li>`).join("")}</ul>
          <div class="pv-blur" aria-hidden="true"><span></span><span></span><span></span><span></span></div></div>
        <a class="btn block js-buy pv-unlock" href="checkout.html"><svg><use href="#lock"/></svg>${fill(t.unlock)}<span class="p"><span class=pn>$9</span></span></a>
        <p class="pv-note">${t.note}</p>
      </div>`;
    out.classList.add("show");
    if (window.pfSyncPrice) window.pfSyncPrice();
  }
  function save() {
    try { localStorage.setItem("pf-preview", JSON.stringify({ s: { dog_name: S.dog_name, sex: S.sex, age: S.age, weight: S.weight, unit: S.unit, activity: S.activity, problems: S.problems }, at: Date.now() })); } catch (e) {}
  }
  function start() { if (S.started) return; S.started = true; track("trackCustom", "PreviewStart"); cl("preview_start"); }

  document.addEventListener("click", e => {
    const c = e.target.closest(".pv-chip");
    if (c) {
      start(); const g = c.dataset.g, v = c.dataset.v;
      if (g === "problems") {
        if (S.problems.includes(v)) S.problems = S.problems.filter(x => x !== v);
        else { S.problems = S.problems.concat(v); if (S.problems.length > 2) S.problems = S.problems.slice(-2); }
      } else S[g] = v;
      renderForm(); return;
    }
    const u = e.target.closest(".pv-unit button");
    if (u) { start(); S.unit = u.dataset.u; renderForm(); }
  });
  document.addEventListener("input", e => {
    if (e.target.id === "pvName") { start(); S.dog_name = e.target.value; const b = document.querySelector(".pv-go"); if (b) b.textContent = "✨ " + fill(S.dog_name.trim() ? T[lang].go : T[lang].goNo); }
    if (e.target.id === "pvW") { start(); S.weight = e.target.value; }
  });
  document.addEventListener("submit", e => {
    if (e.target.id !== "pvForm") return;
    e.preventDefault();
    const ok = S.dog_name.trim() && S.age && kcal() && S.activity && S.problems.length === 2;
    $("pvErr").hidden = !!ok;
    if (!ok) return;
    S.done = true; save(); renderOut();
    track("track", "Lead", { content_name: "PupFlow plan preview" }); track("trackCustom", "PreviewDone"); cl("preview_done");
    setTimeout(() => $("pvOut").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }), 60);
  });
  window.pfPrev = l => { lang = l; renderForm(); renderOut(); };
})();
