import type { ReactNode } from "react";
import { loadSiteContent } from "../api/_lib/content";
import { Studio } from "../studio";

// 四个工作区共用这一个布局：切换页面时 Studio 不会重新挂载，计算器输入、筛选等状态都会保留。
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const content = await loadSiteContent();
  return <>
    <Studio content={content} />
    {children}
  </>;
}
