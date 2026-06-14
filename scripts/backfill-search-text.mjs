// 기존 글의 searchText(검색 색인용 평문)를 content에서 채우는 일회성 백필 (ADR-0011).
// 실행: export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH" && node scripts/backfill-search-text.mjs
// searchText가 NULL인 글만 대상. 재실행 안전(이미 채운 건 건너뜀).

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const MAX_SEARCH_TEXT = 12_000;

// src/lib/feeds/plain-text.ts 의 htmlToSearchText 와 동일 로직(스크립트라 JS로 중복).
function decodeEntities(s) {
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
    .replace(/&amp;/gi, '&');
}
function htmlToSearchText(html) {
  if (!html) return '';
  return decodeEntities(html)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SEARCH_TEXT);
}

const sql = neon(process.env.DATABASE_URL);

// 본문(content)이 커서 전체를 한 번에 가져오면 neon HTTP 응답 64MB 한도를 넘는다.
// → 배치로 쪼개서 가져오고, 채운 건 WHERE searchText IS NULL 에서 빠져 자연히 진행된다.
const BATCH = 30;
let done = 0;
for (;;) {
  const rows =
    await sql`SELECT id, content FROM articles WHERE "searchText" IS NULL LIMIT ${BATCH}`;
  if (rows.length === 0) break;
  for (const row of rows) {
    const text = htmlToSearchText(row.content);
    await sql`UPDATE articles SET "searchText" = ${text} WHERE id = ${row.id}`;
  }
  done += rows.length;
  console.log(`  ${done} 처리…`);
}

console.log(`백필 완료: ${done}건`);
