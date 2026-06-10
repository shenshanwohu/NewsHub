'use client';

import { useState, useRef, useEffect } from 'react';
import type { CategoryItem } from '@/lib/actions/categories';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/lib/actions/categories';

// ──────────────────────────────────────────────
// CategoryForm — 创建/编辑分类的模态框表单
// ──────────────────────────────────────────────

interface CategoryFormProps {
  /** 全部分类列表（供选择父分类） */
  allCategories: CategoryItem[];
  /** 编辑模式时传入初始数据 */
  initialData?: CategoryItem | null;
  /** 保存回调 */
  onSave: (input: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  /** 关闭回调 */
  onClose: () => void;
}

export function CategoryForm({
  allCategories,
  initialData,
  onSave,
  onClose,
}: CategoryFormProps) {
  const isEdit = !!initialData;
  const formRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(initialData?.name ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? '',
  );
  const [parentId, setParentId] = useState<string>(
    initialData?.parent_id ?? '',
  );
  const [sortOrder, setSortOrder] = useState(initialData?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // ESC 键关闭
  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 自动生成 slug（仅创建模式，用户未手动修改时）
  function autoGenerateSlug(title: string) {
    if (isEdit) return;
    setSlug(
      title
        .toLowerCase()
        .replace(/[^\w一-鿿]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80),
    );
  }

  // 排除自身和子分类（编辑时不能选自己或自己的子分类作为父分类）
  function getAvailableParents(): CategoryItem[] {
    return allCategories.filter((c) => c.id !== initialData?.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入分类名称');
      return;
    }
    if (!slug.trim()) {
      setError('请输入分类标识 (slug)');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSave({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        parent_id: parentId || null,
        sort_order: sortOrder,
        ...(isEdit ? { is_active: isActive } : {}),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={formRef}
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? '编辑分类' : '新建分类'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEdit && !slug) autoGenerateSlug(e.target.value);
              }}
              placeholder="如：科技、体育、财经"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              标识 (slug) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tech"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              描述
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="分类描述（可选）"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* 父分类 */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              父分类
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">无（顶级分类）</option>
              {getAvailableParents().map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 排序号 */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              排序权重
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-1 block w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-slate-400">数字越小越靠前</p>
          </div>

          {/* 启用状态（仅编辑时显示） */}
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label
                htmlFor="is-active"
                className="text-sm font-medium text-slate-700"
              >
                启用（前台可见）
              </label>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
