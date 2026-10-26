import type { ReactNode } from "react";
import { loadSiteContent } from "../api/_lib/content";
import { loadSiteSettings } from "../api/_lib/settings";
import { Studio } from "../studio";

// 首页、教程、记录共用这一个布局：切换页面时 Studio 不会重新挂载，筛选等状态都会保留。
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [content, settings] = await Promise.all([loadSiteContent(), loadSiteSettings()]);
  return <>
    <Studio content={content} settings={settings} />
    {children}
  </>;
}
