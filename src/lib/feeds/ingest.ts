import { prisma } from '@/lib/prisma';

import { EXTRACT_CONCURRENCY } from './constants';
import { resolveContent } from './extract';
import type { ParsedItem } from './parse';

/** 동시 실행 수를 제한하며 배열을 매핑한다 (외부 의존성 없음). */
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

export interface IngestResult {
  /** 새로 적재된 글 수 */
  created: number;
  /** 이미 있어 건너뛴 글 수 */
  skipped: number;
  /** 적재 중 실패한 글 수 */
  failed: number;
}

/**
 * 한 피드의 아이템들을 적재한다.
 * - (feedId, guid) 기준으로 이미 있는 글은 본문 추출 비용 없이 미리 거른다.
 * - 신규 글만 본문 결정(resolveContent) 후 INSERT. unique 제약은 경쟁 상황 안전망.
 */
export async function ingestFeed(feedId: string, items: ParsedItem[]): Promise<IngestResult> {
  if (items.length === 0) return { created: 0, skipped: 0, failed: 0 };

  const existing = await prisma.article.findMany({
    where: { feedId, guid: { in: items.map((i) => i.guid) } },
    select: { guid: true },
  });
  const seen = new Set(existing.map((e) => e.guid));
  const fresh = items.filter((i) => !seen.has(i.guid));
  const preSkipped = items.length - fresh.length;

  // 신규 글만 동시성 제한하에 본문 결정 + INSERT
  const outcomes = await mapPool(fresh, EXTRACT_CONCURRENCY, async (item) => {
    try {
      const { content, contentExtracted } = await resolveContent(item);
      await prisma.article.create({
        data: {
          feedId,
          guid: item.guid,
          title: item.title,
          link: item.link,
          author: item.author ?? null,
          summary: item.summary ?? null,
          content,
          contentExtracted,
          publishedAt: item.publishedAt ?? null,
        },
      });
      return 'created' as const;
    } catch (err) {
      // unique 충돌(경쟁)이면 스킵, 그 외는 실패
      return (err as { code?: string }).code === 'P2002'
        ? ('skipped' as const)
        : ('failed' as const);
    }
  });

  return {
    created: outcomes.filter((o) => o === 'created').length,
    skipped: preSkipped + outcomes.filter((o) => o === 'skipped').length,
    failed: outcomes.filter((o) => o === 'failed').length,
  };
}
