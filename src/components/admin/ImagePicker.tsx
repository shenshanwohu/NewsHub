'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { listMedia } from '@/lib/actions/media';
import type { MediaItem } from '@/lib/actions/media';

// ──────────────────────────────────────────────
// ImagePicker — 从媒体库选择图片的弹窗
// 供富文本编辑器插入图片、选择封面图等场景使用
// ──────────────────────────────────────────────

interface ImagePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, alt: string) => void;
  /** 已选中的图片 URL（用于显示选中状态） */
  currentUrl?: string;
}

export function ImagePicker({
  open,
  onClose,
  onSelect,
  currentUrl,
}: ImagePickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  const loadItems = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const result = await listMedia(p, pageSize);
      setItems(result.items);
      setTotalPages(result.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setPage(1);
      loadItems(1);
    }
  }, [open, loadItems]);

  // ESC 关闭
  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        {/* 头部 */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">选择图片</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 图片网格 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 text-4xl">🖼</div>
            <p className="text-sm text-slate-500">暂无图片，请先上传</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {items.map((item) => {
              const isSelected = currentUrl === item.public_url;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.public_url, item.alt_text || item.filename);
                    onClose();
                  }}
                  className={`group relative aspect-[4/3] overflow-hidden rounded-lg border-2 bg-slate-100 transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-200'
                      : 'border-transparent hover:border-brand-300'
                  }`}
                >
                  <Image
                    src={item.public_url}
                    alt={item.alt_text || item.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 16vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-xs text-white">
                      {item.filename}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                const p = page - 1;
                if (p >= 1) {
                  setPage(p);
                  loadItems(p);
                }
              }}
              disabled={page <= 1}
              className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              上一页
            </button>
            <span className="text-xs text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                const p = page + 1;
                if (p <= totalPages) {
                  setPage(p);
                  loadItems(p);
                }
              }}
              disabled={page >= totalPages}
              className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
