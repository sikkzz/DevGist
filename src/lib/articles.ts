import { cache } from 'react';

import { type ArticleCard, type LibraryView, PAGE_SIZE, type SortMode } from '@/lib/article-types';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

const LATEST_ORDER = [
  { publishedAt: { sort: 'desc', nulls: 'last' } },
  { createdAt: 'desc' },
] as const;

/** 카드(본문 제외) 공용 select — 목록/보관함이 동일 형태로 사용. */
const CARD_SELECT = {
  id: true,
  title: true,
  link: true,
  summary: true,
  author: true,
  publishedAt: true,
  topics: true,
  personalTags: true,
  feed: { select: { title: true } },
  read: { select: { isRead: true, bookmarked: true } },
} satisfies Prisma.ArticleSelect;

type CardRow = Prisma.ArticleGetPayload<{ select: typeof CARD_SELECT }>;

/** 쿼리 row → 평탄화된 ArticleCard. */
function toCard(a: CardRow): ArticleCard {
  return {
    id: a.id,
    title: a.title,
    link: a.link,
    summary: a.summary,
    author: a.author,
    publishedAt: a.publishedAt,
    feedTitle: a.feed.title,
    topics: a.topics,
    personalTags: a.personalTags,
    isRead: a.read?.isRead ?? false,
    bookmarked: a.read?.bookmarked ?? false,
  };
}

/**
 * 글 목록 한 묶음(무한 스크롤용). 본문(content)은 무거우니 제외하고 카드용으로 평탄화.
 * - topics: 비면 전체, 여러 개면 그중 하나라도 가진 글(hasSome = OR 합집합)
 * - latest: 최신순(publishedAt 우선, null 뒤로)
 * - recommended: 개인화 관련도(personalScore) 내림차순, 동점은 최신순 (ADR-0009)
 */
export async function getArticles(
  skip = 0,
  topics: string[] = [],
  sort: SortMode = 'latest',
  take: number = PAGE_SIZE,
): Promise<ArticleCard[]> {
  const rows = await prisma.article.findMany({
    where: topics.length > 0 ? { topics: { hasSome: topics } } : undefined,
    orderBy:
      sort === 'recommended' ? [{ personalScore: 'desc' }, ...LATEST_ORDER] : [...LATEST_ORDER],
    skip,
    take,
    select: CARD_SELECT,
  });
  return rows.map(toCard);
}

/**
 * 보관함 한 묶음(무한 스크롤용).
 * - bookmarks: 북마크된 글, 최근 활동순(Read.updatedAt — 마지막 북마크/읽음 토글 시각)
 * - read: 읽은 글, 읽은 시각(readAt) 최신순
 */
export async function getSavedArticles(
  view: LibraryView,
  skip = 0,
  take: number = PAGE_SIZE,
): Promise<ArticleCard[]> {
  const where: Prisma.ArticleWhereInput =
    view === 'bookmarks'
      ? { read: { is: { bookmarked: true } } }
      : { read: { is: { isRead: true } } };
  const orderBy: Prisma.ArticleOrderByWithRelationInput =
    view === 'bookmarks' ? { read: { updatedAt: 'desc' } } : { read: { readAt: 'desc' } };

  const rows = await prisma.article.findMany({ where, orderBy, skip, take, select: CARD_SELECT });
  return rows.map(toCard);
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
