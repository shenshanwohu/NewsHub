import Link from 'next/link';
import { getCategories } from '@/lib/actions/news';

export async function CategoryNav() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto" aria-label="分类导航">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}
