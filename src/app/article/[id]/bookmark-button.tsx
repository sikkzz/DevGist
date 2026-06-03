'use client';

import { useState, useTransition } from 'react';

import { toggleBookmark } from '@/lib/read-state';

export function BookmarkButton({
  articleId,
  initialBookmarked,
}: {
  articleId: string;
  initialBookmarked: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    const optimistic = !bookmarked;
    setBookmarked(optimistic); // 낙관적 반영
    startTransition(async () => {
      try {
        const next = await toggleBookmark(articleId);
        setBookmarked(next); // 서버 확정값으로 동기화
      } catch {
        setBookmarked(!optimistic); // 실패 시 롤백
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={bookmarked}
      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      <span aria-hidden>{bookmarked ? '★' : '☆'}</span>
      {bookmarked ? '북마크됨' : '북마크'}
    </button>
  );
}
