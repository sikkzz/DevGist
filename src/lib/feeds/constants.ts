// 수집 파이프라인 공통 상수 (docs/specs/feature-collection-pipeline.md §8)

/** content:encoded 원문이 "전문 충분"으로 간주되는 최소 텍스트 길이 */
export const MIN_FULL_LEN = 600;

/** readability 추출 결과가 "충분"으로 간주되는 최소 텍스트 길이 */
export const MIN_EXTRACT_LEN = 400;

/** 외부 요청 식별용 User-Agent (정식 수집임을 밝힘) */
export const USER_AGENT = 'DevGist/0.1 (+personal RSS reader; https://github.com/sikkzz/DevGist)';

/** 피드/원문 fetch 타임아웃 (ms) */
export const FETCH_TIMEOUT_MS = 15_000;

/**
 * 폴링 1회당 피드별로 처리하는 최대 아이템 수 (최신순 상위 N).
 * 전체 아카이브 백필을 막아 함수 실행시간을 유계로 유지한다.
 * 피드는 최신순이고 dedup이 있어, 새 글은 항상 상위에 들어와 누락되지 않는다.
 */
export const MAX_ITEMS_PER_POLL = 30;

/** 본문 추출(fetch+추출) 동시 실행 수 (피드 내 아이템 기준) */
export const EXTRACT_CONCURRENCY = 5;

/** 피드 폴링 동시 실행 수 (여러 피드를 병렬 처리 — Vercel 함수 시간 한도 대응) */
export const FEED_CONCURRENCY = 8;

/**
 * Postgres text 컬럼이 거부하는 NUL(0x00) 등 C0 제어문자 제거 (탭/개행/CR은 보존).
 * 일부 피드/추출 HTML에 섞여 있어 INSERT가 통째로 실패하는 걸 막는다.
 */
export function cleanText(value: string | null | undefined): string | null {
  if (value == null) return null;
  let out = '';
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    // C0 제어문자(0–31) 제거, 단 탭(9)·LF(10)·CR(13)은 보존
    if (code > 31 || code === 9 || code === 10 || code === 13) out += ch;
  }
  return out;
}

/** 보이는 텍스트 길이만 센다 (태그/공백 제거). */
export function visibleTextLength(html: string | null | undefined): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}
