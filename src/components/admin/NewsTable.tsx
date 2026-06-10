'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FeaturedToggle } from './FeaturedToggle';
import { updateNewsStatus } from '@/lib/actions/admin-news';
import type { AdminNewsItem, NewsCategory } from '@/lib/actions/news';

// ──────────────────────────────────────────────
// NewsTable
// ──────────────────────────────────────────────

interface NewsTableProps {
  news: AdminNewsItem[];
  total: number;
  page: number;
  pageSize: number;
  categories: NewsCategory[];
}

type SortField = 'created_at' | 'is_featured';
type SortDir = 'asc' | 'desc';

export function NewsTable({
  news: initialNews,
  total,
  page,
  pageSize,
  categories,
}: NewsTableProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialNews);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortField] = useState<SortField>('created_at');
  const [sortDir] = useState<SortDir>('desc');

  const totalPages = Math.ceil(total / pageSize);

  // 筛选变更 → 导航
  const applyFilter = useCallback(
    (status: string, catId: string) => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (catId) params.set('category', catId);
      const qs = params.toString();
      router.push(`/admin/news${qs ? `?${qs}` : ''}`);
    },
    [router],
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setStatusFilter(val);
      applyFilter(val, categoryFilter);
    },
    [categoryFilter, applyFilter],
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setCategoryFilter(val);
      applyFilter(statusFilter, val);
    },
    [statusFilter, applyFilter],
  );

  const handlePublish = useCallback(
    async (newsId: string, currentStatus: string) => {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await updateNewsStatus(newsId, newStatus as any);
      setItems((prev) =>
        prev.map((n) => (n.id === newsId ? { ...n, status: newStatus } : n)),
      );
      router.refresh();
    },
    [router],
  );

  const handleFeaturedToggle = useCallback(
    (newsId: string, newValue: boolean) => {
      setItems((prev) =>
        prev.map((n) =>
          n.id === newsId ? { ...n, is_featured: newValue } : n,
        ),
      );
      router.refresh();
    },
    [router],
  );

  return (
    <div>
      {/* 筛选栏 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>

        <select
          value={categoryFilter}
          onChange={handleCategoryChange}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <span className="text-sm text-slate-400">共 {total} 条</span>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">标题</th>
              <th className="px-4 py-3 font-medium text-slate-600">分类</th>
              <th className="px-4 py-3 font-medium text-slate-600">状态</th>
              <th className="px-4 py-3 font-medium text-slate-600">作者</th>
              <th className="px-4 py-3 font-medium text-slate-600">时间</th>
              <th className="px-4 py-3 font-medium text-slate-600">置顶</th>
              <th className="px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  暂无新闻
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="max-w-xs px-4 py-3">
                    <Link
                      href={`/admin/news/${item.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      <span className="line-clamp-1">{item.title}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.author_name ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {item.published_at
                      ? formatDate(item.published_at)
                      : formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <FeaturedToggle
                      newsId={item.id}
                      isFeatured={item.is_featured}
                      onToggle={handleFeaturedToggle}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/news/${item.id}`}
                        className="rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                      >
                        编辑
                      </Link>
                      <Link
                        href={`/admin/news/${item.id}/preview`}
                        target="_blank"
                        className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
                      >
                        预览
                      </Link>
                      {item.status !== 'archived' && (
                        <button
                          onClick={() => handlePublish(item.id, item.status)}
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            item.status === 'published'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {item.status === 'published' ? '下架' : '发布'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            第 {page}/{totalPages} 页
          </span>
          <div className="flex gap-2">
            {page > 1 && <PageLink page={page - 1} label="上一页" />}
            {page < totalPages && <PageLink page={page + 1} label="下一页" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// 子组件
// ──────────────────────────────────────────────

function PageLink({ page, label }: { page: number; label: string }) {
  return (
    <a
      href={`/admin/news?page=${page}`}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
    >
      {label}
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: '草稿', cls: 'bg-amber-100 text-amber-700' },
    published: { label: '已发布', cls: 'bg-green-100 text-green-700' },
    archived: { label: '已归档', cls: 'bg-slate-100 text-slate-500' },
  };
  const s = map[status] ?? {
    label: status,
    cls: 'bg-slate-100 text-slate-500',
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
