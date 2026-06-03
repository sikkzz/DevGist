import { NextResponse } from 'next/server';

import { pollAllFeeds } from '@/lib/feeds/poll';

// jsdom/readability·DB 어댑터는 Node 런타임 필요. cron이라 캐시 금지.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel Hobby 함수 상한(초). 피드가 늘면 분할 폴링 검토 (spec §10).
export const maxDuration = 60;

/** Authorization: Bearer <CRON_SECRET> 검증 (ADR-0006) */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // 시크릿 미설정이면 전부 차단
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const summary = await pollAllFeeds();
  return NextResponse.json(summary);
}

export const GET = handle;
export const POST = handle;
