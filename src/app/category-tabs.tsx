import Link from 'next/link';

import { CATEGORY_LABELS } from '@/lib/article-types';

/** 전체 + 카테고리별 필터 탭. URL 쿼리(?category=)로 상태 유지. */
export function CategoryTabs({ categories, active }: { categories: string[]; active?: string }) {
  const tabs = [
    { key: undefined as string | undefined, label: '전체' },
    ...categories.map((c) => ({ key: c, label: CATEGORY_LABELS[c] ?? c })),
  ];

  return (
    <nav className="mb-2 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((t) => {
        const isActive = (active ?? undefined) === t.key;
        return (
          <Link
            key={t.key ?? 'all'}
            href={t.key ? `/?category=${t.key}` : '/'}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'border-zinc-900 font-semibold text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
