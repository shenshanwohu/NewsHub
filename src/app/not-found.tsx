'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-slate-200">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-900">
          页面未找到
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          您访问的页面不存在或已被移除。
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            返回首页
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}
