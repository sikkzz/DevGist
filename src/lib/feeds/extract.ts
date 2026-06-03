import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

import {
  FETCH_TIMEOUT_MS,
  MIN_EXTRACT_LEN,
  MIN_FULL_LEN,
  USER_AGENT,
  visibleTextLength,
} from './constants';
import type { ParsedItem } from './parse';

/** 본문 결정 경로 — contentExtracted=true면 readability로 추출한 것 */
export interface ResolvedContent {
  content: string | null;
  contentExtracted: boolean;
}

/**
 * ADR-0001의 본문 결정 순서:
 *   1) content:encoded 전문이 충분 → 원문 HTML 그대로 (요약/압축 금지)
 *   2) 부족하면 원문 link에서 readability로 "본문만 추출"
 *   3) 추출도 부실/실패하면 가진 부분 원문이라도 저장, 없으면 null → link fallback
 */
export async function resolveContent(item: ParsedItem): Promise<ResolvedContent> {
  const raw = item.contentEncoded;

  // 1) 피드가 전문을 그대로 줌 → 무손실 사용
  if (visibleTextLength(raw) >= MIN_FULL_LEN) {
    return { content: raw!, contentExtracted: false };
  }

  // 2) 원문에서 본문 추출 시도
  const extracted = await tryExtract(item.link);
  if (extracted && visibleTextLength(extracted) >= MIN_EXTRACT_LEN) {
    return { content: extracted, contentExtracted: true };
  }

  // 3) fallback — 부분 원문이라도 있으면 보존(무손실), 아니면 link로만
  if (raw && visibleTextLength(raw) > 0) {
    return { content: raw, contentExtracted: false };
  }
  return { content: null, contentExtracted: false };
}

async function tryExtract(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const html = await res.text();
    // linkedom엔 jsdom의 { url } 옵션이 없어, <base>를 주입해 상대경로 URL을 절대화한다
    // (Readability가 document.baseURI로 이미지/링크를 절대 경로로 보정 — ADR-0001 이미지 보존).
    const baseTag = `<base href="${url}">`;
    const withBase = /<head[^>]*>/i.test(html)
      ? html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`)
      : `${baseTag}${html}`;
    const { document } = parseHTML(withBase);
    const article = new Readability(document).parse();
    return article?.content ?? null;
  } catch {
    return null;
  }
}
