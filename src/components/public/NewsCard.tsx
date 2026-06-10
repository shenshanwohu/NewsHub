import Link from 'next/link';
import Image from 'next/image';
import type { NewsItem } from '@/lib/actions/news';

interface NewsCardProps {
  item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
  const publishedDate = item.published_at
    ? formatDate(item.published_at)
    : null;

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
      {/* 封面图 */}
      <Link href={`/news/${item.slug}`} className="block overflow-hidden">
        {item.cover_image_url ? (
          <Image
            src={item.cover_image_url}
            alt={item.title}
            width={400}
            height={225}
            className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-slate-100">
            <span className="text-4xl font-bold text-slate-300">
              {item.title[0]}
            </span>
          </div>
        )}
      </Link>

      {/* 内容 */}
      <div className="p-4">
        {/* 分类标签 */}
        {item.categories.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {item.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* 标题 */}
        <h3 className="mb-1.5 line-clamp-2 text-lg font-semibold text-slate-900 transition-colors group-hover:text-brand-600">
          <Link href={`/news/${item.slug}`}>{item.title}</Link>
        </h3>

        {/* 摘要 */}
        {item.summary && (
          <p className="mb-3 line-clamp-2 text-sm text-slate-600">
            {item.summary}
          </p>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          {publishedDate && <time dateTime={item.published_at!}>{publishedDate}</time>}
          <span>{item.view_count.toLocaleString()} 次浏览</span>
        </div>
      </div>
    </article>
  );
}

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${Math.max(diffMinutes, 1)} 分钟前`;
    }
    return `${diffHours} 小时前`;
  }

  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
