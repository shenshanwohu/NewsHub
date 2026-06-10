'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole, requireAuth } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/types/common';
import type { ActionResponse } from '@/lib/types/common';

// ──────────────────────────────────────────────
// 管理端：切换置顶状态（Publisher / Super Admin）
// ──────────────────────────────────────────────

export async function toggleFeatured(
  newsId: string,
): Promise<{ is_featured: boolean }> {
  await requireRole('publisher', 'super_admin');

  const supabase = await createClient();

  const { data: current } = await supabase
    .from('news')
    .select('is_featured')
    .eq('id', newsId)
    .single();

  if (!current) throw new Error('新闻不存在');

  const newValue = !current.is_featured;

  await supabase
    .from('news')
    .update({ is_featured: newValue })
    .eq('id', newsId);

  return { is_featured: newValue };
}

// ──────────────────────────────────────────────
// 管理端：更新新闻状态（发布/下架）
// ──────────────────────────────────────────────

export async function updateNewsStatus(
  newsId: string,
  status: 'draft' | 'published' | 'archived',
): Promise<void> {
  await requireRole('publisher', 'super_admin');

  const supabase = await createClient();

  const updates: Record<string, any> = { status };
  if (status === 'published') {
    updates.published_at = new Date().toISOString();
  }

  await supabase.from('news').update(updates).eq('id', newsId);
}

// ──────────────────────────────────────────────
// 管理端：创建新闻（Editor / Publisher / Super Admin）
// ──────────────────────────────────────────────

export interface CreateNewsInput {
  title: string;
  summary?: string | null;
  content: string;
  cover_image_url?: string | null;
  category_ids: string[];
  is_featured: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_og_image?: string | null;
}

export async function createNews(
  input: CreateNewsInput,
): Promise<{ id: string }> {
  const profile = await requireRole('editor', 'publisher', 'super_admin');

  const supabase = await createClient();

  const slug = await generateUniqueSlug(input.title, supabase);

  // Editor 不能设置置顶
  const isFeatured = profile.role === 'editor' ? false : input.is_featured;

  const { data: news, error } = await supabase
    .from('news')
    .insert({
      title: input.title,
      slug,
      summary: input.summary || null,
      content: input.content,
      cover_image_url: input.cover_image_url || null,
      author_id: profile.id,
      is_featured: isFeatured,
      seo_title: input.seo_title || null,
      seo_description: input.seo_description || null,
      seo_og_image: input.seo_og_image || null,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !news) throw new Error('创建新闻失败');

  if (input.category_ids.length > 0) {
    const { error: catError } = await supabase.from('news_categories').insert(
      input.category_ids.map((category_id) => ({
        news_id: news.id,
        category_id,
      })),
    );
    if (catError) {
      await supabase.from('news').delete().eq('id', news.id);
      throw new Error('分类关联失败');
    }
  }

  return { id: news.id };
}

// ──────────────────────────────────────────────
// 管理端：更新新闻（保存草稿）
// Editor：仅可编辑自己的草稿
// Publisher / Super Admin：可编辑任意新闻
// ──────────────────────────────────────────────

export interface UpdateNewsInput extends CreateNewsInput {
  id: string;
}

export async function updateNews(input: UpdateNewsInput): Promise<void> {
  const profile = await requireRole('editor', 'publisher', 'super_admin');

  const supabase = await createClient();

  // Editor 只能编辑自己的草稿
  if (profile.role === 'editor') {
    const { data: existing } = await supabase
      .from('news')
      .select('author_id, status')
      .eq('id', input.id)
      .single();

    if (!existing) throw new Error('新闻不存在');
    if (existing.author_id !== profile.id)
      throw new Error('无权编辑他人的新闻');
    if (existing.status !== 'draft')
      throw new Error('无权编辑已发布或已归档的新闻');
  }

  // Editor 不能设置置顶
  const isFeatured = profile.role === 'editor' ? undefined : input.is_featured;

  const updateData: Record<string, any> = {
    title: input.title,
    summary: input.summary || null,
    content: input.content,
    cover_image_url: input.cover_image_url || null,
    seo_title: input.seo_title || null,
    seo_description: input.seo_description || null,
    seo_og_image: input.seo_og_image || null,
  };
  if (isFeatured !== undefined) updateData.is_featured = isFeatured;

  const { error } = await supabase
    .from('news')
    .update(updateData)
    .eq('id', input.id);

  if (error) throw new Error('保存失败');

  // 重新同步分类关联
  await supabase.from('news_categories').delete().eq('news_id', input.id);

  if (input.category_ids.length > 0) {
    const { error: catError } = await supabase.from('news_categories').insert(
      input.category_ids.map((category_id) => ({
        news_id: input.id,
        category_id,
      })),
    );
    if (catError) throw new Error('分类同步失败');
  }
}

// ──────────────────────────────────────────────
// 管理端：发布 / 下架（Publisher / Super Admin）
// ──────────────────────────────────────────────

export async function publishNews(newsId: string): Promise<void> {
  await requireRole('publisher', 'super_admin');
  await updateNewsStatus(newsId, 'published');
}

export async function unpublishNews(newsId: string): Promise<void> {
  await requireRole('publisher', 'super_admin');
  await updateNewsStatus(newsId, 'draft');
}

// ──────────────────────────────────────────────
// 管理端：删除新闻（Super Admin 可删任意；
// Editor 仅可删除自己的草稿）
// ──────────────────────────────────────────────

export async function deleteNews(
  newsId: string,
): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // 先获取用户信息
  const { profile } = await requireAuth();

  // 获取新闻
  const { data: news } = await supabase
    .from('news')
    .select('author_id, status')
    .eq('id', newsId)
    .single();

  if (!news) {
    return errorResponse('新闻不存在');
  }

  // 权限检查
  const isSuperAdmin = profile.role === 'super_admin';
  const isOwner = news.author_id === profile.id;
  const isDraft = news.status === 'draft';

  if (!isSuperAdmin && !(isOwner && isDraft)) {
    return errorResponse('无权删除此新闻');
  }

  const { error } = await supabase.from('news').delete().eq('id', newsId);

  if (error) {
    return errorResponse('删除失败');
  }

  return successResponse(undefined);
}

// ──────────────────────────────────────────────
// 管理端：按 ID 获取新闻（含分类）
// ──────────────────────────────────────────────

export async function getNewsById(newsId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('news')
    .select(
      `id, title, slug, summary, content, cover_image_url, status,
       author_id, is_featured, view_count,
       seo_title, seo_description, seo_og_image,
       published_at, created_at,
       news_categories ( category_id, categories ( id, name, slug ) )`,
    )
    .eq('id', newsId)
    .single();

  if (!data) return null;

  const item = data as any;
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    content: item.content,
    cover_image_url: item.cover_image_url,
    status: item.status,
    author_id: item.author_id,
    is_featured: item.is_featured,
    view_count: item.view_count,
    seo_title: item.seo_title,
    seo_description: item.seo_description,
    seo_og_image: item.seo_og_image,
    published_at: item.published_at,
    created_at: item.created_at,
    category_ids: (item.news_categories ?? [])
      .map((nc: any) => nc.category_id)
      .filter(Boolean),
  };
}

// ──────────────────────────────────────────────
// 生成唯一 slug
// ──────────────────────────────────────────────

async function generateUniqueSlug(
  title: string,
  supabase: any,
): Promise<string> {
  let slug = title
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  if (!slug) slug = 'post';

  const { data: existing } = await supabase
    .from('news')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();

  if (!existing) return slug;

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${suffix}`;
}
