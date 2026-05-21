import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "古代天文观测仪模拟系统",
  description: "基于 Next.js + Three.js + SQLite 的古代天文观测仪模拟系统，支持天球旋转、黄道十二宫计算、岁差修正等功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}