import { redirect } from 'next/navigation';

// /admin/dashboard 重定向到 /admin（Dashboard 内容在 /admin/page.tsx）
export default function DashboardRedirect() {
  redirect('/admin');
}
