'use client';

import { useState } from 'react';
import type { CategoryTreeNode } from '@/lib/actions/categories';

// ──────────────────────────────────────────────
// CategoryTree — 递归展示分类树
// ──────────────────────────────────────────────

interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function CategoryTree({ nodes, onEdit, onDelete }: CategoryTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-400">暂无分类</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// TreeNode — 单个分类节点
// ──────────────────────────────────────────────

interface TreeNodeProps {
  node: CategoryTreeNode;
  depth: number;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

function TreeNode({ node, depth, onEdit, onDelete }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50"
        style={{ marginLeft: `${depth * 24}px` }}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <span className="inline-block w-5" />
        )}

        {/* 名称 + slug */}
        <div className="min-w-0 flex-1">
          <span
            className={`text-sm font-medium ${node.is_active ? 'text-slate-900' : 'text-slate-400 line-through'}`}
          >
            {node.name}
          </span>
          <span className="ml-2 text-xs text-slate-400">/{node.slug}</span>
        </div>

        {/* 排序号 */}
        <span className="text-xs text-slate-400">排序: {node.sort_order}</span>

        {/* 状态标签 */}
        {!node.is_active && (
          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            已禁用
          </span>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(node.id)}
            className="rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => onDelete(node.id, node.name)}
            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            删除
          </button>
        </div>
      </div>

      {/* 子分类 */}
      {hasChildren && expanded && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
