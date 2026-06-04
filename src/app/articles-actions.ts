'use server';

import { type ArticleCard, PAGE_SIZE } from '@/lib/article-types';
import { getArticles } from '@/lib/articles';

/** 무한 스크롤: skip 이후 다음 묶음을 반환 (클라이언트에서 호출). */
export async function loadMoreArticles(skip: number): Promise<ArticleCard[]> {
  return getArticles(skip, PAGE_SIZE);
}
