import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/utils/auth';
import { getSettings } from '@/lib/actions/settings';
import { SettingsForm } from '@/components/admin/SettingsForm';

// ──────────────────────────────────────────────
// 系统设置页面（仅 super_admin）
// ──────────────────────────────────────────────

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  // 非超级管理员跳转
  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin');
  }

  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">系统设置</h1>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
