// The prefix she gave and the ending she gave up. The ending is never
// committed: set VITE_ENDING in .env.local or in Vercel's environment
// variables, or pass it as a URL hash (#00). Empty means any two digits
// unlock the page.
const fromHash = /^#(\d{2})$/.exec(location.hash);
export const PREFIX = "221826";
export const ENDING = (fromHash && fromHash[1]) || import.meta.env.VITE_ENDING || "";
export const REPLY_TO = import.meta.env.VITE_REPLY_TO || "";
export const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
