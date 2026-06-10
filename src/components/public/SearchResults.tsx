import type { NewsItem } from '@/lib/actions/news';
import { NewsCard } from './NewsCard';
import { Pagination } from '@/components/ui/Pagination';

interface SearchResultsProps {
  query: string;
  news: NewsItem[];
  currentPage: number;
  totalPages: number;
}

export function SearchResults({
  query,
  news,
  currentPage,
  totalPages,
}: SearchResultsProps) {
  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-5xl">🔍</div>
        <h3 className="text-lg font-semibold text-slate-900">输入关键词搜索</h3>
        <p className="mt-1 text-sm text-slate-500">
          输入关键词查找相关新闻内容。
        </p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-5xl">📭</div>
        <h3 className="text-lg font-semibold text-slate-900">
          未找到相关结果
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          没有与 &ldquo;{query}&rdquo; 匹配的新闻，请尝试其他关键词。
        </p>
      </div>
    );
  }

  return (
    <section>
      <p className="mb-6 text-sm text-slate-500">
        找到 {news.length} 篇与 &ldquo;{query}&rdquo; 相关的新闻
      </p>

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
