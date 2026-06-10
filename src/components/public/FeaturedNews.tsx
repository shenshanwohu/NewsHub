import Link from 'next/link';
import Image from 'next/image';
import type { NewsItem } from '@/lib/actions/news';

interface FeaturedNewsProps {
  items: NewsItem[];
}

export function FeaturedNews({ items }: FeaturedNewsProps) {
  if (items.length === 0) return null;

  // 取第一条作为主推
  const primary = items[0];
  if (!primary) return null;
  const rest = items.slice(1, 4);

  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center gap-2">
        <span className="inline-block rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
          置顶
        </span>
        <h2 className="text-xl font-bold text-slate-900">精选新闻</h2>
      </div>

      <div className="space-y-6">
        {/* 主推新闻 — 大图 */}
        <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md md:flex">
          <Link
            href={`/news/${primary.slug}`}
            className="block overflow-hidden md:w-3/5"
          >
            {primary.cover_image_url ? (
              <Image
                src={primary.cover_image_url}
                alt={primary.title}
                width={600}
                height={338}
                className="aspect-[16/9] h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex aspect-[16/9] h-full w-full items-center justify-center bg-slate-100">
                <span className="text-6xl font-bold text-slate-300">
                  {primary.title[0]}
                </span>
              </div>
            )}
          </Link>

          <div className="flex flex-1 flex-col justify-center p-6">
            <div className="mb-3 flex flex-wrap gap-2">
              {primary.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            <h3 className="mb-3 text-2xl font-bold text-slate-900 transition-colors group-hover:text-brand-600">
              <Link href={`/news/${primary.slug}`}>{primary.title}</Link>
            </h3>

            {primary.summary && (
              <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
                {primary.summary}
              </p>
            )}

            <time className="text-xs text-slate-400">
              {formatDate(primary.published_at!)}
            </time>
          </div>
        </article>

        {/* 其余置顶 — 三列网格 */}
        {rest.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <FeaturedMiniCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────
// FeaturedMiniCard — 次要置顶卡片
// ──────────────────────────────────────────────

function FeaturedMiniCard({ item }: { item: NewsItem }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
      <Link
        href={`/news/${item.slug}`}
        className="block overflow-hidden"
      >
        {item.cover_image_url ? (
          <Image
            src={item.cover_image_url}
            alt={item.title}
            width={400}
            height={225}
            className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-slate-100">
            <span className="text-3xl font-bold text-slate-300">
              {item.title[0]}
            </span>
          </div>
        )}
      </Link>

      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-brand-600">
          <Link href={`/news/${item.slug}`}>{item.title}</Link>
        </h3>

        <time className="text-xs text-slate-400">
          {formatDate(item.published_at!)}
        </time>
      </div>
    </article>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${Math.max(diffMinutes, 1)} 分钟前`;
    }
    return `${diffHours} 小时前`;
  }

  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
