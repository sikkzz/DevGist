// 텍스트 ↔ 키워드 매칭 (classify·personalize 공용).
// 영어 토큰은 단어 경계 매칭(ai가 main에 안 걸리게), 한글은 부분 문자열 매칭.

const HANGUL = /[㄰-㆏가-힣]/;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** haystack(소문자 가정)에 keyword가 있는지. */
export function hasKeyword(haystack: string, keyword: string): boolean {
  const kw = keyword.toLowerCase();
  if (HANGUL.test(kw)) return haystack.includes(kw); // 한글: 부분 문자열
  // 영어/기호: 단어 경계 (앞뒤가 영숫자가 아니어야 함)
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(kw)}([^a-z0-9]|$)`);
  return re.test(haystack);
}

/** 매칭된 키워드 목록 반환 (원형 유지). */
export function matchedKeywords(haystack: string, keywords: string[]): string[] {
  return keywords.filter((kw) => hasKeyword(haystack, kw));
}
