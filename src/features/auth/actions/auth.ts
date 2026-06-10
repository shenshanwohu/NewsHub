'use server';

import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/common';

// ──────────────────────────────────────────────
// getCurrentUser — 获取当前 Supabase Auth 用户
// 由 Client Component 通过 Server Action 调用
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
// ──────────────────────────────────────────────

export async function getCurrentProfile() {
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

  return profile as Profile | null;
}
