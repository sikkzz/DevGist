'use server';

import { type ArticleCard } from '@/lib/article-types';
import { getArticles } from '@/lib/articles';

/** 무한 스크롤: skip 이후 다음 묶음을 반환 (주제 필터 유지). */
export async function loadMoreArticles(skip: number, topic?: string): Promise<ArticleCard[]> {
  return getArticles(skip, topic);
}
