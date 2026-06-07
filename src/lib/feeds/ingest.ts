import { prisma } from '@/lib/prisma';

import { classifyTopics } from './classify';
import { cleanText, EXTRACT_CONCURRENCY } from './constants';
import { mapPool } from './concurrency';
import { resolveContent } from './extract';
import type { ParsedItem } from './parse';
import { getProfile, scorePersonal } from './personalize';

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

  const profile = await getProfile(); // 개인화 프로필 (ADR-0009), 없으면 점수 0

  // 신규 글만 동시성 제한하에 본문 결정 + INSERT
  const outcomes = await mapPool(fresh, EXTRACT_CONCURRENCY, async (item) => {
    try {
      const { content, contentExtracted } = await resolveContent(item);
      const personal = scorePersonal(`${item.title} ${item.summary ?? ''}`, profile);
      await prisma.article.create({
        data: {
          feedId,
          guid: item.guid,
          // 텍스트 컬럼은 NUL 등 제어문자 제거 (일부 피드/추출물이 INSERT를 깨뜨림)
          title: cleanText(item.title) ?? '(제목 없음)',
          link: item.link,
          author: cleanText(item.author),
          summary: cleanText(item.summary),
          content: cleanText(content),
          contentExtracted,
          topics: classifyTopics({
            title: item.title,
            summary: item.summary,
            categories: item.categories,
          }),
          personalScore: personal.score,
          personalTags: personal.tags,
          publishedAt: item.publishedAt ?? null,
        },
      });
      return 'created' as const;
    } catch (err) {
      // unique 충돌(경쟁)이면 스킵, 그 외는 실패 — 원인 추적용 로깅
      if ((err as { code?: string }).code === 'P2002') return 'skipped' as const;
      console.error(
        `[ingest] create 실패 feed=${feedId} guid=${item.guid}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return 'failed' as const;
    }
  });

  return {
    created: outcomes.filter((o) => o === 'created').length,
    skipped: preSkipped + outcomes.filter((o) => o === 'skipped').length,
    failed: outcomes.filter((o) => o === 'failed').length,
  };
}
