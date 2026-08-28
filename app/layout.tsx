import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "周多福 | 个人工作室",
    description:
      "周多福的个人知识与工具网站：实用教程、来源整理、随心记录、汽车数据与开放金融计算。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "周多福 | 个人工作室",
      description:
        "把复杂问题整理成可以直接使用的教程与工具。",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "周多福 | 个人工作室",
      description:
        "实用教程、来源整理、真实记录与开放工具。",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
