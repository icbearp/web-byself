import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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

test("keeps the primary navigation fixed and the buyer journey interactive", async () => {
  const [pageSource, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /\.site-header\s*\{[\s\S]*?position:\s*fixed;/);
  assert.match(styles, /\.journey-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(10,/);
  assert.match(pageSource, /aria-label="横向浏览买车阶段"/);
  assert.match(pageSource, /aria-pressed=\{selectedStage === item\.key\}/);
});

test("separates loan finance from ownership-cost inputs", async () => {
  const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(pageSource, />贷款金融</);
  assert.match(pageSource, />月持有与持有年限费用</);
  assert.match(pageSource, /loanPayoffMonth/);
  assert.match(pageSource, /monthlyOwnershipCost/);
  assert.match(pageSource, /只用于贷款结清测算，不会改变下方的持有年限/);
});
