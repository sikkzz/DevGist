import { NextResponse } from 'next/server';

import { classifyTopics } from '@/lib/feeds/classify';
import { mapPool } from '@/lib/feeds/concurrency';
import { prisma } from '@/lib/prisma';

// 전체 글 주제 재분류 (백필 / 키워드 사전 개선 후 갱신). Bearer CRON_SECRET 보호.
// 기존 글은 피드 <category>가 저장돼 있지 않아 제목+요약 기준으로 분류한다 (ADR-0008).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && request.headers.get('authorization') === `Bearer ${secret}`;
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const articles = await prisma.article.findMany({
    select: { id: true, title: true, summary: true },
  });

  let updated = 0;
  await mapPool(articles, 10, async (a) => {
    const topics = classifyTopics({ title: a.title, summary: a.summary });
    await prisma.article.update({ where: { id: a.id }, data: { topics } });
    updated += 1;
  });

  return NextResponse.json({ total: articles.length, updated });
}

export const POST = handle;
