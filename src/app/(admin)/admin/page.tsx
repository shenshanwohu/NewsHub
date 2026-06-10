import { getDashboardStats } from '@/lib/actions/news';

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="总新闻数" value={stats.totalNews} color="slate" />
        <StatCard label="已发布" value={stats.publishedNews} color="green" />
        <StatCard label="草稿" value={stats.draftNews} color="amber" />
        <StatCard label="分类" value={stats.totalCategories} color="brand" />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="已归档" value={stats.archivedNews} color="slate" />
        <StatCard label="总浏览" value={stats.totalViews} color="brand" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// StatCard — 统计卡片
// ──────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'slate' | 'green' | 'amber' | 'brand';
}) {
  const colorMap = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    brand: 'bg-brand-100 text-brand-700',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-medium text-slate-500">{label}</h2>
      <p
        className={`mt-2 inline-block rounded-md px-2 py-0.5 text-2xl font-bold ${colorMap[color]}`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}
