// Full-screen background: stars, shooting stars, embers, and sparks.
import { REDUCE } from "./config.js";

const sky = document.getElementById("sky"), sctx = sky.getContext("2d");
const embersC = document.getElementById("embers"), ectx = embersC.getContext("2d");
const sparksC = document.getElementById("sparks"), pctx = sparksC.getContext("2d");
let W = 0, H = 0, stars = [], shooters = [], embers = [], sparks = [];
let embersOn = false, topDirty = false;

function size() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  for (const c of [sky, embersC, sparksC]) { c.width = W * dpr; c.height = H * dpr; c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0); }
  stars = Array.from({ length: Math.round(W * H / 6000) }, () => ({
    x: Math.random() * W, y: Math.random() * H * 0.9, r: Math.random() * 1.3 + 0.3,
    p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2, warm: Math.random() < 0.12,
  }));
  drawSky(0);
}

function drawSky(t) {
  sctx.clearRect(0, 0, W, H);
  for (const s of stars) {
    sctx.globalAlpha = REDUCE ? 0.7 : 0.45 + 0.45 * Math.sin(s.p + t * 0.0012 * s.s);
    sctx.fillStyle = s.warm ? "#FFE1B3" : "#F6EFE4";
    sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); sctx.fill();
  }
  sctx.globalAlpha = 1;
  if (!REDUCE && Math.random() < 0.003) shoot(Math.random() * W * 0.7, Math.random() * H * 0.3);
}

export function shoot(x, y) {
  shooters.push({ x, y, vx: 6 + Math.random() * 5, vy: 2.5 + Math.random() * 2.5, life: 1 });
}

export function setEmbers(on) { embersOn = on; document.getElementById("glow").classList.toggle("on", on); }

function drawEmbers() {
  ectx.clearRect(0, 0, W, H);
  if (embersOn && embers.length < 70 && Math.random() < 0.55) {
    embers.push({ x: W * (0.3 + Math.random() * 0.4), y: H + 10, vx: (Math.random() - 0.5) * 0.6, vy: -(0.6 + Math.random() * 1.4), r: 1 + Math.random() * 2.2, life: 1, c: Math.random() < 0.5 ? "#FF8A3D" : "#FFC46B" });
  }
  for (let i = embers.length - 1; i >= 0; i--) {
    const e = embers[i];
    e.x += e.vx + Math.sin(e.y * 0.02) * 0.4; e.y += e.vy; e.life -= 0.0035;
    if (e.life <= 0) { embers.splice(i, 1); continue; }
    ectx.globalAlpha = Math.max(0, e.life) * 0.9; ectx.fillStyle = e.c;
    ectx.beginPath(); ectx.arc(e.x, e.y, e.r * (0.6 + e.life * 0.4), 0, Math.PI * 2); ectx.fill();
  }
  ectx.globalAlpha = 1;
}

export function burst(x, y, n = 140) {
  const cols = ["#FFC46B", "#FF8A3D", "#F6EFE4", "#FFD9A8"];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 9;
    sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, s: 2 + Math.random() * 3, c: cols[i % cols.length], life: 1 });
  }
}
function drawSparks() {
  if (!sparks.length && !shooters.length) { if (topDirty) { pctx.clearRect(0, 0, W, H); topDirty = false; } return; }
  pctx.clearRect(0, 0, W, H); topDirty = true;
  for (let i = shooters.length - 1; i >= 0; i--) {
    const sh = shooters[i];
    sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.02;
    const g = pctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 14, sh.y - sh.vy * 14);
    g.addColorStop(0, `rgba(255,244,228,${Math.max(0, sh.life)})`); g.addColorStop(1, "rgba(255,244,228,0)");
    pctx.strokeStyle = g; pctx.lineWidth = 1.8; pctx.beginPath(); pctx.moveTo(sh.x, sh.y); pctx.lineTo(sh.x - sh.vx * 14, sh.y - sh.vy * 14); pctx.stroke();
    if (sh.life <= 0 || sh.x > W + 60 || sh.y > H + 60) shooters.splice(i, 1);
  }
  sparks = sparks.filter(p => p.life > 0);
  for (const p of sparks) {
    p.vy += 0.22; p.x += p.vx; p.y += p.vy; p.life -= 0.012;
    pctx.globalAlpha = Math.max(0, p.life); pctx.fillStyle = p.c;
    pctx.beginPath(); pctx.arc(p.x, p.y, Math.max(0, p.s * p.life), 0, Math.PI * 2); pctx.fill();
  }
  pctx.globalAlpha = 1;
}

export function startSky() {
  size();
  window.addEventListener("resize", size);
  if (REDUCE) return;
  (function loop(t) { drawSky(t); drawEmbers(); drawSparks(); requestAnimationFrame(loop); })(0);
}
export const viewport = () => ({ W, H });
