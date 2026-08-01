import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the structured personal homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /周多福/);
  assert.match(html, /先看四个专栏/);
  assert.match(html, /关于我/);
  assert.match(html, /内容专栏/);
  assert.match(html, /服务范围/);
  assert.match(html, /每日记录/);
  assert.match(html, /购车与车型/);
  assert.match(html, /金融计算/);
  assert.match(html, /效率生活/);
  assert.match(html, /\/images\/home-hero\.png/);
});

test("keeps generated lifestyle imagery local to the site", async () => {
  await Promise.all([
    access(new URL("../public/images/home-hero.png", import.meta.url)),
    access(new URL("../public/images/family-planning.png", import.meta.url)),
    access(new URL("../public/images/efficiency-desk.png", import.meta.url)),
  ]);
});
