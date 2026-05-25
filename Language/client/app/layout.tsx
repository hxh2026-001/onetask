import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Compiler Sandbox - Mini Language IDE',
  description: '迷你编程语言编译沙盒系统 - 实时查看词法分析、语法分析、AST构建、类型检查和代码生成',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
