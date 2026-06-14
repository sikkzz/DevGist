'use server';

import { type ArticleCard, type SortMode } from '@/lib/article-types';
import { getArticles } from '@/lib/articles';

/** 무한 스크롤: skip 이후 다음 묶음 (다중 주제 필터 + 정렬 + 검색어 AND 결합 유지). */
export async function loadMoreArticles(
  skip: number,
  topics: string[] = [],
  sort: SortMode = 'latest',
  query = '',
): Promise<ArticleCard[]> {
  return getArticles(skip, topics, sort, query);
}
