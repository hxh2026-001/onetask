import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '时间规则探索工具 | ChronoMaze',
  description: '在多种历法交织的四维迷宫中探索时间的奥秘',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
