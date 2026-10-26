"use client";

import { useEffect, useRef, useState } from "react";

const TONES = ["var(--sky-ink)", "var(--lilac-ink)", "var(--mint-ink)"];

// 固定种子的伪随机数，保证服务端和浏览器画出同一张图，不出现水合差异。
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

const LINES = (() => {
  const random = seeded(20261027);
  return Array.from({ length: 168 }, (_, index) => {
    const angle = (index / 168) * Math.PI * 2 + random() * 0.03;
    const inner = 70 + random() * 120;
    const outer = inner + 120 + random() * 330;
    return {
      x1: 500 + Math.cos(angle) * inner,
      y1: 500 + Math.sin(angle) * inner,
      x2: 500 + Math.cos(angle) * outer,
      y2: 500 + Math.sin(angle) * outer,
      tone: TONES[index % 3],
      width: 1.4 + random() * 3.2,
      opacity: 0.28 + random() * 0.5,
    };
  });
})();

/** 首页背景：三色放射线，缓慢旋转，鼠标移动时轻微视差。 */
export function HeroArt() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        element.style.setProperty("--px", `${(x * 26).toFixed(1)}px`);
        element.style.setProperty("--py", `${(y * 20).toFixed(1)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="hero-art" ref={ref} aria-hidden="true">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="hero-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#eaf4fc" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#eaf4fc" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="hero-art-lines">
          {LINES.map((line, index) => (
            <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={line.tone} strokeWidth={line.width} strokeOpacity={line.opacity} strokeLinecap="round" />
          ))}
        </g>
        <circle cx="500" cy="500" r="230" fill="url(#hero-core)" />
      </svg>
    </div>
  );
}

function beijingTime() {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

/** 北京时间：服务端先输出占位，挂载后再显示真实时间，避免水合不一致。 */
export function BeijingClock() {
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const first = window.setTimeout(() => setTime(beijingTime()), 0);
    const timer = window.setInterval(() => setTime(beijingTime()), 20_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  return <time suppressHydrationWarning>{time}</time>;
}
