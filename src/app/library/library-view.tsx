'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { type ArticleCard, type LibraryView, LIBRARY_VIEWS, PAGE_SIZE } from '@/lib/article-types';

import { ArticleItem } from '../article-item';
import { loadMoreSaved } from './library-actions';

// 뷰별 캐시 — 북마크/읽은글 전환을 즉시, 이미 본 뷰는 재요청 없이.
type CacheEntry = { items: ArticleCard[]; hasMore: boolean };

export function LibraryFeed({
  initial,
  initialView,
}: {
  initial: ArticleCard[];
  initialView: LibraryView;
}) {
  const [view, setView] = useState<LibraryView>(initialView);
  const [cache, setCache] = useState<Record<string, CacheEntry>>(() => ({
    [initialView]: { items: initial, hasMore: initial.length === PAGE_SIZE },
  }));
  const [, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const entry = cache[view]; // undefined면 아직 미로드 → 스켈레톤

  // 캐시에 없는 뷰 → 첫 묶음 로드
  useEffect(() => {
    if (cache[view]) return;
    let cancelled = false;
    loadMoreSaved(view, 0).then((items) => {
      if (cancelled) return;
      setCache((c) => ({ ...c, [view]: { items, hasMore: items.length === PAGE_SIZE } }));
    });
    return () => {
      cancelled = true;
    };
  }, [view, cache]);

  // URL 동기화 (서버 navigation 없이 — 공유/새로고침 대비)
  useEffect(() => {
    const url = view === 'bookmarks' ? '/library' : `/library?view=${view}`;
    window.history.replaceState(null, '', url);
  }, [view]);

  // 무한 스크롤 — 현재 뷰에 이어 붙임
  useEffect(() => {
    if (!entry?.hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        startTransition(async () => {
          const cur = cache[view];
          if (!cur?.hasMore) return;
          const next = await loadMoreSaved(view, cur.items.length);
          setCache((c) => {
            const base = c[view] ?? { items: [], hasMore: true };
            return {
              ...c,
              [view]: { items: [...base.items, ...next], hasMore: next.length === PAGE_SIZE },
            };
          });
        });
      },
      { rootMargin: '400px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [view, entry?.hasMore, cache]);

  const emptyText =
    view === 'bookmarks' ? '아직 북마크한 글이 없습니다.' : '아직 읽은 글이 없습니다.';

  return (
    <>
      {/* 뷰 토글 — 북마크 / 읽은 글 (모바일 친화 세그먼트 컨트롤) */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 text-sm dark:bg-zinc-800">
          {LIBRARY_VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              aria-pressed={view === v.key}
              className={`rounded-md px-4 py-1.5 transition-colors ${
                view === v.key
                  ? 'bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {!entry ? (
        <ListSkeleton />
      ) : entry.items.length === 0 ? (
        <p className="py-16 text-center text-zinc-500">{emptyText}</p>
      ) : (
        <>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {entry.items.map((a) => (
              // 읽은 글 뷰는 전부 읽음 상태라 dim을 끄지 않으면 목록 전체가 흐려짐
              <ArticleItem key={a.id} article={a} dim={view !== 'read'} />
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
