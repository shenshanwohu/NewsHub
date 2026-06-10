import { createClient } from '@/lib/supabase/server';

// ──────────────────────────────────────────────
// 类型
// ──────────────────────────────────────────────

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
}

export interface NewsCategoryWithCount extends NewsCategory {
  description: string | null;
  parent_id: string | null;
  news_count: number;
}

export interface NewsAuthor {
  id: string;
  display_name: string | null;
  email: string;
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_image_url: string | null;
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  author: NewsAuthor | null;
  is_featured: boolean;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  published_at: string | null;
  created_at: string;
  categories: NewsCategory[];
}

export interface NewsListResult {
  news: NewsItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ──────────────────────────────────────────────
// 获取已发布新闻（含分类）
// ──────────────────────────────────────────────

export async function getPublishedNews(
  page: number = 1,
  pageSize: number = 20,
): Promise<NewsListResult> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 单次查询获取数据和总数，替代两次独立查询
  const { data: newsData, count: total } = await supabase
    .from('news')
    .select(
      `
      id,
      title,
      slug,
      summary,
      content,
      cover_image_url,
      status,
      author_id,
      is_featured,
      view_count,
      seo_title,
      seo_description,
      seo_og_image,
      published_at,
      created_at,
      news_categories (
        category_id,
        categories (
          id,
          name,
          slug
        )
      )
    `,
      { count: 'exact' },
    )
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .range(from, to);

  const news: NewsItem[] = (newsData ?? []).map((item: any) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    content: item.content,
    cover_image_url: item.cover_image_url,
    status: item.status,
    author_id: item.author_id,
    author: null,
    is_featured: item.is_featured,
    view_count: item.view_count,
    seo_title: item.seo_title,
    seo_description: item.seo_description,
    seo_og_image: item.seo_og_image,
    published_at: item.published_at,
    created_at: item.created_at,
    categories: (item.news_categories ?? [])
      .map((nc: any) => nc.categories)
      .filter(Boolean),
  }));

  return {
    news,
    total: total ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((total ?? 0) / pageSize),
  };
}

// ──────────────────────────────────────────────
// 获取单条新闻详情（含分类 + 作者）
// ──────────────────────────────────────────────

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('news')
    .select(
      `
      id,
      title,
      slug,
      summary,
      content,
      cover_image_url,
      status,
      author_id,
      is_featured,
      view_count,
      seo_title,
      seo_description,
      seo_og_image,
      published_at,
      created_at,
      profiles!inner (
        id,
        display_name,
        email
      ),
      news_categories (
        category_id,
        categories (
          id,
          name,
          slug
        )
      )
    `,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!item) return null;

  const profile = Array.isArray(item.profiles)
    ? item.profiles[0]
    : item.profiles;

  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    content: item.content,
    cover_image_url: item.cover_image_url,
    status: item.status,
    author_id: item.author_id,
    author: profile
      ? {
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
        }
      : null,
    is_featured: item.is_featured,
    view_count: item.view_count,
    seo_title: item.seo_title,
    seo_description: item.seo_description,
    seo_og_image: item.seo_og_image,
    published_at: item.published_at,
    created_at: item.created_at,
    categories: (item.news_categories ?? [])
      .map((nc: any) => nc.categories)
      .filter(Boolean),
  };
}

// ──────────────────────────────────────────────
// 获取全部分类（含关联新闻计数）
// ──────────────────────────────────────────────

export async function getCategories(): Promise<NewsCategoryWithCount[]> {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select(
      `id, name, slug, description, parent_id, news_categories!inner ( news_id )`,
    )
    .eq('is_active', true)
    .order('sort_order');

  return (categories ?? []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? null,
    parent_id: cat.parent_id ?? null,
    news_count: cat.news_categories?.length ?? 0,
  }));
}

// ──────────────────────────────────────────────
// 获取某分类下的新闻列表
// ──────────────────────────────────────────────

export async function getNewsByCategorySlug(
  slug: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<NewsListResult & { category: NewsCategoryWithCount | null }> {
  const supabase = await createClient();

  // 先查分类
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, description, parent_id')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!category) {
    return {
      news: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0,
      category: null,
    };
  }

  const categoryId = category.id;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 单次查询获取数据和总数
  const { data: newsData, count: total } = await supabase
    .from('news')
    .select(
      `
      id,
      title,
      slug,
      summary,
      content,
      cover_image_url,
      status,
      author_id,
      is_featured,
      view_count,
      seo_title,
      seo_description,
      seo_og_image,
      published_at,
      created_at,
      news_categories!inner (
        category_id,
        categories ( id, name, slug )
      )
    `,
      { count: 'exact' },
    )
    .eq('status', 'published')
    .eq('news_categories.category_id', categoryId)
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .range(from, to);

  const news: NewsItem[] = (newsData ?? []).map((item: any) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    content: item.content,
    cover_image_url: item.cover_image_url,
    status: item.status,
    author_id: item.author_id,
    author: null,
    is_featured: item.is_featured,
    view_count: item.view_count,
    seo_title: item.seo_title,
    seo_description: item.seo_description,
    seo_og_image: item.seo_og_image,
    published_at: item.published_at,
    created_at: item.created_at,
    categories: (item.news_categories ?? [])
      .map((nc: any) => nc.categories)
      .filter(Boolean),
  }));

  return {
    news,
    total: total ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((total ?? 0) / pageSize),
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      parent_id: category.parent_id ?? null,
      news_count: total ?? 0,
    },
  };
}

