'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createNews, updateNews } from '@/lib/actions/admin-news';
import type { NewsCategory } from '@/lib/actions/news';
import { CategoryMultiSelect } from './CategoryMultiSelect';
import { SEOFields } from './SEOFields';
import { RichTextEditor } from '@/components/editor/RichTextEditor';

// ──────────────────────────────────────────────
// 类型
// ──────────────────────────────────────────────

export interface NewsFormInitialData {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_image_url: string | null;
  status: string;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  category_ids: string[];
}

interface NewsFormProps {
  categories: NewsCategory[];
  initialData?: NewsFormInitialData;
}

// ──────────────────────────────────────────────
// NewsForm
// ──────────────────────────────────────────────

export function NewsForm({ categories, initialData }: NewsFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url ?? '',
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.category_ids ?? [],
  );
  const [isFeatured, setIsFeatured] = useState(
    initialData?.is_featured ?? false,
  );
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title ?? '');
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seo_description ?? '',
  );
  const [seoOgImage, setSeoOgImage] = useState(initialData?.seo_og_image ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeoChange = useCallback(
    (field: 'seoTitle' | 'seoDescription' | 'seoOgImage', value: string) => {
      if (field === 'seoTitle') setSeoTitle(value);
      if (field === 'seoDescription') setSeoDescription(value);
      if (field === 'seoOgImage') setSeoOgImage(value);
    },
    [],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) {
      setError('请输入新闻标题');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      summary: summary.trim() || null,
      content: content || '<p>内容编辑中...</p>',
      cover_image_url: coverImageUrl.trim() || null,
      category_ids: selectedCategories,
      is_featured: isFeatured,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      seo_og_image: seoOgImage.trim() || null,
    };

    try {
      if (isEdit && initialData) {
        await updateNews({ ...payload, id: initialData.id });
        router.refresh();
      } else {
        const result = await createNews(payload);
        router.push(`/admin/news/${result.id}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || (isEdit ? '保存失败' : '创建失败'));
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 标题 */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入新闻标题"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* 摘要 */}
      <div>
        <label className="block text-sm font-medium text-slate-700">摘要</label>
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="新闻摘要（可选）"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* 封面图 */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          封面图 URL
        </label>
        <input
          type="url"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {coverImageUrl && (
          <Image
            src={coverImageUrl}
            alt="封面预览"
            width={224}
            height={128}
            className="mt-2 h-32 w-56 rounded-lg object-cover"
          />
        )}
      </div>

      {/* 正文 */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          正文 <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="开始撰写新闻内容..."
        />
      </div>

      {/* 分类多选 */}
      <CategoryMultiSelect
        categories={categories}
        selected={selectedCategories}
        onChange={setSelectedCategories}
      />

      {/* 置顶开关 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is-featured"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <label
          htmlFor="is-featured"
          className="text-sm font-medium text-slate-700"
        >
          置顶此新闻
        </label>
      </div>

      {/* SEO 字段 */}
      <SEOFields
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        seoOgImage={seoOgImage}
        onChange={handleSeoChange}
      />

      {/* 提交按钮 */}
      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? isEdit
              ? '保存中...'
              : '创建中...'
            : isEdit
              ? '保存草稿'
              : '创建新闻'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}
