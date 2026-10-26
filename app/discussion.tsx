"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

export type AuthUser = { id: string; email: string; role: string };

export type ContentComment = {
  id: string;
  contentType: "tutorial" | "record" | "article";
  contentId: string;
  contentTitle: string;
  category: string;
  message: string;
  authorName: string;
  anchorText: string;
  anchorBlock: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
};


export const commentCategoryLabels: Record<string, string> = {
  question: "提问",
  correction: "纠错",
  addition: "补充",
  experience: "经验",
  suggestion: "建议",
  reply: "回复",
};

export function ContentDiscussion({
  contentType,
  contentId,
  contentTitle,
  authUser,
  children,
}: {
  contentType: ContentComment["contentType"];
  contentId: string;
  contentTitle: string;
  authUser: AuthUser | null;
  children: ReactNode;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState("question");
  const [message, setMessage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [anchorText, setAnchorText] = useState("");
  const [anchorBlock, setAnchorBlock] = useState("");
  const [replyTo, setReplyTo] = useState<ContentComment | null>(null);
  const [website, setWebsite] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [submitText, setSubmitText] = useState("");
  const [selectionPoint, setSelectionPoint] = useState<{ left: number; top: number } | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/comments?contentType=${encodeURIComponent(contentType)}&contentId=${encodeURIComponent(contentId)}`);
      const payload = (await response.json()) as { comments?: ContentComment[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "讨论暂时无法读取。");
      setComments(payload.comments ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "讨论暂时无法读取。");
    } finally {
      setLoading(false);
    }
  }, [contentType, contentId]);

  useEffect(() => {
    const initialRequest = window.setTimeout(() => void loadComments(), 0);
    const reload = () => void loadComments();
    window.addEventListener("content-comment-updated", reload);
    return () => {
      window.clearTimeout(initialRequest);
      window.removeEventListener("content-comment-updated", reload);
    };
  }, [loadComments]);

  useEffect(() => {
    const clearSelectionAction = () => setSelectionPoint(null);
    window.addEventListener("scroll", clearSelectionAction, true);
    return () => window.removeEventListener("scroll", clearSelectionAction, true);
  }, []);

  function captureSelection() {
    window.setTimeout(() => {
      const selection = window.getSelection();
      const surface = surfaceRef.current;
      if (!selection || selection.isCollapsed || !surface || selection.rangeCount === 0) {
        setSelectionPoint(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer as Element
        : range.commonAncestorContainer.parentElement;
      if (!node || !surface.contains(node)) {
        setSelectionPoint(null);
        return;
      }
      const quote = selection.toString().trim().replace(/\s+/g, " ").slice(0, 360);
      if (quote.length < 2) {
        setSelectionPoint(null);
        return;
      }
      const block = node.closest("[data-comment-block]") as HTMLElement | null;
      const rect = range.getBoundingClientRect();
      setAnchorText(quote);
      setAnchorBlock(block?.dataset.commentBlock ?? "selected-text");
      setSelectionPoint({
        left: Math.min(window.innerWidth - 132, Math.max(12, rect.left + rect.width / 2 - 58)),
        top: Math.max(12, rect.top - 48),
      });
    }, 0);
  }

  function startAnnotation() {
    setSelectionPoint(null);
    setReplyTo(null);
    window.getSelection()?.removeAllRanges();
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  }

  function startReply(comment: ContentComment) {
    setReplyTo(comment);
    setAnchorText("");
    setAnchorBlock("");
    setCategory("reply");
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("sending");
    setSubmitText("");
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentType, contentId, contentTitle, category, message, authorName, anchorText, anchorBlock, parentId: replyTo?.id, website }),
      });
      const payload = (await response.json()) as { error?: string; reviewRequired?: boolean };
      if (!response.ok) throw new Error(payload.error || "留言没有提交成功。");
      setMessage("");
      setAnchorText("");
      setAnchorBlock("");
      setReplyTo(null);
      setCategory("question");
      setSubmitState("success");
      setSubmitText(payload.reviewRequired ? "已提交。审核公开后，会出现在这篇内容的讨论中。" : "回复已公开。感谢你让这篇内容更完整。 ");
      if (!payload.reviewRequired) await loadComments();
      window.dispatchEvent(new CustomEvent("content-comment-updated"));
    } catch (error) {
      setSubmitState("error");
      setSubmitText(error instanceof Error ? error.message : "留言没有提交成功。");
    }
  }

  const rootComments = comments.filter((comment) => !comment.parentId);
  const repliesFor = (id: string) => comments.filter((comment) => comment.parentId === id);

  return <>
    <div className="commentable-surface" ref={surfaceRef} onPointerUp={captureSelection}>{children}</div>
    {selectionPoint && <button className="selection-comment-button" type="button" style={{ left: selectionPoint.left, top: selectionPoint.top }} onClick={startAnnotation}>＋ 批注这段</button>}
    <section className="content-discussion" aria-label={`${contentTitle}的讨论与批注`}>
      <div className="discussion-heading">
        <div><span>Discussion</span><h3>讨论与批注</h3><p>选中正文即可引用提问，也可以直接留下补充、纠错或经验。</p></div>
        <strong>{comments.length}<small> 条公开互动</small></strong>
      </div>

      {comments.length > 0 && <div className="comment-rail" aria-label="横向浏览最新互动">
        {comments.slice().reverse().map((comment) => <button type="button" key={`rail-${comment.id}`} onClick={() => document.getElementById(`comment-${comment.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
          <span>{commentCategoryLabels[comment.category] ?? "互动"} · {comment.authorName}</span>
          <strong>{comment.anchorText ? `“${comment.anchorText}”` : comment.message}</strong>
        </button>)}
      </div>}

      <div className="discussion-body">
        <div className="comment-thread-list">
          {loading && <p className="discussion-empty">正在读取讨论…</p>}
          {!loading && loadError && <p className="discussion-empty error">{loadError}</p>}
          {!loading && !loadError && rootComments.length === 0 && <p className="discussion-empty">暂时还没有公开讨论。你可以成为第一个留下具体问题的人。</p>}
          {rootComments.map((comment) => <article className="comment-thread" id={`comment-${comment.id}`} key={comment.id}>
            <div className="comment-meta"><span>{commentCategoryLabels[comment.category] ?? "互动"}</span><strong>{comment.authorName}</strong><time>{comment.createdAt.replace("T", " ").slice(0, 16)}</time></div>
            {comment.anchorText && <blockquote><small>引用自本文</small>“{comment.anchorText}”</blockquote>}
            <p>{comment.message}</p>
            <button className="comment-reply-button" type="button" onClick={() => startReply(comment)}>回复这条</button>
            {repliesFor(comment.id).map((reply) => <div className="comment-reply" id={`comment-${reply.id}`} key={reply.id}>
              <div className="comment-meta"><span>回复</span><strong>{reply.authorName}</strong><time>{reply.createdAt.replace("T", " ").slice(0, 16)}</time></div>
              <p>{reply.message}</p>
            </div>)}
          </article>)}
        </div>

        <form className="comment-form" ref={formRef} onSubmit={submitComment}>
          <div className="comment-form-head"><span>{replyTo ? `回复 ${replyTo.authorName}` : anchorText ? "正在引用正文" : "留下问题或补充"}</span>{(replyTo || anchorText) && <button type="button" onClick={() => { setReplyTo(null); setAnchorText(""); setAnchorBlock(""); setCategory("question"); }}>取消引用</button>}</div>
          {replyTo && <blockquote>“{replyTo.message.slice(0, 120)}”</blockquote>}
          {!replyTo && anchorText && <blockquote>“{anchorText}”</blockquote>}
          <div className="comment-form-grid">
            <label><span>互动类型</span><select value={category} onChange={(event) => setCategory(event.target.value)} disabled={Boolean(replyTo)}><option value="question">提问</option><option value="correction">纠错</option><option value="addition">补充</option><option value="experience">经验</option><option value="suggestion">建议</option>{replyTo && <option value="reply">回复</option>}</select></label>
            {authUser?.role !== "admin" && <label><span>显示昵称（选填）</span><input maxLength={40} value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder={authUser ? "默认显示为注册读者" : "默认显示为匿名读者"} /></label>}
          </div>
          <label><span>内容</span><textarea required minLength={2} maxLength={2000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="写下具体问题、补充依据，或说明你在哪一步遇到了困难。" /></label>
          <label className="feedback-honeypot" aria-hidden="true">网站<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
          <div className="comment-form-actions"><small>{authUser?.role === "admin" ? "站主回复会直接公开。" : "提交后先由站主审核，避免广告与无关内容。"}</small><button type="submit" disabled={submitState === "sending"}>{submitState === "sending" ? "正在提交…" : replyTo ? "提交回复" : anchorText ? "提交批注" : "提交留言"}</button></div>
          {submitText && <p className={`comment-submit-status ${submitState}`}>{submitText}</p>}
        </form>
      </div>
    </section>
  </>;
}
