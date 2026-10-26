"use client";

import { useCallback, useEffect, useRef } from "react";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => { finished: Promise<void>; ready: Promise<void>; updateCallbackDone: Promise<void> };
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 切换工作区时用浏览器的 View Transitions 做页面过渡：等新路由真正渲染后再结束过渡。
 * 不支持的浏览器或开启“减少动态效果”时直接跳转。
 */
export function useWorkspaceTransition(pathname: string | null, push: (path: string) => void) {
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    const resolve = pending.current;
    if (!resolve) return;
    pending.current = null;
    resolve();
  }, [pathname]);

  return useCallback((path: string) => {
    const doc = document as ViewTransitionDocument;
    if (!doc.startViewTransition || prefersReducedMotion() || document.hidden) {
      push(path);
      return new Promise<void>((resolve) => setTimeout(resolve, 60));
    }
    const transition = doc.startViewTransition(() => new Promise<void>((resolve) => {
      pending.current = resolve;
      push(path);
      // 网络慢时不让画面一直冻结：最多等 700ms，之后新内容到达会直接替换。
      setTimeout(() => {
        if (pending.current === resolve) {
          pending.current = null;
          resolve();
        }
      }, 700);
    }));
    // 过渡被浏览器中止（超时、连续点击）时这些 Promise 会 reject，只影响动画，不影响跳转。
    transition.ready.catch(() => undefined);
    transition.finished.catch(() => undefined);
    return transition.updateCallbackDone.catch(() => undefined);
  }, [push]);
}

const REVEAL_SELECTOR = [
  "main > .section",
  "main > section.intro-band",
  "main > section.contact-section",
  ".profile-section",
  ".career-path",
  ".ownership-section",
  ".upfront-section",
  ".library-panel",
].join(", ");

/** 滚动进入视口时淡入；新渲染出来的内容（切换工作区、筛选）会自动加入观察。 */
export function useReveal() {
  useEffect(() => {
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    root.classList.add("motion-ready");

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });

    const scan = () => {
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => {
        if (element.dataset.reveal) return;
        element.dataset.reveal = "1";
        observer.observe(element);
      });
    };

    scan();
    let frame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    const main = document.querySelector("main");
    if (main) mutations.observe(main, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
      root.classList.remove("motion-ready");
    };
  }, []);
}
