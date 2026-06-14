/**
 * FTS 색인용 평문 추출 (ADR-0011).
 * HTML 태그·<style>/<script> 블록·엔티티를 제거해 검색 색인에 들어갈 깨끗한 텍스트만 남긴다.
 * 본문에 섞인 CSS(예: font-family:'JetBrains Mono')가 검색 노이즈를 만들던 문제를 막는 게 핵심.
 *
 * 일부 피드는 본문을 "이스케이프된 HTML"(&lt;div style=&quot;…&quot;&gt;)로 준다. 그래서
 * 엔티티를 먼저 디코드해 실제 태그로 되돌린 뒤 제거해야 style 속성 텍스트까지 사라진다.
 * 보안용 sanitize가 아니라 색인 전용 — 가볍게 정규식으로 처리하고 길이를 제한한다.
 */

/** 색인 텍스트 상한 — 인덱스 크기/계산 비용을 유계로. recall엔 충분. */
const MAX_SEARCH_TEXT = 12_000;

/** 흔한 HTML 엔티티 디코드 (이스케이프된 본문을 실제 태그로 되돌리기 위함). */
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCodePoint(Number(n));
      } catch {
        return ' ';
      }
    })
    .replace(/&amp;/gi, '&'); // &amp;는 마지막에 (이중 디코드 방지)
}

export function htmlToSearchText(html: string | null | undefined): string {
  if (!html) return '';
  return decodeEntities(html)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ') // 스타일/스크립트 블록 통째 제거
    .replace(/<[^>]+>/g, ' ') // 나머지 태그 제거(인라인 style 속성도 함께 사라짐)
    .replace(/&[a-z]+;|&#\d+;/gi, ' ') // 남은 엔티티 정리
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SEARCH_TEXT);
}
