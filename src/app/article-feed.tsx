'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import {
  type ArticleCard,
  DEFAULT_SORT,
  PAGE_SIZE,
  type SortMode,
  TOPIC_LABELS,
  TOPICS,
} from '@/lib/article-types';

import { ArticleItem } from './article-item';
import { loadMoreArticles } from './articles-actions';

// (topic,sort)별 캐시 — 클라이언트에서 필터/정렬을 즉시 전환하고, 이미 본 조합은 재요청 없이 표시.
type CacheEntry = { items: ArticleCard[]; hasMore: boolean };
const keyOf = (topic: string | undefined, sort: SortMode) => `${topic ?? ''}|${sort}`;

export function ArticleFeed({
  initial,
  initialTopic,
  initialSort,
}: {
  initial: ArticleCard[];
  initialTopic?: string;
  initialSort: SortMode;
}) {
  const [topic, setTopic] = useState<string | undefined>(initialTopic);
  const [sort, setSort] = useState<SortMode>(initialSort);
  const [cache, setCache] = useState<Record<string, CacheEntry>>(() => ({
    [keyOf(initialTopic, initialSort)]: {
      items: initial,
      hasMore: initial.length === PAGE_SIZE,
    },
  }));
  const [, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const k = keyOf(topic, sort);
  const entry = cache[k]; // undefined면 아직 미로드 → 스켈레톤

  // 캐시에 없는 (topic,sort) → 첫 묶음 로드
  useEffect(() => {
    if (cache[k]) return;
    let cancelled = false;
    loadMoreArticles(0, topic, sort).then((items) => {
      if (cancelled) return;
      setCache((c) => ({ ...c, [k]: { items, hasMore: items.length === PAGE_SIZE } }));
    });
    return () => {
      cancelled = true;
    };
  }, [k, topic, sort, cache]);

  // URL 동기화 (서버 navigation 없이 — 공유/새로고침 대비)
  useEffect(() => {
    const qs = new URLSearchParams();
    if (topic) qs.set('topic', topic);
    if (sort !== DEFAULT_SORT) qs.set('sort', sort);
    const url = qs.toString() ? `/?${qs.toString()}` : '/';
    window.history.replaceState(null, '', url);
  }, [topic, sort]);

  // 무한 스크롤 — 현재 (topic,sort)에 이어 붙임
  useEffect(() => {
    if (!entry?.hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        startTransition(async () => {
          const cur = cache[k];
          if (!cur?.hasMore) return;
          const next = await loadMoreArticles(cur.items.length, topic, sort);
          setCache((c) => {
            const base = c[k] ?? { items: [], hasMore: true };
            return {
              ...c,
              [k]: { items: [...base.items, ...next], hasMore: next.length === PAGE_SIZE },
            };
          });
        });
      },
      { rootMargin: '400px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [k, entry?.hasMore, cache, topic, sort]);

  const tabs = [
    { key: undefined as string | undefined, label: '전체' },
    ...TOPICS.map((t) => ({ key: t, label: TOPIC_LABELS[t] ?? t })),
  ];
  const sorts: { key: SortMode; label: string }[] = [
    { key: 'recommended', label: '추천순' },
    { key: 'latest', label: '최신순' },
  ];

  const onTopic = useCallback((key: string | undefined) => setTopic(key), []);

  return (
    <>
      <nav className="mb-2 flex flex-wrap gap-1 border-b border-zinc-200 pb-1 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.key ?? 'all'}
            type="button"
            onClick={() => onTopic(t.key)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              (topic ?? undefined) === t.key
                ? 'bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mb-3 flex justify-end gap-2 text-sm">
        {sorts.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSort(s.key)}
            className={
              sort === s.key
                ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {!entry ? (
        <ListSkeleton />
      ) : entry.items.length === 0 ? (
        <p className="py-16 text-center text-zinc-500">
          {topic ? '이 주제에 글이 없습니다.' : '아직 수집된 글이 없습니다.'}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {entry.items.map((a) => (
              <ArticleItem key={a.id} article={a} />
            ))}
          </ul>
          {entry.hasMore ? (
            <div ref={sentinelRef} className="py-8 text-center text-sm text-zinc-400" />
          ) : (
            <p className="py-8 text-center text-sm text-zinc-400">— 끝 —</p>
          )}
        </>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <ul className="animate-pulse divide-y divide-zinc-200 dark:divide-zinc-800">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="py-4">
          <div className="h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-2 h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
        </li>
      ))}
    </ul>
  );
}
