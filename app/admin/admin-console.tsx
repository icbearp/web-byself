"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { TutorialBody } from "../content-body";
import { SettingsPanel } from "./settings-panel";
import { recordCategoryOptions, type AdminEntry, type ContentSource, type EntryType } from "../content-types";

type AuthUser = { id: string; email: string; role: string };
type Section = "content" | "settings" | "comments" | "feedback";
type EditorView = "split" | "write" | "preview";
type Notice = { tone: "ok" | "error"; text: string } | null;
type CommentItem = { id: string; contentType: string; contentId: string; contentTitle: string; category: string; message: string; authorName: string; anchorText: string; parentId: string | null; status: string; createdAt: string };
type FeedbackItem = { id: number; type: string; message: string; contact: string; page: string; createdAt: string; userEmail?: string | null };

type Draft = {
  type: EntryType;
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string;
  content: string;
  takeaway: string;
  sources: ContentSource[];
  date: string;
};

const typeLabels: Record<EntryType, string> = { tutorial: "教程", record: "随心记录" };
const commentStatusLabels: Record<string, string> = { pending: "待审核", published: "已公开", hidden: "已隐藏" };
const feedbackTypeLabels: Record<string, string> = { suggestion: "建议", question: "提问", experience: "经验", cooperation: "商务合作" };
const recordCategoryLabel = (key: string) => recordCategoryOptions.find((item) => item.key === key)?.label ?? key;

function todayString() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function blankDraft(type: EntryType): Draft {
  return { type, id: "", title: "", summary: "", category: type === "record" ? "life-efficiency" : "", tags: "", content: "", takeaway: "", sources: [], date: todayString() };
}

function draftFromEntry(entry: AdminEntry): Draft {
  return {
    type: entry.type,
    id: entry.id,
    title: entry.title,
    summary: entry.summary,
    category: entry.category,
    tags: entry.tags.join("，"),
    content: entry.content,
    takeaway: entry.takeaway,
    sources: entry.sources,
    date: entry.date || todayString(),
  };
}

function draftPayload(draft: Draft) {
  return { ...draft, tags: draft.tags.split(/[,，\n]/).map((tag) => tag.trim()).filter(Boolean), sources: draft.sources.filter((source) => source.label.trim() && source.href.trim()) };
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "操作失败，请稍后再试。");
  return payload;
}

const toolbar: Array<{ label: string; title: string; apply: (selected: string) => { text: string; block?: boolean } }> = [
  { label: "H2", title: "二级标题", apply: (selected) => ({ text: `## ${selected || "小标题"}`, block: true }) },
  { label: "H3", title: "三级标题", apply: (selected) => ({ text: `### ${selected || "小标题"}`, block: true }) },
  { label: "B", title: "粗体", apply: (selected) => ({ text: `**${selected || "重点"}**` }) },
  { label: "❝", title: "引用", apply: (selected) => ({ text: `> ${selected || "引用内容"}`, block: true }) },
  { label: "•", title: "列表", apply: (selected) => ({ text: (selected || "列表项").split("\n").map((line) => `- ${line}`).join("\n"), block: true }) },
  { label: "1.", title: "编号", apply: (selected) => ({ text: (selected || "步骤").split("\n").map((line, index) => `${index + 1}. ${line}`).join("\n"), block: true }) },
  { label: "链接", title: "插入链接", apply: (selected) => ({ text: `[${selected || "链接文字"}](https://)` }) },
  { label: "图片", title: "插入图片链接", apply: (selected) => ({ text: `![${selected || "图片说明"}](https://)`, block: true }) },
  { label: "表格", title: "插入表格", apply: () => ({ text: "| 项目 | 说明 |\n| --- | --- |\n| 示例 | 内容 |", block: true }) },
];

