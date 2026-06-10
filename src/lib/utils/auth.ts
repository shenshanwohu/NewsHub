import { createClient } from '@/lib/supabase/server';
import { AuthenticationError, AuthorizationError } from '@/lib/utils/errors';
import type { AdminRole, AuthResult } from '@/lib/types/common';
import type { Profile } from '@/lib/types/common';

// ──────────────────────────────────────────────
// requireAuth — 验证当前请求已认证，返回 user + profile
// 使用位置: Server Action / RSC
// 失败时抛出 AuthenticationError
// ──────────────────────────────────────────────

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError('UNAUTHORIZED');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (!profile) {
    throw new AuthenticationError('PROFILE_NOT_FOUND');
  }

  if (!profile.is_active) {
    throw new AuthenticationError('USER_DISABLED');
  }

  return { user, profile: profile as Profile };
}

// ──────────────────────────────────────────────
// requireRole — 验证当前用户拥有指定角色之一
// 使用位置: Server Action
// 失败时抛出 AuthorizationError
// ──────────────────────────────────────────────

export async function requireRole(...roles: AdminRole[]): Promise<Profile> {
  const { profile } = await requireAuth();

  if (!roles.includes(profile.role)) {
    throw new AuthorizationError();
  }

  return profile;
}

// ──────────────────────────────────────────────
// getCurrentUser — 获取当前 Supabase Auth 用户
// 使用位置: RSC / Server Action
// 失败时返回 null（不抛异常）
// ──────────────────────────────────────────────

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

// ──────────────────────────────────────────────
// getCurrentProfile — 获取当前用户的 profiles 记录
// 使用位置: RSC / Server Action
// 失败时返回 null（不抛异常）
// ──────────────────────────────────────────────

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) return null;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  return profile as Profile | null;
}
