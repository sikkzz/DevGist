import Link from 'next/link';

import { TOPIC_LABELS, TOPICS } from '@/lib/article-types';

/** 전체 + 주제별 필터 탭. URL 쿼리(?topic=)로 상태 유지 (ADR-0008). */
export function TopicTabs({ active }: { active?: string }) {
  const tabs = [
    { key: undefined as string | undefined, label: '전체' },
    ...TOPICS.map((t) => ({ key: t, label: TOPIC_LABELS[t] ?? t })),
  ];

  return (
    <nav className="mb-2 flex flex-wrap gap-1 border-b border-zinc-200 pb-1 dark:border-zinc-800">
      {tabs.map((t) => {
        const isActive = (active ?? undefined) === t.key;
        return (
          <Link
            key={t.key ?? 'all'}
            href={t.key ? `/?topic=${t.key}` : '/'}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              isActive
                ? 'bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