export function AdminConsole() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [section, setSection] = useState<Section>("content");
  const [notice, setNotice] = useState<Notice>(null);

  const [entries, setEntries] = useState<AdminEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [typeFilter, setTypeFilter] = useState<EntryType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editorView, setEditorView] = useState<EditorView>("split");
  const [mobileEditing, setMobileEditing] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentFilter, setCommentFilter] = useState<"pending" | "published" | "hidden" | "all">("pending");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  const dirty = draft !== null && JSON.stringify(draft) !== savedSnapshot;
  const selectedEntry = entries.find((entry) => `${entry.type}:${entry.id}` === selectedKey) ?? null;

  const flash = useCallback((tone: "ok" | "error", text: string) => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice((current) => (current?.text === text ? null : current)), 4200);
  }, []);


  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const payload = await requestJson<{ entries: AdminEntry[] }>("/api/admin/entries");
      setEntries(payload.entries);
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "内容读取失败。");
    } finally {
      setLoadingEntries(false);
    }
  }, [flash]);

  const loadComments = useCallback(async () => {
    try {
      const payload = await requestJson<{ comments: CommentItem[] }>("/api/admin/comments");
      setComments(payload.comments);
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "讨论读取失败。");
    }
  }, [flash]);

  const loadFeedback = useCallback(async () => {
    try {
      const payload = await requestJson<{ feedback: FeedbackItem[] }>("/api/admin/feedback");
      setFeedback(payload.feedback);
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "留言读取失败。");
    }
  }, [flash]);

  const signIn = useCallback((next: AuthUser | null) => {
    setUser(next);
    if (next?.role !== "admin") return;
    void loadEntries();
    void loadComments();
    void loadFeedback();
  }, [loadEntries, loadComments, loadFeedback]);

  useEffect(() => {
    requestJson<{ user: AuthUser | null }>("/api/auth/me").then((payload) => signIn(payload.user)).catch(() => setUser(null));
  }, [signIn]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const visibleEntries = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return entries.filter((entry) =>
      (typeFilter === "all" || entry.type === typeFilter)
      && (statusFilter === "all" || entry.status === statusFilter)
      && (!keyword || `${entry.title} ${entry.summary} ${entry.tags.join(" ")} ${entry.category}`.toLowerCase().includes(keyword)));
  }, [entries, typeFilter, statusFilter, query]);

  const tutorialCategories = useMemo(() => Array.from(new Set(entries.filter((entry) => entry.type === "tutorial").map((entry) => entry.category))).filter(Boolean), [entries]);
  const pendingComments = comments.filter((item) => item.status === "pending").length;
  const counts = useMemo(() => ({
    published: entries.filter((entry) => entry.status === "published").length,
    draft: entries.filter((entry) => entry.status === "draft").length,
  }), [entries]);

  function confirmDiscard() {
    return !dirty || window.confirm("当前修改还没有保存，确定放弃吗？");
  }

  function openEntry(entry: AdminEntry) {
    if (!confirmDiscard()) return;
    const next = draftFromEntry(entry);
    setDraft(next);
    setSavedSnapshot(JSON.stringify(next));
    setSelectedKey(`${entry.type}:${entry.id}`);
    setIsNew(false);
    setMobileEditing(true);
  }

  function startNew(type: EntryType) {
    if (!confirmDiscard()) return;
    const next = blankDraft(type);
    setDraft(next);
    setSavedSnapshot(JSON.stringify(next));
    setSelectedKey(null);
    setIsNew(true);
    setMobileEditing(true);
  }

  function updateDraft(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  const save = useCallback(async (action: "save" | "publish" | "unpublish") => {
    if (!draft || busy) return;
    if (!draft.title.trim()) {
      flash("error", "请先填写标题。");
      return;
    }
    setBusy(true);
    try {
      const payload = await requestJson<{ entry: AdminEntry; message: string }>("/api/admin/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, isNew, entry: draftPayload(draft) }),
      });
      const next = draftFromEntry(payload.entry);
      setEntries((current) => [payload.entry, ...current.filter((entry) => !(entry.type === payload.entry.type && entry.id === payload.entry.id))]);
      setDraft(next);
      setSavedSnapshot(JSON.stringify(next));
      setSelectedKey(`${payload.entry.type}:${payload.entry.id}`);
      setIsNew(false);
      flash("ok", payload.message);
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "保存失败。");
    } finally {
      setBusy(false);
    }
  }, [draft, busy, isNew, flash]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save("save");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  async function removeEntry() {
    if (!selectedEntry || busy) return;
    if (!window.confirm(`确定永久删除「${selectedEntry.title}」吗？删除后无法恢复，只想暂时不显示可以选择“下线”。`)) return;
    setBusy(true);
    try {
      const payload = await requestJson<{ message: string }>(`/api/admin/entries?type=${selectedEntry.type}&id=${encodeURIComponent(selectedEntry.id)}`, { method: "DELETE" });
      setEntries((current) => current.filter((entry) => entry !== selectedEntry));
      setDraft(null);
      setSavedSnapshot("");
      setSelectedKey(null);
      setMobileEditing(false);
      flash("ok", payload.message);
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "删除失败。");
    } finally {
      setBusy(false);
    }
  }

  function applyTool(tool: (typeof toolbar)[number]) {
    const textarea = contentRef.current;
    if (!textarea || !draft) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const result = tool.apply(value.slice(selectionStart, selectionEnd));
    const before = value.slice(0, selectionStart);
    const prefix = result.block && before && !before.endsWith("\n") ? "\n" : "";
    const nextValue = `${before}${prefix}${result.text}${value.slice(selectionEnd)}`;
    updateDraft({ content: nextValue });
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selectionStart + prefix.length + result.text.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function importFile(file: File) {
    const text = await file.text();
    if (!draft) return;
    if (file.name.endsWith(".json")) {
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        updateDraft({
          title: String(parsed.title ?? draft.title),
          summary: String(parsed.summary ?? draft.summary),
          content: String(parsed.content ?? (Array.isArray(parsed.paragraphs) ? parsed.paragraphs.join("\n\n") : draft.content)),
          tags: Array.isArray(parsed.tags) ? parsed.tags.join("，") : draft.tags,
        });
      } catch {
        flash("error", "JSON 文件格式不正确。");
      }
      return;
    }
    const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
    updateDraft({ content: heading ? text.replace(/^#\s+.+\n?/m, "").trim() : text.trim(), title: draft.title || heading || file.name.replace(/\.[^.]+$/, "") });
    flash("ok", `已导入 ${file.name}`);
  }

  async function moderate(item: CommentItem, status: "published" | "hidden") {
    try {
      await requestJson("/api/admin/comments", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, status }) });
      setComments((current) => current.map((comment) => (comment.id === item.id ? { ...comment, status } : comment)));
      flash("ok", status === "published" ? "已公开到原文。" : "已隐藏。");
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "操作失败。");
    }
  }

  async function reply(item: CommentItem) {
    const message = replyDrafts[item.id]?.trim() ?? "";
    if (message.length < 2) {
      flash("error", "请先写下至少两个字的回复。");
      return;
    }
    try {
      await requestJson("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentType: item.contentType, contentId: item.contentId, contentTitle: item.contentTitle, category: "reply", message, parentId: item.parentId || item.id }),
      });
      setReplyDrafts((current) => ({ ...current, [item.id]: "" }));
      flash("ok", "回复已公开。");
      void loadComments();
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "回复失败。");
    }
  }

  async function logout() {
    if (!confirmDiscard()) return;
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  if (user === undefined) return <div className="cms-loading"><span className="cms-spinner" />正在确认登录状态…</div>;
  if (!user) return <LoginPanel onLogin={signIn} />;
  if (user.role !== "admin") {
    return <div className="cms-gate"><div className="cms-gate-card"><h1>没有后台权限</h1><p>当前账户 {user.email} 不是管理员。请使用 ADMIN_EMAIL 对应的账户登录。</p><button type="button" className="cms-button" onClick={() => void logout()}>换个账户</button></div></div>;
  }

  return (
    <div className="cms-shell">
      <aside className="cms-side">
        <Link className="cms-brand" href="/"><span className="cms-brand-mark">周</span><span>周多福<small>内容后台</small></span></Link>
        <nav className="cms-nav" aria-label="后台导航">
          <button type="button" className={section === "content" ? "is-active" : undefined} onClick={() => setSection("content")}><i>✎</i>内容<b>{entries.length}</b></button>
          <button type="button" className={section === "settings" ? "is-active" : undefined} onClick={() => setSection("settings")}><i>⌂</i>主页设置</button>
          <button type="button" className={section === "comments" ? "is-active" : undefined} onClick={() => setSection("comments")}><i>❝</i>讨论审核{pendingComments > 0 && <b className="is-alert">{pendingComments}</b>}</button>
          <button type="button" className={section === "feedback" ? "is-active" : undefined} onClick={() => setSection("feedback")}><i>✉</i>留言建议<b>{feedback.length}</b></button>
        </nav>
        <div className="cms-side-foot">
          <a href="/" target="_blank" rel="noreferrer">查看网站 ↗</a>
          <span title={user.email}>{user.email}</span>
          <button type="button" onClick={() => void logout()}>退出登录</button>
        </div>
      </aside>

      <main className="cms-main">
        {notice && <div className={`cms-toast is-${notice.tone}`} role="status">{notice.text}</div>}

        {section === "content" && (
          <div className={`cms-content ${mobileEditing ? "is-editing" : ""}`}>
            <section className="cms-list-pane" aria-label="内容列表">
              <header className="cms-pane-head">
                <div><h1>内容</h1><p>{counts.published} 篇已发布 · {counts.draft} 篇草稿</p></div>
                <div className="cms-new">
                  <button type="button" className="cms-button" onClick={() => startNew("tutorial")}>＋ 教程</button>
                  <button type="button" className="cms-button is-ghost" onClick={() => startNew("record")}>＋ 记录</button>
                </div>
              </header>
              <div className="cms-filters">
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、标签、分类" aria-label="搜索内容" />
                <div className="cms-segment" role="group" aria-label="内容类型">
                  {(["all", "tutorial", "record"] as const).map((key) => <button type="button" key={key} aria-pressed={typeFilter === key} onClick={() => setTypeFilter(key)}>{key === "all" ? "全部" : typeLabels[key]}</button>)}
                </div>
                <div className="cms-segment" role="group" aria-label="发布状态">
                  {(["all", "published", "draft"] as const).map((key) => <button type="button" key={key} aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>{key === "all" ? "全部" : key === "published" ? "已发布" : "草稿"}</button>)}
                </div>
              </div>
              <ul className="cms-list">
                {loadingEntries && entries.length === 0 && Array.from({ length: 4 }, (_, index) => <li key={index} className="cms-skeleton" />)}
                {!loadingEntries && visibleEntries.length === 0 && <li className="cms-empty">{entries.length === 0 ? "数据库里还没有内容。请先执行 drizzle/0005_seed_content.sql 导入现有内容，或直接新建。" : "没有符合条件的内容。"}</li>}
                {visibleEntries.map((entry, index) => {
                  const key = `${entry.type}:${entry.id}`;
                  return (
                    <li key={key} style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
                      <button type="button" className={`cms-item ${key === selectedKey ? "is-selected" : ""}`} onClick={() => openEntry(entry)}>
                        <span className="cms-item-meta"><em className={`cms-pill is-${entry.status}`}>{entry.status === "published" ? "已发布" : "草稿"}</em>{typeLabels[entry.type]} · {entry.type === "record" ? recordCategoryLabel(entry.category) : entry.category}</span>
                        <strong>{entry.title}</strong>
                        <span className="cms-item-foot"><time>{entry.date}</time>{entry.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="cms-editor-pane" aria-label="内容编辑">
              {!draft ? (
                <div className="cms-placeholder">
                  <span className="cms-placeholder-art" aria-hidden="true"><i /><i /><i /></span>
                  <h2>选择左侧内容开始编辑</h2>
                  <p>发布后网站立即更新，不需要再推送 GitHub。</p>
                  <div className="cms-new"><button type="button" className="cms-button" onClick={() => startNew("tutorial")}>新建教程</button><button type="button" className="cms-button is-ghost" onClick={() => startNew("record")}>新建随心记录</button></div>
                </div>
              ) : (
                <form className="cms-editor" onSubmit={(event) => { event.preventDefault(); void save("save"); }}>
                  <div className="cms-editor-bar">
                    <button type="button" className="cms-back" onClick={() => { if (confirmDiscard()) { setMobileEditing(false); } }}>← 列表</button>
                    <span className="cms-editor-state">
                      {isNew ? `新${typeLabels[draft.type]}` : selectedEntry?.status === "published" ? "已发布" : "草稿"}
                      {dirty ? <em className="is-dirty">· 有未保存的修改</em> : !isNew && <em>· 已保存</em>}
                    </span>
                    <div className="cms-editor-actions">
                      {!isNew && selectedEntry?.status === "published" && <button type="button" className="cms-button is-quiet" disabled={busy} onClick={() => void save("unpublish")}>下线</button>}
                      {!isNew && <button type="button" className="cms-button is-danger" disabled={busy} onClick={() => void removeEntry()}>删除</button>}
                      <button type="submit" className="cms-button is-ghost" disabled={busy}>保存</button>
                      <button type="button" className="cms-button" disabled={busy} onClick={() => void save("publish")}>{selectedEntry?.status === "published" ? "更新发布" : "发布"}</button>
                    </div>
                  </div>

                  <div className="cms-editor-scroll">
                    <input className="cms-title-input" value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} placeholder="标题" maxLength={120} aria-label="标题" />
                    <textarea className="cms-summary-input" rows={2} value={draft.summary} onChange={(event) => updateDraft({ summary: event.target.value })} placeholder="一句话摘要，会显示在列表和更新日志里" maxLength={300} aria-label="摘要" />

                    <div className="cms-fields">
                      <label><span>内容编号</span><input value={draft.id} onChange={(event) => updateDraft({ id: event.target.value })} placeholder="留空则按标题生成" disabled={!isNew} maxLength={100} /></label>
                      <label><span>日期</span><input type="date" value={draft.date} onChange={(event) => updateDraft({ date: event.target.value })} /></label>
                      {draft.type === "tutorial" ? (
                        <label><span>分类</span><input list="cms-tutorial-categories" value={draft.category} onChange={(event) => updateDraft({ category: event.target.value })} placeholder="例如：信息判断" maxLength={30} /><datalist id="cms-tutorial-categories">{tutorialCategories.map((item) => <option key={item} value={item} />)}</datalist></label>
                      ) : (
                        <label><span>分类</span><select value={draft.category} onChange={(event) => updateDraft({ category: event.target.value })}>{recordCategoryOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
                      )}
                      <label className="is-wide"><span>标签（用逗号分隔）</span><input value={draft.tags} onChange={(event) => updateDraft({ tags: event.target.value })} placeholder="效率，工具" /></label>
                      {draft.type === "record" && <label className="is-wide"><span>一句话结论</span><input value={draft.takeaway} onChange={(event) => updateDraft({ takeaway: event.target.value })} placeholder="留空则使用摘要" maxLength={500} /></label>}
                    </div>

                    <div className="cms-body">
                      <div className="cms-body-bar">
                        <div className="cms-tools" role="toolbar" aria-label="正文格式">
                          {toolbar.map((tool) => <button type="button" key={tool.label} title={tool.title} onClick={() => applyTool(tool)} disabled={editorView === "preview"}>{tool.label}</button>)}
                          <button type="button" title="导入 .md / .txt / .json 文件" onClick={() => fileRef.current?.click()}>导入</button>
                          <input ref={fileRef} type="file" accept=".md,.txt,.json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = ""; }} />
                        </div>
                        <div className="cms-segment is-small" role="group" aria-label="编辑视图">
                          {(["write", "split", "preview"] as const).map((key) => <button type="button" key={key} aria-pressed={editorView === key} onClick={() => setEditorView(key)}>{key === "write" ? "编辑" : key === "split" ? "并排" : "预览"}</button>)}
                        </div>
                      </div>
                      <div className={`cms-body-panes is-${editorView}`}>
                        {editorView !== "preview" && <textarea ref={contentRef} className="cms-content-input" value={draft.content} onChange={(event) => updateDraft({ content: event.target.value })} placeholder={"正文支持：\n## 小标题\n**粗体**\n> 引用\n- 列表\n1. 编号\n[链接](https://…)\n![图片说明](https://…)\n| 表头 | 表头 |\n| --- | --- |"} aria-label="正文" />}
                        {editorView !== "write" && <div className="cms-preview" aria-label="预览"><h2>{draft.title || "未命名"}</h2>{draft.summary && <p className="cms-preview-summary">{draft.summary}</p>}{draft.content ? <TutorialBody content={draft.content} /> : <p className="cms-muted">正文预览会显示在这里。</p>}</div>}
                      </div>
                      <small className="cms-count">{draft.content.length.toLocaleString()} 字 · Ctrl + S 快速保存</small>
                    </div>

                    <div className="cms-sources">
                      <div className="cms-sources-head"><strong>资料来源</strong><button type="button" className="cms-button is-quiet" onClick={() => updateDraft({ sources: [...draft.sources, { label: "", href: "https://" }] })}>＋ 添加来源</button></div>
                      {draft.sources.length === 0 && <p className="cms-muted">还没有来源。教程引用的官方页面、数据可以列在这里。</p>}
                      {draft.sources.map((source, index) => (
                        <div className="cms-source-row" key={index}>
                          <input value={source.label} onChange={(event) => updateDraft({ sources: draft.sources.map((item, itemIndex) => (itemIndex === index ? { ...item, label: event.target.value } : item)) })} placeholder="来源名称" aria-label="来源名称" />
                          <input value={source.href} onChange={(event) => updateDraft({ sources: draft.sources.map((item, itemIndex) => (itemIndex === index ? { ...item, href: event.target.value } : item)) })} placeholder="https://" aria-label="来源链接" />
                          <button type="button" aria-label="移除来源" onClick={() => updateDraft({ sources: draft.sources.filter((_, itemIndex) => itemIndex !== index) })}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}

        {section === "settings" && <SettingsPanel flash={flash} />}

        {section === "comments" && (
          <section className="cms-feed">
            <header className="cms-pane-head">
              <div><h1>讨论审核</h1><p>读者留言审核后才会公开；站主回复直接公开。</p></div>
              <button type="button" className="cms-button is-ghost" onClick={() => void loadComments()}>刷新</button>
            </header>
            <div className="cms-segment" role="group" aria-label="审核状态">
              {(["pending", "published", "hidden", "all"] as const).map((key) => <button type="button" key={key} aria-pressed={commentFilter === key} onClick={() => setCommentFilter(key)}>{key === "all" ? "全部" : commentStatusLabels[key]}{key === "pending" && pendingComments > 0 ? ` ${pendingComments}` : ""}</button>)}
            </div>
            <div className="cms-cards">
              {comments.filter((item) => commentFilter === "all" || item.status === commentFilter).map((item, index) => (
                <article className="cms-card" key={item.id} style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
                  <div className="cms-card-head"><em className={`cms-pill is-${item.status}`}>{commentStatusLabels[item.status] ?? item.status}</em><strong>{item.contentTitle}</strong><time>{item.createdAt}</time></div>
                  {item.anchorText && <blockquote>{item.anchorText}</blockquote>}
                  <p>{item.message}</p>
                  <small>{item.authorName}{item.parentId ? " · 回复" : ""}</small>
                  <div className="cms-card-actions">
                    {item.status !== "published" && <button type="button" className="cms-button" onClick={() => void moderate(item, "published")}>公开</button>}
                    {item.status !== "hidden" && <button type="button" className="cms-button is-quiet" onClick={() => void moderate(item, "hidden")}>隐藏</button>}
                  </div>
                  {item.status === "published" && !item.parentId && (
                    <div className="cms-reply">
                      <textarea rows={2} value={replyDrafts[item.id] ?? ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="写下回复，提交后直接公开到原文" />
                      <button type="button" className="cms-button is-ghost" onClick={() => void reply(item)}>回复</button>
                    </div>
                  )}
                </article>
              ))}
              {comments.filter((item) => commentFilter === "all" || item.status === commentFilter).length === 0 && <p className="cms-empty">这里暂时没有讨论。</p>}
            </div>
          </section>
        )}

        {section === "feedback" && (
          <section className="cms-feed">
            <header className="cms-pane-head">
              <div><h1>留言建议</h1><p>读者通过网站“留言与建议”提交的内容，只有你能看到。</p></div>
              <button type="button" className="cms-button is-ghost" onClick={() => void loadFeedback()}>刷新</button>
            </header>
            <div className="cms-cards">
              {feedback.map((item, index) => (
                <article className="cms-card" key={item.id} style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
                  <div className="cms-card-head"><em className="cms-pill">{feedbackTypeLabels[item.type] ?? item.type}</em><strong>{item.page}</strong><time>{item.createdAt}</time></div>
                  <p>{item.message}</p>
                  <small>{[item.contact, item.userEmail].filter(Boolean).join(" · ") || "未留联系方式"}</small>
                </article>
              ))}
              {feedback.length === 0 && <p className="cms-empty">目前还没有留言。</p>}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function LoginPanel({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const payload = await requestJson<{ user: AuthUser }>("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      onLogin(payload.user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败。");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="cms-gate">
      <form className="cms-gate-card" onSubmit={submit}>
        <span className="cms-brand-mark is-large">周</span>
        <h1>内容后台</h1>
        <p>使用管理员账户登录，在线编辑和发布教程、随心记录。</p>
        <label><span>邮箱</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label><span>密码</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <p className="cms-error" role="alert">{error}</p>}
        <button type="submit" className="cms-button is-block" disabled={sending}>{sending ? "正在登录…" : "登录"}</button>
        <Link href="/">← 返回网站</Link>
      </form>
    </div>
  );
}
