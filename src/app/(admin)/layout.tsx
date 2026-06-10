import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentProfile } from '@/lib/utils/auth';
import { AuthProvider } from '@/features/auth/AuthContext';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { SidebarNav } from '@/components/admin/SidebarNav';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin/login');
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/admin/login?reason=no_profile');
  }

  if (!profile.is_active) {
    redirect('/admin/login?reason=disabled');
  }

  return (
    <AuthProvider user={user} profile={profile}>
      <div className="flex min-h-screen bg-slate-50">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-16 items-center border-b border-slate-200 px-6">
            <span className="text-lg font-bold text-brand-700">
              NewsHub CMS
            </span>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            <SidebarNav role={profile.role} />
          </nav>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div />
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
