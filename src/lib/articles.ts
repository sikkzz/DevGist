import { cache } from 'react';

import { type ArticleCard, PAGE_SIZE } from '@/lib/article-types';
import { prisma } from '@/lib/prisma';

/**
 * 최신순 글 목록 한 묶음(무한 스크롤용). publishedAt 우선(null은 뒤로), 그다음 createdAt.
 * 본문(content)은 무거우니 목록에선 제외하고, 카드용으로 평탄화해 반환한다.
 */
export async function getArticles(
  skip = 0,
  topic?: string,
  take: number = PAGE_SIZE,
): Promise<ArticleCard[]> {
  const rows = await prisma.article.findMany({
    where: topic ? { topics: { has: topic } } : undefined,
    orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    skip,
    take,
    select: {
      id: true,
      title: true,
      link: true,
      summary: true,
      author: true,
      publishedAt: true,
      topics: true,
      feed: { select: { title: true } },
      read: { select: { isRead: true, bookmarked: true } },
    },
  });
  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    link: a.link,
    summary: a.summary,
    author: a.author,
    publishedAt: a.publishedAt,
    feedTitle: a.feed.title,
    topics: a.topics,
    isRead: a.read?.isRead ?? false,
    bookmarked: a.read?.bookmarked ?? false,
  }));
}

/** 글 상세 (본문 포함 + 피드 + 읽음/북마크 상태). 없으면 null. */
export const getArticleById = cache(async (id: string) => {
  return prisma.article.findUnique({
    where: { id },
    include: {
      feed: { select: { title: true, siteUrl: true } },
      read: { select: { isRead: true, bookmarked: true } },
    },
  });
});
