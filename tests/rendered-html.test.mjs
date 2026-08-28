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
  assert.match(html, /把复杂问题，整理成可以直接使用的教程与工具/);
  assert.match(html, /浏览实用教程/);
  assert.match(html, /关于我/);
  assert.match(html, /内容专栏/);
  assert.match(html, /工作室原则/);
  assert.match(html, /随心记录/);
  assert.match(html, /汽车数据与金融/);
  assert.match(html, /生活效率/);
  assert.match(html, /经历不是标签，而是下一阶段的材料/);
  assert.doesNotMatch(html, />购车与车型</);
  assert.doesNotMatch(html, />金融计算</);
});

test("keeps generated lifestyle imagery local to the site", async () => {
  await Promise.all([
    access(new URL("../public/images/home-hero.png", import.meta.url)),
    access(new URL("../public/images/family-planning.png", import.meta.url)),
    access(new URL("../public/images/efficiency-desk.png", import.meta.url)),
  ]);
});

test("keeps the primary navigation fixed and the buyer journey interactive", async () => {
  const [pageSource, styles, records] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../content/records.json", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /\.site-header\s*\{[\s\S]*?position:\s*fixed;/);
  assert.match(styles, /\.journey-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(10,/);
  assert.match(pageSource, /aria-label="横向浏览买车阶段"/);
  assert.match(pageSource, /aria-pressed=\{selectedStage === item\.key\}/);
  assert.match(records, /个人无限公司/);
  assert.match(records, /短期先活下来，长期才有意义/);
  assert.match(records, /事实—影响—选项—请求—时间/);
  assert.match(records, /改变不了环境时，离开也是一种负责/);
  assert.match(records, /星宇股份/);
  assert.match(records, /特殊工时制度须申请并经批准后实施/);
});

test("separates loan finance, first payment, and ownership-cost inputs", async () => {
  const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(pageSource, />贷款金融</);
  assert.match(pageSource, />税费、保险与首次付款</);
  assert.match(pageSource, />月持有与持有年限费用</);
  assert.match(pageSource, /firstPaymentAmount/);
  assert.match(pageSource, /loanPayoffMonth/);
  assert.match(pageSource, /monthlyOwnershipCost/);
  assert.match(pageSource, /年化利率（合同口径）/);
  assert.doesNotMatch(pageSource, /官方 5 年免 3 年利息/);
  assert.match(pageSource, /留言与建议/);
  assert.match(pageSource, /\/api\/feedback/);
  assert.match(pageSource, /只用于贷款结清测算/);
  assert.match(pageSource, /购车金额（含选装）/);
  assert.match(pageSource, /nioGroupBrands\.includes\(selectedBrand\)/);
  assert.match(pageSource, /租电减免金额/);
  assert.match(pageSource, /不自动填入/);
  assert.match(pageSource, /brand-price-table/);
});

test("includes maintainable tutorials, records, drafts, visit statistics, and the local publisher", async () => {
  const [pageSource, visitSource, publisherSource, publisherHtml, tutorials, records] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/stats/visits/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../tools/tutorial-publisher/server.mjs", import.meta.url), "utf8"),
    readFile(new URL("../tools/tutorial-publisher/index.html", import.meta.url), "utf8"),
    readFile(new URL("../content/tutorials.json", import.meta.url), "utf8"),
    readFile(new URL("../content/records.json", import.meta.url), "utf8"),
  ]);
  assert.match(pageSource, /Practical tutorials/);
  assert.match(pageSource, /累计访问/);
  assert.match(visitSource, /site_stats/);
  assert.match(publisherSource, /content\/tutorials\.json/);
  assert.match(publisherSource, /drafts\.local\.json/);
  assert.match(publisherSource, /content\/records\.json/);
  assert.match(publisherHtml, /多维表格/);
  assert.match(publisherHtml, /图片链接/);
  assert.match(publisherHtml, /isPublished\(\)\?'更新':'发布'/);
  assert.match(tutorials, /把零散网页整理成可追溯的内容库/);
  assert.equal(JSON.parse(records).length, 3);
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
