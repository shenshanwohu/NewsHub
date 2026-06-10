import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getNewsBySlug } from '@/lib/actions/news';
import { CategoryBadge } from '@/components/public/CategoryBadge';
import { RichTextRenderer } from '@/components/public/RichTextRenderer';
import { ViewTracker } from './ViewTracker';

// 增量静态再生：60 秒后重新生成
export const revalidate = 60;

// ──────────────────────────────────────────────
// SEO Metadata — 动态生成
// ──────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);

  if (!news) {
    return { title: '新闻未找到' };
  }

  const title = news.seo_title || news.title;
  const description = news.seo_description || news.summary || '';
  const ogImage = news.seo_og_image || news.cover_image_url || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: news.published_at ?? undefined,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630 }]
        : undefined,
    },
    alternates: {
      canonical: `/news/${news.slug}`,
    },
  };
}

// ──────────────────────────────────────────────
// 新闻详情页
// ──────────────────────────────────────────────

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);

  if (!news) {
    notFound();
  }

  const publishedDate = news.published_at
    ? formatFullDate(news.published_at)
    : null;

  return (
    <>
      {/* 浏览计数器 — 客户端副作用，不阻塞服务端渲染 */}
      <ViewTracker newsId={news.id} />

      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* 头部信息 */}
        <header className="mb-10">
          {/* 分类标签 */}
          {news.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {news.categories.map((cat) => (
                <CategoryBadge key={cat.id} name={cat.name} slug={cat.slug} />
              ))}
            </div>
          )}

          {/* 标题 */}
          <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {news.title}
          </h1>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {news.author && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-6 w-6 rounded-full bg-brand-100 text-center text-xs leading-6 text-brand-700">
                  {getInitial(news.author.display_name || news.author.email)}
                </span>
                {news.author.display_name || news.author.email}
              </span>
            )}

            {publishedDate && (
              <time dateTime={news.published_at!}>发布于 {publishedDate}</time>
            )}

            <span>{news.view_count.toLocaleString()} 次浏览</span>
          </div>
        </header>

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

        {/* 正文 — 富文本渲染 */}
        <RichTextRenderer html={news.content} className="mb-12" />

        {/* 底部：返回导航 */}
        <footer className="border-t border-slate-200 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            &larr; 返回首页
          </Link>
        </footer>
      </article>
    </>
  );
}

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
