import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getArticleById } from '@/lib/articles';
import { requireAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { sanitizeArticleHtml } from '@/lib/sanitize';

import styles from './article-content.module.css';
import { BookmarkButton } from './bookmark-button';
import { MarkRead } from './mark-read';

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }: PageProps<'/article/[id]'>) {
  await requireAuth(); // 미인증이면 /login으로
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) notFound();

  return (
    <article>
      {/* 마운트 시 읽음 처리 (렌더 없음) */}
      <MarkRead articleId={article.id} />

      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 목록
      </Link>

      <header className="mt-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <h1 className="text-2xl font-bold leading-tight">{article.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">{article.feed.title}</span>
          {article.author && (
            <>
              <span aria-hidden>·</span>
              <span>{article.author}</span>
            </>
          )}
          {article.publishedAt && (
            <>
              <span aria-hidden>·</span>
              <time dateTime={article.publishedAt.toISOString()}>
                {formatDate(article.publishedAt)}
              </time>
            </>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <BookmarkButton
            articleId={article.id}
            initialBookmarked={article.read?.bookmarked ?? false}
          />
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            원문 보기 ↗
          </a>
        </div>
      </header>

      {article.content ? (
        <div
          className={`${styles.content} mt-6`}
          // 정화 후 렌더 (ADR-0007). 원문은 DB에 raw 보존.
          dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }}
        />
      ) : (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">이 글은 본문을 가져오지 못했습니다.</p>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            원문에서 읽기 ↗
          </a>
        </div>
      )}
    </article>
  );
}
