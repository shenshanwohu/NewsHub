'use client';

import Image from 'next/image';
import type { MediaItem } from '@/lib/actions/media';

// ──────────────────────────────────────────────
// MediaGrid — 媒体库网格展示
// ──────────────────────────────────────────────

interface MediaGridProps {
  items: MediaItem[];
  onDelete: (id: string, filename: string) => void;
}

export function MediaGrid({ items, onDelete }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-5xl">🖼</div>
        <h3 className="text-lg font-semibold text-slate-900">暂无图片</h3>
        <p className="mt-1 text-sm text-slate-500">
          上传第一张图片开始构建你的媒体库。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <MediaCard key={item.id} item={item} onDelete={onDelete} />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// MediaCard — 单张图片卡片
// ──────────────────────────────────────────────

interface MediaCardProps {
  item: MediaItem;
  onDelete: (id: string, filename: string) => void;
}

function MediaCard({ item, onDelete }: MediaCardProps) {
  const fileSize = formatFileSize(item.file_size);
  const dateStr = formatDate(item.created_at);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md">
      {/* 图片 */}
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={item.public_url}
          alt={item.alt_text || item.filename}
          width={400}
          height={300}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* 信息栏 */}
      <div className="p-2.5">
        <p
          className="truncate text-xs font-medium text-slate-700"
          title={item.filename}
        >
          {item.filename}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>{fileSize}</span>
          <span>{dateStr}</span>
        </div>
      </div>

      {/* 操作层（hover 可见） */}
      <div className="absolute left-0 right-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(item.public_url);
          }}
          className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-white"
          title="复制 URL"
        >
          📋
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id, item.filename)}
          className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-red-600 shadow-sm hover:bg-white"
          title="删除"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
