'use client';

import { useCallback } from 'react';
import { toggleFeatured } from '@/lib/actions/admin-news';

interface FeaturedToggleProps {
  newsId: string;
  isFeatured: boolean;
  onToggle?: (newsId: string, newValue: boolean) => void;
}

export function FeaturedToggle({
  newsId,
  isFeatured,
  onToggle,
}: FeaturedToggleProps) {
  const handleClick = useCallback(async () => {
    const msg = isFeatured
      ? '确定取消置顶这篇新闻吗？'
      : '确定将这篇新闻置顶吗？';
    if (!confirm(msg)) return;
    try {
      const result = await toggleFeatured(newsId);
      onToggle?.(newsId, result.is_featured);
    } catch {
      // 静默失败
    }
  }, [newsId, isFeatured, onToggle]);

  return (
    <button
      onClick={handleClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
        isFeatured
          ? 'border-amber-300 bg-white text-amber-600 hover:bg-amber-50'
          : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
      }`}
      title={isFeatured ? '取消置顶' : '设为置顶'}
    >
      {isFeatured ? '📌 置顶' : '📌 置顶'}
    </button>
  );
}
