'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';

// NOTE: 현재 무인증(개인/단일 사용자 전제). 공개 배포 시 인증 게이트 필수 (제약 3).

/** 글을 읽음으로 표시 (상세 진입 시 자동 호출). Read.articleId가 @unique → upsert. */
export async function markArticleRead(articleId: string): Promise<void> {
  const now = new Date();
  await prisma.read.upsert({
    where: { articleId },
    create: { articleId, isRead: true, readAt: now },
    update: { isRead: true, readAt: now },
  });
  // 목록의 dimmed 상태 반영 (클라이언트 라우터 캐시 갱신)
  revalidatePath('/');
}

/** 북마크 토글. 변경 후 상태를 반환 (낙관적 UI 동기화용). */
export async function toggleBookmark(articleId: string): Promise<boolean> {
  const existing = await prisma.read.findUnique({
    where: { articleId },
    select: { bookmarked: true },
  });
  const next = !existing?.bookmarked;
  await prisma.read.upsert({
    where: { articleId },
    create: { articleId, bookmarked: next },
    update: { bookmarked: next },
  });
  revalidatePath('/');
  revalidatePath(`/article/${articleId}`);
  return next;
}
