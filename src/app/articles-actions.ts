'use server';

import { type ArticleCard, PAGE_SIZE } from '@/lib/article-types';
import { getArticles } from '@/lib/articles';

/** 무한 스크롤: skip 이후 다음 묶음을 반환 (카테고리 필터 유지). */
export async function loadMoreArticles(skip: number, category?: string): Promise<ArticleCard[]> {
  return getArticles(skip, category, PAGE_SIZE);
}
