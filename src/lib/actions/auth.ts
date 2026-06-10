'use server';

import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/types/common';
import type { ActionResponse } from '@/lib/types/common';
import type { User } from '@supabase/supabase-js';

// ──────────────────────────────────────────────
// login — 邮箱密码登录
// ──────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
): Promise<ActionResponse<{ user: User }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return errorResponse('邮箱或密码错误');
  }

  // 使用独立连接查询 profiles（避免 RLS cookie 未刷新问题）
  const { createClient: createDbClient } =
    await import('@/lib/supabase/server');
  const dbClient = await createDbClient();

  const { data: profile } = await dbClient
    .from('profiles')
    .select('is_active')
    .eq('auth_id', data.user.id)
    .maybeSingle();

  if (!profile) {
    // 首次登录时 profile 可能还未完全创建，允许通过
    // 实际 profile 检查在 AdminLayout 中执行
    return successResponse({ user: data.user });
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return errorResponse('账号已被禁用');
  }

  return successResponse({ user: data.user });
}

// ──────────────────────────────────────────────
// logout — 退出登录
// ──────────────────────────────────────────────

export async function logout(): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return errorResponse('退出登录失败');
  }

  return successResponse(undefined);
}
