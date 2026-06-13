import { type LibraryView } from '@/lib/article-types';
import { getSavedArticles } from '@/lib/articles';
import { requireAuth } from '@/lib/auth';

import { LibraryFeed } from './library-view';

// 초기 묶음만 SSR(인증·DB). 이후 뷰 전환/스크롤은 LibraryFeed가 클라에서 캐시하며 처리.
export const dynamic = 'force-dynamic';

export default async function LibraryPage({ searchParams }: PageProps<'/library'>) {
  await requireAuth();
  const sp = await searchParams;
  const view: LibraryView = sp.view === 'read' ? 'read' : 'bookmarks';

  const initial = await getSavedArticles(view, 0);

  return <LibraryFeed initial={initial} initialView={view} />;
}
