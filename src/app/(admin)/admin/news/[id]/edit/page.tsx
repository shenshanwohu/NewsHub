import { notFound } from 'next/navigation';
import {
  getNewsById,
  publishNews,
  unpublishNews,
} from '@/lib/actions/admin-news';
import { getCategories } from '@/lib/actions/news';
import { NewsForm } from '@/components/admin/NewsForm';
import { NewsStatusActions } from './NewsStatusActions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNewsPage({ params }: PageProps) {
  const { id } = await params;

  const [news, categories] = await Promise.all([
    getNewsById(id),
    getCategories(),
  ]);

  if (!news) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* 标题栏 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">编辑新闻</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            状态: <StatusLabel status={news.status} /> | Slug: /news/{news.slug}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/admin/news/${id}/preview`}
            target="_blank"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            预览
          </a>
          <NewsStatusActions newsId={news.id} currentStatus={news.status} />
        </div>
      </div>

      <NewsForm
        categories={categories}
        initialData={{
          id: news.id,
          title: news.title,
          slug: news.slug,
          summary: news.summary,
          content: news.content,
          cover_image_url: news.cover_image_url,
          status: news.status,
          is_featured: news.is_featured,
          seo_title: news.seo_title,
          seo_description: news.seo_description,
          seo_og_image: news.seo_og_image,
          category_ids: news.category_ids,
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// StatusLabel
// ──────────────────────────────────────────────

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档',
  };
  return (
    <span className="font-medium text-brand-600">{map[status] ?? status}</span>
  );
}
