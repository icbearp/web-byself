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
  assert.match(html, /随心记录/);
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
  assert.match(pageSource, /个人无限公司，准备中/);
  assert.match(pageSource, /直营没有消除利益差异/);
});

test("separates loan finance, first payment, and ownership-cost inputs", async () => {
  const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(pageSource, />贷款金融</);
  assert.match(pageSource, />税费、保险与首次付款</);
  assert.match(pageSource, />月持有与持有年限费用</);
  assert.match(pageSource, /firstPaymentAmount/);
  assert.match(pageSource, /loanPayoffMonth/);
  assert.match(pageSource, /monthlyOwnershipCost/);
  assert.match(pageSource, /贷款金额 × 3% × 2 年/);
  assert.match(pageSource, /5\.64% 参考年化/);
  assert.match(pageSource, /留言与建议/);
  assert.match(pageSource, /\/api\/feedback/);
  assert.match(pageSource, /只用于贷款结清测算，不会改变下方的持有年限/);
});

test("supports guided accounts, cloud bills, and a private admin inbox", async () => {
  const [pageSource, authSource, billSource, adminSource] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/_lib/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/bills/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/bills/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(pageSource, /注册前请确认/);
  assert.match(pageSource, /我已阅读并同意以上服务提示/);
  assert.match(pageSource, /不登录也能使用计算器/);
  assert.match(pageSource, /留言与用户账单/);
  assert.match(authSource, /PBKDF2/);
  assert.match(authSource, /HttpOnly; Secure; SameSite=Lax/);
  assert.match(billSource, /eq\(bills\.userId, user\.id\)/);
  assert.match(adminSource, /user\.role !== "admin"/);
});
