'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { publishNews, unpublishNews } from '@/lib/actions/admin-news';

interface NewsStatusActionsProps {
  newsId: string;
  currentStatus: string;
}

export function NewsStatusActions({
  newsId,
  currentStatus,
}: NewsStatusActionsProps) {
  const router = useRouter();

  const handlePublish = useCallback(async () => {
    await publishNews(newsId);
    router.refresh();
  }, [newsId, router]);

  const handleUnpublish = useCallback(async () => {
    await unpublishNews(newsId);
    router.refresh();
  }, [newsId, router]);

  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'published' ? (
        <button
          onClick={handleUnpublish}
          className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
        >
          下架
        </button>
      ) : (
        <button
          onClick={handlePublish}
          className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
        >
          发布
        </button>
      )}
    </div>
  );
}
