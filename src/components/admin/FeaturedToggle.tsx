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
    try {
      const result = await toggleFeatured(newsId);
      onToggle?.(newsId, result.is_featured);
    } catch {
      // 静默失败
    }
  }, [newsId, onToggle]);

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
        isFeatured
          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
      title={isFeatured ? '取消置顶' : '设为置顶'}
    >
      {isFeatured ? '📌 置顶' : '📌 置顶'}
    </button>
  );
}
