import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getNewsByCategorySlug } from '@/lib/actions/news';
import { NewsCard } from '@/components/public/NewsCard';
import { Pagination } from '@/components/ui/Pagination';
import { NewsCardSkeleton } from '@/components/ui/Skeleton';

// ──────────────────────────────────────────────
// SEO
// ──────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // 取分类信息（取第一页即可获取 category）
  const result = await getNewsByCategorySlug(slug, 1, 1);

  if (!result.category) {
    return { title: '分类未找到' };
  }

  return {
    title: `${result.category.name} — NewsHub`,
    description:
      result.category.description ||
      `查看 ${result.category.name} 分类下的新闻`,
  };
}

// ──────────────────────────────────────────────
// 分类新闻列表页
// ──────────────────────────────────────────────

export default async function CategoryPage(props: PageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = 20;

  const result = await getNewsByCategorySlug(slug, currentPage, pageSize);

  if (!result.category) {
    notFound();
  }

  const { news, category, total, totalPages } = result;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* 分类头部 */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-slate-600">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-slate-400">共 {total} 篇新闻</p>
      </div>

      {/* 新闻列表 */}
      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        {news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-5xl">📭</div>
            <h3 className="text-lg font-semibold text-slate-900">
              该分类下暂无新闻
            </h3>
            <p className="mt-1 text-sm text-slate-500">请浏览其他分类。</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              className="mt-10"
            />
          </>
        )}
      </Suspense>
    </div>
  );
}
