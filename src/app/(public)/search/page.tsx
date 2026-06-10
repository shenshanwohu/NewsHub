import { Suspense } from 'react';
import type { Metadata } from 'next';
import { searchNews } from '@/lib/actions/news';
import { SearchResults } from '@/components/public/SearchResults';
import { NewsCardSkeleton } from '@/components/ui/Skeleton';

// 搜索页是动态的，不做 ISR
export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────
// SEO
// ──────────────────────────────────────────────

interface PageProps {
  searchParams?: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params?.q?.trim();

  return {
    title: query ? `${query} — 搜索 — NewsHub` : '搜索 — NewsHub',
  };
}

// ──────────────────────────────────────────────
// 搜索页
// ──────────────────────────────────────────────

export default async function SearchPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q?.trim() ?? '';
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = 20;

  const result = query
    ? await searchNews(query, currentPage, pageSize)
    : { news: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">搜索</h1>

      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <SearchResults
          query={query}
          news={result.news}
          currentPage={currentPage}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
