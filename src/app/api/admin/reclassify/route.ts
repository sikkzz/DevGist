import { NextResponse } from 'next/server';

import { classifyTopics } from '@/lib/feeds/classify';
import { mapPool } from '@/lib/feeds/concurrency';
import { getProfile, scorePersonal } from '@/lib/feeds/personalize';
import { prisma } from '@/lib/prisma';

// 전체 글 재분류 + 개인화 재계산 (백필 / 사전·프로필 변경 후 갱신). Bearer CRON_SECRET 보호.
// 기존 글은 피드 <category>가 저장돼 있지 않아 제목+요약 기준으로 처리한다 (ADR-0008/0009).
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
  const profile = await getProfile();

  let updated = 0;
  await mapPool(articles, 10, async (a) => {
    const topics = classifyTopics({ title: a.title, summary: a.summary });
    const personal = scorePersonal(`${a.title} ${a.summary ?? ''}`, profile);
    await prisma.article.update({
      where: { id: a.id },
      data: { topics, personalScore: personal.score, personalTags: personal.tags },
    });
    updated += 1;
  });

  return NextResponse.json({ total: articles.length, updated });
}

export const POST = handle;
