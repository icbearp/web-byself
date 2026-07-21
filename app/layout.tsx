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
    title: "周多福 | 乐道 L60/L80/L90 家庭购车指南",
    description:
      "周多福的乐道家庭购车指南，展示 L60、L80、L90 车型亮点、官方价格、选装预算计算和生活方式场景建议。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "周多福 | 乐道 L60/L80/L90 家庭购车指南",
      description:
        "按家庭、生活方式和真实用车场景理解乐道车型，附官方价格和选装预算计算。",
      type: "website",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: "周多福乐道购车指南预览图",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "周多福 | 乐道 L60/L80/L90 家庭购车指南",
      description:
        "乐道车型亮点、官方价格、选装预算和家庭场景购车建议。",
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
