import { type SortMode } from '@/lib/article-types';
import { getArticles } from '@/lib/articles';

import { InfiniteArticleList } from './infinite-article-list';
import { SortToggle } from './sort-toggle';
import { TopicTabs } from './topic-tabs';

// DB 런타임 데이터 — 빌드 시 프리렌더(DB 접근) 회피, 항상 최신
export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const sp = await searchParams;
  const topic = typeof sp.topic === 'string' ? sp.topic : undefined;
  const sort: SortMode = sp.sort === 'latest' ? 'latest' : 'recommended';

  const initial = await getArticles(0, topic, sort);

  return (
    <>
      <TopicTabs active={topic} sort={sort} />
      <SortToggle topic={topic} active={sort} />
      {initial.length === 0 ? (
        <p className="py-16 text-center text-zinc-500">
          {topic ? '이 주제에 글이 없습니다.' : '아직 수집된 글이 없습니다.'}
        </p>
      ) : (
        // 주제·정렬 전환 시 목록 상태 리셋을 위해 key로 강제 리마운트
        <InfiniteArticleList
          key={`${topic ?? 'all'}:${sort}`}
          initial={initial}
          topic={topic}
          sort={sort}
        />
      )}
    </>
  );
}
