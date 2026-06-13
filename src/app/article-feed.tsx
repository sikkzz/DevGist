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

// (topics,sort)별 캐시 — 클라이언트에서 필터/정렬을 즉시 전환하고, 이미 본 조합은 재요청 없이 표시.
type CacheEntry = { items: ArticleCard[]; hasMore: boolean };
const keyOf = (topics: string[], sort: SortMode) => `${[...topics].sort().join(',')}|${sort}`;

export function ArticleFeed({
  initial,
  initialTopics,
  initialSort,
}: {
  initial: ArticleCard[];
  initialTopics: string[];
  initialSort: SortMode;
}) {
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [sort, setSort] = useState<SortMode>(initialSort);
  const [cache, setCache] = useState<Record<string, CacheEntry>>(() => ({
    [keyOf(initialTopics, initialSort)]: {
      items: initial,
      hasMore: initial.length === PAGE_SIZE,
    },
  }));
  const [, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const k = keyOf(topics, sort);
  const entry = cache[k]; // undefined면 아직 미로드 → 스켈레톤

  // 캐시에 없는 (topics,sort) → 첫 묶음 로드
  useEffect(() => {
    if (cache[k]) return;
    let cancelled = false;
    loadMoreArticles(0, topics, sort).then((items) => {
      if (cancelled) return;
      setCache((c) => ({ ...c, [k]: { items, hasMore: items.length === PAGE_SIZE } }));
    });
    return () => {
      cancelled = true;
    };
  }, [k, topics, sort, cache]);

  // URL 동기화 (서버 navigation 없이 — 공유/새로고침 대비)
  useEffect(() => {
    const qs = new URLSearchParams();
    if (topics.length > 0) qs.set('topics', topics.join(','));
    if (sort !== DEFAULT_SORT) qs.set('sort', sort);
    const url = qs.toString() ? `/?${qs.toString()}` : '/';
    window.history.replaceState(null, '', url);
  }, [topics, sort]);

  // 무한 스크롤 — 현재 (topics,sort)에 이어 붙임
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
          const next = await loadMoreArticles(cur.items.length, topics, sort);
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
  }, [k, entry?.hasMore, cache, topics, sort]);

  // 주제 토글 (다중 선택) — 바꾸면 새 필터 결과를 위에서부터 보도록 최상단으로 스크롤.
  const toggleTopic = useCallback((key: string) => {
    setTopics((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]));
    window.scrollTo({ top: 0 });
  }, []);

  // 전체 선택(필터 비움) — 동일하게 최상단으로.
  const selectAll = useCallback(() => {
    setTopics([]);
    window.scrollTo({ top: 0 });
  }, []);

  const sorts: { key: SortMode; label: string }[] = [
    { key: 'recommended', label: '추천순' },
    { key: 'latest', label: '최신순' },
  ];

  return (
    <>
      {/* 주제 칩만 상단 고정 — 헤더(h-14, top-0) 바로 밑(top-14)에 스택.
          -mx-4로 main 좌우 패딩 상쇄해 가로 full-bleed, 반투명 blur로 목록이 밑으로 깔끔히 지나가게.
          모바일: 한 줄 가로 스크롤(스크롤바 숨김). */}
      <nav className="scrollbar-hide sticky top-14 z-20 -mx-4 flex items-center gap-1.5 overflow-x-auto border-b border-zinc-200 bg-white/90 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <button
          type="button"
          onClick={selectAll}
          aria-pressed={topics.length === 0}
          className={chipClass(topics.length === 0)}
        >
          전체
        </button>
        {TOPICS.map((t) => {
          const on = topics.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleTopic(t)}
              aria-pressed={on}
              className={chipClass(on)}
            >
              {TOPIC_LABELS[t] ?? t}
            </button>
          );
        })}
      </nav>

      {/* 정렬 — 고정 안 함(기존 UI). 스크롤하면 목록과 함께 올라가 사라짐. */}
      <div className="mb-4 mt-3 flex justify-end">
        <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 text-sm dark:bg-zinc-800">
          {sorts.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              aria-pressed={sort === s.key}
              className={`rounded-md px-3.5 py-1.5 transition-colors ${
                sort === s.key
                  ? 'bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {!entry ? (
        <ListSkeleton />
      ) : entry.items.length === 0 ? (
        <p className="py-16 text-center text-zinc-500">
          {topics.length > 0 ? '선택한 주제에 글이 없습니다.' : '아직 수집된 글이 없습니다.'}
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
            <div className="py-4" />
          )}
        </>
      )}
    </>
  );
}

function chipClass(active: boolean): string {
  return `shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
    active
      ? 'bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900'
      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
  }`;
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
