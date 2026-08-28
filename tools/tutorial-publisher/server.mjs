import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const tutorialsFile = join(root, "content", "tutorials.json");
const changelogFile = join(root, "content", "changelog.json");
const editorFile = join(root, "tools", "tutorial-publisher", "index.html");
const port = 4178;

function send(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  response.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function normalizeTutorial(input) {
  const title = String(input.title ?? "").trim().slice(0, 120);
  const id = String(input.id || title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "")).slice(0, 100);
  if (!id || !title) throw new Error("请填写教程标题");
  const sources = Array.isArray(input.sources) ? input.sources.filter((item) => item?.label && /^https?:\/\//.test(item?.href)).slice(0, 30) : [];
  return {
    id,
    title,
    summary: String(input.summary ?? "").trim().slice(0, 300),
    category: String(input.category ?? "未分类").trim().slice(0, 30) || "未分类",
    tags: Array.isArray(input.tags) ? input.tags.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 12) : [],
    publishedAt: String(input.publishedAt ?? new Date().toISOString().slice(0, 10)),
    updatedAt: new Date().toISOString().slice(0, 10),
    content: String(input.content ?? "").trim().slice(0, 50000),
    sources,
  };
}

async function saveTutorial(input, addChangelog) {
  const tutorial = normalizeTutorial(input);
  const tutorials = await readJson(tutorialsFile);
  const index = tutorials.findIndex((item) => item.id === tutorial.id);
  if (index >= 0) tutorial.publishedAt = tutorials[index].publishedAt || tutorial.publishedAt;
  if (index >= 0) tutorials[index] = tutorial;
  else tutorials.unshift(tutorial);
  await writeFile(tutorialsFile, `${JSON.stringify(tutorials, null, 2)}\n`, "utf8");
  if (addChangelog) {
    const changelog = await readJson(changelogFile);
    changelog.unshift({ date: tutorial.updatedAt, title: index >= 0 ? `更新教程：${tutorial.title}` : `发布教程：${tutorial.title}`, detail: tutorial.summary || "教程内容已更新。" });
    await writeFile(changelogFile, `${JSON.stringify(changelog.slice(0, 100), null, 2)}\n`, "utf8");
  }
  return tutorial;
}

function gitPath() {
  const bundled = join(process.env.USERPROFILE || "", ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "native", "git", "cmd", "git.exe");
  return process.env.GIT_PATH || (existsSync(bundled) ? bundled : "git");
}

function runGit(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(gitPath(), args, { cwd: root, shell: false, windowsHide: true });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolvePromise(output.trim()) : reject(new Error(output.trim() || `Git 退出码 ${code}`)));
  });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/") return send(response, 200, await readFile(editorFile, "utf8"), "text/html; charset=utf-8");
    if (request.method === "GET" && request.url === "/api/content") return send(response, 200, { tutorials: await readJson(tutorialsFile), changelog: await readJson(changelogFile) });
    if (request.method === "POST" && (request.url === "/api/save" || request.url === "/api/publish")) {
      let raw = "";
      for await (const chunk of request) {
        raw += chunk;
        if (raw.length > 100000) throw new Error("内容过长");
      }
      const tutorial = await saveTutorial(JSON.parse(raw), request.url === "/api/publish");
      if (request.url === "/api/save") return send(response, 200, { ok: true, tutorial, message: "已保存到本地内容库" });
      await runGit(["add", "--", "content/tutorials.json", "content/changelog.json"]);
      const status = await runGit(["diff", "--cached", "--name-only"]);
      if (!status) return send(response, 200, { ok: true, tutorial, message: "内容没有变化，无需重复发布" });
      await runGit(["commit", "-m", `Publish tutorial: ${tutorial.title}`]);
      const branch = (await runGit(["branch", "--show-current"])) || "main";
      const pushed = await runGit(["push", "origin", branch]);
      return send(response, 200, { ok: true, tutorial, message: `已推送 ${branch}，Cloudflare 将自动更新`, detail: pushed });
    }
    return send(response, 404, { error: "Not found" });
  } catch (error) {
    return send(response, 500, { error: error instanceof Error ? error.message : "操作失败" });
  }
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}`;
  process.stdout.write(`教程发布工具已打开：${url}\n关闭此窗口即可停止。\n`);
  if (process.platform === "win32") spawn("cmd", ["/c", "start", "", url], { windowsHide: true, detached: true, stdio: "ignore" }).unref();
});
