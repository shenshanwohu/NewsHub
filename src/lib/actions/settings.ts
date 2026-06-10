'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/types/common';
import { SETTING_DEFINITIONS } from '@/lib/constants/settings';
import type { ActionResponse } from '@/lib/types/common';

// ──────────────────────────────────────────────
// 类型
// ──────────────────────────────────────────────

export interface SettingItem {
  id: string;
  key: string;
  value: Record<string, any>;
  description: string | null;
  updated_at: string;
}

export interface SettingsMap {
  [key: string]: any;
}

// ──────────────────────────────────────────────
// getSettings — 获取全部系统配置
// ──────────────────────────────────────────────

export async function getSettings(): Promise<SettingsMap> {
  const supabase = await createClient();

  const { data } = await supabase.from('settings').select('key, value');

  const map: SettingsMap = {};

  // 先用默认值填充
  for (const def of SETTING_DEFINITIONS) {
    map[def.key] = def.defaultValue;
  }

  // 用数据库中的值覆盖
  if (data) {
    for (const row of data) {
      map[row.key] = row.value;
    }
  }

  return map;
}

// ──────────────────────────────────────────────
// updateSetting — 更新单个系统配置（仅 super_admin）
// ──────────────────────────────────────────────

export async function updateSetting(
  key: string,
  value: any,
): Promise<ActionResponse<void>> {
  try {
    await requireRole('super_admin');
  } catch {
    return errorResponse('无权限');
  }

  // 验证 key 是否在预定义列表中
  const def = SETTING_DEFINITIONS.find((d) => d.key === key);
  if (!def) {
    return errorResponse(`未知配置项: ${key}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.from('settings').upsert(
    {
      key,
      value,
    },
    { onConflict: 'key' },
  );

  if (error) {
    return errorResponse('保存配置失败');
  }

  return successResponse(undefined);
}

// ──────────────────────────────────────────────
// getSetting — 读取单个配置（公开，供前台使用）
// ──────────────────────────────────────────────

export async function getSetting(key: string): Promise<any> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (data) return data.value;

  // 返回默认值
  const def = SETTING_DEFINITIONS.find((d) => d.key === key);
  return def?.defaultValue ?? null;
}
