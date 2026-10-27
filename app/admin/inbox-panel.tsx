"use client";

import { useMemo, useState } from "react";

export type FeedbackItem = {
  id: number;
  type: string;
  message: string;
  contact: string;
  page: string;
  status: string;
  note: string;
  createdAt: string;
  updatedAt?: string | null;
  userEmail?: string | null;
};

type Flash = (tone: "ok" | "error", text: string) => void;

export const feedbackStatusLabels: Record<string, string> = { new: "新留言", following: "跟进中", done: "已完成", invalid: "无效" };
const typeLabels: Record<string, string> = { cooperation: "商务合作", suggestion: "内容建议", question: "提问", experience: "使用体验" };
const statusOrder: Record<string, number> = { new: 0, following: 1, done: 2, invalid: 3 };
const pageLabels: Record<string, string> = { home: "首页", tutorials: "教程", records: "记录" };

function contactLink(contact: string) {
  if (/^\S+@\S+\.\S+$/.test(contact)) return `mailto:${contact}`;
  if (/^\+?[\d\s-]{6,20}$/.test(contact)) return `tel:${contact.replace(/[\s-]/g, "")}`;
  return "";
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "操作失败，请稍后再试。");
  return payload;
}

/** 留言工单：按状态和类型筛选；未处理的商务合作排在最前面。 */
export function InboxPanel({ items, setItems, reload, flash }: { items: FeedbackItem[]; setItems: (updater: (items: FeedbackItem[]) => FeedbackItem[]) => void; reload: () => void; flash: Flash }) {
  const [statusFilter, setStatusFilter] = useState<"open" | "all" | keyof typeof feedbackStatusLabels>("open");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [notes, setNotes] = useState<Record<number, string>>({});

  const counts = useMemo(() => {
    const result: Record<string, number> = { open: 0, all: items.length };
    for (const item of items) {
      result[item.status] = (result[item.status] ?? 0) + 1;
      if (item.status === "new" || item.status === "following") result.open += 1;
    }
    return result;
  }, [items]);

  const visible = useMemo(() => items
    .filter((item) => statusFilter === "all" || (statusFilter === "open" ? item.status === "new" || item.status === "following" : item.status === statusFilter))
    .filter((item) => typeFilter === "all" || item.type === typeFilter)
    .sort((first, second) => (statusOrder[first.status] ?? 9) - (statusOrder[second.status] ?? 9)
      || Number(second.type === "cooperation") - Number(first.type === "cooperation")
      || second.createdAt.localeCompare(first.createdAt)), [items, statusFilter, typeFilter]);

  async function update(item: FeedbackItem, patch: { status?: string; note?: string }) {
    try {
      const payload = await requestJson<{ item: Pick<FeedbackItem, "id" | "status" | "note" | "updatedAt"> }>("/api/admin/feedback", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, ...patch }) });
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, ...payload.item } : entry)));
      if (patch.note !== undefined) setNotes((current) => { const next = { ...current }; delete next[item.id]; return next; });
      flash("ok", patch.status ? `已标记为「${feedbackStatusLabels[patch.status]}」。` : "备注已保存。");
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "操作失败。");
    }
  }

  async function remove(item: FeedbackItem) {
    if (!window.confirm("确定永久删除这条留言吗？删除后无法恢复，只是处理完可以标记为“已完成”。")) return;
    try {
      await requestJson(`/api/admin/feedback?id=${item.id}`, { method: "DELETE" });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      flash("ok", "已删除。");
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "删除失败。");
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash("ok", "已复制联系方式。");
    } catch {
      flash("error", "复制失败，请手动选择。");
    }
  }

  return (
    <section className="cms-feed">
      <header className="cms-pane-head">
        <div><h1>留言建议</h1><p>读者通过网站提交的留言和合作咨询，只有你能看到。处理时标记状态，写下跟进备注。</p></div>
        <button type="button" className="cms-button is-ghost" onClick={reload}>刷新</button>
      </header>
      <div className="inbox-filters">
        <div className="cms-segment" role="group" aria-label="处理状态">
          {(["open", "new", "following", "done", "invalid", "all"] as const).map((key) => (
            <button type="button" key={key} aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>
              {key === "open" ? "待处理" : key === "all" ? "全部" : feedbackStatusLabels[key]}<span className="inbox-count">{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="cms-segment" role="group" aria-label="留言类型">
          {["all", "cooperation", "suggestion", "question", "experience"].map((key) => <button type="button" key={key} aria-pressed={typeFilter === key} onClick={() => setTypeFilter(key)}>{key === "all" ? "全部类型" : typeLabels[key]}</button>)}
        </div>
      </div>
      <div className="inbox-list">
        {visible.map((item, index) => {
          const link = contactLink(item.contact);
          const note = notes[item.id] ?? item.note;
          return (
            <article className={`inbox-item status-${item.status} ${item.type === "cooperation" ? "is-cooperation" : ""}`} key={item.id} style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
              <div className="inbox-head">
                <em className={`cms-pill ${item.type === "cooperation" ? "is-coop" : ""}`}>{typeLabels[item.type] ?? item.type}</em>
                <span className={`inbox-status is-${item.status}`}>{feedbackStatusLabels[item.status] ?? item.status}</span>
                <small>{pageLabels[item.page] ?? item.page} · {item.createdAt.replace("T", " ").slice(0, 16)}</small>
              </div>
              <p className="inbox-message">{item.message}</p>
              <div className="inbox-contact">
                <span>联系方式</span>
                {item.contact ? <>{link ? <a href={link}>{item.contact}</a> : <strong>{item.contact}</strong>}<button type="button" onClick={() => void copy(item.contact)}>复制</button></> : <em>未填写</em>}
                {item.userEmail && <small>注册用户：{item.userEmail}</small>}
              </div>
              <div className="inbox-actions">
                <label><span>处理状态</span><select value={item.status} onChange={(event) => void update(item, { status: event.target.value })}>{Object.entries(feedbackStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
                <label className="inbox-note"><span>跟进备注（只有你能看到）</span><textarea rows={2} value={note} maxLength={2000} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="例如：已加微信，周五前发方案" /></label>
                <div className="inbox-buttons">
                  <button type="button" className="cms-button is-ghost" disabled={note === item.note} onClick={() => void update(item, { note })}>保存备注</button>
                  <button type="button" className="cms-button is-danger" onClick={() => void remove(item)}>删除</button>
                </div>
              </div>
            </article>
          );
        })}
        {visible.length === 0 && <p className="cms-empty">{items.length === 0 ? "目前还没有留言。" : "这个筛选下没有留言。"}</p>}
      </div>
    </section>
  );
}
