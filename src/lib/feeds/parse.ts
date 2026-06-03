import Parser from 'rss-parser';

import { FETCH_TIMEOUT_MS, USER_AGENT } from './constants';

/** content:encoded를 별도 필드로 받기 위한 커스텀 item 확장 */
interface CustomItem {
  contentEncoded?: string;
}

/** 정규화된 피드 아이템 — DB 적재 직전 형태 */
export interface ParsedItem {
  /** (feedId, guid) 중복 키. guid 없으면 link로 대체 */
  guid: string;
  title: string;
  link: string;
  author?: string;
  summary?: string;
  /** content:encoded 등에서 받은 원문 HTML (있으면 무손실 그대로) */
  contentEncoded?: string;
  publishedAt?: Date;
}

export interface ParsedFeed {
  title?: string;
  items: ParsedItem[];
}

const parser = new Parser<Record<string, unknown>, CustomItem>({
  timeout: FETCH_TIMEOUT_MS,
  headers: { 'User-Agent': USER_AGENT },
  customFields: {
    // RSS의 <content:encoded>를 contentEncoded로 매핑 (rss-parser 기본 content 매핑과 별개로 명시 확보)
    item: [['content:encoded', 'contentEncoded']],
  },
});

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * 피드 URL을 fetch·파싱해 정규화된 아이템 배열로 반환.
 * guid/link가 없는 아이템은 식별 불가이므로 제외한다.
 */
export async function parseFeed(url: string): Promise<ParsedFeed> {
  const feed = await parser.parseURL(url);

  const items: ParsedItem[] = [];
  for (const item of feed.items) {
    const link = item.link?.trim();
    const guid = (item.guid ?? link)?.trim();
    if (!guid || !link) continue; // 식별 불가 → 스킵

    items.push({
      guid,
      title: item.title?.trim() || '(제목 없음)',
      link,
      author: item.creator?.trim() || undefined,
      summary: item.contentSnippet?.trim() || undefined,
      // 명시 매핑된 content:encoded 우선, 없으면 rss-parser 기본 content(Atom content 포함)
      contentEncoded: item.contentEncoded ?? item.content ?? undefined,
      publishedAt: toDate(item.isoDate ?? item.pubDate),
    });
  }

  return { title: feed.title, items };
}
