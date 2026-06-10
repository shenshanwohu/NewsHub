'use client';

import { useState, useRef, useEffect } from 'react';
import type { NewsCategory } from '@/lib/actions/news';

interface CategoryMultiSelectProps {
  categories: NewsCategory[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function CategoryMultiSelect({
  categories,
  selected,
  onChange,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next);
  };

  const selectedLabels = categories
    .filter((c) => selected.includes(c.id))
    .map((c) => c.name);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-700">分类</label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-1 flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-left text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {selectedLabels.length === 0 ? (
          <span className="text-slate-400">选择分类...</span>
        ) : (
          selectedLabels.map((name) => (
            <span
              key={name}
              className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
            >
              {name}
            </span>
          ))
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {categories.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">暂无分类</p>
          ) : (
            categories.map((cat) => (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(cat.id)}
                  onChange={() => toggle(cat.id)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {cat.name}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
