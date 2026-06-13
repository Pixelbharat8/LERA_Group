#!/usr/bin/env node
/**
 * Generate every PNG size that Capacitor / iOS / Android / PWA expect from
 * the SVG sources in frontend/public/icons/. Idempotent — re-running just
 * overwrites the outputs.
 *
 * Outputs:
 *   frontend/public/icons/icon-192.png       PWA standard (Notification badge / web push)
 *   frontend/public/icons/icon-512.png       PWA large
 *   frontend/public/icons/badge-72.png       Notification badge
 *   frontend/public/icons/icon.png           1024×1024 source for @capacitor/assets
 *   frontend/public/icons/splash.png         2732×2732 splash source for @capacitor/assets
 *
 * Once you've installed @capacitor/assets and these PNGs exist, running
 *     npm run mobile:assets
 * will fan them out into the native ios/ + android/ projects (assumes
 * `npm run mobile:bootstrap` has scaffolded those).
 *
 * Pure-Rust @resvg/resvg-js is used for SVG rendering so no system libvips /
 * librsvg is required — ideal for CI containers.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const iconsDir = path.join(root, "frontend", "public", "icons");

async function loadResvg() {
  // resvg-js lives in frontend/node_modules — resolve it explicitly so the
  // script works when invoked from anywhere in the monorepo.
  const candidate = path.join(root, "frontend", "node_modules", "@resvg", "resvg-js");
  try {
    return (await import(`file://${candidate}/index.js`)).Resvg;
  } catch {
    return (await import("@resvg/resvg-js")).Resvg;
  }
}

async function rasterize(Resvg, svgBuffer, size) {
  const resvg = new Resvg(svgBuffer, {
    fitTo: { mode: "width", value: size },
    background: "rgba(0,0,0,0)",
  });
  return resvg.render().asPng();
}

async function main() {
  let Resvg;
  try {
    Resvg = await loadResvg();
  } catch (e) {
    console.error(
      "[generate-mobile-assets] `@resvg/resvg-js` not installed.\n" +
        "Install it once: cd frontend && npm i -D @resvg/resvg-js"
    );
    console.error(e);
    process.exit(2);
  }

  // resvg requires UTF-8 strings (or buffers without a BOM); read as text.
  const logo = await fs.readFile(path.join(iconsDir, "logo.svg"), "utf8");
  const splash = await fs.readFile(path.join(iconsDir, "splash.svg"), "utf8");

  const targets = [
    { src: logo, size: 192, name: "icon-192.png" },
    { src: logo, size: 512, name: "icon-512.png" },
    { src: logo, size: 72, name: "badge-72.png" },
    { src: logo, size: 1024, name: "icon.png" },
    { src: splash, size: 2732, name: "splash.png" },
  ];

  for (const { src, size, name } of targets) {
    const out = path.join(iconsDir, name);
    const png = await rasterize(Resvg, src, size);
    await fs.writeFile(out, png);
    console.log(`  wrote ${path.relative(root, out)} (${size}×${size}, ${(png.length / 1024).toFixed(1)} KiB)`);
  }

  // Manifest helper — tells the browser which icon to use as the PWA tile.
  const manifest = path.join(root, "frontend", "public", "manifest.webmanifest");
  await fs.writeFile(
    manifest,
    JSON.stringify(
      {
        name: "LERA Academy",
        short_name: "LERA",
        start_url: "/dashboard",
        display: "standalone",
        background_color: "#1e3a8a",
        theme_color: "#1e40af",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      null,
      2
    )
  );
  console.log(`  wrote ${path.relative(root, manifest)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
