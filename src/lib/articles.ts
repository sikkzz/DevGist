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
 * topics·query·sort는 서로 독립적인 필터로 모두 AND 결합 — 어떤 조합이든 같이 적용된다.
 * - topics: 비면 전체, 여러 개면 그중 하나라도 가진 글(hasSome = OR 합집합)
 * - query: 제목 ILIKE 부분일치(한국어 친화). 비면 무시.
 *   요약/본문은 제외 — 요약에 CSS 폰트명('JetBrains Mono' 등) 등 찌꺼기가 섞여 노이즈가
 *   심함(진단으로 확인). 제목이 "되찾기" 신호로 가장 정확. (spec 비범위)
 * - latest: 최신순(publishedAt 우선, null 뒤로)
 * - recommended: 개인화 관련도(personalScore) 내림차순, 동점은 최신순 (ADR-0009)
 */
export async function getArticles(
  skip = 0,
  topics: string[] = [],
  sort: SortMode = 'latest',
  query = '',
  take: number = PAGE_SIZE,
): Promise<ArticleCard[]> {
  const q = query.trim();
  if (q) return searchByText(q, topics, sort, skip, take); // 검색어 있으면 FTS 경로

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

/** 사용자 입력 → prefix tsquery. 'react hooks' → 'react:* & hooks:*'. 유효 토큰 없으면 ''. */
function buildTsQuery(query: string): string {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]+/gu, '')) // tsquery 특수문자 제거 — 글자/숫자만
    .filter(Boolean)
    .map((t) => `${t}:*`)
    .join(' & ');
}

// 검색 색인 표현식 — 마이그레이션의 함수형 GIN 인덱스와 동일해야 인덱스를 탄다 (ADR-0011).
const TSV_EXPR = Prisma.sql`(setweight(to_tsvector('simple', coalesce("title", '')), 'A') || setweight(to_tsvector('simple', coalesce("searchText", '')), 'B'))`;

/**
 * FTS 검색 (ADR-0011) — 제목(A)·본문(B) 가중 tsvector에 prefix tsquery 매칭, ts_rank 관련도 정렬.
 * 주제칩(topics)은 AND 결합, 정렬은 관련도 우선 + sort 보조 tiebreak. 본문(content)은 색인 평문으로.
 */
async function searchByText(
  query: string,
  topics: string[],
  sort: SortMode,
  skip: number,
  take: number,
): Promise<ArticleCard[]> {
  const tsq = buildTsQuery(query);
  if (!tsq) return [];

  const tsquery = Prisma.sql`to_tsquery('simple', ${tsq})`;
  const topicCond =
    topics.length > 0 ? Prisma.sql`AND "topics" && ${topics}::text[]` : Prisma.empty;
  const tiebreak =
    sort === 'recommended'
      ? Prisma.sql`"personalScore" DESC, "publishedAt" DESC NULLS LAST`
      : Prisma.sql`"publishedAt" DESC NULLS LAST`;

  // 관련도 순 id만 페이지네이션으로 뽑고(인덱스 사용), 카드 데이터는 Prisma select로 가져와 재정렬.
  const ranked = await prisma.$queryRaw<{ id: string }[]>(
    Prisma.sql`
      SELECT id
      FROM articles
      WHERE ${TSV_EXPR} @@ ${tsquery} ${topicCond}
      ORDER BY ts_rank(${TSV_EXPR}, ${tsquery}) DESC, ${tiebreak}
      LIMIT ${take} OFFSET ${skip}`,
  );
  const ids = ranked.map((r) => r.id);
  if (ids.length === 0) return [];

  const rows = await prisma.article.findMany({ where: { id: { in: ids } }, select: CARD_SELECT });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is CardRow => r != null)
    .map(toCard);
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
