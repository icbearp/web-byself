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
      "周多福的个人工作室，记录真实选择、职场思考、效率方法与重新开始。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "周多福 | 个人工作室",
      description:
        "离开旧角色，记录真实选择；整理效率方法，也保留开放、独立的实用工具。",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "周多福 | 个人工作室",
      description:
        "真实记录、独立判断、效率方法与开放工具。",
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
