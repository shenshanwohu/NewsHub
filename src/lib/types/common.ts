import type { User } from '@supabase/supabase-js';

// ──────────────────────────────────
// 管理员角色
// ──────────────────────────────────

export type AdminRole = 'super_admin' | 'publisher' | 'editor';

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin' as const,
  PUBLISHER: 'publisher' as const,
  EDITOR: 'editor' as const,
} as const;

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: '超级管理员',
  publisher: '发布者',
  editor: '编辑',
};

// ──────────────────────────────────
// 新闻状态
// ──────────────────────────────────

export type NewsStatus = 'draft' | 'published' | 'archived';

export const NEWS_STATUS = {
  DRAFT: 'draft' as const,
  PUBLISHED: 'published' as const,
  ARCHIVED: 'archived' as const,
} as const;

export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

// ──────────────────────────────────
// Server Action 统一响应
// ──────────────────────────────────

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export function successResponse<T>(data: T): ActionResponse<T> {
  return { success: true, data };
}

export function errorResponse(error: string): ActionResponse<never> {
  return { success: false, error };
}

// ──────────────────────────────────
// Profile 类型
// ──────────────────────────────────

export interface Profile {
  id: string;
  auth_id: string;
  email: string;
  display_name: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────
// Auth 结果类型
// ──────────────────────────────────

export type AuthResult = {
  user: User;
  profile: Profile;
};
