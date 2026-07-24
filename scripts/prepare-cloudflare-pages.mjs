import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const client = path.join(dist, "client");
const server = path.join(dist, "server");
const pages = path.join(root, "dist-pages");

await rm(pages, { force: true, recursive: true });
await mkdir(pages, { recursive: true });

await cp(client, pages, { force: true, recursive: true });

const serverEntries = [
  "assets",
  "ssr",
  "__vite_rsc_assets_manifest.js",
  "vinext-server.json",
  "vinext-externals.json",
  "image-config.json",
];

for (const entry of serverEntries) {
  await cp(path.join(server, entry), path.join(pages, entry), {
    force: true,
    recursive: true,
  });
}

await cp(path.join(server, "index.js"), path.join(pages, "_worker.js"), {
  force: true,
});

console.log("Cloudflare Pages output prepared at dist-pages");
