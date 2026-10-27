"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Flash = (tone: "ok" | "error", text: string) => void;
type UserRow = { id: string; email: string; role: string; disabled: number; createdAt: string; comments: number; feedback: number; sessions: number };

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "操作失败，请稍后再试。");
  return payload;
}

/** 修改密码、退出其他设备：网站和后台共用同一组接口。 */
function AccountCard({ email, flash }: { email: string; flash: Flash }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (next !== confirm) {
      flash("error", "两次输入的新密码不一致。");
      return;
    }
    setBusy(true);
    try {
      const payload = await requestJson<{ message: string }>("/api/auth/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ current, next }) });
      setCurrent("");
      setNext("");
      setConfirm("");
      flash("ok", payload.message);
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "修改失败。");
    } finally {
      setBusy(false);
    }
  }

  async function logoutOthers() {
    try {
      const payload = await requestJson<{ message: string }>("/api/auth/logout-all", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ keepCurrent: true }) });
      flash("ok", payload.message);
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "操作失败。");
    }
  }

  return (
    <div className="set-card user-account">
      <div className="set-card-head"><strong>我的账户</strong><span className="cms-muted">{email}</span></div>
      <form className="cms-fields" onSubmit={changePassword}>
        <label><span>当前密码</span><input type="password" autoComplete="current-password" required value={current} onChange={(event) => setCurrent(event.target.value)} /></label>
        <label><span>新密码（至少 8 位）</span><input type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(event) => setNext(event.target.value)} /></label>
        <label><span>再输入一次新密码</span><input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
        <div className="user-account-actions is-wide">
          <button type="submit" className="cms-button" disabled={busy}>{busy ? "正在修改…" : "修改密码"}</button>
          <button type="button" className="cms-button is-ghost" onClick={() => void logoutOthers()}>退出其他所有设备</button>
          <small>修改密码后，除了当前这台设备，其他地方的登录会全部失效。</small>
        </div>
      </form>
    </div>
  );
}

export function UsersPanel({ me, flash }: { me: { id: string; email: string }; flash: Flash }) {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const payload = await requestJson<{ users: UserRow[] }>("/api/admin/users");
      setRows(payload.users);
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "用户读取失败。");
      setRows([]);
    }
  }, [flash]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function act(row: UserRow, action: "disable" | "enable" | "logout") {
    const prompts = { disable: `停用 ${row.email}？对方会立即在所有设备下线，且无法再登录。`, enable: "", logout: `让 ${row.email} 在所有设备下线？` };
    if (prompts[action] && !window.confirm(prompts[action])) return;
    try {
      const payload = await requestJson<{ message: string }>("/api/admin/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: row.id, action }) });
      flash("ok", payload.message);
      void load();
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "操作失败。");
    }
  }

  async function remove(row: UserRow) {
    if (!window.confirm(`永久删除 ${row.email}？账户和登录会话会被删除，对方的留言与讨论保留但不再关联这个账户。此操作无法撤销。`)) return;
    try {
      const payload = await requestJson<{ message: string }>(`/api/admin/users?id=${encodeURIComponent(row.id)}`, { method: "DELETE" });
      flash("ok", payload.message);
      setRows((current) => (current ?? []).filter((item) => item.id !== row.id));
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "删除失败。");
    }
  }

  const keyword = query.trim().toLowerCase();
  const visible = (rows ?? []).filter((row) => !keyword || row.email.toLowerCase().includes(keyword));

  return (
    <section className="cms-feed set-panel">
      <header className="cms-pane-head">
        <div><h1>用户与账户</h1><p>管理自己的密码和登录设备，查看、停用或删除注册用户。</p></div>
        <button type="button" className="cms-button is-ghost" onClick={() => void load()}>刷新</button>
      </header>
      <div className="set-list">
        <AccountCard email={me.email} flash={flash} />
        <div className="set-card">
          <div className="set-card-head"><strong>注册用户{rows ? ` · ${rows.length}` : ""}</strong><input className="user-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索邮箱" aria-label="搜索用户" /></div>
          {rows === null && <p className="cms-empty">正在读取…</p>}
          {rows && visible.length === 0 && <p className="cms-empty">{rows.length === 0 ? "还没有注册用户。" : "没有匹配的用户。"}</p>}
          <div className="user-list">
            {visible.map((row) => {
              const self = row.id === me.id;
              return (
                <div className={`user-row ${row.disabled ? "is-disabled" : ""}`} key={row.id}>
                  <div className="user-main">
                    <strong>{row.email}</strong>
                    <span className="user-badges">
                      {row.role === "admin" && <em className="cms-pill">管理员</em>}
                      {self && <em className="cms-pill is-published">你自己</em>}
                      {row.disabled ? <em className="cms-pill is-hidden">已停用</em> : null}
                    </span>
                    <small>注册于 {row.createdAt.slice(0, 10)} · 讨论 {row.comments} · 留言 {row.feedback} · 在线设备 {row.sessions}</small>
                  </div>
                  {!self && (
                    <div className="user-actions">
                      <button type="button" className="cms-button is-quiet" disabled={!row.sessions} onClick={() => void act(row, "logout")}>强制下线</button>
                      {row.role !== "admin" && (row.disabled
                        ? <button type="button" className="cms-button is-ghost" onClick={() => void act(row, "enable")}>恢复</button>
                        : <button type="button" className="cms-button is-ghost" onClick={() => void act(row, "disable")}>停用</button>)}
                      {row.role !== "admin" && <button type="button" className="cms-button is-danger" onClick={() => void remove(row)}>删除</button>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
