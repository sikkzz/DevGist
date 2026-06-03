import Link from 'next/link';

import { getArticleList } from '@/lib/articles';
import { formatDate } from '@/lib/format';

// DB 런타임 데이터 — 빌드 시 프리렌더(DB 접근) 회피, 항상 최신
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const articles = await getArticleList();

  if (articles.length === 0) {
    return (
      <p className="py-16 text-center text-zinc-500">
        아직 수집된 글이 없습니다. <code>pnpm seed:feeds</code> 후 폴링을 실행하세요.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {articles.map((article) => (
        <li key={article.id}>
          <Link
            href={`/article/${article.id}`}
            className={`group block py-4 ${article.read?.isRead ? 'opacity-55' : ''}`}
          >
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                {article.feed.title}
              </span>
              {article.publishedAt && (
                <>
                  <span aria-hidden>·</span>
                  <time dateTime={article.publishedAt.toISOString()}>
                    {formatDate(article.publishedAt)}
                  </time>
                </>
              )}
            </div>
            <h2 className="mt-1 flex items-start gap-1.5 font-semibold leading-snug group-hover:underline">
              {article.read?.bookmarked && (
                <span className="text-amber-500" aria-label="북마크됨">
                  ★
                </span>
              )}
              <span>{article.title}</span>
            </h2>
            {article.summary && (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{article.summary}</p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
