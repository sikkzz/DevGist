import Link from 'next/link';

import { homeHref, type SortMode } from '@/lib/article-types';

/** 추천순(개인화) ↔ 최신순 토글. 현재 topic은 보존 (ADR-0009). */
export function SortToggle({ topic, active }: { topic?: string; active: SortMode }) {
  const options: { key: SortMode; label: string }[] = [
    { key: 'recommended', label: '추천순' },
    { key: 'latest', label: '최신순' },
  ];

  return (
    <div className="mb-3 flex justify-end gap-1 text-sm">
      {options.map((o) => (
        <Link
          key={o.key}
          href={homeHref(topic, o.key)}
          className={
            active === o.key
              ? 'font-semibold text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
