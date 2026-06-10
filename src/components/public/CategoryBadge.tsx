import Link from 'next/link';

interface CategoryBadgeProps {
  name: string;
  slug: string;
}

export function CategoryBadge({ name, slug }: CategoryBadgeProps) {
  return (
    <Link
      href={`/category/${slug}`}
      className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
    >
      {name}
    </Link>
  );
}
