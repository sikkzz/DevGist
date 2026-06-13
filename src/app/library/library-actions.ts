'use server';

import { type ArticleCard, type LibraryView } from '@/lib/article-types';
import { getSavedArticles } from '@/lib/articles';

/** 보관함 무한 스크롤: 해당 뷰의 skip 이후 다음 묶음. */
export async function loadMoreSaved(view: LibraryView, skip: number): Promise<ArticleCard[]> {
  return getSavedArticles(view, skip);
}
