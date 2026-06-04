import { getArticles, getCategories } from '@/lib/articles';

import { CategoryTabs } from './category-tabs';
import { InfiniteArticleList } from './infinite-article-list';

// DB 런타임 데이터 — 빌드 시 프리렌더(DB 접근) 회피, 항상 최신
export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const sp = await searchParams;
  const category = typeof sp.category === 'string' ? sp.category : undefined;

  const [categories, initial] = await Promise.all([getCategories(), getArticles(0, category)]);

  return (
    <>
      <CategoryTabs categories={categories} active={category} />
      {initial.length === 0 ? (
        <p className="py-16 text-center text-zinc-500">
          {category ? '이 카테고리에 글이 없습니다.' : '아직 수집된 글이 없습니다.'}
        </p>
      ) : (
        // 카테고리 전환 시 목록 상태를 리셋하기 위해 key로 강제 리마운트
        <InfiniteArticleList key={category ?? 'all'} initial={initial} category={category} />
      )}
    </>
  );
}
