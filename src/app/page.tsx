import { type SortMode } from '@/lib/article-types';
import { getArticles } from '@/lib/articles';
import { requireAuth } from '@/lib/auth';

import { ArticleFeed } from './article-feed';

// 초기 묶음만 SSR(인증·DB). 이후 탭/정렬/스크롤은 ArticleFeed가 클라에서 캐시하며 처리.
export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  await requireAuth();
  const sp = await searchParams;
  const topic = typeof sp.topic === 'string' ? sp.topic : undefined;
  const sort: SortMode = sp.sort === 'latest' ? 'latest' : 'recommended';

  const initial = await getArticles(0, topic, sort);

  return <ArticleFeed initial={initial} initialTopic={topic} initialSort={sort} />;
}
