import "./style.css";
import { PREFIX, ENDING, REPLY_TO, REDUCE } from "./config.js";
import { startSky, setEmbers, shoot, burst, viewport } from "./sky.js";
import { createFire } from "./fire.js";

const $ = (id) => document.getElementById(id);
startSky();

// ---------- Scene controller ----------
const scenes = [...document.querySelectorAll(".scene")];
const dots = $("dots");
scenes.forEach(() => { const i = document.createElement("i"); dots.appendChild(i); });
let current = 0;
function go(n) {
  n = Math.max(0, Math.min(scenes.length - 1, n));
  scenes[current].classList.remove("active");
  current = n;
  scenes[current].classList.add("active");
  [...dots.children].forEach((d, i) => { d.classList.toggle("on", i === n); d.classList.toggle("past", i < n); });
  scenes[current].dispatchEvent(new CustomEvent("enter"));
}
document.querySelectorAll("[data-next]").forEach(b => b.addEventListener("click", () => go(current + 1)));
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" && scenes[current].querySelector("[data-next]:not(.hidden)")) go(current + 1);
  if (e.key === "ArrowLeft") go(current - 1);
});
go(0);

// ---------- Scene 1: unlock the number ----------
{
  const b1 = $("b1"), b2 = $("b2"), digits = $("digits"), line = $("unlock-line");
  let typed = "", fails = 0, done = false;
  const hints = ["Det er dit eget nummer.", "Prøv lige igen.", "Fint. Jeg gør det."];
  function show() { b1.textContent = typed[0] || "_"; b2.textContent = typed[1] || "_"; }
  function accept() {
    done = true; digits.classList.add("ok"); line.textContent = "Fundet.";
    setTimeout(() => go(1), REDUCE ? 300 : 1100);
  }
  function check() {
    if (!ENDING || typed === ENDING) return accept();
    fails++;
    digits.classList.add("shake"); setTimeout(() => digits.classList.remove("shake"), 450);
    line.textContent = hints[Math.min(fails - 1, hints.length - 1)];
    typed = ""; show();
    if (fails >= 3) { setTimeout(() => { typed = ENDING; show(); accept(); }, 700); }
  }
  function key(k) {
    if (done) return;
    if (k === "del") { typed = typed.slice(0, -1); show(); return; }
    if (typed.length >= 2) return;
    typed += k; show();
    if (typed.length === 2) setTimeout(check, 180);
  }
  $("keypad").addEventListener("click", (e) => { const b = e.target.closest("button[data-k]"); if (b) key(b.dataset.k); });
  document.addEventListener("keydown", (e) => {
    if (current !== 0) return;
    if (/^\d$/.test(e.key)) key(e.key); else if (e.key === "Backspace") key("del");
  });
}

// ---------- Scene 2: where to ----------
{
  const where = $("where"), answer = $("where-answer"), next = scenes[1].querySelector("[data-next]");
  where.addEventListener("click", () => {
    where.classList.add("hidden"); answer.classList.remove("hidden"); next.classList.remove("hidden");
    setEmbers(true);
    if (!REDUCE) { const { W, H } = viewport(); burst(W / 2, H * 0.55, 90); }
  });
}

// ---------- Scene 3: build the fire, roast the marshmallow ----------
{
  const canvas = $("firecanvas"), line = $("fire-line"), light = $("light"), roast = $("roast"), next = scenes[2].querySelector("[data-next]");
  const mallow = $("mallow"), puff = $("puff");
  let fire, lit = false, stage = 0;
  scenes[2].addEventListener("enter", () => { if (!fire) fire = createFire(canvas); });
  canvas.addEventListener("click", () => {
    if (lit || !fire) return;
    fire.addLog();
    if (fire.logs >= 3) { line.textContent = "Det er nok brænde."; light.classList.remove("hidden"); }
    else line.textContent = fire.logs === 1 ? "Mere." : "Lidt mere.";
  });
  light.addEventListener("click", () => {
    lit = true; fire.light(); light.classList.add("hidden");
    line.textContent = "Sådan. Roastbeef?";
    canvas.style.cursor = "pointer";
    stage = 1;
  });
  canvas.addEventListener("click", () => {
    if (stage !== 1) return;
    fire.setRoast(true); stage = 2;
    line.textContent = "Nu skumfidusen. Hold knappen.";
    roast.classList.remove("hidden"); mallow.classList.remove("hidden");
  });
  // Hold to roast: white → golden → just-too-burnt → coal.
  const shades = ["#F6EFE4", "#F3DDB0", "#E2B067", "#B8722E", "#6B3B16", "#2A1A10"];
  let t0 = 0, timer = 0;
  function tone(ms) {
    const i = Math.min(shades.length - 1, Math.floor(ms / 650));
    puff.style.background = shades[i];
    puff.style.transform = ms > 2600 ? `scale(${1 - (ms - 2600) / 6000})` : "";
  }
  function start(e) { if (stage !== 2 || t0) return; e.preventDefault(); t0 = performance.now(); mallow.classList.add("roasting"); timer = setInterval(() => tone(performance.now() - t0), 60); }
  function stop() {
    if (!t0) return;
    const ms = performance.now() - t0; t0 = 0; clearInterval(timer); mallow.classList.remove("roasting");
    let verdict;
    if (ms < 900) verdict = "Rå. Prøv igen.";
    else if (ms < 2000) verdict = "Gylden. Lidt kedeligt.";
    else if (ms < 3300) { verdict = "Lige præcis for brændt. Perfekt."; finish(); }
    else { verdict = "Kul. Også fint."; finish(); }
    line.textContent = verdict;
  }
  function finish() { stage = 3; roast.classList.add("hidden"); next.classList.remove("hidden"); }
  roast.addEventListener("pointerdown", start);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
  roast.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") start(e); });
  roast.addEventListener("keyup", stop);
}

