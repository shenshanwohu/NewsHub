import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://newshub.example.com';
  const supabase = await createClient();

  // 获取所有已发布新闻
  const { data: newsItems } = await supabase
    .from('news')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  // 获取所有已启用分类
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_active', true);

  // 静态页面
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
  ];

  // 新闻详情页
  const newsRoutes: MetadataRoute.Sitemap = (newsItems ?? []).map((item) => ({
    url: `${baseUrl}/news/${item.slug}`,
    lastModified: new Date(item.updated_at || item.published_at || new Date()),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 分类页
  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map(
    (cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }),
  );

  return [...staticRoutes, ...newsRoutes, ...categoryRoutes];
}
