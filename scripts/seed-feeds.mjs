// 임시 피드 시드 스크립트 (피드 관리 UI 전까지 사용)
// 실행: export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH" && node scripts/seed-feeds.mjs
// 본인 취향 피드로 자유롭게 수정. url 기준 ON CONFLICT DO NOTHING (재실행 안전).

import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { neon } from '@neondatabase/serverless';

const FEEDS = [
  {
    title: 'Cloudflare Blog',
    url: 'https://blog.cloudflare.com/rss/',
    siteUrl: 'https://blog.cloudflare.com',
    category: 'infra',
  },
  {
    title: 'overreacted (Dan Abramov)',
    url: 'https://overreacted.io/rss.xml',
    siteUrl: 'https://overreacted.io',
    category: 'frontend',
  },
  {
    title: 'Vercel Blog',
    url: 'https://vercel.com/atom',
    siteUrl: 'https://vercel.com/blog',
    category: 'frontend',
  },
];

const sql = neon(process.env.DATABASE_URL);

let inserted = 0;
for (const f of FEEDS) {
  const rows = await sql`
    INSERT INTO feeds (id, title, url, "siteUrl", category, active, "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${f.title}, ${f.url}, ${f.siteUrl}, ${f.category}, true, now(), now())
    ON CONFLICT (url) DO NOTHING
    RETURNING id`;
  if (rows.length > 0) inserted += 1;
  console.log(`${rows.length > 0 ? '+ added' : '= exists'}: ${f.title}`);
}
console.log(`\nseed 완료: ${inserted} added / ${FEEDS.length} total`);
