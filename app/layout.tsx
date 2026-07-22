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
    title: "周多福 | 购车、效率与生活经验",
    description:
      "周多福的个人经验工作室，长期分享乐道购车建议、AI 效率工具、信息获取方法与生活选择。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "周多福 | 购车、效率与生活经验",
      description:
        "从真实生活场景出发，分享购车判断、效率经验、信息方法与长期选择。",
      type: "website",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: "周多福个人经验工作室预览图",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "周多福 | 购车、效率与生活经验",
      description:
        "购车建议、AI 效率工具、信息获取和生活经验。",
      images: ["/og.png"],
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
