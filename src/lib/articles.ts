import { cache } from 'react';

import { prisma } from '@/lib/prisma';

/** 목록 1회 노출 상한 (페이지네이션 도입 전 임시) */
const LIST_LIMIT = 100;

/**
 * 최신순 글 목록. publishedAt 우선(null은 뒤로), 그다음 createdAt.
 * 본문(content)은 무거우니 목록에선 제외한다.
 * React.cache로 같은 요청 내 중복 호출을 메모이즈.
 */
export const getArticleList = cache(async () => {
  return prisma.article.findMany({
    orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: LIST_LIMIT,
    select: {
      id: true,
      title: true,
      link: true,
      summary: true,
      author: true,
      publishedAt: true,
      createdAt: true,
      feed: { select: { title: true } },
    },
  });
});

/** 글 상세 (본문 포함 + 피드 정보). 없으면 null. */
export const getArticleById = cache(async (id: string) => {
  return prisma.article.findUnique({
    where: { id },
    include: { feed: { select: { title: true, siteUrl: true } } },
  });
});
