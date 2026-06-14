import { type SortMode } from '@/lib/article-types';
import { getArticles } from '@/lib/articles';
import { requireAuth } from '@/lib/auth';

import { ArticleFeed } from './article-feed';

// 초기 묶음만 SSR(인증·DB). 이후 탭/정렬/스크롤은 ArticleFeed가 클라에서 캐시하며 처리.
export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  await requireAuth();
  const sp = await searchParams;

  // ?topics=ai,backend (다중) / ?topic=ai (단일 레거시) 모두 지원
  const raw = sp.topics ?? sp.topic;
  const topics = (typeof raw === 'string' ? raw.split(',') : Array.isArray(raw) ? raw : [])
    .map((t) => t.trim())
    .filter(Boolean);
  const sort: SortMode = sp.sort === 'latest' ? 'latest' : 'recommended';
  const query = typeof sp.q === 'string' ? sp.q : '';

  const initial = await getArticles(0, topics, sort, query);

  return (
    <ArticleFeed initial={initial} initialTopics={topics} initialSort={sort} initialQuery={query} />
  );
}
