import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
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

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("server-renders the redesigned studio homepage", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-frame-options"), "DENY");

  const html = await response.text();
  assert.match(html, /周多福/);
  assert.match(html, /我是<span>周多福<\/span>/);
  assert.match(html, /我在做的三件事/);
  assert.match(html, /我的内容/);
  assert.match(html, /我的成长之路/);
  assert.match(html, /可以一起做的事/);
  assert.match(html, /AI 动效视频定制/);
  assert.match(html, /href="https:\/\/subscription-store\.otafuku2599\.workers\.dev\/"[^>]*>进入订阅商店/);
  assert.match(html, /Dear Friend/);
  assert.match(html, /实用教程/);
  assert.match(html, /随心记录/);
  assert.match(html, /留言与建议/);
  for (const anchor of ["content", "journey", "services", "contact"]) assert.match(html, new RegExp(`id="${anchor}"`));
  assert.doesNotMatch(html, /汽车数据与金融/);
  assert.doesNotMatch(html, /贷款金融|月供|购车/);
});

test("server-renders each workspace as its own page", async () => {
  const pages = [
    ["/tutorials", /教程不是告诉你/, /实用教程 \| 周多福/],
    ["/records", /写成可以反复引用的判断/, /随心记录 \| 周多福/],
  ];
  for (const [path, heading, title] of pages) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, heading, path);
    assert.match(html, title, path);
    assert.match(html, /aria-current="page"/, path);
  }
});

test("removes the car finance workspace and calculator code", async () => {
  const [studio, layout] = await Promise.all([source("app/studio.tsx"), source("app/layout.tsx")]);
  assert.doesNotMatch(studio, /calculateLoanQuote|loanPayoffMonth|brandReferences|purchaseStages/);
  assert.doesNotMatch(studio, /\/api\/bills/);
  assert.doesNotMatch(layout, /金融/);
  await assert.rejects(access(new URL("../app/finance-math.ts", import.meta.url)));
  await assert.rejects(access(new URL("../app/api/bills/route.ts", import.meta.url)));
});

test("uses the light-blue three-tone design system and motion", async () => {
  const [styles, motion, hero] = await Promise.all([source("app/globals.css"), source("app/motion.ts"), source("app/hero-art.tsx")]);
  assert.match(styles, /\.timeline/);
  assert.match(styles, /\.ticker-track/);
  assert.match(styles, /@keyframes marquee/);
  for (const token of ["--sky:", "--lilac:", "--mint:", "--sky-ink:", "--lilac-ink:", "--mint-ink:"]) assert.ok(styles.includes(token), token);
  assert.match(styles, /\.site-header\s*\{[\s\S]*?position:\s*fixed;/);
  assert.match(styles, /\.card-frame/);
  assert.match(styles, /\.content-card/);
  assert.match(styles, /\.letter/);
  assert.match(styles, /::view-transition-new\(root\)/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(motion, /startViewTransition/);
  assert.match(motion, /IntersectionObserver/);
  assert.match(hero, /Asia\/Shanghai/);
});

test("keeps maintainable tutorials, records, and visit statistics", async () => {
  const [studio, visitSource, tutorials, records] = await Promise.all([
    source("app/studio.tsx"),
    source("app/api/stats/visits/route.ts"),
    source("content/tutorials.json"),
    source("content/records.json"),
  ]);
  assert.match(studio, /Practical tutorials/);
  assert.match(studio, /累计访问/);
  assert.match(visitSource, /site_stats/);
  assert.match(tutorials, /把零散网页整理成可追溯的内容库/);
  assert.equal(JSON.parse(records).length, 3);
  assert.match(records, /改变不了环境时，离开也是一种负责/);
});

test("supports anchored discussions and moderation", async () => {
  const [studio, discussion, styles, schema, commentsRoute, adminCommentsRoute] = await Promise.all([
    source("app/studio.tsx"),
    source("app/discussion.tsx"),
    source("app/globals.css"),
    source("db/schema.ts"),
    source("app/api/comments/route.ts"),
    source("app/api/admin/comments/route.ts"),
  ]);
  assert.match(discussion, /批注这段/);
  assert.match(discussion, /讨论与批注/);
  assert.match(studio, /contentType="tutorial"/);
  assert.match(studio, /contentType="record"/);
  assert.match(studio, /contentType="article"/);
  assert.match(styles, /\.content-discussion/);
  assert.match(schema, /idx_comments_content_status_created/);
  assert.match(commentsRoute, /reviewRequired/);
  assert.match(adminCommentsRoute, /status === "published"/);
});

test("keeps accounts, the online admin, and security hardening", async () => {
  const [studio, authSource, loginSource, worker, entriesRoute] = await Promise.all([
    source("app/studio.tsx"),
    source("app/api/_lib/auth.ts"),
    source("app/api/auth/login/route.ts"),
    source("worker/index.ts"),
    source("app/api/admin/entries/route.ts"),
  ]);
  assert.match(studio, /注册前请确认/);
  assert.match(studio, /进入内容后台/);
  assert.match(authSource, /PBKDF2/);
  assert.match(authSource, /HttpOnly; Secure; SameSite=Lax/);
  assert.match(loginSource, /tooManyRequests/);
  assert.match(worker, /请求来源不被允许/);
  assert.match(entriesRoute, /需要管理员登录/);
});
