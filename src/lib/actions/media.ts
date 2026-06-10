'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/types/common';
import type { ActionResponse } from '@/lib/types/common';

// ──────────────────────────────────────────────
// 类型
// ──────────────────────────────────────────────

export interface MediaItem {
  id: string;
  filename: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface MediaListResult {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ──────────────────────────────────────────────
// listMedia — 分页获取媒体列表
// ──────────────────────────────────────────────

export async function listMedia(
  page: number = 1,
  pageSize: number = 20,
): Promise<MediaListResult> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { count: total } = await supabase
    .from('media')
    .select('*', { count: 'exact', head: true })
    .order('created_at', { ascending: false });

  const { data } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  return {
    items: (data ?? []) as MediaItem[],
    total: total ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((total ?? 0) / pageSize),
  };
}

// ──────────────────────────────────────────────
// uploadMedia — 上传图片到 Supabase Storage
// ──────────────────────────────────────────────

export async function uploadMedia(
  formData: FormData,
): Promise<ActionResponse<MediaItem>> {
  try {
    await requireRole('editor', 'publisher', 'super_admin');
  } catch {
    return errorResponse('无权限');
  }

  const supabase = await createClient();

  // 获取当前用户 profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse('未登录');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  if (!profile) return errorResponse('profile 未找到');

  const file = formData.get('file') as File | null;
  const bucket = (formData.get('bucket') as string) || 'article-images';

  if (!file) return errorResponse('未选择文件');

  // 校验文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return errorResponse('不支持的文件类型，仅允许 JPEG/PNG/WebP/GIF');
  }

  // 校验文件大小（5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return errorResponse('文件大小不能超过 5MB');
  }

  // 校验 bucket 名称
  if (!['news-covers', 'article-images'].includes(bucket)) {
    return errorResponse('无效的存储桶');
  }

  // 生成存储路径
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const safeFilename = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.一-鿿_-]/g, '-')
    .slice(0, 60);
  const storagePath = `${bucket}/${profile.id.slice(0, 8)}/${timestamp}-${safeFilename}`;

  // 上传到 Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return errorResponse(`上传失败: ${uploadError.message}`);
  }

  // 获取公开 URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);
  const publicUrl = urlData?.publicUrl || '';

  // 获取图片尺寸（可选）
  let width: number | null = null;
  let height: number | null = null;

  // 创建 media 记录
  const { data: mediaRecord, error: dbError } = await supabase
    .from('media')
    .insert({
      filename: file.name,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: file.type,
      file_size: file.size,
      width,
      height,
      uploaded_by: profile.id,
    })
    .select()
    .single();

  if (dbError) {
    // 回滚：删除已上传的文件
    await supabase.storage.from(bucket).remove([storagePath]);
    return errorResponse('创建媒体记录失败');
  }

  return successResponse(mediaRecord as MediaItem);
}

// ──────────────────────────────────────────────
// deleteMedia — 删除媒体文件
// ──────────────────────────────────────────────

export async function deleteMedia(id: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  try {
    await requireRole('editor', 'publisher', 'super_admin');
  } catch {
    return errorResponse('无权限');
  }

  // 获取媒体记录
  const { data: media, error: fetchError } = await supabase
    .from('media')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !media) {
    return errorResponse('媒体记录未找到');
  }

  // 权限检查：非 super_admin 只能删除自己的文件
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse('未登录');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_id', user.id)
    .single();

  const isOwner = profile?.id === media.uploaded_by;
  const isSuperAdmin = profile?.role === 'super_admin';

  if (!isOwner && !isSuperAdmin) {
    return errorResponse('只能删除自己的文件');
  }

  // 从 Storage 删除
  const bucket = media.storage_path.startsWith('news-covers/')
    ? 'news-covers'
    : 'article-images';
  const storagePath = media.storage_path.replace(`${bucket}/`, '');

  const { error: storageError } = await supabase.storage
    .from(bucket)
    .remove([media.storage_path]);

  if (storageError) {
    // Storage 删除失败仍继续删除数据库记录
    console.warn('Storage delete failed:', storageError.message);
  }

  // 删除数据库记录
  const { error: dbError } = await supabase.from('media').delete().eq('id', id);

  if (dbError) {
    return errorResponse('删除记录失败');
  }

  return successResponse(undefined);
}
