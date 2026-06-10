'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { twMerge } from 'tailwind-merge';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath = '/',
  className,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const qs = params.toString();
    const href = qs ? `${basePath}?${qs}` : basePath;
    router.push(href);
  }

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      className={twMerge('flex items-center justify-center gap-1', className)}
      aria-label="分页导航"
    >
      <PageButton
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
        aria-label="上一页"
      >
        &larr;
      </PageButton>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400">
            ...
          </span>
        ) : (
          <PageButton
            key={p}
            active={p === currentPage}
            onClick={() => goToPage(p as number)}
          >
            {p}
          </PageButton>
        ),
      )}

      <PageButton
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
        aria-label="下一页"
      >
        &rarr;
      </PageButton>
    </nav>
  );
}

// ──────────────────────────────────────────────
// PageButton
// ──────────────────────────────────────────────

function PageButton({
  children,
  active,
  disabled,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  [key: string]: any;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className={twMerge(
        'flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
        active
          ? 'bg-brand-600 text-white'
          : 'text-slate-600 hover:bg-slate-100',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {children}
    </button>
  );
}

// ──────────────────────────────────────────────
// 页码生成
// ──────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}
