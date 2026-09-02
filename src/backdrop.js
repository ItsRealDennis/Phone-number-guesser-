// Photo and video backdrops from public/bg. Picks the portrait or landscape
// variant, shows the still while the loop loads (or always, under reduced
// motion), and cross-fades between scenes. In the single-file build the
// stills are inlined via window.__BG__ and the loops are skipped.
import { REDUCE } from "./config.js";

const root = document.getElementById("backdrop");
const img = document.getElementById("backdrop-img");
const video = document.getElementById("backdrop-video");
const portrait = window.matchMedia("(max-aspect-ratio: 1/1)");
let currentName = null;

const SETS = {
  meadow: { landscape: "meadow-16x9", portrait: "meadow-9x16" },
  close:  { landscape: "close-16x9",  portrait: "close-16x9" },
};

function url(file) {
  const inline = window.__BG__;
  if (inline) return inline[file] || null;
  return "/bg/" + file;
}

function apply() {
  if (!currentName) return;
  const base = SETS[currentName][portrait.matches ? "portrait" : "landscape"];
  const still = url(base + ".webp") || url(base + ".jpg");
  if (still) img.src = still;
  const canWebm = video.canPlayType("video/webm") !== "";
  const loop = REDUCE ? null : (canWebm ? url(base + ".webm") : null) || url(base + ".mp4");
  if (loop) {
    if (video.getAttribute("src") !== loop) { video.src = loop; video.load(); }
    video.classList.remove("hidden");
    video.play().catch(() => {});
  } else {
    video.pause(); video.removeAttribute("src"); video.classList.add("hidden");
  }
}

export function setBackdrop(name) {
  if (name === currentName) return;
  currentName = name;
  if (!name) { root.classList.remove("on"); setTimeout(() => { if (!currentName) { video.pause(); video.removeAttribute("src"); } }, 1300); return; }
  apply();
  root.classList.add("on");
}

portrait.addEventListener("change", apply);
