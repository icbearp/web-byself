import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contentDir = join(root, "content");
const tutorialsFile = join(contentDir, "tutorials.json");
const recordsFile = join(contentDir, "records.json");
const draftsFile = join(contentDir, "drafts.local.json");
const changelogFile = join(contentDir, "changelog.json");
const editorFile = join(root, "tools", "tutorial-publisher", "index.html");
const port = 4178;

function send(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  response.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}

async function readJson(path, fallback = []) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function normalizeBase(input) {
  const today = new Date().toISOString().slice(0, 10);
  const title = String(input.title ?? "").trim().slice(0, 120);
  const id = String(input.id || slugify(title)).slice(0, 100);
  if (!id || !title) throw new Error("请填写标题");
  const sources = Array.isArray(input.sources)
    ? input.sources.filter((item) => item?.label && /^https?:\/\//.test(item?.href)).slice(0, 30).map((item) => ({ label: String(item.label).slice(0, 120), href: String(item.href).slice(0, 1000) }))
    : [];
  return {
    id,
    title,
    summary: String(input.summary ?? "").trim().slice(0, 300),
    tags: Array.isArray(input.tags) ? input.tags.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 12) : [],
    publishedAt: String(input.publishedAt || today),
    updatedAt: today,
    content: String(input.content ?? "").trim().slice(0, 80000),
    sources,
  };
}

function normalizeEntry(input) {
  const type = input.type === "record" ? "record" : "tutorial";
  const base = normalizeBase(input);
  if (type === "record") {
    const allowedCategories = new Set(["career-growth", "life-efficiency", "side-project"]);
    const category = allowedCategories.has(input.category) ? input.category : "life-efficiency";
    return {
      type,
      entry: {
        ...base,
        date: String(input.date || base.publishedAt),
        category,
        paragraphs: base.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean),
        takeaway: String(input.takeaway || base.summary || "这条记录仍在继续整理。").trim().slice(0, 500),
      },
    };
  }
  return { type, entry: { ...base, category: String(input.category || "未分类").trim().slice(0, 30) || "未分类" } };
}

async function savePublished(input) {
  const { type, entry } = normalizeEntry(input);
  const targetFile = type === "record" ? recordsFile : tutorialsFile;
  const items = await readJson(targetFile);
  const index = items.findIndex((item) => item.id === entry.id);
  if (index >= 0) entry.publishedAt = items[index].publishedAt || entry.publishedAt;
  if (index >= 0) items[index] = entry;
  else items.unshift(entry);
  await writeJson(targetFile, items);

  const changelog = await readJson(changelogFile);
  const contentLabel = type === "record" ? "随心记录" : "教程";
  changelog.unshift({ date: entry.updatedAt, title: `${index >= 0 ? "更新" : "发布"}${contentLabel}：${entry.title}`, detail: entry.summary || entry.takeaway || `${contentLabel}内容已更新。` });
  await writeJson(changelogFile, changelog.slice(0, 100));

  const drafts = await readJson(draftsFile);
  await writeJson(draftsFile, drafts.filter((draft) => !(draft.type === type && draft.id === entry.id)));
  return { type, entry, targetFile };
}

async function saveDraft(input) {
  const { type, entry } = normalizeEntry(input);
  const drafts = await readJson(draftsFile);
  const draft = { ...entry, type, savedAt: new Date().toISOString() };
  const index = drafts.findIndex((item) => item.type === type && item.id === entry.id);
  if (index >= 0) drafts[index] = draft;
  else drafts.unshift(draft);
  await writeJson(draftsFile, drafts.slice(0, 100));
  return draft;
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

async function readRequest(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 200000) throw new Error("内容过长");
  }
  return JSON.parse(raw || "{}");
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/") return send(response, 200, await readFile(editorFile, "utf8"), "text/html; charset=utf-8");
    if (request.method === "GET" && request.url === "/api/content") {
      return send(response, 200, { tutorials: await readJson(tutorialsFile), records: await readJson(recordsFile), drafts: await readJson(draftsFile), changelog: await readJson(changelogFile) });
    }
    if (request.method === "POST" && request.url === "/api/draft") {
      const draft = await saveDraft(await readRequest(request));
      return send(response, 200, { ok: true, entry: draft, message: "草稿已保存在这台电脑，不会上传 GitHub" });
    }
    if (request.method === "POST" && request.url === "/api/delete-draft") {
      const input = await readRequest(request);
      const drafts = await readJson(draftsFile);
      await writeJson(draftsFile, drafts.filter((draft) => !(draft.type === input.type && draft.id === input.id)));
      return send(response, 200, { ok: true, message: "草稿已删除" });
    }
    if (request.method === "POST" && request.url === "/api/publish") {
      const { type, entry, targetFile } = await savePublished(await readRequest(request));
      const relativeTarget = targetFile === recordsFile ? "content/records.json" : "content/tutorials.json";
      await runGit(["add", "--", relativeTarget, "content/changelog.json"]);
      const status = await runGit(["diff", "--cached", "--name-only"]);
      if (!status) return send(response, 200, { ok: true, entry, message: "内容没有变化，无需重复发布" });
      await runGit(["commit", "-m", `Publish ${type === "record" ? "record" : "tutorial"}: ${entry.title}`]);
      const branch = (await runGit(["branch", "--show-current"])) || "main";
      await runGit(["push", "origin", branch]);
      return send(response, 200, { ok: true, entry, message: `已发布并推送 ${branch}，Cloudflare 将自动更新` });
    }
    return send(response, 404, { error: "Not found" });
  } catch (error) {
    return send(response, 500, { error: error instanceof Error ? error.message : "操作失败" });
  }
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}`;
  process.stdout.write(`内容发布工具已打开：${url}\n草稿只保存在本机。关闭此窗口即可停止。\n`);
  if (process.platform === "win32") spawn("cmd", ["/c", "start", "", url], { windowsHide: true, detached: true, stdio: "ignore" }).unref();
});
