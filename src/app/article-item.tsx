import Link from 'next/link';

import { type ArticleCard, TOPIC_LABELS } from '@/lib/article-types';
import { formatDate } from '@/lib/format';

/** 목록 카드 1개 (초기 SSR·무한스크롤 추가분 공용 프리젠테이션). */
export function ArticleItem({ article }: { article: ArticleCard }) {
  return (
    <li>
      <Link
        href={`/article/${article.id}`}
        className={`group block py-4 ${article.isRead ? 'opacity-55' : ''}`}
      >
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">{article.feedTitle}</span>
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
          {article.bookmarked && (
            <span className="text-amber-500" aria-label="북마크됨">
              ★
            </span>
          )}
          <span>{article.title}</span>
        </h2>
        {article.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{article.summary}</p>
        )}
        {article.topics.filter((t) => t !== 'etc').length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {article.topics
              .filter((t) => t !== 'etc')
              .map((t) => (
                <span
                  key={t}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {TOPIC_LABELS[t] ?? t}
                </span>
              ))}
          </div>
        )}
      </Link>
    </li>
  );
}
