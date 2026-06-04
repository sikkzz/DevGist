'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { type ArticleCard, PAGE_SIZE } from '@/lib/article-types';

import { ArticleItem } from './article-item';
import { loadMoreArticles } from './articles-actions';

/**
 * 초기 묶음을 SSR로 받고, 하단 sentinel이 보이면 Server Action으로 다음 묶음을 이어 붙인다.
 * 반환 개수가 PAGE_SIZE 미만이면 끝으로 간주.
 */
export function InfiniteArticleList({
  initial,
  topic,
}: {
  initial: ArticleCard[];
  topic?: string;
}) {
  const [items, setItems] = useState<ArticleCard[]>(initial);
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || isPending) return;
        startTransition(async () => {
          const next = await loadMoreArticles(items.length, topic);
          setItems((prev) => [...prev, ...next]);
          if (next.length < PAGE_SIZE) setHasMore(false);
        });
      },
      { rootMargin: '400px' }, // 바닥 닿기 전에 미리 로드
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isPending, items.length, topic]);

  return (
    <>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {items.map((a) => (
          <ArticleItem key={a.id} article={a} />
        ))}
      </ul>
      {hasMore ? (
        <div ref={sentinelRef} className="py-8 text-center text-sm text-zinc-400">
          {isPending ? '불러오는 중…' : ''}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-zinc-400">— 끝 —</p>
      )}
    </>
  );
}
