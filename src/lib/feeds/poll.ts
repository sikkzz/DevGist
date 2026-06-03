import { prisma } from '@/lib/prisma';

import { MAX_ITEMS_PER_POLL } from './constants';
import { ingestFeed } from './ingest';
import { parseFeed } from './parse';

export interface FeedPollResult {
  feedId: string;
  url: string;
  ok: boolean;
  created?: number;
  skipped?: number;
  failed?: number;
  error?: string;
}

export interface PollSummary {
  polledAt: string;
  feedCount: number;
  totals: { created: number; skipped: number; failed: number };
  feeds: FeedPollResult[];
}

/**
 * active=true인 모든 피드를 순회 수집한다.
 * 한 피드가 실패해도 나머지는 계속 진행(개별 격리). 성공 피드는 lastFetchedAt 갱신.
 */
export async function pollAllFeeds(): Promise<PollSummary> {
  const feeds = await prisma.feed.findMany({ where: { active: true } });

  const results: FeedPollResult[] = [];
  for (const feed of feeds) {
    try {
      const parsed = await parseFeed(feed.url);
      // 최신순 상위 N개만 (전체 백필 방지, 함수 실행시간 유계)
      const recent = parsed.items.slice(0, MAX_ITEMS_PER_POLL);
      const ingest = await ingestFeed(feed.id, recent);
      await prisma.feed.update({
        where: { id: feed.id },
        data: { lastFetchedAt: new Date() },
      });
      results.push({ feedId: feed.id, url: feed.url, ok: true, ...ingest });
    } catch (err) {
      results.push({
        feedId: feed.id,
        url: feed.url,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const totals = results.reduce(
    (acc, r) => ({
      created: acc.created + (r.created ?? 0),
      skipped: acc.skipped + (r.skipped ?? 0),
      failed: acc.failed + (r.failed ?? 0),
    }),
    { created: 0, skipped: 0, failed: 0 },
  );

  return {
    polledAt: new Date().toISOString(),
    feedCount: feeds.length,
    totals,
    feeds: results,
  };
}
