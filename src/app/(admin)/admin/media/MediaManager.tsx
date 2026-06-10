'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MediaGrid } from '@/components/admin/MediaGrid';
import { MediaUploader } from '@/components/admin/MediaUploader';
import { uploadMedia, deleteMedia, listMedia } from '@/lib/actions/media';
import type { MediaItem } from '@/lib/actions/media';

// ──────────────────────────────────────────────
// MediaManager — 媒体库客户端容器
// ──────────────────────────────────────────────

interface MediaManagerProps {
  initialItems: MediaItem[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function MediaManager({
  initialItems,
  total,
  currentPage,
  totalPages,
}: MediaManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(currentPage);
  const [pages, setPages] = useState(totalPages);
  const [totalCount, setTotalCount] = useState(total);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 上传回调
  const handleUpload = useCallback(async (formData: FormData) => {
    const result = await uploadMedia(formData);
    if (!result.success) {
      throw new Error(result.error);
    }
    // 上传成功后刷新
    await refreshList();
  }, []);

  // 刷新列表
  const refreshList = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await listMedia(page, 20);
      setItems(result.items);
      setTotalCount(result.total);
      setPages(result.totalPages);
      router.refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [page, router]);

  // 删除
  const handleDelete = useCallback(
    async (id: string, filename: string) => {
      if (!confirm(`确定要删除「${filename}」吗？此操作不可撤销。`)) return;

      const result = await deleteMedia(id);
      if (!result.success) {
        alert(result.error);
        return;
      }

      await refreshList();
    },
    [refreshList],
  );

  // 分页
  const goToPage = useCallback(
    async (newPage: number) => {
      if (newPage < 1 || newPage > pages) return;
      setPage(newPage);
      setIsRefreshing(true);
      try {
        const result = await listMedia(newPage, 20);
        setItems(result.items);
        setTotalCount(result.total);
        setPages(result.totalPages);
        router.refresh();
      } finally {
        setIsRefreshing(false);
      }
    },
    [pages, router],
  );

  return (
    <div>
      {/* 上传区域 */}
      <MediaUploader onUpload={handleUpload} />

      {/* 刷新按钮 + 统计 */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">共 {totalCount} 个文件</span>
        <button
          type="button"
          onClick={refreshList}
          disabled={isRefreshing}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* 图片网格 */}
      <MediaGrid items={items} onDelete={handleDelete} />

      {/* 分页 */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            上一页
          </button>
          <span className="px-3 text-sm text-slate-500">
            第 {page} / {pages} 页
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= pages}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
