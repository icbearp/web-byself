import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") || host.startsWith("127.")
    ? "http"
    : "https";
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "周多福 | 蔚来乐道汽车销售与效率生活博客",
    description:
      "周多福的个人独立站，分享蔚来乐道购车经验、生活判断、AI效率工具、信息获取和个人成长。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "周多福 | 把购车、效率和生活经验讲明白",
      description:
        "一个汽车销售顾问的长期博客：乐道/蔚来咨询、AI效率工具、生活经验和信息素养。",
      type: "website",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: "周多福个人独立站预览图",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "周多福 | 蔚来乐道汽车销售与效率生活博客",
      description: "购车建议、生活经验、AI效率工具和信息获取方法。",
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
