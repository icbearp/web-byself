"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { journeyStatuses, type ContactItem, type HomeSettings, type JourneyItem, type SettingsKey, type SiteSettings } from "../site-settings";

type Tab = SettingsKey;
type Flash = (tone: "ok" | "error", text: string) => void;

const tabLabels: Record<Tab, string> = { home: "主页信息", contacts: "联系方式", journey: "成长之路" };

const splitList = (value: string) => value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

/** 浏览器端压缩图片：长边不超过 1000px，转 WebP，尽量压到 600KB 以内再上传。 */
async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  let quality = 0.88;
  let dataUrl = canvas.toDataURL("image/webp", quality);
  if (!dataUrl.startsWith("data:image/webp")) dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length * 0.75 > 600 * 1024 && quality > 0.4) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL(dataUrl.startsWith("data:image/webp") ? "image/webp" : "image/jpeg", quality);
  }
  return dataUrl;
}

function ImageField({ value, onChange, flash, label }: { value: string | null; onChange: (url: string | null) => void; flash: Flash; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      flash("error", "请选择图片文件。");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      const response = await fetch("/api/admin/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dataUrl }) });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "上传失败。");
      onChange(payload.url);
      flash("ok", "图片已上传，记得保存。");
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="set-image">
      <span className="set-label">{label}</span>
      <div className="set-image-row">
        <div className="set-image-preview">{value ? <img src={value} alt="" /> : <span>未上传</span>}</div>
        <div className="set-image-actions">
          <button type="button" className="cms-button is-ghost" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? "上传中…" : value ? "更换图片" : "上传图片"}</button>
          {value && <button type="button" className="cms-button is-quiet" onClick={() => onChange(null)}>移除</button>}
          <small>支持 JPG / PNG / WebP，会自动压缩。</small>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} />
    </div>
  );
}

