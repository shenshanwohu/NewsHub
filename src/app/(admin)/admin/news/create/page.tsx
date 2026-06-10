import { getCategories } from '@/lib/actions/news';
import { NewsForm } from '@/components/admin/NewsForm';

export default async function CreateNewsPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">创建新闻</h1>

      <NewsForm categories={categories} />
    </div>
  );
}
