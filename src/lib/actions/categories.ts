'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/types/common';
import type { ActionResponse } from '@/lib/types/common';

// ──────────────────────────────────────────────
// 类型
// ──────────────────────────────────────────────

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryTreeNode extends CategoryItem {
  children: CategoryTreeNode[];
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  sort_order?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

// ──────────────────────────────────────────────
// getCategories — 获取全部分类（扁平列表）
// 管理员可见全部（含未启用），用于下拉选择等场景
// ──────────────────────────────────────────────

export async function getCategories(): Promise<CategoryItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return (data ?? []) as CategoryItem[];
}

// ──────────────────────────────────────────────
// getCategoryTree — 获取树形分类
// ──────────────────────────────────────────────

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const all = await getCategories();
  return buildTree(all);
}

function buildTree(items: CategoryItem[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ──────────────────────────────────────────────
// createCategory — 创建分类（仅 super_admin）
// ──────────────────────────────────────────────

export async function createCategory(
  input: CreateCategoryInput,
): Promise<ActionResponse<CategoryItem>> {
  try {
    await requireRole('super_admin');
  } catch {
    return errorResponse('无权限');
  }

  const supabase = await createClient();

  const slug = input.slug
    .toLowerCase()
    .replace(/[^\w一-鿿-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  if (!slug) {
    return errorResponse('slug 不能为空');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name,
      slug,
      description: input.description || null,
      parent_id: input.parent_id || null,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return errorResponse('slug 已被使用');
    }
    return errorResponse('创建分类失败');
  }

  return successResponse(data as CategoryItem);
}

// ──────────────────────────────────────────────
// updateCategory — 更新分类（仅 super_admin）
// ──────────────────────────────────────────────

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<ActionResponse<CategoryItem>> {
  try {
    await requireRole('super_admin');
  } catch {
    return errorResponse('无权限');
  }

  const supabase = await createClient();

  const updates: Record<string, any> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.description !== undefined) updates.description = input.description;
  if (input.parent_id !== undefined) updates.parent_id = input.parent_id;
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order;
  if (input.is_active !== undefined) updates.is_active = input.is_active;

  if (Object.keys(updates).length === 0) {
    return errorResponse('没有要更新的字段');
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return errorResponse('slug 已被使用');
    }
    return errorResponse('更新分类失败');
  }

  return successResponse(data as CategoryItem);
}

// ──────────────────────────────────────────────
// deleteCategory — 删除分类（仅 super_admin）
// 若分类下有关联新闻或子分类则拒绝
// ──────────────────────────────────────────────

export async function deleteCategory(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requireRole('super_admin');
  } catch {
    return errorResponse('无权限');
  }

  const supabase = await createClient();

  // 检查是否有子分类
  const { count: childCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', id);

  if (childCount && childCount > 0) {
    return errorResponse('该分类下有子分类，无法删除');
  }

  // 检查是否有关联新闻
  const { count: newsCount } = await supabase
    .from('news_categories')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);

  if (newsCount && newsCount > 0) {
    return errorResponse('该分类下有关联新闻，无法删除');
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    return errorResponse('删除分类失败');
  }

  return successResponse(undefined);
}
