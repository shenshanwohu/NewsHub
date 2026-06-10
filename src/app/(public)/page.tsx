import { Suspense } from 'react';
import { getPublishedNews } from '@/lib/actions/news';
import { FeaturedNews } from '@/components/public/FeaturedNews';
import { NewsList } from '@/components/public/NewsList';
import {
  FeaturedNewsSkeleton,
  NewsCardSkeleton,
} from '@/components/ui/Skeleton';

// 静态页面增量更新间隔
export const revalidate = 60;

// ──────────────────────────────────────────────
// 首页
// ──────────────────────────────────────────────

interface HomePageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = 20;

  const result = await getPublishedNews(currentPage, pageSize);

  // 分离置顶新闻与普通新闻
  const featuredNews = result.news.filter((n) => n.is_featured);
  const regularNews = result.news.filter((n) => !n.is_featured);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* 置顶新闻区域 */}
      <Suspense fallback={<FeaturedNewsSkeleton />}>
        <FeaturedNews items={featuredNews} />
      </Suspense>

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
        <NewsList
          news={regularNews}
          currentPage={currentPage}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