function moveItem<T>(items: T[], index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function RowTools({ index, total, onMove, onRemove }: { index: number; total: number; onMove: (delta: number) => void; onRemove: () => void }) {
  return (
    <div className="set-row-tools">
      <button type="button" aria-label="上移" disabled={index === 0} onClick={() => onMove(-1)}>↑</button>
      <button type="button" aria-label="下移" disabled={index === total - 1} onClick={() => onMove(1)}>↓</button>
      <button type="button" aria-label="删除" className="is-danger" onClick={onRemove}>×</button>
    </div>
  );
}

export function SettingsPanel({ flash }: { flash: Flash }) {
  const [tab, setTab] = useState<Tab>("home");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [focusText, setFocusText] = useState("");
  const [stickerText, setStickerText] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const payload = (await response.json()) as { settings?: SiteSettings; error?: string };
      if (!response.ok || !payload.settings) throw new Error(payload.error || "设置读取失败。");
      setSettings(payload.settings);
      setSaved(JSON.stringify(payload.settings));
      setFocusText(payload.settings.home.focusWords.join("，"));
      setStickerText(payload.settings.home.stickers.join("，"));
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "设置读取失败。");
    }
  }, [flash]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (!settings) return <div className="cms-feed"><p className="cms-empty">正在读取主页设置…</p></div>;

  const savedSettings = JSON.parse(saved) as SiteSettings;
  const dirty = (key: Tab) => JSON.stringify(settings[key]) !== JSON.stringify(savedSettings[key]);

  const setHome = (patch: Partial<HomeSettings>) => setSettings({ ...settings, home: { ...settings.home, ...patch } });
  const setContacts = (contacts: ContactItem[]) => setSettings({ ...settings, contacts });
  const setJourney = (journey: JourneyItem[]) => setSettings({ ...settings, journey });
  const updateContact = (index: number, patch: Partial<ContactItem>) => setContacts(settings.contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  const updateStep = (index: number, patch: Partial<JourneyItem>) => setJourney(settings.journey.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));

  async function save(key: Tab) {
    if (!settings) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, value: settings[key] }) });
      const payload = (await response.json()) as { value?: unknown; message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "保存失败。");
      const next = { ...settings, [key]: payload.value } as SiteSettings;
      const nextSaved = { ...(JSON.parse(saved) as SiteSettings), [key]: payload.value };
      setSettings(next);
      setSaved(JSON.stringify(nextSaved));
      if (key === "home") {
        setFocusText(next.home.focusWords.join("，"));
        setStickerText(next.home.stickers.join("，"));
      }
      flash("ok", payload.message || "已保存。");
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "保存失败。");
    } finally {
      setBusy(false);
    }
  }

  const heroCount = settings.contacts.filter((item) => item.hero).length;

  return (
    <section className="cms-feed set-panel">
      <header className="cms-pane-head">
        <div><h1>主页设置</h1><p>修改首页的个人信息、联系方式和成长之路，保存后首页立即生效。</p></div>
        <a className="cms-button is-ghost" href="/" target="_blank" rel="noreferrer">在首页查看 ↗</a>
      </header>
      <div className="cms-segment" role="tablist" aria-label="设置分组">
        {(Object.keys(tabLabels) as Tab[]).map((key) => <button type="button" role="tab" key={key} aria-selected={tab === key} onClick={() => setTab(key)}>{tabLabels[key]}{dirty(key) ? " ·" : ""}</button>)}
      </div>

      {tab === "home" && (
        <div className="set-card">
          <div className="cms-fields">
            <label><span>首屏称号</span><input value={settings.home.badge} maxLength={40} onChange={(event) => setHome({ badge: event.target.value })} placeholder="例如：2026 届毕业生 · 熊奇主理人" /></label>
            <label><span>名字</span><input value={settings.home.name} maxLength={12} onChange={(event) => setHome({ name: event.target.value })} /></label>
            <label className="is-wide"><span>专注方向（逗号分隔，最多 6 个，会轮流高亮）</span><input value={focusText} onChange={(event) => { setFocusText(event.target.value); setHome({ focusWords: splitList(event.target.value).slice(0, 6) }); }} /></label>
            <label className="is-wide"><span>一句话签名（手写体显示，可留空）</span><input value={settings.home.motto} maxLength={80} onChange={(event) => setHome({ motto: event.target.value })} /></label>
            <label className="is-wide"><span>首屏四角标签（逗号分隔，最多 4 个，手机上不显示）</span><input value={stickerText} onChange={(event) => { setStickerText(event.target.value); setHome({ stickers: splitList(event.target.value).slice(0, 4) }); }} /></label>
          </div>
          <ImageField label="头像照片（显示在首屏名字上方，可不传）" value={settings.home.avatar} onChange={(avatar) => setHome({ avatar })} flash={flash} />
          <div className="set-save"><button type="button" className="cms-button" disabled={busy || !dirty("home")} onClick={() => void save("home")}>{dirty("home") ? "保存主页信息" : "已保存"}</button></div>
        </div>
      )}

      {tab === "contacts" && (
        <div className="set-list">
          <p className="cms-muted">这里的联系方式显示在首页底部“联系”区；勾选“首屏卡片”的前 2 个也会显示在首屏。可以只放二维码图片（例如微信）。链接留空时，会自动识别邮箱、电话和网址。</p>
          {settings.contacts.map((item, index) => (
            <div className="set-card" key={item.id}>
              <div className="set-card-head"><strong>{item.label || "未命名联系方式"}</strong><RowTools index={index} total={settings.contacts.length} onMove={(delta) => setContacts(moveItem(settings.contacts, index, delta))} onRemove={() => { if (window.confirm(`删除「${item.label || "这条联系方式"}」？`)) setContacts(settings.contacts.filter((_, itemIndex) => itemIndex !== index)); }} /></div>
              <div className="cms-fields">
                <label><span>名称</span><input value={item.label} maxLength={20} onChange={(event) => updateContact(index, { label: event.target.value })} placeholder="例如：微信、小红书" /></label>
                <label><span>显示内容</span><input value={item.value} maxLength={200} onChange={(event) => updateContact(index, { value: event.target.value })} placeholder="账号、邮箱或电话" /></label>
                <label className="is-wide"><span>点击后打开的链接（可留空）</span><input value={item.href} maxLength={500} onChange={(event) => updateContact(index, { href: event.target.value })} placeholder="https://… / mailto:… / tel:…" /></label>
                <label className="set-check"><input type="checkbox" checked={item.hero} disabled={!item.hero && heroCount >= 2} onChange={(event) => updateContact(index, { hero: event.target.checked })} /><span>显示在首屏卡片（最多 2 个）</span></label>
              </div>
              <ImageField label="图片（二维码或名片，可不传）" value={item.image} onChange={(image) => updateContact(index, { image })} flash={flash} />
            </div>
          ))}
          <div className="set-save">
            <button type="button" className="cms-button is-ghost" onClick={() => setContacts([...settings.contacts, { id: newId("contact"), label: "", value: "", href: "", image: null, hero: false }])}>＋ 添加联系方式</button>
            <button type="button" className="cms-button" disabled={busy || !dirty("contacts")} onClick={() => void save("contacts")}>{dirty("contacts") ? "保存联系方式" : "已保存"}</button>
          </div>
        </div>
      )}

      {tab === "journey" && (
        <div className="set-list">
          <p className="cms-muted">按从早到晚排列，首页时间线会按这里的顺序显示。状态为“进行中”的节点会显示跳动的绿点。</p>
          {settings.journey.map((item, index) => (
            <div className="set-card" key={item.id}>
              <div className="set-card-head"><strong><span className="set-index">{String(index + 1).padStart(2, "0")}</span>{item.title || "未命名经历"}</strong><RowTools index={index} total={settings.journey.length} onMove={(delta) => setJourney(moveItem(settings.journey, index, delta))} onRemove={() => { if (window.confirm(`删除「${item.title || "这条经历"}」？`)) setJourney(settings.journey.filter((_, itemIndex) => itemIndex !== index)); }} /></div>
              <div className="cms-fields">
                <label><span>时间</span><input value={item.date} maxLength={24} onChange={(event) => updateStep(index, { date: event.target.value })} placeholder="例如：2026.10、现在进行时" /></label>
                <label><span>状态</span><select value={item.status} onChange={(event) => updateStep(index, { status: event.target.value as JourneyItem["status"] })}>{journeyStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                <label className="is-wide"><span>标题</span><input value={item.title} maxLength={40} onChange={(event) => updateStep(index, { title: event.target.value })} /></label>
                <label className="is-wide"><span>描述</span><textarea rows={3} value={item.copy} maxLength={400} onChange={(event) => updateStep(index, { copy: event.target.value })} /></label>
                <label className="is-wide"><span>标签（逗号分隔，最多 8 个）</span><input defaultValue={item.tags.join("，")} onChange={(event) => updateStep(index, { tags: splitList(event.target.value).slice(0, 8) })} /></label>
              </div>
            </div>
          ))}
          <div className="set-save">
            <button type="button" className="cms-button is-ghost" onClick={() => setJourney([...settings.journey, { id: newId("step"), date: "", title: "", copy: "", tags: [], status: "进行中" }])}>＋ 添加一段经历</button>
            <button type="button" className="cms-button" disabled={busy || !dirty("journey")} onClick={() => void save("journey")}>{dirty("journey") ? "保存成长之路" : "已保存"}</button>
          </div>
        </div>
      )}
    </section>
  );
}
