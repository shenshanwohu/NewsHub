// 登录页独立布局 — 不含 auth guard，避免 AdminLayout 的重定向循环
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