// ──────────────────────────────────────────────
// 全文搜索（ILIKE 匹配 title + content）
// ──────────────────────────────────────────────

export async function searchNews(
  query: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<NewsListResult> {
  const supabase = await createClient();

  if (!query.trim()) {
    return { news: [], total: 0, page: 1, pageSize, totalPages: 0 };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const keyword = `%${query.trim()}%`;

  // 单次查询获取数据和总数
  const { data: newsData, count: total } = await supabase
    .from('news')
    .select(
      `
      id, title, slug, summary, content, cover_image_url,
      status, author_id, is_featured, view_count,
      seo_title, seo_description, seo_og_image,
      published_at, created_at,
      news_categories (
        category_id, categories ( id, name, slug )
      )
    `,
      { count: 'exact' },
    )
    .eq('status', 'published')
    .or(`title.ilike.${keyword},content.ilike.${keyword}`)
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .range(from, to);

  const news: NewsItem[] = (newsData ?? []).map((item: any) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    content: item.content,
    cover_image_url: item.cover_image_url,
    status: item.status,
    author_id: item.author_id,
    author: null,
    is_featured: item.is_featured,
    view_count: item.view_count,
    seo_title: item.seo_title,
    seo_description: item.seo_description,
    seo_og_image: item.seo_og_image,
    published_at: item.published_at,
    created_at: item.created_at,
    categories: (item.news_categories ?? [])
      .map((nc: any) => nc.categories)
      .filter(Boolean),
  }));

  return {
    news,
    total: total ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((total ?? 0) / pageSize),
  };
}

// ──────────────────────────────────────────────
// Dashboard 统计
// ──────────────────────────────────────────────

export interface DashboardStats {
  totalNews: number;
  publishedNews: number;
  draftNews: number;
  archivedNews: number;
  totalCategories: number;
  totalViews: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  // 一次查询获取所有新闻的 status 和 view_count
  // 替代原来的 7 次独立查询
  const [newsResult, categoriesResult] = await Promise.all([
    supabase.from('news').select('status, view_count'),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ]);

  const newsData = newsResult.data ?? [];
  const totalViews = newsData.reduce(
    (sum: number, row: any) => sum + (row.view_count ?? 0),
    0,
  );

  const countByStatus = (status: string) =>
    newsData.filter((n: any) => n.status === status).length;

  return {
    totalNews: newsData.length,
    publishedNews: countByStatus('published'),
    draftNews: countByStatus('draft'),
    archivedNews: countByStatus('archived'),
    totalCategories: categoriesResult.count ?? 0,
    totalViews,
  };
}

// ──────────────────────────────────────────────
// 管理端：获取全部新闻列表（含作者、分类）
// ──────────────────────────────────────────────

export interface AdminNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: string;
  is_featured: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
  author_name: string | null;
  categories: NewsCategory[];
}

export async function listAllNews(
  options: {
    status?: string;
    categoryId?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{ news: AdminNewsItem[]; total: number }> {
  const supabase = await createClient();
  const { status, categoryId, page = 1, pageSize = 50 } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('news')
    .select(
      `id, title, slug, summary, status, is_featured, view_count,
       published_at, created_at,
       profiles!inner ( display_name, email ),
       news_categories ( category_id, categories ( id, name, slug ) )`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (categoryId) query = query.eq('news_categories.category_id', categoryId);

  const { data, count } = await query.range(from, to);

  const news: AdminNewsItem[] = (data ?? []).map((item: any) => {
    const profile = Array.isArray(item.profiles)
      ? item.profiles[0]
      : item.profiles;
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      status: item.status,
      is_featured: item.is_featured,
      view_count: item.view_count,
      published_at: item.published_at,
      created_at: item.created_at,
      author_name: profile?.display_name || profile?.email || null,
      categories: (item.news_categories ?? [])
        .map((nc: any) => nc.categories)
        .filter(Boolean),
    };
  });

  return { news, total: count ?? 0 };
}
