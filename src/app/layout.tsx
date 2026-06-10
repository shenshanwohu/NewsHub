import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'NewsHub — 新闻门户',
    template: '%s | NewsHub',
  },
  description: 'NewsHub 新闻发布系统 — 获取最新资讯',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'NewsHub',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
