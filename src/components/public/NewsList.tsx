import type { NewsItem } from '@/lib/actions/news';
import { NewsCard } from './NewsCard';
import { Pagination } from '@/components/ui/Pagination';

interface NewsListProps {
  news: NewsItem[];
  currentPage: number;
  totalPages: number;
}

export function NewsList({ news, currentPage, totalPages }: NewsListProps) {
  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-5xl">📭</div>
        <h3 className="text-lg font-semibold text-slate-900">暂无新闻</h3>
        <p className="mt-1 text-sm text-slate-500">
          还没有已发布的新闻内容，请稍后再来。
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-6 text-xl font-bold text-slate-900">最新新闻</h2>

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
    </section>
  );
}
