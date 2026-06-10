import { listAllNews, getCategories } from '@/lib/actions/news';
import { NewsTable } from '@/components/admin/NewsTable';

interface PageProps {
  searchParams?: Promise<{
    status?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function AdminNewsPage(props: PageProps) {
  const searchParams = await props.searchParams;

  const status = searchParams?.status || '';
  const categoryId = searchParams?.category || '';
  const page = Math.max(1, Number(searchParams?.page) || 1);

  const [result, categories] = await Promise.all([
    listAllNews({
      status: status || undefined,
      categoryId: categoryId || undefined,
      page,
    }),
    getCategories(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">新闻管理</h1>
        <a
          href="/admin/news/create"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + 新建新闻
        </a>
      </div>

      <NewsTable
        news={result.news}
        total={result.total}
        page={page}
        pageSize={50}
        categories={categories}
      />
    </div>
  );
}
