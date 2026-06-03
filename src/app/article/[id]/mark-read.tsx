'use client';

import { useEffect } from 'react';

import { markArticleRead } from '@/lib/read-state';

/** 상세 마운트 시 글을 읽음 처리한다. 렌더 출력 없음. */
export function MarkRead({ articleId }: { articleId: string }) {
  useEffect(() => {
    // 읽음 기록은 베스트에포트 — 실패해도 읽기 경험을 막지 않는다.
    void markArticleRead(articleId);
  }, [articleId]);

  return null;
}
