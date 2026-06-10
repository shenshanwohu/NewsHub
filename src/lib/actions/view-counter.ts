'use server';

import { createClient } from '@/lib/supabase/server';

// ──────────────────────────────────────────────
// incrementViewCount — 浏览计数异步写入
// 客户端在新闻详情页加载时触发，不阻塞渲染
// 通过 SECURITY DEFINER 函数安全递增，无需修改 RLS
// ──────────────────────────────────────────────

export async function incrementViewCount(newsId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_view_count', {
    row_id: newsId,
  });

  if (error) {
    // 静默失败 — 浏览计数不阻塞页面渲染
    console.warn('view_count increment failed:', error.message);
  }
}
