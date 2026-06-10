import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/utils/auth';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default async function AdminLoginPage() {
  // 已登录用户直接跳转后台
  const user = await getCurrentUser();

  if (user) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">NewsHub CMS</h1>
          <p className="mt-1 text-sm text-slate-500">管理员登录</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
