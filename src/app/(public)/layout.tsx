import { CategoryNav } from '@/components/public/CategoryNav';
import { SearchBar } from '@/components/public/SearchBar';

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <a href="/" className="text-xl font-bold text-brand-700">
              NewsHub
            </a>
          </div>
          <div className="flex items-center">
            <SearchBar />
          </div>
        </div>

        {/* 分类导航栏 */}
        <div className="border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <CategoryNav />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} NewsHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
