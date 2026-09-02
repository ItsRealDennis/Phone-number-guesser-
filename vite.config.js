import { defineConfig, loadEnv } from "vite";

// Injects the absolute og:image tag when VITE_SITE_URL is set, e.g. on Vercel.
function ogImage(site) {
  return {
    name: "og-image",
    transformIndexHtml(html) {
      if (!site) return html.replace("<!--og-image-->", "");
      const base = site.replace(/\/$/, "");
      return html.replace("<!--og-image-->",
        `<meta property="og:image" content="${base}/bg/og.jpg">\n  <meta property="og:url" content="${base}/">\n  <meta name="twitter:card" content="summary_large_image">`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return { plugins: [ogImage(env.VITE_SITE_URL)], build: { target: "es2019" } };
});
