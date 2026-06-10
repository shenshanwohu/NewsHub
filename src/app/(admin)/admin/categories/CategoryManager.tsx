'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryTree } from '@/components/admin/CategoryTree';
import { CategoryForm } from '@/components/admin/CategoryForm';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryTree,
} from '@/lib/actions/categories';
import type { CategoryTreeNode, CategoryItem } from '@/lib/actions/categories';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/lib/actions/categories';

// ──────────────────────────────────────────────
// CategoryManager — 客户端分类管理容器
// ──────────────────────────────────────────────

interface CategoryManagerProps {
  tree: CategoryTreeNode[];
  allCategories: CategoryItem[];
}

export function CategoryManager({
  tree: initialTree,
  allCategories: initialAll,
}: CategoryManagerProps) {
  const router = useRouter();
  const [tree, setTree] = useState(initialTree);
  const [allCategories, setAllCategories] = useState(initialAll);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 刷新数据
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [newTree, newAll] = await Promise.all([
        getCategoryTree(),
        getCategories(),
      ]);
      setTree(newTree);
      setAllCategories(newAll);
      router.refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [router]);

  // 保存（创建或更新）
  const handleSave = useCallback(
    async (input: CreateCategoryInput | UpdateCategoryInput) => {
      if (editingId) {
        const result = await updateCategory(
          editingId,
          input as UpdateCategoryInput,
        );
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await createCategory(input as CreateCategoryInput);
        if (!result.success) throw new Error(result.error);
      }
      await refresh();
      setShowForm(false);
      setEditingId(null);
    },
    [editingId, refresh],
  );

  // 打开编辑
  const handleEdit = useCallback((id: string) => {
    setEditingId(id);
    setShowForm(true);
  }, []);

  // 打开创建
  const handleAdd = useCallback(() => {
    setEditingId(null);
    setShowForm(true);
  }, []);

  // 删除
  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`确定要删除分类「${name}」吗？\n此操作不可撤销。`)) return;

      const result = await deleteCategory(id);
      if (!result.success) {
        alert(result.error);
        return;
      }

      await refresh();
    },
    [refresh],
  );

  // 当前编辑的分类数据
  const editingCategory = editingId
    ? (allCategories.find((c) => c.id === editingId) ?? null)
    : null;

  return (
    <div>
      {/* 操作栏 */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + 新建分类
        </button>
        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* 分类树 */}
      <CategoryTree nodes={tree} onEdit={handleEdit} onDelete={handleDelete} />

      {/* 提示 */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-xs font-semibold uppercase text-slate-500">
          分类管理说明
        </h4>
        <ul className="mt-2 space-y-1 text-xs text-slate-500">
          <li>• 分类最大支持 3 层嵌套</li>
          <li>• 禁用后的分类在前台不可见，但已有新闻不受影响</li>
          <li>• 删除分类前需清空关联新闻和子分类</li>
        </ul>
      </div>

      {/* 创建/编辑表单模态框 */}
      {showForm && (
        <CategoryForm
          allCategories={allCategories}
          initialData={editingCategory}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