// ---------- Scene 4: tap the sky ----------
{
  const zone = $("tapzone"), line = $("stars-line"), next = scenes[3].querySelector("[data-next]");
  let taps = 0;
  const lines = ["Igen.", "Én til.", "Ønsk dig noget.", "Sig det ikke højt."];
  zone.addEventListener("pointerdown", (e) => {
    shoot(e.clientX, e.clientY); taps++;
    line.textContent = lines[Math.min(taps - 1, lines.length - 1)];
    if (taps >= 3) next.classList.remove("hidden");
  });
}

// ---------- Scene 5: the hair ----------
{
  const smoke = $("smoke"), me = $("me"), meLabel = $("me-label"), hat = $("hat"), line = $("hair-line"), next = scenes[4].querySelector("[data-next]");
  let flips = 0, hatOn = false;
  $("wind").addEventListener("click", () => {
    flips++;
    const left = flips % 2 === 1;
    smoke.classList.toggle("left", left);
    me.classList.toggle("moved", left); meLabel.classList.toggle("moved", left);
    line.textContent = left ? "Jeg sidder i røgen. Altid." : "Vinden vender igen. Jeg flytter mig igen.";
    if (flips >= 2) next.classList.remove("hidden");
  });
  $("hatbtn").addEventListener("click", (e) => {
    hatOn = !hatOn; hat.classList.toggle("hidden", !hatOn);
    e.currentTarget.textContent = hatOn ? "Hue af" : "Hue på";
    if (hatOn) line.textContent = "Der er en hue med. Til dig.";
    next.classList.remove("hidden");
  });
}

// ---------- Scene 6: the button that cannot say no ----------
{
  const no = $("no"), yes = $("yes"), buttons = $("buttons"), taunt = $("taunt"), done = $("done"), reply = $("reply");
  const labels = ["Nej?", "Sikker?", "Håret klarer sig", "Der er skumfiduser", "Jeg har shampoo med", "Okay. Ja."];
  const taunts = ["Den virker vist ikke.", "Prøv igen.", "Du løber ikke fra et bål.", "Den anden knap står stille.", "Så tæt på.", "Nu er den også en ja-knap."];
  let tries = 0, becameYes = false;
  function flee() {
    tries++;
    const i = Math.min(tries - 1, labels.length - 1);
    no.textContent = labels[i]; taunt.textContent = taunts[i];
    yes.style.setProperty("--grow", String(Math.min(1.8, 1 + tries * 0.12)));
    if (tries >= labels.length) { becameYes = true; no.classList.remove("fled"); no.style.cssText = ""; return; }
    no.classList.add("fled");
    const area = buttons.getBoundingClientRect();
    const maxX = Math.max(0, area.width - no.offsetWidth - 8), maxY = Math.max(0, area.height - no.offsetHeight - 8);
    const y0 = yes.getBoundingClientRect();
    let x, y, guard = 0;
    do {
      x = 4 + Math.random() * maxX; y = 4 + Math.random() * maxY; guard++;
    } while (guard < 30 && overlaps(area.left + x, area.top + y, no.offsetWidth, no.offsetHeight, y0));
    no.style.left = x + "px"; no.style.top = y + "px";
    no.style.transform = `rotate(${(Math.random() - 0.5) * 16}deg)`;
  }
  function overlaps(x, y, w, h, r) { return x < r.right + 12 && x + w > r.left - 12 && y < r.bottom + 12 && y + h > r.top - 12; }
  no.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && !becameYes) flee(); });
  no.addEventListener("pointerdown", (e) => { if (!becameYes) { e.preventDefault(); flee(); } });
  no.addEventListener("click", (e) => { if (becameYes) confirm(e); else { e.preventDefault(); flee(); } });
  no.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && !becameYes) { e.preventDefault(); flee(); } });
  function confirm(e) {
    buttons.classList.add("hidden"); taunt.classList.add("hidden"); done.classList.remove("hidden");
    scenes[5].querySelector(".display").classList.add("hidden");
    if (REPLY_TO) { reply.href = "sms:" + REPLY_TO + "?body=" + encodeURIComponent("Ja. Men jeg tager min egen hue med."); reply.classList.remove("hidden"); }
    if (!REDUCE) {
      const { W, H } = viewport();
      const r = e.currentTarget.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
      setTimeout(() => burst(W * 0.3, H * 0.35), 250);
      setTimeout(() => burst(W * 0.7, H * 0.3), 500);
    }
    setEmbers(true);
  }
  yes.addEventListener("click", confirm);
}

// Keep the prefix in one place so the markup never drifts from config.
document.querySelectorAll("#digits > span:not(.blank)").forEach((s, i) => { s.textContent = PREFIX.slice(i * 2, i * 2 + 2); });
