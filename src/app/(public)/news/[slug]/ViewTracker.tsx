'use client';

import { useEffect, useRef } from 'react';
import { incrementViewCount } from '@/lib/actions/view-counter';

interface ViewTrackerProps {
  newsId: string;
}

export function ViewTracker({ newsId }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // 每个 session 仅计一次
    if (tracked.current) return;
    tracked.current = true;

    incrementViewCount(newsId);
  }, [newsId]);

  return null;
}
