import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getNewsById } from '@/lib/actions/admin-news';
import { getCategories } from '@/lib/actions/news';
import { RichTextRenderer } from '@/components/public/RichTextRenderer';
import { CategoryBadge } from '@/components/public/CategoryBadge';

// ──────────────────────────────────────────────
// 新闻预览页（管理员侧，仅草稿/已发布可见）
// ──────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewsPreviewPage({ params }: PageProps) {
  const { id } = await params;

  const news = await getNewsById(id);

  if (!news) {
    notFound();
  }

  const publishedDate = news.published_at
    ? formatDate(news.published_at)
    : formatDate(news.created_at);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* 预览提示条 */}
      <div className="mb-8 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <span className="text-lg">👁</span>
          <span>
            预览模式 — 当前状态：
            <span className="font-semibold">{statusLabel(news.status)}</span>
          </span>
        </div>
        <Link
          href={`/admin/news/${id}/edit`}
          className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          返回编辑
        </Link>
      </div>

      <article>
        {/* 分类标签 */}
        {news.category_ids && news.category_ids.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {news.category_ids.map((catId: string) => (
              <span
                key={catId}
                className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
              >
                分类
              </span>
            ))}
          </div>
        )}

        {/* 标题 */}
        <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
          {news.title}
        </h1>

        {/* 元信息 */}
        <div className="mb-10 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <time dateTime={news.published_at || news.created_at}>
            发布于 {publishedDate}
          </time>
          <span>{news.view_count.toLocaleString()} 次浏览</span>
        </div>

        {/* 封面图 */}
        {news.cover_image_url && (
          <div className="mb-10 overflow-hidden rounded-xl">
            <Image
              src={news.cover_image_url}
              alt={news.title}
              width={1200}
              height={630}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        )}

        {/* 摘要 */}
        {news.summary && (
          <div className="mb-8 rounded-lg border-l-4 border-brand-500 bg-brand-50/50 px-5 py-4">
            <p className="text-base leading-relaxed text-slate-700">
              {news.summary}
            </p>
          </div>
        )}

        {/* 正文 */}
        <RichTextRenderer html={news.content} className="mb-12" />
      </article>
    </div>
  );
}

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档',
  };
  return map[status] || status;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
