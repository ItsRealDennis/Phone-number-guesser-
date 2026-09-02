// The bonfire canvas: logs you stack, flames once lit, and a spit with roast beef.
import { REDUCE } from "./config.js";

export function createFire(canvas) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, logs = [], flames = [], lit = false, roast = false, heat = 0;

  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function addLog() {
    if (logs.length >= 5) return false;
    const i = logs.length;
    logs.push({ x: W / 2 + (Math.random() - 0.5) * 30, y: H * 0.78 - i * 9, rot: (i % 2 ? 1 : -1) * (0.35 + Math.random() * 0.25), len: 120 + Math.random() * 40 });
    draw();
    return true;
  }
  function drawLogs() {
    for (const l of logs) {
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rot);
      ctx.fillStyle = "#4A3324"; roundRect(-l.len / 2, -7, l.len, 14, 7); ctx.fill();
      ctx.fillStyle = "#6B4A34"; roundRect(-l.len / 2 + 6, -4, l.len - 12, 4, 2); ctx.fill();
      ctx.restore();
    }
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function spawnFlame() {
    const spread = 40 + heat * 40;
    flames.push({ x: W / 2 + (Math.random() - 0.5) * spread, y: H * 0.74, vx: (Math.random() - 0.5) * 0.8, vy: -(1.4 + Math.random() * 2.2) * (0.5 + heat * 0.7), r: (8 + Math.random() * 16) * (0.4 + heat * 0.8), life: 1 });
  }
  function drawFlames() {
    if (lit) { heat = Math.min(1, heat + 0.01); for (let i = 0; i < 4; i++) spawnFlame(); }
    ctx.globalCompositeOperation = "lighter";
    for (let i = flames.length - 1; i >= 0; i--) {
      const f = flames[i];
      f.x += f.vx + Math.sin(f.y * 0.05) * 0.3; f.y += f.vy; f.life -= 0.022; f.r *= 0.985;
      if (f.life <= 0) { flames.splice(i, 1); continue; }
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      const a = f.life * 0.55;
      g.addColorStop(0, `rgba(255,230,160,${a})`); g.addColorStop(0.4, `rgba(255,138,61,${a * 0.8})`); g.addColorStop(1, "rgba(200,40,20,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }
  function drawRoast() {
    if (!roast) return;
    const y = H * 0.42;
    ctx.strokeStyle = "#C9C1B6"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(W * 0.22, H * 0.8); ctx.lineTo(W * 0.22, y); ctx.moveTo(W * 0.78, H * 0.8); ctx.lineTo(W * 0.78, y); ctx.moveTo(W * 0.2, y); ctx.lineTo(W * 0.8, y); ctx.stroke();
    ctx.save(); ctx.translate(W / 2, y);
    ctx.fillStyle = "#B5473A"; ctx.beginPath(); ctx.ellipse(0, 0, 52, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#D9705F"; ctx.beginPath(); ctx.ellipse(0, -3, 44, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#F0A090"; ctx.beginPath(); ctx.ellipse(0, -4, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,244,228,0.03)"; roundRect(0, 0, W, H, 16); ctx.fill();
    ctx.fillStyle = "#131A2C"; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.82, W * 0.32, 12, 0, 0, Math.PI * 2); ctx.fill();
    drawLogs();
    if (lit) drawFlames();
    drawRoast();
  }
  function loop() { draw(); if (lit && !REDUCE) requestAnimationFrame(loop); }

  size();
  window.addEventListener("resize", size);
  return {
    addLog,
    get logs() { return logs.length; },
    light() { lit = true; loop(); if (REDUCE) { heat = 1; for (let i = 0; i < 60; i++) spawnFlame(); draw(); } },
    setRoast(v) { roast = v; draw(); },
  };
}
