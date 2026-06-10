import { listMedia } from '@/lib/actions/media';
import { MediaManager } from './MediaManager';

// ──────────────────────────────────────────────
// 媒体库页面
// ──────────────────────────────────────────────

interface PageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export default async function MediaPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = 20;

  const result = await listMedia(currentPage, pageSize);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">媒体库</h1>
      </div>

      <MediaManager
        initialItems={result.items}
        total={result.total}
        currentPage={currentPage}
        totalPages={result.totalPages}
      />
    </div>
  );
}
