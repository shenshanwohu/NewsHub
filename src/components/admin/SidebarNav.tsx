'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ──────────────────────────────────────────────
// SidebarNav — 后台侧边栏导航（自动高亮当前页）
// ──────────────────────────────────────────────

interface SidebarNavProps {
  role: string;
}

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: '控制台', href: '/admin/dashboard' },
  { label: '新闻管理', href: '/admin/news' },
  { label: '分类管理', href: '/admin/categories' },
  { label: '媒体库', href: '/admin/media' },
];

const SETTINGS_ITEM: NavItem = {
  label: '系统设置',
  href: '/admin/settings',
};

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    // 控制台：仅精确匹配 /admin 或 /admin/dashboard
    if (item.href === '/admin/dashboard') {
      return pathname === '/admin' || pathname === '/admin/dashboard';
    }
    // 其他菜单：以 href 开头才算匹配（如 /admin/news/create 匹配 新闻管理）
    return pathname.startsWith(item.href);
  }

  return (
    <div className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`block rounded-md px-3 py-2 text-sm ${
            isActive(item)
              ? 'bg-slate-100 font-medium text-slate-700'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          {item.label}
        </Link>
      ))}
      {role === 'super_admin' && (
        <Link
          href={SETTINGS_ITEM.href}
          className={`block rounded-md px-3 py-2 text-sm ${
            isActive(SETTINGS_ITEM)
              ? 'bg-slate-100 font-medium text-slate-700'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          {SETTINGS_ITEM.label}
        </Link>
      )}
    </div>
  );
}
