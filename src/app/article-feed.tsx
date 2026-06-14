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

const SEARCH_DEBOUNCE_MS = 300;

// (topics,sort,query)별 캐시 — 세 필터를 즉시 전환하고, 이미 본 조합은 재요청 없이 표시.
// 셋은 모두 AND로 결합되는 독립 필터라, 어떤 순서로 바꿔도 같은 키 체계로 다뤄진다.
type CacheEntry = { items: ArticleCard[]; hasMore: boolean };
const keyOf = (topics: string[], sort: SortMode, query: string) =>
  `${[...topics].sort().join(',')}|${sort}|${query.trim().toLowerCase()}`;

export function ArticleFeed({
  initial,
  initialTopics,
  initialSort,
  initialQuery,
}: {
  initial: ArticleCard[];
  initialTopics: string[];
  initialSort: SortMode;
  initialQuery: string;
}) {
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [sort, setSort] = useState<SortMode>(initialSort);
  const [queryInput, setQueryInput] = useState(initialQuery); // 입력 즉시값
  const [query, setQuery] = useState(initialQuery); // 디바운스된 실제 검색어
  const [cache, setCache] = useState<Record<string, CacheEntry>>(() => ({
    [keyOf(initialTopics, initialSort, initialQuery)]: {
      items: initial,
      hasMore: initial.length === PAGE_SIZE,
    },
  }));
  const [, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const k = keyOf(topics, sort, query);
  const entry = cache[k]; // undefined면 아직 미로드 → 스켈레톤

  // 검색어 디바운스 — 입력이 멈추고 300ms 뒤 query 확정 + 최상단으로
  useEffect(() => {
    if (queryInput === query) return;
    const timer = setTimeout(() => {
      setQuery(queryInput);
      window.scrollTo({ top: 0 });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [queryInput, query]);

  // 캐시에 없는 (topics,sort,query) → 첫 묶음 로드
  useEffect(() => {
    if (cache[k]) return;
    let cancelled = false;
    loadMoreArticles(0, topics, sort, query).then((items) => {
      if (cancelled) return;
      setCache((c) => ({ ...c, [k]: { items, hasMore: items.length === PAGE_SIZE } }));
    });
    return () => {
      cancelled = true;
    };
  }, [k, topics, sort, query, cache]);

  // URL 동기화 (서버 navigation 없이 — 공유/새로고침 대비)
  useEffect(() => {
    const qs = new URLSearchParams();
    if (topics.length > 0) qs.set('topics', topics.join(','));
    if (sort !== DEFAULT_SORT) qs.set('sort', sort);
    if (query.trim()) qs.set('q', query.trim());
    const url = qs.toString() ? `/?${qs.toString()}` : '/';
    window.history.replaceState(null, '', url);
  }, [topics, sort, query]);

  // 무한 스크롤 — 현재 (topics,sort,query)에 이어 붙임
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
          const next = await loadMoreArticles(cur.items.length, topics, sort, query);
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
  }, [k, entry?.hasMore, cache, topics, sort, query]);

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

  const emptyMessage = query.trim()
    ? `‘${query.trim()}’ 검색 결과가 없습니다.`
    : topics.length > 0
      ? '선택한 주제에 글이 없습니다.'
      : '아직 수집된 글이 없습니다.';

  return (
    <>
      {/* 검색 — 주제칩·정렬과 AND로 결합되는 또 하나의 필터. 비면 무시(평소 피드). */}
      <input
        type="search"
        value={queryInput}
        onChange={(e) => setQueryInput(e.target.value)}
        placeholder="제목 검색"
        className="mb-3 w-full rounded-lg border border-zinc-300 px-4 py-2 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />

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
        <p className="py-16 text-center text-zinc-500">{emptyMessage}</p>
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
