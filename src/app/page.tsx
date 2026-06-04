import { getArticles } from '@/lib/articles';

import { InfiniteArticleList } from './infinite-article-list';

// DB 런타임 데이터 — 빌드 시 프리렌더(DB 접근) 회피, 항상 최신
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const initial = await getArticles(0);

  if (initial.length === 0) {
    return (
      <p className="py-16 text-center text-zinc-500">
        아직 수집된 글이 없습니다. <code>pnpm seed:feeds</code> 후 폴링을 실행하세요.
      </p>
    );
  }

  return <InfiniteArticleList initial={initial} />;
}
