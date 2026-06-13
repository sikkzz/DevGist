import Link from 'next/link';

import { type ArticleCard, TOPIC_LABELS } from '@/lib/article-types';
import { formatDate } from '@/lib/format';

import { NavPending } from './nav-pending';

/** 개인화 태그 색상 (회사=파랑, 학습=초록, 다양화=보라, 해볼것=강조) */
function personalChipClass(tag: string): string {
  if (tag.startsWith('회사·'))
    return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
  if (tag.startsWith('학습·'))
    return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300';
  if (tag === '다양화')
    return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
  if (tag === '해볼것')
    return 'bg-amber-100 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
}

/** 목록 카드 1개 (초기 SSR·무한스크롤 추가분 공용 프리젠테이션). */
export function ArticleItem({ article }: { article: ArticleCard }) {
  // 개인화 태그가 있으면 우선 표시, 없으면 주제 칩 (etc 제외)
  const topicChips = article.topics.filter((t) => t !== 'etc');
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
          <NavPending className="mt-1 shrink-0" />
        </h2>
        {article.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{article.summary}</p>
        )}
        {article.personalTags.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {article.personalTags.map((t) => (
              <span key={t} className={`rounded px-1.5 py-0.5 text-xs ${personalChipClass(t)}`}>
                {t}
              </span>
            ))}
          </div>
        ) : (
          topicChips.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {topicChips.map((t) => (
                <span
                  key={t}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {TOPIC_LABELS[t] ?? t}
                </span>
              ))}
            </div>
          )
        )}
      </Link>
    </li>
  );
}
