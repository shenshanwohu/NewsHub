import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentProfile } from '@/lib/utils/auth';
import { ProfileForm } from './ProfileForm';

// ──────────────────────────────────────────────
// 个人资料页面
// ──────────────────────────────────────────────

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !profile) {
    redirect('/admin/login');
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">个人资料</h1>

      <div className="space-y-6">
        {/* 基本信息卡片 */}
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase text-slate-500">
            账户信息
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500">
                邮箱
              </label>
              <p className="mt-0.5 text-sm text-slate-900">{user.email}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500">
                角色
              </label>
              <p className="mt-0.5">
                <span className="inline-block rounded-full bg-brand-50 px-3 py-0.5 text-sm font-medium text-brand-700">
                  {getRoleLabel(profile.role)}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500">
                状态
              </label>
              <p className="mt-0.5">
                <span
                  className={`inline-block rounded-full px-3 py-0.5 text-sm font-medium ${
                    profile.is_active
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {profile.is_active ? '已启用' : '已禁用'}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500">
                创建时间
              </label>
              <p className="mt-0.5 text-sm text-slate-900">
                {new Date(profile.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* 编辑表单 */}
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase text-slate-500">
            编辑资料
          </h2>

          <ProfileForm initialDisplayName={profile.display_name || ''} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    super_admin: '超级管理员',
    publisher: '发布者',
    editor: '编辑',
  };
  return map[role] || role;
}
