'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils/auth';
import { ADMIN_ROLE_LABELS } from '@/lib/types/common';
import type { Profile } from '@/lib/types/common';

// ──────────────────────────────────────────────
// 类型
// ──────────────────────────────────────────────

export interface ProfileWithRoleLabel extends Profile {
  role_label: string;
}

// ──────────────────────────────────────────────
// getMyProfile — 获取当前用户的完整 profile
// ──────────────────────────────────────────────

export async function getMyProfile(): Promise<ProfileWithRoleLabel | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (!profile) return null;

  return {
    ...(profile as Profile),
    role_label:
      ADMIN_ROLE_LABELS[profile.role as keyof typeof ADMIN_ROLE_LABELS] ||
      profile.role,
  };
}

// ──────────────────────────────────────────────
// updateMyProfile — 更新个人资料
// 目前仅允许修改 display_name
// ──────────────────────────────────────────────

export async function updateMyProfile(input: {
  display_name?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();
  } catch {
    return { success: false, error: '未登录' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: '未登录' };

  const updates: Record<string, any> = {};
  if (input.display_name !== undefined) {
    updates.display_name = input.display_name.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: '没有要更新的字段' };
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('auth_id', user.id);

  if (error) {
    return { success: false, error: '更新失败' };
  }

  return { success: true };
}
