import { getCategoryTree } from '@/lib/actions/categories';
import { getCategories } from '@/lib/actions/categories';
import { CategoryManager } from './CategoryManager';

// ──────────────────────────────────────────────
// 分类管理页面
// ──────────────────────────────────────────────

export default async function CategoriesPage() {
  const [tree, allCategories] = await Promise.all([
    getCategoryTree(),
    getCategories(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">分类管理</h1>
      </div>

      <CategoryManager tree={tree} allCategories={allCategories} />
    </div>
  );
}
